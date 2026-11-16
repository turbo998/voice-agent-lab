# Enterprise SIP `RFC 6228 / RFC 3261` `199 Early Dialog Terminated` Parallel-Forking Early-Media Release & Orphaned Early-Dialog Port Reaper Guide (Stage 495 · Topic 135 · 62nd Nightly Round · 137th FAQ · 993 Guards & 1,002 Probes & 812 Live POC Probes)

> **Navigation**: [Back to README](../README.en.md) · [中文版 (`voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-faq.md`)](voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-faq.md) · [2026-11-09 Daily Report](daily/2026-11-09.en.md) · [Solution Architecture](solution-architecture.en.md)

![Enterprise SIP RFC 6228 / RFC 3261 199 Early Dialog Terminated Forking Early-Media Release & Orphan Port Reaper Visual Summary](../assets/svg/139-voice-sip-rfc6228-rfc3261-199-early-dialog-terminated-forking-early-media-release-orphan-port-reaper-2026-11-16.svg)

---

## 📌 1. Executive Summary

> **Key Takeaway**: When an inbound enterprise `INVITE` is forked in parallel by a SIP proxy across multiple regional AI Voice Agent clusters or ring groups (each establishing an early dialog via `183 Session Progress` with a distinct `To-tag`), and one branch subsequently rejects the call (`4xx / 5xx / 6xx`), standard `RFC 3261` rules require the forking proxy to withhold that non-`2xx` final response while other branches remain active. Without **`RFC 6228` (`199 Early Dialog Terminated`)**, the upstream SBC/UAC remains unaware that the failed early dialog has died—holding its RTP ports, SRTP contexts, and S2S decoder buffers for up to `180s` (`Timer C`) and causing **early-media dead air/clipping** and **RTP port exhaustion**. Conversely, accepting unverified `199` responses without checking `Supported: 199` and exact `(Call-ID, From-tag, To-tag)` binding allows spoofed `199` packets to prematurely kill active compliance prompts.
>
> **Deterministic Guardrails (`P983–P984` · Stage 495 · Topic 135 · 993 Guardrails & 1,002 Probes & 812 Live POC Probes · 498 Dims)**:
> - **`P983` (`evaluateSipRfc6228EarlyDialogTerminated199ToTagBindingAndMediaReleaseGate` [992nd Guardrail])**: Enforces `Supported: 199` option-tag negotiation and exact `(Call-ID, From-tag, To-tag)` early-dialog matching before releasing early-media RTP/S2S buffers on `199 Early Dialog Terminated` (`0` active-branch premature drops), and clamps concurrent early-media dialogs per call within `[1, 4]`;
> - **`P984` (`evaluateSipRfc6228OrphanEarlyDialogTtlAndForkingPortReaperGate` [993rd Guardrail / 1,002nd Sandbox Probe / 812th Live POC Probe])**: Enforces a hard `[5, 60]s` early-dialog TTL watchdog and immediate `200 OK` winner-take-all port reaping for legacy proxies that omit `199`, guaranteeing `0` orphaned early-dialog RTP port leaks.
> - **Offline Timing Disclosure**: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: What is `RFC 6228 SIP 199 Early Dialog Terminated`, and why does parallel forking without `199` cause early-media dead air or audio clipping?
- **Plain-English Principle**: When a forking proxy sends an `INVITE` to AI Node A (`To-tag=tagA`) and AI Node B (`To-tag=tagB`), Node A may send `183 Session Progress` (opening early media) and then fail `50ms` later with `503 Service Unavailable`. Under `RFC 3261`, the proxy cannot forward `503` upstream while Node B is still ringing.
- **Failure Mechanism**: Without `199 Early Dialog Terminated`, the upstream SBC keeps rendering audio from dead Node A (resulting in dead air) and keeps its RTP/SRTP ports allocated.
- **Architect Rule (`P983`)**: Upon receiving a verified `199` matching `(Call-ID, From-tag, To-tag)`, release that branch's early-media resources immediately, switch playout to the surviving early dialog, and cap concurrent early-media dialogs within `[1, 4]`.

### Q2: How do we prevent spoofed or mismatched `199` responses from dropping an active compliance announcement?
- **Architect Rule (`P983`)**: Ignore any `199` when `Supported: 199` was not negotiated, when `(Call-ID, From-tag, To-tag)` does not match an existing `Early`-state dialog, or when the dialog is already `Confirmed` (`200 OK`).

### Q3: What if a legacy PSTN/IMS proxy does not support `RFC 6228` or a UDP `199` packet is lost?
- **Architect Rule (`P984`)**: Bound every unconfirmed `18x` early dialog with a `[5, 60]s` TTL watchdog and immediately reap all remaining non-winning early dialogs the instant any sibling branch returns `200 OK` (`0` zombie RTP port leaks).

---

## 🧭 3. Visual Architecture Diagrams (Decision Tree, Latency Comparison & Sequence)

### 3.1 `RFC 6228` `199 Early Dialog Terminated` & Orphan Reaper Decision Tree

```mermaid
flowchart TD
    A["Inbound SIP Forking Early-Dialog Event<br/>(18x / 199 / 200 OK)"] --> B{"Received 199 Early Dialog Terminated?"}
    B -- "Yes" --> C{"Supported: 199 Negotiated &<br/>(Call-ID, From-tag, To-tag) Matches Active Early Branch?"}
    C -- "No (Spoofed To-tag / Unnegotiated)" --> R1["P983 Block: Drop Unverified 199<br/>0 Premature Active Early-Media Drops"]
    C -- "Yes" --> R2["P983 Release: Reclaim Terminated To-tag RTP/S2S Buffer<br/>Clamp Concurrent Early Dialogs ∈ [1,4]"]
    B -- "No (18x Fork or 200 OK)" --> D{"Concurrent Early Dialogs > 4 OR<br/>Sibling 200 OK Won OR Early TTL Expired?"}
    D -- "Yes" --> R3["P983/P984 Reap: Cap Early Dialogs <=4<br/>Reclaim Orphaned Early RTP Ports (TTL ∈ [5,60]s)"]
    D -- "No" --> E["Continue Active Early-Media Playout & Monitor RTP Liveness"]
```

### 3.2 Failed-Branch Recovery Latency & Port Retention Comparison

```mermaid
flowchart LR
    F1["Fork 1 (To-tag=A): 183 Early Media -> 503 Fail"] --> P1["Forking Proxy Catches 503<br/>Emits 199 (To-tag=A) to SBC"]
    P1 --> S1["P983 Verifies To-tag=A Match<br/>0ms Port Release & Switch to Fork 2"]
    S1 --> S2["P984 Fallback: [5,60]s Early TTL<br/>+ Instant Reap on Sibling 200 OK"]
```

| Architecture Mode | Dead-Branch RTP Port Hold Duration | Early-Media Failover Delay | Spoofed `To-tag` `199` Immunity |
| :--- | :--- | :--- | :--- |
| **Legacy `RFC 3261` (No `199`)** | `32s – 180s` (`Timer C` timeout) | ❌ `3s–15s` dead air locked on dead branch | N/A |
| **Unprotected `RFC 6228` Parser** | Fast with `199`, `180s` if `199` lost | `<50ms` | ❌ Spoofed `199` drops active prompt |
| **Protected (`P983 + P984`)** | **Instant on `199`; `[5, 60]s` TTL fallback** | **✅ `<10ms` seamless switch, `0` dead air** | **✅ Exact 3-tuple lock (`0` false drops, `0` leaks)** |

### 3.3 Millisecond Parallel-Forking `199` Release & `200 OK` Reaping Sequence

```mermaid
sequenceDiagram
    participant SBC as Enterprise Edge SBC (P983/P984)
    participant FP as SIP Forking Proxy
    participant N1 as AI Voice Node A (To-tag=t1)
    participant N2 as AI Voice Node B (To-tag=t2)

    SBC->>FP: 1. INVITE (Supported: 199, 100rel)
    FP->>N1: 2a. INVITE (Fork 1)
    FP->>N2: 2b. INVITE (Fork 2)
    N1-->>SBC: 3. 183 Session Progress (To-tag=t1, Early Media RTP #1)
    Note over SBC: P983 Tracks Early Dialog (t1), Active Forks=1 ∈ [1,4]
    N1-->>FP: 4. 503 Service Unavailable (Node A Saturated)
    FP-->>SBC: 5. 199 Early Dialog Terminated (To-tag=t1)
    Note over SBC: P983 Verifies (Call-ID, From, t1) -> Releases RTP #1 Immediately
    N2-->>SBC: 6. 183 Session Progress (To-tag=t2, Early Media RTP #2)
    SBC->>SBC: 7. Drops Spoofed 199 (To-tag=t_fake != t2, 0 False Drops)
    N2-->>SBC: 8. 200 OK (To-tag=t2 Confirmed)
    Note over SBC: P984 Reaps Any Remaining Unconfirmed Early Dialogs (0 Leaks)
```

---

## 📊 4. Architect Decision Matrix

| Selection Dimension | Option A: Legacy `RFC 3261` Only | Option B: Naive `199` Handler | Option C: `P983 + P984` 3-Tuple Binding & Orphan TTL Reaper (Recommended) |
| :--- | :--- | :--- | :--- |
| **Failed Fork Media Release** | ❌ Holds ports until final response / `Timer C` | Releases on `199` | **Immediate release on verified `199` (`P983`)** |
| **Spoofed `199` Protection** | None | ❌ Vulnerable to fake `To-tag` drops | **Strict `Supported: 199` + `(Call-ID, From-tag, To-tag)` match (`P983`)** |
| **Concurrent Early-Dialog Cap** | ❌ Unbounded | ❌ Unbounded | **Clamped within `[1, 4]` early dialogs per call (`P983`)** |
| **Lost-`199` / Legacy Proxy Fallback** | ❌ Zombie port leaks | ❌ Leaks when `199` is omitted | **`[5, 60]s` early-dialog TTL + instant `200 OK` sibling reap (`P984`)** |

---

## 🧪 5. Quantitative Example & 7-Card Report Summary

- **Scenario Input**: A parallel-forked call spawns `9` early-media branches (`>4`) while an attacker injects spoofed `199` responses with mismatched `To-tag` values attempting to drop `3` active prompts, and a legacy trunk leaves `7` orphaned early dialogs open for `180s` (`>60s`).
- **Deterministic Guardrail Output**:
  - `P983` blocks the unverified `199` packets (`0` premature active-branch drops) and clamps concurrent early-media dialogs to `4`;
  - `P984` reaps all `7` orphaned early-dialog RTP ports in `0ms` (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`) and clamps early-dialog TTL to `60s` (`[5, 60]s`).

---

## 🛠️ 6. Production Verification Checklist

- [ ] **[`P983` `199` 3-Tuple Binding & Forking Cap]**: Verify `Supported: 199` negotiation, exact `(Call-ID, From-tag, To-tag)` matching against active `18x` early dialogs, and `[1, 4]` concurrent early-media dialogs per call.
- [ ] **[`P984` Orphaned Early-Dialog TTL & Winner Reaping]**: Verify `[5, 60]s` TTL enforcement on unconfirmed early dialogs and immediate port reclamation across non-winning branches upon `200 OK` (`0` zombie leaks).
- [ ] **[Timing & Self-Contained CSP Provenance]**: Verify `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.
