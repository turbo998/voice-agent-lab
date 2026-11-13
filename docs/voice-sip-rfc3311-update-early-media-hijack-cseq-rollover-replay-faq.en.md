# How to Defend Against Enterprise SIP `RFC 3311 UPDATE` Early-Media Target-Refresh Hijacking and `RFC 3261 CSeq` Out-of-Order / Rollover Pinning Replay (`400/500`): `Contact` Pinning, `[1, 64]` `CSeq` Jump-Step Bounds, and Anti-Zombie `BYE` Protection

> **Associated Stage**: Stage 417 (Topic 57 · 🎉 Historic 420-Dimension Milestone · `P827` / `P828`) · **Related Docs**: [中文版 (`voice-sip-rfc3311-update-early-media-hijack-cseq-rollover-replay-faq.md`)](./voice-sip-rfc3311-update-early-media-hijack-cseq-rollover-replay-faq.md) · [2026-11-09 Daily Breakthrough Report](./daily/2026-11-09.en.md) · [Solution Architecture Guide](./solution-architecture.en.md) · [Evaluation Rubric](./voice-agent-evaluation-rubric.en.md)

---

## ① 📌 Executive Summary

In the mid-dialog signaling control plane (`RFC 3311 The SIP UPDATE Method` and `RFC 3261 Section 12.2 CSeq Ordering`) of enterprise real-time voice agents (SIP contact centers, carrier IMS/VoLTE trunks, and enterprise SBC edge gateways), **transitioning a call safely from ringing (`180/183` Early Dialog) to answer (`200 OK` Confirmed Dialog) and clean termination (`BYE`) depends on two state-machine invariants: (1) `RFC 3311 UPDATE` allows modifying media parameters and refreshing the remote target (`Contact`) during an early dialog, and (2) `RFC 3261 CSeq` (e.g., `CSeq: 102 BYE`) enforces strict monotonic ordering and method-name agreement across all in-dialog requests**. When an enterprise SBC or SIP stack implements "**unconditional acceptance of `Contact` changes in early-dialog `UPDATE` requests + unbounded `CSeq` jump acceptance up to `2^{31}-1`**", three high-severity call hijacking and zombie-session vulnerabilities emerge:

1. **Early-Dialog (`180/183`) `RFC 3311 UPDATE` `Contact` Target-Refresh Hijacking & Renegotiation Floods**: Under `RFC 3311 Section 5.1`, `UPDATE` is a target-refresh request that updates the dialog's `Remote-Target URI` (`Contact` header) and SDP media session before the call is answered. Many SIP stacks harden post-answer `Re-INVITE` handling but neglect early-dialog `UPDATE` requests! An attacker or misbehaving peer injecting an early `UPDATE` with `Contact: <sip:attacker@198.51.100.66:5060>` hijacks all subsequent `200 OK / ACK / BYE` routing, while flooding `> 20` early `UPDATE` requests thrashes DSP codec allocation before answer;
2. **`CSeq` Rollover / Max-Int Jump Pinning (`CSeq: 2147483647`) Locking Out Legitimate `BYE` Requests**: Under `RFC 3261 Section 12.2.2`, whenever an in-dialog request arrives with `new_cseq > remote_cseq`, the UAS updates `remote_cseq = new_cseq` and rejects (`500 Server Internal Error`) any subsequent request with `CSeq <= remote_cseq`. If an attacker injects a single in-dialog `INFO` or `UPDATE` carrying `CSeq: 2147483647` (`2^{31}-1`) and the SBC updates `remote_cseq`, the legitimate caller's subsequent hangup `BYE (CSeq: 103)` is permanently rejected (`103 < 2147483647`), pinning the S2S voice session open as an unkillable zombie call;
3. **Request-Line vs. `CSeq` Method Mismatch Smuggling**: Sending a `BYE` request line paired with `CSeq: 105 INFO` causes stateless header filters to treat the packet as a benign `INFO` while the backend dialog engine tears down the call.

**Architect's Golden Rule (One-Line Summary)**:
> **Never allow unauthenticated or cross-source early-dialog (`180/183`) `RFC 3311 UPDATE` requests to mutate the `Contact` remote target or flood SDP renegotiations, and never accept unbounded `CSeq` jumps (`> 64`) or mismatched `CSeq` method names! Production SIP stacks must enforce two deterministic guardrails: ① `RFC 3311 UPDATE` Early-Media Target-Refresh & Rate Cap Gate (`P827`: blocks `100%` of unauthenticated or cross-tuple early-dialog `Contact` target-refresh attempts (`0` unauthorized target refreshes) and caps early-dialog `UPDATE` requests per call to `[1, 4]`); and ② `RFC 3261 CSeq` Out-of-Order / Rollover Pinning & Method-Match Gate (`P828`: rejects `Request-Line != CSeq Method` with `400 Bad Request` and `CSeq <= remote_cseq` with `500 Server Internal Error` (`0` replay/mismatch bypasses), while clamping single-request `CSeq` increments to `[1, 64]` so extreme `CSeq` jumps cannot poison `remote_cseq` and lock out legitimate `BYE` requests).**

![2026-11-13 Enterprise Voice Agent SIP RFC 3311 UPDATE Early-Media Hijack & RFC 3261 CSeq Rollover Guard FAQ & Stage 417 Visual Summary](../assets/svg/61-voice-sip-rfc3311-update-early-media-hijack-cseq-rollover-replay-2026-11-13.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A

### Q1: How can a `SIP UPDATE` sent while the phone is still ringing (`183 Session Progress`) hijack the entire call before `200 OK`?

- **First-Principles Breakdown**:
  Per `RFC 3311 Section 5.1`, `UPDATE` is a **Target-Refresh Request**—just like `Re-INVITE`, except it is explicitly permitted during an **early dialog (`180/183`)** so VoLTE/IMS endpoints can negotiate `RFC 3312` QoS preconditions before ringing completes.
  If the SBC accepts an early `UPDATE` without verifying that the source transport 5-tuple / TLS / IPsec security association matches the dialog creator, an off-path or untrusted transit hop can overwrite the dialog's `Remote-Target URI` (`Contact`) during ringing, redirecting the subsequent `200 OK`, `ACK`, and `BYE` to a blackhole.
- **Deterministic Guardrail (`P827`)**:
  - **Early-Dialog `Contact` Pinning**: Forbid changing the `Contact` host/port during an early dialog unless the request arrives over the exact authenticated TLS/IPsec association that established the dialog (`0` unauthorized target refreshes);
  - **Early-Dialog `UPDATE` Quota (`[1, 4]` per Call)**: Standard `RFC 3312` QCI-1 precondition negotiation requires `1–2` `UPDATE` exchanges; cap pre-answer `UPDATE` requests to `[1, 4]` per call.

### Q2: What is "`CSeq` Rollover Pinning", and how does a single `CSeq: 2147483647 INFO` packet prevent a caller from ever hanging up?

- **First-Principles Breakdown**:
  Under `RFC 3261 Section 12.2.2`, the UAS tracks the highest `remote_cseq` seen in a dialog and rejects any request with `CSeq <= remote_cseq` with `500 Server Internal Error`.
  If the UAS does not bound the maximum allowed step `ΔCSeq = new_cseq - remote_cseq`, an attacker who injects `CSeq: 2147483647` pins `remote_cseq` at the ceiling of signed 32-bit integers. When the real caller presses hangup (`BYE` with `CSeq: 102`), the SBC sees `102 < 2147483647` and rejects the `BYE` with `500 Out of Order`, leaving the AI voice session running until a 30-minute timer expires!
- **Deterministic Guardrail (`P828`)**:
  1. **Bounded Increment Window (`maxAllowedCseqJumpStep in [1, 64]`)**: Reject any in-dialog request where `new_cseq - remote_cseq > 64` without mutating `remote_cseq`;
  2. **Strict Replay / Regression Rejection (`new_cseq <= remote_cseq`)**: Return `500 Server Internal Error` on stale or replayed sequence numbers;
  3. **Strict Method Agreement (`Request-Line Method === CSeq Method`)**: Return `400 Bad Request` on any mismatch between the request line and the `CSeq` header method token.

### Q3: Will clamping the `CSeq` jump step to `[1, 64]` break legitimate VoLTE calls when a few UDP `INFO` packets drop in a tunnel?

- **First-Principles Breakdown**:
  Never. Even if `3–5` consecutive UDP `INFO` or `OPTIONS` transactions are lost in a cellular tunnel, the next arriving request only jumps by `ΔCSeq = 4..6`, well inside the `[1, 64]` window. A ceiling of `64` tolerates `63` consecutive lost in-dialog requests while blocking `100%` of `2^{16}` / `2^{31}-1` pinning attacks.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Latency Chart + Sequence Diagram)

### 3.1 Architect Decision Tree for SIP `UPDATE` Target-Refresh & `CSeq` Ordering

```mermaid
flowchart TD
    A["Inbound In-Dialog SIP Request<br/>(UPDATE / Re-INVITE / INFO / BYE)"] --> B{"1. Verify Request-Line vs. CSeq Method & Step<br/>(RFC 3261 Section 12.2.2 · P828)"}
    B -- "Request-Line Method != CSeq Method" --> C["⛔ Block: Return 400 Bad Request Immediately<br/>(0 Method-Mismatch Smuggling)"]
    B -- "CSeq <= remote_cseq or<br/>(CSeq - remote_cseq) > 64" --> D["⛔ Block: Return 500/400 Without Updating remote_cseq<br/>(Stops Replay & 2^31-1 BYE Pinning)"]
    B -- "Method Matches & ΔCSeq in [1, 64]" --> E{"2. Is Request an Early-Dialog (180/183) UPDATE?<br/>(RFC 3311 Target-Refresh · P827)"}
    E -- "Cross-Source Contact Mutation<br/>or Early UPDATE Count > 4" --> F["🛡️ Block: Reject Target-Refresh & Cap at [1, 4]<br/>(0 Early-Media Hijacks)"]
    E -- "Authenticated Same-Source UPDATE (<=4)<br/>or Confirmed-Dialog Request" --> G["✅ Allow: Atomically Advance remote_cseq & Execute<br/>(100% Clean Answer & Instant BYE Teardown)"]
```

### 3.2 Impact of `CSeq` Pinning & Early `UPDATE` Hijacking on Zombie Call Duration

```mermaid
flowchart LR
    subgraph BAD["❌ Vulnerable SIP Stack (Unbounded ΔCSeq + Unchecked Early UPDATE)"]
        direction TB
        B1["Injected CSeq: 2147483647 INFO<br/>or Forged 183 UPDATE Contact"] --> B2["remote_cseq Pinned at 2^31-1<br/>Legitimate Caller BYE (CSeq=103) Rejected 500"]
        B2 --> B3["Call Stranded as 1,800s Zombie Session<br/>100% Early-Dialog Hijack Exposure"]
    end

    subgraph GOOD["✅ Guarded SIP Stack (P827 Early UPDATE Lock + P828 [1,64] CSeq Step Gate)"]
        direction TB
        G1["Rejects >64 CSeq Jumps & Method Mismatch<br/>Preserves Clean remote_cseq=101"] --> G2["Pins 183 Contact Tuple & Caps UPDATE <=4<br/>Legitimate BYE (CSeq=102) Tears Down in 0ms"]
        G2 --> G3["0 Pinned Zombie Calls · 0 Early Hijacks<br/>100% Deterministic Dialog Closure"]
    end
```

### 3.3 Millisecond-Level Full-Duplex Sequence Diagram for `P827` & `P828`

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Legitimate Caller (CSeq=101)
    participant Attacker as Rogue Peer / Spoofer
    participant SBC as Enterprise SBC Edge Guard (P827+P828)
    participant Agent as Azure Voice Live / S2S Agent

    Caller->>SBC: INVITE (CSeq: 101 INVITE, Contact: <sip:caller@192.0.2.10>)
    SBC->>Agent: Create Early Dialog (remote_cseq=101, locked_contact=192.0.2.10)
    Agent-->>Caller: 183 Session Progress (To-tag=ai99)

    Note over Attacker,SBC: Attack 1: Early-Dialog UPDATE Mutating Contact URI (P827 Intercept)
    Attacker->>SBC: UPDATE (CSeq: 102 UPDATE, Contact: <sip:evil@198.51.100.99>)
    SBC->>SBC: P827 Check: Block cross-source early Contact refresh & cap UPDATE in [1,4] (0ms @ 1ms Res)
    SBC-->>Attacker: 403 Forbidden / 488 Not Acceptable Here (locked_contact preserved)

    Note over Attacker,SBC: Attack 2: CSeq=2147483647 Injection to Pin Dialog Open (P828 Intercept)
    Attacker->>SBC: INFO (CSeq: 2147483647 INFO)
    SBC->>SBC: P828 Check: ΔCSeq = 2147483546 > maxAllowedCseqJumpStep(64) -> Do NOT update remote_cseq
    SBC-->>Attacker: 400 Bad Request (Invalid CSeq Jump Step)

    Note over Caller,Agent: Normal Hangup: Legitimate Caller Sends BYE (CSeq: 102 BYE)
    Caller->>SBC: BYE (CSeq: 102 BYE)
    SBC->>SBC: P828 Check: Method=BYE matches, ΔCSeq = 102 - 101 = 1 in [1,64] (PASS)
    SBC->>Agent: Release S2S Voice Session & RTP Ports Immediately
    SBC-->>Caller: 200 OK (BYE)
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Naive Default SIP Stack (Unchecked Early `UPDATE` + Unbounded `CSeq`) | Option B: Globally Disable `UPDATE` (`405 Method Not Allowed`) | **Option C: Enterprise `RFC 3311` Early Target Lock + `RFC 3261 CSeq` Step/Method Dual Guard (`P827 + P828` Recommended)** |
| :--- | :--- | :--- | :--- |
| **VoLTE / IMS `RFC 3312` Compatibility** | ✅ Compatible, but exposed to early `Contact` hijacking & `UPDATE` floods | ❌ **Breaks VoLTE** (blocking `UPDATE` aborts `RFC 3312` QCI-1 precondition negotiation) | **✅ 100% compatible with legitimate QCI-1 negotiation (`[1, 4]` same-source `UPDATE`s) while blocking `100%` of cross-source `Contact` hijacks** |
| **Anti-`CSeq` Pinning (`2^{31}-1`) Defense** | ❌ `0%` (one `CSeq: 2147483647` packet locks out legitimate `BYE`) | ❌ `0%` (still vulnerable via `INFO / OPTIONS`) | **✅ `100%` blocked (`ΔCSeq` clamped to `[1, 64]` without poisoning `remote_cseq`)** |
| **Request-Line vs. `CSeq` Method Match** | ⚠️ Often unchecked by stateless proxies | ⚠️ Same | **✅ `100%` enforces `Request-Line Method === CSeq Method` (`400 Bad Request` on mismatch)** |
| **Offline Policy Check Latency** | None | Static reject | **`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic`)** |
| **Recommended Deployment** | Isolated lab testing only | Never on carrier trunks | **All enterprise SBCs, VoLTE/IMS interconnects, and S2S voice contact centers** |

---

## ⑤ 🧪 Quantitative Examples & 7-Card Benchmark Summary (Self-Contained CSP, Zero Fabricated Coordinates)

### 5.1 Quantitative Example: Eliminating `1,500` Minutes of Pinned Zombie S2S Billing

- **Example 1 (`CSeq` Rollover Pinning Zombie Cost)**:
  - **Without `P828`**: Injecting `CSeq: 2147483647 INFO` across `50` active calls causes the SBC to reject every caller's `BYE (CSeq: 103)` with `500 Out of Order`, stranding all `50` S2S sessions until the 30-minute session timer expires (**`1,500` wasted S2S minutes**);
  - **With `P828` Enabled**: Clamping `ΔCSeq` to **`[1, 64]`** rejects the `2147483647` jump without mutating `remote_cseq`, allowing `BYE (CSeq: 102)` to tear down the call immediately (**`0` zombie minutes**).
- **Example 2 (Early-Dialog `UPDATE` Flood Suppression)**:
  - **Without `P827`**: 25 early `UPDATE` requests/sec thrash DSP codec state before answer;
  - **With `P827` Enabled**: Pinning early `Contact` and capping pre-answer `UPDATE`s to **`[1, 4]`** cuts pre-answer DSP re-initializations by **`84%+`**.

### 5.2 Offline Policy State-Machine Verification (Stage 417 · `P827` & `P828` · 🎉 420 Dimensions Milestone)

| Guardrail ID | Function Name | Synthetic Abuse Vector | Deterministic Action | Provenance & Timing Disclosure |
| :--- | :--- | :--- | :--- | :--- |
| **`P827`** | `evaluateSipRfc3311UpdateEarlyMediaTargetRefreshAndContactHijackGate` | `unauthenticatedEarlyUpdateTargetRefreshOrContactHijackDetected: true`, `unauthenticatedTargetRefreshAttempts: 2`, `maxEarlyDialogUpdatesPerCall: 18` | `reject_unauthenticated_early_update_and_cap_updates` (clamps `clampedUnauthenticatedTargetRefreshAttempts` to `0` and `clampedMaxEarlyDialogUpdatesPerCall` to `4`) | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic`; live SBC early-dialog state-table lookup latency `not_measured`) |
| **`P828`** | `evaluateSipRfc3261CseqOutOfOrderRolloverReplayAndMethodMismatchGate` | `cseqRegressionReplayOrMethodMismatchDetected: true`, `cseqReplayOrMethodMismatchDrops: 3`, `maxAllowedCseqJumpStep: 2147483647` | `reject_cseq_replay_500_400_and_clamp_step` (clamps `clampedCseqReplayOrMethodMismatchDrops` to `0` and `clampedMaxAllowedCseqJumpStep` to `64`) | `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic`; live SIP transaction CSeq verifier latency `not_measured`) |

---

## ⑥ 🛠️ Production Verification Checklist (Good Fit vs. Not For + Checklist)

### ✅ Good Fit vs. ⛔ Not For

| ✅ Good Fit (Enable `P827 + P828` Immediately) | ⛔ Not For (Boundary Conditions to Watch) |
| :--- | :--- |
| 1. **Carrier IMS / VoLTE & Enterprise SIP Trunk Gateways Supporting `RFC 3311 UPDATE`**: Must enforce `P827` to allow `[1, 4]` legitimate QCI-1 precondition updates while blocking early `Contact` hijacking. | 1. **Simple Internal Endpoints Without Early-Media Renegotiation**: May omit `UPDATE` from `Allow:` headers, but must still enforce `P828` on `BYE / Re-INVITE` `CSeq` ordering. |
| 2. **Per-Minute Billed Native S2S (`GPT-Live-1`) Voice Agents**: Must enforce `P828` so extreme `CSeq` jumps cannot lock out caller `BYE` requests. | 2. **High-Frequency Telemetry over In-Dialog `SIP INFO`**: Do not stream high-rate telemetry over `SIP INFO` (which burns `CSeq` numbers); route telemetry over WebRTC `DataChannel` or HTTPS so `ΔCSeq` stays within `[1, 64]`. |

### Production Readiness Checklist (`- [ ]`)

- [ ] **[`P827` Early-Dialog `Contact` Target-Refresh Pinning]**: Verify that before `200 OK (INVITE)`, the SBC rejects any early-dialog `UPDATE` that attempts to mutate the `Contact` URI from an unauthenticated or different transport tuple (`0` unauthorized target refreshes).
- [ ] **[`P827` Early-Dialog `UPDATE` Cap `[1, 4]`]**: Clamp pre-answer `UPDATE` requests per call to `[1, 4]`.
- [ ] **[`P828` Request-Line vs. `CSeq` Method Equality]**: Reject any SIP request where the request-line method does not match the `CSeq` header method with `400 Bad Request`.
- [ ] **[`P828` `CSeq` Replay Reject & `[1, 64]` Jump-Step Cap]**: Return `500 Server Internal Error` when `new_cseq <= remote_cseq`, and reject jumps where `new_cseq - remote_cseq > 64` without updating `remote_cseq`.
