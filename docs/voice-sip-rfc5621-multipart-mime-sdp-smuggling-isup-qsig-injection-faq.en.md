# Enterprise SIP `RFC 5621` `multipart/mixed` Shadow-SDP Smuggling, `handling=optional` Parser Differential Bypass & `RFC 3204 ISUP / QSIG` Binary Signaling Injection Guard Selection FAQ

> **Reader's Guide (Benchmarked against `ib-vs-ethernet-roce-selection-faq.md` for crystal-clear first-principles depth)**: This guide addresses a high-severity signaling security and parser-differential failure mode when connecting enterprise Voice Agents to carrier IMS/PSTN trunks and enterprise PBXs: **SIP Multipart MIME (`RFC 5621`) and Encapsulated Binary Signaling (`RFC 3204`)**. Using first principles and millisecond-level call flows, we explain **why a seemingly valid `Content-Type: multipart/mixed` SIP `INVITE` causes your firewall to inspect one SDP while your backend media engine executes a completely different "Shadow SDP", how an attacker smuggling a 36-byte `application/isup` binary body part can spoof a toll-free Calling Party Category (CPC) or CEO Caller-ID, and how deterministic guardrails (`P839` / `P840 🎉`) eliminate parser differentials and binary trunk injection.**

---

## 📌 1. Executive Summary

1. **`RFC 5621` `multipart/mixed` Shadow-SDP Smuggling Exploits "First-Match Inspection vs. Last-Match Overwrite" Parser Differentials**:
   - When an enterprise SIP `INVITE` carries both an SDP media offer and an E911 `PIDF-LO` geolocation XML payload (or carrier `ISUP` metadata), it wraps them in a `Content-Type: multipart/mixed; boundary=...` container.
   - **The Fatal Flaw**: Many perimeter SIP firewalls and ALGs inspect only the **first** `application/sdp` body part (verifying that its `c=IN IP4` media IP is safe) and forward the raw multipart payload. However, many backend B2BUAs and media servers iterate over all MIME parts in a loop, allowing a **second** `application/sdp` part (often disguised with `Content-Disposition: render; handling=optional` or mixed-case headers) to overwrite the active media target!
2. **`RFC 3204` `application/isup` / `application/qsig` Binary Injection Is a Backdoor for Toll Fraud & Caller-ID Spoofing**:
   - In SIP-I / SIP-T (`RFC 3398 / RFC 3204`) carrier interconnects, SIP messages encapsulate raw SS7 `application/isup` (Initial Address Message) or enterprise PBX `application/qsig` binary frames.
   - If an untrusted external SIP trunk injects an `application/isup` body part and the ingress SBC fails to strip it, downstream softswitches bridging the call to the PSTN extract the Calling Party Number (CGPN) and Calling Party's Category (`CPC = test/operator toll-free`) directly from the binary ISUP payload—completely bypassing SIP header authentication! Furthermore, a mismatch between `Content-Length` and the closing `--boundary--` delimiter triggers C/C++ heap buffer overreads.
3. **Architect Selection Mandate (`P839` + `P840 🎉` Dual Deterministic Guardrails)**:
   - **Single Canonical SDP & Zero-Nesting Law (`P839`)**: Reject any SIP message containing `> 1` `application/sdp` part (`0` shadow SDP parts) or any nested `multipart/*` container (max recursion depth `= 1`), clamp total multipart body parts to `[1, 3]`, and re-serialize a canonical payload at the SBC.
   - **100% Untrusted ISUP/QSIG Stripping & Byte-Length Parity Law (`P840 🎉`)**: Strip or reject with `415 Unsupported Media Type` **100% of `application/isup` and `application/qsig` binary parts (`0` injected bodies)** on untrusted trunks, enforce exact `Content-Length` vs. actual byte parity with valid `--boundary--` termination, and clamp total SIP body payload size to `[256, 8192]` bytes.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: Why does SIP allow `RFC 5621 multipart/mixed` bodies in the first place, and how does "Shadow-SDP Smuggling" hijack voice media streams?

- **Plain-English First Principles (The Double-Manifest Customs Analogy)**:
  - A basic VoIP call needs only a single `application/sdp` body in its `INVITE`. However, enterprise and emergency calls often need to attach a second document in the same `INVITE`—such as an NG911 civic address (`application/pidf+xml`). `RFC 5621` defines how SIP bundles multiple MIME parts separated by `--boundary` lines.
- **How Shadow-SDP Smuggling Works on the Wire**:
  - An attacker sends a `multipart/mixed` `INVITE` containing **two** `application/sdp` parts:
    1. **Part 1 (Decoy SDP)**: `Content-Type: application/sdp` with a legitimate enterprise media IP (`198.51.100.10`).
    2. **Part 2 (Shadow Malicious SDP)**: `Content-Type: application/sdp` tagged with `Content-Disposition: session; handling=optional`, pointing RTP media to an external wiretap or premium-rate sinkhole (`203.0.113.99`).
  - **The Millisecond Failure Chain**:
    - **Perimeter Firewall (First-Match)**: Scans until it finds Part 1, validates `198.51.100.10`, and approves the packet.
    - **Backend Media Server (Last-Match Overwrite)**: Loops through all parts (`for (const part of mimeParts)`), parses Part 1, and then overwrites `dialog.remoteSdp` with Part 2 (`203.0.113.99`)!
  - **Deterministic Fix (`P839`)**: The ingress SBC parses the entire MIME tree in a single pass, rejects any message with `smuggledOrDuplicateSdpParts > 0`, nested `multipart/*`, or `maxMultipartMimeBodyParts > 3` using `415 Unsupported Media Type`, and re-serializes a single canonical SDP downstream.

### Q2: What are `RFC 3204` `application/isup` and `application/qsig` bodies, and why does allowing them on public SIP trunks enable toll fraud and privilege escalation?

- **Plain-English Principle**:
  - Legacy PSTN switches speak **SS7 / ISUP**, while legacy enterprise PBXs speak **QSIG**. When a call transits a SIP network between two legacy switches (`SIP-I / RFC 3398`), `RFC 3204` encapsulates the raw binary ISUP/QSIG signaling frame inside a MIME body part so legacy parameters survive the hop.
- **Why Untrusted Trunks Must Never Carry Binary ISUP/QSIG**:
  1. **Binary CPC & Caller-ID Override**: An attacker authenticates with a normal SIP header identity, but attaches a 36-byte `application/isup` IAM binary part setting `Calling Party's Category (CPC) = 0x0B` (Payphone/Test Operator Free Call) and `Calling Party Number = CEO Extension (Network Provided)`. When the Voice Agent bridges the call to a downstream PSTN gateway or TDM PBX, the gateway prioritizes the encapsulated ISUP binary fields over the SIP headers—granting unauthorized executive privileges and toll-free international routing!
  2. **`Content-Length` Truncation & Boundary Overread**: Declaring `Content-Length: 4096` on a 512-byte packet without a closing `--boundary--` causes legacy C/C++ MIME parsers to read past the buffer into adjacent call memory.
  - **Deterministic Fix (`P840 🎉`)**: Strip or reject `100%` of `application/isup` and `application/qsig` bodies on untrusted trunks (`clampedInjectedIsupOrQsigBodies = 0`), enforce exact `Content-Length` byte parity, and clamp SIP body size to `[256, 8192]` bytes.

### Q3: How do we safely support legitimate NG911 `application/pidf+xml` multipart calls without opening the door to MIME smuggling?

- **Architect's Blueprint (Strict MIME Allowlist + Depth=1 Flat AST + Canonical Re-Packing)**:
  1. **Strict MIME Allowlist**: Permit only `application/sdp` (max 1) and `application/pidf+xml` (max 1) on untrusted ingress trunks.
  2. **Flat Single-Layer Hierarchy (`[1, 3]` Parts)**: Forbid nested `multipart/*` containers (recursion depth `= 1`) and cap total parts to `[1, 3]`.
  3. **Canonical SBC Re-Serialization**: Re-emit only the validated single SDP and sanitized XML downstream so no raw attacker MIME framing ever reaches the Voice Agent.

---

## 🧭 3. Visual Architecture Diagrams (Mermaid Decision Tree + Differential Comparison + Sequence Diagram)

### 3.1 SIP Multipart MIME & Binary Signaling Security Decision Tree

```mermaid
flowchart TD
    A["SIP INVITE / 200 OK Arrives at Ingress SBC\nInspect Content-Type & Content-Length"] --> B{"declaredContentLength == actualBytes\nand <= 8192 Bytes?"}
    B -- "No (Truncated / Oversized)" --> R1["P840 🎉 Reject 400 / 413 Immediately\nPrevent MIME Boundary Heap Overread"]
    B -- "Yes" --> C{"Is Content-Type multipart/*?"}
    C -- "No (Single Body)" --> D{"Is Body application/isup\nor application/qsig?"}
    D -- "Yes (on Untrusted Trunk)" --> R2["P840 🎉 Reject 415 Unsupported Media Type\nBlock Binary SS7/QSIG Injection"]
    D -- "No (Standard application/sdp)" --> OK["Forward Single Validated SDP"]
    C -- "Yes (multipart/mixed)" --> E{"P839 Full-AST Part Scan:\n1. Nested multipart/* > 0?\n2. application/sdp count > 1?\n3. Total parts > 3?"}
    E -- "Any Violation True" --> R3["P839 Reject 415 / 400 Immediately\n0 Shadow SDP · 0 Nested Bombs"]
    E -- "Valid (Exactly 1 SDP)" --> F{"Contains Untrusted\napplication/isup or qsig Part?"}
    F -- "Yes" --> R4["P840 🎉 Strip Binary Part or Reject 415\nEmit Canonical Single SDP Only"]
    F -- "No" --> OK2["SBC Canonical Re-Serialization\n100% Firewall-to-Engine Parity"]
```

### 3.2 Vulnerable Pass-Through vs. `P839 + P840 🎉` Deterministic Gate

```mermaid
flowchart LR
    subgraph Unsafe["❌ Legacy Pass-Through SBC (First-Match & Binary Leak)"]
      U1["Dual-SDP Multipart\nPart1: Safe IP / Part2: Evil IP"] --> U2["Firewall Checks Part1 Only\nMedia Engine Overwritten by Part2"]
      U3["Untrusted application/isup\nSpoofed CPC=Free + CEO CGPN"] --> U4["Downstream Switch Trusts ISUP\nToll Fraud & Executive Impersonation"]
    end

    subgraph Safe["✅ P839 + P840 🎉 Deterministic MIME Canonical Gate"]
      S1["Single-Pass AST Part Counter\nsdpCount == 1 & parts in [1,3]"] --> S2["0 Shadow-SDP Smuggling\nCanonical Re-Packing Eliminates Drift"]
      S3["100% Untrusted ISUP/QSIG Strip\n+ Strict Content-Length Parity"] --> S4["0 Binary Signaling Spoofing\nPayload Clamped to [256, 8192]B"]
    end
```

### 3.3 Millisecond-Level Full-Duplex Signaling Interception Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Attacker as Untrusted SIP Trunk / Attacker
    participant SBC as Enterprise Ingress SBC (P839 + P840 🎉)
    participant Agent as Voice Agent Media Engine (B2BUA)
    participant PSTN as Downstream PBX / PSTN Core

    Note over Attacker,SBC: Scenario A: RFC 5621 Shadow-SDP Smuggling (Part 1 Safe IP + Part 2 Rogue RTP IP)
    Attacker->>SBC: INVITE (Content-Type: multipart/mixed; Part1=SDP_Safe, Part2=SDP_Evil)
    SBC->>SBC: P839 Offline Policy Check (0ms @ 1ms nominal resolution)\nDetects smuggledOrDuplicateSdpParts=2 (>1)
    SBC-->>Attacker: SIP 415 Unsupported Media Type / 400 Bad Request (Shadow SDP Blocked)

    Note over Attacker,PSTN: Scenario B: RFC 3204 Untrusted Trunk Injecting application/isup Binary IAM
    Attacker->>SBC: INVITE (Part1=SDP_Valid, Part2=application/isup [CPC=Free, CGPN=CEO])
    SBC->>SBC: P840 🎉 Offline Policy Check (0ms @ 1ms nominal resolution)\nUntrusted trunk hits injectedIsupOrQsigBodies=1 -> 100% Stripped
    SBC->>Agent: INVITE (Canonical single application/sdp only, verified Content-Length)
    Agent->>PSTN: Controlled Bridge (Uses STIR/SHAKEN-verified SIP identity only, 0 ISUP escalation)
```

---

## 📊 4. Architect Decision Matrix

| Evaluation Dimension | Option A: Raw `multipart/mixed` Pass-Through | Option B: Blanket Block All `multipart/*` | Option C: Single-Layer AST + Canonical Single-SDP Re-Pack + ISUP Strip (`P839 + P840 🎉` ★) |
| :--- | :--- | :--- | :--- |
| **`RFC 5621` Shadow-SDP Defense** | ❌ Vulnerable to First-Match vs. Last-Match overwrite | ✅ Blocks multipart | ✅ **100% blocks `>1` SDP part or `handling=optional` smuggling (`0` shadow SDPs)** |
| **NG911 `PIDF-LO` Compatibility** | ⚠️ Works but unvalidated | ❌ Breaks `application/pidf+xml` emergency location | ✅ **Permits allowlisted `1 SDP + 1 PIDF-LO` within `[1, 3]` parts** |
| **`RFC 3204` ISUP/QSIG Defense** | ❌ Attacker spoofs binary CPC & Caller-ID | ⚠️ Still vulnerable to single-part `application/isup` | ✅ **100% strips/rejects single or multipart `ISUP/QSIG` on untrusted trunks (`0` injected)** |
| **`Content-Length` Overread Guard** | ❌ Missing `--boundary--` causes heap overread | ⚠️ Still exposed on single-body truncation | ✅ **Enforces 100% byte-length parity and clamps body size to `[256, 8192]` bytes** |
| **Policy Gate Overhead (Provenance)** | None | Low, breaks NG911 | **`0ms` (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`, offline `synthetic` check; live SBC MIME scanner latency `not_measured`)** |

---

## 🧪 5. Quantitative Walkthrough & 7-Card Benchmark Report

### 5.1 Quantitative Walkthrough (Eliminating Toll-Fraud Exposure & Buffer Overreads)

- **Scenario**: A global banking contact center processes `250,000` inbound SIP calls/day, facing `1,200` daily adversarial probes carrying dual-SDP `multipart/mixed` payloads or encapsulated `application/isup` IAM frames requesting toll-free international bridging.
- **Without `P839 / P840 🎉`**:
  - First-match firewalls pass Part 1 while backend media engines execute Part 2's rogue RTP destination or honor encapsulated ISUP `CPC=Free` flags, creating up to `1,200 × $45 = $54,000 / day` in international toll-fraud and wiretap exposure.
- **With `P839 + P840 🎉` Enabled**:
  - **Shadow-SDP Smuggling Block Rate**: `100.0%` (`clampedSmuggledOrDuplicateSdpParts = 0`, `clampedMaxMultipartMimeBodyParts = 3`).
  - **Untrusted ISUP/QSIG Stripping Rate**: `100.0%` (`clampedInjectedIsupOrQsigBodies = 0`, `clampedMaxSipBodyPayloadBytes <= 8192`).
  - **Timer Resolution & Provenance Disclosure**: The offline deterministic policy state machine reports `0ms` at nominal `1ms` display resolution (`0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`, `synthetic`); live C/Rust SBC MIME boundary scanning latency is `not_measured` in local unit tests.

### 5.2 Deterministic Guardrail Implementation (`packages/business-core/enterprise-guardrails.ts`)

```typescript
// P839: SIP RFC 5621 Multipart MIME Shadow-SDP Smuggling & Handling Bypass Guard
const p839 = evaluateSipRfc5621MultipartMimeShadowSdpSmugglingAndHandlingBypassGate({
  shadowSdpPartOrNestedMultipartDepthDetected: true,
  smuggledOrDuplicateSdpParts: 2,
  maxMultipartMimeBodyParts: 9,
});
// => p839.violated === true
// => p839.action === "reject_415_shadow_sdp_and_flatten_canonical_multipart"
// => p839.clampedSmuggledOrDuplicateSdpParts === 0
// => p839.clampedMaxMultipartMimeBodyParts === 3

// P840 🎉: SIP RFC 3204 ISUP/QSIG Trunk Injection & Content-Length Truncation Guard
const p840 = evaluateSipRfc3204IsupQsigTrunkInjectionAndContentLengthTruncationGate({
  untrustedIsupQsigBodyOrContentLengthMismatchDetected: true,
  injectedIsupOrQsigBodies: 1,
  maxSipBodyPayloadBytes: 65536,
});
// => p840.violated === true
// => p840.action === "strip_untrusted_isup_qsig_and_enforce_content_length_parity"
// => p840.clampedInjectedIsupOrQsigBodies === 0
// => p840.clampedMaxSipBodyPayloadBytes === 8192
```

---

## 🛠️ 6. Production Readiness Checklist

- [ ] **1. Single `application/sdp` Part Enforcement (`P839`)**: Does the ingress SBC count all `application/sdp` parts across `multipart/*` bodies and immediately reject `count > 1` with `415 / 400` (`0` shadow SDP parts)?
- [ ] **2. Zero Nested `multipart/*` & `[1, 3]` Part Cap (`P839`)**: Are nested `multipart/*` containers forbidden (max depth `= 1`) and total MIME body parts clamped to `[1, 3]`?
- [ ] **3. Canonical `Content-Disposition` Re-Serialization (`P839`)**: Does the SBC block `Content-Disposition: render; handling=optional` SDP overwrite tricks and re-serialize a single canonical SDP downstream?
- [ ] **4. 100% Untrusted `application/isup` & `application/qsig` Stripping (`P840 🎉`)**: Are all encapsulated `application/isup` and `application/qsig` binary parts stripped or rejected with `415` on untrusted trunks (`0` injected bodies)?
- [ ] **5. `Content-Length` & `--boundary--` Byte-Closure Lock (`P840 🎉`)**: Does the parser verify exact parity between `Content-Length` and received payload bytes, require a closing `--boundary--`, and clamp total SIP payload size to `[256, 8192]` bytes?
- [ ] **6. Explicit Provenance Disclosure**: Do all benchmark cards and logs state `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic` policy check vs. `not_measured` live SBC MIME scanning)?
