import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertActiveTurnEpoch,
  evaluateAerospaceSatelliteVoiceGuard,
  evaluateAffectiveDeescalationGuard,
  evaluateAidcDatacenterNocVoiceGuard,
  evaluateAirCargoHazmatTruckFleetGuard,
  evaluateAiVoiceInterviewerFairnessGuard,
  evaluateAlphanumericSlotDisambiguationGuard,
  evaluateAutomotiveEcallRoadsideGuard,
  evaluateAutoPropertyFnolClaimsGuard,
  evaluateAviationCruiseRailVoiceGuard,
  evaluateCanaryMemoryPoisoningGuard,
  evaluateCloudCcaasMigrationDecision,
  evaluateCrmCtiScreenPopSyncGuard,
  evaluateCrossBorderLogisticsGuard,
  evaluateElderlyCareFallGuardianGuard,
  evaluateEnergyEvChargingVppGuard,
  evaluateEnterpriseSocSecopsVoiceGuard,
  evaluateFieldAdvisorInPersonGuard,
  evaluateFineArtAuctionBiddingGuard,
  evaluateFmcgB2bSmartCoolerGuard,
  evaluateFoodDairyCipAsepticGuard,
  evaluateGamingNpcMinorSafetyGuard,
  evaluateGlobalMobilityEorVisaGuard,
  evaluateGovUtilityEmergencyGuard,
  evaluateHospitalityPmsGuard,
  evaluateHvacApplianceGasSafetyGuard,
  evaluateInsuranceUnderwritingEstoppelGuard,
  evaluateInterpreterPolarityHotwordGuard,
  evaluateLegalIntakeConflictNotaryGuard,
  evaluateLuxuryVicClientelingGuard,
  evaluateManufacturingFabJitAndonGuard,
  evaluateMaritimeBridgeVtsShipyardGuard,
  evaluateMediaDubbingIsochronyGuard,
  evaluateMedicalAestheticSafetyGuard,
  evaluateMiningOilfieldAtexGuard,
  evaluateMortgageCollectionsFdcpaGuard,
  evaluateMultimodalCobrowsingSyncGuard,
  evaluateMunicipalDisasterEvacGuard,
  evaluateNonprofitDonorEthicsGuard,
  evaluateOffshoreWindGridDispatchGuard,
  evaluateOmnichannelWalletBreakerGuard,
  evaluateOpenSourceVoiceGpuSizingGuard,
  evaluatePayrollTaxAdvisoryGuard,
  evaluateDentalEyeClinicSafetyGuard,
  evaluateAviationMroAirworthinessGuard,
  evaluateBanquetAllergenCutoffGuard,
  evaluateBiopharmaColdChainCartGuard,
  evaluateBloodOrganLifelineGuard,
  evaluateCampusBusPickupSafetyGuard,
  evaluateConstructionOshaBimGuard,
  evaluateIntegratedResortRgAmlGuard,
  evaluatePharmaClinicalTrialPvGuard,
  evaluatePharmaMedInfoMirfGuard,
  evaluatePrivateBankingFamilyOfficeGuard,
  evaluatePublicProcurementBidEvalGuard,
  evaluateRdWetLabPatentGuard,
  evaluateRetailPharmacyPbmSafetyGuard,
  evaluateS2sEmotionalContagionLufsGuard,
  evaluateSaMaster100ProductionGate,
  evaluateSaasChurnSaveDiscountGuard,
  evaluateSmartAgriPhiBiosecurityGuard,
  evaluateSmartMallParkingCodeAdamGuard,
  evaluateSmartHospitalSurgicalOrGuard,
  evaluateSmartPortCustomsGuard,
  evaluateSmartPropertyElevatorGuard,
  evaluateSocialInAppVoiceCallingGuard,
  evaluateHospiceBereavementCareGuard,
  evaluateSocraticTutorFerpaGuard,
  evaluateSovereignCloudVoiceGuard,
  evaluateSpeechAccessibilityDisfluencyGuard,
  evaluateStadiumEventVenueGuard,
  evaluateStoreHaccpFoodSafetyGuard,
  evaluateTelecomIspOutageSimSwapGuard,
  evaluateThemeParkMuseumConciergeGuard,
  evaluateTradeFinanceSwiftSanctionsGuard,
  evaluateTradeshowLeadCaptureGuard,
  evaluateTurnEpochWriteFence,
  evaluateUnifiedCommsVoiceIntegrationGuard,
  evaluateUrbanRailMetroDispatchGuard,
  evaluateUtilityWaterGasSafetyGuard,
  evaluateVeterinaryPoisonTriageGuard,
  evaluateVoiceBenchmarkHarnessSelectionGate,
  evaluateVoiceCicdReleaseGateGuard,
  evaluateVoiceFrontier2026DualBrainVisionGuard,
  evaluateVoiceLatencySpeculativeGuard,
  evaluateVoiceMcpTwoPhaseSagaGuard,
  evaluateCcaasAcsConnectGenesysTwilioTcoGuard,
  evaluateContactCenterAgentAssistCopilotGuard,
  evaluateHealthcarePatientSchedulingTriageGuard,
  evaluateRetailBankingCardDisputeGuard,
  evaluateRetailEcommerceWismoReturnsGuard,
  evaluateStreamingSttEngineSelectionGuard,
  evaluateStreamingTtsVoiceCloningGuard,
  evaluateVoiceRagLowLatencyPhoneticGuard,
  evaluateOutboundVoiceSalesTcpaGuard,
  evaluateAutomotiveDealershipDmsServiceGuard,
  evaluateItHelpdeskServiceNowVoiceGuard,
  evaluateLiveMeetingSimultaneousInterpreterGuard,
  evaluateDigitalAvatarKioskVoiceGuard,
  evaluateAiSalesRoleplayCoachingSimulatorGuard,
  evaluateAirlineIrropsFlightRebookingGuard,
  evaluateNativeS2sVsCascadedTcoInflectionGuard,
  evaluateVoiceFrameworkWorkerScalingGuard,
  evaluateQsrDriveThruVoiceOrderingGuard,
  evaluateLifeHealthInsuranceUnderwritingRenewalGuard,
  evaluateAutomotiveInCabinMultimodalVoiceGuard,
  evaluateManagedVsSelfHostedVoicePlatformTcoGuard,
  evaluateContactCenterWarmTransferContextHandoffGuard,
  evaluateWealthRoboAdvisorPortfolioSuitabilityGuard,
  evaluateCorporateTravelTmcConcurExpenseVoiceGuard,
  evaluateEcommerceLivestreamAvatarAnchorGuard,
  evaluateSmartGlassesWearableMultimodalVoiceGuard,
  evaluateEnterpriseHrsscBenefitsPayrollVoiceGuard,
  evaluateConsumerElectronicsDiagnosticRmaVoiceGuard,
  evaluateVoiceAgentSecurityPrivilegeFirewallGuard,
  evaluateCommercialFleetTruckingDispatchVoiceGuard,
  evaluateRealEstateLeasingFairHousingVoiceGuard,
  evaluateAutomotiveTestDriveFinancingTradeInVoiceGuard,
  evaluateHomeServicesFieldDispatchServiceTitanVoiceGuard,
  evaluateGlobalFreightForwardingDemurrageVoiceGuard,
  evaluateMerchantPosAcquiringSettlementVoiceGuard,
  evaluateEnterpriseB2bAccountsReceivableVoiceGuard,
  evaluateSubscriptionRetentionSaveDeskFtcVoiceGuard,
  evaluateHotelInRoomVoiceConciergePmsPrivacyGuard,
  evaluateMedicalDevicePatientOnboardingAdherenceVoiceGuard,
  evaluateSalonSpaWellnessStudioBookingVoiceGuard,
  evaluateHeavyEquipmentRentalBreakdownVoiceGuard,
  evaluatePrivateAviationCharterFboVoiceGuard,
  evaluateDiagnosticLabHealthScreeningVoiceGuard,
  evaluateFacilityManagementJanitorialSlaVoiceGuard,
  evaluateWeddingEventVenueBridalConciergeVoiceGuard,
  evaluateSelfStorageMovingTruckRentalVoiceGuard,
  evaluateLegalIntakeConflictAndUplVoiceGuard,
  evaluateCpaTaxPreparationIrs7216VoiceGuard,
  evaluateStaffingRpoEeocRecruitingVoiceGuard,
  evaluateEnterpriseProcurementAribaExpeditingVoiceGuard,
  evaluateCybersecuritySocIncidentBridgeVoiceGuard,
  evaluateHospitalityMiceGroupAttritionVoiceGuard,
  evaluateCommercialInsuranceBrokerageCoiFnolVoiceGuard,
  evaluateEvChargingOcppConnectorVoiceGuard,
  evaluateIntellectualPropertyPatentDocketVoiceGuard,
  evaluateFoodSafetyColdChainFsmaRecallVoiceGuard,
  evaluateHazmatChemicalSpillDispatchVoiceGuard,
  evaluateInvestorRelationsRegFdMnpiVoiceGuard,
  evaluateItAssetDispositionNist80088VoiceGuard,
  evaluateFineArtAuctionBiddingAmlVoiceGuard,
  evaluateSemiconductorCleanroomFabVoiceGuard,
  evaluateThemeParkRideSafetyCodeAdamVoiceGuard,
  evaluateGenomicOncologyLiquidBiopsyVoiceGuard,
  evaluateSeniorLivingMemoryCareFallVoiceGuard,
  evaluateCorporateImmigrationMobilityVoiceGuard,
  evaluateEsgCarbonRegistryRetirementVoiceGuard,
  evaluateMaritimeCharteringNorWarRiskVoiceGuard,
  evaluateBloodBankPlasmaCrossmatchVoiceGuard,
  evaluateEvtolDroneUtmBvlosVoiceGuard,
  evaluatePrivacyDsarCrossBorderBreachVoiceGuard,
  evaluateRenewableWindSolarScadaVppVoiceGuard,
  evaluateFilmTvProductionSagStuntVoiceGuard,
  evaluateAviationMroPart145AirworthinessVoiceGuard,
  evaluateAgritechGrainFumigationBiosecurityVoiceGuard,
  evaluateBiopharmaCarTChainOfIdentityVoiceGuard,
  evaluateCorporateTreasuryFxWireVoiceGuard,
  evaluateCommercialRealEstateColocationYardiVoiceGuard,
  evaluateDistrictHeatingChpSteamVoiceGuard,
  evaluateHybridS2sCascadeIntentRouterVoiceGuard,
  evaluateAvatarLivestreamRetailKioskVoiceGuard,
  evaluateLiveInterpreterBoardMeetingVoiceGuard,
  evaluateSlowApiAsyncFillerHeartbeatVoiceGuard,
  evaluateWarmHandoffWhisperContextBridgeVoiceGuard,
  evaluateSalesRoleplayMedrepCoachingVoiceGuard,
  evaluateAutomotiveCockpitEdgeCloudVoiceGuard,
  evaluateMultiAgentVoiceHandoffGraphGuard,
  evaluateComplianceRecordingAutomatedQaVoiceGuard,
  evaluateVoiceOrchestrationFrameworkMatrixGuard,
  evaluateSttTtsVoiceCloningMatrixGuard,
  evaluateOmnichannelIngressVoiceIsolationGuard,
  evaluateSmartWearableGlassesEarbudsVoiceGuard,
  evaluateFrontierDuplexAudioEotVoiceGuard,
  evaluateLuxuryVicClientelingBrinksVoiceGuard,
  evaluateOperatingRoomSurgicalTimeoutVoiceGuard,
  evaluateVoiceNativeAgenticRagGuard,
  evaluateQsrDriveThruAllergenPosVoiceGuard,
  evaluateLanguageTutorExecCoachingVoiceGuard,
  evaluateVoiceSecurityOwaspAgenticFirewallGuard,
  evaluateIndustrialSapPmLotoAtexVoiceGuard,
  evaluateOutboundAmdTcpaOrchestrationVoiceGuard,
  evaluateMuseumDocentUwbFactLockVoiceGuard,
  evaluateWaterUtilityScadaDosingVoiceGuard,
  evaluateEarningsIrRegFdMnpiVoiceGuard,
  evaluateGenomicPathologyAcmgVusVoiceGuard,
  evaluateEvMcsOcppV2gSafetyVoiceGuard,
  evaluateSmartBuildingElevatorBmsVoiceGuard,
  evaluateRoadsideAssistEvFlatbedVoiceGuard,
  evaluateVetLivestockBiosecurityVcprVoiceGuard,
  evaluateExamProctorOralAdaVoiceGuard,
  evaluateTeleOptometryRxSafetyVoiceGuard,
  evaluateBiopharmaCleanroomEbrGmpVoiceGuard,
  evaluateTaxCpaCircular230Section7216VoiceGuard,
  evaluateTruckingEldHosHazmatVoiceGuard,
  evaluateConstructionBimOshaCraneVoiceGuard,
  evaluateCreditFcraEcoaAdverseVoiceGuard,
  evaluateSleepCpapNivRespiratoryVoiceGuard,
  evaluateCruiseShipboardSolasConciergeVoiceGuard,
  evaluateRobotaxiAvMrcResponderVoiceGuard,
  evaluateBespokeCoutureAlterationVoiceGuard,
  evaluateCommercialInsuranceAcord25MoratoriumVoiceGuard,
  evaluateWetLabSdsPyrophoricHfVoiceGuard,
  evaluateStadiumEventCrowdAedVoiceGuard,
  evaluateFertilityIvfCryobankWitnessVoiceGuard,
  evaluateWasteMrfLithiumHotloadVoiceGuard,
  evaluateBizavFboJetMisfuelDefVoiceGuard,
  evaluateOrthoRehabWeightbearingDvtVoiceGuard,
  evaluateEstateTrustUndueInfluenceVoiceGuard,
  evaluatePrecisionAgGrainBinDriftVoiceGuard,
  evaluateNdtRadiographyIr192SurveyVoiceGuard,
  evaluateWarehouseAmrAsrsIso3691VoiceGuard,
  evaluatePediatricVaccineAcipColdchainVoiceGuard,
  evaluateTitleEscrowClosingWireTridVoiceGuard,
  evaluateRadiologyMriFerromagneticContrastVoiceGuard,
  evaluateColdStorageReeferFsmaAmmoniaVoiceGuard,
  evaluateSpecialtyPharmacyRemsBiologicsVoiceGuard,
  evaluateFoodMfgAllergenChangeoverNfpa61VoiceGuard,
  evaluateAquaticWaterparkHypochloriteVgbVoiceGuard,
  evaluatePrintingPackagingLowmigrationLelVoiceGuard,
  evaluatePestControlFumigationVikaneFifraVoiceGuard,
  evaluateSkiResortAvalancheGondolaB77VoiceGuard,
  evaluateCommercialLaundryHlacSpontaneousFireVoiceGuard,
  evaluateWineryDistilleryCellarCo2StillVoiceGuard,
  evaluatePulpPaperBlrbacSmeltClo2VoiceGuard,
  evaluateGlassMfgFloatTinbathStillageVoiceGuard,
  evaluateTireRubberCuringBanburyDotVoiceGuard,
  evaluateTextileDyeingHthpHydrosulfiteNeedleVoiceGuard,
  evaluatePaintCoatingResinStaticIsocyanateVoiceGuard,
  evaluateWoodworkingFurnitureNfpa664CarbVoiceGuard,
  evaluateElectroplatingAnodizingCyanideHcnVoiceGuard,
  evaluateIndustrialGasAsuLoxCgaVoiceGuard,
  evaluateCementKilnCycloneCoalmillCoVoiceGuard,
  evaluateReadyMixConcreteDrumWaterBoomVoiceGuard,
  evaluateAsphaltHmaBitumenBoiloverH2sVoiceGuard,
  evaluateCeramicsKilnBallmillSilicaVoiceGuard,
  evaluatePlasticsMoldingBarrelAnsiB151VoiceGuard,
  evaluateHeatTreatingFurnaceNfpa86QuenchVoiceGuard,
  evaluateFoundryCastingInductionWetscrapVoiceGuard,
  evaluateMetalStampingPressDieblockB11VoiceGuard,
  evaluateWeldingRoboticLaserPhosgeneArgonVoiceGuard,
  evaluateCncMachiningTitaniumMagnesiumB11VoiceGuard,
  evaluateAdditiveMfgLpbfPowderNfpa484VoiceGuard,
  evaluateAerospaceCompositeAutoclaveExothermVoiceGuard,
  evaluatePcbSmtAssemblyReflowJstd033VoiceGuard,
  evaluateDisplaySolarFabSilaneHfSemiVoiceGuard,
  evaluateOpticalFiberPreformDrawingSicl4VoiceGuard,
  evaluateHvCableXlpeCvFaradayIeee510VoiceGuard,
  evaluatePowerTransformerVpdMarxIeee510VoiceGuard,
  evaluateWindBladeVartmTurnoverNacelleVoiceGuard,
  evaluateShipbuildingDrydockGoliathCoatingVoiceGuard,
  evaluateRailRollingStockBogie25kvDepotVoiceGuard,
  evaluateAircraftFalWingtankRiggingJackVoiceGuard,
  evaluateAeroEngineTestcellMroNfpa409VoiceGuard,
  evaluateLithiumBatteryGigafactoryNfpa855VoiceGuard,
  evaluateSteelMillBofCasterOsha1910VoiceGuard,
  evaluatePetrochemicalRefineryTurnaroundApi2217VoiceGuard,
  evaluateNonferrousSmeltingPotlineNfpa484VoiceGuard,
  evaluateCcaasIvrModernizationHandoffVoiceGuard,
  evaluateOutboundOrchestrationLivekitRetellTcoVoiceGuard,
  evaluateS2sVsCascadedDeepseekFinopsRouterVoiceGuard,
  evaluateGlobalItHrHelpdeskVoiceRagGuard,
  evaluateRealtimeSalesCopilotCrmWritebackVoiceGuard,
  evaluateBrandVoiceCloningAvatarComplianceGuard,
  evaluateDuplexBargeinSemanticEotAsyncFillerGuard,
  evaluateEnterpriseMeetingInterpreterGlossaryGuard,
  evaluateAiRoleplaySparringRubricEvalGuard,
  evaluateEdgeCloudMultimodalWebrtcFallbackGuard,
  evaluateLegacyPbxCcaasAiVoiceMigrationGuard,
  evaluateEcommerceWismoRmaSurgeVoiceGuard,
  evaluateVoiceOtelSyntheticCicdCanaryGuard,
  evaluateMultiAgentVoiceSwarmHandoffGuard,
  evaluateFinancialPciRedactionPostcallQaGuard,
  evaluateHealthcareTriageAmbientScribeFhirGuard,
  evaluateVoiceOwaspSecurityIdorFirewallGuard,
  evaluateAirlineIrropsHotelPmsConciergeGuard,
  evaluateSelfHostedOpensourceGpuVsCloudTcoGuard,
  evaluateVoiceCapacityPtuCachingFinopsGuard,
  evaluateVoicePromptMarkdownSanitizerGuard,
  evaluateWarehousePickByVoiceColdChainGuard,
  evaluateWealthDualRecordingGuard,
  evaluateWearableFitnessHeartRateGuard,
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
      mustContain: ["318 篇", "solution-architecture.md", "azure-speech-diarization-poc.md", "benchmark-cards.html"],
    },
    {
      relPath: "docs/asset-catalog.en.md",
      mustContain: ["318 Bilingual Guides", "solution-architecture.en.md", "azure-speech-diarization-poc.en.md", "benchmark-cards.html"],
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

test("318 Enterprise Voice AI selection guides maintain 1:1 zh-CN/en parity and exclude narrow RFC bloat", async () => {
  const docEntries = await readdir(resolve(repoRoot, "docs"));
  const zhFaqFiles = docEntries.filter((f) => f.endsWith("-faq.md")).sort();
  const enFaqFiles = docEntries.filter((f) => f.endsWith("-faq.en.md")).sort();

  assert.equal(zhFaqFiles.length, 318, `Expected 318 curated zh-CN selection guides, found ${zhFaqFiles.length}`);
  assert.equal(enFaqFiles.length, 318, `Expected 318 curated English selection guides, found ${enFaqFiles.length}`);

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

  const taxGuard = evaluatePayrollTaxAdvisoryGuard({
    requestsVerbalBankOrIbanChange: true,
    rawTaxId: "9131O000MA1FL8S21X",
    ragChunkTaxYear: 2023,
    activeFilingTaxYear: 2026,
    draftPromisesGuaranteedTaxRefund: true,
  });
  assert.equal(taxGuard.verbalBankAccountChangeBlocked, true);
  assert.equal(taxGuard.normalizedTaxId, "91310000MA1FL8521X");
  assert.equal(taxGuard.taxChunkYearAccepted, false);
  assert.equal(taxGuard.unconditionalRefundPromiseBlocked, true);

  const fitGuard = evaluateWearableFitnessHeartRateGuard({
    unvoicedPantingDetectedWithoutF0: true,
    currentHrBpm: 191,
    maxSafeHrBpm: 195,
    measuredJointRomDeg: 93.5,
    prescribedMaxRomDeg: 90.0,
    sharpPainOrPopReported: true,
  });
  assert.equal(fitGuard.pantingFalseBargeInIgnored, true);
  assert.equal(fitGuard.sprintPromptRevokedForCooldown, true);
  assert.equal(fitGuard.postOpRomStopTriggered, true);
  assert.equal(fitGuard.sharpPainEmergencyHalt, true);

  const fdcpaGuard = evaluateMortgageCollectionsFdcpaGuard({
    callsInRolling7Days: 7,
    borrowerLocalHour24: 22,
    ceaseAndDesistActive: false,
    rightPartyContactVerified: false,
    borrowerReportsHardshipOrIllness: true,
  });
  assert.equal(fdcpaGuard.outboundDialAllowed, false);
  assert.equal(fdcpaGuard.debtDetailsUnlocked, false);
  assert.equal(fdcpaGuard.hardshipForbearancePivotTriggered, true);

  const vetGuard = evaluateVeterinaryPoisonTriageGuard({
    species: "canine",
    isBrachycephalicBreed: true,
    ingestedSharpOrCausticItem: false,
    calculatedTheobromineMgPerKg: 72.7,
    hasGdvOrUrinaryObstructionSigns: false,
    petStatus: "DECEASED",
  });
  assert.equal(vetGuard.homeEmesisAllowed, false);
  assert.equal(vetGuard.emergencyErDispatchRequired, true);
  assert.equal(vetGuard.outboundMarketingCallAllowed, false);

  const hvacGuard = evaluateHvacApplianceGasSafetyGuard({
    gasSmellOrSmokeDetected: true,
    draftInstructsToolsOrCasingRemoval: true,
    resolvedBomPartSku: "PCB-9012",
    outdoorTempCelsius: 39.5,
    householdHasSeniorOrInfant: true,
  });
  assert.equal(hvacGuard.gasOrSmokeEmergencyShutoffAlert, true);
  assert.equal(hvacGuard.diyCasingOrCapacitorInstructionBlocked, true);
  assert.equal(hvacGuard.preReservedBomPartSku, "PCB-9012");
  assert.equal(hvacGuard.heatwaveSeniorPriority4h, true);

  const expoGuard = evaluateTradeshowLeadCaptureGuard({
    publicKioskAsksForConfidentialFloorPrice: true,
    draftIncludesCustomDiscountBelowMsrp: true,
    repApprovedCustomQuote: false,
    gdprConsentVerified: true,
  });
  assert.equal(expoGuard.offlineQueuePersisted, true);
  assert.equal(expoGuard.confidentialFloorPriceBlocked, true);
  assert.equal(expoGuard.repApprovalRequiredForCustomQuote, true);
  assert.equal(expoGuard.automatedFollowupEmailAllowed, false);

  const saasGuard = evaluateSaasChurnSaveDiscountGuard({
    accountArrUsd: 65000,
    discountsClaimedLast12m: 1,
    requestedDiscountPct: 70,
    saveOffersDeclinedCount: 1,
  });
  assert.equal(saasGuard.clampedDiscountPct, 0);
  assert.equal(saasGuard.immediateCancelExecuted, true);
  assert.equal(saasGuard.enterpriseVpAlertTriggered, true);

  const pharmaGuard = evaluatePharmaClinicalTrialPvGuard({
    isEcoaScaleQuestion: true,
    llmParaphrasingAttempted: true,
    participantVoiceprintVerified: false,
    unblindingSpeculationAttempted: true,
    saeHospitalizationOrSyncopeDetected: true,
  });
  assert.equal(pharmaGuard.ecoaParaphrasingBlocked, true);
  assert.equal(pharmaGuard.caregiverProxyBlocked, true);
  assert.equal(pharmaGuard.unblindingSpeculationBlocked, true);
  assert.equal(pharmaGuard.sae24hE2bReportDispatched, true);

  const dentalEyeGuard = evaluateDentalEyeClinicSafetyGuard({
    takesAnticoagulantOrBisphosphonate: false,
    softContactLensWashoutDays: 2,
    isRefractiveOrCataractScan: true,
    postOpVisionLossOrSevereEyePain: true,
    postOpUncontrolledBleedOrDysphagia: false,
  });
  assert.equal(dentalEyeGuard.directSurgerySlotBlocked, true);
  assert.equal(dentalEyeGuard.contactLensWashoutSatisfied, false);
  assert.equal(dentalEyeGuard.immediateOncallSurgeonEscalated, true);

  const latencyGuard = evaluateVoiceLatencySpeculativeGuard({
    toolIsMutatingWrite: true,
    asrPartialStability: 0.94,
    finalSlotsMatchSpeculativePartial: false,
    firstTtsChunkWordCount: 4,
  });
  assert.equal(latencyGuard.speculativePrefetchAllowed, false);
  assert.equal(latencyGuard.staleSpeculativeCacheEvicted, true);
  assert.equal(latencyGuard.ttsFirstChunkUnderrunSafe, true);

  const ngoGuard = evaluateNonprofitDonorEthicsGuard({
    cognitiveConfusionOrHardshipDetected: true,
    donorDeclinedCount: 0,
    explicitMonthlyRecurringConsentGiven: true,
    employerOffersMatchingGift: true,
  });
  assert.equal(ngoGuard.solicitationImmediatelyHalted, true);
  assert.equal(ngoGuard.recurringMonthlyEnrollmentAllowed, false);
  assert.equal(ngoGuard.corporateMatchingGiftPrompted, false);

  const portGuard = evaluateSmartPortCustomsGuard({
    iso6346CheckDigitValid: true,
    isImdgHazmatContainer: true,
    portDgPermitApproved: true,
    tariffEvasionOrDualUseBypassRequested: false,
  });
  assert.equal(portGuard.gateBarrierOpenAllowed, true);
  assert.equal(portGuard.dedicatedDgYardAssigned, true);
  assert.equal(portGuard.tariffEvasionOrDualUseBlocked, false);

  const haccpGuard = evaluateStoreHaccpFoodSafetyGuard({
    measuredColdFoodTempCelsius: 9.4,
    bleProbeHardwarePulseVerified: true,
    correctiveDiscardOrReheatCompleted: false,
    shiftManagerConfirmed86Outage: true,
  });
  assert.equal(haccpGuard.logSubmissionAllowed, false);
  assert.equal(haccpGuard.correctiveDiscardOrReheatRequired, true);
  assert.equal(haccpGuard.omnichannel86StockoutSynced, true);

  const hospiceGuard = evaluateHospiceBereavementCareGuard({
    breakthroughPainOrDyspneaReported: true,
    draftSuggestsOpioidDoseChange: true,
    accountHolderReportedDeceased: true,
    draftIncludesCommercialUpsell: true,
  });
  assert.equal(hospiceGuard.opioidDosageAdviceBlocked, true);
  assert.equal(hospiceGuard.deceasedHolderSelfAuthBypassed, true);
  assert.equal(hospiceGuard.commercialUpsellBlocked, true);
  assert.equal(hospiceGuard.oncallHospiceRnBridged, true);

  const stadiumGuard = evaluateStadiumEventVenueGuard({
    pastGameClockAlcoholCutoff: true,
    alcoholicDrinksInOrderCount: 6,
    orderExceedsSuiteHostSingleItemCap: true,
    suiteHostApprovedHighTicketItem: false,
    requestedExitDensityPersonsPerSqm: 4.1,
  });
  assert.equal(stadiumGuard.alcoholOrderBlocked, true);
  assert.equal(stadiumGuard.suiteHostApprovalRequired, true);
  assert.equal(stadiumGuard.congestedExitRerouted, true);

  const agriGuard = evaluateSmartAgriPhiBiosecurityGuard({
    daysToHarvest: 2,
    pesticideRequiredPhiDays: 7,
    isBannedOrRestrictedOnFoodCrop: false,
    livestockClusterFeverMassDeathDetected: true,
  });
  assert.equal(agriGuard.chemicalSprayBlockedByPhiOrBan, true);
  assert.equal(agriGuard.biologicalControlRecommended, true);
  assert.equal(agriGuard.livestockEpidemicQuarantineTriggered, true);

  const constructGuard = evaluateConstructionOshaBimGuard({
    oxygenPct: 18.2,
    h2sPpm: 14,
    craneWindSpeedMps: 12.4,
    lotoOwnerVoiceprintVerified: false,
    blueprintRevisionIsSuperseded: true,
  });
  assert.equal(constructGuard.workPermitOrLiftAllowed, false);
  assert.equal(constructGuard.supersededBlueprintBlocked, true);
  assert.equal(constructGuard.lotoUnlockAuthorized, false);

  const bloodOrganGuard = evaluateBloodOrganLifelineGuard({
    donorIntervalAndTeratogenicMedClear: false,
    postDonationFeverLookbackReported: true,
    primaryOrganRecipientHasActiveInfection: true,
  });
  assert.equal(bloodOrganGuard.donationAppointmentAllowed, false);
  assert.equal(bloodOrganGuard.isbt128UnitQuarantineLocked, true);
  assert.equal(bloodOrganGuard.backupOrganRecipientAlerted, true);

  const mroGuard = evaluateAviationMroAirworthinessGuard({
    tailNumberMsnEffectivityLocked: true,
    mechanicVoiceprintId: "MECH-401",
    riiInspectorVoiceprintId: "INSP-809",
    unreturnedFodToolsCount: 1,
  });
  assert.equal(mroGuard.ammTorqueReadbackAllowed, true);
  assert.equal(mroGuard.riiSignoffAuthorized, true);
  assert.equal(mroGuard.panelClosureAndCrsReleaseAllowed, false);

  const campusGuard = evaluateCampusBusPickupSafetyGuard({
    busRemainingChildrenCount: 1,
    rearPhysicalCheckButtonPressed: false,
    callerRequestsPhonePickupChange: true,
    callerMatchesCustodyRestriction: true,
    sameClassAcuteGiOrRashAbsenceCount: 3,
  });
  assert.equal(campusGuard.busLockdownAllowed, false);
  assert.equal(campusGuard.phonePickupModificationBlocked, true);
  assert.equal(campusGuard.custodyAlertTriggered, true);
  assert.equal(campusGuard.schoolNurseOutbreakAlertTriggered, true);

  const utilityGuard = evaluateUtilityWaterGasSafetyGuard({
    gasMercaptanOdorReported: true,
    hasMedicalLifeSupportOrFreezingMoratorium: true,
    customerPhysicallyAtGasMeterWithBurnersOff: false,
  });
  assert.equal(utilityGuard.immediateOutdoorEvacuationOrdered, true);
  assert.equal(utilityGuard.remoteShutoffBlocked, true);
  assert.equal(utilityGuard.unattendedRemoteGasReopenBlocked, true);

  const rdPatentGuard = evaluateRdWetLabPatentGuard({
    chemicalIncompatibilityOrRunawayDetected: true,
    stoichiometryUnitJump1000xDetected: false,
    publicDisclosurePlannedBeforeFilingDate: true,
  });
  assert.equal(rdPatentGuard.chemicalPourOrMixBlocked, true);
  assert.equal(rdPatentGuard.emergencyProvisionalPatentAlertTriggered, true);
  assert.equal(rdPatentGuard.elnEntryCommitAllowed, false);

  const resortGuard = evaluateIntegratedResortRgAmlGuard({
    patronOnSelfExclusionOrDistress: true,
    cashStructuringEvasionAttempted: true,
    compRequestWithinAdtAllowance: true,
  });
  assert.equal(resortGuard.marketingAndCompsFrozen, true);
  assert.equal(resortGuard.silentSarFiledWithoutTippingOff, true);
  assert.equal(resortGuard.autoCompApproved, false);

  const cicdGuard = evaluateVoiceCicdReleaseGateGuard({
    safetyGuardrailPassRate: 1.0,
    roundTripTtsEntityWer: 0.182,
    p95TtfaLatencyMs: 510,
    maxMidSentenceUnderrunGapMs: 410,
  });
  assert.equal(cicdGuard.releasePromotionAllowed, false);
  assert.equal(cicdGuard.roundTripTtsFailed, true);
  assert.equal(cicdGuard.audioBufferUnderrunFailed, true);

  const pharmGuard = evaluateRetailPharmacyPbmSafetyGuard({
    isIsmpLasaDrug: true,
    indicationAndRxNumberVerified: true,
    isDeaScheduleIIOrEarlyControlled: false,
    majorDrugInteractionDetected: true,
    pediatricWeightKgAndMgPerMlVerified: false,
  });
  assert.equal(pharmGuard.autoRefillAllowed, false);
  assert.equal(pharmGuard.pharmacistMajorDdiTransferRequired, true);
  assert.equal(pharmGuard.pediatricDoseReadbackAllowed, false);

  const miningGuard = evaluateMiningOilfieldAtexGuard({
    blastZoneUwbPersonnelCount: 1,
    methaneCh4Pct: 0.32,
    threeManDistinctVoiceprintsVerified: true,
    h2sLeakPpm: 28,
    networkConnectivityBps: 0,
  });
  assert.equal(miningGuard.detonatorUnlockAllowed, false);
  assert.equal(miningGuard.upwindHighGroundEvacuationRouted, true);
  assert.equal(miningGuard.offlineRefugeChamberGuideActive, true);

  const banquetGuard = evaluateBanquetAllergenCutoffGuard({
    severeAnaphylaxisAllergenReported: true,
    hoursUntilEventStart: 24,
    hostRequestsGuaranteedTableReduction: true,
    hostVoiceprintVerifiedForBackupTables: true,
  });
  assert.equal(banquetGuard.purpleTicketIsolatedMealDispatched, true);
  assert.equal(banquetGuard.guaranteedHeadcountReductionBlocked, true);
  assert.equal(banquetGuard.backupTableOpeningAuthorized, true);

  const biopharmaGuard = evaluateBiopharmaColdChainCartGuard({
    coiDualVoiceprintVerified: true,
    cryoShipperArrivedAtHospitalBelowMinus150C: false,
    cryoShipperTiltDegrees: 68,
    temperatureExcursionDetected: true,
  });
  assert.equal(biopharmaGuard.lymphodepletionChemoReleaseAllowed, false);
  assert.equal(biopharmaGuard.immediateTarmacUprightCallTriggered, true);
  assert.equal(biopharmaGuard.tempExcursionQuarantinedPendingQp, true);

  const disasterGuard = evaluateMunicipalDisasterEvacGuard({
    streetFloodWaterDepthCm: 65,
    citizenBedriddenOrTwoCallsUnanswered: true,
    nearestShelterOccupancyPct: 94,
  });
  assert.equal(disasterGuard.basementCarRetrievalBlockedAndVerticalEvacOrdered, true);
  assert.equal(disasterGuard.doorToDoorStretcherRescueDispatched, true);
  assert.equal(disasterGuard.overflowShelterRerouted, true);

  const master100Guard = evaluateSaMaster100ProductionGate({
    turnEpochBargeInFenceActive: true,
    highRiskWriteReadbackVerified: true,
    crisisZeroAuthPreemptionActive: true,
    warmHandoffContextPacketAttached: true,
    voiceCicdRoundTripGatePassed: true,
  });
  assert.equal(master100Guard.productionGoLiveApproved, true);
  assert.equal(master100Guard.missingCoreGuardrailsCount, 0);

  const frontier2026Guard = evaluateVoiceFrontier2026DualBrainVisionGuard({
    requiresMultiStepMathOrPolicyReasoning: true,
    visualSceneDeltaPct: 22,
    userPointingOrDeicticGestureDetected: true,
    cloudRttMs: 520,
  });
  assert.equal(frontier2026Guard.system1DirectFinalAnswerAllowed, false);
  assert.equal(frontier2026Guard.system2AsyncReasoningVerifierDispatched, true);
  assert.equal(frontier2026Guard.continuousRawVideoFramesBlocked, true);
  assert.equal(frontier2026Guard.keyframeInjectedToVlm, true);
  assert.equal(frontier2026Guard.onDeviceNpuS2sFailoverActive, true);

  const fabJitGuard = evaluateManufacturingFabJitAndonGuard({
    foupLotIdMatchesMesRecipe: false,
    chamberPurgeInterlockCleared: true,
    safetyCriticalTorqueFaultOrAndonCord: true,
    stationCycleTimeRemainingSec: 14,
  });
  assert.equal(fabJitGuard.mesRecipeStartAuthorized, false);
  assert.equal(fabJitGuard.waferScrapPreventionLockTriggered, true);
  assert.equal(fabJitGuard.andonTeamLeaderDispatched0ms, true);
  assert.equal(fabJitGuard.stationConveyorReleaseAllowed, false);

  const tradeSwiftGuard = evaluateTradeFinanceSwiftSanctionsGuard({
    ofacOrSanctionsHitDetected: true,
    beneficiaryIbanChangeOrLcWaiverRequested: true,
    outOfBandKnownContactCallbackVerified: false,
    fxQuoteAgeSeconds: 18.5,
  });
  assert.equal(tradeSwiftGuard.sanctionsReasonDisclosureBlocked, true);
  assert.equal(tradeSwiftGuard.silentComplianceEscalationTriggered, true);
  assert.equal(tradeSwiftGuard.ibanChangeOrLcWaiverAuthorized, false);
  assert.equal(tradeSwiftGuard.becFraudLockTriggered, true);
  assert.equal(tradeSwiftGuard.fxQuoteExpiredRequoteRequired, true);

  const airCargoFleetGuard = evaluateAirCargoHazmatTruckFleetGuard({
    containsStandaloneLithiumUn3480OrDryIce: true,
    bookedOnPassengerAircraftBelly: true,
    lithiumStateOfChargePct: 80,
    continuousDrivingMinutes: 242,
    eyelidPerclosDrowsinessHigh: true,
  });
  assert.equal(airCargoFleetGuard.airWaybillAcceptanceAllowed, false);
  assert.equal(airCargoFleetGuard.iataDgrHazmatInterceptionTriggered, true);
  assert.equal(airCargoFleetGuard.newLoadDispatchAllowed, false);
  assert.equal(airCargoFleetGuard.mandatoryRestStopInterventionTriggered, true);

  const aestheticGuard = evaluateMedicalAestheticSafetyGuard({
    postFillerBlanchingSeverePainOrVisionBlur: true,
    udiBatchAndPhysicianLicenseVerified: false,
    draftPromisesGuaranteedYouthOrZeroRisk: true,
  });
  assert.equal(aestheticGuard.vascularOcclusionEmergency90mRescueTriggered, true);
  assert.equal(aestheticGuard.injectableAdministrationUnlocked, false);
  assert.equal(aestheticGuard.medicalAdLawViolationBlocked, true);

  const medInfoMirfGuard = evaluatePharmaMedInfoMirfGuard({
    unsolicitedOffLabelQueryDetected: true,
    callerVerifiedAsLicensedHcp: true,
    productQualityComplaintReported: true,
  });
  assert.equal(medInfoMirfGuard.commercialCrmSyncBlocked, true);
  assert.equal(medInfoMirfGuard.offLabelScientificSrlReadoutAllowed, true);
  assert.equal(medInfoMirfGuard.productQualityComplaintLotAlertTriggered, true);

  const aidcNocGuard = evaluateAidcDatacenterNocVoiceGuard({
    cduLiquidLeakOrPressureDropDetected: true,
    hvBreakerSwitchingRequested: true,
    operatorAndVerifierDistinctVoiceprintsVerified: false,
    verbatimSwitchingTicketReadbackMatched: true,
  });
  assert.equal(aidcNocGuard.cduIsolationValveClosedAndCheckpointTriggered0ms, true);
  assert.equal(aidcNocGuard.hvBreakerActuationAuthorized, false);

  const warehousePickGuard = evaluateWarehousePickByVoiceColdChainGuard({
    spokenBinCheckDigitMatchesWms: false,
    dockFrozenFoodCoreTempCelsius: -8.5,
    shortPickReported: true,
    substituteContainsCustomerAllergenOrPriceIncrease: true,
  });
  assert.equal(warehousePickGuard.pickConfirmationAccepted, false);
  assert.equal(warehousePickGuard.inboundPutawayAllowed, false);
  assert.equal(warehousePickGuard.coldChainDockRejectionTriggered, true);
  assert.equal(warehousePickGuard.autoSubstitutionApproved, false);

  const sovereignVoiceGuard = evaluateSovereignCloudVoiceGuard({
    callerJurisdiction: "CN_PIPL",
    targetEndpointJurisdiction: "SG_APAC",
    rawAudioAndPiiStrippedBeforeExport: true,
    zdrAndCmkVerified: true,
  });
  assert.equal(sovereignVoiceGuard.crossBorderRawAudioTransferAllowed, false);
  assert.equal(sovereignVoiceGuard.crossBorderTicketExportAllowed, true);

  const railMetroGuard = evaluateUrbanRailMetroDispatchGuard({
    psdGapObstacleOrPassengerTrapped: true,
    dispatchCommandNumberAndTrainIdVerbatimMatched: false,
    platformDensityPersonsPerSqm: 3.8,
  });
  assert.equal(railMetroGuard.trainDepartureInterlockCleared, false);
  assert.equal(railMetroGuard.psdEmergencyHoldAndReopenTriggered, true);
  assert.equal(railMetroGuard.dispatchCommandExecutionAuthorized, false);
  assert.equal(railMetroGuard.level3StationEntryThrottleTriggered, true);

  const fnolClaimsGuard = evaluateAutoPropertyFnolClaimsGuard({
    bodilyInjuryOrHighwayLaneHazardDetected: true,
    draftAdmitsLiabilityOrGuaranteesPayoutBeforeInvestigation: true,
    fourCornerAndVinContinuousVideoVerified: false,
  });
  assert.equal(fnolClaimsGuard.lifeSafetyAnd120PolicePreempted0ms, true);
  assert.equal(fnolClaimsGuard.prematureLiabilityOrCoveragePromiseBlocked, true);
  assert.equal(fnolClaimsGuard.instantFastTrackPayoutAuthorized, false);

  const privateBankGuard = evaluatePrivateBankingFamilyOfficeGuard({
    tickerOnMnpiRestrictedOrWatchList: true,
    numberedAccountRealNameSpokenInPrompt: true,
    blockTradeOrLombardPledgeRequested: true,
    fiveElementOrderReadbackAndVoiceprintVerified: false,
  });
  assert.equal(privateBankGuard.mnpiChineseWallBlockTriggered, true);
  assert.equal(privateBankGuard.realNameRedactedToCodeNameOnly, true);
  assert.equal(privateBankGuard.nightDeskOrderExecutionAuthorized, false);

  const socVishingGuard = evaluateEnterpriseSocSecopsVoiceGuard({
    verbalMfaResetOrPrivilegeElevationRequested: true,
    productionSubnetOrDcIsolationRequested: true,
    dualSocLeadVoiceprintAndIncidentIdVerified: false,
  });
  assert.equal(socVishingGuard.verbalMfaResetBlocked, true);
  assert.equal(socVishingGuard.outOfBandVideoIdAndFido2ChallengeRequired, true);
  assert.equal(socVishingGuard.subnetIsolationAuthorized, false);

  const windGridGuard = evaluateOffshoreWindGridDispatchGuard({
    hydraulicRotorLockPinEngaged: false,
    nacelleAnemometerWindSpeedMps: 13.8,
    gridDispatchCommandVerbatimReadbackAndSyncPhaseVerified: false,
  });
  assert.equal(windGridGuard.hubHatchEntryAuthorized, false);
  assert.equal(windGridGuard.rotorCrushHazardLockTriggered, true);
  assert.equal(windGridGuard.gridBreakerCloseAuthorized, false);

  const mobilityEorGuard = evaluateGlobalMobilityEorVisaGuard({
    employeeOnTouristOrVisaWaiverOnly: false,
    h1bOutOfMsaMoveWithoutAmendedLca: true,
    foreignStayDaysOrContractSigningCreatesPeRisk: true,
  });
  assert.equal(mobilityEorGuard.crossBorderWorkOrRelocationApproved, false);
  assert.equal(mobilityEorGuard.illegalEmploymentOrVisaRevocationLockTriggered, true);
  assert.equal(mobilityEorGuard.corporateTaxPeRiskEscalated, true);

  const benchHarnessGuard = evaluateVoiceBenchmarkHarnessSelectionGate({
    p95TtfaLatencyMs: 580,
    bargeInAudioStopLatencyMs: 142,
    highRiskEntitySlotExactMatchRate: 0.998,
    unpruned15MinCallCostUsd: 2.65,
  });
  assert.equal(benchHarnessGuard.duplexLatencySlaPassed, true);
  assert.equal(benchHarnessGuard.entitySlotSafetyPassed, true);
  assert.equal(benchHarnessGuard.contextWindowPruningRequired, true);
  assert.equal(benchHarnessGuard.pocArchitectureApproved, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 2)", () => {
  const aeroSatGuard = evaluateAerospaceSatelliteVoiceGuard({
    allSubsystemsPolledGo: true,
    anyLoopCalledHoldOrAbort: true,
    criticalTelecommandDualVoiceprintAndCrcVerified: false,
    radomePersonnelClearAndElevationSafe: false,
  });
  assert.equal(aeroSatGuard.launchCommitAuthorized, false);
  assert.equal(aeroSatGuard.countdownHoldPreempted0ms, true);
  assert.equal(aeroSatGuard.hpaRfTransmitAndCriticalTcAuthorized, false);

  const maritimeGuard = evaluateMaritimeBridgeVtsShipyardGuard({
    portOrStarboardHelmDirectionAndDegreesMatched: true,
    actualRudderAngleFollowsOrder: false,
    imminentCollisionCpaTcpaAlert: true,
    drydockFloodingOrBallastEntryRequested: true,
    tankAtmosphereO2AndDockFloorZeroHeadcountVerified: false,
  });
  assert.equal(maritimeGuard.wrongWayRudderAlarmTriggered0ms, true);
  assert.equal(maritimeGuard.colregsCollisionPreemptionTriggered, true);
  assert.equal(maritimeGuard.drydockValveOrTankEntryAuthorized, false);

  const auctionGuard = evaluateFineArtAuctionBiddingGuard({
    proposedHammerBidUsd: 10500000,
    verifiedPaddleFinancialCeilingUsd: 10000000,
    activeRoomLotMatchesClientRegisteredLot: true,
    buyersPremiumAndIrrevocableHammerDisclosed: true,
  });
  assert.equal(auctionGuard.rostrumBidRelayAuthorized, false);
  assert.equal(auctionGuard.ceilingExceededOrWrongLotBlocked, true);

  const foodCipGuard = evaluateFoodDairyCipAsepticGuard({
    targetTankContainsProductOrSwingBendUnverified: true,
    returnConductivityMicroSiemensPerCm: 42,
    uhtSterilizationTempBelow137C: true,
  });
  assert.equal(foodCipGuard.cipCausticValveOpenAuthorized, false);
  assert.equal(foodCipGuard.chemicalAdulterationLockTriggered, true);
  assert.equal(foodCipGuard.asepticFillingReleaseAuthorized, false);

  const procurementBidGuard = evaluatePublicProcurementBidEvalGuard({
    jurorUtteredBiasSteeringOrVendorNameInBlindEval: true,
    expertScoreDeviationFromMedianPct: 44,
    clauseCitedJustificationRecorded: false,
  });
  assert.equal(procurementBidGuard.supervisionRoomAlertAndScoringFreezeTriggered0ms, true);
  assert.equal(procurementBidGuard.finalBidScoreSubmissionAuthorized, false);

  const mcpSagaGuard = evaluateVoiceMcpTwoPhaseSagaGuard({
    isMutatingWriteTool: true,
    draftStagedAndReadbackCompleted: true,
    userExplicitlyConfirmedDraft: true,
    turnEpochMatchesCurrent: false,
    isDuplicateIdempotencyKey: true,
  });
  assert.equal(mcpSagaGuard.commitExecutionAuthorized, false);
  assert.equal(mcpSagaGuard.sagaCompensationTriggered, true);
  assert.equal(mcpSagaGuard.duplicateRequestIdempotentlyDeduped, true);

  const ccaasTcoGuard = evaluateCcaasAcsConnectGenesysTwilioTcoGuard({
    monthlyCallMinutes: 1_000_000,
    tier1AiDeflectionRatePct: 70,
    legacyCcaasAudioHookFeePerMinUsd: 0.036,
    usesFrontDoorSbcAcsIntercept: true,
    signedSipUuiContextPacketAttached: true,
  });
  assert.equal(ccaasTcoGuard.monthlyLegacyAudioHookTaxSavedUsd, 25200);
  assert.equal(ccaasTcoGuard.selfHostedAcsOverWrapperRecommended, true);
  assert.equal(ccaasTcoGuard.warmTransferWithSignedUuiApproved, true);

  const agentAssistGuard = evaluateContactCenterAgentAssistCopilotGuard({
    stereoLeftRightChannelSplitActive: true,
    agentSpokeProhibitedPromiseOrSkippedDisclosure: false,
    customerFrustrationScorePct: 89,
    structuredAcwSummaryGeneratedIn3s: true,
    agentReviewedOrOneClickApprovedAcw: true,
  });
  assert.equal(agentAssistGuard.zeroCrosstalkAttributionGuaranteed, true);
  assert.equal(agentAssistGuard.supervisorAlertAndCorrectiveCardTriggered0ms, true);
  assert.equal(agentAssistGuard.crmAutoWrapUpCommitAuthorized, true);

  const healthSchedGuard = evaluateHealthcarePatientSchedulingTriageGuard({
    redFlagSymptomChestPainStrokeOrDyspnea: true,
    dobAndZipOrMrnVerified: true,
    fhirSlotHoldVerified: true,
    procedurePrepRequirementsConfirmed: true,
  });
  assert.equal(healthSchedGuard.routineSchedulingBlockedAndNursePreempted0ms, true);
  assert.equal(healthSchedGuard.phiDisclosureAuthorized, true);
  assert.equal(healthSchedGuard.fhirAppointmentCommitAuthorized, false);

  const retailWismoGuard = evaluateRetailEcommerceWismoReturnsGuard({
    refundAmountUsd: 180,
    autoInstantRefundCeilingUsd: 25,
    customerHasHighReturnAbuseRiskScore: false,
    packageAlreadyOutForDelivery: true,
    callerAniMatchesOrderPhoneAndOtpVerified: true,
    isPeakPromoSurge10x: true,
  });
  assert.equal(retailWismoGuard.instantRefundWithoutReturnScanAuthorized, false);
  assert.equal(retailWismoGuard.inTransitAddressRerouteAuthorized, false);
  assert.equal(retailWismoGuard.promoSurgeCascadedBurstActive, true);

  const bankCardGuard = evaluateRetailBankingCardDisputeGuard({
    customerReportedCardLostStolenOrUnauthorizedSwipe: true,
    unrecognizedChargeConfirmedUnauthorizedAfterCe30: true,
    aprAndTotalFeeVerbatimDisclosed: false,
    cardholderExplicitlyConfirmedInstallmentPlan: true,
  });
  assert.equal(bankCardGuard.temporaryProtectiveCardFreezeTriggered0ms, true);
  assert.equal(bankCardGuard.regEProvisionalCreditWorkflowTriggered, true);
  assert.equal(bankCardGuard.installmentPlanBookingAuthorized, false);

  const sttBenchGuard = evaluateStreamingSttEngineSelectionGuard({
    isChunkedWhisperOrBatchAsrOnSilence: true,
    vadSpeechProbabilityPct: 12,
    hasCustomBrandSkuOrMedicalTerms: true,
    dynamicPhraseListInjectedAtCallStart: true,
    requiresOnPremOrAirGappedDeployment: true,
  });
  assert.equal(sttBenchGuard.silenceHallucinationBlockedByVadGate, true);
  assert.equal(sttBenchGuard.domainEntityRecognitionApproved, true);
  assert.equal(sttBenchGuard.airGappedContainerEngineSelected, true);

  const ttsBenchGuard = evaluateStreamingTtsVoiceCloningGuard({
    isCustomVoiceClone: true,
    speakerVerbalConsentStatementVerified: true,
    synthWatermarkEnabled: false,
    containsPolyphonicOrFinancialAcronym: true,
    ssmlPhonemeLexiconApplied: true,
    llmTokenStreamChunkedAtFirstClause: true,
  });
  assert.equal(ttsBenchGuard.voiceCloneDeploymentAuthorized, false);
  assert.equal(ttsBenchGuard.zeroMispronunciationGuaranteed, true);
  assert.equal(ttsBenchGuard.sub150msTtfbStreamingActive, true);

  const voiceRagGuard = evaluateVoiceRagLowLatencyPhoneticGuard({
    retrievalLatencyMs: 88,
    speculativePartialAsrPrefetchEnabled: true,
    phoneticPinyinOrSoundexIndexEnabled: true,
    retrievedContextTokens: 450,
    spokenOutputSentencesCount: 2,
  });
  assert.equal(voiceRagGuard.sub120msVoiceRagBudgetMet, true);
  assert.equal(voiceRagGuard.homophoneRecallProtected, true);
  assert.equal(voiceRagGuard.spokenBrevityContractPassed, true);

  const outboundTcpaGuard = evaluateOutboundVoiceSalesTcpaGuard({
    priorExpressWrittenConsentVerified: true,
    onNationalOrInternalDncList: false,
    recipientLocalHour24: 21,
    prospectUtteredStopCallingOrUnsubscribe: true,
    isVoicemailOrCarrierScreenerBot: true,
  });
  assert.equal(outboundTcpaGuard.outboundDialAuthorized, false);
  assert.equal(outboundTcpaGuard.instantDncSuppressionCommitted0ms, true);
  assert.equal(outboundTcpaGuard.voicemailDropOrHangupTriggered, true);

  const autoDmsGuard = evaluateAutomotiveDealershipDmsServiceGuard({
    vehicleDisabledOnHighwayOrEvSmokeAlert: false,
    hasOpenOemSafetyRecallOnVin: true,
    recallReplacementPartInDealerStock: true,
    requiresHighVoltageEvMasterTech: true,
    evMasterTechBayAndLoanerLockedInDms: true,
  });
  assert.equal(autoDmsGuard.highwaySafetyAndRoadsidePreempted0ms, false);
  assert.equal(autoDmsGuard.recallRepairBundledAndPartLocked, true);
  assert.equal(autoDmsGuard.dmsServiceOrderCommitAuthorized, true);

  const itHelpdeskGuard = evaluateItHelpdeskServiceNowVoiceGuard({
    activeP1MajorIncidentOnCallerSystem: true,
    ssprOrAccountUnlockRequested: true,
    authenticatorNumberMatchOrManagerVideoVerified: false,
    isStandardVpnOrLicenseProvisioningRequest: true,
    intuneEndpointHealthCheckPassed: true,
  });
  assert.equal(itHelpdeskGuard.deflectedByMasterIncidentBannerAndLinked, true);
  assert.equal(itHelpdeskGuard.ssprAccountUnlockAuthorized, false);
  assert.equal(itHelpdeskGuard.automatedSelfHealingExecuted, true);

  const liveMeetingGuard = evaluateLiveMeetingSimultaneousInterpreterGuard({
    sourceLanguageIsVerbFinalDeOrJa: true,
    semanticClauseWaitWindowMs: 1500,
    corporateGlossaryInjected: true,
    numericFiguresMatchSource100Pct: true,
    diarizationSpeakerIdBound: true,
  });
  assert.equal(liveMeetingGuard.prematureVerbMistranslationPrevented, true);
  assert.equal(liveMeetingGuard.glossaryAndNumericFidelityPassed, true);
  assert.equal(liveMeetingGuard.actionItemCommitAuthorized, true);

  const avatarKioskGuard = evaluateDigitalAvatarKioskVoiceGuard({
    userDistanceMeters: 1.1,
    cameraGazeEngagementVerified: true,
    cloudVideoBandwidthMbps: 1.8,
    bargeInDetected: true,
    avatarSwitchedToListeningNodWithin150ms: true,
  });
  assert.equal(avatarKioskGuard.gazeAndZoneWakeupAuthorized, true);
  assert.equal(avatarKioskGuard.edgeVisemeFallbackActivated, true);
  assert.equal(avatarKioskGuard.smoothVisualBargeInPassed, true);

  const salesCoachGuard = evaluateAiSalesRoleplayCoachingSimulatorGuard({
    mandatoryObjectionsResolvedCount: 2,
    requiredObjectionsTotal: 3,
    repViolatedOffLabelOrGuaranteedReturnRedline: true,
    traineeTalkToListenRatioPct: 58,
  });
  assert.equal(salesCoachGuard.antiSycophancyObjectionHoldActive, true);
  assert.equal(salesCoachGuard.autoFailComplianceRedlineTriggered, true);
  assert.equal(salesCoachGuard.certificationPassApproved, false);

  const airlineIrropsGuard = evaluateAirlineIrropsFlightRebookingGuard({
    isInvoluntaryAirlineOrWeatherDisruption: true,
    newProtectionSeatHeldConfirmedInGds: true,
    fareDifferenceAndChangeFeeWaived: true,
    overnightDelayRequiresHotelVoucher: true,
  });
  assert.equal(airlineIrropsGuard.oldSeatDropAndReissueAuthorized, true);
  assert.equal(airlineIrropsGuard.involuntaryZeroFeeWaiverEnforced, true);
  assert.equal(airlineIrropsGuard.digitalHotelAndMealVoucherDispatched, true);

  const s2sTcoInflectionGuard = evaluateNativeS2sVsCascadedTcoInflectionGuard({
    averageCallDurationMinutes: 8,
    requires100PctDeterministicTextComplianceGate: true,
    sustainedDailyConcurrencyDutyCyclePct: 68,
  });
  assert.equal(s2sTcoInflectionGuard.slidingWindowAudioPruningRequired, true);
  assert.equal(s2sTcoInflectionGuard.cascadedOrHybridTrackSelected, true);
  assert.equal(s2sTcoInflectionGuard.azurePtuReservationRecommended, true);

  const fwScalingGuard = evaluateVoiceFrameworkWorkerScalingGuard({
    processPerCallSubprocessIsolationEnabled: true,
    k8sTerminationGracePeriodSeconds: 1800,
    activeCallsOnDrainingPodCount: 0,
    idleWarmWorkerSlotHeadroom: 64,
  });
  assert.equal(fwScalingGuard.pythonGilAudioStarvationPrevented, true);
  assert.equal(fwScalingGuard.zeroDropPodScaleDownAuthorized, true);
  assert.equal(fwScalingGuard.productionClusterConfigApproved, true);

  const qsrDriveThruGuard = evaluateQsrDriveThruVoiceOrderingGuard({
    orderedItemCurrently86dOutOfStock: true,
    mandatoryComboModifiersComplete: true,
    singleItemQuantityRequested: 180,
    unresolvedDisambiguationTurnsCount: 2,
  });
  assert.equal(qsrDriveThruGuard.posKitchenOrderFireAuthorized, false);
  assert.equal(qsrDriveThruGuard.outOfStockSubstitutePrompted, true);
  assert.equal(qsrDriveThruGuard.silentCrewHeadsetTakeoverTriggered, true);

  const lifeHealthInsGuard = evaluateLifeHealthInsuranceUnderwritingRenewalGuard({
    disclosedPreExistingConditionCompletedDrilldown: true,
    waitingPeriodAndExclusionsVerbatimConfirmedByApplicant: true,
    in60DayRenewalGracePeriodWithCashflowHardship: true,
    callerReportingCriticalIllnessOrBereavementClaim: true,
  });
  assert.equal(lifeHealthInsGuard.policyBindingAuthorized, true);
  assert.equal(lifeHealthInsGuard.gracePeriodMonthlyModeConservationOffered, true);
  assert.equal(lifeHealthInsGuard.zeroUpsellBereavementCareModeActivated0ms, true);

  const inCabinGuard = evaluateAutomotiveInCabinMultimodalVoiceGuard({
    vehicleSpeedKmh: 105,
    isSafetyCriticalHeadlightOffOrTrunkOpenCommand: true,
    speakerZoneIsRearOrChildSeat: true,
    isDriverOnlyNavigationOrLockCommand: true,
    cloudFirstPacketLatencyMs: 950,
  });
  assert.equal(inCabinGuard.canBusVehicleActuationAuthorized, false);
  assert.equal(inCabinGuard.rearChildOverrideBlocked, true);
  assert.equal(inCabinGuard.onDeviceNpuTunnelFallbackActivated, true);

  const platformTcoGuard = evaluateManagedVsSelfHostedVoicePlatformTcoGuard({
    monthlyVoiceMinutes: 500000,
    requiresStrictDataResidencyOrPrivateVnet: true,
    platformWrapperFeePerMinUsd: 0.06,
    telephonyAndSttLlmTtsStackPerMinUsd: 0.125,
  });
  assert.equal(platformTcoGuard.fiveLayerLandedCostPerMinUsd, 0.185);
  assert.equal(platformTcoGuard.selfHostedMigrationTriggered, true);
  assert.equal(platformTcoGuard.recommendedDeploymentMode, "self_hosted_azure_acs_livekit");

  const warmHandoffGuard = evaluateContactCenterWarmTransferContextHandoffGuard({
    structuredFourSlotSummaryPersisted: true,
    aiLegOtpOrVoiceprintVerified: true,
    targetSkillQueueEstimatedWaitSec: 240,
  });
  assert.equal(warmHandoffGuard.directWarmTransferAuthorized, false);
  assert.equal(warmHandoffGuard.virtualHoldCallbackOffered, true);
  assert.equal(warmHandoffGuard.verifiedAuthBadgeInherited, true);

  const roboAdvisorGuard = evaluateWealthRoboAdvisorPortfolioSuitabilityGuard({
    investorRiskTierC1ToC5: 2,
    productRiskTierR1ToR5: 5,
    kycAssessmentValidWithin365Days: true,
    containsPromissoryReturnPhrase: true,
  });
  assert.equal(roboAdvisorGuard.fundSubscriptionDraftAuthorized, false);
  assert.equal(roboAdvisorGuard.crossTierSuitabilityBlocked, true);
  assert.equal(roboAdvisorGuard.promissoryReturnClaimScrubbed, true);

  const corporateTravelGuard = evaluateCorporateTravelTmcConcurExpenseVoiceGuard({
    withinEmployeeGradeTravelCap: false,
    isDutyOfCareEmergencyEvacuation: false,
    hotelFolioContainsPersonalMiniBarOrSpa: true,
  });
  assert.equal(corporateTravelGuard.instantCorporateCardTicketingAuthorized, false);
  assert.equal(corporateTravelGuard.managerPreTripApprovalRequired, true);
  assert.equal(corporateTravelGuard.personalMiniBarSplitFromConcurDraft, true);

  const livestreamAnchorGuard = evaluateEcommerceLivestreamAvatarAnchorGuard({
    containsAdLawProhibitedSuperlativeOrMedicalCureClaim: true,
    activeSkuRemainingStockCount: 0,
    highIntentBuyerBulletChatPending: true,
  });
  assert.equal(livestreamAnchorGuard.ttsBroadcastAuthorized, false);
  assert.equal(livestreamAnchorGuard.adLawSuperlativeOrMedicalClaimBlocked, true);
  assert.equal(livestreamAnchorGuard.soldOutSkuAutoSwitched0ms, true);

  const smartGlassesGuard = evaluateSmartGlassesWearableMultimodalVoiceGuard({
    hasDeicticVisualReferenceCue: true,
    frontPrivacyLedOccludedOrFaulted: true,
    ambientNoiseDb: 38,
    responseContainsSensitivePersonalOrFinancialData: true,
  });
  assert.equal(smartGlassesGuard.povCameraCaptureAuthorized, false);
  assert.equal(smartGlassesGuard.privacyLedTamperLockTriggered, true);
  assert.equal(smartGlassesGuard.whisperOrHudPrivacyModeActivated, true);

  const hrsscGuard = evaluateEnterpriseHrsscBenefitsPayrollVoiceGuard({
    sessionStepUpMfaVerified: false,
    requestsDirectDepositBankAccountEdit: true,
    reportsHarassmentRetaliationOrCrisis: true,
  });
  assert.equal(hrsscGuard.payslipDollarDisclosureAuthorized, false);
  assert.equal(hrsscGuard.directDepositVoiceChangeBlocked, true);
  assert.equal(hrsscGuard.confidentialManagerShieldedErEscalation0ms, true);

  const ceRmaGuard = evaluateConsumerElectronicsDiagnosticRmaVoiceGuard({
    reportsSwollenBatterySmokeOrSparks: true,
    completedMandatoryCableAndResetDiagnostics: false,
    verbalDataWipeConsentAndFindMyUnlocked: false,
  });
  assert.equal(ceRmaGuard.standardParcelReturnLabelAuthorized, false);
  assert.equal(ceRmaGuard.thermalRunawayHazmatSafetyLock0ms, true);
  assert.equal(ceRmaGuard.nffDiagnosticOrBackupConsentGateBlocked, true);

  const voiceSecGuard = evaluateVoiceAgentSecurityPrivilegeFirewallGuard({
    audioOrIndirectPromptInjectionDetected: true,
    requestedRefundAmountUsd: 800,
    priorWriteToolCallsInSession: 1,
    targetsInternationalPremiumIrsfPrefix: true,
  });
  assert.equal(voiceSecGuard.autonomousWriteActionAuthorized, false);
  assert.equal(voiceSecGuard.promptInjectionOrOverCapBlocked, true);
  assert.equal(voiceSecGuard.irsfTollFraudCallbackBlocked, true);

  const fleetDispatchGuard = evaluateCommercialFleetTruckingDispatchVoiceGuard({
    remainingLegalHosDriveMin: 35,
    estimatedRouteDriveMin: 120,
    truckGpsDistanceToFuelStationMeters: 45,
    fuelTankLevelPercent: 18,
  });
  assert.equal(fleetDispatchGuard.newLoadDispatchAuthorized, false);
  assert.equal(fleetDispatchGuard.hosFatigueSafetyLockTriggered, true);
  assert.equal(fleetDispatchGuard.fuelCardUnlockAuthorized, true);

  const leasingGuard = evaluateRealEstateLeasingFairHousingVoiceGuard({
    asksSubjectiveNeighborhoodSafetyOrDemographics: true,
    declaresAssistanceOrServiceAnimal: true,
    governmentIdLivenessVerified: true,
    prospectGpsDistanceToLobbyMeters: 25,
  });
  assert.equal(leasingGuard.smartLockTourPinReleaseAuthorized, true);
  assert.equal(leasingGuard.fairHousingNeutralRedirectTriggered, true);
  assert.equal(leasingGuard.serviceAnimalPetFeeWaived0ms, true);

  const autoTestDriveFniGuard = evaluateAutomotiveTestDriveFinancingTradeInVoiceGuard({
    driverLicenseOver1YrAndWaiverVerified: true,
    attemptedSightUnseenSingleGuaranteedTradeInPrice: true,
    disclosedTrueAnnualPercentageRateApr: true,
  });
  assert.equal(autoTestDriveFniGuard.doorstepTestDriveDispatchAuthorized, true);
  assert.equal(autoTestDriveFniGuard.sightUnseenSinglePriceBlocked, true);
  assert.equal(autoTestDriveFniGuard.financeQuoteCompliantWithTrueApr, true);

  const homeServicesGuard = evaluateHomeServicesFieldDispatchServiceTitanVoiceGuard({
    activeBurstPipeFloodingOrElectricalSpark: true,
    techHoldsRequiredTradeLicenseAndVanPart: false,
    pestJobPregnancyPetAquariumPrecautionsVerified: true,
  });
  assert.equal(homeServicesGuard.mainShutoffPreemptionTriggered0ms, true);
  assert.equal(homeServicesGuard.technicianDispatchAuthorized, false);
  assert.equal(homeServicesGuard.unlicensedOrUnsafePestDispatchBlocked, true);

  const freightForwardingGuard = evaluateGlobalFreightForwardingDemurrageVoiceGuard({
    commodityContainsBatteryLiquidOrChemical: true,
    valid16SectionMsdsAndUn383Verified: false,
    customsAndCarrierTelexReleaseCleared: false,
  });
  assert.equal(freightForwardingGuard.generalCargoBookingAuthorized, false);
  assert.equal(freightForwardingGuard.hazmatMsdsMissingBlocked, true);
  assert.equal(freightForwardingGuard.portDrayageDispatchAuthorized, false);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 3)", () => {

  const merchantPosGuard = evaluateMerchantPosAcquiringSettlementVoiceGuard({
    requestsPayoutBankAccountOrBlindRefundChange: true,
    storeWanOutageDuringService: true,
    merchantRiskStandingGood: true,
  });
  assert.equal(merchantPosGuard.payoutBankAccountVoiceEditBlocked, true);
  assert.equal(merchantPosGuard.cappedOfflineStoreAndForwardActivated, true);
  assert.equal(merchantPosGuard.perTransactionOfflineCapUsd, 100);

  const b2bArGuard = evaluateEnterpriseB2bAccountsReceivableVoiceGuard({
    totalInvoiceAmountUsd: 50000,
    disputedDamagedLineItemUsd: 800,
    hasUnmatchedWireInUnappliedCash: true,
  });
  assert.equal(b2bArGuard.creditHoldShipmentFreezeBlocked, true);
  assert.equal(b2bArGuard.undisputedBalanceScheduledUsd, 49200);
  assert.equal(b2bArGuard.pivotedToUnappliedCashMatching, true);

  const subRetentionGuard = evaluateSubscriptionRetentionSaveDeskFtcVoiceGuard({
    callerDemandsImmediateCancelOrDeclinedFirstOffer: false,
    daysSinceLastRetentionPromoDiscount: 90,
    churnReasonIsStockpileOrTemporaryTravel: true,
  });
  assert.equal(subRetentionGuard.immediateUnconditionalCancelExecuted0ms, false);
  assert.equal(subRetentionGuard.cashDiscountOfferBlockedBy365DayCooldown, true);
  assert.equal(subRetentionGuard.zeroDiscountPausePlanRecommended, true);

  const hotelInRoomGuard = evaluateHotelInRoomVoiceConciergePmsPrivacyGuard({
    pmsCheckoutTriggeredOrRoomVacant: true,
    isExternalCallerRequestingGuestRoomNumber: true,
    registeredSurnameAndPostAllowedVerified: true,
  });
  assert.equal(hotelInRoomGuard.checkoutZeroMemoryWipeExecuted0ms, true);
  assert.equal(hotelInRoomGuard.externalCallerRoomNumberDisclosed, false);
  assert.equal(hotelInRoomGuard.inRoomDiningFolioChargeAuthorized, false);

  const medDeviceCoachGuard = evaluateMedicalDevicePatientOnboardingAdherenceVoiceGuard({
    bloodGlucoseMgDl: 46,
    patientRequestsInsulinOrCpapPrescriptionDoseChange: true,
    reportsBrokenFilamentOrSevereSkinBlistering: true,
  });
  assert.equal(medDeviceCoachGuard.criticalClinicalNurseEscalation0ms, true);
  assert.equal(medDeviceCoachGuard.insulinOrCpapDoseTitrationBlocked, true);
  assert.equal(medDeviceCoachGuard.fdaMdrAdverseEventLotCaptureRequired, true);

  const salonSpaGuard = evaluateSalonSpaWellnessStudioBookingVoiceGuard({
    stylistAndTreatmentRoomBothAvailable: true,
    chemicalColorOrLashRequires48hPatchTest: true,
    valid48hPatchTestOnFile: false,
    highTicketDepositOrMembershipVerified: true,
  });
  assert.equal(salonSpaGuard.appointmentConfirmationAuthorized, false);
  assert.equal(salonSpaGuard.patchTest48HourAllergyGateBlocked, true);
  assert.equal(salonSpaGuard.processingGapReleasedForShortCutInsert, true);

  const equipmentRentalGuard = evaluateHeavyEquipmentRentalBreakdownVoiceGuard({
    requestsSafetyInterlockBypassOrHydraulicDisassembly: false,
    j1939ShowsOperatorResettableTiltEstopOrDpf: true,
    offRentConfirmedWithHaulAccessAndPhotos: true,
  });
  assert.equal(equipmentRentalGuard.safetyInterlockBypassOrHydraulicDisassemblyBlocked, false);
  assert.equal(equipmentRentalGuard.mechanicTruckRollDeflectedByTelematicsReset, true);
  assert.equal(equipmentRentalGuard.offRentRemoteImmobilizerEngaged, true);

  const privateAviationGuard = evaluatePrivateAviationCharterFboVoiceGuard({
    callerVerifiedWithPrincipalPasscode: false,
    newPassengerApisAndMtowWeightBalanceCleared: false,
    chauffeurPlateAndDriverIdPreClearedWithFbo: true,
  });
  assert.equal(privateAviationGuard.tailNumberAndItineraryDisclosed, false);
  assert.equal(privateAviationGuard.additionalPassengerBoardingAuthorized, false);
  assert.equal(privateAviationGuard.fboTarmacRampGatePassIssued, true);

  const diagnosticLabGuard = evaluateDiagnosticLabHealthScreeningVoiceGuard({
    isCriticalLabPanicValueAlert: true,
    answeredByLiveHumanWithVerbatimReadback: false,
    patientPregnantOrTryingToConceive: true,
    reportContainsMalignantPathologyOrReactiveHiv: true,
  });
  assert.equal(diagnosticLabGuard.panicValueNotificationClosed, false);
  assert.equal(diagnosticLabGuard.ionizingRadiationAndC14SwappedForPregnancy, true);
  assert.equal(diagnosticLabGuard.aiVerbalMalignancyOrHivReadoutBlocked, true);

  const ifmJanitorialGuard = evaluateFacilityManagementJanitorialSlaVoiceGuard({
    isSlipAndFallWetFloorHazard: true,
    wetFloorCautionConePhotoVerifiedByVision: false,
    involvesBloodVomitOrSharpsBiohazard: true,
    mechanicalRoomLiveGaugeReadbackMatched: true,
  });
  assert.equal(ifmJanitorialGuard.slipAndFallTicketClosureAuthorized, false);
  assert.equal(ifmJanitorialGuard.standardJanitorBlockedForBiohazardPpe, true);
  assert.equal(ifmJanitorialGuard.subcontractorLiveGaugeArrivalVerified, true);

  const weddingBridalGuard = evaluateWeddingEventVenueBridalConciergeVoiceGuard({
    isOutdoorLawnOrTerraceCeremony: true,
    indoorRainBackupHallAvailableAndLocked: false,
    remainingDaysToWedding: 45,
    requiredCoutureProductionPlusAlterationDays: 140,
  });
  assert.equal(weddingBridalGuard.outdoorCeremonyBookingAuthorized, false);
  assert.equal(weddingBridalGuard.rainBackupHallDoubleSaleBlocked, true);
  assert.equal(weddingBridalGuard.madeToOrderCoutureGownBlockedByShortLeadTime, true);

  const storageTruckGuard = evaluateSelfStorageMovingTruckRentalVoiceGuard({
    delinquentBalancePaidInFull: false,
    mentionsGasolinePropaneOrSleepingInUnit: true,
    verballyRepeated12Foot6OverheadClearanceWarning: true,
  });
  assert.equal(storageTruckGuard.gateAndUnitSmartLockUnlatched, false);
  assert.equal(storageTruckGuard.prohibitedHazmatOrHabitationLeaseBlocked, true);
  assert.equal(storageTruckGuard.boxTruckKeyLockboxPinReleased, true);

  const legalIntakeGuard = evaluateLegalIntakeConflictAndUplVoiceGuard({
    adversePartyConflictCheckCompleted: true,
    adversePartyConflictDetected: true,
    requestsLegalOpinionOrWinPromise: true,
    daysUntilStatuteOfLimitationsExpires: 5,
  });
  assert.equal(legalIntakeGuard.caseFactCollectionAuthorized, false);
  assert.equal(legalIntakeGuard.legalOpinionAndWinPromiseBlocked, true);
  assert.equal(legalIntakeGuard.urgentStatuteOfLimitationsEscalationTriggered, true);

  const cpaTaxGuard = evaluateCpaTaxPreparationIrs7216VoiceGuard({
    verifiedTaxpayerMfaPassed: false,
    signedIrs7216ThirdPartyConsentOnFile: false,
    clientAcknowledgedExtensionDoesNotExtendPaymentDeadline: false,
    receivedIrsLevyOrAuditNotice: true,
  });
  assert.equal(cpaTaxGuard.taxReturnDataDisclosureAuthorized, false);
  assert.equal(cpaTaxGuard.taxFilingExtensionSubmissionAuthorized, false);
  assert.equal(cpaTaxGuard.urgentCpaControversyEscalationTriggered, true);

  const staffingRpoGuard = evaluateStaffingRpoEeocRecruitingVoiceGuard({
    asksPriorSalaryHistoryOrProtectedClassQuestion: true,
    requiredLicenseOrCertificationActive: true,
    projectedWeeklyHoursWithShift: 46,
    clientApprovedOvertimeBillRate: false,
    candidateRequestedHumanRecruiterOrAccommodation: true,
  });
  assert.equal(staffingRpoGuard.eeocAndSalaryBanCompliancePassed, false);
  assert.equal(staffingRpoGuard.shiftDispatchAuthorized, false);
  assert.equal(staffingRpoGuard.humanRecruiterHandoffTriggered, true);

  const procurementGuard = evaluateEnterpriseProcurementAribaExpeditingVoiceGuard({
    vendorClearedOnAvlAndSanctionsList: true,
    totalOrderAmountUsd: 18500,
    approvedDelegationOfAuthorityLimitUsd: 15000,
    vendorOffersKickbackOrAsksCompetitorBid: true,
    requestsPhoneBankAccountOrIbanChange: true,
  });
  assert.equal(procurementGuard.spotPurchaseOrderIssuanceAuthorized, false);
  assert.equal(procurementGuard.kickbackOrCompetitorPriceLeakBlocked, true);
  assert.equal(procurementGuard.phoneBankAccountChangeBlocked, true);

  const cyberSocGuard = evaluateCybersecuritySocIncidentBridgeVoiceGuard({
    cognitiveWakeupChallengePassed: true,
    isTierZeroDomainControllerOrProdCluster: true,
    dualControlCisoAndInfraApprovalVerified: false,
    outOfBandFido2OrVerifiedIdApproved: false,
  });
  assert.equal(cyberSocGuard.incidentAckAuthorized, true);
  assert.equal(cyberSocGuard.hostNetworkContainmentAuthorized, false);
  assert.equal(cyberSocGuard.privilegedMfaResetAuthorized, false);

  const miceGroupGuard = evaluateHospitalityMiceGroupAttritionVoiceGuard({
    daysBeforeArrival: 6,
    contractAttritionCutoffDays: 30,
    requestedDropPercent: 45,
    allowedAttritionPercent: 20,
    corporateTravelerDomainOrGdsVerified: false,
    isTopTierEliteLoyaltyMember: true,
  });
  assert.equal(miceGroupGuard.penaltyFreeGroupBlockReductionAuthorized, false);
  assert.equal(miceGroupGuard.corporateLraRateBookingAuthorized, false);
  assert.equal(miceGroupGuard.overbookingWalkRelocationBlocked, true);

  const commercialBrokerGuard = evaluateCommercialInsuranceBrokerageCoiFnolVoiceGuard({
    requestedCoiLimitUsd: 5000000,
    activePolicyLimitUsd: 2000000,
    blanketAdditionalInsuredEndorsementActive: true,
    callerDisclosedExistingOrRecentLoss: true,
    involvesInpatientHospitalizationAmputationOrFatality: true,
  });
  assert.equal(commercialBrokerGuard.instantAcord25CoiIssuanceAuthorized, false);
  assert.equal(commercialBrokerGuard.midTermPolicyEndorsementBindAuthorized, false);
  assert.equal(commercialBrokerGuard.oshaSevereInjury24hEscalationTriggered, true);

  const evOcppGuard = evaluateEvChargingOcppConnectorVoiceGuard({
    dcOutputCurrentAmps: 185,
    reportsSmokeSparksOrDamagedCable: true,
    vehicleTelematicsMatchesStationLocation: false,
  });
  assert.equal(evOcppGuard.remoteConnectorUnlockAuthorized, false);
  assert.equal(evOcppGuard.emergencyStallLockoutTriggered, true);
  assert.equal(evOcppGuard.fleetCardLimitOverrideAuthorized, false);

  const ipDocketGuard = evaluateIntellectualPropertyPatentDocketVoiceGuard({
    daysUntilPublicDisclosureOrStatutoryBar: 2,
    writtenDualSignatureForAbandonmentVerified: false,
    requestsFtoNonInfringementOrRegistrabilityGuarantee: true,
  });
  assert.equal(ipDocketGuard.urgentSameDayPatentFilingEscalationTriggered, true);
  assert.equal(ipDocketGuard.patentAbandonmentInstructionAuthorized, false);
  assert.equal(ipDocketGuard.ftoOrPatentabilityGuaranteeBlocked, true);

  const foodSafetyGuard = evaluateFoodSafetyColdChainFsmaRecallVoiceGuard({
    productCoreTemperatureCelsius: 7.2,
    fsma204TraceabilityLotCodePresent: true,
    classOnePathogenOrAllergenRecallActive: true,
    reportsFoodborneIllnessOrAllergicReaction: true,
  });
  assert.equal(foodSafetyGuard.coldDockGoodsReceiptAuthorized, false);
  assert.equal(foodSafetyGuard.posCheckoutLockoutAndStoreRecallBlastTriggered, true);
  assert.equal(foodSafetyGuard.retentionSampleFreezeAndQaEscalationTriggered, true);

  const hazmatSpillGuard = evaluateHazmatChemicalSpillDispatchVoiceGuard({
    incompatibleHazmatClassesCoLoaded: true,
    driverHoldsValidHazmatEndorsement: true,
    isClass4Dot3WaterReactiveMaterial: true,
    spillExceedsEpaReportableQuantityOrHitsWaterway: true,
  });
  assert.equal(hazmatSpillGuard.hazmatLoadDispatchAuthorized, false);
  assert.equal(hazmatSpillGuard.waterBasedExtinguishingAdviceBlocked, true);
  assert.equal(hazmatSpillGuard.epaNrcImmediateStatutoryReportTriggered, true);

  const irRegFdGuard = evaluateInvestorRelationsRegFdMnpiVoiceGuard({
    inPreEarningsQuietPeriod: true,
    requestsUnreleasedFinancialsOrMidQuarterGuidance: true,
    standardNdaExecuted: true,
    cleanTeamAntitrustClearanceVerified: false,
    accidentalUnannouncedMaterialFactSpoken: true,
  });
  assert.equal(irRegFdGuard.financialCommentaryOrGuidanceAuthorized, false);
  assert.equal(irRegFdGuard.vdrCleanRoomFolderAccessGranted, false);
  assert.equal(irRegFdGuard.urgent24hForm8kCureAlertTriggered, true);

  const itadNistGuard = evaluateItAssetDispositionNist80088VoiceGuard({
    allCmdbDriveSerialsAccountedFor: false,
    nist80088OnSitePurgeOrShredVerified: true,
    assetUnderActiveLitigationLegalHold: true,
    containsSwollenOrUnremovedLithiumBattery: true,
  });
  assert.equal(itadNistGuard.dataCenterDockReleaseAuthorized, false);
  assert.equal(itadNistGuard.mediaWipeOrShreddingAuthorized, false);
  assert.equal(itadNistGuard.hazmatFireproofRecoveryBoxRequired, true);

  const fineArtAuctionGuard = evaluateFineArtAuctionBiddingAmlVoiceGuard({
    uboKycAndSanctionsScreeningCleared: true,
    verifiedDepositAndCreditLimitUsd: 2000000,
    totalObligationWithBuyersPremiumUsd: 2520000,
    collectorVerballyConfirmedIrrevocableBidAndBuyersPremium: true,
    callerProbesConfidentialReservePrice: true,
  });
  assert.equal(fineArtAuctionGuard.absenteeOrPhonePaddleRegistrationAuthorized, false);
  assert.equal(fineArtAuctionGuard.reservePriceDisclosureBlocked, true);

  const semiFabGuard = evaluateSemiconductorCleanroomFabVoiceGuard({
    chamberN2PurgeZeroPpmVerified: false,
    lotoPadlockAndRfPowerZeroVerified: true,
    processAndYieldEngineerDualSignVerified: false,
    tgmsToxicGasLeakOrHfSplashDetected: true,
  });
  assert.equal(semiFabGuard.chamberLidOpenStepAuthorized, false);
  assert.equal(semiFabGuard.waferLotReleaseOrScrapAuthorized, false);
  assert.equal(semiFabGuard.emergencyBayEvacuationAndHfGelProtocolTriggered, true);

  const themeParkGuard = evaluateThemeParkRideSafetyCodeAdamVoiceGuard({
    lightningWithin8MilesOrUnder30MinClear: true,
    reportsMissingChildInPark: true,
    itemDroppedInRideEnvelopeOrAnimalHabitat: true,
  });
  assert.equal(themeParkGuard.outdoorRideRestartAuthorized, false);
  assert.equal(themeParkGuard.codeAdamExitGatePerimeterLockTriggered, true);
  assert.equal(themeParkGuard.immediateTrackOrHabitatRetrievalBlocked, true);

  const genomicLiquidBiopsyGuard = evaluateGenomicOncologyLiquidBiopsyVoiceGuard({
    callerRequestsVariantOrVusClinicalInterpretation: true,
    streckCfDnaTubeFrozenOrHemolyzed: true,
    callerIsEmployerOrLifeDisabilityUnderwriter: true,
  });
  assert.equal(genomicLiquidBiopsyGuard.autonomousGeneticResultInterpretationAuthorized, false);
  assert.equal(genomicLiquidBiopsyGuard.urgentMobilePhlebotomyRedrawTriggered, true);
  assert.equal(genomicLiquidBiopsyGuard.ginaEmployerOrInsurerDisclosureBlocked, true);

  const seniorLivingGuard = evaluateSeniorLivingMemoryCareFallVoiceGuard({
    unwitnessedFallOrHeadImpactOrOnAnticoagulants: true,
    memoryCareResidentAtExitOrWanderGuardAlarm: true,
    callerIsVerifiedHealthcarePoaOrAuthorizedContact: false,
  });
  assert.equal(seniorLivingGuard.caregiverManualFloorLiftAuthorized, false);
  assert.equal(seniorLivingGuard.exitDoorKeepLockedAndCareTeamDispatched, true);
  assert.equal(seniorLivingGuard.clinicalHealthRecordDisclosureAuthorized, false);

  const immigrationGuard = evaluateCorporateImmigrationMobilityVoiceGuard({
    amendedLcaAndI129PetitionFiledWithUscis: false,
    holdsApprovedAdvanceParoleOrValidDualIntentVisa: false,
    atPortOfEntryCbpSecondaryOrI94ExpiresWithin14Days: true,
  });
  assert.equal(immigrationGuard.h1bOutOfMsaWorksiteMoveAuthorized, false);
  assert.equal(immigrationGuard.internationalTravelDepartureCleared, false);
  assert.equal(immigrationGuard.urgentImmigrationAttorneyEscalationTriggered, true);

  const esgCarbonGuard = evaluateEsgCarbonRegistryRetirementVoiceGuard({
    accreditedVvbVerificationAndSerialActive: true,
    beneficiaryEntityAndVintageVerballyConfirmed: false,
    requestsOffsetBasedProductCarbonNeutralMarketingClaim: true,
  });
  assert.equal(esgCarbonGuard.executeIrreversibleCreditRetirementAuthorized, false);
  assert.equal(esgCarbonGuard.unsubstantiatedCarbonNeutralClaimBlocked, true);

  const maritimeNorGuard = evaluateMaritimeCharteringNorWarRiskVoiceGuard({
    vesselInsidePortLimitsAndHoldsReady: false,
    warRiskUnderwriterCoverAndMasterConsentVerified: false,
    requestsCargoDischargeWithoutOriginalBl: true,
  });
  assert.equal(maritimeNorGuard.validNoticeOfReadinessAccepted, false);
  assert.equal(maritimeNorGuard.warRiskZoneTransitAuthorized, false);
  assert.equal(maritimeNorGuard.cargoDischargeWithoutOriginalBlBlocked, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 4)", () => {
  const bloodBankGuard = evaluateBloodBankPlasmaCrossmatchVoiceGuard({
    aboRhCompatibleAndIrradiatedSpecialReqMatched: false,
    donorOnTeratogenicOrAnticoagulantDeferralList: true,
    postDonationFeverOrInfectionReported: true,
  });
  assert.equal(bloodBankGuard.bloodUnitReleaseToHospitalAuthorized, false);
  assert.equal(bloodBankGuard.donorAppointmentBookingAuthorized, false);
  assert.equal(bloodBankGuard.immediateIsbt128UnitQuarantineAndRecallTriggered, true);

  const evtolDroneGuard = evaluateEvtolDroneUtmBvlosVoiceGuard({
    airspaceLaancClearedAndZeroActiveTfr: true,
    projectedLandingBatterySocPercent: 12,
    actualScaleWeightAndCgWithinEnvelopeVerified: true,
    mannedAircraftOrMedevacIntrusionDetected: true,
  });
  assert.equal(evtolDroneGuard.bvlosOrEvtolTakeoffCleared, false);
  assert.equal(evtolDroneGuard.immediateYieldDescendOrRtlTriggered, true);

  const privacyDsarGuard = evaluatePrivacyDsarCrossBorderBreachVoiceGuard({
    outOfBandIdentityAndAuthorizedAgentVerified: true,
    subjectToStatutoryAmlTaxOrActiveDebtRetention: true,
    reportsPersonalDataBreachOrLeak: true,
  });
  assert.equal(privacyDsarGuard.hardDatabaseErasureAuthorized, false);
  assert.equal(privacyDsarGuard.dpo72HourBreachClockEscalationTriggered, true);

  const windSolarGuard = evaluateRenewableWindSolarScadaVppVoiceGuard({
    hubWindUnder12MsAndRotorLockPinEngaged: true,
    technicianCheckedInsideTowerOrNacelle: true,
    bessThermalRunawayOrHydrogenOffGasDetected: true,
  });
  assert.equal(windSolarGuard.remoteScadaResetOrHubEntryAuthorized, false);
  assert.equal(windSolarGuard.bessContainerDoorLockoutAnd100mEvacuationTriggered, true);

  const filmProdGuard = evaluateFilmTvProductionSagStuntVoiceGuard({
    meetsUnion12HourTurnaroundOrForcedCallApproved: false,
    armorerAndFirstAdStuntSafetyBriefingVerified: false,
    signedSagAftraAiDigitalReplicaConsentOnFile: false,
  });
  assert.equal(filmProdGuard.callSheetDispatchAuthorized, false);
  assert.equal(filmProdGuard.stuntOrPyroHotSetRollAuthorized, false);
  assert.equal(filmProdGuard.aiVoiceCloneOr3dScanSessionAuthorized, false);

  const aviationMroGuard = evaluateAviationMroPart145AirworthinessVoiceGuard({
    certified8130OrForm1AndLlpTraceVerified: true,
    independentRiiInspectorDualSignVerified: false,
    allCheckedOutToolsAccountedForZeroFod: false,
  });
  assert.equal(aviationMroGuard.componentInstallationAndCrsReleaseAuthorized, false);

  const agritechBioGuard = evaluateAgritechGrainFumigationBiosecurityVoiceGuard({
    siloPhosphineUnder0Dot3PpmAndAugerLotoVerified: false,
    outsidePreHarvestOrDrugWithdrawalIntervalAndWindSafe: false,
    reportsSuddenFlockOrHerdMortalitySpike: true,
  });
  assert.equal(agritechBioGuard.grainSiloEntryAuthorized, false);
  assert.equal(agritechBioGuard.cropSprayOrHarvestReleaseAuthorized, false);
  assert.equal(agritechBioGuard.farmBiosecurityGateLockdownAndVetAlertTriggered, true);

  const carTCoiGuard = evaluateBiopharmaCarTChainOfIdentityVoiceGuard({
    autologousChainOfIdentityDualVerified: true,
    gradeAIsolatorAndSterilityAssayPassed: true,
    cryoShipperTempAboveMinus150COrMissingTocilizumab: true,
  });
  assert.equal(carTCoiGuard.batchReleaseAndHospitalInfusionAuthorized, false);
  assert.equal(carTCoiGuard.cryoExcursionHoldAndQpEscalationTriggered, true);

  const treasuryFxGuard = evaluateCorporateTreasuryFxWireVoiceGuard({
    preApprovedSsiAndFourEyesHardwareTokenVerified: false,
    fxNotionalWithinLimitAndBackedByErpExposure: false,
    callerRequestsSecretMnaBypassOrAdHocIban: true,
  });
  assert.equal(treasuryFxGuard.wireOrLiquiditySweepReleaseAuthorized, false);
  assert.equal(treasuryFxGuard.fxHedgeExecutionAuthorized, false);
  assert.equal(treasuryFxGuard.becFraudLockoutAndAuditAlertTriggered, true);

  const creColocationGuard = evaluateCommercialRealEstateColocationYardiVoiceGuard({
    approvedMopAndFireWatchVerifiedInIwms: false,
    assetManagerAndLegalSignedInYardi: false,
    elevatorEntrapmentOrDataHallThermalRunaway: true,
  });
  assert.equal(creColocationGuard.hotWorkOrCageAccessPermitAuthorized, false);
  assert.equal(creColocationGuard.leaseEstoppelOrRentAbatementAuthorized, false);
  assert.equal(creColocationGuard.bmsCriticalThermalOrEntrapmentDispatchTriggered, true);

  const districtHeatingGuard = evaluateDistrictHeatingChpSteamVoiceGuard({
    condensateDrainedAndWarmupRampVerified: false,
    municipalFreezeProtectionFloorMaintained: false,
    pipeRuptureMakeUpSurgeOrBoilerLowWater: true,
  });
  assert.equal(districtHeatingGuard.steamValveOpeningAuthorized, false);
  assert.equal(districtHeatingGuard.chpElectricPeakCurtailmentAuthorized, false);
  assert.equal(districtHeatingGuard.ruptureIsolationAndBoilerMftTriggered, true);

  const hybridRouterGuard = evaluateHybridS2sCascadeIntentRouterVoiceGuard({
    turnRequiresRegulatedVerbatimOrDeterministicTool: true,
    unifiedVoiceTimbreAndContextBufferSynced: false,
    s2sAudioTokenCostExceedsCallBudgetCap: true,
  });
  assert.equal(hybridRouterGuard.nativeS2sDirectAudioPermitted, false);
  assert.equal(hybridRouterGuard.midCallLaneSwitchAuthorized, false);
  assert.equal(hybridRouterGuard.forceCascadeFallbackAndBudgetClampTriggered, true);

  const avatarLivestreamKioskGuard = evaluateAvatarLivestreamRetailKioskVoiceGuard({
    productClaimApprovedInPimAndAdLawCompliant: false,
    flashSaleInventoryAndPromoFloorVerified: false,
    avatarLipSyncDriftAbove80msOrGpuOverload: true,
  });
  assert.equal(avatarLivestreamKioskGuard.avatarSpeechAndVideoBroadcastAuthorized, false);
  assert.equal(avatarLivestreamKioskGuard.flashSaleCouponOrCheckoutQrAuthorized, false);
  assert.equal(avatarLivestreamKioskGuard.fallbackTo2dCardAndAudioModeTriggered, true);

  const liveInterpreterBoardGuard = evaluateLiveInterpreterBoardMeetingVoiceGuard({
    clauseNegationPolarityAndNumericScaleVerified: false,
    zeroDataRetentionEndpointAndSpeakerConsentVerified: false,
    polarityFlipOrNumericScaleMismatchDetected: true,
  });
  assert.equal(liveInterpreterBoardGuard.simultaneousAudioAndMinutesCommitAuthorized, false);
  assert.equal(liveInterpreterBoardGuard.personalVoiceCloningPermitted, false);
  assert.equal(liveInterpreterBoardGuard.interpreterCorrectionAlertAndMinutesHoldTriggered, true);

  const slowApiFillerGuard = evaluateSlowApiAsyncFillerHeartbeatVoiceGuard({
    fillerContainsZeroOutcomeCommitment: false,
    toolResponseEpochMatchesCurrentSlotState: false,
    apiLatencyExceeded9sOrDownstreamTimeout: true,
  });
  assert.equal(slowApiFillerGuard.toolOutcomeSpeechAndCommitAuthorized, false);
  assert.equal(slowApiFillerGuard.asyncFillerPlaybackPermitted, false);
  assert.equal(slowApiFillerGuard.asyncSmsOrCallbackHandoffTriggered, true);

  const warmHandoffWhisperGuard = evaluateWarmHandoffWhisperContextBridgeVoiceGuard({
    verifiedAuthTokenAndRedactedSlotsAttached: false,
    targetSkillQueueStaffedAndWhisperAcked: false,
    callerSentimentCriticalOrRegulatedDispute: true,
  });
  assert.equal(warmHandoffWhisperGuard.warmTransferBridgeAuthorized, false);
  assert.equal(warmHandoffWhisperGuard.scheduledCallbackFallbackRequired, false);
  assert.equal(warmHandoffWhisperGuard.immediateSupervisorWarmHandoffTriggered, true);

  const salesRoleplayCoachingGuard = evaluateSalesRoleplayMedrepCoachingVoiceGuard({
    traineeMakesOffLabelOrKickbackPromise: true,
    personaStayedInCharacterZeroJailbreak: false,
    allMandatoryDisclosuresAndRubricEvidenceVerified: false,
  });
  assert.equal(salesRoleplayCoachingGuard.certificationPassAuthorized, false);
  assert.equal(salesRoleplayCoachingGuard.instantComplianceRedCardTriggered, true);
  assert.equal(salesRoleplayCoachingGuard.scorecardAuditValid, false);

  const autoCockpitEdgeGuard = evaluateAutomotiveCockpitEdgeCloudVoiceGuard({
    driverZoneAndParkGearInterlockVerified: false,
    driverEyesOnRoadAndConciseVoiceModeVerified: false,
    cellularRttAbove400msOrOfflineTunnel: true,
  });
  assert.equal(autoCockpitEdgeGuard.safetyCriticalVehicleCommandAuthorized, false);
  assert.equal(autoCockpitEdgeGuard.cloudMultimodalVisionAndRichUiAuthorized, false);
  assert.equal(autoCockpitEdgeGuard.edgeNpuOfflineControlFallbackTriggered, true);

  const multiAgentHandoffGuard = evaluateMultiAgentVoiceHandoffGraphGuard({
    prerequisiteAuthAndSlotContractVerified: false,
    unifiedVoicePersonaAndPrunedContextSynced: false,
    cyclicSubAgentBounceOrMaxHopsExceeded: true,
  });
  assert.equal(multiAgentHandoffGuard.subAgentTransitionAuthorized, false);
  assert.equal(multiAgentHandoffGuard.silentSinglePersonaPreserved, false);
  assert.equal(multiAgentHandoffGuard.breakLoopAndEscalateToSupervisorTriggered, true);

  const complianceQaGuard = evaluateComplianceRecordingAutomatedQaVoiceGuard({
    pciSadScrubbedFromAudioAndTranscript: false,
    recordingConsentAndDualTrackHashVerified: true,
    postCallQaDetectsPolicyDriftOrMissedDisclosure: true,
  });
  assert.equal(complianceQaGuard.wormStorageArchivalAuthorized, false);
  assert.equal(complianceQaGuard.cdeScopeExemptionMaintained, false);
  assert.equal(complianceQaGuard.complianceRemediationTicketAndCallbackTriggered, true);

  const frameworkMatrixGuard = evaluateVoiceOrchestrationFrameworkMatrixGuard({
    requiresStrictVpcDataResidencyOrCustomMediaFrame: true,
    monthlyCallMinutesExceeds40kInflection: true,
    gracefulCallDrainAndPreStopHookVerified: false,
  });
  assert.equal(frameworkMatrixGuard.managedSaasWrapperPermitted, false);
  assert.equal(frameworkMatrixGuard.selfHostedOrCloudNativeMigrationRecommended, true);
  assert.equal(frameworkMatrixGuard.productionRolloutAuthorized, false);

  const sttTtsMatrixGuard = evaluateSttTtsVoiceCloningMatrixGuard({
    voiceTalentVerbalConsentAndLicenseActive: false,
    customPhraseListAndPhonemeLexiconLoaded: false,
    primaryTtsTtfbAbove350msOrHttp5xx: true,
  });
  assert.equal(sttTtsMatrixGuard.clonedBrandVoiceDeploymentAuthorized, false);
  assert.equal(sttTtsMatrixGuard.domainSpeechSessionReady, false);
  assert.equal(sttTtsMatrixGuard.hotSwapBackupTtsEngineTriggered, true);

  const omnichannelIngressGuard = evaluateOmnichannelIngressVoiceIsolationGuard({
    primaryCallerVoiceprintAndNearFieldSnrVerified: false,
    hardwareAecActiveAndZeroSelfEchoLoopDetected: false,
    networkHandoverOrEchoFeedbackLoopDetected: true,
  });
  assert.equal(omnichannelIngressGuard.bargeInAndTurnCommitAuthorized, false);
  assert.equal(omnichannelIngressGuard.bystanderSpeechFiltered, true);
  assert.equal(omnichannelIngressGuard.halfDuplexFallbackOrSessionHoldTriggered, true);

  const smartWearableGuard = evaluateSmartWearableGlassesEarbudsVoiceGuard({
    privacyCaptureLedActiveAndBoneVpuVerified: false,
    templeTempUnder41cAndBatteryAbove15Pct: false,
    minorDistressOrUnsafeContentDetected: true,
  });
  assert.equal(smartWearableGuard.multimodalCameraBurstAndCloudStreamAuthorized, false);
  assert.equal(smartWearableGuard.audioOnlyLowPowerFallbackRequired, true);
  assert.equal(smartWearableGuard.childSafeRedirectAndParentAlertTriggered, true);

  const frontierEotGuard = evaluateFrontierDuplexAudioEotVoiceGuard({
    semanticAndProsodicTurnEndVerified: false,
    thinkerTextStreamGuardrailPassedBeforeTalker: false,
    speculativePrefetchAttemptsWriteMutation: true,
  });
  assert.equal(frontierEotGuard.aiTurnResponseAndAudioSynthesisAuthorized, false);
  assert.equal(frontierEotGuard.extendSilencePatienceWindowRequired, true);
  assert.equal(frontierEotGuard.blockSpeculativeWriteAndHoldUntilFinalEot, true);

  const luxuryVicGuard = evaluateLuxuryVicClientelingBrinksVoiceGuard({
    vicTierVerifiedZeroGreyMarketFlipAndDirectorApproved: false,
    armoredCarrierAndAmlKycCitesCleared: false,
    callerProbesBoutiqueVaultStockOrRequestsTying: true,
  });
  assert.equal(luxuryVicGuard.limitedAllocationReservationAuthorized, false);
  assert.equal(luxuryVicGuard.armoredValuableDispatchAuthorized, false);
  assert.equal(luxuryVicGuard.vaultSecurityAndAntiTyingLockTriggered, true);

  const orSurgicalTimeoutGuard = evaluateOperatingRoomSurgicalTimeoutVoiceGuard({
    whoThreePartyTimeOutAndLateralityMatched: false,
    rfidSpongeAndSharpsCountReconciled: false,
    intraoperativeHemorrhageMtpOrMalignantHyperthermia: true,
  });
  assert.equal(orSurgicalTimeoutGuard.incisionStartAndTimeOutSignOffAuthorized, false);
  assert.equal(orSurgicalTimeoutGuard.woundClosureSignOutAuthorized, false);
  assert.equal(orSurgicalTimeoutGuard.emergencyBloodBankMtpAndCodeCartTriggered, true);

  const voiceNativeRagGuard = evaluateVoiceNativeAgenticRagGuard({
    retrievedChunkEffectiveDateAndJurisdictionValid: false,
    spokenOutputStrippedOfMarkdownUrlsAndUnder45Words: false,
    hybridRetrievalConfidenceBelowThreshold: true,
  });
  assert.equal(voiceNativeRagGuard.ragSpokenResponseAuthorized, false);
  assert.equal(voiceNativeRagGuard.companionSmsDeepLinkDispatched, false);
  assert.equal(voiceNativeRagGuard.abstainFromGuessingAndEscalateTriggered, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 5)", () => {
  const qsrDriveThruGuard = evaluateQsrDriveThruAllergenPosVoiceGuard({
    allItemsInStockOnKdsAndUnderMaxQuantityCap: false,
    vehicleLoopAndCameraMatchedToOrderTicket: false,
    callerDisclosesSevereFoodAllergyOrAnaphylaxis: true,
  });
  assert.equal(qsrDriveThruGuard.posOrderCommitAndPaymentWindowReleaseAuthorized, false);
  assert.equal(qsrDriveThruGuard.allergenCrossContactWarningAndCrewBridgeTriggered, true);
  assert.equal(qsrDriveThruGuard.prankQuantityOr86dItemBlocked, true);

  const languageTutorGuard = evaluateLanguageTutorExecCoachingVoiceGuard({
    learnerTurnCompleteAfterL2PatienceWindow: false,
    acousticPhonemeGopAndOriginalityVerified: false,
    sessionTouchesEmploymentLawOrPsychiatricCrisis: true,
  });
  assert.equal(languageTutorGuard.tutorReplyAndScorecardCommitAuthorized, false);
  assert.equal(languageTutorGuard.holdForLearnerWordSearchPause, true);
  assert.equal(languageTutorGuard.boundaryRedirectToLegalOrEapTriggered, true);

  const voiceSecWafGuard = evaluateVoiceSecurityOwaspAgenticFirewallGuard({
    toolIdentityBoundFromSessionAndRbacVerified: false,
    acousticBandpassCleanAndSttS2sAligned: false,
    callerAttemptsDebugOverrideOrPromptExtraction: true,
  });
  assert.equal(voiceSecWafGuard.toolInvocationAuthorized, false);
  assert.equal(voiceSecWafGuard.crossCustomerIdorPhysicallyBlocked, false);
  assert.equal(voiceSecWafGuard.securityWafLockoutAndSiemAlertTriggered, true);

  const industrialLotoGuard = evaluateIndustrialSapPmLotoAtexVoiceGuard({
    operatorAndGuardianDualVoiceReadbackVerified: false,
    lotoPadlockZeroEnergyAndTryStartVerified: false,
    personalGasDetectorAlarmOrManDownTriggered: true,
  });
  assert.equal(industrialLotoGuard.nextSwitchingOrMaintenanceStepAuthorized, false);
  assert.equal(industrialLotoGuard.soloOrUnbledLotoViolationBlocked, true);
  assert.equal(industrialLotoGuard.plantEmergencyEvacuationAndRescueTriggered, true);

  const outboundAmdGuard = evaluateOutboundAmdTcpaOrchestrationVoiceGuard({
    priorExpressConsentAndQuietHoursVerified: false,
    humanAnsweredOrVoicemailBeepCompleted: false,
    recipientRequestsDoNotCallOptOut: true,
  });
  assert.equal(outboundAmdGuard.outboundDialAndPitchAuthorized, false);
  assert.equal(outboundAmdGuard.waitForVoicemailBeepBeforeReplay, true);
  assert.equal(outboundAmdGuard.globalDncSuppressionAndImmediateHangupTriggered, true);

  const museumDocentGuard = evaluateMuseumDocentUwbFactLockVoiceGuard({
    curatorialKnowledgeGraphCitationVerified: false,
    uwbPositionAndVisualArtifactIdAligned: false,
    cameraFlashEnabledInLightSensitiveZoneOrBarrierBreach: true,
  });
  assert.equal(museumDocentGuard.docentSpokenExplanationAuthorized, false);
  assert.equal(museumDocentGuard.folkloreHallucinationBlocked, true);
  assert.equal(museumDocentGuard.conservationFlashLockAndSecurityAlertTriggered, true);

  const waterUtilityGuard = evaluateWaterUtilityScadaDosingVoiceGuard({
    chemicalDosingWithinSafePpmEnvelopeAndDualSigned: false,
    linePressureAbove20PsiAndColiformLabNegativeVerified: false,
    transmissionMainRuptureOrChlorineGasLeakOrDropBelow20Psi: true,
  });
  assert.equal(waterUtilityGuard.chemicalDosingAdjustmentAndWaterClearanceAuthorized, false);
  assert.equal(waterUtilityGuard.boilWaterAdvisoryMaintained, true);
  assert.equal(waterUtilityGuard.emergencyValveCrewAndBoilWaterAlertTriggered, true);

  const earningsIrGuard = evaluateEarningsIrRegFdMnpiVoiceGuard({
    publicFilingVerifiedAndEmbargoReleased: false,
    gaapReconciliationPairedWithNonGaap: true,
    unfiledGuidanceOrMnaRumorOrActivistProbe: true,
  });
  assert.equal(earningsIrGuard.irFinancialMetricSpokenResponseAuthorized, false);
  assert.equal(earningsIrGuard.mnpiOrUnfiledGuidanceBlocked, true);
  assert.equal(earningsIrGuard.vpInvestorRelationsAndSecuritiesCounselEscalated, true);

  const genomicPathologyGuard = evaluateGenomicPathologyAcmgVusVoiceGuard({
    cliaCapPathologistSignedOff: true,
    variantIsActionableClass4Or5NotVus: false,
    highRiskGermlinePathogenicOrPatientDistress: true,
  });
  assert.equal(genomicPathologyGuard.clinicalVariantActionabilityAuthorized, false);
  assert.equal(genomicPathologyGuard.vusNonActionableGuardEnforced, true);
  assert.equal(genomicPathologyGuard.certifiedGeneticCounselorEscalated, true);

  const evMcsOcppGuard = evaluateEvMcsOcppV2gSafetyVoiceGuard({
    dcCurrentZeroAndVoltageDecayedBelow60V: false,
    morningDepartureTargetSocGuaranteed: false,
    bmsThermalRunawayOrGroundFaultOrSmoke: true,
  });
  assert.equal(evMcsOcppGuard.connectorUnlockAndV2gAuthorized, false);
  assert.equal(evMcsOcppGuard.v2gDischargeOrUnlockBlocked, true);
  assert.equal(evMcsOcppGuard.feederShuntTripAndFireHazmatTriggered, true);

  const smartBuildingElevatorGuard = evaluateSmartBuildingElevatorBmsVoiceGuard({
    carInDoorZoneVerifiedWithin25mm: false,
    lifeSafetySmokeDamperAndFireRecallUntouched: false,
    elevatorEntrapmentOrDoorPryingOrFireAlarm: true,
  });
  assert.equal(smartBuildingElevatorGuard.elevatorDoorAndComfortBmsActionAuthorized, false);
  assert.equal(smartBuildingElevatorGuard.selfExtractionAndLifeSafetyOverrideBlocked, true);
  assert.equal(smartBuildingElevatorGuard.fireCommandCenterAndElevatorMechanicBridged, true);

  const roadsideAssistGuard = evaluateRoadsideAssistEvFlatbedVoiceGuard({
    driverAndPassengersEvacuatedBehindGuardrail: false,
    evOrAwdFlatbedAndSkatesMatched: false,
    activeHighwayLaneStallOrAirbagEcallOrFire: true,
  });
  assert.equal(roadsideAssistGuard.towDispatchAuthorized, false);
  assert.equal(roadsideAssistGuard.commercialIntakeSuspendedOrWheelLiftBlocked, true);
  assert.equal(roadsideAssistGuard.highwayPatrolAndCrashAttenuatorBridged, true);

  const vetLivestockGuard = evaluateVetLivestockBiosecurityVcprVoiceGuard({
    drugWithdrawalPeriodExpiredAndResidueSafe: false,
    vcprVerifiedAndSpeciesSafeDosing: false,
    notifiableEpizooticOrAcuteToxinEmergency: true,
  });
  assert.equal(vetLivestockGuard.shipmentAndTreatmentReleaseAuthorized, false);
  assert.equal(vetLivestockGuard.residueWithdrawalOrSpeciesToxicityBlocked, true);
  assert.equal(vetLivestockGuard.epizooticQuarantineAndEmergencyVetBridged, true);

  const examProctorGuard = evaluateExamProctorOralAdaVoiceGuard({
    verbatimStemOnlyAndZeroHintEnforced: false,
    adaExtendedTimeAndStopClockRespected: false,
    acousticCollusionOrCandidateDistress: true,
  });
  assert.equal(examProctorGuard.readAloudAndExamContinuationAuthorized, false);
  assert.equal(examProctorGuard.itemHintOrPrematureSubmitBlocked, true);
  assert.equal(examProctorGuard.humanChiefProctorEscalated, true);

  const teleOptometryGuard = evaluateTeleOptometryRxSafetyVoiceGuard({
    diopterSignAxisAndPdVerified: false,
    contactLensBrandAndBaseCurveRxValid: false,
    acuteRetinalDetachmentGlaucomaOrRedEyeAlarm: true,
  });
  assert.equal(teleOptometryGuard.opticalLabAndContactLensOrderAuthorized, false);
  assert.equal(teleOptometryGuard.incompleteRxOrSpectacleToContactSwapBlocked, true);
  assert.equal(teleOptometryGuard.ophthalmologyEmergencyTriageBridged, true);

  const biopharmaCleanroomGuard = evaluateBiopharmaCleanroomEbrGmpVoiceGuard({
    alcoaPlusContemporaneousAndAppendOnlyVerified: false,
    fourEyesDualVerificationAndCoiMatched: false,
    sterilityBreachDifferentialPressureDropOrOos: true,
  });
  assert.equal(biopharmaCleanroomGuard.ebrStepCommitAndReleaseAuthorized, false);
  assert.equal(biopharmaCleanroomGuard.alcoaOverwriteOrSingleVerifierBlocked, true);
  assert.equal(biopharmaCleanroomGuard.batchQuarantineHoldAndQaQpBridged, true);

  const taxCpaGuard = evaluateTaxCpaCircular230Section7216VoiceGuard({
    section7216ConsentAndPiiIsolationVerified: false,
    circular230SubstantiationAndTaxEngineVerified: false,
    taxAuditNoticeFraudAttemptOrComplexInternational: true,
  });
  assert.equal(taxCpaGuard.taxFilingCalculationAndSummaryAuthorized, false);
  assert.equal(taxCpaGuard.unsubstantiatedDeductionOrSection7216LeakBlocked, true);
  assert.equal(taxCpaGuard.licensedCpaOrEnrolledAgentBridged, true);

  const truckingEldGuard = evaluateTruckingEldHosHazmatVoiceGuard({
    hosRemainingAndEldImmutableVerified: false,
    bridgeClearanceHazmatTunnelAndDvirSafe: false,
    airBrakeLossHazmatSpillOrRollover: true,
  });
  assert.equal(truckingEldGuard.commercialRouteAndEldLogAuthorized, false);
  assert.equal(truckingEldGuard.hosTamperOrLowBridgeHazmatTunnelBlocked, true);
  assert.equal(truckingEldGuard.runawayRampAndChemtrecEmergencyBridged, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 6)", () => {
  const constructionBimGuard = evaluateConstructionBimOshaCraneVoiceGuard({
    peStampedRfiAndLatestIfcDrawingVerified: false,
    craneWindLmiAndTrenchShoringSafe: false,
    trenchCollapseFallArrestOrUtilityStrike: true,
  });
  assert.equal(constructionBimGuard.fieldConstructionAndCranePickAuthorized, false);
  assert.equal(constructionBimGuard.unapprovedStructuralModOrUnsafeLiftBlocked, true);
  assert.equal(constructionBimGuard.stopWorkSirenAndTechnicalRescueBridged, true);

  const creditFcraGuard = evaluateCreditFcraEcoaAdverseVoiceGuard({
    officialAdverseActionReasonCodesAndZeroBiasVerified: false,
    legitimateDisputeAndZeroCreditWashingVerified: false,
    identityTheftFraudOrMilitaryScraProtection: true,
  });
  assert.equal(creditFcraGuard.adverseActionReadoutAndDisputeIntakeAuthorized, false);
  assert.equal(creditFcraGuard.speculativeReasonOrCreditWashingBlocked, true);
  assert.equal(creditFcraGuard.securityFreezeAndFraudScraSpecialistBridged, true);

  const sleepCpapGuard = evaluateSleepCpapNivRespiratoryVoiceGuard({
    rxPressureLockedAndComfortOnlyAdjusted: false,
    cmsComplianceTrackedAndAsvContraindicationSafe: false,
    acuteHypercapniaHypoxiaOrVentilatorAlarm: true,
  });
  assert.equal(sleepCpapGuard.comfortCoachingAndResupplyAuthorized, false);
  assert.equal(sleepCpapGuard.clinicalMenuPressureOverrideOrAsvBlocked, true);
  assert.equal(sleepCpapGuard.emergencyRrtAndEmsBridged, true);

  const cruiseShipboardGuard = evaluateCruiseShipboardSolasConciergeVoiceGuard({
    shipTimeSyncedAndMusterDrillCompleted: false,
    vspGastroenteritisContainmentVerified: false,
    manOverboardFireOrAbandonShipAlarm: true,
  });
  assert.equal(cruiseShipboardGuard.shipboardDiningAndExcursionBookingAuthorized, false);
  assert.equal(cruiseShipboardGuard.timezoneMismatchOrGiNorovirusIsolationEnforced, true);
  assert.equal(cruiseShipboardGuard.bridgeEcdisMobAndMedicalCenterBridged, true);

  const robotaxiAvGuard = evaluateRobotaxiAvMrcResponderVoiceGuard({
    safeCurbsideMrcAndDoorCyclistClearVerified: false,
    asilDMotionIsolationAndZeroDirectActuation: false,
    externalFirstResponderOrRiderMedicalEmergency: true,
  });
  assert.equal(robotaxiAvGuard.curbsidePullOverAndDoorUnlockAuthorized, false);
  assert.equal(robotaxiAvGuard.midLaneStopOrMotionActuationBlocked, true);
  assert.equal(robotaxiAvGuard.bPillarFirstResponderAndFleetSpecialistBridged, true);

  const bespokeCoutureGuard = evaluateBespokeCoutureAlterationVoiceGuard({
    seamAllowanceAndShoeHeightVerifiedBeforeIrreversibleCut: false,
    weddingWearDateBufferAndDyeLotLocked: false,
    silkLaceStainOrEveOfWeddingAlterationCrisis: true,
  });
  assert.equal(bespokeCoutureGuard.atelierCutAndCommissionAuthorized, false);
  assert.equal(bespokeCoutureGuard.irreversibleCutOrTightWearDateBlocked, true);
  assert.equal(bespokeCoutureGuard.masterTailorAndBridalSosBridged, true);

  const commercialInsuranceGuard = evaluateCommercialInsuranceAcord25MoratoriumVoiceGuard({
    acord25MatchesEndorsedPolicyTruth: false,
    outsideCatMoratoriumAndWithinBindingLimit: false,
    catastrophicLossCyberBreachOrDnoSubpoena: true,
  });
  assert.equal(commercialInsuranceGuard.acord25IssuanceAndEndorsementBindAuthorized, false);
  assert.equal(commercialInsuranceGuard.unendorsedCoiOrCatMoratoriumBindBlocked, true);
  assert.equal(commercialInsuranceGuard.executiveAdjusterAndCyberBreachCoachBridged, true);

  const wetLabSdsGuard = evaluateWetLabSdsPyrophoricHfVoiceGuard({
    chemicalCompatibilityAndPyrophoricQuenchSafe: false,
    fumeHoodVelocitySashAndPeroxideSafe: false,
    hfAcidExposurePyrophoricFireOrShowerPull: true,
  });
  assert.equal(wetLabSdsGuard.elnStepAndWasteDisposalAuthorized, false);
  assert.equal(wetLabSdsGuard.incompatibleMixOrLowFumeHoodVelocityBlocked, true);
  assert.equal(wetLabSdsGuard.hfCalciumGluconateAndEhsHazmatBridged, true);

  const stadiumEventGuard = evaluateStadiumEventCrowdAedVoiceGuard({
    crowdDensityBelowCrushThresholdAndEgressBalanced: false,
    lightningClearAndConcussionReturnToPlaySafe: false,
    fanCardiacArrestCrowdCrushOrLostChild: true,
  });
  assert.equal(stadiumEventGuard.wayfindingAndReturnToPlayAuthorized, false);
  assert.equal(stadiumEventGuard.crushCorridorOrConcussionLightningBlocked, true);
  assert.equal(stadiumEventGuard.nfcSeatPinAedAndVenueCommandBridged, true);

  const fertilityIvfGuard = evaluateFertilityIvfCryobankWitnessVoiceGuard({
    rfidWitnessAndDualEmbryologistPgtVerified: false,
    triggerShotMinuteWindowAndIuDoseVerified: false,
    severeOhssOvarianTorsionOrLn2CryoAlarm: true,
  });
  assert.equal(fertilityIvfGuard.embryoStepAndTriggerLogAuthorized, false);
  assert.equal(fertilityIvfGuard.gameteMismatchOrTriggerDriftBlocked, true);
  assert.equal(fertilityIvfGuard.reiPhysicianAndLabDirectorBridged, true);

  const wasteMrfGuard = evaluateWasteMrfLithiumHotloadVoiceGuard({
    lithiumBatteryAndPressurizedTankExcludedFromCompactor: false,
    hazmatAsbestosFreonAndBalerLotoVerified: false,
    smokingHotLoadBalerJamOrRadiationAlarm: true,
  });
  assert.equal(wasteMrfGuard.curbsidePickupAndBalerAccessAuthorized, false);
  assert.equal(wasteMrfGuard.lithiumPropaneInCartOrUnlockedBalerBlocked, true);
  assert.equal(wasteMrfGuard.hotLoadAsphaltPadAndFireDispatchBridged, true);

  const bizavFboGuard = evaluateBizavFboJetMisfuelDefVoiceGuard({
    fuelGradeFsiiNotDefAndUnitVerified: false,
    runwayBalancedFieldAndNotamCurfewSafe: false,
    hangarFoamDischargeFuelSpillOrInflightMedical: true,
  });
  assert.equal(bizavFboGuard.fuelUpliftAndCharterDispatchAuthorized, false);
  assert.equal(bizavFboGuard.misfuelDefOrShortWetRunwayBlocked, true);
  assert.equal(bizavFboGuard.hangarEvacuationArffAndMedaireBridged, true);

  const orthoRehabGuard = evaluateOrthoRehabWeightbearingDvtVoiceGuard({
    weightBearingAndRomPrecautionRespected: false,
    sharpPainAndGraftOverloadBlocked: false,
    dvtPulmonaryEmbolismOrCaudaEquinaRedFlag: true,
  });
  assert.equal(orthoRehabGuard.rehabExerciseSetContinuationAuthorized, false);
  assert.equal(orthoRehabGuard.nwbRomViolationOrSharpPainHalted, true);
  assert.equal(orthoRehabGuard.immobilizationAndOrthoVascularErBridged, true);

  const estateTrustGuard = evaluateEstateTrustUndueInfluenceVoiceGuard({
    grantorAloneAndTestamentaryCapacityVerified: false,
    attorneyReviewedAndFormalitiesMatched: false,
    elderAbuseCoercionOrDeathbedEmergency: true,
  });
  assert.equal(estateTrustGuard.dispositiveIntakeAndTrustReviewAuthorized, false);
  assert.equal(estateTrustGuard.undueInfluencePrivilegeWaiverOrUplBlocked, true);
  assert.equal(estateTrustGuard.actecPartnerCounselAndFinra2165HoldBridged, true);

  const precisionAgGuard = evaluatePrecisionAgGrainBinDriftVoiceGuard({
    sprayWindInversionAndPollinatorBufferSafe: false,
    grainBinAugerLotoAndGasClearVerified: false,
    grainEntrapmentTractorRolloverOrPesticidePoisoning: true,
  });
  assert.equal(precisionAgGuard.sprayApplicationAndBinEntryAuthorized, false);
  assert.equal(precisionAgGuard.windDriftInversionOrEnergizedAugerBlocked, true);
  assert.equal(precisionAgGuard.augerTripAerationFanAndCofferdamRescueBridged, true);

  const ndtRadiographyGuard = evaluateNdtRadiographyIr192SurveyVoiceGuard({
    surveyMeterVerifiedSourceShieldedAndLocked: false,
    twoPersonCrewBoundaryAndLevel2SignoffVerified: false,
    jammedDisconnectedSourceOrHighRateAlarm: true,
  });
  assert.equal(ndtRadiographyGuard.filmSwapAndWeldReportReleaseAuthorized, false);
  assert.equal(ndtRadiographyGuard.unsurveyedRetractionOrUnqualifiedSignoffBlocked, true);
  assert.equal(ndtRadiographyGuard.perimeterRetreatAndRsoEmergencyBridged, true);

  const warehouseAmrGuard = evaluateWarehouseAmrAsrsIso3691VoiceGuard({
    trappedKeyLotoAndNoSoftPauseEntryVerified: false,
    palletContourWeightAndColdChainSafe: false,
    zoneIntrusionHazmatSpillOrBatterySmoke: true,
  });
  assert.equal(warehouseAmrGuard.zoneMaintenanceAndAsrsPutawayAuthorized, false);
  assert.equal(warehouseAmrGuard.softPauseEntryOrOverhangingPalletBlocked, true);
  assert.equal(warehouseAmrGuard.safetyPlcZoneEstopAndFlowControlBridged, true);

  const pediatricVaccineGuard = evaluatePediatricVaccineAcipColdchainVoiceGuard({
    acipIntervalAndLiveVaccineContraindicationSafe: false,
    coldChainUnfrozenAndDiluentMatched: false,
    anaphylaxisStridorOrIntussusceptionRedFlag: true,
  });
  assert.equal(pediatricVaccineGuard.vaccineAdministrationAndSlotAuthorized, false);
  assert.equal(pediatricVaccineGuard.invalidIntervalOrFrozenVialOrLiveContraindicationBlocked, true);
  assert.equal(pediatricVaccineGuard.weightBasedEpinephrineAndPediatricErBridged, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 7)", () => {
  const titleEscrowGuard = evaluateTitleEscrowClosingWireTridVoiceGuard({
    wireInstructionPortalVerifiedAndZeroVerbalChange: false,
    tridThreeDayWaitAndTitleClearVerified: false,
    wireFraudAttemptDeedForgeryOrLienDefect: true,
  });
  assert.equal(titleEscrowGuard.closingSigningAndDisbursementAuthorized, false);
  assert.equal(titleEscrowGuard.verbalWireChangeOrPrematureTridBlocked, true);
  assert.equal(titleEscrowGuard.fedwireRecallFbiRatAndUnderwriterBridged, true);

  const radiologyMriGuard = evaluateRadiologyMriFerromagneticContrastVoiceGuard({
    acrZone4FerromagneticAndImplantCleared: false,
    contrastEgfrMetforminAndPremedSafe: false,
    contrastExtravasationAnaphylaxisOrQuenchAlarm: true,
  });
  assert.equal(radiologyMriGuard.mriZone4EntryAndContrastBolusAuthorized, false);
  assert.equal(radiologyMriGuard.ferromagneticImplantOrRenalMetforminRiskBlocked, true);
  assert.equal(radiologyMriGuard.powerInjectorHaltedAndZone3RescueOrQuenchBridged, true);

  const coldStorageGuard = evaluateColdStorageReeferFsmaAmmoniaVoiceGuard({
    corePulpTempAndAntiRefreezeVerified: false,
    deepFreezeExposureAndDockPrecoolSafe: false,
    ammoniaLeakOrFreezerManDownEntrapment: true,
  });
  assert.equal(coldStorageGuard.coldStoragePutawayAndPickAuthorized, false);
  assert.equal(coldStorageGuard.thawedRefreezeOrCryoOvertimeBlocked, true);
  assert.equal(coldStorageGuard.ammoniaUpwindEvacAndFreezerDoorReleaseBridged, true);

  const specialtyPharmacyGuard = evaluateSpecialtyPharmacyRemsBiologicsVoiceGuard({
    fdaRemsRmaPregnancyAndAncVerified: false,
    coldChainLiveRecipientAndOnHandAudited: false,
    febrileNeutropeniaPregnancyOrBleedEmergency: true,
  });
  assert.equal(specialtyPharmacyGuard.remsDispenseAndColdChainPackoutAuthorized, false);
  assert.equal(specialtyPharmacyGuard.expiredRemsOrBlindColdShipBlocked, true);
  assert.equal(specialtyPharmacyGuard.clinicalPharmacistAndMedwatchBridged, true);

  const foodMfgGuard = evaluateFoodMfgAllergenChangeoverNfpa61VoiceGuard({
    allergenElisaSwabAndPackagingFilmMatched: false,
    ccpMetalTestPassedAndNfpa61VacuumSafe: false,
    ccpFailureSieveBreakOrDustSparkAlarm: true,
  });
  assert.equal(foodMfgGuard.lineStartupAndPalletReleaseAuthorized, false);
  assert.equal(foodMfgGuard.unswabbedAllergenOrCompressedAirDustBlocked, true);
  assert.equal(foodMfgGuard.linePlcTrippedAndRetroactivePalletHoldBridged, true);

  const aquaticWaterparkGuard = evaluateAquaticWaterparkHypochloriteVgbVoiceGuard({
    chemicalAntiMixAndFlowInterlockVerified: false,
    mahcCryptoCtAndVgbGrateVerified: false,
    vgbSuctionEntrapmentCl2GasOrDrowningAlarm: true,
  });
  assert.equal(aquaticWaterparkGuard.chemicalFillAndPoolOpenAuthorized, false);
  assert.equal(aquaticWaterparkGuard.acidBleachMixOrPrematureCryptoReopenBlocked, true);
  assert.equal(aquaticWaterparkGuard.svrsPumpCutoffAndAquaticRescueBridged, true);

  const printingPackagingGuard = evaluatePrintingPackagingLowmigrationLelVoiceGuard({
    lowMigrationFoodInkAndPdfArtworkVerified: false,
    nipPointLotoAndSolventLelUnder25Safe: false,
    solventLelSpikeInkFireOrNipEntrapment: true,
  });
  assert.equal(printingPackagingGuard.pressRunAndSlitterReleaseAuthorized, false);
  assert.equal(printingPackagingGuard.nonFoodInkOrLiveNipWipeBlocked, true);
  assert.equal(printingPackagingGuard.pressTrippedRtoBypassedAndCo2Triggered, true);

  const pestControlFumigationGuard = evaluatePestControlFumigationVikaneFifraVoiceGuard({
    preFumigationSweepChloropicrinAndSecondaryLockVerified: false,
    instrumentClearanceUnder1PpmAndFifraLabelSafe: false,
    tentIntrusionFumigantSymptomOrRodenticideIngestion: true,
  });
  assert.equal(pestControlFumigationGuard.fumigantReleaseAndReentryAuthorized, false);
  assert.equal(pestControlFumigationGuard.untestedReentryOrMissingChloropicrinBlocked, true);
  assert.equal(pestControlFumigationGuard.scbaHazmatAndPoisonControlBridged, true);

  const skiResortGuard = evaluateSkiResortAvalancheGondolaB77VoiceGuard({
    avalancheBlastZoneSweptAndWinchCableLocked: false,
    ansiB77DeropementAndCrosswindSafe: false,
    avalancheBurialTreeWellOrLiftRollbackEmergency: true,
  });
  assert.equal(skiResortGuard.gazexDetonationAndLiftLoadingAuthorized, false);
  assert.equal(skiResortGuard.occupiedRunoutOrDeropementBypassBlocked, true);
  assert.equal(skiResortGuard.bullwheelEmergencyBrakeAndAvalancheSarBridged, true);

  const commercialLaundryGuard = evaluateCommercialLaundryHlacSpontaneousFireVoiceGuard({
    hlacSporeKillAndCleanBarrierVerified: false,
    oilLinenCooldownUnder40cAndPressLotoSafe: false,
    bloodborneSharpsStickDryerFireOrPressJam: true,
  });
  assert.equal(commercialLaundryGuard.cleanSideReleaseAndCartDumpAuthorized, false);
  assert.equal(commercialLaundryGuard.subSpecSporeWashOrHotOilCartDumpBlocked, true);
  assert.equal(commercialLaundryGuard.sharpsRfidPepAndDryerTumblingDelugeBridged, true);

  const wineryDistilleryGuard = evaluateWineryDistilleryCellarCo2StillVoiceGuard({
    cellarFloorCo2AndConfinedSpaceSafe: false,
    foreshotsMethanolCutAndStillLelSafe: false,
    co2AsphyxiationStillVaporOrSo2Leak: true,
  });
  assert.equal(wineryDistilleryGuard.tankManwayAndHeartsSwitchAuthorized, false);
  assert.equal(wineryDistilleryGuard.highCo2TankEntryOrMethanolHeadsBlocked, true);
  assert.equal(wineryDistilleryGuard.floorExhaustStillCutoffAndTripodScbaBridged, true);

  const pulpPaperGuard = evaluatePulpPaperBlrbacSmeltClo2VoiceGuard({
    blrbacBlackLiquorSolidsAndNoWaterSafe: false,
    paperMachineNipAndPulperLotoSafe: false,
    boilerTubeLeakClo2GasOrReelNipEmergency: true,
  });
  assert.equal(pulpPaperGuard.blackLiquorFiringAndPaperRunAuthorized, false);
  assert.equal(pulpPaperGuard.diluteBlackLiquorOrLiveNipEntryBlocked, true);
  assert.equal(pulpPaperGuard.boilerEvacBunkerEspAndClo2ScrubberBridged, true);

  const glassMfgGuard = evaluateGlassMfgFloatTinbathStillageVoiceGuard({
    jumboStillageRestraintAndVacuumSafe: false,
    tinBathH2PositivePressureAndIsSwabSafe: false,
    furnaceRunoutTinBathH2LeakOrGlassCrush: true,
  });
  assert.equal(glassMfgGuard.stillageUnstrapAndTinBathH2Authorized, false);
  assert.equal(glassMfgGuard.frontalFallZoneUnstrapOrNegativeTinBathBlocked, true);
  assert.equal(glassMfgGuard.pitEvacWaterFreezeLanceAndTraumaBridged, true);

  const tireRubberGuard = evaluateTireRubberCuringBanburyDotVoiceGuard({
    curingBladderZeroPressureAndDomePinSafe: false,
    millTripBarCompoundMdrAndDotTinMatched: false,
    millNipEntrapmentSteamBurstOrSulfurFire: true,
  });
  assert.equal(tireRubberGuard.pressOpenAndGreenTireLoadAuthorized, false);
  assert.equal(tireRubberGuard.residualBladderPressureOrDotMismatchBlocked, true);
  assert.equal(tireRubberGuard.millReverseRollAndSteamHeaderIsolationBridged, true);

  const textileDyeingGuard = evaluateTextileDyeingHthpHydrosulfiteNeedleVoiceGuard({
    hthpDyerUnder80cZeroPressureAndChemicalSafe: false,
    brokenNeedleCompleteAndZdhcMrslVerified: false,
    stenterFireSingeingStallOrEtpH2sAlarm: true,
  });
  assert.equal(textileDyeingGuard.dyerHatchAndNeedleDispenseAuthorized, false);
  assert.equal(textileDyeingGuard.boilOverRiskOrMissingNeedleFragmentBlocked, true);
  assert.equal(textileDyeingGuard.stenterSteamQuenchAndBundleQuarantineBridged, true);

  const paintCoatingGuard = evaluatePaintCoatingResinStaticIsocyanateVoiceGuard({
    disperserStaticGroundAndClosedPowderSafe: false,
    resinShortstopArmedAndIsocyanateDrySafe: false,
    reactorThermalRunawayDisperserFireOrTdiLeak: true,
  });
  assert.equal(paintCoatingGuard.disperserRunAndPolymerizationAuthorized, false);
  assert.equal(paintCoatingGuard.ungroundedPowderDumpOrUnarmedShortstopBlocked, true);
  assert.equal(paintCoatingGuard.gravityShortstopDumpAndArAfffFoamBridged, true);

  const woodworkingFurnitureGuard = evaluateWoodworkingFurnitureNfpa664CarbVoiceGuard({
    nfpa664DustVelocityAndSparkWaterArmed: false,
    ripSawAntiKickbackAndBoardFormaldehydeMatched: false,
    ductSparkHotPressFireOrSawKickbackInjury: true,
  });
  assert.equal(woodworkingFurnitureGuard.sanderSpindleAndRipSawFeedAuthorized, false);
  assert.equal(woodworkingFurnitureGuard.lowDustVelocityOrWiredKickbackBlocked, true);
  assert.equal(woodworkingFurnitureGuard.greconSparkMistAbortGateAndTraumaBridged, true);

  const electroplatingGuard = evaluateElectroplatingAnodizingCyanideHcnVoiceGuard({
    cyanideAcidSegregatedAndGalvanizingVented: false,
    rectifierZeroCurrentLiftAndHeaterFloatSafe: false,
    hcnGasLeakTankHeaterFireOrCyanideSplash: true,
  });
  assert.equal(electroplatingGuard.chemicalDoseAndHoistLiftAuthorized, false);
  assert.equal(electroplatingGuard.acidCyanideMixOrLiveHoistArcBlocked, true);
  assert.equal(electroplatingGuard.causticSumpDumpAndCyanokitProtocolBridged, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 8)", () => {
  const industrialGasGuard = evaluateIndustrialGasAsuLoxCgaVoiceGuard({
    oxygenSlowEqualizeOilFreeAndConcretePadSafe: false,
    cgaNoAdapterHydrotestAndMedicalUspVerified: false,
    loxOnAsphaltO2EnrichmentOrCryoAsphyxiation: true,
  });
  assert.equal(industrialGasGuard.o2MainValveAndCylinderFillAuthorized, false);
  assert.equal(industrialGasGuard.adiabaticHighDeltaPOrCgaAdapterBlocked, true);
  assert.equal(industrialGasGuard.loxAsphaltCordonAndGarmentAirOutBridged, true);

  const cementKilnGuard = evaluateCementKilnCycloneCoalmillCoVoiceGuard({
    cycloneJamAboveOnlyAndLowerTowerEvacuated: false,
    coalMillInertedKilnPinnedAndCoolerDrySafe: false,
    hotMealFlushEspCoSpikeOrCoalSmolder: true,
  });
  assert.equal(cementKilnGuard.cycloneClearingAndKilnEntryAuthorized, false);
  assert.equal(cementKilnGuard.belowJamPokeOrCoalDoorOpenBlocked, true);
  assert.equal(cementKilnGuard.towerEvacSirenEspTripAndCo2FloodBridged, true);

  const readyMixConcreteGuard = evaluateReadyMixConcreteDrumWaterBoomVoiceGuard({
    aciWaterCementRatioAnd90MinSlumpValid: false,
    drumChippingLotoAndBoomPowerlineOutriggerSafe: false,
    pluggedPipeHighPressurePowerlineArcOrHopperBreach: true,
  });
  assert.equal(readyMixConcreteGuard.structuralPourAndBoomUnfoldAuthorized, false);
  assert.equal(readyMixConcreteGuard.unauthorizedWaterOrUnpinnedDrumBlocked, true);
  assert.equal(readyMixConcreteGuard.reversePumpZeroBarAndBoomLockBridged, true);

  const asphaltHmaGuard = evaluateAsphaltHmaBitumenBoiloverH2sVoiceGuard({
    hotBitumenZeroWaterEmulsionAndFlashSafe: false,
    heaterCoilSubmergedH2sClosedAndPugmillLotoSafe: false,
    bitumenBoiloverBaghouseFireOrSkinSplash: true,
  });
  assert.equal(asphaltHmaGuard.bitumenTransferAndHmaProductionAuthorized, false);
  assert.equal(asphaltHmaGuard.emulsionBoiloverOrExposedHeaterCoilBlocked, true);
  assert.equal(asphaltHmaGuard.coldWaterTarBurnProtocolAndPumpCutoffBridged, true);

  const ceramicsKilnGuard = evaluateCeramicsKilnBallmillSilicaVoiceGuard({
    ballMillZeroPressureAndSilicaWetCleanSafe: false,
    pressMechanicalBlockAndKilnFourVolumePurgeSafe: false,
    kilnRollerWreckSprayDryerFireOrPressBreach: true,
  });
  assert.equal(ceramicsKilnGuard.ballMillUnboltAndPressDieWipeAuthorized, false);
  assert.equal(ceramicsKilnGuard.pressurizedMillOrUnblockedPressBlocked, true);
  assert.equal(ceramicsKilnGuard.kilnRollerOscillationAndSprayDryerDelugeBridged, true);

  const plasticsMoldingGuard = evaluatePlasticsMoldingBarrelAnsiB151VoiceGuard({
    resinCompatibilityNozzleShieldAndSoakSafe: false,
    platenTripleInterlockRobotHomeAndEyeboltSafe: false,
    barrelDecompositionFumeExtruderOverpressureOrMeltBurn: true,
  });
  assert.equal(plasticsMoldingGuard.resinLoadPurgeAndPlatenEntryAuthorized, false);
  assert.equal(plasticsMoldingGuard.pomPvcBarrelMixOrOpenShieldPurgeBlocked, true);
  assert.equal(plasticsMoldingGuard.carriageRetractFumeExhaustAndBurnProtocolBridged, true);

  const heatTreatingGuard = evaluateHeatTreatingFurnaceNfpa86QuenchVoiceGuard({
    nfpa86Temp760cPurgeAndFlameCurtainSafe: false,
    oilQuenchWaterLimitAgitatorAndPyrometrySafe: false,
    oilQuenchFireVacuumWaterLeakOrCoEmergency: true,
  });
  assert.equal(heatTreatingGuard.rxGasAndQuenchElevatorAuthorized, false);
  assert.equal(heatTreatingGuard.lowTempRxGasOrWaterInQuenchOilBlocked, true);
  assert.equal(heatTreatingGuard.emergencyNitrogenFloodAndFuelCutoffBridged, true);

  const foundryCastingGuard = evaluateFoundryCastingInductionWetscrapVoiceGuard({
    scrapPreheat350cAndHollowContainerClearSafe: false,
    ladlePreheat850cAndEmergencyPitDrySafe: false,
    crucibleGroundFaultCoilLeakOrRunoutEmergency: true,
  });
  assert.equal(foundryCastingGuard.scrapChargeAndFurnaceTiltAuthorized, false);
  assert.equal(foundryCastingGuard.wetScrapOrColdLadlePitBlocked, true);
  assert.equal(foundryCastingGuard.inverterTripAndEmergencyCoilWaterBridged, true);

  const metalStampingGuard = evaluateMetalStampingPressDieblockB11VoiceGuard({
    dieSafetyBlockPlugPulledAndFlywheelZeroRpmSafe: false,
    doubleBlankPartEjectAndTonnageLimitSafe: false,
    lightCurtainBreachClutchSplitOrOverloadTrip: true,
  });
  assert.equal(metalStampingGuard.dieSpaceEntryAndFeederRunAuthorized, false);
  assert.equal(metalStampingGuard.unblockedDieOrDoubleBlankOverloadBlocked, true);
  assert.equal(metalStampingGuard.clutchExhaustBrakeLockAndOverloadReliefBridged, true);

  const weldingRoboticGuard = evaluateWeldingRoboticLaserPhosgeneArgonVoiceGuard({
    zeroChlorinatedSolventAndCrViLevAirflowSafe: false,
    confinedSpaceO2LaserShutterAndWpsPreheatSafe: false,
    robotZoneBreachAcetyleneFlashbackOrO2Drop: true,
  });
  assert.equal(weldingRoboticGuard.arcIgnitionAndCellEntryAuthorized, false);
  assert.equal(weldingRoboticGuard.chlorinatedPhosgeneOrArgonLaserHazardBlocked, true);
  assert.equal(weldingRoboticGuard.robotStoLaserShutterAndGasShutoffBridged, true);

  const cncMachiningGuard = evaluateCncMachiningTitaniumMagnesiumB11VoiceGuard({
    nfpa484SwarfCoolantAndChipPanH2Safe: false,
    chuckDrawbarHskClampAndOffsetCapSafe: false,
    swarfFireOilMistOrSpindleCrashEmergency: true,
  });
  assert.equal(cncMachiningGuard.spindleStartAndOffsetWriteAuthorized, false);
  assert.equal(cncMachiningGuard.magnesiumWaterOrUnsafeChuckOffsetBlocked, true);
  assert.equal(cncMachiningGuard.spindleStoMistDamperAndClassDArgonSuppressionBridged, true);

  const additiveMfgGuard = evaluateAdditiveMfgLpbfPowderNfpa484VoiceGuard({
    argonInertO2EsdGroundAndFilterPassivatedSafe: false,
    alloyGenealogySieveCountAndRecoaterClearSafe: false,
    pyrophoricFilterExothermChamberFireOrArgonLeak: true,
  });
  assert.equal(additiveMfgGuard.laserFusionAndPowderTransferAuthorized, false);
  assert.equal(additiveMfgGuard.reactivePowderOrAlloyContaminationBlocked, true);
  assert.equal(additiveMfgGuard.laserStoFilterIsolationAndArgonFloodBridged, true);

  const aerospaceCompositeGuard = evaluateAerospaceCompositeAutoclaveExothermVoiceGuard({
    exothermDeltaTVacuumBagAndN2InertSafe: false,
    zeroBarDoorVesselO2AndPrepregFodSafe: false,
    exothermicRunawayBagRuptureOrVesselSmoke: true,
  });
  assert.equal(aerospaceCompositeGuard.cureRampDoorOpenAndPlyAdvanceAuthorized, false);
  assert.equal(aerospaceCompositeGuard.exothermVacuumLeakOrN2EntryHazardBlocked, true);
  assert.equal(aerospaceCompositeGuard.heaterCutoffFullChilledWaterAndBagVentBridged, true);

  const pcbSmtGuard = evaluatePcbSmtAssemblyReflowJstd033VoiceGuard({
    msdFloorLifePasteWarmupAndEsdSafe: false,
    reflowHoodO2WaveFluxLelAndXrayZeroKvSafe: false,
    waveFluxFireReflowBoardJamOrXrayBreach: true,
  });
  assert.equal(pcbSmtGuard.feederSpliceAndOvenHoodAuthorized, false);
  assert.equal(pcbSmtGuard.msdExpiredOrNitrogenFluxXrayHazardBlocked, true);
  assert.equal(pcbSmtGuard.wavePotDropCo2QuenchAndReflowEmergencyCoolBridged, true);

  const displaySolarGuard = evaluateDisplaySolarFabSilaneHfSemiVoiceGuard({
    silanePh3CyclePurge30xAndPouScrubberSafe: false,
    hfWetBenchSashExhaustAndCalciumGluconateSafe: false,
    pouScrubberTripSilaneLeakOrHfSplashEmergency: true,
  });
  assert.equal(displaySolarGuard.pecvdVentAndHfWetBenchAuthorized, false);
  assert.equal(displaySolarGuard.unpurgedSilaneOrHfWetBenchBlocked, true);
  assert.equal(displaySolarGuard.cylinderPigtailShutoffN2PurgeAndHfFirstAidBridged, true);

  const opticalFiberGuard = evaluateOpticalFiberPreformDrawingSicl4VoiceGuard({
    halideDewPointAndCausticScrubberPhSafe: false,
    graphiteFurnaceInertAndUvCapstanGuardSafe: false,
    cl2HclLeakFurnaceWaterLossOrHighSpeedFiberBreak: true,
  });
  assert.equal(opticalFiberGuard.halideFlowAndDrawRampAuthorized, false);
  assert.equal(opticalFiberGuard.sicl4HydrolysisOrHotFurnaceIrisBlocked, true);
  assert.equal(opticalFiberGuard.halideShutoffArgonHoldAndFiberAspiratorBridged, true);
});

test("deterministic enterprise guardrails enforce vertical industry safety (cohort 9)", () => {
  const hvCableGuard = evaluateHvCableXlpeCvFaradayIeee510VoiceGuard({
    cvTubeZeroPressureAndMethaneLelSafe: false,
    faradayCageZeroKvEarthSwitchAndStranderPinSafe: false,
    faradayBreachMethaneSpikeOrStranderWireBreak: true,
  });
  assert.equal(hvCableGuard.cvSpliceAndFaradayEntryAuthorized, false);
  assert.equal(hvCableGuard.pressurizedCvTubeOrUnbledHvCableBlocked, true);
  assert.equal(hvCableGuard.gravityCrowbarEarthStranderBrakeAndMethaneExhaustBridged, true);

  const powerTransformerGuard = evaluatePowerTransformerVpdMarxIeee510VoiceGuard({
    vpdVacuumLeakRateAndNitrogenBreakSafe: false,
    marxAllStagesShortedAndCoreSingleGroundSafe: false,
    vpdVacuumLossAirIngressOrMarxBreach: true,
  });
  assert.equal(powerTransformerGuard.vpdBreakAndTestBayEntryAuthorized, false);
  assert.equal(powerTransformerGuard.keroseneAirMixOrUnshortedMarxStageBlocked, true);
  assert.equal(powerTransformerGuard.evaporatorCutoffNitrogenBlanketAndMarxCrowbarBridged, true);

  const windBladeGuard = evaluateWindBladeVartmTurnoverNacelleVoiceGuard({
    vartmMixRatioVacuumDropAndRootExothermSafe: false,
    moldTurnover16PinsStyreneAndCarbonDustSafe: false,
    turnoverSkewExceededResinDrumRunawayOrRootEmergency: true,
  });
  assert.equal(windBladeGuard.resinInfusionAndMoldEntryAuthorized, false);
  assert.equal(windBladeGuard.offRatioInfusionOrUnpinnedMoldRootBlocked, true);
  assert.equal(windBladeGuard.counterbalanceHoldResinQuenchAndRootPurgeBridged, true);

  const shipbuildingGuard = evaluateShipbuildingDrydockGoliathCoatingVoiceGuard({
    tankSolventLel10PctAndSixAdjacentHotWorkSafe: false,
    goliathTandemCogWindAndSeaChestBlankedSafe: false,
    tankLelExceedanceO2DropOrGoliathWindOverload: true,
  });
  assert.equal(shipbuildingGuard.paintPumpAndBlockHoistAuthorized, false);
  assert.equal(shipbuildingGuard.adjacentHotWorkOrUnbalancedBlockLiftBlocked, true);
  assert.equal(shipbuildingGuard.paintAirCutoffWeldRackTripAndGoliathBrakeBridged, true);

  const railDepotGuard = evaluateRailRollingStockBogie25kvDepotVoiceGuard({
    catenaryEarthedZeroKvAndCastellKeySafe: false,
    wheelsetPressCurveUltrasonicAndPitClearSafe: false,
    jackSyncSkewExceededOrCatenaryBreach: true,
  });
  assert.equal(railDepotGuard.roofGateAndBogieReleaseAuthorized, false);
  assert.equal(railDepotGuard.unearthedCatenaryOrWheelPressPitBlocked, true);
  assert.equal(railDepotGuard.jackSafetyNutsLockedAnd25kvFeederTrippedBridged, true);

  const aircraftFalGuard = evaluateAircraftFalWingtankRiggingJackVoiceGuard({
    wingTankLel10PctVenturiAndStaticGroundSafe: false,
    hydraulicClearZoneHornAndRiiZeroFodSafe: false,
    clearZoneBreachJackSkewExceededOrTankVaporSpike: true,
  });
  assert.equal(aircraftFalGuard.tankEntryAndHydraulicPressurizationAuthorized, false);
  assert.equal(aircraftFalGuard.tankVaporOrUnclearFlightControlFodBlocked, true);
  assert.equal(aircraftFalGuard.hydraulicZeroPsiDumpJackLockAndGpuTripBridged, true);

  const aeroEngineGuard = evaluateAeroEngineTestcellMroNfpa409VoiceGuard({
    cellZeroOccupancyBlastDoorsAndFodScreenSafe: false,
    agbBarringToolStowedZeroRpmAndNozzleLelSafe: false,
    engineSurgeVibrationRedlineOrTitaniumFire: true,
  });
  assert.equal(aeroEngineGuard.starterAndBlastDoorAuthorized, false);
  assert.equal(aeroEngineGuard.inletHazardOrUnstowedBarringToolBlocked, true);
  assert.equal(aeroEngineGuard.guillotineFuelShutoffIgnitionKillAndFireBottleBridged, true);

  const lithiumBatteryGuard = evaluateLithiumBatteryGigafactoryNfpa855VoiceGuard({
    coatingOvenNmpLel20PctAndPpbIronFilterSafe: false,
    dryRoomDewPointMinus45cAndXrayOverhangSafe: false,
    formationCellThermalRunawayOrNmpOvenSpike: true,
  });
  assert.equal(lithiumBatteryGuard.coatingAndElectrolyteFillAuthorized, false);
  assert.equal(lithiumBatteryGuard.dryRoomMoistureOrMetallicBurrBlocked, true);
  assert.equal(lithiumBatteryGuard.formationPowerCutFireBoxAndQuenchTankBridged, true);

  const steelMillGuard = evaluateSteelMillBofCasterOsha1910VoiceGuard({
    bofLanceCoolingWaterZeroDeltaAndScrapDrySafe: false,
    blastFurnaceTrtCoGasAndHotMetalCranePathSafe: false,
    casterMoldBreakoutLanceWaterLeakOrCoGasSpike: true,
  });
  assert.equal(steelMillGuard.bofBlowAndCasterPourAuthorized, false);
  assert.equal(steelMillGuard.moltenWaterExplosionOrCoGasHazardBlocked, true);
  assert.equal(steelMillGuard.lanceAutoHoistVesselLockAndSlideGateShutoffBridged, true);

  const refineryTurnaroundGuard = evaluatePetrochemicalRefineryTurnaroundApi2217VoiceGuard({
    blindFlangeMasterLedger100PctAndZeroPressureSafe: false,
    pyrophoricIronSulfideKmnO4WetPassivationAndH2sSafe: false,
    h2sSourGasReleaseTowerExothermOrFlareHighLiquid: true,
  });
  assert.equal(refineryTurnaroundGuard.turnaroundEntryAndStartupAuthorized, false);
  assert.equal(refineryTurnaroundGuard.pyrophoricFeSOrSourGasExposureBlocked, true);
  assert.equal(refineryTurnaroundGuard.sisEmergencyDepressuringWaterSprayAndCrossWindEvacBridged, true);

  const nonferrousGuard = evaluateNonferrousSmeltingPotlineNfpa484VoiceGuard({
    dcCastingPitWaterLevelAndDryLaunderPreheatSafe: false,
    potline500kaSeriesEquipotentialAndSo2ArsineSafe: false,
    castingPitBleedOutPotlineBusbarShortOrWaterLeak: true,
  });
  assert.equal(nonferrousGuard.dcCastingAndSmeltingTapAuthorized, false);
  assert.equal(nonferrousGuard.moltenMetalWaterOrPotlineGasHazardBlocked, true);
  assert.equal(nonferrousGuard.furnaceTiltBackEmergencyDumpTroughAndPlatenStopBridged, true);

  const ccaasIvrGuard = evaluateCcaasIvrModernizationHandoffVoiceGuard({
    callerIdentityVerifiedAndContextPacketHydrated: false,
    regulatedDisclosureOrRefundWithinPolicyCap: false,
    vipEscalationRepeatedFrustrationOrComplianceRedFlag: true,
  });
  assert.equal(ccaasIvrGuard.selfServiceOrSeamlessWarmHandoffAuthorized, false);
  assert.equal(ccaasIvrGuard.blindTransferOrUnauthorizedRefundBlocked, true);
  assert.equal(ccaasIvrGuard.priorityHumanQueueAndWhisperBriefingBridged, true);

  const outboundTcoGuard = evaluateOutboundOrchestrationLivekitRetellTcoVoiceGuard({
    priorExpressConsentAndCallingWindowCompliant: false,
    speculativeAmdHumanGreetingAndCalendarSlotLocked: false,
    explicitOptOutRequestOrHighIntentCloserReady: true,
  });
  assert.equal(outboundTcoGuard.outboundDialAndAppointmentCommitAuthorized, false);
  assert.equal(outboundTcoGuard.complianceOrCalendarDoubleBookingBlocked, true);
  assert.equal(outboundTcoGuard.immediateDncOptOutOrWarmCloserHandoffBridged, true);

  const s2sVsCascadedGuard = evaluateS2sVsCascadedDeepseekFinopsRouterVoiceGuard({
    customLexiconPhraseListAndAlphanumericChecksumValid: false,
    slidingWindowAudioHistoryPrunedUnder3Turns: false,
    regulatedFinancialMedicalVerbatimDisclosureTriggered: true,
  });
  assert.equal(s2sVsCascadedGuard.s2sOrCascadedTurnExecutionAuthorized, false);
  assert.equal(s2sVsCascadedGuard.unverifiedEntityOrUnprunedAudioCostBlocked, true);
  assert.equal(s2sVsCascadedGuard.deterministicSsmlVerbatimSwitchAndDualRecordBridged, true);

  const globalHelpdeskRagGuard = evaluateGlobalItHrHelpdeskVoiceRagGuard({
    entraAuthenticatorPushVerifiedAndRbacScoped: false,
    speculativePartialRagHitAndZeroMarkdownSpokenCard: false,
    majorP1OutageStormOrConfidentialHrEthicsReport: true,
  });
  assert.equal(globalHelpdeskRagGuard.helpdeskActionAndSpokenRagAuthorized, false);
  assert.equal(globalHelpdeskRagGuard.vishingOrCrossRegionPolicyLeakBlocked, true);
  assert.equal(globalHelpdeskRagGuard.p1OutageDeflectionOrZeroRetentionHrBridgeTriggered, true);

  const realtimeSalesGuard = evaluateRealtimeSalesCopilotCrmWritebackVoiceGuard({
    dualChannelSpeakerSeparationAndRecordingConsentSafe: false,
    microBattlecardUnder3BulletsAndCrmEvidenceAnchored: false,
    unauthorizedDiscountPromiseOrCompetitorDefamationDetected: true,
  });
  assert.equal(realtimeSalesGuard.liveBattlecardAndCrmDraftAuthorized, false);
  assert.equal(realtimeSalesGuard.speakerConfusionOrUnanchoredCrmWriteBlocked, true);
  assert.equal(realtimeSalesGuard.complianceWarningBannerAndManagerWhisperBridged, true);

  const brandVoiceAvatarGuard = evaluateBrandVoiceCloningAvatarComplianceGuard({
    voiceTalentChallengePhraseConsentAndWatermarkValid: false,
    customLexiconIpaPolyphoneAndLipSyncDriftUnder45ms: false,
    prohibitedPoliticalMedicalClaimOrDeepfakeSpoofAttempt: true,
  });
  assert.equal(brandVoiceAvatarGuard.clonedVoiceAndAvatarStreamAuthorized, false);
  assert.equal(brandVoiceAvatarGuard.consentOrLipSyncDesyncBlocked, true);
  assert.equal(brandVoiceAvatarGuard.deepfakeSpoofCutAndSafeFallbackVoiceBridged, true);

  const duplexBargeinGuard = evaluateDuplexBargeinSemanticEotAsyncFillerGuard({
    semanticClauseCompleteAndBackchannelIgnored: false,
    nonPromissoryAsyncFillerAt700msAndTurnEpochMatched: false,
    echoFeedbackLoopOrToolTimeoutOver8Seconds: true,
  });
  assert.equal(duplexBargeinGuard.turnResponseAndToolCommitAuthorized, false);
  assert.equal(duplexBargeinGuard.prematureCutInOrStaleEpochWriteBlocked, true);
  assert.equal(duplexBargeinGuard.echoLoopBrokenAndAsyncSmsFallbackBridged, true);

  const meetingInterpGuard = evaluateEnterpriseMeetingInterpreterGlossaryGuard({
    sovVerbBufferPolarityAndNumericMagnitudeVerified: false,
    personalVoiceExplicitSpeakerOptInAndGlossaryInjected: false,
    unconfirmedActionItemCommitOrConfidentialBoardMode: true,
  });
  assert.equal(meetingInterpGuard.liveInterpretationAndActionSyncAuthorized, false);
  assert.equal(meetingInterpGuard.polarityNumericErrorOrUnconsentedVoiceBlocked, true);
  assert.equal(meetingInterpGuard.boardroomZeroRetentionAndHostReviewBridged, true);

  const aiRoleplayGuard = evaluateAiRoleplaySparringRubricEvalGuard({
    actorGraderSeparationAndObjectionStateMachineLocked: false,
    rubricScoreAnchoredToAudioTimestampAndAcousticNormalized: false,
    autoFailComplianceRedlineOrPromptJailbreakAttempt: true,
  });
  assert.equal(aiRoleplayGuard.sparringSessionAndCertificationAuthorized, false);
  assert.equal(aiRoleplayGuard.sycophancyOrUnanchoredScoreBlocked, true);
  assert.equal(aiRoleplayGuard.autoFailRedCardAndCoachingReplayBridged, true);

  const edgeCloudMultimodalGuard = evaluateEdgeCloudMultimodalWebrtcFallbackGuard({
    seatZoneDriverPermissionAndDrivingSafetyLocked: false,
    deicticKeyframeBurstUnder60kbAndPrivacyLedActive: false,
    tunnelNetworkDropOrCloudRttOver600ms: true,
  });
  assert.equal(edgeCloudMultimodalGuard.multimodalCloudOrDeviceActionAuthorized, false);
  assert.equal(edgeCloudMultimodalGuard.seatZoneOrPrivacyLedViolationBlocked, true);
  assert.equal(edgeCloudMultimodalGuard.onDeviceNpuOfflineFallbackBridged, true);

  const legacyPbxMigrationGuard = evaluateLegacyPbxCcaasAiVoiceMigrationGuard({
    frontDoorSipBypassAndZeroAudioHookSurchargeSafe: false,
    agentPresenceVerifiedAndCtiScreenPopSynchronized: false,
    aiGatewayHealthDegradedOrCanaryErrorRateExceeded: true,
  });
  assert.equal(legacyPbxMigrationGuard.frontDoorAiOrWarmPbxTransferAuthorized, false);
  assert.equal(legacyPbxMigrationGuard.hairpinSurchargeOrDeadExtensionTransferBlocked, true);
  assert.equal(legacyPbxMigrationGuard.sbcFailOpenLegacyAcdBypassBridged, true);

  const ecommerceWismoGuard = evaluateEcommerceWismoRmaSurgeVoiceGuard({
    aniOrderPreloadedAndExchangeInventoryReserved: false,
    returnFraudRiskScoreSafeAndRefundUnderAutoCap: false,
    promoSurge10xTrafficOrCarrierHubDelayDetected: true,
  });
  assert.equal(ecommerceWismoGuard.wismoAndExchangeOrderAuthorized, false);
  assert.equal(ecommerceWismoGuard.fraudOrStockUnavailableBlocked, true);
  assert.equal(ecommerceWismoGuard.multiRegionPaygoSpilloverAndDelayBroadcastBridged, true);

  const voiceOtelCanaryGuard = evaluateVoiceOtelSyntheticCicdCanaryGuard({
    syntheticAudioRegressionSuite100PctPassedAndRoundTripVerified: false,
    otelTurnWaterfallSpansCompleteAndShadowDryRunIsolated: false,
    canaryTtfaOver800msOrBargeInRegressionDetected: true,
  });
  assert.equal(voiceOtelCanaryGuard.canaryPromotionAndLiveTrafficAuthorized, false);
  assert.equal(voiceOtelCanaryGuard.untestedAudioOrShadowSideEffectBlocked, true);
  assert.equal(voiceOtelCanaryGuard.canaryAutoRollbackAndMemoryQuarantineBridged, true);

  const multiAgentSwarmGuard = evaluateMultiAgentVoiceSwarmHandoffGuard({
    prerequisiteAuthContractMetAndMinimalToolScopeLocked: false,
    silentSinglePersonaHandoffAndCompactedContextUnder150Tokens: false,
    agentPingPongLoopOver2HopsOrSupervisorEscalation: true,
  });
  assert.equal(multiAgentSwarmGuard.specialistHandoffAndToolExecutionAuthorized, false);
  assert.equal(multiAgentSwarmGuard.unauthenticatedHandoffOrContextBloatBlocked, true);
  assert.equal(multiAgentSwarmGuard.pingPongBreakerAndSupervisorEscalationBridged, true);

  const financialPciQaGuard = evaluateFinancialPciRedactionPostcallQaGuard({
    preDiskInMemoryPanCvvAudioBleepedAndDtmfMasked: false,
    dualTrackWormImmutableHashAndSpokenVsCrmReconciled: false,
    mandatoryRegulatoryDisclosureMissedOrPromiseMismatch: true,
  });
  assert.equal(financialPciQaGuard.wormArchiveAndQaSignoffAuthorized, false);
  assert.equal(financialPciQaGuard.unredactedPciDiskWriteOrUnreconciledPromiseBlocked, true);
  assert.equal(financialPciQaGuard.sixtySecondAutoCureAndSupervisorAlertBridged, true);

  const healthcareScribeGuard = evaluateHealthcareTriageAmbientScribeFhirGuard({
    multiSpeakerDoctorPatientRoleSeparatedAndPhysicianSignoffLocked: false,
    ismpLasaDrugIndicationDisambiguatedAndZeroDoseAdjustment: false,
    clinicalRedFlagChestPainStrokeOrSuicidalIdeationDetected: true,
  });
  assert.equal(healthcareScribeGuard.clinicalChartDraftAndFollowupAuthorized, false);
  assert.equal(healthcareScribeGuard.roleConfusionOrUnauthorizedDoseAdviceBlocked, true);
  assert.equal(healthcareScribeGuard.redFlagNursePreemptionAndErBridgeTriggered, true);

  const voiceOwaspFirewallGuard = evaluateVoiceOwaspSecurityIdorFirewallGuard({
    toolCustomerIdBoundToSessionTokenAndSchemaStripped: false,
    untrustedCrmNotesIsolatedAndTwoPhaseCommitConfirmed: false,
    acousticJailbreakDebugModeOrInternationalTollFraud: true,
  });
  assert.equal(voiceOwaspFirewallGuard.toolExecutionAndTransferAuthorized, false);
  assert.equal(voiceOwaspFirewallGuard.idorOrIndirectInjectionBlocked, true);
  assert.equal(voiceOwaspFirewallGuard.jailbreakTerminatedAndSocAlertBridged, true);

  const airlineHotelGuard = evaluateAirlineIrropsHotelPmsConciergeGuard({
    newFlightSeatHeldBeforeOldTicketReleasedAndWaiverValid: false,
    hotelStayIdCheckoutMemoryWipedAndCallerRoomVerified: false,
    typhoonIrrops50xSurgeOrUnaccompaniedMinorMedicalAlert: true,
  });
  assert.equal(airlineHotelGuard.rebookingAndRoomServiceAuthorized, false);
  assert.equal(airlineHotelGuard.seatLossOrGuestPrivacyLeakBlocked, true);
  assert.equal(airlineHotelGuard.surgeElasticSpilloverAndSpecialAssistanceBridged, true);

  const openSourceGpuGuard = evaluateSelfHostedOpensourceGpuVsCloudTcoGuard({
    whisperSilenceHallucinationGatedByVadAndApache2LicenseValid: false,
    gpuKvCacheUtilizationUnder80PctAndDynamicBatchingEnabled: false,
    gpuPoolSaturatedOrP95TtfaOver650msCloudSpillover: true,
  });
  assert.equal(openSourceGpuGuard.localGpuInferenceAuthorized, false);
  assert.equal(openSourceGpuGuard.hallucinationLicenseOrVramOverloadBlocked, true);
  assert.equal(openSourceGpuGuard.cloudApiBurstSpilloverBridged, true);

  const ptuFinopsGuard = evaluateVoiceCapacityPtuCachingFinopsGuard({
    staticPromptPrefixAlignedAndTtsPhraseCacheHit: false,
    basePtuUtilizationUnder85PctAndPerCallBudgetSafe: false,
    ptuSaturationOrHttp429SpilloverToPaygoCascade: true,
  });
  assert.equal(ptuFinopsGuard.primaryPtuAndCachedExecutionAuthorized, false);
  assert.equal(ptuFinopsGuard.cacheBustingOrWalletOverrunBlocked, true);
  assert.equal(ptuFinopsGuard.apimMultiRegionPaygoSpilloverBridged, true);
});
