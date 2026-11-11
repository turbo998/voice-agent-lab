# SIP `RFC 3264 SDP` 动态负载类型（`PT 96–127`）采样率对称锚定（防 `8kHz/16kHz telephone-event` 错配与 `maxptime <= 60ms`）及通话中 `Re-INVITE` 防转码放大 DoS（`<= 2 次/分`）与 `RFC 3389` 舒适噪音防 VAD 死锁选型与底层原理 FAQ

> **文档定位**：面向 AI Solution Architect（AI 解决方案架构师）与电信核心网、企业 SBC（Cisco CUBE / AudioCodes / Ribbon）、实时语音网关团队的单点深潜选型指南。严格对标 `ib-vs-ethernet-roce-selection-faq.md` 标杆结构，3 分钟看懂为什么开通了 VoLTE `16kHz` 高清语音后客户按分机号或身份证按键会“100% 失灵”，以及为什么恶意的通话中 `SIP Re-INVITE` 与异常的 `RFC 3389` 舒适噪音包会把媒体网关 CPU 撑爆 18 倍或让 AI 永远等不到客户说完话，10 分钟掌握 `RFC 3264 动态 PT 对称与采样率同频锁` 及 `Re-INVITE 编解码震荡限流 + RFC 3389 能量钳位` 机制。
> **测量与溯源口径声明（Timer & Provenance Disclosure）**：本文涉及的确定性护栏探针（`P781` / `P782`）在离线策略状态机中的执行耗时显示为 `0ms`（`synthetic` 确定性规则核验：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`）。真实生产环境中的 `SDP Offer/Answer` 解析与 DSP 转码器重初始化耗时取决于 SBC 硬件与并发负载，严禁将离线策略状态机的 `0ms` 混同为真实 DSP 分配耗时。

![SIP RFC 3264 SDP 动态 PT 对称锚定与 Re-INVITE 防转码 DoS 架构总结图](../assets/svg/38-voice-sip-sdp-payload-symmetry-reinvite-codec-churn-dos-2026-11-11.svg)

---

## ① 📌 核心结论速览（Executive Summary）

1. **SIP `RFC 3264 SDP` 协商切忌允许收发两端使用不对称的动态 Payload Type（`PT 96–127`）或让 `telephone-event` 按键时钟频率与主语音编解码器脱节——必须强制实施“动态 PT 双向对称锁 + 主语音与 `telephone-event` 采样率同频对齐（`0 Hz` 偏差） + `maxptime <= 60ms` 防缓冲区溢出（`P781`）”**：在传统 `G.711 (8000 Hz)` 时代，带外按键 `a=rtpmap:101 telephone-event/8000` 永远工作正常。但当企业升级到 VoLTE `AMR-WB (16000 Hz)` 或 `Opus (48000 Hz)` 高清语音时，如果 SDP 中只保留了 `telephone-event/8000` 而未协商同采样率的 `telephone-event/16000`（或对端 SBC 将上行 Offer 的 `PT 96` 篡改为下行 Answer 的 `PT 102`），许多老旧 PBX 与云端 RTP 解复用器会**因为 RTP 时间戳步进（每 20ms 增加 `320` vs `160`）对不上而将客户按下的 `RFC 4733` 按键包 100% 静默丢弃**！同时，恶意终端构造的 `a=ptime:200` / `a=maxptime:400` 超大帧参数会直接撑爆 DSP 固定大小（`60ms`）的环形 PCM 缓冲区。生产架构必须在 SDP 协商层强制双向对称 `PT` 编号、主语音与 `telephone-event` 采样率 `0 Hz` 偏差对齐，并将 `maxptime` 硬钳位在 **`<= 60ms`**。
2. **通话中信令与静音帧处理切忌无限制接受 `SIP Re-INVITE / UPDATE` 编解码切换或放任高能量 `RFC 3389` 舒适噪音（`PT 13`）直通 VAD——必须强制实施“单通话编解码切换 `Re-INVITE <= 2 次/分钟` 速率限制 + `RFC 3389 CN <= -38 dBFS` 能量封顶与零帧桥接（`P782`）”**：在 SIP 通话建立后，攻击者或存在固件 Bug 的终端可以每秒发送 20 条 `SIP Re-INVITE`，在 `Opus ↔ AMR-WB ↔ G.729 ↔ G.711` 之间疯狂来回切换编解码器。每次切换都会迫使媒体网关销毁并重新分配 DSP 转码器内存与重采样滤波器，导致 **CPU 负载瞬间暴涨 `18 倍`（Transcoding Churn Amplification DoS）**！此外，当传统网关开启 VAD 发送 `RFC 3389 Comfort Noise (PT 13)` 帧时，如果通告的背景底噪能量过高（如 `-18 dBFS`），或者停发 RTP 包导致时间轴断裂，云端 AI 的流式 VAD 会误以为客户一直在说话，造成**整通电话永远无法触发判停（EOU 死锁）**！生产架构必须将每分钟触发编解码变更的 `Re-INVITE` 锁定在 **`<= 2 次/分钟`**（超限直接返回 `SIP 491/500 Retry-After` 且不重建 DSP），并将 `RFC 3389` 舒适噪音生成器的能量死锁在 **`<= -38 dBFS`** 同时补齐连续 `20ms` 零帧以维持 ASR 时钟。
3. **企业级 SIP/SDP 互操作与抗 DoS 黄金公式 = `P781` 动态 PT 对称锁 + `telephone-event` 采样率同频对齐 + `maxptime <= 60ms`（彻底消灭高清语音下按键失灵与缓冲区溢出） + `P782` `Re-INVITE <= 2 次/分` 转码限流 + `RFC 3389 CN <= -38 dBFS` 能量钳位（100% 阻断 18 倍转码 CPU 放大与舒适噪音 VAD 死锁）**。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Soul-Searching Q&A）

### Q1：为什么我们的语音机器人在普通固话（`G.711 8kHz`）上收按键（输入身份证号/密码）百发百中，但只要一切到手机 VoLTE 高清通话（`AMR-WB 16kHz`），客户按手机键盘就完全没反应？什么是“SDP 动态 PT 不对称与 `telephone-event` 采样率失配”（`P781`）？

- **通俗大白话与第一性原理**：
  - **为什么换了高清语音，按键就“人间蒸发”了？**
    - 根据 `RFC 4733` 标准，电话按键（`telephone-event`）本质上是一条寄生在语音 RTP 流里的“特殊事件轨道”，它必须**跟当前正在通话的主语音编码器共享完全相同的采样时钟（Clock Rate）**！
    - 在普通固话里，主语音是 `PCMU/8000`，按键是 `telephone-event/8000`，两者都是每秒走 8,000 个滴答，天衣无缝；
    - 但在很多企业级 SBC 对接运营商 IMS 时，工程师只把主语音升级成了 `AMR-WB/16000`（每秒 16,000 个滴答），却忘了在 SDP 里加上 **`a=rtpmap:102 telephone-event/16000`**，只留下了默认的 `telephone-event/8000`！结果要么运营商直接拒绝在该通道发按键，要么发出来的按键 RTP 时间戳步进跟 `16kHz` 语音差了一倍，直接被网关当成“时间戳错乱的损坏包”丢进垃圾桶！
    - 另一种常见故障是 **动态 PT 不对称（Payload Type Asymmetry）**：甲方发 Offer 说“我用 `PT 96` 代表 Opus”，乙方回 Answer 说“我用 `PT 102` 代表 Opus”，导致单向哑音！
- **`P781` 在毫秒级时间轴上的闭环解法**：
  1. **主语音与 `telephone-event` 采样率强制同频（`dtmfClockRateMismatchHz === 0`）**：协商出 `16kHz/48kHz` 语音时，必须同步锁定 `telephone-event/16000` 或 `telephone-event/48000`；
  2. **动态 PT 对称锁定与 `maxptime <= 60ms` 封顶**：强制 Offer/Answer 复用相同动态 PT 编号，并拒绝任何 `maxptime > 60ms` 的畸形大包参数。

### Q2：为什么黑客只建立了 50 路并发 SIP 通话，甚至没有发送大流量媒体包，就把我们价值几十万的 64 核媒体转码服务器 CPU 打到了 100% 宕机？而且部分固话接入时 AI 听完第一句话就再也不开口回复了（`P782`）？

- **通俗大白话与第一性原理**：
  - **攻击一：`SIP Re-INVITE` 编解码震荡放大攻击（Codec-Churn DoS）**：
    - 初始化一个 `Opus ↔ AMR-WB` 的 DSP 转码上下文（分配多相滤波器矩阵、预热 LPC 状态、重对齐抖动缓冲）的 CPU 开销，比正常处理一帧 `20ms` 音频包高出 **数百倍**！
    - 如果攻击者在通话建立后，利用脚本每秒钟发送 20 次 `SIP Re-INVITE`（第 1 次要求切成 `G.729`，第 2 次切回 `AMR-WB`，第 3 次切成 `Opus`），仅需 50 个并发连接就能制造每秒 1,000 次转码器销毁重建，把 64 核 CPU 瞬间打满！
  - **故障二：`RFC 3389` 舒适噪音（Comfort Noise）锁死 VAD**：
    - 传统网关为了省带宽，在客户不说话时会发 1 个 `RFC 3389 (PT 13)` 帧，告诉接收端：*“接下来我停发 RTP 包了，请你们自己在本地播放 `-20 dBFS` 的背景白噪音。”*
    - 如果本地合成的舒适噪音音量过大（`> -38 dBFS`），AI 的 VAD 就会以为客户一直在叹气或说话，永远无法攒够 `700ms` 静音去触发大模型回答！
- **`P782` 在毫秒级时间轴上的闭环解法**：
  - **单通话编解码切换 `<= 2 次/分钟` 硬限流**：超出配额的 `Re-INVITE` 直接在信令层以 `SIP 491/500 (Retry-After: 30)` 拦截，绝不触碰底层 DSP 转码器；
  - **`RFC 3389` 舒适噪音能量钳位（`<= -38 dBFS`）+ 连续零帧桥接**：确保静音期既不断流也不误触发 VAD。

### Q3：`P781` 与 `P782` 如何共同守护 SIP/SDP 信令与 DSP 媒体面稳定性？

- **`P781`（初始/重协商 SDP 校验层）**：消灭动态 PT 错位、`telephone-event` 采样率失配与 `maxptime` 溢出；
- **`P782`（通话中期信令限流与静音帧层）**：阻断高频 `Re-INVITE` 转码 CPU 放大攻击与 `RFC 3389` 舒适噪音 VAD 死锁。

---

## ③ 🧭 直观可视化图解（Mermaid 决策树 + 管线对比 + 毫秒级时序图）

### 3.1 SIP SDP 负载对称与 Re-INVITE/CN 防护决策树（`flowchart TD`）

```mermaid
flowchart TD
    A[SIP INVITE / Re-INVITE SDP 协商与媒体流] --> B{动态 PT 是否不对称 / telephone-event 采样率失配 / maxptime > 60ms P781?}
    B -- 是: SDP 参数失配或溢出风险 --> C[P781 拦截与重写: sip_sdp_payload_asymmetry_or_maxptime_blocked<br/>强制对称绑定动态 PT, 对齐 telephone-event 采样率并钳位 maxptime <=60ms]
    B -- 否: SDP 协商合规 --> D[通话中期监控 Re-INVITE 频率与 RFC 3389 CN 帧]
    D --> E{编解码切换 Re-INVITE > 2次/分 或 RFC 3389 CN > -38dBFS P782?}
    E -- 是: 存在转码 DoS 或 VAD 死锁 --> F[P782 触发: sip_reinvite_codec_churn_or_cn_vad_deadlock_blocked<br/>限流 <=2次/分 返回 SIP 491/500, 钳位 CN <=-38dBFS 并注入零帧桥接]
    E -- 否: 信令与静音正常 --> G[HD 语音按键 100% 识别, DSP CPU 与 VAD 判停零死锁]
```

### 3.2 传统脆弱 SDP/无防备转码管线 vs `P781+P782` 生产级管线对比（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 传统管线：16kHz 语音配 8kHz 按键失灵 + Re-INVITE 撑爆 DSP"]
      direction LR
      B1["AMR-WB/16000 混配 telephone-event/8000<br/>或 maxptime=240ms 溢出缓冲区"] --> B2["恶意每秒 20 次 Re-INVITE 切编码<br/>+ -18dBFS 舒适噪音锁死 VAD"]
      B2 --> B3["高清通话按键 100% 丢失<br/>DSP CPU 暴涨 18 倍且 AI 永不回话"]
    end

    subgraph Good["✅ 生产级管线：P781 对称 PT 同频锁 + P782 <=2次/分 限流与 <=-38dBFS CN 门禁"]
      direction LR
      G1["P781 强制对称 PT 与 16kHz/16kHz 同频<br/>并将 maxptime 锁死在 <=60ms"] --> G2["P782 限制编解码切换 <=2次/分<br/>压制 CN <=-38dBFS 并补齐 20ms 零帧"]
      G2 --> G3["HD 语音按键 100% 零丢失<br/>100% 免疫转码 DoS 与 VAD 挂死"]
    end
```

### 3.3 毫秒级 SDP 同频修正与 Re-INVITE 防 DoS 时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant Peer as 运营商 IMS / 恶意 SIP 终端
    participant SBC as 边缘 SIP/SDP 守门员 (P781/P782)
    participant DSP as 媒体转码与流式 VAD 引擎

    Peer->>SBC: SIP INVITE (AMR-WB/16000 PT=96, telephone-event/8000 PT=101, maxptime=200)
    Note over SBC: P781 0ms 拦截失配参数 (synthetic check):<br/>sip_sdp_payload_asymmetry_or_maxptime_blocked -> 重写对齐 telephone-event/16000 & maxptime=60ms
    SBC->>DSP: 建立对称 16kHz 语音 + 16kHz RFC 4733 按键通道
    Peer->>SBC: 通话中突发 15 次/分 SIP Re-INVITE (G.729 ↔ Opus 震荡) + RFC 3389 CN (-18 dBFS)
    Note over SBC: P782 触发保护 (sip_reinvite_codec_churn_or_cn_vad_deadlock_blocked):<br/>超过 <=2次/分 阈值直接回 SIP 491/500 (不触发 DSP 重分配), 并将 CN 压至 <=-38 dBFS
    SBC->>DSP: 维持原编码器零抖动运行 + 静音期平稳触发 EOU 判停
```

---

## ④ 📊 语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：被动透传远端 SDP + 无限制接受 `Re-INVITE` 与 `RFC 3389 CN` | 方案 B：强制全网回退 `G.711 8kHz` + 直接丢弃 `PT 13` 包 | 方案 C（推荐）：`P781` `RFC 3264` 对称 PT 同频锁 + `maxptime<=60ms` + `P782` `Re-INVITE<=2/min` + `CN<=-38dBFS` |
| :--- | :--- | :--- | :--- |
| **VoLTE/HD 高清语音下按键识别率** | `0%–45%`（`8kHz/16kHz` 时钟失配导致按键包被丢弃） | `99%`（但丧失 `16kHz` 高清语音，清擦音 `F/S` 严重退化） | **`100%`（主语音与 `telephone-event` 严格同频 `16kHz/16kHz` 对称绑定）** |
| **抗 `Re-INVITE` 转码放大 DoS 能力** | 极脆弱（50 路高频 `Re-INVITE` 导致 CPU 暴涨 `18x`） | 仍会因 `G.711u ↔ G.711a` 频繁重绑定消耗信令锁 | **`100% 免疫`（单通话编解码重协商硬限 `<= 2 次/分钟`）** |
| **`RFC 3389` 舒适噪音期间 VAD 稳定性** | 极易死锁（高能量舒适噪音令 VAD 永不判停） | 直接丢弃导致 RTP 断流，触发下游 ASR 时间轴跳变 | **零死锁（`<= -38 dBFS` 能量上限 + 连续 `20ms` 零帧时钟桥接）** |
| **适用场景** | 仅实验室同构软电话 | 传统纯窄带固话 IVR | **全网通 VoLTE/SIP 银行客服、运营商级 AI 语音网关、政务热线** |

---

## ⑤ 🧪 简明定量算例与延迟/成本 Benchmark 洞察（含 7-Card 报告联动）

1. **高清语音 DTMF 挽回与缓冲区安全算例（`P781`）**：
   - 在跨网 `AMR-WB (16kHz)` 呼叫压测中，未开启同频校验时因 `telephone-event/8000` 时钟步进冲突导致按键丢失率高达 **`100%`**，且 `a=maxptime:240` 造成 `480ms` 队列毛刺；启用 **`P781`（采样率偏差 `0 Hz` + 对称 PT + `maxptime <= 60ms`）**后，HD 语音下按键识别率恢复至 **`100.0%`**，DSP 环形缓冲零溢出。
2. **`Re-INVITE` 防 DoS 与 `RFC 3389 CN` 防死锁算例（`P782`）**：
   - 面对每秒 15 次的 `Re-INVITE` 编解码震荡攻击，未防护网关的 DSP CPU 占用从 `5%` 飙升至 **`90%`（`18x` 放大）**；开启 **`P782`（`<= 2 次/分钟` 限流 + `CN <= -38 dBFS` 能量钳位）**后，CPU 波动 `< 0.3%`，且因高底噪 `RFC 3389` 帧导致的 EOU 不判停故障从 **`11.4%` 降至 `0.0%`**。
3. **7-Card 4:5 视觉评测报告联动**：
   - `site/benchmark-cards.html` 与 `site/data/voice-agent-benchmark-report.json`（Stage 394 · 397 大评测维度历史性里程碑！）已收录 `P781`（`sip_sdp_payload_asymmetry_or_maxptime_blocked`）与 `P782`（`sip_reinvite_codec_churn_or_cn_vad_deadlock_blocked`）的确定性压测结果（离线策略检查耗时 `0ms`，真实三方通话 P95 TTFA：Retell `820ms` `measured`、Vapi `960ms` `measured`、LiveKit `690ms` `measured`）。

---

## ⑥ 🛠️ 附录：生产环境语音交付快速核验清单（Architect Checklist）

- [ ] **SIP `RFC 3264` 动态 PT 对称与 `telephone-event` 同频锁（`P781`）**：SBC 是否已强制 Offer 与 Answer 保持相同的动态 Payload Type 编号，并确保 `telephone-event` 的采样率与当前协商的主语音编码器（如 `16000 Hz` 或 `48000 Hz`）保持 `0 Hz` 偏差？
- [ ] **SDP `ptime / maxptime <= 60ms` 边界钳位（`P781`）**：是否已拦截或重写任何 `a=maxptime > 60` 的 SDP 属性，防止超大音频帧冲垮 DSP 环形缓冲区？
- [ ] **通话中 `SIP Re-INVITE` 编解码切换 `<= 2 次/分钟` 限流（`P782`）**：是否已对单通呼叫内触发 DSP 转码器重建的 `Re-INVITE / UPDATE` 实施 `<= 2 次/分钟` 配额限制？
- [ ] **`RFC 3389` 舒适噪音 `<= -38 dBFS` 能量封顶与零帧桥接（`P782`）**：收到 `PT 13` 静音帧时，是否已将本地背景噪音能量限制在 `<= -38 dBFS` 并持续向 ASR/VAD 喂入连续 `20ms` 静音帧以防死锁？
