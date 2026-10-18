# Voice Agent Lab · 企业级实时语音智能体售前方案、竞对分析与全栈实验室

[![GitHub Pages Presales Portal](https://img.shields.io/badge/GitHub%20Pages-H5%20Presales%20%26%20Sandbox%20Portal-2563EB?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/)
[![Azure Executive Slide Deck](https://img.shields.io/badge/Slide%20Deck-12--Slide%20Azure%20Briefing-0078D4?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/deck.html)
[![7-Card 4:5 Benchmark Report](https://img.shields.io/badge/Benchmark-7--Card%204%3A5%20Visual%20Deck-10B981?style=for-the-badge)](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html)
[![Live Azure S2S Companion](https://img.shields.io/badge/Azure%20Voice%20Live-gpt--live--1%20Demo-8B5CF6?style=for-the-badge)](https://gpt-live-demo-0922-qc.azurewebsites.net/)

本仓库整合了**面向合作伙伴与政企/出海客户的实时语音智能体 (Voice Agent) 售前方案库、深度竞对打单卡、多引擎交互 H5 沙盒、12 页 Azure 高管演示幻灯片**，以及合成硬件品牌 **LumaNest** 的全栈参考实现（Retell AI + Azure AI Foundry + 双语坐席审批工作台）。

## 🌐 在线演示门户与核心售前资产 (Presales & Engineering Hub)

| 资产模块 | 在线访问 / 仓库路径 | 核心内容说明 |
|---|---|---|
| **H5 售前方案与多引擎交互总门户** | [**`https://turbo998.github.io/voice-agent-lab/`**](https://turbo998.github.io/voice-agent-lab/) (`site/index.html`) | 支持**简/繁/英三语完整切换**；涵盖 **20 大高 ROI 场景 (S1–S20)**（含车载 eCall、航旅 PCI 门控、政务 12345 燃气应急、跨境物流 AMD 外呼、游戏语音 NPC 护栏、工业 85dB LOTO 高压门禁、**跨国银行财富管理双录质检 `WM-DUAL-01`**、**连锁酒店多语种礼宾/PMS 改单 `HOSP-PMS-01`**、**跨国航空 IRROPS 航延与行李索赔 `AIR-IRROPS-01`**、**高端制造 PLC 免提排障与备件调拨 `IND-FIELD-01`**、**跨国电信 eSIM 防劫持与基站风暴分流 `TELCO-ESIM-01`**、**跨境冷链海运关务与电放提单门禁 `LOG-COLD-01`**、**智能电网停电风暴与合闸安全联锁 `GRID-STORM-01`**、**药企三期临床随访与 SAE 药物警戒 `PHARMA-PV-01`**、**金融云 NOC Sev-1 战情室与变更冻结门禁 `CLOUD-NOC-01`** 及 **L4 自动驾驶远程安全员与 AEB 安全联锁 `AUTO-TELEOP-01`**）、4 套参考架构蓝图、交互式选型决策器（支持**一键导出客户定制架构与 BOM 方案书**）、7 组竞对打单表与平滑迁移路线图、**Web Audio 多引擎实时语音沙盒（含 54 项 POC 照妖镜探针实验室）** 及 **FinOps TCO + PTU/PAYGO 弹性容量测算器** |
| **Azure 风格高管演示幻灯片 (12 Slides)** | [**`https://turbo998.github.io/voice-agent-lab/deck.html`**](https://turbo998.github.io/voice-agent-lab/deck.html) (`site/deck.html`) | 遵循 `azure-style-presentation` 规范：16:9 零依赖单文件 HTML 演示文稿，涵盖市场拐点、二十大行业场景、四大架构与 `turnEpoch` 投机取消、Sierra/Retell/ElevenLabs/AWS Nova Sonic 攻防卡、Speech 容器与 2 周 POC 路线图（支持键盘翻页与 PDF 打印） |
| **7-Card (4:5) 模型基准评测报告** | [**`https://turbo998.github.io/voice-agent-lab/benchmark-cards.html`**](https://turbo998.github.io/voice-agent-lab/benchmark-cards.html) (`site/benchmark-cards.html`) | 遵循 7-Card 4:5 竖版评测规范：基于 Azure East US 2 实测 (`gpt-4.1-mini` / `gpt-4.1` / `gpt-5.4-mini` / `gpt-live-1`) 与确定性护栏数据 (`site/data/voice-agent-benchmark-report.json`) |
| **售前实战打单手册与 POC 交付指南** | [`docs/presales-playbook.md`](docs/presales-playbook.md) | 首轮客户 5 维 Discovery 问卷、三大竞对设伏提问、15 分钟现场演示脚本、2 周 POC 验收标准、**54 大现场照妖镜探针 (`A01–P36`)** 与存量竞品两阶段替换剧本 |
| **业务场景与 ROI 白皮书** | [`docs/business-scenarios.md`](docs/business-scenarios.md) | 深度拆解智能硬件出海售后、快餐 Drive-Thru 点餐、金融车险报案 (FNOL)、医疗/IT 服务台、**车企智能座舱与 eCall 救援**、**航旅退改签与 PCI 语音支付**、**政务 12345 热线与燃气应急**、**跨境物流异常改约与 AMD 外呼**、**游戏实时语音 NPC 与未成年/充值护栏**、**工业能源免提巡检与 LOTO 高压互锁**、**银行财富管理双录质检 (`WM-DUAL-01`)**、**连锁酒店多语种 PMS 礼宾 (`HOSP-PMS-01`)**、**跨国航空 IRROPS 航延索赔 (`AIR-IRROPS-01`)**、**高端制造 PLC 排障 (`IND-FIELD-01`)**、**电信 eSIM 防劫持 (`TELCO-ESIM-01`)**、**跨境冷链电放提单门禁 (`LOG-COLD-01`)**、**智能电网停电风暴与合闸互锁 (`GRID-STORM-01`)**、**药企三期临床随访与 SAE 药物警戒 (`PHARMA-PV-01`)**、**金融云 NOC 战情室 (`CLOUD-NOC-01`)** 与 **L4 自动驾驶远程安全员 (`AUTO-TELEOP-01`)** 20 大场景痛点与 TCO 收益模型 |
| **四范式方案架构与电信网关联接指南** | [`docs/solution-architecture.md`](docs/solution-architecture.md) | 对比 **Paradigm A (`gpt-live-1` S2S)**、**Paradigm B (Constellation 级联路由)**、**Paradigm C (Retell + Foundry)**、**Paradigm D (本地容器)**，并附 **PSTN/SIP ↔ ACS 时序图、G.711 vs Opus 1%–10% 弱网丢包抗损曲线、RFC 4733 DTMF、AMD 外呼状态机、多智能体交接协议、极端噪音 DSP 流水线、PTU+PAYGO 弹性溢出架构、全双工 Barge-in 投机取消状态机 (`turnEpoch`)、实时防深伪双因子防线 (`S08-DEEPFAKE-GUARD`)、多人同场声纹绑定工具授权 (`S09-SPEAKER-ROLE-AUTH`)、外呼 TCPA 宵禁/`<200ms` DNC 退订及 C2PA 声学水印溯源 (`S11-TCPA-CONSENT-GUARD`)、端云协同降级及主权数据驻留跨境熔断 (`S14-SOVEREIGN-EDGE-GUARD`)、`<2ms` 三层零信任统一护栏流水线 (`P08-UNIFIED-ZERO-TRUST-PIPELINE`)、音频滑动窗口裁剪 (`P07-FINOPS-ERLANG-PLANNER`)、RFC 5589 双腿热转接耳语 (`P09-WARM-HANDOFF-WHISPER`)、100 分事后全量质检 (`P10-POSTCALL-QA-RUBRIC`)、PCI-DSS v4.0 媒体面旁路脱敏 (`P11-PCI-DTMF-MEDIA-BYPASS`)、金丝雀 `<500ms` 自动回滚 (`P12-CANARY-SHADOW-ROLLOUT-GATE`)、多模态同屏防视觉注入 (`P13-MULTIMODAL-COBROWSING-GROUNDING`)、EAA/ADA 无障碍自适应端点检测 (`P14-ACCESSIBILITY-DISFLUENCY-ADAPTIVE`)、通话中途 `<300ms` 零掉线热备切换 (`P15-MULTIPROVIDER-S2S-FAILOVER`)、`15 vs 50` / `B vs P` 北约字母逐位复诵校验 (`P16-NUMERIC-ENTITY-READBACK-VERIFIER`)、多智能体蜂群防死循环 (`P17-MULTI-AGENT-SWARM-LOOP-GUARD`)、声学情绪降级禁推销 (`P18-ACOUSTIC-EMOTION-DEESCALATION`)、慢速异步工具防未落库抢跑承诺 (`P19-ASYNC-TOOL-CALLBACK-PACING`)、跨通话记忆防投毒 (`P20-VOICE-MEMORY-POISONING-GUARD`)、下游 API 熔断降级防雪崩 (`P21-TOOL-CIRCUIT-BREAKER-DEGRADATION`)、多音字/SSML 防注入护栏 (`P22-PROSODY-SSML-PRONUNCIATION-GUARD`)、WebRTC Opus 丢包抖动钳位 (`P23-WEBRTC-OPUS-PLC-JITTER-ADAPTATION`)、中英粤混说热词消歧 (`P24-MULTILINGUAL-CODESWITCH-ASR-STABILITY`)、智能外呼 DNC/宵禁/AMD 防泄密 (`P25-OUTBOUND-TCPA-DNC-AMD-GUARD`)、脆弱人群关怀专线 (`P26-EMOTIONAL-DISTRESS-VULNERABLE-CALLER-GUARD`)、车载/柜台远场多麦波束防串音 (`P27-FARFIELD-BEAMFORMING-CROSSTALK-GUARD`)、ITU-T G.107 实时 MOS-LQO 双通道降级护栏 (`P28-REALTIME-MOS-LQO-CODEC-FALLBACK-GUARD`)、SIP/WebRTC DTLS-SRTP 媒体防重放绑定 (`P29-SIP-WEBRTC-ANTI-REPLAY-MEDIA-BINDING`)、话后口头承诺对账护栏 (`P30-POSTCALL-PROMISE-VS-TICKET-AUDIT-GUARD`)、车规级 eCall 碰撞 0ms 抢占 (`P31-AUTOMOTIVE-ECALL-CRASH-PREEMPTION-GUARD`)、座舱四音区权限隔离 (`P32-CABIN-MULTIZONE-PRIVILEGE-ISOLATION-GUARD`)、医疗临床红旗症状 0ms 急诊强转 (`P33-CLINICAL-REDFLAG-ESCALATION-GUARD`)、主权声纹 CMK 加密粉碎 (`P34-SOVEREIGN-VOICEPRINT-CRYPTO-SHREDDING-GUARD`)、跨境汇款制裁反通风报信与反电诈止付 (`P35-AML-SANCTIONS-SCAM-COERCION-GUARD`) 与实时双语同传极性/量级保真 (`P36-REALTIME-INTERPRETER-FIDELITY-GUARD`)** |
| **深度竞对分析与售前打单卡** | [`docs/competitive-analysis.md`](docs/competitive-analysis.md) | 全面剖析 **Sierra AI (`Poppy v0.1` / `Constellation`)**、**Retell AI**、**ElevenLabs (ElevenAgents 2.0)**、**Vapi / LiveKit**、**PolyAI / Bland AI**、**Cartesia / Deepgram / Hume** 及 **AWS Nova Sonic / Google CES / OpenAI Direct** 的架构软肋、**真实账单隐性乘数拆解**及 **平滑迁移至 Azure 映射表** |
| **24 项声学、语义与红队安全评测规范** | [`docs/voice-agent-evaluation-rubric.md`](docs/voice-agent-evaluation-rubric.md) | 涵盖声学全双工 (`A01–A06`)、同音词与领域接地 (`L01–L06`)、事务幂等锁 (`T01–T06`) 与语音安全红队 (`S01–S06`) 的 24 项可复现探针矩阵 |
| **Azure Speech 本地容器部署指南** | [`docs/speech-container-guide.md`](docs/speech-container-guide.md) | 针对金融/政企内网“音频不出域”场景的 STT/TTS Docker 容器部署、防火墙白名单、计量心跳与性能评测手册 |
| **全域语音技术资产总目录与研究日报** | [`docs/asset-catalog.md`](docs/asset-catalog.md) · [`docs/daily/2026-10-19.md`](docs/daily/2026-10-19.md) | 汇总 `turbo998/voice-agent-lab`、`turbo998/gpt-live-1-demo`、`turbo998/ai-gaming-lab` 与最新持续研究演进日报 (`2026-10-18` / `2026-10-19`) |

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
