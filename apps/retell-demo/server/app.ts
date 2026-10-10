import express, { type Request, type Response } from "express";
import { z } from "zod";
import { resolve } from "node:path";
import { createServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import { Business, sessionIn, type Diagnoser } from "./business.js";
import { authenticate, checkCsrf, hash, verifyRetellSignature } from "./security.js";
import { OperatorAuth } from "./operator.js";
import { budgetSummary } from "./budget.js";
import { EventInbox, eventSchema } from "./events.js";
import type { Config } from "./config.js";
import { retellReady } from "./config.js";
import type { StateStore } from "../../../packages/business-core/state.js";
import { LabError, customerId, toolName, toolSchemas } from "../../../packages/business-core/contracts.js";
import { customers, knowledge, products } from "../../../packages/business-core/fixtures.js";
import { RetellGateway } from "../../../integrations/retell/gateway.js";
import { claimCallbackCall } from "../../../integrations/retell/callback.js";
import { safeMonitorFrame } from "../../../integrations/retell/monitor.js";

const callIdSchema = z.string().regex(/^[\w-]{5,120}$/);
function raw(req: Request): Buffer { return Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0); }
function body(req: Request): unknown {
  try { return JSON.parse(raw(req).toString("utf8")); }
  catch { throw new LabError("JSON_INVALID", 400, "Request must contain valid JSON."); }
}
export function createApp(config: Config, store: StateStore, options: { diagnoser?: Diagnoser; retell?: RetellGateway } = {}) {
  const app = express(), server = createServer(app);
  const business = new Business(store, options.diagnoser);
  const retell = options.retell ?? new RetellGateway(config, store);
  const operator = new OperatorAuth(store, { origin: config.APP_ORIGIN, passwordHash: config.OPERATOR_PASSWORD_HASH, tokenSecret: config.TOKEN_SECRET });
  const inbox = new EventInbox(store, config.AZURE_STORAGE_QUEUE_ENDPOINT);
  const captions = new Map<string, "connecting" | "available" | "unavailable">();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set({
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(self)",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://*.retellai.com wss://*.retellai.com wss://*.livekit.cloud; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
    if (config.LAB_MODE === "azure") res.set("Strict-Transport-Security", "max-age=31536000");
    next();
  });
  app.use(express.raw({ type: () => true, limit: "256kb" }));
  app.get("/api/health", (_req, res) => res.json({ ok: true, application: "voice-agent-lab" }));
  app.post("/api/login", async (req, res) => {
    if (req.headers.origin !== config.APP_ORIGIN) throw new LabError("ORIGIN_REJECTED", 403, "Use the configured app origin.");
    const input = z.object({ password: z.string().min(1).max(512) }).strict().parse(body(req));
    const { credential, csrf } = await operator.login(input.password, req.header("origin"), req.ip);
    res.cookie("lab_session", credential, { httpOnly: true, secure: config.LAB_MODE === "azure", sameSite: "strict", maxAge: 4 * 3600000, path: "/" });
    res.json({ csrf, owner: "demo-operator" });
  });
  app.post("/api/retell/webhook", async (req, res) => {
    if (!verifyRetellSignature(raw(req), req.header("x-retell-signature"), config.RETELL_WEBHOOK_SIGNING_KEY)) {
      throw new LabError("SIGNATURE_REJECTED", 401, "Retell signature invalid or expired.");
    }
    await inbox.accept(body(req), config.RETELL_AGENT_ID);
    res.sendStatus(204);
  });
  app.post("/api/retell/functions", async (req, res) => {
    if (!verifyRetellSignature(raw(req), req.header("x-retell-signature"), config.RETELL_WEBHOOK_SIGNING_KEY)) {
      throw new LabError("SIGNATURE_REJECTED", 401, "Custom-function signature invalid or expired.");
    }
    const payload = z.object({ name: toolName, args: z.unknown(),
      call: z.object({ call_id: callIdSchema, call_type: z.literal("web_call"), agent_id: z.string(),
        metadata: z.object({ lab_session_id: z.string().optional(), lab_creation_id: z.string().optional() }).strip().optional(),
        retell_llm_dynamic_variables: z.object({ lab_session_id: z.string().uuid(), lab_tool_grant: z.string() }).passthrough() }).passthrough() }).strip().parse(body(req));
    let call = (await store.read()).calls[payload.call.call_id];
    if (!call && payload.call.metadata) call = await store.update(state => claimCallbackCall(state, payload.call, config.RETELL_AGENT_ID));
    if (!call || call.agentId !== config.RETELL_AGENT_ID || payload.call.agent_id !== call.agentId ||
        call.sessionId !== payload.call.retell_llm_dynamic_variables.lab_session_id || call.aiStopped || ["ended", "analyzed"].includes(call.status)) {
      throw new LabError("TOOL_CALL_REJECTED", 403, "Tool call is not an authorized active lab call.");
    }
    await business.authorizeGrant(call.sessionId, payload.call.retell_llm_dynamic_variables.lab_tool_grant);
    res.json(await business.execute(payload.name, payload.args, call.sessionId, undefined, { provider: "retell", callId: call.id }));
  });
  app.post("/api/retell/mcp", async (req, res) => {
    const bearer = req.header("authorization")?.replace(/^Bearer /, "");
    if (!config.RETELL_MCP_TOKEN || !bearer || hash(bearer) !== hash(config.RETELL_MCP_TOKEN)) {
      throw new LabError("MCP_AUTH_REQUIRED", 401, "MCP server authentication required.");
    }
    const payload = z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number()]).optional(),
      method: z.string(), params: z.record(z.string(), z.unknown()).optional() }).parse(body(req));
    let result: unknown;
    if (payload.method === "initialize") result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "lumanest-scoped-tools", version: "1.0.0" } };
    else if (payload.method === "notifications/initialized") { res.sendStatus(202); return; }
    else if (payload.method === "tools/list") result = { tools: (["get_product_catalog", "get_order_status", "diagnose_device"] as const).map(name => ({
      name, description: `Scoped synthetic LumaNest ${name}; no external writes.`,
      inputSchema: z.toJSONSchema(toolSchemas[name]),
    })) };
    else if (payload.method === "tools/call") {
      const name = z.enum(["get_product_catalog", "get_order_status", "diagnose_device"]).parse(payload.params?.name);
      const sessionId = z.string().uuid().parse(req.header("x-lab-session"));
      await business.authorizeGrant(sessionId, req.header("x-lab-grant") ?? "");
      const matching = Object.values((await store.read()).calls).find(c => c.sessionId === sessionId && c.agentId === config.RETELL_AGENT_ID && !c.aiStopped && ["created", "started"].includes(c.status));
      if (!matching) throw new LabError("MCP_CALL_REJECTED", 403, "MCP requires an authorized active call.");
      result = { content: [{ type: "text", text: JSON.stringify(await business.execute(name, payload.params?.arguments, sessionId, undefined, { provider: "retell", callId: matching.id })) }] };
    } else { res.status(400).json({ jsonrpc: "2.0", id: payload.id, error: { code: -32601, message: "Method not supported" } }); return; }
    res.json({ jsonrpc: "2.0", id: payload.id, result });
  });
  app.use(["/api", "/retell"], async (req, res, next) => {
    const auth = await authenticate(store, req.headers.cookie);
    res.locals.auth = auth;
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.originalUrl.startsWith("/retell/webrtc-proxy/")) {
        if (req.header("origin") !== config.APP_ORIGIN) throw new LabError("ORIGIN_REJECTED", 403, "Signaling origin rejected.");
      } else checkCsrf(req.header("origin"), req.header("x-csrf-token"), auth.csrf, config.APP_ORIGIN);
    }
    next();
  });
  app.get("/api/me", (_req, res) => res.json(res.locals.auth));
  app.post("/api/logout", async (req, res) => {
    await operator.logout(req.headers.cookie);
    res.clearCookie("lab_session", { path: "/" }); res.sendStatus(204);
  });
  app.get("/api/bootstrap", async (_req, res) => res.json({
    synthetic: true, products, customers, knowledge, mode: config.LAB_MODE,
    liveEnabled: retellReady(config),
    foundryEnabled: Boolean(config.FOUNDRY_PROJECT_ENDPOINT && config.FOUNDRY_AGENT_VERSION),
    gptLiveUrl: config.GPT_LIVE_URL ?? null,
    budget: budgetSummary(await store.read()), paused: (await store.read()).paused,
  }));
  app.post("/api/sessions", async (req, res) => {
    const input = z.object({ customerId }).strict().parse(body(req));
    const { session } = await business.createSession(res.locals.auth.owner, input.customerId);
    res.status(201).json({ id: session.id, customerId: session.customerId });
  });
  app.get("/api/sessions/:id", async (req, res) => {
    const state = await store.read();
    const session = sessionIn(state, String(req.params.id), res.locals.auth.owner);
    res.json({
      id: session.id, customerId: session.customerId,
      drafts: Object.values(state.drafts).filter(d => d.sessionId === session.id),
      tickets: Object.values(state.tickets).filter(t => t.sessionId === session.id),
      consents: Object.values(state.consents).filter(c => c.sessionId === session.id),
      followups: Object.values(state.followups).filter(f => f.sessionId === session.id),
      calls: Object.values(state.calls).filter(c => c.sessionId === session.id).map(({ id, status, aiStopped, analysis }) => ({ id, status, aiStopped, analysis })),
    });
  });
  app.post("/api/sessions/:id/tools/:name", async (req, res) => {
    res.json(await business.execute(toolName.parse(req.params.name), body(req), String(req.params.id), res.locals.auth.owner));
  });
  app.post("/api/drafts/:id/approval", async (req, res) => {
    const input = z.object({ version: z.number().int().positive(), revoke: z.boolean().default(false) }).strict().parse(body(req));
    res.json(await business.approve(String(req.params.id), input.version, res.locals.auth.owner, input.revoke));
  });
  app.post("/api/sessions/:id/consents", async (req, res) => {
    const input = z.object({ evidence: z.string().min(12).max(500), operatorConfirmed: z.literal(true) }).strict().parse(body(req));
    res.status(201).json(await business.recordConsent(String(req.params.id), res.locals.auth.owner, input.evidence));
  });
  app.post("/api/consents/:id/withdraw", async (req, res) => res.json(await business.withdraw(String(req.params.id), res.locals.auth.owner)));
  app.post("/api/pause", async (req, res) => {
    const input = z.object({ paused: z.boolean() }).strict().parse(body(req));
    await store.update(state => { state.paused = input.paused; }); res.json(input);
  });
  app.get("/api/budget", async (_req, res) => res.json(budgetSummary(await store.read())));
  app.post("/api/reconcile", async (_req, res) => {
    const calls = Object.values((await store.read()).calls).filter(c => c.owner === res.locals.auth.owner && ["created", "started"].includes(c.status));
    let reconciled = 0;
    for (const call of calls.slice(0, 30)) {
      const current = await retell.request(`/v2/get-call/${encodeURIComponent(call.id)}`, "GET");
      const parsed = z.object({ call_id: z.string(), call_type: z.literal("web_call"), agent_id: z.string(), call_status: z.string(), call_analysis: z.unknown().optional() }).passthrough().parse(current);
      if (parsed.call_status === "ended" || parsed.call_status === "error") {
        await inbox.accept(eventSchema.parse({ event: "call_ended", call: parsed }), config.RETELL_AGENT_ID);
        if (parsed.call_analysis) await inbox.accept({ event: "call_analyzed", call: parsed }, config.RETELL_AGENT_ID);
        reconciled++;
      }
    }
    await inbox.drain(); res.json({ reconciled, pending: Object.values((await store.read()).events).filter(e => e.status === "pending").length });
  });
  app.get("/api/calls/:id/captions", async (req, res) => {
    await retell.owned(String(req.params.id), res.locals.auth.owner);
    res.json({ state: captions.get(String(req.params.id)) ?? "unavailable" });
  });
  app.post("/retell/v3/create-web-call", async (req, res) => {
    const input = z.object({ lab_session_id: z.string().uuid(), agent_id: z.literal("server-selected") }).strict().parse(body(req));
    res.status(201).json(await retell.create(input.lab_session_id, res.locals.auth.owner));
  });
  app.post("/retell/v2/listen-live-call/:id", async (req, res) => res.json(await retell.listen(String(req.params.id), res.locals.auth.owner)));
  app.post("/retell/v2/take-over-live-call/:id", async (req, res) => {
    const input = z.object({ participant_id: z.string().min(1).max(120) }).strict().parse(body(req));
    await retell.takeOver(String(req.params.id), input.participant_id, res.locals.auth.owner); res.sendStatus(204);
  });
  app.post("/retell/v2/stop-call/:id", async (req, res) => { await retell.stop(String(req.params.id), res.locals.auth.owner); res.sendStatus(204); });
  app.patch("/retell/v2/update-live-call/:id", async (req, res) => {
    const input = z.object({ approved_ticket_id: z.string().uuid() }).strict().parse(body(req));
    await retell.injectApprovedTicket(String(req.params.id), input.approved_ticket_id, res.locals.auth.owner); res.sendStatus(204);
  });
  app.all(/^\/retell\/webrtc-proxy\/([\w-]+)\/v1\/webrtc\/sessions(?:\/([\w-]+))?$/, async (req, res) => {
    const parsed = /^\/retell\/webrtc-proxy\/([\w-]+)\/v1\/webrtc\/sessions(?:\/([\w-]+))?$/.exec(req.path)!;
    const call = await retell.owned(callIdSchema.parse(parsed[1]), res.locals.auth.owner);
    if (["ended", "analyzed"].includes(call.status) || Date.now() - call.createdAt > 10 * 60000) throw new LabError("CALL_EXPIRED", 410, "Signaling call lifetime ended.");
    const credential = req.header("authorization")?.replace(/^Bearer /, "");
    if (!credential || !call.accessHashes.includes(hash(credential))) throw new LabError("SIGNALING_TOKEN_REJECTED", 403, "Call-scoped signaling token required.");
    if (!["POST", "PATCH", "DELETE"].includes(req.method) || (req.method === "POST") !== !parsed[2]) throw new LabError("SIGNALING_METHOD_REJECTED", 405, "Unsupported signaling operation.");
    if (parsed[2] && !call.signalingSessions.includes(parsed[2])) throw new LabError("SIGNALING_SESSION_REJECTED", 403, "Signaling session not owned by this call.");
    const response = await fetch(`https://api.retellai.com${req.path.replace(/^\/retell/, "")}`, {
      method: req.method, headers: { Authorization: `Bearer ${credential}`, "Content-Type": req.header("content-type") ?? "application/json", "X-Retell-Client-JS-SDK-Version": "3.0.2" },
      body: req.method === "DELETE" ? undefined : raw(req).toString("utf8"), signal: AbortSignal.timeout(15000), redirect: "error",
    });
    if (!response.ok) throw new LabError("SIGNALING_UPSTREAM_REJECTED", response.status, `Signaling returned HTTP ${response.status}.`);
    const text = await response.text();
    if (req.method === "POST") {
      const created = z.object({ session_id: z.string().regex(/^[\w-]+$/), sdp: z.string() }).parse(JSON.parse(text));
      await store.update(state => { state.calls[call.id]!.signalingSessions.push(created.session_id); });
    }
    res.status(response.status).type(response.headers.get("content-type") ?? "application/json").send(text);
  });
  const wsServer = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024, handleProtocols: () => "bearer" });
  server.on("upgrade", (req, socket, head) => {
    void (async () => {
      try {
        const match = /^\/retell\/v2\/monitor-call\/([\w-]+)$/.exec(req.url ?? "");
        const auth = await authenticate(store, req.headers.cookie);
        const protocols = String(req.headers["sec-websocket-protocol"] ?? "").split(",").map(v => v.trim());
        if (!match?.[1] || req.headers.origin !== config.APP_ORIGIN || protocols[0] !== "bearer" || protocols[1] !== auth.csrf || !config.RETELL_API_KEY) {
          throw new LabError("MONITOR_REJECTED", 403, "Monitor authorization rejected.");
        }
        const owned = await retell.owned(match[1], auth.owner);
        if (["ended", "analyzed"].includes(owned.status) || Date.now() - owned.createdAt > 10 * 60000) throw new LabError("CALL_EXPIRED", 410, "Monitor call lifetime ended.");
        const callId = match[1];
        captions.set(callId, "connecting");
        wsServer.handleUpgrade(req, socket, head, downstream => {
          const upstream = new WebSocket(`wss://api.retellai.com/v2/monitor-call/${encodeURIComponent(callId)}`, ["bearer", config.RETELL_API_KEY!], { handshakeTimeout: 10000, maxPayload: 256 * 1024, followRedirects: false });
          const expiry = setTimeout(() => { upstream.close(); downstream.close(1000, "Monitor lifetime ended"); captions.delete(callId); }, Math.min(5 * 60000, auth.expiresAt - Date.now()));
          upstream.on("open", () => { captions.set(callId, "available"); });
          upstream.on("message", message => {
            try { if (downstream.readyState === WebSocket.OPEN) downstream.send(JSON.stringify(safeMonitorFrame(message.toString())), { binary: false }); }
            catch { captions.set(callId, "unavailable"); downstream.close(1011, "Caption format unsupported"); console.error(JSON.stringify({ event: "monitor_failed", code: "CAPTION_FORMAT_INVALID" })); }
          });
          downstream.on("close", () => { clearTimeout(expiry); upstream.close(); });
          upstream.on("close", () => { captions.set(callId, "unavailable"); downstream.close(); });
          upstream.on("error", () => { captions.set(callId, "unavailable"); downstream.close(1011, "Captions unavailable"); });
          downstream.on("error", () => upstream.close());
        });
      } catch {
        socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n"); socket.destroy();
      }
    })();
  });
  app.use(express.static(resolve("dist/ui"), { index: "index.html", fallthrough: true }));
  app.use((req, res) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/retell/")) res.status(404).json({ code: "NOT_FOUND", error: "Route not found." });
    else res.sendFile(resolve("dist/ui/index.html"));
  });
  app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    const known = error instanceof LabError, invalid = error instanceof z.ZodError;
    const status = known ? error.status : invalid ? 400 : 500;
    const code = known ? error.code : invalid ? "INPUT_INVALID" : "INTERNAL_ERROR";
    console.error(JSON.stringify({ event: "request_failed", code, status }));
    res.status(status >= 400 && status <= 599 ? status : 502).json({ code, error: known ? error.message : invalid ? "Input does not match the required schema." : "Operation failed; no success is assumed." });
  });
  server.requestTimeout = 30000; server.headersTimeout = 15000;
  return { app, server, business, inbox, retell };
}
