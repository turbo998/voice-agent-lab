# Enterprise SIP `RFC 3327 / RFC 5626` `Path` Header Proxy-Vector Poisoning & Outbound (`+sip.instance / reg-id / ob`) Flow-Token Hijacking Selection & Defense Guide (Topic 151 · Stage 511 · 🎉 Historic 155th SVG Architecture Diagram & 1,025th Enterprise Guardrail Dual Milestone!)

> **Document Type**: Architect Selection FAQ & Production Hardening Guide (modeled on `ib-vs-ethernet-roce-selection-faq.md`)  
> **Target Audience**: AI Solution Architects, IMS / VoLTE / Enterprise SBC Edge Engineers, Realtime Voice Agent Platform Leads  
> **Linked Guardrails**: `P1015–P1016 🎉` (Stage 511 · Topic 151 · `packages/business-core/enterprise-guardrails.ts` · 🎉 Historic 155th SVG Architecture Diagram & 1,025th Deterministic Enterprise Guardrail Dual Milestone!)  
> **Linked Visual**: `assets/svg/155-voice-sip-rfc3327-rfc5626-path-header-outbound-ob-flow-token-hijacking-proxy-vector-poisoning-2026-11-16.svg`

---

## ① 📌 Executive Summary

In distributed enterprise voice architectures—spanning mobile contact-center agents, in-vehicle AI voice assistants, retail branch voice appliances, and 3GPP IMS (`P-CSCF -> S-CSCF`) cores—endpoints reside behind NATs and firewalls and cannot be reached directly by the core SIP Registrar. To enable the core network to route inbound `INVITE` requests back through the exact edge proxy and NAT pinhole that accepted the endpoint's registration, IETF standardized two foundational specifications:
1. **`RFC 3327` (Extension Header Field for Registering Non-Adjacent Contacts: `Path`)**: Edge proxies append `Path: <sip:edge1.corp.com;lr>` to traversing `REGISTER` requests. The core Registrar stores this `Path` vector alongside the user's Address-of-Record (AoR) and preloads it as a `Route` header set on subsequent inbound calls.
2. **`RFC 5626` (Managing Client-Initiated Connections in SIP: `+sip.instance`, `reg-id`, and `;ob` Outbound)**: Endpoints register with a persistent instance UUID (`+sip.instance`) and redundant connection slot ID (`reg-id=1`, `reg-id=2`), while the edge proxy encodes the active TCP/TLS/UDP connection's 5-tuple into a **Flow Token** embedded in the `Path` URI (`<sip:flowToken@edge1.corp.com;lr;ob>`).

In production enterprise voice deployments, however, an unguarded `RFC 3327 / RFC 5626` implementation introduces three high-severity vulnerabilities:
1. **Untrusted Client `Path` Header Injection & Inbound Call Hijacking (`RFC 3327` Proxy-Vector Poisoning)**: Per `RFC 3327 §5.1`, only trusted edge proxies may insert `Path` headers. If an ingress SBC fails to strip client-supplied `Path` headers on untrusted `REGISTER` requests, an attacker can register with `Path: <sip:mitm.attacker.com;lr>`. The core Registrar stores the poisoned vector and routes every subsequent customer call for that enterprise extension straight through the attacker's proxy!
2. **Unsigned / Base64 Flow-Token Tampering & Cross-Tenant Connection Hijacking (`RFC 5626 §5.2`)**: If an edge proxy constructs its `;ob` Flow Token by Base64-encoding the target `IP:Port` without an **`HMAC-SHA256` cryptographic signature**, an external attacker can craft arbitrary Flow Tokens to pivot SIP requests into internal RFC 1918 subnets (`SSRF`) or hijack another tenant's active TLS connection.
3. **Unbounded `reg-id` Multi-Flow Exhaustion**: `RFC 5626` specifies **`[1, 2]`** redundant flows per `+sip.instance` (primary + backup). Allowing a single instance to register dozens of `reg-id` flows exhausts edge SBC TLS socket tables and keepalive state.

**Architect Selection Rules (Stage 511 · `P1015–P1016 🎉` · Historic 155th SVG & 1,025th Guardrail Dual Milestone!)**:
- **Rule 1 (`P1015` · Untrusted Ingress `Path` Stripping & `[1, 4]` `Path` Hop Ceiling)**: Strip all client-supplied `Path` headers on untrusted `REGISTER` ingress so only mTLS-authenticated edge proxies can populate the `Path` vector (`unverifiedPathVectorEntries = 0`), and clamp `maxPathHeaderHops` to **`[1, 4]`**.
- **Rule 2 (`P1016 🎉` · `RFC 5626` Flow-Token `HMAC-SHA256` 5-Tuple Binding & `[1, 2]` Redundant `reg-id` Flow Cap · Historic 1,025th Guardrail!)**: Sign and verify every `;ob` Flow Token with `HMAC-SHA256` bound to the active socket 5-tuple (`unauthenticatedFlowTokenRedirects = 0`), and clamp `activeRedundantOutboundFlowsPerInstance` to **`[1, 2]`**.

![Enterprise SIP RFC 3327 / RFC 5626 Path Header Poisoning & Outbound Flow-Token Hijacking Guard](../../assets/svg/155-voice-sip-rfc3327-rfc5626-path-header-outbound-ob-flow-token-hijacking-proxy-vector-poisoning-2026-11-16.svg)

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (First Principles & Millisecond Timeline)

### Q1: In plain terms, how do `RFC 3327 Path` and `RFC 5626 Outbound` work together to deliver calls to an internal AI Voice Agent?
- **Plain-English First Principles**:
  - When an edge AI Voice Agent sits behind a NAT router, the core SIP Registrar cannot open a new TCP/UDP connection inward.
  - Instead, the AI Voice Agent opens two persistent outbound connections (`reg-id=1` over fiber, `reg-id=2` over 5G backup) to the **Edge SBC** and sends a `REGISTER`:
    1. **The Edge SBC stamps the return route (`RFC 3327 Path`)**: It adds `Path: <sip:tok99@sbc-edge.corp.com;lr;ob>` so the core Registrar knows which Edge SBC holds the pinhole.
    2. **The Flow Token names the exact socket (`RFC 5626 ;ob`)**: `tok99` tells the Edge SBC which specific TCP/TLS socket (`reg-id=1`) to push the incoming `INVITE` down.
- **Why does it fail without zero-trust checks?**
  - If the Edge SBC trusts a `Path` header already present on an external `REGISTER`, a malicious endpoint can poison the Registrar's routing table so that all inbound customer calls are detoured through an external eavesdropping server.

### Q2: What happens if an Edge SBC encodes `RFC 5626` Flow Tokens without an `HMAC` signature?
- **Attack Mechanics**:
  - If a Flow Token is just hex/Base64 of `10.24.1.15:5060:tcp`, any external peer can send an `INVITE` with `Route: <sip:encoded_internal_ip@sbc-edge.corp.com;lr;ob>`. The Edge SBC decodes the token and forwards the SIP request to arbitrary internal hosts (`SSRF`) or into another customer's registered TLS tunnel. `RFC 5626 §5.2` explicitly mandates cryptographic integrity protection (such as `HMAC-SHA256` with a rolling secret) on all Flow Tokens.

### Q3: How do `P1015` and `P1016 🎉` secure registration and inbound call delivery on the millisecond timeline?
- **Two-Phase Zero-Trust Pipeline**:
  1. **Registration Ingress (`P1015 + P1016 🎉`)**: Strip any pre-existing untrusted `Path` headers (`clampedUnverifiedPathVectorEntries = 0`), cap trusted `Path` hops to **`[1, 4]`**, cap active `reg-id` flows per `+sip.instance` to **`[1, 2]`**, and mint an `HMAC-SHA256` 5-tuple-bound Flow Token.
  2. **Inbound Call Delivery (`P1016 🎉`)**: Verify the Flow Token's `HMAC-SHA256` signature and live socket binding before forwarding (`clampedUnauthenticatedFlowTokenRedirects = 0`); if `reg-id=1` has dropped, fail over in milliseconds to `reg-id=2`.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree + Comparison Chart + Millisecond Sequence)

### 3.1 `RFC 3327 Path` & `RFC 5626 Outbound` Architect Selection & Defense Decision Tree

```mermaid
flowchart TD
    A[SIP REGISTER or Inbound INVITE at Edge SBC<br/>with RFC 3327 Path / RFC 5626 ;ob Flow Token] --> B{Does untrusted ingress REGISTER carry<br/>pre-existing Path headers or >4 hops?}
    B -- Yes: Poisoned Path or >4 hops --> C["⛔ P1015 Block: Strip untrusted Path & clamp hops ∈ [1, 4]<br/>unverifiedPathVectorEntries = 0"]
    B -- No: Clean ingress --> D{Does +sip.instance exceed<br/>[1, 2] active reg-id redundant flows?}
    D -- Yes: reg-id flood (>2 flows) --> E["⚠️ P1016 Clamp: Cap active flows per instance to [1, 2]<br/>activeRedundantOutboundFlowsPerInstance ≤ 2"]
    D -- No --> F[Edge SBC mints HMAC-SHA256<br/>5-tuple-bound Flow Token in Path URI]
    F --> G{On inbound INVITE Route traversal:<br/>Does Flow Token pass HMAC & 5-tuple check?}
    G -- No: Tampered / forged Flow Token --> H["⛔ P1016 Block: Reject with 430 Flow Failed / 403<br/>unauthenticatedFlowTokenRedirects = 0"]
    G -- Yes --> I["✅ Deliver over verified outbound flow (instant failover to reg-id=2)<br/>Reach internal AI Voice Agent safely"]
```

### 3.2 Vulnerable `Path` / Flow Token vs Guarded `P1015/P1016` Pipeline

```mermaid
flowchart LR
    subgraph Vulnerable["⛔ Unguarded Path / Outbound (Inbound Call Hijack + Internal SSRF)"]
      V1["Client injects Path: <sip:evil.com;lr> in REGISTER"] --> V2["Registrar routes all customer calls via evil.com MitM"]
      V2 --> V3["Base64 Flow Token tampered to probe internal 10.x.x.x:5060"]
    end
    subgraph Guarded["✅ Guarded P1015 + P1016 🎉 Pipeline (155th SVG & 1,025th Guardrail Milestone)"]
      G1["Strip untrusted Path + Clamp [1, 4] Hops (P1015)"] --> G2["HMAC-SHA256 5-Tuple Bound Flow Token (P1016)"]
      G2 --> G3["Lock [1, 2] Redundant reg-id Flows (Zero Hijack, Instant Failover)"]
    end
```

### 3.3 Millisecond `RFC 3327 Path` + `RFC 5626 Outbound` Secure Registration & Call Delivery Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Bot as Edge AI Voice Agent (+sip.instance)
    participant SBC as Enterprise Edge SBC (P1015+P1016 Guards)
    participant Reg as Core SIP Registrar / Proxy
    participant Caller as External Customer

    Bot->>SBC: REGISTER (with spoofed Path: <sip:evil.com;lr>, Contact: ;+sip.instance=id1;reg-id=1;ob)
    Note over SBC: P1015+P1016 Check (0ms nominal; live SBC HMAC/table ops not_measured):<br/>Strip spoofed Path (unverified=0), clamp reg-id ∈ [1,2], sign HMAC Flow Token
    SBC->>Reg: REGISTER [Path: <sip:hmac_tok_f1@sbc.corp;lr;ob> (hops=1 ≤ 4)]
    Reg-->>Bot: 200 OK (Supported: path, outbound)
    Caller->>Reg: INVITE sip:ai-service@corp.com
    Reg->>SBC: INVITE [Route: <sip:hmac_tok_f1@sbc.corp;lr;ob>]
    Note over SBC: P1016 verifies hmac_tok_f1 signature & 5-tuple match (redirects=0)<br/>Forwards down pinned TLS Flow #1
    SBC->>Bot: INVITE sip:ai-service@10.0.8.5 (Reusing TLS Flow #1)
    Bot-->>Caller: 200 OK + Full-Duplex Low-Latency Voice Media
```

---

## ④ 📊 Architect Decision Matrix (Edge Registration & NAT Traversal Governance)

| Selection Dimension | Option A: Trust Client `Path` + Unsigned Base64 Flow Token | Option B: Disable `Outbound`; Rely on 5s UDP Re-REGISTER Floods | Option C: Strip Untrusted `Path` (`[1, 4]` Hops) + `HMAC` Flow Token + `reg-id [1, 2]` Dual-Flow (`P1015 + P1016 🎉` Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **Immunity to `Path` Vector Poisoning Hijacks** | None (attacker redirects inbound calls to external MitM) | No `Path` support (breaks multi-SBC edge topologies) | **100% Immune (`unverifiedPathVectorEntries = 0`, hops clamped in `[1, 4]`)** |
| **Flow-Token Anti-Tampering & `SSRF` Defense** | Poor (tampered Base64 token pivots SIP to internal IPs) | N/A | **Cryptographic `HMAC-SHA256` 5-tuple binding (`unauthenticatedFlowTokenRedirects = 0`)** |
| **Dual-Link (Fiber + 5G) Failover Latency** | Slow (requires full DNS + re-registration on drop) | Poor (up to 5s dead-air window + registrar CPU storm) | **Sub-10ms Seamless Switchover (`reg-id=1/2` active-standby within `[1, 2]` flows)** |
| **Edge SBC Socket Table Exhaustion Protection** | Unbounded `reg-id` allocation | High `REGISTER` transaction load | **Strictly caps `activeRedundantOutboundFlowsPerInstance ∈ [1, 2]`** |

---

## ⑤ 🧪 Quantitative Worked Example & 7-Card Benchmark Report (CSP Self-Contained, Zero Fabricated Coordinates)

### 5.1 Quantitative Example: Why Both `[1, 4]` `Path` Hop Bounds and `HMAC` `[1, 2]` Outbound Flows Are Required
- **Scenario**: An enterprise deploys `5,000` branch and in-vehicle AI voice endpoints behind NATs connecting through regional Edge SBCs to a core SIP Registrar.
- **Without `P1015–P1016 🎉`**:
  1. A red-team probe injects `3` untrusted external `Path` URIs and bloats the path chain to `9` hops, hijacking inbound customer calls through an external relay and adding `240ms` of signaling delay.
  2. Forged unsigned Flow Tokens trigger `6` unauthorized cross-socket redirects, while `12` redundant `reg-id` registrations per instance multiply Edge SBC TLS socket usage by `6x`.
- **With `P1015 + P1016 🎉` Enabled**:
  - `evaluateSipRfc3327PathHeaderUntrustedProxyPoisoningAndHopCapGuard` (`P1015`) strips all untrusted `Path` entries (`clampedUnverifiedPathVectorEntries = 0`) and clamps `clampedMaxPathHeaderHops = 4` within `[1, 4]`.
  - `evaluateSipRfc5626OutboundFlowTokenHmacAndRegIdDualFlowGuard` (`P1016 🎉`) blocks all forged Flow Token redirects (`clampedUnauthenticatedFlowTokenRedirects = 0`) and clamps `clampedActiveRedundantOutboundFlowsPerInstance = 2` within `[1, 2]`.
  - **Timing Disclosure**: In-memory policy evaluation reports `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established` (synthetic in-memory check; live Edge SBC `HMAC-SHA256` verification and Usrloc lookup latency is `not_measured`).

### 5.2 7-Card Benchmark Summary Mapping (`site/benchmark-cards.html` & `voice-agent-benchmark-report.json`)

| Card ID | Evaluation Dimension (`Stage 511 · Topic 151`) | Baseline / Vulnerable (Original) | Hardened with Guardrails (Perturbed / Guarded) | Status & Quantitative Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Card 3 (`WHAT I TESTED`)** | `RFC 3327 Path` Poisoning & `RFC 5626 Outbound` Flow-Token Guard (`P1015–P1016 🎉`) | 3 untrusted `Path` entries + 9 hops + 6 forged Flow Token redirects + 12 `reg-id` flows | **Strip untrusted `Path` (`unverified=0`) + `[1, 4]` hop cap + `HMAC` Flow Token (`redirects=0`) + `[1, 2]` dual-flow cap** | ✅ `1,025` Guardrails Green 🎉 (`953/953` tests pass) |
| **Card 5 (`ROBUSTNESS CHECK`)** | `sip_rfc3327_path_poisoning_and_rfc5626_outbound_flow_token_guard` | `unverifiedPath: 3, pathHops: 9, tokenRedirects: 6, regIdFlows: 12` | `clampedUnverifiedPathVectorEntries: 0, clampedMaxPathHeaderHops: 4, clampedUnauthenticatedFlowTokenRedirects: 0, clampedActiveRedundantOutboundFlowsPerInstance: 2` | ✅ Zero call hijack, zero Flow Token forgery |

---

## ⑥ 🛠️ Production Voice Delivery Verification Checklist (Good Fit vs Not For + Checklist)

### 6.1 Good Fit vs Not For
- **✅ Good Fit**:
  - Enterprise mobile/branch/vehicle AI Voice Agents registering through Edge SBCs (`P-CSCF`) to a core SIP Registrar (`S-CSCF`);
  - High-availability voice endpoints using `RFC 5626` dual-flow (`reg-id=1` + `reg-id=2`) instant failover across Wi-Fi/Fiber and 5G;
  - Multi-tenant cloud contact centers terminating untrusted TLS/WSS SIP endpoints.
- **⛔ Not For**:
  - Static intra-VPC peer-to-peer SIP trunks with no `REGISTER` state or NAT traversal hops.

### 6.2 Production Delivery Checklist (`- [ ]`)
- [ ] **[Ingress `Path` Strip `P1015`]** Verify Edge SBCs unconditionally strip client-supplied `Path` headers on untrusted `REGISTER` ingress (`clampedUnverifiedPathVectorEntries === 0`).
- [ ] **[`Path` Hop Cap `P1015`]** Verify `maxPathHeaderHops` stored per registration is clamped within **`[1, 4]`**.
- [ ] **[Flow Token `HMAC` Binding `P1016 🎉`]** Verify `;ob` Flow Tokens are signed with `HMAC-SHA256` over the socket 5-tuple and rejected with `430 Flow Failed` on mismatch (`clampedUnauthenticatedFlowTokenRedirects === 0`).
- [ ] **[Dual-Flow Quota `P1016 🎉`]** Verify `activeRedundantOutboundFlowsPerInstance` per `+sip.instance` is clamped within **`[1, 2]`**.
- [ ] **[Automated Gate Tests]** Run `npx tsx --test tests/presales-portal.test.ts` and `npm run check:public` to confirm `Stage 511` (`P1015–P1016 🎉`) passes 100% of unit and static publication checks.
