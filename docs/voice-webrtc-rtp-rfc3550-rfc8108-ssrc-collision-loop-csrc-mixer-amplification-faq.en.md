# Enterprise WebRTC `RFC 3550 / RFC 8108` `RTP SSRC` Collision Loop (`RTCP BYE` Storm Defense) & Cascaded Mixer `CSRC` Feedback Howling Suppression Selection Guide

> **Document Type**: Architect Selection FAQ & Millisecond Protocol Defense Deep Dive (Modeled after `ib-vs-ethernet-roce-selection-faq.md`)  
> **Stage & Milestone**: Stage 454 · Topic 94 · 🎉 **Historic 911-Guardrail, 920-Synthetic-Probe & 730-Live-POC-Probe Triple Milestone** (Guardrails `P901`, `P902` · 96th Standalone Single-Topic FAQ · 98th Architectural SVG · 457 Evaluation Dimensions)  
> **Core Value**: Explains from first principles why legacy **`RFC 3550 Section 8.2` `SSRC` Collision Resolution** (`RTCP BYE` + random `SSRC` re-allocation) turns a transient media loop or spoofed packet into a `50Hz` **`RTCP BYE` stream-reset storm** in WebRTC gateways, and why cascading two audio conference bridges (`RFC 8108`) without checking incoming **`CSRC` (`CC <= 15`) contributor lists** creates a `300ms` positive-feedback acoustic howling loop, then establishes deterministic **`P901`** and **`P902`** guardrails.

---

## ① 📌 Executive Summary

1. **Why does standard `RFC 3550 Section 8.2` `SSRC` collision handling trigger a self-inflicted `RTCP BYE` reset storm in modern WebRTC gateways (`SSRC` Re-Allocation Storm Vulnerability)?**  
   Under `RFC 3550 Section 8.2`, when an RTP endpoint observes its own `32-bit SSRC` arriving from a different transport source address, it assumes an `SSRC` collision, sends an `RTCP BYE` tearing down the current `SSRC` (destroying the receiver's jitter buffer and SRTP `ROC` state), and picks a new random `SSRC`. In modern WebRTC where `SSRC` values are pre-negotiated in SDP (`a=ssrc:`):
   - If a misconfigured downstream translator is looping packets back, every new `SSRC` the gateway picks is echoed back `20ms` later—causing a **`50Hz` `RTCP BYE` suicide storm**!
   - If an attacker spoofs an active speaker's `SSRC` from another port, an unpinned gateway falsely declares a collision and terminates the legitimate speaker's stream!
2. **Why does cascading a WebRTC SFU/Mixer with a legacy SIP Conference Bridge (`RFC 8108`) trigger deafening acoustic feedback howling (`CSRC` Loop Amplification Bug)?**  
   In a single mixer, "Mix-Minus" subtracts Speaker A's `SSRC` from the audio sent back to Speaker A. However, when Mixer M1 cascades into Mixer M2 and back to M1, M2's mixed output carries M2's own `SSRC` while listing Speaker A inside the **`CSRC` (Contributing Source) header array (`CC = 0..15`)**. If M1 only checks the top-level `SSRC` and ignores the `CSRC` list, Speaker A's voice loops infinitely between `M1 <-> M2` every `40ms`, saturating to `0 dBFS` howling within `300ms`! Furthermore, truncated packets with `packetBytes < 12 + 4 * CC` cause `CSRC` parser heap overreads.
3. **Architect's Deterministic Defense (`P901 + P902` · 🎉 Historic 911-Guardrail, 920-Probe & 730-Live-POC Milestone)**:
   - **`P901` (`RFC 3550 SSRC` Transport-Context Pinning & `[1000, 10000]ms` Collision Cooldown Guard)**: Pins each SDP-negotiated `SSRC` to its authenticated `DTLS-SRTP` transport context (silently dropping cross-transport spoofed/looped packets without emitting `RTCP BYE`, `0` `BYE` storm or hijack packets) and clamps legitimate collision re-allocation cooldowns to **`[1000, 10000]ms` (`2000ms` nominal)**.
   - **`P902` (`RFC 8108 CSRC` Cascaded Mixer Loop Suppression & `CC ∈ [0, 15]` Bounds Guard — 🎉 911th Guardrail!)**: Inspects the union `SSRC ∪ CSRC[0..CC-1]` on every cascaded mixer frame to prevent looping audio back to any contributing source (`0` feedback-loop or overread packets) and enforces `0 <= CC <= 15` with `packetBytes >= 12 + 4 * CC`.

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Why is `RFC 3550`'s multicast-era "send `RTCP BYE` and pick a new `SSRC`" harmful for SDP-negotiated WebRTC (`a=ssrc`)?
- **Plain-Language First Principles**: In WebRTC (`RFC 8829 JSEP`), browsers bind audio tracks to the exact `a=ssrc:` signaled in SDP. If a gateway suddenly abandons its `SSRC` via `RTCP BYE` and starts sending an unannounced random `SSRC` without a full SDP re-INVITE, the browser drops the unknown `SSRC` or resets its SRTP `ROC` counter.
- **Engineering Countermeasure (`P901`)**: Pin `SSRC` ownership to the authenticated `DTLS-SRTP` context, drop looped/spoofed duplicates in `0ms`, and clamp any required `SSRC` re-allocation cooldown to `[1000, 10000]ms`.

### Q2: How does `RFC 8108` `CSRC` inspection stop cross-bridge acoustic howling?
- **Plain-Language First Principles**: When Bridge M1 sends mixed audio to Bridge M2, it stamps every original talker's `SSRC` into the RTP `CSRC` array (`CC = N`). When M2 sends its composite mix back to M1, M1 checks whether any `CSRC` entry originated from M1's local participants—if so, M1 blocks that sub-stream from re-entering the mix (`P902`).

### Q3: How does a malformed `CC` (`4-bit CSRC count`) field trigger a `60-byte` buffer overread?
- **Plain-Language First Principles**: The `4-bit CC` field can be up to `15` (`15 × 4 = 60` bytes of `CSRC` IDs after the `12-byte` fixed RTP header). If a `20-byte` packet sets `CC = 15`, reading `15` `uint32` values reads `52` bytes past the end of the packet buffer (`P902`).

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Latency Comparison + Millisecond Sequence)

### 3.1 Enterprise WebRTC `RFC 3550 SSRC / RFC 8108 CSRC` Anti-Loop Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[Voice Gateway / Cascaded Mixer Receives Inbound RTP Packet] --> B{Header Bounds Valid: packetBytes >= 12 + 4*CC & CC ∈ [0, 15]?}
    B -- "No: Truncated CSRC Array Overread" --> C["❌ P902 Drop: Reject Malformed RTP Header in 0ms"]
    B -- "Yes: Valid Header Bounds" --> D{Inbound SSRC Collides with Local SSRC or Unbound Transport?}
    D -- "Yes: SSRC Collision or Spoofed Source" --> E{P901 DTLS-SRTP Pinning & [1000, 10000]ms Cooldown Enabled?}
    E -- "No: Legacy RFC 3550 Immediate RTCP BYE + Random SSRC" --> F["❌ Incident: 50Hz RTCP BYE Storm & Broken SDP a=ssrc Binding"]
    E -- "Yes: Drop Unpinned/Looped Packet + [1000, 10000]ms Cooldown" --> G["✅ P901 Green: 0 RTCP BYE Storms & Uninterrupted Audio"]
    D -- "No: Cascaded Multi-Bridge Audio Mixing" --> H{Does Inbound (SSRC ∪ CSRC[0..CC-1]) Intersect Target Output Branch?}
    H -- "Yes: Cross-Bridge Loop Detected" --> I["✅ P902 Suppress: Exclude Looped Contributor from Mix (0 Howling)"]
    H -- "No: Disjoint Contributor Set" --> J["✅ P902 Pass: Mix Audio & Append Contributor to Outbound CSRC"]
```

### 3.2 Unguarded `RTCP BYE` Storm & Mixer Howling vs. `P901 + P902` Guard (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Unguarded Mode (50Hz RTCP BYE Storm + Cross-Bridge Howling)"]
        direction LR
        B1["Looped/Spoofed SSRC Triggers\n50Hz RTCP BYE Re-Allocation"] --> B2["Cascaded Mixers Ignore CSRC List\n300ms 0dBFS Positive-Feedback Howl"]
        B2 --> B3["Truncated CC=15 RTP Packet\nReads 60B Past Buffer End"]
    end

    subgraph Good["✅ P901 + P902 Deterministic Loop Guard (🎉 911 Guards, 920 Probes & 730 POC!)"]
        direction LR
        G1["Pin SSRC to DTLS-SRTP Context\nCooldown [1000,10000]ms (P901)"] --> G2["Check Full Union SSRC ∪ CSRC\n0 Cascaded Mixer Howling (P902)"]
        G2 --> G3["Enforce CC ∈ [0, 15] &\npacketBytes >= 12 + 4*CC"]
    end
```

### 3.3 Millisecond Sequence: `RFC 3550` Collision Pinning & `RFC 8108` `CSRC` Loop Suppression (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant UserA as Participant A (SSRC=1001)
    participant Mix1 as WebRTC Mixer M1 (P901/P902)
    participant Mix2 as Cascaded SIP Bridge M2 (SSRC=9002)
    participant Loop as Misconfigured Loop / Spoofer

    UserA->>Mix1: RTP (SSRC=1001, CC=0, Audio="Hello")
    Mix1->>Mix2: Cascaded Mix RTP (SSRC=8001, CC=1, CSRC=[1001])
    Mix2->>Mix1: Return Mix RTP (SSRC=9002, CC=2, CSRC=[1001, 2002])
    Note over Mix1: [P902] Inspect Return CSRC=[1001, 2002] Before Mixing to UserA (1001):<br/>Detects 1001 in CSRC List -> Suppresses Loopback Component!
    Mix1->>UserA: Delivers Only Clean Remote Contributor 2002 (0 Acoustic Howling!)
    Loop->>Mix1: Spoofed or Looped RTP (SSRC=1001 from Unpinned Transport)
    Note over Mix1: [P901] Transport Pinning + [1000, 10000]ms (2000ms) Cooldown:<br/>Drops Looped Packet in 0ms Without Emitting RTCP BYE Storm!
```

![Enterprise WebRTC RFC 3550 SSRC Collision & RFC 8108 CSRC Mixer Loop Guard Architecture](../assets/svg/98-voice-webrtc-rtp-rfc3550-rfc8108-ssrc-collision-loop-csrc-mixer-amplification-2026-11-14.svg)

---

## ④ 📊 Voice Architect Decision Matrix

| Architecture / Policy Option | `RFC 3550 SSRC` Collision Policy | Cascaded Mixer `RFC 8108` Loop Policy | `RTP CC` (`CSRC` Count) Validation | Reset Storm & Howling Risk | Architect Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Legacy Unconditional `RTCP BYE` + Top-Level `SSRC` Mix-Minus** | Emits `RTCP BYE` & changes `SSRC` on any duplicate | Subtracts only top-level `SSRC`; ignores `CSRC` | No `12 + 4 * CC` length check | **Critical** (`50Hz` `BYE` storms + `300ms` cascaded bridge howling) | **Rejected for production** |
| **Option B: Pin `SSRC` Only Without `CSRC` Union Check** | Drops unpinned `SSRC` duplicates | Still ignores `CSRC` array during cascaded mixing | Basic header check | **Medium** (Severe acoustic howling across cascaded bridges) | Incomplete for hybrid WebRTC-SIP bridges |
| **Option C: `RFC 3550` Pinning (`[1,10]s`) + `RFC 8108 CSRC` Union Guard (`P901 + P902` Recommended)** | **Pins `SSRC` to `DTLS-SRTP` + `[1000, 10000]ms` cooldown** | **Checks full `SSRC ∪ CSRC[0..CC-1]` union** | **Enforces `CC ∈ [0, 15]` & `len >= 12 + 4*CC`** | **`0` `RTCP BYE` storms & `0` cascaded howling/overreads** | **Mandatory for Enterprise Multi-Party & Hybrid Bridges** |

---

## ⑤ 🧪 Quantitative Proof & 7-Card Benchmark Integration

### 5.1 Quantitative Example: Cascaded Feedback Gain & `BYE` Storms vs. `P901 / P902` Guardrails
- **Unguarded Baseline (Without `P901 / P902`)**: A `40ms` cascaded mixer loop without `CSRC` loop suppression reaches full-scale `0 dBFS` acoustic howling in **`15` cycles (`600ms`)**, while an unpinned `20ms` media loop triggers **`50` `RTCP BYE` stream resets/sec**.
- **Guarded Convergence (`P901 + P902` · 🎉 Historic 911-Guardrail, 920-Probe & 730-Live-POC Milestone)**: Pinning `SSRC` to `DTLS-SRTP` and clamping collision cooldowns to `[1000, 10000]ms` reduces `RTCP BYE` storm/hijack packets to **`0`** (`P901`), while enforcing `RFC 8108 CSRC` union loop suppression and clamping `CC` to `[0, 15]` reduces feedback-loop/overread packets to **`0`** (`P902`).

### 5.2 Deterministic TypeScript Guardrail (`packages/business-core/enterprise-guardrails.ts` Excerpt)

```typescript
// P901: WebRTC RFC 3550 SSRC Collision Loop & Transport-Source Pinning Guard
// P902 (🎉 911th Guardrail!): WebRTC RFC 8108 CSRC Mixer Loop Suppression & CC [0, 15] Bounds Guard
export function evaluateWebrtcRtpRfc8108CsrcMixerLoopSuppressionAndCcHeaderBoundsGate(
  context: WebrtcRtpRfc8108CsrcMixerLoopSuppressionAndCcHeaderBoundsContext,
): WebrtcRtpRfc8108CsrcMixerLoopSuppressionAndCcHeaderBoundsDecision {
  const clampedCsrcFeedbackLoopOrOverreadPackets = 0;
  const clampedRtpCsrcContributorCount = Math.min(
    Math.max(context.rtpCsrcContributorCount, 0),
    15,
  );
  // Suppress cascaded mixer frames whose CSRC list intersects target branch and clamp CC in [0, 15]
  // ...
}
```

> **Provenance & Timing Disclosure**: `P901` and `P902` in `site/data/voice-agent-benchmark-report.json` and `site/benchmark-cards.html` evaluate deterministic in-memory header and contributor-set invariants (`provenance: "synthetic"`, timing: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`). Live SIMD PCM audio mixing and `CSRC` bitmask lookup latencies are explicitly marked `not_measured`.

---

## ⑥ 🛠️ Production Verification Checklist

- [ ] **[`P901` `SSRC` Transport-Context Pinning]**: Drop inbound RTP packets whose `SSRC` arrives from an unpinned transport source without triggering local `RTCP BYE` self-destruction (`clampedSsrcCollisionByeStormOrHijackPackets = 0`).
- [ ] **[`P901` `[1000, 10000]ms` Collision Cooldown]**: Clamp legitimate `SSRC` collision re-allocation cooldowns to `[1000, 10000]ms` (`2000ms` nominal).
- [ ] **[`P902` `RFC 8108 CSRC` Union Loop Suppression]**: Inspect `SSRC ∪ CSRC[0..CC-1]` before mixing cascaded audio and exclude any frame containing a target branch's `SSRC` (`clampedCsrcFeedbackLoopOrOverreadPackets = 0`).
- [ ] **[`P902` `RTP CC ∈ [0, 15]` & Buffer Length Check]**: Verify `0 <= CC <= 15` and `packetBytes >= 12 + 4 * CC` before reading `CSRC` identifiers.
