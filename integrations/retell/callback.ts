import type { LabState } from "../../packages/business-core/state.js";
import { LabError } from "../../packages/business-core/contracts.js";

export interface CallbackCall {
  call_id: string; agent_id: string;
  metadata?: { lab_session_id?: string; lab_creation_id?: string };
}
export function claimCallbackCall(state: LabState, call: CallbackCall, allowedAgent: string | undefined) {
  if (!allowedAgent || call.agent_id !== allowedAgent) throw new LabError("EVENT_UNAUTHORIZED", 403, "Callback agent is not authorized.");
  const existing = state.calls[call.call_id];
  if (existing) {
    if (existing.agentId !== allowedAgent) throw new LabError("EVENT_UNAUTHORIZED", 403, "Callback call is outside this lab.");
    return existing;
  }
  const reservation = state.reservations[call.metadata?.lab_creation_id ?? ""];
  const session = state.sessions[call.metadata?.lab_session_id ?? ""];
  if (!reservation || !session || reservation.sessionId !== session.id || reservation.bucket !== "retell" ||
      reservation.agentId !== allowedAgent || reservation.callId || !["reserved", "uncertain"].includes(reservation.status)) {
    throw new LabError("EVENT_UNAUTHORIZED", 403, "Callback has no durable server-created correlation.");
  }
  const owned = { id: call.call_id, sessionId: session.id, owner: session.owner, agentId: allowedAgent,
    reservationId: reservation.id, status: "created" as const, createdAt: reservation.createdAt, aiStopped: false,
    accessHashes: [], participants: [], signalingSessions: [] };
  state.calls[owned.id] = owned; reservation.callId = owned.id; reservation.status = "active";
  return owned;
}
