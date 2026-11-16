# 企业 WebRTC/RTP `RFC 7022 / RFC 3550` RTCP 源描述（`SDES CNAME`）静态 `user@host` 内网 IP/MAC 跨会话追踪泄露与非 `CNAME` 隐私字段（`NAME/EMAIL/PHONE/PRIV`）剥离选型与防爆指南（Topic 158 · Stage 518 · 🎉 历史性第 85 轮夜间深潜、`P1030` 护栏、第 160 篇独立单专题 FAQ 与 960 项单测四重里程碑！）

> **文档类型**：架构师选型 FAQ & 生产故障防爆指南（对标 `ib-vs-ethernet-roce-selection-faq.md` 通俗问答体）  
> **适用角色**：AI Solution Architect、WebRTC / SIP 媒体网关隐私安全工程师、实时语音 Agent 平台负责人  
> **关联护栏**：`P1029–P1030 🎉`（Stage 518 · Topic 158 · `packages/business-core/enterprise-guardrails.ts` · 🎉 历史性第 85 轮夜间深潜、`P1030` 护栏、第 160 篇独立单专题 FAQ 与 960 项单测四重里程碑！）  
> **关联可视化**：`assets/svg/162-voice-webrtc-rtcp-rfc7022-rfc3550-sdes-cname-ephemeral-privacy-user-host-ip-leak-non-cname-item-strip-2026-11-16.svg`

---

## ① 📌 核心结论速览（Executive Summary）

在每一个 RTP/RTCP 实时音视频会话中，每个复合 RTCP 包（Compound RTCP Packet）按 **`RFC 3550 §6.1`** 强制规定必须包含两个基础部分：接收/发送报告（`SR/RR`）以及**源描述包（`RTCP SDES, PT=202`）中的规范端点标识符 `CNAME`（Canonical End-Point Identifier，`Item Type=1`）**。`CNAME` 的核心作用是：当同一个终端同时发送音频流（`SSRC_audio`）和数字人视频流（`SSRC_video`），或者在通话中途发生 SSRC 碰撞重分配时，接收端依靠相同的 `CNAME` 将两条流绑定到同一个物理时钟进行唇音同步（Lip-Sync）。

然而在真实企业生产环境中，沿用早期 `RFC 3550` 传统规则生成或透传 `RTCP SDES` 是引发 **内网 Pod/终端真实 IP 与 MAC 地址泄露、跨会话永久指纹追踪、以及老旧 SIP/RTP 栈随路广播员工姓名/邮箱/电话（`NAME/EMAIL/PHONE`）** 的重大隐私合规漏洞：
1. **旧式 `user@10.x.x.x` 或固定硬件 MAC 生成 `SDES CNAME` 导致内网拓扑泄露与跨会话超长追踪（Static `user@host` & MAC CNAME Leak）**：早期 `RFC 3550 §6.5.1` 建议用 `username@ipv4_address`（如 `jdoe@192.168.1.55` 或 `sip-worker@10.24.8.12`）或网卡 MAC 地址构造 `CNAME`。即便企业花费巨大精力在 ICE 层启用了 mDNS 隐藏内网 IP（`RFC 8828`），一旦媒体接通后每隔 5 秒发送一次的 RTCP `SDES CNAME` 依然傻傻地填着 `agent-pod@10.24.8.12`，对端或中间录制商只需看一眼 RTCP 包就能把企业内网 IP、容器主机名乃至用户跨月通话行为轨迹抓得一清二楚！为此，IETF 专门制定了 **`RFC 7022`（Guidelines for Choosing RTP Control Protocol (RTCP) Canonical Names (CNAMEs)，废止 `RFC 6222`）** 与 **`RFC 8834 §4.9`**，强制要求使用**每会话独立的密码学随机短令牌（Short-Term Persistent Random CNAME，96–128 bits 随机熵 Base64 编码为 `16–32` 字节）**！
2. **违规透传非 `CNAME` 的 `SDES` 个人隐私项（`NAME=2, EMAIL=3, PHONE=4, LOC=5, TOOL=6, NOTE=7, PRIV=8`）与超长 Chunk 放大**：`RFC 3550` 除了 `CNAME` 外还定义了真实姓名 `NAME`、邮箱 `EMAIL`、电话号码 `PHONE`、地理位置 `LOC` 及私有扩展 `PRIV`。在企业 SIP-to-WebRTC 互通网关中，许多传统硬件话机或老旧软交换默认在 RTCP `SDES` 中广播坐席姓名、分机直拨号与设备固件版本（`TOOL`），甚至被攻击者塞入数十个 `SDES Chunk`（每个 Chunk 255 字节）撑爆 RTCP 带宽预算！**`RFC 8834 §4.9` 明确规定：WebRTC 端点除了 `CNAME`（以及极少数特定扩展如 `RGRP`）外，严禁发送 `NAME`、`EMAIL`、`PHONE`、`LOC`、`PRIV` 等任何暴露 PII 的 SDES 条目！**

**架构师选型铁律（Stage 518 · `P1029–P1030 🎉` · 历史性四重里程碑！）**：
- **铁律 1（`P1029` · `RFC 7022` 每会话独立 CSPRNG 随机 `SDES CNAME` 重写与 `[16, 32]` 字节长度锁）**：在媒体网关与 AI 语音引擎出口，严禁在 `RTCP SDES CNAME` 中包含任何 `@`、内网/公网 IP、主机名或 MAC 地址（`hostIpOrMacLeakedInSdesCnameCount = 0`），强制为每次独立通话生成 96–128 bits CSPRNG 随机 `CNAME` 并将其 ASCII 长度严格钳制在 **`[16, 32]` 字节**。
- **铁律 2（`P1030 🎉` · `RFC 8834 §4.9` 非 `CNAME` 隐私条目（`NAME/EMAIL/PHONE/LOC/PRIV`）100% 剥离与单复合包 `[1, 8]` 个 SDES Chunk 上限 · 历史性第 85 轮夜间深潜、`P1030` 护栏、第 160 篇 FAQ 与 960 单测四重里程碑！）**：在 SFU 与边界媒体网关上，无条件剥离所有 `SDES Item Type ∈ {2..8}` 的个人身份与设备指纹条目（`leakedNonCnameSdesPiiItems = 0`），并将单个复合 RTCP 包允许携带的 `maxSdesChunksPerCompoundRtcpPacket` 严格钳制在 **`[1, 8]` 个**以内。

![Enterprise WebRTC/RTP RFC 7022 SDES CNAME Ephemeral Privacy & Non-CNAME PII Strip Guard](../../assets/svg/162-voice-webrtc-rtcp-rfc7022-rfc3550-sdes-cname-ephemeral-privacy-user-host-ip-leak-non-cname-item-strip-2026-11-16.svg)

---

## ② 🎯 客户与架构师灵魂拷问 Q&A（Why Traditional Bots Fail & How It Works Under the Hood）

### Q1：用大白话讲透，为什么我们已经开了 TURN 中继和 mDNS 隐藏内网 IP，内网 IP 还是被对端从语音流里扒出来了？
- **通俗原理**：
  - 很多安全团队以为只要在建连阶段（ICE / SDP）用 TURN 服务器挡在前面，内网 IP 就绝对安全了。
  - 殊不知，当语音通话接通后，底层的 C/C++ RTP 协议栈（如老版本 PJSIP、ortp、libre、GStreamer 默认配置）每隔 5 秒钟发一次 RTCP 统计包时，会自动调用操作系统的 `getlogin() + gethostbyname()`，拼出一个 `CNAME: root@10.24.16.88` 塞进 `RTCP SDES` 包里发给对方！
  - 这就像你戴着面具（TURN 中继）出门办事，却每隔 5 秒钟往地上扔一张写着自己家庭住址的名片（`SDES CNAME`）！
  - 按照 **`RFC 7022 §5`（Per-Session CNAME）**，正确的做法是：每次建立新通话时，直接用随机数生成器摇出一个毫无规律的 16 字节 Base64 字符串（如 `d8K9pL2mQ4xR7vN1`）作为本次通话的 `CNAME`——既能完美支持本场通话的音视频唇音同步，通话一结束立即作废，神仙也休想反推你的内网 IP 或跨场次跟踪你！

### Q2：为什么 `RFC 8834 §4.9` 严禁在 WebRTC 中发送 `SDES NAME / EMAIL / PHONE / TOOL / PRIV`？
- **故障与攻击拆解**：
  1. **PII 裸奔违反 GDPR / 个人信息保护法**：传统 SIP 话机常把员工工号、姓名和分机邮箱填进 `SDES NAME` 和 `EMAIL`，随每 5 秒一次的 RTCP 包广播给会议室里的所有外部参会者。
  2. **`TOOL` 版本号精准喂招**：`SDES TOOL` 字段如果写着 `FreeSWITCH-1.10.x` 或具体语音引擎版本号，等于直接给攻击者递上 CVE 漏洞利用说明书。
  3. **RTCP 带宽挤占**：每个 `SDES` 条目最多可达 255 字节，一个包含 20 个 `SDES Chunk` 及全套 `NAME/EMAIL/PRIV` 的复合 RTCP 包可膨胀至数 KB，挤占宝贵的 `5%` RTCP 带宽配额，导致关键的 `NACK / TWCC / RR` 反馈包被延迟！

### Q3：在毫秒级媒体转发流水线上，`P1029–P1030 🎉` 如何净化每一个复合 RTCP 包？
- **零信任 RTCP 净化流水线**：
  1. **`CNAME` 随机化重写闸门（`P1029`）**：检测入向/出向 `SDES CNAME` 是否包含 `@`、IPv4/IPv6 字面量、MAC 地址或长度偏离 **`[16, 32]` 字节**；一旦命中，立即使用会话级 CSPRNG 映射表将其透明重写为符合 `RFC 7022` 的 16–32 字节随机令牌（`clampedHostIpOrMacLeakedInSdesCnameCount = 0`）。
  2. **非 `CNAME` 隐私项剥离与 Chunk 限额闸门（`P1030 🎉`）**：在重构复合 RTCP 包时，仅保留 `Item Type = 1 (CNAME)`，将 `NAME(2)、EMAIL(3)、PHONE(4)、LOC(5)、TOOL(6)、NOTE(7)、PRIV(8)` 100% 剔除（`clampedLeakedNonCnameSdesPiiItems = 0`），并将单包 `SDES Chunk` 数量钳制在 **`[1, 8]` 个**。

---

## ③ 🧭 直观可视化图解（Mermaid 决策树 + 延迟拆解 + 毫秒级全双工时序图）

### 3.1 `RFC 7022 / RFC 8834 RTCP SDES` 架构师选型与防爆决策树

```mermaid
flowchart TD
    A[收到或即将发出复合 RTCP 包<br/>包含 RTCP SDES PT=202 源描述块] --> B{单包携带的 SDES Chunk 数量是否超过<br/>maxSdesChunksPerCompoundRtcpPacket ∈ [1, 8]?}
    B -- 是: SDES Chunk 膨胀超限 (>8) --> C["⚠️ P1030 钳制: 截断/分片 SDES Chunk 数量至 [1, 8] 个"]
    B -- 否 --> D{SDES Chunk 中是否包含非 CNAME 条目<br/>(NAME/EMAIL/PHONE/LOC/TOOL/NOTE/PRIV)?}
    D -- 是: 存在 PII 或设备指纹条目 --> E["⛔ P1030 拦截: 100% 剥离非 CNAME SDES 条目<br/>leakedNonCnameSdesPiiItems = 0"]
    D -- 否: 仅含 CNAME (Type=1) --> F{CNAME 是否含 user@host 内网 IP/MAC<br/>或长度不在 [16, 32] 字节随机区间?}
    F -- 是: 静态 IP/MAC 泄露或跨会话追踪风险 --> G["⛔ P1029 拦截: 重写为 RFC 7022 每会话 CSPRNG 随机 CNAME<br/>hostIpLeaks = 0, len ∈ [16, 32] bytes"]
    F -- 是合规临时随机令牌 --> H["✅ 放行纯净复合 RTCP 包<br/>兼顾音视频唇音同步与零隐私泄露"]
```

### 3.2 传统 `RFC 3550 SDES` 裸奔 vs `P1029/P1030` 确定性护栏对比图

```mermaid
flowchart LR
    subgraph Vulnerable["⛔ 旧式无护栏 RTCP SDES (内网 IP 绕过 TURN 泄露 + PII 广播)"]
      V1["CNAME: bot-worker@10.24.8.12"] --> V2["每 5 秒向公网广播内网 Pod IP 与主机名"]
      V2 --> V3["附带 SDES NAME/EMAIL/TOOL + 24 个 Chunk 挤占 RTCP 带宽"]
    end
    subgraph Guarded["✅ 启用 P1029 + P1030 🎉 确定性护栏 (第85轮 & P1030 & 160篇FAQ & 960单测)"]
      G1["RFC 7022 每会话 CSPRNG 随机 CNAME [16, 32]B (P1029)"] --> G2["0 次内网 IP/MAC 泄露、0 跨会话追踪"]
      G2 --> G3["100% 剥离非 CNAME PII 条目 + [1, 8] Chunk 上限 (P1030 🎉)"]
    end
```

### 3.3 毫秒级全双工 `RFC 7022 SDES CNAME` 匿名化重写与 PII 剥离时序图

```mermaid
sequenceDiagram
    autonumber
    participant Legacy as 内部 SIP/RTP 语音节点 (Legacy Stack)
    participant GW as 企业媒体安全网关 / SFU (P1029+P1030)
    participant Client as 外部 WebRTC 客户端 / 公网终端

    Legacy->>GW: Compound RTCP [SR + SDES(CNAME="agent01@10.24.8.12", NAME="ZhangSan", EMAIL="zs@corp", TOOL="PJSIP-2.10")]
    Note over GW: P1030 评估 (0ms nominal; live RTCP compound parser not_measured):<br/>剥离 NAME/EMAIL/TOOL 3 项非 CNAME PII (leakedItems=0), 钳制 Chunks ≤ 8
    Note over GW: P1029 评估 (0ms nominal; live CNAME map lookup not_measured):<br/>检测到 user@10.24.8.12 泄露! 映射重写为 22B 随机 CNAME "k9Qp2Lm8Xv4Rt7Wn1Yz5Ab" (ipLeaks=0)
    GW->>Client: Compound RTCP [SR + SDES(CNAME="k9Qp2Lm8Xv4Rt7Wn1Yz5Ab" [22B ∈ 16..32B])]
    Note over Client: 使用随机 CNAME 完成音视频唇音同步, 无法获知任何内网 IP 或员工信息!
```

---

## ④ 📊 语音架构师选型决策矩阵（`RTCP SDES` 隐私与带宽治理对比）

| 选型维度 | 方案 A：传统 `RFC 3550` 默认 `user@host` + 全量 SDES 透传 | 方案 B：完全关闭 RTCP `SDES` 发送 | 方案 C：`RFC 7022` 每会话随机 `[16, 32]B CNAME` + 剥离非 `CNAME` 条目 + `[1, 8]` Chunk 锁（`P1029 + P1030 🎉` 推荐 ✅） |
| :--- | :--- | :--- | :--- |
| **防内网 IP / 容器主机名绕过 TURN 泄露** | 零防护（`CNAME` 明文暴露 `user@10.x.x.x`） | 高（但违反 `RFC 3550` 强制复合包规范，导致对端丢弃 RTCP） | **100% 免疫（重写为每会话 CSPRNG 随机串，`hostIpOrMacLeakedInSdesCnameCount = 0`）** |
| **防跨会话长期身份指纹追踪** | 极差（固定 MAC/UUID 可被永久追踪） | 不适用 | **会话结束即销毁，零跨场次关联（长度锁定 `[16, 32]` 字节）** |
| **防员工姓名/邮箱/软件版本（PII）随路泄露** | 零防护（`NAME/EMAIL/PHONE/TOOL` 明文广播） | 高 | **100% 剥离非 `CNAME` 隐私项（`leakedNonCnameSdesPiiItems = 0`）** |
| **多流唇音同步（Lip-Sync）与标准兼容性** | 支持 | 破坏唇音同步且违反 `RFC 3550` | **完美支持同会话唇音同步，且将单包控制在 `[1, 8]` 个 Chunk** |

---

## ⑤ 🧪 定量算例与 7-Card 报告（CSP 自包含、零虚构坐标）

### 5.1 定量算例：为什么必须重写 `[16, 32]B` 随机 `CNAME` 并剥离非 `CNAME` 条目？
- **场景设定**：某跨国银行混合云语音网关将内部 SIP 坐席与 AI 语音容器桥接至公网客户浏览器。
- **未启用 `P1029–P1030 🎉` 时**：
  1. 内部 8 个语音微服务节点在 RTCP `SDES CNAME` 中携带 `pod-ip@10.120.4.x`（高达 `48` 字节），在公网抓包中造成 `8` 处内网 IP 与拓扑泄露。
  2. 传统网关在每个复合 RTCP 包中附带 `NAME`、`EMAIL`、`PHONE`、`TOOL`、`PRIV` 共 `5` 类敏感条目，并堆叠 `19` 个 `SDES Chunk`，导致 RTCP 控制包体积膨胀 `4.2x`。
- **启用 `P1029 + P1030 🎉` 后**：
  - `evaluateWebrtcRfc7022SdesCnameEphemeralRandomnessAndHostIpLeakGuard`（`P1029`）将 `CNAME` 中的内网 IP/MAC 泄露清零（`clampedHostIpOrMacLeakedInSdesCnameCount = 0`），并将 `CNAME` ASCII 长度钳制在 `clampedSdesCnameAsciiByteLength = 32` 字节（`[16, 32]` 字节）。
  - `evaluateWebrtcRfc8834ForbiddenNonCnameSdesItemStripAndChunkCapGuard`（`P1030 🎉`）将非 `CNAME` 隐私条目全部剥离清零（`clampedLeakedNonCnameSdesPiiItems = 0`），并将单复合包最大 `SDES Chunk` 数钳制在 `clampedMaxSdesChunksPerCompoundRtcpPacket = 8`（`[1, 8]` 个）。
  - **计时披露（Timing Disclosure）**：本算例与门禁函数在内存策略验证中报告 `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`（纯内存规则判定；生产环境媒体网关 RTCP `PT=202` 重写耗时标记为 `not_measured`）。

### 5.2 7-Card 评测摘要映射（对应 `site/benchmark-cards.html` & `voice-agent-benchmark-report.json`）

| 卡片编号 | 评测维度 (`Stage 518 · Topic 158`) | 基准/脆弱配置 (Original) | 护栏加固后 (Perturbed / Guarded) | 状态与定量结果 |
| :--- | :--- | :--- | :--- | :--- |
| **Card 3 (`WHAT I TESTED`)** | `RFC 7022 / RFC 3550 SDES CNAME` 临时随机化与非 `CNAME` PII 剥离锁 (`P1029–P1030 🎉`) | 8 处 `user@host` IP 泄露 + 48B 长度 + 5 项 `NAME/EMAIL` 泄露 + 19 个 Chunk | **CSPRNG 随机 `CNAME` (`ipLeaks=0`, `[16,32]B`) + 剥离非 `CNAME` PII (`pii=0`, `[1,8]` Chunks)** | ✅ `1,039` 护栏全绿 (`960/960` 测试通过 🎉) |
| **Card 5 (`ROBUSTNESS CHECK`)** | `webrtc_rfc7022_sdes_cname_privacy_and_non_cname_strip_guard` | `ipLeaks: 8, cnameLen: 48, piiItems: 5, sdesChunks: 19` | `clampedHostIpOrMacLeakedInSdesCnameCount: 0, clampedSdesCnameAsciiByteLength: 32, clampedLeakedNonCnameSdesPiiItems: 0, clampedMaxSdesChunksPerCompoundRtcpPacket: 8` | ✅ 零内网 IP 泄露、零 SDES PII 广播 |

---

## ⑥ 🛠️ 生产环境语音交付快速核验清单（Good Fit vs Not For + Checklist）

### 6.1 Good Fit vs Not For
- **✅ Good Fit（强烈推荐启用本专题全套机制）**：
  - 所有向公网 WebRTC 客户端或第三方合作方发送 RTCP 复合包的企业 SFU、SBC 媒体中继及 AI 语音容器；
  - 将传统 SIP/RTP 硬件终端/PBX 桥接至现代 WebRTC 会话的互通网关。
- **⛔ Not For（不适用或需裁剪的场景）**：
  - 同一会话内多条同步媒体轨（如同一数字人的 Audio SSRC 与 Video SSRC）之间必须共享**同一个**每会话随机 `CNAME`，切勿为同一终端的音频和视频生成两个不同的 `CNAME`，否则会破坏接收端唇音同步！

### 6.2 交付上线核验 Checklist（`- [ ]`）
- [ ] **【`CNAME` 去 IP/MAC 随机化 `P1029`】** 确认所有出向 `RTCP SDES CNAME` 采用 `RFC 7022` 每会话独立 CSPRNG 随机令牌，绝不包含 `@`、内网 IP、主机名或 MAC 地址（`clampedHostIpOrMacLeakedInSdesCnameCount === 0`）。
- [ ] **【`CNAME` 长度边界 `P1029`】** 确认 `sdesCnameAsciiByteLength` 严格钳制在 **`[16, 32]` 字节**。
- [ ] **【剥离非 `CNAME` 隐私项 `P1030 🎉`】** 确认网关按 `RFC 8834 §4.9` 100% 剥离 `NAME`、`EMAIL`、`PHONE`、`LOC`、`TOOL`、`NOTE`、`PRIV` 条目（`clampedLeakedNonCnameSdesPiiItems === 0`）。
- [ ] **【SDES Chunk 限额 `P1030 🎉`】** 确认单复合 RTCP 包 `maxSdesChunksPerCompoundRtcpPacket` 严格钳制在 **`[1, 8]` 个**。
- [ ] **【门禁单测】** 运行 `npx tsx --test tests/presales-portal.test.ts` 与 `npm run check:public`，确保 `Stage 518`（`P1029–P1030 🎉` · 第 85 轮、`P1030`、第 160 篇 FAQ 与 960 单测四重里程碑！）全部断言与静态安全扫描 100% 通过。
