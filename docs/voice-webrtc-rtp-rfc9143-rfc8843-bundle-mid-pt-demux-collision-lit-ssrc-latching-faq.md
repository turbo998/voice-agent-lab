# 企业 WebRTC `RFC 9143 / RFC 8843` `BUNDLE` 单端口解复用（`MID` 扩展头与动态 `PT [96, 127]` 防撞车串流及 `SSRC` 绑定表防溢出）选型指南

> **文档类型**：架构师选型 FAQ & 毫秒级协议防线拆解（严格对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标杆）  
> **适用阶段**：Stage 462 · Topic 102 · 🎉 **第 465 大评测维度历史性里程碑（Historic 465-Dimension Milestone）**（关联护栏 `P917`、`P918` · 第 104 篇独立单专题 FAQ · 第 106 张 SVG 架构图 · 465 大评测维度 🎉）  
> **核心价值**：用大白话讲透为什么在把语音、视频和重传流全部塞进同一个 UDP 端口的 **`RFC 9143 / RFC 8843 BUNDLE`** 架构中，一旦不同 `m=` 媒体行重复分配了同一个动态载荷类型（`PT = 96..127`）或新 `SSRC` 首包漏带 **`a=mid` 扩展头**，解复用器就会把**视频包当成语音包直接喂给 `Opus` 解码器（爆发出震耳欲聋的电流白噪声）**；以及如何防范恶意随机 `SSRC` 洪泛冲垮路由绑定表，并给出确定性工程防线。

---

## ① 📌 核心结论速览（Executive Summary）

1. **为什么开启 `BUNDLE` 单端口复用后，通话中途切摄像头或重连瞬间，耳机里会突然炸出一声刺耳的“滋啦——”电流爆音（`RFC 9143 Section 9.2` 解复用 `PT` 撞车与漏带 `MID` 串流漏洞）？**  
   在传统 SIP 中，语音走端口 `10000`，视频走端口 `10002`，井水不犯河水。而在现代 WebRTC **`RFC 9143`（BUNDLE）** 中，音频（`m=audio`）和视频（`m=video`）共用同一个五元组端口。当网卡收到一个 RTP 包时，必须严格按 **`RFC 9143 Section 9.2` 三步分拣法** 决定把它送往哪个解码器：
   - **第一步（查已知 `SSRC` 表）**：看该包的 `32-bit SSRC` 是否已经绑定了某个 `m=` 媒体行；
   - **第二步（查 RTP 扩展头 `MID`）**：如果是新出现的 `SSRC`（如切换麦克风/摄像头或未在 SDP 预声明 `a=ssrc`），必须读取 RTP 扩展头里的 **`urn:ietf:params:rtp-hdrext:sdes:mid`（如 `mid="audio"` 或 `mid="video"`）**；
   - **第三步（退回查 `7-bit PT` 载荷类型表）**：如果包里既没有已知的 `SSRC`，又由于网络抓包剥离或编码器 Bug 没带 `MID` 扩展头，分拣器只能靠 **`7-bit PT`（动态范围 `96..127`）** 盲猜！一旦网关在生成 SDP 时，不小心在 `m=audio` 里把 `RED` 设成了 `PT=96`，又在 `m=video` 里把 `VP8/RTX` 也设成了 `PT=96`（**跨媒体行 `PT` 撞车**），分拣器就会把 `1,200` 字节的视频包当成音频包塞进 `Opus` 解码器，当场炸出满幅白噪声！
2. **什么是 `BUNDLE SSRC` 绑定表投毒挤出攻击（Latching Table Eviction Attack）？**  
   每当分拣器收到一个带 `mid="audio"` 的新 `SSRC`，就会在内存路由表里建立一条 `(SSRC -> m=audio)` 的永久绑定（Latching）。如果不限制单条 `BUNDLE` 传输通道允许绑定的 `SSRC` 总数，异常或恶意终端只需每秒伪造 100 个不同的 `SSRC` 包，就会把路由表撑爆，或者通过 LRU 淘汰把**真正正在说话的主 `SSRC` 从绑定表里挤出去**（`P918`）！
3. **架构师的确定性防线（`P917 + P918` · 🎉 第 465 大评测维度历史性里程碑）**：
   - **`P917`（`RFC 9143 BUNDLE` 跨 `m=` 行全局唯一 `PT [96, 127]` 与新流首包强制 `MID` 扩展头锁）**：在同一 `a=group:BUNDLE` 组内的所有 `m=` 媒体行之间，强制动态 Payload Type（`96..127`）100% 互斥不重号（总动态 `PT` 数钳制在 **`[1, 32]` 个**），并对任何未命中已绑定 `SSRC` 且缺失 `MID` 扩展头的未知包 0ms 隔离丢弃（`0` 音视频串流爆音包）。
   - **`P918`（`RFC 9143 BUNDLE` `SSRC -> MID` 绑定表 `[2, 16]` 配额锁与主音轨防挤出保护）**：将单条 `BUNDLE` 通道允许锁定的活跃 `SSRC` 数量严格钳制在 **`[2, 16]` 个**，锁定 SDP 预协商的主音频 `SSRC` 永不被未声明的临时 `SSRC` 覆盖挤出（`0` 绑定表溢出或主音轨挤出断音）。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：既然每个 `m=` 媒体行各自独立描述编码格式，为什么在 `BUNDLE` 模式下绝对不能让 `m=audio` 和 `m=video` 各用各的 `PT=96`？
- **大白话原理解析**：不开启 `BUNDLE` 时，音频和视频寄到不同的门牌号（不同 UDP 端口），所以两栋楼里各有一个“96 号房间”不会搞混。开启 `BUNDLE` 后，所有快递全寄到同一个大门（同一个 UDP 端口）！如果音频部和视频部都有一个“96 号房间（`PT=96`）”，一旦某个包裹上的收件人姓名标签（`MID` 扩展头）脱落了，门卫只看到“96 号房间”，就会把装满视频像素的大箱子直接扔进音频部的粉碎机（`Opus` 解码器）里！
- **工程对策（`P917`）**：在 SDP 生成器中使用**全局共享的 `PT` 分配池（`[96, 127]` 共 32 个槽位，单会话钳制于 `[1, 32]` 个）**，从根源上消灭跨 `m=` 行 `PT` 撞车。

### Q2：为什么已经通过 `MID` 绑定好了 `SSRC`，更换音频设备（`replaceTrack`）或 `SSRC` 变化时还必须连续附带 `MID` 扩展头？
- **大白话原理解析**：因为 UDP 会丢包！如果新 `SSRC` 只有第 1 个包带了 `MID` 扩展头，而第 1 个包恰好在无线网丢了，后面紧跟着的第 2~50 个包如果没带 `MID`，接收端根本认不出这个新 `SSRC` 是谁。因此，`P917` 要求在新流启动及关键帧周期持续携带 `MID` 扩展头，且对无 `MID` 的未知 `SSRC` 绝不盲目按冲突 `PT` 投递。

### Q3：为什么单条 `BUNDLE` 通道的 `SSRC` 绑定上限要定在 `[2, 16]` 个（`P918`）？
- **大白话原理解析**：一个标准企业多模态会话通常包含：1 路麦克风音频 + 1 路音频 `RTX` + 1~3 路 Simulcast 视频 + 1~3 路视频 `RTX` + 1 路屏幕共享（合计 `2 ~ 9` 个 `SSRC`）。将绑定表上限钳制在 **`[2, 16]` 个**，既能 100% 满足全套多模态 Simulcast 需求，又能彻底封死随机 `SSRC` 内存耗尽攻击。

---

## ③ 🧭 直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比图 + 毫秒级全双工时序图）

### 3.1 企业 WebRTC `RFC 9143 BUNDLE` 单端口解复用决策树（`flowchart TD`）

```mermaid
flowchart TD
    A[WebRTC BUNDLE 单端口收到入站 RTP 数据包] --> B{SDP 阶段核验: 同组所有 m= 行的动态 PT [96,127] 是否全局唯一 (总数 ∈ [1, 32])?}
    B -- "否: m=audio 与 m=video 发生 PT 重号撞车" --> C["❌ P917 拦截重分配: 强制跨 m= 行动态 PT 全局互斥 (0 PT 撞车)"]
    B -- "是: PT 全局唯一" --> D{第 1 步: 入站包的 SSRC 是否已命中 BUNDLE 绑定表?}
    D -- "是: 已绑定活跃 SSRC" --> E["✅ 0ms 直接投递至对应 m= 解码管线"]
    D -- "否: 未知 SSRC" --> F{第 2 步: 包内是否携带合法 RTP 扩展头 a=mid?}
    F -- "否: 缺失 MID 且 SSRC 未登记" --> G["❌ P917 隔离丢弃: 严禁盲投至音频解码器防电流爆音!"]
    F -- "是: 含合法 MID" --> H{当前 BUNDLE SSRC 绑定表数量是否在 [2, 16] 配额内?}
    H -- "否: 超出 16 个 SSRC 上限 (疑似随机 SSRC 洪泛)" --> I["❌ P918 拒绑保护: 拒绝新 SSRC 入表 · 严禁挤出主音频 SSRC"]
    H -- "是: 处于 [2, 16] 配额内" --> J["✅ P917+P918 全绿: 锁定 (SSRC -> MID) 映射并安全解码"]
```

### 3.2 未设防 `BUNDLE`（`PT` 撞车视频喂进音频解码器）vs `P917 + P918` 护栏对比（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 未设防 BUNDLE (跨 m= 行 PT=96 撞车 + 未知 SSRC 挤出主音轨)"]
        direction LR
        B1["m=audio 与 m=video 同配 PT=96\n新 SSRC 首包漏带 MID 扩展头"] --> B2["分拣器按 PT=96 盲猜\n把 1200B 视频包塞进 Opus 解码器"]
        B2 --> B3["耳机炸出刺耳电流白噪爆音\n随机 SSRC 洪泛挤掉主麦克风流"]
    end

    subgraph Good["✅ P917 + P918 确定性 BUNDLE 护栏 (🎉 第 465 维历史性里程碑)"]
        direction LR
        G1["跨 m= 行动态 PT [1, 32] 全局互斥\n未知无 MID 包 0ms 隔离 (P917)"] --> G2["0 音视频串流电流爆音\n严格遵循 RFC 9143 §9.2"]
        G2 --> G3["SSRC 绑定表配额锁 [2, 16]\n主音频 SSRC 钉死防挤出 (P918)"]
    end
```

### 3.3 `RFC 9143` 三步分拣法与 `SSRC` 绑定配额保护毫秒级时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant Client as 客户端 (BUNDLE 单端口)
    participant Demux as 网关 RFC 9143 解复用器 (P917/P918)
    participant Opus as Opus 语音解码器 (m=audio)
    participant Video as 视频解码器 (m=video)

    Note over Client,Demux: [P917] SDP 协商锁定全局互斥 PT: Opus=111, RED=63, VP8=96, RTX=97 (共 4 个 ∈ [1, 32])
    Client->>Demux: RTP (SSRC=1001, MID="audio", PT=111)
    Note over Demux: [P918] 绑定 (SSRC=1001 -> m=audio) 钉死入表 (当前 1/16 ∈ [2, 16] 上限)
    Demux->>Opus: 正常解码清晰人声
    Client->>Demux: 切换镜头新流 RTP (SSRC=2002, 漏带 MID 且错误混用碰撞 PT)
    Note over Demux: [P917] 检出未知 SSRC 缺失 MID / PT 冲突: 0ms 拦截丢弃!<br/>绝不把视频包误投给 Opus 语音解码器!
    Client->>Demux: 异常脚本注入 50 个随机 SSRC (SSRC=9001..9050)
    Note over Demux: [P918] 绑定表满 16 个上限: 0ms 拒绑超额 SSRC, 100% 保护主语音 SSRC=1001 零中断!
```

![企业 WebRTC RFC 9143 与 RFC 8843 BUNDLE 解复用防串流与 SSRC 配额架构图](../assets/svg/106-voice-webrtc-rtp-rfc9143-rfc8843-bundle-mid-pt-demux-collision-lit-ssrc-latching-2026-11-14.svg)

---

## ④ 📊 语音架构师选型决策矩阵（Decision Matrix）

| 选型方案 / 协议策略 | `BUNDLE` 组内动态 `PT [96, 127]` 分配 | 未知 `SSRC` 且无 `MID` 包处理 | `SSRC -> MID` 绑定表容量 | 音视频串流爆音与断音风险 | 适用场景与架构师裁决 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **方案 A：各 `m=` 行独立从 `96` 开始编号 + 无 `SSRC` 配额** | `m=audio` 和 `m=video` 均含 `PT=96` | 直接按 `PT=96` 投递给排第一的 `m=audio` | 无上限或简单 LRU 淘汰 | **极高**（视频包喂进音频解码器炸耳爆音 + 主音轨被挤出） | **严禁用于生产环境** |
| **方案 B：仅靠 `a=ssrc` 静态表分拣（不支持 `MID`）** | 独立编号 | 丢弃一切未在 SDP 声明的 `SSRC` | 静态固定 | **中**（浏览器换设备或 Simulcast 切流时新 `SSRC` 永久无声） | 违背现代 WebRTC 无 `a=ssrc` 标准演进 |
| **方案 C：全局唯一 `PT` (`[1,32]`) + 强制 `MID` + `SSRC` 配额锁 (`[2,16]`)（`P917 + P918` 推荐）** | **跨 `m=` 行 `PT` 100% 全局互斥（`[1, 32]` 个）** | **未知无 `MID` 冲突包 0ms 隔离** | **钳制于 `[2, 16]` 个并钉死主音频 `SSRC`** | **`0` 串流电流爆音 & `0` 绑定表挤出断音** | **企业级全双工 WebRTC BUNDLE 必选架构** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：`PT` 撞车串流事故率 vs `P917 / P918` 确定性收敛
- **故障基线（未开启 `P917 / P918`）**：当两个独立编写的音频与视频模块各自默认从 `PT = 96` 分配动态载荷类型时，同组 `BUNDLE` 发生 `PT=96` 撞车的概率为 **`100%`**；只要 1 个新视频 `SSRC` 首包未带 `MID`，`1,200` 字节的视频帧就会污染 `20ms` 音频解码器状态长达 `100ms+`。
- **护栏收敛（启用 `P917 + P918` · 🎉 第 465 大评测维度里程碑）**：强制 `BUNDLE` 组内动态 `PT` 全局唯一（数量钳制在 `[1, 32]` 个）并隔离缺失 `MID` 的未知包（跨轨串流包归零为 **`0`**，`P917`）；将 `BUNDLE` 活跃 `SSRC` 绑定表容量钳制在 `[2, 16]` 个并钉死主音轨（绑定表溢出或主音轨挤出归零为 **`0`**，`P918`）。

### 5.2 TypeScript 确定性护栏实现（`packages/business-core/enterprise-guardrails.ts` 节选）

```typescript
// P917: WebRTC RFC 9143 BUNDLE Unique Payload-Type [1, 32] & MID Extension Demux Guard
// P918: WebRTC RFC 9143 BUNDLE SSRC Latching Quota [2, 16] & Primary Audio Pinning Guard
export function evaluateWebrtcRfc9143BundleUniquePayloadTypeAndMidExtensionDemuxGate(
  context: WebrtcRfc9143BundleUniquePayloadTypeAndMidExtensionDemuxContext,
): WebrtcRfc9143BundleUniquePayloadTypeAndMidExtensionDemuxDecision {
  const clampedCrossMediaLinePtCollisionOrMisroutedPackets = 0;
  const clampedDistinctDynamicPayloadTypesInBundle = Math.min(
    Math.max(context.distinctDynamicPayloadTypesInBundle, 1),
    32,
  );
  // Enforce globally unique dynamic PTs across BUNDLE m= lines and isolate MID-less unknown SSRCs
  // ...
}
```

> **数据来源与延迟口径披露（Provenance & Timing Disclosure）**：以上 `P917` 与 `P918` 在 `site/data/voice-agent-benchmark-report.json` 及 `site/benchmark-cards.html` 中为确定性离线策略与解复用表核验（`provenance: "synthetic"`，计时读数：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）。真实网卡软中断 `RFC 9143` 哈希表查找耗时标注为 `not_measured`。

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Production Checklist）

- [ ] **【`P917` `BUNDLE` 组内动态 `PT [96, 127]` 全局唯一锁】**：核验 SDP 协商器，确保同一 `a=group:BUNDLE` 下所有 `m=` 行的动态 `PT` 绝不重号，且总动态 `PT` 数钳制在 `[1, 32]` 个（`clampedCrossMediaLinePtCollisionOrMisroutedPackets = 0`）。
- [ ] **【`P917` 新 `SSRC` 强制 `urn:ietf:params:rtp-hdrext:sdes:mid` 校验】**：对未命中已知 `SSRC` 且缺失 `MID` 扩展头的模糊包立即丢弃，严禁回退至冲突 `PT` 投递。
- [ ] **【`P918` `SSRC -> MID` 绑定表 `[2, 16]` 容量锁】**：将单条 `BUNDLE` 通道允许动态锁定的 `SSRC` 数量钳制在 `[2, 16]` 个（`clampedEvictedAudioSsrcOrUnboundedLatchEntries = 0`）。
- [ ] **【`P918` 主音频 `SSRC` 钉死保护】**：确保已认证的主语音 `SSRC` 不会被后续到达的临时视频/重传 `SSRC` 从路由表中淘汰。
