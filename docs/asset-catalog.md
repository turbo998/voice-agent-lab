# Voice Agent 技术资产全景目录与售前资源索引 (Asset Catalog)

> **归档范围**：整合当前工作区、关联 GitHub 仓库（`turbo998/voice-agent-lab`、`turbo998/gpt-live-1-demo`、`turbo998/benchmark-harness-engineering`）及 Azure 实机环境中的全量企业级 Voice Agent 技术资产、架构蓝图、评测报告、可运行源码与售前交付件。

---

## 1. 在线演示门户与实机环境总入口

| 资产名称 | 类型 | 访问地址 / 仓库路径 | 核心能力与演示看点 |
| :--- | :--- | :--- | :--- |
| **Voice Agent 售前方案与竞对沙盒总门户** | 🌐 H5 交互门户 (`github.io`) | `https://turbo998.github.io/voice-agent-lab/` (`site/index.html`) | 涵盖 **12 大高价值业务场景 (S1–S12)**、4 大参考架构、7 组全球核心竞对 (Sierra/Retell/ElevenLabs/Vapi/PolyAI/Cartesia/AWS Nova Sonic & Google CES) 深度 Battlecards、**15 项 POC 照妖镜探针交互实验室**、分段延迟瀑布与 FinOps TCO + PTU/PAYGO 弹性容量计算器 |
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
| [docs/business-scenarios.md](business-scenarios.md) | **业务场景与 ROI 白皮书** | 跨境智能硬件排障（LumaNest）、全球新零售实时点单、金融保险高合规报案、医疗/ITSM 分诊、车企智能座舱与 eCall 道路救援、航旅退改签与 PCI 语音门控、政务 12345 热线与燃气电力应急、跨境物流清关改约与 AMD 合规外呼、游戏实时语音 NPC 与未成年/充值护栏、工业能源 85dB 免提巡检与 LOTO 高压互锁、跨国银行财富管理双录质检与适当性门控 (`WM-DUAL-01`)、全球连锁酒店多语种礼宾与 PMS 改单护栏 (`HOSP-PMS-01`) 十二大场景拆解及 ROI 测算 |
| [docs/solution-architecture.md](solution-architecture.md) | **四大参考架构与电信互联指南** | Native S2S 三平面架构、Cascaded Constellation 路由架构、Hybrid (Retell + Foundry)、Sovereign 本地容器，以及 PSTN/SIP ↔ ACS 时序、G.711/Opus 编解码损耗表、AMD 外呼状态机、多智能体交接契约、极端低信噪比 DSP 流水线、PTU+PAYGO 弹性溢出架构与全双工 Barge-in 投机取消 (`turnEpoch` 两阶段状态机) |
| [docs/competitive-analysis.md](competitive-analysis.md) | **深度竞对分析与 Battlecards** | Sierra AI (`Constellation` 四模型 + `Poppy v0.1`)、Retell AI (`SIP BYE` 孤儿回调风险)、ElevenLabs (`ElevenAgents 2.0` 75ms vs 1.27s 落差)、Vapi/LiveKit、PolyAI/Bland AI、Cartesia/Deepgram/Hume、AWS Nova Sonic / Google CES / OpenAI Direct 与 Azure 全栈方案对比、真实账单隐性乘数拆解、以及 **两阶段平滑迁移至 Azure 实战映射手册** |
| [docs/presales-playbook.md](presales-playbook.md) | **售前实战打单手册与 POC 指南** | 客户首轮 5 维 Discovery 问卷、三大竞对设伏提问、15 分钟现场演示脚本、2 周 POC 验收评分卡、15 大现场照妖镜探针 (`A01–S07`) 与存量竞品替换两步走剧本 |
| [docs/daily/2026-10-18.md](daily/2026-10-18.md) · [docs/daily/2026-10-19.md](daily/2026-10-19.md) | **持续深度研究与售前资产演进日报** | 记录 Azure 账户只读核验、2025–2026 全球语音竞品最新动态追踪及本轮 12 大场景 (`S1–S12`) 与 15 大探针 (`A01–S07`) 演进摘要 |
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
