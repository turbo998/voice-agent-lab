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

export type DisruptionCause = "weather_extraordinary" | "atc_restriction" | "airline_technical" | "crew_scheduling";

export interface AirlineIrropsEvaluation {
  policyCode: "AIR-IRROPS-01";
  eu261StatutoryCompensationEur: 0 | 250 | 400 | 600;
  dutyOfCareHotelMealEligible: boolean;
  interlineSegmentsProtected: boolean;
  cabinDowngradeBlocked: boolean;
  baggageClaimStatus: "not_requested" | "auto_approved_under_cap" | "pending_vip_desk_approval";
  rebookingAction: "auto_stage_rebooking" | "escalate_vip_or_interline_desk";
  summaryZh: string;
}

/**
 * Deterministic Airline IRROPS Rebooking, EU261 Compensation & Baggage Claim Guard (`AIR-IRROPS-01` / S13).
 * Computes statutory EU261 compensation without LLM arithmetic hallucinations, prevents interline segment breakage
 * and elite/business cabin downgrades, and gates high-value baggage claims (> $300 USD).
 */
export function evaluateAirlineIrropsGuard(input: {
  flightDistanceKm: number;
  delayHours: number;
  cause: DisruptionCause;
  isInterlinePnr: boolean;
  allInterlineSegmentsCovered: boolean;
  cabinDowngrade: boolean;
  baggageClaimUsd?: number;
}): AirlineIrropsEvaluation {
  const isControllable = input.cause === "airline_technical" || input.cause === "crew_scheduling";
  let eu261StatutoryCompensationEur: 0 | 250 | 400 | 600 = 0;

  if (isControllable && input.delayHours >= 3) {
    if (input.flightDistanceKm <= 1500) {
      eu261StatutoryCompensationEur = 250;
    } else if (input.flightDistanceKm <= 3500) {
      eu261StatutoryCompensationEur = 400;
    } else {
      eu261StatutoryCompensationEur = 600;
    }
  }

  const dutyOfCareHotelMealEligible = input.delayHours >= 2;
  const interlineSegmentsProtected = !input.isInterlinePnr || input.allInterlineSegmentsCovered;
  const cabinDowngradeBlocked = input.cabinDowngrade;

  const claimUsd = input.baggageClaimUsd ?? 0;
  const baggageClaimStatus: AirlineIrropsEvaluation["baggageClaimStatus"] =
    claimUsd <= 0
      ? "not_requested"
      : claimUsd <= 300
        ? "auto_approved_under_cap"
        : "pending_vip_desk_approval";

  const requiresEscalation =
    !interlineSegmentsProtected || cabinDowngradeBlocked || baggageClaimStatus === "pending_vip_desk_approval";

  return {
    policyCode: "AIR-IRROPS-01",
    eu261StatutoryCompensationEur,
    dutyOfCareHotelMealEligible,
    interlineSegmentsProtected,
    cabinDowngradeBlocked,
    baggageClaimStatus,
    rebookingAction: requiresEscalation ? "escalate_vip_or_interline_desk" : "auto_stage_rebooking",
    summaryZh: requiresEscalation
      ? `【AIR-IRROPS-01 航延保护拦截】法定 EU261 赔偿核算为 €${eu261StatutoryCompensationEur}；检测到联程航段未全覆盖、两舱降级或超额行李索赔（$${claimUsd}），已挂起并转交白金签派台审批。`
      : `【AIR-IRROPS-01 自动改签就绪】法定 EU261 赔偿核算为 €${eu261StatutoryCompensationEur}，联程航段与原舱位完整保护，电子餐食酒店券已生成待确认。`,
  };
}

export interface IndustrialFieldEvaluation {
  policyCode: "IND-FIELD-01";
  lotoVerified: boolean;
  safetyInterlockBypassBlocked: boolean;
  plcDiagnosticTreeComplete: boolean;
  sparePartDispatchStatus: "not_requested" | "auto_stage_standard_part" | "pending_regional_lead_approval" | "blocked_incomplete_triage";
  nextStepAllowed: boolean;
  summaryZh: string;
}

const interlockBypassPattern = /(短接|旁路|屏蔽安全|强制合闸|bypass\s+interlock|jumper\s+safety|override\s+light\s+curtain)/i;

/**
 * Deterministic Industrial PLC/Modbus Field Troubleshooting & Spare Part Dispatch Guard (`IND-FIELD-01` / S14).
 * Enforces LOTO zero-energy confirmation before live cabinet actions, blocks safety interlock bypass requests,
 * and requires full PLC diagnostic tree completion + regional lead approval for spare parts > $2,000 USD.
 */
export function evaluateIndustrialFieldGuard(input: {
  plcFaultCode: string;
  lotoConfirmed: boolean;
  utterance: string;
  diagnosticStepsCompleted: number;
  requiredDiagnosticSteps: number;
  sparePartCostUsd?: number;
}): IndustrialFieldEvaluation {
  const safetyInterlockBypassBlocked = interlockBypassPattern.test(input.utterance);
  const plcDiagnosticTreeComplete = input.diagnosticStepsCompleted >= input.requiredDiagnosticSteps;

  if (!input.lotoConfirmed || safetyInterlockBypassBlocked) {
    return {
      policyCode: "IND-FIELD-01",
      lotoVerified: input.lotoConfirmed,
      safetyInterlockBypassBlocked,
      plcDiagnosticTreeComplete,
      sparePartDispatchStatus: "blocked_incomplete_triage",
      nextStepAllowed: false,
      summaryZh: `【IND-FIELD-01 工业安全硬阻断】故障码 ${input.plcFaultCode}：未完成 LOTO 挂牌上锁零能量确认或检测到尝试旁路安全联锁，已锁定柜内排障指令并通知 EHS 安全主管。`,
    };
  }

  const cost = input.sparePartCostUsd ?? 0;
  let sparePartDispatchStatus: IndustrialFieldEvaluation["sparePartDispatchStatus"] = "not_requested";
  if (cost > 0) {
    if (!plcDiagnosticTreeComplete) {
      sparePartDispatchStatus = "blocked_incomplete_triage";
    } else if (cost > 2000) {
      sparePartDispatchStatus = "pending_regional_lead_approval";
    } else {
      sparePartDispatchStatus = "auto_stage_standard_part";
    }
  }

  return {
    policyCode: "IND-FIELD-01",
    lotoVerified: true,
    safetyInterlockBypassBlocked: false,
    plcDiagnosticTreeComplete,
    sparePartDispatchStatus,
    nextStepAllowed: true,
    summaryZh:
      sparePartDispatchStatus === "pending_regional_lead_approval"
        ? `【IND-FIELD-01 高价值备件锁】故障码 ${input.plcFaultCode} 诊断树已完成（LOTO 已核验），备件金额 $${cost} 超过 $2,000 自动阈值，已挂起待大区备件主管签批。`
        : `【IND-FIELD-01 免提排障放行】故障码 ${input.plcFaultCode} LOTO 安全状态已确认，可执行下一步受控测量指引。`,
  };
}

export interface AudioDeepfakeGuardEvaluation {
  policyCode: "S08-DEEPFAKE-GUARD";
  livenessPassed: boolean;
  dynamicChallengePassed: boolean;
  highRiskToolsFrozen: boolean;
  action: "allow_authenticated_turn" | "issue_dynamic_micro_challenge" | "freeze_and_route_fraud_desk";
  summaryZh: string;
}

/**
 * Deterministic Real-Time Audio Deepfake & Replay Dual-Factor Defense (`S08-DEEPFAKE-GUARD`).
 * Combines acoustic liveness / vocoder artifact scoring with dynamic contextual micro-challenges.
 */
export function evaluateAudioDeepfakeGuard(input: {
  acousticLivenessScore: number;
  vocoderArtifactDetected?: boolean;
  replayReflectionDetected?: boolean;
  dynamicChallengeCompleted?: boolean;
  dynamicChallengeCorrect?: boolean;
}): AudioDeepfakeGuardEvaluation {
  const livenessPassed =
    input.acousticLivenessScore >= 0.75 && !input.vocoderArtifactDetected && !input.replayReflectionDetected;

  if (livenessPassed) {
    return {
      policyCode: "S08-DEEPFAKE-GUARD",
      livenessPassed: true,
      dynamicChallengePassed: input.dynamicChallengeCorrect ?? true,
      highRiskToolsFrozen: false,
      action: "allow_authenticated_turn",
      summaryZh: `【S08 声学活体通过】声学活性分 ${(input.acousticLivenessScore * 100).toFixed(1)}%，无声码器相位伪影或重放特征。`,
    };
  }

  if (!input.dynamicChallengeCompleted) {
    return {
      policyCode: "S08-DEEPFAKE-GUARD",
      livenessPassed: false,
      dynamicChallengePassed: false,
      highRiskToolsFrozen: true,
      action: "issue_dynamic_micro_challenge",
      summaryZh: `【S08 深伪风险质询】检测到低活性分（${(input.acousticLivenessScore * 100).toFixed(1)}%）或合成伪影，已冻结写操作并下发动态随机语义微质询。`,
    };
  }

  if (!input.dynamicChallengeCorrect) {
    return {
      policyCode: "S08-DEEPFAKE-GUARD",
      livenessPassed: false,
      dynamicChallengePassed: false,
      highRiskToolsFrozen: true,
      action: "freeze_and_route_fraud_desk",
      summaryZh: "【S08 反欺诈硬熔断】声学伪影告警且动态语义微质询校验失败，已 100% 锁死资金/改签/改密工具并转交反欺诈安全专席。",
    };
  }

  return {
    policyCode: "S08-DEEPFAKE-GUARD",
    livenessPassed: false,
    dynamicChallengePassed: true,
    highRiskToolsFrozen: true,
    action: "freeze_and_route_fraud_desk",
    summaryZh: "【S08 声学异常人工复核】动态质询虽通过但声码器伪影显著，高敏写操作保持只读挂起并由人工专席二次核验。",
  };
}

export interface TelcoEsimGuardEvaluation {
  policyCode: "TELCO-ESIM-01";
  simSwapBlocked: boolean;
  coolingOff24hEnforced: boolean;
  roamingWaiverStatus: "not_requested" | "auto_approved_under_cap" | "pending_billing_supervisor_approval";
  outageDeflectedByCellId: boolean;
  action: "block_sim_swap_and_escalate_fraud" | "auto_deflect_cell_outage" | "stage_roaming_waiver_or_esim" | "hold_supervisor_approval";
  summaryZh: string;
}

const simSwapBypassPattern = /(手机丢了别发原手机|绕过原手机|直接发新邮箱|bypass\s+primary\s+device|send\s+esim\s+to\s+new\s+email)/i;

/**
 * Deterministic Telecom eSIM Anti-SIM-Swap, Roaming Dispute & Cell Outage Deflection Guard (`TELCO-ESIM-01` / S15).
 * Blocks social-engineering eSIM replacement without cryptographic device push verification + 24h cooling-off period,
 * caps automatic roaming bill waivers at $150 USD, and auto-deflects regional tower outages.
 */
export function evaluateTelcoEsimGuard(input: {
  requestsEsimReissue: boolean;
  devicePushPasskeyVerified: boolean;
  utterance: string;
  roamingDisputeUsd?: number;
  activeCellTowerOutageId?: string | null;
}): TelcoEsimGuardEvaluation {
  const bypassRequested = simSwapBypassPattern.test(input.utterance);
  const simSwapBlocked = input.requestsEsimReissue && (!input.devicePushPasskeyVerified || bypassRequested);
  const coolingOff24hEnforced = input.requestsEsimReissue;
  const outageDeflectedByCellId = Boolean(input.activeCellTowerOutageId);

  const disputeUsd = input.roamingDisputeUsd ?? 0;
  const roamingWaiverStatus: TelcoEsimGuardEvaluation["roamingWaiverStatus"] =
    disputeUsd <= 0
      ? "not_requested"
      : disputeUsd <= 150
        ? "auto_approved_under_cap"
        : "pending_billing_supervisor_approval";

  if (simSwapBlocked) {
    return {
      policyCode: "TELCO-ESIM-01",
      simSwapBlocked: true,
      coolingOff24hEnforced: true,
      roamingWaiverStatus,
      outageDeflectedByCellId,
      action: "block_sim_swap_and_escalate_fraud",
      summaryZh:
        "【TELCO-ESIM-01 反 SIM-Swap 硬拦截】严禁仅凭口头静态信息或绕过原设备签发新 eSIM 二维码！已强制锁定 24 小时冷静期并转交反电诈专席。",
    };
  }

  if (roamingWaiverStatus === "pending_billing_supervisor_approval") {
    return {
      policyCode: "TELCO-ESIM-01",
      simSwapBlocked: false,
      coolingOff24hEnforced,
      roamingWaiverStatus,
      outageDeflectedByCellId,
      action: "hold_supervisor_approval",
      summaryZh: `【TELCO-ESIM-01 漫游争议超限挂起】漫游账单争议减免请求 $${disputeUsd} 超过 $150 自动授权上限，已生成账务主管审批单。`,
    };
  }

  if (outageDeflectedByCellId && !input.requestsEsimReissue && disputeUsd <= 0) {
    return {
      policyCode: "TELCO-ESIM-01",
      simSwapBlocked: false,
      coolingOff24hEnforced: false,
      roamingWaiverStatus: "not_requested",
      outageDeflectedByCellId: true,
      action: "auto_deflect_cell_outage",
      summaryZh: `【TELCO-ESIM-01 基站故障风暴自动分流】命中扇区故障单 ${input.activeCellTowerOutageId}，已播报预计修复时间并登记恢复短信通知。`,
    };
  }

  return {
    policyCode: "TELCO-ESIM-01",
    simSwapBlocked: false,
    coolingOff24hEnforced,
    roamingWaiverStatus,
    outageDeflectedByCellId,
    action: "stage_roaming_waiver_or_esim",
    summaryZh: "【TELCO-ESIM-01 核验通过】原设备 Passkey 签名已确认，业务请求已进入受控执行队列。",
  };
}

export interface ColdChainCustomsEvaluation {
  policyCode: "LOG-COLD-01";
  cargoReleaseAllowed: boolean;
  reeferEmergencyDispatched: boolean;
  demurrageWaiverStatus: "not_requested" | "auto_approved_under_cap" | "pending_customs_director_approval";
  action: "block_unverified_cargo_release" | "dispatch_reefer_emergency_and_hold" | "hold_demurrage_director_approval" | "approve_telex_cargo_release";
  summaryZh: string;
}

/**
 * Deterministic Cold-Chain & Maritime Port Customs, Telex Release & Reefer Excursion Guard (`LOG-COLD-01` / S16).
 * Prevents maritime cargo release without both customs clearance and verified Telex Release PIN,
 * auto-dispatches port reefer technicians on temperature excursion (> 8.0°C), and gates > $500 D&D waivers.
 */
export function evaluateColdChainCustomsGuard(input: {
  containerId: string;
  requestsCargoRelease: boolean;
  customsCleared: boolean;
  telexReleasePinVerified: boolean;
  reeferTempCelsius?: number;
  maxAllowedTempCelsius?: number;
  demurrageWaiverUsd?: number;
}): ColdChainCustomsEvaluation {
  const maxTemp = input.maxAllowedTempCelsius ?? 8.0;
  const reeferEmergencyDispatched =
    typeof input.reeferTempCelsius === "number" && input.reeferTempCelsius > maxTemp;

  const cargoReleaseAllowed =
    !input.requestsCargoRelease || (input.customsCleared && input.telexReleasePinVerified);

  const waiverUsd = input.demurrageWaiverUsd ?? 0;
  const demurrageWaiverStatus: ColdChainCustomsEvaluation["demurrageWaiverStatus"] =
    waiverUsd <= 0
      ? "not_requested"
      : waiverUsd <= 500
        ? "auto_approved_under_cap"
        : "pending_customs_director_approval";

  if (input.requestsCargoRelease && !cargoReleaseAllowed) {
    return {
      policyCode: "LOG-COLD-01",
      cargoReleaseAllowed: false,
      reeferEmergencyDispatched,
      demurrageWaiverStatus,
      action: reeferEmergencyDispatched ? "dispatch_reefer_emergency_and_hold" : "block_unverified_cargo_release",
      summaryZh: `【LOG-COLD-01 海运无单放货硬阻断】集装箱 ${input.containerId} 未同时满足海关放行（customsCleared=${input.customsCleared}）与电放提单 PIN 核验（telexPin=${input.telexReleasePinVerified}），严禁解锁码头 TOS 提箱指令！${reeferEmergencyDispatched ? "同时已自动派发冷链柜超温插电抢修 P0 工单。" : ""}`,
    };
  }

  if (demurrageWaiverStatus === "pending_customs_director_approval") {
    return {
      policyCode: "LOG-COLD-01",
      cargoReleaseAllowed,
      reeferEmergencyDispatched,
      demurrageWaiverStatus,
      action: "hold_demurrage_director_approval",
      summaryZh: `【LOG-COLD-01 滞箱费超限挂起】集装箱 ${input.containerId} 申请减免滞港滞箱费 $${waiverUsd} 超过 $500 上限，已转交关务总监审批。`,
    };
  }

  return {
    policyCode: "LOG-COLD-01",
    cargoReleaseAllowed: true,
    reeferEmergencyDispatched,
    demurrageWaiverStatus,
    action: "approve_telex_cargo_release",
    summaryZh: `【LOG-COLD-01 关务与电放核验通过】集装箱 ${input.containerId} 海关放行章与电放 PIN 校验完备，已生成码头提箱放行草稿。`,
  };
}

export type SpeakerRole = "primary_verified" | "bystander_unverified" | "unknown_overlap";

export interface MultiSpeakerRoleGuardEvaluation {
  policyCode: "S09-SPEAKER-ROLE-AUTH";
  writeToolAuthorized: boolean;
  speakerRole: SpeakerRole;
  action: "allow_primary_speaker_tool" | "block_bystander_injection";
  summaryZh: string;
}

/**
 * Deterministic Multi-Party Speaker Diarization & Role-Bound Tool Authorization (`S09-SPEAKER-ROLE-AUTH`).
 * Blocks bystander or overlapping secondary speakers from invoking state-mutating or privacy-sensitive tools.
 */
export function evaluateMultiSpeakerRoleGuard(input: {
  speakerRole: SpeakerRole;
  voiceprintCosineSimilarity: number;
  overlappingBystanderSpeech?: boolean;
  isWriteOrSensitiveTool: boolean;
}): MultiSpeakerRoleGuardEvaluation {
  if (!input.isWriteOrSensitiveTool) {
    return {
      policyCode: "S09-SPEAKER-ROLE-AUTH",
      writeToolAuthorized: true,
      speakerRole: input.speakerRole,
      action: "allow_primary_speaker_tool",
      summaryZh: "【S09 只读查询放行】非敏感只读咨询允许执行。",
    };
  }

  const authorized =
    input.speakerRole === "primary_verified" &&
    input.voiceprintCosineSimilarity >= 0.8 &&
    !input.overlappingBystanderSpeech;

  if (!authorized) {
    return {
      policyCode: "S09-SPEAKER-ROLE-AUTH",
      writeToolAuthorized: false,
      speakerRole: input.speakerRole,
      action: "block_bystander_injection",
      summaryZh: `【S09 同场第三人插话越权硬拦截】检测到指令源自非主核身声纹（role=${input.speakerRole}, sim=${input.voiceprintCosineSimilarity.toFixed(2)}, overlap=${Boolean(input.overlappingBystanderSpeech)}），已阻断高敏工具调用并要求主账户持有人本人重新确认。`,
    };
  }

  return {
    policyCode: "S09-SPEAKER-ROLE-AUTH",
    writeToolAuthorized: true,
    speakerRole: "primary_verified",
    action: "allow_primary_speaker_tool",
    summaryZh: `【S09 主声纹绑定核验通过】主核身说话人声纹匹配（相似度 ${(input.voiceprintCosineSimilarity * 100).toFixed(1)}%），允许进入受控工具阶段。`,
  };
}

