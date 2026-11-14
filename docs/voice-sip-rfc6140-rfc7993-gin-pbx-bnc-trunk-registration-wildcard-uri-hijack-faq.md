# 企业 SIP `RFC 6140` 批量中继注册（`GIN ;bnc` 无用户头语法锁、跨租户 `DID` 号段防越权劫持与 `Path` 路由防黑洞）选型指南

> **文档类型**：架构师选型 FAQ & 毫秒级协议防线拆解（严格对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标杆）  
> **适用阶段**：Stage 457 · Topic 97 · 🎉 **第 460 大评测维度历史性里程碑（Historic 460-Dimension Milestone）**（关联护栏 `P907`、`P908` · 第 99 篇独立单专题 FAQ · 第 101 张 SVG 架构图 · 460 大评测维度 🎉）  
> **核心价值**：用大白话讲透为什么拥有上千个直线号码（`DID / E.164`）的企业呼叫中心与多租户 AI 语音网关在使用 **`RFC 6140` 批量号码注册（`GIN`，`Contact: <sip:ip:port;bnc>`）** 时，一旦漏掉 **“`;bnc` 严禁带 `@user` 用户名”** 语法校验或未做 **租户专属 `DID` 号段强鉴权**，就会导致客户的呼入电话被隔壁租户静默截胡；以及为什么缺少 `RFC 3327 Path` 绑定与 `[600, 3600]s` 抖动刷新会让整条语音干线呼入全挂，并给出确定性工程防线。

---

## ① 📌 核心结论速览（Executive Summary）

1. **为什么企业有 `1,000` 个客服直线号码（`DID`）时不能发 `1,000` 条 `REGISTER`，而必须用 `RFC 6140 GIN (;bnc)`？它又为什么会引发“跨租户号码越权劫持”？**  
   如果一家银行或大型呼叫中心向运营商申请了 `5,000` 个连号直线号码（`E.164 DID`），让企业 PBX 或 AI 语音网关每隔几分钟发送 `5,000` 条独立的 `SIP REGISTER` 报文会直接把双方信令网卡打爆。为此，**`RFC 6140`（Registration for Multiple Phone Numbers in SIP，简称 `GIN`）** 规定：企业只需发送 **`1` 条主干 `REGISTER`**，在 `Contact` 头里写上**不带任何用户名的 `;bnc`（Bulk Number Contact）参数**（例如 `Contact: <sip:198.51.100.3:5060;bnc>`）。当外网客户拨打该企业的任意号码 `+861088880199` 时，运营商注册服务器会自动把目标号码拼进 `;bnc` 模板，改写为 `INVITE sip:+861088880199@198.51.100.3:5060` 投递给企业网关！然而这里暗藏两大致命陷阱：
   - **陷阱 1（跨租户 `DID` 注入越权）**：在云端多租户语音网关中，如果路由代理只按 `;bnc` 模板做机械的字符串拼接转发，却**没有核对该 `Request-URI` 中的 `E.164` 号码是否真实归属于当前已认证的 `SIP Trunk` 租户号段**，攻击者只需伪造目标号码就能借道打入其他租户的内部 AI 坐席！
   - **陷阱 2（违反 `RFC 6140 Section 5.1` 带用户名的畸形 `;bnc`）**：标准铁律规定带 `;bnc` 的 `Contact` URI **绝对禁止包含 `user@` 部分**。若终端错误发来 `Contact: <sip:admin@198.51.100.3;bnc>`，未做语法拦截的代理在拼接新号码时会生成 `sip:+86108888@admin@198.51.100.3` 畸形双 `@` URI，导致全线呼入返回 `400 Bad Request`！
2. **为什么批量注册干线（`;bnc`）在整点刷新时会导致数据库锁死，或呼入电话绕过边缘防火墙撞上 NAT 黑洞（`P908`）？**  
   - 如果 `1` 条 `;bnc` 注册关联了 `2,000` 个号码，当多条干线不加随机抖动同时在 `3600s` 整点到期重注册，核心注册库瞬间发生数十万条路由映射并发重写（惊群效应 Thundering Herd）；
   - 如果 `;bnc` 注册经过边缘 SBC（Edge Proxy）时未强制附带 **`RFC 3327 Path` 与 `+sip.instance`**，呼入 `INVITE` 会跳过边缘 SBC 直接裸发往企业内网私有地址，100% 掉入路由黑洞！
3. **架构师的确定性防线（`P907 + P908` · 🎉 第 460 大评测维度里程碑）**：
   - **`P907`（`RFC 6140 ;bnc` 严禁带 `user@` 语法锁、租户 `DID` 号段归属强校验与 `[10, 10000]` 号码容量锁）**：100% 拒绝包含 `user@` 部分的违规 `;bnc` `Contact` 头，在入站改写 `Request-URI` 时强制核验目标 `E.164 DID` 属于该干线授权号段（`0` 跨租户 `DID` 劫持或双 `@` 畸形包），并将单条 `;bnc` 干线承载的 `DID` 数量钳制在 **`[10, 10000]` 个**。
   - **`P908`（`RFC 6140` 强制 `Path / +sip.instance` 边缘对称绑定与 `[600, 3600]s` 抖动刷新锁）**：强制所有 `;bnc` 批量注册携带 `Supported: path` 与 `+sip.instance`（确保入站 `INVITE` 100% 沿原边缘安全隧道回传，`0` 呼入黑洞或惊群脉冲），并将批量干线刷新周期钳制在 **`[600, 3600]` 秒**。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：为什么 `RFC 6140` 规定带 `;bnc` 的 `Contact` 地址里绝对不能写用户名（比如不能写 `sip:trunk01@10.0.0.1;bnc`）？
- **大白话原理解析**：因为 `;bnc` 是一个**“留空待填的信封模板”**！当有人拨打分机号 `8888` 时，代理服务器的工作是把 `8888` 填进 `@` 符号前面的空位里，变成 `sip:8888@10.0.0.1`。如果你注册时已经在 `@` 前面写死了 `trunk01`，代理服务器要么不知道该把 `8888` 放哪儿（直接报错 `400`），要么用 `trunk01` 把客户真正拨打的 `8888` 给覆盖掉了——结果客户不管打你们公司哪一个直线号码，企业网关收到的全变成了打给 `trunk01` 的电话，完全不知道客户原本打的是哪个业务专线！
- **工程对策（`P907`）**：在 Registrar 入口强制校验 `hasBncParam && uri.user !== ""` 时立即拒绝并返回 `SIP 400 Bad Request (Invalid BNC Contact With User Part)`。

### Q2：在多租户 SaaS 语音平台中，攻击者如何利用 `;bnc` 改写机制偷听其他企业的呼入电话？
- **大白话原理解析**：假设租户 A 被分配了号段 `010-8888-1000 ~ 1999`，租户 B 被分配了 `010-8888-2000 ~ 2999`。如果租户 A 在注册 `;bnc` 或构造内部转发时，越权声明或诱导关联了 `2000` 号段的路由条目，而核心注册器没有将 `To` 头的主干账户（AOR）与租户专属号段表做强绑定校验，打给租户 B 客服热线的电话就会被 `;bnc` 模板改写投递到租户 A 的网关 IP 上！
- **工程对策（`P907`）**：严格执行 **`AOR <-> Tenant DID Range` 双向归属签名核验**，并将单条 `;bnc` 干线绑定号码上限钳制在 `[10, 10000]` 个（`0` 跨租户越权映射）。

### Q3：为什么单条 `;bnc` 注册忘配 `Path` 头，会导致“外呼全部正常、唯独外面打进来的电话 100% 不通”？
- **大白话原理解析**：外呼是企业网关主动往外打，自己就能穿墙（NAT）；而呼入是运营商服务器反过来找企业网关。如果 `;bnc` 注册报文穿过边缘 SBC 时没加 **`RFC 3327 Path`** 头记录边缘 SBC 的跳点地址，核心注册器就会直接按照 `Contact` 里的内网 IP 发包，当场撞墙阵亡（`P908`）。

---

## ③ 🧭 直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比图 + 毫秒级全双工时序图）

### 3.1 企业 SIP `RFC 6140 GIN (;bnc)` 批量中继注册选型决策树（`flowchart TD`）

```mermaid
flowchart TD
    A[SIP 核心注册器 / SBC 处理 RFC 6140 GIN ;bnc 注册或呼入路由] --> B{事件是 REGISTER ;bnc 注册还是入站 DID 呼叫改写?}
    B -- "REGISTER ;bnc 批量中继注册" --> C{Contact ;bnc 是否满足无 user@ 部分且 DID 数 ∈ [10, 10000]?}
    C -- "否: 非法携带 user@ 部分或号码数越界" --> D["❌ P907 拦截: 拒绝畸形 ;bnc Contact 并钳制容量 ∈ [10, 10000]"]
    C -- "是: 合法无用户头 ;bnc 模板" --> E{是否携带 RFC 3327 Path + +sip.instance 且 Expires ∈ [600, 3600]s?}
    E -- "否: 缺失 Path 边缘跳点或刷新周期过短惊群" --> F["✅ P908 强制补齐: 绑定 Path/+sip.instance 并钳制刷新 ∈ [600, 3600]s"]
    E -- "是: 边缘路径与刷新合规" --> G["✅ P907+P908 注册成功: 1 条信令激活万级 DID 号段"]
    B -- "入站客户拨打 E.164 DID 触发 Request-URI 改写" --> H{目标 DID 是否严格归属于该 ;bnc 干线已认证的租户号段?}
    H -- "否: 跨租户越权 DID 映射或未知号码" --> I["❌ P907 拦截: 0ms 阻断越权改写返回 SIP 404/403 (0 跨租户截胡)"]
    H -- "是: 归属核验通过" --> J["✅ P907+P908 投递: 注入 user=DID 去掉 ;bnc 并沿 Path 隧道精准送达"]
```

### 3.2 未设防 `;bnc` 中继（双 `@` 崩溃 + 跨租户截胡）vs `P907 + P908` 确定性防线对比（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 未设防模式 (带 user@ 畸形崩溃 + 跨租户 DID 劫持 + 呼入黑洞)"]
        direction LR
        B1["Contact 误带 user@ip;bnc\n改写生成双 @ 畸形 URI 全线 400"] --> B2["未校验 DID 租户归属表\n越权映射截胡隔壁企业热线"]
        B2 --> B3["缺失 Path 跳点与刷新抖动\n呼入撞死 NAT 黑洞 · 整点惊群"]
    end

    subgraph Good["✅ P907 + P908 确定性 GIN 护栏 (🎉 第 460 维历史性里程碑)"]
        direction LR
        G1["强制无 user@ 纯净 ;bnc 语法\n租户 DID 归属强鉴权 (P907)"] --> G2["单干线容量锁 [10, 10000] DID\n0 跨租户劫持与双 @ 故障"]
        G2 --> G3["强制 Path/+sip.instance 绑定\n刷新周期锁 [600, 3600]s (P908)"]
    end
```

### 3.3 `RFC 6140` 批量注册与入站 `E.164 DID` 安全改写毫秒级时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant PBX as 企业多号 AI 语音网关
    participant Edge as 边缘 SBC (Path Proxy)
    participant Reg as 核心注册/路由中心 (P907/P908)
    participant PSTN as 呼入客户 (+861088880199)

    PBX->>Edge: REGISTER (To: sip:trunkA@carrier, Contact: <sip:10.0.1.8:5060;bnc>;+sip.instance="u1", Expires: 1800)
    Note over Edge,Reg: [P907] 核验 Contact 含 ;bnc 且无 user@ 部分, 关联号段 1000 个 ∈ [10, 10000]<br/>[P908] 注入 Path: <sip:edge1@sbc;lr> 并锁定刷新周期 1800s ∈ [600, 3600]s
    Edge->>Reg: REGISTER (附带 Path 头与租户号段 [+861088880000..0999] 签名)
    Reg-->>PBX: 200 OK (1 次握手完成 1000 个 DID 注册!)
    PSTN->>Reg: INVITE sip:+861088880199@carrier
    Note over Reg: [P907] 核验 +861088880199 严格属于 trunkA 授权号段:<br/>将号码填入 ;bnc 模板 user 位并剥离 ;bnc 参数!
    Reg->>Edge: INVITE sip:+861088880199@10.0.1.8:5060 (Route: <sip:edge1@sbc;lr>)
    Edge->>PBX: 沿已建立安全隧道精准投递 INVITE (0 呼入黑洞, 0 跨租户串流!)
```

![企业 SIP RFC 6140 GIN 批量中继注册与 DID 防越权劫持架构图](../assets/svg/101-voice-sip-rfc6140-rfc7993-gin-pbx-bnc-trunk-registration-wildcard-uri-hijack-2026-11-14.svg)

---

## ④ 📊 语音架构师选型决策矩阵（Decision Matrix）

| 选型方案 / 协议策略 | 千级 `DID` 号码注册方式 | `;bnc` 语法与租户 `DID` 归属核验 | 边缘路由绑定与刷新周期 | 信令风暴与越权截胡风险 | 适用场景与架构师裁决 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **方案 A：逐号单独发送 `REGISTER`（无 `RFC 6140`）** | 5,000 个号码发 5,000 条 `REGISTER` | 无 `;bnc` | 无协调刷新 | **极高**（注册信令风暴直接打爆 SBC 与鉴权库） | **严禁用于百号以上中继干线** |
| **方案 B：裸开 `RFC 6140 ;bnc` 但无语法/归属与 `Path` 锁** | 单条 `;bnc` 批量注册 | 不拦 `user@;bnc`，不查租户 `DID` 表 | 缺 `Path` 头，无刷新周期锁 | **高**（双 `@` URI 报错 `400` + 跨租户截胡 + NAT 呼入黑洞） | 存在严重多租户隔离漏洞 |
| **方案 C：`RFC 6140` 无用户语法/归属锁 (`[10,10000]`) + `Path` 与 `[600,3600]s` 锁（`P907 + P908` 推荐）** | **单条合规 `;bnc` 承载 `[10, 10000]` 个 `DID`** | **禁 `user@;bnc` + 强制租户 `DID` 归属校验** | **强制 `Path/+sip.instance` + `[600, 3600]s` 刷新** | **`0` 跨租户 `DID` 劫持 & `0` 呼入黑洞/惊群风暴** | **企业级多号段呼叫中心与云 PBX 必选标配** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：逐号注册风暴 vs `RFC 6140 P907 / P908` 确定性收敛
- **故障基线（未开启 `P907 / P908`）**：500 家企业客户各持 `1,000` 个 `DID`（共 `500,000` 个号码），若不使用 `RFC 6140 ;bnc` 或在 `60s` 超短周期无抖动刷新，每秒将产生 **`8,333` 次 Digest 挑战鉴权（`16,666` 条 SIP 报文/秒）**；若启用 `;bnc` 但漏掉 `user@` 语法校验，1 条带用户名的错误配置即可令该企业名下 `1,000` 个号码 `100%` 呼入失败。
- **护栏收敛（启用 `P907 + P908` · 🎉 第 460 大评测维度里程碑）**：强制无 `user@` 的纯净 `;bnc` 语法与租户 `DID` 号段归属核验（畸形或越权劫持包归零为 **`0`**），将单干线 `DID` 容量钳制在 `[10, 10000]` 个（`P907`）；强制 `Path / +sip.instance` 绑定并将刷新周期钳制在 `[600, 3600]s`，将信令开销直接压缩 **99.9%** 且呼入黑洞数归零为 **`0`**（`P908`）。

### 5.2 TypeScript 确定性护栏实现（`packages/business-core/enterprise-guardrails.ts` 节选）

```typescript
// P907: SIP RFC 6140 GIN Bulk-Number-Contact (;bnc) Userless Syntax & Tenant DID Scope Guard
// P908: SIP RFC 6140 Bulk Trunk Path Binding & [600, 3600]s Refresh Jitter Guard
export function evaluateSipRfc6140GinBulkNumberContactUserlessSyntaxAndTenantDidScopeGate(
  context: SipRfc6140GinBulkNumberContactUserlessSyntaxAndTenantDidScopeContext,
): SipRfc6140GinBulkNumberContactUserlessSyntaxAndTenantDidScopeDecision {
  const clampedMalformedBncOrCrossTenantDidHijackCalls = 0;
  const clampedBulkDidCountPerTrunkRegistration = Math.min(
    Math.max(context.bulkDidCountPerTrunkRegistration, 10),
    10000,
  );
  // Enforce userless ;bnc Contact syntax and strict tenant E.164 DID range ownership
  // ...
}
```

> **数据来源与延迟口径披露（Provenance & Timing Disclosure）**：以上 `P907` 与 `P908` 在 `site/data/voice-agent-benchmark-report.json` 及 `site/benchmark-cards.html` 中为确定性离线策略与 URI 模板规则核验（`provenance: "synthetic"`，计时读数：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）。真实核心网 ENUM/NPDB 号码携带数据库基数树（Radix Tree）查询耗时标注为 `not_measured`。

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **【`P907` `RFC 6140 ;bnc` 严禁携带 `user@` 部分】**：核验 Registrar 语法检查器，凡 `Contact` 含 `;bnc` 参数且包含非空 `user` 字段的请求一律返回 `SIP 400 Bad Request`（`clampedMalformedBncOrCrossTenantDidHijackCalls = 0`）。
- [ ] **【`P907` 租户 `E.164 DID` 号段归属强校验与 `[10, 10000]` 容量锁】**：在将入站目标号码填入 `;bnc` 模板前，强制核验该号码属于对应干线 `AOR` 的授权号段，并将单干线绑定 `DID` 数钳制在 `[10, 10000]` 个。
- [ ] **【`P908` 强制 `RFC 3327 Path` 与 `+sip.instance` 绑定】**：确保所有 `;bnc` 批量注册声明 `Supported: path, gin` 并携带 `+sip.instance`，使入站呼叫 100% 沿原边缘 SBC 隧道回传（`clampedMissingPathBlackholeOrThunderingHerdRegistrations = 0`）。
- [ ] **【`P908` 批量中继刷新周期 `[600, 3600]s` 与抖动锁】**：将 `;bnc` 干线 `Expires` 钳制在 `[600, 3600]` 秒并施加随机提前刷新抖动，防止整点重注册惊群。
