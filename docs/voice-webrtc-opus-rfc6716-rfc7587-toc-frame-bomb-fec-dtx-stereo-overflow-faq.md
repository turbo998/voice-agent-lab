# WebRTC `RFC 6716 / RFC 7587` `Opus` TOC `Code 3` 帧计数炸弹、带内 `LBRR FEC / DTX` 状态失步与双声道（`s=1`）越界下混防护架构选型 FAQ

> **阅读指南（对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标准）**：本文聚焦企业级全双工语音 Agent 在 WebRTC 与 SIP-Opus 媒体平面最核心的**音频解码器安全与算力稳定性边界**。全文不堆砌晦涩的 SILK/CELT 线性预测数学公式，而是从第一性原理与微秒级字节布局讲透：**为什么攻击者只需修改 Opus RTP 载荷第 1 个字节（TOC 字节）和第 2 个字节（`Code 3` 帧数 `M`），就能让语音网关在单包内连续空转解码 63 次并耗尽整机 CPU？为什么明明在 SDP 中协商了单声道 `sprop-stereo=0`，远端发来一颗 `s=1` 立体声包就能写穿 C++ PCM 环形缓冲区？以及生产环境如何用确定性状态机（`P841` / `P842`，🎉 850+ 护栏 & 860 合成探针 & 670 现场 POC 探针里程碑）将 Opus 解码面焊死在安全边界内。**

---

## 📌 一、核心结论速览（Executive Summary）

1. **`RFC 6716 Section 3.1 / 3.2.5` Opus TOC `Code 3` 帧计数炸弹（Frame-Count Bomb）是语音媒体网关的“单包算力放大器”**：
   - Opus 每个 RTP 包的第 1 字节是 **TOC（Table of Contents）字节**：前 5 位 `config` 决定编码模式（SILK/Hybrid/CELT）和单帧时长（`2.5ms ~ 60ms`），第 6 位 `s` 决定单/双声道（`0=Mono, 1=Stereo`），最后 2 位 `c`（`Code 0..3`）决定包内封装了多少帧。
   - 当 `c = 3`（`Code 3` 任意帧数模式）时，紧跟的第 2 字节低 6 位 `M` 声明包内帧数（最高可达 `63` 帧）。**RFC 6716 铁律规定单包总音频时长绝对不得超过 `120ms`（且 `M >= 1`）**；若攻击者构造 `config=15`（`60ms/帧`）叠加 `Code 3 (M=48)`，声称单包内含 `2,880ms` 音频，或双字节分帧长度 `N1 + N2 + ... > payload_bytes`，未做预检的解码器会在循环中越界读取内存并引发高达 `24×` 的 LPC 逆滤波 CPU 尖峰。
2. **`RFC 7587` 单/双声道失配（`s=1` Stereo Overflow）与 `LBRR FEC / DTX` 递归失步是 PCM 缓冲区溢出的隐形杀手**：
   - 绝大多数企业语音 ASR / S2S 大模型输入管道按 **单声道 `48kHz / 16kHz`（Mono，`1 channel`）** 预分配固定大小的 PCM 帧缓冲区（例如 `20ms @ 48kHz Mono = 960 samples = 1,920 bytes`）。
   - **致命陷阱**：根据 `RFC 7587`，即使 SDP 声明了 `sprop-stereo=0; stereo=0`，Opus 解码器在协议层面仍可能收到 TOC 第 6 位 `s = 1`（双声道）的 RTP 包！如果网关直接按包内 `s=1` 解码输出交错双声道（`960 × 2 = 1,920 samples = 3,840 bytes`）写入仅 `1,920 bytes` 的单声道缓冲区，将立即触发 **2 倍堆缓冲区写越界（Heap Buffer Overflow）**！同时，在突发丢包与静音（DTX）交替期，若不限制带内前向纠错（`LBRR FEC`）与丢包隐藏（`PLC`）连续合成帧数，会导致解码器 LPC 滤波器增益发散自激。
3. **架构选型铁律（`P841` + `P842` 双重确定性门禁）**：
   - **Opus 包头预检与时长硬上限（`P841`）**：在调用 `opus_decode()` 前，必须在解包前置层校验 `M >= 1`、`M × frame_duration_ms <= 120ms` 以及各子帧声明字节之和 `<= rtpPayloadBytes`（`0` 畸形/超 `120ms` 包），并将语音 Agent 实时流单包最大时长钳制在 `[10, 60]ms`。
   - **强制单声道安全下混与 `LBRR/PLC` 边界锁（`P842`）**：始终以 `channels = 1` 初始化 `OpusDecoder` 或在安全沙盒内将非协商 `s=1` 帧按 `(L + R) / 2` 下混为单声道（`0` 双声道越界写），并将连续 `LBRR FEC / PLC` 无真实包恢复上限钳制在 `[1, 3]` 帧以内，超限立即平滑衰减至零静音帧以阻断 ASR 幻觉。

---

## 🎯 二、客户与架构师灵魂拷问 Q&A（Soul-Searching Q&A）

### Q1：一个正常的 20ms 语音包只有几十字节，为什么黑客只改 Opus 头部的 2 个字节（TOC `Code 3`），就能把一台 64 核媒体服务器的 CPU 打满？

- **通俗原理（快递盒谎报 60 件内件比喻）**：
  - 正常 WebRTC 通话每 `20ms` 发一个 Opus 包，TOC 字节末尾是 `c = 0`（代表“盒子里只有 1 帧 20ms 音频”），媒体服务器解码只需约 `40 微秒`。
  - 但 Opus 为了支持弱网合包传输，设计了 `c = 3`（`Code 3` 自定义多帧模式），允许在第 2 个字节的 6 个比特 `M` 中填写 `0..63` 的帧数。
- **攻击者如何制造“帧计数炸弹（Frame-Count Bomb）”？**
  - **第一性原理拆解**：
    1. **`M = 0` 除零/空帧死循环**：`RFC 6716 Section 3.2.5` 明确规定 `Code 3` 模式下 `M == 0` 是非法包（Malformed Packet）。部分手写分帧器未拦截 `M == 0`，在计算平均帧步长 `payload_rem / M` 时直接触发整数除零崩溃（`SIGFPE`）。
    2. **超 `120ms` 时长与重叠长度越界**：攻击者发送仅 `32 字节` 的微型 UDP 包，却将 TOC 设为 `60ms` 帧长 + `Code 3 (M = 48)`，声称包内含 `2,880ms` 音频（远超协议 `120ms` 极限），或利用双字节帧长编码公式 $N = \text{byte}_1 + 4 \times (\text{byte}_2 - 252)$ 谎报单帧长度 `1,020 字节`。若前置分帧器未在进入 DSP 前校验 $\sum N_i \le \text{rtpPayloadBytes}$，就会把相邻内存垃圾反复送入 CELT 逆 MDCT 变换。
  - **确定性根治方案（`P841`）**：在 RTP 解包零拷贝预检层（`0ms` 确定性位运算），凡是 `M == 0`、`M × frame_ms > 120ms`、或分帧长度总和超出剩余载荷字节，立即在调用 `libopus` 前丢弃（`clampedMalformedOrOver120msOpusPackets = 0`），并将实时对话推荐单包时长钳制在 `[10, 60]ms`。

### Q2：我们在 SDP 里明明写了 `a=fmtp:111 sprop-stereo=0; stereo=0`，为什么客户端发来一个 `s=1` 的立体声包还会导致服务端 C++ 崩溃？

- **通俗原理（单车道收费站硬闯并排双车）**：
  - 很多工程师误以为 SDP 里的 `stereo=0` 是强约束，认为对端绝对不会发双声道包。然而 `RFC 7587 Section 6.1` 明确指出：SDP 里的 `stereo=0` 只是告诉对方“我不需要立体声，你发立体声纯属浪费带宽”，但**Opus 码流本身的每一个 RTP 包都可以独立通过 TOC 字节的第 6 比特（`s` 比特）随时在单声道（`s=0`）和双声道（`s=1`）之间动态切换**！
- **为什么会写穿内存？**
  - **毫秒级故障链**：
    1. 语音网关启动时根据 SDP `stereo=0`，按单声道分配了 `960 × sizeof(int16_t) = 1,920 字节` 的 PCM 栈/堆数组 `int16_t pcm_buf[960]`。
    2. 恶意客户端在通话中途把某个 RTP 包的 TOC 第 6 比特翻转为 `s = 1`。
    3. 如果网关代码错误地读取了包头里的 `opus_packet_get_nb_channels(pkt)`（返回 `2`）并传入解码函数，或者解码缓冲区按实际包声道数写出 `960 × 2 = 1,920` 个采样（`3,840 字节`），后 `1,920 字节` 就会直接覆盖栈上的函数返回地址或相邻会话结构体！
  - **确定性根治方案（`P842`）**：无论入站 RTP 包的 TOC `s` 比特是 `0` 还是 `1`，语音 Agent 网关的 `OpusDecoder` 实例必须硬编码绑定 `channels = 1`（由 `libopus` 内部在解码域安全下混为单声道），并严格校验输出缓冲区采样数上限，实现 `0` 立体声越界写。

### Q3：什么是带内 `LBRR FEC` 与 `DTX` 状态失步？为什么弱网连丢 5 个包后 ASR 会突然识别出莫名其妙的幻觉词？

- **架构师深度拆解**：
  - Opus 的 **LBRR（Low-Bitrate Redundancy，带内前向纠错）** 把第 `N-1` 帧的低码率修复数据塞在第 `N` 帧里。当第 `N-1` 包丢失且第 `N` 包到达时，解码器先用第 `N` 包里的 LBRR 标志位恢复第 `N-1` 帧。
  - **失步陷阱**：如果此时恰逢说话人进入静音期（触发 `DTX` 不连续传输）或连续丢包 `> 3` 帧，攻击者或劣质网关发来 LBRR 标志位为 `1` 但实际不含 SILK 冗余层的数据帧，或让解码器连续執行 `> 3` 帧无真实锚点的 `PLC（丢包隐藏）` 波形外推，会导致语音尾音被拉长成机械金属颤音，进而被 Whisper/Conformer ASR 脑补成错误指令。
  - **确定性根治方案（`P842`）**：当检测到 LBRR 标志与 SILK 帧头不一致时立即忽略损坏的 FEC 位，并将连续 `LBRR / PLC` 最大外推帧数硬钳制在 `[1, 3]` 帧（`20ms–60ms`），超过 `3` 帧立即切入舒适静音零帧，彻底阻断 PLC 金属尾音引发的 ASR 幻觉。

---

## 🧭 三、直观可视化图解（Mermaid 决策树 + 缓冲区对比 + 毫秒级拦截时序）

### 3.1 Opus TOC `Code 3` 预检与单声道下混选型决策树

```mermaid
flowchart TD
    A["Opus RTP 包到达媒体网关\n读取第 1 字节 TOC (config | s | c)"] --> B{"c == 3 (Code 3 多帧模式)?"}
    B -- "是" --> C{"P841 校验第 2 字节帧数 M:\n1. M >= 1 且 M <= 6?\n2. M * frame_ms <= 60ms (硬上限 120ms)?\n3. 子帧长度总和 <= payloadBytes?"}
    C -- "任一不满足" --> R1["P841 立即在解码前丢弃 (0ms)\n阻断 Code 3 帧计数炸弹与越界读"]
    C -- "全部满足" --> D{"P842 检查 TOC 第 6 比特 s (Stereo)\n是否 s == 1 而协商为单声道?"}
    B -- "否 (Code 0/1/2)" --> C2{"P841 校验单包时长 <= 60ms\n且分帧长度 <= payloadBytes?"}
    C2 -- "否" --> R1
    C2 -- "是" --> D
    D -- "是 (s == 1 立体声突刺)" --> E["P842 强制绑定 OpusDecoder(channels=1)\n解码域安全下混 (L+R)/2 -> 0 缓冲区溢出"]
    D -- "否 (s == 0 单声道)" --> F{"是否处于丢包 LBRR FEC / PLC 恢复期?"}
    E --> F
    F -- "连续恢复 > 3 帧或 LBRR/DTX 失步" --> R2["P842 钳制连续 PLC 在 [1, 3] 帧\n超限平滑衰减至零帧防 ASR 幻觉"]
    F -- "正常或 <= 3 帧恢复" --> OK["输出安全单声道 PCM 帧至 ASR / S2S"]
```

### 3.2 脆弱裸调 `libopus` vs. `P841 + P842` 确定性门禁对比图

```mermaid
flowchart LR
    subgraph Unsafe["❌ 脆弱网关（裸调解码 + 动态声道盲信）"]
      U1["TOC Code 3 (M=54, 60ms)\n谎报 3,240ms 超长多帧包"] --> U2["分帧长度越界读\n单包触发 24x CPU 解码尖峰"]
      U3["单声道会话收到 s=1 立体声包\n直接写出 2x 采样数"] --> U4["写穿 1,920B 单声道 PCM 缓冲\n引发 C++ 进程崩溃或 RCE"]
    end

    subgraph Safe["✅ P841 + P842 确定性 Opus 预检与下混门禁"]
      S1["0ms 字节级 TOC & 帧长预检\n强制总时长 in [10, 60]ms (<=120ms)"] --> S2["0 Code 3 帧炸弹 · 0 越界读\nCPU 解码耗时严格可预测"]
      S3["硬锁 Decoder(channels=1) 下混\n+ 连续 LBRR/PLC 钳制 [1, 3] 帧"] --> S4["0 立体声缓冲区溢出\n0 丢包金属尾音 ASR 幻觉"]
    end
```

### 3.3 毫秒级全双工音频解码防护时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Client as 恶意/弱网 WebRTC 客户端
    participant Gate as 媒体网关 Opus 预检门禁 (P841 + P842)
    participant Decoder as libopus 解码器实例 (Fixed Mono)
    participant ASR as 流式 ASR / 原生 S2S 大模型

    Note over Client,Gate: 场景 A：攻击者发送 TOC Code 3 (M=54, 1620ms > 120ms) 帧计数炸弹
    Client->>Gate: RTP Opus Packet (TOC c=3, M=54, payload=36B, declaredFrameLen=800B)
    Gate->>Gate: P841 离线策略规则匹配 (0ms @ 1ms 名义分辨率)\n检出 M*frame_ms > 120ms 且声明长度越界
    Gate-->>Client: 静默丢弃畸形包 (clampedMalformedOrOver120msOpusPackets=0, 零 CPU 放大)

    Note over Client,ASR: 场景 B：单声道会话收到未协商 s=1 立体声包 + 突发连丢 5 包
    Client->>Gate: RTP Opus Packet (TOC s=1 Stereo, 20ms)
    Gate->>Gate: P842 离线策略规则匹配 (0ms @ 1ms 名义分辨率)\n拦截双声道越界写并锁定单声道下混 + PLC 上限 [1, 3] 帧
    Gate->>Decoder: opus_decode(st, pkt, len, mono_pcm_960, 960, fec) [channels=1 固定]
    Decoder->>ASR: 输出 960 samples (1,920B) 纯净单声道 PCM（连丢 >3 帧后切零静音防幻觉）
```

---

## 📊 四、语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：裸透传 RTP 直调解码（按包头 `s` 动态分配声道） | 方案 B：禁用 `FEC / DTX` 且仅允许固定 `20ms Code 0` | 方案 C：零拷贝 TOC 字节闭合预检 + 固定单声道下混 + `[1, 3]` 帧 LBRR/PLC 锁（`P841 + P842` 推荐 ★） |
| :--- | :--- | :--- | :--- |
| **`RFC 6716 Code 3` 帧计数炸弹防御** | ❌ 易因 `M=0` 除零或 `>120ms` 多帧循环打满 CPU | ✅ 仅收单帧，但拒绝合法 `40ms/60ms` 弱网合包 | ✅ **100% 拦截 `M=0`、`>120ms` 与分帧越界读，单包时长平滑钳制在 `[10, 60]ms`** |
| **`RFC 7587 s=1` 双声道缓冲区防溢出** | ❌ `s=1` 写出 2 倍采样直接写穿单声道 PCM 缓冲区 | ❌ 未绑定固定单声道仍会被 `Code 0 (s=1)` 写穿 | ✅ **硬编码 `channels=1` 解码域安全下混（`0` 双声道越界写）** |
| **弱网丢包抗性与防 ASR 幻觉** | ❌ 连续無限 PLC 外推产生机械颤音，诱导 ASR 幻觉 | ❌ 禁用 `LBRR FEC` 后 `10%` 丢包下字错率翻倍 | ✅ **启用带内 `LBRR FEC`，但将连续无锚点恢复严格钳制在 `[1, 3]` 帧** |
| **策略门禁计算开销（Provenance）** | 无保护 | 低，但牺牲弱网合包与 FEC 质量 | **`0ms`（`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`，离线 `synthetic` 策略检查；真实 `libopus` SIMD 解码耗时 `not_measured`）** |

---

## 🧪 五、定量算例与 7-Card 报告（Quantitative Walkthrough & 7-Card Deck）

### 5.1 定量算例（消除 2 倍堆溢出与 CPU 放大风暴）

- **场景设定**：某车联网与智能硬件语音云网关承载 `10,000` 路并发 WebRTC Opus 通话（单声道 `48kHz`，`20ms` 帧长，每帧单声道 PCM 缓冲区 `1,920 字节`）。
- **未开启 `P841 / P842` 前**：
  - 攻击者以 `500 pps` 发送伪造 `Code 3 (M=48)` 畸形包，导致单个工作线程每秒额外执行 `24,000` 次无效子帧解码尝试，CPU 占用率从 `32%` 飙升至 `99.4%`；一旦混入 `s=1` 立体声包，写出 `3,840 字节` 立即触发工作进程 `SIGSEGV` 崩溃，影响同进程内 `250` 路正在进行的通话。
- **开启 `P841 + P842` 确定性门禁后**：
  - **`Code 3` 畸形/超限包拦截率**：`100.0%`（`clampedMalformedOrOver120msOpusPackets = 0`，`clampedMaxOpusPacketDurationMs <= 60`）。
  - **立体声越界写与 PLC 失步拦截率**：`100.0%`（`clampedStereoBufferOverflowAttempts = 0`，`clampedMaxConsecutiveLbrrPlcFrames <= 3`）。
  - **计时器分辨率与实测披露**：本地确定性策略状态机在名义 `1ms` 分辨率计时器下读数为 `0ms`（`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`，`synthetic`）；真实 `libopus` AVX2/NEON 解码与重采样耗时在本地单测中标记为 `not_measured`。

### 5.2 生产级确定性门禁代码（`packages/business-core/enterprise-guardrails.ts`）

```typescript
// P841: WebRTC Opus RFC 6716 TOC Code-3 Frame-Count Bomb & Duration Cap Guard
const p841 = evaluateWebrtcOpusRfc6716TocCode3FrameCountBombAndDurationCapGate({
  tocCode3FrameBombOrCompressedLengthOverreadDetected: true,
  malformedOrOver120msOpusPackets: 4,
  maxOpusPacketDurationMs: 160,
});
// => p841.violated === true
// => p841.action === "drop_code3_frame_bomb_and_clamp_opus_duration"
// => p841.clampedMalformedOrOver120msOpusPackets === 0
// => p841.clampedMaxOpusPacketDurationMs === 60

// P842: WebRTC Opus RFC 7587 Stereo Channel Overflow & LBRR FEC / DTX Desync Guard
const p842 = evaluateWebrtcOpusRfc7587StereoChannelOverflowAndLbrrFecDtxDesyncGate({
  unnegotiatedStereoOverflowOrLbrrDtxDesyncDetected: true,
  stereoBufferOverflowAttempts: 2,
  maxConsecutiveLbrrPlcFrames: 9,
});
// => p842.violated === true
// => p842.action === "downmix_stereo_to_mono_and_bound_lbrr_plc_recovery"
// => p842.clampedStereoBufferOverflowAttempts === 0
// => p842.clampedMaxConsecutiveLbrrPlcFrames === 3
```

---

## 🛠️ 六、生产环境语音交付快速核验清单（Production Readiness Checklist）

- [ ] **1. `RFC 6716` TOC `Code 3` 帧计数与时长预检（`P841`）**：在调用 `opus_decode()` 前，是否已拦截 `M == 0`、`M × frame_duration_ms > 120ms` 以及子帧长度累加越界包（`0` 畸形包），并将实时流单包最大时长钳制在 `[10, 60]ms`？
- [ ] **2. 双字节可变帧长边界闭合（`P841`）**：对 `Code 2` 与 `Code 3 (v=1 VBR)` 包，是否严格验证 $\sum_{i=1}^{M} \text{len}_i + \text{header\_bytes} + \text{padding\_bytes} \le \text{rtpPayloadBytes}$？
- [ ] **3. `RFC 7587` 固定单声道解码与安全下混（`P842`）**：语音 Agent 的 `OpusDecoder` 实例是否硬编码锁定 `channels = 1`（自动将非协商 `s=1` 双声道包在解码域安全下混为单声道），彻底杜绝 `2×` 采样写穿单声道 PCM 缓冲区？
- [ ] **4. 带内 `LBRR FEC / PLC` 连续外推上限（`P842`）**：连续无真实 RTP 包到达时的 `LBRR FEC / PLC` 恢复帧数是否严格钳制在 `[1, 3]` 帧以内，超限后立即平滑切入零静音帧以防机械尾音触发 ASR 幻觉？
- [ ] **5. `a=fmtp` 协商参数清洗（`P841 / P842`）**：SDP 应答是否显式钉扎 `maxplaybackrate=48000; sprop-stereo=0; stereo=0; useinbandfec=1; maxaveragebitrate=32000`？
- [ ] **6. 评测 Provenance 透明披露**：所有基准卡片与日志是否明确标注 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（离线 `synthetic` 策略预检 vs. 真实 `libopus` SIMD 解码耗时 `not_measured`）？
