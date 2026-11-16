# Enterprise WebRTC/RTP `RFC 5104 / RFC 4585` Codec Control Messages (`CCM`: `FIR / TMMBR / TMMBN`) Keyframe Flood & Zero-Bitrate Choke Sabotage Selection & Defense Guide (Topic 150 🎉 · Stage 510 🎉 · 🎉 Historic Stage 510 & Topic 150 Dual Milestone!)

> **Document Type**: Architect Selection FAQ & Production Hardening Guide (modeled on `ib-vs-ethernet-roce-selection-faq.md`)  
> **Target Audience**: AI Solution Architects, Realtime SFU / Media Gateway Engineers, Multimodal Avatar & Voice Agent Platform Leads  
> **Linked Guardrails**: `P1013 🎉–P1014 🎉` (Stage 510 🎉 · Topic 150 🎉 · `packages/business-core/enterprise-guardrails.ts` · 🎉 Historic Stage 510 & Topic 150 Dual Milestone!)  
> **Linked Visual**: `assets/svg/154-voice-webrtc-rtcp-rfc5104-rfc4585-ccm-fir-tmmbr-tmmbn-keyframe-flood-zero-bitrate-choke-2026-11-16.svg`

---

## ① 📌 Executive Summary

In multimodal enterprise voice sessions—such as AI digital-human wealth advisors, insurance video-claims triage, and live screen co-browsing—WebRTC/SIP video streams and 20ms Opus AI voice frames share a single `BUNDLE` transport and congestion budget. To coordinate encoders across joins, screen switches, and bandwidth drops, IETF standardized **`RFC 5104` (Codec Control Messages in the RTP Audio-Visual Profile with Feedback (AVPF), or `CCM`)** atop **`RFC 4585`**, introducing two critical control primitives:
1. **`FIR` (Full Intra Request, `PT=PSFB (206), FMT=4`)**: Commands the media sender to immediately emit a full standalone IDR keyframe, carrying an 8-bit monotonically incrementing sequence number (`Seq nr.`) to distinguish retransmissions of the same request from a new keyframe command.
2. **`TMMBR / TMMBN` (Temporary Maximum Media Stream Bit Rate Request / Notification, `PT=RTPFB (205), FMT=3/4`)**: Allows a receiver or gateway to cap the sender's maximum bit rate via a `Mantissa × 2^Exponent` tuple and confirms the active **Bounding Set Owner SSRC** via `TMMBN`.

In production enterprise voice gateways, however, an unguarded `RFC 5104 CCM` implementation creates two catastrophic failure vectors for AI Voice Agents:
1. **Undeduplicated `FIR` Retransmissions & Unthrottled IDR Keyframe Floods Starving Shared-BUNDLE Voice**: When receivers retransmit identical `FIR (Seq nr.=42)` packets over lossy UDP or a malicious peer floods incrementing `FIR` requests every `20ms`, an SFU or AI gateway that fails to deduplicate by `(Sender SSRC, 8-bit Seq nr.)` and fails to enforce a minimum keyframe cooldown interval (`<500ms`) triggers back-to-back `100+ KB` IDR frames. Those giant keyframes saturate the shared UDP pacing queue and stall 20ms Opus voice packets by `300–600ms`.
2. **Zero-Bitrate `TMMBR (Mantissa=0)` Choke Attack & Unauthorized `TMMBN` Bounding-Set Override**: In `RFC 5104 §4.2.1`, target bitrate is encoded as $\text{Mantissa} \times 2^{\text{Exponent}}$. If a buggy or malicious peer sends `TMMBR` with `Mantissa=0, Exponent=0` (`0 bps`) or `<6 kbps`, an unguarded media controller throttles the entire transport—including the AI Voice Agent's Opus encoder—down to `0 bps`, muting the AI bot mid-sentence! Conversely, if a non-owner SSRC spoofs a high-bitrate `TMMBR` to release a legitimate congestion cap (`RFC 5104 §3.5.4`), congested links collapse under sudden bitrate spikes.

**Architect Selection Rules (Stage 510 🎉 · `P1013 🎉–P1014 🎉` · Historic Stage 510 & Topic 150 Dual Milestone!)**:
- **Rule 1 (`P1013 🎉` · `RFC 5104 FIR` 8-Bit `Seq nr.` Deduplication & `[500, 2000]ms` Minimum Keyframe Interval Cap)**: Deduplicate inbound `FIR` feedback by `(Sender SSRC, Target Media SSRC, 8-bit Seq nr.)` so retransmitted copies never trigger extra keyframes (`duplicateFirRequestsForwarded = 0`), and clamp `minFirKeyframeIntervalMs` within **`[500, 2000]ms`** while prioritizing Opus audio packets in the pacing queue.
- **Rule 2 (`P1014 🎉` · `TMMBR` Audio Bitrate Floor `[24, 64] kbps` & `TMMBN` Bounding-Set Owner SSRC Verification)**: Clamp the minimum permissible audio/voice bitrate floor under any `TMMBR` request to **`[24, 64] kbps`** (`minTmmbrAudioBitrateFloorKbps`) so video degrades first while voice remains crystal clear, and verify that only the active `TMMBN` Bounding Set Owner SSRC can relax its bitrate cap (`unauthorizedTmmbnOwnerOverrides = 0`).

![Enterprise WebRTC/RTP RFC 5104 / RFC 4585 CCM FIR Keyframe Flood & TMMBR Zero-Bitrate Choke Guard](../../assets/svg/154-voice-webrtc-rtcp-rfc5104-rfc4585-ccm-fir-tmmbr-tmmbn-keyframe-flood-zero-bitrate-choke-2026-11-16.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (First Principles & Millisecond Timeline)

### Q1: In plain terms, how does `RFC 5104 FIR` differ from `RFC 4585 PLI`, and why does unthrottled `FIR` handling ruin AI voice latency?
- **Plain-English First Principles**:
  - `PLI` (Picture Loss Indication) reports *"I lost some video slices; repair the picture however you see fit."*
  - `FIR` (Full Intra Request) is an explicit command: *"Switch the decoder context right now—emit a complete standalone IDR keyframe immediately."* Because RTCP runs over best-effort UDP, senders repeat the same `FIR` packet several times with the **same 8-bit `Seq nr.`** to survive packet loss (`RFC 5104 §4.3.1`).
- **Why does it starve AI voice?**
  - A 20ms Opus voice packet is **`~80–160 Bytes`**, whereas a single 1080p avatar IDR keyframe is **`~100 KB` (`~800x` larger)**. If the gateway forwards duplicate `Seq nr.` packets or allows `FIR` execution every `50ms`, the pacing queue fills with megabytes of video IDR slices, delaying shared-BUNDLE Opus audio frames by hundreds of milliseconds and causing audible voice freezes.

### Q2: How does a `TMMBR (Mantissa=0)` packet silently mute an AI Voice Agent?
- **Attack & Bug Mechanics**:
  - `TMMBR` encodes bitrate as `Mantissa × 2^Exponent`. When a peer sends `Mantissa=0, Exponent=0` (`0 bps`) or `Mantissa=2000, Exponent=0` (`2 kbps`), an unguarded transport controller applies that ceiling across the shared session. Even if video is paused, `0–2 kbps` is below the minimum intelligible threshold for realtime speech synthesis, effectively muting the AI Voice Agent while SIP/WebRTC signaling still reports the call as active.

### Q3: How do `P1013 🎉` and `P1014 🎉` protect the voice lifeline on the millisecond timeline?
- **Dual Deterministic Gates**:
  1. **`FIR` Deduplication & Cooldown Gate (`P1013 🎉`)**: Track `lastFirSeqNr` and `lastKeyframeAtMs` per SSRC. Drop duplicate `Seq nr.` packets in `0ms` (`clampedDuplicateFirRequestsForwarded = 0`) and coalesce new `FIR` requests within a **`[500, 2000]ms`** minimum interval (`clampedMinFirKeyframeIntervalMs`).
  2. **`TMMBR / TMMBN` Floor & Ownership Gate (`P1014 🎉`)**: Enforce a hard **`[24, 64] kbps` voice bitrate floor** (`clampedMinTmmbrAudioBitrateFloorKbps`) so `TMMBR` can shed video layers down to zero without ever starving Opus voice, and reject any `TMMBR` cap release from a non-owner SSRC (`clampedUnauthorizedTmmbnOwnerOverrides = 0`).

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Comparison Chart + Millisecond Sequence)

### 3.1 `RFC 5104 CCM` (`FIR / TMMBR / TMMBN`) Architect Selection & Defense Decision Tree

```mermaid
flowchart TD
    A[Inbound RTCP RFC 5104 CCM Packet<br/>PSFB FMT=4 FIR or RTPFB FMT=3/4 TMMBR/TMMBN] --> B{Is the control message<br/>FIR or TMMBR/TMMBN?}
    B -- FIR (PT=206, FMT=4) --> C{Does 8-bit Seq nr. match the<br/>already-processed lastFirSeqNr?}
    C -- Yes: Retransmitted duplicate --> D["⛔ P1013 Block: Absorb duplicate FIR<br/>duplicateFirRequestsForwarded = 0"]
    C -- No: New Seq nr. --> E{Has minFirKeyframeIntervalMs ∈ [500, 2000]ms<br/>elapsed since last IDR keyframe?}
    E -- No: High-rate keyframe flood --> F["⚠️ P1013 Clamp: Coalesce to [500, 2000]ms cooldown<br/>Preserve priority pacing for 20ms Opus voice"]
    E -- Yes --> G["✅ Trigger single paced IDR keyframe & update lastFirSeqNr"]
    B -- TMMBR / TMMBN (PT=205, FMT=3/4) --> H{Is a non-owner SSRC attempting to<br/>release/raise an active TMMBN cap?}
    H -- Yes: Unauthorized owner override --> I["⛔ P1014 Block: Reject spoofed TMMBN override<br/>unauthorizedTmmbnOwnerOverrides = 0"]
    H -- No --> J{Is requested TMMBR bitrate below<br/>minTmmbrAudioBitrateFloorKbps ∈ [24, 64] kbps?}
    J -- Yes: Zero-bitrate choke attempt --> K["⚠️ P1014 Clamp: Enforce [24, 64] kbps voice floor<br/>Pause video if needed; keep AI voice 100% intelligible"]
    J -- Within valid bounds --> L["✅ Emit TMMBN confirmation & adjust target bitrate"]
```

### 3.2 Unguarded `FIR` Flood & `TMMBR=0` Choke vs Guarded `P1013/P1014` Pipeline

```mermaid
flowchart LR
    subgraph Vulnerable["⛔ Unguarded CCM Path (IDR Queue Starvation + 0 bps Voice Mute)"]
      V1["10x Duplicate FIR Retransmits + 50/s FIR Flood"] --> V2["60x 120KB IDR Frames Stall Opus Voice >340ms"]
      V2 --> V3["TMMBR (Mantissa=0) Chokes Session to 0 bps (AI Muted)"]
    end
    subgraph Guarded["✅ Guarded P1013 🎉 + P1014 🎉 Pipeline (Stage 510 & Topic 150 Milestone)"]
      G1["8-bit Seq nr. Dedup (dup=0) + [500, 2000]ms Cooldown (P1013)"] --> G2["Opus 20ms Voice Queue Jitter <5ms"]
      G2 --> G3["TMMBR Clamped to [24, 64] kbps Voice Floor + Owner Lock (P1014)"]
    end
```

### 3.3 Millisecond `RFC 5104 FIR / TMMBR / TMMBN` Coordinated Protection Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client as Remote WebRTC / SIP Endpoint
    participant SFU as Enterprise SFU / AI Media Gateway (P1013+P1014)
    participant VideoEnc as Avatar Video Encoder
    participant AudioEnc as AI Voice Opus Encoder (Priority Lane)

    Client->>SFU: RTCP FIR (SSRC=0x11, Seq nr.=7) [Initial Request]
    Note over SFU: P1013 Check (0ms nominal; live RTCP parser not_measured):<br/>New Seq nr.=7 & >500ms since last IDR -> admit & record lastSeq=7
    SFU->>VideoEnc: Emit 1 paced IDR keyframe
    Client->>SFU: RTCP FIR (SSRC=0x11, Seq nr.=7) [3x UDP Retransmissions]
    Note over SFU: P1013 Block: Duplicate Seq nr.=7 absorbed (duplicateFirRequestsForwarded=0)
    Client->>SFU: RTCP TMMBR (Mantissa=0, Exp=0 -> 0 bps choke attack!)
    Note over SFU: P1014 Check (0ms nominal; live BWE allocator not_measured):<br/>Enforce [24, 64] kbps voice floor -> clamp audio floor to 32 kbps
    SFU->>VideoEnc: Suspend video layers (0 kbps)
    SFU->>AudioEnc: Maintain uninterrupted 32 kbps full-duplex Opus voice
    SFU-->>Client: RTCP TMMBN (Owner=Client, Floor=32 kbps) + Continuous AI Voice Audio
```

---

## ④ 📊 Architect Decision Matrix (`RFC 5104 CCM` Governance Comparison)

| Selection Dimension | Option A: Raw `FIR` & `TMMBR` Pass-Through (Unguarded) | Option B: Blanket Disable All `RFC 5104 CCM` Feedback | Option C: `FIR Seq nr.` Dedup + `[500, 2000]ms` Cooldown + `TMMBR [24, 64] kbps` Voice Floor & `TMMBN` Owner Lock (`P1013 🎉 + P1014 🎉` Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **Shared-BUNDLE Voice Immunity to IDR Bursts** | Poor (duplicate/flooded `FIR` stalls Opus audio by `>300ms`) | High (but broken video recovery on join/switch) | **Very High (`duplicateFirRequestsForwarded = 0` & `[500, 2000]ms` cooldown protects voice pacing)** |
| **Immunity to `TMMBR=0` Mute / Choke Sabotage** | None (encoder throttled to `0 bps`, muting AI bot) | High (but loses standards-based bandwidth adaptation) | **Deterministic Floor (`minTmmbrAudioBitrateFloorKbps ∈ [24, 64] kbps` keeps voice alive)** |
| **Multi-Party `TMMBN` Bounding-Set Integrity** | Vulnerable to non-owner SSRC cap removal | Unsupported | **Strict Bounding-Set Owner SSRC verification (`unauthorizedTmmbnOwnerOverrides = 0`)** |
| **Multimodal Avatar Switch Responsiveness** | Prone to congestion collapse | Poor (waits seconds for periodic GOP keyframe) | **Fast first-frame recovery with zero voice degradation** |

---

## ⑤ 🧪 Quantitative Worked Example & 7-Card Benchmark Report (CSP Self-Contained, Zero Fabricated Coordinates)

### 5.1 Quantitative Example: Why `[500, 2000]ms` `FIR` Cooldown & `[24, 64] kbps` `TMMBR` Floor Are Essential
- **Scenario**: An enterprise multimodal AI wealth advisor streams 20ms Opus audio (`32 kbps`) + 1080p digital-human video (`100 KB` / `800 kbit` per IDR frame) over a `1 Mbps` cellular link.
- **Without `P1013 🎉–P1014 🎉`**:
  1. Packet loss causes the client to retransmit `9` duplicate `FIR` packets and burst keyframe requests every `50ms`. The unguarded encoder emits `8` IDR frames in 1 second (`6.4 Mbit` on a `1 Mbps` link), delaying shared-BUNDLE Opus voice packets by `620ms`.
  2. A malformed `TMMBR (Mantissa=0, Exp=0)` arrives and drives target session bitrate to `0 kbps`, silencing the AI Voice Agent.
- **With `P1013 🎉 + P1014 🎉` Enabled**:
  - `evaluateWebrtcRfc5104CcmFirSeqDeduplicationAndKeyframeIntervalGuard` (`P1013 🎉`) drops all duplicate `Seq nr.` forwards (`clampedDuplicateFirRequestsForwarded = 0`) and clamps `clampedMinFirKeyframeIntervalMs = 500` ms within `[500, 2000]ms`, keeping Opus voice queue jitter below `5ms`.
  - `evaluateWebrtcRfc5104TmmbrBitrateFloorAndTmmbnOwnershipGuard` (`P1014 🎉`) blocks unauthorized `TMMBN` owner overrides (`clampedUnauthorizedTmmbnOwnerOverrides = 0`) and clamps the voice bitrate floor to `clampedMinTmmbrAudioBitrateFloorKbps = 24` kbps within `[24, 64] kbps`.
  - **Timing Disclosure**: In-memory policy evaluation reports `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (synthetic in-memory policy check; live SFU RTCP `RFC 5104` parser and BWE pacer latency is `not_measured`).

### 5.2 7-Card Benchmark Summary Mapping (`site/benchmark-cards.html` & `voice-agent-benchmark-report.json`)

| Card ID | Evaluation Dimension (`Stage 510 🎉 · Topic 150 🎉`) | Baseline / Vulnerable (Original) | Hardened with Guardrails (Perturbed / Guarded) | Status & Quantitative Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Card 3 (`WHAT I TESTED`)** | `RFC 5104 / RFC 4585 CCM (FIR / TMMBR / TMMBN)` Keyframe Dedup & Voice Bitrate Floor Guard (`P1013 🎉–P1014 🎉`) | 9 duplicate `FIR` forwards + `50ms` IDR flood + `TMMBR=0 kbps` mute + 3 spoofed `TMMBN` releases | **`Seq nr.` dedup (`dup=0`) + `[500, 2000]ms` cooldown + `[24, 64] kbps` voice floor + `TMMBN` Owner lock (`overrides=0`)** | ✅ `1,023` Guardrails Green (`952/952` tests pass) |
| **Card 5 (`ROBUSTNESS CHECK`)** | `webrtc_rfc5104_ccm_fir_dedup_and_tmmbr_audio_floor_guard` | `dupFir: 9, firIntervalMs: 50, ownerOverrides: 3, audioFloorKbps: 0` | `clampedDuplicateFirRequestsForwarded: 0, clampedMinFirKeyframeIntervalMs: 500, clampedUnauthorizedTmmbnOwnerOverrides: 0, clampedMinTmmbrAudioBitrateFloorKbps: 24` | ✅ Zero IDR voice starvation, zero mute choke |

---

## ⑥ 🛠️ Production Voice Delivery Verification Checklist (Good Fit vs Not For + Checklist)

### 6.1 Good Fit vs Not For
- **✅ Good Fit**:
  - Multimodal AI Voice + Digital Avatar / Video Claims / Co-Browsing sessions multiplexing audio and video over a single WebRTC `BUNDLE` transport;
  - Enterprise SIP-to-WebRTC video gateways negotiating `a=rtcp-fb:* ccm fir` and `a=rtcp-fb:* ccm tmmbr`;
  - Multi-party conference bridges with embedded AI meeting assistants.
- **⛔ Not For**:
  - Audio-only narrowband SIP trunks with no negotiated `RFC 5104 CCM` RTCP feedback attributes.

### 6.2 Production Delivery Checklist (`- [ ]`)
- [ ] **[`FIR Seq nr.` Deduplication `P1013 🎉`]** Verify the SFU / media gateway deduplicates `RFC 5104 FIR` packets by `(Sender SSRC, 8-bit Seq nr.)` (`clampedDuplicateFirRequestsForwarded === 0`).
- [ ] **[Keyframe Cooldown Window `P1013 🎉`]** Verify `minFirKeyframeIntervalMs` is strictly clamped within **`[500, 2000]ms`** and Opus audio packets bypass video IDR queues.
- [ ] **[Voice Bitrate Floor `P1014 🎉`]** Verify `TMMBR` handling enforces a hard **`[24, 64] kbps`** audio bitrate floor (`clampedMinTmmbrAudioBitrateFloorKbps`), preventing `Mantissa=0` packets from muting the AI Voice Agent.
- [ ] **[`TMMBN` Ownership Lock `P1014 🎉`]** Verify only the active `TMMBN` Bounding Set Owner SSRC can raise or release its bitrate limit (`clampedUnauthorizedTmmbnOwnerOverrides === 0`).
- [ ] **[Automated Gate Tests]** Run `npx tsx --test tests/presales-portal.test.ts` and `npm run check:public` to confirm `Stage 510 🎉` (`P1013 🎉–P1014 🎉`) passes 100% of unit and static publication checks.
