# Enterprise WebRTC `RFC 7656 / RFC 5576` Media Taxonomy & `a=ssrc-group` Loop Defense (`FID/FEC-FR` Self-Referential SSRC-Group Cycles, Cross-Role SSRC Reuse & Unbounded `a=ssrc` SDP Attribute Floods) Selection & Anti-Overflow Guide

> **Document Type**: Enterprise Voice Agent Architect Selection & First-Principles Guide (Standalone Selection & Architecture FAQ · **Topic 116 / Stage 476 · 🎉 Historic 120th SVG Architecture Diagram & 955-Guardrail Dual Milestone**)  
> **Target Audience**: AI Solution Architects, WebRTC SFU/Media Engine Developers, Multimodal Voice/Video Architects & SRE Leads  
> **Canonical Baseline**: `packages/business-core/enterprise-guardrails.ts` (`P945–P946 🎉`), `tests/presales-portal.test.ts`, `site/data/voice-agent-benchmark-report.json` (7-Card 4:5 Benchmark Report)  
> **Visual Summary**: `assets/svg/120-voice-webrtc-rtp-rfc7656-rfc5576-media-taxonomy-ssrc-group-fid-fec-loop-2026-11-15.svg`

---

## ① 📌 Executive Summary

In enterprise WebRTC voice and multimodal contact centers, pairing primary media streams (`Opus` voice, `VP9/AV1` avatar video) with retransmission (`RFC 4588 RTX`) and forward error correction (`RFC 8627 FlexFEC`) streams relies on two foundational IETF standards: **`RFC 5576` (Source-Specific Media Attributes in SDP, defining `a=ssrc:<id> cname:...` and `a=ssrc-group:<semantics> <ssrc-1> <ssrc-2>` such as `FID`, `FEC-FR`, and `SIM`)** and **`RFC 7656` (A Taxonomy of Semantics and Mechanisms for RTP Sources, defining strict unidirectional relationships between `Source RTP Streams` and `Redundancy RTP Streams`)**. Without deterministic guardrails at the SDP signaling boundary, production SFUs and media gateways face two critical vulnerabilities:
1. **Self-Referential (`SSRC_1 == SSRC_2`) or Cyclic (`A -> B -> A`) `a=ssrc-group:FID / FEC-FR` Declarations Triggering Infinite Recursion and Stack Overflow in SFU Retransmission Engines (`RFC 5576 / RFC 7656` SSRC-Group Cycle Bomb)**: Under `RFC 5576 Section 4.2` and `RFC 4588`, `a=ssrc-group:FID <primary-ssrc> <rtx-ssrc>` binds a repair stream to its primary source stream. If a malformed or malicious SDP Offer declares a self-loop (`a=ssrc-group:FID 1001 1001`) or a cycle (`FID 1001 1002` + `FID 1002 1001`), media engines resolving `rtx_stream -> primary_stream` during NACK generation or `OSN` packet recovery enter an infinite pointer-chasing loop—crashing worker threads via stack overflow or pinning CPU cores at 100%!
2. **Intra-Group `cname` Mismatch Desynchronizing `RTX/FEC` Playout Timelines & Unbounded `a=ssrc` SDP Attribute Floods Exhausting SFU Memory (`RFC 5576` `CNAME` Desync & Pre-Allocation DoS)**: `RFC 5576` mandates that all SSRCs grouped under `FID` or `FEC-FR` belong to the same synchronization context and **must share an identical `a=ssrc:<id> cname:<value>`**. Mismatched `cname` values break jitter-buffer timeline recovery. Worse, an attacker can inject `512+` bogus `a=ssrc:` declarations inside a single `m=audio` section, forcing the SFU to pre-allocate hundreds of `RTPStream` state machines and `NetEq` buffers before a single RTP packet arrives!

| Decision Dimension | Vulnerable / Default Setup (High Production Risk) | Enterprise Golden Rule (`P945–P946 🎉` Deterministic Guardrails) | Quantitative Impact |
| :--- | :--- | :--- | :--- |
| **`RFC 5576 a=ssrc-group` Acyclic DAG & `[2, 4]`-Member Gate (`P945`)** | Accepting self-referential `FID 1001 1001`, cyclic groups, or `16`-member `a=ssrc-group` lines | **Enforce acyclic unidirectional `a=ssrc-group` graphs with strictly disjoint primary/repair SSRC sets, and clamp group member count to `[2, 4]`** | **0** cyclic or overlapping `a=ssrc-group` definitions (clamps 11 cyclic groups to **0** and caps group size from `16` to **`4` SSRCs**) |
| **`RFC 7656` Intra-Group `CNAME` Parity & `[1, 12]`-SSRC Per-`m=` Quota (`P946 🎉` 955th Guardrail)** | Allowing mismatched `cname`s inside `FID/FEC-FR` groups or `512` `a=ssrc:` declarations per `m=` line | **Enforce 100% `cname` parity across every `a=ssrc-group` and clamp declared unique SSRCs per `m=` section to `[1, 12]`** | **0** `cname`-mismatched or flooded `a=ssrc` declarations (clamps 15 violations to **0** and caps per-`m=` SSRCs from `512` to **`12`**) |

![2026-11-15 Enterprise Voice Agent WebRTC RFC 7656 Media Taxonomy & RFC 5576 a=ssrc-group Acyclic FID/FEC Binding Guard FAQ & Stage 476 Visual Summary (🎉 Historic 120th SVG & 955-Guardrail Dual Milestone!)](../assets/svg/120-voice-webrtc-rtp-rfc7656-rfc5576-media-taxonomy-ssrc-group-fid-fec-loop-2026-11-15.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (First-Principles Deep Dive)

### Q1: How can a single SDP line `a=ssrc-group:FID 20001 20001` crash a multi-core WebRTC SFU worker thread?
- **First-Principles Breakdown**:
  1. Per **`RFC 7656 Section 2.1.10`** and **`RFC 4588`**, a redundancy RTP stream (`RTX` or `FlexFEC`) repairs a specific `Source RTP Stream`. When an `RTX` packet arrives, the SFU unwraps the 16-bit Original Sequence Number (`OSN`) and looks up the associated primary stream via its `FID` dependency pointer.
  2. If the SDP parser allows `primary_ssrc == repair_ssrc` or cyclic dependencies (`A -> B -> A`), recursive target resolution loops infinitely.
  3. **`P945` Deterministic Defense**: Verifies that all `a=ssrc-group` lines form a strict Directed Acyclic Graph (DAG) with disjoint primary and repair SSRC sets, and clamps member count per group to **`[2, 4]`**.

### Q2: Why must every SSRC inside an `a=ssrc-group:FID` or `FEC-FR` share the exact same `cname`?
- **Engineering Reality**:
  1. Per **`RFC 5576 Section 4.2`**, `FID` associates a media stream with its retransmission/FEC repair stream originating from the **same media source and capture clock**.
  2. If the primary and repair SSRCs advertise different `cname` attributes, receivers treat them as independent clock domains and drop recovered packets.

### Q3: Why is `[1, 12]` unique SSRCs per `m=` media section the optimal enterprise ceiling (`P946 🎉`)?
- **First-Principles Breakdown**:
  - Even a full 3-layer Simulcast `m=video` section requires at most `3` primary SSRCs + `3` `RTX` SSRCs + `3` `FlexFEC` SSRCs = **`9` SSRCs** (`m=audio` needs `1–2`).
  - **`P946 🎉` (🎉 Historic 955th Guardrail) Deterministic Defense**: Enforces intra-group `cname` equality and caps unique declared SSRCs per `m=` section at **`[1, 12]`**, neutralizing pre-allocation memory exhaustion attacks.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Loop Breakdown + Millisecond Sequence)

### 3.1 WebRTC `RFC 5576 a=ssrc-group` Acyclic DAG & `RFC 7656 SSRC` Quota Decision Tree

```mermaid
flowchart TD
    A["Receive WebRTC SDP Offer/Answer With a=ssrc & a=ssrc-group"] --> B{"1. Are All a=ssrc-group (FID/FEC-FR/SIM) Lines Acyclic With Disjoint Roles?<br/>And Is Member Count Within [2, 4] SSRCs? (P945)"}
    B -- "No (Self-Loop FID 1001 1001, Role Overlap, or 16-Member Group)" --> C["⛔ P945 Block Cycle: Reject Self-Referential & Cyclic SSRC Groups in 0ms<br/>Enforce Disjoint Primary/Repair Sets & Clamp Members to [2, 4]"]
    B -- "Yes (Acyclic DAG + [2, 4] Members)" --> D{"2. Do Grouped SSRCs Share Identical cname Values?<br/>And Are Unique Declared SSRCs Per m= Line <= 12? (P946 🎉)"}
    D -- "No (Intra-Group cname Mismatch or 512-SSRC Attribute Flood)" --> E["🛡️ P946 🎉 Align & Truncate: Enforce Intra-Group cname Parity<br/>Drop Excess Declarations & Clamp Per-m= SSRC Quota to [1, 12]"]
    D -- "Yes (Matching cname + <=12 SSRCs)" --> F["✅ Zero Stack-Overflow Loops · Zero RTX Desync · Zero RAM Exhaustion"]
```

### 3.2 Vulnerable `a=ssrc-group` Cycle + `512-SSRC` Flood vs. `P945+P946 🎉`

```mermaid
flowchart LR
    subgraph BadSsrcGroup["❌ Vulnerable Baseline (FID Self-Loop Crash + 512-SSRC Memory Bomb)"]
      A1["SDP Injects Self-Loop a=ssrc-group:FID 1001 1001"] --> A2["RTX Unpacker Enters Infinite Recursion -> Worker Crash!"]
      A2 --> A3["512 Fake a=ssrc Lines Per m= Section Exhaust SFU RAM!"]
    end

    subgraph GoodSsrcGroup["✅ P945 + P946 🎉 (Acyclic [2,4] DAG + CNAME Parity + <=12 SSRCs)"]
      B1["Disjoint Primary -> Repair DAG ([2,4] Members Per Group)"] --> B2["100% Intra-Group CNAME Parity Ensures Seamless RTX Recovery"]
      B2 --> B3["Per-m= SSRC Quota Clamped to [1,12] · Zero Memory Bloat"]
    end
```

### 3.3 Millisecond-Level WebRTC Simulcast + RTX `RFC 7656 & RFC 5576` Admission Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client WebRTC Endpoint
    participant Edge as Edge Signaling/SFU Gate (P945+P946 🎉)
    participant Router as SFU Media Router & RTX Engine

    Client->>Edge: 1. SDP Offer (Contains a=ssrc-group:FID / SIM & a=ssrc Attributes)
    Note over Edge: 🛡️ P945 Verifies Acyclic a=ssrc-group DAG, Disjoint Primary/Repair SSRCs<br/>& Group Member Count ∈ [2, 4]<br/>🛡️ P946 🎉 (955th Guard) Verifies 100% Intra-Group cname Parity & Per-m= SSRC Count ∈ [1, 12]
    Edge->>Router: 2. Commits Verified Acyclic (Primary -> RTX/FEC) Table (<=12 SSRCs/m-line)
    Router-->>Client: 3. SDP Answer (200 OK · Zero Recursion Crashes · Zero Pre-Allocation Leaks)
```

---

## ④ 📊 Architect Decision Matrix (`a=ssrc-group` & Media Taxonomy Governance)

| Architecture Option | Target Scenario | Pros | Cons & Production Traps | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Unvalidated `a=ssrc-group` & Unbounded `a=ssrc` Ingestion** | Prohibited in production SFUs | Zero signaling validation | **Vulnerable to 1-packet `FID` self-loop crashes and `a=ssrc` memory exhaustion DoS** | ⛔ **Never in Production** |
| **Option B: Limiting Total SDP Byte Length Without DAG or `cname` Validation** | Basic lab environments | Caps total packet size | **A 30-byte `a=ssrc-group:FID 1 1` line still bypasses byte limits and crashes RTX recovery** | ⚠️ **Incomplete Defense** |
| **Option C: `RFC 5576` Acyclic Disjoint `a=ssrc-group` (`[2, 4]` Members) + `RFC 7656` Intra-Group `CNAME` Parity & `[1, 12]`-SSRC Quota (`P945 + P946 🎉`)** | **All Enterprise WebRTC Voice Gateways, Simulcast SFUs & Multimodal Avatar Clusters** | **100% immune to SSRC-group recursion loops, guarantees RTX timeline parity, blocks RAM bombs** | Requires O(N) DAG cycle check and per-`m=` SSRC counting during SDP parsing | ✅ **Production Mandatory (Recommended)** |

---

## ⑤ 🧪 Quantitative Walkthrough & 7-Card 4:5 Benchmark Report

### 5.1 Quantitative Example: Multimodal WebRTC Gateway Defending Against `FID` Cycle Bombs & `512-SSRC` Floods
- **Scenario**: During adversarial fuzzing, an SFU receives SDP Offers containing `11` cyclic/self-referential `a=ssrc-group` lines (`16` SSRCs per group) and `15` `cname`-mismatched or flooded `m=` sections (`512` declared SSRCs per `m=` line).
  - **Without Guardrails (Vulnerable Baseline)**:
    - `11` cyclic `FID` groups crash media threads via infinite recursion;
    - `512` pre-allocated SSRCs per `m=` line inflate per-call memory by `42x`.
  - **With `P945 + P946 🎉` Deterministic Guardrails (🎉 Historic 120th SVG & 955-Guardrail Dual Milestone)**:
    - `P945` rejects all cyclic/overlapping groups (**`0`** cyclic SSRC groups) and clamps group member count from `16` to **`4`** (`[2, 4]` members);
    - `P946 🎉` (🎉 **Historic 955th Guardrail**) enforces intra-group `cname` parity (**`0`** mismatched/overflowed declarations) and clamps declared SSRCs per `m=` section from `512` to **`12`** (`[1, 12]` SSRCs).

### 5.2 7-Card 4:5 Report Mapping (`site/benchmark-cards.html` & `report.json`)
1. **Card 1 (`HANDS-ON · VOICE ARCHITECTURE`)**: 479-dimension workbench overview highlighting `P945 / P946 🎉` (🎉 Historic 120th SVG & 955-Guardrail Dual Milestone).
2. **Card 2 (`SCENARIO: WEBRTC RFC 7656 & RFC 5576`)**: Input probe `cyclicOrSelfReferentialSsrcGroupFidFecDetected=true, maxSsrcPerGroupCount=16, maxDeclaredSsrcsPerMediaSection=512` -> `Act automatically` clamping to `4` and `12`.
3. **Card 3 (`WHAT I TESTED`)**: Row 479 in the evaluation matrix (`PASS · 0ms @ 1ms Res (Synthetic)`, zero `✕` misses).
4. **Card 4 (`UNDER THE HOOD`)**: Deterministic contract for `evaluateWebrtcRfc5576SsrcGroupFidFecAcyclicBindingAndDisjointRoleGate` & `evaluateWebrtcRfc7656MediaSourceTaxonomySsrcAttributeQuotaAndCnameMatchGate`.
5. **Card 5 (`ROBUSTNESS CHECK`)**: Option-order and boundary invariance across `FID`, `FEC-FR`, and `SIM` SSRC groups.
6. **Card 6 (`LATENCY`)**: Explicit offline timing provenance: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (`synthetic`; live SFU `RTPStream` hash-table allocation and `OSN` lookup latency is `not_measured`).
7. **Card 7 (`MY TAKE`)**: Good fit vs. Not for summary and production sign-off checklist.

---

## ⑥ 🛠️ Production Readiness Checklist

- [ ] **1. Reject Self-Referential & Cyclic `RFC 5576 a=ssrc-group` Lines (`P945`)**: Verify that SDP parsers reject `SSRC_1 == SSRC_2` and any multi-group cycle (`A -> B -> A`).
- [ ] **2. Enforce Disjoint Primary vs. Repair (`RTX / FlexFEC`) SSRC Sets (`P945`)**: Confirm per `RFC 7656` that no repair SSRC is simultaneously used as a primary source stream or shared across multiple primary streams.
- [ ] **3. Clamp `a=ssrc-group` Member Count to `[2, 4]` SSRCs (`P945`)**: Ensure `FID`/`FEC-FR` groups contain `2` SSRCs and `SIM` groups contain at most `4` SSRCs.
- [ ] **4. Enforce 100% Intra-Group `cname` Equality (`P946 🎉`)**: Verify that all SSRCs linked inside an `FID` or `FEC-FR` group advertise the exact same `a=ssrc:<id> cname:<value>`.
- [ ] **5. Clamp Declared Unique SSRCs Per `m=` Section to `[1, 12]` (`P946 🎉`)**: Cap pre-allocated `a=ssrc` declarations per media section at `12` to prevent SFU memory exhaustion.
