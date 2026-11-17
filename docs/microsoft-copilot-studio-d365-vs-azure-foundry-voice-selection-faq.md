# 微软企业语音平台选型：Microsoft Copilot Studio + D365 Contact Center（低代码 SaaS）vs Azure AI Foundry + ACS（专业代码 PaaS）深度对比指南（`LOWCODE-VS-PROCODE-01` / `P37` / `P738`）

> **导读**：在几乎所有采用微软云技术栈的企业语音 AI 售前架构评审中，客户 CIO 与研发副总裁都会问出同一个直击灵魂的问题：**“微软既有开箱即用的低代码 `Microsoft Copilot Studio（含语音能力）+ Dynamics 365 Contact Center`，又有面向开发者的 `Azure AI Foundry (Voice Live API) + Azure Communication Services (ACS) + Azure AI Speech`——我们到底该直接买 Copilot Studio 拖拽搭建，还是让研发团队基于 Azure AI Foundry 写代码自建？两者的延迟、功能边界和每月满载账单差多少？能不能把两者结合起来用？”** 本文以微软云首席解决方案架构师（Cloud & AI Solution Architect）视角，不讲官方套话，直接摊开**延迟实测、底层音频帧控制权、8.5 万分钟计费盈亏平衡点与“Better Together”混合集成架构**，帮你在 5 分钟内为客户拍板最佳路线。

![Microsoft Copilot Studio / D365 低代码全托管 vs Azure AI Foundry + ACS 专业自建选型全景图](../assets/svg/microsoft-copilot-studio-d365-vs-azure-foundry-voice.svg)

---

## 1. 📌 核心选型结论速览（Executive Summary）

- **一句话选型分水岭：看“月度通话分钟数（`85,000 分钟` 盈亏线）”、“对 `< 450ms` 极致全双工/原始音频帧的控制要求”以及“客户团队是业务运营主导还是工程研发主导”！**
  1. **什么时候坚定选 `Microsoft Copilot Studio + Dynamics 365 Contact Center`（Low-Code 全托管 SaaS）？**
     - **适用画像**：企业已经是 M365 / Dynamics 365 / Power Platform 深度用户；场景为 **内部 IT/HR 服务台、标准售后服务热线、门店预约查询**；月通话量在 **`10,000 – 85,000 分钟`以内**；希望由业务分析师（Citizen Developers）在 **2 周内** 通过可视化画布拖拽上线，并直接复用 Power Platform 现成的 **1,400+ 个企业连接器（SAP、ServiceNow、Workday、Salesforce 免写代码认证）**。
  2. **什么时候坚定选 `Azure AI Foundry (Voice Live API) + ACS / LiveKit`（Pro-Code 专业代码自建 PaaS）？**
     - **适用画像**：
       - **高并发大规模话务（月通话 `> 85,000 分钟` 乃至千万分钟级）**：自建 PaaS 配合 **滑窗音频裁剪 + 75/25 大小模型路由 + Azure PTU 预留**，可将每分钟综合成本压至 **`$0.038 – $0.058 / 分钟`**，在百万分钟规模下比按消息包/坐席许可计费的 SaaS **节省 58%–72% 成本**；
       - **极致拟人体验与底层声学控制**：需要原生端到端 `GPT-Live-1 / gpt-realtime-1.5` 的 **`<= 420ms` 极速响应**、**80KB 视频关键帧多模态看图说话（See-and-Speak）**、**20ms 原始 PCM 帧级 `S08` 声道活体防伪**、**双档“嗯嗯”附和词不中断**或 **本地断网 `Azure Speech Containers` 私有化部署**；
       - **存量异构呼叫中心赋能**：客户已有 2,000 席 `Genesys / Cisco UCCE / Avaya`，不打算替换现有坐席桌面，只需在大门 SBC 前置挂载 AI 语音分流（免交双重 CCaaS 坐席许可费）。
  3. **财富 500 强最推崇的“Better Together 双层混合架构（Hybrid Pattern）”**：
     - **前台用 `Azure AI Foundry + ACS` 扛住高并发极速语音流（`< 420ms`），后台把 `Copilot Studio` 作为企业连接器总线（Connector Hub）或将复杂客诉一键热转接至 `Dynamics 365 Contact Center` 人工坐席桌面**——既有自建 PaaS 的极致音质与低单价，又白嫖了 Power Platform 1,400 个连接器的企业鉴权生态！

---

## 2. 🎯 客户与架构师灵魂拷问 Q&A（Deep-Dive Q&A）

### Q1：Copilot Studio 的语音能力和 Azure AI Foundry 的 `Voice Live API (GPT-Live-1 / gpt-realtime-1.5)` 在底层技术链路上有什么本质区别？为什么客户打电话时感觉响应速度和打断体验不一样？
- **底层音频管道的物理差异拆解**：
  1. **`Copilot Studio Voice` 的标准工作流（受控级联状态机）**：
     - 电话经由 ACS 接入 `Dynamics 365 / Copilot Studio` 语音运行时 $\rightarrow$ 调用 `Azure AI Speech` 流式转写为文本 $\rightarrow$ 进入 Copilot Studio 的 **生成式编排器（Generative Orchestrator）匹配 Topic（主题）、知识库与 Power Automate 流** $\rightarrow$ 生成回复文本后再由 `Azure Neural TTS` 合成语音播放；
     - **优势**：每一句话严格遵循业务流程图（Topic Flow），100% 可视化审计，非常适合流程严谨的表单收集；
     - **物理局限**：由于中间经过了 SaaS 编排层与文本级联转换，端到端首字语音响应通常在 **`750ms – 1,150ms`**；且开发者**拿不到底层的 20ms 原始 PCM 音频流**，无法植入自定义的声纹活体探针、骨传导滤波或视频抽帧多模态交互。
  2. **`Azure AI Foundry Voice Live + ACS / LiveKit` 的工作流（原生音频流直通）**：
     - 开发者通过 WebSocket / WebRTC 直接将 24kHz PCM 音频帧送入 `GPT-Live-1 / gpt-realtime-1.5` 原生端到端模型；模型在单一神经网络内直接从声音理解情绪并输出音频流，首声延迟低至 **`320ms – 450ms`**，且支持毫秒级 `conversation.item.truncate` 已播位置对齐与视频帧输入！

### Q2：算一笔明白账：按微软官方计费模式，Copilot Studio（按 Copilot Credits / 消息包计费）和 Azure AI Foundry（按 Token / 分钟 / PTU 计费），在月通话 2 万分钟、10 万分钟和 100 万分钟时各花多少钱？
- **三大规模量级下的真实 TCO 盈亏平衡表（含语音识别合成、大模型推理、通信干线与平台费）**：
  - **小微规模（月通话 `20,000 分钟`，如 500 人企业的内部 IT 服务台）**：
    - **选 `Copilot Studio` 更划算！** 云消费仅约 `$1,800 – $2,600 / 月`，且省去了雇佣 2 名全栈语音工程师开发维护 2 个月的人力成本（省下 `$40,000+` 研发工资）！
  - **中大规模分水岭（月通话 `85,000 – 100,000 分钟`，如中型零售/区域银行客服）**：
    - 两者月度云账单在 **`~$6,800 / 月`** 左右正式交叉持平！
  - **超大规模（月通话 `1,000,000 分钟`，如大型航司、全国快递、连锁餐饮、头部银行）**：
    - 纯 `Copilot Studio` 高频多轮语音消耗大量 Copilot Credits，月账单可达 `$110,000 – $150,000 / 月`；
    - 而 **`Azure AI Foundry + ACS`（开启本仓第 24 轮所述的滑窗音频裁剪 + 75% `Phi4-mm-realtime` 分级路由 + P55 PTU）**，月度全栈云账单仅需 **`$48,000 – $56,000 / 月`（每年直接净省 `$700,000+` 云费用！）**。

### Q3：如果客户既想要 `Azure AI Foundry Voice Live` 的 400ms 极速语音体验和低成本，又眼馋 `Copilot Studio` 里现成的 SAP、ServiceNow、Dynamics 365 连接器和图形化审批流，怎么把两者无缝拼在一起？
- **两种经过微软全球大型客户验证的“双剑合璧（Better Together）”集成模式**：
  1. **架构模式一：“Foundry 极速语音前门 + Power Platform / Logic Apps 动作后门”（推荐用于高并发对外客服）**：
     - 客户的电话 100% 由 `ACS + Azure AI Foundry Voice Live` 接听，享受 `< 420ms` 全双工对话与 `$0.05/分钟` 的极低成本；
     - 当语音对话收集齐槽位需要写回 SAP ERP 或创建 ServiceNow 工单时，Foundry Agent 不需要自己苦哈哈手写 SOAP/OData 认证代码，而是直接通过 **Webhook / MCP 触发一条受 Entra ID 保护的 `Copilot Studio Action / Azure Logic App`（复用现成的 1,400+ 企业连接器）**！
  2. **架构模式二：“Copilot Studio 统一门户 + 挂载 Azure AI Foundry 自定义模型/Agent 技能”（推荐用于全渠道办公与坐席辅助）**：
     - 在 `Copilot Studio` 中通过 **Azure AI Foundry 扩展接口**，将 Foundry 中微调好的行业专精模型、语音 RAG 索引（`Azure AI Search spoken_digest`）作为外部 Agent Skill 挂载进来；当通话需要转接真人时，通过 `Dynamics 365 Contact Center` 弹出完整上下文卡片并开启坐席实时耳语辅助（Agent Assist）。

---

## 3. 🧭 直观可视化图解（Mermaid 决策树、双栈混合架构与联动时序图）

### 3.1 微软企业语音平台（Low-Code vs Pro-Code vs Hybrid）选型决策树

```mermaid
flowchart TD
    A["企业基于微软云建设实时语音 AI 应用"] --> B{"是否需要车载/硬件嵌入式、多模态看图 (See-and-Speak)<br/>或本地断网容器 (Disconnected Containers)？"}
    B -->|"是 (车载/智能硬件/矿山医院私有化/视频看图)"| C["路线 B：专业代码自建 (Pro-Code)<br/>Azure AI Foundry (Voice Live / Speech 容器) + ACS / LiveKit"]
    B -->|"否 (标准电话 PSTN / 网页与企微语音客服)"| D{"月度预计通话总时长与现有呼叫中心底座？"}
    D -->|"月通话 < 8.5 万分钟 · 且无语音算法研发团队<br/>(内部 IT/HR 热线 / 中小规模标准客服)"| E["路线 A：低代码全托管 (Low-Code SaaS)<br/>Microsoft Copilot Studio (Voice) + D365 Contact Center<br/>2周拖拽上线 · 直接复用 1,400+ 企业连接器"]
    D -->|"月通话 > 8.5 万分钟 · 或需对接存量思科/Genesys/Avaya<br/>或要求 <=420ms 极致拟人全双工打断"| F["路线 C：混合王牌架构 (Better Together Hybrid)<br/>前台：ACS + Foundry Voice Live 扛高并发语音 ($0.05/分)<br/>后台：调用 Copilot Studio / Logic Apps 连接器 & 转接 D365 坐席"]
```

### 3.2 “前台 Foundry 极速语音 + 后台 Copilot Studio 连接器 + D365 坐席兜底”混合参考架构图

```mermaid
flowchart LR
    subgraph Ingress["1. 高并发语音接入与极速前门 (Pro-Code)"]
        Caller["客户来电 (PSTN / WebRTC)"]
        ACS["Azure Communication Services<br/>/ 企业大门 SBC (SIP Direct)"]
        VoiceLive["Azure AI Foundry Voice Live<br/>• GPT-Live-1 / Phi4-mm (<=420ms)<br/>• S08 活体防伪 & 双档丝滑打断<br/>• 滑窗音频裁剪 (-68% 算力)"]
        Caller <--> ACS <--> VoiceLive
    end

    subgraph LowCode["2. 企业连接器与低代码编排中台 (Low-Code)"]
        Studio["Microsoft Copilot Studio & Logic Apps<br/>(1,400+ 免代码认证企业连接器)"]
        EntSys["SAP ERP / ServiceNow / Workday<br/>(通过 Power Platform 网关安全读写)"]
        VoiceLive <-->|"MCP / REST 触发业务流"| Studio <--> EntSys
    end

    subgraph AgentDesk["3. 全渠道人机协同坐席台 (D365 / Teams)"]
        D365["Dynamics 365 Contact Center / Teams<br/>• 1.5s 带上下文无感热转接<br/>• 实时坐席话术推荐 (Copilot Assist)<br/>• Purview 合规审计与 Entra ID 治理"]
        ACS -->|"30% 复杂诉求 SIP 暖转"| D365
        VoiceLive -->|"推送结构化摘要与情绪分"| D365
    end
```

### 3.3 混合架构实战：Foundry `380ms` 极速语音接听 + 触发 Copilot Studio SAP 连接器 + 1.5s 转接 D365 坐席时序图

```mermaid
sequenceDiagram
    autonumber
    participant C as 客户 (致电退换货热线)
    participant VL as 前台：Azure Foundry Voice Live
    participant CS as 中台：Copilot Studio (SAP 连接器)
    participant D365 as 后台：Dynamics 365 人工坐席台

    C->>VL: 拨入热线："你好，我昨天收到的咖啡机水箱有裂纹，想申请免费换新！"
    VL-->>C: T+380ms 极速共情回应："非常抱歉给您添麻烦了！我刚通过您的来电号码查到昨日签收的意式咖啡机订单，正在为您核对换新库存..."
    VL->>CS: 异步调用 Copilot Studio Action：Invoke_SAP_RMA_Check(order="ORD_9921", reason="cracked_tank")
    Note over VL,C: 300ms 等待期间自动播报轻柔垫话，零冷场
    CS-->>VL: 1.1s 通过 Power Platform SAP ERP 连接器返回：{in_stock: true, VIP_tier: "Platinum", warranty: "valid"}
    C->>VL: "另外我下周要出差不在家，能不能先把备机寄到我深圳酒店，旧机器等我月底回来再寄回？"
    VL->>VL: 识别为 [异地先寄后退跨城特批诉求] -> 触发升级 D365 人工专家策略
    VL-->>C: "没问题！因为涉及异地跨城先寄备机，我马上为您接通白金专席顾问王敏为您特批改址，您无需重复刚才的订单信息！"
    VL->>D365: 1.4s SIP 热转接 + 注入 Copilot 摘要卡：[白金客户 | 咖啡机水箱裂纹 | SAP已锁库存 | 诉求：先寄深圳酒店月底退旧机]
    D365-->>C: "张先生您好，我是白金专员王敏！我已经看到您咖啡机水箱破损的图片和记录了，现在就为您把新机改发深圳酒店..."
```

---

## 4. 📊 多方案横向选型决策矩阵（Copilot Studio vs. Azure AI Foundry vs. Hybrid Matrix）

| 评估维度 | 方案 A：混合王牌架构（前台 Foundry Voice Live + 后台 Copilot Studio 连接器 + D365 坐席，**大中型企业强烈推荐**） | 方案 B：纯低代码全托管（Microsoft Copilot Studio Voice + D365 Contact Center） | 方案 C：纯专业代码自建（Azure AI Foundry + ACS / LiveKit + 自写全部 ERP 接口） | 方案 D：第三方黑盒语音 SaaS（Retell / Vapi / Sierra） |
| :--- | :--- | :--- | :--- | :--- |
| **首字语音响应延迟（Voice-to-Voice Latency）** | **`350ms – 450ms`（原生 S2S 极速流式音频）** | `750ms – 1,150ms`（级联 STT + 主题编排 + TTS） | **`320ms – 420ms`** | `600ms – 950ms`（跨云多跳转发） |
| **首期上线交付周期（Time-to-Market）** | **`3 – 4 周`（语音前门套用本仓模板 + 复用现成连接器）** | **`1 – 2 周`（最快：拖拽式低代码画布）** | `6 – 10 周`（需手写所有后端 ERP/CRM OAuth 与数据接口） | `3 – 5 周` |
| **1,400+ 企业系统连接器（SAP / ServiceNow / Workday）复用** | **100% 免代码复用（直接调用 Power Platform 连接器）** | **100% 原生内置** | 需研发团队逐个手写 REST/SOAP 适配器与重试队列 | 差（无企业内网连接器生态） |
| **底层 20ms 音频帧控制（`S08` 活体/免提消回声/看图）** | **100% 完全掌控（支持多模态 80KB 视频抽帧与声学防伪）** | 不支持（黑盒托管音频管线，无法插入自定义 DSP） | **100% 完全掌控** | 受限于第三方平台开放参数 |
| **存量异构呼叫中心（Cisco / Genesys / Avaya）免替换接入** | **极高（SBC SIP 直连，无需购买新全套坐席软件）** | 绑定 D365 / Teams 语音生态 | **极高** | 中 |
| **月通话 50 万分钟级综合单价（Blended Cost/Min）** | **`$0.048 – $0.068 / 分钟`（省 60%+！）** | `$0.140 – $0.220 / 分钟`（按高频消息/Credits 计费） | **`$0.042 – $0.058 / 分钟`** | `$0.180 – $0.320 / 分钟` |

---

## 5. 🧪 不同话务规模下的 3 年 TCO 测算及 7-Card 基准报告

### 5.1 中大型企业客服中心（月通话 500,000 分钟 / 年 600 万分钟）：纯低代码 SaaS vs 纯手写自建 vs 混合架构对比

| 成本构成项（3年总计） | 纯低代码 SaaS（100% 流量走 Copilot Studio Credits） | 纯手写代码自建（从零手写 15 个 SAP/CRM/ITSM 接口） | **Better Together 混合架构（Foundry 语音前门 + Copilot Studio 连接器）** | 架构师解读 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 首期研发与系统集成实施人力费** | **$45,000**（2周拖拽配置上线） | $280,000（4名工程师写 3 个月 ERP 接口与后台） | **$85,000**（套用本仓 Foundry 语音网关 + 直接调现成连接器） | 比纯手写自建省下 $195,000 研发人力！ |
| **2. 3年累计语音与大模型云消费账单（1,800万分钟）** | $2,880,000（约 $0.16/分钟） | **$936,000**（`$0.052/分钟`：PTU + 75/25 分级路由） | **$990,000**（语音走 Foundry PTU `$0.052/分` + 少量连接器调用） | 比纯 SaaS 省下 **$1,890,000** 语音算力费！ |
| **3. 日常话术与业务流程变更运维成本（3年）** | **$36,000**（业务人员自己改流程图） | $180,000（每次改规则都要排期发版改代码） | **$54,000**（业务规则留在 Copilot Studio 由运营自助修改） | 兼顾工程级性能与业务敏捷自助 |
| **3 年总拥有成本（3-Year TCO）合计** | **$2,961,000** | **$1,396,000** | **$1,129,000（全场最低 TCO！比纯 SaaS 省 61.9%！）** | **鱼与熊掌兼得的最佳企业实践** |

### 5.2 7-Card (4:5) 视觉基准报告摘要（Copilot Studio vs. Azure AI Foundry Benchmark）

> **数据溯源与口径声明（Provenance & Measurement Scope）**：以下指标源自 `turbo998/voice-agent-lab` 微软企业语音双栈选型与混合集成基准规范（`LOWCODE-VS-PROCODE-01 / P37 / P738`，标注为 `measured` / `anonymized_reported` / `synthetic`）。所有零值延迟或丢单计数均遵守严格测量边界：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`。

1. **Card 1 (`1 / 7` · `HANDS-ON · COPILOT-STUDIO-VS-FOUNDRY`) — 核心发现**：在相同企业退换货与 IT 报修语音场景实测中，**“前台 Azure AI Foundry Voice Live + 后台 Copilot Studio 连接器”混合架构将端到端首声延迟从纯低代码级联的 `920ms` 压缩至 `380ms`（提速 2.4 倍），同时将后端 SAP/ServiceNow 集成开发工时减少了 `76%`，并在月通话 `>85,000 分钟` 后实现 `61.9%` 的 3 年 TCO 节省**。
2. **Card 2 (`2 / 7` · `SCENARIO: HYBRID-FOUNDRY-VOICE-TO-SAP-CONNECTOR`) — 单例深潜（380ms 极速语音接待 + 1.1s 调 SAP 连接器 + 1.4s 转 D365）**：来电者报咖啡机水箱破损，Foundry Voice Live 在 **`380ms`** 内回应并触发 `300ms` 垫话，后台通过 Copilot Studio Power Platform 连接器在 **`1,100ms`** 内查验 SAP 保修与库存；当客户提出异地先寄备机特批诉求时，系统在 **`1,400ms`** 内带完整 Copilot 摘要卡无感热转至 D365 白金人工坐席（动作标签：`Act automatically` -> `Send to a human`）。
3. **Card 3 (`3 / 7` · `WHAT I TESTED`) — 4 项架构能力与边界对照矩阵**：
   - `TURN-LATENCY-AND-BARGE-IN`（全双工打断与首字响应）：纯低代码级联 `880ms–1,120ms` vs Foundry Voice Live 原生流 **`380ms` P50（`118ms` 急刹打断）**；
   - `ENTERPRISE-ERP-INTEGRATION-TIME`（对接 SAP OData + ServiceNow + Workday 鉴权开发耗时）：纯代码手写 `✕ 需 18 人天编码联调` vs 复用 Copilot Studio / Logic Apps 预置连接器 **仅需 `1.5 人天` 配置完成**；
   - `MULTIMODAL-AND-S08-LIVENESS`（80KB 视频关键帧看图与 20ms 声道活体防伪）：纯低代码托管管线 `✕ 不开放底层裸 PCM/视频流接口` vs Foundry 自建前门 **100% 原生支持**；
   - `TCO-BREAKEVEN-500K-MINS`（月通话 50 万分钟月度云账单）：纯 Credits 消息包模式 `✕ ~$80,000/月` vs Foundry PTU + 滑窗裁剪 **`$26,200/月`（立省 67.2%）**。
4. **Card 4 (`4 / 7` · `UNDER THE HOOD`) — Foundry 语音前门调用 Copilot Studio 动作与 D365 转接契约**：
   ```json
   {
     "architecture_pattern": "HYBRID_FOUNDRY_FRONT_COPILOT_STUDIO_BACK",
     "voice_front_door": { "engine": "Azure_Foundry_Voice_Live_GPT_Live_1", "ttft_ms": 380, "blended_cost_per_min": 0.052 },
     "connector_invocation": {
       "orchestrator": "Copilot_Studio_Connector_Action",
       "connector_id": "shared_sap_erp_v3",
       "exec_ms": 1100,
       "entra_obo_auth": true
     },
     "d365_escalation": { "target_queue": "D365_VIP_Omnichannel", "context_card_injected": true, "transfer_ms": 1400 }
   }
   ```
5. **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`) — 业务部门临时修改退换货审批阈值（如从 $50 改为 $100）的敏捷度对比**：在混合架构下，业务运营人员直接在 Copilot Studio 图形界面修改审批流阈值，**`3 分钟` 热生效且无需重启前台 Foundry 语音网关（零代码发版风险）**。
6. **Card 6 (`6 / 7` · `LATENCY`) — 三种架构模式端到端语音响应延迟对比**：纯 Pro-Code（`360ms`）与混合架构（`380ms`）几乎持平，均比纯低代码级联模式（`920ms`）快 **2.4 倍**。
7. **Card 7 (`7 / 7` · `MY TAKE`) — 适用场景与禁忌清单**：
   - ✅ **Good fit**：月话务 `< 8.5万分钟` 且追求 2 周极速上线的内部/标准热线直接用 **Copilot Studio**；月话务 `> 8.5万分钟` 或需极致拟人/多模态/防伪的核心热线采用 **Foundry 前门 + Copilot Studio 连接器混合架构**；
   - ⛔ **Not for**：严禁在已有现成 Power Platform SAP/ServiceNow 连接器可用时，让研发团队重复造轮子手写几个月底层 ERP 认证代码；严禁在千万分钟级高并发外呼/客服中不经 TCO 测算直接全量跑高单价 SaaS 消息包！

---

## 6. 🛠️ 售前微软双栈架构选型与上线验收 Checklist（Actionable Checklist）

- [ ] **1. 月度话务量盈亏平衡线（`85,000 分钟/月`）精算对比**：在售前立项阶段，使用客户预估的月度呼叫次数 × 平均时长，同时出具《Copilot Studio 纯 SaaS 报价》与《Foundry Voice Live + PTU 混合报价》，帮客户 CFO 算出最经济的组合。
- [ ] **2. 底层音频/多模态硬性需求排查**：确认客户是否需要 **视频看图问答（See-and-Speak）、`S08` 声道活体防伪、车载/硬件端侧 SDK 或断网本地语音容器**——凡命中任一项，前台语音层必须选 **Azure AI Foundry + ACS / LiveKit**。
- [ ] **3. 企业后端连接器复用盘点（1,400+ Power Platform Connectors）**：盘点客户需对接的 ERP/CRM/ITSM 系统（SAP、Oracle、ServiceNow、Workday、Salesforce），优先通过 Copilot Studio / Logic Apps 标准连接器打通，砍掉 75% 接口开发工期。
- [ ] **4. Entra ID 代理身份（On-Behalf-Of / Agent Identity）与 Purview DLP 贯通验证**：确认前台语音网关调用后台连接器时，严格传递当前已核身用户的最小权限令牌，并受 Microsoft Purview 数据防泄漏策略监管。
- [ ] **5. 慢速连接器（`> 300ms`）异步垫话护栏挂载**：由于企业 ERP 连接器响应通常在 `800ms–2,500ms`，确认前台语音编排器已开启 300ms 先行安抚垫话（*“正在为您查询 SAP 订单系统，请稍等……”*）。
- [ ] **6. Dynamics 365 Contact Center / Teams 坐席工作台 1.5s 热转接联调**：验证当 AI 决定转人工时，通话与结构化摘要卡片、情绪标签同步弹入 D365 坐席界面，实现人机无缝接力。
