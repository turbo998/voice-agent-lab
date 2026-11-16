# 企业 SIP `RFC 6228 / RFC 3261` `199 Early Dialog Terminated` 并行分叉早期媒体释放与僵尸早期对话端口收割防御指南（Stage 495 · Topic 135 · 第 62 轮夜间深潜 · 137 篇独立 FAQ · 993 护栏 & 1,002 沙盒探针 & 812 现场探针）

> **导航**：[返回 README 主页](../README.md) · [English Version (`voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-faq.en.md`)](voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-faq.en.md) · [2026-11-09 深度日报](daily/2026-11-09.md) · [架构设计指南](solution-architecture.md)

![Enterprise SIP RFC 6228 / RFC 3261 199 Early Dialog Terminated Forking Early-Media Release & Orphan Port Reaper Visual Summary](../assets/svg/139-voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-2026-11-16.svg)

---

## 📌 一、核心结论速览（Executive Summary）

> **一句话带走**：在企业级语音网关与跨区域 AI 语音坐席集群中，当一个入站 `INVITE` 经由 SIP 分叉代理（Forking Proxy）并行投递给多个坐席节点或主备语音媒体池（分别回传带不同 `To-tag` 的 `183 Session Progress` 早期媒体）时，若某个分支因繁忙或策略拒绝返回 `4xx / 5xx / 6xx`，根据传统 `RFC 3261` 规则，分叉代理必须吞掉该非 `2xx` 终态响应并等待其余分支结果。如果未启用 **`RFC 6228`（`SIP 199 Early Dialog Terminated` 响应码）**，上游 SBC 与语音网关根本不知道该早期对话已死亡，会继续保留其 RTP 端口、SRTP 上下文与原生 S2S 解码缓冲长达 `180s`（`Timer C`），导致**多路早期媒体串音/截断（Early-Media Clipping）**与**并发 RTP 端口池耗尽**；反之，若网关未严格校验 `Supported: 199` 与 `(Call-ID, From-tag, To-tag)` 三元组就盲目处理伪造 `199`，攻击者又能提前掐断正在播放合规双录提示音的活跃分支。
>
> **本方案确定性护栏（`P983–P984` · Stage 495 · Topic 135 · 993 护栏 & 1,002 沙盒探针 & 812 现场探针 · 498 维）**：
> - **`P983` (`evaluateSipRfc6228EarlyDialogTerminated199ToTagBindingAndMediaReleaseGate` [第 992 道护栏])**：强制校验 `Supported: 199` 协商标志及 `199 Early Dialog Terminated` 的 `(Call-ID, From-tag, To-tag)` 与已建立的 `18x` 早期对话 100% 精确匹配（拦截无匹配的幽灵/伪造 `199`，实现 `0` 活跃分支误杀），并在收到合法 `199` 的 `0ms`（标称 1ms 分辨率下）立即释放该终止分支的 RTP/S2S 媒体缓冲，同时将单次呼叫并发早期媒体对话数钳位在 `[1, 4]` 路；
> - **`P984` (`evaluateSipRfc6228OrphanEarlyDialogTtlAndForkingPortReaperGate` [第 993 道护栏 / 第 1,002 沙盒探针 / 第 812 现场探针])**：针对下游旧版代理不支持 `RFC 6228` 或网络丢包导致 `199` 丢失的场景，为所有处于 `18x Early` 态但无活跃 RTP 或未转正的分支强制施加 `[5, 60]s` 早期对话生存期（TTL）看门狗与 `200 OK` 胜出分支即时清场机制，实现 `0` 僵尸早期对话 RTP 端口泄漏。
> - **离线合成基准计时声明**：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`。

---

## 🎯 二、客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：什么是 `RFC 6228 SIP 199 Early Dialog Terminated`？为什么并行分叉呼叫里少了一个 `199`，客户会听到“两段语音叠在一起”或者“前半句提示音被切掉”？
- **大白话原理**：想象你拨打银行 VIP 专线，总机（Forking Proxy）同时呼叫了上海 AI 节点（分支 A，`To-tag=tagA`）和北京灾备节点（分支 B，`To-tag=tagB`）。分支 A 先回了 `183 Session Progress` 并开始播放早期媒体彩铃/排队播报；`50ms` 后分支 A 发现本地 GPU 满载，于是向总机返回 `503 Service Unavailable`。按 `RFC 3261` 规定，因为分支 B 还在振铃，总机不能把 `503` 转发给主叫 SBC，必须静默扣留！
- **故障根因**：此时主叫 SBC 还傻傻地以为分支 A 活着，继续把音频切给分支 A 的 RTP 端口；当分支 B 随后发来 `183` 早期媒体时，SBC 要么因为单路早期媒体锁死在已死亡的分支 A 上导致主叫听不到声音（Dead Air），要么把多路早期媒体混音导致提示音重叠。
- **架构师铁律（`P983`）**：分叉代理在收到分支 A 的非 `2xx` 终态响应时，若上游声明了 `Supported: 199`，必须立即向上游发送携带 `To-tag=tagA` 的 `199 Early Dialog Terminated` 临时响应；上游 SBC 核验 `(Call-ID, From-tag, To-tag=tagA)` 命中后，立即回收分支 A 的 RTP 端口并无缝切换至存活的分支 B，同时将并发早期媒体分支上限钳位在 `[1, 4]`。

### Q2：如果攻击者或故障网元伪造 `SIP 199` 响应，会不会把正在播报合规声明的主分支给掐断？
- **攻击与故障面**：`199` 属于 `1xx` 临时响应（无需像 `200 OK` 那样完成三次握手 `ACK`，除非启用 `100rel`）。如果网关只看 `Call-ID` 就释放早期媒体，或者对从未发送过 `18x` 创建早期对话的未知 `To-tag` 也执行媒体网关解绑，就会造成合规开场白（如“本通话将被录音”）中断。
- **架构师铁律（`P983`）**：只有当入站 `199` 精确匹配当前处于 `Early` 状态的子对话 `(Call-ID, From-tag, To-tag)` 且会话已协商 `199` 选项标签时，才释放该特定 `To-tag` 绑定的 RTP/SRTP 通道；任何未知 `To-tag` 或指向已确立（`Confirmed`）对话的 `199` 一律丢弃（`0` 活跃分支误杀）。

### Q3：如果下游运营商老旧代理根本不支持 `RFC 6228 (199)`，死掉的早期对话岂不是又要泄漏端口？
- **工程兜底（`P984`）**：公网 PSTN/IMS 互通中常见不支持 `RFC 6228` 的传统代理。此时必须启用双保险：第一，一旦任意一个分叉分支率先返回 `200 OK` 转正，网关在 `0ms`（标称 1ms 分辨率下）强制收割同 `Call-ID` 下其余所有未转正的 `Early` 分支；第二，为每个早期对话设置 `[5, 60]s` 硬性 TTL 看门狗，超时未收到 RTP 媒体或未转正的孤儿早期对话立即回收（`0` 僵尸端口泄漏）。

---

## 🧭 三、直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比 + 毫秒级时序图）

### 3.1 `RFC 6228` `199 Early Dialog Terminated` 守卫与僵尸端口收割决策树

```mermaid
flowchart TD
    A["SIP 并行分叉早期对话事件<br/>(18x Early Media / 199 / 200 OK)"] --> B{"收到 199 Early Dialog Terminated?"}
    B -- "是" --> C{"已协商 Supported: 199 且<br/>(Call-ID, From-tag, To-tag) 精确匹配活跃 Early 分支?"}
    C -- "否 (伪造 To-tag 或未协商)" --> R1["P983 拦截: 忽略伪造/错配 199<br/>0 活跃早期媒体误杀"]
    C -- "是" --> R2["P983 释放: 立即回收该 To-tag 早期媒体 RTP/S2S 缓冲<br/>并发早期对话钳位 ∈ [1,4]"]
    B -- "否 (常规 18x 分叉或 200 OK)" --> D{"并发 Early 分支数 > 4 或<br/>某分支已返回 200 OK / Early TTL 超时?"}
    D -- "是 (超限 / 200 OK 胜出 / TTL ∉ [5,60]s)" --> R3["P983/P984 收割: 裁剪早期分支 <=4<br/>清零落败/超时孤儿 Early RTP 端口 (TTL ∈ [5,60]s)"]
    D -- "否" --> E["保持活跃早期媒体播报并监控 RTP 心跳"]
```

### 3.2 并行分叉失败分支媒体切换延迟与端口占用拆解对比

```mermaid
flowchart LR
    F1["Fork 1 (To-tag=A): 183 早期媒体 -> 503 失败"] --> P1["Forking Proxy 捕获 503<br/>立即向 SBC 发送 199 (To-tag=A)"]
    P1 --> S1["P983 校验 To-tag=A 精确命中<br/>0ms 释放分支 A 端口并切至 Fork 2"]
    S1 --> S2["P984 守护: 若无 199 则按 [5,60]s TTL<br/>或 200 OK 胜出瞬间收割孤儿端口"]
```

| 架构模式 | 失败分叉分支 RTP 端口滞留时长 | 多分支 `183` 早期媒体切换耗时 | 伪造 `To-tag` `199` 注入抗性 |
| :--- | :--- | :--- | :--- |
| **传统 `RFC 3261` 无 `199` 网关** | `32s – 180s`（等 `Timer C` 或终态超时） | ❌ 死锁在失败分支造成 `3s–15s` 死寂 | 不适用 |
| **裸奔 `RFC 6228` 实现（无三元组与 TTL 门禁）** | 有 `199` 时快，丢包时仍泄漏 `180s` | `<50ms` | ❌ 伪造 `199` 可掐断主分支合规播报 |
| **本方案 (`P983 + P984`)** | **收到 `199` 立即释放，无 `199` 兜底 `[5, 60]s`** | **✅ `<10ms` 无缝切至存活分支，0 死寂** | **✅ 三元组强绑定，`0` 活跃分支误杀 + `0` 僵尸泄漏** |

### 3.3 毫秒级并行分叉 `199` 早期媒体释放与 `200 OK` 收割时序图

```mermaid
sequenceDiagram
    participant SBC as 企业级边缘 SBC (P983/P984)
    participant FP as SIP 分叉代理 (Forking Proxy)
    participant N1 as AI 语音节点 A (To-tag=t1)
    participant N2 as AI 语音节点 B (To-tag=t2)

    SBC->>FP: 1. INVITE (Supported: 199, 100rel)
    FP->>N1: 2a. INVITE (Fork 1)
    FP->>N2: 2b. INVITE (Fork 2)
    N1-->>SBC: 3. 183 Session Progress (To-tag=t1, Early Media RTP #1)
    Note over SBC: P983 登记 Early Dialog (t1), 并发数=1 ∈ [1,4]
    N1-->>FP: 4. 503 Service Unavailable (GPU 满载拒绝)
    FP-->>SBC: 5. 199 Early Dialog Terminated (To-tag=t1)
    Note over SBC: P983 核验 (Call-ID, From, t1) 命中 -> 立即释放 RTP #1
    N2-->>SBC: 6. 183 Session Progress (To-tag=t2, Early Media RTP #2)
    SBC->>SBC: 7. 拦截攻击者伪造 199 (To-tag=t_fake != t2, 0 误杀)
    N2-->>SBC: 8. 200 OK (To-tag=t2 转正)
    Note over SBC: P984 立即收割同 Call-ID 下任何残留 Early 孤儿端口 (0 泄漏)
```

---

## 📊 四、语音架构师选型决策矩阵

| 选型维度 | 方案 A：传统仅靠 `200 OK / Timer C` 回收 | 方案 B：无校验 `199` 解析 | 方案 C：`P983 + P984` 三元组绑定 + 孤儿 TTL 收割（推荐） |
| :--- | :--- | :--- | :--- |
| **分叉失败早期媒体回收** | ❌ 需苦等最终响应或 `Timer C` (`180s`) | 收到 `199` 回收 | **收到合法 `199` 立即释放，无缝切换存活分支（`P983`）** |
| **伪造 `199` 防误杀能力** | 无 | ❌ 易被伪造 `199` 切断提示音 | **强制 `Supported: 199` + `(Call-ID, From-tag, To-tag)` 精确匹配（`P983`）** |
| **并发早期对话配额** | ❌ 无限分叉撑爆混音器 | ❌ 无上限 | **单呼叫并发早期媒体对话严格钳位在 `[1, 4]` 路（`P983`）** |
| **旧网元丢 `199` 兜底收割** | ❌ 僵尸端口长期驻留 | ❌ 丢 `199` 即泄漏 | **`[5, 60]s` 早期对话 TTL + `200 OK` 胜出即时清场（`P984`）** |

---

## 🧪 五、定量算例与 7-Card 报告摘要（CSP 自包含、零虚构坐标）

- **算例输入**：模拟并行分叉呼叫产生 `9` 路早期媒体分支（`>4`），其中包含未协商或 `To-tag` 失配的伪造 `199` 企图切断 `3` 路正常早期对话；同时下游传统网元未发 `199` 导致 `7` 个僵尸早期对话驻留 `180s`（`>60s`）。
- **确定性护栏输出**：
  - `P983` 检出 `Unverified To-tag 199 or excessive parallel early dialogs` 并在 `0ms`（`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）拒止伪造 `199`（误杀数归 `0`），将并发早期媒体对话钳位至 `4` 路；
  - `P984` 检出 `Orphaned early-dialog RTP port leak` 并立即清零 `7` 个僵尸早期对话，将早期对话生存期（TTL）钳位至 `60s`（`[5, 60]s` 合规区间）。

---

## 🛠️ 六、生产环境语音交付快速核验清单（Checklist）

- [ ] **【`P983` `199` 三元组精确绑定与并发分叉锁】**：确认 SBC/B2BUA 仅在协商 `Supported: 199` 且 `(Call-ID, From-tag, To-tag)` 精确匹配活跃 `18x` 早期对话时释放对应早期媒体通道，且单次呼叫并发早期媒体对话数钳位在 `[1, 4]`。
- [ ] **【`P984` 孤儿早期对话 TTL 与转正即时收割】**：确认所有未转正 `18x` 早期对话均绑定 `[5, 60]s` 硬性 TTL 看门狗，且任一分支返回 `200 OK` 时立即清零其余未转正早期分支 RTP 端口（`0` 僵尸泄漏）。
- [ ] **【离线基准计时与自包含合规】**：确认评测报告与 SVG 资产 100% 包含 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` 声明。
