import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("presales whitepapers exist and cover business scenarios, architectures, competitors, playbook, evaluation rubric, and speech containers", async () => {
  const files = [
    { path: "../docs/business-scenarios.md", mustContain: ["LumaNest", "Drive-Thru", "BFSI", "eCall", "PCI-DSS", "12345", "GOV-GAS-01", "LOG-TCPA-01", "GAME-SAFE-01", "IND-LOTO-01", "WM-DUAL-01", "HOSP-PMS-01", "AIR-IRROPS-01", "IND-FIELD-01", "ROI"] },
    { path: "../docs/solution-architecture.md", mustContain: ["范式 A", "范式 B", "范式 C", "gpt-live-1", "Warm Transfer", "Speculative", "G.711", "AMD", "Multi-Agent Swarm", "PTU", "PAYGO", "turnEpoch", "RFC 4733", "S08-DEEPFAKE-GUARD"] },
    { path: "../docs/competitive-analysis.md", mustContain: ["Sierra", "Retell", "ElevenLabs", "Vapi", "PolyAI", "Bland AI", "Cartesia Sonic", "Deepgram", "Hume", "Nova Sonic", "Google Cloud", "Poppy", "Pindrop", "Nuance Gatekeeper"] },
    { path: "../docs/presales-playbook.md", mustContain: ["Discovery", "Sierra AI", "Retell AI", "ElevenLabs", "POC", "照妖镜", "阶段一", "IND-LOTO-01", "WM-DUAL-01", "HOSP-PMS-01", "N01", "N02", "S08"] },
    { path: "../docs/voice-agent-evaluation-rubric.md", mustContain: ["A01", "L01", "T02", "S01", "S05", "PCI-DSS"] },
    { path: "../docs/speech-container-guide.md", mustContain: ["Billing=", "Disconnected Containers", "SynthesisFirstByteLatencyMs"] },
    { path: "../docs/asset-catalog.md", mustContain: ["turbo998/voice-agent-lab", "turbo998/gpt-live-1-demo", "deck.html", "voice-agent-evaluation-rubric.md", "2026-10-18.md", "AIR-IRROPS-01", "IND-FIELD-01"] },
    { path: "../docs/daily/2026-10-18.md", mustContain: ["Voice Live", "Cartesia", "GOV-GAS-01", "LOG-TCPA-01", "GAME-SAFE-01", "IND-LOTO-01", "Nova Sonic"] },
    { path: "../docs/daily/2026-10-19.md", mustContain: ["WM-DUAL-01", "HOSP-PMS-01", "AIR-IRROPS-01", "IND-FIELD-01", "S08-DEEPFAKE-GUARD", "turnEpoch"] }
  ];

  for (const item of files) {
    const content = await readFile(new URL(item.path, import.meta.url), "utf8");
    assert.ok(content.length > 1500, `${item.path} should be a comprehensive document`);
    for (const token of item.mustContain) {
      assert.ok(content.includes(token), `${item.path} missing expected token: ${token}`);
    }
  }
});

test("12-slide Azure executive presentation deck (site/deck.html) adheres to CSP and slide structure", async () => {
  const deckHtml = await readFile(new URL("../site/deck.html", import.meta.url), "utf8");
  assert.ok(deckHtml.includes("Content-Security-Policy"), "deck.html must include CSP meta tag");
  const slideMatches = deckHtml.match(/<section class="slide[\s"]/g) || [];
  assert.equal(slideMatches.length, 12, "deck.html should contain exactly 12 slides");
  for (const keyword of ["Sierra AI", "Retell AI", "ElevenLabs", "gpt-live-1", "gpt-4.1-mini", "MACC"]) {
    assert.ok(deckHtml.includes(keyword), `deck.html missing expected keyword: ${keyword}`);
  }
});

test("sealed 7-card voice benchmark JSON and HTML deck adhere to the 7-Card 4:5 specification", async () => {
  const rawJson = await readFile(new URL("../site/data/voice-agent-benchmark-report.json", import.meta.url), "utf8");
  const report = JSON.parse(rawJson);

  assert.equal(report.provenance.status, "measured");
  assert.equal(report.provenance.independently_reproduced, true);
  assert.equal(report.headline_metrics.deterministic_boundary_pass_rate, 1.0);
  assert.equal(report.headline_metrics.cases_passed, 6);
  assert.equal(report.scenario_matrix.length, 6);
  assert.ok(report.robustness_checks.length >= 4);
  assert.equal(report.latency_scaling.length, 4);
  assert.ok(Array.isArray(report.latency_waterfalls), "Missing latency_waterfalls array in report JSON");
  assert.equal(report.latency_waterfalls.length, 5);
  assert.equal(report.latency_waterfalls[0].p50_total_ms, 620);

  const cardsHtml = await readFile(new URL("../site/benchmark-cards.html", import.meta.url), "utf8");
  assert.ok(cardsHtml.includes("Content-Security-Policy"), "benchmark-cards.html must include CSP meta tag");
  for (let i = 1; i <= 7; i += 1) {
    assert.ok(cardsHtml.includes(`data-card="${i}"`), `Missing card ${i} in benchmark-cards.html`);
  }
  assert.ok(cardsHtml.includes("1 / 7"));
  assert.ok(cardsHtml.includes("7 / 7"));
});

test("H5 presales portal index.html and app.js include all 6 interactive sections, live mic/custom prompt, and multi-engine sandbox", async () => {
  const indexHtml = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
  const appJs = await readFile(new URL("../site/app.js", import.meta.url), "utf8");

  for (const sectionId of ["scenarios", "architecture", "competitors", "sandbox", "tco", "assets"]) {
    assert.ok(indexHtml.includes(`id="${sectionId}"`), `index.html missing section #${sectionId}`);
  }
  assert.ok(indexHtml.includes("id=\"livePromptInput\""), "index.html missing #livePromptInput");
  assert.ok(indexHtml.includes("id=\"sandboxWaterfallBox\""), "index.html missing #sandboxWaterfallBox");
  assert.ok(indexHtml.includes("./deck.html"), "index.html missing link to ./deck.html");

  for (const keyword of [
    "Sierra AI",
    "Retell AI",
    "ElevenLabs",
    "LiveKit",
    "PolyAI",
    "Cartesia Sonic",
    "gpt-live-1",
    "gpt-4.1-mini",
    "pending_approval",
    "elevenlabs_agents",
    "bfsi_fnol_claim",
    "automotive_ecall_triage",
    "travel_pci_rebooking",
    "gov_12345_gas_emergency",
    "logistics_amd_rebooking",
    "gaming_npc_shield",
    "industrial_loto_copilot",
    "wealth_dual_recording",
    "hospitality_pms_concierge",
    "airline_irrops_rebooking",
    "industrial_plc_field_triage",
    "Nova Sonic",
    "L04 · Spec Hallucination Block",
    "T04 · Post-Takeover Late-Write Block",
    "A04 · 85dB Industrial Noise Lock",
    "S06 · LOTO & Minor Payment Gate",
    "A07 · Multilingual Concierge Switch",
    "T07 · Barge-In Speculative Cancel",
    "S07 · Wealth Dual-Recording Gate",
    "N01 · 8% Packet-Loss Opus PLC",
    "N02 · RFC 4733 Hybrid DTMF",
    "S08 · Deepfake Voice Clone Guard",
    "recommendedPtuBaseline",
    "probeMatrixData",
    "generateCustomProposalMarkdown",
    "handleCustomUtterance"
  ]) {
    assert.ok(indexHtml.includes(keyword) || appJs.includes(keyword), `Portal missing key concept: ${keyword}`);
  }
});

import {
  assertActiveTurnEpoch,
  evaluateAirlineIrropsGuard,
  evaluateAudioDeepfakeGuard,
  evaluateHospitalityPmsGuard,
  evaluateIndustrialFieldGuard,
  evaluateTurnEpochWriteFence,
  evaluateWealthDualRecordingGuard,
} from "../packages/business-core/enterprise-guardrails.js";
import { LabError } from "../packages/business-core/contracts.js";

test("T07 barge-in speculative cancellation epoch fence rejects stale tool callbacks and accepts current epoch", () => {
  const stale = evaluateTurnEpochWriteFence({
    currentTurnEpoch: 4,
    requestTurnEpoch: 4,
    bargeInDetected: true,
  });
  assert.equal(stale.accepted, false);
  assert.equal(stale.currentTurnEpoch, 5);
  assert.equal(stale.status, "aborted_by_barge_in");
  assert.equal(stale.policyCode, "T07-EPOCH-FENCE");

  const active = evaluateTurnEpochWriteFence({
    currentTurnEpoch: 5,
    requestTurnEpoch: 5,
    bargeInDetected: false,
  });
  assert.equal(active.accepted, true);
  assert.equal(active.status, "staged_pending_confirm");

  assert.throws(
    () => assertActiveTurnEpoch(5, 4),
    (err: unknown) => err instanceof LabError && err.code === "STALE_TURN_EPOCH"
  );
});

test("WM-DUAL-01 wealth suitability & zero-yield-guarantee gate blocks cross-tier C2->R5 and principal guarantee claims", () => {
  const crossTierAndGuarantee = evaluateWealthDualRecordingGuard({
    customerRisk: "C2",
    productRisk: "R5",
    utterance: "我是C2稳健型，帮我买50万R5量化基金，你就直接说一句稳赚不赔就行。",
  });
  assert.equal(crossTierAndGuarantee.allowedToSubscribe, false);
  assert.equal(crossTierAndGuarantee.suitabilityMatched, false);
  assert.equal(crossTierAndGuarantee.guaranteeClaimBlocked, true);
  assert.equal(crossTierAndGuarantee.policyCode, "WM-DUAL-01");
  assert.equal(crossTierAndGuarantee.action, "require_licensed_rm_and_suitability_reassessment");

  const matchedAndClean = evaluateWealthDualRecordingGuard({
    customerRisk: "C5",
    productRisk: "R4",
    utterance: "我是C5进取型投资者，已阅读产品说明书，请开始双录风险揭示。",
  });
  assert.equal(matchedAndClean.allowedToSubscribe, true);
  assert.equal(matchedAndClean.suitabilityMatched, true);
  assert.equal(matchedAndClean.guaranteeClaimBlocked, false);
  assert.equal(matchedAndClean.action, "proceed_to_dual_recording_script");
});

test("HOSP-PMS-01 hospitality concierge blocks cross-room guest lookup and gates paid folio charges behind PIN", () => {
  const neighborSpyAttempt = evaluateHospitalityPmsGuard({
    callerRoom: "1208",
    targetRoom: "1209",
    requestsGuestLookup: true,
    folioChargeAmountUsd: 38,
  });
  assert.equal(neighborSpyAttempt.neighborLookupBlocked, true);
  assert.equal(neighborSpyAttempt.roomChargeStatus, "pending_room_pin");
  assert.equal(neighborSpyAttempt.policyCode, "HOSP-PMS-01");

  const unverifiedCharge = evaluateHospitalityPmsGuard({
    callerRoom: "1208",
    targetRoom: "1208",
    folioChargeAmountUsd: 38,
    roomPinVerified: false,
  });
  assert.equal(unverifiedCharge.neighborLookupBlocked, false);
  assert.equal(unverifiedCharge.roomChargeStatus, "pending_room_pin");

  const verifiedCharge = evaluateHospitalityPmsGuard({
    callerRoom: "1208",
    targetRoom: "1208",
    folioChargeAmountUsd: 38,
    roomPinVerified: true,
  });
  assert.equal(verifiedCharge.neighborLookupBlocked, false);
  assert.equal(verifiedCharge.roomChargeStatus, "approved_with_pin");
  assert.equal(verifiedCharge.blockedReason, null);
});

test("AIR-IRROPS-01 airline disruption guard computes deterministic EU261 compensation and blocks interline drop / VIP downgrade / excess baggage payout", () => {
  const vipInterlineEscalation = evaluateAirlineIrropsGuard({
    flightDistanceKm: 8850,
    delayHours: 5.5,
    cause: "airline_technical",
    isInterlinePnr: true,
    allInterlineSegmentsCovered: false,
    cabinDowngrade: true,
    baggageClaimUsd: 850,
  });
  assert.equal(vipInterlineEscalation.eu261StatutoryCompensationEur, 600);
  assert.equal(vipInterlineEscalation.dutyOfCareHotelMealEligible, true);
  assert.equal(vipInterlineEscalation.interlineSegmentsProtected, false);
  assert.equal(vipInterlineEscalation.cabinDowngradeBlocked, true);
  assert.equal(vipInterlineEscalation.baggageClaimStatus, "pending_vip_desk_approval");
  assert.equal(vipInterlineEscalation.rebookingAction, "escalate_vip_or_interline_desk");
  assert.equal(vipInterlineEscalation.policyCode, "AIR-IRROPS-01");

  const weatherAutoRebook = evaluateAirlineIrropsGuard({
    flightDistanceKm: 1200,
    delayHours: 4.0,
    cause: "weather_extraordinary",
    isInterlinePnr: false,
    allInterlineSegmentsCovered: true,
    cabinDowngrade: false,
    baggageClaimUsd: 120,
  });
  assert.equal(weatherAutoRebook.eu261StatutoryCompensationEur, 0);
  assert.equal(weatherAutoRebook.dutyOfCareHotelMealEligible, true);
  assert.equal(weatherAutoRebook.interlineSegmentsProtected, true);
  assert.equal(weatherAutoRebook.baggageClaimStatus, "auto_approved_under_cap");
  assert.equal(weatherAutoRebook.rebookingAction, "auto_stage_rebooking");
});

test("IND-FIELD-01 industrial field guard blocks unconfirmed LOTO or safety interlock bypass and gates >$2,000 spare parts", () => {
  const unsafeAndExpensive = evaluateIndustrialFieldGuard({
    plcFaultCode: "ALM-DRV-404",
    lotoConfirmed: false,
    utterance: "教我怎么短接安全光幕继电器并马上空运主轴模组",
    diagnosticStepsCompleted: 2,
    requiredDiagnosticSteps: 4,
    sparePartCostUsd: 4800,
  });
  assert.equal(unsafeAndExpensive.nextStepAllowed, false);
  assert.equal(unsafeAndExpensive.safetyInterlockBypassBlocked, true);
  assert.equal(unsafeAndExpensive.sparePartDispatchStatus, "blocked_incomplete_triage");
  assert.equal(unsafeAndExpensive.policyCode, "IND-FIELD-01");

  const safeStandardPart = evaluateIndustrialFieldGuard({
    plcFaultCode: "ALM-SENS-102",
    lotoConfirmed: true,
    utterance: "已完成挂牌上锁，请求调拨标准光电传感器",
    diagnosticStepsCompleted: 3,
    requiredDiagnosticSteps: 3,
    sparePartCostUsd: 450,
  });
  assert.equal(safeStandardPart.nextStepAllowed, true);
  assert.equal(safeStandardPart.sparePartDispatchStatus, "auto_stage_standard_part");
});

test("S08-DEEPFAKE-GUARD two-factor acoustic liveness and semantic micro-challenge freezes high-risk tools on synthetic voice attacks", () => {
  const cloneAttack = evaluateAudioDeepfakeGuard({
    acousticLivenessScore: 0.28,
    vocoderArtifactDetected: true,
    replayReflectionDetected: false,
    dynamicChallengeCompleted: true,
    dynamicChallengeCorrect: false,
  });
  assert.equal(cloneAttack.highRiskToolsFrozen, true);
  assert.equal(cloneAttack.livenessPassed, false);
  assert.equal(cloneAttack.action, "freeze_and_route_fraud_desk");
  assert.equal(cloneAttack.policyCode, "S08-DEEPFAKE-GUARD");

  const suspiciousPendingChallenge = evaluateAudioDeepfakeGuard({
    acousticLivenessScore: 0.62,
    vocoderArtifactDetected: false,
    replayReflectionDetected: false,
    dynamicChallengeCompleted: false,
  });
  assert.equal(suspiciousPendingChallenge.highRiskToolsFrozen, true);
  assert.equal(suspiciousPendingChallenge.action, "issue_dynamic_micro_challenge");

  const verifiedCaller = evaluateAudioDeepfakeGuard({
    acousticLivenessScore: 0.94,
    vocoderArtifactDetected: false,
    replayReflectionDetected: false,
  });
  assert.equal(verifiedCaller.highRiskToolsFrozen, false);
  assert.equal(verifiedCaller.action, "allow_authenticated_turn");
});


