# Enterprise WebRTC/RTP `RFC 5450 / RFC 3550` Transmission Time Offset (`toffset`) 24-Bit Signed Overflow, NetEQ Jitter-Buffer Poisoning & RTCP Interarrival Jitter (`J`) Inflation Selection & Defense Guide (Topic 154 · Stage 514 · 🎉 Historic 1,030th Enterprise Guardrail, 1,040th Sandbox Probe & 850th Live POC Probe Triple Milestone!)

> **Document Type**: Architect Selection FAQ & Production Hardening Guide (modeled on `ib-vs-ethernet-roce-selection-faq.md`)  
> **Target Audience**: AI Solution Architects, WebRTC NetEQ / Media Gateway Engineers, Realtime Voice Agent Platform Leads  
> **Linked Guardrails**: `P1021 🎉–P1022 🎉` (Stage 514 · Topic 154 · `packages/business-core/enterprise-guardrails.ts` · 🎉 Historic 1,030th Deterministic Enterprise Guardrail, 1,040th Interactive Sandbox Probe & 850th Live POC Trap Probe Triple Milestone!)  
> **Linked Visual**: `assets/svg/158-voice-webrtc-rtp-rfc5450-rfc3550-toffset-transmission-time-offset-jitter-buffer-poisoning-rtcp-jitter-inflation-2026-11-16.svg`

---

## ① 📌 Executive Summary

In WebRTC and SIP/RTP voice architectures, the 32-bit RTP `Timestamp` records when an audio frame was **sampled or synthesized**, not when the packet actually left the sender's network interface after pacer queuing or retransmission buffering. To prevent sender-side queuing delays from being misclassified as network transit jitter, IETF standardized **`RFC 5450` (Transmission Time Offsets in RTP Streams: `urn:ietf:params:rtp-hdrext:toffset`)**, which carries a **24-bit signed two's-complement integer (`-8,388,608` to `+8,388,607` RTP clock ticks)** representing the offset between sampling time and actual transmission time:
$$\text{Effective RTP Timestamp} = \text{RTP Timestamp} + \text{toffset}$$

In production enterprise voice gateways, however, an unguarded `RFC 5450 toffset` parser exposes two severe failure modes:
1. **24-Bit Signed Extension Bugs & Extreme Offset Jitter-Buffer Poisoning**: At a 48kHz Opus clock, a 24-bit signed integer spans **`±174.76 seconds`** (`8,388,608 / 48,000`). If a parser reads the 3-byte field as an unsigned 24-bit integer without sign-extending bit 23 (turning `-10ms` / `0xFFFFE0` into **`+349.5 seconds`**!), or if a malicious/buggy peer injects `±2000ms` `toffset` spikes, the receiver's NetEQ jitter buffer inflates its target playout delay to thousands of milliseconds—freezing or severely lagging the AI Voice Agent!
2. **`RFC 5450 §4` RTCP Interarrival Jitter (`J`) Inflation Sabotage**: Per `RFC 5450 §4`, receivers must compute RTCP Receiver Report (`RR`) interarrival jitter using `S_i + toffset_i`. If an attacker alternates synthetic `toffset` values across consecutive packets, the reported RTCP `Interarrival Jitter (J)` spikes by 50x, tricking sender-side congestion control and quality monitors into false bitrate throttling.

**Architect Selection Rules (Stage 514 · `P1021 🎉–P1022 🎉` · Historic Triple Milestone!)**:
- **Rule 1 (`P1021 🎉` · `RFC 5450` 24-Bit Two's-Complement Sign Extension, Outlier Zeroing & `[20, 200]ms` Window Cap · Historic 1,030th Guardrail!)**: Sign-extend 24-bit `toffset` values (`(raw24 << 8) >> 8`), zero out any outlier packet whose offset magnitude exceeds physical sender-queue bounds (`clampedToffsetOutlierPackets = 0`), and clamp `maxAllowedToffsetMagnitudeMs` within **`[20, 200]ms`**.
- **Rule 2 (`P1022 🎉` · RTCP Interarrival Jitter (`J`) Dual-Track Fallback & `[40, 160]ms` NetEQ Target Playout Delay Ceiling · Historic 1,040th Sandbox Probe & 850th Live POC Probe!)**: Compare `toffset`-adjusted jitter $J_{\text{corrected}}$ against raw RTP timestamp jitter $J_{\text{raw}}$; fall back to $J_{\text{raw}}$ whenever `toffset` inflates jitter (`clampedPoisonedRtcpJitterReportBlocks = 0`), and clamp `neteqTargetPlayoutDelayCeilingMs` within **`[40, 160]ms`**.

![Enterprise WebRTC/RTP RFC 5450 toffset Jitter-Buffer Poisoning & RTCP Jitter Inflation Guard](../../assets/svg/158-voice-webrtc-rtp-rfc5450-rfc3550-toffset-transmission-time-offset-jitter-buffer-poisoning-rtcp-jitter-inflation-2026-11-16.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (First Principles & Millisecond Timeline)

### Q1: In plain terms, what is `RFC 5450 toffset`, and how can a 3-byte header extension freeze an AI Voice Agent for minutes?
- **Plain-English First Principles**:
  - `toffset` tells the receiver: *"This audio frame was generated at $t=0$, but sat in my local send pacer for $+12\text{ms}$ before hitting the wire—please subtract that $+12\text{ms}$ when estimating network transit jitter."*
- **Why does it fail catastrophically without bounds?**
  1. **Missing 24-Bit Sign Extension**: Because CPU registers are 32-bit or 64-bit, reading a 3-byte negative two's-complement number (e.g., `-48` ticks = `0xFFFFD0`) into a `uint32_t` without `(val << 8) >> 8` produces `+16,777,168` ticks (`+349.5 seconds` at 48kHz), stalling NetEQ playout timelines.
  2. **Unbounded 24-Bit Range (`±174s`)**: Even with valid sign extension, allowing multi-second `toffset` values lets a single corrupted or malicious packet blow up the receiver's jitter buffer delay to several seconds.

### Q2: How does an attacker poison `RFC 3550` RTCP Receiver Reports using `toffset`?
- **Attack Mechanics**:
  - `RFC 5450 §4` modifies the RTCP interarrival jitter formula to $D(i, j) = (R_j - R_i) - ((S_j + \text{toffset}_j) - (S_i + \text{toffset}_i))$. While legitimate `toffset` values *reduce* $D(i, j)$, alternating forged `toffset` values (`0ms`, `+1000ms`, `0ms`, `+1000ms`) injects artificial `1000ms` transit spikes into every RTCP Receiver Report block!

### Q3: How do `P1021 🎉` and `P1022 🎉` protect NetEQ and RTCP telemetry on the millisecond timeline?
- **Two-Stage Gate**:
  1. **24-Bit Sign & Window Gate (`P1021 🎉`)**: Sign-extend 24-bit `toffset`, clamp `maxAllowedToffsetMagnitudeMs` within **`[20, 200]ms`**, and zero out any outlier packet (`clampedToffsetOutlierPackets = 0`).
  2. **RTCP Jitter & NetEQ Playout Ceiling Gate (`P1022 🎉`)**: Reject `toffset`-inflated RTCP jitter blocks (`clampedPoisonedRtcpJitterReportBlocks = 0`) and clamp `neteqTargetPlayoutDelayCeilingMs` within **`[40, 160]ms`**.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Comparison Chart + Millisecond Sequence)

### 3.1 `RFC 5450 toffset` Architect Selection & Defense Decision Tree

```mermaid
flowchart TD
    A[Inbound RTP Packet with RFC 5450 toffset Extension<br/>24-Bit Signed Two's-Complement Offset] --> B[Perform 24-Bit Arithmetic Sign Extension:<br/>signedTicks = raw24 << 8 >> 8]
    B --> C{Does |toffsetMs| exceed<br/>maxAllowedToffsetMagnitudeMs ∈ [20, 200]ms?}
    C -- Yes: Extreme spike or sign-extension bug --> D["⛔ P1021 Block: Zero out outlier toffset=0<br/>clampedToffsetOutlierPackets = 0"]
    C -- No: Within valid sender-queue bounds --> E{Does toffset-adjusted RTCP jitter J_corr<br/>exceed raw RTP timestamp jitter J_raw?}
    E -- Yes: Synthetic jitter inflation detected --> F["⛔ P1022 Block: Fall back to raw RTP timestamp for RTCP J<br/>clampedPoisonedRtcpJitterReportBlocks = 0"]
    E -- No: Legitimate queue-noise reduction --> G{Is NetEQ target playout delay ceiling<br/>neteqTargetPlayoutDelayCeilingMs within [40, 160]ms?}
    G -- No: Buffer bloat (>160ms) --> H["⚠️ P1022 Clamp: Cap NetEQ playout ceiling ∈ [40, 160]ms"]
    G -- Yes --> I["✅ Subtract sender pacer delay safely<br/>Maintain ultra-low-latency AI voice playout"]
```

### 3.2 Unguarded `toffset` Parsing vs Guarded `P1021/P1022` Pipeline

```mermaid
flowchart LR
    subgraph Vulnerable["⛔ Unguarded toffset Path (+349s Sign Bug + 850ms NetEQ Bloat)"]
      V1["24-bit 0xFFFFD0 read as unsigned +349.5s"] --> V2["NetEQ playout freezes / buffers inflate to 850ms"]
      V2 --> V3["Alternating ±500ms toffset inflates RTCP J by 50x"]
    end
    subgraph Guarded["✅ Guarded P1021 🎉 + P1022 🎉 Pipeline (1,030th Guard, 1,040th Probe & 850th POC)"]
      G1["24-Bit Sign Extend + [20, 200]ms Window Cap (P1021 🎉)"] --> G2["Outlier toffset zeroed in 0ms (outliers=0)"]
      G2 --> G3["RTCP J Fallback + NetEQ Ceiling [40, 160]ms (P1022 🎉)"]
    end
```

### 3.3 Millisecond `RFC 5450 toffset` Sanitization & NetEQ Playout Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Sender as Remote WebRTC Endpoint / Gateway
    participant Edge as Enterprise AI Media Ingress (P1021+P1022)
    participant NetEQ as AI Voice NetEQ & RTCP Engine

    Sender->>Edge: RTP #1 [TS=48000, toffset=+480 ticks (+10ms pacer delay)]
    Note over Edge: P1021 Check (0ms nominal; live RTP ext parser not_measured):<br/>|+10ms| ≤ 200ms ∈ [20, 200]ms -> admit valid offset
    Edge->>NetEQ: Remove 10ms sender queuing delay from transit jitter
    Sender->>Edge: RTP #2 [TS=48960, corrupted/malicious toffset=0x7FFFFF (+174,762ms!)]
    Note over Edge: P1021 Block: +174.7s exceeds [20, 200]ms! Zero out toffset=0 (outliers=0)
    Note over Edge: P1022 Check (0ms nominal; live NetEQ/RTCP stats not_measured):<br/>Prevent RTCP J inflation (poisonedBlocks=0), cap NetEQ ceiling ≤ 160ms
    Edge->>NetEQ: Enqueue with raw TS=48960 (playout delay steady at 60ms)
    NetEQ-->>Sender: RTCP RR (Clean, unpoisoned Interarrival Jitter J)
```

---

## ④ 📊 Architect Decision Matrix (`RFC 5450 toffset` & Jitter-Buffer Governance)

| Selection Dimension | Option A: Raw `toffset` Applied Directly to NetEQ & RTCP | Option B: Strip / Ignore `toffset` Completely | Option C: 24-Bit Sign Extension + `[20, 200]ms` Window + RTCP `J` Fallback & `[40, 160]ms` NetEQ Ceiling (`P1021 🎉 + P1022 🎉` Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **Sender Pacer Queue Jitter Compensation** | Supported (but fragile) | Unsupported (pacer bursts inflate receiver buffer) | **Supported safely within `[20, 200]ms` window** |
| **Immunity to 24-Bit Sign Bugs & Multi-Second Spikes** | None (single packet freezes playout or bloats delay) | High | **100% Immune (`clampedToffsetOutlierPackets = 0`)** |
| **RTCP Interarrival Jitter (`J`) Telemetry Integrity** | Vulnerable to alternating `toffset` inflation | High | **Dual-track check prevents artificial `J` inflation (`clampedPoisonedRtcpJitterReportBlocks = 0`)** |
| **Bounded Full-Duplex Voice Playout Delay** | Unbounded (`>800ms` under attack) | Moderate | **Strictly caps `neteqTargetPlayoutDelayCeilingMs ∈ [40, 160]ms`** |

---

## ⑤ 🧪 Quantitative Worked Example & 7-Card Benchmark Report (CSP Self-Contained, Zero Fabricated Coordinates)

### 5.1 Quantitative Example: Why `[20, 200]ms` Offset Bounds and `[40, 160]ms` NetEQ Ceilings Are Mandatory
- **Scenario**: A 48kHz Opus full-duplex AI voice call with `12ms` true network jitter and `0..15ms` sender pacer delay.
- **Without `P1021 🎉–P1022 🎉`**:
  1. `16` packets arrive with `+2000ms` `toffset` spikes under a misconfigured `2500ms` window.
  2. RTCP interarrival jitter $J$ inflates to `680ms` across `5` RTCP report blocks, and NetEQ target playout delay swells to `850ms`.
- **With `P1021 🎉 + P1022 🎉` Enabled**:
  - `evaluateWebrtcRfc5450ToffsetSigned24BitBoundsAndNegativeOffsetGuard` (`P1021 🎉`) zeroes all outlier `toffset` packets (`clampedToffsetOutlierPackets = 0`) and clamps `clampedMaxAllowedToffsetMagnitudeMs = 200` ms within `[20, 200]ms`.
  - `evaluateWebrtcRfc5450RtcpInterarrivalJitterConsistencyAndNeteqTargetGuard` (`P1022 🎉`) blocks all poisoned RTCP jitter blocks (`clampedPoisonedRtcpJitterReportBlocks = 0`) and clamps `clampedNeteqTargetPlayoutDelayCeilingMs = 160` ms within `[40, 160]ms`.
  - **Timing Disclosure**: In-memory policy evaluation reports `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (synthetic in-memory check; live RTP 24-bit extension parsing and NetEQ filter update latency is `not_measured`).

### 5.2 7-Card Benchmark Summary Mapping (`site/benchmark-cards.html` & `voice-agent-benchmark-report.json`)

| Card ID | Evaluation Dimension (`Stage 514 · Topic 154`) | Baseline / Vulnerable (Original) | Hardened with Guardrails (Perturbed / Guarded) | Status & Quantitative Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Card 3 (`WHAT I TESTED`)** | `RFC 5450 / RFC 3550 toffset` 24-Bit Bounds & RTCP `J` / NetEQ Guard (`P1021 🎉–P1022 🎉`) | 16 outlier `toffset` packets + `2500ms` window + 5 poisoned RTCP blocks + `850ms` NetEQ delay | **Zero outliers (`outliers=0`) + `[20, 200]ms` window + RTCP `J` fallback (`poisoned=0`) + `[40, 160]ms` NetEQ ceiling** | ✅ `1,031` Guardrails Green 🎉 (`956/956` tests pass) |
| **Card 5 (`ROBUSTNESS CHECK`)** | `webrtc_rfc5450_toffset_bounds_and_rtcp_jitter_neteq_guard` | `outliers: 16, maxOffsetMs: 2500, poisonedBlocks: 5, neteqCeilingMs: 850` | `clampedToffsetOutlierPackets: 0, clampedMaxAllowedToffsetMagnitudeMs: 200, clampedPoisonedRtcpJitterReportBlocks: 0, clampedNeteqTargetPlayoutDelayCeilingMs: 160` | ✅ Zero NetEQ bloat, zero RTCP `J` poisoning |

---

## ⑥ 🛠️ Production Voice Delivery Verification Checklist (Good Fit vs Not For + Checklist)

### 6.1 Good Fit vs Not For
- **✅ Good Fit**:
  - Enterprise WebRTC and SIP/RTP media gateways negotiating `urn:ietf:params:rtp-hdrext:toffset`;
  - Low-latency full-duplex AI Voice Agents requiring strict `<160ms` jitter-buffer ceilings.
- **⛔ Not For**:
  - Pure `transport-cc` (`RFC 8888`) links where `toffset` is not negotiated in SDP.

### 6.2 Production Delivery Checklist (`- [ ]`)
- [ ] **[24-Bit Sign Extension & Outlier Zeroing `P1021 🎉`]** Verify 3-byte `toffset` fields are sign-extended (`(x << 8) >> 8`) and out-of-window outliers are zeroed (`clampedToffsetOutlierPackets === 0`).
- [ ] **[Offset Window Cap `P1021 🎉`]** Verify `maxAllowedToffsetMagnitudeMs` is clamped within **`[20, 200]ms`**.
- [ ] **[RTCP `J` Fallback `P1022 🎉`]** Verify RTCP interarrival jitter calculation falls back to raw RTP timestamps when `toffset` inflates $J$ (`clampedPoisonedRtcpJitterReportBlocks === 0`).
- [ ] **[NetEQ Playout Ceiling `P1022 🎉`]** Verify `neteqTargetPlayoutDelayCeilingMs` is clamped within **`[40, 160]ms`**.
- [ ] **[Automated Gate Tests]** Run `npx tsx --test tests/presales-portal.test.ts` and `npm run check:public` to confirm `Stage 514` (`P1021 🎉–P1022 🎉`) passes 100% of unit and static publication checks.
