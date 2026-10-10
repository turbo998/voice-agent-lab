import test from "node:test";
import assert from "node:assert/strict";
import { scryptSync } from "node:crypto";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { Business } from "../apps/retell-demo/server/business.js";
import { loadConfig, retellReady } from "../apps/retell-demo/server/config.js";
import { RetellGateway } from "../integrations/retell/gateway.js";
import { EventInbox } from "../apps/retell-demo/server/events.js";
import { safeMonitorFrame } from "../integrations/retell/monitor.js";
import { stateSchema, pruneState } from "../packages/business-core/state-schema.js";
import { initialState } from "../packages/business-core/state.js";
const salt = "1".repeat(32);
const config = () => loadConfig({
  APP_ORIGIN: "https://lab.example.invalid", TOKEN_SECRET: "2".repeat(64),
  OPERATOR_PASSWORD_HASH: `scrypt$${salt}$${scryptSync("synthetic-password", salt, 64).toString("hex")}`,
  RETELL_API_KEY: "synthetic-development-credential", RETELL_WEBHOOK_SIGNING_KEY: "synthetic-signing-key",
  RETELL_AGENT_ID: "agent_synthetic", RETELL_AGENT_VERSION: "7", REMOTE_CALLS_ENABLED: "true",
  RETELL_RATE_CENTS_PER_MINUTE: "15", RETELL_TRIAL_BALANCE_CENTS: "1000",
  RETELL_TRIAL_VERIFIED_AT: String(Date.now()), RETELL_NO_PAYMENT_NO_RECHARGE: "true",
});
test("stale trial verification and missing no-payment attestation keep calls disabled", () => {
  const c = config(); assert.equal(retellReady(c), true);
  assert.equal(retellReady(c, Date.now() + 3600001), false);
  assert.equal(retellReady({ ...c, RETELL_NO_PAYMENT_NO_RECHARGE: undefined }), false);
});
test("a signed start callback arriving before create response claims only durable correlation", async () => {
  const store = new MemoryStore(), business = new Business(store), inbox = new EventInbox(store);
  const { session } = await business.createSession("alice", "demo-sg");
  const transport: typeof fetch = async (_url, options) => {
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.agent_version, 7);
    await inbox.accept({ event: "call_started", call: { call_id: "call_synthetic", call_type: "web_call", agent_id: "agent_synthetic", metadata: payload.metadata } }, "agent_synthetic");
    await inbox.drain();
    return Response.json({ call_id: "call_synthetic", access_token: "synthetic-access-token", transport: "gateway" });
  };
  await new RetellGateway(config(), store, transport).create(session.id, "alice");
  const state = await store.read();
  assert.equal(state.calls.call_synthetic?.status, "started");
  assert.equal(state.calls.call_synthetic?.accessHashes.length, 1);
  assert.equal(Object.keys(state.reservations).length, 1);
  await assert.rejects(inbox.accept({ event: "call_started", call: { call_id: "call_forged", call_type: "web_call", agent_id: "agent_synthetic", metadata: { lab_session_id: session.id, lab_creation_id: crypto.randomUUID() } } }, "agent_synthetic"), /correlation/);
});
test("uncertain irreversible takeover blocks result injection and another takeover", async () => {
  const store = new MemoryStore(), business = new Business(store);
  const { session } = await business.createSession("alice", "demo-sg");
  let failing = false;
  const transport: typeof fetch = async () => {
    if (failing) throw new Error("synthetic connection reset");
    return Response.json({ call_id: "call_synthetic", access_token: "synthetic-access-token" });
  };
  const gateway = new RetellGateway(config(), store, transport);
  await gateway.create(session.id, "alice");
  await store.update(s => { s.calls.call_synthetic!.participants = ["participant_synthetic"]; });
  failing = true;
  await assert.rejects(gateway.takeOver("call_synthetic", "participant_synthetic", "alice"), /uncertain/);
  const call = (await store.read()).calls.call_synthetic!;
  assert.equal(call.aiStopped, true); assert.equal(call.takeover, "uncertain");
  await assert.rejects(gateway.takeOver("call_synthetic", "participant_synthetic", "alice"), /already requested/);
});
test("caption relay drops tool arguments, metadata and provider-private fields", () => {
  const frame = safeMonitorFrame(JSON.stringify({
    type: "transcript_updated", access_token: "PRIVATE",
    transcripts: [
      { id: "u1", role: "agent", time_sec: 1, content: "Synthetic greeting", metadata: { credential: "PRIVATE" } },
      { id: "t1", role: "tool_call_invocation", time_sec: 1, arguments: "PRIVATE", name: "tool" },
      { id: "n1", role: "node_transition", time_sec: 2, former_node_id: "welcome", former_node_name: "Welcome", new_node_id: "order", new_node_name: "Order", metadata: "PRIVATE" },
    ],
  }));
  assert.doesNotMatch(JSON.stringify(frame), /PRIVATE|arguments|access_token/);
  assert.equal(frame.transcripts?.length, 2);
});
test("retention removes synthetic content but preserves the lifetime trial ledger", () => {
  const state = initialState(), old = Date.now() - 8 * 86400000;
  state.sessions.old = { id: "old", owner: "alice", customerId: "demo-sg", createdAt: old, grantHash: "hash", grantExpiresAt: old };
  state.reservations.used = { id: "used", sessionId: "old", bucket: "retell", period: "trial", cents: 100, minutes: 3, status: "ended", createdAt: old };
  pruneState(state);
  assert.equal(state.sessions.old, undefined); assert.equal(state.reservations.used?.cents, 100);
  assert.equal(stateSchema.safeParse({ schema: 1, revision: 0 }).success, false);
  assert.equal(stateSchema.safeParse(state).success, true);
});
