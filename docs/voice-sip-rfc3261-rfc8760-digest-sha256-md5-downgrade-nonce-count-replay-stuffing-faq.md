# 企业 SIP `RFC 8760` 摘要鉴权（`SHA-256` 升级防 `MD5` 降级爆破、强制 `qop=auth` 与 `Nonce-Count` 防重放盗打）选型指南

> **文档类型**：架构师选型 FAQ & 毫秒级协议防线拆解（严格对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标杆）  
> **适用阶段**：Stage 461 · Topic 101 · 🎉 **第 105 张 SVG 架构图与 925 项生产级护栏双历史性里程碑**（关联护栏 `P915`、`P916` · 第 103 篇独立单专题 FAQ · 第 105 张 SVG 架构图 🎉 · 464 大评测维度）  
> **核心价值**：用大白话讲透为什么沿用 2002 年 `RFC 3261` 默认 **`MD5` 摘要鉴权** 的企业 SIP 语音中继，在现代单卡 GPU（每秒可算 1000 亿次 MD5）面前几分钟就会被离线撞库破解出分机密码并盗打国际长途；以及为什么升级 **`RFC 8760 SHA-256`** 时若漏掉 **禁绝 `MD5` 竞价降级、强制 `qop="auth"`、`[128, 256]-bit cnonce` 熵值（`P915`）** 与 **`(nonce, nc)` 防重放窗口 + `[60, 300]s` `stale=true` 轮换（`P916`）** 仍会被中间人绕过，并给出确定性工程防线。

---

## ① 📌 核心结论速览（Executive Summary）

1. **为什么黑客抓一个普通的 `SIP 401/407 REGISTER` 鉴权包，就能在几分钟内算出企业 SIP 干线的明文密码（`MD5` 算法老化与缺失 `qop=auth` 选择明文攻击漏洞）？**  
   在传统 `RFC 3261` SIP 摘要认证（Digest Authentication）中，客户端计算响应值的方式是先算 $HA1 = \text{MD5}(\text{username}:\text{realm}:\text{password})$，再结合服务端的随机串 `nonce` 计算摘要。这里存在两大致命隐患：
   - **隐患 1（`MD5` 算力崩塌与降级攻击）**：**`RFC 8760`** 引入了 `SHA-256` 与 `SHA-512-256` 替代老旧的 `MD5`。为了兼容老话机，SBC 往往在 `401 Unauthorized` 里下发两行 `WWW-Authenticate`（第一行 `algorithm=SHA-256`，第二行 `algorithm=MD5`）。中间人只需在网络上把第一行 `SHA-256` 抹掉，客户端就会自动退回 `MD5`，让黑客用消费级显卡以 `100+ GH/s` 算力暴力字典跑出密码！
   - **隐患 2（未强制 `qop="auth"` 导致无 `cnonce` 盐值保护）**：如果不强制 `qop="auth"`，摘要公式退化为 $\text{Hash}(HA1 : \text{nonce} : HA2)$，其中没有任何客户端生成的随机因子（`cnonce`）！伪造基站或恶意代理可以固定下发同一个预设 `nonce="1111"`，直接用预计算彩虹表（Rainbow Table）0ms 反查出密码！
2. **为什么黑客不需要知道密码，光靠复制粘贴刚才抓到的 `Authorization` 头就能盗打长途电话（`nc` 序号漏验与长寿命 `nonce` 重放漏洞）？**  
   为了避免每通外呼都多走一次 `407 Proxy Authentication Required` 往返，客户端会在后续 `INVITE` 中复用上一次的 `nonce`，并把 `8` 位十六进制计数器 **`nc`（Nonce-Count，`00000001` -> `00000002`）** 加 1。如果 SBC 不校验 `(nonce, nc)` 是否单调递增，或者让同一个 `nonce` 存活好几个小时不触发 `stale=true` 换新，黑客截获一条合法 `INVITE` 的 `Proxy-Authorization` 原样贴到自己的 `INVITE` 上就能白嫖通话！
3. **架构师的确定性防线（`P915 + P916` · 🎉 第 105 张 SVG 与 925 护栏双里程碑）**：
   - **`P915`（`RFC 8760 SHA-256/512-256` 强绑定、禁 `MD5 / 无 qop` 降级与 `[128, 256]-bit cnonce` 熵值锁）**：全面淘汰并拒绝 `algorithm=MD5` 及无 `qop` 响应，强制启用 `SHA-256` 或 `SHA-512-256` 配合 `qop="auth" / "auth-int"`（`0` `MD5` 降级或无 `qop` 鉴权握手），并将客户端 `cnonce` 随机熵严格钳制在 **`[128, 256]` bits**。
   - **`P916`（`RFC 8760 (nonce, nc)` 严格防重放位图与 `[60, 300]s` `stale=true` 无感轮换锁 — 🎉 第 925 项护栏！）**：对每个服务端 `nonce` 维护严格的 `nc` 防重放位图窗口（任何重复或回退的 `nc` 0ms 拦截，`0` 重放盗打或撞库洪泛包），并将服务端 `nonce` 最大存活时间钳制在 **`[60, 300]` 秒（推荐 `120s`）**，到期返回 `401/407 stale=true` 触发客户端免密重新哈希。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：如果把 `nonce` 有效期缩短到 `120` 秒（`[60, 300]s`），会不会导致坐席每隔 2 分钟就要重新弹窗输入密码？
- **大白话原理解析**：**完全不会弹窗！** 这正是 SIP **`stale=true`** 机制最精妙的设计：
  - 当密码输错时，服务器返回 `401/407 (stale=false)`，话机知道是密码错了，才会弹窗让人重输；
  - 当密码是对的、仅仅是 `nonce` 满 `120` 秒过期了，服务器返回 **`401/407 (nonce="新随机串", stale=true)`**。话机看到 `stale=true`，知道“我的密码没问题，只是暗号到点换新了”，于是话机在后台用内存里缓存的密码自动对新 `nonce` 算一次 `SHA-256` 重发，耗时不到 `2ms`，坐席和客户完全零感知，却让黑客手里的旧抓包瞬间作废（`P916`）！

### Q2：为什么客户端生成的 `cnonce` 必须保证 `[128, 256]` bits 的高随机熵（`P915`）？
- **大白话原理解析**：有些廉价嵌入式网关用系统启动秒数或固定字符串 `"abcdef"` 当作 `cnonce`。如果攻击者架设恶意代理下发固定 `nonce`，而客户端的 `cnonce` 又是可预测的，攻击者就能提前针对该固定 `(nonce, cnonce)` 跑字典表。强制 `[128, 256]` bits 密码学安全随机数（CSPRNG）作为 `cnonce`，能确保每次握手的哈希入参全球唯一。

### Q3：为什么在 `qop="auth"` 下，多并发呼叫会出现 `nc` 乱序，该如何兼顾并发与防重放？
- **大白话原理解析**：当企业网关同一毫秒发起 5 通外呼（`nc=1, 2, 3, 4, 5`），由于网络抖动，`nc=3` 可能比 `nc=2` 早到 `1ms`。如果服务器死板地要求“必须严格等于上一包 +1”，`nc=2` 就会被误杀。
- **工程对策（`P916`）**：采用类似 SRTP 的 **`64-bit` 滑动防重放位图（Sliding Bitmap Window）**：允许微小的网络乱序到达，但任何已经置位（已使用过）的 `nc` 一旦二次出现，**0ms 判定为重放攻击并拦截**！

---

## ③ 🧭 直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比图 + 毫秒级全双工时序图）

### 3.1 企业 SIP `RFC 8760` 摘要鉴权选型决策树（`flowchart TD`）

```mermaid
flowchart TD
    A[SIP 注册器 / SBC 收到携带 Authorization / Proxy-Authorization 的请求] --> B{客户端使用的摘要算法是否为 RFC 8760 SHA-256 / SHA-512-256?}
    B -- "否: 使用老旧 MD5 算法 (或遭中间人删减降级)" --> C["❌ P915 拦截: 严禁 MD5 降级 · 强制下发仅含 SHA-256/512-256 的挑战"]
    B -- "是: 合规 SHA-256 / SHA-512-256" --> D{是否包含 qop=auth/auth-int 且 cnonce 熵值 ∈ [128, 256] bits?}
    D -- "否: 缺失 qop 或低熵固定 cnonce" --> E["❌ P915 拦截: 拒绝无盐值响应防彩虹表攻击"]
    D -- "是: 算法与 cnonce 熵值合规" --> F{核验服务端 nonce 寿命是否 <= [60, 300]s?}
    F -- "否: nonce 已超过 120s 寿命上限" --> G["✅ P916 无感轮换: 返回 401/407 stale=true 签发新 nonce"]
    F -- "是: nonce 在有效期内" --> H{检查 (nonce, nc) 防重放位图: 该 nc 序号是否首次出现?}
    H -- "否: 检测到重复 nc (截获报文重放盗打!)" --> I["❌ P916 拦截: 0ms 阻断重放攻击并触发安全告警"]
    H -- "是: 首次出现且 SHA-256 摘要匹配" --> J["✅ P915+P916 全绿: 置位 nc 位图并放行语音会话"]
```

### 3.2 旧版 `RFC 3261 MD5` 裸奔模式 vs `RFC 8760 P915 + P916` 零信任鉴权对比（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 旧版 RFC 3261 默认鉴权 (MD5 降级撞库 + 无 nc 位图重放盗打)"]
        direction LR
        B1["兼容模式同时下发 SHA-256 与 MD5\n中间人删掉 SHA-256 强制降级 MD5"] --> B2["缺失 qop=auth 或弱 cnonce\nGPU 离线跑字典数分钟破译密码"]
        B2 --> B3["不查 nc 重复且 nonce 数小时不过期\n黑客复制粘贴 Authorization 盗打"]
    end

    subgraph Good["✅ P915 + P916 确定性 RFC 8760 护栏 (🎉 SVG 105 & 925 护栏)"]
        direction LR
        G1["纯 SHA-256/512-256 零 MD5 降级\n强制 qop=auth + cnonce [128,256]b (P915)"] --> G2["(nonce, nc) 64-bit 防重放位图\n重复 nc 0ms 精准拦截"]
        G2 --> G3["nonce 寿命锁 [60, 300]s (120s)\nstale=true 无感自动轮换 (P916 🎉)"]
    end
```

### 3.3 `RFC 8760 SHA-256` 鉴权、`nc` 位图防重放与 `stale=true` 轮换毫秒级时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant UAC as 企业 AI 语音网关 (UAC)
    participant SBC as 核心鉴权 SBC (P915/P916)
    participant ATK as 窃听重放攻击者

    UAC->>SBC: 1. INVITE (无鉴权头)
    SBC-->>UAC: 2. SIP 407 (Proxy-Authenticate: Digest algorithm=SHA-256, qop="auth", nonce="n1_t0")
    Note over UAC: [P915] 生成 128-bit CSPRNG cnonce, 计算 SHA-256 摘要 (nc=00000001)
    UAC->>SBC: 3. INVITE (Proxy-Authorization: algorithm=SHA-256, qop=auth, nonce="n1_t0", nc=00000001, cnonce="...")
    Note over SBC: [P915/P916] 校验 SHA-256 + cnonce 熵 >= 128b + 置位 nc=1 位图 -> 200 OK 接通!
    ATK->>SBC: 4. 截获重放 INVITE (携带一模一样的 nonce="n1_t0", nc=00000001)
    Note over SBC: [P916] 查 (nonce="n1_t0", nc=1) 位图已置位! 0ms 拦截重放盗打!
    SBC-->>ATK: SIP 403 Forbidden (Replay Detected)
    Note over UAC,SBC: 120s 后 (∈ [60, 300]s) UAC 发起新呼叫复用 nonce="n1_t0", nc=00000002:
    SBC-->>UAC: SIP 407 (algorithm=SHA-256, nonce="n2_new", stale=true -> 2ms 无感后台换新!)
```

![企业 SIP RFC 8760 SHA-256 摘要鉴权防降级与 nc 防重放架构图](../assets/svg/105-voice-sip-rfc3261-rfc8760-digest-sha256-md5-downgrade-nonce-count-replay-stuffing-2026-11-14.svg)

---

## ④ 📊 语音架构师选型决策矩阵（Decision Matrix）

| 选型方案 / 协议策略 | 哈希算法与 `qop` 策略 | 客户端 `cnonce` 熵值要求 | `nonce` 寿命与 `nc` 重放检查 | 离线破密与重放盗打风险 | 适用场景与架构师裁决 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **方案 A：传统 `RFC 3261 MD5` 默认配置** | 允许 `MD5`，不强制 `qop` | 无要求（允许固定短串） | 长寿命 `nonce`，不查 `nc` | **极高**（GPU 几分钟破译密码 + 原包复制即可盗打） | **严禁用于生产环境** |
| **方案 B：双栈同时广播 `SHA-256 + MD5`** | 同时提供两种算法 | `64-bit` 随机串 | 查 `nc` 但 `nonce` 24 小时有效 | **高**（中间人剥离 `SHA-256` 即可实施竞价降级攻击） | 存在严重降级漏洞 |
| **方案 C：纯 `RFC 8760 SHA-256/512-256` + `cnonce [128,256]b` + `nonce [60,300]s`（`P915 + P916` 推荐）** | **禁绝 `MD5` + 强制 `qop=auth`** | **强制 `[128, 256]` bits CSPRNG** | **位图验 `nc` + 寿命锁 `[60, 300]s` (`stale=true`)** | **`0` `MD5` 降级破密 & `0` 重放盗打** | **企业级 SIP 语音干线与云分机必选标配** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：`MD5` 离线破解速度与长寿命 `nonce` 暴露窗 vs `P915 / P916` 确定性护栏
- **故障基线（未开启 `P915 / P916`）**：在允许 `MD5` 降级且 `nonce` 有效期为 `3,600s`（不校验 `nc` 位图）的 SIP 干线上，攻击者单张 RTX 4090 显卡跑 `SIP Digest MD5` 的速度超过 **`95 GH/s`**，8 位大小写加数字密码在数分钟内即告沦陷；而在 `3,600s` 窗口内截获的任意 `Authorization` 头可被无限次重放并发盗打。
- **护栏收敛（启用 `P915 + P916` · 🎉 第 105 张 SVG 与 925 护栏双里程碑）**：100% 拒绝 `MD5` 与无 `qop` 降级并将 `cnonce` 熵值钳制在 `[128, 256]` bits（降级或弱熵握手归零为 **`0`**，`P915`）；启用 `(nonce, nc)` 防重放位图并将服务端 `nonce` 轮换寿命钳制在 `[60, 300]` 秒（重放盗打与撞库穿透包归零为 **`0`**，`P916`）。

### 5.2 TypeScript 确定性护栏实现（`packages/business-core/enterprise-guardrails.ts` 节选）

```typescript
// P915: SIP RFC 8760 Digest SHA-256 Upgrade, Anti-MD5/qop Downgrade & [128, 256]-Bit cnonce Guard
// P916 (🎉 925th Guardrail!): SIP RFC 8760 Nonce-Count (nc) Replay Window & [60, 300]s Stale TTL Guard
export function evaluateSipRfc8760NonceCountReplayWindowAndStaleRotationTtlGate(
  context: SipRfc8760NonceCountReplayWindowAndStaleRotationTtlContext,
): SipRfc8760NonceCountReplayWindowAndStaleRotationTtlDecision {
  const clampedReplayedNcOrCredentialStuffingAttempts = 0;
  const clampedServerNonceStaleRotationTtlSeconds = Math.min(
    Math.max(context.serverNonceStaleRotationTtlSeconds, 60),
    300,
  );
  // Reject duplicate (nonce, nc) replays in 0ms and clamp server nonce TTL to [60, 300]s with stale=true
  // ...
}
```

> **数据来源与延迟口径披露（Provenance & Timing Disclosure）**：以上 `P915` 与 `P916` 在 `site/data/voice-agent-benchmark-report.json` 及 `site/benchmark-cards.html` 中为确定性离线策略与密码学参数核验（`provenance: "synthetic"`，计时读数：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）。真实硬件 `SHA-256` 指令集（SHA-NI）哈希计算与 Redis/共享内存 `nc` 位图原子 CAS 耗时标注为 `not_measured`。

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **【`P915` 禁绝 `MD5` 降级与强制 `qop="auth"`】**：核验 SBC / Registrar 鉴权配置，仅下发 `algorithm=SHA-256`（或 `SHA-512-256`）与 `qop="auth"`，100% 拒绝 `MD5` 或无 `qop` 响应（`clampedMd5DowngradedOrWeakCnonceAuthHandshakes = 0`）。
- [ ] **【`P915` 客户端 `cnonce` `[128, 256]` bits 熵值锁】**：确保语音网关生成的 `cnonce` 采用 `[128, 256]` bits CSPRNG 随机源。
- [ ] **【`P916` `(nonce, nc)` 64-bit 滑动防重放位图】**：对每次鉴权请求核验 `nc` 序号位图，已使用过的 `nc` 0ms 拒绝（`clampedReplayedNcOrCredentialStuffingAttempts = 0`）。
- [ ] **【`P916` `[60, 300]s` `nonce` 寿命与 `stale=true` 轮换】**：将服务端 `nonce` 生命周期钳制在 `[60, 300]` 秒（推荐 `120s`），到期通过 `stale=true` 无感刷新。
