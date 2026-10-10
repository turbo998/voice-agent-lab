import assert from "node:assert/strict";
import { Business, localDiagnosis } from "../apps/retell-demo/server/business.js";
import { MemoryStore } from "../apps/retell-demo/server/store.js";
import { LabError } from "../packages/business-core/contracts.js";
import { knowledge } from "../packages/business-core/fixtures.js";

const business = new Business(new MemoryStore());
const { session } = await business.createSession("synthetic-evaluator", "demo-sg");
const errorCode = (code: string) => (error: unknown) => error instanceof LabError && error.code === code;
const cases: Array<{ id: string; check: () => void | Promise<void> }> = [
  {
    id: "pairing-grounded",
    check: () => {
      const result = localDiagnosis("cam-air", "Cannot pair to 5 GHz Wi-Fi");
      assert.equal(result.mode, "deterministic_local");
      assert.equal(result.needs_human, false);
      assert.match(result.spoken_summary, /2.4 GHz/);
      assert.ok(result.source_refs.length > 0);
      assert.ok(result.source_refs.every(id => knowledge.some(doc => doc.id === id)));
    },
  },
  {
    id: "electrical-escalation",
    check: () => {
      for (const symptom of ["smoking", "sparks", "burning smell", "electric shock"]) {
        const result = localDiagnosis("plug-mini", symptom);
        assert.equal(result.needs_human, true);
        assert.deepEqual(result.source_refs, ["K05", "K12"]);
        assert.match(result.spoken_summary, /Do not open|qualified/);
      }
    },
  },
  {
    id: "unknown-no-fabrication",
    check: () => {
      const result = localDiagnosis("cam-air", "Undocumented synthetic symptom");
      assert.equal(result.needs_human, true);
      assert.ok(result.uncertainty_reason);
    },
  },
  {
    id: "cross-customer-denied",
    check: () => assert.rejects(business.execute("get_order_status",
      { order_id: "LN-MY-2001" }, session.id), errorCode("ORDER_NOT_FOUND")),
  },
  {
    id: "operator-approval-idempotency",
    check: async () => {
      const result = await business.execute("draft_support_ticket",
        { product_id: "cam-air", summary: "Synthetic pairing issue remains after one safe retry." }, session.id);
      const draft = result as { id: string; version: number };
      await assert.rejects(business.execute("commit_approved_ticket",
        { draft_id: draft.id, version: draft.version }, session.id), errorCode("APPROVAL_REQUIRED"));
      await business.approve(draft.id, draft.version, "synthetic-evaluator");
      const args = { draft_id: draft.id, version: draft.version };
      assert.deepEqual(await business.execute("commit_approved_ticket", args, session.id),
        await business.execute("commit_approved_ticket", args, session.id));
    },
  },
  {
    id: "consent-withdrawal-no-dialing",
    check: async () => {
      const consent = await business.recordConsent(session.id, "synthetic-evaluator",
        "SYNTHETIC: a follow-up plan is explicitly authorized.");
      const args = { consent_id: consent.id, window: new Date(Date.now() + 3_600_000).toISOString() };
      const plan = await business.execute("schedule_consented_followup", args, session.id) as { status: string };
      assert.equal(plan.status, "planned_not_dialed");
      await business.withdraw(consent.id, "synthetic-evaluator");
      await assert.rejects(business.execute("schedule_consented_followup", args, session.id),
        errorCode("CONSENT_REQUIRED"));
    },
  },
];
const results: Array<{ id: string; passed: boolean }> = [];
for (const item of cases) {
  try {
    await item.check();
    results.push({ id: item.id, passed: true });
  } catch (error) {
    results.push({ id: item.id, passed: false });
    console.error(JSON.stringify({ evaluationFailed: item.id,
      error: error instanceof LabError ? error.code : error instanceof Error ? error.name : "UNKNOWN" }));
  }
}
const passed = results.filter(result => result.passed).length;
console.log(JSON.stringify({ mode: "deterministic_synthetic_offline", humanAudio: false,
  providerCalls: 0, total: results.length, passed, results }, null, 2));
if (passed !== results.length) process.exitCode = 1;
