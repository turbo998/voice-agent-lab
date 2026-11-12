# Enterprise Voice Agent Architecture Selection & First-Principles FAQ (Topic 44): WebRTC `RFC 4585 / RFC 5104` RTCP `AVPF` `NACK / PLI / FIR` Retransmission Storm Throttle (`trr-int`) & `RFC 4588 RTX` Separate `SSRC / OSN` + `apt` BWE Isolation Guard

> **中文版本**: [语音智能体架构选型与原理解析 FAQ（四十四）：WebRTC RFC 4585 / RFC 5104 RTCP AVPF NACK/PLI 重传风暴限流（trr-int）与 RFC 4588 RTX 独立 SSRC / OSN 防污染选型指南](./voice-webrtc-rtcp-avpf-nack-pli-storm-rtx-osn-apt-faq.md)  
> **Target Audience**: AI Solution Architects, WebRTC Media Transport & Packet-Loss Recovery Architects, Real-Time Avatar & Voice Gateway Leads  
> **Structural Benchmark**: Modeled strictly on `ib-vs-ethernet-roce-selection-faq.md` (6-part practitioner guide: 3-minute selection verdict, 10-minute first-principles dive into `WebRTC RFC 4585 / RFC 5104 RTCP AVPF` per-packet `NACK` retry caps `[1, 3]`, `trr-int [100, 500]ms` feedback cooldowns, and `RFC 4588 RTX` separate `SSRC` + 16-bit `OSN` + `apt` payload isolation).  
> **Provenance & Timing Disclosure**: All deterministic guardrails (`P801`, `P802`) and sandbox probes represent offline `synthetic` deterministic verification (`independently_reproduced=false`), not live WAN endpoint captures; timing adheres to: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

![WebRTC RFC 4585 AVPF NACK/PLI Retransmission Storm Gate & RFC 4588 RTX OSN/apt BWE Isolation Guard Architecture Summary](../assets/svg/48-voice-webrtc-rtcp-avpf-nack-pli-storm-rtx-osn-apt-2026-11-12.svg)

---

## 0. 🔥 Daily Real-Time Voice AI Capability Breakthroughs

1. **WebRTC `RFC 4585 / RFC 5104 RTCP AVPF` Per-Packet `NACK` Retry Cap (`[1, 3]`) & `trr-int` Cooldown Floor (`[100, 500]ms`, Stopping 17× Retransmission Storms)**: In plain English, a single `RFC 4585 Generic NACK` report contains a starting `PID` plus a 16-bit `BLP` bitmask (`0xFFFF` requests 17 packets at once). If a buggy client or attacker floods NACKs every `5ms` before the first retransmission can even traverse the network RTT, an unguarded media server re-sends the same old packets 10–20 times—multiplying outbound RTP traffic **`17×`** and starving fresh outbound Opus voice frames! Likewise, unthrottled `PLI / FIR` requests (`trr-int = 0`) force multimodal avatar encoders to emit huge `IDR` keyframes 50 times per second. Enforcing a **per-packet retry cap of `[1, 3]` spaced by `>= 1.0 × smoothedRtt`** and clamping **`trr-int` / keyframe cooldowns to `[100, 500]ms`** guarantees zero feedback amplification loops.
2. **WebRTC `RFC 4588 RTX` Dedicated Retransmission Stream (`a=ssrc-group:FID` + 16-Bit `OSN`) & `apt` Mapping (Preventing Primary-Stream Jitter & Loss Corruption)**: Re-transmitting lost RTP packets directly on the primary media `SSRC` with their old sequence numbers is a classic anti-pattern: when `Seq = 100` arrives after `Seq = 108`, the receiver's `RFC 3550` estimator interprets the `160ms` timestamp jump as massive network jitter (inflating NetEQ playout delay by `120ms+`), masks true packet loss, and violates Karn's algorithm for RTT measurement! `RFC 4588 RTX` solves this by transmitting all retransmissions on a **separate `RTX SSRC` (`a=ssrc-group:FID`)** with its own monotonic sequence number, prepending the **16-bit Original Sequence Number (`OSN`)** to the payload, and binding the RTX payload type via **`a=fmtp:<rtx-pt> apt=<media-pt>` (`[1, 8]` mappings, `primaryStreamRtxPollutions = 0`)**.

---

## ① 📌 Executive Summary

1. **Cap `RFC 4585 Generic NACK` retries to `[1, 3]` per packet (spaced by `>= 1.0 × RTT`) and clamp `trr-int` feedback / `PLI-FIR` intervals to `[100, 500]ms`**: Never retransmit the same RTP sequence number more than 3 times or faster than one round-trip time, and enforce a `[100, 500]ms` cooldown floor on RTCP feedback bursts (Guardrail **`P801`**).
2. **Never retransmit old RTP sequence numbers on the primary media `SSRC`**: Encapsulate all retransmissions in a dedicated **`RFC 4588 RTX SSRC`** (`a=ssrc-group:FID`) carrying a 16-bit **`OSN` (Original Sequence Number)** header so primary `RFC 3550` jitter and loss metrics remain 100% uncorrupted (`primaryStreamRtxPollutions = 0`, Guardrail **`P802`**).
3. **Validate `[1, 8]` `a=fmtp:<rtx-pt> apt=<media-pt>` bindings and `>= 2-byte OSN` payload length before NetEQ insertion**: Reject unmapped RTX payload types or truncated packets lacking a 2-byte `OSN` header (Guardrail **`P802`**).

---

## ② 🎯 Architect & Customer Deep-Dive Q&A

### Q1: When is basic NACK handling sufficient (Option A), and when are `P801 + P802` RTT-gated NACK caps, `trr-int` cooldowns, and separate `RFC 4588 RTX` streams mandatory (Option B)?

- **First-Principles Breakdown (How Naive Retransmission Inflates NetEQ Playout Delay by `120ms+`)**:
  - Under `RFC 3550 §6.4.1`, interarrival jitter $J$ is updated from $D(i, j) = (R_j - R_i) - (S_j - S_i)$. Injecting an old timestamp $S_{100}$ after $S_{108}$ creates an artificial $160\text{ ms}$ transit-time spike, forcing NetEQ to expand its jitter buffer and adding `120ms+` of conversational latency.
- **Selection Boundary**:
  - **Option A (Unthrottled NACK + in-place primary SSRC resend)**: Acceptable only in zero-loss local loopback tests.
  - **Option B (`P801` `[1, 3]` RTT-Gated NACK + `trr-int [100, 500]ms` + `P802` Separate `RFC 4588 RTX SSRC` + 16-Bit `OSN` & `apt [1, 8]`)**: Mandatory for all production WebRTC voice and avatar gateways.

### Q2: Why does `RFC 4588` require both a separate `SSRC` and a 2-byte `OSN` header?

- **First-Principles Breakdown**:
  - The separate `RTX SSRC` uses its own monotonically increasing RTP sequence number (`rtxSeq++`) so transport-wide congestion control (`TWCC`) and `RFC 3550` receivers can measure exact per-hop loss and RTT without ambiguity (satisfying Karn's algorithm). Once transport accounting is complete, the receiver strips the 2-byte `OSN` to place the recovered media frame into its original slot in the primary jitter buffer.

### Q3: How do the AVPF NACK throttle and RTX OSN/apt guards operate on a sub-millisecond timeline?

1. **`T = 0 ~ 0.3ms` (`P801` Inbound `AVPF NACK / PLI` Throttling)**:
   - Enforce `nackRetriesPerPacket in [1, 3]` with `nowMs - lastRetryMs >= smoothedRttMs`, and clamp `trr-int` / `PLI-FIR` cooldowns to `[100, 500]ms`.
2. **`T = 0.3 ~ 0.8ms` (`P802` `RFC 4588 RTX` Framing & Depacketization)**:
   - Prepend `2-byte OSN` on outbound retransmissions using the `FID`-paired `rtxSsrc` (`clampedPrimaryStreamRtxPollutions = 0`) and verify `rtxPayloadAptMappings in [1, 8]`.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree / Comparison / Sequence)

### 3.1 Architect Selection Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[Inbound RTCP AVPF NACK/PLI Arrives or RTP Retransmission Triggered] --> B{Inbound Feedback Gate or Outbound/Inbound RTX Framing?}
    B -->|Inbound RTCP AVPF NACK / PLI-FIR| C{Per-Packet Retries in 1..3 with >=1x RTT Spacing & trr-int in 100..500ms?}
    C -->|No: NACK Retry Flood or Unthrottled PLI| D[🔧 P801 Throttle: Cap Retries to 1..3 per Packet & Clamp trr-int to 100..500ms]
    C -->|Yes| E[✅ Fetch Cached Media Frame for Retransmission]
    D --> E

    B -->|RTP Retransmission Framing & Depacketization| F{Uses Dedicated RFC 4588 RTX SSRC with 16-Bit OSN & Valid apt Mapping?}
    F -->|No: In-Place Primary SSRC Resend or Missing OSN/apt| G[⛔ P802 Block: Forbid Primary SSRC Resend (0 Pollution); Enforce RTX SSRC + 2B OSN & 1..8 apt]
    F -->|Yes| H[✅ 100% Clean Primary Loss/Jitter Metrics & Seamless NetEQ Recovery]
```

### 3.2 Vulnerable Legacy Pipeline vs Enterprise P801+P802 Hardened Pipeline (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Vulnerable Legacy Pipeline (17x NACK Flood + In-Place Primary SSRC Jitter Spike)"]
      direction LR
      B1["Unbounded BLP=0xFFFF NACK\ntrr-int=0 PLI Storm"] -->|20x Resends + 50 IDR Frames/s| B2["Egress Socket Saturated\nLive Opus Voice Starved"]
      B3["In-Place Primary SSRC Resend\nNo 2B OSN or apt Binding"] -->|160ms Timestamp Reversal| B4["NetEQ Buffer Bloats +120ms\nLoss & RTT Metrics Ruined"]
    end

    subgraph Good["✅ Enterprise P801 + P802 Hardened Pipeline (RTT-Gated [1,3] NACK + Dedicated RTX SSRC/OSN)"]
      direction LR
      G1["[1,3] Retries + >=1x RTT Gate\n+ trr-int [100,500]ms Floor"] -->|0 NACK Storms + 0 IDR Floods| G2["Live Voice Egress Protected\nBounded Retransmit Overhead"]
      G3["Dedicated RTX SSRC (FID)\n+ 16-Bit OSN + [1,8] apt Map"] -->|0 Primary Seq Reversals| G4["100% Accurate Loss/Jitter/RTT\n40ms Low-Latency NetEQ"]
    end
```

### 3.3 Millisecond AVPF NACK Throttle & RFC 4588 RTX OSN Sequence (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client (NetEQ + RTCP AVPF)
    participant GW as Cloud Voice AI Media Gateway (P801 + P802 Gate)
    participant RTX as Ring Buffer & RFC 4588 RTX Packetizer

    GW->>Client: 1. Primary RTP (SSRC=0x11, PT=111 Opus, Seq=105) -> Lost in transit!
    GW->>Client: 2. Primary RTP (SSRC=0x11, PT=111 Opus, Seq=106) -> Arrives
    Client->>GW: 3. RTCP Generic NACK (PID=105, BLP=0x0000) + 10 duplicate NACKs 2ms later
    Note over GW: P801 approves 1st retry (1/3) & drops 10 sub-RTT duplicates<br/>Enforces trr-int [100, 500]ms cooldown!
    GW->>RTX: 4. P802 encapsulates on dedicated RTX SSRC (0 primary SSRC pollution)
    RTX-->>Client: 5. RTX Packet (SSRC=0x22, PT=96 [apt=111], RTX_Seq=501, OSN=105 + Opus frame)
    Note over Client: Primary SSRC=0x11 sequence stays monotonic<br/>Strips 2B OSN=105 & restores audio frame into NetEQ!
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: In-Place Primary SSRC Resend + Unbounded NACK (Anti-Pattern) | Option B: Disable NACK Entirely (FEC Only) | Option C: P801 RTT-Gated NACK/trr-int + P802 Dedicated RFC 4588 RTX SSRC/OSN (Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **`NACK / PLI` Flood Resilience** | ❌ `17×` retransmission flood starves live voice | ✅ Immune to NACK storms, but drops burst losses | ✅ **Capped at `[1, 3]` retries/packet with `trr-int [100, 500]ms`** |
| **Primary `RFC 3550` Jitter & Loss Accuracy** | ❌ Corrupted (`+120ms` NetEQ buffer inflation) | ✅ Clean metrics | ✅ **`0` primary SSRC sequence reversals (`primaryStreamRtxPollutions = 0`)** |
| **Karn's Algorithm RTT Fidelity** | ❌ Ambiguous original vs. retransmit acks | ✅ Unambiguous | ✅ **Separate `RTX SSRC` + monotonic `RTX Seq` preserves exact RTT** |
| **Multi-Codec `apt` Depacketization Safety** | ❌ No `apt` validation | N/A | ✅ **Validates `[1, 8]` `apt` bindings and 16-bit `OSN` header** |

---

## ⑤ 🧪 Quantitative Worked Example & Benchmark Insights (7-Card Report)

### 5.1 Quantitative Example: Stopping `17×` NACK Amplification & `+120ms` Jitter Buffer Bloat

- **Unprotected Pipeline (Option A)**:
  - A single `Generic NACK` with `BLP = 0xFFFF` re-sent 10 times within one RTT amplifies bandwidth `170×` per NACK burst, while re-injecting `80ms`-old timestamps onto the primary `SSRC` bloats NetEQ target delay from `40ms` to `160ms+`.
- **Hardened Pipeline (`P801` + `P802`, Option C)**:
  - `P801` clamps `clampedNackRetriesPerPacket` in `[1, 3]` and `clampedTrrIntFloorMs` in `[100, 500]ms`;
  - `P802` enforces `clampedPrimaryStreamRtxPollutions = 0` and clamps `clampedRtxPayloadAptMappings` in `[1, 8]`.

### 5.2 Deterministic Guardrail API Contract (`P801` & `P802`)

```ts
import {
  evaluateWebrtcRfc4585Rfc5104AvpfNackPliStormAndTrrIntGate,
  evaluateWebrtcRfc4588RtxOsnAptIsolationAndBwePollutionGate,
} from "../packages/business-core/enterprise-guardrails";

const nackAudit = evaluateWebrtcRfc4585Rfc5104AvpfNackPliStormAndTrrIntGate({
  nackPliRetransmissionStormOrTrrIntBypassDetected: true,
  nackRetriesPerPacket: 12,
  trrIntFloorMs: 10,
});
// => nackAudit.violated === true, policyId === "P801...", clampedNackRetriesPerPacket === 3, clampedTrrIntFloorMs === 100

const rtxAudit = evaluateWebrtcRfc4588RtxOsnAptIsolationAndBwePollutionGate({
  rtxOnPrimarySsrcOrMissingOsnAptDetected: true,
  primaryStreamRtxPollutions: 5,
  rtxPayloadAptMappings: 0,
});
// => rtxAudit.violated === true, policyId === "P802...", clampedPrimaryStreamRtxPollutions === 0, clampedRtxPayloadAptMappings === 1
```

---

## ⑥ 🛠️ Appendix: Production Voice Delivery Verification Checklist (Architect Checklist)

- [ ] **[P801 Per-Packet `NACK` `[1, 3]` Cap & `>= 1.0 × RTT` Spacing]**: Verify each lost RTP sequence number is retransmitted at most `3` times and spaced by at least one smoothed RTT.
- [ ] **[P801 `RFC 4585 trr-int [100, 500]ms` Cooldown Floor]**: Confirm RTCP feedback and `PLI/FIR` keyframe requests obey a `100–500ms` minimum interval.
- [ ] **[P802 Dedicated `RFC 4588 RTX SSRC` (`a=ssrc-group:FID`)]**: Confirm zero retransmissions are sent on the primary media `SSRC` (`primaryStreamRtxPollutions = 0`).
- [ ] **[P802 16-Bit `OSN` Header & `apt [1, 8]` Binding Validation]**: Confirm RTX packets carry a 2-byte `OSN` header and match a negotiated `a=fmtp:<rtx-pt> apt=<media-pt>` mapping.
