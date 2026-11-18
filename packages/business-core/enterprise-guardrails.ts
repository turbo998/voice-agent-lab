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



