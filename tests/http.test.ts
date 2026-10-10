import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync, createHmac } from "node:crypto";
import { once } from "node:events";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { createApp } from "../apps/retell-demo/server/app.js";
import { loadConfig } from "../apps/retell-demo/server/config.js";
const password = "synthetic-test-password", salt = "1".repeat(32);
const config = () => loadConfig({ APP_ORIGIN: "http://127.0.0.1:8080", TOKEN_SECRET: "2".repeat(64),
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`,
  RETELL_WEBHOOK_SIGNING_KEY: "synthetic-signing-key" });
async function fixture() {
  const store = new MemoryStore(), runtime = createApp(config(), store);
  runtime.server.listen(0, "127.0.0.1"); await once(runtime.server, "listening");
  const address = runtime.server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  async function request(path: string, payload?: unknown, extras: Record<string, string> = {}) {
    return fetch(base + path, { method: payload === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:8080", ...extras }, body: payload === undefined ? undefined : JSON.stringify(payload) });
  }
  return { store, runtime, request, close: () => new Promise<void>(resolve => { runtime.server.close(() => resolve()); runtime.server.closeAllConnections(); }) };
}
async function login(f: Awaited<ReturnType<typeof fixture>>) {
  const response = await f.request("/api/login", { password });
  assert.equal(response.status, 200);
  const value = await response.json();
  return { Cookie: response.headers.get("set-cookie")!.split(";")[0]!, "X-CSRF-Token": value.csrf };
}
test("operator login, csrf and protected configuration are enforced", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request("/api/bootstrap")).status, 401);
    assert.equal((await f.request("/api/login", { password: "wrong" })).status, 401);
    const headers = await login(f);
    const bootstrap = await f.request("/api/bootstrap", undefined, headers);
    assert.equal(bootstrap.status, 200);
    assert.equal((await bootstrap.json()).liveEnabled, false);
    assert.equal((await f.request("/api/sessions", { customerId: "demo-sg" }, { Cookie: headers.Cookie })).status, 403);
    assert.equal((await f.request("/api/sessions", { customerId: "demo-sg" }, { ...headers, Origin: "https://foreign.invalid" })).status, 403);
    assert.equal((await f.request("/api/sessions", { customerId: "demo-sg" }, headers)).status, 201);
  } finally { await f.close(); }
});
test("disabled remote calls cannot be enabled by browser overrides", async () => {
  const f = await fixture();
  try {
    const headers = await login(f);
    const response = await f.request("/api/sessions", { customerId: "demo-sg" }, headers), session = await response.json();
    assert.equal((await f.request("/retell/v3/create-web-call", { agent_id: "server-selected", lab_session_id: session.id }, headers)).status, 503);
    assert.equal((await f.request("/retell/v3/create-web-call", { agent_id: "agent_foreign", lab_session_id: session.id, agent_override: { max_call_duration_ms: 999999 } }, headers)).status, 400);
    assert.equal(Object.keys((await f.store.read()).reservations).length, 0);
  } finally { await f.close(); }
});
test("webhook signature failure rejects before business event persistence", async () => {
  const f = await fixture();
  try {
    const payload = { event: "call_ended", call: { call_id: "call_foreign", call_type: "web_call", agent_id: "agent_foreign" } };
    assert.equal((await f.request("/api/retell/webhook", payload)).status, 401);
    assert.equal(Object.keys((await f.store.read()).events).length, 0);
  } finally { await f.close(); }
});
test("custom functions require both raw signature and authorized call", async () => {
  const f = await fixture();
  try {
    const payload = { name: "commit_approved_ticket", args: { draft_id: crypto.randomUUID(), version: 1 }, call: {
      call_id: "call_foreign", call_type: "web_call", agent_id: "agent_foreign", retell_llm_dynamic_variables: { lab_session_id: crypto.randomUUID(), lab_tool_grant: "forged" },
    } };
    const time = Date.now(), signature = createHmac("sha256", "synthetic-signing-key").update(JSON.stringify(payload)).update(String(time)).digest("hex");
    assert.equal((await f.request("/api/retell/functions", payload)).status, 401);
    assert.equal((await f.request("/api/retell/functions", payload, { "X-Retell-Signature": `v=${time},d=${signature}` })).status, 403);
    assert.equal(Object.keys((await f.store.read()).tickets).length, 0);
  } finally { await f.close(); }
});
test("password login is durably rate limited and errors omit credentials", async () => {
  const f = await fixture();
  try {
    for (let i = 0; i < 5; i++) assert.equal((await f.request("/api/login", { password: "wrong" })).status, 401);
    const sixth = await f.request("/api/login", { password });
    assert.equal(sixth.status, 429); assert.doesNotMatch(await sixth.text(), /synthetic-test-password|scrypt/);
  } finally { await f.close(); }
});
