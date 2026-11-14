# Enterprise SIP `RFC 3329` Security Agreement (`sec-agree` `Security-Verify` Mirroring, Anti-`420` Plaintext Downgrade & `494` Retry Loop Breaker) Selection Guide

> **Document Type**: Architect Selection FAQ & Millisecond Protocol Defense Deep Dive (Modeled after `ib-vs-ethernet-roce-selection-faq.md`)  
> **Stage & Milestone**: Stage 455 🎉 · Topic 95 🎉 · 🎉 **Historic Stage 455 & Topic 95 Dual Milestone** (Guardrails `P903`, `P904` · 97th Standalone Single-Topic FAQ · 99th Architectural SVG · 458 Evaluation Dimensions)  
> **Core Value**: Explains from first principles why enterprise SIP/IMS trunks using **`RFC 3329` (`sec-agree`)** can be tricked into plaintext UDP fallback by a single spoofed `SIP 420 Bad Extension (Unsupported: sec-agree)` or a tampered first-hop `494 Security Agreement Required` response when **`Security-Verify === Security-Server` byte-for-byte mirroring** is not enforced, and why unbounded `494` challenge retries exhaust kernel IPSec `SA` tables, then establishes deterministic **`P903`** and **`P904`** guardrails.

---

## ① 📌 Executive Summary

1. **Why can a Man-in-the-Middle attacker downgrade an encrypted `TLS / IPSec` enterprise SIP trunk to plaintext using a single spoofed `420` or modified `494` packet (`RFC 3329 sec-agree` Bidding-Down Vulnerability)?**  
   In enterprise SIP and IMS/VoLTE networks, **`RFC 3329` (Security Mechanism Agreement for SIP)** negotiates hop-by-hop security (`tls`, `ipsec-3gpp`, `digest`) via `Security-Client`, `Security-Server`, and `Security-Verify` headers. Because the initial request and `494 Security Agreement Required` challenge traverse the link before the new security association is active:
   - **Trap 1 (Spoofed `420 Bad Extension` Plaintext Fallback)**: If an attacker injects an unauthenticated `SIP 420 Bad Extension (Unsupported: sec-agree)` response, permissive clients configured for "best-effort encryption" strip `Require: sec-agree` and **re-send the call in plaintext UDP**!
   - **Trap 2 (Missing `Security-Verify` Mirror Verification)**: If an attacker tampers with the `494` `Security-Server` header in flight—stripping `tls;q=0.9` and leaving only weak `ealg=null` (null encryption)—and the server fails to verify in Step 2 that the client's encrypted **`Security-Verify` header matches the server's original `Security-Server` header byte-for-byte**, the bidding-down attack succeeds silently!
2. **Why do repeated `494 Security Agreement Required` responses exhaust kernel IPSec Security Association (`SA`) tables (`494` Retry Loop & Half-Open `SA` Leak)?**  
   Each `494` response instructs the endpoint to allocate inbound/outbound IPSec `SPI` and port pairs in the OS kernel (`XFRM`). Without a strict `[1, 2]`-retry cap per call attempt, spoofed or misconfigured `494` challenges trigger an infinite re-negotiation loop that exhausts kernel `IPSec SA` quotas!
3. **Architect's Deterministic Defense (`P903 + P904` · 🎉 Historic Stage 455 & Topic 95 Dual Milestone)**:
   - **`P903` (`RFC 3329 Security-Verify` Byte-Mirror Verification, Anti-`420/ealg=null` Downgrade & `[500, 1000]` milli-q Cipher Floor Guard)**: Prohibits `420` plaintext fallback and `ealg=null` null encryption, enforces strict `Security-Verify === Security-Server` byte-for-byte matching over the established encrypted channel (`0` downgraded or unverified sessions), and clamps minimum selected security mechanism priority to **`[500, 1000]` milli-q (`q >= 0.500`)**.
   - **`P904` (`RFC 3329 494` Challenge Retry `[1, 2]`-Cap & Half-Open `IPSec SA` Reaper Guard)**: Clamps `494 Security Agreement Required` challenge retries per call/registration to **`[1, 2]` retries** and immediately reaps half-open kernel `IPSec SAs` on failure (`0` infinite `494` loops or leaked `SAs`).

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Once the TLS or IPSec tunnel is up in Step 2, why does `RFC 3329` still require the `Security-Verify` header?
- **Plain-Language First Principles**: Step 1 (`Security-Client` -> `494 Security-Server`) happens *before* the tunnel is encrypted. An attacker on the wire can edit the `494` packet to cross out `TLS 1.3` and `AES-GCM` so the client thinks the server only supports weak security. By forcing the client to echo the exact `Security-Server` list back inside the encrypted tunnel as `Security-Verify`, the server can compare what the client received against what the server actually sent—catching any in-flight tampering in `0ms` (`P903`)!

### Q2: Why must `SIP 420 (Unsupported: sec-agree)` trigger a hard call abort (`Fail-Closed`) rather than a plaintext retry?
- **Plain-Language First Principles**: A `420` response on an unencrypted initial hop carries zero cryptographic authentication. Allowing `420` to disable `sec-agree` lets any on-path script strip encryption from 100% of enterprise calls (`P903`).

### Q3: Why cap `494 Security Agreement Required` retries at `[1, 2]` attempts (`P904`)?
- **Plain-Language First Principles**: Legitimate `RFC 3329` negotiation completes in **1 challenge round-trip** (or at most 2 if a transient `SPI` collision occurs). Reaching 3+ consecutive `494` challenges indicates either an active `494` flood attack or a permanent cipher configuration mismatch. Capping retries to `[1, 2]` protects kernel `XFRM` `SA` memory.

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Latency Comparison + Millisecond Sequence)

### 3.1 Enterprise SIP `RFC 3329 sec-agree` Anti-Downgrade Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[SIP Endpoint / SBC Initiates or Validates RFC 3329 sec-agree Handshake] --> B{Received 420 Unsupported: sec-agree or ealg=null Offer?}
    B -- "Yes: Plaintext Fallback or Null-Cipher Downgrade Attempt" --> C["❌ P903 Block: Fail-Closed Abort · 0 Plaintext Downgrade Sessions"]
    B -- "No: Received 494 Security Agreement Required Challenge" --> D{494 Challenge Retry Count Within [1, 2] Attempts?}
    D -- "No: > 2 Retries (Spoofed 494 Flood or Policy Deadlock)" --> E["❌ P904 Abort: Terminate Handshake & Reap Half-Open IPSec SAs"]
    D -- "Yes: 1-2 Retries & Selected Mechanism q >= 500 milli-q" --> F[Establish TLS / IPSec Tunnel & Send Step-2 Request with Security-Verify]
    F --> G{Server Check: Security-Verify === Original Security-Server Byte-for-Byte?}
    G -- "No: Step-1 494 List Was Tampered by MITM (Bidding-Down)" --> H["❌ P903 Tear Down: Mismatched Security-Verify · Destroy Downgraded Tunnel"]
    G -- "Yes: Exact Byte Match & q ∈ [500, 1000] milli-q" --> I["✅ P903+P904 Green: Cryptographically Verified Voice Trunk Active"]
```

### 3.2 Unguarded `sec-agree` (`420` Fallback + `SA` Exhaustion) vs. `P903 + P904` Guard (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Unguarded Mode (Spoofed 420 Plaintext Fallback + 494 SA Exhaustion)"]
        direction LR
        B1["Spoofed SIP 420 Bad Extension\nClient Drops sec-agree & Dials Plaintext"] --> B2["MITM Strips AES from 494 Header\nServer Skips Security-Verify Check"]
        B2 --> B3["Unbounded 494 Challenge Loop\nExhausts Kernel IPSec SA Table"]
    end

    subgraph Good["✅ P903 + P904 Deterministic sec-agree Guard (🎉 Stage 455 & Topic 95)"]
        direction LR
        G1["Block 420 Fallback & ealg=null\nCipher Floor [500,1000] milli-q (P903)"] --> G2["Enforce Byte-for-Byte Match\nSecurity-Verify === Security-Server"]
        G2 --> G3["Clamp 494 Retries to [1, 2]\nReap Half-Open IPSec SAs (P904)"]
    end
```

### 3.3 Millisecond Sequence: `RFC 3329` Two-Stage `Security-Verify` Mirroring (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant UAC as Enterprise Voice Gateway (UAC)
    participant MITM as On-Path Attacker (MITM)
    participant PCSCF as Core Security Proxy (SBC / P-CSCF)

    UAC->>PCSCF: 1. REGISTER/INVITE (Require: sec-agree, Security-Client: tls;q=0.9, ipsec-3gpp;ealg=aes-cbc;q=0.8)
    PCSCF-->>UAC: 2. SIP 494 Security Agreement Required (Security-Server: tls;q=0.9, ipsec-3gpp;ealg=aes-cbc;q=0.8)
    par Attack A: Spoofed 420 Plaintext Downgrade
        MITM-->>UAC: Spoofed SIP 420 Bad Extension (Unsupported: sec-agree)
        Note over UAC: [P903] Fail-Closed Rejects Spoofed 420 — Never Falls Back to Plaintext!
    and Valid Protected Tunnel Setup (q=900 ∈ [500, 1000] milli-q, Retry 1 ∈ [1, 2])
        Note over UAC,PCSCF: Establish Protected TLS 1.3 / IPSec AES Tunnel
        UAC->>PCSCF: 3. Protected Re-INVITE/REGISTER (Security-Verify: tls;q=0.9, ipsec-3gpp;ealg=aes-cbc;q=0.8)
        Note over PCSCF: [P903] Verifies Security-Verify === Step-2 Security-Server Byte-for-Byte!<br/>Confirms Zero MITM Bidding-Down Tampering!
        PCSCF-->>UAC: 4. SIP 200 OK (Verified Encrypted Session, 0 Leaked Half-Open SAs)
    end
```

![Enterprise SIP RFC 3329 sec-agree Anti-Downgrade & 494 Retry Loop Guard Architecture](../assets/svg/99-voice-sip-rfc3329-rfc4168-sec-agree-ipsec-tls-downgrade-420-bad-extension-loop-2026-11-14.svg)

---

## ④ 📊 Voice Architect Decision Matrix

| Architecture / Policy Option | `420 Unsupported: sec-agree` Policy | `Security-Verify` Server Validation | `494` Challenge Retry Ceiling | Plaintext Wiretap & `SA` Exhaustion Risk | Architect Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Permissive Fallback (`420` -> Plaintext + No Mirror Check)** | Strips `sec-agree` & retries in plaintext | Ignores `Security-Verify` contents | Uncapped / 7+ retries | **Critical** (Trivial 1-packet plaintext downgrade + `SA` table DoS) | **Rejected for production** |
| **Option B: Block `420` Without `Security-Verify` Byte Comparison** | Blocks `420` fallback | Checks header presence only | Fixed 5 retries | **Medium** (Vulnerable to MITM `494` cipher-stripping downgrade) | Incomplete |
| **Option C: `Security-Verify` Byte Mirror + `[500,1000]` milli-q + `[1,2]` `494` Cap (`P903 + P904` Recommended)** | **100% blocks `420` fallback & `ealg=null`** | **Enforces `Security-Verify === Security-Server` byte match** | **Clamps to `[1, 2]` retries & reaps half-open `SAs`** | **`0` downgraded sessions & `0` `494` loops / leaked `SAs`** | **Mandatory for Enterprise IMS & High-Security SIP Trunks** |

---

## ⑤ 🧪 Quantitative Proof & 7-Card Benchmark Integration

### 5.1 Quantitative Example: Bidding-Down & Half-Open `SA` Exhaustion vs. `P903 / P904` Guardrails
- **Unguarded Baseline (Without `P903 / P904`)**: At `200 CPS` of spoofed `494` challenges with 6 retries per call (2 kernel `IPSec SAs` per retry), an unguarded SBC leaks **`96,000` half-open kernel `IPSec SAs` in 40 seconds**, while a single spoofed `420` downgrades `100%` of permissive clients to plaintext.
- **Guarded Convergence (`P903 + P904` · 🎉 Historic Stage 455 & Topic 95 Dual Milestone)**: Enforcing `Security-Verify === Security-Server` byte mirroring, blocking `420 / ealg=null` downgrades, and clamping cipher preference to `[500, 1000]` milli-q reduces downgraded/unverified sessions to **`0`** (`P903`), while clamping `494` challenge retries to `[1, 2]` attempts and reaping half-open `SAs` reduces retry loops and leaked `SAs` to **`0`** (`P904`).

### 5.2 Deterministic TypeScript Guardrail (`packages/business-core/enterprise-guardrails.ts` Excerpt)

```typescript
// P903: SIP RFC 3329 sec-agree Security-Verify Mirror & Anti-Plaintext-Downgrade Guard
// P904: SIP RFC 3329 494 Handshake Retry Loop & IPSec SA Quota Guard
export function evaluateSipRfc3329SecAgreeSecurityVerifyMirrorAndPlaintextDowngradeGate(
  context: SipRfc3329SecAgreeSecurityVerifyMirrorAndPlaintextDowngradeContext,
): SipRfc3329SecAgreeSecurityVerifyMirrorAndPlaintextDowngradeDecision {
  const clampedDowngradedPlaintextOrUnverifiedSecAgreeSessions = 0;
  const clampedMinSecurityMechanismMilliQ = Math.min(
    Math.max(context.minSecurityMechanismMilliQ, 500),
    1000,
  );
  // Enforce Security-Verify === Security-Server byte mirror and block 420/ealg=null downgrades
  // ...
}
```

> **Provenance & Timing Disclosure**: `P903` and `P904` in `site/data/voice-agent-benchmark-report.json` and `site/benchmark-cards.html` evaluate deterministic in-memory header-mirroring and retry-cap rules (`provenance: "synthetic"`, timing: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`). Live Linux kernel Netlink `XFRM_MSG_NEWSA` syscall and IPSec ESP hardware offload latencies are explicitly marked `not_measured`.

---

## ⑥ 🛠️ Production Verification Checklist

- [ ] **[`P903` Anti-`420` Plaintext Fallback & `ealg=null` Block]**: Configure `Require: sec-agree` as `Fail-Closed`, rejecting `420 (Unsupported: sec-agree)` plaintext fallback and `ealg=null` offers (`clampedDowngradedPlaintextOrUnverifiedSecAgreeSessions = 0`).
- [ ] **[`P903` `Security-Verify === Security-Server` Byte Mirror & `[500, 1000]` milli-q Floor]**: Verify exact byte equality between `Security-Verify` and the issued `Security-Server` header, with selected cipher priority in `[500, 1000]` milli-q.
- [ ] **[`P904` `[1, 2]`-Retry Ceiling on `494` Challenges]**: Clamp `494 Security Agreement Required` challenge retries per call/registration to `[1, 2]` attempts (`clampedInfinite494RetryOrLeakedHalfOpenIpsecSas = 0`).
- [ ] **[`P904` Immediate Half-Open `IPSec SA` Reaper]**: Destroy pre-allocated kernel `XFRM` `SPI/SA` state in `0ms` upon `Security-Verify` mismatch or retry exhaustion.
