import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertActiveTurnEpoch,
  evaluateAffectiveDeescalationGuard,
  evaluateAiVoiceInterviewerFairnessGuard,
  evaluateAlphanumericSlotDisambiguationGuard,
  evaluateAutomotiveEcallRoadsideGuard,
  evaluateAviationCruiseRailVoiceGuard,
  evaluateCanaryMemoryPoisoningGuard,
  evaluateCloudCcaasMigrationDecision,
  evaluateCrmCtiScreenPopSyncGuard,
  evaluateCrossBorderLogisticsGuard,
  evaluateElderlyCareFallGuardianGuard,
  evaluateEnergyEvChargingVppGuard,
  evaluateFieldAdvisorInPersonGuard,
  evaluateFmcgB2bSmartCoolerGuard,
  evaluateGamingNpcMinorSafetyGuard,
  evaluateGovUtilityEmergencyGuard,
  evaluateHospitalityPmsGuard,
  evaluateInsuranceUnderwritingEstoppelGuard,
  evaluateInterpreterPolarityHotwordGuard,
  evaluateLegalIntakeConflictNotaryGuard,
  evaluateLuxuryVicClientelingGuard,
  evaluateMediaDubbingIsochronyGuard,
  evaluateMultimodalCobrowsingSyncGuard,
  evaluateOmnichannelWalletBreakerGuard,
  evaluateOpenSourceVoiceGpuSizingGuard,
  evaluateS2sEmotionalContagionLufsGuard,
  evaluateSmartMallParkingCodeAdamGuard,
  evaluateSmartHospitalSurgicalOrGuard,
  evaluateSmartPropertyElevatorGuard,
  evaluateSocialInAppVoiceCallingGuard,
  evaluateSocraticTutorFerpaGuard,
  evaluateSpeechAccessibilityDisfluencyGuard,
  evaluateTelecomIspOutageSimSwapGuard,
  evaluateThemeParkMuseumConciergeGuard,
  evaluateTurnEpochWriteFence,
  evaluateUnifiedCommsVoiceIntegrationGuard,
  evaluateVoicePromptMarkdownSanitizerGuard,
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
      mustContain: ["70 篇", "solution-architecture.md", "azure-speech-diarization-poc.md", "benchmark-cards.html"],
    },
    {
      relPath: "docs/asset-catalog.en.md",
      mustContain: ["70 Bilingual Guides", "solution-architecture.en.md", "azure-speech-diarization-poc.en.md", "benchmark-cards.html"],
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

test("70 Enterprise Voice AI selection guides maintain 1:1 zh-CN/en parity and exclude narrow RFC bloat", async () => {
  const docEntries = await readdir(resolve(repoRoot, "docs"));
  const zhFaqFiles = docEntries.filter((f) => f.endsWith("-faq.md")).sort();
  const enFaqFiles = docEntries.filter((f) => f.endsWith("-faq.en.md")).sort();

  assert.equal(zhFaqFiles.length, 70, `Expected 70 curated zh-CN selection guides, found ${zhFaqFiles.length}`);
  assert.equal(enFaqFiles.length, 70, `Expected 70 curated English selection guides, found ${enFaqFiles.length}`);

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

  const interviewFairness = evaluateAiVoiceInterviewerFairnessGuard({
    onsetDelayMs: 2100,
    pitchVarianceHz: 5.4,
    usesCollectiveWeOnly: true,
    rawAudioPassedToJudge: false,
    lowestGroupSelectionRate: 0.34,
    highestGroupSelectionRate: 0.36,
  });
  assert.equal(interviewFairness.teleprompterPivotTriggered, true);
  assert.equal(interviewFairness.blindScoringCompliant, true);
  assert.equal(interviewFairness.eeocFourFifthsPassed, true);

  const fieldCopilot = evaluateFieldAdvisorInPersonGuard({
    twoPartyRecordingConsent: false,
    role: "pharma_sales_rep",
    advisorUtterance: "这款产品收益稳赚不赔",
    hcpOrClientUtterance: "上周有个患者服药后出现3级皮疹",
    unapprovedIndicationQuery: true,
  });
  assert.equal(fieldCopilot.storageMode, "ram_only_ephemeral_50ms_wipe");
  assert.equal(fieldCopilot.smartwatchHapticNudgeTriggered, true);
  assert.equal(fieldCopilot.offLabelCommercialBlocked, true);
  assert.equal(fieldCopilot.pvAdverseEventAutoStaged, true);

  const crossBorder = evaluateCrossBorderLogisticsGuard({
    itemCogsUsd: 4.8,
    reverseShippingPlusRestockUsd: 13.2,
    serialPhotoVerified: true,
    priorReturns180d: 0,
    requestsVerbalTelexRelease: true,
    reeferTempExcursionCelsius: 2.8,
  });
  assert.equal(crossBorder.rmaResolutionMode, "returnless_keep_it_replacement");
  assert.equal(crossBorder.netReverseShippingSavedUsd, 8.4);
  assert.equal(crossBorder.verbalTelexReleaseBlocked, true);
  assert.equal(crossBorder.reeferEmergencyDispatchTriggered, true);

  const socraticGuard = evaluateSocraticTutorFerpaGuard({
    draftTutorReply: "这道方程最终 x=7",
    secretFinalAnswerToken: "x=7",
    studentSolvedPriorSteps: false,
    callerIsParentWithoutFerpaWaiver: true,
    requestsDormRoomLocation: true,
    stutterAccommodationEnabled: true,
  });
  assert.equal(socraticGuard.spoilerAnswerStripped, true);
  assert.equal(socraticGuard.ferpaRecordAccessAllowed, false);
  assert.equal(socraticGuard.dormLocationBlocked, true);
  assert.equal(socraticGuard.effectiveSilencePatienceMs, 3200);

  const telcoGuard = evaluateTelecomIspOutageSimSwapGuard({
    activePonOltOutage: true,
    draftReplyMentionsResetPinhole: true,
    requestsVerbalSimOrEsimSwap: true,
    requestsCpniCallDetailReadout: true,
  });
  assert.equal(telcoGuard.backupHotspotDataGrantedGb, 20);
  assert.equal(telcoGuard.resetPinholeInstructionBlocked, true);
  assert.equal(telcoGuard.verbalSimSwapBlocked, true);
  assert.equal(telcoGuard.cpniCallLogReadoutBlocked, true);

  const insGuard = evaluateInsuranceUnderwritingEstoppelGuard({
    applicantHesitationPauseMs: 1680,
    draftReplyPromisesCoverageForPreExisting: true,
    pensionVerificationLowConfidence: true,
  });
  assert.equal(insGuard.icd10FollowUpTriggered, true);
  assert.equal(insGuard.estoppelCoveragePromiseBlocked, true);
  assert.equal(insGuard.pensionAutoSuspensionAllowed, false);

  const energyGuard = evaluateEnergyEvChargingVppGuard({
    chargerOutputCurrentAmps: 185,
    requestsConnectorUnlock: true,
    homeBatterySocPct: 68,
    vppTargetDischargeFloorPct: 10,
  });
  assert.equal(energyGuard.remoteConnectorUnlockAllowed, false);
  assert.equal(energyGuard.arcFlashInterlockTriggered, true);
  assert.equal(energyGuard.socReserveFloorPreservedPct, 20);

  const fmcgGuard = evaluateFmcgB2bSmartCoolerGuard({
    orderedQtyCases: 20,
    rolling30dMeanCases: 2,
    disputeAmountUsd: 1.5,
    visionConfidence: 0.74,
    loadCellMatchesSingleUnit: true,
    userClaims90d: 0,
    coolerInternalTempCelsius: 4.2,
  });
  assert.equal(fmcgGuard.uomReadbackRequired, true);
  assert.equal(fmcgGuard.instantMicroRefundApproved, true);
  assert.equal(fmcgGuard.dairyPerishableLocked, false);

  const mallGuard = evaluateSmartMallParkingCodeAdamGuard({
    plateEditDistance: 1,
    unpaidBalanceUsd: 2.0,
    tailgatingDetected: false,
    missingChildReported: true,
  });
  assert.equal(mallGuard.gateBarrierLiftApproved, true);
  assert.equal(mallGuard.deferredSmsInvoiceSent, true);
  assert.equal(mallGuard.codeAdamSilentGuardRadioTriggered, true);
  assert.equal(mallGuard.publicLoudspeakerBroadcastAllowed, false);

  const dubGuard = evaluateMediaDubbingIsochronyGuard({
    sourceWindowMs: 1820,
    predictedTargetDurationMs: 2650,
    isFrontalCloseUp: true,
    shotDurationMs: 2400,
    verbalConsentSimilarityScore: 0.995,
  });
  assert.equal(dubGuard.isochronyRewriteRequired, true);
  assert.equal(dubGuard.visualLipRedrawRequired, true);
  assert.equal(dubGuard.voiceCloneAllowed, true);

  const museumGuard = evaluateThemeParkMuseumConciergeGuard({
    uwbDistanceMeters: 0.65,
    frontalGazeDwellMs: 2400,
    approachingRideWaitMinutes: 120,
    nearbyShowEmptySeats: 180,
    visitorPromptContainsOutOfCharacterBait: true,
  });
  assert.equal(museumGuard.exhibitSwitchApproved, true);
  assert.equal(museumGuard.queueLoadBalanceIncentiveOffered, true);
  assert.equal(museumGuard.inCharacterDeflectionTriggered, true);

  const propGuard = evaluateSmartPropertyElevatorGuard({
    elevatorInDoorZone: false,
    cabinPersonCount: 2,
    passengerAttemptsToPryDoor: true,
    residentReportsBurstPipeOrGas: true,
  });
  assert.equal(propGuard.sev1EntrapmentRescueTriggered, true);
  assert.equal(propGuard.antiPryDoorWarningIssued, true);
  assert.equal(propGuard.continuousLineHoldRequired, true);
  assert.equal(propGuard.bmsSolenoidValveShutoffTriggered, true);

  const legalGuard = evaluateLegalIntakeConflictNotaryGuard({
    conflictCheckCompleted: true,
    adversePartyMatchesExistingClient: true,
    draftReplyPromisesWinOrSettlementAmount: true,
    ronFarFieldSecondaryWhisperDetected: true,
  });
  assert.equal(legalGuard.factIntakeUnlocked, false);
  assert.equal(legalGuard.conflictTaintBufferPurged, true);
  assert.equal(legalGuard.uplOpinionBlocked, true);
  assert.equal(legalGuard.ronCoercionHaltTriggered, true);

  const autoGuard = evaluateAutomotiveEcallRoadsideGuard({
    airbagDeployed: true,
    occupantSilenceMs: 8500,
    hvBatteryThermalRunaway: true,
    onHighwayShoulder: true,
    occupantsBehindGuardrail: false,
    awdEpbLocked: true,
    lv12vVoltageVolts: 12.4,
    hvSocPct: 50,
  });
  assert.equal(autoGuard.emsAutoDispatched, true);
  assert.equal(autoGuard.thermalRunawayDoorUnlockTriggered, true);
  assert.equal(autoGuard.highwayGuardrailEvacRequiredFirst, true);
  assert.equal(autoGuard.requiredTowEquipment, "FLATBED_WITH_4_WHEEL_DOLLIES");

  const elderGuard = evaluateElderlyCareFallGuardianGuard({
    torsoHeightMeters: 0.3,
    unansweredCheckInMs: 10500,
    minutesSinceLastDoseTaken: 25,
    pillboxReopened: true,
    draftReplyMentionsAlreadyToldYou: true,
  });
  assert.equal(elderGuard.fallEmergencyDispatched, true);
  assert.equal(elderGuard.matterDoorParamPinIssued, true);
  assert.equal(elderGuard.doubleDosingInterventionTriggered, true);
  assert.equal(elderGuard.impatientPhraseStripped, true);

  const hospGuard = evaluateSmartHospitalSurgicalOrGuard({
    patientSpO2Pct: 88,
    spongesDispensed: 30,
    spongesCountedPreClosure: 29,
    wristbandBarcodeScanned: true,
  });
  assert.equal(hospGuard.codeBluePreemptionTriggered, true);
  assert.equal(hospGuard.spongeDiscrepancyClosureBlocked, true);
  assert.equal(hospGuard.cArmXrayAutoOrdered, true);
  assert.equal(hospGuard.bedsideChartingAllowed, true);

  const avCruiseGuard = evaluateAviationCruiseRailVoiceGuard({
    passengerHasSevereNutAllergy: true,
    mealBatchContainsPeanutOil: true,
    cruiseCallerIsMinorWithoutAdultPin: true,
    ordersAlcoholOrCasinoChips: true,
    solasGeneralAlarmActive: true,
    inHsrQuietCar: true,
  });
  assert.equal(avCruiseGuard.allergenMealBlocked, true);
  assert.equal(avCruiseGuard.cruiseMinorAlcoholOrderBlocked, true);
  assert.equal(avCruiseGuard.solasEmergencyPreempted, true);
  assert.equal(avCruiseGuard.hsrQuietCarSpeakerMuted, true);

  const gameGuard = evaluateGamingNpcMinorSafetyGuard({
    isMinorAccount: true,
    requestsInAppPurchase: true,
    llmProposedDiscountPct: 100,
    underHeavyFire: true,
  });
  assert.equal(gameGuard.minorVoiceprintStorageAllowed, false);
  assert.equal(gameGuard.parentalFido2ApprovalRequired, true);
  assert.equal(gameGuard.clampedDiscountPct, 15);
  assert.equal(gameGuard.combatMaxReplyWords, 8);

  const affectiveGuard = evaluateAffectiveDeescalationGuard({
    customerArousalScore: 0.85,
    requestedSpeakingRate: 1.15,
    sobbingOrDysarthriaDetected: true,
    agentChannelEmotionRequested: true,
  });
  assert.equal(affectiveGuard.clampedSpeakingRate, 0.94);
  assert.equal(affectiveGuard.empathyPrePauseMs, 350);
  assert.equal(affectiveGuard.upsellPromptsSuppressed, true);
  assert.equal(affectiveGuard.workplaceAgentEmotionBlocked, true);
  assert.equal(affectiveGuard.expandedEouSilenceMs, 1800);

  const alphanumGuard = evaluateAlphanumericSlotDisambiguationGuard({
    candidateVinOrCode: "1HGCM82633A00435O",
    lowestSlotConfidence: 0.61,
    failedVoiceRepairAttempts: 2,
  });
  assert.equal(alphanumGuard.vinContainsForbiddenChars, true);
  assert.equal(alphanumGuard.natoPhoneticReadbackRequired, true);
  assert.equal(alphanumGuard.partialSlotRepairOnly, false);
  assert.equal(alphanumGuard.pivotToOutOfBandSms, true);

  const cobrowseGuard = evaluateMultimodalCobrowsingSyncGuard({
    availableBandwidthKbps: 420,
    avSkewMs: 32,
    actionViewportEpoch: 5,
    currentViewportEpoch: 6,
    scrollDriftPx: 48,
    domContainsZeroOpacityText: true,
  });
  assert.equal(cobrowseGuard.videoAvatarDroppedForAudio, true);
  assert.equal(cobrowseGuard.lipSyncWithinBroadcastBounds, true);
  assert.equal(cobrowseGuard.uiClickAllowed, false);
  assert.equal(cobrowseGuard.invisiblePromptInjectionStripped, true);

  const canaryGuard = evaluateCanaryMemoryPoisoningGuard({
    isShadowInstance: true,
    canaryP95TtfaRegressionMs: 240,
    requestedMemoryRetentionDays: 365,
  });
  assert.equal(canaryGuard.shadowWriteToolsMuted, true);
  assert.equal(canaryGuard.canaryAutoRollbackTriggered, true);
  assert.equal(canaryGuard.allowedPrivilegeFieldsInMemory, 0);
  assert.equal(canaryGuard.clampedMemoryRetentionDays, 90);

  const accessGuard = evaluateSpeechAccessibilityDisfluencyGuard({
    stutterGlottalBlockDetected: true,
    consecutiveVoiceReprompts: 2,
    lifeSafetyEmergencyDetected: true,
  });
  assert.equal(accessGuard.disfluencyEouWindowMs, 2200);
  assert.equal(accessGuard.threeStrikeHangupAllowed, false);
  assert.equal(accessGuard.rttOrKeypadFallbackOffered, true);
  assert.equal(accessGuard.zeroAuthEmergencyPreempted, true);

  const omniGuard = evaluateOmnichannelWalletBreakerGuard({
    voiceReadVersion: 14,
    currentDbVersion: 15,
    sessionAudioCostUsd: 3.1,
    outboundPromptCanaryLeaked: false,
  });
  assert.equal(omniGuard.casWriteAllowed, false);
  assert.equal(omniGuard.doubleChargeBlocked, true);
  assert.equal(omniGuard.ultrasonicLowPassCutoffHz, 8000);
  assert.equal(omniGuard.s2sWalletCircuitTripped, true);

  const s2sLufsGuard = evaluateS2sEmotionalContagionLufsGuard({
    rawOutputLufs: -7.5,
    rawOutputWpm: 205,
    trailsOnDanglingConjunctionOrPreposition: true,
  });
  assert.equal(s2sLufsGuard.clampedOutputLufs, -16.0);
  assert.equal(s2sLufsGuard.clampedOutputWpm, 165);
  assert.equal(s2sLufsGuard.syntacticHoldWindowMs, 1350);
  assert.equal(s2sLufsGuard.c2paWatermarkEmbedded, true);

  const interpGuard = evaluateInterpreterPolarityHotwordGuard({
    sourceHasNegation: true,
    targetHasNegation: false,
    sourceDosageMg: 50,
    targetDosageMg: 15,
    requestedHotwordBoost: 9.0,
    sessionTenantId: "tenant-a",
    trieOwnerTenantId: "tenant-b",
  });
  assert.equal(interpGuard.targetTtsReleaseAllowed, false);
  assert.equal(interpGuard.bilingualReadbackRequired, true);
  assert.equal(interpGuard.clampedHotwordBoostScore, 4.5);
  assert.equal(interpGuard.crossTenantLexiconBlocked, true);

  const ucGuard = evaluateUnifiedCommsVoiceIntegrationGuard({
    targetExpertPresence: "InAMeeting",
    explicitRecordingBannerShown: true,
  });
  assert.equal(ucGuard.sipBlindTransferAllowed, false);
  assert.equal(ucGuard.adaptiveCardCallbackSent, true);
  assert.equal(ucGuard.meetingBotJoinAllowed, true);
  assert.equal(ucGuard.pbrWormStreamIsolated, true);

  const socialGuard = evaluateSocialInAppVoiceCallingGuard({
    whatsappCallPermissionGranted: false,
    hasVerifiedJwtAndOrderId: true,
    webrtcPacketLossPct: 16.5,
  });
  assert.equal(socialGuard.whatsappOutboundCallAllowed, false);
  assert.equal(socialGuard.redundantIdPromptSuppressed, true);
  assert.equal(socialGuard.pstnCallbackEscapeTriggered, true);

  const crmGuard = evaluateCrmCtiScreenPopSyncGuard({
    aniMatchedContactsCount: 3,
    secondarySlotVerified: false,
    requestedCrmDbWritesPerCall: 800,
    rawCaseSummary: "Customer read card 4532 0151 1283 0366 for refund",
  });
  assert.equal(crmGuard.autoBindSingleContactAllowed, false);
  assert.equal(crmGuard.clampedCrmDbWritesPerCall, 2);
  assert.equal(crmGuard.sanitizedCaseSummary, "Customer read card [REDACTED_PAN] for refund");

  const ossGpuGuard = evaluateOpenSourceVoiceGpuSizingGuard({
    sileroVadSpeechProb: 0.04,
    modelWeightLicense: "CC-BY-NC-4.0",
    localGpuQueueWaitMs: 145,
    monthlyVoiceMinutes: 600000,
  });
  assert.equal(ossGpuGuard.silenceChunkDroppedBeforeWhisper, true);
  assert.equal(ossGpuGuard.commercialWeightsApproved, false);
  assert.equal(ossGpuGuard.cloudBurstOverflowTriggered, true);
  assert.equal(ossGpuGuard.recommendedDeploymentMode, "HYBRID_BASE_GPU_PLUS_CLOUD_BURST");

  const vpGuard = evaluateVoicePromptMarkdownSanitizerGuard({
    rawLlmOutput: "Sure, **AT&T** ships in 3-5 days via https://example.com/track",
  });
  assert.equal(
    vpGuard.sanitizedSpokenText,
    "Sure, AT&amp;T ships in 3 to 5 days via [LINK_SENT_TO_PHONE]"
  );
  assert.equal(vpGuard.urlDivertedToSmsOrCard, true);
  assert.equal(vpGuard.xmlEntitiesEscaped, true);

  const luxGuard = evaluateLuxuryVicClientelingGuard({
    callerIsRecognizedVic: true,
    queriedSkuIsQuotaLimited: true,
    draftReplyContainsDiscountSlang: true,
    dedicatedSaAssigned: true,
  });
  assert.equal(luxGuard.zeroIvrDirectGreeting, true);
  assert.equal(luxGuard.exactQuotaStockCountDisclosed, false);
  assert.equal(luxGuard.discountSlangStripped, true);
  assert.equal(luxGuard.commissionAttributedToDedicatedSa, true);
});
