# Enterprise WebRTC `RFC 7941 / RFC 7022` `RTCP SDES CNAME` Ephemeral Privacy & Multimodal Lip-Sync (`user@host` Internal IP/MAC Cross-Session Fingerprinting, `SDES PRIV` Leak & First-Frame Lip-Sync Drift) Selection & Anti-Tracking Guide

> **Document Type**: Enterprise Voice Agent Architect Selection & First-Principles Guide (Standalone Selection & Architecture FAQ · **Topic 106 / Stage 466 · 🎉 Historic 110th SVG Architecture Diagram & 935-Guardrail Dual Milestone**)  
> **Target Audience**: AI Solution Architects, Multimodal Digital-Human (Audio + Avatar) Architects, WebRTC Media Engineers & Privacy/Compliance (GDPR/HIPAA) Leads  
> **Canonical Baseline**: `packages/business-core/enterprise-guardrails.ts` (`P925–P926 🎉`), `tests/presales-portal.test.ts`, `site/data/voice-agent-benchmark-report.json` (7-Card 4:5 Benchmark Report)  
> **Visual Summary**: `assets/svg/110-voice-webrtc-rtcp-rfc7941-rfc7022-sdes-cname-ephemeral-privacy-lipsync-clock-drift-2026-11-14.svg`

---

## ① 📌 Executive Summary

In enterprise multimodal AI voice interactions (such as banking VIP digital-human video KYC and telehealth consultations), the audio track (`Opus`) and avatar video track (`AV1/VP9/H.264`) use distinct `SSRC` identifiers and independent random initial `RTP Timestamps`. To align voice syllables with avatar lip movements on a common wallclock timeline, the receiver relies on a single canonical anchor: the **`RTCP SDES CNAME` (Canonical End-Point Identifier)**, which binds `SSRC_audio` and `SSRC_video` into the same synchronization context. In production deployments, however, legacy `RFC 3550` `SDES` behavior without **`RFC 7022` (Short-Term Persistent / Per-Session Random `CNAME`s)** and **`RFC 7941` (RTP Header Extension for `RTCP SDES`)** creates two high-severity failures:
1. **Legacy `user@host / IPv4 / MAC` `SDES CNAME` & `SDES NAME/EMAIL/PHONE/TOOL/PRIV` Internal Topology & Cross-Session Fingerprinting Leaks (`RFC 7022 / RFC 8834` Privacy Violation)**: `RFC 3550 Section 6.5.1` historically constructed `CNAME` values as `user@10.24.8.15` or hardware MAC hashes and permitted optional `SDES` items such as `NAME`, `EMAIL`, `PHONE`, `LOC`, `TOOL` (exposing exact media server versions), and `PRIV`. Even when WebRTC `mDNS` hides local ICE candidate IPs, an unguarded `RTCP SDES` packet leaks internal Kubernetes Pod/VLAN IPs and acts as a persistent cross-session supercookie tracking users across separate calls.
2. **Waiting `500–1,500ms` for Periodic Compound `RTCP (SR + SDES)` Causing Opening-Utterance Lip-Sync Drift (`RFC 7941` `0-RTT` Binding Missing)**: When `SDES CNAME` is delivered only inside slow periodic compound `RTCP` packets, the first `500–1,500ms` of an AI digital human's speech (or a newly switched `SSRC`) arrives at the client before the binding `RTCP SDES` packet—forcing independent playout buffers that drift up to `240ms` out of lip-sync during the critical opening greeting.

| Decision Dimension | Vulnerable / Default Setup (High Production Risk) | Enterprise Golden Rule (`P925–P926 🎉` Deterministic Guardrails) | Quantitative Impact |
| :--- | :--- | :--- | :--- |
| **`RFC 7022` Per-Session CSPRNG `CNAME` & Non-`CNAME` Item Stripping (`P925`)** | Emitting `user@10.x.x.x` or static MAC `CNAME`s with `SDES TOOL/EMAIL/PRIV` items (`24`-bit entropy) | **Generate per-session CSPRNG `[96, 128]`-bit random Base64 `CNAME`s and strip 100% of `NAME/EMAIL/PHONE/LOC/TOOL/NOTE/PRIV` items** | **0** internal IP/PII leaks or cross-session tracking packets (clamps 11 `SDES` privacy leaks to **0** and raises `CNAME` entropy from `24` bits to **`128` bits**) |
| **`RFC 7941` First-Frame RTP Header Extension `sdes:cname` & Lip-Sync Skew Cap (`P926 🎉` 935th Guardrail)** | Relying solely on periodic `RTCP` for `CNAME` binding with `240ms` A/V skew | **Embed Cryptex-encrypted `RFC 7941 urn:ietf:params:rtp-hdrext:sdes:cname` on initial packets for `0-RTT` binding and clamp A/V lip-sync skew tolerance to `[15, 80]ms`** | **0** opening lip-sync drifts or unbound streams (clamps 6 desynced streams to **0** and bounds lip-sync tolerance from `240ms` to **`80ms`**) |

![2026-11-14 Enterprise Voice Agent WebRTC RFC 7941 & RFC 7022 RTCP SDES CNAME Ephemeral Privacy & Lip-Sync Guard FAQ & Stage 466 Visual Summary (🎉 Historic 110th SVG & 935-Guardrail Dual Milestone!)](../assets/svg/110-voice-webrtc-rtcp-rfc7941-rfc7022-sdes-cname-ephemeral-privacy-lipsync-clock-drift-2026-11-14.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (First-Principles Deep Dive)

### Q1: We enabled WebRTC `mDNS` to hide local IPs in SDP ICE candidates—how did penetration testers still extract our internal Kubernetes Pod IPv4 subnet and FreeSWITCH version from the media stream?
- **First-Principles Breakdown**:
  1. Many backend SIP/WebRTC media gateways and native C/C++ RTP stacks default to `RFC 3550`'s legacy `SDES CNAME` generator (`username@local-ipv4-or-fqdn`, e.g., `svc_voice@10.240.12.8`) and append `SDES TOOL` (e.g., `FreeSWITCH-1.10.x` or `GStreamer-1.22`) in every compound `RTCP` report.
  2. Furthermore, if an endpoint reuses a static `CNAME` derived from a hardware MAC address or user ID across calls, any external peer can link anonymous calls to the same physical device (`RFC 8828` privacy violation).
  3. **`P925` Deterministic Defense**: Enforces **`RFC 7022 Section 5` & `RFC 8834 Section 4.9`** by generating a fresh **`[96, 128]`-bit CSPRNG ephemeral `CNAME`** per session and stripping 100% of non-`CNAME` `SDES` items (`NAME`, `EMAIL`, `PHONE`, `LOC`, `TOOL`, `NOTE`, `PRIV`).

### Q2: Why does an AI digital-human avatar often exhibit a 1-second "mouth lags behind voice" glitch right at the start of a turn before snapping into sync?
- **Engineering Reality**:
  1. Because `SSRC_audio` and `SSRC_video` use independent random RTP timestamp offsets, the client cannot synchronize their playout buffers until it receives `SDES CNAME` (binding the two SSRCs) plus `RTCP SR` NTP-to-RTP mappings.
  2. Waiting for the first periodic compound `RTCP` packet delays synchronization by `500–1,500ms` (or longer if the first `RTCP` UDP packet is lost).
  3. **`P926 🎉` Deterministic Defense**: Attaches the **`RFC 7941` (`urn:ietf:params:rtp-hdrext:sdes:cname`)** header extension (protected via `RFC 9335 Cryptex`) on the initial RTP media packets of a new or switched stream alongside rapid NTP synchronization (`RFC 6051`), achieving **`0-RTT` first-frame lip-sync binding** and clamping maximum A/V lip-sync skew tolerance to **`[15, 80]ms`** (well within `ITU-R BT.1359`'s `[-45, +125]ms` human perception envelope).

### Q3: Why must `RFC 7941` RTP header extensions be encrypted with `RFC 9335 Cryptex` and limited to initial talkspurt packets?
- **First-Principles Breakdown**:
  - Sending `sdes:cname` in plaintext on every RTP packet wastes header bandwidth and allows untrusted network middleboxes to correlate audio and video flows by reading the plaintext `CNAME`. Encrypting the extension via `Cryptex` and emitting it only on the first 1–3 packets of a new stream or SSRC switch achieves `0-RTT` synchronization with zero privacy leakage and negligible bandwidth overhead.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Privacy/Sync Breakdown + Millisecond Sequence)

### 3.1 WebRTC `RFC 7941 / RFC 7022` `SDES CNAME` Privacy & `0-RTT` Lip-Sync Decision Tree

```mermaid
flowchart TD
    A["Multimodal Voice + Avatar Stream Startup<br/>(RTCP SDES & RFC 7941 Header Extension Check)"] --> B{"1. Is CNAME a Per-Session CSPRNG Value ([96,128]b)?<br/>And Are NAME/EMAIL/PHONE/LOC/TOOL/PRIV Stripped? (P925)"}
    B -- "No (Contains user@IP/MAC or Non-CNAME PII Items)" --> C["⛔ P925 Sanitize & Rewrite: Strip All Non-CNAME SDES Items<br/>Rewrite to 128-bit Per-Session CSPRNG CNAME (0 PII Leaks)"]
    B -- "Yes (Zero-PII Ephemeral CNAME)" --> D{"2. Do Initial Packets Carry Cryptex RFC 7941 sdes:cname<br/>with A/V Lip-Sync Skew <= [15, 80]ms? (P926 🎉)"}
    D -- "No (Waits for Slow RTCP SR -> 240ms Opening Lip-Sync Drift)" --> E["🛡️ P926 🎉 Inject & Clamp: Attach Encrypted sdes:cname on First Frame<br/>Clamp A/V NTP Lip-Sync Skew Tolerance to [15, 80]ms"]
    D -- "Yes (0-RTT Bound & Skew <=80ms)" --> F["✅ Zero Internal IP Leak + Frame-1 Avatar Lip-Sync Verified"]
```

### 3.2 Legacy `RFC 3550` Static `SDES` Leak & Slow Sync vs. `P925+P926 🎉`

```mermaid
flowchart LR
    subgraph LegacySDES["❌ Legacy RFC 3550 (user@IP Leak + 1.5s Slow Sync)"]
      A1["CNAME: worker@10.240.12.8 + TOOL: FreeSWITCH"] --> A2["Leaks Internal Pod IP & Version + Cross-Call Tracking"]
      A2 --> A3["1,200ms Wait for Periodic RTCP SR -> 240ms Opening Lip-Sync Lag"]
    end

    subgraph ModernSDES["✅ P925 + P926 🎉 (RFC 7022 Ephemeral CNAME + RFC 7941 0-RTT Sync)"]
      B1["128-bit Per-Session CSPRNG CNAME · Strip All Non-CNAME Items"] --> B2["Cryptex-Encrypted First-Frame RFC 7941 sdes:cname"]
      B2 --> B3["0-RTT Frame-1 A/V Binding · Lip-Sync Skew Clamped <=80ms"]
    end
```

### 3.3 Millisecond-Level Multimodal Avatar `RFC 7941` `0-RTT` Binding & Privacy Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Pod as Internal AI Avatar Render Pod
    participant SFU as Edge WebRTC SFU Gateway (P925+P926 🎉 Gate)
    participant Client as Client Browser (Playout Sync)

    Pod->>SFU: 1. Initial Audio/Video RTP + RTCP SDES (CNAME="worker@10.0.4.12", TOOL="v1.2", Skew=240ms)
    Note over SFU: 🛡️ P925 Privacy Sanitizer: Strips TOOL/NAME/PRIV & Rewrites Static CNAME<br/>to 128-bit Per-Session CSPRNG CNAME ("q9Lm4xK2pR8vT1nZ")<br/>🛡️ P926 🎉 0-RTT Sync: Embeds Cryptex RFC 7941 sdes:cname on First Packets<br/>and Clamps A/V Lip-Sync Skew Tolerance from 240ms to <=80ms
    SFU->>Client: 2. Frame-1 Audio RTP (SSRC=0xA1, Cryptex ext: sdes:cname="q9Lm4xK2pR8vT1nZ")
    SFU->>Client: 3. Frame-1 Video RTP (SSRC=0xV1, Cryptex ext: sdes:cname="q9Lm4xK2pR8vT1nZ")
    Note over Client: 0-RTT Immediate Binding of 0xA1 & 0xV1 Sync Context<br/><=80ms Frame-1 Lip-Sync with Zero Internal IP Exposure!
```

---

## ④ 📊 Architect Decision Matrix (`SDES CNAME` Privacy & Lip-Sync Architecture)

| Architecture Option | Target Scenario | Pros | Cons & Production Traps | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Legacy `RFC 3550` `user@host` Static `CNAME` + Periodic `RTCP`-Only Binding** | Prohibited in all production networks | Legacy RTP library default | **Leaks internal Pod/VLAN IPs + `240ms` opening lip-sync lag** while waiting `500–1,500ms` for periodic `RTCP` | ⛔ **Never in Production** |
| **Option B: Static Hash `CNAME` (`SHA256(MAC)`) Without `RFC 7941`** | Closed internal lab | Masks literal IPv4 strings | **Violates `RFC 7022 / RFC 8828` anti-tracking rules** (acts as a permanent cross-session supercookie) and still suffers opening lip-sync lag | ⚠️ **Non-Compliant** |
| **Option C: `RFC 7022` `[96, 128]`-bit Ephemeral CSPRNG `CNAME` + Non-`CNAME` Strip + `RFC 7941` `0-RTT` Binding & `[15, 80]ms` Lip-Sync Cap (`P925 + P926 🎉`)** | **All Multimodal AI Digital-Human Agents, Video KYC, Telehealth & Enterprise WebRTC Gateways** | **Zero internal IP/PII leak, zero cross-session tracking, `0-RTT` Frame-1 A/V binding, `<=80ms` lip-sync skew** | Requires `urn:ietf:params:rtp-hdrext:sdes:cname` with `Cryptex` encryption on stream startup | ✅ **Production Mandatory (Recommended)** |

---

## ⑤ 🧪 Quantitative Walkthrough & 7-Card 4:5 Benchmark Report

### 5.1 Quantitative Example: Banking Digital-Human Video KYC Privacy & Opening Lip-Sync
- **Scenario**: A banking digital-human video KYC gateway emits `11` `RTCP SDES` packets carrying `worker@10.240.12.8` and `SDES TOOL/PRIV` metadata (`24`-bit static entropy) while experiencing `6` opening turn transitions with `240ms` audio-video lip-sync drift.
  - **Without Guardrails (Vulnerable Baseline)**:
    - External auditors extract the internal `10.240.12.0/24` subnet and server version from `RTCP SDES`;
    - Customers observe **`240ms` lip-sync lag** (exceeding `ITU-R BT.1359`'s `+125ms` limit) for the first `1.2` seconds of every avatar turn.
  - **With `P925 + P926 🎉` Deterministic Guardrails**:
    - `P925` strips all non-`CNAME` `SDES` items and rewrites `CNAME` to a **`128`-bit** per-session CSPRNG token (**`0`** PII/IP leaks);
    - `P926 🎉` (🎉 **935th Guardrail**) binds `SSRC_audio` and `SSRC_video` in `0-RTT` via `RFC 7941 sdes:cname` (**`0`** desynced streams) and clamps lip-sync skew tolerance from `240ms` to **`80ms`**.

### 5.2 7-Card 4:5 Report Mapping (`site/benchmark-cards.html` & `report.json`)
1. **Card 1 (`HANDS-ON · VOICE ARCHITECTURE`)**: 469-dimension workbench overview highlighting `P925 / P926 🎉` (110th SVG 🎉 & 935th Guardrail 🎉).
2. **Card 2 (`SCENARIO: WEBRTC RFC 7941 & RFC 7022 SDES CNAME`)**: Input probe `staticHostIpCnameOrUnauthorizedSdesPiiItemDetected=true, sdesCnameEntropyBits=24, maxAudioVideoLipSyncSkewMs=240` -> `Act automatically` clamping to `128` bits and `80ms`.
3. **Card 3 (`WHAT I TESTED`)**: Row 469 in the evaluation matrix (`PASS · 0ms @ 1ms Res (Synthetic)`, zero `✕` misses).
4. **Card 4 (`UNDER THE HOOD`)**: Deterministic contract for `evaluateWebrtcRtcpRfc7941EphemeralSdesCnamePrivacyAndPiiStripGate` & `evaluateWebrtcRtcpRfc7941RtpHeaderExtensionSdesCnameSyncAndLipSyncSkewGate`.
5. **Card 5 (`ROBUSTNESS CHECK`)**: Option-order and boundary invariance across `SDES` item types and A/V skew windows.
6. **Card 6 (`LATENCY`)**: Explicit offline timing provenance: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic`; live client playout NTP linear-regression latency is `not_measured`).
7. **Card 7 (`MY TAKE`)**: Good fit vs. Not for summary and production sign-off checklist.

---

## ⑥ 🛠️ Production Readiness Checklist

- [ ] **1. Per-Session `[96, 128]`-bit CSPRNG Ephemeral `CNAME` (`P925`)**: Verify that every WebRTC/RTP session generates a fresh `[96, 128]`-bit random `SDES CNAME` per `RFC 7022 Section 5`, containing zero usernames, hostnames, internal IPs, or MAC addresses.
- [ ] **2. 100% Stripping of Non-`CNAME` `SDES` Items (`P925`)**: Confirm that ingress/egress SFUs and SBCs strip `NAME(2)`, `EMAIL(3)`, `PHONE(4)`, `LOC(5)`, `TOOL(6)`, `NOTE(7)`, and `PRIV(8)` from all compound `RTCP SDES` packets.
- [ ] **3. `RFC 7941` First-Frame `sdes:cname` `0-RTT` Binding (`P926 🎉`)**: Ensure multimodal audio/video streams attach `urn:ietf:params:rtp-hdrext:sdes:cname` on the initial packets of new or switched SSRCs for immediate synchronization.
- [ ] **4. `RFC 9335 Cryptex` Encryption for `sdes:cname` Header Extensions (`P926 🎉`)**: Confirm that RTP header extensions carrying `sdes:cname` are encrypted via `Cryptex` so on-path observers cannot correlate media flows.
- [ ] **5. Audio-Video Lip-Sync Skew Clamped Within `[15, 80]ms` (`P926 🎉`)**: Verify that multimodal playout buffers clamp A/V `RTCP SR NTP` lip-sync skew tolerance within `[15, 80]ms` (`ITU-R BT.1359` compliant).
