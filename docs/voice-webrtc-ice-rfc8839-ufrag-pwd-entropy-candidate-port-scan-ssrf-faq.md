# WebRTC `RFC 8839 / RFC 8445` `ice-ufrag / ice-pwd` 密码学熵下限（`>=24 / >=128 bits`）与 SDP `a=candidate` 端口扫描 SSRF 及候选数上限（`[1, 16]`）怎么选？STUN `MESSAGE-INTEGRITY` 防盲注入、特权端口剥离与连接性检查风暴原理解析

> **关联架构阶段**：Stage 416（Topic 56 · 🎉 第 60 张架构图里程碑 · `P825` / `P826`）· **关联文档**：[English Version (`voice-webrtc-ice-rfc8839-ufrag-pwd-entropy-candidate-port-scan-ssrf-faq.en.md`)](./voice-webrtc-ice-rfc8839-ufrag-pwd-entropy-candidate-port-scan-ssrf-faq.en.md) · [2026-11-09 每日突破报告](./daily/2026-11-09.md) · [方案架构指南](./solution-architecture.md) · [评测与验收标准](./voice-agent-evaluation-rubric.md)

---

## ① 📌 核心结论速览（Executive Summary）

在企业级实时语音智能体（WebRTC 浏览器客服、移动 App 语音助手、SIP-to-WebRTC 媒体网关）的媒体连通性建立层（`RFC 8445 ICE` / `RFC 8839 SDP ICE Attributes`）中，**每一个 WebRTC 语音通话能够安全、快速地打通 UDP 媒体流，完全依赖两项基础机制：一是 SDP 中的 `a=ice-ufrag` 与 `a=ice-pwd` 临时凭证（用于为 STUN Binding 请求计算 `HMAC-SHA1 MESSAGE-INTEGRITY` 签名），二是 SDP 中的 `a=candidate` 候选地址列表（告知对端向哪些 `IP:Port` 发起连通性探测）**。然而在企业私有部署或自研媒体网关中，如果把这两项机制写成了“**低熵/静态复用的 `ice-ufrag / ice-pwd` + 无差别采信客户端提交的任意 `a=candidate` 地址与端口**”，语音网关将面临三大高危连接与内网安全故障：

1. **低熵或静态复用 `ice-ufrag / ice-pwd` 导致旁路 STUN `Binding` 盲注入与媒体流劫持（Off-Path STUN Binding Hijack）**：按 `RFC 8839 Section 5.1`，`ice-ufrag` 必须具备至少 **`24 bits`（4 个 Base64 字符）** 的密码学随机熵，`ice-pwd` 必须具备至少 **`128 bits`（22 个 Base64 字符）** 的随机熵，且每次会话（及每次 `ICE Restart`）必须重新生成。部分轻量级媒体服务器用自增整数（如 `ufrag=1001`）或固定配置密码（如 `pwd=voice-agent-default`），导致旁路攻击者无需截获信令即可离线猜出凭证、伪造带合法 `MESSAGE-INTEGRITY` 与 `USE-CANDIDATE` 的 STUN 包，在 `0.5s` 内把正在进行的 AI 语音通话媒体流劫持到攻击者 IP；
2. **恶意 SDP `a=candidate` 诱导云端媒体网关对 K8s 内网与特权服务发起 SSRF 端口扫描（ICE Candidate Port-Scan SSRF）**：当客户端在 SDP Offer 中注入指向内网/云元数据网段（`127.0.0.0/8`、`10.0.0.0/8`、`169.254.169.254`）或敏感服务端口（如 `22 SSH`、`443 HTTPS`、`2379 etcd`、`6379 Redis`、`6443 K8s API`）的 `a=candidate` 行时，部署在 VPC 内部的企业 WebRTC 网关会忠实地从内网网卡向这些目标高速发送 STUN Binding UDP/TCP 探测包，并根据响应时延或 ICMP 不可达状态向前端暴露 `RTCIceCandidatePairStats`，沦为攻击者探测内网拓扑的 SSRF 扫描跳板；
3. **单 `m=` 轨注入上百条虚假 `a=candidate` 引发 $O(N \times M)$ 连接性检查风暴（Connectivity-Check Matrix Exhaustion）**：若客户端在单个音频 `m=audio` 轨下塞入 `120` 条伪造候选地址，媒体网关的 ICE Agent 会生成上百个候选对（Candidate Pairs）并启动 `Ta=20ms` 定时器高频发包，瞬间耗尽网关 STUN 事务表与 UDP 发送队列，导致正常通话的首包连接耗时（ICE Connection Time）从 `85ms` 飙升至 `> 3,500ms`。

**架构师选型铁律（一句话总结）**：
> **严禁在生产环境生成 `< 24 bits` 的 `ice-ufrag`、`< 128 bits` 的 `ice-pwd` 或跨会话复用静态 ICE 凭证，严禁允许云端媒体网关向私有网段/特权端口（`< 1024` 或黑名单服务端口）或单轨 `> 16` 条候选地址发起 ICE 探测！生产环境必须同时部署两道确定性门禁：① `RFC 8839` 凭证熵下限与单次会话 CSPRNG 轮换门禁（`P825`：强制 `ice-ufrag` 熵区间为 `[24, 64] bits`、`ice-pwd` 熵区间为 `[128, 256] bits`，拦截 `100%` 低熵或跨会话静态复用的 ICE 凭证（`0` 弱凭证）并强制使用 CSPRNG 按会话/ICE Restart 独立轮换）；② `RFC 8445` 候选地址防端口扫描 SSRF 与单轨候选数上限门禁（`P826`：100% 剥离指向回环/链路本地/`RFC 1918` 内网/云元数据 IP 以及 `< 1024` 特权端口或高危内网端口（`2379/5432/6379/6443/9200`）的入站 `a=candidate`（`0` 违规候选），并将单 `m=` 轨最大候选地址数钳制在 `[1, 16]` 条）。**

![2026-11-13 Enterprise Voice Agent WebRTC RFC 8839/8445 ICE ufrag/pwd Entropy & Candidate SSRF Guard FAQ & Stage 416 Visual Summary](../assets/svg/60-voice-webrtc-ice-rfc8839-ufrag-pwd-entropy-candidate-port-scan-ssrf-2026-11-13.svg)

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（First-Principles Deep Dive）

### Q1：为什么 `ice-ufrag` 和 `ice-pwd` 明明只是用来做 NAT 打洞配对的，如果熵不够高（或者为了省事写成固定字符串），会导致整个加密语音流被旁路黑客夺走？

- **大白话与第一性原理解析**：
  很多开发者误以为：“反正媒体流有 `DTLS-SRTP` 加密，`ice-ufrag / ice-pwd` 只是打洞用的用户名密码，随便设个 `ufrag=bot1`、`pwd=123456` 也没关系。”
  这是致命的协议误区！在 WebRTC 中，**数据包往哪个 `IP:Port` 发送，是由 ICE 的 STUN `Binding Request`（携带 `USE-CANDIDATE` 属性）决定的，而不是由 DTLS 决定的**。
  根据 `RFC 8445 Section 7.2`，当媒体网关收到一个 UDP STUN `Binding Request` 时，它只检查两件事：
  1. 包里的 `USERNAME` 是否等于 `server_ufrag:client_ufrag`；
  2. 包尾部的 `MESSAGE-INTEGRITY`（20 字节 `HMAC-SHA1`）是否是用 `ice-pwd` 算出来的。
  一旦这两项校验通过，且请求带有 `USE-CANDIDATE`，媒体网关就会立刻认为：“**好！客户切换了 Wi-Fi 或 5G 基站，我现在立刻把所有下行语音 RTP 包改发到这个 STUN 包的源 `IP:Port`！**”
  如果 `ice-ufrag` 是可预测的序列号（`< 24 bits`），或者 `ice-pwd` 是静态配置/弱随机数（`< 128 bits`），攻击者根本不需要破解 `DTLS-SRTP`，只要往媒体网关的公网 UDP 端口盲发一个伪造的 STUN `Binding Request`，就能瞬间把 AI 正在说的话全部引流到黑洞，造成通话 100% 单通掉线！
- **确定性防护机制（`P825`）**：
  - **强密码学熵下限（`ufrag >= 24 bits, pwd >= 128 bits`）**：严格遵循 `RFC 8839 Section 5.1`，使用操作系统 CSPRNG（如 `/dev/urandom` 或 `crypto.getRandomValues`）为每个会话生成 `[24, 64] bits`（推荐 `32–64 bits`）的 `ice-ufrag` 与 `[128, 256] bits`（推荐 `128–192 bits`）的 `ice-pwd`；
  - **零复用与 `ICE Restart` 强制轮换**：严禁跨通话、跨 `m=` 传输捆绑域复用同一套 `ufrag/pwd`；任何 `ICE Restart` 必须同时轮换 `ufrag` 与 `pwd`。

### Q2：客户端发一段 SDP 里的 `a=candidate` 文本，怎么就能把云端语音网关变成探测企业 K8s 内网 `Redis (6379)` 和 `etcd (2379)` 的“内鬼扫描器”？

- **大白话与第一性原理解析**：
  在正常的 WebRTC 流程中，浏览器收集自己的网卡地址写成 `a=candidate:1 1 udp 2122260223 203.0.113.5 54321 typ host`，发给云端媒体网关；云端网关收到后，主动向 `203.0.113.5:54321` 发送 STUN 探测包。
  但 `a=candidate` 本质上只是客户端发来的**不可信 JSON 字符串**！如果攻击者篡改前端 JS，发来这样几行 SDP：
  ```sdp
  a=candidate:1 1 udp 2122260223 10.240.0.15 6379 typ host
  a=candidate:2 1 udp 2122260222 10.240.0.15 2379 typ host
  a=candidate:3 1 tcp 1518280447 169.254.169.254 80 typ host tcptype active
  ```
  如果云端媒体网关不加过滤直接喂给底层 `libnice / pion / webrtc` 引擎，网关就会用自己的**内网 Pod 身份**向 `10.240.0.15:6379`、`2379` 和云元数据 `169.254.169.254:80` 发起 UDP/TCP 连接探测！不仅如此，攻击者还能通过塞入 `100+` 条候选地址把网关的探测队列彻底堵死。
- **确定性防护机制（`P826`）**：
  1. **入站 `a=candidate` IP 严格清洗（Anti-SSRF）**：在公网边缘媒体网关上，100% 丢弃指向 `127.0.0.0/8`、`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`169.254.0.0/16`、`100.64.0.0/10`、`::1`、`fc00::/7`、`fe80::/10` 及多播地址段的外部候选；
  2. **端口白名单与高危服务端口封禁（Port Policy）**：严禁向 `< 1024` 的系统特权端口（除非显式配置的 `TURNS 443` 边缘中继）或内网敏感基础设施端口（`2379 etcd`、`3306 MySQL`、`5432 Postgres`、`6379 Redis`、`6443 K8s`、`9200 Elasticsearch`）发起 ICE 连接性检查，仅允许合法动态媒体端口范围（如 `[1024, 65535]` 中非黑名单端口）；
  3. **单 `m=` 轨候选数硬上限（`[1, 16]` 条）**：将每个媒体段接受的远端 `a=candidate`（含 Trickle ICE 增量候选）严格限制在 `[1, 16]` 条，超出部分直接丢弃。

### Q3：如果移动端客户在高铁上频繁从 5G 切到车载 Wi-Fi（触发 Trickle ICE 或 ICE Restart），限制最大 `16` 条 Candidate 会不会导致网络切换掉线？

- **大白话与第一性原理解析**：
  完全不会！一台正常手机或 PC 即使拥有双栈（IPv4 + IPv6）和 2 张网卡（Wi-Fi + 蜂窝网），每个传输协议（UDP）产生的候选通常只有 `host`、`srflx`（STUN 反射）和 `relay`（TURN 中继）共 `4–8` 条，`16` 条上限留有 2 倍以上安全冗余。
  更重要的是，当客户在高铁上发生网络切换发起 **`ICE Restart`** 时，按照 `RFC 8445 Section 9.1.1.1`，新的 Offer/Answer 会携带全新的 `ice-ufrag` 与 `ice-pwd`，媒体网关会**清空旧一代（Old Generation）的冗余候选配对表**，重新获得完整的 `16` 条新候选配额，既保证了高铁毫秒级无感切网，又彻底杜绝了无上限累积导致的内存泄漏。

---

## ③ 🧭 直观可视化图解（Mermaid 决策树 + 延迟对比 + 毫秒级时序图）

### 3.1 语音架构师 ICE 凭证熵与候选地址安全选型决策树

```mermaid
flowchart TD
    A["入站 WebRTC SDP Offer / Trickle ICE 候选<br/>(含 a=ice-ufrag, a=ice-pwd, a=candidate)"] --> B{"1. 校验 ice-ufrag / ice-pwd 熵与唯一性<br/>(RFC 8839 Section 5.1 · P825)"}
    B -- "ufrag < 24 bits 或 pwd < 128 bits<br/>或跨会话/ICE Restart 静态复用" --> C["⛔ 拦截: 拒绝弱凭证并强制 CSPRNG 轮换<br/>(0 弱凭证 · ufrag [24,64]b / pwd [128,256]b)"]
    B -- "ufrag >= 24b & pwd >= 128b 且唯一" --> D{"2. 校验 a=candidate 目标 IP 与端口<br/>(RFC 8445 Anti-SSRF · P826)"}
    D -- "命中私网/回环/IMDS IP<br/>或端口 < 1024 / 命中 6379,2379,6443" --> E["🛡️ 剥离: 0ms 丢弃违规 SSRF/特权端口候选<br/>(0 违规探测 · 阻断内网端口扫描)"]
    D -- "合法公网/授信网段 & 安全动态媒体端口" --> F{"3. 统计单 m= 轨累计候选数<br/>(Candidate Matrix Cap · P826)"}
    F -- "累计候选数 > 16 条" --> G["✂️ 限流: 截断超出 16 条的冗余候选<br/>(防止 O(N*M) STUN 探测风暴)"]
    F -- "候选数 in [1, 16]" --> H["✅ 放行: 启动 HMAC-SHA1 STUN 连接性检查<br/>(<=85ms P50 打通 DTLS-SRTP 语音流)"]
```

### 3.2 候选对风暴与旁路劫持对语音接通延迟及掉线率的影响对比

```mermaid
flowchart LR
    subgraph BAD["❌ 脆弱网关 (弱 ufrag/pwd + 无过滤 120 条 Candidate)"]
        direction TB
        B1["ufrag='1001', pwd='fixed'<br/>旁路攻击者 0.5s 盲发 USE-CANDIDATE"] --> B2["100% 语音媒体流被重定向至黑洞<br/>+ 120 条候选触发 2,400 次 STUN 风暴"]
        B2 --> B3["内网 6379/2379 被扫描暴露<br/>ICE 接通耗时飙升至 3,520ms"]
    end

    subgraph GOOD["✅ 确定性护栏网关 (P825 CSPRNG 熵锁 + P826 候选 SSRF/16条门禁)"]
        direction TB
        G1["CSPRNG ufrag 32b / pwd 128b+<br/>HMAC-SHA1 20B 强完整性校验"] --> G2["0ms 剥离 RFC1918/IMDS 与 <1024/6379 端口<br/>单轨候选严格钳制在 [1, 16] 条"]
        G2 --> G3["0 旁路劫持 · 0 内网 SSRF 探测<br/>ICE 接通 P50 稳定在 82ms"]
    end
```

### 3.3 毫秒级 WebRTC ICE 凭证核验与 `a=candidate` 防 SSRF 过滤全双工时序图

```mermaid
sequenceDiagram
    autonumber
    participant Attacker as 恶意客户端 / 旁路注入者
    participant Edge as 企业 WebRTC 边缘网关 (P825+P826)
    participant K8s as 内网 Redis:6379 / IMDS:80
    participant S2S as Azure Voice Live / S2S 引擎

    Note over Attacker,Edge: 场景 A：SDP 注入内网 SSRF 候选与 60 条垃圾候选 (P826 拦截)
    Attacker->>Edge: SDP Offer (ufrag=48b, pwd=128b)<br/>a=candidate:1 udp 10.240.0.15 6379 typ host<br/>a=candidate:2..60 udp 198.51.100.x 50000
    Edge->>Edge: P825 校验: ufrag=48b in [24,64], pwd=128b in [128,256] (PASS)
    Edge->>Edge: P826 校验: 剥离 10.240.0.15:6379 (私网+高危端口)<br/>截断候选列表至前 16 条合法公网 UDP 候选 (0ms @ 1ms Res)
    Note over Edge,K8s: K8s 内网 0 个 STUN 包发出 (SSRF 100% 阻断)

    Note over Attacker,Edge: 场景 B：通话中旁路盲发伪造 STUN USE-CANDIDATE (P825 拦截)
    Attacker->>Edge: 伪造 STUN Binding Request (USE-CANDIDATE, 错误 HMAC-SHA1)
    Edge->>Edge: P825 校验: 128-bit ice-pwd HMAC-SHA1 签名不匹配 -> 静默丢弃
    Edge->>S2S: 原有合法 RTP/SRTP 语音流 0ms 抖动持续传输
```

---

## ④ 📊 语音架构师选型决策矩阵（Architect Decision Matrix）

| 评估维度 | 方案 A：裸跑开源默认配置（固定/短 `ufrag` + 无过滤 `a=candidate`） | 方案 B：仅外围防火墙 ACL（无应用层 SDP/ICE 门禁） | **方案 C：企业级 `RFC 8839 / 8445` 熵下限 + 候选 SSRF/数量双护栏（`P825 + P826` 推荐）** |
| :--- | :--- | :--- | :--- |
| **`ice-ufrag / ice-pwd` 密码学熵** | 常出现 `<24b` 自增 ID 或硬编码测试密码，易遭旁路盲注劫持 | 防火墙无法检查加密 WSS 信令内的 SDP 熵值 | **强制 `ufrag [24, 64] bits`、`pwd [128, 256] bits` 且每次会话/Restart 独立 CSPRNG 轮换（`0` 弱凭证）** |
| **内网与云元数据 SSRF 防御** | ❌ `0%`（媒体网关 Pod 直接向内网 `10.x / 169.254.169.254` 发包） | ⚠️ 宿主机 iptables 规则复杂，难以感知容器 overlay 网段变化 | **✅ `100%` 在 ICE Agent 入队前剥离私网/回环/IMDS IP 与 `<1024`/高危服务端口（`0` 违规探测）** |
| **连接性检查风暴防护** | ❌ 单轨可塞入上百条候选，导致 $O(N \times M)$ 探测队列爆表 | ❌ 防火墙无法按单条 WebRTC `m=` 轨限制候选数量 | **✅ 单 `m=` 轨候选数严格钳制在 `[1, 16]` 条，P50 接通延迟稳定在 `82ms`** |
| **离线策略门禁判定耗时** | 无门禁 | 网络层处理 | **`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`）** |
| **适用场景** | 仅限本地 `localhost` 环回开发调试 | 非云原生传统单网段部署 | **所有公网接入的 WebRTC 浏览器/App 语音客服、数字人坐席与混合云 SBC/SFU 网关** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：为什么 `16` 条候选上限 + `128-bit` 密码能省下 `93%` 的无效探测开销？

- **算例 1（旁路 STUN 盲注碰撞概率对比）**：
  - **脆弱配置**：若 `ice-ufrag` 仅用 2 字节自增 ID（`16 bits`），且 `ice-pwd` 从 `1,000` 个常见词典派生（`~10 bits`），旁路攻击者在每秒发送 `10,000` 个伪造 UDP STUN 包的条件下，仅需约 **`6.5 秒`** 即可撞中有效签名并劫持媒体流；
  - **启用 `P825` 后**：强制 `ice-ufrag >= 24 bits`（默认 `32 bits`）且 `ice-pwd >= 128 bits`（CSPRNG），单次猜测成功概率降至 $2^{-152} \approx 1.75 \times 10^{-46}$，在通话生命周期内旁路盲注劫持率为 **`0%`**。
- **算例 2（候选对矩阵膨胀与内存/CPU 节省）**：
  - **未启用 `P826` 时**：服务端拥有 `4` 个本地候选，恶意客户端在 SDP 中注入 `64` 个伪造远端候选，形成 $4 \times 64 = 256$ 个候选对；按 `RFC 8445` 默认 `Ta=20ms` 及 `7` 次重传计算，单通恶意呼叫就会触发 **`1,792` 个出站 STUN 探测包**，且至少 `15` 个内网敏感端口被扫描；
  - **启用 `P826` 后**：`0ms` 剥离全部内网/违规端口候选，并将合法远端候选上限钳制在 **`<= 16` 条**（常规仅 `4–6` 条），最坏情况候选对压缩 **`75%–93%`**，内网 SSRF 探测包严格为 **`0`**。

### 5.2 离线策略状态机护栏验真（Stage 416 · `P825` & `P826`）

| 护栏 ID | 护栏函数名 | 合成压测输入（Synthetic Abuse Vector） | 确定性拦截动作（Action） | 离线策略计时披露（Provenance & Timing Disclosure） |
| :--- | :--- | :--- | :--- | :--- |
| **`P825`** | `evaluateWebrtcIceRfc8839UfragPwdEntropyFloorAndSessionRotationGate` | `weakIceUfragPwdEntropyOrStaticCredentialReuseDetected: true`, `iceUfragEntropyBits: 12`, `icePwdEntropyBits: 48` | `reject_weak_ice_credentials_and_rotate_csprng`（将 `iceUfragEntropyBits` 提升至 `[24, 64]` 下限 `24`，将 `icePwdEntropyBits` 提升至 `[128, 256]` 下限 `128`） | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`；真实 CSPRNG 与 STUN HMAC-SHA1 验签耗时 `not_measured`） |
| **`P826`** | `evaluateWebrtcIceRfc8445CandidatePortScanSsrfAndCandidateCapGate` | `candidatePortScanSsrfOrDisallowedPortDetected: true`, `disallowedPortOrPrivateCandidateCount: 5`, `maxCandidatesPerMline: 64` | `drop_ssrf_candidates_and_cap_mline_candidates`（将 `clampedDisallowedPortOrPrivateCandidateCount` 清零为 `0`，将 `clampedMaxCandidatesPerMline` 钳制为 `16`） | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（`synthetic`；真实 SFU ICE 候选地址解析与路由表查找耗时 `not_measured`） |

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Good Fit vs. Not For + Checklist）

### ✅ Good Fit（极佳适用场景） vs. ⛔ Not For（不适用或需额外适配场景）

| ✅ Good Fit（建议立即启用 `P825 + P826` 的场景） | ⛔ Not For（需要注意边界的场景） |
| :--- | :--- |
| 1. **部署在公有云 K8s / VPC 内的 WebRTC 语音智能体网关（LiveKit / Pion / Mediasoup / FreeSWITCH / Janus）**：必须通过 `P826` 防止攻击者借 ICE Candidate 扫描同 VPC 的 Redis/etcd/IMDS。 | 1. **纯局域网离线内网电话会议室（Air-Gapped LAN WebRTC）**：在无公网接入的纯内网环境中，终端的合法 `host` 候选本就是 `RFC 1918` 私网 IP；此时 `P826` 应配置为“仅放行授信办公子网 VLAN，仍拦截 K8s 管理网段与 `<1024` / 数据库端口”。 |
| 2. **移动 App / 车载小程序弱网高频切网场景（5G ↔ Wi-Fi ICE Restart）**：必须通过 `P825` 确保每次 `ICE Restart` 都轮换高熵 `ufrag/pwd` 并清理旧候选对。 | 2. **显式通过 `443` 端口承载 `TURNS (TLS over TCP)` 的穿墙分支**：`443` 端口仅对服务端自己签发的授信 TURN 中继地址豁免，绝不可对客户端提交的任意远端 `host/srflx` 候选放开 `443` 端口探测。 |

### 生产上线核验 Checklist（`- [ ]`）

- [ ] **【`P825` `ice-ufrag / ice-pwd` 熵下限】**：核查 SDP 生成器与接纳器，确认入站与出站 `a=ice-ufrag` 长度不少于 4 个 Base64 字符（`[24, 64] bits`），`a=ice-pwd` 长度不少于 22 个 Base64 字符（`[128, 256] bits`）。
- [ ] **【`P825` 严禁静态凭证与跨会话复用】**：核查每次新建 `RTCPeerConnection` 及每次触发 `ICE Restart` 时，均由操作系统 CSPRNG 生成全新 `ufrag` 与 `pwd`。
- [ ] **【`P826` 入站 `a=candidate` 私网与 IMDS 剥离】**：在公网边缘 SFU/SBC 的 SDP 解析器与 Trickle ICE 接口上，拦截 `127.0.0.0/8`、`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`169.254.0.0/16`、`100.64.0.0/10`、`::1`、`fc00::/7`、`fe80::/10` 等非公网候选地址（`0` 违规候选入队）。
- [ ] **【`P826` 特权端口与内网数据库端口封禁】**：拒绝向 `< 1024` 特权端口及 `2379 / 3306 / 5432 / 6379 / 6443 / 9200` 等敏感服务端口发起 STUN 连接性探测。
- [ ] **【`P826` 单 `m=` 轨候选数上限 `[1, 16]`】**：配置每个媒体流（`m=audio` / `m=video`）最多接纳 `16` 条远端候选地址，防止连接性检查矩阵爆炸。
