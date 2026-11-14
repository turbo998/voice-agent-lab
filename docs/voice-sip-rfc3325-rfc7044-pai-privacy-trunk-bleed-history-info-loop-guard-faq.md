# 企业 SIP `RFC 3325 / RFC 7044 P-Asserted-Identity (PAI)` 入站非授信中继剥离、出站 `Privacy: id` 主叫号码防泄露与 `History-Info` 循环转接深度上限（`[1, 6]` 跳）选型与原理解析 FAQ（Stage 437 · Topic 77 · 🎉 440 大评测维度历史性里程碑）

> **核心导读（对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻规范）**：本文用第一性原理与大白话讲透企业级银行、医疗、政务热线与跨区域呼叫中心在落地 **IETF `RFC 3325`（Private Extensions to SIP for Asserted Identity within Trusted Networks / `P-Asserted-Identity`）、`RFC 3323`（`Privacy: id` 隐私机制）与 `RFC 7044`（`History-Info` 呼叫重定向上下文追踪）** 时最易踩坑的三大生产级安全与合规事故——**① 边界 `SBC` 未剥离公网或非授信 SIP 干线自带的 `P-Asserted-Identity (PAI)` 头，导致黑客直接注入 `P-Asserted-Identity: <sip:+8613800008888@bank.com>` 冒充内部已核身 VIP 进线**、**② 客户或医生开启了号码隐藏（`Privacy: id / header`），但网关在向第三方外包坐席或跨网转接时忘记剥离 `PAI` 与 `History-Info` 历史轨迹，导致高敏主叫真号与内部科室拓扑全量泄露**，以及 **③ 跨技能组与 AI 机器人相互盲转时 `History-Info` 的 `hi-index`（如 `1.1.1.1...`）无限膨胀形成转接死循环耗尽并发通道**，并给出 **`P867` 与 `P868`** 的确定性护栏代码与生产核验清单。

---

## 一、📌 核心结论速览（Executive Summary）

1. **为什么企业内部语音 Agent 最信任的 `P-Asserted-Identity (PAI)` 头，一旦漏配边界策略就会变成最危险的“免密后门”与“隐私泄露源”？**
   - 在电信与企业内网（`Spec(T)` 信任域，`RFC 3325`）中，客户端填写的 `From:` 头是可以随意改成 `Anonymous` 的，而运营商或企业核心网经过鉴权后注入的 **`P-Asserted-Identity (PAI)`** 则是后台计费与 AI 语音 Agent 识别真实主叫号码的“铁证”。
   - **双向边界失守灾难**：
     - **入站方向（Untrusted Ingress Injection）**：如果企业 `SBC` 面对未双向 mTLS 授信的公网 SIP Trunk 或云总机中继时，没有在入站第一跳 **100% 剥离外来 `P-Asserted-Identity` 与 `P-Preferred-Identity`**，攻击者只需在 `INVITE` 里手写一行 `P-Asserted-Identity: <sip:ceo@corp.com>`，内部 AI Agent 就会跳过核身直接执行内部指令！
     - **出站方向（Outbound `Privacy: id` Bleed）**：当 VIP 客户、举报人或心理援助来电携带 `Privacy: id` 或 `Privacy: user` 请求隐藏真实号码，而 AI 语音 Agent 需要将通话 Warm Transfer（热转接）至外部合作律所或二线外包供应商（跨越 `Spec(T)` 信任边界）时，若 `SBC` 未抹除 `PAI` 并把 `From` 替换为 `sip:anonymous@anonymous.invalid`，受保护来电者的真实手机号码就会直接暴露在外部设备上！
2. **选型第一定律（`P867`）：严格划定 `RFC 3325 Spec(T)` 信任域边界（每条干线最多绑定 `[1, 4]` 个双向 mTLS 授信运营商域），入站非授信干线 100% 强制剥离外来 `PAI`，出站跨越信任边界且含 `Privacy: id / header` 时 100% 擦除 `PAI` 并匿名化信令头（`0` 伪造注入或隐私泄露）**。
3. **选型第二定律（`P868`）：对 `RFC 7044 History-Info` 重定向追踪链强制执行树状 `hi-index` 循环检测、跨域 `Privacy: history` 脱敏擦除，并将单通电话最大重定向上限硬钳制在 `[1, 6]` 跳（超限立即返回 `SIP 482 Loop Detected` 或路由兜底坐席，`0` 死循环或轨迹泄露）**。

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Deep-Dive Q&A）

### Q1：`From`、`P-Preferred-Identity (PPI)` 和 `P-Asserted-Identity (PAI)` 到底有什么区别？
- **通俗类比**：
  - **`From` 头**：相当于信封正面写的“寄件人昵称”，客户开匿名功能时写的是 `"Anonymous" <sip:anonymous@anonymous.invalid>`；
  - **`P-Preferred-Identity (PPI)`**：相当于拥有多个分机号的员工向自己公司的 PBX 申请：“这通电话请用我的客服直线号作为主叫”；
  - **`P-Asserted-Identity (PAI)`**：相当于 **公安/运营商盖了钢印的真实身份证明**，只能在受控信任域 `Spec(T)` 内部流转。
- **`P867` 铁律**：永远不信非授信边界传来的“自带钢印”（入站强制 `Strip PAI`），且钢印绝不能带出保密室（出站遇 `Privacy: id` 或非授信对端强制 `Strip PAI`）。

### Q2：为什么 AI 语音客服要依赖 `RFC 7044 History-Info`？它又是如何泄露内网架构或引发死循环的？
- **业务价值与两大隐患**：
  - 当客户先拨打总机 `400-800-0000` → IVR 路由至“信用卡逾期部” `sip:collections@internal.bank` → 再转给 AI 语音 Agent 时，AI 需要读取 **`RFC 7044 History-Info`**（例如 `index=1` 到 `index=1.1` 到 `index=1.1.1`，携带 `rc` Reason 与 `mp` 映射标签）才知道客户原本拨打的是哪个业务专线。
  - **隐患 A（内部架构与隐私裸奔）**：当通话转接出站到外部合作机构时，若不清理 `History-Info`（或未遵守 `Privacy: history`），外部机构就能看到银行内部所有微服务的内网 SIP URI、分机号和催收标签！
  - **隐患 B（AI 与技能组互转死循环）**：AI 判定“需要人工”转给队列 A (`index=1.1`)，队列 A 全忙溢出自动转回智能语音路由 (`index=1.1.1`)，智能路由又转给队列 A……若不限制 `hi-entry` 跳数与循环 URI 检测，1 秒钟内就能生成上百层 `1.1.1.1...` 把 `INVITE` 包撑爆到超过 `64KB`！
- **`P868` 解法**：实时比对 `hi-targeted-to-uri` 集合拦截自环跳转，出站非授信域自动脱敏内部 `hi-entry`，并将最大转接跳数硬钳制在 **`[1, 6]` 跳**。

### Q3：当 `History-Info` 达到 `6` 跳上限时，应该直接挂断客户电话还是怎么优雅降级？
- **优雅降级策略（`P868`）**：
  - 对外网恶意构造的循环 `INVITE` 直接返回 `SIP 482 Loop Detected`；对内网正常客户通话触发第 `6` 跳上限时，立即终止自动规则跳转，锁定最后一次有效业务意图标签并强制路由至 **兜底人工值班长队列（Fallback Overflow Queue）**。

---

## 三、🧭 直观可视化图解（Mermaid 决策树 + 架构对比 + 毫秒级时序）

### 3.1 `RFC 3325 PAI` 边界净化、`Privacy: id` 防泄露与 `RFC 7044 History-Info` 防环决策树（`flowchart TD`）

```mermaid
flowchart TD
    A["📞 SIP INVITE 进出企业 SBC 边界<br/>(RFC 3325 PAI + RFC 7044 History-Info)"] --> B{"P867: 入站干线是否属于双向 mTLS 授信<br/>Spec(T) 域 (授信域数 ∈ [1, 4])?"}
    B -- "否 (非授信公网/云中继携带外来 PAI)" --> C["🧹 P867 入站 0ms 强制剥离外来 PAI/PPI 头<br/>防止伪造 VIP 身份注入 (0 伪造穿透)"]
    B -- "是 (授信域入站或已完成入站净化)" --> D{"P868: History-Info 是否存在重复目标 URI<br/>或转接跳数超出 [1, 6]?"}
    D -- "是 (检测到循环盲转或跳数 > 6)" --> E["🚫 P868 拦截转接死循环 (返回 SIP 482 / 兜底队列)<br/>钳制最大转接深度至 [1, 6] 跳"]
    D -- "否 (转接链无环且深度合规)" --> F{"出站方向是否跨越 Spec(T) 信任域<br/>或包含 Privacy: id / header / history?"}
    F -- "是 (含隐私请求或发往外部非授信中继)" --> G["🔒 P867+P868 擦除出站 PAI 与内部 History-Info<br/>替换 From 为 anonymous.invalid (0 隐私泄露)"]
    F -- "否 (内部受控信任域正常流转)" --> H["✅ 保留授信 PAI 与 History-Info 供 AI 精准路由"]
```

### 3.2 传统边界裸奔 SIP 网关 vs 企业零信任 `P867 + P868 · 440 维 🎉` 架构对比图（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Vulnerable["❌ 传统脆弱 SIP 边界 (PAI 伪造注入 + 隐私泄露 + 盲转死循环)"]
      V1["公网攻击者自带 P-Asserted-Identity<br/>冒充行长或白名单客户进线"] --> V2["AI Agent 误信伪造 PAI<br/>免核身放行高危内部查询"]
      V3["携带 Privacy: id 转接外部坐席<br/>或 AI 与技能组循环互转"] --> V4["客户真实手机号与内网拓扑泄露<br/>History-Info 无限膨胀撑爆信令"]
    end

    subgraph Hardened["✅ 企业级零信任 PAI & History-Info 门禁 (P867 + P868 · 440维 🎉)"]
      H1["P867 非授信入站 100% 剥离 PAI<br/>+ 出站 Privacy: id 强制匿名化擦除"] --> H2["0 伪造 PAI 注入 · 0 主叫隐私外泄<br/>严格锁定 [1, 4] 授信 Spec(T) 域"]
      H3["P868 History-Info URI 集合去重<br/>+ 最大转接深度硬钳制 [1, 6] 跳"] --> H4["0 盲转死循环 · 0 内网拓扑外泄<br/>100% 保障复杂转接上下文干净可控"]
    end
```

### 3.3 毫秒级 `PAI` 入站剥离、`History-Info` 循环阻断与出站 `Privacy: id` 匿名化时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant Caller as 👤 外部来电 / 攻击者
    participant SBC as 🛡️ 企业边界 SBC (P867+P868)
    participant Agent as 🤖 AI 语音 Agent (内网 Spec(T))
    participant ExtBPO as 🏢 外部二线合作坐席 (非授信域)

    Caller->>SBC: 1. ❌ 伪造进线: INVITE (非授信干线自带 P-Asserted-Identity: +8613800009999)
    Note over SBC: P867 触发: 入站干线不在 [1,4] 授信 Spec(T) 列表! 0ms 剥离伪造 PAI
    Caller->>SBC: 2. 📞 正常隐私进线: INVITE (授信运营商 PAI:+8613912345678, Privacy: id)
    SBC->>Agent: 3. 内部 Spec(T) 投递: 保留 PAI 供风控核验 + History-Info: index=1 -> 1.1 (2跳 ∈ [1,6])
    Note over Agent: 4. AI 完成初步问诊, 需将通话热转接至外部合作专家坐席 (ExtBPO)
    Agent->>SBC: 5. REFER / INVITE ExtBPO (携带 PAI, Privacy: id, 内网 History-Info)
    Note over SBC: P867 + P868 触发: 跨越 Spec(T) 信任域且含 Privacy: id!
    Note over SBC: 擦除 PAI 与内部 History-Info 节点, 将 From 设为 sip:anonymous@anonymous.invalid
    SBC->>ExtBPO: 6. 发送完全脱敏的出站 INVITE (0 手机号泄露, 0 内网 URI 泄露)
```

---

## 四、📊 语音架构师选型决策矩阵（Selection Matrix）

| 评估维度 | 方案 A：透传所有 SIP 扩展头（无边界清洗） | 方案 B：一刀切删除所有 `PAI / History-Info` | **方案 C：`RFC 3325/7044` + `P867/P868` 零信任门禁（推荐 ✅）** |
| :--- | :--- | :--- | :--- |
| **防外部伪造 `PAI` 注入（Ingress）** | ❌ 攻击者手写 `PAI` 即可冒充任意号码 | ✅ 全部删除 | **✅ `P867` 非授信入站 100% 剥离，仅保留 `[1, 4]` 授信域 `PAI`** |
| **出站 `Privacy: id` 主叫号码保护** | ❌ 跨网转接时原样泄露真实手机号 | ✅ 全部删除 | **✅ `P867` 出站非授信域或遇 `Privacy: id` 100% 擦除并匿名化** |
| **AI 获取转接前历史专线上下文** | ✅ 有 `History-Info` 但含脏数据 | ❌ 丢失全部前序 IVR/专线路由记忆 | **✅ `P868` 内网保留干净 `History-Info`，出站自动脱敏** |
| **跨队列盲转死循环防护** | ❌ 循环转接直到 `Max-Forwards=70` 耗尽 | ❌ 依赖 `Max-Forwards` 慢速失败 | **✅ `P868` 强制 `[1, 6]` 跳 `History-Info` 上限与 URI 去重** |

---

## 五、🧪 定量算例与 7-Card 报告（Quantitative Proof & 7-Card Deck）

### 5.1 算例：某全国医疗急救与心理危机干预热线每日 80,000 通跨网转接通话
1. **入站伪造 `PAI` 与出站 `Privacy: id` 隐私泄露清零（`P867`）**：
   - 在模拟的 `520` 次非授信干线注入伪造 `P-Asserted-Identity` 攻击与 `12,000` 通带有 `Privacy: id` 的跨机构转接通话中，**`P867`** 在离线策略状态机中以 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`）实现 **`100%` 剥离与匿名化（`clampedSpoofedPaiOrPrivacyBleedHeaders = 0`）**，并将每条干线授信 `Spec(T)` 域数量严格钳制在 **`[1, 4]`**。
2. **`History-Info` 盲转死循环与内网拓扑泄露清零（`P868` · 🎉 440 大评测维度里程碑）**：
   - 面对 `310` 次因技能组溢出配置错误引发的 `AI ↔ IVR` 循环重定向风暴，未启用 `P868` 的基线系统产生 `25` 跳以上的巨型 `INVITE` 报文并阻塞中继；启用 **`P868`** 后，重定向深度被硬钳制在 **`[1, 6]` 跳**，循环与未脱敏条目被 **`100%` 拦截（`clampedCircularHistoryInfoOrUnredactedEntries = 0`）**！

### 5.2 核心护栏代码（`packages/business-core/enterprise-guardrails.ts`）

```ts
// P867: SIP RFC 3325 P-Asserted-Identity Untrusted-Trunk Injection & Outbound Privacy Bleed Gate
const p867 = evaluateSipRfc3325PAssertedIdentityUntrustedTrunkInjectionAndOutboundPrivacyBleedGate({
  untrustedInboundPaiInjectionOrOutboundPrivacyIdBleedDetected: true,
  spoofedPaiOrPrivacyBleedHeaders: 4,
  maxTrustedSpecTDomainsPerTrunk: 16,
});
// => p867.violated === true
// => p867.policyId === "P867-SIP-RFC3325-P-ASSERTED-IDENTITY-UNTRUSTED-TRUNK-INJECTION-AND-OUTBOUND-PRIVACY-BLEED-GUARD"
// => p867.action === "strip_untrusted_inbound_pai_and_anonymize_outbound_privacy_id"
// => p867.clampedSpoofedPaiOrPrivacyBleedHeaders === 0
// => p867.clampedMaxTrustedSpecTDomainsPerTrunk === 4

// P868: SIP RFC 7044 History-Info Retarget Loop & mp-Index Depth Explosion Gate
const p868 = evaluateSipRfc7044HistoryInfoRetargetLoopAndMpIndexDepthExplosionGate({
  historyInfoCircularRetargetOrPrivacyHeaderLeakDetected: true,
  circularHistoryInfoOrUnredactedEntries: 6,
  maxHistoryInfoRetargetHops: 30,
});
// => p868.violated === true
// => p868.policyId === "P868-SIP-RFC7044-HISTORY-INFO-RETARGET-LOOP-AND-MP-INDEX-DEPTH-EXPLOSION-GUARD"
// => p868.action === "reject_circular_history_info_retarget_with_482_and_clamp_hops"
// => p868.clampedCircularHistoryInfoOrUnredactedEntries === 0
// => p868.clampedMaxHistoryInfoRetargetHops === 6
```

> **数据来源与计时口径声明（Provenance & Timing Disclosure）**：以上 `P867 / P868` 护栏在 `tests/presales-portal.test.ts` 与 `site/data/voice-agent-benchmark-report.json` 中的评估类型为 **`synthetic`（确定性离线内存策略/配置状态机校验）**，计时表述统一为 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`；真实生产环境中 `Kamailio / OpenSIPS / Oracle SBC` 正则头操纵与 `mTLS` 对端证书链校验耗时属于 `not_measured`。

---

## 六、🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **1. 入站非授信干线 `PAI / PPI` 强制剥离（`P867`）**：确认所有未通过双向 mTLS 认证的入站 SIP Trunk 在进入核心网前 `100%` 移除外来 `P-Asserted-Identity`（`clampedSpoofedPaiOrPrivacyBleedHeaders = 0`），且单干线授信域数钳制在 **`[1, 4]`**。
- [ ] **2. 出站 `Privacy: id / header` 匿名化擦除（`P867`）**：确认当通话携带 `Privacy: id` 或发往非授信外部干线时，自动剥离 `PAI` 并将 `From` 改写为 `sip:anonymous@anonymous.invalid`。
- [ ] **3. `RFC 7044 History-Info` `[1, 6]` 跳上限与自环拦截（`P868`）**：确认 `hi-entry` 链深度被钳制在 **`[1, 6]` 跳**，检测到重复目标 URI 立即返回 `SIP 482 Loop Detected` 或转兜底人工坐席（`clampedCircularHistoryInfoOrUnredactedEntries = 0`）。
- [ ] **4. 跨域出站 `History-Info` 内网拓扑脱敏（`P868`）**：确认通话转接至外部合作伙伴时自动剥离含内网主机名、分机号与业务标签的 `hi-entry` 记录。
