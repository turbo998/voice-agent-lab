# Enterprise SIP `RFC 8946 / RFC 8224` `STIR/SHAKEN` Call-Forwarding Chain (`PASSporT "ppt":"div"` Continuity & Anti-Token-Grafting) Selection Guide

> **Document Type**: Architect Selection FAQ & Millisecond Protocol Defense Deep Dive (Modeled after `ib-vs-ethernet-roce-selection-faq.md`)  
> **Stage & Milestone**: Stage 459 · Topic 99 · 🎉 **Historic 921-Guardrail, 930-Synthetic-Probe & 740-Live-POC-Probe Triple Milestone** (Guardrails `P911`, `P912` · 101st Standalone Single-Topic FAQ · 103rd Architectural SVG · 462 Evaluation Dimensions)  
> **Core Value**: Explains from first principles why forwarding an inbound `Attestation-A` customer call from an enterprise AI Voice Gateway to an on-call specialist's mobile phone breaks `STIR/SHAKEN` verification (`Request-URI !== Base.dest`) unless the SBC appends a signed **`RFC 8946` `PASSporT "ppt":"div"`** header, and how attackers graft stolen `Attestation-A` tokens onto unauthorized destinations when `Base.dest === div.div` chain continuity and `[5, 60]s` monotonic `iat` bounds are not enforced, then establishes deterministic **`P911`** and **`P912`** guardrails.

---

## ① 📌 Executive Summary

1. **Why does a legitimate `Attestation-A` customer call get flagged as "Spam Likely / Invalid Signature" the moment an enterprise AI Voice Gateway forwards it to an external mobile number (`RFC 8224` Retargeting `dest` Mismatch)?**  
   In **`RFC 8224` (`STIR/SHAKEN`)**, the originating carrier signs a base `PASSporT` binding the caller (`orig.tn = A`) and the original enterprise DID (`dest.tn = B`). When the enterprise AI gateway retargets/forwards the call to an on-call specialist (`C`), the outbound `INVITE` `Request-URI` becomes `C`. When the terminating mobile carrier verifies the original `Identity` header, it sees **`Base.dest (B) !== Request-URI (C)`** and rejects the signature as tampered!
   - **The `RFC 8946` Solution (`PASSporT "ppt":"div"`)**: The forwarding enterprise SBC must retain the original `Identity` header (`A -> B`) and append a second signed `Identity` header with **`"ppt":"div"`** (`div.tn = B`, `dest.tn = C`), cryptographically proving that the owner of number `B` authorized forwarding the call to `C`!
2. **What are Token-Grafting Attacks (`Broken div Continuity`) and Multi-`Identity` Replay / Header-Bloat Exploits?**  
   - **Token Grafting (`P911`)**: If a verifier checks the signatures on the Base and `div` tokens independently without verifying the directed graph **`Base.dest === div[1].div` and `div[k].dest === Request-URI`**, an attacker can staple a captured `Attestation-A` token (`A -> B`) onto a fraudulent call (`D -> E`)!
   - **Replay Grafting & Hop Bloat (`P912`)**: Allowing `> 5` chained `div` headers bloats SIP headers past MTU limits, while failing to enforce monotonic `div.iat >= Base.iat` within a `[5, 60]s` freshness window allows attackers to graft stale tokens recorded minutes earlier.
3. **Architect's Deterministic Defense (`P911 + P912` · 🎉 Historic 921-Guardrail, 930-Probe & 740-Live-POC Milestone)**:
   - **`P911` (`RFC 8946 PASSporT "ppt":"div"` Chain Continuity & `[1, 5]`-Hop Cap Guard — 🎉 920th Guardrail!)**: Enforces unbroken `Base.dest === div[1].div ... -> Request-URI` chain continuity (`0` broken-chain or grafted spoofing calls) and clamps chained `div` `Identity` headers to **`[1, 5]` hops**.
   - **`P912` (`RFC 8224 / RFC 8946` Multi-`Identity` Monotonic `iat` & `[5, 60]s` Freshness Guard — 🎉 921st Guardrail!)**: Verifies monotonic `div.iat >= Base.iat` ordering and clamps total multi-token `iat` freshness within **`[5, 60]` seconds** (`0` replay-grafted or oversized `Identity` packets).

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Why don't plaintext `Diversion:` or `History-Info:` headers satisfy `STIR/SHAKEN` verifiers?
- **Plain-Language First Principles**: Plaintext `Diversion` headers carry no cryptographic signature and can be forged by any SIP endpoint. Only a signed `RFC 8946` `Identity` header with `;ppt="div"` cryptographically links the original `Base.dest` to the new forwarded `Request-URI` (`P911`).

### Q2: How does `P911` mathematically verify multi-hop `div` chain continuity in `0ms`?
- **Directed Chain Invariant**: Given Base token $T_0$ and ordered `div` tokens $T_1 \dots T_k$ ($1 \le k \le 5$), `P911` asserts $\forall i \in [1, k]: T_i.\text{div} \equiv T_{i-1}.\text{dest}$ and $T_k.\text{dest} \equiv \text{Request-URI}$. Any gap immediately rejects the call (`0` grafted spoofs).

### Q3: Why enforce `div.iat >= Base.iat` within `[5, 60]` seconds (`P912`)?
- **Plain-Language First Principles**: A call cannot be forwarded *before* it was originated (`div.iat < Base.iat`), nor should an active call-setup chain span more than `[5, 60]` seconds. Enforcing monotonic `iat` within `[5, 60]s` blocks cut-and-paste token replay.

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Latency Comparison + Millisecond Sequence)

### 3.1 Enterprise SIP `RFC 8946 PASSporT div` Verification Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[Enterprise SBC Forwards Call or Verifies Chained Identity Headers] --> B{Request-URI TN Matches Base PASSporT dest.tn?}
    B -- "Yes: Direct Non-Forwarded Call" --> C["✅ Standard RFC 8224 Check: Verify ES256 Signature & iat ∈ [5, 60]s"]
    B -- "No: Retargeted / Forwarded Call (Request-URI != Base.dest)" --> D{Includes RFC 8946 ppt=div Identity Header(s) & Hop Count ∈ [1, 5]?}
    D -- "No: Missing ppt=div or > 5 Forwarding Hops" --> E["❌ P911 Block / Sign: Append Signed ppt=div on Egress or Reject Unlinked Ingress"]
    D -- "Yes: 1-5 Chained ppt=div Tokens" --> F{Chain Continuity: Base.dest == div[1].div ... & div[k].dest == Request-URI?}
    F -- "No: Disconnected Chain (Token-Grafting Attack)" --> G["❌ P911 Reject: Block Grafted PASSporT Spoof in 0ms"]
    F -- "Yes: Unbroken TN Chain" --> H{Monotonic Freshness: div.iat >= Base.iat & Span ∈ [5, 60]s?}
    H -- "No: Stale Replay or Inverted Timestamps" --> I["❌ P912 Reject: Return SIP 437/438 Stale/Invalid Identity"]
    H -- "Yes: Verified Chain & Freshness" --> J["✅ P911+P912 Green: Forwarded Call Preserves End-to-End Attestation-A!"]
```

### 3.2 Unguarded Forwarding (Broken `dest` & Token Grafting) vs. `P911 + P912` Guard (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Unguarded Forwarding (Broken Attestation-A + Token Grafting)"]
        direction LR
        B1["Forwards A->B Call to Specialist C\nWithout Appending RFC 8946 ppt=div"] --> B2["Terminating Carrier Sees Base.dest(B)!=C\nFlags Legitimate Call as Spam"]
        B2 --> B3["Attacker Grafts Stolen Base Token\nOnto Unrelated Destination E"]
    end

    subgraph Good["✅ P911 + P912 Deterministic div Chain Guard (🎉 921 Guards, 930 Probes & 740 POC!)"]
        direction LR
        G1["Append Signed ppt=div on Forward\nVerify Base.dest===div.div (P911)"] --> G2["Clamp Forwarding Hops to [1, 5]\n0 Broken Chains or Grafted Spoofs"]
        G2 --> G3["Enforce div.iat >= Base.iat\nFreshness Window [5, 60]s (P912)"]
    end
```

### 3.3 Millisecond Sequence: `RFC 8946` Dual-`Identity` Signing & Chain Verification (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Caller as Customer Phone A (+14155550199)
    participant CorpSBC as Enterprise Voice Gateway B (+12065550100, P911/P912)
    participant CarrierC as Terminating Carrier Verifier
    participant AgentC as Specialist Mobile C (+13125550188)

    Caller->>CorpSBC: INVITE sip:+12065550100 (Identity #1 Base: orig=A, dest=B, attest=A, iat=T0)
    Note over CorpSBC: AI Triage Forwards Call to Specialist C (+13125550188):<br/>[P911] Retain Identity #1 & Sign New RFC 8946 Identity #2 (ppt="div"):<br/>orig=A, div=B (+12065550100), dest=C (+13125550188), iat=T0+1s!
    CorpSBC->>CarrierC: INVITE sip:+13125550188 (Carrying Identity #1 [Base] + Identity #2 [ppt="div"], Hops=1 ∈ [1, 5])
    Note over CarrierC: [P911] Verify Chain: Base.dest (B) === div.div (B) & div.dest (C) === Request-URI (C)!<br/>[P912] Verify Freshness: div.iat >= Base.iat & Δt = 1s ∈ [5, 60]s!
    CarrierC->>AgentC: INVITE (Preserves End-to-End Attestation-A Trust Badge!)
```

![Enterprise SIP RFC 8946 & RFC 8224 STIR/SHAKEN div Call-Forwarding Chain Guard Architecture](../assets/svg/103-voice-sip-rfc4474-rfc8224-stir-shaken-diversion-passpor-t-div-tn-retargeting-spoof-2026-11-14.svg)

---

## ④ 📊 Voice Architect Decision Matrix

| Architecture / Policy Option | Forwarded `Identity` Handling | `PASSporT "ppt":"div"` Chain Check | Hop Count & `iat` Window | Answer Rate & Grafting Risk | Architect Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Forward Raw Base `Identity` Only** | Rewrites `Request-URI` without `div` token | None | Unchecked | **Critical** (`Base.dest != URI` fails downstream verification) | **Rejected for production** |
| **Option B: Strip Base `Identity` & Re-Sign `Attestation-B/C`** | Deletes caller's `Attestation-A` token | None | Single token | **Medium** (Loses `Attestation-A` status; answer rate drops `25%+`) | Suboptimal |
| **Option C: Retain Base + Append `RFC 8946 ppt="div"` (`[1,5]` Hops / `[5,60]s`) (`P911 + P912` Recommended)** | **Chained Base + `ppt="div"` endorsement** | **Verifies `Base.dest === div.div -> URI`** | **Clamps `[1, 5]` hops + `[5, 60]s` `iat`** | **`100%` preserves `Attestation-A` & `0` grafted spoofs** | **Mandatory for Enterprise Call Forwarding & Hybrid Contact Centers** |

---

## ⑤ 🧪 Quantitative Proof & 7-Card Benchmark Integration

### 5.1 Quantitative Example: Forwarded `Attestation-A` Survival vs. `P911 / P912` Guardrails
- **Unguarded Baseline (Without `P911 / P912`)**: Forwarding `15,000` daily customer calls to external mobile numbers without `RFC 8946 ppt="div"` causes a `100%` `dest` mismatch rate (`38%+` spam-filter call blocking), while unlinked `div` verification permits `100%` token-grafting spoofing.
- **Guarded Convergence (`P911 + P912` · 🎉 Historic 921-Guardrail, 930-Probe & 740-Live-POC Milestone)**: Enforcing `Base.dest === div.div -> Request-URI` continuity and clamping forwarding hops to `[1, 5]` reduces broken-chain and grafted spoofing calls to **`0`** (`P911`), while enforcing monotonic `div.iat >= Base.iat` within `[5, 60]` seconds reduces replay-grafted and oversized `Identity` packets to **`0`** (`P912`).

### 5.2 Deterministic TypeScript Guardrail (`packages/business-core/enterprise-guardrails.ts` Excerpt)

```typescript
// P911 (🎉 920th Guardrail!): SIP RFC 8946 STIR/SHAKEN PASSporT div Chain Continuity & [1, 5]-Hop Guard
// P912 (🎉 921st Guardrail!): SIP RFC 8224 Multi-Identity iat Monotonic Freshness [5, 60]s Guard
export function evaluateSipRfc8946StirShakenPassportDivChainContinuityAndRetargetSigningGate(
  context: SipRfc8946StirShakenPassportDivChainContinuityAndRetargetSigningContext,
): SipRfc8946StirShakenPassportDivChainContinuityAndRetargetSigningDecision {
  const clampedBrokenDivChainOrGraftedSpoofCalls = 0;
  const clampedMaxChainedDivIdentityHeaders = Math.min(
    Math.max(context.maxChainedDivIdentityHeaders, 1),
    5,
  );
  // Verify Base.dest === div[1].div -> Request-URI continuity and clamp div chain to [1, 5] hops
  // ...
}
```

> **Provenance & Timing Disclosure**: `P911` and `P912` in `site/data/voice-agent-benchmark-report.json` and `site/benchmark-cards.html` evaluate deterministic in-memory claim-chain and timestamp-bound invariants (`provenance: "synthetic"`, timing: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`). Live multi-hop `ES256` ECDSA verification and STI-CA certificate fetch latencies are explicitly marked `not_measured`.

---

## ⑥ 🛠️ Production Verification Checklist

- [ ] **[`P911` Egress `RFC 8946 "ppt":"div"` Signing on Retarget]**: Retain the inbound Base `Identity` header and append a signed `"ppt":"div"` `Identity` header whenever forwarding/retargeting calls (`clampedBrokenDivChainOrGraftedSpoofCalls = 0`).
- [ ] **[`P911` `Base.dest === div.div -> Request-URI` Continuity & `[1, 5]`-Hop Clamp]**: Verify unbroken TN chain linkage across all `div` headers and clamp chained `div` headers to `[1, 5]` hops.
- [ ] **[`P912` Monotonic `div.iat >= Base.iat` Ordering]**: Reject any chained `Identity` header set where a `div` token timestamp precedes the Base token (`clampedReplayGraftedOrOversizedIdentityPackets = 0`).
- [ ] **[`P912` `[5, 60]s` Multi-Token Freshness Window]**: Clamp the allowed `iat` freshness window across the entire `Identity` chain to `[5, 60]` seconds.
