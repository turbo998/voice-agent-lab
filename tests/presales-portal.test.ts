import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertActiveTurnEpoch,
  evaluateCloudCcaasMigrationDecision,
  evaluateGovUtilityEmergencyGuard,
  evaluateHospitalityPmsGuard,
  evaluateTurnEpochWriteFence,
  evaluateWealthDualRecordingGuard,
} from "../packages/business-core/enterprise-guardrails.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

test("bilingual READMEs, asset catalogs, and core SA whitepapers exist with clean Enterprise Voice AI framing", async () => {
  const requiredDocs: Array<{ relPath: string; mustContain: string[] }> = [
    {
      relPath: "README.md",
      mustContain: ["Enterprise Voice & Multimodal AI Lab", "docs/asset-catalog.md", "级联", "Native S2S"],
    },
    {
      relPath: "README.en.md",
      mustContain: ["Enterprise Voice & Multimodal AI Lab", "docs/asset-catalog.en.md", "Cascaded", "Native Speech-to-Speech"],
    },
    {
      relPath: "docs/asset-catalog.md",
      mustContain: ["38 篇", "solution-architecture.md", "azure-speech-diarization-poc.md", "benchmark-cards.html"],
    },
    {
      relPath: "docs/asset-catalog.en.md",
      mustContain: ["38 Bilingual Guides", "solution-architecture.en.md", "azure-speech-diarization-poc.en.md", "benchmark-cards.html"],
    },
    {
      relPath: "docs/solution-architecture.md",
      mustContain: ["Native S2S", "turnEpoch", "Warm Transfer"],
    },
    {
      relPath: "docs/solution-architecture.en.md",
      mustContain: ["Speech-to-Speech", "turnEpoch", "Cascaded"],
    },
    {
      relPath: "docs/business-scenarios.md",
      mustContain: ["ROI", "双录", "PMS"],
    },
    {
      relPath: "docs/business-scenarios.en.md",
      mustContain: ["ROI", "Dual-Recording", "TCO"],
    },
    {
      relPath: "docs/competitive-analysis.md",
      mustContain: ["Sierra", "Retell", "ElevenLabs", "Nova Sonic"],
    },
    {
      relPath: "docs/competitive-analysis.en.md",
      mustContain: ["Sierra", "Retell", "ElevenLabs", "Nova Sonic"],
    },
    {
      relPath: "docs/presales-playbook.md",
      mustContain: ["Discovery", "POC", "Sierra AI"],
    },
    {
      relPath: "docs/presales-playbook.en.md",
      mustContain: ["Discovery", "POC"],
    },
    {
      relPath: "docs/voice-agent-evaluation-rubric.md",
      mustContain: ["A01", "L01", "T02", "S01", "PCI-DSS"],
    },
    {
      relPath: "docs/speech-container-guide.md",
      mustContain: ["Billing=", "Disconnected Containers", "SynthesisFirstByteLatencyMs"],
    },
  ];

  for (const item of requiredDocs) {
    const content = await readFile(resolve(repoRoot, item.relPath), "utf8");
    for (const token of item.mustContain) {
      assert.ok(content.includes(token), `Expected ${item.relPath} to include "${token}"`);
    }
  }
});

test("38 Enterprise Voice AI selection guides maintain 1:1 zh-CN/en parity and exclude narrow RFC bloat", async () => {
  const docEntries = await readdir(resolve(repoRoot, "docs"));
  const zhFaqFiles = docEntries.filter((f) => f.endsWith("-faq.md")).sort();
  const enFaqFiles = docEntries.filter((f) => f.endsWith("-faq.en.md")).sort();

  assert.equal(zhFaqFiles.length, 38, `Expected 38 curated zh-CN selection guides, found ${zhFaqFiles.length}`);
  assert.equal(enFaqFiles.length, 38, `Expected 38 curated English selection guides, found ${enFaqFiles.length}`);

  for (const zhFile of zhFaqFiles) {
    const expectedEn = zhFile.replace(/-faq\.md$/, "-faq.en.md");
    assert.ok(enFaqFiles.includes(expectedEn), `Missing English counterpart ${expectedEn} for ${zhFile}`);
  }

  const forbiddenPatterns = [/^voice-sip-rfc/i, /^voice-webrtc-/i, /^daily$/i, /^video-explainers$/i];
  for (const entry of docEntries) {
    for (const pattern of forbiddenPatterns) {
      assert.ok(!pattern.test(entry), `Purged non-SA or narrow RFC path returned in docs/: ${entry}`);
    }
  }
});

test("all relative Markdown and SVG links across README*.md and docs/*.md resolve on disk", async () => {
  const docEntries = (await readdir(resolve(repoRoot, "docs")))
    .filter((f) => f.endsWith(".md"))
    .map((f) => resolve(repoRoot, "docs", f));
  const markdownFiles = [resolve(repoRoot, "README.md"), resolve(repoRoot, "README.en.md"), ...docEntries];
  const linkRegex = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g;

  for (const mdPath of markdownFiles) {
    const content = await readFile(mdPath, "utf8");
    for (const match of content.matchAll(linkRegex)) {
      const target = match[1];
      if (!target || /^(?:https?:|mailto:|tel:)/i.test(target)) continue;
      const targetAbs = resolve(dirname(mdPath), target);
      const targetStat = await stat(targetAbs).catch(() => null);
      assert.ok(targetStat !== null, `Broken relative link "${target}" in ${mdPath}`);
    }
  }
});

test("curated docs, SVGs, and interactive site contain zero internal Stage 3xx / P7xx-P10xx labels", async () => {
  const internalLabelRegex = /Stage\s+\d{2,3}|P(?:[7-9]\d{2}|10\d{2})\b|Topic\s+\d+/;
  const checkDirs = ["docs", "site", "assets/svg"];

  for (const relDir of checkDirs) {
    const entries = await readdir(resolve(repoRoot, relDir), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(?:md|html|js|css|svg|json)$/i.test(entry.name)) continue;
      const fullPath = resolve(repoRoot, relDir, entry.name);
      const text = await readFile(fullPath, "utf8");
      const hit = internalLabelRegex.exec(text);
      assert.equal(hit, null, `Unexpected internal stage/probe label "${hit?.[0]}" in ${relDir}/${entry.name}`);
    }
  }
});

test("interactive portal, 16:9 deck, and 7-card benchmark reports are self-contained and valid", async () => {
  const indexHtml = await readFile(resolve(repoRoot, "site/index.html"), "utf8");
  const appJs = await readFile(resolve(repoRoot, "site/app.js"), "utf8");
  const deckHtml = await readFile(resolve(repoRoot, "site/deck.html"), "utf8");
  const cardsHtml = await readFile(resolve(repoRoot, "site/benchmark-cards.html"), "utf8");
  const diarizationCardsHtml = await readFile(resolve(repoRoot, "site/diarization-benchmark-cards.html"), "utf8");
  const reportJson = JSON.parse(await readFile(resolve(repoRoot, "site/data/voice-agent-benchmark-report.json"), "utf8"));

  assert.ok(indexHtml.includes('id="duplexGuardSimulatorCard"'));
  assert.ok(appJs.includes("const DUPLEX_SIM_PROBES = ["));
  assert.ok(appJs.includes("guard_barge_in_epoch_fence"));
  assert.ok(appJs.includes("inputJson:"));
  assert.ok(appJs.includes("outputJson:"));
  assert.ok(deckHtml.includes("<html"));
  assert.ok(cardsHtml.includes("Content-Security-Policy"));
  assert.ok(diarizationCardsHtml.includes("Content-Security-Policy"));
  assert.ok(typeof reportJson === "object" && reportJson !== null);
});

test("deterministic enterprise guardrails enforce barge-in epoch fencing, wealth suitability, and hospitality PMS privacy", () => {
  const staleFence = evaluateTurnEpochWriteFence({
    currentTurnEpoch: 4,
    requestTurnEpoch: 3,
  });
  assert.equal(staleFence.accepted, false);
  assert.equal(staleFence.status, "aborted_by_barge_in");
  assert.throws(() => assertActiveTurnEpoch(4, 3), /Stale tool callback/);

  const activeFence = evaluateTurnEpochWriteFence({
    currentTurnEpoch: 4,
    requestTurnEpoch: 4,
  });
  assert.equal(activeFence.accepted, true);
  assert.equal(activeFence.status, "staged_pending_confirm");

  const blockedWealth = evaluateWealthDualRecordingGuard({
    customerRisk: "C2",
    productRisk: "R5",
    utterance: "请问这个产品稳赚不赔吗？",
  });
  assert.equal(blockedWealth.allowedToSubscribe, false);
  assert.equal(blockedWealth.suitabilityMatched, false);
  assert.equal(blockedWealth.guaranteeClaimBlocked, true);

  const compliantWealth = evaluateWealthDualRecordingGuard({
    customerRisk: "C4",
    productRisk: "R3",
    utterance: "我已了解产品净值波动风险，确认继续。",
  });
  assert.equal(compliantWealth.allowedToSubscribe, true);
  assert.equal(compliantWealth.action, "proceed_to_dual_recording_script");

  const crossRoomBlocked = evaluateHospitalityPmsGuard({
    callerRoom: "1208",
    targetRoom: "1502",
    requestsGuestLookup: true,
  });
  assert.equal(crossRoomBlocked.neighborLookupBlocked, true);

  const verifiedFolio = evaluateHospitalityPmsGuard({
    callerRoom: "1208",
    targetRoom: "1208",
    folioChargeAmountUsd: 48,
    roomPinVerified: true,
  });
  assert.equal(verifiedFolio.neighborLookupBlocked, false);
  assert.equal(verifiedFolio.roomChargeStatus, "approved_with_pin");

  const ccaasOverlay = evaluateCloudCcaasMigrationDecision({
    monthlyVoiceMinutes: 1000000,
    existingLegacySeats: 1000,
    legacyAudioHookExportFeePerMinUsd: 0.036,
    deflectionRatePct: 68,
  });
  assert.equal(ccaasOverlay.recommendedArchitecture, "front_door_sbc_azure_voice_live_overlay");
  assert.equal(ccaasOverlay.annualAudioHookTaxAvoidedUsd, 432000);
  assert.equal(ccaasOverlay.signedSipUuiScreenPopRequired, true);

  const gasPreempt = evaluateGovUtilityEmergencyGuard({
    utterance: "我家厨房有很浓的煤气臭鸡蛋味",
    medicalBaselineHousehold: true,
  });
  assert.equal(gasPreempt.hazardPreemptionTriggered, true);
  assert.equal(gasPreempt.antiSparkWarningRequired, true);
  assert.equal(gasPreempt.action, "preempt_0ms_anti_spark_warning_and_bridge_emergency_desk");
});
