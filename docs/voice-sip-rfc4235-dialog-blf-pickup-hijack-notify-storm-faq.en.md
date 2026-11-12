# Enterprise Voice Agent Architecture Selection & First-Principles FAQ (Topic 49 · 🎉 830-Probe Milestone): Enterprise SIP `RFC 4235` Dialog Event Package (`Event: dialog` BLF) Call-Tag Redaction Anti-Pickup Hijack & `RFC 6665 / RFC 5263 NOTIFY` `max-rate` Event Storm Throttle Guard

> **中文版本**: [语音智能体架构选型与原理解析 FAQ（四十九）：企业 SIP RFC 4235 对话事件包（BLF 状态灯）呼叫标签脱敏防跨组抢话劫持与 RFC 6665 未订阅 NOTIFY 拦截及 max-rate 限流指南（🎉 830 大探针里程碑）](./voice-sip-rfc4235-dialog-blf-pickup-hijack-notify-storm-faq.md)  
> **Target Audience**: AI Solution Architects, Enterprise IP-PBX & Human-in-the-Loop Contact Center Leads, Telecom Signaling Security Architects  
> **Structural Benchmark**: Modeled strictly on `ib-vs-ethernet-roce-selection-faq.md` (6-part practitioner guide: 3-minute selection verdict, 10-minute first-principles dive into `SIP RFC 4235` Dialog Event Package `call-id / local-tag / remote-tag` XML redaction to prevent unauthorized directed call-pickup hijacking, `RFC 6665` mandatory `481` rejection of unsolicited out-of-dialog `NOTIFY` requests, and `RFC 5263 / RFC 6446` `[1, 5]/s` `max-rate` notification throttling).  
> **Provenance & Timing Disclosure**: All deterministic guardrails (`P811`, `P812`) and sandbox probes represent offline `synthetic` deterministic verification (`independently_reproduced=false`), not live PBX captures; timing adheres to: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

![SIP RFC 4235 BLF Dialog-Tag Redaction Anti-Pickup Gate & RFC 6665/5263 NOTIFY Storm Guard Architecture Summary](../assets/svg/53-voice-sip-rfc4235-dialog-blf-pickup-hijack-notify-storm-2026-11-12.svg)

---

## 0. 🔥 Daily Real-Time Voice AI Capability Breakthroughs

1. **Enterprise SIP `RFC 4235` Dialog Event Package (`Event: dialog` BLF) XML Call-Tag Redaction & Pickup-Group RBAC Verification (Stopping Unauthorized `INVITE Replaces:` Call Interception)**: In plain English, enterprise desk phones and AI-assisted operator consoles subscribe to the **`SIP RFC 4235` Dialog Event Package (`Event: dialog`)** to light up Busy Lamp Field (BLF) indicators showing whether an extension or AI agent is idle (`terminated`), ringing (`early`), or on a call (`confirmed`). **In legacy IP-PBXs, the `application/dialog-info+xml` payload broadcast to *every* BLF watcher includes the raw `<dialog id="..." call-id="..." local-tag="..." remote-tag="...">` attributes and `<remote><identity>` caller ANI!** Because `Call-ID + local-tag + remote-tag` are the exact secret credentials required to execute a directed call pickup via `SIP INVITE Replaces:` (`RFC 3891`), any ordinary extension allowed merely to *see* if an executive's line is busy can silently hijack and answer the executive's ringing call! By **stripping `call-id`, `local-tag`, `remote-tag`, and `<remote>` identity from BLF XML payloads sent to non-pickup-group watchers (`leakedDialogTagAttributes = 0`)** and enforcing **`blfPickupGroupAclVerified = true`** on pickup attempts, gateways eliminate BLF-assisted call hijacking.
2. **SIP `RFC 6665` Unsolicited `NOTIFY` `481` Rejection & `RFC 5263 / RFC 6446 max-rate [1, 5]/s` Event Storm Throttling (Stopping Remote `Event: talk` Auto-Answer Wiretapping & $O(N^2)$ BLF Floods)**: Legacy SIP endpoints often accepted out-of-dialog **"unsolicited `SIP NOTIFY`"** requests (`Event: talk`, `Event: check-sync`, `Event: message-summary`) without a prior `SUBSCRIBE` dialog—allowing an attacker to send a single forged `NOTIFY Event: talk` packet that forces an agent softphone or IP phone to go off-hook and open its microphone! Meanwhile, simultaneous ring-groups across 500 contact-center seats trigger $O(N^2)$ `NOTIFY` XML floods when state transitions aren't rate-limited. Enforcing **`RFC 6665` strict subscription-dialog matching (`0` unsolicited `NOTIFY` accepted; immediate `481 Subscription Does Not Exist`)** and clamping per-subscription notification rates to **`[1, 5]/s`** stops both remote off-hook injection and presence CPU collapse.

---

## ① 📌 Executive Summary

1. **Redact `call-id`, `local-tag`, `remote-tag`, and `<remote>` caller URIs from `RFC 4235` (`Event: dialog`) BLF XML notifications for non-pickup-group watchers**: Presence-only watchers must receive state-only XML (`<state>early</state>`, `leakedDialogTagAttributes = 0`), and directed call pickup (`INVITE Replaces:`) must verify `blfPickupGroupAclVerified = true` (Guardrail **`P811`**).
2. **Reject 100% of unsolicited out-of-dialog `SIP NOTIFY` requests with `481 Subscription Does Not Exist` (`RFC 6665`)**: Never process `Event: talk / check-sync / refer / dialog` notifications lacking an authenticated, active `SUBSCRIBE` dialog (`unsolicitedNotifyAccepted = 0`, Guardrail **`P812`**).
3. **Clamp per-subscription `SIP NOTIFY` emission rate to `[1, 5]` notifications/sec (`RFC 5263 / RFC 6446 max-rate`)**: Coalesce sub-second `trying -> early -> confirmed` state transitions to prevent $O(N^2)$ XML fan-out storms (Guardrail **`P812`**).

---

## ② 🎯 Architect & Customer Deep-Dive Q&A

### Q1: Why does broadcasting raw `RFC 4235` `dialog-info+xml` payloads let any BLF watcher steal a ringing VIP call (Option A vs Option B)?

- **First-Principles Breakdown (Capabilities Leaked Inside Presence XML)**:
  - `RFC 3891` (`Replaces`) treats knowledge of `(Call-ID, to-tag, from-tag)` as authorization to take over an early or confirmed dialog. When an IP-PBX includes those three attributes in `RFC 4235` BLF notifications sent to every receptionist or floor phone, it broadcasts live call-takeover tokens across the LAN.
- **Selection Boundary**:
  - **Option A (Broadcast full `call-id / local-tag / remote-tag` to all BLF subscribers)**: Allows trivial cross-department call interception and CPNI/ANI snooping.
  - **Option B (`P811` State-Only BLF XML Redaction + Pickup-Group RBAC + `P812` Zero Unsolicited `NOTIFY` & `[1, 5]/s` Rate Cap)**: Mandatory for enterprise PBX and Voice AI contact centers.

### Q2: How can an unsolicited `SIP NOTIFY` turn an IP phone or softphone into a remote microphone?

- **First-Principles Breakdown**:
  - Many SIP user agents implement CTI control events (`Event: talk`, `Event: hold`) over `SIP NOTIFY`. If the UA does not verify that the incoming `NOTIFY` matches an active `RFC 6665` subscription dialog initiated by the UA itself, any spoofed UDP/TCP `NOTIFY` packet triggers immediate speakerphone off-hook!

### Q3: How do the BLF XML scrubber and `RFC 6665 / 5263` `NOTIFY` gate execute on a sub-millisecond timeline?

1. **`T = 0 ~ 0.1ms` (`P812` Subscription Dialog Lookup & `[1, 5]/s` Rate Throttle)**:
   - Reject any inbound `NOTIFY` without a matching `SUBSCRIBE` dialog (`clampedUnsolicitedNotifyAccepted = 0`) and clamp outbound `NOTIFY` rate to `clampedNotifyMaxRatePerSec` in `[1, 5]/s`.
2. **`T = 0.1 ~ 0.3ms` (`P811` Role-Based `dialog-info+xml` Redaction & Pickup ACL Check)**:
   - Strip `call-id`, `local-tag`, and `remote-tag` for watchers outside the target's `pickupGroupId` (`clampedLeakedDialogTagAttributes = 0`) and require `clampedBlfPickupGroupAclVerified = true`.

---

## ③ 🧭 Visual Architecture Diagrams (Mermaid Decision Tree / Comparison / Sequence)

### 3.1 Architect Selection Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[SIP Presence / B2BUA Handles Event: dialog BLF XML or SIP NOTIFY] --> B{BLF XML Generation / Pickup Attempt or NOTIFY Subscription / Rate Audit?}
    B -->|BLF XML / Directed Pickup Audit| C{Does Non-Group Watcher Receive call-id/tags or Attempt Cross-Group Pickup?}
    C -->|Yes: Tag Leak or Unauthorized Pickup| D[⛔ P811 Block: Strip call-id/local-tag/remote-tag & Require Same-Pickup-Group RBAC]
    C -->|No| E[✅ Safe BLF Lamp Indication & Authorized Group Pickup]

    B -->|SIP NOTIFY Dialog & Rate Audit| F{Is NOTIFY Lacking an Active SUBSCRIBE Dialog or Emitted > 5/s?}
    F -->|Yes: Unsolicited NOTIFY or Event Storm| G[🔧 P812 Reject/Clamp: Return 481 Subscription Does Not Exist & Clamp Rate to 1..5/s]
    F -->|No| H[✅ Deliver Authenticated, Rate-Bounded Event Notification]
```

### 3.2 Vulnerable Legacy Pipeline vs Enterprise P811+P812 Hardened Pipeline (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Vulnerable Legacy Pipeline (Raw BLF Dialog Tags + Unsolicited NOTIFY)"]
      direction LR
      B1["Broadcast call-id + local/remote-tag\nto All BLF Watchers"] -->|Any Phone Sends INVITE Replaces| B2["Silent Hijack of Ringing VIP Calls\nCompany-Wide Caller-ID Snooping"]
      B3["Accept Unsolicited SIP NOTIFY\nUnthrottled O(N²) BLF Fan-Out"] -->|Forged Event: talk Packet| B4["Remote Microphone Auto-Answer\n230 Mbps XML Storm Crashes PBX"]
    end

    subgraph Good["✅ Enterprise P811 + P812 Hardened Pipeline (BLF Tag Scrub + RFC 6665 481 Gate)"]
      direction LR
      G1["Strip Dialog Tags for Non-Group\n+ Mandatory Pickup-Group RBAC"] -->|0 Call Hijacks + 0 ANI Leaks| G2["BLF Lamps Work Safely Without\nExposing Replaces Tokens"]
      G3["Reject Unsolicited NOTIFY (481)\n+ RFC 5263 [1,5]/s Rate Cap"] -->|0 Remote Off-Hook + 92% Less XML| G4["Immune to NOTIFY Injection\nLinear, Bounded Presence Load"]
    end
```

### 3.3 Millisecond BLF Tag Redaction & RFC 6665 NOTIFY Gate Sequence (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant Watcher as Cross-Department Phone / External Attacker
    participant PBX as Enterprise SIP Presence & Voice AI Gateway (P811 + P812 Gate)
    participant VIP as Executive Line / AI Wealth Advisor Seat

    Watcher->>PBX: 1. SUBSCRIBE Event: dialog (watching VIP extension, not in VIP pickup group)
    Note over VIP,PBX: Inbound VIP client call rings VIP extension (state = early)
    Note over PBX: P811 strips call-id/local-tag/remote-tag & <remote> URI for non-group watcher!<br/>P812 coalesces state transitions to [1, 5] NOTIFY/s!
    PBX-->>Watcher: 2. NOTIFY application/dialog-info+xml (<state>early</state> only, leakedDialogTags = 0)
    Watcher->>PBX: 3. Attacker injects unsolicited NOTIFY (Event: talk) to force auto-answer off-hook!
    Note over PBX: P812 finds no matching SUBSCRIBE dialog -> rejects in 0ms (unsolicitedNotifyAccepted = 0)!
    PBX-->>Watcher: 4. SIP 481 Subscription Does Not Exist
```

---

## ④ 📊 Architect Decision Matrix

| Evaluation Dimension | Option A: Raw BLF Tags + Accept Unsolicited NOTIFY (Anti-Pattern) | Option B: Disable BLF & Call Pickup Entirely | Option C: P811 BLF Tag Redaction & Pickup RBAC + P812 RFC 6665 481 & [1,5]/s Throttle (Recommended ✅) |
| :--- | :--- | :--- | :--- |
| **Cross-Group `INVITE Replaces:` Hijack Defense** | ❌ Any BLF watcher can steal ringing calls | ✅ Safe, but breaks executive assistant workflows | ✅ **Strips 100% of `call-id/tags` for non-group watchers (`leakedDialogTagAttributes = 0`)** |
| **Unsolicited `NOTIFY (Event: talk)` Protection** | ❌ Vulnerable to remote forced off-hook | ⚠️ Still vulnerable if `NOTIFY` is unauthenticated | ✅ **Rejects 100% of out-of-dialog `NOTIFY` requests with `481` (`0` accepted)** |
| **$O(N^2)$ Ring-Group BLF Storm Resilience** | ❌ `230 Mbps` XML burst saturates presence CPU | N/A | ✅ **Coalesced and clamped to `[1, 5]` `NOTIFY/s` (`92%` bandwidth reduction)** |

---

## ⑤ 🧪 Quantitative Worked Example & Benchmark Insights (7-Card Report)

### 5.1 Quantitative Example: Cutting Presence XML Traffic by `92%` with Zero Hijack Surface

- **Unprotected Pipeline (Option A)**:
  - `60` call transitions/sec across `200` watchers generate `12,000 NOTIFY/s` (`~230 Mbps` of unredacted XML containing live `Replaces` takeover tokens).
- **Hardened Pipeline (`P811` + `P812`, Option C)**:
  - `P811` enforces `clampedLeakedDialogTagAttributes = 0` and `clampedBlfPickupGroupAclVerified = true`;
  - `P812` enforces `clampedUnsolicitedNotifyAccepted = 0` and `clampedNotifyMaxRatePerSec` in `[1, 5]/s`.

### 5.2 Deterministic Guardrail API Contract (`P811` & `P812` · 🎉 830-Probe Milestone)

```ts
import {
  evaluateSipRfc4235DialogEventBlfTagRedactionAndPickupHijackGate,
  evaluateSipRfc6665UnsolicitedNotifyAndRfc5263MaxRateThrottleGate,
} from "../packages/business-core/enterprise-guardrails";

const blfAudit = evaluateSipRfc4235DialogEventBlfTagRedactionAndPickupHijackGate({
  unredactedBlfDialogTagsOrCrossGroupPickupHijackDetected: true,
  leakedDialogTagAttributes: 3,
  blfPickupGroupAclVerified: false,
});
// => blfAudit.violated === true, policyId === "P811...", clampedLeakedDialogTagAttributes === 0, clampedBlfPickupGroupAclVerified === true

const notifyAudit = evaluateSipRfc6665UnsolicitedNotifyAndRfc5263MaxRateThrottleGate({
  unsolicitedNotifyOrEventRateStormDetected: true,
  unsolicitedNotifyAccepted: 2,
  notifyMaxRatePerSec: 45,
});
// => notifyAudit.violated === true, policyId === "P812...", clampedUnsolicitedNotifyAccepted === 0, clampedNotifyMaxRatePerSec === 5
```

---

## ⑥ 🛠️ Appendix: Production Voice Delivery Verification Checklist (Architect Checklist)

- [ ] **[P811 `RFC 4235` BLF XML Call-Tag & Remote-URI Redaction]**: Confirm `call-id`, `local-tag`, `remote-tag`, and `<remote>` identity are stripped from `dialog-info+xml` for non-pickup-group watchers (`leakedDialogTagAttributes = 0`).
- [ ] **[P811 Pickup-Group RBAC Verification]**: Confirm directed call pickup (`INVITE Replaces:`) verifies `blfPickupGroupAclVerified = true`.
- [ ] **[P812 `RFC 6665` Unsolicited `NOTIFY` `481` Rejection]**: Confirm out-of-dialog `SIP NOTIFY` requests are rejected with `481` (`unsolicitedNotifyAccepted = 0`).
- [ ] **[P812 `RFC 5263 / RFC 6446` `[1, 5]/s` Rate Cap]**: Confirm per-subscription `NOTIFY` emission is throttled to `[1, 5]/s`.
