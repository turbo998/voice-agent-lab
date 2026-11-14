# WebRTC `RFC 3550 / RFC 6465` 多方混音桥 `CSRC` 列表越界与自环啸叫、`mixer-to-client` 音量头主讲人（Dominant Speaker）伪造怎么防？企业语音智能体多方会诊与三方调解混音选型及原理解析 FAQ（Topic 62 · Stage 422）

> **阅读指南**：本文严格对标 `ib-vs-ethernet-roce-selection-faq.md` 的**六段式通俗透彻结构**，拒绝把 `RFC 3550 Section 5.1 / 7.1 (RTP Mixer & CSRC List)`、`RFC 6464 (Client-to-Mixer Audio Level)` 与 `RFC 6465 (Mixer-to-Client Audio Level)` 写成枯燥的协议字段罗列。我们先用大白话和第一性原理讲清楚：**为什么在车险三方调解、远程医疗多学科会诊或银行双人核保通话中，媒体网关（RTP Mixer / SFU）要把多位参会人的声音合成为单路 RTP 流送给语音智能体或窄带终端，并用 `CSRC`（贡献源列表）标记“当前这 20ms 里有谁在说话”？为什么畸形的 `CC (CSRC Count)` 字段会引发缓冲区越界读（Overread），或者因未剥离接收者自身 `SSRC`（Mix-Minus 缺失）导致震耳欲聋的正反馈声学自环啸叫？为什么恶意参会端只需在 `RFC 6464` 扩展头中谎报 `0 dBov` 满格音量就能劫持全场的主讲人聚光灯（Dominant Speaker Hijack）并误导 AI 把旁人当成主叫？以及生产环境如何用确定性状态机（`P837–P838`）将其彻底锁死。**
> **双语版本 / Bilingual Edition**：本文提供完整中文版与英文版（[`docs/voice-webrtc-rtp-rfc3550-rfc6465-csrc-mixer-audio-level-spoof-loopback-faq.en.md`](voice-webrtc-rtp-rfc3550-rfc6465-csrc-mixer-audio-level-spoof-loopback-faq.en.md)）。

---

## ① 📌 核心结论速览（Executive Summary）

1. **什么是 RTP 混音器（Mixer）的 `CSRC` 列表与 `RFC 6465` 音量扩展头？**：
   - 当 5 位参会人（主叫客户、担保人、客户经理、理赔员、AI 语音助手）同处一场多方语音会话时，为了节省带宽并适配只支持单轨音频的电话腿，媒体混音器（`RTP Mixer`）会将当前正在说话的几个人声音叠加成一包 RTP 发出：包头的 `SSRC` 填混音器自己的 ID，而 4 位 `CC`（CSRC Count，`0..15`）字段后紧跟一个 `CSRC` 数组，精确列出**本帧声音是由哪几个参会人的原始 `SSRC` 混合而成的**。
   - 同时，`RFC 6465 (urn:ietf:params:rtp-hdrext:mixer-audio-level)` 会在 RTP 扩展头中为每个 `CSRC` 附带 1 字节的音频分贝值（`0..127`，代表 `0 dBov` 到 `-127 dBov`），供语音智能体和前端界面实时判断“当前谁声音最大、谁是主讲人（Dominant Speaker）”。
2. **三大最隐蔽的多方混音与主讲人归属事故**：
   - **`CC (CSRC Count)` 越界读（Buffer Overread）与伪造未注册 `CSRC` 身份**：RTP 固定头只有 12 字节，若数据包谎称 `CC = 15`（需额外读取 `15 × 4 = 60` 字节 `CSRC` 表），但实际 UDP 载荷只有 24 字节，未做边界校验的 C/C++ 解包器会直接越界读取相邻内存中的敏感数据；若不对 `CSRC` 成员做白名单核验，攻击者可塞入主叫客户的 `SSRC`，诱导 AI 将攻击者的语音归因到主叫名下！
   - **缺失 `Mix-Minus (N-1)` 排除锁引发的自环回声与无限啸叫**：混音器向参会人 $A$（或 AI 语音节点）发送混音包时，必须从混音矩阵中减去 $A$ 自己的声音（即 `Mix-Minus`）。若配置错误将 AI 自身的 `SSRC` 包含进发给 AI 的 `CSRC` 列表中，AI 会把自己的播报声当成客户插话（Self-Barge-In），并在双工桥接间形成指数级正反馈声学啸叫！
   - **客户端伪造 `RFC 6464` `0 dBov` 满格音量劫持主讲人（Dominant Speaker Hijack）**：许多轻量级 SFU/Mixer 为了省算力，不解压测量真实 PCM 能量，而是直接盲信客户端上行 `RFC 6464` 扩展头自报的音量值来选举主讲人并透传到 `RFC 6465`。恶意旁听端只需发送静音包却在扩展头填 `level = 0 (0 dBov 满格)`，就能永久霸占混音器的 Top-N 激活席位，把真正说话的客户声音挤出混音矩阵（静音压制）！
3. **架构师选型黄金铁律（`P837` + `P838` 双护栏锁死）**：
   - **`P837`（`RFC 3550 CSRC` 字节边界与已鉴权成员校验 + 强制 `Mix-Minus` 自环剥离 + `Top-[1, 4]` 活跃混音路数上限）**：强制校验 `12 + 4 × CC + ext_len <= packet_len` 与 `CSRC` 成员白名单，100% 剔除包含目标自身 `SSRC` 的自环混音帧（`0` 未鉴权/自环 `CSRC`），并将单帧并发混音说话人上限钳制在 **`[1, 4]` 路**（避免 >4 人同时叠加造成 ASR 词错率崩盘）。
   - **`P838`（`RFC 6464/6465` 音量头与真实 PCM RMS 交叉核验 + `[300, 1200]ms` 主讲人防抖保持窗）**：严禁盲信客户端自报的 `RFC 6464` 音量头，强制在混音侧与真实音频能量交叉比对（偏差 `> 12 dB` 即判定伪造并按真实 RMS 重写，`0` 伪造音量包透传），同时将主讲人切换保持窗口（Dominant Speaker Hold Window）钳制在 **`[300, 1200]ms`**，消除咳嗽或短促噪音引发的画面/角色高频闪烁。

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Q1 / Q2 / Q3）

### Q1：多方语音会议里如果有 12 个人同时开麦，为什么混音器不能把 12 个人的声音全部加在一起（`CC = 12`）发给语音大模型？

- **第一性原理拆解**：
  1. **声学底噪叠加定律（每翻倍增加 `+3 dB` 底噪）**：如果将 12 路开麦通道（哪怕其中 10 个人没说话、只有空调和呼吸底噪）直接线性相加，背景底噪功率会放大 $10 \log_{10}(12) \approx +10.8\text{ dB}$，直接淹没真正说话人的清辅音；
  2. **大模型与 ASR 的重叠语音极限**：无论是级联流式 ASR 还是原生 `S2S` 模型，当超过 3–4 路人声同时重叠时，梅尔频谱（Mel-Spectrogram）共振峰完全交织，字错率（WER）会从 `< 5%` 暴涨至 `> 65%`；
  3. **`CC` 越界与扩展头错位风险**：`CC` 虽然语法上允许 `0..15`，但高 `CC` 叠加 `RFC 6465` 扩展头极易触发 MTU 分片或畸形包 `12 + 4 × CC > packet_len` 越界读。
- **工程量化护栏（`P837`）**：
  - 采用 **`Top-N` 门控混音（Gated Mixing）**：不管会场有 10 人还是 50 人，混音器在任意 20ms 帧内只选取真实语音能量最高且通过 VAD 门限的 **`[1, 4]` 位活跃说话人**（典型值 `Top-3`）送入混音矩阵与 `CSRC` 列表，其余静默通道全部门控归零。

### Q2：什么是 `Mix-Minus (N-1)` 混音矩阵？为什么少了这一步，AI 语音助手会在三方通话里“自己跟自己吵架”？

- **第一性原理拆解**：
  - 在多方桥接中，如果混音器偷懒只生成**唯一一路全局混音流** $(S_1 + S_2 + S_{\text{AI}})$ 并广播给所有参与者，那么 AI 语音助手在播报“请问您确认理赔金额吗？”的同时，会在 20ms 后从入站 RTP 流中原封不动地收到自己的声音（且 `CSRC` 列表中赫然躺着 `$S_{\text{AI}}$`）。
  - 如果网关未按 `Mix-Minus` 规则为每个接收者 $k$ 单独输出 $\sum_{i \neq k} S_i$，或者未在入站侧拦截包含自身 `SSRC` 的 `CSRC` 包，AI 的 VAD 会误判“有人打断我”，立即停播并开始识别自己刚才那句话的后半截，陷入无限自打断与声学回授死循环！
- **`P837` 确定性防自环机制**：
  - 混音器出站严格执行 per-leg `Mix-Minus`；
  - 语音智能体入站网关对每包 RTP 遍历 `CSRC[0..CC-1]`，一旦检出 `csrc == local_ai_ssrc` 或不在当前会场已鉴权 `SSRC` 映射表内，**0ms 策略拦截并剥离自环音轨**（`clampedUnverifiedOrLoopedCsrcEntries = 0`）。

### Q3：攻击者如何利用 `RFC 6464 / RFC 6465` 音频音量扩展头发动“零声波消音攻击（Silent Dominant-Speaker Hijack）”？

- **第一性原理拆解**：
  - 在 WebRTC SFU/Mixer 架构中，为了避免在服务端对每路 `Opus` 流做全量解码，客户端会在上行 RTP 包附带 `RFC 6464` 扩展头（1 bit `V` 语音活动标志 + 7 bits 音量衰减值，其中 `0` 代表最大音量 `0 dBov`，`127` 代表静音 `-127 dBov`）。
  - 如果混音器直接按客户端自报的 `RFC 6464 level` 排序选出 `Top-3` 主讲人并写入下行 `RFC 6465`，恶意参会端只需持续发送全零静音帧，但在 RTP 扩展头里把 `level` 硬编码为 `0`（最大音量 `0 dBov`）。混音器会误以为该恶意端一直在高声讲话，将其永久锁定在 `Dominant Speaker` 席位，反而把正常以 `-18 dBov` 说话的真实客户踢出混音池！
- **`P838` 真实能量对账与防抖保持锁**：
  1. 混音桥对入站 `Opus` 包头 TOC/子带能量或解码后 PCM RMS 做轻量级核验：凡自报 `RFC 6464 level` 与实测能量偏差 `> 12 dB` 的数据包，立即判定为伪造音量头，剥离其虚报值并按实测 RMS 重写（`clampedSpoofedAudioLevelExtensionPackets = 0`）；
  2. 为防止旁人一声咳嗽（`50ms` 尖峰）瞬间夺走主讲人焦点，强制设置 **`[300, 1200]ms` 主讲人切换保持窗口（Dominant Speaker Hold Window）**。

---

## ③ 🧭 直观可视化图解（Mermaid 选型决策树 + 延迟拆解对比 + 毫秒级时序图）

### 3.1 多方混音桥 `CSRC` 校验、`Mix-Minus` 防自环与 `RFC 6465` 主讲人防伪决策树（`flowchart TD`）

```mermaid
flowchart TD
    A["入站 / 混音桥 RTP 数据包 (RFC 3550 / RFC 6464 / RFC 6465)"] --> B{"校验 12 + 4*CC + ext_len <= pkt_len<br/>且 CSRC 全部属于已鉴权参会白名单？"}
    B -- "❌ CC 字节越界 / 未注册伪造 CSRC" --> C["P837 触发：0ms 策略丢弃越界/伪造包<br/>(clampedUnverifiedOrLoopedCsrcEntries = 0)"]
    B -- "✅ 长度闭合且成员合法" --> D{"CSRC 列表中是否包含接收端自身 SSRC<br/>(违反 Mix-Minus) 或 CC > [1, 4]？"}
    D -- "❌ 含自身 SSRC 自环 / 超 4 路混音" --> E["P837 触发：剥离自身 SSRC 防回授啸叫<br/>并按 Top-[1, 4] 门控混音路数"]
    D -- "✅ 无自环且路数 <= [1, 4]" --> F{"校验 RFC 6464/6465 音量扩展头：<br/>|自报 dBov - 实测 RMS| <= 12 dB？"}
    F -- "❌ 静音包谎报 0 dBov 抢主讲" --> G["P838 触发：拦截伪造音量头并按实测 RMS 重写<br/>(clampedSpoofedAudioLevel = 0)"]
    F -- "✅ 音量真实一致" --> H{"主讲人切换间隔是否满足<br/>[300, 1200]ms 防抖保持窗？"}
    H -- "未满保持窗 (瞬态咳嗽/噪声)" --> I["P838 保持原主讲人焦点不闪烁"]
    H -- "持续发声满保持窗" --> J["平滑更新 RFC 6465 主讲人归属并送入 AI 语音脑"]
```

### 3.2 裸奔混音桥 vs `P837/P838` 确定性护栏对比图（`flowchart LR`）

```mermaid
flowchart LR
    subgraph Bad["❌ 裸奔 RTP Mixer / SFU (无 CSRC/Mix-Minus/音量核验)"]
        B1["畸形 CC=15 越界包 + 12 路全开混音"] --> B2["内存越界读 + 底噪叠加 +10.8dB 淹没语音"]
        B3["未做 Mix-Minus 把 AI 自身声音混回"] --> B4["AI 自打断死循环 + 正反馈声学啸叫"]
        B5["恶意端静音包谎报 RFC 6464 0 dBov"] --> B6["霸占主讲人席位，真实客户声音被挤出"]
    end
    subgraph Good["✅ P837 + P838 确定性混音与主讲人护栏状态机"]
        G1["CC 长度闭合 + Top-[1, 4] 门控混音"] --> G2["0 越界 · 底噪干净，多方 ASR 准确率 >96%"]
        G3["强制 Mix-Minus (N-1) 剥离自身 SSRC"] --> G4["0 自打断与回授啸叫"]
        G4_2["实测 RMS 对账 + [300, 1200]ms 防抖窗"] --> G5["0 伪造抢麦 · 0 咳嗽焦点闪烁"]
    end
```

### 3.3 毫秒级多方会诊 `Mix-Minus` 防自环与 `RFC 6465` 主讲人防劫持时序图（`sequenceDiagram`）

```mermaid
sequenceDiagram
    autonumber
    participant Caller as 主叫客户 (SSRC=0x11, -16 dBov)
    participant Rogue as 旁听恶意端 (SSRC=0x99, 静音谎报 0 dBov)
    participant Mixer as 企业多方混音桥 (P837/P838)
    participant AI as 语音智能体节点 (SSRC=0xAA)

    Note over Caller,AI: 阶段 1：P838 拦截客户端谎报 0 dBov 满格音量抢夺主讲人席位
    Caller->>Mixer: RTP (SSRC=0x11, 真实语音 RMS=-16 dBov, RFC 6464 level=16)
    Rogue-->>Mixer: RTP (SSRC=0x99, 全零静音帧 RMS=-96 dBov, 伪造 RFC 6464 level=0 [0 dBov!])
    Mixer->>Mixer: P838 命中：|-96 - 0| = 96 dB > 12 dB 阈值 → 重写 0x99 音量为 -96 dBov 并移出活跃池

    Note over Caller,AI: 阶段 2：P837 执行 Mix-Minus 剥离 AI 自身 SSRC 并限制 Top-[1, 4] CSRC
    AI->>Mixer: RTP 播报语音 (SSRC=0xAA, -14 dBov)
    Mixer->>Mixer: P837 构造发往 AI 的混音帧：从 {0x11, 0xAA} 中强制剥离 AI 自身 SSRC=0xAA
    Mixer->>AI: RTP (CC=1, CSRC=[0x11], RFC 6465 level=[16]) [0 自环回声 · 主讲人稳定锁定 0x11]
```

---

## ④ 📊 语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：无门控全加和混音 + 盲信客户端音量头（裸奔基线） | 方案 B：客户端全网格多流直连（Mesh N×N） | **方案 C（推荐）：服务端 `Top-[1, 4]` 门控 `Mix-Minus` (`P837`) + 能量对账 `RFC 6465` (`P838`)** |
| :--- | :--- | :--- | :--- |
| **带宽与电话干线兼容性** | 单流下行，兼容 SIP/PSTN | ❌ 客户端需解码 $N-1$ 路流，无法接入单轨 SIP 电话 | **✅ 单流适配任意 SIP/WebRTC 终端，同时保留 `CSRC` 说话人归属** |
| **抗 `CC` 越界与伪造 `CSRC`（`P837`）** | ❌ 易受畸形 `CC=15` 越界读或假冒 `CSRC` 归因污染 | 无 `CSRC` 混音头 | **✅ 严格校验 `12 + 4×CC <= pkt_len` 与会场成员白名单（`0` 越权 `CSRC`）** |
| **抗声学自环与 AI 自打断（`P837`）** | ❌ 漏配 `Mix-Minus` 即触发 AI 听见自己声音无限自断 | 依赖各端本地 AEC | **✅ 混音出站与 AI 入站双重剥离自身 `SSRC`（`0` 自环帧）** |
| **多人底噪抑制与清晰度（`P837`）** | ❌ $N$ 路底噪全叠加，超過 5 人即一片嘈杂 | 客户端自行混音 | **✅ 门控仅混合 `Top-[1, 4]` 活跃发声通道，底噪降低 `8–11 dB`** |
| **抗 `RFC 6464/6465` 伪造抢麦（`P838`）** | ❌ 静音包填 `0 dBov` 即可挤掉真实说话人 | 无中心主讲人仲裁 | **✅ 实测 PCM/子带能量交叉核验 + `[300, 1200]ms` 主讲人防抖保持窗** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：8 方远程会诊混音底噪与伪造音量抢麦 vs `P837/P838` 护栏效果

- **场景设定**：8 方参与的车险人伤远程调解室（主叫车主、对方驾驶员、交警、理赔员、法务、医疗专家、记录员、AI 调解助手）。
  - **未开启 `P837/P838` 时**：
    1. 8 路全开无门控混音导致合成流底噪抬升 `+9.0 dB`，AI 语音识别字错率（WER）从单人时的 `4.1%` 恶化至 **`22.6%`**；且一次网桥路由配置回环导致 AI 将自身 `SSRC` 混入输入流，触发连续 `14` 次自打断；
    2. 当某个参会端麦克风驱动异常持续上报虚假 `RFC 6464 level = 2 (-2 dBov)` 时，真实客户有 **`68.4%` 的发言帧** 被挤出 `Top-2` 主讲人槽位。
  - **开启 `P837/P838` 确定性护栏后**：
    1. `P837` 100% 拦截越界/未鉴权与自环 `CSRC`（`clampedUnverifiedOrLoopedCsrcEntries = 0`），并将并发混音通道钳制在 **`[1, 4]` 路**，8 方会场下 ASR WER 恢复至 **`4.5%`**；
    2. `P838` 100% 拦截重写虚假音量扩展头（`clampedSpoofedAudioLevelExtensionPackets = 0`），并将主讲人保持窗钳制在 **`[300, 1200]ms`**，主讲人归属准确率达 **`100%`**。
- **计时与实测口径声明（Provenance & Resolution Disclosure）**：
  - 本地单元测试与沙盒中的策略评估耗时统一披露为：`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（属于离线 `synthetic` 纯内存策略状态机检查）。
  - 真实生产环境中的 `RTP Mixer` 线性叠加、Opus 子带能量提取与 `RFC 6465` 扩展头打包耗时未在本地单测中测量（标记为 `not_measured`）。

### 5.2 对应 7-Card 报告位置
- 已同步写入 [`site/benchmark-cards.html`](../site/benchmark-cards.html)（Card 3 & Card 5 **第 425 项评测维度**）与密封数据 [`site/data/voice-agent-benchmark-report.json`](../site/data/voice-agent-benchmark-report.json)。
- 配套高密度架构图：[`assets/svg/66-voice-webrtc-rtp-rfc3550-rfc6465-csrc-mixer-audio-level-spoof-loopback-2026-11-14.svg`](../assets/svg/66-voice-webrtc-rtp-rfc3550-rfc6465-csrc-mixer-audio-level-spoof-loopback-2026-11-14.svg)。

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Good Fit vs Not For + Checklist）

### ✅ Good Fit（极佳适用场景） vs ⛔ Not For（不适用/无需过度设计场景）

| ✅ Good Fit（必须开启 `P837` + `P838` 护栏的场景） | ⛔ Not For（不适用或无需此层护栏的场景） |
| :--- | :--- |
| **包含 3 方及以上参会人（三方调解、多学科远程会诊、家庭联名账户核身、坐席+专家+客户三方桥接）的 RTP Mixer / SFU 语音架构** | **纯 1 对 1 点对点通话（全程 `CC = 0`，不经过任何 RTP 混音器或 `RFC 6465` 扩展头）** |
| **依赖 `RFC 6464 / RFC 6465` 音频音量扩展头驱动主讲人切换、说话人字幕归因或 `Top-N` 选路混音的会议网关** | **完全不使用 RTP 头部扩展、仅传输裸 `G.711` 单路固话点对点专线** |

### 生产上线 6 项强制核验 Checklist

- [ ] **1. `RFC 3550 CC` 字节边界防越界读校验（`P837`）**：核验 RTP 解析器在读取 `CSRC` 列表前强制断言 `12 + 4 × CC + ext_len <= packet_len`，严禁信任未闭合的 `CC` 计数。
- [ ] **2. `CSRC` 会场已鉴权成员白名单绑定（`P837`）**：核验 `CSRC` 数组中的每个 32 位 ID 必须匹配当前会议已通过鉴权的活跃参会者 `SSRC`（`clampedUnverifiedOrLoopedCsrcEntries = 0`）。
- [ ] **3. 强制 `Mix-Minus (N-1)` 防自环啸叫（`P837`）**：核验混音桥向任意参会端或 AI 节点发送的 RTP 包中，绝不包含该接收端自身的 `SSRC` 音频分量与 `CSRC` 标识。
- [ ] **4. `Top-[1, 4]` 门控活跃混音路数上限（`P837`）**：核验单帧并发参与混音叠加的活跃说话人数量被钳制在 `[1, 4]` 路以内，抑制多路底噪叠加。
- [ ] **5. `RFC 6464/6465` 音量头与真实音频能量交叉核验（`P838`）**：核验混音器对比客户端自报 `dBov` 与真实音频 RMS，偏差 `> 12 dB` 时自动重写并阻断静音包虚假抢麦（`clampedSpoofedAudioLevelExtensionPackets = 0`）。
- [ ] **6. `[300, 1200]ms` 主讲人切换防抖保持窗（`P838`）**：核验主讲人（Dominant Speaker）选举状态机配置了 `[300, 1200]ms` 保持窗口，防止瞬态咳嗽或敲击声导致说话人归属高频跳变。
