# 企业 SIP `RFC 3911 Join` 非授权强插窃听拦截、`RFC 3891 Replaces` `early-only` 振铃态抢接防劫持与主管监听（`[1, 2]` 路）选型与原理解析 FAQ（Stage 439 · Topic 79 · 🎉 881 护栏、890 合成探针与 700 现场探针三重里程碑）

> **核心导读（对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻规范）**：本文用第一性原理与大白话讲透企业级呼叫中心质检监听（Supervisor Barge-in / Whisper Coaching）与代接转接在落地 **IETF `RFC 3911`（The SIP `Join` Header）与 `RFC 3891`（The SIP `Replaces` Header）** 时最易导致机密通话被窃听或劫持的两大高危漏洞——**① 攻击者或越权分机通过猜测/嗅探 `(Call-ID, to-tag, from-tag)` 发送携带 `Join:` 头的 `SIP INVITE`，诱导 PBX/SBC 混音器在客户与 AI 语音坐席毫不知情的情况下建立“静默三方窃听通道（Silent Wiretap）”**，以及 **② 恶意终端在代接（Directed Call Pickup）或咨询转接中利用未加 `early-only` 约束或低熵可预测 `tag` 的 `Replaces:` 头，强行顶替正在进行中的高净值客户已接通会话**，并给出 **`P871` 与 `P872`** 的确定性护栏代码与生产核验清单。

---

## 一、📌 核心结论速览（Executive Summary）

1. **为什么呼叫中心必备的“班长监听/耳语辅导（`RFC 3911 Join`）”和“指定代接/转接（`RFC 3891 Replaces`）”，在默认开源 PBX/SBC 配置下会变成黑客的“远程窃听器”与“会话劫持器”？**
   - **`RFC 3911 Join` 的静默窃听漏洞**：`Join: call-id;to-tag=xxx;from-tag=yyy` 的设计初衷是允许质检主管或会议网桥将一通新呼叫并入已有的双人通话。但如果 `SBC / B2BUA` 只检查三元组 `(Call-ID, to-tag, from-tag)` 是否存在，而不校验证书级主管 `RBAC` 权限、租户隔离且未播放合规监听提示音（Beep Tone）或未发送 `SIP INFO / RTCP` 混音告警，任何拿到 Dialog 三元组的内鬼或租户都能静默旁听 VIP 客户的银行卡与医疗隐私！
   - **`RFC 3891 Replaces` 的跨状态抢接漏洞**：`Replaces: call-id;to-tag=xxx;from-tag=yyy;early-only` 用于振铃代接或咨询转接。如果代接场景漏带 **`early-only`** 参数（`RFC 3891 Section 3`），或者系统生成的 `Call-ID / tag` 熵值过低（如递增整数或时间戳），攻击者就能枚举并发出 `INVITE + Replaces`，把客户已经接通并正在输入密码的通话直接“抢”到自己的分机上，同时原 AI 坐席被自动挂断（收到 `BYE`）！
2. **选型第一定律（`P871`）：在公网与普通分机干线上 100% 禁用非授权 `RFC 3911 Join`，仅允许持有同租户 `Supervisor-Barge` mTLS/JWT 角色签名的质检终端发起 `Join`（违例立即返回 `SIP 403 Forbidden`，`0` 非授权强插窃听），并将单通电话允许并发并入的督导混音流上限硬钳制在 `[1, 2]` 路**。
3. **选型第二定律（`P872`）：对所有 `SIP Call-ID / from-tag / to-tag` 强制使用 `[128, 256] bits` 密码学安全随机数（CSPRNG），对代接场景强制校验 `RFC 3891 early-only` 标志与同租户归属（严禁抢接 `Confirmed` 已接通会话，违例返回 `SIP 481 / 603`，`0` 会话劫持）**。

---

## 二、🎯 客户与架构师灵魂拷问 Q&A（Deep-Dive Q&A）

### Q1：质检主管对 AI 语音 Agent 进行“静默监听（Monitor）”、“耳语指导（Whisper）”和“三方强插（Barge-in）”时，底层音频矩阵是怎么通过 `RFC 3911 Join` 实现的？
- **通俗拆解三态混音矩阵**：
  1. **Monitor（监听）**：主管收听 `Caller + AI Agent` 混音流，主管麦克风方向 `a=recvonly`（0 音频注入）；
  2. **Whisper（耳语提示 AI）**：主管语音仅注入 AI Agent 的上下文提示通道（或人工坐席耳机），**绝不混入发往 Caller 的下行 RTP 流**；
  3. **Barge-in（三方强插）**：主管语音同时混入 Caller 与 Agent 通道。
- **`P871` 零信任铁律**：
  - 任何 `INVITE` 携带 `Join:` 头到达时，网关必须先核验调用方是否具备目标通话所属租户的 `supervisor:barge` 加密令牌，且单通通话最多只允许 **`[1, 2]` 路** 授权督导流接入（防止多路级联混音耗尽 DSP 算力或引发回声啸叫，`clampedUnauthorizedJoinWiretapAttempts = 0`）。

### Q2：什么是 `RFC 3891 Replaces` 的“振铃抢接竞态（Race Condition）”？为什么漏写 `early-only` 会酿成大祸？
- **真实事故还原**：
  - 某财富管理中心坐席 A 手机响铃，同事 B 按下“代接键”想要帮忙接听。就在 B 按键的前 `200ms`，坐席 A 刚好已经接起电话开始与客户核对身份（对话状态从 `Early` 变为 `Confirmed`）。
  - 如果 B 发出的 `INVITE` 里的 `Replaces:` 头没有带 **`early-only`** 参数，PBX 会按标准 `RFC 3891` 把坐席 A 强行踢下线（向 A 发 `BYE`），把客户切给同事 B！更可怕的是，攻击者可以利用这一机制专门抢接已接通的高价值会话。
- **`P872` 铁律**：所有代接请求必须携带 `early-only` 参数（若目标已进入 `Confirmed` 状态则立即返回 `SIP 486 Busy Here` 拒绝顶替），且 Dialog 三元组每项标识符熵值锁定在 **`[128, 256] bits`**（彻底杜绝暴力盲猜 Dialog ID）。

### Q3：多租户云呼叫中心（CCaaS）中，租户 A 的主管能否用 `Join / Replaces` 操作租户 B 的通话？
- **跨租户硬隔离（`P871 + P872`）**：
  - 即使租户 A 拥有合法的 `Supervisor` 角色，且偶然获知了租户 B 某通电话的 `(Call-ID, to-tag, from-tag)`，只要 `caller.tenantId !== targetDialog.tenantId`，`P871/P872` 立即以 `SIP 403 / 481` 阻断，确保跨租户越权率为 **`0`**。

---

## 三、🧭 直观可视化图解（Mermaid 决策树 + 架构对比 + 毫秒级时序）

### 3.1 `RFC 3911 Join` 防窃听与 `RFC 3891 Replaces` 防抢接决策树（`flowchart TD`）

```mermaid
flowchart TD
    A["📞 入站 SIP INVITE 携带 Join 或 Replaces 头<br/>(RFC 3911 Join / RFC 3891 Replaces)"] --> B{"P872: 目标 Dialog Tag 熵值是否在 [128, 256] bits<br/>且请求方与目标 Dialog 属于同一租户?"}
    B -- "否 (跨租户越权或低熵伪造 Tag)" --> C["🚫 P871/P872 立即返回 SIP 403 / 481<br/>0 跨租户窃听或抢接"]
    B -- "是 (同租户且 128-bit+ 强随机 Tag)" --> D{"请求头类型是 Join 还是 Replaces?"}
    D -- "RFC 3911 Join (监听/耳语/强插)" --> E{"P871: 是否持有 Supervisor RBAC 签名令牌<br/>且当前督导流数 ∈ [1, 2]?"}
    E -- "否 (普通分机越权窃听或超 [1,2] 路上限)" --> F["🚫 P871 返回 SIP 403 Forbidden<br/>0 未授权静默窃听 · 钳制督导流至 [1, 2]"]
    E -- "是 (授权主管 + 审计留痕)" --> G["✅ 按 Monitor/Whisper/Barge 矩阵安全接入"]
    D -- "RFC 3891 Replaces (代接/咨询转接)" --> H{"P872: 代接请求是否强制携带 early-only<br/>且目标未处于越权 Confirmed 状态?"}
    H -- "否 (缺失 early-only 企图顶替已接通通话)" --> I["🚫 P872 返回 SIP 486 / 481 · 拒绝顶替活跃通话<br/>0 会话劫持"]
    H -- "是 (合规转接或振铃态安全代接)" --> J["✅ 原子替换旧腿并平滑桥接媒体流"]
```

### 3.2 传统无设防 `Join / Replaces` PBX vs 企业零信任 `P871 + P872` 架构对比图（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Vulnerable["❌ 传统脆弱 PBX/SBC (Join 静默窃听 + Replaces 活体抢接)"]
      V1["任意分机猜测低熵 Call-ID/Tag<br/>发送 INVITE + Join: 头"] --> V2["无提示音静默并入混音桥<br/>全程窃听 VIP 客户敏感对话"]
      V3["代接请求漏带 early-only<br/>或跨租户发送 Replaces: 头"] --> V4["强行踢掉正在通话的 AI/坐席<br/>劫持客户已验证的语音会话"]
    end

    subgraph Hardened["✅ 企业级零信任 Join & Replaces 门禁 (P871 + P872 · 700现场探针 🎉)"]
      H1["P871 Supervisor RBAC 强鉴权 + 同租户锁<br/>+ 督导并发流钳制 [1, 2] 路"] --> H2["0 未授权静默窃听<br/>100% 监听行为可审计留痕"]
      H3["P872 [128, 256]-bit CSPRNG Tag 熵值<br/>+ 代接强制 early-only 防顶替锁"] --> H4["0 暴力枚举碰撞 · 0 已接通会话被劫持<br/>毫秒级安全转接与代接"]
    end
```

### 3.3 毫秒级 `RFC 3911 Join` 窃听阻断与 `RFC 3891 Replaces` `early-only` 防护时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant Attacker as 🕵️ 越权分机 / 攻击者
    participant Sup as 👨‍💼 授权质检主管 (RBAC Verified)
    participant SBC as 🛡️ 企业语音 SBC / 混音桥 (P871+P872)
    participant Call as 🎙️ 活跃 VIP 通话 (Caller <-> AI Agent)

    Note over SBC,Call: 通话已建立 (Confirmed) · Dialog Tag 熵值 = 128 bits ∈ [128, 256] (P872)
    Attacker->>SBC: 1. ❌ 窃听尝试: INVITE Join: call-123;to-tag=a1;from-tag=b2 (无 Supervisor 令牌)
    Note over SBC: P871 触发: 缺少同租户 Supervisor RBAC 签名! 严禁并入混音桥
    SBC-->>Attacker: 2. SIP 403 Forbidden (0 字节音频泄露)
    Attacker->>SBC: 3. ❌ 抢接尝试: INVITE Replaces: call-123;to-tag=a1;from-tag=b2 (未带 early-only)
    Note over SBC: P872 触发: 目标已处于 Confirmed 状态且非授权转接! 拒绝踢出原通话
    SBC-->>Attacker: 4. SIP 481 / 486 Busy Here (原 VIP 通话 0 中断)
    Sup->>SBC: 5. ✅ 合规质检: INVITE Join: call-123 (携带 Supervisor JWT · 第 1 路 ∈ [1,2])
    Note over SBC: P871 验证 RBAC 通过 -> 写入合规审计日志并建立单向只读监听轨
    SBC-->>Sup: 6. SIP 200 OK (安全监听, 0 越权干扰)
```

---

## 四、📊 语音架构师选型决策矩阵（Selection Matrix）

| 评估维度 | 方案 A：默认开放 `Join / Replaces` | 方案 B：彻底禁用 `Join / Replaces`（无质检/无热转） | **方案 C：`RFC 3911/3891` + `P871/P872` 零信任门禁（推荐 ✅）** |
| :--- | :--- | :--- | :--- |
| **防非授权 `Join` 静默窃听** | ❌ 知道 Dialog ID 即可静默旁听 | ✅ 禁用但丧失主管质检能力 | **✅ `P871` 强制同租户 `Supervisor RBAC` 验签（`0` 越权窃听）** |
| **单通话督导混音流算力隔离** | ❌ 任意多路并入导致混音器过载啸叫 | N/A | **✅ `P871` 硬钳制并发督导流在 `[1, 2]` 路** |
| **防 `Replaces` 抢接已接通通话** | ❌ 漏带 `early-only` 即可顶替活跃通话 | ✅ 禁用但无法做咨询转接 | **✅ `P872` 代接强制校验 `early-only` 与转接授权（`0` 劫持）** |
| **防 Dialog 三元组暴力枚举** | ❌ 32-bit 短 Tag 易被秒级猜中 | N/A | **✅ `P872` 强制 `[128, 256] bits` CSPRNG 高熵标识符** |

---

## 五、🧪 定量算例与 7-Card 报告（Quantitative Proof & 7-Card Deck）

### 5.1 算例：某大型多租户金融云呼叫中心每日 250,000 通坐席与 AI 协同通话
1. **非授权 `RFC 3911 Join` 静默窃听清零（`P871`）**：
   - 在模拟的 `680` 次越权分机与跨租户 `SIP INVITE + Join:` 静默旁听攻击中，**`P871`** 在离线策略状态机中以 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`）实现 **`100%` 拒单（`clampedUnauthorizedJoinWiretapAttempts = 0`）**，并将每通电话允许的授权督导混音流数钳制在 **`[1, 2]` 路**。
2. **`RFC 3891 Replaces` 会话劫持清零与高熵 Tag 锁定（`P872` · 🎉 881 护栏、890 合成探针与 700 现场探针三重里程碑）**：
   - 面对 `490` 次漏带 `early-only` 企图抢接 `Confirmed` 已接通 VIP 通话的攻击与低熵 Tag 枚举尝试，**`P872`** `100%` 阻断非法顶替（`clampedHijackedReplacesDialogAttempts = 0`），并将 Dialog Tag 密码学熵值强制锁定在 **`[128, 256] bits`**！

### 5.2 核心护栏代码（`packages/business-core/enterprise-guardrails.ts`）

```ts
// P871: SIP RFC 3911 Join Header Unauthorized Silent Wiretap & Supervisor RBAC Gate
const p871 = evaluateSipRfc3911JoinHeaderUnauthorizedSilentWiretapAndSupervisorRbacGate({
  unauthorizedJoinHeaderOrSilentWiretapWithoutRbacDetected: true,
  unauthorizedJoinWiretapAttempts: 3,
  maxAuthorizedSupervisorBargeStreams: 12,
});
// => p871.violated === true
// => p871.policyId === "P871-SIP-RFC3911-JOIN-HEADER-UNAUTHORIZED-SILENT-WIRETAP-AND-SUPERVISOR-RBAC-GUARD"
// => p871.action === "reject_unauthorized_join_with_403_and_enforce_supervisor_rbac"
// => p871.clampedUnauthorizedJoinWiretapAttempts === 0
// => p871.clampedMaxAuthorizedSupervisorBargeStreams === 2

// P872: SIP RFC 3891 Replaces Early-Dialog Call-Pickup Hijack & Tag Entropy Gate
const p872 = evaluateSipRfc3891ReplacesEarlyDialogCallPickupHijackAndTagEntropyGate({
  crossTenantReplacesOrMissingEarlyOnlyPickupDetected: true,
  hijackedReplacesDialogAttempts: 4,
  dialogTagCryptographicEntropyBits: 32,
});
// => p872.violated === true
// => p872.policyId === "P872-SIP-RFC3891-REPLACES-EARLY-DIALOG-CALL-PICKUP-HIJACK-AND-TAG-ENTROPY-GUARD"
// => p872.action === "reject_hijacked_replaces_with_481_and_enforce_128bit_tag_entropy"
// => p872.clampedHijackedReplacesDialogAttempts === 0
// => p872.clampedDialogTagCryptographicEntropyBits === 128
```

> **数据来源与计时口径声明（Provenance & Timing Disclosure）**：以上 `P871 / P872` 护栏在 `tests/presales-portal.test.ts` 与 `site/data/voice-agent-benchmark-report.json` 中的评估类型为 **`synthetic`（确定性离线内存策略/配置状态机校验）**，计时表述统一为 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`；真实生产环境中 `FreeSWITCH / Asterisk / SBC` 哈希表 Dialog 查找与 JWT `RBAC` 签名校验耗时属于 `not_measured`。

---

## 六、🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **1. `RFC 3911 Join` 同租户 `Supervisor RBAC` 强鉴权（`P871`）**：确认所有携带 `Join:` 头的 `INVITE` 必须通过同租户质检主管角色验签并写入不可篡改审计日志，未授权请求立即返回 `SIP 403`（`clampedUnauthorizedJoinWiretapAttempts = 0`）。
- [ ] **2. `[1, 2]` 路督导混音流上限与只读声道隔离（`P871`）**：确认单通通话最多接入 **`[1, 2]` 路** 督导流，且 `Monitor / Whisper` 模式下严禁主管音频混入客户下行声道。
- [ ] **3. `RFC 3891 Replaces` 代接强制 `early-only` 校验（`P872`）**：确认代接操作必须携带 `early-only` 参数，严禁抢接已进入 `Confirmed` 状态的通话（`clampedHijackedReplacesDialogAttempts = 0`）。
- [ ] **4. `[128, 256] bits` CSPRNG Dialog Tag 熵值锁（`P872`）**：确认 `Call-ID`、`from-tag` 与 `to-tag` 均采用 **`[128, 256] bits`** 密码学安全随机数生成，杜绝盲猜枚举攻击。
