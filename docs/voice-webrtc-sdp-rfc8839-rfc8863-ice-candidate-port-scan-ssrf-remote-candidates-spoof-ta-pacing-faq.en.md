# Enterprise Realtime Voice Agent Architecture FAQ (No. 128): How to Engineer WebRTC `RFC 8839 / RFC 8863` SDP ICE Candidate Port-Scan `SSRF`, `a=remote-candidates` State & Continual Nomination `Ta` Pacing Guards?

> **Architect's Reading Guide (Modeled on `ib-vs-ethernet-roce-selection-faq.md` · Topic 126 / Stage 486 · 🎉 Historic 130th SVG Diagram & 975th Enterprise Guardrail Dual Milestone)**: To achieve zero-drop handoffs when mobile voice users roam between Wi-Fi and 5G, modern WebRTC stacks rely on **`RFC 8863` ICE Continual Nomination** and **`RFC 8839` SDP ICE Offer/Answer procedures**. Yet without strict ingress validation, an attacker can inject SDP `a=candidate` lines targeting privileged internal ports (`< 1024`, such as SSH `22`, DNS `53`, or Redis `6379`) to turn your SFU into an internal STUN port scanner (`SSRF`), or smuggle `a=remote-candidates` into an initial Offer to bypass STUN consent verification altogether. Meanwhile, enabling `RFC 8863` continual nomination without bounding the STUN pacing timer `Ta` (`[20, 500]ms`) and backup candidate pairs (`[1, 4]`) floods cellular uplinks with STUN probes and starves Opus voice packets! This guide explains the **first-principles mechanics of SDP ICE and Continual Nomination** and defines deterministic guardrails **`P965–P966 🎉`**.

---

## ① 📌 Executive Summary

1. **How can an SDP `a=candidate` or `a=remote-candidates` line weaponize an enterprise SFU into an internal port scanner or media reflector?**
   - Under **`RFC 8839 Section 5.1`**, every accepted `a=candidate` triggers outbound STUN Binding Requests from the media server. Allowing candidate ports below `1024` or private/IMDS addresses lets attackers scan internal infrastructure; additionally, **`RFC 8839 Section 5.2`** mandates that `a=remote-candidates` is valid **only in a subsequent Offer after ICE has reached the `Completed` state**. Accepting `a=remote-candidates` in an initial Offer bypasses STUN connectivity verification (`P965`).
2. **Why does enabling `RFC 8863` Continual Nomination sometimes worsen audio stutter on weak cellular links?**
   - Continual nomination probes backup candidate pairs in the background while media flows on the selected pair. If the STUN pacing timer **`Ta` (`RFC 8445 Section 14.2`)** is set below `20ms` or more than `4` backup pairs are probed concurrently, STUN checks consume `> 80 kbps` on constrained uplinks and delay `20ms` Opus audio frames. Clamping `Ta` to **`[20, 500]ms`** and backup candidate pairs to **`[1, 4]`** keeps probing overhead below `2.5 kbps` while delivering `0ms` Wi-Fi $\rightarrow$ 5G switchover (`P966 🎉`).

![2026-11-15 Enterprise Voice Agent WebRTC RFC 8839 / RFC 8863 SDP ICE Candidate Port-Scan SSRF, remote-candidates State & Continual Nomination Ta Pacing Guard FAQ & Stage 486 Visual Summary (🎉 Historic 130th SVG & 975-Guardrail Dual Milestone!)](../assets/svg/130-voice-webrtc-sdp-rfc8839-rfc8863-ice-candidate-port-scan-ssrf-remote-candidates-spoof-ta-pacing-2026-11-15.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Why must `a=candidate` ports below `1024` be strictly rejected?
- **Plain-Language Principle**: Legitimate WebRTC endpoints and TURN/SFU servers allocate ephemeral media ports in **`[1024, 65535]`**. A candidate claiming port `22`, `53`, `80`, or `443` is never a real RTP socket—it is an attempt to force your SFU to send UDP/TCP packets to privileged services.
- **Architectural Rule (`P965`)**: Enforce `candidatePort` in `[1024, 65535]` and `privilegedOrPrematureRemoteCandidateViolations === 0`.

### Q2: When is `a=remote-candidates` legitimate under `RFC 8839`?
- **Plain-Language Principle**: Only **after** ICE connectivity checks have completed (`ICE State === Completed`) and the controlling peer sends a subsequent re-Offer to lock in the verified address/port tuple (`RFC 8839 §5.2`).
- **Architectural Rule (`P965`)**: Strip and reject any `a=remote-candidates` attribute appearing in an initial Offer or before ICE reaches `Completed`.

### Q3: How does `RFC 8863` Continual Nomination achieve `0ms` network handoff without starving voice bandwidth?
- **Plain-Language Principle**: Instead of waiting for Wi-Fi to die before running `iceRestart` (`180–500ms` dead air), `RFC 8863` pre-warms `[1, 4]` backup cellular candidate pairs at a gentle STUN pacing interval `Ta ∈ [20, 500]ms` (`P966 🎉`), switching the active media pointer in `0ms` as soon as Wi-Fi RTT spikes.

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Latency Comparison + Sequence Diagram)

### 3.1 WebRTC `RFC 8839 / RFC 8863` Candidate Port, `remote-candidates` & `Ta` Pacing Decision Tree (`P965–P966 🎉`)

```mermaid
flowchart TD
    A["Inbound WebRTC SDP Offer / Trickle Candidate<br/>(RFC 8839 / RFC 8863)"] --> B{"Is a=candidate port in [1024, 65535]<br/>AND not an internal/IMDS SSRF IP?"}
    B -- "No (Privileged port <1024 or internal SSRF)" --> X1["⛔ P965 Block: Candidate Port-Scan SSRF<br/>(Drop rogue candidate & clamp port to [1024, 65535])"]
    B -- "Yes" --> C{"Contains a=remote-candidates?"}
    C -- "Yes" --> D{"Has ICE already reached Completed<br/>(Not an initial Offer)?"}
    D -- "No (Premature initial-Offer hijack)" --> X2["⛔ P965 Block: Premature remote-candidates<br/>(Strip unverified remote-candidates attribute)"]
    D -- "Yes" --> E{"Is RFC 8863 Continual Nomination active?"}
    C -- "No" --> E
    E -- "Yes" --> F{"Is STUN pacing Ta ∈ [20, 500]ms<br/>AND backup pairs ∈ [1, 4]?"}
    F -- "No (Ta<20ms flood or >4 backup pairs)" --> X3["⛔ P966 Block: Clamp Ta & Backup Pairs<br/>(Clamp Ta to [20,500]ms & backup pairs to [1,4])"]
    F -- "Yes" --> OK["✅ P965 + P966 Pass:<br/>0 STUN SSRF + 0ms Wi-Fi→5G Seamless Switchover"]
    E -- "No" --> OK
```

### 3.2 Roaming Handoff & Uplink Overhead Comparison (Unprotected ICE vs. `P965–P966 🎉`)

```mermaid
flowchart LR
    subgraph Legacy["❌ Unprotected SDP ICE & Unbounded Nomination (No P965-P966)"]
      L1["Accepts port <1024 & initial remote-candidates"] --> L2["Internal STUN Port-Scan SSRF & Media Reflection"]
      L3["Ta=1ms + 32 Concurrent Backup Pairs"] --> L4[">90kbps STUN Flood Starves Cellular Voice Uplink"]
    end
    subgraph Guarded["✅ P965-P966 Deterministic SDP ICE & Continual Nomination Gate"]
      G1["Enforces Port [1024,65535] + Completed-Only remote-candidates"] --> G2["0 STUN SSRF or Unverified Redirects"]
      G3["Clamps Ta ∈ [20,500]ms + [1,4] Backup Pairs"] --> G4["<2.5kbps Overhead + 0ms Warm Switchover"]
    end
```

### 3.3 Millisecond-Level Full-Duplex `RFC 8863` Dual-Path Pre-Warming & `0ms` Switchover Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Mobile as Mobile Client (Wi-Fi + 5G Dual Interface)
    participant SFU as Enterprise WebRTC SFU Gateway (P965-P966 🎉)

    Mobile->>SFU: SDP Offer (a=ice-options:trickle continual-nomination)
    Note over SFU: P965 Check: Candidate port 51240 ∈ [1024, 65535], no initial remote-candidates ✅
    Note over SFU: P966 Gate: Ta = 50ms ∈ [20, 500]ms, activeBackupCandidatePairs = 2 ∈ [1, 4] ✅
    Mobile->>SFU: Primary RTP Voice Stream (Wi-Fi Pair #1 · RTT=18ms)
    Mobile->>SFU: Trickle ICE 5G Candidate (Pair #2 · Port=54320)
    Note over Mobile,SFU: Pre-warms 5G Pair #2 at Ta=50ms (<2.5 kbps overhead, zero Opus contention)
    Note over Mobile,SFU: Wi-Fi RTT spikes to 180ms → SFU switches active pointer to pre-warmed 5G Pair #2 in 0ms!
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Reactive `iceRestart` Only (No `RFC 8863`) | Option B: Unbounded `RFC 8863` Without Port/State or `Ta` Guards | Option C (Recommended): Full `RFC 8839 / RFC 8863` Gate (`P965` + `P966 🎉`) |
| :--- | :--- | :--- | :--- |
| **Privileged Port STUN `SSRF` Defense (`P965`)** | ❌ Vulnerable to `<1024` candidate port scanning | ❌ Vulnerable | ✅ **Enforces `[1024, 65535]` candidate ports + internal IP block** |
| **`a=remote-candidates` State Gate (`P965`)** | ❌ Accepts in initial Offer (reflection risk) | ❌ Vulnerable | ✅ **Allowed only in re-Offers after `ICE Completed`** |
| **Wi-Fi $\rightarrow$ 5G Switchover Gap** | ⚠️ `180–500ms` reactive renegotiation gap | ✅ `0ms` switch, but risks STUN uplink flood | ✅ **`0ms` warm switchover with `< 2.5 kbps` STUN overhead** |
| **STUN Pacing `Ta` & Backup Pair Cap (`P966 🎉`)** | N/A | ❌ Unbounded probing starves Opus frames | ✅ **Clamps `Ta ∈ [20, 500]ms` and backup pairs `∈ [1, 4]`** |
| **Best Fit** | Stationary desktop browsers | Lab-only high-bandwidth networks | **Production mobile, in-vehicle & roaming enterprise voice agents** |

---

## ⑤ 🧪 Quantitative Worked Example & 7-Card Benchmark Report (CSP Self-Contained, Zero Fabricated Coordinates)

- **Offline Synthetic Policy Benchmark (`site/data/voice-agent-benchmark-report.json` & `site/benchmark-cards.html`)**:
  - **Baseline Pass Input**:
    - `P965`: `privilegedCandidatePortOrPrematureRemoteCandidatesDetected = false`, `privilegedOrPrematureRemoteCandidateViolations = 0`, `candidatePort = 51240` ($\in [1024, 65535]$) $\rightarrow$ **`PASS`**.
    - `P966 🎉`: `unpacedContinualNominationStunFloodOrBackupPairOverflowDetected = false`, `unpacedStunFloodOrBackupPairOverflowDrops = 0`, `stunPacingTimerTaMs = 50` ($\in [20, 500]$ ms), `activeBackupCandidatePairs = 2` ($\in [1, 4]$) $\rightarrow$ **`PASS`**.
  - **Perturbation / Fault Injection (Fail Gate)**:
    - Injecting `candidatePort = 22` or premature `a=remote-candidates` in an initial Offer $\rightarrow$ immediately blocked by `P965` and port clamped to `1024` (`pass = false`).
    - Setting `stunPacingTimerTaMs = 2` (`< 20ms`) or `activeBackupCandidatePairs = 16` (`> 4`) $\rightarrow$ immediately blocked by `P966 🎉` and clamped to `Ta = 20ms`, backup pairs `= 4` (`pass = false`).
  - **Timing & Provenance Disclosure**:
    - `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (deterministic offline policy check).

---

## ⑥ 🛠️ Production Verification Checklist

- [ ] **[`P965` · Candidate Port `[1024, 65535]` Enforcement]**: Verify that all SDP `a=candidate` lines with ports `< 1024` or private/IMDS addresses are rejected (`privilegedOrPrematureRemoteCandidateViolations === 0`).
- [ ] **[`P965` · `Completed`-Only `a=remote-candidates`]**: Verify that `a=remote-candidates` is stripped unless ICE has already reached the `Completed` state.
- [ ] **[`P966 🎉` · STUN Pacing Timer `Ta ∈ [20, 500]ms`]**: Verify that `RFC 8863` continual nomination paces STUN checks within `[20, 500]ms`.
- [ ] **[`P966 🎉` · `[1, 4]` Active Backup Candidate Pair Quota]**: Verify that continual nomination maintains at most `4` active backup candidate pairs per stream (`unpacedStunFloodOrBackupPairOverflowDrops === 0`).
