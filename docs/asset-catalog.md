# Voice Agent 技术资产全景目录与售前资源索引 (Asset Catalog)

> **归档范围**：整合当前工作区、关联 GitHub 仓库（`turbo998/voice-agent-lab`、`turbo998/gpt-live-1-demo`、`turbo998/benchmark-harness-engineering`）及 Azure 实机环境中的全量企业级 Voice Agent 技术资产、架构蓝图、评测报告、可运行源码与售前交付件。

---

## 1. 在线演示门户与实机环境总入口

| 资产名称 | 类型 | 访问地址 / 仓库路径 | 核心能力与演示看点 |
| :--- | :--- | :--- | :--- |
| **Voice Agent 售前方案与竞对沙盒总门户** | 🌐 H5 交互门户 (`github.io`) | `https://turbo998.github.io/voice-agent-lab/` (`site/index.html`) | 涵盖 **20 大高价值业务场景 (S1–S20)**、4 大参考架构、7 组全球核心竞对 (Sierra/Retell/ElevenLabs/Vapi/PolyAI/Cartesia/AWS Nova Sonic & Google CES) 深度 Battlecards、**62 项 POC 照妖镜探针交互实验室 (`A01–P44`)**、分段延迟瀑布与 FinOps TCO + PTU/PAYGO 弹性容量计算器 |
| **企业级 Voice Agent 高管售前演示幻灯片** | 📽️ Azure Slide Deck (`github.io`) | `https://turbo998.github.io/voice-agent-lab/deck.html` (`site/deck.html`) | 遵循 `azure-style-presentation` 规范的 12 页 16:9 零依赖高管简报幻灯片（支持键盘翻页、双语呈现与 PDF 打印导出） |
| **企业级 Voice Agent 7-Card 4:5 视觉评测报告** | 📊 7-Card 评测卡 (`github.io`) | `https://turbo998.github.io/voice-agent-lab/benchmark-cards.html` | 对齐 `benchmark-harness-engineering` 规范，展示 Azure 多模型路由与实时语音实测延迟、声学抗扰、同音词归一化与安全护栏评测 |
| **GPT-Live (`gpt-live-1`) 合作伙伴工程师技术培训门户** | 🎓 三语培训 H5 (`github.io`) | `https://turbo998.github.io/gpt-live-1-demo/training.html` | 6 大工程模块、3 张高清架构图深度价值拆解（Voice Live 全景 / 4 层流式管道 / 三平面解耦）、FinOps 计算器与现场通关测验 |
| **GPT-Live 7-Card 专项基准测试报告** | 📊 7-Card 评测卡 (`github.io`) | `https://turbo998.github.io/gpt-live-1-demo/benchmark-cards.html` | 聚焦 `gpt-live-1` vs `gpt-realtime-2` 在 8 类全双工打断探针、12 项饮品同音词与 DragonHDFlash 盲测 MOS 的对比 |
| **Azure GPT-Live 实时语音实机工作台** | ☁️ Azure App Service 实机 | `https://gpt-live-demo-0922-qc.azurewebsites.net/` | 部署于 Azure Linux App Service，通过 Managed Identity 免密钥直连 Azure AI Foundry `gpt-live-1` + `gpt-4.1-mini` |

---

## 2. 本仓库 (`turbo998/voice-agent-lab`) 核心技术资产清单

### 2.1 售前咨询、架构设计与竞对白皮书 (`docs/`)

| 文档路径 | 主题 | 核心内容摘要 |
| :--- | :--- | :--- |
| [docs/business-scenarios.md](business-scenarios.md) | **业务场景与 ROI 白皮书** | 跨境智能硬件排障（LumaNest）、全球新零售实时点单、金融保险高合规报案、医疗/ITSM 分诊、车企智能座舱与 eCall 道路救援、航旅退改签与 PCI 语音门控、政务 12345 热线与燃气电力应急、跨境物流清关改约与 AMD 合规外呼、游戏实时语音 NPC 与未成年/充值护栏、工业能源 85dB 免提巡检与 LOTO 高压互锁、跨国银行财富管理双录质检与适当性门控 (`WM-DUAL-01`)、全球连锁酒店多语种礼宾与 PMS 改单护栏 (`HOSP-PMS-01`)、跨国航空 IRROPS 航延 EU261 赔偿与联程/行李索赔锁 (`AIR-IRROPS-01`)、高端制造 PLC/Modbus 免提排障与备件调拨锁 (`IND-FIELD-01`)、跨国电信 eSIM 防 SIM-Swap 劫持与基站风暴分流 (`TELCO-ESIM-01`)、跨境冷链海运关务与电放提单放货门禁 (`LOG-COLD-01`)、智能电网停电风暴与合闸安全联锁 (`GRID-STORM-01`)、药企三期临床试验随访与 SAE 药物警戒门禁 (`PHARMA-PV-01`)、金融云 NOC Sev-1 故障战情室与变更冻结门禁 (`CLOUD-NOC-01`)、L4 自动驾驶远程安全员与 AEB 安全联锁 (`AUTO-TELEOP-01`) 二十大场景拆解及 ROI 测算 |
| [docs/solution-architecture.md](solution-architecture.md) | **四大参考架构与电信互联指南** | Native S2S 三平面架构、Cascaded Constellation 路由架构、Hybrid (Retell + Foundry)、Sovereign 本地容器，以及 PSTN/SIP ↔ ACS 时序、G.711 vs Opus 1%–10% 弱网丢包抗损曲线、RFC 4733 DTMF、AMD 外呼状态机、多智能体交接契约、极端低信噪比 DSP 流水线、PTU+PAYGO 弹性溢出架构、全双工 Barge-in 投机取消 (`turnEpoch`)、实时防深伪双因子防线 (`S08-DEEPFAKE-GUARD`)、多人同场说话人角色分离及声纹工具授权 (`S09-SPEAKER-ROLE-AUTH`)、智能外呼 TCPA 宵禁/`<200ms` DNC 退订及 C2PA 声学水印溯源 (`S11-TCPA-CONSENT-GUARD`)、端云混合韧性降级及主权数据驻留跨境熔断 (`S14-SOVEREIGN-EDGE-GUARD`)、`<2ms` 三层零信任统一护栏流水线 (`P08-UNIFIED-ZERO-TRUST-PIPELINE`)、长通话音频窗口裁剪/Erlang-C 精算 (`P07-FINOPS-ERLANG-PLANNER`)、RFC 5589 双腿热转接 `1.35x` 坐席耳语 (`P09-WARM-HANDOFF-WHISPER`)、100 分事后全量质检 (`P10-POSTCALL-QA-RUBRIC`)、PCI-DSS v4.0 媒体面旁路脱敏 (`P11-PCI-DTMF-MEDIA-BYPASS`)、金丝雀影子流量 `<500ms` 自动回滚 (`P12-CANARY-SHADOW-ROLLOUT-GATE`)、多模态同屏防视觉注入 (`P13-MULTIMODAL-COBROWSING-GROUNDING`)、EAA/ADA 无障碍自适应端点检测 (`P14-ACCESSIBILITY-DISFLUENCY-ADAPTIVE`)、通话中途 `<300ms` 零掉线热备切换 (`P15-MULTIPROVIDER-S2S-FAILOVER`)、`15 vs 50` / `B vs P` 北约字母逐位复诵校验 (`P16-NUMERIC-ENTITY-READBACK-VERIFIER`)、多智能体蜂群防死循环与最小权限门禁 (`P17-MULTI-AGENT-SWARM-LOOP-GUARD`)、实时声学情绪降级禁推销 (`P18-ACOUSTIC-EMOTION-DEESCALATION`)、慢速异步工具防未落库抢跑承诺 (`P19-ASYNC-TOOL-CALLBACK-PACING`)、跨通话记忆防投毒 (`P20-VOICE-MEMORY-POISONING-GUARD`)、下游 API 熔断降级防雪崩 (`P21-TOOL-CIRCUIT-BREAKER-DEGRADATION`)、多音字/SSML 防注入护栏 (`P22-PROSODY-SSML-PRONUNCIATION-GUARD`)、WebRTC Opus 丢包抖动钳位 (`P23-WEBRTC-OPUS-PLC-JITTER-ADAPTATION`)、中英粤混说热词消歧 (`P24-MULTILINGUAL-CODESWITCH-ASR-STABILITY`)、智能外呼 DNC/宵禁/AMD 防泄密 (`P25-OUTBOUND-TCPA-DNC-AMD-GUARD`)、脆弱人群关怀专线护栏 (`P26-EMOTIONAL-DISTRESS-VULNERABLE-CALLER-GUARD`)、车载/柜台远场多麦波束防串音 (`P27-FARFIELD-BEAMFORMING-CROSSTALK-GUARD`)、ITU-T G.107 实时 MOS-LQO 双通道降级护栏 (`P28-REALTIME-MOS-LQO-CODEC-FALLBACK-GUARD`)、SIP/WebRTC DTLS-SRTP 媒体指纹绑定防重放挑战护栏 (`P29-SIP-WEBRTC-ANTI-REPLAY-MEDIA-BINDING`)、话后口头承诺 vs 落库工单对账补偿护栏 (`P30-POSTCALL-PROMISE-VS-TICKET-AUDIT-GUARD`)、车规级 eCall 碰撞 0ms 抢占护栏 (`P31-AUTOMOTIVE-ECALL-CRASH-PREEMPTION-GUARD`)、座舱四音区儿童越权车控隔离护栏 (`P32-CABIN-MULTIZONE-PRIVILEGE-ISOLATION-GUARD`)、医疗临床红旗症状 0ms 急诊强转护栏 (`P33-CLINICAL-REDFLAG-ESCALATION-GUARD`)、主权声纹生物特征 CMK 加密粉碎护栏 (`P34-SOVEREIGN-VOICEPRINT-CRYPTO-SHREDDING-GUARD`)、跨境汇款制裁反通风报信与反电诈胁迫止付护栏 (`P35-AML-SANCTIONS-SCAM-COERCION-GUARD`)、实时双语同传极性/量级保真护栏 (`P36-REALTIME-INTERPRETER-FIDELITY-GUARD`)、夜间 SIP 群呼风暴/盗号提现拦截护栏 (`P37-NOCTURNAL-RINGBURST-ANOMALY-GUARD`)、系统提示词金丝雀防套取/S2S 算力钱包防耗尽护栏 (`P38-PROMPT-EXFILTRATION-DENIAL-OF-WALLET-GUARD`)、语义句法防抢话与 C2PA/声学双水印溯源护栏 (`P39-SEMANTIC-TURN-TAKING-WATERMARK-PROVENANCE-GUARD`)、MCP 工具间接注入隔离及多步事务 Saga 逆向补偿护栏 (`P40-MCP-INDIRECT-INJECTION-SAGA-COMPENSATION-GUARD`)、运营商 STIR/SHAKEN 防改号与伴音按键防注入护栏 (`P41-CARRIER-STIR-SHAKEN-ANI-ATTESTATION-GUARD`)、RFC 7866 SIPREC 双录分流连续性及实时字幕 DLP 脱敏护栏 (`P42-SIPREC-COMPLIANCE-FORK-DLP-REDACTION-GUARD`)、对公财资四眼原则（Maker-Checker）双人复核护栏 (`P43-MAKER-CHECKER-DUAL-AUTH-TREASURY-GUARD`) 与免提扬声器声学回声环路自打断抑制护栏 (`P44-ACOUSTIC-AEC-ECHO-LOOPBACK-SELF-BARGEIN-GUARD`) |
| [docs/competitive-analysis.md](competitive-analysis.md) | **深度竞对分析与 Battlecards** | Sierra AI (`Constellation` 四模型 + `Poppy v0.1`)、Retell AI (`SIP BYE` 孤儿回调风险)、ElevenLabs (`ElevenAgents 2.0` 75ms vs 1.27s 落差)、Vapi/LiveKit、PolyAI/Bland AI、Cartesia/Deepgram/Hume、AWS Nova Sonic / Google CES / OpenAI Direct、Pindrop Pulse / Nuance Gatekeeper 防深伪与多人声纹授权对比及 **两阶段平滑迁移至 Azure 实战映射手册** |
| [docs/presales-playbook.md](presales-playbook.md) | **售前实战打单手册与 POC 指南** | 客户首轮 5 维 Discovery 问卷、三大竞对设伏提问、15 分钟现场演示脚本、2 周 POC 验收评分卡、62 大现场照妖镜探针 (`A01–P44`) 与存量竞品替换两步走剧本 |
| [docs/daily/2026-10-18.md](daily/2026-10-18.md) · [docs/daily/2026-10-19.md](daily/2026-10-19.md) | **持续深度研究与售前资产演进日报** | 记录 Azure 账户只读核验、2025–2026 全球语音竞品最新动态追踪及本轮 20 大场景 (`S1–S20`) 与 62 大探针 (`A01–P44`) 演进摘要 |
| [docs/voice-agent-evaluation-rubric.md](voice-agent-evaluation-rubric.md) | **24 项声学、语义与安全红队评测规范** | 覆盖声学全双工 (`A01–A06`)、同音词与领域接地 (`L01–L06`)、事务幂等锁 (`T01–T06`) 与语音安全红队 (`S01–S06`) 的可复现探针矩阵 |
| [docs/speech-container-guide.md](speech-container-guide.md) | **Azure Speech 本地容器部署指南** | 本地联网计量容器与完全离线容器（Disconnected Containers）选型、4 个核心防火墙 FQDN 白名单、10–15 分钟计量上报机制、STT/TTS 延迟科学评估口径 |
| [docs/scenario.md](scenario.md) | **LumaNest 出海智能硬件咨询演练** | 面向东南亚（SG/MY/TH）市场的英语语音客服 + 中文运营审批端到端 6 步旅程与 FDE 定制交接规范 |
| [docs/architecture.md](architecture.md) | **受治理私网部署架构与边界** | Azure Container Apps + VNet 委派子网 + Blob/Queue/Key Vault Private Endpoints + 私网 DNS 拓扑及静态离线渲染图 (`assets/architecture.svg`) |
| [docs/capabilities.md](capabilities.md) | **能力与证据分层矩阵** | 按“代码实现 → 离线测试 → 实际云服务 → 真人验收”四层严格界定 21 项语音与业务能力边界 |
| [docs/costs.md](costs.md) | **Azure 与 Retell 成本核验台账** | 基于 Azure Retail Prices API 的真实 Meter 核验、试用额度硬门禁与受限 POC 预算模型 |
| [docs/operations.md](operations.md) | **私密配置、运行窗口与关停手册** | RSA-OAEP/AES-GCM 一次性加密 Bootstrap、有界运行窗口租约（Operating Windows）与独立 Revision 停用控制器运维手册 |

### 2.2 全栈生产级参考代码与多引擎实验 (`apps/`, `packages/`, `integrations/`, `experiments/`)

| 模块路径 | 技术栈 | 工程价值与可复用资产 |
| :--- | :--- | :--- |
| `packages/business-core/` | TypeScript + Zod 4 | **领域核心契约层**：6 个严格防注入工具 Schema (`get_product_catalog`, `get_order_status`, `diagnose_device`, `draft_support_ticket`, `commit_approved_ticket`, `schedule_consented_followup`)、原创合成品牌数据与文件/Blob CAS 状态机 |
| `apps/retell-demo/` | Express 5 + React 19 + Vite 7 | **Retell + Foundry 混合运营中心**：中文运营控制台、安全 Cookie + CSRF 鉴权、会话归属校验、工单版本锁批准/撤回、回访同意核验 |
| `integrations/retell/` | `retell-sdk` 6 + Web SDK v3 | **Retell 原生集成层**：确定性 Conversation Flow 图生成器 (`flow.ts`)、原始字节 HMAC 签名校验 (`callback.ts`)、持久化去重事件网关 (`gateway.ts`)、不可逆主管接管状态机 |
| `integrations/foundry/` | `@azure/ai-projects` + `@azure/search-documents` | **Azure AI Foundry 诊断引擎**：Managed Identity 免密钥调用 Responses API、强制 JSON Schema 输出与 `K01–K12` 知识锚点引用校验、高危物理症状确定性熔断 |
| `integrations/gpt-live/` & `experiments/gpt-live/` | Node.js 22 + WebRTC `/live/sessions` | **独立 GPT-Live 云原生适配器**：保留 MIT 上游双语工作台，新增服务端 Entra 令牌代理、并发与时长租约预留、优雅关停结算与孤儿会话自动回收 |
| `infra/` | Azure Bicep (AVM) | **企业级受治理 IaC 模板**：包含私网 VNet (`private-network.bicep`)、最小权限 Managed Identity (`operating-identity.bicep`)、预算告警 (`budget.bicep`) 与零副本容器壳 (`inactive-app-shells.bicep`) |
| `tests/` | Node Test Runner (`tsx --test`) | **66 项严苛边界回归测试**：覆盖加密引导、并发预算门禁、签名伪造拦截、乱序 Webhook 免疫、防模型自批工单、高危症状升级与主管接管安全性 |

---

## 3. 跨仓库关联语音技术资产索引

1. **`turbo998/gpt-live-1-demo`（GPT-Live & Azure Voice Live 合作伙伴培训与实机仓）**
   - GitHub 仓库：<https://github.com/turbo998/gpt-live-1-demo>
   - 在线培训门户：<https://turbo998.github.io/gpt-live-1-demo/training.html>
   - 核心亮点：完整实现 `lookup_beverage_menu`（12 项饮品同音词归一化）、`preview_service_order`（`committed=false` 预览锁）、`SpeechDelivery` 长语音分段投递器与三平面架构监控台。
2. **`turbo998/benchmark-harness-engineering`（7-Card 4:5 视觉评测标准仓）**
   - GitHub 仓库：<https://github.com/turbo998/benchmark-harness-engineering>
   - 核心亮点：定义 7-Card 4:5 视觉评测报告标准规范（`docs/research/visual-report-card-format.md`）与自动化卡片渲染器。
3. **`azure-speech-diarization-poc`（Azure AI Speech 实时说话人分离与会议洞察 POC）**
   - 核心亮点：基于 Azure AI Speech SDK 实现多说话人实时分离（Speaker Diarization）、会议角色识别与实时字幕流，适用于银行双录、线下面对面理财顾问与门诊问诊归档。
