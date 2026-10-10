import type { IncomingMessage, ServerResponse, Server } from "node:http";
export interface LiveConfig {
  voice: string; language: string; instructions: string; city: string; timeZone: string;
  webSearch: boolean; maxOutputTokens: number; sessionMinutes: number; reasoningEffort: string;
  backendReady: boolean; backendModel: string; backendProvider: string;
}
export interface CloudContext { sessionId: string; owner: string; reservationId: string; deadline: number; expiresAt: number; providerValid?: boolean }
export interface StoredSettings {
  version: 1;
  voice: { provider: string; baseUrl: string; model: string; apiKey: string };
  backend: { enabled: boolean; mode: string; baseUrl: string; model: string; auth: string; apiKey: string };
  preferences: Omit<LiveConfig, "backendReady" | "backendModel" | "backendProvider">;
}
export interface BackendRequest {
  context: CloudContext; callId: string; config: LiveConfig; history: { role: string; text: string }[];
  signal: AbortSignal; onStatus(status: string): void;
  onTool(event: { name: string; status: string; summary: string }): void;
  onSources(rows: { url: string; title: string }[]): void;
  onUsage(usage: { input_tokens: number; output_tokens: number }): void;
}
export interface CloudRuntime {
  settingsStore: { dataDir: string; get(): StoredSettings; configured(): boolean };
  auth: {
    initialToken?: string; authorized(req: IncomingMessage): Promise<boolean>; needsSetupToken(): boolean;
    login(req: IncomingMessage, res: ServerResponse, input: unknown): Promise<{ csrf: string }>;
    logout(req: IncomingMessage, res: ServerResponse): Promise<void>;
  };
  authorizeRequest(req: IncomingMessage): Promise<void>;
  authorizeSession(req: IncomingMessage, id: string): Promise<void>;
  publicConfig(req: IncomingMessage): Promise<object>; validateConfig(config: LiveConfig): LiveConfig;
  voiceHeaders(): Promise<Record<string, string>>; liveInstructions(config: LiveConfig): string;
  beforeCreate(req: IncomingMessage, config: LiveConfig): Promise<CloudContext>;
  recoverableSessions?(): Promise<{ id: string; context: CloudContext }[]>;
  onCreated(context: CloudContext, id: string, expiresAt: unknown): Promise<void>;
  onCreateFailed(context: CloudContext, id: string | undefined, attempted: boolean): Promise<void>;
  onClosing(context: CloudContext, id: string): Promise<void>;
  onClosed(context: CloudContext, id: string, confirmed: boolean, seconds: number): Promise<void>;
  canContinue(context: CloudContext): Promise<boolean>;
  runBackend(request: BackendRequest): Promise<string>;
}
export function startServer(options?: {
  port?: number; host?: string; mode?: "local" | "remote"; publicOrigin?: string; dataDir?: string;
  quiet?: boolean; cloud?: CloudRuntime;
}): Promise<{ url: string; port: number; dataDir: string; close(): Promise<void>; server: Server }>;
