import { z } from "zod";
import type { LabState } from "./state.js";

const text = z.string().min(1).max(200), time = z.number().finite().nonnegative();
const records = <T extends z.ZodType>(value: T) => z.record(text, value).refine(v => Object.keys(v).length <= 2000, "State collection limit exceeded");
export const stateSchema = z.object({
  schema: z.literal(1), revision: z.number().int().nonnegative(), paused: z.boolean(),
  sessions: records(z.object({ id: text, owner: text, customerId: text, createdAt: time, grantHash: text, grantExpiresAt: time })),
  drafts: records(z.object({ id: text, sessionId: text, version: z.number().int().positive(), productId: text,
    summary: z.string().max(800), priority: z.enum(["normal", "safety"]), status: z.enum(["pending", "approved", "revoked", "committed"]),
    approvedBy: text.optional(), approvedAt: time.optional(), ticketId: text.optional() })),
  tickets: records(z.object({ id: text, draftId: text, sessionId: text, summary: z.string().max(800), createdAt: time })),
  consents: records(z.object({ id: text, sessionId: text, scope: z.literal("synthetic_followup_plan"),
    evidence: z.string().max(500), capturedBy: text, capturedAt: time, withdrawnAt: time.optional() })),
  followups: records(z.object({ id: text, sessionId: text, consentId: text, window: text, status: z.enum(["planned_not_dialed", "cancelled"]) })),
  reservations: records(z.object({ id: text, bucket: z.enum(["retell", "retell_text", "live", "model"]), period: text,
    cents: z.number().int().positive(), minutes: z.number().min(0).max(120), sessionId: text, status: z.enum(["reserved", "active", "ended", "uncertain", "rejected"]),
    createdAt: time, callId: text.optional(), agentId: text.optional() })),
  calls: records(z.object({ id: text, sessionId: text, owner: text, agentId: text, reservationId: text,
    status: z.enum(["created", "started", "ended", "analyzed"]), createdAt: time, analysis: z.record(z.string(), z.unknown()).optional(),
    aiStopped: z.boolean(), takeover: z.enum(["requested", "confirmed", "uncertain"]).optional(),
    accessHashes: z.array(text).max(10), participants: z.array(text).max(10), signalingSessions: z.array(text).max(20) })),
  events: records(z.object({ id: text, callId: text, event: z.enum(["call_started", "call_ended", "call_analyzed"]),
    status: z.enum(["pending", "done", "poison"]), attempts: z.number().int().nonnegative(), acceptedAt: time,
    analysis: z.record(z.string(), z.unknown()).optional(), lastError: text.optional() })),
  liveCalls: records(z.object({ id: text, sessionId: text, owner: text, reservationId: text, createdAt: time, deadline: time,
    providerExpiresAt: time.optional(), status: z.enum(["active", "closing", "ended", "uncertain"]), usageSeconds: time.optional() })).default({}),
  liveSettings: z.object({ version: z.literal(1), voiceBaseUrl: z.string().url().max(500), voiceModel: text,
    reasoningBaseUrl: z.string().url().max(500), reasoningModel: text,
    preferences: z.object({ voice: text, language: text, instructions: z.string().max(1500), timeZone: text, city: z.string().max(100),
      webSearch: z.literal(false), maxOutputTokens: z.number().int().min(256).max(512), reasoningEffort: z.literal("low"),
      sessionMinutes: z.number().int().min(1).max(3) }) }).optional(),
  auth: records(z.object({ owner: text, csrf: text, expiresAt: time })),
  loginAttempts: records(z.object({ count: z.number().int().nonnegative(), resetsAt: time })),
}).strict() satisfies z.ZodType<LabState>;

export function pruneState(state: LabState, now = Date.now()) {
  const age = now - 7 * 86400000;
  const running = new Set(Object.values(state.reservations).filter(r => ["reserved", "active", "uncertain"].includes(r.status)).map(r => r.sessionId));
  for (const [id, session] of Object.entries(state.sessions)) if (session.createdAt < age && !running.has(id)) delete state.sessions[id];
  for (const collection of [state.drafts, state.tickets, state.consents, state.followups, state.calls, state.liveCalls]) {
    for (const [id, value] of Object.entries(collection)) if (!state.sessions[value.sessionId]) delete collection[id];
  }
  for (const [id, event] of Object.entries(state.events)) if (!state.calls[event.callId] && event.acceptedAt < age) delete state.events[id];
  for (const [id, auth] of Object.entries(state.auth)) if (auth.expiresAt < now) delete state.auth[id];
  for (const [id, attempt] of Object.entries(state.loginAttempts)) if (attempt.resetsAt < now) delete state.loginAttempts[id];
  // Trial ledger survives content retention; deleting it would replenish trial limits.
  for (const [id, reservation] of Object.entries(state.reservations)) {
    if (reservation.period !== "trial" && reservation.createdAt < now - 90 * 86400000 && !["reserved", "active", "uncertain"].includes(reservation.status)) delete state.reservations[id];
  }
}
