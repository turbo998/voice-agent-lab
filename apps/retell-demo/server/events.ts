import { QueueClient } from "@azure/storage-queue";
import { azureCredential } from "../../../integrations/azure/credential.js";
import { z } from "zod";
import type { StateStore } from "../../../packages/business-core/state.js";
import { LabError } from "../../../packages/business-core/contracts.js";
import { claimCallbackCall } from "../../../integrations/retell/callback.js";

const analysis = z.object({
  custom_analysis_data: z.object({
    intent: z.enum(["presales", "order", "diagnosis", "followup", "unknown"]).optional(),
    outcome: z.enum(["answered", "draft_pending", "ticket_committed", "planned_not_dialed", "failed", "unknown"]).optional(),
    escalation_required: z.boolean().optional(), followup_requested: z.boolean().optional(),
  }).strip().optional(),
  call_successful: z.boolean().optional(),
  user_sentiment: z.string().max(100).optional(),
}).strip();
export const eventSchema = z.object({
  event: z.enum(["call_started", "call_ended", "call_analyzed"]),
  call: z.object({
    call_id: z.string().regex(/^[\w-]{5,120}$/), call_type: z.literal("web_call"), agent_id: z.string(),
    metadata: z.object({ lab_session_id: z.string().optional(), lab_creation_id: z.string().optional() }).strip().optional(),
    call_analysis: analysis.optional(),
  }).strip(),
}).strip();
const rank = { created: 0, started: 1, ended: 2, analyzed: 3 };
export class EventInbox {
  private queue?: QueueClient;
  constructor(private store: StateStore, queueEndpoint?: string) {
    if (queueEndpoint) this.queue = new QueueClient(`${queueEndpoint.replace(/\/$/, "")}/postcall`, azureCredential());
  }
  async accept(input: unknown, allowedAgent: string | undefined) {
    const body = eventSchema.safeParse(input);
    if (!body.success) throw new LabError("EVENT_INVALID", 400, "Invalid browser-call event.");
    const { event, call } = body.data;
    const id = `${event}:${call.call_id}`;
    await this.store.update(state => {
      claimCallbackCall(state, call, allowedAgent);
      if (!state.events[id]) state.events[id] = { id, event, callId: call.call_id, status: "pending",
        attempts: 0, acceptedAt: Date.now(), analysis: call.call_analysis };
    });
    if (this.queue) {
      try { await this.queue.sendMessage(Buffer.from(JSON.stringify({ id })).toString("base64")); }
      catch { throw new LabError("QUEUE_UNAVAILABLE", 503, "Event durably stored but queue notification failed; retry is safe."); }
    }
    return id;
  }
  async process(id: string) {
    await this.store.update(state => {
      const event = state.events[id];
      if (!event || event.status === "done" || event.status === "poison") return;
      event.attempts++;
      const call = state.calls[event.callId];
      if (!call) {
        event.lastError = "CALL_NOT_FOUND";
        if (event.attempts >= 3) event.status = "poison";
        return;
      }
      const next = event.event === "call_started" ? "started" : event.event === "call_ended" ? "ended" : "analyzed";
      if (rank[next] > rank[call.status]) call.status = next;
      if (event.analysis) call.analysis = event.analysis;
      if (rank[next] >= rank.ended) {
        const reservation = state.reservations[call.reservationId];
        if (reservation) reservation.status = "ended";
      }
      event.status = "done";
    });
  }
  async drain() {
    const pending = Object.values((await this.store.read()).events).filter(e => e.status === "pending");
    for (const event of pending.slice(0, 100)) await this.process(event.id);
    if (this.queue) {
      const messages = await this.queue.receiveMessages({ numberOfMessages: 16, visibilityTimeout: 60 });
      for (const message of messages.receivedMessageItems) {
        try {
          const parsed = z.object({ id: z.string() }).parse(JSON.parse(Buffer.from(message.messageText, "base64").toString()));
          await this.process(parsed.id);
          await this.queue.deleteMessage(message.messageId, message.popReceipt);
        } catch {
          if (message.dequeueCount >= 3) {
            const poison = new QueueClient(this.queue.url.replace(/\/postcall$/, "/postcall-poison"), azureCredential());
            await poison.sendMessage(Buffer.from(JSON.stringify({ reason: "INVALID_OR_FAILED_EVENT" })).toString("base64"));
            await this.queue.deleteMessage(message.messageId, message.popReceipt);
          }
          console.error(JSON.stringify({ event: "worker_retry", code: "EVENT_PROCESSING_FAILED" }));
        }
      }
    }
    return pending.length;
  }
}
