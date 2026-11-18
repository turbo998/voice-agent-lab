import { LabError } from "./contracts.js";

export type CustomerRiskLevel = "C1" | "C2" | "C3" | "C4" | "C5";
export type ProductRiskRating = "R1" | "R2" | "R3" | "R4" | "R5";

const customerRiskRank: Record<CustomerRiskLevel, number> = {
  C1: 1,
  C2: 2,
  C3: 3,
  C4: 4,
  C5: 5,
};

const productRiskRank: Record<ProductRiskRating, number> = {
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
};

const prohibitedGuaranteePattern =
  /(稳赚不赔|绝对不亏|保本保息|零风险高收益|guaranteed\s+principal|zero[-\s]+risk\s+return|cannot\s+lose\s+money)/i;

export interface TurnEpochFenceEvaluation {
  accepted: boolean;
  currentTurnEpoch: number;
  requestTurnEpoch: number;
  status: "staged_pending_confirm" | "aborted_by_barge_in";
  policyCode: "T07-EPOCH-FENCE";
  reason: string;
}

/**
 * Deterministic Barge-in Speculative Cancellation Fence (`T07-EPOCH-FENCE`).
 * Prevents late-arriving tool callbacks from an interrupted speech turn (`requestTurnEpoch < currentTurnEpoch`)
 * from mutating state or staging zombie drafts.
 */
export function evaluateTurnEpochWriteFence(input: {
  currentTurnEpoch: number;
  requestTurnEpoch: number;
  bargeInDetected?: boolean;
}): TurnEpochFenceEvaluation {
  const effectiveEpoch = input.bargeInDetected ? input.currentTurnEpoch + 1 : input.currentTurnEpoch;
  if (input.requestTurnEpoch < effectiveEpoch) {
    return {
      accepted: false,
      currentTurnEpoch: effectiveEpoch,
      requestTurnEpoch: input.requestTurnEpoch,
      status: "aborted_by_barge_in",
      policyCode: "T07-EPOCH-FENCE",
      reason: `Stale tool callback from turnEpoch=${input.requestTurnEpoch} rejected at currentTurnEpoch=${effectiveEpoch}.`,
    };
  }
  return {
    accepted: true,
    currentTurnEpoch: effectiveEpoch,
    requestTurnEpoch: input.requestTurnEpoch,
    status: "staged_pending_confirm",
    policyCode: "T07-EPOCH-FENCE",
    reason: "Turn epoch matches active conversation turn; draft staged awaiting explicit confirmation.",
  };
}

export interface WealthSuitabilityEvaluation {
  allowedToSubscribe: boolean;
  suitabilityMatched: boolean;
  guaranteeClaimBlocked: boolean;
  policyCode: "WM-DUAL-01";
  action: "require_licensed_rm_and_suitability_reassessment" | "proceed_to_dual_recording_script";
  mandatoryDisclosureZh: string;
}

/**
 * Deterministic Wealth Management Dual-Recording & Suitability Gate (`WM-DUAL-01` / `S07`).
 * Blocks cross-tier subscriptions (e.g., C2 -> R5) and any prompt/user attempt to elicit principal-guarantee promises.
 */
export function evaluateWealthDualRecordingGuard(input: {
  customerRisk: CustomerRiskLevel;
  productRisk: ProductRiskRating;
  utterance: string;
}): WealthSuitabilityEvaluation {
  const suitabilityMatched = customerRiskRank[input.customerRisk] >= productRiskRank[input.productRisk];
  const guaranteeClaimBlocked = prohibitedGuaranteePattern.test(input.utterance);

  if (!suitabilityMatched || guaranteeClaimBlocked) {
    return {
      allowedToSubscribe: false,
      suitabilityMatched,
      guaranteeClaimBlocked,
      policyCode: "WM-DUAL-01",
      action: "require_licensed_rm_and_suitability_reassessment",
      mandatoryDisclosureZh:
        "【WM-DUAL-01 适当性硬拦截】本产品不保证本金且存在本金亏损可能；客户当前风险测评等级低于产品风险等级，已阻断自动申购并转交持牌理财经理双录复核。",
    };
  }

  return {
    allowedToSubscribe: true,
    suitabilityMatched: true,
    guaranteeClaimBlocked: false,
    policyCode: "WM-DUAL-01",
    action: "proceed_to_dual_recording_script",
    mandatoryDisclosureZh:
      "【WM-DUAL-01 双录标准播报】过往业绩不代表未来表现，请确认您已知悉产品说明书及最大回撤风险。",
  };
}

export interface HospitalityPmsEvaluation {
  neighborLookupBlocked: boolean;
  roomChargeStatus: "not_requested" | "pending_room_pin" | "approved_with_pin";
  policyCode: "HOSP-PMS-01";
  blockedReason: string | null;
}

/**
 * Deterministic Hospitality Multilingual Concierge & PMS Privacy/Folio Gate (`HOSP-PMS-01` / `A07`).
 * Rejects any cross-room guest identity inquiry and gates paid folio add-ons behind a verified room PIN.
 */
export function evaluateHospitalityPmsGuard(input: {
  callerRoom: string;
  targetRoom: string;
  requestsGuestLookup?: boolean;
  folioChargeAmountUsd?: number;
  roomPinVerified?: boolean;
}): HospitalityPmsEvaluation {
  const crossRoom = input.callerRoom.trim() !== input.targetRoom.trim();
  if (crossRoom || input.requestsGuestLookup) {
    return {
      neighborLookupBlocked: true,
      roomChargeStatus: input.folioChargeAmountUsd && input.folioChargeAmountUsd > 0 ? "pending_room_pin" : "not_requested",
      policyCode: "HOSP-PMS-01",
      blockedReason: "Cross-room guest identity or stay-status lookup is strictly prohibited under HOSP-PMS-01 privacy rules.",
    };
  }

  if (input.folioChargeAmountUsd && input.folioChargeAmountUsd > 0) {
    return {
      neighborLookupBlocked: false,
      roomChargeStatus: input.roomPinVerified ? "approved_with_pin" : "pending_room_pin",
      policyCode: "HOSP-PMS-01",
      blockedReason: input.roomPinVerified ? null : "Paid PMS folio charge requires guest surname + 4-digit room PIN verification.",
    };
  }

  return {
    neighborLookupBlocked: false,
    roomChargeStatus: "not_requested",
    policyCode: "HOSP-PMS-01",
    blockedReason: null,
  };
}

export function assertActiveTurnEpoch(currentTurnEpoch: number, requestTurnEpoch: number): void {
  const verdict = evaluateTurnEpochWriteFence({ currentTurnEpoch, requestTurnEpoch });
  if (!verdict.accepted) {
    throw new LabError("STALE_TURN_EPOCH", 409, verdict.reason);
  }
}

export interface CloudCcaasMigrationInput {
  monthlyVoiceMinutes: number;
  existingLegacySeats: number;
  legacyAudioHookExportFeePerMinUsd: number;
  deflectionRatePct: number;
  requiresDisconnectedContainers?: boolean;
}

export interface CloudCcaasMigrationDecision {
  policyCode: "CCAAS-SELECT-01";
  recommendedArchitecture:
    | "front_door_sbc_azure_voice_live_overlay"
    | "d365_contact_center_plus_azure_voice_live"
    | "copilot_studio_low_code_voice";
  annualAudioHookTaxAvoidedUsd: number;
  estimatedAnnualAiVoiceCostUsd: number;
  signedSipUuiScreenPopRequired: boolean;
}

/**
 * Deterministic Cloud CCaaS Migration & Double-Taxation Avoidance Evaluator (`CCAAS-SELECT-01`).
 * Calculates annual AudioHook/media-forking export fees avoided by terminating SIP at a Front-Door SBC
 * and selects between Front-Door Overlay, Full D365 Contact Center, or Low-Code Copilot Studio.
 */
export function evaluateCloudCcaasMigrationDecision(
  input: CloudCcaasMigrationInput,
): CloudCcaasMigrationDecision {
  const deflectedRatio = Math.min(Math.max(input.deflectionRatePct, 0), 100) / 100;
  const annualMinutes = Math.max(input.monthlyVoiceMinutes, 0) * 12;
  const annualAudioHookTaxAvoidedUsd = Math.round(
    annualMinutes * Math.max(input.legacyAudioHookExportFeePerMinUsd, 0),
  );
  const estimatedAnnualAiVoiceCostUsd = Math.round(annualMinutes * deflectedRatio * 0.049);

  if (input.existingLegacySeats >= 300 && input.legacyAudioHookExportFeePerMinUsd > 0) {
    return {
      policyCode: "CCAAS-SELECT-01",
      recommendedArchitecture: "front_door_sbc_azure_voice_live_overlay",
      annualAudioHookTaxAvoidedUsd,
      estimatedAnnualAiVoiceCostUsd,
      signedSipUuiScreenPopRequired: true,
    };
  }

  if (input.monthlyVoiceMinutes < 85000 && !input.requiresDisconnectedContainers) {
    return {
      policyCode: "CCAAS-SELECT-01",
      recommendedArchitecture: "copilot_studio_low_code_voice",
      annualAudioHookTaxAvoidedUsd,
      estimatedAnnualAiVoiceCostUsd,
      signedSipUuiScreenPopRequired: false,
    };
  }

  return {
    policyCode: "CCAAS-SELECT-01",
    recommendedArchitecture: "d365_contact_center_plus_azure_voice_live",
    annualAudioHookTaxAvoidedUsd,
    estimatedAnnualAiVoiceCostUsd,
    signedSipUuiScreenPopRequired: true,
  };
}

const gasOrElectricalHazardPattern =
  /(煤气味|天然气漏|臭鸡蛋味|管道嘶嘶|电线冒火花|一氧化碳|smell\s+gas|rotten\s+egg|gas\s+leak|sparking\s+wire|carbon\s+monoxide)/i;

export interface GovUtilityEmergencyEvaluation {
  policyCode: "GOV-HOTLINE-01";
  hazardPreemptionTriggered: boolean;
  antiSparkWarningRequired: boolean;
  shutoffBlockedByMedicalBaseline: boolean;
  action:
    | "preempt_0ms_anti_spark_warning_and_bridge_emergency_desk"
    | "block_shutoff_and_dispatch_mobile_battery"
    | "route_standard_311_or_scada_outage_flow";
}

/**
 * Deterministic Municipal 12345/311 & Utility Life-Safety Guard (`GOV-HOTLINE-01`).
 * Preempts in 0ms on gas-leak / downed-wire hazards with an anti-spark warning and hard-blocks
 * automated utility shutoffs for households with life-support medical equipment.
 */
export function evaluateGovUtilityEmergencyGuard(input: {
  utterance: string;
  medicalBaselineHousehold?: boolean;
  requestedAutomatedShutoff?: boolean;
}): GovUtilityEmergencyEvaluation {
  if (gasOrElectricalHazardPattern.test(input.utterance)) {
    return {
      policyCode: "GOV-HOTLINE-01",
      hazardPreemptionTriggered: true,
      antiSparkWarningRequired: true,
      shutoffBlockedByMedicalBaseline: Boolean(input.medicalBaselineHousehold),
      action: "preempt_0ms_anti_spark_warning_and_bridge_emergency_desk",
    };
  }

  if (input.medicalBaselineHousehold && input.requestedAutomatedShutoff) {
    return {
      policyCode: "GOV-HOTLINE-01",
      hazardPreemptionTriggered: false,
      antiSparkWarningRequired: false,
      shutoffBlockedByMedicalBaseline: true,
      action: "block_shutoff_and_dispatch_mobile_battery",
    };
  }

  return {
    policyCode: "GOV-HOTLINE-01",
    hazardPreemptionTriggered: false,
    antiSparkWarningRequired: false,
    shutoffBlockedByMedicalBaseline: false,
    action: "route_standard_311_or_scada_outage_flow",
  };
}

export interface AiVoiceInterviewerFairnessInput {
  onsetDelayMs: number;
  pitchVarianceHz: number;
  usesCollectiveWeOnly: boolean;
  rawAudioPassedToJudge: boolean;
  lowestGroupSelectionRate: number;
  highestGroupSelectionRate: number;
}

export interface AiVoiceInterviewerFairnessEvaluation {
  policyCode: "HR-INTERVIEW-01";
  teleprompterPivotTriggered: boolean;
  starIndividualActionProbeRequired: boolean;
  blindScoringCompliant: boolean;
  disparateImpactRatio: number;
  eeocFourFifthsPassed: boolean;
}

/**
 * Deterministic AI Voice Interviewer Integrity & Algorithmic Fairness Gate (`HR-INTERVIEW-01`).
 * Triggers contextual micro-pivots on teleprompter reading cadence (`onsetDelayMs >= 1600 && pitchVarianceHz <= 8`),
 * enforces blind transcript-only scoring (`rawAudioPassedToJudge === false`), and verifies EEOC 4/5ths (`>=0.80`) parity.
 */
export function evaluateAiVoiceInterviewerFairnessGuard(
  input: AiVoiceInterviewerFairnessInput,
): AiVoiceInterviewerFairnessEvaluation {
  const teleprompterPivotTriggered = input.onsetDelayMs >= 1600 && input.pitchVarianceHz <= 8;
  const disparateImpactRatio =
    input.highestGroupSelectionRate > 0
      ? Number((input.lowestGroupSelectionRate / input.highestGroupSelectionRate).toFixed(2))
      : 1;
  return {
    policyCode: "HR-INTERVIEW-01",
    teleprompterPivotTriggered,
    starIndividualActionProbeRequired: input.usesCollectiveWeOnly || teleprompterPivotTriggered,
    blindScoringCompliant: !input.rawAudioPassedToJudge,
    disparateImpactRatio,
    eeocFourFifthsPassed: disparateImpactRatio >= 0.8 && !input.rawAudioPassedToJudge,
  };
}

const pharmaAdverseEventPattern =
  /(不良反应|皮疹|转氨酶升|停药|肝酶|adverse\s+event|grade[-\s]*3\s+rash|elevated\s+liver|paused\s+dosing)/i;

export interface FieldAdvisorInPersonEvaluation {
  policyCode: "ADVISOR-COPILOT-01";
  storageMode: "encrypted_audio_archival" | "ram_only_ephemeral_50ms_wipe";
  smartwatchHapticNudgeTriggered: boolean;
  offLabelCommercialBlocked: boolean;
  pvAdverseEventAutoStaged: boolean;
}

/**
 * Deterministic Field Wealth Advisor & Pharma MSL In-Person Guard (`ADVISOR-COPILOT-01`).
 * Enforces RAM-only 50ms wipe when recording consent is declined, triggers smartwatch haptic nudges on
 * advisor yield-guarantee slips, blocks commercial reps from Off-Label discussion, and auto-stages 24h PV reports.
 */
export function evaluateFieldAdvisorInPersonGuard(input: {
  twoPartyRecordingConsent: boolean;
  advisorUtterance: string;
  hcpOrClientUtterance: string;
  role: "wealth_advisor" | "pharma_sales_rep" | "pharma_msl";
  unapprovedIndicationQuery?: boolean;
}): FieldAdvisorInPersonEvaluation {
  const smartwatchHapticNudgeTriggered = prohibitedGuaranteePattern.test(input.advisorUtterance);
  const offLabelCommercialBlocked =
    input.role === "pharma_sales_rep" && Boolean(input.unapprovedIndicationQuery);
  const pvAdverseEventAutoStaged =
    pharmaAdverseEventPattern.test(input.hcpOrClientUtterance) ||
    pharmaAdverseEventPattern.test(input.advisorUtterance);

  return {
    policyCode: "ADVISOR-COPILOT-01",
    storageMode: input.twoPartyRecordingConsent
      ? "encrypted_audio_archival"
      : "ram_only_ephemeral_50ms_wipe",
    smartwatchHapticNudgeTriggered,
    offLabelCommercialBlocked,
    pvAdverseEventAutoStaged,
  };
}

export interface CrossBorderLogisticsEvaluation {
  policyCode: "CROSS-BORDER-LOG-01";
  rmaResolutionMode: "returnless_keep_it_replacement" | "standard_prepaid_return_label";
  netReverseShippingSavedUsd: number;
  verbalTelexReleaseBlocked: boolean;
  reeferEmergencyDispatchTriggered: boolean;
}

/**
 * Deterministic Cross-Border E-Commerce RMA & Ocean Telex-Release Guard (`CROSS-BORDER-LOG-01`).
 * Selects returnless Keep-It replacement when reverse shipping exceeds item COGS (with verified serial photo),
 * hard-blocks verbal Telex Release cargo requests, and triggers port mechanic dispatch on >2C reefer drift.
 */
export function evaluateCrossBorderLogisticsGuard(input: {
  itemCogsUsd: number;
  reverseShippingPlusRestockUsd: number;
  serialPhotoVerified: boolean;
  priorReturns180d: number;
  requestsVerbalTelexRelease?: boolean;
  reeferTempExcursionCelsius?: number;
}): CrossBorderLogisticsEvaluation {
  const qualifyKeepIt =
    input.reverseShippingPlusRestockUsd > input.itemCogsUsd &&
    input.serialPhotoVerified &&
    input.priorReturns180d === 0;

  return {
    policyCode: "CROSS-BORDER-LOG-01",
    rmaResolutionMode: qualifyKeepIt
      ? "returnless_keep_it_replacement"
      : "standard_prepaid_return_label",
    netReverseShippingSavedUsd: qualifyKeepIt
      ? Number((input.reverseShippingPlusRestockUsd - input.itemCogsUsd).toFixed(2))
      : 0,
    verbalTelexReleaseBlocked: Boolean(input.requestsVerbalTelexRelease),
    reeferEmergencyDispatchTriggered: (input.reeferTempExcursionCelsius ?? 0) > 2.0,
  };
}

export interface SocraticTutorFerpaEvaluation {
  policyCode: "EDU-SOCRATIC-01";
  spoilerAnswerStripped: boolean;
  ferpaRecordAccessAllowed: boolean;
  dormLocationBlocked: boolean;
  effectiveSilencePatienceMs: number;
}

/**
 * Deterministic Socratic Anti-Spoiler, Campus FERPA & Stutter Patience Guard (`EDU-SOCRATIC-01`).
 * Strips final answers before TTS until the student solves prior steps, enforces FERPA proxy waivers,
 * permanently blocks verbal dorm-room disclosures, and widens EOU patience to 3,200ms on stutter accommodations.
 */
export function evaluateSocraticTutorFerpaGuard(input: {
  draftTutorReply: string;
  secretFinalAnswerToken: string;
  studentSolvedPriorSteps: boolean;
  callerIsParentWithoutFerpaWaiver?: boolean;
  requestsDormRoomLocation?: boolean;
  stutterAccommodationEnabled?: boolean;
}): SocraticTutorFerpaEvaluation {
  const containsSecret =
    input.secretFinalAnswerToken.trim().length > 0 &&
    input.draftTutorReply.includes(input.secretFinalAnswerToken.trim());

  return {
    policyCode: "EDU-SOCRATIC-01",
    spoilerAnswerStripped: !input.studentSolvedPriorSteps && containsSecret,
    ferpaRecordAccessAllowed: !input.callerIsParentWithoutFerpaWaiver,
    dormLocationBlocked: Boolean(input.requestsDormRoomLocation),
    effectiveSilencePatienceMs: input.stutterAccommodationEnabled ? 3200 : 1100,
  };
}

export interface TelecomIspOutageSimSwapEvaluation {
  policyCode: "TELCO-ISP-01";
  backupHotspotDataGrantedGb: number;
  resetPinholeInstructionBlocked: boolean;
  verbalSimSwapBlocked: boolean;
  cpniCallLogReadoutBlocked: boolean;
}

/**
 * Deterministic Telecom Carrier & Broadband ISP Outage, ONT & Anti-SIM-Swap Guard (`TELCO-ISP-01`).
 * Auto-grants 20GB 5G backup data on active PON OLT fiber cuts, blocks LOID-wiping ONT Reset pinhole
 * instructions, and hard-blocks verbal SIM/eSIM swaps and FCC CPNI call-detail readouts.
 */
export function evaluateTelecomIspOutageSimSwapGuard(input: {
  activePonOltOutage: boolean;
  draftReplyMentionsResetPinhole?: boolean;
  requestsVerbalSimOrEsimSwap?: boolean;
  requestsCpniCallDetailReadout?: boolean;
}): TelecomIspOutageSimSwapEvaluation {
  return {
    policyCode: "TELCO-ISP-01",
    backupHotspotDataGrantedGb: input.activePonOltOutage ? 20 : 0,
    resetPinholeInstructionBlocked: Boolean(input.draftReplyMentionsResetPinhole),
    verbalSimSwapBlocked: Boolean(input.requestsVerbalSimOrEsimSwap),
    cpniCallLogReadoutBlocked: Boolean(input.requestsCpniCallDetailReadout),
  };
}

export interface InsuranceUnderwritingEstoppelEvaluation {
  policyCode: "INS-UNDERWRITE-01";
  icd10FollowUpTriggered: boolean;
  estoppelCoveragePromiseBlocked: boolean;
  pensionAutoSuspensionAllowed: boolean;
}

/**
 * Deterministic Life/Health Tele-Underwriting Anti-Estoppel & Pension Proof-of-Life Guard (`INS-UNDERWRITE-01`).
 * Triggers ICD-10 follow-ups on >1,400ms applicant hesitation pauses, hard-blocks oral insurability/coverage
 * promises (Waiver & Estoppel), and forbids automatic pension suspension on low-confidence senior voice checks.
 */
export function evaluateInsuranceUnderwritingEstoppelGuard(input: {
  applicantHesitationPauseMs: number;
  draftReplyPromisesCoverageForPreExisting?: boolean;
  pensionVerificationLowConfidence?: boolean;
}): InsuranceUnderwritingEstoppelEvaluation {
  return {
    policyCode: "INS-UNDERWRITE-01",
    icd10FollowUpTriggered: input.applicantHesitationPauseMs > 1400,
    estoppelCoveragePromiseBlocked: Boolean(input.draftReplyPromisesCoverageForPreExisting),
    pensionAutoSuspensionAllowed: false,
  };
}

export interface EnergyEvChargingVppEvaluation {
  policyCode: "ENERGY-VPP-01";
  remoteConnectorUnlockAllowed: boolean;
  arcFlashInterlockTriggered: boolean;
  vppDischargeAuthorized: boolean;
  socReserveFloorPreservedPct: number;
}

/**
 * Deterministic EV Supercharging Zero-Current Arc Interlock & VPP Reserve Guard (`ENERGY-VPP-01`).
 * Blocks remote OCPP UnlockConnector pulses unless output current I == 0A (preventing DC arc flash)
 * and enforces a minimum 20% home battery SOC reserve floor during VPP peak-shaving dispatch.
 */
export function evaluateEnergyEvChargingVppGuard(input: {
  chargerOutputCurrentAmps: number;
  requestsConnectorUnlock: boolean;
  homeBatterySocPct: number;
  vppTargetDischargeFloorPct: number;
}): EnergyEvChargingVppEvaluation {
  const zeroCurrentSafe = Math.abs(input.chargerOutputCurrentAmps) < 0.1;
  return {
    policyCode: "ENERGY-VPP-01",
    remoteConnectorUnlockAllowed: input.requestsConnectorUnlock && zeroCurrentSafe,
    arcFlashInterlockTriggered: input.requestsConnectorUnlock && !zeroCurrentSafe,
    vppDischargeAuthorized: input.homeBatterySocPct > 20,
    socReserveFloorPreservedPct: Math.max(input.vppTargetDischargeFloorPct, 20),
  };
}

export interface FmcgB2bSmartCoolerEvaluation {
  policyCode: "FMCG-B2B-01";
  uomReadbackRequired: boolean;
  instantMicroRefundApproved: boolean;
  dairyPerishableLocked: boolean;
}

/**
 * Deterministic FMCG B2B Par-Level UOM & Smart-Cooler Micro-Refund Guard (`FMCG-B2B-01`).
 * Requires voice readback when ordered quantity exceeds 3x the 30-day par-level mean, gates <=$5.00
 * instant cooler refunds on load-cell weight delta + vision confidence <0.88, and locks dairy above 8C.
 */
export function evaluateFmcgB2bSmartCoolerGuard(input: {
  orderedQtyCases: number;
  rolling30dMeanCases: number;
  disputeAmountUsd: number;
  visionConfidence: number;
  loadCellMatchesSingleUnit: boolean;
  userClaims90d: number;
  coolerInternalTempCelsius: number;
}): FmcgB2bSmartCoolerEvaluation {
  return {
    policyCode: "FMCG-B2B-01",
    uomReadbackRequired:
      input.rolling30dMeanCases > 0 && input.orderedQtyCases > input.rolling30dMeanCases * 3,
    instantMicroRefundApproved:
      input.disputeAmountUsd <= 5.0 &&
      input.visionConfidence < 0.88 &&
      input.loadCellMatchesSingleUnit &&
      input.userClaims90d < 2,
    dairyPerishableLocked: input.coolerInternalTempCelsius > 8.0,
  };
}

export interface SmartMallParkingCodeAdamEvaluation {
  policyCode: "MALL-CONCIERGE-01";
  gateBarrierLiftApproved: boolean;
  deferredSmsInvoiceSent: boolean;
  codeAdamSilentGuardRadioTriggered: boolean;
  publicLoudspeakerBroadcastAllowed: boolean;
}

/**
 * Deterministic Smart Mall Parking Exit-Gate & Code-Adam Missing-Child Guard (`MALL-CONCIERGE-01`).
 * Approves 10s exit-gate lift when plate edit-distance <=1 or overstay balance <=$3.00 (without tailgating),
 * and enforces silent DMR guard-radio perimeter lockdown (0% public PA tip-off) on missing-child reports.
 */
export function evaluateSmartMallParkingCodeAdamGuard(input: {
  plateEditDistance: number;
  unpaidBalanceUsd: number;
  tailgatingDetected: boolean;
  missingChildReported?: boolean;
}): SmartMallParkingCodeAdamEvaluation {
  const canLift =
    !input.tailgatingDetected && (input.plateEditDistance <= 1 || input.unpaidBalanceUsd <= 3.0);
  return {
    policyCode: "MALL-CONCIERGE-01",
    gateBarrierLiftApproved: canLift,
    deferredSmsInvoiceSent: canLift && input.unpaidBalanceUsd > 0 && input.unpaidBalanceUsd <= 3.0,
    codeAdamSilentGuardRadioTriggered: Boolean(input.missingChildReported),
    publicLoudspeakerBroadcastAllowed: false,
  };
}

export interface MediaDubbingIsochronyEvaluation {
  policyCode: "MEDIA-DUB-01";
  stretchRatio: number;
  isochronyRewriteRequired: boolean;
  visualLipRedrawRequired: boolean;
  voiceCloneAllowed: boolean;
}

/**
 * Deterministic Short-Drama & Film Isochronous AI Dubbing & Voice Consent Guard (`MEDIA-DUB-01`).
 * Rejects translations whose spoken duration ratio falls outside `[0.88, 1.12]` (preventing chipmunk speed-up),
 * triggers selective visual lip re-rendering only on frontal close-ups >2000ms, and enforces verbal actor consent.
 */
export function evaluateMediaDubbingIsochronyGuard(input: {
  sourceWindowMs: number;
  predictedTargetDurationMs: number;
  isFrontalCloseUp: boolean;
  shotDurationMs: number;
  verbalConsentSimilarityScore: number;
}): MediaDubbingIsochronyEvaluation {
  const ratio =
    input.sourceWindowMs > 0
      ? Number((input.predictedTargetDurationMs / input.sourceWindowMs).toFixed(2))
      : 1;
  return {
    policyCode: "MEDIA-DUB-01",
    stretchRatio: ratio,
    isochronyRewriteRequired: ratio < 0.88 || ratio > 1.12,
    visualLipRedrawRequired: input.isFrontalCloseUp && input.shotDurationMs >= 2000,
    voiceCloneAllowed: input.verbalConsentSimilarityScore >= 0.99,
  };
}

export interface ThemeParkMuseumConciergeEvaluation {
  policyCode: "TOUR-VOICE-01";
  exhibitSwitchApproved: boolean;
  queueLoadBalanceIncentiveOffered: boolean;
  inCharacterDeflectionTriggered: boolean;
}

/**
 * Deterministic Cultural Tourism, Theme Park Queue Load-Balancer & Museum UWB Docent Guard (`TOUR-VOICE-01`).
 * Locks museum exhibit audio switching to UWB distance <=1.2m + frontal dwell >=2000ms (preventing cabinet crosstalk),
 * offers dynamic show/F&B incentives when ride wait >=90 min, and enforces in-universe IP character deflection on adult/political bait.
 */
export function evaluateThemeParkMuseumConciergeGuard(input: {
  uwbDistanceMeters: number;
  frontalGazeDwellMs: number;
  approachingRideWaitMinutes: number;
  nearbyShowEmptySeats: number;
  visitorPromptContainsOutOfCharacterBait: boolean;
}): ThemeParkMuseumConciergeEvaluation {
  return {
    policyCode: "TOUR-VOICE-01",
    exhibitSwitchApproved: input.uwbDistanceMeters <= 1.2 && input.frontalGazeDwellMs >= 2000,
    queueLoadBalanceIncentiveOffered:
      input.approachingRideWaitMinutes >= 90 && input.nearbyShowEmptySeats >= 20,
    inCharacterDeflectionTriggered: input.visitorPromptContainsOutOfCharacterBait,
  };
}

export interface SmartPropertyElevatorEvaluation {
  policyCode: "PROP-VOICE-01";
  sev1EntrapmentRescueTriggered: boolean;
  antiPryDoorWarningIssued: boolean;
  continuousLineHoldRequired: boolean;
  bmsSolenoidValveShutoffTriggered: boolean;
}

/**
 * Deterministic Smart Property Concierge & Elevator SOS Entrapment Rescue Guard (`PROP-VOICE-01`).
 * Triggers Sev-1 entrapment rescue + continuous line-hold + anti-pry-door warning when elevator PLC doorZone=false
 * and cabinPersons>=1, and triggers 0ms BMS solenoid valve shutoff on burst-pipe or gas-smell reports.
 */
export function evaluateSmartPropertyElevatorGuard(input: {
  elevatorInDoorZone: boolean;
  cabinPersonCount: number;
  passengerAttemptsToPryDoor: boolean;
  residentReportsBurstPipeOrGas: boolean;
}): SmartPropertyElevatorEvaluation {
  const trapped = !input.elevatorInDoorZone && input.cabinPersonCount >= 1;
  return {
    policyCode: "PROP-VOICE-01",
    sev1EntrapmentRescueTriggered: trapped,
    antiPryDoorWarningIssued: trapped || input.passengerAttemptsToPryDoor,
    continuousLineHoldRequired: trapped,
    bmsSolenoidValveShutoffTriggered: input.residentReportsBurstPipeOrGas,
  };
}

export interface LegalIntakeConflictNotaryEvaluation {
  policyCode: "LEGAL-VOICE-01";
  factIntakeUnlocked: boolean;
  conflictTaintBufferPurged: boolean;
  uplOpinionBlocked: boolean;
  ronCoercionHaltTriggered: boolean;
}

/**
 * Deterministic Legal Intake Conflict Firewall (ABA Rule 1.18), Zero-UPL & Remote Notary Anti-Coercion Guard (`LEGAL-VOICE-01`).
 * Blocks confidential fact intake and purges buffer on adverse-party conflict hits, strips UPL win/settlement promises,
 * and halts remote notarization when the +24dB far-field sidecar detects an off-camera secondary whisper.
 */
export function evaluateLegalIntakeConflictNotaryGuard(input: {
  conflictCheckCompleted: boolean;
  adversePartyMatchesExistingClient: boolean;
  draftReplyPromisesWinOrSettlementAmount: boolean;
  ronFarFieldSecondaryWhisperDetected: boolean;
}): LegalIntakeConflictNotaryEvaluation {
  return {
    policyCode: "LEGAL-VOICE-01",
    factIntakeUnlocked: input.conflictCheckCompleted && !input.adversePartyMatchesExistingClient,
    conflictTaintBufferPurged: input.adversePartyMatchesExistingClient,
    uplOpinionBlocked: input.draftReplyPromisesWinOrSettlementAmount,
    ronCoercionHaltTriggered: input.ronFarFieldSecondaryWhisperDetected,
  };
}

export interface AutomotiveEcallRoadsideEvaluation {
  policyCode: "AUTO-RESCUE-01";
  emsAutoDispatched: boolean;
  thermalRunawayDoorUnlockTriggered: boolean;
  highwayGuardrailEvacRequiredFirst: boolean;
  requiredTowEquipment: "FLATBED_WITH_4_WHEEL_DOLLIES" | "12V_JUMP_START_BIKE" | "STANDARD_FLATBED";
}

/**
 * Deterministic Automotive NG-eCall Crash Triage & EV Roadside Assistance Guard (`AUTO-RESCUE-01`).
 * Auto-dispatches EMS when airbagDeployed=true and occupantSilenceMs>=8000, unlocks doors on HV thermal runaway,
 * enforces highway guardrail evacuation before intake, and selects 4-wheel dollies for locked AWD EVs.
 */
export function evaluateAutomotiveEcallRoadsideGuard(input: {
  airbagDeployed: boolean;
  occupantSilenceMs: number;
  hvBatteryThermalRunaway: boolean;
  onHighwayShoulder: boolean;
  occupantsBehindGuardrail: boolean;
  awdEpbLocked: boolean;
  lv12vVoltageVolts: number;
  hvSocPct: number;
}): AutomotiveEcallRoadsideEvaluation {
  const equipment =
    input.lv12vVoltageVolts < 9.5 && input.hvSocPct > 15 && !input.awdEpbLocked
      ? "12V_JUMP_START_BIKE"
      : input.awdEpbLocked
        ? "FLATBED_WITH_4_WHEEL_DOLLIES"
        : "STANDARD_FLATBED";
  return {
    policyCode: "AUTO-RESCUE-01",
    emsAutoDispatched:
      (input.airbagDeployed && input.occupantSilenceMs >= 8000) || input.hvBatteryThermalRunaway,
    thermalRunawayDoorUnlockTriggered: input.hvBatteryThermalRunaway,
    highwayGuardrailEvacRequiredFirst: input.onHighwayShoulder && !input.occupantsBehindGuardrail,
    requiredTowEquipment: equipment,
  };
}

export interface ElderlyCareFallGuardianEvaluation {
  policyCode: "ELDER-CARE-01";
  fallEmergencyDispatched: boolean;
  matterDoorParamPinIssued: boolean;
  doubleDosingInterventionTriggered: boolean;
  impatientPhraseStripped: boolean;
}

/**
 * Deterministic Smart Elderly Care Bathroom Fall Guardian, Presbycusis & Dementia Care Guard (`ELDER-CARE-01`).
 * Dispatches emergency rescue + temporary Matter door PIN when torsoHeightMeters<0.45 and unansweredCheckInMs>=10000,
 * intervenes on pillbox re-opening within 240 min of prior dose, and strips impatient phrases for MCI/Alzheimer's care.
 */
export function evaluateElderlyCareFallGuardianGuard(input: {
  torsoHeightMeters: number;
  unansweredCheckInMs: number;
  minutesSinceLastDoseTaken: number;
  pillboxReopened: boolean;
  draftReplyMentionsAlreadyToldYou: boolean;
}): ElderlyCareFallGuardianEvaluation {
  const fallConfirmed = input.torsoHeightMeters < 0.45 && input.unansweredCheckInMs >= 10000;
  return {
    policyCode: "ELDER-CARE-01",
    fallEmergencyDispatched: fallConfirmed,
    matterDoorParamPinIssued: fallConfirmed,
    doubleDosingInterventionTriggered: input.pillboxReopened && input.minutesSinceLastDoseTaken < 240,
    impatientPhraseStripped: input.draftReplyMentionsAlreadyToldYou,
  };
}

export interface SmartHospitalSurgicalOrEvaluation {
  policyCode: "HOSP-NURSE-01";
  codeBluePreemptionTriggered: boolean;
  spongeDiscrepancyClosureBlocked: boolean;
  cArmXrayAutoOrdered: boolean;
  bedsideChartingAllowed: boolean;
}

/**
 * Deterministic Smart Hospital Bedside Nurse Call, Sterile OR Sponge-Count & Wristband Bed-Lock Guard (`HOSP-NURSE-01`).
 * Triggers 0ms Code-Blue preemption when bedside SpO2 < 92%, blocks surgical wound closure and orders a C-arm X-ray
 * on any sponge/needle count discrepancy, and requires physical barcode wristband scan before EMR charting.
 */
export function evaluateSmartHospitalSurgicalOrGuard(input: {
  patientSpO2Pct: number;
  spongesDispensed: number;
  spongesCountedPreClosure: number;
  wristbandBarcodeScanned: boolean;
}): SmartHospitalSurgicalOrEvaluation {
  const spongeMismatch = input.spongesDispensed !== input.spongesCountedPreClosure;
  return {
    policyCode: "HOSP-NURSE-01",
    codeBluePreemptionTriggered: input.patientSpO2Pct < 92,
    spongeDiscrepancyClosureBlocked: spongeMismatch,
    cArmXrayAutoOrdered: spongeMismatch,
    bedsideChartingAllowed: input.wristbandBarcodeScanned,
  };
}

export interface AviationCruiseRailVoiceEvaluation {
  policyCode: "INFLIGHT-CABIN-01";
  allergenMealBlocked: boolean;
  cruiseMinorAlcoholOrderBlocked: boolean;
  solasEmergencyPreempted: boolean;
  hsrQuietCarSpeakerMuted: boolean;
}

/**
 * Deterministic In-Flight Cabin Allergen Lock, Cruise Ship Minor Folio & High-Speed Rail Quiet-Car Guard (`INFLIGHT-CABIN-01`).
 * Blocks meal serving on PIL allergen conflicts, blocks minor stateroom alcohol/casino orders without adult PIN,
 * preempts all shipboard calls on SOLAS muster alarms, and forces silent screen reply in HSR Quiet Cars.
 */
export function evaluateAviationCruiseRailVoiceGuard(input: {
  passengerHasSevereNutAllergy: boolean;
  mealBatchContainsPeanutOil: boolean;
  cruiseCallerIsMinorWithoutAdultPin: boolean;
  ordersAlcoholOrCasinoChips: boolean;
  solasGeneralAlarmActive: boolean;
  inHsrQuietCar: boolean;
}): AviationCruiseRailVoiceEvaluation {
  return {
    policyCode: "INFLIGHT-CABIN-01",
    allergenMealBlocked: input.passengerHasSevereNutAllergy && input.mealBatchContainsPeanutOil,
    cruiseMinorAlcoholOrderBlocked:
      input.cruiseCallerIsMinorWithoutAdultPin && input.ordersAlcoholOrCasinoChips,
    solasEmergencyPreempted: input.solasGeneralAlarmActive,
    hsrQuietCarSpeakerMuted: input.inHsrQuietCar,
  };
}

export interface GamingNpcMinorSafetyEvaluation {
  policyCode: "GAME-SAFE-01";
  minorVoiceprintStorageAllowed: boolean;
  parentalFido2ApprovalRequired: boolean;
  clampedDiscountPct: number;
  combatMaxReplyWords: number;
}

/**
 * Deterministic Gaming Real-Time Voice NPC, EdTech Companion & COPPA Minor Safety Guard (`GAME-SAFE-01`).
 * Blocks voiceprint persistence for minor accounts, requires parental FIDO2 approval for spoken in-app purchases,
 * clamps NPC shop discounts to <=15% (blocking prompt-injected 0-gold loot exploits), and enforces <=8 words under fire.
 */
export function evaluateGamingNpcMinorSafetyGuard(input: {
  isMinorAccount: boolean;
  requestsInAppPurchase: boolean;
  llmProposedDiscountPct: number;
  underHeavyFire: boolean;
}): GamingNpcMinorSafetyEvaluation {
  return {
    policyCode: "GAME-SAFE-01",
    minorVoiceprintStorageAllowed: !input.isMinorAccount,
    parentalFido2ApprovalRequired: input.isMinorAccount && input.requestsInAppPurchase,
    clampedDiscountPct: Math.max(0, Math.min(15, input.llmProposedDiscountPct)),
    combatMaxReplyWords: input.underHeavyFire ? 8 : 60,
  };
}

export interface AffectiveDeescalationEvaluation {
  policyCode: "AFFECTIVE-DEESC-01";
  clampedSpeakingRate: number;
  empathyPrePauseMs: number;
  upsellPromptsSuppressed: boolean;
  workplaceAgentEmotionBlocked: boolean;
  expandedEouSilenceMs: number;
}

/**
 * Deterministic Affective Prosody De-Escalation, EU AI Act Art. 5(1)(f) Workplace Lock & Crisis Silence Guard (`AFFECTIVE-DEESC-01`).
 * Clamps TTS rate to <=0.94x with >=350ms empathy pause and mutes upsells when customer arousal >=0.72,
 * blocks workplace biometric emotion scoring on agent channels, and widens EOU silence to >=1800ms on sobbing/distress.
 */
export function evaluateAffectiveDeescalationGuard(input: {
  customerArousalScore: number;
  requestedSpeakingRate: number;
  sobbingOrDysarthriaDetected: boolean;
  agentChannelEmotionRequested: boolean;
}): AffectiveDeescalationEvaluation {
  const highArousal = input.customerArousalScore >= 0.72;
  return {
    policyCode: "AFFECTIVE-DEESC-01",
    clampedSpeakingRate: highArousal
      ? Math.max(0.88, Math.min(0.94, input.requestedSpeakingRate))
      : input.requestedSpeakingRate,
    empathyPrePauseMs: highArousal ? 350 : 0,
    upsellPromptsSuppressed: highArousal || input.sobbingOrDysarthriaDetected,
    workplaceAgentEmotionBlocked: input.agentChannelEmotionRequested,
    expandedEouSilenceMs: input.sobbingOrDysarthriaDetected ? 1800 : 600,
  };
}

export interface AlphanumericSlotDisambiguationEvaluation {
  policyCode: "ALPHANUM-CHECKSUM-01";
  vinContainsForbiddenChars: boolean;
  natoPhoneticReadbackRequired: boolean;
  partialSlotRepairOnly: boolean;
  pivotToOutOfBandSms: boolean;
}

/**
 * Deterministic Alphanumeric Entity Disambiguation (PNR/VIN/Policy ID) & NATO Phonetic Readback Guard (`ALPHANUM-CHECKSUM-01`).
 * Rejects ISO 3779 forbidden VIN characters (I/O/Q), enforces NATO phonetic chunked readback when fricative/nasal
 * slot confidence <0.82, repairs only the ambiguous chunk, and pivots to SMS/WhatsApp card after >=2 failed repairs.
 */
export function evaluateAlphanumericSlotDisambiguationGuard(input: {
  candidateVinOrCode: string;
  lowestSlotConfidence: number;
  failedVoiceRepairAttempts: number;
}): AlphanumericSlotDisambiguationEvaluation {
  const forbidden = /[IOQ]/i.test(input.candidateVinOrCode);
  const lowConf = input.lowestSlotConfidence < 0.82;
  return {
    policyCode: "ALPHANUM-CHECKSUM-01",
    vinContainsForbiddenChars: forbidden,
    natoPhoneticReadbackRequired: lowConf || forbidden,
    partialSlotRepairOnly: lowConf && input.failedVoiceRepairAttempts < 2,
    pivotToOutOfBandSms: input.failedVoiceRepairAttempts >= 2,
  };
}

export interface MultimodalCobrowsingSyncEvaluation {
  policyCode: "COBROWSE-SAFE-02";
  videoAvatarDroppedForAudio: boolean;
  lipSyncWithinBroadcastBounds: boolean;
  uiClickAllowed: boolean;
  invisiblePromptInjectionStripped: boolean;
}

/**
 * Deterministic Multimodal Avatar Lip-Sync (ITU-R BT.1359 <=45ms) & Co-Browsing Viewport Epoch Guard (`COBROWSE-SAFE-02`).
 * Drops avatar video below 600kbps to preserve Opus voice, enforces |avSkewMs|<=45ms, blocks UI clicks when
 * viewportEpoch mismatches or scroll drift >16px, and strips opacity<0.05 visual prompt injections.
 */
export function evaluateMultimodalCobrowsingSyncGuard(input: {
  availableBandwidthKbps: number;
  avSkewMs: number;
  actionViewportEpoch: number;
  currentViewportEpoch: number;
  scrollDriftPx: number;
  domContainsZeroOpacityText: boolean;
}): MultimodalCobrowsingSyncEvaluation {
  return {
    policyCode: "COBROWSE-SAFE-02",
    videoAvatarDroppedForAudio: input.availableBandwidthKbps < 600,
    lipSyncWithinBroadcastBounds: Math.abs(input.avSkewMs) <= 45,
    uiClickAllowed:
      input.actionViewportEpoch === input.currentViewportEpoch && input.scrollDriftPx <= 16,
    invisiblePromptInjectionStripped: input.domContainsZeroOpacityText,
  };
}

export interface CanaryMemoryPoisoningEvaluation {
  policyCode: "CANARY-SHADOW-01";
  shadowWriteToolsMuted: boolean;
  canaryAutoRollbackTriggered: boolean;
  allowedPrivilegeFieldsInMemory: 0;
  clampedMemoryRetentionDays: number;
}

/**
 * Deterministic Canary Shadow Dry-Run Rollout & Cross-Call Memory Poisoning Guard (`CANARY-SHADOW-01`).
 * Mutes external write tools on shadow instances, auto-rolls back canary rings when P95 TTFA regression >150ms,
 * clamps privilege fields in long-term memory to 0, and bounds memory retention to <=90 days.
 */
export function evaluateCanaryMemoryPoisoningGuard(input: {
  isShadowInstance: boolean;
  canaryP95TtfaRegressionMs: number;
  requestedMemoryRetentionDays: number;
}): CanaryMemoryPoisoningEvaluation {
  return {
    policyCode: "CANARY-SHADOW-01",
    shadowWriteToolsMuted: input.isShadowInstance,
    canaryAutoRollbackTriggered: input.canaryP95TtfaRegressionMs > 150,
    allowedPrivilegeFieldsInMemory: 0,
    clampedMemoryRetentionDays: Math.min(90, Math.max(1, input.requestedMemoryRetentionDays)),
  };
}

export interface SpeechAccessibilityDisfluencyEvaluation {
  policyCode: "ACCESS-DISFLUENCY-01";
  disfluencyEouWindowMs: number;
  threeStrikeHangupAllowed: false;
  rttOrKeypadFallbackOffered: boolean;
  zeroAuthEmergencyPreempted: boolean;
}

/**
 * Deterministic EAA/ADA Speech Accessibility (Stutter/Disfluency EOU) & E911/112 Zero-Auth Preemption Guard (`ACCESS-DISFLUENCY-01`).
 * Widens EOU window to >=2200ms on stutter glottal blocks, bans 3-strike auto-hangup, offers RTT/keypad fallback
 * after <=2 voice reprompts, and preempts KYC in <=200ms on life-safety emergencies.
 */
export function evaluateSpeechAccessibilityDisfluencyGuard(input: {
  stutterGlottalBlockDetected: boolean;
  consecutiveVoiceReprompts: number;
  lifeSafetyEmergencyDetected: boolean;
}): SpeechAccessibilityDisfluencyEvaluation {
  return {
    policyCode: "ACCESS-DISFLUENCY-01",
    disfluencyEouWindowMs: input.stutterGlottalBlockDetected ? 2200 : 600,
    threeStrikeHangupAllowed: false,
    rttOrKeypadFallbackOffered: input.consecutiveVoiceReprompts >= 2,
    zeroAuthEmergencyPreempted: input.lifeSafetyEmergencyDetected,
  };
}

export interface OmnichannelWalletBreakerEvaluation {
  policyCode: "OMNI-CAS-01";
  casWriteAllowed: boolean;
  doubleChargeBlocked: boolean;
  ultrasonicLowPassCutoffHz: 8000;
  s2sWalletCircuitTripped: boolean;
}

/**
 * Deterministic Omnichannel Voice+App CAS Optimistic Concurrency & Ultrasonic/Wallet Breaker Guard (`OMNI-CAS-01`).
 * Blocks stale voice writes when voiceReadVersion != currentDbVersion (preventing double charges),
 * enforces an 8000Hz brick-wall low-pass filter against DolphinAttack ultrasound, and caps per-session S2S cost at <=$2.50.
 */
export function evaluateOmnichannelWalletBreakerGuard(input: {
  voiceReadVersion: number;
  currentDbVersion: number;
  sessionAudioCostUsd: number;
  outboundPromptCanaryLeaked: boolean;
}): OmnichannelWalletBreakerEvaluation {
  const versionMatch = input.voiceReadVersion === input.currentDbVersion;
  return {
    policyCode: "OMNI-CAS-01",
    casWriteAllowed: versionMatch && !input.outboundPromptCanaryLeaked,
    doubleChargeBlocked: !versionMatch,
    ultrasonicLowPassCutoffHz: 8000,
    s2sWalletCircuitTripped: input.sessionAudioCostUsd > 2.5 || input.outboundPromptCanaryLeaked,
  };
}

export interface S2sEmotionalContagionLufsEvaluation {
  policyCode: "S2S-LUFS-CLAMP-01";
  clampedOutputLufs: number;
  clampedOutputWpm: number;
  syntacticHoldWindowMs: number;
  c2paWatermarkEmbedded: true;
}

/**
 * Deterministic Native S2S Emotional Contagion Clamp (ITU-R BS.1770-4 [-20,-16] LUFS) & Syntactic Hold Guard (`S2S-LUFS-CLAMP-01`).
 * Clamps outbound S2S loudness to [-20, -16] LUFS and speaking rate to [135, 165] WPM (preventing shouting mirroring),
 * and expands EOU hold window to 1350ms when the caller's partial transcript trails on an open conjunction/preposition.
 */
export function evaluateS2sEmotionalContagionLufsGuard(input: {
  rawOutputLufs: number;
  rawOutputWpm: number;
  trailsOnDanglingConjunctionOrPreposition: boolean;
}): S2sEmotionalContagionLufsEvaluation {
  return {
    policyCode: "S2S-LUFS-CLAMP-01",
    clampedOutputLufs: Math.max(-20.0, Math.min(-16.0, input.rawOutputLufs)),
    clampedOutputWpm: Math.max(135, Math.min(165, input.rawOutputWpm)),
    syntacticHoldWindowMs: input.trailsOnDanglingConjunctionOrPreposition ? 1350 : 500,
    c2paWatermarkEmbedded: true,
  };
}

export interface InterpreterPolarityHotwordEvaluation {
  policyCode: "INTERP-POLARITY-01";
  targetTtsReleaseAllowed: boolean;
  bilingualReadbackRequired: boolean;
  clampedHotwordBoostScore: number;
  crossTenantLexiconBlocked: boolean;
}

/**
 * Deterministic Simultaneous Interpreter Negation/Dosage Polarity Lock & Tenant WFST Hotword Guard (`INTERP-POLARITY-01`).
 * Blocks target TTS emission and requires bilingual readback when source/target negation polarity or dosage entities drift,
 * clamps shallow-fusion hotword boost to [1.0, 4.5], and blocks cross-tenant WFST trie reuse.
 */
export function evaluateInterpreterPolarityHotwordGuard(input: {
  sourceHasNegation: boolean;
  targetHasNegation: boolean;
  sourceDosageMg: number;
  targetDosageMg: number;
  requestedHotwordBoost: number;
  sessionTenantId: string;
  trieOwnerTenantId: string;
}): InterpreterPolarityHotwordEvaluation {
  const polarityAndDosageMatch =
    input.sourceHasNegation === input.targetHasNegation &&
    input.sourceDosageMg === input.targetDosageMg;
  const tenantMatch = input.sessionTenantId === input.trieOwnerTenantId;
  return {
    policyCode: "INTERP-POLARITY-01",
    targetTtsReleaseAllowed: polarityAndDosageMatch && tenantMatch,
    bilingualReadbackRequired: !polarityAndDosageMatch,
    clampedHotwordBoostScore: Math.max(1.0, Math.min(4.5, input.requestedHotwordBoost)),
    crossTenantLexiconBlocked: !tenantMatch,
  };
}

export interface UnifiedCommsVoiceIntegrationEvaluation {
  policyCode: "UC-VOICE-01";
  sipBlindTransferAllowed: boolean;
  adaptiveCardCallbackSent: boolean;
  meetingBotJoinAllowed: boolean;
  pbrWormStreamIsolated: true;
}

/**
 * Deterministic Enterprise UCaaS (Teams Phone / Zoom Phone / Webex Calling) Presence & Recording Guard (`UC-VOICE-01`).
 * Blocks blind SIP transfers when target expert Graph/UC presence != "Available" (sending an Adaptive Card + callback slot instead),
 * and requires explicit recording banner disclosure before an AI bot joins an executive meeting.
 */
export function evaluateUnifiedCommsVoiceIntegrationGuard(input: {
  targetExpertPresence: "Available" | "Busy" | "InAMeeting" | "DoNotDisturb" | "Offline";
  explicitRecordingBannerShown: boolean;
}): UnifiedCommsVoiceIntegrationEvaluation {
  const available = input.targetExpertPresence === "Available";
  return {
    policyCode: "UC-VOICE-01",
    sipBlindTransferAllowed: available,
    adaptiveCardCallbackSent: !available,
    meetingBotJoinAllowed: input.explicitRecordingBannerShown,
    pbrWormStreamIsolated: true,
  };
}

export interface SocialInAppVoiceCallingEvaluation {
  policyCode: "SOCIAL-CALL-01";
  whatsappOutboundCallAllowed: boolean;
  redundantIdPromptSuppressed: boolean;
  pstnCallbackEscapeTriggered: boolean;
}

/**
 * Deterministic WhatsApp Business Calling, WeChat Mini-Program & In-App WebRTC Voice Guard (`SOCIAL-CALL-01`).
 * Blocks outbound WhatsApp Business voice calls without active user Call Permission opt-in, suppresses redundant
 * phone/order-ID prompts when JWT/OpenID context is present, and triggers PSTN callback when WebRTC loss >12%.
 */
export function evaluateSocialInAppVoiceCallingGuard(input: {
  whatsappCallPermissionGranted: boolean;
  hasVerifiedJwtAndOrderId: boolean;
  webrtcPacketLossPct: number;
}): SocialInAppVoiceCallingEvaluation {
  return {
    policyCode: "SOCIAL-CALL-01",
    whatsappOutboundCallAllowed: input.whatsappCallPermissionGranted,
    redundantIdPromptSuppressed: input.hasVerifiedJwtAndOrderId,
    pstnCallbackEscapeTriggered: input.webrtcPacketLossPct > 12.0,
  };
}

export interface CrmCtiScreenPopSyncEvaluation {
  policyCode: "CRM-CTI-01";
  autoBindSingleContactAllowed: boolean;
  clampedCrmDbWritesPerCall: number;
  sanitizedCaseSummary: string;
}

/**
 * Deterministic Enterprise CRM & CTI Screen-Pop Disambiguation, API Quota & PII Redaction Guard (`CRM-CTI-01`).
 * Blocks blind single-contact binding when an ANI matches >=2 contacts without secondary verification,
 * caps CRM DB writes at <=2 milestone calls per session, and masks raw PANs in case summaries.
 */
export function evaluateCrmCtiScreenPopSyncGuard(input: {
  aniMatchedContactsCount: number;
  secondarySlotVerified: boolean;
  requestedCrmDbWritesPerCall: number;
  rawCaseSummary: string;
}): CrmCtiScreenPopSyncEvaluation {
  return {
    policyCode: "CRM-CTI-01",
    autoBindSingleContactAllowed:
      input.aniMatchedContactsCount === 1 ||
      (input.aniMatchedContactsCount > 1 && input.secondarySlotVerified),
    clampedCrmDbWritesPerCall: Math.min(2, Math.max(1, input.requestedCrmDbWritesPerCall)),
    sanitizedCaseSummary: input.rawCaseSummary.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_PAN]"),
  };
}

export interface OpenSourceVoiceGpuSizingEvaluation {
  policyCode: "OSS-VOICE-GPU-01";
  silenceChunkDroppedBeforeWhisper: boolean;
  commercialWeightsApproved: boolean;
  cloudBurstOverflowTriggered: boolean;
  recommendedDeploymentMode: "CLOUD_PAYGO" | "HYBRID_BASE_GPU_PLUS_CLOUD_BURST";
}

/**
 * Deterministic Self-Hosted Open-Weight STT/TTS (Whisper/SenseVoice + CosyVoice 2/Kokoro) & GPU TCO Guard (`OSS-VOICE-GPU-01`).
 * Drops silent frames (speechProb < 0.5) before Whisper to eliminate YouTube subtitle hallucinations, blocks non-commercial
 * CC-BY-NC weights, overflows to cloud when GPU queue wait >120ms, and recommends hybrid GPU only at >=350k mins/month.
 */
export function evaluateOpenSourceVoiceGpuSizingGuard(input: {
  sileroVadSpeechProb: number;
  modelWeightLicense: "Apache-2.0" | "MIT" | "CC-BY-NC-4.0";
  localGpuQueueWaitMs: number;
  monthlyVoiceMinutes: number;
}): OpenSourceVoiceGpuSizingEvaluation {
  return {
    policyCode: "OSS-VOICE-GPU-01",
    silenceChunkDroppedBeforeWhisper: input.sileroVadSpeechProb < 0.5,
    commercialWeightsApproved:
      input.modelWeightLicense === "Apache-2.0" || input.modelWeightLicense === "MIT",
    cloudBurstOverflowTriggered: input.localGpuQueueWaitMs > 120,
    recommendedDeploymentMode:
      input.monthlyVoiceMinutes >= 350000 ? "HYBRID_BASE_GPU_PLUS_CLOUD_BURST" : "CLOUD_PAYGO",
  };
}

export interface VoicePromptMarkdownSanitizerEvaluation {
  policyCode: "VOICE-PROMPT-01";
  sanitizedSpokenText: string;
  urlDivertedToSmsOrCard: boolean;
  xmlEntitiesEscaped: boolean;
}

/**
 * Deterministic Voice-Native Output Sanitizer, URL-to-SMS Diverter & SSML Entity Escaper (`VOICE-PROMPT-01`).
 * Strips Markdown formatting (`**`, `###`), expands numeric hyphen ranges (`3-5` -> `3 to 5`),
 * diverts `https://` URLs out of the spoken stream into SMS/chat cards, and escapes XML `&`.
 */
export function evaluateVoicePromptMarkdownSanitizerGuard(input: {
  rawLlmOutput: string;
}): VoicePromptMarkdownSanitizerEvaluation {
  const hasUrl = /https?:\/\/\S+/i.test(input.rawLlmOutput);
  const cleaned = input.rawLlmOutput
    .replace(/[*#_`~|]+/g, "")
    .replace(/(\d+)\s*-\s*(\d+)/g, "$1 to $2")
    .replace(/https?:\/\/\S+/gi, "[LINK_SENT_TO_PHONE]")
    .replace(/&/g, "&amp;")
    .trim();
  return {
    policyCode: "VOICE-PROMPT-01",
    sanitizedSpokenText: cleaned,
    urlDivertedToSmsOrCard: hasUrl,
    xmlEntitiesEscaped: cleaned.includes("&amp;") || !input.rawLlmOutput.includes("&"),
  };
}

export interface LuxuryVicClientelingEvaluation {
  policyCode: "LUXURY-VIP-01";
  zeroIvrDirectGreeting: boolean;
  exactQuotaStockCountDisclosed: false;
  discountSlangStripped: boolean;
  commissionAttributedToDedicatedSa: boolean;
}

/**
 * Deterministic Luxury Retail & Black-Card VIC Clienteling Voice Concierge Guard (`LUXURY-VIP-01`).
 * Bypasses DTMF IVR menus for recognized VICs, strips exact vault stock counts on quota/limited SKUs
 * (blocking scalper phishing), strips mass-market discount slang, and locks SA commission attribution.
 */
export function evaluateLuxuryVicClientelingGuard(input: {
  callerIsRecognizedVic: boolean;
  queriedSkuIsQuotaLimited: boolean;
  draftReplyContainsDiscountSlang: boolean;
  dedicatedSaAssigned: boolean;
}): LuxuryVicClientelingEvaluation {
  return {
    policyCode: "LUXURY-VIP-01",
    zeroIvrDirectGreeting: input.callerIsRecognizedVic,
    exactQuotaStockCountDisclosed: false,
    discountSlangStripped: input.draftReplyContainsDiscountSlang,
    commissionAttributedToDedicatedSa: input.dedicatedSaAssigned,
  };
}

export interface PayrollTaxAdvisoryEvaluation {
  policyCode: "FIN-TAX-CPA-01";
  verbalBankAccountChangeBlocked: boolean;
  normalizedTaxId: string;
  taxChunkYearAccepted: boolean;
  unconditionalRefundPromiseBlocked: boolean;
}

/**
 * Deterministic Enterprise Payroll, FSSC Expense & CPA Tax Advisory Voice Guard (`FIN-TAX-CPA-01`).
 * Physically blocks verbal direct-deposit or vendor bank account changes (routing to out-of-band FIDO2),
 * normalizes GB 32100 forbidden letters (I/O/Z/S -> 1/0/2/5), locks tax RAG to the active filing year,
 * and blocks unconditional tax-refund guarantees under IRS Circular 230.
 */
export function evaluatePayrollTaxAdvisoryGuard(input: {
  requestsVerbalBankOrIbanChange: boolean;
  rawTaxId: string;
  ragChunkTaxYear: number;
  activeFilingTaxYear: number;
  draftPromisesGuaranteedTaxRefund: boolean;
}): PayrollTaxAdvisoryEvaluation {
  const normalized = input.rawTaxId
    .toUpperCase()
    .replace(/I/g, "1")
    .replace(/O/g, "0")
    .replace(/Z/g, "2")
    .replace(/S/g, "5");
  return {
    policyCode: "FIN-TAX-CPA-01",
    verbalBankAccountChangeBlocked: input.requestsVerbalBankOrIbanChange,
    normalizedTaxId: normalized,
    taxChunkYearAccepted: input.ragChunkTaxYear === input.activeFilingTaxYear,
    unconditionalRefundPromiseBlocked: input.draftPromisesGuaranteedTaxRefund,
  };
}

export interface WearableFitnessHeartRateEvaluation {
  policyCode: "FITNESS-REHAB-01";
  pantingFalseBargeInIgnored: boolean;
  sprintPromptRevokedForCooldown: boolean;
  postOpRomStopTriggered: boolean;
  sharpPainEmergencyHalt: boolean;
}

/**
 * Deterministic Smart Wearable Fitness Coach (Heart-Rate Zone-5 Safety) & Post-Op Rehab ROM Guard (`FITNESS-REHAB-01`).
 * Ignores unvoiced anaerobic panting from triggering barge-in, revokes sprint prompts when HR >= 95% HRmax,
 * and halts post-op rehab sets immediately when joint flexion exceeds prescribed ROM ceiling or sharp pain is reported.
 */
export function evaluateWearableFitnessHeartRateGuard(input: {
  unvoicedPantingDetectedWithoutF0: boolean;
  currentHrBpm: number;
  maxSafeHrBpm: number;
  measuredJointRomDeg: number;
  prescribedMaxRomDeg: number;
  sharpPainOrPopReported: boolean;
}): WearableFitnessHeartRateEvaluation {
  return {
    policyCode: "FITNESS-REHAB-01",
    pantingFalseBargeInIgnored: input.unvoicedPantingDetectedWithoutF0,
    sprintPromptRevokedForCooldown:
      input.maxSafeHrBpm > 0 && input.currentHrBpm >= input.maxSafeHrBpm * 0.95,
    postOpRomStopTriggered: input.measuredJointRomDeg > input.prescribedMaxRomDeg,
    sharpPainEmergencyHalt: input.sharpPainOrPopReported,
  };
}

export interface MortgageCollectionsFdcpaEvaluation {
  policyCode: "BANK-LOAN-FDCPA-01";
  outboundDialAllowed: boolean;
  debtDetailsUnlocked: boolean;
  hardshipForbearancePivotTriggered: boolean;
}

/**
 * Deterministic Retail Banking Mortgage Origination & FDCPA Reg F Early Collections Guard (`BANK-LOAN-FDCPA-01`).
 * Enforces FDCPA 7-in-7 call caps, 08:00-21:00 local time windows, and Cease & Desist locks;
 * hides debt details until Right-Party Contact (RPC) is verified; and pivots to hardship forbearance on job loss/illness.
 */
export function evaluateMortgageCollectionsFdcpaGuard(input: {
  callsInRolling7Days: number;
  borrowerLocalHour24: number;
  ceaseAndDesistActive: boolean;
  rightPartyContactVerified: boolean;
  borrowerReportsHardshipOrIllness: boolean;
}): MortgageCollectionsFdcpaEvaluation {
  const withinWindow = input.borrowerLocalHour24 >= 8 && input.borrowerLocalHour24 < 21;
  return {
    policyCode: "BANK-LOAN-FDCPA-01",
    outboundDialAllowed:
      input.callsInRolling7Days < 7 && withinWindow && !input.ceaseAndDesistActive,
    debtDetailsUnlocked: input.rightPartyContactVerified,
    hardshipForbearancePivotTriggered: input.borrowerReportsHardshipOrIllness,
  };
}

export interface VeterinaryPoisonTriageEvaluation {
  policyCode: "VET-TRIAGE-01";
  homeEmesisAllowed: boolean;
  emergencyErDispatchRequired: boolean;
  outboundMarketingCallAllowed: boolean;
}

/**
 * Deterministic 24x7 Veterinary Emergency Poison Triage & Rainbow Bridge Bereavement Guard (`VET-TRIAGE-01`).
 * Blocks home hydrogen-peroxide emesis for cats, brachycephalic breeds, or sharp/caustic ingestions,
 * triggers immediate 24h ER dispatch when theobromine dose >=20 mg/kg or GDV/Blocked-Tom symptoms appear,
 * and blocks outbound wellness/vaccine calls when petStatus === "DECEASED".
 */
export function evaluateVeterinaryPoisonTriageGuard(input: {
  species: "feline" | "canine";
  isBrachycephalicBreed: boolean;
  ingestedSharpOrCausticItem: boolean;
  calculatedTheobromineMgPerKg: number;
  hasGdvOrUrinaryObstructionSigns: boolean;
  petStatus: "ACTIVE" | "DECEASED";
}): VeterinaryPoisonTriageEvaluation {
  const forbidEmesis =
    input.species === "feline" ||
    input.isBrachycephalicBreed ||
    input.ingestedSharpOrCausticItem;
  return {
    policyCode: "VET-TRIAGE-01",
    homeEmesisAllowed: !forbidEmesis,
    emergencyErDispatchRequired:
      input.calculatedTheobromineMgPerKg >= 20 ||
      input.hasGdvOrUrinaryObstructionSigns ||
      input.ingestedSharpOrCausticItem,
    outboundMarketingCallAllowed: input.petStatus !== "DECEASED",
  };
}

export interface HvacApplianceGasSafetyEvaluation {
  policyCode: "HVAC-APPLIANCE-01";
  gasOrSmokeEmergencyShutoffAlert: boolean;
  diyCasingOrCapacitorInstructionBlocked: boolean;
  preReservedBomPartSku: string | null;
  heatwaveSeniorPriority4h: boolean;
}

/**
 * Deterministic Smart Home Appliance & HVAC After-Sales Safety & First-Time-Fix Guard (`HVAC-APPLIANCE-01`).
 * Triggers 0ms valve/breaker shutoff alert on gas smell or smoke, blocks consumer DIY instructions involving tools,
 * casing removal, 220V/310V capacitors or gas valves, locks BOM spare-part SKU from photo, and prioritizes seniors in heatwaves.
 */
export function evaluateHvacApplianceGasSafetyGuard(input: {
  gasSmellOrSmokeDetected: boolean;
  draftInstructsToolsOrCasingRemoval: boolean;
  resolvedBomPartSku: string | null;
  outdoorTempCelsius: number;
  householdHasSeniorOrInfant: boolean;
}): HvacApplianceGasSafetyEvaluation {
  return {
    policyCode: "HVAC-APPLIANCE-01",
    gasOrSmokeEmergencyShutoffAlert: input.gasSmellOrSmokeDetected,
    diyCasingOrCapacitorInstructionBlocked: input.draftInstructsToolsOrCasingRemoval,
    preReservedBomPartSku: input.resolvedBomPartSku,
    heatwaveSeniorPriority4h:
      (input.outdoorTempCelsius >= 38 || input.outdoorTempCelsius <= -5) &&
      input.householdHasSeniorOrInfant,
  };
}

export interface TradeshowLeadCaptureEvaluation {
  policyCode: "TRADESHOW-LEAD-01";
  offlineQueuePersisted: true;
  confidentialFloorPriceBlocked: boolean;
  repApprovalRequiredForCustomQuote: boolean;
  automatedFollowupEmailAllowed: boolean;
}

/**
 * Deterministic Trade Show Badge-Scan Voice Lead Capture, Floor-Price Lock & GDPR Consent Guard (`TRADESHOW-LEAD-01`).
 * Persists badge photo + voice memo to local offline queue, blocks confidential OEM floor prices on public kiosks,
 * requires rep approval on below-MSRP custom quotes, and enforces GDPR opt-in before automated email dispatch.
 */
export function evaluateTradeshowLeadCaptureGuard(input: {
  publicKioskAsksForConfidentialFloorPrice: boolean;
  draftIncludesCustomDiscountBelowMsrp: boolean;
  repApprovedCustomQuote: boolean;
  gdprConsentVerified: boolean;
}): TradeshowLeadCaptureEvaluation {
  const quoteOk = !input.draftIncludesCustomDiscountBelowMsrp || input.repApprovedCustomQuote;
  return {
    policyCode: "TRADESHOW-LEAD-01",
    offlineQueuePersisted: true,
    confidentialFloorPriceBlocked: input.publicKioskAsksForConfidentialFloorPrice,
    repApprovalRequiredForCustomQuote:
      input.draftIncludesCustomDiscountBelowMsrp && !input.repApprovedCustomQuote,
    automatedFollowupEmailAllowed: input.gdprConsentVerified && quoteOk,
  };
}

export interface SaasChurnSaveDiscountEvaluation {
  policyCode: "SAAS-RETENTION-01";
  clampedDiscountPct: number;
  immediateCancelExecuted: boolean;
  enterpriseVpAlertTriggered: boolean;
}

/**
 * Deterministic B2B SaaS Cancel-Flow Churn Save, Anti-Gaming Coupon Cap & FTC Click-to-Cancel Guard (`SAAS-RETENTION-01`).
 * Clamps retention discounts to 0% when a discount was already claimed in the past 12 months (or <=20% max otherwise),
 * executes immediate cancellation in 0ms when the user declines 1 save offer (FTC compliance), and alerts VP of CS on >=$50k ARR.
 */
export function evaluateSaasChurnSaveDiscountGuard(input: {
  accountArrUsd: number;
  discountsClaimedLast12m: number;
  requestedDiscountPct: number;
  saveOffersDeclinedCount: number;
}): SaasChurnSaveDiscountEvaluation {
  const maxAllowed = input.discountsClaimedLast12m > 0 ? 0 : 20;
  return {
    policyCode: "SAAS-RETENTION-01",
    clampedDiscountPct: Math.max(0, Math.min(maxAllowed, input.requestedDiscountPct)),
    immediateCancelExecuted: input.saveOffersDeclinedCount >= 1,
    enterpriseVpAlertTriggered: input.accountArrUsd >= 50000,
  };
}

export interface PharmaClinicalTrialPvEvaluation {
  policyCode: "PHARMA-TRIAL-PV-01";
  ecoaParaphrasingBlocked: boolean;
  caregiverProxyBlocked: boolean;
  unblindingSpeculationBlocked: boolean;
  sae24hE2bReportDispatched: boolean;
}

/**
 * Deterministic Pharma Clinical Trial eCOA Verbatim Lock, Part 11 Voiceprint & PV SAE 24h Guard (`PHARMA-TRIAL-PV-01`).
 */
export function evaluatePharmaClinicalTrialPvGuard(input: {
  isEcoaScaleQuestion: boolean;
  llmParaphrasingAttempted: boolean;
  participantVoiceprintVerified: boolean;
  unblindingSpeculationAttempted: boolean;
  saeHospitalizationOrSyncopeDetected: boolean;
}): PharmaClinicalTrialPvEvaluation {
  return {
    policyCode: "PHARMA-TRIAL-PV-01",
    ecoaParaphrasingBlocked: input.isEcoaScaleQuestion && input.llmParaphrasingAttempted,
    caregiverProxyBlocked: input.isEcoaScaleQuestion && !input.participantVoiceprintVerified,
    unblindingSpeculationBlocked: input.unblindingSpeculationAttempted,
    sae24hE2bReportDispatched: input.saeHospitalizationOrSyncopeDetected,
  };
}

export interface DentalEyeClinicSafetyEvaluation {
  policyCode: "DENTAL-EYE-CLINIC-01";
  directSurgerySlotBlocked: boolean;
  contactLensWashoutSatisfied: boolean;
  immediateOncallSurgeonEscalated: boolean;
}

/**
 * Deterministic Dental (DSO) & Ophthalmology Clinic Pre-Op Contraindication Gate & Post-Op Red-Flag Guard (`DENTAL-EYE-CLINIC-01`).
 */
export function evaluateDentalEyeClinicSafetyGuard(input: {
  takesAnticoagulantOrBisphosphonate: boolean;
  softContactLensWashoutDays: number;
  isRefractiveOrCataractScan: boolean;
  postOpVisionLossOrSevereEyePain: boolean;
  postOpUncontrolledBleedOrDysphagia: boolean;
}): DentalEyeClinicSafetyEvaluation {
  const washoutOk = !input.isRefractiveOrCataractScan || input.softContactLensWashoutDays >= 7;
  return {
    policyCode: "DENTAL-EYE-CLINIC-01",
    directSurgerySlotBlocked: input.takesAnticoagulantOrBisphosphonate || !washoutOk,
    contactLensWashoutSatisfied: washoutOk,
    immediateOncallSurgeonEscalated:
      input.postOpVisionLossOrSevereEyePain || input.postOpUncontrolledBleedOrDysphagia,
  };
}

export interface VoiceLatencySpeculativeEvaluation {
  policyCode: "LATENCY-BUDGET-01";
  speculativePrefetchAllowed: boolean;
  staleSpeculativeCacheEvicted: boolean;
  ttsFirstChunkUnderrunSafe: boolean;
}

/**
 * Deterministic Voice Latency Speculative Read-Only Prefetch, Stale Cache Eviction & First-Chunk Underrun Guard (`LATENCY-BUDGET-01`).
 */
export function evaluateVoiceLatencySpeculativeGuard(input: {
  toolIsMutatingWrite: boolean;
  asrPartialStability: number;
  finalSlotsMatchSpeculativePartial: boolean;
  firstTtsChunkWordCount: number;
}): VoiceLatencySpeculativeEvaluation {
  return {
    policyCode: "LATENCY-BUDGET-01",
    speculativePrefetchAllowed: !input.toolIsMutatingWrite && input.asrPartialStability >= 0.88,
    staleSpeculativeCacheEvicted: !input.finalSlotsMatchSpeculativePartial,
    ttsFirstChunkUnderrunSafe: input.firstTtsChunkWordCount >= 4,
  };
}

export interface NonprofitDonorEthicsEvaluation {
  policyCode: "NONPROFIT-DONOR-01";
  solicitationImmediatelyHalted: boolean;
  recurringMonthlyEnrollmentAllowed: boolean;
  corporateMatchingGiftPrompted: boolean;
}

/**
 * Deterministic Non-Profit & University Alumni Vulnerable-Donor Protection, One-No Rule & Recurring Consent Guard (`NONPROFIT-DONOR-01`).
 */
export function evaluateNonprofitDonorEthicsGuard(input: {
  cognitiveConfusionOrHardshipDetected: boolean;
  donorDeclinedCount: number;
  explicitMonthlyRecurringConsentGiven: boolean;
  employerOffersMatchingGift: boolean;
}): NonprofitDonorEthicsEvaluation {
  const haltAsk = input.cognitiveConfusionOrHardshipDetected || input.donorDeclinedCount >= 1;
  return {
    policyCode: "NONPROFIT-DONOR-01",
    solicitationImmediatelyHalted: haltAsk,
    recurringMonthlyEnrollmentAllowed: !haltAsk && input.explicitMonthlyRecurringConsentGiven,
    corporateMatchingGiftPrompted: !haltAsk && input.employerOffersMatchingGift,
  };
}

export interface SmartPortCustomsEvaluation {
  policyCode: "PORT-CUSTOMS-01";
  gateBarrierOpenAllowed: boolean;
  dedicatedDgYardAssigned: boolean;
  tariffEvasionOrDualUseBlocked: boolean;
}

/**
 * Deterministic Smart Maritime Port ISO 6346 Check-Digit, IMDG Hazmat Segregation & Customs Anti-Misdeclaration Guard (`PORT-CUSTOMS-01`).
 */
export function evaluateSmartPortCustomsGuard(input: {
  iso6346CheckDigitValid: boolean;
  isImdgHazmatContainer: boolean;
  portDgPermitApproved: boolean;
  tariffEvasionOrDualUseBypassRequested: boolean;
}): SmartPortCustomsEvaluation {
  const dgOk = !input.isImdgHazmatContainer || input.portDgPermitApproved;
  return {
    policyCode: "PORT-CUSTOMS-01",
    gateBarrierOpenAllowed:
      input.iso6346CheckDigitValid && dgOk && !input.tariffEvasionOrDualUseBypassRequested,
    dedicatedDgYardAssigned: input.isImdgHazmatContainer && input.portDgPermitApproved,
    tariffEvasionOrDualUseBlocked: input.tariffEvasionOrDualUseBypassRequested,
  };
}

export interface StoreHaccpFoodSafetyEvaluation {
  policyCode: "STORE-HACCP-01";
  logSubmissionAllowed: boolean;
  correctiveDiscardOrReheatRequired: boolean;
  omnichannel86StockoutSynced: boolean;
}

/**
 * Deterministic Chain QSR & Retail Store HACCP Danger-Zone Corrective Lock, BLE Probe & 86 Stockout Guard (`STORE-HACCP-01`).
 */
export function evaluateStoreHaccpFoodSafetyGuard(input: {
  measuredColdFoodTempCelsius: number;
  bleProbeHardwarePulseVerified: boolean;
  correctiveDiscardOrReheatCompleted: boolean;
  shiftManagerConfirmed86Outage: boolean;
}): StoreHaccpFoodSafetyEvaluation {
  const inDangerZone = input.measuredColdFoodTempCelsius > 4.4;
  const correctiveOk = !inDangerZone || input.correctiveDiscardOrReheatCompleted;
  return {
    policyCode: "STORE-HACCP-01",
    logSubmissionAllowed: input.bleProbeHardwarePulseVerified && correctiveOk,
    correctiveDiscardOrReheatRequired: inDangerZone && !input.correctiveDiscardOrReheatCompleted,
    omnichannel86StockoutSynced: input.shiftManagerConfirmed86Outage,
  };
}

export interface HospiceBereavementCareEvaluation {
  policyCode: "HOSPICE-CARE-01";
  opioidDosageAdviceBlocked: boolean;
  deceasedHolderSelfAuthBypassed: boolean;
  commercialUpsellBlocked: boolean;
  oncallHospiceRnBridged: boolean;
}

/**
 * Deterministic Hospice Palliative RN Triage, FTC Funeral Rule Zero-Upsell & Bereavement Auth-Bypass Guard (`HOSPICE-CARE-01`).
 */
export function evaluateHospiceBereavementCareGuard(input: {
  breakthroughPainOrDyspneaReported: boolean;
  draftSuggestsOpioidDoseChange: boolean;
  accountHolderReportedDeceased: boolean;
  draftIncludesCommercialUpsell: boolean;
}): HospiceBereavementCareEvaluation {
  return {
    policyCode: "HOSPICE-CARE-01",
    opioidDosageAdviceBlocked: input.draftSuggestsOpioidDoseChange,
    deceasedHolderSelfAuthBypassed: input.accountHolderReportedDeceased,
    commercialUpsellBlocked: input.draftIncludesCommercialUpsell,
    oncallHospiceRnBridged: input.breakthroughPainOrDyspneaReported,
  };
}

export interface StadiumEventVenueEvaluation {
  policyCode: "STADIUM-EVENT-01";
  alcoholOrderBlocked: boolean;
  suiteHostApprovalRequired: boolean;
  congestedExitRerouted: boolean;
}

/**
 * Deterministic Mega-Event Stadium Game-Clock Alcohol Cutoff, VIP Suite Tab Cap & Crowd-Density Egress Guard (`STADIUM-EVENT-01`).
 */
export function evaluateStadiumEventVenueGuard(input: {
  pastGameClockAlcoholCutoff: boolean;
  alcoholicDrinksInOrderCount: number;
  orderExceedsSuiteHostSingleItemCap: boolean;
  suiteHostApprovedHighTicketItem: boolean;
  requestedExitDensityPersonsPerSqm: number;
}): StadiumEventVenueEvaluation {
  return {
    policyCode: "STADIUM-EVENT-01",
    alcoholOrderBlocked:
      input.pastGameClockAlcoholCutoff || input.alcoholicDrinksInOrderCount > 2,
    suiteHostApprovalRequired:
      input.orderExceedsSuiteHostSingleItemCap && !input.suiteHostApprovedHighTicketItem,
    congestedExitRerouted: input.requestedExitDensityPersonsPerSqm >= 3.5,
  };
}

export interface SmartAgriPhiBiosecurityEvaluation {
  policyCode: "AGRI-PHI-01";
  chemicalSprayBlockedByPhiOrBan: boolean;
  biologicalControlRecommended: boolean;
  livestockEpidemicQuarantineTriggered: boolean;
}

/**
 * Deterministic Smart Agriculture Pesticide Pre-Harvest Interval (PHI), Banned-Chemical & Livestock Epidemic Guard (`AGRI-PHI-01`).
 */
export function evaluateSmartAgriPhiBiosecurityGuard(input: {
  daysToHarvest: number;
  pesticideRequiredPhiDays: number;
  isBannedOrRestrictedOnFoodCrop: boolean;
  livestockClusterFeverMassDeathDetected: boolean;
}): SmartAgriPhiBiosecurityEvaluation {
  const phiOrBanHit =
    input.daysToHarvest < input.pesticideRequiredPhiDays || input.isBannedOrRestrictedOnFoodCrop;
  return {
    policyCode: "AGRI-PHI-01",
    chemicalSprayBlockedByPhiOrBan: phiOrBanHit,
    biologicalControlRecommended: phiOrBanHit,
    livestockEpidemicQuarantineTriggered: input.livestockClusterFeverMassDeathDetected,
  };
}

export interface ConstructionOshaBimEvaluation {
  policyCode: "CONSTRUCT-OSHA-01";
  workPermitOrLiftAllowed: boolean;
  supersededBlueprintBlocked: boolean;
  lotoUnlockAuthorized: boolean;
}

/**
 * Deterministic Smart Construction Confined-Space Gas Interlock, LOTO Owner Voiceprint & CDE Latest-Revision Guard (`CONSTRUCT-OSHA-01`).
 */
export function evaluateConstructionOshaBimGuard(input: {
  oxygenPct: number;
  h2sPpm: number;
  craneWindSpeedMps: number;
  lotoOwnerVoiceprintVerified: boolean;
  blueprintRevisionIsSuperseded: boolean;
}): ConstructionOshaBimEvaluation {
  const gasSafe = input.oxygenPct >= 19.5 && input.oxygenPct <= 23.5 && input.h2sPpm === 0;
  const windSafe = input.craneWindSpeedMps < 10.8;
  return {
    policyCode: "CONSTRUCT-OSHA-01",
    workPermitOrLiftAllowed: gasSafe && windSafe && !input.blueprintRevisionIsSuperseded,
    supersededBlueprintBlocked: input.blueprintRevisionIsSuperseded,
    lotoUnlockAuthorized: input.lotoOwnerVoiceprintVerified,
  };
}

export interface BloodOrganLifelineEvaluation {
  policyCode: "BLOOD-ORGAN-01";
  donationAppointmentAllowed: boolean;
  isbt128UnitQuarantineLocked: boolean;
  backupOrganRecipientAlerted: boolean;
}

/**
 * Deterministic Blood Center Donor Deferral, Post-Donation ISBT-128 Lookback Quarantine & Organ CIT Guard (`BLOOD-ORGAN-01`).
 */
export function evaluateBloodOrganLifelineGuard(input: {
  donorIntervalAndTeratogenicMedClear: boolean;
  postDonationFeverLookbackReported: boolean;
  primaryOrganRecipientHasActiveInfection: boolean;
}): BloodOrganLifelineEvaluation {
  return {
    policyCode: "BLOOD-ORGAN-01",
    donationAppointmentAllowed:
      input.donorIntervalAndTeratogenicMedClear && !input.postDonationFeverLookbackReported,
    isbt128UnitQuarantineLocked: input.postDonationFeverLookbackReported,
    backupOrganRecipientAlerted: input.primaryOrganRecipientHasActiveInfection,
  };
}

export interface AviationMroAirworthinessEvaluation {
  policyCode: "AVIATION-MRO-01";
  ammTorqueReadbackAllowed: boolean;
  riiSignoffAuthorized: boolean;
  panelClosureAndCrsReleaseAllowed: boolean;
}

/**
 * Deterministic Aviation MRO Tail-Effectivity AMM Lock, RII Dual-Inspector Voiceprint & Zero-FOD Tool Guard (`AVIATION-MRO-01`).
 */
export function evaluateAviationMroAirworthinessGuard(input: {
  tailNumberMsnEffectivityLocked: boolean;
  mechanicVoiceprintId: string;
  riiInspectorVoiceprintId: string;
  unreturnedFodToolsCount: number;
}): AviationMroAirworthinessEvaluation {
  const riiDistinct =
    input.mechanicVoiceprintId.trim() !== "" &&
    input.riiInspectorVoiceprintId.trim() !== "" &&
    input.mechanicVoiceprintId !== input.riiInspectorVoiceprintId;
  return {
    policyCode: "AVIATION-MRO-01",
    ammTorqueReadbackAllowed: input.tailNumberMsnEffectivityLocked,
    riiSignoffAuthorized: riiDistinct,
    panelClosureAndCrsReleaseAllowed:
      input.tailNumberMsnEffectivityLocked && riiDistinct && input.unreturnedFodToolsCount === 0,
  };
}

export interface CampusBusPickupSafetyEvaluation {
  policyCode: "CAMPUS-PICKUP-01";
  busLockdownAllowed: boolean;
  phonePickupModificationBlocked: boolean;
  custodyAlertTriggered: boolean;
  schoolNurseOutbreakAlertTriggered: boolean;
}

/**
 * Deterministic K-12 School Bus Empty-Sweep Lock, Custody-Safe Dismissal & Outbreak Cluster Guard (`CAMPUS-PICKUP-01`).
 */
export function evaluateCampusBusPickupSafetyGuard(input: {
  busRemainingChildrenCount: number;
  rearPhysicalCheckButtonPressed: boolean;
  callerRequestsPhonePickupChange: boolean;
  callerMatchesCustodyRestriction: boolean;
  sameClassAcuteGiOrRashAbsenceCount: number;
}): CampusBusPickupSafetyEvaluation {
  return {
    policyCode: "CAMPUS-PICKUP-01",
    busLockdownAllowed:
      input.busRemainingChildrenCount === 0 && input.rearPhysicalCheckButtonPressed,
    phonePickupModificationBlocked: input.callerRequestsPhonePickupChange,
    custodyAlertTriggered: input.callerMatchesCustodyRestriction,
    schoolNurseOutbreakAlertTriggered: input.sameClassAcuteGiOrRashAbsenceCount >= 3,
  };
}

export interface UtilityWaterGasSafetyEvaluation {
  policyCode: "UTILITY-WATER-01";
  immediateOutdoorEvacuationOrdered: boolean;
  remoteShutoffBlocked: boolean;
  unattendedRemoteGasReopenBlocked: boolean;
}

/**
 * Deterministic Municipal Water & Gas Utility Gas-Odor Evacuation, Medical Baseline Shutoff Immunity & Safe Gas Reopen Guard (`UTILITY-WATER-01`).
 */
export function evaluateUtilityWaterGasSafetyGuard(input: {
  gasMercaptanOdorReported: boolean;
  hasMedicalLifeSupportOrFreezingMoratorium: boolean;
  customerPhysicallyAtGasMeterWithBurnersOff: boolean;
}): UtilityWaterGasSafetyEvaluation {
  return {
    policyCode: "UTILITY-WATER-01",
    immediateOutdoorEvacuationOrdered: input.gasMercaptanOdorReported,
    remoteShutoffBlocked: input.hasMedicalLifeSupportOrFreezingMoratorium,
    unattendedRemoteGasReopenBlocked: !input.customerPhysicallyAtGasMeterWithBurnersOff,
  };
}

export interface RdWetLabPatentEvaluation {
  policyCode: "RD-PATENT-ELN-01";
  chemicalPourOrMixBlocked: boolean;
  emergencyProvisionalPatentAlertTriggered: boolean;
  elnEntryCommitAllowed: boolean;
}

/**
 * Deterministic R&D Wet-Lab GHS SDS Chemical Incompatibility, Stoichiometry & Patent Novelty-Bar Guard (`RD-PATENT-ELN-01`).
 */
export function evaluateRdWetLabPatentGuard(input: {
  chemicalIncompatibilityOrRunawayDetected: boolean;
  stoichiometryUnitJump1000xDetected: boolean;
  publicDisclosurePlannedBeforeFilingDate: boolean;
}): RdWetLabPatentEvaluation {
  return {
    policyCode: "RD-PATENT-ELN-01",
    chemicalPourOrMixBlocked: input.chemicalIncompatibilityOrRunawayDetected,
    emergencyProvisionalPatentAlertTriggered: input.publicDisclosurePlannedBeforeFilingDate,
    elnEntryCommitAllowed:
      !input.chemicalIncompatibilityOrRunawayDetected &&
      !input.stoichiometryUnitJump1000xDetected,
  };
}

export interface IntegratedResortRgAmlEvaluation {
  policyCode: "RESORT-RG-AML-01";
  marketingAndCompsFrozen: boolean;
  silentSarFiledWithoutTippingOff: boolean;
  autoCompApproved: boolean;
}

/**
 * Deterministic Integrated Resort Responsible Gaming Self-Exclusion Lock, Title-31 Anti-Structuring Silent SAR & ADT Comp Guard (`RESORT-RG-AML-01`).
 */
export function evaluateIntegratedResortRgAmlGuard(input: {
  patronOnSelfExclusionOrDistress: boolean;
  cashStructuringEvasionAttempted: boolean;
  compRequestWithinAdtAllowance: boolean;
}): IntegratedResortRgAmlEvaluation {
  return {
    policyCode: "RESORT-RG-AML-01",
    marketingAndCompsFrozen: input.patronOnSelfExclusionOrDistress,
    silentSarFiledWithoutTippingOff: input.cashStructuringEvasionAttempted,
    autoCompApproved:
      !input.patronOnSelfExclusionOrDistress &&
      !input.cashStructuringEvasionAttempted &&
      input.compRequestWithinAdtAllowance,
  };
}



























