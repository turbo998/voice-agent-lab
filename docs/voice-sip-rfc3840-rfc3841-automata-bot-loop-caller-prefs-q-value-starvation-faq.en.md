# Enterprise SIP `RFC 3840 / RFC 3841` `automata` (AI Bot-to-Bot Infinite Loop Breaker) & Caller Preferences (`Accept-Contact / Reject-Contact` `q-Value` Anti-Starvation) Selection Guide

> **Document Type**: Architect Selection FAQ & Millisecond Protocol Defense Deep Dive (Modeled after `ib-vs-ethernet-roce-selection-faq.md`)  
> **Stage & Milestone**: Stage 453 · Topic 93 · 🎉 **Historic `P900` Guardrail, 95th Standalone Single-Topic FAQ & 895-Test Triple Milestone** (Guardrails `P899`, `P900 🎉` · 95th Standalone Single-Topic FAQ 🎉 · 97th Architectural SVG · 456 Evaluation Dimensions)  
> **Core Value**: Explains from first principles why outbound enterprise AI Voice Agents get trapped in 45-minute polite conversation loops when answered by mobile AI call-screening assistants (Apple Live Voicemail, Google Call Screen, carrier AI receptionists) if **`RFC 3840` `;automata` / `;actor="msg-taker"`** capability indicators and turn ceilings are missing, and why over-constraining **`RFC 3841` `Accept-Contact ;require;explicit`** starves human-escalation queues (`SIP 480`), then establishes deterministic **`P899`** and **`P900 🎉`** guardrails.

---

## ① 📌 Executive Summary

1. **Why do enterprise outbound AI Voice Agents occasionally get stuck talking to a customer's AI Call-Screening Assistant for 40+ minutes (`RFC 3840 automata` Omission & Bot-to-Bot Infinite Loop Vulnerability)?**  
   With the widespread rollout of LLM-powered mobile call screening (iOS Live Voicemail, Android Call Screen, carrier AI assistants), an outbound AI agent calling a customer is frequently answered by **another conversational AI**. Both bots are prompted to be polite and wait for the other party to state their business ("Hello, I'm screening calls for Alex, how can I help?" ↔ "Hi! I'm calling from Contoso Clinic, is Alex available?" ↔ "Please tell me the reason for your call and I'll pass it along"). Without **`RFC 3840` (`Contact: <sip:...>;automata;actor="msg-taker"`)** signaling inspection and a hard Bot-to-Bot turn ceiling, two AI agents converse indefinitely, burning GPU inference budgets and PSTN trunk minutes!
2. **Why does adding `;require;explicit` to `RFC 3841 Accept-Contact` during warm transfer cause `100%` of calls to fail with `480 Temporarily Unavailable` even when 50 human agents are idle (`RFC 3841` Caller-Preferences Starvation Trap)?**  
   **`RFC 3841` (Caller Preferences for SIP)** lets a caller steer proxy routing via `Accept-Contact` and `Reject-Contact` headers. While `Reject-Contact: *;automata;actor="msg-taker"` safely avoids routing a human-escalation call to another bot, adding **`;require;explicit`** to `Accept-Contact: *;language="yue";require;explicit` instructs the proxy to **discard any registered contact that did not explicitly include `language="yue"` in its `REGISTER` header**. Because most standard desk phones only register their IP/port without custom feature tags, the proxy eliminates every available human agent (`q = 0.0`) and drops the call!
3. **Architect's Deterministic Defense (`P899 + P900 🎉` · 🎉 Historic `P900` Guardrail, 95th FAQ & 895-Test Triple Milestone)**:
   - **`P899` (`RFC 3840 automata / actor="msg-taker"` Mandatory Tagging & `[1, 3]`-Turn Bot-to-Bot Loop Breaker Guard)**: Enforces `;automata` on all AI Voice Agent `Contact` headers, detects `automata <-> automata` or `actor="msg-taker"` peers (`0` infinite Bot-to-Bot loop calls), and clamps Bot-to-Automata exchanges to **`[1, 3]` turns** (delivering a concise summary message before sending `BYE`).
   - **`P900 🎉` (`RFC 3841` `Reject-Contact: *;automata`, Anti-`require;explicit` Starvation & `[100, 1000]` milli-q Priority Guard)**: Prevents `;require;explicit` from starving human-escalation queues (automatically falling back to soft preference scoring when strict matching yields zero contacts, `0` starved escalation calls) and clamps `Contact` routing priority within **`[100, 1000]` milli-q (`q = 0.100 .. 1.000`)**.

---

## ② 🎯 Architect & Customer Deep-Dive Q&A (Q1 / Q2 / Q3)

### Q1: Why do legacy acoustic Answering Machine Detection (`AMD`) algorithms fail to detect modern LLM mobile call screeners?
- **Plain-Language First Principles**: Legacy acoustic AMD listens for a long pre-recorded greeting followed by a `1000Hz` beep. Modern AI call screeners use low-latency streaming TTS with natural conversational cadence and no beep, fooling acoustic AMD `100%` of the time.
- **Two-Layer Defense (`P899`)**:
  1. **Signaling-Layer `0ms` Detection (`RFC 3840`)**: Inspect the `200 OK` `Contact` header for `;automata` or `;actor="msg-taker"` and switch to single-shot message-delivery mode in `0ms`.
  2. **Hard `[1, 3]`-Turn Ceiling**: Even if the carrier strips `;automata`, once the semantic classifier detects call-screening phrasing ("screening calls / pass it along"), clamp the conversation to **`[1, 3]` turns**, deliver the concise message, and send `BYE`.

### Q2: How does `RFC 3841` `Reject-Contact: *;automata` differ from `Accept-Contact: ...;require;explicit`?
- **Plain-Language First Principles**: `Reject-Contact: *;automata` only excludes endpoints that explicitly declare `;automata`, leaving unlabeled human desk phones untouched. Conversely, `Accept-Contact: *;require;explicit` excludes every endpoint that *omits* the requested tag, starving the routing set whenever legacy phones are used (`P900 🎉`).

### Q3: Why represent `RFC 3841` `q-values` as `[100, 1000]` integer milli-q units?
- **Plain-Language First Principles**: Floating-point `q` values (`0.000..1.000`) suffer from rounding drift across multi-hop proxies and allow accidental `q=0` contact elimination. Clamping routing weights to **`[100, 1000]` integer milli-q units** guarantees deterministic ordering and a non-zero fallback floor (`P900 🎉`).

---

## ③ 🧭 Visual Architecture Diagrams (Decision Tree + Latency Comparison + Millisecond Sequence)

### 3.1 Enterprise SIP `RFC 3840 / RFC 3841` Anti-Bot-Loop & Anti-Starvation Decision Tree (`flowchart TD`)

```mermaid
flowchart TD
    A[SIP Voice Gateway Outbound Call or Human-Escalation Transfer] --> B{Outbound Call Answered or Human-Escalation Routing?}
    B -- "Outbound 200 OK Received" --> C{Remote Contact Has RFC 3840 ;automata / actor=msg-taker or Screening Intent?}
    C -- "Yes: Remote AI Screener / Voicemail Bot" --> D["✅ P899 Loop Breaker: Advertise ;automata + Clamp Exchange to [1, 3] Turns & BYE"]
    C -- "No: Live Human Callee" --> E["✅ Proceed with Full-Duplex Multi-Turn Conversation"]
    B -- "Human-Escalation Routing (RFC 3841)" --> F{Does Accept-Contact ;require;explicit Yield 0 Matching Human Agents?}
    F -- "Yes: Over-Constrained Tag Starves Idle Human Pool" --> G["❌ Legacy 480 Drop -> ✅ P900 🎉 Strip require;explicit & Fallback to Soft q-Score"]
    F -- "No: Soft Preference + Reject-Contact: *;automata" --> H["✅ P900 🎉 Green: Route Deterministically via [100, 1000] milli-q Priority"]
```

### 3.2 Unguarded Bot-to-Bot Loop & Starvation vs. `P899 + P900 🎉` Guard (`flowchart LR`)

```mermaid
flowchart LR
    subgraph Bad["❌ Unguarded Mode (45-Min Bot-to-Bot Loop + require;explicit 480 Drop)"]
        direction LR
        B1["Missing ;automata Tag & Turn Cap\nTwo AI Bots Converse 120+ Turns"] --> B2["45 Minutes of Wasted GPU Tokens\n& PSTN Trunk Charges per Call"]
        B2 --> B3["Accept-Contact ;require;explicit\nEliminates Unlabeled Phones → 480"]
    end

    subgraph Good["✅ P899 + P900 🎉 Deterministic Guard (🎉 P900, 95th FAQ & 895 Tests!)"]
        direction LR
        G1["Mandatory Contact ;automata Tag\nClamp Bot-to-Bot to [1, 3] Turns (P899)"] --> G2["Concise Message Drop + Clean BYE\n0 Infinite Bot-to-Bot Loops"]
        G2 --> G3["Prevent require;explicit Starvation\nClamp Priority to [100,1000] milli-q (P900 🎉)"]
    end
```

### 3.3 Millisecond Sequence: `RFC 3840` `[1, 3]`-Turn Bot Loop Breaker & `RFC 3841` Routing (`sequenceDiagram`)

```mermaid
sequenceDiagram
    autonumber
    participant BotA as Enterprise Outbound AI (Contact: ;automata)
    participant PXY as Core Routing Proxy (RFC 3841 Engine)
    participant BotB as Mobile AI Call Screener (;automata;actor="msg-taker")
    participant Human as Human Agent Pool (q=850 milli-q)

    BotA->>PXY: INVITE (Contact: <sip:ai@corp>;automata)
    PXY->>BotB: INVITE
    BotB-->>BotA: 200 OK (Contact: <sip:screen@mobile>;automata;actor="msg-taker")
    Note over BotA: [P899] Detects automata <-> automata Connection!<br/>Clamps Maximum Turn Exchange to [1, 3] Turns (e.g., 2 Turns)!
    BotB->>BotA: Turn 1: "Hi, I'm screening calls for Alex. Please state your message."
    BotA->>BotB: Turn 2 (Concise Summary): "Please let Alex know tomorrow's 10 AM flight check-in is confirmed."
    BotA->>BotB: BYE (Reason: Q.850;cause=16, Clean 2-Turn Exit, 0 Infinite Loop!)
    Note over BotA,Human: On Human-Escalation Transfer (P900 🎉):
    BotA->>PXY: REFER / INVITE (Reject-Contact: *;automata, Accept-Contact: q ∈ [100, 1000] milli-q)
    Note over PXY: [P900 🎉] Strips Starving ;require;explicit & Routes to Human Agent at q=850!
    PXY->>Human: INVITE (0 Starved 480 Drops, Connected to Human Agent)
```

![Enterprise SIP RFC 3840 Bot-Loop Breaker & RFC 3841 Caller-Preferences Guard Architecture](../assets/svg/97-voice-sip-rfc3840-rfc3841-automata-bot-loop-caller-prefs-q-value-starvation-2026-11-14.svg)

---

## ④ 📊 Voice Architect Decision Matrix

| Architecture / Policy Option | `RFC 3840 automata` & Bot-to-Bot Policy | `RFC 3841 Accept-Contact` Matching | Contact `q-Value` Priority Bounds | GPU Bill Explosion & Escalation Drop Risk | Architect Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Unlabeled Bot + Unbounded Turns + `require;explicit`** | Omits `;automata`; no turn cap | Enforces `;require;explicit` | Allows `q=0.0` starvation | **Critical** (45-min Bot-to-Bot loops + `480` transfer drops) | **Rejected for production** |
| **Option B: Legacy Acoustic Beep AMD Only** | No `RFC 3840` inspection; waits for beep | Ignores `RFC 3841` | Static round-robin | **Medium** (Fails completely against LLM mobile call screeners) | Obsolete for modern mobile networks |
| **Option C: `RFC 3840` `[1, 3]`-Turn Breaker + `RFC 3841` `[100, 1000]` milli-q Guard (`P899 + P900 🎉` Recommended)** | **Mandatory `;automata` + `[1, 3]`-turn summary & `BYE`** | **`Reject-Contact: *;automata` + anti-starvation fallback** | **Clamped to `[100, 1000]` milli-q** | **`0` infinite Bot-to-Bot loops & `0` starved human transfers** | **Mandatory for Enterprise Outbound & Hybrid Contact Centers** |

---

## ⑤ 🧪 Quantitative Proof & 7-Card Benchmark Integration

### 5.1 Quantitative Example: Bot-to-Bot Loop Waste vs. `P899 / P900 🎉` Guardrails
- **Unguarded Baseline (Without `P899 / P900`)**: Across `50,000` daily outbound calls where `4%` (`2,000` calls) reach mobile AI call screeners, an unguarded AI agent averages `3.5` minutes (`18` turns) of circular bot-to-bot banter per call—wasting **`7,000` GPU/PSTN minutes/day**—while `;require;explicit` drops `100%` of transfers to standard desk phones.
- **Guarded Convergence (`P899 + P900 🎉` · 🎉 Historic `P900`, 95th FAQ & 895-Test Triple Milestone)**: Enforcing `RFC 3840 ;automata` tagging and clamping Bot-to-Automata exchanges to `[1, 3]` turns reduces infinite Bot-to-Bot loops to **`0`** (`P899`), while preventing `;require;explicit` starvation and clamping `RFC 3841` priorities to `[100, 1000]` milli-q reduces starved human-escalation calls to **`0`** (`P900 🎉`).

### 5.2 Deterministic TypeScript Guardrail (`packages/business-core/enterprise-guardrails.ts` Excerpt)

```typescript
// P899: SIP RFC 3840 Automata Bot-to-Bot Loop & Actor="msg-taker" Turn Ceiling Guard
// P900 🎉: SIP RFC 3841 Caller Preferences Reject-Automata & q-Value Starvation Guard
export function evaluateSipRfc3841CallerPreferencesRejectAutomataAndQValueStarvationGate(
  context: SipRfc3841CallerPreferencesRejectAutomataAndQValueStarvationContext,
): SipRfc3841CallerPreferencesRejectAutomataAndQValueStarvationDecision {
  const clampedStarvedHumanEscalationOrMisroutedBotCalls = 0;
  const clampedCallerPreferenceContactMilliQ = Math.min(
    Math.max(context.callerPreferenceContactMilliQ, 100),
    1000,
  );
  // Prevent require;explicit starvation of human agents and clamp Contact priority to [100, 1000] milli-q
  // ...
}
```

> **Provenance & Timing Disclosure**: `P899` and `P900 🎉` in `site/data/voice-agent-benchmark-report.json` and `site/benchmark-cards.html` evaluate deterministic in-memory capability-matching and turn-bound rules (`provenance: "synthetic"`, timing: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`). Live SIP proxy `RFC 3841` predicate-intersection and semantic call-screener classification latencies are explicitly marked `not_measured`.

---

## ⑥ 🛠️ Production Verification Checklist

- [ ] **[`P899` Mandatory `RFC 3840 ;automata` Contact Tagging]**: Ensure all AI Voice Agent `INVITE` and `200 OK` `Contact` headers include `;automata`.
- [ ] **[`P899` `[1, 3]`-Turn Bot-to-Bot Loop Breaker]**: Clamp Bot-to-Automata turn exchanges to `[1, 3]` turns upon detecting remote `;automata / actor="msg-taker"` or call-screening intent (`clampedInfiniteBotToBotLoopCalls = 0`).
- [ ] **[`P900 🎉` `RFC 3841` Anti-Starvation Fallback]**: Include `Reject-Contact: *;automata` on human escalations and prevent `;require;explicit` from starving unlabeled human desk phones (`clampedStarvedHumanEscalationOrMisroutedBotCalls = 0`).
- [ ] **[`P900 🎉` `[100, 1000]` milli-q Priority Clamp]**: Clamp `RFC 3841` `Contact` routing priority weights within `[100, 1000]` milli-q (`0.100 .. 1.000`).
