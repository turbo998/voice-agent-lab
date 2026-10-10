import { randomUUID } from "node:crypto";
import { customers, knowledge, orders, products } from "../../../packages/business-core/fixtures.js";
import { LabError, diagnosisSchema, toolSchemas, type Diagnosis, type ToolName } from "../../../packages/business-core/contracts.js";
import type { LabState, Session, StateStore } from "../../../packages/business-core/state.js";
import { hash, token } from "./security.js";

export interface Diagnoser { diagnose(productId: string, symptom: string, sessionId: string): Promise<Diagnosis> }
export interface ToolAuthorization { provider: "retell" | "live"; callId: string; expiresAt?: number }
function assertToolCall(state: LabState, sessionId: string, authorization?: ToolAuthorization) {
  if (!authorization) return;
  const call = authorization.provider === "retell" ? state.calls[authorization.callId] : state.liveCalls[authorization.callId];
  if (!call || call.sessionId !== sessionId || ("aiStopped" in call && call.aiStopped) ||
      !["created", "started", "active"].includes(call.status) ||
      (authorization.expiresAt !== undefined && authorization.expiresAt <= Date.now())) {
    throw new LabError("TOOL_CALL_REJECTED", 403, "Tool execution requires an active, authorized call.");
  }
}
export function sessionIn(state: LabState, id: string, owner?: string): Session {
  const session = state.sessions[id];
  if (!session || (owner && session.owner !== owner)) throw new LabError("SESSION_NOT_FOUND", 404, "Session not found.");
  return session;
}
export function localDiagnosis(productId: string, symptom: string): Diagnosis {
  if (/\b(smok\w*|sparks?|burn\w*|overheat\w*|electric shock|live wir\w*)\b/i.test(symptom)) {
    return diagnosisSchema.parse({
      spoken_summary: "Stop using the device. Disconnect power only if safe. Do not open it or touch live wiring. A qualified person should review this safety concern.",
      recommended_steps: ["Stop using the device.", "Disconnect power only if safe; do not attempt a repair.", "Ask the operator to review a safety support ticket."],
      source_refs: ["K05", "K12"], needs_human: true, uncertainty_reason: "Safety concern requires a qualified person.", mode: "deterministic_local",
    });
  }
  const wifi = /\b(wi-?fi|pair\w*|5\s*ghz|connect\w*|network)\b/i.test(symptom);
  if (wifi && ["cam-air", "plug-mini"].includes(productId)) {
    return diagnosisSchema.parse({
      spoken_summary: "This demo product needs a 2.4 GHz home Wi-Fi network. Check the SSID, password, and local-network permission, then retry once. Do not disable network security.",
      recommended_steps: ["Confirm a 2.4 GHz SSID rather than a 5 GHz-only network.", "Check the password and local-network permission.", "Retry once; request operator review if it still fails."],
      source_refs: productId === "cam-air" ? ["K01", "K02"] : ["K06", "K12"],
      needs_human: false, uncertainty_reason: null, mode: "deterministic_local",
    });
  }
  if (productId === "clean-orbit" && /charg|dock/i.test(symptom)) {
    return diagnosisSchema.parse({
      spoken_summary: "Use the matching certified dock. With power disconnected and no damage or heat, wipe only the external contacts with a dry cloth. Do not open the battery or dock; persistent failure needs operator review.",
      recommended_steps: ["Confirm the matching certified dock.", "If safe and disconnected, wipe only external contacts with a dry cloth.", "Escalate persistent charging failure."],
      source_refs: ["K08", "K12"], needs_human: true, uncertainty_reason: "Persistent charging failure cannot be diagnosed remotely.", mode: "deterministic_local",
    });
  }
  return diagnosisSchema.parse({
    spoken_summary: "The synthetic knowledge base does not support a reliable diagnosis for that symptom. I can prepare a support ticket for operator review.",
    recommended_steps: ["Do not attempt an unsupported repair.", "Request operator review."],
    source_refs: ["K12"], needs_human: true, uncertainty_reason: "No sufficiently specific source.", mode: "deterministic_local",
  });
}

export class Business {
  constructor(public store: StateStore, private diagnoser?: Diagnoser) {}
  async createSession(owner: string, customerId: string) {
    if (!customers.some(c => c.id === customerId)) throw new LabError("CUSTOMER_NOT_FOUND", 404, "Synthetic customer not found.");
    const grant = token();
    const session: Session = { id: randomUUID(), owner, customerId, createdAt: Date.now(), grantHash: hash(grant), grantExpiresAt: Date.now() + 15 * 60000 };
    await this.store.update(state => { state.sessions[session.id] = session; });
    return { session, grant };
  }
  async authorizeGrant(sessionId: string, grant: string) {
    const session = sessionIn(await this.store.read(), sessionId);
    if (session.grantHash !== hash(grant) || session.grantExpiresAt < Date.now()) {
      throw new LabError("GRANT_REJECTED", 403, "Tool grant expired or invalid.");
    }
    return session;
  }
  async execute(name: ToolName, input: unknown, sessionId: string, owner?: string, authorization?: ToolAuthorization) {
    const state = await this.store.read();
    const session = sessionIn(state, sessionId, owner);
    assertToolCall(state, sessionId, authorization);
    const parsed = toolSchemas[name].safeParse(input);
    if (!parsed.success) throw new LabError("TOOL_INPUT_INVALID", 400, "Tool arguments do not match the fixed schema.");
    switch (name) {
      case "get_product_catalog": {
        const args = toolSchemas.get_product_catalog.parse(input);
        return { synthetic: true, products: products.filter(p => !args.product_id || p.id === args.product_id) };
      }
      case "get_order_status": {
        const args = toolSchemas.get_order_status.parse(input);
        const order = orders.find(o => o.id === args.order_id && o.customerId === session.customerId);
        if (!order) throw new LabError("ORDER_NOT_FOUND", 404, "Order not found in this customer's scope.");
        return { synthetic: true, order };
      }
      case "diagnose_device": {
        const args = toolSchemas.diagnose_device.parse(input);
        const safety = localDiagnosis(args.product_id, args.symptom);
        if (safety.source_refs.includes("K05") || !this.diagnoser) return safety;
        return this.diagnoser.diagnose(args.product_id, args.symptom, sessionId);
      }
      case "draft_support_ticket": {
        const args = toolSchemas.draft_support_ticket.parse(input);
        return this.store.update(state => {
          assertToolCall(state, sessionId, authorization);
          const existing = Object.values(state.drafts).find(d => d.sessionId === sessionId && d.productId === args.product_id &&
            d.summary === args.summary && d.priority === args.priority && d.status !== "revoked");
          if (existing) return existing;
          const draft = { id: randomUUID(), sessionId, version: 1, productId: args.product_id,
            summary: args.summary, priority: args.priority, status: "pending" as const };
          state.drafts[draft.id] = draft;
          return draft;
        });
      }
      case "commit_approved_ticket": {
        const args = toolSchemas.commit_approved_ticket.parse(input);
        return this.store.update(state => {
          assertToolCall(state, sessionId, authorization);
          const draft = state.drafts[args.draft_id];
          if (!draft || draft.sessionId !== sessionId) throw new LabError("DRAFT_NOT_FOUND", 404, "Draft not found.");
          if (draft.version !== args.version) throw new LabError("VERSION_CONFLICT", 409, "Draft version changed; operator review required.");
          if (draft.status === "committed" && draft.ticketId) return state.tickets[draft.ticketId];
          if (draft.status !== "approved" || !draft.approvedBy) throw new LabError("APPROVAL_REQUIRED", 403, "Operator approval is required; the AI cannot approve.");
          const ticket = { id: randomUUID(), draftId: draft.id, sessionId, summary: draft.summary, createdAt: Date.now() };
          state.tickets[ticket.id] = ticket; draft.status = "committed"; draft.ticketId = ticket.id;
          return ticket;
        });
      }
      case "schedule_consented_followup": {
        const args = toolSchemas.schedule_consented_followup.parse(input);
        return this.store.update(state => {
          assertToolCall(state, sessionId, authorization);
          const consent = state.consents[args.consent_id];
          if (!consent || consent.sessionId !== sessionId || consent.withdrawnAt) throw new LabError("CONSENT_REQUIRED", 403, "Verified, current operator-recorded consent required.");
          const when = Date.parse(args.window);
          if (when <= Date.now() || when > Date.now() + 30 * 86400000) throw new LabError("WINDOW_INVALID", 400, "Choose a future time within 30 days.");
          const existing = Object.values(state.followups).find(f => f.consentId === consent.id && f.status !== "cancelled");
          if (existing) {
            if (existing.window !== args.window) throw new LabError("PLAN_CONFLICT", 409, "Withdraw consent before changing the approved plan.");
            return existing;
          }
          const plan = { id: randomUUID(), sessionId, consentId: consent.id, window: args.window, status: "planned_not_dialed" as const };
          state.followups[plan.id] = plan; return plan;
        });
      }
    }
  }
  async approve(draftId: string, version: number, owner: string, revoke = false) {
    return this.store.update(state => {
      const draft = state.drafts[draftId];
      if (!draft) throw new LabError("DRAFT_NOT_FOUND", 404, "Draft not found.");
      sessionIn(state, draft.sessionId, owner);
      if (draft.version !== version || draft.status === "committed") throw new LabError("VERSION_CONFLICT", 409, "Draft changed or already committed.");
      draft.status = revoke ? "revoked" : "approved"; draft.approvedBy = revoke ? undefined : owner;
      draft.approvedAt = revoke ? undefined : Date.now();
      return draft;
    });
  }
  async recordConsent(sessionId: string, owner: string, evidence: string) {
    return this.store.update(state => {
      sessionIn(state, sessionId, owner);
      const consent = { id: randomUUID(), sessionId, scope: "synthetic_followup_plan" as const,
        evidence, capturedBy: owner, capturedAt: Date.now() };
      state.consents[consent.id] = consent; return consent;
    });
  }
  async withdraw(consentId: string, owner: string) {
    return this.store.update(state => {
      const consent = state.consents[consentId];
      if (!consent) throw new LabError("CONSENT_NOT_FOUND", 404, "Consent not found.");
      sessionIn(state, consent.sessionId, owner); consent.withdrawnAt = Date.now();
      for (const plan of Object.values(state.followups)) if (plan.consentId === consentId) plan.status = "cancelled";
      return consent;
    });
  }
}
export const sourceExists = (id: string) => knowledge.some(k => k.id === id);
