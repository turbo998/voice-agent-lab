# Voice Agent Lab · 企业级实时语音智能体售前方案、竞对分析与全栈实验室

> 🌐 **语言切换 / Language**: **中文 (Chinese)** | **[English (`README.en.md`)](./README.en.md)** · **[English Architecture (`docs/solution-architecture.en.md`)](./docs/solution-architecture.en.md)** · **[English Battlecards (`docs/competitive-analysis.en.md`)](./docs/competitive-analysis.en.md)** · **[English Playbook (`docs/presales-playbook.en.md`)](./docs/presales-playbook.en.md)** · **[English Scenarios (`docs/business-scenarios.en.md`)](./docs/business-scenarios.en.md)**

[![GitHub Pages Presales Portal](https://img.shields.io/badge/GitHub%20Pages-H5%20Presales%20%26%20Sandbox%20Portal-2563EB?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/)
[![Azure Executive Slide Deck](https://img.shields.io/badge/Slide%20Deck-12--Slide%20Azure%20Briefing-0078D4?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/deck.html)
[![7-Card 4:5 Benchmark Report](https://img.shields.io/badge/Benchmark-7--Card%204%3A5%20Visual%20Deck-10B981?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html)
[![Live Azure S2S Companion](https://img.shields.io/badge/Azure%20Voice%20Live-gpt--live--1%20Demo-8B5CF6?style=for-the-badge)](https://gpt-live-demo-0922-qc.azurewebsites.net/)

本仓库整合了**面向合作伙伴与政企/出海客户的实时语音智能体 (Voice Agent) 售前方案库、深度竞对打单卡、多引擎交互 H5 沙盒、12 页 Azure 高管演示幻灯片**，以及合成硬件品牌 **LumaNest** 的全栈参考实现（Retell AI + Azure AI Foundry + 双语坐席审批工作台）。

## 🌐 在线演示门户与核心售前资产 (Presales & Engineering Hub)

| 资产模块 | 在线访问 / 仓库路径 | 核心内容说明 |
|---|---|---|
| **H5 售前方案与多引擎交互总门户** | [**`https://turbo998.github.io/voice-agent-lab/`**](https://turbo998.github.io/voice-agent-lab/) (`site/index.html`) | 支持**简/繁/英三语完整切换**；涵盖 **20 大高 ROI 场景 (S1–S20)**（含车载 eCall、航旅 PCI 门控、政务 12345 燃气应急、跨境物流 AMD 外呼、游戏语音 NPC 护栏、工业 85dB LOTO 高压门禁、**跨国银行财富管理双录质检 `WM-DUAL-01`**、**连锁酒店多语种礼宾/PMS 改单 `HOSP-PMS-01`**、**跨国航空 IRROPS 航延与行李索赔 `AIR-IRROPS-01`**、**高端制造 PLC 免提排障与备件调拨 `IND-FIELD-01`**、**跨国电信 eSIM 防劫持与基站风暴分流 `TELCO-ESIM-01`**、**跨境冷链海运关务与电放提单门禁 `LOG-COLD-01`**、**智能电网停电风暴与合闸安全联锁 `GRID-STORM-01`**、**药企三期临床随访与 SAE 药物警戒 `PHARMA-PV-01`**、**金融云 NOC Sev-1 战情室与变更冻结门禁 `CLOUD-NOC-01`** 及 **L4 自动驾驶远程安全员与 AEB 安全联锁 `AUTO-TELEOP-01`**）、4 套参考架构蓝图、交互式选型决策器（支持**一键导出客户定制架构与 BOM 方案书**）、7 组竞对打单表与平滑迁移路线图、**Web Audio 多引擎实时语音沙盒（含 134 项 POC 照妖镜探针实验室）** 及 **FinOps TCO + PTU/PAYGO 弹性容量测算器** |
| **Azure 风格高管演示幻灯片 (12 Slides)** | [**`https://turbo998.github.io/voice-agent-lab/deck.html`**](https://turbo998.github.io/voice-agent-lab/deck.html) (`site/deck.html`) | 遵循 `azure-style-presentation` 规范：16:9 零依赖单文件 HTML 演示文稿，涵盖市场拐点、二十大行业场景、四大架构与 `turnEpoch` 投机取消、Sierra/Retell/ElevenLabs/AWS Nova Sonic 攻防卡、Speech 容器与 2 周 POC 路线图（支持键盘翻页与 PDF 打印） |
| **7-Card (4:5) 模型基准评测报告** | [**`https://turbo998.github.io/voice-agent-lab/benchmark-cards.html`**](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html) (`site/benchmark-cards.html`) | 遵循 7-Card 4:5 竖版评测规范：基于 Azure East US 2 实测 (`gpt-4.1-mini` / `gpt-4.1` / `gpt-5.4-mini` / `gpt-live-1`) 与确定性护栏数据 (`site/data/voice-agent-benchmark-report.json`) |
| **售前实战打单手册与 POC 交付指南** | [`docs/presales-playbook.md`](docs/presales-playbook.md) · [`EN`](docs/presales-playbook.en.md) | 首轮客户 5 维 Discovery 问卷、三大竞对设伏提问、15 分钟现场演示脚本、2 周 POC 验收标准、**134 大现场照妖镜探针 (`A01–P116`)** 与存量竞品两阶段替换剧本 |
| **业务场景与 ROI 白皮书** | [`docs/business-scenarios.md`](docs/business-scenarios.md) · [`EN`](docs/business-scenarios.en.md) | 深度拆解智能硬件出海售后、快餐 Drive-Thru 点餐、金融车险报案 (FNOL)、医疗/IT 服务台、**车企智能座舱与 eCall 救援**、**航旅退改签与 PCI 语音支付**、**政务 12345 热线与燃气应急**、**跨境物流异常改约与 AMD 外呼**、**游戏实时语音 NPC 与未成年/充值护栏**、**工业能源免提巡检与 LOTO 高压互锁**、**银行财富管理双录质检 (`WM-DUAL-01`)**、**连锁酒店多语种 PMS 礼宾 (`HOSP-PMS-01`)**、**跨国航空 IRROPS 航延索赔 (`AIR-IRROPS-01`)**、**高端制造 PLC 排障 (`IND-FIELD-01`)**、**电信 eSIM 防劫持 (`TELCO-ESIM-01`)**、**跨境冷链电放提单门禁 (`LOG-COLD-01`)**、**智能电网停电风暴与合闸互锁 (`GRID-STORM-01`)**、**药企三期临床随访与 SAE 药物警戒 (`PHARMA-PV-01`)**、**金融云 NOC 战情室 (`CLOUD-NOC-01`)** 与 **L4 自动驾驶远程安全员 (`AUTO-TELEOP-01`)** 20 大场景痛点与 TCO 收益模型 |
| **四范式方案架构与电信网关联接指南** | [`docs/solution-architecture.md`](docs/solution-architecture.md) · [`EN`](docs/solution-architecture.en.md) | 对比 **Paradigm A (`gpt-live-1` S2S)**、**Paradigm B (Constellation 级联路由)**、**Paradigm C (Retell + Foundry)**、**Paradigm D (本地容器)**，并附 **PSTN/SIP ↔ ACS 时序图、G.711 vs Opus 1%–10% 弱网丢包抗损曲线、RFC 4733 DTMF、AMD 外呼状态机、多智能体交接协议、极端噪音 DSP 流水线、PTU+PAYGO 弹性溢出架构、全双工 Barge-in 投机取消状态机 (`turnEpoch`)、实时防深伪双因子防线 (`S08-DEEPFAKE-GUARD`)、多人同场声纹绑定工具授权 (`S09-SPEAKER-ROLE-AUTH`)、外呼 TCPA 宵禁/`<200ms` DNC 退订及 C2PA 声学水印溯源 (`S11-TCPA-CONSENT-GUARD`)、端云协同降级及主权数据驻留跨境熔断 (`S14-SOVEREIGN-EDGE-GUARD`)、`<2ms` 三层零信任统一护栏流水线 (`P08-UNIFIED-ZERO-TRUST-PIPELINE`)、音频滑动窗口裁剪 (`P07-FINOPS-ERLANG-PLANNER`)、RFC 5589 双腿热转接耳语 (`P09-WARM-HANDOFF-WHISPER`)、100 分事后全量质检 (`P10-POSTCALL-QA-RUBRIC`)、PCI-DSS v4.0 媒体面旁路脱敏 (`P11-PCI-DTMF-MEDIA-BYPASS`)、金丝雀 `<500ms` 自动回滚 (`P12-CANARY-SHADOW-ROLLOUT-GATE`)、多模态同屏防视觉注入 (`P13-MULTIMODAL-COBROWSING-GROUNDING`)、EAA/ADA 无障碍自适应端点检测 (`P14-ACCESSIBILITY-DISFLUENCY-ADAPTIVE`)、通话中途 `<300ms` 零掉线热备切换 (`P15-MULTIPROVIDER-S2S-FAILOVER`)、`15 vs 50` / `B vs P` 北约字母逐位复诵校验 (`P16-NUMERIC-ENTITY-READBACK-VERIFIER`)、多智能体蜂群防死循环 (`P17-MULTI-AGENT-SWARM-LOOP-GUARD`)、声学情绪降级禁推销 (`P18-ACOUSTIC-EMOTION-DEESCALATION`)、慢速异步工具防未落库抢跑承诺 (`P19-ASYNC-TOOL-CALLBACK-PACING`)、跨通话记忆防投毒 (`P20-VOICE-MEMORY-POISONING-GUARD`)、下游 API 熔断降级防雪崩 (`P21-TOOL-CIRCUIT-BREAKER-DEGRADATION`)、多音字/SSML 防注入护栏 (`P22-PROSODY-SSML-PRONUNCIATION-GUARD`)、WebRTC Opus 丢包抖动钳位 (`P23-WEBRTC-OPUS-PLC-JITTER-ADAPTATION`)、中英粤混说热词消歧 (`P24-MULTILINGUAL-CODESWITCH-ASR-STABILITY`)、智能外呼 DNC/宵禁/AMD 防泄密 (`P25-OUTBOUND-TCPA-DNC-AMD-GUARD`)、脆弱人群关怀专线 (`P26-EMOTIONAL-DISTRESS-VULNERABLE-CALLER-GUARD`)、车载/柜台远场多麦波束防串音 (`P27-FARFIELD-BEAMFORMING-CROSSTALK-GUARD`)、ITU-T G.107 实时 MOS-LQO 双通道降级护栏 (`P28-REALTIME-MOS-LQO-CODEC-FALLBACK-GUARD`)、SIP/WebRTC DTLS-SRTP 媒体防重放绑定 (`P29-SIP-WEBRTC-ANTI-REPLAY-MEDIA-BINDING`)、话后口头承诺对账护栏 (`P30-POSTCALL-PROMISE-VS-TICKET-AUDIT-GUARD`)、车规级 eCall 碰撞 0ms 抢占 (`P31-AUTOMOTIVE-ECALL-CRASH-PREEMPTION-GUARD`)、座舱四音区权限隔离 (`P32-CABIN-MULTIZONE-PRIVILEGE-ISOLATION-GUARD`)、医疗临床红旗症状 0ms 急诊强转 (`P33-CLINICAL-REDFLAG-ESCALATION-GUARD`)、主权声纹 CMK 加密粉碎 (`P34-SOVEREIGN-VOICEPRINT-CRYPTO-SHREDDING-GUARD`)、跨境汇款制裁反通风报信与反电诈止付 (`P35-AML-SANCTIONS-SCAM-COERCION-GUARD`)、实时双语同传极性/量级保真 (`P36-REALTIME-INTERPRETER-FIDELITY-GUARD`)、夜间 SIP 群呼风暴/盗号提现拦截 (`P37-NOCTURNAL-RINGBURST-ANOMALY-GUARD`)、提示词金丝雀防套取/S2S 钱包防耗尽 (`P38-PROMPT-EXFILTRATION-DENIAL-OF-WALLET-GUARD`)、语义句法防抢话与 C2PA/声学双水印溯源 (`P39-SEMANTIC-TURN-TAKING-WATERMARK-PROVENANCE-GUARD`)、MCP 工具间接注入隔离及多步事务 Saga 逆向补偿 (`P40-MCP-INDIRECT-INJECTION-SAGA-COMPENSATION-GUARD`)、运营商 STIR/SHAKEN 防改号与伴音按键防注入 (`P41-CARRIER-STIR-SHAKEN-ANI-ATTESTATION-GUARD`)、RFC 7866 SIPREC 双录分流连续性及实时字幕 DLP 脱敏 (`P42-SIPREC-COMPLIANCE-FORK-DLP-REDACTION-GUARD`)、对公财资四眼原则（Maker-Checker）双人复核 (`P43-MAKER-CHECKER-DUAL-AUTH-TREASURY-GUARD`)、免提扬声器声学回声环路自打断抑制 (`P44-ACOUSTIC-AEC-ECHO-LOOPBACK-SELF-BARGEIN-GUARD`)、入站 AI 语音爬虫蜜罐护栏 (`P45-SYNTHETIC-CALLER-BOT-SCRAPER-HONEYPOT-GUARD`)、险情 E911/112 游牧位置 (`PIDF-LO`) 应急桥接 (`P46-E911-PIDFLO-NOMADIC-LOCATION-PSAP-BRIDGE-GUARD`)、律师交涉/监管申诉禁认责和解与 7 年 WORM 诉讼保全 (`P47-LEGAL-PRIVILEGE-LITIGATION-HOLD-WORM-GUARD`)、企业内网 CGNAT/UDP 封禁下 WebRTC `TURNS` TLS 443 穿透防 SSRF (`P48-WEBRTC-ICE-TURN-TLS443-SSRF-CGNAT-GUARD`)、零知识声纹支付与欧盟 PSD3 动态密码学绑定 (`P49-ZERO-KNOWLEDGE-VOICE-PAY-FIDO2-MANDATE-GUARD`)、多车连环碰撞/危化品卫星 SOS 创伤通道锁止 (`P50-MULTI-VEHICLE-PILEUP-HAZMAT-EDAS-DISPATCH-GUARD`)、多方电话会议零信任最小权限自动降级 (`P51-FEDERATED-MULTIPARTY-CONFERENCE-PRIVILEGE-DROP-GUARD`)、边缘 SBC/HSM `NIST FF1` 保格式令牌化零明文上云 (`P52-EDGE-HSM-TOKENIZATION-ZERO-PLAINTEXT-CLOUD-GUARD`)、广域网断网本地 Speech Container `<=400ms` 逃生 (`P53-AIRBROKEN-SOVEREIGN-SPEECH-CONTAINER-FAILOVER-GUARD`)、抗量子混合密钥协商（`NIST FIPS 203 ML-KEM-768`）双录封存 (`P54-PQC-HYBRID-TLS-KEM-MEDIA-ESCROW-GUARD`)、WebRTC TWCC 弱网音画抢带剥离 (`P55-WEBRTC-SIMULCAST-BWE-CONGESTION-GUARD`)、欧盟 AI 法案（`EU AI Act Art. 5 / Art. 50`）职场情绪识别禁令 (`P56-EU-AI-ACT-EMOTION-BIOMETRIC-PROHIBITION-GUARD`)、3GPP IMS 紧急呼叫 (`urn:service:sos`) QCI-1 抢占 (`P57-3GPP-TS23167-IMS-EMERGENCY-QCI1-SOS-PRIORITY-GUARD`)、跨端（语音+App）CAS 乐观并发防重扣 (`P58-CROSS-CHANNEL-CART-CAS-OCC-CONCURRENCY-GUARD`)、超声波 (`>16kHz` DolphinAttack) 抗注入滤波 (`P59-ULTRASONIC-SUBLIMINAL-ACOUSTIC-INJECTION-FILTER-GUARD`)、金融交易台 MiFID II 录音专线及风险揭示禁倍速快放 (`P60-MIFID2-DODDFRANK-RECORDED-LINE-DISCLAIMER-CADENCE-GUARD`)、SIP `183 Early Media` 应答前防抢跑泄密与摘机首字防吞字 (`P61-SIP-EARLY-MEDIA-183-CLIPPING-AND-PRE-ANSWER-BLEED-GUARD`)、TTS 同形异音与货币符号 (`¥`/`$`) 量纲消歧 (`P62-TTS-HOMOGRAPH-CURRENCY-UNIT-DISAMBIGUATION-GUARD`)、医疗 HIPAA 最小必要与家属 POA 代查门禁 (`P63-HIPAA-MINIMUM-NECESSARY-CAREGIVER-POA-GUARD`)、RFC 4028 SIP 会话刷新与半开 RTP 僵尸会话回收 (`P64-SIP-SESSION-TIMER-HALF-OPEN-RTP-ZOMBIE-REAPER-GUARD`)、金融公平信贷 ECOA 声学口音偏见剥离 (`P65-ECOA-FAIR-LENDING-ACCENT-PROTECTED-CLASS-GUARD`)、跨国主权云多活容灾区域围栏 (`P66-SOVEREIGN-DR-ACTIVE-ACTIVE-JURISDICTION-FENCE-GUARD`)、911/急救断线回拨 0ms 穿透商业 IVR 直连事故桥 (`P67-EMERGENCY-PSAP-CALLBACK-BYPASS-IVR-BRIDGE-GUARD`)、PCI-DSS `SAQ-A` 大模型零持卡人数据域隔离 (`P68-PCI-SAQ-A-LLM-ZERO-CARDHOLDER-SCOPE-ISOLATION-GUARD`)、未成年人 COPPA/GDPR-K 声纹零留存门禁 (`P69-COPPA-AADC-MINOR-VOICEPRINT-PURCHASE-CONSENT-GUARD`)、跨洲 SIP/RTP 发卡弯绕行本地边缘 SBC 锚定 (`P70-MULTI-REGION-SIP-RTP-HAIRPIN-LATENCY-ANCHOR-GUARD`)、金融催收 FDCPA/CFPB Reg F 7-in-7 与异议即刻停催 (`P71-FDCPA-REG-F-MINI-MIRANDA-7IN7-CEASE-GUARD`)、多租户 ASR 热词图谱物理隔离 (`P72-ASR-HOTWORD-LEXICON-TENANT-ISOLATION-POISONING-GUARD`)、远程医疗 DEA EPCS 管制药品续方与 PDMP 核查 (`P73-TELEHEALTH-DEA-EPCS-CONTROLLED-SUBSTANCE-REFILL-GUARD`)、WebRTC mDNS (`RFC 8828`) 内网拓扑防泄露与 SDP 净化 (`P74-WEBRTC-MDNS-LOCAL-IP-LEAK-AND-SDP-CANDIDATE-SANITIZER-GUARD`)、航空签派 ICAO 复诵/听诵闭环及 NOTAM 时效核验 (`P75-AVIATION-ATFM-NOTAM-RUNWAY-READBACK-HEARBACK-GUARD`)、声纹生物识别 Illinois BIPA / Texas CUBI 书面授权与 3 年销毁 (`P76-VOICE-BIOMETRIC-BIPA-WRITTEN-CONSENT-AND-RETENTION-GUARD`)、公用事业水电气寒潮禁令与医疗维生设备防远程拉闸 (`P77-UTILITY-WINTER-MORATORIUM-LIFE-SUPPORT-SHUTOFF-GUARD`)、RTP 抖动缓冲欠载/ASRC 时钟漂移重采样及 RFC 3389 舒适噪音 (`P78-RTP-JITTER-BUFFER-UNDERRUN-CLOCK-DRIFT-RESYNC-GUARD`)、海事港口 SOLAS GMDSS / VHF Ch16 遇险抢占与 IMO SMCP 标准航海复诵 (`P79-MARITIME-SOLAS-MAYDAY-VHF-CH16-GMDSS-PREEMPTION-GUARD`)、原生 S2S 情绪传染咆哮镜像抑制与响度/语速稳定 (`P80-TTS-PROSODY-EMOTIONAL-CONTAGION-AND-CADENCE-STABILITY-GUARD`)、车险/财险 FNOL 理赔时间轴对账与禁伪科学声学测谎拒赔 (`P81-INSURANCE-FNOL-TIMELINE-CONSISTENCY-AND-COACHING-GUARD`)、弱网突发连续丢包防 PLC 音素脑补幻觉与 RFC 4585 NACK 重传 (`P82-PACKET-LOSS-BURST-ASR-HALLUCINATION-AND-NACK-FEC-GUARD`)、跨境物流海关 HS 编码防逃税/Section 321 防拆单与 OFAC/BIS 制裁筛查 (`P83-CUSTOMS-TARIFF-HS-CODE-EVASION-AND-OFAC-SANCTIONS-SCREENING-GUARD`)、PSTN-to-VoLTE G.711 窄带 3.4kHz 截断摩擦音 (`S/F`) 北约字母解释法复诵及 TrFO 直通 (`P84-PSTN-AMR-WB-G711-TRANSCODING-TANDEM-FREE-AND-FRICATIVE-GAIN-GUARD`)、欧盟 Omnibus 指令 30 天最低价锚点核验/促销防折上折与恶意拒付拦截 (`P85-OMNIBUS-PRICE-TRANSPARENCY-PROMO-ABUSE-AND-CHARGEBACK-GUARD`)、车载/TWS 蓝牙 HFP/SCO 路由切换爆音屏蔽及 CVSD 8kHz 窄带重校准 (`P86-BLUETOOTH-HFP-SCO-HANDOVER-GLITCH-AND-CODEC-RENEGOTIATION-GUARD`)、航空 DOT 24 小时原路现金退票/停机坪延误及 ACAA 电动轮椅 CRO 强制升级 (`P87-AVIATION-DOT-24HR-TARMAC-DELAY-AND-WHEELCHAIR-ASSISTANCE-GUARD`)、WebRTC Opus DTX 稀疏帧 VAD 挂起死锁解除及 80ms 唤醒预卷 (`P88-WEBRTC-OPUS-DTX-COMFORT-NOISE-VAD-DEADLOCK-AND-TURN-KEEPALIVE-GUARD`)、医药 GxP / FDA `21 CFR 314.80` 药物警戒 MedWatch 四要素强制采集与 FDCA 超适应症推广拦截 (`P89-PHARMA-GXP-FDA-21CFR31480-ADVERSE-EVENT-MEDWATCH-AND-OFF-LABEL-PROMOTION-GUARD`)、长通话 RTP/SRTP `RFC 3711` 16-bit 序列号回绕 (`ROC`) 鉴权失步试探重同步及 `DTLS-SRTP MKI` 零中断换钥 (`P90-RTP-SRTP-RFC3711-ROC-ROLLOVER-DESYNC-AND-DTLS-SRTP-MKI-REKEY-GUARD`)、零售银行 CFPB `Regulation E (12 CFR § 1005)` 非授权电子转账口头争议即刻受理、`$0/$50/$500` 法定责任阶梯钳位与 10 个工作日临时信用垫付 (`P91-BANKING-REG-E-12CFR1005-UNAUTHORIZED-EFT-PROVISIONAL-CREDIT-AND-LIABILITY-TIER-GUARD`)、多人同场/三方会议重叠语音说话人分离（Speaker Diarization）串扰防污染及非主叫旁听者越权交易隔离 (`P92-MULTIPARTY-CONFERENCE-SPEAKER-DIARIZATION-CROSS-TALK-ATTRIBUTION-AND-ROLE-ISOLATION-GUARD`)、证券经纪 SEC `Reg BI (17 CFR § 240.15l-1)` / `FINRA Rule 2111` 招揽适当性核验、3 倍杠杆/反向 ETF 散户锁止与高频换手率防炒单 (`P93-SECURITIES-FINRA-RULE3240-SUITABILITY-BEST-INTEREST-REG-BI-CHURNING-AND-LEVERAGED-ETF-GUARD`)、SIP/SDP `RFC 3264` 动态负载类型（`telephone-event` PT）对称锁止、采样时钟核验及 `ptime/maxptime` 分包防溢出 (`P94-SIP-SDP-RFC3264-CODEC-PAYLOAD-TYPE-MISMATCH-TELEPHONE-EVENT-ASYMMETRY-AND-PTIME-BUFFER-OVERFLOW-GUARD`)、医保/商业医疗险 CMS `Medicare Advantage & Part D (42 CFR § 423.568 / § 423.570)` 处方药事先授权（PA）24h/72h 加急申诉分流、阶梯疗法（Step Therapy）连续用药豁免及禁 AI 全自动拒保护栏 (`P95-HEALTHCARE-CMS-MEDICARE-PART-D-PRIOR-AUTHORIZATION-APPEAL-EXPEDITED-72HR-AND-STEP-THERAPY-OVERRIDE-GUARD`)、WebRTC 多流数字人（3D/2D Avatar）音画唇形同步偏差（`ITU-R BT.1359-1` Lip-Sync Skew）、`RTCP SR (RFC 3550)` NTP 时钟漂移重锚及视频卡顿自动降级纯音频护栏 (`P96-WEBRTC-RTP-MULTI-STREAM-LIPSYNC-AV-SKEW-ITU-R-BT1359-RTCP-SR-NTP-WALLCLOCK-DRIFT-GUARD`)、电信运营商 FCC `CPNI (47 CFR § 64.2010)` 通话详单（CDR）口头披露密码门禁、SIM-Swap/携号转网（Port-Out）高危欺诈锁止及带外原机通知护栏 (`P97-TELECOM-FCC-CPNI-47CFR642010-SIM-SWAP-PORT-OUT-FRAUD-AND-CDR-DISCLOSURE-AUTH-GUARD`)、WebRTC `AEC3` 非线性残余声学回声（ERLE）双讲误打断（Self-Barge-In）抑制与播放-采集时钟漂移重校准护栏 (`P98-WEBRTC-AEC3-NONLINEAR-RESIDUAL-ECHO-DOUBLE-TALK-FALSE-BARGE-IN-AND-DELAY-DRIFT-GUARD`)、智能网联汽车 UNECE R155/R156 与 ISO 26262（ASIL-B/D）车载 CAN 总线行车安全锁止、音区童锁防越权与 EN 15722 eCall 碰撞 0ms 抢占护栏 (`P99-AUTOMOTIVE-UNECE-R155-ISO26262-CAN-BUS-SAFETY-LOCK-SPEED-DISTRACTION-AND-ECALL-EN15722-GUARD`)、多模态屏幕共享/同屏协办（Co-Browsing）视觉提示词注入（OCR/隐藏 CSS）、敏感 DOM 字段客户端脱敏与跨模态视口失步防误触护栏 (`P100-MULTIMODAL-COBROWSING-VISUAL-PROMPT-INJECTION-DOM-MASKING-AND-VIEWPORT-SYNC-GUARD`)、政务 311/12345 与医疗 988 心理危机（自杀/自残/家暴干预）零幻觉锁止、受控热转接（Warm Handoff）防盲转掉线与强制隔离上报护栏 (`P101-GOVERNMENT-311-988-CRISIS-SUICIDE-TRIAGE-ZERO-HALLUCINATION-WARM-HANDOFF-AND-MANDATORY-REPORTING-GUARD`)、实时语音工具调用（Tool Call）微服务熔断降级（Circuit Breaker）、P95 对冲读（Hedged Read）与写操作幂等键/Deadline 传播护栏 (`P102-REALTIME-TOOL-CALL-CIRCUIT-BREAKER-HEDGED-FALLBACK-IDEMPOTENCY-KEY-AND-DEADLINE-PROPAGATION-GUARD`)、综合度假村与博彩 VIP 礼宾 FinCEN Title 31 (`31 CFR § 1021`) 现金累计/结构化拆单反洗钱、反通风报信及自我禁入责任博彩拦截护栏 (`P103-HOSPITALITY-GAMING-AML-TITLE31-FINCEN-CTR-SAR-ANTI-STRUCTURING-AND-RESPONSIBLE-GAMING-SELF-EXCLUSION-GUARD`)、WebRTC `RFC 8656` TURN 中继配额防放大攻击（Amplification DoS）、短期 HMAC 凭证及内网子网 (`ChannelBind`) 防越权护栏 (`P104-WEBRTC-TURN-ALLOCATION-QUOTA-AMPLIFICATION-DOS-AND-RFC8656-CHANNELBIND-PRIVATE-SUBNET-GUARD`)、商业财险/车队险代位求偿物证保全（Anti-Spoliation Hold）、禁越权口头认责/承保承诺与保单限额保密护栏 (`P105-COMMERCIAL-INSURANCE-SUBROGATION-SPOLIATION-PRESERVATION-HOLD-AND-UNAUTHORIZED-LIABILITY-ADMISSION-GUARD`)、企业级 SBC SIP/RTP 对称锁存防劫持（Anti-RTP-Bleed）、UDP 端口池耗尽防御与 `RFC 5761 rtcp-mux` 强制复用护栏 (`P106-SIP-RTP-PORT-EXHAUSTION-SYMMETRIC-LATCHING-NAT-REBIND-PINHOLE-HIJACK-AND-RTCP-MUX-GUARD`)、国防军工与航空航天 ITAR (`22 CFR § 120.50`) / EAR (`15 CFR § 734.13`) 视同出口（Deemed Export）国籍门禁、CMMC 2.0 Level 2 主权云飞地与精密图纸公差消音护栏 (`P107-DEFENSE-ITAR-EAR-DEEMED-EXPORT-CITIZENSHIP-GATE-AND-CMMC-L2-CUI-SOVEREIGN-ENCLAVE-GUARD`)、SIP/WebRTC `Re-INVITE` 编解码器高频重协商风暴（DSP 转码 CPU 放大 DoS）防御及 `RFC 3389` 舒适噪音伪造能量锁死 VAD 护栏 (`P108-SIP-WEBRTC-SDP-REINVITE-CODEC-CHURN-TRANSCODING-AMPLIFICATION-DOS-AND-RFC3389-CN-VAD-GUARD`)、商业房贷与按揭贷款 CFPB `RESPA / TRID (12 CFR § 1026.19)` / `TILA Reg Z (§ 1026.24)` 利率触发词强制 APR 披露、3 个工作日 CD 重披露等待期、锁利到期禁越权与反回扣导流护栏 (`P109-MORTGAGE-RESPA-TRID-REG-Z-APR-TRIGGER-TERM-LOCK-EXPIRY-AND-KICKBACK-STEERING-GUARD`)、WebRTC `RFC 8831` `SCTP DataChannel` 实时字幕背压防溢出、队头阻塞（HoL Blocking）解耦与 `DTLS-SCTP` 僵尸流心跳自愈护栏 (`P110-WEBRTC-SCTP-DATACHANNEL-TRANSCRIPT-BACKPRESSURE-HEAD-OF-LINE-STALL-AND-HEARTBEAT-WATCHDOG-GUARD`)、临床试验药物警戒 FDA `21 CFR Part 11` / `ICH E6(R3) GCP` 严重不良事件（SAE）24 小时加急上报、双盲试验（IRT/IWRS）防破盲锁止与 ePRO 电子签名护栏 (`P111-CLINICAL-TRIAL-FDA-21CFR11-ICH-E6-SAE-24H-EXPEDITED-REPORTING-AND-DOUBLE-BLIND-UNBLINDING-GUARD`)、WebRTC `RFC 7675` ICE 同意保活（Consent Freshness）超时断流、僵尸 TURN 中继端口主动回收（`Refresh Lifetime=0`）与 STUN 洪泛限流护栏 (`P112-WEBRTC-RFC7675-ICE-CONSENT-FRESHNESS-ZOMBIE-TURN-REAPER-AND-STUN-FLOOD-GUARD`)、企业人力资源与道德吹哨热线 `NLRA Section 7 (29 U.S.C. § 157)` 受保护协同活动防打压、OSHA `11(c)` / `SOX Section 806` 吹哨人零知识匿名保护与反报复拦截护栏 (`P113-LABOR-CONCERTED-ACTIVITY-NLRA-SECTION7-WHISTLEBLOWER-OSHA-RETALIATION-AND-SURVEILLANCE-GUARD`)、SIP `RFC 3261` `Max-Forwards` / `Via` 环路与螺旋风暴检测、并行分叉（Parallel Forking）多路 `200 OK` 撞车清理（`RFC 3326`）及 `Re-INVITE 491 Request Pending` 随机退避护栏 (`P114-SIP-RFC3261-LOOP-MAX-FORWARDS-SPIRAL-DETECTION-AND-FORKING-GLARE-CANCEL-GUARD`)、石化危化品泄漏 EPA `CERCLA / EPCRA Section 304` 超报告量（RQ）15 分钟 NRC/LEPC 法定强制上报、OSHA `HazCom SDS` 禁水爆燃校验与下风向毒气羽流避难升级护栏 (`P115-ENVIRONMENTAL-EPA-EPCRA-CERCLA-RQ-CHEMICAL-SPILL-15MIN-NRC-REPORTING-AND-SDS-SHELTER-GUARD`) 与 WebRTC `RFC 8843 BUNDLE` 多媒体流单五元组复用、`RFC 5761 rtcp-mux` 强绑定与 `RFC 8445` 双端 `ICE-Lite` 死锁自动升格及 `STUN 487 Role Conflict` 角色翻转护栏 (`P116-WEBRTC-RFC8843-BUNDLE-RTCP-MUX-AND-RFC8445-ICE-LITE-ROLE-CONFLICT-GUARD`)** |
| **深度竞对分析与售前打单卡** | [`docs/competitive-analysis.md`](docs/competitive-analysis.md) · [`EN`](docs/competitive-analysis.en.md) | 全面剖析 **Sierra AI (`Poppy v0.1` / `Constellation`)**、**Retell AI**、**ElevenLabs (ElevenAgents 2.0)**、**Vapi / LiveKit**、**PolyAI / Bland AI**、**Cartesia / Deepgram / Hume** 及 **AWS Nova Sonic / Google CES / OpenAI Direct** 的架构软肋、**真实账单隐性乘数拆解**及 **平滑迁移至 Azure 映射表** |
| **24 项声学、语义与红队安全评测规范** | [`docs/voice-agent-evaluation-rubric.md`](docs/voice-agent-evaluation-rubric.md) | 涵盖声学全双工 (`A01–A06`)、同音词与领域接地 (`L01–L06`)、事务幂等锁 (`T01–T06`) 与语音安全红队 (`S01–S06`) 的 24 项可复现探针矩阵 |
| **Azure Speech 本地容器部署指南** | [`docs/speech-container-guide.md`](docs/speech-container-guide.md) | 针对金融/政企内网“音频不出域”场景的 STT/TTS Docker 容器部署、防火墙白名单、计量心跳与性能评测手册 |
| **全域语音技术资产总目录与研究日报** | [`docs/asset-catalog.md`](docs/asset-catalog.md) · [`EN`](docs/asset-catalog.en.md) · [`docs/daily/2026-10-19.md`](docs/daily/2026-10-19.md) | 汇总 `turbo998/voice-agent-lab`、`turbo998/gpt-live-1-demo`、`turbo998/ai-gaming-lab` 与最新持续研究演进日报 (`2026-10-18` / `2026-10-19`) |

---

## 🧪 LumaNest 全栈语音工程实验室说明

中国智能硬件品牌出海东南亚的浏览器语音实验室。原创合成品牌 **LumaNest**，
覆盖售前咨询、订单查询、安全故障诊断、运营审批工单与同意后的回访计划。
不代表真实品牌政策，也不会拨号、发送短信、退款、支付或寄送商品。

**当前是部分基础设施部署、尚无云运行时，不是完整验收交付。** 真实语音关闭。
独立资源组已创建 Foundry/OpenAI 空账号、项目、Consumption 环境、Storage、
Key Vault 与日志。组织 modify Policy 将 Storage/Key Vault 公网访问关闭；
不重新启用，待确认合规私网拓扑与费用后继续应用部署。
Retell API 只读鉴权已验证；未创建真实通话或付费测试。实际
Foundry/Search 推理与 GPT Live 语音、供应商签名回调仍待验证。
详情见 [交付状态](docs/delivery-status.md) 与
[部署计划](.azure/deployment-plan.md)。
私网阻塞、最小候选和成本差异见 [网络决策依据](docs/network-decision.md)。
学习路径：[场景咨询与演练](docs/scenario.md) →
[架构与边界](docs/architecture.md) →
[私密配置/运行/关停恢复](docs/operations.md) →
[能力证据矩阵](docs/capabilities.md)。

## 两个独立实验

| 实验 | 实现 | 当前证据 |
|---|---|---|
| Retell-native | Conversation Flow、严格业务函数、可选只读 MCP、字幕与主管控制 | 离线测试、构建；原生配置尚未发布到服务 |
| GPT Live | 保留 MIT 上游独立 UI 和 `/live/sessions` 协议，增加受保护云适配器 | 原始 33 项测试与发布扫描；无真实语音证明 |
| Foundry | 固定版本 Prompt Agent + Responses + Azure AI Search 简单查询 | 代码完成基础路径；云兼容性/权限待实测 |

GPT Live **不是** Retell Web SDK、Azure Voice Live 或 Realtime 协议。
导入来源、固定提交和许可证见
[GPT Live provenance](experiments/gpt-live/PROVENANCE.json)。
上游界面图片仅是导入的原始 UI 资产，不是本实验的 live 验收截图。

## 本地离线业务演练

需要 Node.js 22+、npm。所有命令在本仓库工作目录执行。

```powershell
npm ci --no-audit --no-fund
npm run setup:local
npm run build
npm run dev
```

打开 `http://127.0.0.1:8080`。私下查看 `.private\operator.password.txt`
并登录；不要将该文件、`.private\lab.env` 或浏览器 cookie 上传到 GitHub。
首次配置不会覆盖既有配置，无默认密码。

选择新加坡合成客户和 Cam Air，运行合成业务演练：查询订单 `LN-SG-1001`，
诊断 5 GHz 配网失败，审阅草稿后批准固定版本，再提交工单。录入回访同意
必须来自明确用户表达并由运营员确认；生成的仅是计划，不发生外部联系。
本地无 Foundry 配置时使用标注为确定性 fixture 的诊断，不伪装成模型输出。

独立 GPT Live 的原始本地使用说明见
[中文指南](experiments/gpt-live/README.zh-CN.md)；
开发时必须显式设置仓库内忽略的私有数据目录，不能复用安装应用的数据。
云入口是 `npm run start:gpt-live`，但需已完成安全运行时配置与权限核验，
不是零配置启用真实语音的命令。

## 边界与验证

- 服务端凭据、运营员 cookie、CSRF、会话所属权与固定 provider 配置。
- 签名校验针对原始字节和时间戳，使用独立指定的 Retell webhook signer。
- 工单写入需要运营审批版本和幂等键；模型自称批准或同意无效。
- 持久化预算预留、未知请求不释放并发、暂停与过期门禁。
- Retell 试用声额度上限 USD 5 / 15 分钟，每次最多 3 分钟；文本预留
  USD 2，保留 USD 3。不充值、不添加卡、不购买电话号码。
- Azure 新增费用目标不超过 USD 150/月。告警不是硬限额，应用预算也不能
  保证任意客户端行为的账单上限；未验证用途继续关闭。

```powershell
npm run typecheck
npm test
npm run build
npm run test:gpt-live
npm run check:gpt-live
npm run check:public
npm run test:browser
npm run test:browser:live
```

详细知识条目见 [原创合成知识库](docs/knowledge.md)，价格事实与尚未完成的
计量映射见 [成本核验](docs/costs.md)。遵守组织每日停机政策，不绕过治理。

源代码与文档由 GitHub Copilot 辅助生成；公共产品/合规声明仍需人工审阅。
