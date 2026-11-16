# Enterprise WebRTC/SIP `RFC 5583 / RFC 5888` SDP Media Decoding Dependency (`a=depend:lay/mdc`) DAG Cycle DoS & Lip-Sync (`a=group:LS`) Audio Playout Stall Defense Guide (Stage 505 🎉 · Topic 145 🎉 · 🎉 Historic Stage 505 & Topic 145 Dual Milestone!)

> **Navigation**: [Back to README](../README.en.md) · [中文版 (`voice-webrtc-sip-rfc5583-rfc5888-sdp-depend-lay-mdc-dag-cycle-group-ls-lipsync-audio-stall-faq.md`)](voice-webrtc-sip-rfc5583-rfc5888-sdp-depend-lay-mdc-dag-cycle-group-ls-lipsync-audio-stall-faq.md) · [2026-11-09 Daily Report](daily/2026-11-09.en.md) · [Solution Architecture](solution-architecture.en.md)

![Enterprise WebRTC/SIP RFC 5583 / RFC 5888 SDP a=depend DAG Acyclic Check & a=group:LS Audio Playout Hold Ceiling Gate Visual Summary](../assets/svg/149-voice-webrtc-sip-rfc5583-rfc5888-sdp-depend-lay-mdc-dag-cycle-group-ls-lipsync-audio-stall-2026-11-16.svg)

---

## 📌 1. Executive Summary

> **Key Takeaway**: In enterprise multimodal AI avatar, video banking, and telehealth sessions, scalable/layered media decoding dependencies are signaled via **`RFC 5583` (`a=depend:lay/mdc`)** while audio-video lip synchronization is governed by **`RFC 5888` (`a=group:LS`)**. Legacy multimodal gateways and playout engines suffer from two critical failure modes:
> 1. **`RFC 5583 a=depend` Circular Dependency Graph (`DAG` Cycle) & Dangling `mid:PT` Deadlock (`RFC 5583 Section 5 / 6.1`)**: `a=depend` specifies which base `mid:PT` streams must be decoded before an enhancement layer (`lay`) or multiple-description (`mdc`) stream. If an SDP offer introduces a cyclic dependency (`L1:98 -> L2:99 -> L1:98`) or references a nonexistent `mid:PT`, recursive dependency resolvers and decoder queues deadlock!
> 2. **`RFC 5888 a=group:LS` Lip-Sync Coupling Stalling Realtime Voice Playout During Video Packet Loss**: When `a=group:LS audio video` is active, naive playout synchronizers hold back already-arrived `20ms` Opus audio frames for `300ms–600ms` while waiting for a lost video keyframe to be retransmitted via `RTCP NACK`—causing severe voice stutter even when the audio stream itself has `0%` packet loss!
>
> **Deterministic Guardrails (`P1003–P1004 🎉` · Stage 505 🎉 · Topic 145 🎉 · 🎉 Historic Stage 505 & Topic 145 Dual Milestone!)**:
> - **`P1003 🎉` (`evaluateWebrtcSipRfc5583SdpDependLayMdcDagAcyclicAndDepthGate` [🎉 Historic Stage 505 & Topic 145 Dual Milestone · 1,012th Guardrail])**: Enforces topological Directed Acyclic Graph (`DAG`) validation and target `mid:PT` existence checks on `RFC 5583 a=depend` (`lay / mdc`) attributes (`SIP 488` on cycles or dangling targets, `0` dependency deadlocks), and clamps dependency chain depth within `[1, 4]`;
> - **`P1004 🎉` (`evaluateWebrtcSipRfc5888GroupLsLipSyncAudioPlayoutHoldCeilingGate` [🎉 Historic Stage 505 & Topic 145 Dual Milestone · 1,013th Guardrail / 1,022nd Sandbox Probe / 832nd Live POC Probe])**: Enforces an Audio-First playout hold ceiling on `RFC 5888 a=group:LS` lip-sync buffers—clamping maximum audio-wait-for-video delay within `[20, 80]ms` and decoupling Opus voice playout immediately when video lag exceeds `80ms` (`0` video-induced voice stalls).
> - **Offline Timing Disclosure**: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: How can a malformed `RFC 5583 a=depend` attribute deadlock a media gateway?
- **Plain-English Principle**: `RFC 5583` builds a dependency graph across `m=` lines and payload types (`a=depend:98 lay v0:96`). If the graph contains a cycle (`A -> B -> A`), any recursive decoder scheduler or SDP validator without cycle detection hangs indefinitely.
- **Architect Rule (`P1003 🎉` · Stage 505 Milestone)**: Run topological cycle detection on all `a=depend` lines, verify every referenced `mid:PT` exists, and cap dependency depth in `[1, 4]`.

### Q2: Why does `RFC 5888 a=group:LS` make a 0%-loss Opus audio stream stutter when video packets drop?
- **Plain-English Principle**: Strict lip-sync (`a=group:LS`) delays the faster stream (small `20ms` audio packets) to match the slower stream (large multi-packet video keyframes waiting on `RTCP NACK` retransmission).
- **Architect Rule (`P1004 🎉` · Topic 145 Milestone)**: Cap audio hold-for-video delay within `[20, 80]ms` (within the ITU-R BT.1359 human perception window); if video lags by `>80ms`, decouple `LS` and play audio immediately (`0` voice stalls).

### Q3: How should lip-sync resynchronize once video recovers?
- **Architect Rule (`P1004 🎉`)**: Gradually adjust playout offset by `5–10ms` during natural inter-talkspurt silence intervals rather than pitch-warping active speech.

---

## 🧭 3. Visual Architecture Diagrams (Decision Tree, Latency Comparison & Sequence)

### 3.1 `RFC 5583 / RFC 5888` Dependency DAG & Lip-Sync Decouple Decision Tree

```mermaid
flowchart TD
    A["Multimodal SDP with a=depend & a=group:LS"] --> B{"Is a=depend (lay/mdc) Graph Acyclic (DAG)<br/>& Do All Referenced mid:PT Exist?"}
    B -- "No (Cycle / Dangling mid:PT)" --> R1["P1003 🎉 [Stage 505!] Block: Return SIP 488<br/>0 Dependency Graph Deadlocks"]
    B -- "Yes" --> C{"a=depend Chain Depth ∈ [1,4]?"}
    C -- "No (>4 Deep Nesting)" --> R2["P1003 🎉 Clamp: Cap Dependency Depth <=4"]
    C -- "Yes" --> D{"Does a=group:LS Video Lag Audio by > 80ms?"}
    D -- "Yes (Video NACK Stall)" --> R3["P1004 🎉 [Topic 145!] Audio-First Decouple:<br/>Clamp Audio Hold ∈ [20,80]ms & Play Voice Immediately (0 Stalls)"]
    D -- "No (<=80ms)" --> E["Render Lip-Synced Audio & Avatar Video Smoothly"]
```

### 3.2 Audio Playout Latency Under Video Packet Loss Comparison

```mermaid
flowchart LR
    V["Video Keyframe Loss + NACK Retransmit<br/>(Video Lag Spikes to 380ms)"] --> S1["P1003 🎉 Verifies Acyclic Base-Layer DAG<br/>Depth Clamped ∈ [1, 4]"]
    S1 --> S2["P1004 🎉 [Topic 145!] Hits 80ms Hold Ceiling<br/>Decouples LS & Plays Opus Audio With Zero Stall"]
```

| Architecture Mode | `a=depend` Cycle (`L1 <-> L2`) | Voice Playout Delay When Video Lags `380ms` | Caller Experience |
| :--- | :--- | :--- | :--- |
| **Naive Strict `a=group:LS`** | ❌ Deadlocks decoder graph | ❌ `380ms+` (voice freezes waiting for video) | ❌ Robotic stuttering voice |
| **No Lip-Sync (`LS` Disabled)** | ❌ Vulnerable to `a=depend` cycle | `20ms` | Desynced avatar mouth in normal conditions |
| **Protected (`P1003 🎉 + P1004 🎉`)** | **✅ `SIP 488` DAG Verification (`0` cycles)** | **✅ Clamped in `[20, 80]ms` (`0` voice stalls)** | **✅ Lip-synced when healthy; zero voice stall under loss** |

### 3.3 Millisecond `a=depend` Cycle Block & `a=group:LS` Playout Decouple Sequence

```mermaid
sequenceDiagram
    participant UE as Multimodal Client (UE)
    participant GW as Enterprise Multimodal Gateway (P1003 🎉 / P1004 🎉)
    participant Player as Lip-Sync Playout Engine

    UE->>GW: 1. Malformed SDP Offer (a=depend:98 lay v2:99 & a=depend:99 lay v1:98 Cycle!)
    Note over GW: P1003 🎉 [Stage 505 Milestone!] Topological Sort Detects Cycle -> Returns SIP 488 in 0ms
    UE->>GW: 2. Valid SDP Offer (Acyclic DAG Depth=2 ∈ [1,4], a=group:LS audio video)
    GW->>Player: 3. Normal Network: A/V Skew 25ms ∈ [20,80]ms -> Lip-Synced Playout
    Note over GW,Player: Video Keyframe Lost -> 350ms NACK Retransmission Delay
    GW->>Player: 4. P1004 🎉 [Topic 145 Milestone!] Video Lag Hits 80ms Ceiling -> Decouples LS & Plays Opus Voice Immediately
```

---

## 📊 4. Architect Decision Matrix

| Selection Dimension | Option A: Unbounded `a=group:LS` Wait | Option B: Disable `LS` & `a=depend` | Option C: `P1003 🎉 + P1004 🎉` DAG Lock & `[20, 80]ms` Audio Hold Ceiling (Recommended) |
| :--- | :--- | :--- | :--- |
| **`RFC 5583 a=depend` Cycle Safety** | ❌ Hangs on cyclic graphs | Disabled | **Topological DAG check + `[1, 4]` depth cap (`P1003 🎉`)** |
| **Dangling `mid:PT` Validation** | ❌ Waits on missing streams | Disabled | **100% target `mid:PT` existence verification (`P1003 🎉`)** |
| **Voice Continuity Under Video Loss** | ❌ Stalls voice for `300ms+` | Continuous | **`[20, 80]ms` hold cap; instant audio decouple (`P1004 🎉`)** |
| **Normal-Network Lip-Sync** | Synced | ❌ Desynced | **Broadcast-grade ITU-R BT.1359 lip-sync (`P1004 🎉`)** |

---

## 🧪 5. Quantitative Example & 7-Card Report Summary (🎉 Stage 505 & Topic 145 Dual Milestone!)

- **Scenario Input**: An SDP offer injects `3` cyclic `a=depend` graphs with a `9`-layer dependency chain (`>4`), while `a=group:LS` lip-sync coupling holds audio playout for `420ms` (`>80ms`) during video retransmission, causing `6` voice playout stalls.
- **Deterministic Guardrail Output**:
  - `P1003 🎉` (**🎉 Historic Stage 505 & Topic 145 Dual Milestone · 1,012th Guardrail**) blocks all `3` cyclic `a=depend` graphs (`0` cycles) and clamps dependency chain depth to `4` (`[1, 4]`);
  - `P1004 🎉` (**🎉 1,013th Guardrail, 1,022nd Sandbox Probe & 832nd Live POC Probe**) eliminates all `6` video-induced voice playout stalls in `0ms` (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`, `0` stalls) and clamps maximum lip-sync audio hold delay to `80ms` (`[20, 80]ms`).

---

## 🛠️ 6. Production Verification Checklist

- [ ] **[`P1003 🎉` (Stage 505 Milestone) `RFC 5583 a=depend` Acyclic DAG & `[1, 4]` Depth Lock]**: Verify topological cycle detection and target `mid:PT` existence on all `a=depend` lines and clamp depth within `[1, 4]`.
- [ ] **[`P1004 🎉` (Topic 145 Milestone) `RFC 5888 a=group:LS` `[20, 80]ms` Audio Playout Hold Ceiling]**: Verify that `a=group:LS` never delays audio playout by more than `[20, 80]ms` when waiting for delayed video frames (`0` voice stalls).
- [ ] **[Timing & Self-Contained CSP Provenance]**: Verify `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.
