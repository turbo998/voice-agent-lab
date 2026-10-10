import test from "node:test";
import assert from "node:assert/strict";
import { Business, localDiagnosis } from "../apps/retell-demo/server/business.js";
import { MemoryStore, FileStore } from "../apps/retell-demo/server/store.js";
import { knowledge } from "../packages/business-core/fixtures.js";
import { LabError } from "../packages/business-core/contracts.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const errorCode = (code: string) => (error: unknown) => error instanceof LabError && error.code === code;
async function context(customer = "demo-sg") {
  const store = new MemoryStore(), business = new Business(store);
  const { session, grant } = await business.createSession("alice", customer);
  return { store, business, session, grant };
}
test("catalog returns original synthetic products without side effects", async () => {
  const c = await context();
  const result = await c.business.execute("get_product_catalog", {}, c.session.id);
  assert.equal((result as { synthetic: boolean }).synthetic, true);
  assert.equal(Object.keys((await c.store.read()).tickets).length, 0);
});
test("authorized SG order resolves to the correct synthetic state", async () => {
  const c = await context();
  const result = await c.business.execute("get_order_status", { order_id: "LN-SG-1001" }, c.session.id);
  assert.equal((result as { order: { status: string } }).order.status, "in_transit");
});
test("cross-customer order IDs are indistinguishable from missing IDs", async () => {
  const c = await context();
  await assert.rejects(c.business.execute("get_order_status", { order_id: "LN-MY-2001" }, c.session.id), errorCode("ORDER_NOT_FOUND"));
  await assert.rejects(c.business.execute("get_order_status", { order_id: "LN-SG-9999" }, c.session.id), errorCode("ORDER_NOT_FOUND"));
});
test("session owner cannot impersonate another operator", async () => {
  const c = await context();
  await assert.rejects(c.business.execute("get_product_catalog", {}, c.session.id, "bob"), errorCode("SESSION_NOT_FOUND"));
});
test("tool schema rejects identity fields and prompt-injected write approval", async () => {
  const c = await context();
  await assert.rejects(c.business.execute("get_order_status", { order_id: "LN-SG-1001", customer_id: "demo-my" }, c.session.id), errorCode("TOOL_INPUT_INVALID"));
  await assert.rejects(c.business.execute("commit_approved_ticket", { draft_id: crypto.randomUUID(), version: 1, approved: true }, c.session.id), errorCode("TOOL_INPUT_INVALID"));
});
test("tool grants are session-bound and expire", async () => {
  const c = await context();
  await c.business.authorizeGrant(c.session.id, c.grant);
  await assert.rejects(c.business.authorizeGrant(c.session.id, "wrong"), errorCode("GRANT_REJECTED"));
  await c.store.update(state => { state.sessions[c.session.id]!.grantExpiresAt = Date.now() - 1; });
  await assert.rejects(c.business.authorizeGrant(c.session.id, c.grant), errorCode("GRANT_REJECTED"));
});
test("a model cannot commit its own ticket draft", async () => {
  const c = await context();
  const draft = await c.business.execute("draft_support_ticket", { product_id: "cam-air", summary: "Pairing still fails after one safe retry." }, c.session.id) as { id: string; version: number };
  await assert.rejects(c.business.execute("commit_approved_ticket", { draft_id: draft.id, version: 1 }, c.session.id), errorCode("APPROVAL_REQUIRED"));
  assert.equal(Object.keys((await c.store.read()).tickets).length, 0);
});
test("three repeated approved commits create exactly one ticket", async () => {
  const c = await context();
  const draft = await c.business.execute("draft_support_ticket", { product_id: "cam-air", summary: "Pairing still fails after one safe retry." }, c.session.id) as { id: string };
  await c.business.approve(draft.id, 1, "alice");
  const results = await Promise.all(Array.from({ length: 3 }, () => c.business.execute("commit_approved_ticket", { draft_id: draft.id, version: 1 }, c.session.id)));
  assert.equal(new Set(results.map(r => (r as { id: string }).id)).size, 1);
  assert.equal(Object.keys((await c.store.read()).tickets).length, 1);
});
test("withdrawn approval blocks an already prepared tool invocation", async () => {
  const c = await context();
  const draft = await c.business.execute("draft_support_ticket", { product_id: "plug-mini", summary: "Synthetic setup failure requiring review." }, c.session.id) as { id: string };
  await c.business.approve(draft.id, 1, "alice");
  await c.business.approve(draft.id, 1, "alice", true);
  await assert.rejects(c.business.execute("commit_approved_ticket", { draft_id: draft.id, version: 1 }, c.session.id), errorCode("APPROVAL_REQUIRED"));
});
test("approval versions and cross-session draft IDs are enforced", async () => {
  const c = await context();
  const draft = await c.business.execute("draft_support_ticket", { product_id: "cam-air", summary: "Synthetic support test with exact version." }, c.session.id) as { id: string };
  await assert.rejects(c.business.approve(draft.id, 2, "alice"), errorCode("VERSION_CONFLICT"));
  const other = await c.business.createSession("alice", "demo-my");
  await assert.rejects(c.business.execute("commit_approved_ticket", { draft_id: draft.id, version: 1 }, other.session.id), errorCode("DRAFT_NOT_FOUND"));
});
test("duplicate draft requests return the same immutable version", async () => {
  const c = await context();
  const args = { product_id: "cam-air", summary: "Exact synthetic repeated draft request." };
  const a = await c.business.execute("draft_support_ticket", args, c.session.id);
  const b = await c.business.execute("draft_support_ticket", args, c.session.id);
  assert.deepEqual(a, b);
});
test("LLM consent=true is not accepted as operator evidence", async () => {
  const c = await context();
  await assert.rejects(c.business.execute("schedule_consented_followup", { consent: true, window: new Date(Date.now() + 3600000).toISOString() }, c.session.id), errorCode("TOOL_INPUT_INVALID"));
});
test("consented followups are plans only and repeated requests are idempotent", async () => {
  const c = await context();
  const consent = await c.business.recordConsent(c.session.id, "alice", "SYNTHETIC: customer explicitly agrees to a follow-up plan.");
  const args = { consent_id: consent.id, window: new Date(Date.now() + 3600000).toISOString() };
  const a = await c.business.execute("schedule_consented_followup", args, c.session.id);
  const b = await c.business.execute("schedule_consented_followup", args, c.session.id);
  assert.deepEqual(a, b);
  assert.equal((a as { status: string }).status, "planned_not_dialed");
});
test("withdrawn consent cancels plans and prevents subsequent scheduling", async () => {
  const c = await context();
  const consent = await c.business.recordConsent(c.session.id, "alice", "SYNTHETIC: agreed to a single follow-up plan.");
  const args = { consent_id: consent.id, window: new Date(Date.now() + 3600000).toISOString() };
  await c.business.execute("schedule_consented_followup", args, c.session.id);
  await c.business.withdraw(consent.id, "alice");
  await assert.rejects(c.business.execute("schedule_consented_followup", args, c.session.id), errorCode("CONSENT_REQUIRED"));
  assert.equal(Object.values((await c.store.read()).followups)[0]?.status, "cancelled");
});
test("followup scope and bounded future time are checked", async () => {
  const c = await context();
  const consent = await c.business.recordConsent(c.session.id, "alice", "SYNTHETIC: follow-up consent evidence.");
  await assert.rejects(c.business.execute("schedule_consented_followup", { consent_id: consent.id, window: new Date(Date.now() - 1000).toISOString() }, c.session.id), errorCode("WINDOW_INVALID"));
  const other = await c.business.createSession("alice", "demo-my");
  await assert.rejects(c.business.execute("schedule_consented_followup", { consent_id: consent.id, window: new Date(Date.now() + 3600000).toISOString() }, other.session.id), errorCode("CONSENT_REQUIRED"));
});
test("safe 2.4 GHz diagnosis has verifiable original source IDs", () => {
  const result = localDiagnosis("cam-air", "Cannot pair to 5 GHz Wi-Fi");
  assert.equal(result.mode, "deterministic_local");
  assert.equal(result.needs_human, false);
  assert.ok(result.source_refs.every(id => knowledge.some(k => k.id === id)));
  assert.match(result.spoken_summary, /2.4 GHz/);
});
for (const symptom of ["It is smoking", "The plug sparks", "Burning smell", "Battery overheating", "An electric shock", "Live wiring exposed"]) {
  test(`dangerous symptom is safely escalated: ${symptom}`, () => {
    const diagnosis = localDiagnosis("plug-mini", symptom);
    assert.equal(diagnosis.needs_human, true);
    assert.match(diagnosis.spoken_summary, /Do not open|qualified/);
    assert.deepEqual(diagnosis.source_refs, ["K05", "K12"]);
  });
}
test("unknown diagnosis explicitly reports uncertainty", () => {
  const result = localDiagnosis("cam-air", "An undocumented symptom with no source");
  assert.equal(result.needs_human, true); assert.ok(result.uncertainty_reason); assert.deepEqual(result.source_refs, ["K12"]);
});
test("file-backed state survives restart and serializes concurrent commits", async () => {
  const directory = await mkdtemp(join(tmpdir(), "voice-lab-"));
  try {
    const path = join(directory, "state.json"), store = new FileStore(path);
    await Promise.all(Array.from({ length: 12 }, () => store.update(state => { state.revision += 10; })));
    const reopened = new FileStore(path);
    assert.equal((await reopened.read()).revision, 132);
  } finally { await rm(directory, { recursive: true }); }
});
