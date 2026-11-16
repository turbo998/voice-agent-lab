# Enterprise WebRTC `RFC 8872 / RFC 8858` Multi-Stream RTP Session SSRC Loop Isolation & `a=rtcp-mux-only` Dynamic Payload-Type (`PT 64–95`) Collision Defense Guide (Stage 496 · Topic 136 · 🎉 Historic 140th SVG & 995-Guardrail Dual Milestone)

> **Navigation**: [Back to README](../README.en.md) · [中文版 (`voice-webrtc-rtp-rfc8872-rfc8858-multi-stream-ssrc-session-multiplexing-loop-rtcp-mux-only-pt-collision-faq.md`)](voice-webrtc-rtp-rfc8872-rfc8858-multi-stream-ssrc-session-multiplexing-loop-rtcp-mux-only-pt-collision-faq.md) · [2026-11-09 Daily Report](daily/2026-11-09.en.md) · [Solution Architecture](solution-architecture.en.md)

![Enterprise WebRTC RFC 8872 / RFC 8858 Multi-Stream SSRC Multiplexing Loop & rtcp-mux-only PT Collision Gate Visual Summary](../assets/svg/140-voice-webrtc-rtp-rfc8872-rfc8858-multi-stream-ssrc-session-multiplexing-loop-rtcp-mux-only-pt-collision-2026-11-16.svg)

---

## 📌 1. Executive Summary

> **Key Takeaway**: In enterprise multimodal voice agents that multiplex caller Opus audio, avatar TTS audio, screen-share video, FEC redundancy, and RTX retransmission streams over a single UDP 5-tuple (**`RFC 8872` Multi-Stream RTP Multiplexing** and **`RFC 8858` `a=rtcp-mux-only`**), legacy SFUs and SBCs encounter two subtle media-plane failures:
> 1. **Cross-Track SSRC Hijacking & Loopback Static (`RFC 8872 Section 5`)**: Within a single BUNDLEd RTP session, distinct `a=mid` media descriptions must never share an `SSRC`. If a buggy client or attacker reuses an audio `SSRC` on a video or RTX `mid`, or floods `>8` SSRCs under a single `mid`, the media router feeds `1,200-byte` video packets into the Opus audio decoder—producing deafening digital static and exhausting jitter buffers;
> 2. **Missing `a=rtcp-mux-only` ICE Overhead & Dynamic `PT 64–95` vs. RTCP Header Demux Collision (`RFC 8858` & `RFC 5761 Section 4`)**: When RTP and RTCP share a single port, the demultiplexer inspects the second byte (`M * 128 + PT`). If an RTP stream uses a payload type in `[64, 95]` and sets the Marker bit (`M=1` on the first packet of a voice talkspurt), the second byte becomes `128 + PT ∈ [192, 223]`—colliding directly with `RTCP SR (200) / RR (201) / SDES (202) / BYE (203)` and silently dropping the first syllable of every user utterance!
>
> **Deterministic Guardrails (`P985–P986 🎉` · Stage 496 · Topic 136 · 🎉 Historic 140th SVG & 995-Guardrail Dual Milestone)**:
> - **`P985` (`evaluateWebrtcRfc8872MultiStreamSsrcSessionMultiplexingAndCrossTrackLoopGate` [994th Guardrail])**: Enforces strict `SSRC -> a=mid` ownership across multi-stream RTP sessions (blocking cross-track SSRC reuse or loopback with `RTCP BYE` isolation) and clamps active SSRCs per `a=mid` within `[1, 8]` (`0` cross-track SSRC misroutings);
> - **`P986 🎉` (`evaluateWebrtcRfc8858RtcpMuxOnlyExclusiveMultiplexingAndPtCollisionGate` [🎉 995th Guardrail & 140th SVG / 1,004th Sandbox Probe / 814th Live POC Probe])**: Enforces `a=rtcp-mux-only` exclusive single-port multiplexing (eliminating `component-id=2` RTCP candidate gathering) and forbids RTP payload types in `[64, 95]`, clamping dynamic RTP payload types strictly within `[96, 127]` (`0` `M=1` talkspurt RTP/RTCP demux collisions).
> - **Offline Timing Disclosure**: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Why does reusing an `SSRC` across BUNDLEd tracks cause loud static in the voice decoder?
- **Plain-English Principle**: In a single-port BUNDLE session (`RFC 8872`), the SFU routes incoming RTP packets by looking up their 32-bit `SSRC` in a per-session table mapped to `a=mid`.
- **Architect Rule (`P985`)**: Bind each `SSRC` exclusively to a single `a=mid` until an explicit `RTCP BYE` tears it down, reject any packet whose `a=mid` extension contradicts its registered `SSRC` owner (`0` cross-track misroutings), and cap active SSRCs per `a=mid` in `[1, 8]`.

### Q2: Why does assigning `PT ∈ [64, 95]` clip the first syllable of every voice utterance under `rtcp-mux`?
- **First-Principles Math (`RFC 5761 Section 4`)**: On the first RTP packet after silence (talkspurt start), the Opus/PCM encoder sets the RTP Marker bit `M=1`. The second header byte is `(M << 7) | PT = 128 + PT`. For `PT ∈ [64, 95]`, `128 + PT` lands in `[192, 223]`, which is the exact byte range reserved for `RTCP Packet Types (192..223, including SR=200, RR=201)`. The demultiplexer misclassifies the voice talkspurt packet as a malformed RTCP packet and drops it!
- **Architect Rule (`P986 🎉`)**: Strictly forbid `PT ∈ [64, 95]` and clamp all dynamic RTP payload types within `[96, 127]` (`128 + PT ∈ [224, 255]`, `0` RTCP collisions).

### Q3: How does `RFC 8858 a=rtcp-mux-only` cut ICE setup overhead in half?
- **Architect Rule (`P986 🎉`)**: Negotiating `a=rtcp-mux-only` eliminates fallback `RTP+1` (`component-id=2`) STUN/TURN allocations, cutting ICE candidate pairs and TURN port consumption by `50%`.

---

## 🧭 3. Visual Architecture Diagrams (Decision Tree, Latency Comparison & Sequence)

### 3.1 `RFC 8872 / RFC 8858` Multi-Stream SSRC & `rtcp-mux-only` Gate Decision Tree

```mermaid
flowchart TD
    A["Inbound Multiplexed UDP Packet / SDP Offer"] --> B{"a=rtcp-mux-only Negotiated &<br/>Dynamic RTP PT Outside [64,95]?"}
    B -- "No (PT ∈ [64,95] or Missing mux-only)" --> R1["P986 🎉 Block/Remap: Enforce a=rtcp-mux-only<br/>Clamp Dynamic RTP PT ∈ [96,127] (0 RTCP Collision)"]
    B -- "Yes" --> C{"Does Packet SSRC Match Bound a=mid<br/>With Zero Loopback?"}
    C -- "No (Cross-Track SSRC / Loop)" --> R2["P985 Block: Drop Cross-Track Packet in 0ms<br/>Emit RTCP BYE & Isolate SSRC"]
    C -- "Yes" --> D{"Active SSRCs for This a=mid ∈ [1,8]?"}
    D -- "No (>8 SSRC Flood)" --> R3["P985 Clamp: Cap Active SSRCs per mid <=8<br/>Reclaim Idle Decoder Contexts"]
    D -- "Yes" --> E["Demux & Route Cleanly to Opus / Video Pipeline"]
```

### 3.2 Demux Byte-Range Isolation & ICE Overhead Comparison

```mermaid
flowchart LR
    B1["Byte 2 ∈ [192, 223]<br/>(Would Collide with PT 64..95 @ M=1)"] --> C1["Reserved Exclusively for RTCP (SR=200, RR=201)<br/>P986 🎉 Forbids RTP PT 64..95"]
    C1 --> B2["Byte 2 ∈ [224, 255]<br/>(Dynamic RTP PT ∈ [96, 127] @ M=1)"]
    B2 --> C2["P985 Enforces Unique SSRC -> mid<br/>Active SSRCs per mid ∈ [1, 8]"]
```

| Architecture Mode | ICE Candidate & TURN Port Overhead | `M=1` Talkspurt First-Packet Loss | Cross-Track `SSRC` Static Risk |
| :--- | :--- | :--- | :--- |
| **Legacy `a=rtcp-mux` + `PT 72`** | `2x` (gathers `component=2` fallback ports) | ❌ `100%` talkspurt start dropped as `RTCP SR(200)` | ❌ Video packets corrupt Opus decoder |
| **Unprotected `a=rtcp-mux-only`** | `1x` (single component) | ❌ Drops `M=1` frames if `PT ∈ [64, 95]` | ❌ Vulnerable to SSRC table flood |
| **Protected (`P985 + P986 🎉`)** | **`1x` Single-Port (50% fewer TURN ports)** | **✅ Dynamic `PT ∈ [96, 127]` (`0` demux collisions)** | **✅ `SSRC->mid` lock + `[1, 8]` cap (`0` misroutes)** |

### 3.3 Millisecond Single-Port Demux & Cross-Track SSRC Guard Sequence

```mermaid
sequenceDiagram
    participant UE as Multimodal Voice Client (UE)
    participant SFU as Enterprise WebRTC Edge SFU (P985/P986 🎉)
    participant S2S as Native S2S Voice Runtime (Opus)

    UE->>SFU: 1. SDP Offer (a=rtcp-mux-only, Audio PT=111 ∈ [96,127], mid=audio SSRC=0xA1)
    Note over SFU: P986 🎉 Verifies mux-only & PT∈[96,127]; P985 Binds 0xA1 -> mid=audio
    UE->>SFU: 2. Talkspurt Start RTP (M=1, PT=111 -> Byte2=239, SSRC=0xA1)
    SFU-->>S2S: P986 🎉 Byte2=239 Clear of RTCP[192..223], Zero First-Syllable Clipping
    UE->>SFU: 3. Buggy Video Packet Reusing Audio SSRC (mid=video, SSRC=0xA1)
    Note over SFU: P985 Detects Cross-Track SSRC Clash -> Drops Packet in 0ms
    UE->>SFU: 4. Malicious Offer with PT=72 (M=1 -> Byte2=200) & 24 SSRCs on mid=audio
    SFU-->>UE: P985/P986 🎉 Remaps Dynamic PT to [96,127] & Clamps SSRCs/mid to 8
```

---

## 📊 4. Architect Decision Matrix

| Selection Dimension | Option A: Dual-Port RTP/RTCP | Option B: Basic `a=rtcp-mux` Only | Option C: `P985 + P986 🎉` SSRC Isolation & `rtcp-mux-only` Gate (Recommended) |
| :--- | :--- | :--- | :--- |
| **RTCP Port Multiplexing** | Dual ports (`RTP` + `RTP+1`) | `a=rtcp-mux` (still allocates `component=2`) | **Strict `a=rtcp-mux-only`, `0` `component=2` ports (`P986 🎉`)** |
| **Dynamic `PT` Demux Safety** | Separate ports | ❌ `PT 64–95` collides with RTCP when `M=1` | **Dynamic `PT` clamped in `[96, 127]` (`0` RTCP collisions, `P986 🎉`)** |
| **Cross-Track SSRC Isolation** | Separate ports | ❌ Cross-`mid` SSRC reuse corrupts audio | **Strict `SSRC -> a=mid` ownership lock (`P985`)** |
| **Per-`mid` SSRC Quota** | ❌ Unbounded | ❌ Unbounded | **`[1, 8]` active SSRCs per `a=mid` (`P985`)** |

---

## 🧪 5. Quantitative Example & 7-Card Report Summary

- **Scenario Input**: A BUNDLEd WebRTC session injects `4` cross-track SSRC collisions and `24` active SSRCs under a single `mid` (`>8`), while negotiating `PT = 72` (`∈ [64, 95]`) without `a=rtcp-mux-only`, causing `6` `M=1` talkspurt RTP/RTCP demux collisions.
- **Deterministic Guardrail Output**:
  - `P985` blocks all `4` cross-track SSRC misroutings (`0` misrouted packets) and clamps active SSRCs per `mid` to `8`;
  - `P986 🎉` eliminates all `6` RTP/RTCP demux collisions in `0ms` (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`) and clamps the dynamic RTP payload type into `[96, 127]` (`96`).

---

## 🛠️ 6. Production Verification Checklist

- [ ] **[`P985` `RFC 8872` Cross-Track SSRC Lock & Quota]**: Verify unique `SSRC -> a=mid` binding across multiplexed RTP streams, immediate `RTCP BYE` isolation on collision/loopback, and `[1, 8]` active SSRCs per `a=mid`.
- [ ] **[`P986 🎉` `RFC 8858 a=rtcp-mux-only` & Dynamic `PT [96, 127]` Gate]**: Verify `a=rtcp-mux-only` single-port negotiation and ensure zero RTP payload types fall in `[64, 95]`, clamping all dynamic PTs to `[96, 127]`.
- [ ] **[Timing & Self-Contained CSP Provenance]**: Verify `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.
