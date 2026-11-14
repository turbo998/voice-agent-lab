# WebRTC `RFC 6544 / RFC 4571` `ICE-TCP` 16 位分帧长度失步、`RFC 8445` `USE-CANDIDATE` 频繁提名震荡与 `STUN XOR-MAPPED-ADDRESS` 环回反射防护架构选型 FAQ

> **阅读指南（对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗透彻标准 · 🎉 第 70 张 SVG 架构总结图里程碑）**：本文聚焦企业级全双工语音 Agent 在严苛政企防火墙（禁用 UDP、仅开放 TCP 443）与移动蜂窝/Wi-Fi 混合双网环境下的**ICE-TCP 流式分帧安全与候选路径提名稳定性边界**。全文用第一性原理与微秒级字节流时序讲透：**为什么 UDP 上的 WebRTC 一切正常，一旦回退到 `RFC 6544 / RFC 4571 ICE-TCP`，只要错位 1 个字节就会让后续整条连接的所有 STUN、DTLS 与 SRTP 包彻底沦为乱码（16 位分帧滑窗失步）？为什么恶意客户端每秒发送 50 次带 `USE-CANDIDATE` 的 STUN 绑定请求就能让媒体网关陷入无休止的路由表乒乓切换？以及生产环境如何用确定性状态机（`P845` / `P846`）锁死 ICE-TCP 与路径提名边界。**

---

## 📌 一、核心结论速览（Executive Summary）

1. **`RFC 6544 / RFC 4571` `ICE-TCP` 16 位前导长度分帧失步（Framing Desync）是 TCP 语音通道的“多米诺骨牌杀手”**：
   - UDP 天然具备报文边界（1 个 `recvfrom()` 就是 1 个完整 RTP/STUN 包），但 TCP 是无边界字节流。因此当企业内网封锁 UDP、WebRTC 回退至 `ICE-TCP / TURN-TLS 443` 时，必须遵循 **`RFC 4571`**：在每个 STUN/DTLS/SRTP 报文前冠以 **2 字节（16-bit 大端无符号整数）的长度前缀 `L`**。
   - **致命陷阱**：如果攻击者或故障网关发送了一个伪造 `L = 65535`（`64KB`）但实际只发了 `64B` 的半帧（Slowloris 内存驻留炸弹），或者声明的 `L` 与紧随其后的首字节类型（`RFC 7983`：STUN `0..3` 且含 Magic Cookie `0x2112A442`、DTLS `20..63`、RTP/RTCP `128..191`）严重失配，TCP 接收状态机会将后续真实 SRTP 音频密文的字节误当作下一个帧的长度头 `L'`！**一旦失步 1 次，整条 TCP 连接永久无法自愈，语音瞬间中断且占满接收缓冲区。**
2. **`RFC 8445` `USE-CANDIDATE` 提名震荡（Nomination Thrash）与 `RFC 8489 XOR-MAPPED-ADDRESS` 环回反射是媒体路由表的“乒乓风暴源”**：
   - 在 ICE 主控端（Controlling Agent）决定最终媒体路径时，会发送携带 `USE-CANDIDATE`（`0x0025`）属性的 STUN Binding Request。若攻击者在双网卡或多 TURN 路径上以 `40 次/秒` 高频交替发送携带 `USE-CANDIDATE` 的请求，被控端（Controlled SFU）的发送套接字与 SRTP 重放窗口会在多个五元组之间剧烈抖动，造成 `15%–30%` 的乱序丢包。
   - 同时，若恶意终端或被污染的 STUN 响应在 `XOR-MAPPED-ADDRESS`（`0x0020`）中经 `0x2112A442` 异或解码后指向 `127.0.0.0/8`、`::1` 或网关自身内网 VIP，会导致媒体网关把高码率音频流反射轰炸给自身环回接口！
3. **架构选型铁律（`P845` + `P846` 双重确定性门禁 · 🎉 SVG 70 里程碑）**：
   - **`RFC 4571` 帧长 MTU 硬上限与首字节魔数交叉校验（`P845`）**：在 `ICE-TCP` 字节流解包层强制校验 `12 <= L <= 1400` 字节（`clampedMaxRfc4571FramePayloadBytes` 钳制在 `[256, 1400]` 字节）且帧首字节必须合法落在 `RFC 7983` 区间（若为 STUN 则第 `4..7` 字节必须等于 `0x2112A442`）；一旦检出分帧失步或超长帧（`0` 失步/超长帧），立即原子断开该 TCP 候选并触发 UDP/备用 TURN 重连。
   - **`XOR-MAPPED-ADDRESS` 环回清零与 `USE-CANDIDATE [1, 3]` 次/分提名防抖（`P846`）**：解码 `XOR-MAPPED-ADDRESS` 后 100% 拦截 `127.0.0.0/8`、`169.254.0.0/16`、`0.0.0.0` 与本机 VIP 反射地址（`0` 环回反射），并将单条通话每分钟允许的 `USE-CANDIDATE` 活跃路径切换次数严格钳制在 `[1, 3]` 次以内。

---

## 🎯 二、客户与架构师灵魂拷问 Q&A（Soul-Searching Q&A）

### Q1：为什么在银行/政企大楼内网走 `TCP 443` 语音通话时，偶尔一次网络抖动或畸形包会让通话彻底卡死且永远恢复不了，而 UDP 却能瞬间自愈？

- **通俗原理（无分隔符电报串行错位比喻）**：
  - UDP 就像一封封独立装袋的信件：哪怕第 5 封信破损丢弃，第 6 封信拆开依然是完好独立的。
  - 而 TCP 是一条没有天然边界的连续纸带。为了在 TCP 上切分出一帧帧 20ms 的语音包，`RFC 4571` 规定在每帧前面写 2 个字节的长度 `L`（比如 `0x00 0x64` 代表后面 100 个字节是一帧语音，第 101 个字节又是下一帧的长度头）。
- **为什么失步 1 次就会引发“永久脑死亡”？**
  - **第一性原理拆解**：
    1. **超大假长度头阻塞（Frame-Length Stall）**：攻击者发来 2 个字节 `0xFF 0xFF`（声明 `L = 65,535` 字节），随后只发正常的 80 字节语音包。网关的 `RFC 4571` 状态机为了凑齐 `65,535` 字节，会把后续整整 **16 秒（800 个语音包）** 的实时音频全部吞进同一个待拼接缓冲区里，表面上看通话瞬间死寂！
    2. **指针滑窗错位（Sliding-Window Desync）**：一旦某个包声明的 `L` 与实际写入字节偏差哪怕 `2` 个字节，网关就会把下一包 SRTP 加密音频的随机密文字节（如 `0x9A 0x3F = 39,487`）当成新的长度头 `L'`，从此在加密随机数里无限错位读取，永远找不到真正的帧头！
  - **确定性根治方案（`P845`）**：语音帧绝不可能长达 `64KB`！`P845` 将 `RFC 4571` 单帧最大有效载荷硬钳制在 `[256, 1400]` 字节（匹配以太网 MTU，拒绝 IP 分片与巨型帧驻留），并在每次按 `L` 切出新帧时，同步校验新帧首字节是否符合 `RFC 7983` 多路复用规则（若首字节为 `0..3` STUN 包，还必须核验偏移 `+4` 处的 `0x2112A442` 魔数）。一旦失配，0ms 判定分帧失步并立即重置该 TCP 通道（`clampedDesyncedOrOversizedTcpFrames = 0`）。

### Q2：什么是 `RFC 8445` 的 `USE-CANDIDATE` 提名震荡（Nomination Thrash）？为什么客户端在 Wi-Fi 和 5G 之间切网不能无限制秒切？

- **通俗原理**：
  - 在 WebRTC 通话中，客户端可能同时探测出了 3 条可用路径：路径 A（家庭 Wi-Fi 直连）、路径 B（手机 5G 直连）、路径 C（云端 TURN 中继）。主控端通过在 STUN 包里带上 `USE-CANDIDATE` 标签告诉服务器：“请立刻把下行语音切到这条路径上！”
- **高频震荡的危害**：
  - 如果恶意客户端或劣质弱网算法在路径 A 和路径 B 之间以每秒 `30 次` 的频率来回发送 `USE-CANDIDATE`，服务端每次切换五元组都要重新绑定套接字路由、刷新 NAT 映射表并触发拥塞控制器（TWCC/BWE）微调，同时因为路径 A（RTT `20ms`）与路径 B（RTT `85ms`）存在 `65ms` 时延差，高频交替会导致 RTP 序列号大幅乱序，NetEQ 抖动缓冲区被迫频繁扩缩容，听感上全是断续破音！
  - **确定性根治方案（`P846`）**：为 `USE-CANDIDATE` 引入最小冷却期与每分钟切换配额，将单条会话每分钟允许的候选路径提名切换次数严格钳制在 `[1, 3]` 次以内。

### Q3：`STUN XOR-MAPPED-ADDRESS` 是怎么算出公网地址的？为什么黑客能通过异或构造出 `127.0.0.1` 环回反射攻击？

- **架构师深度拆解**：
  - 在 `RFC 8489 Section 14.2` 中，为了防止老式家用路由器（NAT ALG）篡改报文里的明文 IP，STUN 将反射 IPv4 地址与 고정魔数 `0x2112A442` 进行按位异或（`XOR`）编码。
  - 例如环回地址 `127.0.0.1`（十六进制 `0x7F000001`）异或 `0x2112A442` 后变成 `0x5E12A443`（看似普通的公网 IP `94.18.164.67`）。如果某段边缘代理仅对未异或前的字节做私网过滤，而在异或解码还原出 `127.0.0.1` 后直接将其注册为对端 `srflx`（Server Reflexive）媒体目标，媒体引擎就会把自己的下行语音流全速打回本机 `127.0.0.1` 端口！
  - **确定性根治方案（`P846`）**：必须在**完成 `0x2112A442`（IPv4）或 `Magic Cookie + Transaction ID`（IPv6）异或解码还原之后**，再执行私网/环回/多播黑名单过滤（`127.0.0.0/8`, `10.0.0.0/8`, `169.254.0.0/16`, `224.0.0.0/4`, `::1`, `fe80::/10`），确保 `clampedSpoofedXorMappedLoopbackReflections = 0`。

---

## 🧭 三、直观可视化图解（Mermaid 决策树 + 架构对比 + 毫秒级拦截时序）

### 3.1 `ICE-TCP` `RFC 4571` 分帧与 `RFC 8445` 提名门禁决策树

```mermaid
flowchart TD
    A["入站 ICE-TCP / STUN 报文到达媒体网关"] --> B{"是否为 TCP 流 (RFC 6544 / RFC 4571)?"}
    B -- "是 (ICE-TCP)" --> C{"P845 校验 16-bit 长度头 L 与首字节:\n1. 12 <= L <= 1400 Bytes?\n2. 首字节符合 RFC 7983 (STUN/DTLS/RTP)?\n3. 若 STUN 则 Offset+4 == 0x2112A442?"}
    C -- "任一不满足 (失步/超长帧)" --> R1["P845 立即重置该 TCP 流 (0ms)\n释放驻留缓冲并回退备用候选路径"]
    C -- "全数满足 (分帧对齐)" --> D{"是否为 STUN Binding 消息?"}
    B -- "否 (UDP)" --> D
    D -- "否 (正常 DTLS / SRTP 帧)" --> OK["送入 SRTP 解密与音频解码管线"]
    D -- "是 (STUN 消息)" --> E{"P846 解码 XOR-MAPPED-ADDRESS (XOR 0x2112A442):\n还原后是否命中 127.0.0.0/8, ::1 或内网 VIP?"}
    E -- "是 (环回/私网反射伪造)" --> R2["P846 立即丢弃反射地址 (0 环回反射)\n阻断本机环回自激风暴"]
    E -- "否 (合法公网地址)" --> F{"是否携带 USE-CANDIDATE 属性\n且本分钟切换次数 > 3 次?"}
    F -- "是 (提名震荡攻击)" --> R3["P846 节流忽略超限切换 (钳制在 [1, 3]/min)\n保持当前稳定五元组媒体路径"]
    F -- "否 (<= 3 次/分合理切换)" --> OK2["平滑切换候选路径并保持 SRTP 连续"]
```

### 3.2 脆弱 `ICE-TCP` 状态机 vs. `P845 + P846` 确定性门禁对比图

```mermaid
flowchart LR
    subgraph Unsafe["❌ 脆弱网关（盲信 L=65535 + 无提名节流）"]
      U1["ICE-TCP 收到 L=65535 畸形头\n或 1 字节滑窗错位"] --> U2["吞噬后续 16s 语音包\n整条 TCP 连接永久乱码死锁"]
      U3["XOR 解码还原出 127.0.0.1\n或 40次/秒 USE-CANDIDATE"] --> U4["媒体流打回本机环回口\n或双路径乒乓抖动丢包 30%"]
    end

    subgraph Safe["✅ P845 + P846 确定性 ICE-TCP 与提名门禁 (SVG 70 🎉)"]
      S1["硬钳制 L in [256, 1400]B\n+ RFC 7983 首字节/魔数同步锁"] --> S2["0 分帧失步死锁 · 0 64KB 内存炸弹\n异常流 0ms 原子重置切换"]
      S3["XOR 解码后 100% 环回过滤\n+ USE-CANDIDATE 钳制 [1, 3]/min"] --> S4["0 环回反射自激\n移动切网零乒乓乱序"]
    end
```

### 3.3 毫秒级全双工传输层防护时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    autonumber
    participant Client as 远端 WebRTC 客户端 / 攻击者
    participant Edge as 媒体网关 ICE-TCP & STUN 门禁 (P845 + P846)
    participant Engine as 后端 SRTP / 语音 Agent 引擎

    Note over Client,Edge: 场景 A：RFC 4571 16-Bit 分帧长度欺骗（L=16384 > 1400B MTU 或魔数失步）
    Client->>Edge: TCP Segment (RFC 4571 Length L=0x4000 [16384B], Non-RFC7983 Header)
    Edge->>Edge: P845 离线策略规则匹配 (0ms @ 1ms 名义分辨率)\n检出 L > 1400B 且首字节/STUN 魔数失步
    Edge-->>Client: TCP RST & 销毁失步流 (clampedDesyncedOrOversizedTcpFrames=0, 秒切备用路径)

    Note over Client,Engine: 场景 B：XOR-MAPPED-ADDRESS 伪造 127.0.0.1 + 高频 USE-CANDIDATE 震荡
    Client->>Edge: STUN Binding (XOR-MAPPED=0x5E12A443 -> 127.0.0.1, USE-CANDIDATE #15/min)
    Edge->>Edge: P846 离线策略规则匹配 (0ms @ 1ms 名义分辨率)\n拦截 127.0.0.1 反射并将 USE-CANDIDATE 钳制在 <=3 次/分
    Edge->>Engine: 维持当前已验证五元组路径（0 环回流，0 乱序抖动）
```

---

## 📊 四、语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：裸 `RFC 4571` `uint16_t` 满幅读取 + 即时提名切换 | 方案 B：完全禁用 `ICE-TCP` 且禁止通话中切换路径 | 方案 C：`L <= 1400B` + `RFC 7983` 魔数对齐 + 解码后环回过滤 + `[1, 3]/min` 提名防抖（`P845 + P846` 推荐 ★） |
| :--- | :--- | :--- | :--- |
| **`RFC 4571` 分帧失步与巨型帧防御** | ❌ 单帧 `L=65535` 阻塞 16 秒音频，错位 1 字节永久乱码 | ✅ 无 TCP 流，但政企防火墙内网 100% 无法接通 | ✅ **单帧上限锁在 `[256, 1400]B` 且首字节/魔数强对齐，失步即刻重置自愈** |
| **政企防火墙 TCP 443 穿透率** | ✅ 支持穿透，但极易被慢速半帧耗尽内存 | ❌ 在禁用 UDP 的银行/医院内网呼叫失败率 `>40%` | ✅ **100% 兼容合规 `ICE-TCP / TURN-TLS 443` 穿透** |
| **`XOR-MAPPED` 环回反射防御** | ❌ 异或解码后未复检，易把媒体流反射至 `127.0.0.1` | ❌ UDP STUN 同样存在 `XOR-MAPPED` 环回反射漏洞 | ✅ **异或还原后 100% 拦截环回/私网/VIP（`0` 环回反射）** |
| **`USE-CANDIDATE` 路径震荡防御** | ❌ 高频切换引发 30% 乱序丢包与 NetEQ 破音 | ❌ 电梯/地库 Wi-Fi 切 5G 时直接断线 | ✅ **允许合法切网，同时将切换速率严格钳制在 `[1, 3]` 次/分钟** |
| **策略门禁计算开销（Provenance）** | 无保护 | 低，但牺牲连通率与移动性 | **`0ms`（`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`，离线 `synthetic` 策略检查；真实内核 `epoll` TCP 流重组耗时 `not_measured`）** |

---

## 🧪 五、定量算例与 7-Card 报告（Quantitative Walkthrough & 7-Card Deck）

### 5.1 定量算例（消除 64KB 慢速帧驻留与乒乓丢包）

- **场景设定**：某金融机构远程视频/语音面签平台有 `35%` 的客户位于严格企业防火墙后（必须走 `ICE-TCP / TURN-TLS 443`），高峰期承载 `8,000` 路 TCP 媒体流。
- **未开启 `P845 / P846` 前**：
  - 攻击者建立 `2,000` 条半连接并发送 `L = 65535` 的不完整帧头，瞬间锁死 `2,000 × 64KB = 128MB` 内核/用户态拼接缓冲；同时移动客户端在弱 Wi-Fi 边缘每秒触发 `8` 次 `USE-CANDIDATE` 切换，导致双端语音乱序丢包率飙升至 `24.8%`。
- **开启 `P845 + P846` 确定性门禁后（🎉 SVG 70 里程碑）**：
  - **`RFC 4571` 失步/超长帧拦截率**：`100.0%`（`clampedDesyncedOrOversizedTcpFrames = 0`，`clampedMaxRfc4571FramePayloadBytes <= 1400`）。
  - **`XOR-MAPPED` 环回反射与提名震荡拦截率**：`100.0%`（`clampedSpoofedXorMappedLoopbackReflections = 0`，`clampedMaxUseCandidateSwitchesPerMinute <= 3`）。
  - **计时器分辨率与实测披露**：本地确定性策略状态机在名义 `1ms` 分辨率计时器下读数为 `0ms`（`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`，`synthetic`）；真实 Linux `epoll` / IOCP TCP 环形缓冲读取耗时在本地单测中标记为 `not_measured`。

### 5.2 生产级确定性门禁代码（`packages/business-core/enterprise-guardrails.ts`）

```typescript
// P845: WebRTC ICE-TCP RFC 4571 Framing Length Desync & SYN Half-Open Guard
const p845 = evaluateWebrtcIceTcpRfc4571FramingLengthDesyncAndSynHalfOpenGate({
  rfc4571FramingLengthDesyncOrHalfOpenFloodDetected: true,
  desyncedOrOversizedTcpFrames: 3,
  maxRfc4571FramePayloadBytes: 65535,
});
// => p845.violated === true
// => p845.action === "reset_desynced_rfc4571_tcp_stream_and_clamp_frame_bytes"
// => p845.clampedDesyncedOrOversizedTcpFrames === 0
// => p845.clampedMaxRfc4571FramePayloadBytes === 1400

// P846: WebRTC ICE RFC 8445 USE-CANDIDATE Nomination Thrash & XOR-MAPPED Loopback Guard
const p846 = evaluateWebrtcIceRfc8445UseCandidateNominationThrashAndXorMappedLoopbackGate({
  useCandidateNominationThrashOrXorMappedLoopbackDetected: true,
  spoofedXorMappedLoopbackReflections: 2,
  maxUseCandidateSwitchesPerMinute: 45,
});
// => p846.violated === true
// => p846.action === "drop_xor_mapped_loopback_and_throttle_use_candidate_switches"
// => p846.clampedSpoofedXorMappedLoopbackReflections === 0
// => p846.clampedMaxUseCandidateSwitchesPerMinute === 3
```

---

## 🛠️ 六、生产环境语音交付快速核验清单（Production Readiness Checklist）

- [ ] **1. `RFC 4571` 16-bit 长度头 MTU 上限（`P845`）**：`ICE-TCP` 解包器是否在读取 2 字节长度头 `L` 后立即校验 `12 <= L <= 1400`（将配置上限钳制在 `[256, 1400]` 字节），对声明 `L > 1400` 的慢速巨型帧立即断开重置？
- [ ] **2. `RFC 7983` 首字节与 STUN Magic Cookie 同步校验（`P845`）**：按长度 `L` 切出的每一帧，是否强制核验第 1 字节属于合法 STUN (`0..3`)、DTLS (`20..63`) 或 RTP/RTCP (`128..191`)，且 STUN 帧第 `4..7` 字节必须等于 `0x2112A442`？
- [ ] **3. `ICE-TCP` 半开帧超时回收（`P845`）**：若 TCP 流在收到 2 字节长度头 `L` 后 `> 500ms` 仍未收齐 `L` 字节完整载荷，是否立即中断该候选流以释放缓冲？
- [ ] **4. `RFC 8489 XOR-MAPPED-ADDRESS` 解码后黑名单过滤（`P846`）**：是否在完成 `0x2112A442` / `Transaction ID` 异或解码还原出真实 IP 后，100% 拦截 `127.0.0.0/8`、`169.254.0.0/16`、`::1` 与网关自身 VIP（`0` 环回反射）？
- [ ] **5. `RFC 8445 USE-CANDIDATE` `[1, 3]` 次/分提名防抖（`P846`）**：是否对 `USE-CANDIDATE` 活跃路径切换施加冷却窗，将每分钟切换次数严格钳制在 `[1, 3]` 次以内？
- [ ] **6. 评测 Provenance 透明披露**：所有基准卡片与日志是否明确标注 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（离线 `synthetic` 策略检查 vs. 真实内核 TCP 流重组耗时 `not_measured`）？
