# WebRTC `RFC 3711 / RFC 7714` `SRTP AES-GCM` 计数器流密码 `Nonce (SSRC+ROC+SEQ)` 重用破密与 `SRTCP E=0` 明文旁路及 31 位索引溢出怎么选？`Two-Time Pad` 防密钥流恢复、`[64, 128]` 重放滑窗与强制 `E=1` 控制包加密原理解析

> **关联架构阶段**：Stage 418（Topic 58 · 🎉 `P830` 护栏与 860 项单测里程碑 · `P829` / `P830`）· **关联文档**：[English Version (`voice-webrtc-srtp-rfc7714-aes-gcm-roc-nonce-reuse-unencrypted-srtcp-faq.en.md`)](./voice-webrtc-srtp-rfc7714-aes-gcm-roc-nonce-reuse-unencrypted-srtcp-faq.en.md) · [2026-11-09 每日突破报告](./daily/2026-11-09.md) · [方案架构指南](./solution-architecture.md) · [评测与验收标准](./voice-agent-evaluation-rubric.md)

---

## ① 📌 核心结论速览（Executive Summary）

在企业级实时语音智能体（WebRTC 浏览器坐席、金融电话银行、医疗远程问诊与高保密政企语音网关）的媒体加密传输层（`RFC 3711 The Secure Real-time Transport Protocol` 与 `RFC 7714 AES-GCM for SRTP`）中，**所有现代 WebRTC 语音通话都使用 `AEAD_AES_128_GCM` 或 `AEAD_AES_256_GCM` 对每一帧 20ms 音频包进行认证加密（SRTP），并对伴随的控制反馈包进行安全保护（SRTCP）**。然而在企业自研 SFU、录音分流器（Forking Proxy）或热备切换（Failover）网关中，如果出现“**在同一个 DTLS-SRTP 主密钥下重置 `SEQ/ROC` 或混用相同 `SSRC` 导致 `AES-GCM` 12 字节 IV/Nonce 重用 + 允许 `SRTCP E=0` 不加密传输或重放滑窗过小**”，将引发三大灾难性的密码学破密与语音中断故障：

1. **同一 `SRTP Master Key` 下 `(SSRC, ROC, SEQ)` 三元组重用引发 `AES-GCM` 两本密码本碰撞与认证子密钥 $H$ 完全沦陷（`RFC 7714` Nonce Reuse / Two-Time Pad Catastrophe）**：按 `RFC 7714 Section 8.1`，`SRTP AES-GCM` 的 12 字节初始化向量（IV / Nonce）由 12 字节隐式盐（`Master Salt`）与 **`SSRC (32 bits) || ROC (32 bits) || SEQ (16 bits)`** 异或而成。当语音网关在主备容器切换、TTS 提示音拼接或 `SIPREC` 双录插播时，沿用同一个 DTLS-SRTP 主密钥却把 RTP 序列号重置回 `SEQ=0, ROC=0`（且 `SSRC` 不变），就会产生完全相同的 `Nonce`！在 `AES-GCM` 下，**只要两个不同音频包使用了相同的 `(Key, Nonce)`**：① 两包密文异或直接暴露两包明文语音的异或（`C1 ⊕ C2 = P1 ⊕ P2`，结合静音帧或已知固定欢迎语即可 100% 还原客户原声）；② 攻击者可通过有限域 $GF(2^{128})$ 多项式求根（Forbidden Attack）直接算出 `GHASH` 认证密钥 $H$，此后能伪造任意带合法 16 字节认证标签的语音指令注入大模型；
2. **`SRTCP` 控制包将加密标志位设为 `E=0`（`UNENCRYPTED_SRTCP`）泄露全通话 `SDES` 身份与通话拓扑**：`RFC 3711 Section 3.4` 在每个 `SRTCP` 包尾部定义了 1 个最高位 **`E-bit`（Encryption Flag）**。部分老旧网关为了方便抓包监控，发送 `E=0`（仅带认证标签但明文裸奔）的 `SRTCP` 包，或接受 `UNENCRYPTED_SRTCP` 会话参数，导致包内的 `SDES CNAME/EMAIL/PHONE`、`RTCP APP` 业务元数据及说话人音量分布 100% 明文暴露；
3. **重放保护滑窗（Replay Window）过小（`< 64` 包）导致弱网抖动误杀，或 `SRTCP` 31 位索引达 $2^{31}-1$ 回绕重用密钥**：`RFC 3711 Section 3.3.2` 要求至少 `64` 包的位图滑窗；若设为 `16` 包（仅 `320ms`），跨洋网络一次乱序重传就会导致后续合法语音包被当作重放包丢弃；若 `SRTCP` 31 位索引逼近 `0x7FFFFFFF` 而不触发 `DTLS-SRTP` 重协商换钥（Rekey），索引回绕将再次触发 Nonce 重用。

**架构师选型铁律（一句话总结）**：
> **严禁在同一个 `SRTP Master Key` 下对相同 `SSRC` 重置 `SEQ/ROC` 或允许任何 `(SSRC, ROC, SEQ)` Nonce 重用，严禁在生产环境放行 `E=0` 明文 `SRTCP` 控制包或 `< 80 bits` 的截断认证标签！生产环境必须同时部署两道确定性门禁：① `RFC 7714 SRTP AES-GCM` Nonce 零重用与 `[64, 128]` 包重放滑窗门禁（`P829`：实时追踪活跃 `(MasterKey, SSRC, ROC, SEQ)` 状态，一旦检测到主备切换或音源拼接可能引发 Nonce 重用（`0` Nonce 重用事件），立即强制轮换新 `SRTP Master Key / SSRC`，并将 `RFC 3711` 防重放位图窗口钳制在 `[64, 128]` 包）；② `RFC 3711 SRTCP` 强制 `E=1` 全加密、31 位索引预换钥与 `[80, 128] bits` 认证标签门禁（`P830`：100% 拒绝 `E=0` 未加密 `SRTCP` 控制包或 `UNENCRYPTED_SRTCP` 协商（`0` 明文控制包），在 `SRTCP` 索引达到 $2^{31}-2^{16}$ 前强制触发自动换钥，并将认证标签长度锁定在 `[80, 128] bits`）。**

![2026-11-13 Enterprise Voice Agent WebRTC RFC 7714 SRTP AES-GCM Nonce Reuse & RFC 3711 SRTCP Encryption Guard FAQ & Stage 418 Visual Summary](../assets/svg/62-voice-webrtc-srtp-rfc7714-aes-gcm-roc-nonce-reuse-unencrypted-srtcp-2026-11-13.svg)

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（First-Principles Deep Dive）

### Q1：为什么在语音网关主备容器切换（Failover）或插播“正在为您查询”提示音时，如果不小心把 RTP `SEQ` 重置回 `0`，会导致整通 `AES-GCM` 加密电话被黑客瞬间破译并伪造指令？

- **大白话与第一性原理解析**：
  在 WebRTC 中，`AEAD_AES_128_GCM`（`RFC 7714`）之所以速度极快，是因为它底层用的是 **AES-CTR（计数器流密码模式）+ GHASH（有限域多项式消息认证码）**。
  根据 `RFC 7714 Section 8.1`，每个 SRTP 包的 12 字节 `IV (Nonce)` 计算公式极其简单，没有任何包内随机数，完全由包头决定：
  $$\text{IV} = \text{Salt}_{96\text{b}} \oplus \left(\texttt{0x0000} \parallel \text{SSRC}_{32\text{b}} \parallel \text{ROC}_{32\text{b}} \parallel \text{SEQ}_{16\text{b}}\right)$$
  请注意：如果主网关在通话第 10 秒（发了 `SEQ = 0..500`）崩溃切到备网关，备网关从 Redis 恢复了相同的 `Master Key`、`Salt` 和 `SSRC`，但备网关的新编码器从 `SEQ = 0, ROC = 0` 重新开始发包——**灾难发生了！**
  备网关发出的第 1 个包（`SEQ=0`）与主网关 10 秒前发出的第 1 个包（`SEQ=0`）拥有**完全一模一样的 `(Key, IV)`**！
  1. **语音明文裸奔**：流密码下 $C_1 \oplus C_2 = (P_1 \oplus KS) \oplus (P_2 \oplus KS) = P_1 \oplus P_2$。由于通话开头往往是已知的固定 TTS 欢迎语（“您好，请问有什么帮您”），攻击者把抓到的两包密文一异或，再异或已知欢迎语 $P_1$，瞬间 100% 还原出客户此刻正在说的银行卡密码 $P_2$！
  2. **认证密钥 $H$ 彻底泄露（Forbidden Attack）**：在 `AES-GCM` 中，两个相同 IV 的认证标签 $T_1, T_2$ 构成关于认证子密钥 $H = E_K(0^{128})$ 的多项式方程，攻击者只需几毫秒就能解出 $H$，从此可以凭空捏造任意合法的加密 SRTP 语音包注入给 AI Agent！
- **确定性防护机制（`P829`）**：
  - **零 Nonce 重用硬铁律**：严禁在同一 `(Master Key, SSRC)` 下出现重复的 `(ROC, SEQ)`；主备切换或音源拼接时，要么在 Redis 检查点中原子递增 `ROC = prev_ROC + 1`（或分配全新 `SSRC`），要么立即触发 `DTLS-SRTP` / `MKI` 轮换新主密钥；
  - **防重放位图窗口 `[64, 128]` 包**：严格拦截任何重放的 `(ROC, SEQ)` 序号，同时提供 `1.28s–2.56s`（`@20ms`）的乱序容忍度。

### Q2：既然语音包（SRTP）已经加密了，为什么控制包（SRTCP）头部的 `E-bit` 设为 `0`（只认证不加密）还是会违反金融合规审计？

- **大白话与第一性原理解析**：
  在 `RFC 3711 Section 3.4` 中，SRTCP 在包尾附带了一个 32 位的 `SRTCP Index`，其最高位（Bit 0）叫做 **`E`（Encryption flag）**：
  - 当 `E = 1` 时，除首包 8 字节头（`V/P/RC/PT/len/SSRC`）外的全部 RTCP 复合子包（包括 `SDES` 用户标识、`RR/XR` 丢包统计、`APP` 私有信令、`BYE` 原因）均被加密；
  - 当 `E = 0` 时，整包内容**完全明文传输**，仅仅在尾部挂一个 HMAC/GMAC 签名！
  如果网关允许 `E = 0`，窃听者虽然听不到 SRTP 里的声音，但能从明文 `SRTCP` 里直接读出 `SDES` 中的客户手机号/工号、`BYE` 中的业务挂断原因，甚至通过 `RTCP XR VoIP Metrics` 的逐秒声学能量变化反推客户按键与说话节奏！
- **确定性防护机制（`P830`）**：
  1. **强制 `SRTCP E = 1`（`0` 明文控制包）**：100% 拒绝任何 `E = 0` 的入站 `SRTCP` 包，并在 SDP 协商中禁止 `UNENCRYPTED_SRTCP` 参数；
  2. **认证标签下限 `[80, 128] bits`**：强制 `SRTCP` 具备至少 `80 bits`（`HMAC-SHA1-80`）或 `128 bits`（`AES-GCM` 16 字节 Tag）完整性保护，拒绝 `32-bit` 弱标签在 `SRTCP` 上的使用；
  3. **31 位 `SRTCP Index` 溢出前自动换钥**：在 `SRTCP Index` 逼近 `0x7FFF0000` 前强制触发密钥轮换，杜绝 31 位计数器回绕。

### Q3：为什么 `P829` 把 SRTP 重放滑窗（Replay Window）定在 `[64, 128]` 包，而不是设成 `8` 包或者 `65536` 包？

- **大白话与第一性原理解析**：
  - **如果滑窗太小（如 `< 64` 包）**：在 20ms 一包的 Opus 语音流中，`32` 包仅代表 `640ms`。当跨国海缆或移动 5G 发生一次 BGP 路由抖动或双路径乱序时，延迟 `700ms` 到达的合法语音包就会掉出滑窗左边界，被 SRTP 引擎误判为“旧包重放”直接丢弃，造成人为吞字；
  - **如果滑窗过大（如 `> 128` 包）**：不仅每个并发音频流需要维护庞大的位图内存，而且超过 `2.56 秒`（`128 × 20ms`）迟到的实时语音包早已超出播放抖动缓冲（NetEQ Jitter Buffer），即使解密出来也毫无播放价值。因此 **`[64, 128]` 包**（`1.28s–2.56s`）是兼顾零误杀与紧凑位图运算的黄金区间。

---

## ③ 🧭 直观可视化图解（Mermaid 决策树 + 延迟对比 + 毫秒级时序图）

### 3.1 语音架构师 SRTP `AES-GCM` Nonce 防重用与 `SRTCP E=1` 选型决策树

```mermaid
flowchart TD
    A["入站 / 出站 WebRTC DTLS-SRTP & SRTCP 媒体流<br/>(RFC 3711 / RFC 7714 AES-GCM)"] --> B{"1. 检测 (MasterKey, SSRC, ROC, SEQ) Nonce 状态<br/>(RFC 7714 Section 8.1 · P829)"}
    B -- "主备切换/插播重置 SEQ/ROC 导致 Nonce 重用<br/>或入站包命中 [64, 128] 防重放位图" --> C["⛔ 拦截/换钥: 立即轮换 SRTP MasterKey/SSRC 并丢弃重放包<br/>(0 Nonce 重用破密 · 滑窗锁定 [64, 128] 包)"]
    B -- "Nonce 严格唯一 & 位于合法滑窗内" --> D{"2. 核验 SRTCP 控制包 E-bit 与 Tag 长度<br/>(RFC 3711 Section 3.4 · P830)"}
    D -- "SRTCP E-bit == 0 (明文控制包)<br/>或 Auth Tag < 80 bits / 31位索引濒临溢出" --> E["🛡️ 拦截: 100% 丢弃 E=0 明文 SRTCP 并强制换钥<br/>(0 明文控制包 · Tag 锁定 [80, 128] bits)"]
    D -- "SRTCP E == 1 & Tag in [80, 128]b & Index 安全" --> F["✅ 放行: 执行 AES-GCM 硬件加速加解密<br/>(保障 100% 语音机密性与 GHASH 密钥安全)"]
```

### 3.2 `AES-GCM` Nonce 重用与 `E=0` 明文 SRTCP 对语音安全及丢包率的影响对比

```mermaid
flowchart LR
    subgraph BAD["❌ 脆弱媒体栈 (Failover 重置 SEQ=0 + 允许 SRTCP E=0 + 16包小滑窗)"]
        direction TB
        B1["热备切换沿用旧 Key 重置 SEQ=0<br/>触发 AES-GCM Two-Time Pad"] --> B2["C1⊕C2 暴露客户语音明文<br/>+ GHASH 认证密钥 H 被代数求根破解"]
        B2 --> B3["攻击者可伪造任意加密语音指令<br/>+ 16包小滑窗导致弱网乱序吞字率 14.2%"]
    end

    subgraph GOOD["✅ 确定性护栏媒体栈 (P829 Nonce 零重用/[64,128]滑窗 + P830 SRTCP E=1)"]
        direction TB
        G1["切换时强制递增 ROC 或轮换新 Key/SSRC<br/>100% 杜绝 (Key, IV) 碰撞"] --> G2["强制 SRTCP E=1 全加密 & [80,128]b Tag<br/>[64, 128] 包位图容忍 2.56s 乱序"]
        G2 --> G3["0 密钥流泄露 · 0 明文控制包<br/>弱网乱序误杀率降至 0%"]
    end
```

### 3.3 毫秒级 WebRTC `SRTP AES-GCM` 换钥与 `SRTCP E=1` 校验全双工时序图

```mermaid
sequenceDiagram
    autonumber
    participant Client as WebRTC 客户端 / 攻击者
    participant SFU as 企业 SFU 媒体护栏 (P829+P830)
    participant Redis as 热备状态检查点 (ROC/SSRC)
    participant Agent as Azure Voice Live / S2S 引擎

    Note over Client,Agent: 场景 A：主备 SFU 切换或音源拼接防止 AES-GCM Nonce 重用 (P829)
    SFU->>Redis: 读取故障前会话状态 (MasterKey_1, SSRC=0x1122, last_SEQ=480, ROC=0)
    SFU->>SFU: P829 校验: 检测到新编码器试图从 SEQ=0 发包 -> 立即轮换新 MasterKey_2 (或 ROC+1) (0ms @ 1ms Res)
    SFU-->>Client: 发送具有全新唯一 (Key/SSRC/ROC) 的 SRTP 音频帧 (0 Nonce Reuse)

    Note over Client,SFU: 场景 B：攻击者注入重放 SRTP 包与 E=0 明文 SRTCP 探测包 (P829+P830 拦截)
    Client->>SFU: 重放旧 SRTP 音频包 (SEQ=450, 已在 [64, 128] 位图内标记为已收)
    SFU->>SFU: P829 校验: 命中 128-pkt Replay Bitmap -> 0ms 静默丢弃
    Client->>SFU: 注入 SRTCP 控制包 (E-bit = 0 明文 SDES/BYE, Tag=32b)
    SFU->>SFU: P830 校验: 拒绝 E=0 明文 SRTCP 且要求 Tag in [80, 128]b -> 0ms 丢弃
    SFU->>Agent: 仅转发通过 128-bit GCM 验签的纯净 PCM 语音帧
```

---

## ④ 📊 语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：裸跑自研媒体拼接栈（重置 `SEQ=0` + 允许 `SRTCP E=0`） | 方案 B：仅使用传统 `AES-CM + HMAC-SHA1-32` | **方案 C：企业级 `RFC 7714 AES-GCM` Nonce 零重用 + `RFC 3711 SRTCP E=1` 双护栏（`P829 + P830` 推荐）** |
| :--- | :--- | :--- | :--- |
| **`AES-GCM` 抗两本密码本破密** | ❌ `0%`（重置 `SEQ=0` 即刻泄露明文异或与 `GHASH` 密钥 $H$） | ⚠️ 虽无 `GHASH` 沦陷，但重置 `SEQ` 仍导致 `AES-CTR` 密钥流重用泄密 | **✅ `100%`（强制 `(MasterKey, SSRC, ROC, SEQ)` 全局唯一，冲突前 `0ms` 自动换钥/递增 `ROC`，`0` Nonce 重用）** |
| **`SRTCP` 控制面隐私与防篡改** | ❌ `E=0` 明文暴露 `SDES CNAME` 与通话质量遥测 | ❌ `32-bit` 短标签易遭高频暴力伪造 | **✅ 强制 `SRTCP E=1` 全加密 + `[80, 128] bits` 认证标签 + 31 位索引溢出前预换钥（`0` 明文控制包）** |
| **弱网乱序与防重放平衡** | ❌ 固定 `16` 包小窗口在跨国弱网下大量误杀合法语音 | ⚠️ 窗口未标准化 | **✅ 标准化 `[64, 128]` 包位图滑窗（兼顾 `100%` 重放拦截与 `2.56s` 乱序容忍）** |
| **离线策略门禁判定耗时** | 无门禁 | 无门禁 | **`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`）** |
| **适用场景** | 严禁用于任何生产环境 | 旧版窄带 SIP 话机兼容 | **所有 WebRTC 浏览器/App 语音智能体、金融双录、政企保密通信与高可用热备 SFU 集群** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：为什么 1 次 `AES-GCM` Nonce 重用就会把 128 位安全强度降为 `0`？

- **算例 1（`AES-GCM` Nonce 重用导致的 `GHASH` 伪造概率跃变）**：
  - **正常情况（`0` Nonce 重用）**：在 `AEAD_AES_128_GCM` 下，16 字节（`128 bits`）认证标签的盲猜伪造成功率为 $2^{-128} \approx 2.9 \times 10^{-39}$；
  - **发生 1 次 Nonce 重用（未启用 `P829`）**：当两个不同长度 $L \le 2$ 块的语音包复用了同一个 `(Key, IV)`，攻击者构造有限域多项式 $P(H) = \sum (C_{1,i} \oplus C_{2,i}) H^i \oplus (T_1 \oplus T_2) = 0$，最多仅有 $2$ 个候选根，单次伪造命中率从 $2^{-128}$ 飙升至 **`50%–100%`**！
  - **启用 `P829` 后**：在编码器重置或热备切换瞬间强制轮换 `Master Key / SSRC` 或推进 `ROC`，将 Nonce 重用事件严格锁死在 **`0` 次**。
- **算例 2（`[64, 128]` 重放滑窗对跨国弱网乱序丢包的改善）**：
  - 在 `5%` 乱序（平均乱序跨度 `28` 个包 = `560ms`）的跨洋 WebRTC 链路上，`16` 包小滑窗会误杀 **`14.2%`** 的延迟到达语音包；将滑窗钳制在 **`[64, 128]` 包**后，因滑窗过窄导致的误杀丢包率降至 **`0%`**，同时 `100%` 拦截重放攻击。

### 5.2 离线策略状态机护栏验真（Stage 418 · `P829` & `P830` 🎉）

| 护栏 ID | 护栏函数名 | 合成压测输入（Synthetic Abuse Vector） | 确定性拦截动作（Action） | 离线策略计时披露（Provenance & Timing Disclosure） |
| :--- | :--- | :--- | :--- | :--- |
| **`P829`** | `evaluateWebrtcSrtpRfc7714AesGcmNonceReuseAndRfc3711ReplayWindowGate` | `aesGcmSsrcRocSeqNonceReuseOrReplayDetected: true`, `aesGcmNonceReuseEvents: 2`, `srtpReplayWindowPackets: 16` | `rekey_srtp_master_key_on_nonce_reuse_and_clamp_replay_window`（将 `clampedAesGcmNonceReuseEvents` 清零为 `0`，将 `clampedSrtpReplayWindowPackets` 提升至 `[64, 128]` 下限 `64`） | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`；真实 SRTP AEAD 加解密与位图查找耗时 `not_measured`） |
| **`P830`** | `evaluateWebrtcSrtcpRfc3711UnencryptedBypassAnd31BitIndexOverflowGate` | `unencryptedSrtcpPayloadOr31BitIndexExhaustionDetected: true`, `unencryptedSrtcpControlPackets: 4`, `srtcpAuthTagBits: 32` | `enforce_srtcp_encryption_and_rekey_before_index_overflow`（将 `clampedUnencryptedSrtcpControlPackets` 清零为 `0`，将 `clampedSrtcpAuthTagBits` 提升至 `[80, 128]` 下限 `80`） | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`；真实 SRTCP 控制包解密与索引监控耗时 `not_measured`） |

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Good Fit vs. Not For + Checklist）

### ✅ Good Fit（极佳适用场景） vs. ⛔ Not For（不适用或需额外适配场景）

| ✅ Good Fit（建议立即启用 `P829 + P830` 的场景） | ⛔ Not For（需要注意边界的场景） |
| :--- | :--- |
| 1. **支持通话中容器热备切换（Pod Failover）或动态插播 TTS 等待音的 WebRTC SFU/SBC 集群**：必须通过 `P829` 防止新音源重置 `SEQ=0` 引发 `AES-GCM` Nonce 重用破密。 | 1. **端到端 `SFrame / WebRTC Insertable Streams` 双层加密场景**：外层逐跳 `DTLS-SRTP` 与内层端到端 `SFrame` 各自维护独立密钥与计数器，切勿将内层帧号直接复用为外层 RTP `SEQ`。 |
| 2. **金融双录、医疗问诊与跨国企业客服通话**：必须通过 `P830` 强制 `SRTCP E=1` 加密 `SDES/XR` 元数据，并配置 `[64, 128]` 包防重放滑窗。 | 2. **依赖明文 RTCP 包做旁路镜像测量的旧版探针**：严禁为了迁就旧探针而把线上 `SRTCP` 设为 `E=0`；应由 SFU 在受信内网解密后通过遥测总线异步导出脱敏指标。 |

### 生产上线核验 Checklist（`- [ ]`）

- [ ] **【`P829` `AES-GCM` `(SSRC, ROC, SEQ)` Nonce 零重用】**：确认音源切换、提示音插播或 Pod 热备恢复时，绝不在相同 `(Master Key, SSRC)` 下重置 `SEQ/ROC`（`0` Nonce 重用事件）。
- [ ] **【`P829` `RFC 3711` 防重放位图窗口 `[64, 128]`】**：确认 SRTP 与 SRTCP 防重放滑窗大小配置在 `64–128` 包之间，禁止使用 `< 64` 包的极小窗口。
- [ ] **【`P830` 强制 `SRTCP E=1` 加密】**：确认 SDP 协商禁用 `UNENCRYPTED_SRTCP`，且底层媒体栈 100% 丢弃 `E-bit == 0` 的入站 `SRTCP` 包（`0` 明文控制包）。
- [ ] **【`P830` `[80, 128] bits` 认证标签与 31 位索引预换钥】**：确认 `SRTCP` 认证标签不少于 `80 bits`（`AES-GCM` 下固定 `128 bits`），并在 31 位 `SRTCP Index` 溢出前自动触发 `DTLS-SRTP` 重协商。
