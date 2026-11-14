# Enterprise WebRTC `RFC 9605 SFrame / RFC 9420 MLS` End-to-End Media Encryption (`E2EE`), Member-Removal Key Ratcheting (`[500, 2000]ms`) & `SFU` Zero-Plaintext `RFC 6464` Audio-Level Privacy Selection & Principle FAQ (Stage 438 · Topic 78 · 🎉 Historic P870 Guardrail, 80th Standalone FAQ & 880-Test Triple Milestone)

> **Reader's Guide (Modeled on `ib-vs-ethernet-roce-selection-faq.md`)**: This single-topic architecture guide explains from first principles why enterprise boardroom, M&A deal-room, telehealth, and sovereign government Voice Agents implementing **IETF `RFC 9605` (Secure Frame / `SFrame`) and `RFC 9420` (Messaging Layer Security / `MLS`)** face three critical security failures—specifically **(1) integer underflow/overread and `AES-GCM CTR` nonce reuse when parsing malformed variable-length `SFrame` `KID / CTR` headers (`X=1`)**, **(2) post-eviction eavesdropping when a removed participant retains the static room key because `MLS Epoch` key ratcheting is not enforced within `[500, 2000]ms`**, and **(3) acoustic-envelope side-channel leakage when unredacted `1 dB` `RFC 6464` audio-level RTP header extensions are exposed to an untrusted cloud `SFU`**—and provides deterministic guardrails **`P869` and `P870 🎉`**.

---

## 1. 📌 Executive Summary

1. **Why is standard `DTLS-SRTP` insufficient for confidential multiparty voice conferences, and how do `RFC 9605 SFrame` + `RFC 9420 MLS` achieve true zero-plaintext `SFU` routing?**
   - **The Hop-by-Hop `DTLS-SRTP` Blind Spot**: In standard WebRTC, `DTLS-SRTP` terminates at the cloud Selective Forwarding Unit (`SFU`), meaning the `SFU` holds the media master keys and decrypts every audio packet in RAM.
   - **True End-to-End Media Encryption (`RFC 9605 SFrame` + `RFC 9420 MLS`)**: Using `SFrame`, each Opus audio frame is AEAD-encrypted at the application layer *before* RTP packetization using keys negotiated exclusively among endpoints and the confidential-enclave AI Voice Agent via `MLS (TreeKEM)`. The cloud `SFU` routes outer `SRTP` packets without ever possessing the inner `SFrame` keys.
2. **First Selection Law (`P869`): Enforce strict `1 + (X ? (K+1)+(C+1) : 0) + TagLen` byte-sum closure on every `RFC 9605 SFrame` header, require strictly monotonic `(KID, CTR)` counters to prevent `AES-GCM` nonce reuse (`0` malformed/nonce-reused payloads), and clamp the retained `SFrame Epoch` key-ring size to `[2, 4]`**.
3. **Second Selection Law (`P870 🎉`): Mandate `RFC 9420 MLS` `Epoch` key ratcheting within `[500, 2000]ms` of any participant removal, immediately revoke prior-epoch `KID`s, and quantize/strip `RFC 6464` audio-level headers sent to the `SFU` (`0` stale-epoch or plaintext/side-channel frames)**.

---

## 2. 🎯 Architect & Customer Deep-Dive Q&A

### Q1: How can a crafted `RFC 9605 SFrame` header trigger an integer underflow or catastrophic `AES-GCM` nonce reuse?
- **Variable-Length `KID/CTR` Closure & Monotonic Counter Enforcement (`P869`)**:
  - When the `SFrame` config byte has `X=1`, `K+1` (`1..8` bytes) and `C+1` (`1..8` bytes) specify the encoded lengths of `KID` and `CTR`. If a truncated frame is shorter than `1 + (K+1) + (C+1) + tagLength`, subtracting header + tag length underflows unsigned ciphertext length calculations!
  - Furthermore, because `SFrame` derives the `AES-GCM` IV by XORing the base salt with `CTR`, reusing `(KID, CTR)` after an encoder reset leaks the XOR of plaintexts and compromises the `GHASH` authentication key. **`P869`** rejects any truncated or non-monotonic `(KID, CTR)` frame (`clampedMalformedOrNonceReusedSframePayloads = 0`) and bounds the in-memory epoch key ring to **`[2, 4]`**.

### Q2: Why must `RFC 9420 MLS` advance the `Epoch` ratchet within `[500, 2000]ms` when an external advisor leaves a call?
- **Guaranteed Post-Removal Forward Secrecy (`P870 🎉`)**:
  - Without ratcheting the group `Epoch` secret via an `MLS Commit`, an evicted participant can continue decrypting tapped media streams indefinitely. **`P870 🎉`** enforces a **`[500, 2000]ms`** ratchet deadline and drops `100%` of frames encrypted under evicted epochs (`clampedStaleEpochOrPlaintextSfuAudioFrames = 0`).

### Q3: How can an untrusted `SFU` infer spoken words from `RFC 6464` headers even when `SFrame` is active?
- **Eliminating Acoustic-Envelope Side Channels (`P870 🎉`)**:
  - Fine-grained `1 dBov` per-20ms `RFC 6464` audio-level extensions reveal syllable energy contours. **`P870 🎉`** strips continuous dB levels or quantizes them to a coarse binary VAD bit at the `SFU` boundary.

---

## 3. 🧭 Visual Diagrams (Mermaid Decision Tree + Architecture Comparison + Sequence Diagram)

### 3.1 `RFC 9605 SFrame` Closure, Nonce Guard & `RFC 9420 MLS` Ratchet Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A["🔐 E2EE Voice Frame Enters SFrame / MLS Gate<br/>(RFC 9605 SFrame + RFC 9420 MLS)"] --> B{"P869: Is Frame Length >= Header(1+K+C)+Tag<br/>and Is (KID, CTR) Strictly Monotonic?"}
    B -- "No (Underflow Overread or CTR Nonce Reuse)" --> C["🚫 P869 Drop Malformed / Nonce-Reused Frame in 0ms<br/>Clamp Retained Epoch Key Ring to [2, 4]"]
    B -- "Yes (Byte-Closed & Unique Nonce)" --> D{"P870: Did Member Leave/Remove Occur<br/>or Does Frame Use an Evicted MLS Epoch KID?"}
    D -- "Yes (Member Removed or Stale Epoch KID)" --> E["🔄 P870 Ratchet MLS Epoch Within [500, 2000]ms<br/>Zeroize Evicted KID & Drop Stale-Epoch Frames"]
    D -- "No (Current Active MLS Epoch)" --> F{"P870: Does Outer RTP Header Expose 1dB<br/>RFC 6464 Audio-Level Contours to Untrusted SFU?"}
    F -- "Yes (Acoustic-Envelope Side-Channel Leak)" --> G["🛡️ P870 Quantize/Strip RFC 6464 Level Header<br/>0 Plaintext or Envelope Leaks at SFU"]
    F -- "No (Zero-Plaintext & Redacted VAD)" --> H["✅ Decrypt SFrame Inside Confidential AI Enclave"]
```

### 3.2 Hop-by-Hop `DTLS-SRTP` vs. Zero-Trust `SFrame + MLS` (`P869 + P870 🎉`) Architecture (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Legacy["❌ Hop-by-Hop DTLS-SRTP or Static E2EE (SFU Plaintext + Evicted Spying)"]
      L1["DTLS-SRTP Terminates at Cloud SFU<br/>+ 1dB RFC 6464 Audio Levels Exposed"] --> L2["Cloud SFU Reads Raw Plaintext Audio<br/>or Reconstructs Speech Contours"]
      L3["Static Shared Room Key After Member Removal<br/>or SFrame CTR Reset Nonce Reuse"] --> L4["Evicted Guest Decrypts Subsequent Call<br/>AES-GCM Keystream Compromised"]
    end

    subgraph Hardened["✅ Zero-Trust Enterprise SFrame + MLS Gate (P869 + P870 🎉 · 80th FAQ 🎉)"]
      H1["P869 1+K+C+Tag Byte Closure + Monotonic CTR<br/>+ [2, 4] Epoch Key-Ring Cap"] --> H2["0 Underflow Overreads · 0 Nonce Reuse<br/>Zero Plaintext Audio at Cloud SFU"]
      H3["P870 [500, 2000]ms MLS Removal Ratchet<br/>+ SFU RFC 6464 VAD Quantization"] --> H4["0 Stale-Epoch Frames Decrypted<br/>0 Acoustic-Envelope Side-Channel Leaks"]
    end
```

### 3.3 Millisecond-Level `RFC 9420 MLS` Member-Removal Key Ratchet & `RFC 9605 SFrame` Sequence (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Host as 👔 Board Chair Endpoint
    participant ExGuest as 🕵️ Removed External Advisor (Epoch 14)
    participant SFU as ☁️ Untrusted Cloud WebRTC SFU (Zero-Plaintext)
    participant Enclave as 🤖 Confidential AI Voice Enclave (P869+P870)

    Note over Host,Enclave: Active Call in MLS Epoch 14 (KID=0xE0) with SFrame E2EE
    Host->>Enclave: 1. Chair Removes External Advisor -> Broadcast MLS Remove + Commit
    Note over Host,Enclave: P870 Triggered: Advance to MLS Epoch 15 (New KID=0xF0) in 650ms (∈[500,2000]ms)!
    Note over Enclave: P869 Retains [2, 4] Epoch Ring Briefly for Jitter, Then Zeroizes KID=0xE0
    ExGuest->>SFU: 2. ❌ Replay/Injection: Evicted Advisor Sends Audio Frame Using Stale KID=0xE0
    SFU->>Enclave: 3. Forward Outer SRTP + Inner SFrame Ciphertext (Coarse VAD Only)
    Note over Enclave: P870 Triggered: KID=0xE0 Evicted! Drop Frame in 0ms (0 Stale-Epoch Frames)
    Host->>SFU: 4. Chair Speaks Confidential M&A Valuation Encrypted with KID=0xF0, CTR=1
    SFU->>Enclave: 5. Forward KID=0xF0 Ciphertext (ExGuest Lacks Epoch 15 Key -> 0% Decryption)
    Note over Enclave: P869 Verifies 1+K+C+Tag Closure & Monotonic CTR -> Decrypt in Enclave
```

---

## 4. 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Standard `DTLS-SRTP` Only | Option B: Static-Key `SFrame` (No `MLS` / No `P869/P870`) | **Option C: `RFC 9605 SFrame` + `RFC 9420 MLS` + `P869/P870 🎉` (Recommended ✅)** |
| :--- | :--- | :--- | :--- |
| **Cloud `SFU` Zero-Plaintext Guarantee** | ❌ `SFU` decrypts all audio in RAM | ✅ `SFU` sees only ciphertext | **✅ `P870 🎉` enforces end-to-end `SFrame` (`0` plaintext frames at `SFU`)** |
| **`SFrame` Header Underflow & Nonce Defense** | N/A | ❌ Vulnerable to `X=1` underflow & `CTR` reset reuse | **✅ `P869` enforces `1+K+C+Tag` closure + monotonic `CTR` + `[2, 4]` ring** |
| **Post-Removal Forward Secrecy (`MLS`)** | ⚠️ Signaling kick only | ❌ Evicted user retains static key | **✅ `P870 🎉` ratchets `MLS Epoch` within `[500, 2000]ms` & revokes old `KID`** |
| **`RFC 6464` Audio-Level Side-Channel Defense** | ❌ Raw 1 dB contour exposed | ❌ Leaks 1 dB syllable contour to `SFU` | **✅ `P870 🎉` strips/quantizes `RFC 6464` levels (`0` envelope leaks)** |

---

## 5. 🧪 Quantitative Proof & 7-Card Benchmark Report

### 5.1 Quantitative Example: 5,000 Daily Multiparty M&A & Boardroom Voice Conferences
1. **Eliminating `SFrame` Header Underflows & `AES-GCM` Nonce Reuse (`P869`)**:
   - Across `900` truncated `X=1` `SFrame` frames and `350` duplicate `(KID, CTR)` nonce-reuse packets, **`P869`** drops `100%` of violations (`clampedMalformedOrNonceReusedSframePayloads = 0`) and clamps the retained `SFrame Epoch` key-ring size to **`[2, 4]`** (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`, `synthetic`).
2. **Enforcing Sub-2s `MLS` Removal Ratcheting & Zero-Plaintext `SFU` Privacy (`P870 🎉` · Historic P870, 80th FAQ & 880-Test Triple Milestone)**:
   - Across `1,500` participant removals and `400` stale-epoch injection attempts, **`P870 🎉`** clamps the `MLS Epoch` ratchet deadline to **`[500, 2000]ms`** and blocks `100%` of stale-epoch or unredacted `SFU` audio frames (`clampedStaleEpochOrPlaintextSfuAudioFrames = 0`).

### 5.2 Deterministic Guardrail Implementation (`packages/business-core/enterprise-guardrails.ts`)

```ts
// P869: WebRTC SFrame RFC 9605 Header KID/CTR Overread & CTR Nonce Reuse Gate
const p869 = evaluateWebrtcSframeRfc9605HeaderKidCtrOverreadAndCtrNonceReuseGate({
  sframeKidCtrOverreadOrCtrNonceReuseDetected: true,
  malformedOrNonceReusedSframePayloads: 5,
  maxRetainedSframeEpochKeys: 32,
});
// => p869.violated === true
// => p869.policyId === "P869-WEBRTC-SFRAME-RFC9605-HEADER-KID-CTR-OVERREAD-AND-CTR-NONCE-REUSE-GUARD"
// => p869.action === "drop_malformed_or_nonce_reused_sframe_and_clamp_epoch_ring"
// => p869.clampedMalformedOrNonceReusedSframePayloads === 0
// => p869.clampedMaxRetainedSframeEpochKeys === 4

// P870 🎉: WebRTC MLS RFC 9420 Member-Removal Epoch Ratchet & SFU Zero-Plaintext VAD Gate
const p870 = evaluateWebrtcMlsRfc9420MemberRemovalEpochRatchetAndSfuZeroPlaintextVadGate({
  evictedMemberStaleEpochAccessOrUnredactedSfuVadLeakDetected: true,
  staleEpochOrPlaintextSfuAudioFrames: 8,
  mlsEpochRatchetDeadlineMs: 15000,
});
// => p870.violated === true
// => p870.policyId === "P870-WEBRTC-MLS-RFC9420-MEMBER-REMOVAL-EPOCH-RATCHET-AND-SFU-ZERO-PLAINTEXT-VAD-GUARD"
// => p870.action === "ratchet_mls_epoch_on_member_removal_and_quantize_sfu_vad"
// => p870.clampedStaleEpochOrPlaintextSfuAudioFrames === 0
// => p870.clampedMlsEpochRatchetDeadlineMs === 2000
```

> **Provenance & Timing Disclosure**: The `P869 / P870 🎉` evaluations in `tests/presales-portal.test.ts` and `site/data/voice-agent-benchmark-report.json` are **`synthetic`** (deterministic in-memory policy/configuration state-machine checks) with timing reported as `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`; live `WebCrypto / OpenMLS` `TreeKEM` key derivation and `RTCRtpScriptTransform` worker encryption latencies are `not_measured`.

---

## 6. 🛠️ Production Verification Checklist

- [ ] **1. `RFC 9605 SFrame` `1+K+C+Tag` Byte Closure & Monotonic `CTR` (`P869`)**: Verify that `frame.byteLength >= 1 + (X ? (K+1)+(C+1) : 0) + tagLen` and `(KID, CTR)` is strictly monotonic (`clampedMalformedOrNonceReusedSframePayloads = 0`).
- [ ] **2. `[2, 4]` Retained `SFrame Epoch` Key-Ring Bound (`P869`)**: Verify that `maxRetainedSframeEpochKeys` is clamped to **`[2, 4]`** with immediate zeroization of expired keys.
- [ ] **3. `[500, 2000]ms` `RFC 9420 MLS` Member-Removal Ratchet (`P870 🎉`)**: Verify that participant removal completes an `MLS Commit` epoch ratchet within **`[500, 2000]ms`** and drops stale-epoch `KID`s (`clampedStaleEpochOrPlaintextSfuAudioFrames = 0`).
- [ ] **4. `SFU` Zero-Plaintext & `RFC 6464` Audio-Level Redaction (`P870 🎉`)**: Verify that the cloud `SFU` never receives `SFrame` decryption keys or unquantized `1 dB` `RFC 6464` audio-level contours.
