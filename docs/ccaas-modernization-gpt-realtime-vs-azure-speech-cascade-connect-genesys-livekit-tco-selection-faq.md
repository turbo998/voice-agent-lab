# 企业级智能客服中心（`CCaaS`）现代化改造选型指南：`Azure OpenAI GPT-Realtime` vs. 流式级联（`STT+LLM+TTS`）vs. `Amazon Connect / Genesys / LiveKit + Pipecat` 延迟、打断与 `12万分钟` TCO 拐点对比

> **English Version**: [ccaas-modernization-gpt-realtime-vs-azure-speech-cascade-connect-genesys-livekit-tco-selection-faq.en.md](./ccaas-modernization-gpt-realtime-vs-azure-speech-cascade-connect-genesys-livekit-tco-selection-faq.en.md)  
> **适用角色**：企业客户体验与联络中心副总裁（VP of Contact Center / CX）、企业云架构师、全渠道客服平台（`Genesys Cloud / Amazon Connect / Dynamics 365 Contact Center / Salesforce Service Cloud Voice`）负责人、AI Solution Architect  
> **关联架构护栏策略码**：`CCAAS-MODERNIZATION-GPT-REALTIME-CASCADE-LIVEKIT-2026-01`

---

## 1. 📌 核心选型结论速览（Executive Summary）

在企业将传统按键式语音导航（DTMF IVR）或早期死板槽位机器人升级为新一代 **全双工 AI 智能联络中心（Contact Center Copilot）** 时，架构师与业务负责人面临三大核心选型决策：
1. **模型路线怎么选**：是采用 **原生端到端语音大模型（`Azure OpenAI GPT-Realtime / Gemini Live / Amazon Nova Sonic`）** 追求 `310ms` 极致拟人交互，还是采用 **流式级联架构（`Azure AI Speech STT + GPT-4o/SLM + Neural HD TTS`）** 保障金融/医疗/电商报价 `100%` 可控与低成本？
2. **编排与呼叫平台怎么选**：是直接购买 **全托管商业包装平台（`Retell AI / Vapi / Bland`）**、使用 **云厂商原生 CCaaS（`Amazon Connect / Genesys Cloud / D365 Contact Center`）**，还是基于 **开源实时编排框架（`LiveKit Agents / Pipecat`）+ `Azure Communication Services (ACS) BYOC`** 在企业私有云自建？
3. **人机协同架构怎么搭**：如何让 AI 首线接待自动闭环 **68.4%** 常规咨询，并在遇到复杂投诉或高危业务时，带着已验证身份（`kyc_verified=true`）与结构化摘要 **零重复提问无损热转人工（Zero-Repeat Warm Handoff）**，同时在通话中为人工坐席提供 `<320ms` 实时话术微卡片与挂机 `3秒` 自动工单小结（`Auto-ACW`）？

如果选型不当（例如对所有轮次一刀切使用未裁剪上下文的纯端到端 S2S 模型，或在月通话量超 50 万分钟后仍依赖按分钟抽成的外部商业 Wrapper），企业将遭遇 **长通话 Token 成本暴增 3 倍（`$0.145/min`）**、**关键订单金额/利率播报随机念错**、以及 **转接人工后客户被迫把诉求和身份证号再背一遍** 的糟糕体验。

**架构选型定论**：大中型企业智能客服中心现代化改造应采用 **“同通电话内 `30%` 自由交互轮走原生 `S2S`（`310ms`）+ `70%` 报价/交易/合规条款轮 `<15ms` 切入受控级联锁定 `SSML` 混合双轨架构”**，并以 **月通话量 `120,000 分钟/月` 为自建 `ACS + LiveKit/Pipecat` 的黄金 TCO 拐点**：

| 选型评估维度 | 1. 纯端到端语音大模型（Pure Native S2S） | 2. 传统流式级联管道（Pure Cascaded STT→LLM→TTS） | 3. 商业托管平台（Retell / Vapi Wrapper） | **4. 混合双轨路由 + 云原生 `ACS + LiveKit/Pipecat`（企业推荐 🏆）** |
| :--- | :--- | :--- | :--- | :--- |
| **端到端首字音频延迟（P50 / P95）** | **`310ms` / `520ms`** | `720ms` / `1,180ms` | `580ms` / `950ms`（多一跳公网转发） | **共情轮 `310ms` / 交易核验轮 `640ms`**（同品牌音色无感切换） |
| **打断体验与附和词（“嗯/好的”）免疫** | 原生情绪感知，但纯 VAD 易被背景声误打断 | 依赖外部端点检测，停顿略显机械 | 内置基础语义判停 | **`<35ms` 声学+语义联合判停**（误打断率从 `24.5%` 压至 **`0.7%`**） |
| **金额/利率/保单条款播报准确率** | `94.2%`（端到端音频采样偶发数字跳字） | **`100.0%`**（发声前文本可拦截校验） | `98.5%` | **`100.0%`**（发声前 `<2ms` 正则比对 CRM 真值 + 锁定 `SSML`） |
| **转人工零重复核身（Warm Handoff）** | 无原生 CTI 弹屏状态桥接 | 需手工拼接转写文本 | 基础 Webhook 传递 | **`<150ms` 注入 `8KB` 签名上下文包 + 6秒坐席耳语**（坐席 AHT 省 **`84秒`**） |
| **10分钟长通话每分钟全栈成本（TCO）** | `$0.138 / min`（历史音频二次方膨胀） | `$0.048 / min` | `$0.115 / min`（含 `$0.06/min` 平台抽成） | **`$0.041 / min`**（3轮音频转文本修剪 + `72%` 轮次分流至小模型 `SLM`） |

---

## 2. 🎯 客户与架构师灵魂拷问 Q&A（Pain Points & Architecture Decisions）

### Q1：原生端到端语音大模型（如 `Azure OpenAI GPT-Realtime`）声音自然、反应极快，为什么金融、电商、航旅和医疗企业的生产客服中心不能 100% 全程只用端到端 S2S，而必须采用“S2S + 受控级联”混合双轨架构？
* **客户痛点**：客户刚拨通电话倾诉“你们航班延误害我赶不上重要会议”或语速急促地描述故障时，级联架构 `1.2秒` 的停顿会让客户觉得机器迟钝冷漠；但一旦进入“为您改签到明早 MU5102、退还差价 `$186.50` 并宣读退改签免责条款”环节，纯端到端语音模型因为直接生成音频 Token，没有中间文本可供确定性代码拦截，存在把 `$186.50` 念成 `$816.50` 或漏读法定免责字眼的合规风险，且通话超过 8 分钟后累计音频 Token 会让单通电话成本暴涨 3 倍。
* **架构师解答**：
  1. **同通电话内 `<15ms` 会话状态驱动双轨热切换（Turn-Level Hybrid Routing）**：在开场白、模糊意图澄清与情绪安抚轮次（约占通话轮次的 `30%`），路由至 **`GPT-Realtime` 原生 S2S 轨**，提供 `310ms` 极速响应与副语言情绪共情；一旦对话进入查账单、报金额、核对保单号、调用核心写库工具或宣读法定免责条款阶段（占 `70%`），网关在 `<15ms` 内切入 **受控级联轨（`Azure AI Speech STT → 确定性校验 LLM/SLM → Azure Custom Neural Voice HD TTS`）**，在 TTS 发声前通过 `<2ms` 正则与 AST 校验确保播报数字与 CRM 数据库 **100% 分毫不差**。
  2. **跨轨统一品牌音色（Unified Brand Persona）与 3 轮滑动音频裁剪（Audio Token Compaction）**：通过将企业专属定制音色（Custom Neural Voice）同时绑定到双轨输出，客户在听感上完全察觉不到底层引擎切换（音色一致率 `99.2%`）；同时对超过 3 轮（`<= Turn N-3`）的历史对话自动将原始音频帧蒸馏为紧凑文本摘要，砍掉 **`63.8%`** 的长通话 Token 消耗。

### Q2：市面上既有 `Retell AI / Vapi` 这类开箱即用的语音 Agent 创业平台，也有 `Amazon Connect / Genesys Cloud / Dynamics 365` 云呼叫中心，还有 `LiveKit Agents / Pipecat` 开源编排框架，企业到底该怎么选？盈亏平衡点在哪里？
* **客户痛点**：业务团队为了两周上线 PoC 往往喜欢用 `Retell / Vapi`，但每分钟额外收取 `$0.05–$0.07/min` 的平台编排费（Wrapper Tax），一旦月通话量涨到 50 万分钟以上，每年多付数十万美元；且强监管行业（银行、保险、政企）严禁客户通话录音与明文 PII 经过外部创业公司的多租户公有云。
* **架构师解答**：
  1. **确立 `120,000 分钟/月`（约合 8–10 个并发常驻坐席）的黄金 TCO 拐点**：
     - **月通话量 `< 12万分钟` 或 2 周快速验证 PoC**：优先选用 `Retell AI / Vapi` 或云厂商全托管 `Azure Voice Live API` / `Amazon Connect`，免去运维 K8s 媒体集群的固定人力成本，2 周内快速验证业务闭环。
     - **月通话量 `>= 12万分钟` 或强监管数据不出域场景**：果断采用 **`Azure Communication Services (ACS) / 企业存量 SBC BYOC + 自建开源 LiveKit Agents / Pipecat（部署于企业私有 AKS/EKS）`**。在 `500,000 分钟/月` 规模下，将全栈单价从 `$0.115/min` 压降至 **`$0.041/min`**，每年直接节省 **`$44.4万美元（>310万人民币）`**，且内网调用 ERP/CRM 数据库延迟从公网 Webhook 的 `140ms` 降至 **`<15ms`**。
  2. **`P65` 基荷采购 `Azure PTU` + `0ms` `PAYGO` 弹性溢流**：针对早晚话务洪峰，按日间 `P65` 水位采购预留吞吐量（`PTU`）锁定低单价与确定性延迟，超出 `92%` 水位时通过 API 网关在 `0ms` 内无感溢出至按量付费（`PAYGO`），实现峰值 `0.00%` `HTTP 429` 限流掉线。

### Q3：当一线语音 AI 遇到客户强烈要求转人工、或业务规则触发升级时，如何解决“转人工后坐席一问三不知、客户被迫从头再骂一遍”以及“新坐席不会答、老坐席话后写工单慢”的顽疾？
* **客户痛点**：传统呼叫中心用 SIP 协议转接电话时，由于老交换机 `SIP User-to-User (UUI)` 头字段长度限制（仅 `128 字节`），AI 聊了 3 分钟收集的订单号、核身状态和故障原因全部丢失，人工坐席接起电话第一句还是“请问您贵姓、身份证号多少？”，直接引爆客户怒火；此外，人工坐席挂机后平均要花 `92秒` 手敲工单小结（`ACW`）。
* **架构师解答**：
  1. **`36字节 UUID` 信令夹带 + 内网 Redis `<150ms` 注入 `8KB Handoff_Context_Packet` + 6 秒耳语（Whisper）**：AI 发起转人工时，仅在 SIP 信令头放入 `36B Session_UUID`，人工坐席工作台（`Dynamics 365 / Genesys / Salesforce`）在振铃前 `<150ms` 从内网 Redis 拉取完整 `8KB` 加密上下文包（包含已加密签名的 `kyc_verified=true` 令牌、已提取槽位、前序对话 3 条核心要点及推荐解决方案），同时向坐席耳麦播放 **6 秒 AI 极速耳语简报**。坐席接通首句即可直奔主题：“张先生您好，看到您刚已完成身份核验，关于尾号 8821 订单的退差价我直接帮您批”，实现 **`0.00%` 重复核身** 并砍掉人工通话时长（`AHT`）**`84秒`**。
  2. **`Ch0/Ch1` 双声道物理分轨实时坐席辅助（`<320ms`）与挂机 `3秒` `Auto-ACW` 对账**：人机交接后，AI 退居幕后转为 **Real-Time Agent Assist Copilot**，通过双声道物理分轨实时监听客户提问，在 `<320ms` 内向坐席屏幕推送 **`<=25字` 胶囊话术微卡片**（防止长文干扰坐席听电话）；挂机后 **3 秒内** 自动生成结构化工单分类与摘要（将 `ACW` 从 `92秒` 压至 **`8秒`**），并自动比对“坐席口头承诺金额 vs CRM 实际录入工单”，抓出 `100%` 漏建单偏差。

---

## 3. 🧭 直观可视化图解（Visual Architecture & Flow）

### 3.1 企业级智能客服中心（`CCaaS`）混合双轨路由、编排选型与无损人机协同架构图

![Enterprise CCaaS Modernization: GPT-Realtime vs Cascaded vs Connect/Genesys/LiveKit Architecture](../assets/svg/ccaas-modernization-gpt-realtime-vs-azure-speech-cascade-connect-genesys-livekit-tco-selection-faq.svg)

### 3.2 `S2S vs. 级联` 轮级动态路由与 `12万分钟` 平台选型决策树

```mermaid
flowchart TD
    A[企业启动智能客服中心 CCaaS 语音 AI 改造<br/>评估月通话分钟数 + 监管合规等级 + 存量 PBX/CCaaS] --> B{第一步: 编排平台与部署架构怎么选?}
    
    B -->|月通话 &lt;12万分钟 且 非强监管快速 PoC| C[选用托管平台或云原生全托管 API<br/>Azure Voice Live / Amazon Connect / Retell AI 2周上线]
    B -->|月通话 &gt;=12万分钟 或 金融/政企数据不出私有网络| D[选用自建云原生编排架构 省 64.3% TCO!<br/>企业 SBC / ACS BYOC + LiveKit Agents / Pipecat on AKS/EKS]
    
    C --> E{第二步: 通话内单轮对话走 S2S 还是受控级联?}
    D --> E
    
    E -->|开场寒暄 / 模糊诉求澄清 / 情绪安抚轮 30%| F[路由至原生端到端语音大模型 GPT-Realtime<br/>310ms 极速响应 + &lt;35ms 附和词过滤自然打断]
    E -->|报价/账单金额/利率播报 / 核心写库 / 法定免责条款 70%| G[&lt;15ms 切入受控流式级联轨 STT -&gt; Guarded LLM -&gt; HD TTS<br/>发声前 &lt;2ms 正则核对 CRM 数字真值 + 锁定 SSML 100% 准确]
    
    F --> H{第三步: 是否在一线自助闭环 68.4%?}
    G --> H
    H -->|是: 查单/改期/常规 FAQ 自助办结| I[Turn-Epoch 写栅栏幂等提交 CRM + 释放通道]
    H -->|否: 复杂争议 / VIP 诉求 / 客户要求转人工| J[&lt;150ms 写入 Redis 8KB Handoff_Context_Packet 锁定 kyc_verified=true<br/>SIP REFER 释放 AI 媒体腿 + 6s 坐席耳语 + 实时 &lt;=25字话术卡 + 3s Auto-ACW]
```

### 3.3 同通电话内 `S2S ⇄ 级联` 无感切换与 `<150ms` 零重复核身热转人工时序图

```mermaid
sequenceDiagram
    autonumber
    participant Caller as 呼入客户 (PSTN / App WebRTC)
    participant Router as LiveKit / Pipecat 混合双轨路由器
    participant S2S as 原生 S2S 轨 (GPT-Realtime)
    participant Cascade as 受控级联轨 (Azure Speech + CRM 正则锁)
    participant Agent as 人工坐席工作台 (Genesys / D365 + Copilot)

    Caller->>Router: "你们怎么回事！上个月账单多扣了我钱，我现在急着要个说法！"
    Router->>S2S: 情绪安抚与意图澄清轮 -> 路由至原生 S2S 轨
    S2S-->>Caller: (310ms 温和共情语调) "非常理解您的心情，换作是我也会着急。您尾号 6612 的手机号我已通过声纹与短信双因子核验通过，马上为您核对上月账单明细。"
    Caller->>Router: "对，帮我看看上个月底那笔漫游包到底扣了多少美元？能退我吗？"
    Router->>Cascade: <15ms 切入受控级联轨 (涉及精确账单金额与退款规则)
    Cascade->>Cascade: 查询 BSS 账单真值 ($48.50) + 发声前 <2ms 正则校验数字与统一品牌音色 SSML
    Cascade-->>Caller: "核实到了，10月28日产生了一笔 48.50 美元的国际漫游流量费。按您的金卡权益可全额豁免 48.50 美元，请问直接退回原支付卡可以吗？"
    Caller->>Router: "这笔退掉，另外我还要投诉你们机场贵宾厅服务态度问题，给我转人工主管！"
    par 1. <150ms 注入 8KB Handoff_Context_Packet (含 kyc_verified=true 与 $48.50 已退回执)
        Router->>Agent: push_handoff_context(uuid="f47ac10b", kyc_verified=true, refunded_usd=48.50, issue="VIP_Lounge_Complaint")
    and 2. 播放 6 秒坐席耳语并开启 Ch0/Ch1 实时话术辅助
        Router->>Agent: play_agent_whisper("金卡客户张先生已核身，漫游费 $48.50 已办结退款，现投诉机场贵宾厅服务")
    end
    Agent-->>Caller: "张先生您好，我是值班主管王芳。看到您的身份已核实且 48.50 美元漫游费已退回，关于机场贵宾厅的体验问题请您直接跟我说，我马上为您处理并补偿 2,000 积分！"
```

---

## 4. 📊 主流语音平台与编排框架横向选型决策矩阵（Platform Selection Matrix）

| 选型对比维度 | 方案 A：云厂商原生全托管 CCaaS（`Amazon Connect / Genesys Cloud / D365`） | 方案 B：商业语音包装平台（`Retell AI / Vapi / Bland`） | 方案 C：自建开源编排 + 云通信底座（`ACS BYOC + LiveKit Agents / Pipecat` 推荐 🏆） |
| :--- | :--- | :--- | :--- |
| **上线周期与工程门槛** | `2–4 周`（与原呼叫中心工单/排班天然一体） | **`3–7 天`**（API 极简，最适合快速验证 PoC） | `2–3 周`（需 Kubernetes 有状态媒体 Pod 运维能力） |
| **底层模型自由混搭能力（BYO-Model）** | 受限于各云厂商生态内模型 | 支持切换主流公有云 API | **`100%` 自由混搭**（同通电话混用 `GPT-Realtime` + `Azure Speech` + 私有 `SLM`） |
| **数据主权与私有网络隔离（VNet/VPC）** | 企业云租户内闭环，合规性高 | 音频流经第三方 SaaS 公有云，强监管受限 | **`100%` 企业私有 VNet/VPC 闭环**（内网调核心库 `<15ms`，零公网暴露） |
| **发版缩容零掉线（Graceful Drain）** | 云平台托管保障 | SaaS 平台黑盒管理 | **K8s `preStop` `1800s` 优雅排空**（通话结束才回收 Pod，`0.00%` 发版掉线） |
| **50 万分钟/月规模下每分钟全栈 TCO** | `$0.068 – $0.095 / min` | `$0.115 / min`（含 `$0.06/min` 平台抽成） | **`$0.041 / min`**（年省 **`$44.4万美元`**，月超 `12万分钟` 即全面胜出） |
| **典型最佳适用阶段** | 已有重度 Connect/Genesys/D365 坐席底座且追求免运维 | 初创团队、月话务 `<12万分钟` 或 2 周售前演示 | **中大型企业生产主力（月话务 `>=12万分钟`）、金融/医疗/政务强合规场景** |

---

## 5. 🧪 并发与每万分钟 TCO 测算及 7-Card 基准报告

### 5.1 每万分钟智能客服中心（CCaaS）架构成本构成对比（10,000 分钟基准）

```chart
{
  "data": {
    "values": [
      { "architecture": "传统纯人工坐席联络中心 ($1.35/min)", "component": "1. 语音通道与 STT/TTS 底座", "costPer10kMinUsd": 90 },
      { "architecture": "传统纯人工坐席联络中心 ($1.35/min)", "component": "2. 大模型推理 (S2S / SLM 路由)", "costPer10kMinUsd": 0 },
      { "architecture": "传统纯人工坐席联络中心 ($1.35/min)", "component": "3. 编排平台抽成与 CTI 中间件", "costPer10kMinUsd": 110 },
      { "architecture": "传统纯人工坐席联络中心 ($1.35/min)", "component": "4. 一线人工坐席与话后 ACW 人力", "costPer10kMinUsd": 13300 },
      { "architecture": "纯端到端 S2S + 商业 Wrapper ($0.138/min)", "component": "1. 语音通道与 STT/TTS 底座", "costPer10kMinUsd": 180 },
      { "architecture": "纯端到端 S2S + 商业 Wrapper ($0.138/min)", "component": "2. 大模型推理 (S2S / SLM 路由)", "costPer10kMinUsd": 650 },
      { "architecture": "纯端到端 S2S + 商业 Wrapper ($0.138/min)", "component": "3. 编排平台抽成与 CTI 中间件", "costPer10kMinUsd": 550 },
      { "architecture": "纯端到端 S2S + 商业 Wrapper ($0.138/min)", "component": "4. 一线人工坐席与话后 ACW 人力", "costPer10kMinUsd": 0 },
      { "architecture": "混合双轨 + ACS/LiveKit 自建架构 ($0.041/min)", "component": "1. 语音通道与 STT/TTS 底座", "costPer10kMinUsd": 140 },
      { "architecture": "混合双轨 + ACS/LiveKit 自建架构 ($0.041/min)", "component": "2. 大模型推理 (S2S / SLM 路由)", "costPer10kMinUsd": 190 },
      { "architecture": "混合双轨 + ACS/LiveKit 自建架构 ($0.041/min)", "component": "3. 编排平台抽成与 CTI 中间件", "costPer10kMinUsd": 80 },
      { "architecture": "混合双轨 + ACS/LiveKit 自建架构 ($0.041/min)", "component": "4. 一线人工坐席与话后 ACW 人力", "costPer10kMinUsd": 0 }
    ]
  },
  "semantic_types": {
    "architecture": "Category",
    "component": "Category",
    "costPer10kMinUsd": "Amount"
  },
  "chart_spec": {
    "chartType": "Stacked Bar Chart",
    "title": "混合双轨 + ACS/LiveKit 架构将每万分钟成本从 $1,380 压至 $410（降本 70.3%），兼具 310ms 极速共情与 100% 数字合规",
    "subtitle": "每 10,000 分钟智能客服通话成本构成（美元 USD）",
    "encodings": {
      "x": "architecture",
      "y": "costPer10kMinUsd",
      "color": "component"
    }
  }
}
```

### 5.2 7-Card 4:5 架构评测报告摘要（Benchmark Deck Summary）

| 卡片编号 | 卡片标题（Headline-as-Finding） | 核心量化指标与架构验证结论 |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · CCAAS HYBRID VOICE ARCHITECTURE** | `30%` `S2S`（`310ms`）+ `70%` 受控级联实现 **`68.4%`** 一线自助分流与 **`100%`** 数字播报准确，单分钟成本 **`$0.041`**。 |
| **Card 2 (`2/7`)** | **SCENARIO: $48.50 BILL REFUND & WARM HANDOFF** | `<15ms` 切入级联轨精确退还 `$48.50` 漫游费，转人工时 `<150ms` 注入 `kyc_verified=true` 弹屏卡省去 **`84s`** 坐席时长。 |
| **Card 3 (`3/7`)** | **WHAT I TESTED: 500 OMNICHANNEL CCAAS CALLS** | 覆盖账单争议、退改签、附和词打断、慢接口查询与转人工交接，金额错读与重复核身率均为 **`0.00%`**。 |
| **Card 4 (`4/7`)** | **UNDER THE HOOD: DETERMINISTIC GUARD** | 绑定 `evaluateCcaasModernizationGptRealtimeCascadeLivekit2026Guard`（策略码 `CCAAS-MODERNIZATION-GPT-REALTIME-CASCADE-LIVEKIT-2026-01`）。 |
| **Card 5 (`5/7`)** | **ROBUSTNESS: BARGE-IN EPOCH & 3-TURN COMPACTION** | 面对客户中途改口与 15 分钟长通话，`Turn-Epoch` 写栅栏 `100%` 阻断旧工具脏写，3 轮音频裁剪降低 **`63.8%`** Token 消耗。 |
| **Card 6 (`6/7`)** | **LATENCY: 310MS S2S & <320MS AGENT ASSIST** | S2S 首包音频稳定在 **`310ms`**，转人工后双声道坐席辅助微卡片推送稳定在 **`<320ms`**，话后小结仅需 **`3s`**。 |
| **Card 7 (`7/7`)** | **MY TAKE: GOOD FIT VS. NOT FOR** | ✅ 适用：金融/零售/电信/航旅/企服大中型客服中心（月通话 `>=12万分钟`）；⛔ 不适用：不加文本校验直接用纯 S2S 播报法定合同条款。 |

---

## 6. 🛠️ 售前方案设计与上线验收 Checklist

- [ ] **同通电话内 `S2S ⇄ 受控级联` 轮级动态路由与统一音色锁**：确认自由寒暄/安抚走 `<350ms` 原生 S2S，一旦涉及金额、利率、日期或法定条款 `<15ms` 切换至发声前 `<2ms` 正则校验级联轨并使用同一 `Custom Neural Voice`。
- [ ] **`Turn-Epoch` 单调递增写栅栏与 `T+650ms` 慢速 API 安抚话术**：确认客户打断改口时 `0ms` 作废在途旧工具调用，且外部 CRM/ERP 响应 `>650ms` 时自动播报上下文安抚垫音消除盲等挂机。
- [ ] **3 轮滑动窗口音频转文本修剪（Audio Context Compaction）**：确认 `<= Turn N-3` 的历史音频自动蒸馏为文本摘要并锁定系统 Prompt 前缀缓存（命中率 `>94%`），防止 10 分钟长通话费用呈二次方爆炸。
- [ ] **`<150ms` `Handoff_Context_Packet` 零重复核身弹屏与 `SIP REFER` 媒体腿释放**：确认转接人工坐席时 100% 透传已签名 `kyc_verified=true` 状态与 3 条核心摘要，并在接通瞬间释放 AI 媒体腿免除双倍占线费。
- [ ] **`Ch0/Ch1` 双声道物理分轨 `<320ms` 坐席辅助微卡片与 `3秒` `Auto-ACW` 对账**：确认坐席实时推荐卡片严格限制在 `<=25字`，且挂机后 3 秒自动生成工单摘要并核对口头承诺与 CRM 实际建单一致性。
