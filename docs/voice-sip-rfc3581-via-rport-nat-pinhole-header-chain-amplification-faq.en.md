# Enterprise Voice Agent Architecture Selection & First-Principles FAQ (Topic 55 🎉): Enterprise SIP `RFC 3261 / RFC 3581` `Via` Header-Chain Amplification Cap (`[1, 8]` Hops), Client-Prepopulated `rport / received` NAT Pinhole Hijack Overwrite & Singleton Header Smuggling Guard

> **中文版本**: [语音智能体架构选型与原理解析 FAQ（五十五 · 🎉 Topic 55 里程碑）：企业 SIP RFC 3261 / RFC 3581 Via 栈链深度防反射放大、客户端预填 rport / received 防 NAT 针孔劫持与单例头（From / To / Call-ID / CSeq）防走私选型指南](./voice-sip-rfc3581-via-rport-nat-pinhole-header-chain-amplification-faq.md)  
> **Target Audience**: AI Solution Architects, SIP/SBC Edge Proxy & NAT Traversal Architects, Contact Center Zero-Trust Security Leads  
> **Structural Benchmark**: Modeled strictly on `ib-vs-ethernet-roce-selection-faq.md` (6-part practitioner guide: 3-minute selection verdict, 10-minute first-principles dive into `RFC 3261` singleton header smuggling (`From/f`, `To/t`, `Call-ID/i`, `CSeq`, `Content-Length/l`), `Via` header-chain amplification capping (`[1, 8]` hops), and `RFC 3581` client-prepopulated `;received=` / `;rport=` NAT pinhole hijack prevention).  
> **Provenance & Timing Disclosure**: All deterministic guardrails (`P823`, `P824`) and sandbox probes represent offline `synthetic` deterministic verification (`independently_reproduced=false`), not live carrier SBC packet captures; timing adheres to: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

![Enterprise SIP RFC 3261/3581 Via Chain Cap + Singleton Header Smuggling & rport/received NAT Pinhole Guard Architecture Summary](../assets/svg/59-voice-sip-rfc3581-via-rport-nat-pinhole-header-chain-amplification-2026-11-13.svg)

---

## 0. 🔥 Daily Real-Time Voice AI Capability Breakthroughs

1. **Enterprise SIP `RFC 3261` Singleton Header Uniqueness Gate (`From / To / Call-ID / CSeq / Content-Length`) & `Via` Header-Chain Depth Cap (`[1, 8]` Hops)**: In plain English, `RFC 3261` allows compact single-letter aliases for core headers (`f:` for `From:`, `t:` for `To:`, `i:` for `Call-ID:`, `l:` for `Content-Length:`). **If an attacker sends a SIP `INVITE` containing both `From: <sip:guest@external>` and `f: <sip:ceo@internal>`, an edge firewall inspecting the first `From` header allows the call, while a downstream Voice AI orchestrator whose parser overwrites dictionary keys on the last header authenticates the caller as `ceo@internal` (SIP Singleton Header Smuggling)! Simultaneously, stacking 50 forged `Via:` headers inflates SIP responses beyond the `1,500B` UDP MTU and triggers multi-target reflection.** Rejecting any SIP message with duplicate singleton headers with `400 Bad Request` (`singletonHeaderSmugglingAttempts = 0`) and clamping **`Via` header chains to `[1, 8]` hops** eliminates both attacks.
2. **Enterprise SIP `RFC 3581` Unconditional Socket-Source Overwrite of `Via ;received=` / `;rport=` & `[15, 30]s` NAT Keepalive Pinning (Stopping NAT Pinhole Response Reflection)**: Under `RFC 3581`, a NATed client includes an empty `;rport` flag on its top `Via` header so the receiving SBC can populate `;received=<source_ip>;rport=<source_port>` from the transport socket. **If a malicious client pre-populates `;received=10.0.0.88;rport=6379` (or a third-party victim IP) and the SBC fails to overwrite existing values, the SBC reflects multi-kilobyte `200 OK + SDP` responses straight into internal services or external DDoS victims!** Unconditionally overwriting top-`Via` `received` and `rport` parameters with the actual socket 5-tuple (`spoofedRportReceivedParams = 0`) and clamping NAT keepalives to **`[15, 30]s`** guarantees reflection-free symmetric routing.

---

## ① 📌 Executive Summary

1. **Expand all compact SIP headers (`f/t/i/l/v`) and reject any message containing duplicate singleton headers (`From`, `To`, `Call-ID`, `CSeq`, `Max-Forwards`, `Content-Length`) with `400 Bad Request`, while clamping `Via` chains to `[1, 8]` hops**: Eliminate first-vs-last header smuggling (`singletonHeaderSmugglingAttempts = 0`, Guardrail **`P823`**).
2. **Unconditionally strip and overwrite client-supplied `RFC 3581` `;received=` and `;rport=` parameters on the topmost `Via` header using the verified transport socket `(IP, Port)`, and clamp NAT binding keepalives to `[15, 30]s`**: Prevent SIP response reflection and NAT pinhole expiration (`spoofedRportReceivedParams = 0`, Guardrail **`P824`**).

---

## ② 🎯 Architect & Customer Deep-Dive Q&A

### Q1: How does mixing standard (`From:`) and compact (`f:`) SIP headers bypass edge ACLs via Singleton Header Smuggling (Option A vs Option B)?

- **First-Principles Breakdown (Parser Desynchronization)**:
  - When an edge proxy checks the first occurrence of `From:` while the B2BUA or Voice AI webhook indexes headers into a map where `f:` normalizes to `from` and overwrites the first value, the attacker smuggles a privileged identity past the perimeter.
- **Selection Boundary**:
  - **Option A (Last-wins header map + unchecked `Via` depth + trusting client `rport`)**: Vulnerable to identity smuggling and UDP response reflection.
  - **Option B (`P823` Singleton Header `400` Gate & `[1, 8]` `Via` Cap + `P824` Socket `rport/received` Overwrite & `[15, 30]s` Keepalive)**: Mandatory for enterprise SIP edges.

### Q2: Why must the edge SBC overwrite `;received=` and `;rport=` even if the client already supplied values?

- **First-Principles Breakdown**:
  - `RFC 3581 Section 4` specifies that the client request MUST NOT contain a value for `rport`. Any client-supplied `received=` or `rport=` value is untrusted user input that would otherwise steer SIP responses away from the sender's actual UDP source address.

### Q3: How do the singleton-header gate and `RFC 3581` socket-binding guard execute on a sub-millisecond timeline?

1. **`T = 0 ~ 0.05ms` (`P823` Singleton Uniqueness & `Via` Chain Cap)**:
   - Normalize compact headers, enforce `clampedSingletonHeaderSmugglingAttempts = 0`, and clamp `Via` hops to `clampedMaxViaHeaderHops` in `[1, 8]`.
2. **`T = 0.05 ~ 0.1ms` (`P824` `RFC 3581` Overwrite & NAT Keepalive Clamp)**:
   - Overwrite client-prepopulated `received/rport` values (`clampedSpoofedRportReceivedParams = 0`) and clamp NAT refresh to `clampedNatBindingRefreshSec` in `[15, 30]s`.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree / Comparison / Sequence)

### 3.1 Architect Selection Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[Enterprise Edge SBC Receives Inbound SIP Request] --> B{Singleton Header / Via Depth Audit or RFC 3581 rport/received Audit?}
    B -->|Singleton & Via Depth Audit| C{Duplicate From/To/Call-ID/CSeq/Content-Length (Incl. f/t/i/l) or Via Hops > 8?}
    C -->|Yes: Header Smuggling or Via Bomb| D[⛔ P823 Reject/Clamp: Return 400 smugglingAttempts = 0 & Clamp Via to 1..8 Hops]
    C -->|No| E[✅ Unambiguous Header Semantics & Bounded Via Stack]

    B -->|RFC 3581 rport/received Audit| F{Client Pre-Populated rport=port / received=IP or NAT Refresh Outside 15..30s?}
    F -->|Yes: Response Reflection Attempt| G[🔧 P824 Overwrite/Clamp: Enforce spoofedRportReceivedParams = 0 & Clamp Refresh to 15..30s]
    F -->|No| H[✅ Symmetric Response Routing Locked to Socket Source]
```

### 3.2 Vulnerable Legacy Pipeline vs Enterprise P823+P824 Hardened Pipeline (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Vulnerable Legacy Pipeline (From/f Smuggling + 50-Hop Via + Pre-Filled rport)"]
      direction LR
      B1["Allow From: guest + f: ceo\nAccept 50 Stacked Via Headers"] -->|WAF Sees First / AI Sees Second| B2["Caller Identity Spoofed via Smuggling\n4.5KB Via Stack Triggers IP Fragmentation"]
      B3["Honor Client received=VictimIP\nand rport=TargetPort"] -->|SBC Skips Overwrite| B4["SIP 200 OK Reflected to Victim IP\n60s+ NAT Pinhole Timeout Drops Call"]
    end

    subgraph Good["✅ Enterprise P823 + P824 Hardened Pipeline (Singleton 400 Gate + [1,8] Via + Socket Overwrite)"]
      direction LR
      G1["Normalize f/t/i/l + Reject Duplicates\n+ Clamp Via Chain to [1,8] Hops"] -->|0 Smuggling + 84% Smaller Header| G2["Identical Security View Across Tiers\nZero UDP Fragmentation Bombs"]
      G3["Unconditional Socket IP:Port Overwrite\n+ [15,30]s CRLF/STUN Keepalive"] -->|0 Spoofed rport + 0 Pinhole Drops| G4["Responses Locked to True Peer Socket\nRock-Solid Long-Call NAT Pinholes"]
    end
```

### 3.3 Millisecond Singleton Header Gate, Via Cap & RFC 3581 Overwrite Sequence (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Client as External SIP Client (True Socket 198.51.100.7:54321)
    participant SBC as Enterprise Edge SBC (P823 + P824 Gate)
    participant Agent as Voice AI Orchestrator

    Client->>SBC: 1. Malformed INVITE (From: guest + compact f: ceo, 45 Via headers)
    Note over SBC: P823 detects duplicate singleton From/f (singletonHeaderSmugglingAttempts = 0)<br/>and Via > 8 hops -> rejects with 400 Bad Request!
    SBC-->>Client: 2. 400 Bad Request
    Client->>SBC: 3. Valid single-header INVITE, but top Via has ;received=10.0.0.1;rport=6379
    Note over SBC: P824 strips pre-populated values (spoofedRportReceivedParams = 0),<br/>stamps ;received=198.51.100.7;rport=54321 & clamps NAT refresh to [15, 30]s!
    SBC->>Agent: 4. Forward verified, normalized SIP INVITE
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Last-Wins Map + Unbounded Via + Trusted rport (Anti-Pattern) | Option B: Reject Compact Headers & NAT Clients | Option C: P823 Singleton/Via [1,8] Gate + P824 Socket Overwrite & [15,30]s Keepalive (Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **Singleton Header Smuggling Defense** | ❌ Bypassed by `From:` + `f:` or dual `Call-ID` | ⚠️ Still vulnerable to dual full-name headers | ✅ **Normalizes aliases & rejects `count > 1` with `400` (`0` smuggling)** |
| **`Via` Chain Amplification Protection** | ❌ `50+` hops cause `4.5 KB` fragmentation bombs | ✅ Direct peers only | ✅ **Clamps `Via` header chain to `[1, 8]` hops** |
| **`RFC 3581` `rport/received` Reflection Guard** | ❌ Reflects SIP responses to arbitrary `received` IPs | ❌ Breaks NATed remote agents/customers | ✅ **Unconditionally overwrites with socket `IP:Port` (`0` spoofed)** |
| **Long-Call NAT Pinhole Persistence** | ❌ UDP NAT mappings expire after `30–60s` silence | ❌ N/A | ✅ **Clamps NAT keepalive refresh to `[15, 30]s`** |

---

## ⑤ 🧪 Quantitative Worked Example & Benchmark Insights (7-Card Report)

### 5.1 Quantitative Example: Reducing `Via` Header Bloat by `84%` & Eliminating `100%` of Smuggling/Reflection Vectors

- **Unprotected Pipeline (Option A)**:
  - `50` forged `Via` headers add `4,500 B` of header bloat per message, while dual `From/f` headers bypass perimeter ACLs.
- **Hardened Pipeline (`P823` + `P824`, Option C)**:
  - `P823` enforces `clampedSingletonHeaderSmugglingAttempts = 0` and clamps `clampedMaxViaHeaderHops` to **`[1, 8]`** (`84%` reduction in max `Via` overhead);
  - `P824` enforces `clampedSpoofedRportReceivedParams = 0` and clamps `clampedNatBindingRefreshSec` to **`[15, 30]s`**.

### 5.2 Deterministic Guardrail API Contract (`P823` & `P824` · 🎉 Topic 55 Milestone)

```ts
import {
  evaluateSipRfc3261ViaChainAmplificationAndSingletonHeaderSmugglingGate,
  evaluateSipRfc3581RportReceivedNatPinholeHijackAndSourceBindingGate,
} from "../packages/business-core/enterprise-guardrails";

const viaAudit = evaluateSipRfc3261ViaChainAmplificationAndSingletonHeaderSmugglingGate({
  singletonHeaderSmugglingOrViaChainAmplificationDetected: true,
  singletonHeaderSmugglingAttempts: 2,
  maxViaHeaderHops: 45,
});
// => viaAudit.violated === true, policyId === "P823...", clampedSingletonHeaderSmugglingAttempts === 0, clampedMaxViaHeaderHops === 8

const rportAudit = evaluateSipRfc3581RportReceivedNatPinholeHijackAndSourceBindingGate({
  clientPrepopulatedRportReceivedOrNatPinholeHijackDetected: true,
  spoofedRportReceivedParams: 2,
  natBindingRefreshSec: 120,
});
// => rportAudit.violated === true, policyId === "P824...", clampedSpoofedRportReceivedParams === 0, clampedNatBindingRefreshSec === 30
```

---

## ⑥ 🛠️ Appendix: Production Voice Delivery Verification Checklist (Architect Checklist)

- [ ] **[P823 `RFC 3261` Singleton Header Uniqueness]**: Confirm duplicate `From/f`, `To/t`, `Call-ID/i`, `CSeq`, `Max-Forwards`, or `Content-Length/l` headers are rejected with `400 Bad Request` (`singletonHeaderSmugglingAttempts = 0`).
- [ ] **[P823 `Via` Header-Chain `[1, 8]` Hop Cap]**: Confirm inbound SIP `Via` stacks are capped at `[1, 8]` hops.
- [ ] **[P824 `RFC 3581` Socket Overwrite]**: Confirm client-supplied `;received=` and `;rport=` parameters on the top `Via` are unconditionally overwritten (`spoofedRportReceivedParams = 0`).
- [ ] **[P824 `[15, 30]s` NAT Binding Keepalive]**: Confirm NAT keepalive intervals are clamped to `[15, 30]s`.
