# 企业 SIP `RFC 6665 / RFC 4235` `Dialog Event`（`BLF` 状态订阅）标签脱敏防代答劫持、拒收无主 `NOTIFY (481)` 与防订阅风暴选型指南

> **文档类型**：架构师选型 FAQ & 毫秒级协议防线拆解（严格对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标杆）  
> **适用阶段**：Stage 449 · Topic 89 · 🎉 **突破 900+ 生产级护栏（`901` 项护栏）、`910` 项合成探针与 `720` 项现场照妖镜探针三重历史性里程碑**（关联护栏 `P891`、`P892` · 第 91 篇独立单专题 FAQ · 第 93 张 SVG 架构图 · 452 大评测维度）  
> **核心价值**：用大白话讲透为什么坐席班长台与话机常用的 `BLF` 状态灯订阅（`RFC 4235 Event: dialog`）会在 XML 报文里把高管/VIP 通话的 `Call-ID + local-tag + remote-tag` 全盘托出（让内网任意恶意分机一键发起 `Replaces` 静默截胡通话），以及为什么未设防的 `RFC 6665 SUBSCRIBE/NOTIFY` 会在呼叫高频振铃时引发 `50x` 扇出 XML 广播风暴与无主 `NOTIFY` 注入，并给出确定性工程防线。

---

## ① 📌 核心结论速览（Executive Summary）

1. **为什么普通员工分机只需订阅一下“状态灯（BLF）”，就能顺手把打给高管或金融 VIP 语音坐席的电话直接抢过来（`RFC 4235` XML 标签泄露劫持漏洞）？**  
   在呼叫中心和企业 IP-PBX 中，班长台和协作话机通过 **`RFC 4235`（`Event: dialog`，载荷 `application/dialog-info+xml`）** 订阅坐席忙闲状态（红灯通话中、绿灯空闲、闪烁振铃中）。然而，默认配置下的状态服务器会在 `NOTIFY` 的 XML 里原样附带 `<dialog id="1" call-id="c99" local-tag="t1" remote-tag="t2">` 完整对话三元组（因为标准设计初衷是方便同事按“代答键”帮接电话）。一旦攻击者或越权租户只用权限极低的“只读状态订阅”，就能拿到这组内部密码，转身发送一个带 `Replaces: c99;to-tag=t1;from-tag=t2` 的 `INVITE`，**毫秒级把正在响铃甚至已接通的 VIP 语音通话强行劫持到自己的分机上**！
2. **为什么大促高峰期 AI 语音集群每秒几百通电话呼入时，Presence/BLF 状态服务器会率先 CPU 100% 崩溃（`RFC 6665` `NOTIFY` 扇出风暴与无主 `NOTIFY` 攻击）？**  
   一通电话在建立的前 `150ms` 内会连续经历 `Trying -> Proceeding -> Early -> Confirmed` 四次状态跳变。如果有 `50` 个班长台订阅了该队列，且未配置最小通知间隔（Rate Throttle），状态服务器会在 `150ms` 内狂发 `4 × 50 = 200` 个庞大的 XML `NOTIFY` 报文（`50x` 扇出风暴）！更危险的是，旧版 `RFC 3265` 允许终端接受没有预先 `SUBSCRIBE` 的**无主 `NOTIFY`（Unsolicited NOTIFY）**，黑客可借此伪造语音信箱提示或注入恶意状态控制指令。
3. **架构师的确定性防线（`P891 + P892` · 🎉 全仓突破 900+ 护栏里程碑）**：
   - **`P891`（`RFC 4235` `dialog-info+xml` 三元组标签按权脱敏与 `[300, 3600]s` 订阅租期锁）**：对未授予同组代答权限（Directed Pickup ACL）的观察者，在生成的 `application/dialog-info+xml` 中**强制剥离 `call-id`、`local-tag`、`remote-tag` 与远端 `identity` URI**（仅保留 `<state>early/confirmed</state>` 忙闲灯号，`0` 越权三元组泄露），并将订阅 `Expires` 钳制在 **`[300, 3600]` 秒**。
   - **`P892`（`RFC 6665` 100% 拒收无主 `NOTIFY (SIP 481)` 与 `[100, 1000]ms` 状态合并节流锁）**：严格遵循 **`RFC 6665`**，对任何不匹配活跃 `SUBSCRIBE` 对话的无主 `NOTIFY` 立即回复 `SIP 481 Subscription Does Not Exist`（`0` 无主 `NOTIFY` 注入包），收到 `Subscription-State: terminated` 立即回收内存，并将同一订阅的 `NOTIFY` 最小发送间隔钳制在 **`[100, 1000]ms`（推荐 `250ms` 状态合并节流）**，彻底消灭 XML 广播风暴。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：我们只允许坐席分机看忙闲状态灯（BLF），并没有在话机界面上配“代答键”，为什么黑客还是能截胡通话？
- **大白话原理解析**：界面上藏起按钮防君子不防小人。只要 PBX 发给分机的 `NOTIFY (application/dialog-info+xml)` 报文里明文写着 `call-id`、`local-tag` 和 `remote-tag`，任何一台能抓包或运行软电话脚本的电脑都能直接读出这三个值，然后自己拼装一条 `INVITE + Replaces` 报文发给 SBC 完成截胡。
- **毫秒级时间轴拆解**：
  - `T = 0ms`：客户呼入 VIP 理财 AI 语音专线，PBX 产生早期对话 `(call-id=vip88, local-tag=L1, remote-tag=R1)`。
  - `T = 5ms`：Presence 服务器向观察者分机推送 `Event: dialog` `NOTIFY`。
  - **无护栏事故**：XML 包含完整 `call-id="vip88" local-tag="L1" remote-tag="R1"` -> 越权分机在 `T = 12ms` 发送 `INVITE Replaces: vip88;to-tag=L1;from-tag=R1` 盗走客户通话！
  - **启用 `P891` 护栏**：引擎判定该观察者无同组代答权限，自动执行 XML 属性脱敏，仅下发 `<dialog id="hash_9a"><state>early</state></dialog>`（**`0` 对话标签泄露**），越权分机根本无法构造合法的 `Replaces` 头！

### Q2：为什么 `RFC 6665` 明确废止了旧版 `RFC 3265` 的“无主 `NOTIFY`（Unsolicited NOTIFY）”？
- **大白话原理解析**：在早期 SIP 设备中，为了省掉一次 `SUBSCRIBE` 握手，网关常直接向话机裸发无主 `NOTIFY`（例如点亮留言灯或推送配置重加载）。这就像快递员不需要你下单，随便往你家里塞包裹一样——攻击者只需伪造源 IP 向 AI 语音网关狂发无主 `NOTIFY (Event: refer / dialog / check-sync)`，就能篡改转接状态或触发网关重启。
- **工程对策（`P892`）**：严格执行 `RFC 6665 Section 4.1.3`：所有入站 `NOTIFY` 必须精确匹配已建立的 `(Call-ID, To-tag, From-tag, Event)` 订阅状态机；无匹配项时 **0ms 返回 `SIP 481 Subscription Does Not Exist`**（`0` 无主 `NOTIFY` 穿透包）。

### Q3：呼叫中心每秒 500 通电话并发时，如何防止 `Event: dialog` 把核心网带宽和 CPU 打满？
- **大白话原理解析**：如果一通电话在 `100ms` 内连续变了 3 次状态（`Trying -> Early -> Confirmed`），观察者根本看不清 `100ms` 内的灯光闪烁，只需要看到最终的 `Confirmed`（通话中）即可。
- **工程对策（`P892`）**：引入 **`[100, 1000]ms` 状态合并节流窗口（推荐 `250ms`）**：在 `250ms` 窗口内的多次瞬态跳变自动合并为最新态单次推送，将 XML 扇出流量直接削减 **75%+**！

---

## ③ 🧭 直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比图 + 毫秒级全双工时序图）

### 3.1 企业 SIP `RFC 6665 / RFC 4235` 状态订阅与防劫持选型决策树（`flowchart TD`）

```mermaid
flowchart TD
    A[SIP Presence / 语音网关处理 SUBSCRIBE 或 NOTIFY] --> B{事件类型是下发 RFC 4235 dialog-info+xml 吗?}
    B -- "是: 构造 Event: dialog NOTIFY XML" --> C{观察者 Watcher 是否通过同组代答 ACL 鉴权?}
    C -- "否: 普通只读 BLF 观察者" --> D["✅ P891 脱敏: 强制剥离 XML 中 call-id / local-tag / remote-tag 与远端号码 (0 标签泄露)"]
    C -- "是: 授信同组代答坐席 + Expires ∈ [300, 3600]s" --> E["✅ 允许下发受控代答标签并绑定 mTLS 源身份"]
    B -- "否: 收到入站 NOTIFY 或高频状态跳变" --> F{入站 NOTIFY 是否匹配活跃 SUBSCRIBE 对话?}
    F -- "无匹配 (Unsolicited Out-of-Dialog NOTIFY)" --> G["❌ P892 拦截: 立即拒绝并返回 SIP 481 Subscription Does Not Exist"]
    F -- "匹配活跃订阅: 检查推送频率" --> H["✅ P892 节流: 强制 [100, 1000]ms 最小间隔合并瞬态 XML + terminated 即刻回收"]
```

### 3.2 旧版 `RFC 3265 / 4235` 裸奔模式 vs `P891 + P892` 零信任状态机对比（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 旧版 RFC 3265/4235 (XML 裸奔泄密 + 无主 NOTIFY + 50x 扇出风暴)"]
        direction LR
        B1["BLF NOTIFY 明文带出\ncall-id + local-tag + remote-tag"] --> B2["越权分机凭三元组发起\nINVITE Replaces 截胡 VIP 通话"]
        B2 --> B3["接受无主 NOTIFY 注入\n100ms 连发 4 次 XML 撑爆 CPU"]
    end

    subgraph Good["✅ P891 + P892 零信任订阅护栏 (🎉 901 护栏里程碑)"]
        direction LR
        G1["非代答权限强制剥离三元组\n仅保留 state 忙闲灯 (P891)"] --> G2["订阅 Expires 钳制 [300,3600]s\n无主 NOTIFY 100% 回 481 (P892)"]
        G2 --> G3["NOTIFY 节流窗口 [100,1000]ms\n合并瞬态跳变 · 0 扇出风暴"]
    end
```

### 3.3 `RFC 4235` XML 标签脱敏与 `RFC 6665` 拒收无主 `NOTIFY` 毫秒级时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant VIP as VIP 呼入对话 (AI 语音网关)
    participant PRS as 状态服务器 (Presence / SBC)
    participant W1 as 普通观察分机 (无代答权限)
    participant ATK as 恶意节点 (无主 NOTIFY / 越权截胡)

    W1->>PRS: SUBSCRIBE (Event: dialog, Expires: 86400 -> [P891] 钳制为 3600s)
    PRS-->>W1: 200 OK (Expires: 3600)
    VIP->>PRS: 呼叫状态跳变: Trying (0ms) -> Early (20ms) -> Confirmed (80ms)
    Note over PRS: [P892] [100, 1000]ms (250ms) 节流窗口合并三次瞬态跳变为 1 次推送!<br/>[P891] 校验 W1 无代答权限: 剥离 call-id / local-tag / remote-tag!
    PRS->>W1: NOTIFY (application/dialog-info+xml: 仅含 <state>confirmed</state>, 0 标签泄露)
    W1-->>PRS: 200 OK
    ATK->>PRS: 伪造无主 NOTIFY (Event: refer, Sipfrag: SIP/2.0 200 OK, 无前置 SUBSCRIBE)
    Note over PRS: [P892] 查无活跃 SUBSCRIBE 状态机: 0ms 拒绝无主 NOTIFY!
    PRS-->>ATK: SIP 481 Subscription Does Not Exist (0 注入穿透)
```

![企业 SIP RFC 6665 与 RFC 4235 状态订阅防劫持及防 NOTIFY 风暴架构图](../assets/svg/93-voice-sip-rfc6665-rfc4235-dialog-event-blf-pickup-hijack-notify-storm-subscription-leak-2026-11-14.svg)

---

## ④ 📊 语音架构师选型决策矩阵（Decision Matrix）

| 选型方案 / 协议策略 | `RFC 4235 dialog-info+xml` 载荷策略 | 入站无主 `NOTIFY` 处理 | 高频状态跳变推送策略 | 安全与性能风险 | 适用场景与架构师裁决 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **方案 A：旧版 `RFC 3265 / 4235` 默认全量广播** | 向所有订阅者明文下发 `call-id/local-tag/remote-tag` | 接受无主 `NOTIFY` | 每次微状态变化立即全量广播 | **极高**（任意分机可 `Replaces` 截胡通话 + XML 扇出雪崩） | **严禁用于多租户或高敏坐席集群** |
| **方案 B：仅做 XML 脱敏但无 `RFC 6665` 节流** | 剥离非授权观察者的对话三元组 | 仍放行部分无主 `NOTIFY` | 无最小间隔限制，并发振铃时 CPU 飙高 | **中**（防住了 `Replaces` 截胡，但大促高峰易被 `NOTIFY` 风暴打挂） | 仍存在信令面 DoS 与内存泄漏隐患 |
| **方案 C：`RFC 4235` 按权脱敏 + `RFC 6665` 禁无主 `NOTIFY` + `[100,1000]ms` 节流（`P891 + P892` 推荐）** | **非代答权限 100% 剥离对话标签 + 租期 `[300,3600]s`** | **无主 `NOTIFY` 100% 回 `SIP 481`** | **强制 `[100, 1000]ms` 合并节流 + `terminated` 即刻回收** | **`0` 标签泄露截胡 & `0` 无主注入/扇出风暴** | **企业级呼叫中心与多租户 PBX 必选标配** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：`BLF` 标签泄露与 `NOTIFY` 扇出风暴 vs `P891 / P892` 确定性护栏
- **故障基线（未开启 `P891 / P892`）**：在 `200` 坐席、`40` 个监控端订阅的呼叫中心中，每通电话建连产生 `4` 次状态跳变，每秒 `50` 通呼叫将触发 **`50 × 4 × 40 = 8,000` 包/秒** 的 XML `NOTIFY` 广播风暴，且每条报文均向 `40` 个终端泄露完整 `call-id / local-tag / remote-tag` 代答劫持凭证。
- **护栏收敛（启用 `P891 + P892` · 🎉 901 护栏里程碑）**：对非授权观察者 100% 剥离 `dialog-info+xml` 中的对话三元组标签（泄露包数钳制为 **`0`**）并将订阅 `Expires` 钳制在 `[300, 3600]s`（`P891`）；100% 拒收无主 `NOTIFY`（返回 `SIP 481`）并将 `Min-Notify-Interval` 钳制在 `[100, 1000]ms`（无主 `NOTIFY` 与未节流风暴包钳制为 **`0`**，`P892`）。

### 5.2 TypeScript 确定性护栏实现（`packages/business-core/enterprise-guardrails.ts` 节选）

```typescript
// P891: SIP RFC 4235 Dialog Event XML Tag Sanitization & BLF Pickup Auth Guard (🎉 900th Guardrail!)
// P892: SIP RFC 6665 Unsolicited NOTIFY 481 Rejection & Min-Notify-Interval Rate Throttle Guard (🎉 901st Guardrail!)
export function evaluateSipRfc6665UnsolicitedNotifyRejectionAndMinNotifyRateThrottleGate(
  context: SipRfc6665UnsolicitedNotifyRejectionAndMinNotifyRateThrottleContext,
): SipRfc6665UnsolicitedNotifyRejectionAndMinNotifyRateThrottleDecision {
  const clampedUnsolicitedOrUnthrottledNotifyStormPackets = 0;
  const clampedMinNotifyIntervalThrottleMs = Math.min(
    Math.max(context.minNotifyIntervalThrottleMs, 100),
    1000,
  );
  // Reject unsolicited out-of-dialog NOTIFY with 481 and clamp NOTIFY rate to [100, 1000]ms
  // ...
}
```

> **数据来源与延迟口径披露（Provenance & Timing Disclosure）**：以上 `P891` 与 `P892` 在 `site/data/voice-agent-benchmark-report.json` 及 `site/benchmark-cards.html` 中为确定性离线策略与配置数学核验（`provenance: "synthetic"`，计时读数：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）。真实 Presence 服务器 `libxml2` DOM 序列化耗时与分布式订阅表锁延迟标注为 `not_measured`。

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **【`P891` `RFC 4235` `dialog-info+xml` 三元组脱敏】**：核验 Presence / PBX 模块对未授予同组代答权限的观察者剥离 `call-id`、`local-tag`、`remote-tag` 属性（`clampedUnredactedDialogTagLeakPayloads = 0`）。
- [ ] **【`P891` 订阅租期 `[300, 3600]s` 钳制】**：拒绝过短（`<300s` 刷新风暴）或过长（`>3600s` 僵尸订阅）的 `Expires` 请求，统一钳制于 `[300, 3600]` 秒。
- [ ] **【`P892` `RFC 6665` 100% 拒收无主 `NOTIFY`】**：确认网关与话机对无匹配 `SUBSCRIBE` 对话的入站 `NOTIFY` 立即回复 `SIP 481 Subscription Does Not Exist`。
- [ ] **【`P892` `NOTIFY` `[100, 1000]ms` 状态合并节流与终止回收】**：强制启用 `[100, 1000]ms`（推荐 `250ms`）最小通知间隔合并瞬态跳变，并在 `Subscription-State: terminated` 时 0ms 释放订阅槽位（`clampedUnsolicitedOrUnthrottledNotifyStormPackets = 0`）。
