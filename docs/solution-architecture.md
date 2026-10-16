# 企业级 Voice Agent 方案设计与三大参考架构指南

> **文档定位**：从解决方案架构师（Cloud Solution Architect）与前线部署工程师（Forward Deployed Engineer）视角，系统化定义企业级 Voice Agent 的三大技术架构范式、多模型协同路由（Constellation Routing）、关键事务安全边界与混合云/容器部署规范。

---

## 1. 架构选型总览：三大主流技术范式对比

在企业级 Voice Agent 落地过程中，不存在“一套架构打天下”。我们需要根据客户对 **端到端延迟、情绪与副语言感知、文本级合规审计、电信 PSTN/SIP 集成速度、以及单分钟 TCO** 的优先级，从以下三大参考架构中精准选型或组合：

| 架构维度 | 范式 A：Native S2S 端到端实时流式架构 | 范式 B：Enterprise Cascaded 企业级级联编排架构 | 范式 C：Hybrid Best-of-Breed 商业编排 + Azure 底座 |
| :--- | :--- | :--- | :--- |
| **核心技术栈** | `Azure Voice Live API` + `gpt-live-1` / `gpt-realtime-2` + 旁路推理 (`gpt-4.1-mini` / `gpt-5.4`) | `Azure AI Speech (Streaming STT / MAI-transcription-2)` + `Foundry Agent` + `DragonHDFlash / TTS HD 3.0` | `Retell AI / LiveKit Agents` (SIP/Turn-taking/Flow) + `Azure AI Foundry` (RAG / Guardrail / 私有数据面) |
| **端到端延迟 (TTFA P50)** | **350 ms – 590 ms**（极致自然） | **650 ms – 1,100 ms**（流式分段优化后） | **500 ms – 800 ms**（取决于跨云 Webhook 距离） |
| **打断与抗噪能力** | **原生声学+语义全双工**（精准识别咳嗽、附和与插话） | 依赖 VAD 静音阈值（100–5000ms）+ 语义断句分类器 | 编排平台专利 Turn-taking 模型 + 节点级打断控制 |
| **情绪理解与语音表现力** | **原生理解叹气、焦急语调并动态调整语气** | 文本中间层丢失原始声学情绪，需额外情感分析模型辅助 | 取决于所挂载 TTS（可挂载 ElevenLabs / Azure HD Voices） |
| **可解释性与文本合规审计** | 音频直出，需依赖旁路转写与工具门禁保障确定性 | **100% 文本中间层可见**，支持在 TTS 合成前做正则/PII/合规词过滤 | 显式 Conversation Flow 节点状态机，每步跳转可追踪 |
| **专有词表与自定义发音** | 依赖 Prompt 与旁路工具归一化（如 `lookup_beverage_menu`） | **原生支持 Custom Speech 短语表 + SSML / Custom Lexicon 音标控制** | 支持 Boosted Keywords 与 TTS 发音替换规则 |
| **私有化与混合部署能力** | 云端 Global / DataZone 托管（通过可信后端代理 WebRTC/WSS） | **支持 Azure Speech 本地 Docker 容器（联网计量或离线许可）** | 语音编排在 SaaS（或自托管 LiveKit），核心知识与数据留在 Azure VNet |
| **首选适用场景** | 智能零售点单、VIP 伴随式顾问、高情绪互动客服 | 银行保险强合规热线、医疗分诊、政企内网服务台 | 出海企业快速接通全球本地电话号码（PSTN/SIP）+ 国内中文后台运营 |

---

## 2. 三大参考架构深度解析

### 2.1 范式 A：Native S2S 三平面全双工架构（Azure Voice Live API + `gpt-live-1`）

这是目前交互体验最接近真人的旗舰架构。为了解决纯端到端语音模型“容易产生业务幻觉、难以直接安全操作数据库”的痛点，我们设计了 **“控制平面 + 媒体平面 + 旁路推理与工具治理平面”** 的三平面解耦架构（已在 `turbo998/gpt-live-1-demo` 与 `https://gpt-live-demo-0922-qc.azurewebsites.net/` 实装验证）：

```mermaid
flowchart TB
    subgraph Client["客户端接入层 (Browser / Mobile / Kiosk)"]
        UI["三语交互工作台 & 实时字幕"]
        WebAudio["WebRTC Audio Track & 声波遥测"]
    end

    subgraph ControlPlane["平面 1：可信控制与认证平面 (Azure App Service / ACA)"]
        Auth["运营会话鉴权 / CSRF / 并发租约门禁"]
        MI["Azure Managed Identity (无 API Key 零密钥泄露)"]
        SDP["SDP 协商代理 (/live/sessions)"]
    end

    subgraph MediaPlane["平面 2：全双工实时语音媒体平面 (Azure Voice Live)"]
        LiveModel["gpt-live-1 / gpt-realtime-2<br/>原生全双工音频流 · 语义 VAD · 抗附和/抗咳嗽"]
    end

    subgraph SidecarPlane["平面 3：旁路确定性推理与工具执行平面 (Sidecar Engine)"]
        Router["快速路由与同音词归一化<br/>(Microsoft-Decision-1 / lookup_beverage_menu)"]
        Reasoner["受控业务推理与知识检索<br/>(gpt-4.1-mini + Azure AI Search)"]
        Gate["事务写门禁与预览锁<br/>(preview_service_order: committed=false)"]
        Delivery["SpeechDelivery 分段投递状态机<br/>(>220字符等待用户安静窗口再播报)"]
    end

    UI -->|1. 请求创建受保护会话| Auth
    Auth -->|2. 托管身份获取 Entra Token| MI
    MI -->|3. 初始化会话配置与工具契约| SDP
    SDP -->|4. 协商 SDP Offer/Answer| LiveModel
    WebAudio <-->|5. 浏览器直连低延迟 WebRTC 音频流| LiveModel
    LiveModel -->|6. 触发函数调用事件| Router
    Router --> Reasoner
    Reasoner --> Gate
    Gate -->|7. 返回结构化预览结果与工单草稿| Delivery
    Delivery -->|8. 注入受控语音摘要| LiveModel
    Gate -.->|9. 需人工或客户显式确认后才落库| UI
```

#### 核心架构设计亮点：
1. **媒体流直连、控制流收口**：浏览器完成 SDP 握手后，WebRTC 音频流直连 Azure 边缘媒体节点（消除应用服务器中转音频带来的 150–300ms 额外抖动），同时模型凭据 100% 留在服务端（使用 Managed Identity 动态签发 Entra ID 令牌，浏览器零密钥）。
2. **说话与做事分离（Voice-Action Decoupling）**：`gpt-live-1` 专注于低延迟接话、打断处理与安抚话术（Filler Speech，如“好的，我马上帮您查一下这笔订单”），耗时或需要严谨计算的查询交由旁路 `gpt-4.1-mini` 与确定性 TypeScript 工具执行。
3. **`SpeechDelivery` 长文本防冲突投递机**：当后台工具返回超过 220 字符的复杂排障说明时，系统不会在客户正在插话时强行朗读，而是监控声学安静窗口分段播报，并在客户打断时优雅降级为界面卡片展示。

---

### 2.2 范式 B：Enterprise Cascaded + Constellation 多模型路由架构

针对金融、保险、政企等要求 **“合成出来的每一个字都必须先经过合规审查”** 或 **“需要本地容器混合部署”** 的场景，我们采用对标 Sierra Constellation 理念的 **多模型路由级联架构**：

```mermaid
flowchart LR
    subgraph Ingress["全渠道语音接入"]
        PSTN["PSTN / SIP Trunk"]
        ACS["Azure Communication Services<br/>(Call Automation / WebRTC)"]
    end

    subgraph SpeechLayer["语音感知与合成层 (云端或本地容器)"]
        STT["Azure Streaming STT<br/>(MAI-transcription-2 / Custom Speech)"]
        TTS["Azure Neural HD TTS<br/>(DragonHDFlash / Custom Neural Voice)"]
    end

    subgraph Constellation["Azure Constellation 多模型路由与护栏大脑"]
        GuardIn["输入护栏与 PII 脱敏<br/>(Azure AI Content Safety)"]
        FastRouter["毫秒级意图/动作路由器<br/>(Microsoft-Decision-1 / gpt-5.4-mini)"]
        Workhorse["主力工具与 RAG 引擎<br/>(gpt-4.1-mini + AI Search)"]
        Supervisor["复杂升级与合规监督模型<br/>(gpt-5.4-pro / gpt-5.6-sol)"]
        GuardOut["输出合规锁与 SSML 注入<br/>(确定性 Policy Engine)"]
    end

    PSTN --> ACS
    ACS -->|PCM 音频流| STT
    STT -->|recognizing / recognized 增量文本| GuardIn
    GuardIn --> FastRouter
    FastRouter -->|置信度 >= 0.90 自动执行| Workhorse
    FastRouter -->|置信度 0.50-0.89 需确认| Supervisor
    Workhorse --> GuardOut
    Supervisor --> GuardOut
    GuardOut -->|合规文本 + SSML 韵律标签| TTS
    TTS -->|首包 155ms 音频流| ACS
```

#### 核心架构设计亮点：
1. **三级置信度门禁（Auto / Confirm / Human Escalate）**：
   - 使用轻量级决策模型（如我们在订阅中实测的 `Microsoft-Decision-1` 与 `gpt-5.4-mini`）在 **80–160ms** 内输出结构化置信度分布：
   - **Confidence $\ge 0.90$ (`Act automatically`)**：直接执行只读查询（查目录、查绑定订单、标准 2.4GHz 排障）。
   - **$0.50 \le$ Confidence $< 0.90$ (`Confirm`)**：生成不可变版本草稿（`draft_support_ticket` / `preview_service_order`），要求客户二次确认或运营主管审批。
   - **Confidence $< 0.50$ 或触发物理安全红线 (`Send to a human`)**：立即熔断 AI 自助流程，执行 Warm Transfer 转接人工坐席并推送完整上下文摘要。
2. **DragonHDFlash 超低延迟高自然度 TTS**：
   - 采用最新一代 `DragonHDFlash`（如 `hdflash_xiaoqi`），在呼叫中心多轮盲测中 MOS 分高达 **4.34**（超越真人坐席录音基准 4.08），同时首字节合成延迟（`SynthesisFirstByteLatencyMs`）控制在 **~155ms**。

---

### 2.3 范式 C：Hybrid Best-of-Breed 混合架构（Retell AI + Azure AI Foundry 私网底座）

许多出海企业既看重 **Retell AI** 极致的海外电话网（Twilio/Telnyx SIP）开箱即用体验与可视化 Conversation Flow 节点编辑器，又必须遵守母公司或跨国监管对 **客户数据隐私、企业私有知识库（Azure AI Search）与 Azure 统一账单/私网治理（VNet + Private Endpoint）** 的要求。本仓库 (`turbo998/voice-agent-lab`) 完整实现了这一生产级混合参考架构：

```mermaid
flowchart TB
    subgraph Overseas["海外客户侧与语音编排层"]
        Customer["东南亚英语客户 (Browser Web Call)"]
        Retell["Retell AI Conversation Flow<br/>显式节点图 · Turn-taking · 实时字幕 · 主管接管"]
    end

    subgraph OperatorCN["国内中文运营中心"]
        OpUI["中文运营与审批工作台 (React 19)<br/>客户绑定 · 工单版本审批 · 回访同意核验 · 预算监控"]
    end

    subgraph AzurePrivate["Azure 受治理私网数据与推理底座 (Southeast Asia VNet)"]
        Gateway["Retell Signed Gateway & Operator Server<br/>(原始字节 HMAC 签名校验 · 幂等事件 Inbox · 租约门禁)"]
        Foundry["Azure AI Foundry (Prompt Agent + Responses API)<br/>严格 JSON Schema 输出 · 强制 K01-K12 来源引用"]
        Search[("Azure AI Search<br/>受控产品与安全知识库")]
        BlobCAS[("Azure Blob Storage (ETag CAS)<br/>Private Endpoint · 禁用公网与共享密钥")]
        Queue[("Azure Storage Queue<br/>异步通话后分析 Worker")]
        KV[("Azure Key Vault<br/>Private Endpoint · RBAC 版本化密钥")]
    end

    Customer <-->|WebRTC 英语语音交互| Retell
    Retell -->|Signed Custom Functions & Webhooks| Gateway
    OpUI <-->|HTTPS + HttpOnly Cookie + CSRF| Gateway
    Gateway -->|Managed Identity| Foundry
    Foundry --> Search
    Gateway -->|Private DNS + Private Endpoint| BlobCAS
    Gateway -->|Private DNS + Private Endpoint| Queue
    Gateway -->|Private DNS + Private Endpoint| KV
```

#### 六大企业级工程硬核边界（已在 `tests/*.test.ts` 66 项测试中 100% 验证）：
1. **原始字节签名与防重放（Raw-body Signature & Timestamp Verification）**：所有来自 Retell 的工具调用与 Webhook 必须先通过指定 Signer 的原始字节签名与时间窗校验，再执行持久化的 `Accept-Before-ACK` 去重投递。
2. **乱序事件防护（Out-of-order Event Immunity）**：迟到的 `call_started` 事件绝不会把已进入 `call_analyzed` 或 `ended` 终态的通话状态回滚。
3. **打断不等于事务回滚（Voice Barge-in $\neq$ Transaction Rollback）**：用户挂断电话或中途插话不会导致半途而废的脏写，也不允许已结束或已被人工接管（Takeover）的会话继续执行迟到的业务写入。
4. **防提示词注入越权（Anti-Prompt Injection via Strict Zod Schemas）**：工具参数 Schema（`packages/business-core/contracts.ts`）显式剥离身份字段（不允许模型在参数中传入 `customerId` 或 `approved: true`），所有身份与审批状态仅从服务端可信存储（Blob ETag CAS）读取。
5. **不可逆主管接管状态机（Irreversible Supervisor Takeover）**：一旦主管触发接管，AI 永久停止向该通话注入后续工具结果，若供应商侧接管状态返回不确定（Uncertain），系统自动进入 Fail-closed 保护态。
6. **原子预算租约与自动关停控制（Atomic Budget Lease & Independent Deactivation Controller）**：通话创建前原子预留额度上限，未知异常绝不盲目释放并发名额；独立控制器 Job 在运行窗口到期后自动将 Container Apps 副本停用归零（Deactivate Revision）。

---

## 3. 架构师选型决策树（Presales Decision Tree）

在售前咨询现场，可通过以下 4 个问题在 3 分钟内帮客户锁定目标架构：

1. **Q1：业务是否要求 100% 本地内网不出网（或仅允许计费元数据出站）？**
   - **是** $\rightarrow$ 选择 **范式 B（Azure Speech 本地容器 + 内网/专线大模型）**。注意遵守 `*.cognitive.microsoft.com` 与 `*.cognitiveservices.azure.com` 的 TCP 443 出站计量白名单（每 10–15 分钟上报一次，不上传音频与文本），或申请 Disconnected Containers 离线承诺包。
2. **Q2：场景是否高度依赖副语言特征（情绪识别、叹气、背景噪音过滤、高频自然打断）且追求 <550ms 极致交互？**
   - **是** $\rightarrow$ 选择 **范式 A（Azure Voice Live API + `gpt-live-1` 三平面架构）**，通过旁路 `gpt-4.1-mini` 处理确定性工具与预览门禁。
3. **Q3：客户是否已经有现成的海外电话外呼团队在使用 Retell AI / LiveKit，或者希望 1 周内快速上线跨国 SIP 电话流程？**
   - **是** $\rightarrow$ 选择 **范式 C（Retell AI / LiveKit + Azure AI Foundry 混合架构）**，不强行要求客户推翻前端语音编排，而是用 Azure AI Foundry + AI Search + Private VNet 承接核心 RAG 诊断、安全合规护栏与工单系统集成（Co-sell 最佳切入点）。
4. **Q4：场景是否为金融/医疗等高合规标准流程，需要对每个合成句子做精确 SSML 发音控制与事前文本过滤，且追求最低单分钟成本？**
   - **是** $\rightarrow$ 选择 **范式 B（Azure Streaming STT + Constellation 多模型路由 + DragonHDFlash TTS）**。
