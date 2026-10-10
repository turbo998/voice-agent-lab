import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Config } from "../../apps/retell-demo/server/config.js";
import { retellReady } from "../../apps/retell-demo/server/config.js";
import { sessionIn } from "../../apps/retell-demo/server/business.js";
import { reserve, settle } from "../../apps/retell-demo/server/budget.js";
import { hash } from "../../apps/retell-demo/server/security.js";
import { LabError } from "../../packages/business-core/contracts.js";
import type { StateStore } from "../../packages/business-core/state.js";

const responseSchema = z.object({
  call_id: z.string().regex(/^[\w-]{5,120}$/),
  access_token: z.string().min(10),
  transport: z.enum(["livekit", "gateway"]).optional(),
  url: z.string().url().optional(),
  ice_servers: z.array(z.object({
    urls: z.union([z.string(), z.array(z.string())]), username: z.string().optional(),
    credential: z.string().optional(),
  })).optional(), expires_at: z.number().optional(),
});
export class RetellGateway {
  constructor(private config: Config, private store: StateStore, private transport: typeof fetch = fetch) {}
  async request(path: string, method: string, body?: unknown) {
    if (!this.config.RETELL_API_KEY) throw new LabError("RETELL_NOT_CONFIGURED", 503, "Retell server credential not configured.");
    const response = await this.transport(`https://api.retellai.com${path}`, {
      method, headers: { Authorization: `Bearer ${this.config.RETELL_API_KEY}`,
        "Content-Type": "application/json", "X-Retell-Client-JS-SDK-Version": "3.0.2" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000), redirect: "error",
    });
    if (!response.ok) throw new LabError("RETELL_REQUEST_REJECTED", response.status, `Retell returned HTTP ${response.status}.`);
    const text = await response.text();
    return text ? JSON.parse(text) as unknown : undefined;
  }
  async create(sessionId: string, owner: string) {
    if (!retellReady(this.config)) {
      throw new LabError("REMOTE_CALLS_DISABLED", 503, "Live calls disabled until credentials, published version, signature and rate gates are verified.");
    }
    sessionIn(await this.store.read(), sessionId, owner);
    const cost = Math.ceil(this.config.RETELL_RATE_CENTS_PER_MINUTE! * 3 * 1.2);
    const reservation = await reserve(this.store, "retell", sessionId, cost, 3);
    try {
      const toolGrant = randomUUID() + randomUUID();
      await this.store.update(state => {
        const session = sessionIn(state, sessionId, owner);
        const unspentLocal = Object.values(state.reservations).filter(r => ["retell", "retell_text"].includes(r.bucket) && r.status !== "rejected").reduce((total, r) => total + r.cents, 0);
        if (unspentLocal + 300 > this.config.RETELL_TRIAL_BALANCE_CENTS!) throw new LabError("TRIAL_RESERVE_REQUIRED", 402, "The protected trial remainder would be exceeded.");
        session.grantHash = hash(toolGrant); session.grantExpiresAt = Date.now() + 15 * 60000;
        state.reservations[reservation.id]!.agentId = this.config.RETELL_AGENT_ID!;
      });
      const raw = await this.request("/v3/create-web-call", "POST", {
        agent_id: this.config.RETELL_AGENT_ID, agent_version: this.config.RETELL_AGENT_VERSION,
        metadata: { lab_session_id: sessionId, lab_creation_id: reservation.id, synthetic: true },
        retell_llm_dynamic_variables: {
          lab_session_id: sessionId, lab_tool_grant: toolGrant,
          customer_id: sessionIn(await this.store.read(), sessionId).customerId, company_name: "LumaNest",
        },
      });
      const response = responseSchema.parse(raw);
      await this.store.update(state => {
        const existing = state.calls[response.call_id];
        if (existing && existing.reservationId !== reservation.id) throw new LabError("CALL_CORRELATION_REJECTED", 502, "Provider returned a conflicting call identity.");
        state.calls[response.call_id] = existing ?? {
          id: response.call_id, sessionId, owner, agentId: this.config.RETELL_AGENT_ID!,
          reservationId: reservation.id, status: "created", createdAt: Date.now(), aiStopped: false,
          accessHashes: [], participants: [], signalingSessions: [],
        };
        state.calls[response.call_id]!.accessHashes.push(hash(response.access_token));
        const current = state.reservations[reservation.id]!;
        if (current.status !== "ended") current.status = "active";
        current.callId = response.call_id;
      });
      return response;
    } catch (error) {
      await settle(this.store, reservation.id, error instanceof LabError && error.status < 500 ? "rejected" : "uncertain");
      if (error instanceof LabError) throw error;
      throw new LabError("RETELL_CREATION_UNCERTAIN", 502, "Call creation outcome uncertain; reservation retained for reconciliation.");
    }
  }
  async owned(callId: string, owner: string) {
    const call = (await this.store.read()).calls[callId];
    if (!call || call.owner !== owner) throw new LabError("CALL_NOT_FOUND", 404, "Call not found in operator scope.");
    return call;
  }
  async listen(callId: string, owner: string) {
    const call = await this.owned(callId, owner);
    if (["ended", "analyzed"].includes(call.status) || call.participants.length >= 3) throw new LabError("LISTEN_NOT_AVAILABLE", 409, "Call ended or listener limit reached.");
    const result = z.object({ access_token: z.string().min(10), participant_id: z.string(),
      transport: z.enum(["livekit", "gateway"]).optional(), url: z.string().url().optional(),
      room_name: z.string(), expires_at: z.number(), ice_servers: responseSchema.shape.ice_servers }).parse(
        await this.request(`/v2/listen-live-call/${encodeURIComponent(callId)}`, "POST", {}));
    await this.store.update(state => {
      const call = state.calls[callId]!;
      call.accessHashes.push(hash(result.access_token)); call.participants.push(result.participant_id);
    });
    return result;
  }
  async takeOver(callId: string, participantId: string, owner: string) {
    const call = await this.owned(callId, owner);
    if (!call.participants.includes(participantId)) throw new LabError("PARTICIPANT_REJECTED", 403, "Authorized listener required.");
    if (call.aiStopped || call.takeover) throw new LabError("AI_ALREADY_STOPPED", 409, "Takeover already requested; do not resume AI after an uncertain result.");
    await this.store.update(state => { state.calls[callId]!.takeover = "requested"; state.calls[callId]!.aiStopped = true; });
    try {
      await this.request(`/v2/take-over-live-call/${encodeURIComponent(callId)}`, "POST", { participant_id: participantId });
      await this.store.update(state => { state.calls[callId]!.takeover = "confirmed"; });
    } catch {
      await this.store.update(state => { state.calls[callId]!.takeover = "uncertain"; });
      throw new LabError("TAKEOVER_UNCERTAIN", 502, "Takeover outcome uncertain; treat AI as stopped and reconcile or end this call.");
    }
  }
  async stop(callId: string, owner: string) {
    await this.owned(callId, owner);
    await this.request(`/v2/stop-call/${encodeURIComponent(callId)}`, "POST");
    await this.store.update(state => {
      state.calls[callId]!.status = "ended";
      state.reservations[state.calls[callId]!.reservationId]!.status = "ended";
    });
  }
  async injectApprovedTicket(callId: string, ticketId: string, owner: string) {
    const call = await this.owned(callId, owner);
    const state = await this.store.read(), ticket = state.tickets[ticketId];
    if (!ticket || ticket.sessionId !== call.sessionId) throw new LabError("TICKET_NOT_FOUND", 404, "Committed ticket not found for this call.");
    if (call.aiStopped || ["ended", "analyzed"].includes(call.status)) throw new LabError("AI_ALREADY_STOPPED", 409, "AI stopped or call ended; no result injection is permitted.");
    await this.request(`/v2/update-live-call/${encodeURIComponent(callId)}`, "PATCH", {
      call_control: { additional_context: `Verified business result: synthetic support ticket ${ticket.id} was approved by the operator and committed. No refund, shipment or outgoing contact occurred.`, trigger_response: true },
    });
  }
}
