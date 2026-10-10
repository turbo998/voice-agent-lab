import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { reserve, settle, budgetSummary } from "../apps/retell-demo/server/budget.js";
import { verifyRetellSignature } from "../apps/retell-demo/server/security.js";
import { EventInbox } from "../apps/retell-demo/server/events.js";
import { LabError } from "../packages/business-core/contracts.js";
const matches = (code: string) => (error: unknown) => error instanceof LabError && error.code === code;

test("concurrent web reservations cannot exceed shared two-session cap", async () => {
  const store = new MemoryStore();
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => reserve(store, "retell", `synthetic-${i}`, 50, 3)));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 2);
  assert.equal(budgetSummary(await store.read())[0]?.reservedMinutes, 6);
});
test("live and Retell reservations share concurrency while Live has cap one", async () => {
  const store = new MemoryStore();
  await reserve(store, "retell", "synthetic", 50, 3);
  await reserve(store, "live", "synthetic-live", 18, 3);
  await assert.rejects(reserve(store, "retell", "synthetic-other", 50, 3), matches("CONCURRENCY_LIMIT"));
});
test("15 minute Retell trial gate retains usage after calls end", async () => {
  const store = new MemoryStore();
  for (let i = 0; i < 5; i++) { const reservation = await reserve(store, "retell", "synthetic", 50, 3); await settle(store, reservation.id, "ended"); }
  await assert.rejects(reserve(store, "retell", "synthetic", 50, 3), matches("BUDGET_EXHAUSTED"));
});
test("trial USD5 voice cap cannot consume the protected remainder", async () => {
  const store = new MemoryStore();
  for (let i = 0; i < 5; i++) { const r = await reserve(store, "retell", "synthetic", 100, 1); await settle(store, r.id, "ended"); }
  await assert.rejects(reserve(store, "retell", "synthetic", 1, 1), matches("BUDGET_EXHAUSTED"));
});
test("uncertain provider creation keeps reservation and fail-closed capacity", async () => {
  const store = new MemoryStore();
  const r = await reserve(store, "live", "synthetic", 18, 3); await settle(store, r.id, "uncertain");
  await assert.rejects(reserve(store, "live", "synthetic", 18, 3), matches("SESSION_BUSY"));
  await assert.rejects(reserve(store, "live", "synthetic-other", 18, 3), matches("CONCURRENCY_LIMIT"));
});
test("paused lab and invalid duration prevent billable work", async () => {
  const store = new MemoryStore();
  await assert.rejects(reserve(store, "retell", "synthetic", 20, 4), matches("INVALID_RESERVATION"));
  await store.update(s => { s.paused = true; });
  await assert.rejects(reserve(store, "model", "synthetic", 10), matches("LAB_PAUSED"));
});
test("fractional cents are rounded before comparing the cap", async () => {
  const store = new MemoryStore();
  const r = await reserve(store, "model", "synthetic", 1999.1); await settle(store, r.id, "ended");
  assert.equal((await store.read()).reservations[r.id]?.cents, 2000);
  await assert.rejects(reserve(store, "model", "synthetic", 0.1), matches("BUDGET_EXHAUSTED"));
});
test("Retell raw-body signature rejects wrong signer, edits and stale/future timestamps", () => {
  const raw = Buffer.from('{ "event": "call_ended" }'), now = Date.now(), key = "synthetic-signing-key";
  const sign = (time: number) => `v=${time},d=${createHmac("sha256", key).update(raw).update(String(time)).digest("hex")}`;
  assert.equal(verifyRetellSignature(raw, sign(now), key, now), true);
  assert.equal(verifyRetellSignature(raw, sign(now), "different-scoped-development-key", now), false);
  assert.equal(verifyRetellSignature(Buffer.from('{"event":"call_ended"}'), sign(now), key, now), false);
  assert.equal(verifyRetellSignature(raw, sign(now - 300001), key, now), false);
  assert.equal(verifyRetellSignature(raw, sign(now + 300001), key, now), false);
  assert.equal(verifyRetellSignature(raw, `v=${now},d=not-hex`, key, now), false);
});
async function eventContext() {
  const store = new MemoryStore(), reservation = await reserve(store, "retell", "synthetic", 50, 3);
  await store.update(s => { s.calls.call_synthetic = { id: "call_synthetic", sessionId: "synthetic", owner: "alice", agentId: "agent_synthetic", reservationId: reservation.id, status: "created", createdAt: Date.now(), aiStopped: false, accessHashes: [], participants: [], signalingSessions: [] }; });
  const inbox = new EventInbox(store);
  const call = { call_id: "call_synthetic", call_type: "web_call", agent_id: "agent_synthetic" };
  return { store, inbox, call, reservation };
}
test("webhook accept is persistent before ack and duplicate event IDs are deduplicated", async () => {
  const c = await eventContext();
  const id = await c.inbox.accept({ event: "call_ended", call: c.call }, "agent_synthetic");
  await c.inbox.accept({ event: "call_ended", call: c.call }, "agent_synthetic");
  assert.equal(Object.keys((await c.store.read()).events).length, 1);
  assert.equal((await c.store.read()).events[id]?.status, "pending");
  await c.inbox.drain(); assert.equal((await c.store.read()).events[id]?.status, "done");
});
test("out-of-order started event cannot revert an analyzed ended call", async () => {
  const c = await eventContext();
  for (const event of ["call_analyzed", "call_ended", "call_started"]) await c.inbox.accept({ event, call: c.call }, "agent_synthetic");
  await c.inbox.drain();
  const state = await c.store.read();
  assert.equal(state.calls.call_synthetic?.status, "analyzed");
  assert.equal(state.reservations[c.reservation.id]?.status, "ended");
});
test("webhook rejects phone calls, wrong agents and unowned calls", async () => {
  const c = await eventContext();
  await assert.rejects(c.inbox.accept({ event: "call_ended", call: { ...c.call, call_type: "phone_call" } }, "agent_synthetic"), matches("EVENT_INVALID"));
  await assert.rejects(c.inbox.accept({ event: "call_ended", call: c.call }, "agent_foreign"), matches("EVENT_UNAUTHORIZED"));
  await assert.rejects(c.inbox.accept({ event: "call_ended", call: { ...c.call, call_id: "call_foreign" } }, "agent_synthetic"), matches("EVENT_UNAUTHORIZED"));
});
test("post-call payload drops transcripts, URLs and raw tool credentials", async () => {
  const c = await eventContext();
  await c.inbox.accept({ event: "call_analyzed", call: { ...c.call, transcript: "PRIVATE", access_token: "PRIVATE", recording_url: "PRIVATE", call_analysis: { call_successful: true, transcript: "PRIVATE" } } }, "agent_synthetic");
  assert.doesNotMatch(JSON.stringify(await c.store.read()), /PRIVATE/);
});
