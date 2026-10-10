import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import http, { type IncomingMessage } from "node:http";
import { WebSocketServer } from "ws";
import { startServer, type CloudContext, type LiveConfig } from "../experiments/gpt-live/server.mjs";
import { createLiveRuntime, liveReady } from "../integrations/gpt-live/runtime.js";
import { loadConfig } from "../apps/retell-demo/server/config.js";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { Business } from "../apps/retell-demo/server/business.js";

const salt = "9".repeat(32), password = "synthetic-live-test-password";
const config = () => loadConfig({
  APP_ORIGIN: "https://live.example.invalid", TOKEN_SECRET: "7".repeat(64),
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
  LIVE_PROVIDER_ENDPOINT: "https://synthetic-live.openai.azure.com",
  LIVE_REASONING_ENDPOINT: "https://synthetic-reasoning.openai.azure.com",
  LIVE_CALLS_ENABLED: "true", LIVE_RATE_CENTS_PER_MINUTE: "5",
  LIVE_PROVIDER_MAX_SECONDS: "1800", LIVE_CONTROL_VERIFIED_AT: String(Date.now()),
});
const credential = { getToken: async () => ({ token: "synthetic-private-bearer", expiresOnTimestamp: Date.now() + 3600000 }) };
const sessionConfig: LiveConfig = { voice: "marin", language: "en-US", instructions: "Synthetic scenario", city: "Singapore",
  timeZone: "Asia/Singapore", webSearch: false, maxOutputTokens: 512, sessionMinutes: 3, reasoningEffort: "low",
  backendReady: true, backendModel: "reasoning", backendProvider: "managed-identity" };
function fakeRequest(cookie?: string, method = "GET") {
  return { method, headers: { cookie, origin: "https://live.example.invalid" }, socket: { remoteAddress: "127.0.0.1" } } as IncomingMessage;
}
async function loggedIn(store = new MemoryStore()) {
  const runtime = await createLiveRuntime(config(), store, { credential });
  let cookie = "";
  const response = { setHeader(_name: string, value: string) { cookie = value.split(";")[0]!; } };
  const login = await runtime.auth.login(fakeRequest(undefined, "POST"), response as http.ServerResponse, { password });
  return { runtime, store, cookie, csrf: login.csrf };
}
test("cloud stores only immutable nonsecret settings and uses server-side Entra bearer", async () => {
  const { runtime, store, cookie } = await loggedIn();
  const state = await store.read();
  assert.equal(state.liveSettings?.voiceModel, "gpt-live-1");
  assert.doesNotMatch(JSON.stringify(state), /synthetic-private-bearer|apiKey|synthetic-live-test-password/);
  const result = await runtime.publicConfig(fakeRequest(cookie));
  assert.doesNotMatch(JSON.stringify(result), /openai\.azure\.com|synthetic-private-bearer/);
  assert.equal((await runtime.voiceHeaders()).Authorization, "Bearer synthetic-private-bearer");
});
test("cloud clamps old preferences without changing original local defaults", async () => {
  const { runtime } = await loggedIn();
  const result = runtime.validateConfig({ ...sessionConfig, sessionMinutes: 30, maxOutputTokens: 4096, webSearch: true, reasoningEffort: "high" });
  assert.equal(result.sessionMinutes, 3); assert.equal(result.maxOutputTokens, 512);
  assert.equal(result.webSearch, false); assert.equal(result.reasoningEffort, "low");
});
test("cloud creates no session when control verification is stale", async () => {
  const c = config();
  assert.equal(liveReady(c), true); assert.equal(liveReady(c, Date.now() + 3600001), false);
  const runtime = await createLiveRuntime({ ...c, LIVE_CONTROL_VERIFIED_AT: 1 }, new MemoryStore(), { credential });
  await assert.rejects(runtime.beforeCreate(fakeRequest(), sessionConfig), /absent or expired/);
});
test("voice expiry horizon is reserved; uncertain close cannot release concurrency", async () => {
  const { runtime, store, cookie } = await loggedIn();
  const context = await runtime.beforeCreate(fakeRequest(cookie, "POST"), sessionConfig);
  assert.equal((await store.read()).reservations[context.reservationId]?.cents, 150);
  await runtime.onCreated(context, "live_synthetic", Math.floor(Date.now() / 1000) + 1800);
  assert.equal(context.providerValid, true);
  await runtime.onClosed(context, "live_synthetic", false, 12);
  await assert.rejects(runtime.beforeCreate(fakeRequest(cookie, "POST"), sessionConfig), /Another operation/);
  await runtime.onClosed(context, "live_synthetic", true, 12);
  const state = await store.read();
  assert.equal(state.reservations[context.reservationId]?.cents, 2);
  assert.equal(state.reservations[context.reservationId]?.status, "ended");
  await runtime.onCreateFailed(context, "live_synthetic", true);
  assert.equal((await store.read()).reservations[context.reservationId]?.status, "ended");
});
test("ended or taken-over calls cannot perform late synthetic writes", async () => {
  const { runtime, store, cookie } = await loggedIn();
  const context = await runtime.beforeCreate(fakeRequest(cookie, "POST"), sessionConfig);
  await runtime.onCreated(context, "live_synthetic", Math.floor(Date.now() / 1000) + 1800);
  await runtime.onClosing(context, "live_synthetic");
  const business = new Business(store);
  await assert.rejects(business.execute("draft_support_ticket", { product_id: "cam-air", summary: "Synthetic pairing issue" }, context.sessionId,
    context.owner, { provider: "live", callId: "live_synthetic" }), /active, authorized/);
});
test("cloud HTTP locks provider settings/probes, enforces CSRF, and keeps original login UI", async () => {
  const { runtime, cookie, csrf } = await loggedIn();
  const app = await startServer({ host: "127.0.0.1", port: 0, mode: "remote", publicOrigin: "https://live.example.invalid", cloud: runtime, quiet: true });
  const request = (path: string, method = "GET", body?: object, extra: Record<string, string> = {}) => new Promise<{
    status: number; text: string; headers: http.IncomingHttpHeaders;
  }>((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port: app.port, path, method,
      headers: { Host: "live.example.invalid", Origin: "https://live.example.invalid", Cookie: cookie,
        "Content-Type": "application/json", ...extra } }, res => {
      let text = ""; res.on("data", chunk => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode!, text, headers: res.headers }));
    });
    req.on("error", reject); req.end(body ? JSON.stringify(body) : undefined);
  });
  try {
    const bootstrap = await request("/api/bootstrap");
    assert.equal(JSON.parse(bootstrap.text).cloudMode, true);
    const locked = await request("/api/settings", "POST", {}, { "X-CSRF-Token": csrf });
    assert.equal(locked.status, 403); assert.match(locked.text, /locked/);
    const rejected = await request("/api/session", "POST", { sdp: "invalid" });
    assert.equal(rejected.status, 403);
    const page = await request("/setup");
    assert.equal(page.status, 200); assert.match(page.text, /uiLanguageSelect/);
    const config = await request("/api/config");
    assert.equal(JSON.parse(config.text).limits.sessionMinutes, 3);
    assert.doesNotMatch(config.text, /synthetic-private-bearer|openai\.azure\.com/);
  } finally { await app.close(); }
});
test("graceful shutdown waits for final durable Live settlement", async () => {
  const { runtime, store, cookie, csrf } = await loggedIn();
  const provider = http.createServer((_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ session: { id: "live_shutdown_fixture", expires_at: Math.floor(Date.now() / 1000) + 1800 },
      transport: { sdp: "synthetic-answer" } }));
  });
  const sockets = new WebSocketServer({ server: provider });
  sockets.on("connection", socket => socket.on("message", raw => {
    if (JSON.parse(raw.toString()).type === "session.close") {
      socket.send(JSON.stringify({ type: "session.closed", usage: { seconds: 12 }, reason: "synthetic_test" }));
    }
  }));
  await new Promise<void>(resolve => provider.listen(0, "127.0.0.1", resolve));
  const address = provider.address();
  assert.ok(address && typeof address !== "string");
  const originalSettings = runtime.settingsStore.get();
  runtime.settingsStore.get = () => ({ ...originalSettings,
    voice: { ...originalSettings.voice, baseUrl: `http://127.0.0.1:${address.port}` } });
  let release!: () => void, settlementStarted!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { settlementStarted = resolve; });
  const originalClosed = runtime.onClosed;
  runtime.onClosed = async (...args) => { settlementStarted(); await held; await originalClosed(...args); };
  const app = await startServer({ host: "127.0.0.1", port: 0, mode: "remote",
    publicOrigin: "https://live.example.invalid", cloud: runtime, quiet: true });
  try {
    const created = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request({ hostname: "127.0.0.1", port: app.port, path: "/api/session", method: "POST",
        headers: { Host: "live.example.invalid", Origin: "https://live.example.invalid", Cookie: cookie,
          "Content-Type": "application/json", "X-CSRF-Token": csrf } }, res => {
        res.resume(); res.on("end", () => resolve({ status: res.statusCode! }));
      });
      req.on("error", reject); req.end(JSON.stringify({ sdp: "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111", config: sessionConfig }));
    });
    assert.equal(created.status, 200);
    let completed = false;
    const closing = app.close().then(() => { completed = true; });
    await started;
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(completed, false);
    release(); await closing;
    const state = await store.read();
    assert.equal(state.liveCalls.live_shutdown_fixture?.status, "ended");
    assert.equal(state.reservations[state.liveCalls.live_shutdown_fixture!.reservationId]?.status, "ended");
  } finally {
    release(); await app.close();
    for (const socket of sockets.clients) socket.terminate();
    await new Promise<void>(resolve => sockets.close(() => resolve()));
    await new Promise<void>(resolve => provider.close(() => resolve()));
  }
});
