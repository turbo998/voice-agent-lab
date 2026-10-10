export interface Session {
  id: string; owner: string; customerId: string; createdAt: number;
  grantHash: string; grantExpiresAt: number;
}
export interface Draft {
  id: string; sessionId: string; version: number; productId: string;
  summary: string; priority: "normal" | "safety";
  status: "pending" | "approved" | "revoked" | "committed";
  approvedBy?: string; approvedAt?: number; ticketId?: string;
}
export interface Consent {
  id: string; sessionId: string; scope: "synthetic_followup_plan";
  evidence: string; capturedBy: string; capturedAt: number; withdrawnAt?: number;
}
export interface Reservation {
  id: string; bucket: "retell" | "live" | "model" | "retell_text";
  period: string; cents: number; minutes: number; sessionId: string;
  status: "reserved" | "active" | "ended" | "uncertain" | "rejected";
  createdAt: number; callId?: string; agentId?: string;
}
export interface Call {
  id: string; sessionId: string; owner: string; agentId: string;
  reservationId: string; status: "created" | "started" | "ended" | "analyzed";
  createdAt: number; analysis?: Record<string, unknown>; aiStopped: boolean;
  accessHashes: string[]; participants: string[]; signalingSessions: string[];
  takeover?: "requested" | "confirmed" | "uncertain";
}
export interface InboxEvent {
  id: string; callId: string; event: "call_started" | "call_ended" | "call_analyzed";
  status: "pending" | "done" | "poison"; attempts: number;
  acceptedAt: number; analysis?: Record<string, unknown>; lastError?: string;
}
export interface LiveCall {
  id: string; sessionId: string; owner: string; reservationId: string;
  createdAt: number; deadline: number; providerExpiresAt?: number;
  status: "active" | "closing" | "ended" | "uncertain";
  usageSeconds?: number;
}
export interface LiveSettings {
  version: 1; voiceBaseUrl: string; voiceModel: string; reasoningBaseUrl: string; reasoningModel: string;
  preferences: { voice: string; language: string; instructions: string; timeZone: string; city: string;
    webSearch: boolean; maxOutputTokens: number; reasoningEffort: string; sessionMinutes: number };
}
export interface LabState {
  schema: 1; revision: number; paused: boolean;
  sessions: Record<string, Session>; drafts: Record<string, Draft>;
  tickets: Record<string, { id: string; draftId: string; sessionId: string; summary: string; createdAt: number }>;
  consents: Record<string, Consent>;
  followups: Record<string, { id: string; sessionId: string; consentId: string; window: string; status: "planned_not_dialed" | "cancelled" }>;
  reservations: Record<string, Reservation>; calls: Record<string, Call>;
  events: Record<string, InboxEvent>;
  liveCalls: Record<string, LiveCall>; liveSettings?: LiveSettings;
  auth: Record<string, { owner: string; csrf: string; expiresAt: number }>;
  loginAttempts: Record<string, { count: number; resetsAt: number }>;
}
export const initialState = (): LabState => ({
  schema: 1, revision: 0, paused: false, sessions: {}, drafts: {}, tickets: {},
  consents: {}, followups: {}, reservations: {}, calls: {}, events: {},
  auth: {}, loginAttempts: {}, liveCalls: {},
});
export interface StateStore {
  read(): Promise<LabState>;
  update<T>(mutate: (state: LabState) => T): Promise<T>;
}
