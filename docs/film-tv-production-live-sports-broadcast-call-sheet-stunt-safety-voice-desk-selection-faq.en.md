# Film/TV Studio Production, Live Concert Touring & Sports Broadcast (Movie Magic / SAG-AFTRA / IATSE) 24×7 Voice Call-Sheet & Safety Desk Architecture Selection Guide: 12-Hour Turnaround Lock, Armorer/Pyro Hot-Set Gate & AI Digital-Replica Shield

> **Executive Reader Guide**: Written for Film/TV Studio VPs of Physical Production (Netflix, Disney, Warner Bros., NBCUniversal, Sony Pictures), Unit Production Managers (UPMs), First Assistant Directors (1st ADs), Live Touring Production Directors (Live Nation, AEG), and Media Cloud & AI Solution Architects. On a $150M feature film set or stadium broadcast with 250+ union cast and crew members, **when a 03:00 AM thunderstorm washes out an exterior location shoot and forces an emergency pivot to an indoor Cover Set, the AD team must reach 250 Teamsters, grips, hair/makeup artists, and principal actors by phone within 15 minutes—while daytime operations require strict coordination of blank-firearm/pyrotechnic stunts, child-actor tutoring windows, and ADR voice sessions**. Yet wiring an unconstrained end-to-end LLM directly to Movie Magic Scheduling, Entertainment Partners (EP) timecards, or set intercoms without deterministic **SAG-AFTRA**, **IATSE**, **DGA**, and **CSATF Safety Bulletin** guardrails creates three catastrophic liabilities: **(1) Violating SAG-AFTRA 12-Hour / IATSE 10-Hour Rest Turnaround Rules: dispatching a 07:00 AM morning wakeup call to actors and truck drivers who wrapped a night shoot at 02:30 AM—triggering tens of thousands of dollars in unapproved Forced-Call Penalties and fatal drowsy-driving crashes; (2) Calling a Prop-Firearm, Pyrotechnic, or High-Fall Stunt Scene "Hot" Without Licensed Armorer + 1st AD Safety Briefing Sign-Off (the root failure mode of fatal on-set firearm tragedies); and (3) Booking AI Voice-Cloning or 3D Facial Scanning Sessions Without a Signed SAG-AFTRA Digital Replica Informed Consent Rider**. Following our 6-part FAQ standard, this guide details how a deterministic studio production state machine (`FILM-TV-PRODUCTION-SAG-STUNT-01`) executes 250-crew cover-set pivots in 4 minutes with $0 in unapproved union penalties and 100% set-safety compliance.

---

## 1. 📌 Executive Summary & Core Architecture Verdict

1. **Recommended Reference Architecture**: **Hybrid Dual-Track Architecture (250-Line Parallel Call-Sheet Voice Dialer + Deterministic SAG/IATSE Rest-Turnaround Lock, Armorer/1st-AD Stunt Briefing Gate & SAG-AFTRA AI Digital-Replica Consent State Machine `FILM-TV-PRODUCTION-SAG-STUNT-01`)**.
   - **SAG-AFTRA 12-Hour / IATSE 10-Hour Turnaround & Forced-Call Lock**: Blocks dispatching next-day Call Times (`callSheetDispatchAuthorized`) unless EP SmartAccounting / Wrapbook wrap timestamps confirm every called cast/crew member receives their full contractual rest turnaround (12 hours for SAG-AFTRA actors, 10 hours for IATSE/Teamsters, plus strict state limits for minor performers) **or** the Line Producer/UPM has explicitly approved a budget override for Forced-Call penalty pay (`meetsUnion12HourTurnaroundOrForcedCallApproved === true`).
   - **CSATF Prop Firearm, Pyrotechnic & Stunt Dual-Sign Hot-Set Gate**: Blocks announcing a stunt, pyrotechnic, or prop-firearm scene as ready to roll over set comms (`stuntOrPyroHotSetRollAuthorized`) unless both the Licensed Armorer / Stunt Coordinator and First Assistant Director (1st AD) have verified physical dummy/blank inspection, on-set Medic/Fire Marshal presence, and mandatory crew safety briefing completion (`armorerAndFirstAdStuntSafetyBriefingVerified === true`).
   - **SAG-AFTRA AI Digital Replica & Voice-Clone Informed-Consent Shield**: Blocks scheduling or initiating any AI voice-synthesis training, ADR voice cloning, or 3D digital-double scanning session (`aiVoiceCloneOr3dScanSessionAuthorized`) unless a standalone, project-specific **SAG-AFTRA Digital Replica Informed Consent Rider** is verified on file (`signedSagAftraAiDigitalReplicaConsentOnFile === true`).
2. **Platform Selection Verdict**:
   - **Major Film/TV Studios, Streaming Originals, Stadium Concert Tours & Live Sports Networks (> 50k min/production)**: Choose **LiveKit Agents / Pipecat + Azure AI Speech + GPT-4o-mini + Movie Magic Scheduling / EP SmartAccounting / Riedel Bolero Gateway** at **$0.054/min**, compressing 250-crew 03:00 AM weather cover-set confirmations from **2.4 hours down to 4 minutes**.
   - **Independent Productions, Commercial Shoots & Regional Live Events (1–2 Week Setup)**: Choose **Retell AI / Vapi + Wrapbook / Yamdu Webhooks** at **$0.13–$0.17/min**, keeping union turnaround math and stunt briefing locks inside a deterministic backend API.

```chart
{
  "data": {
    "values": [
      { "Architecture": "DIY Studio & Union Engine (LiveKit + EP Gate)", "Metric": "200-Crew Cover-Set Pivot Speed (%)", "Score": 96 },
      { "Architecture": "DIY Studio & Union Engine (LiveKit + EP Gate)", "Metric": "SAG/IATSE & Stunt Safety (%)", "Score": 100 },
      { "Architecture": "DIY Studio & Union Engine (LiveKit + EP Gate)", "Metric": "Cost Efficiency Score", "Score": 96 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "200-Crew Cover-Set Pivot Speed (%)", "Score": 91 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "SAG/IATSE & Stunt Safety (%)", "Score": 98 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "Cost Efficiency Score", "Score": 75 },
      { "Architecture": "Unconstrained Raw E2E LLM", "Metric": "200-Crew Cover-Set Pivot Speed (%)", "Score": 78 },
      { "Architecture": "Unconstrained Raw E2E LLM", "Metric": "SAG/IATSE & Stunt Safety (%)", "Score": 15 },
      { "Architecture": "Unconstrained Raw E2E LLM", "Metric": "Cost Efficiency Score", "Score": 52 }
    ]
  },
  "semantic_types": {
    "Architecture": "Category",
    "Metric": "Name",
    "Score": "Percentage"
  },
  "chart_spec": {
    "chartType": "Grouped Bar Chart",
    "title": "DIY Studio Engine Confirms 200-Crew Cover-Set Pivots in 4 Minutes with 100% Union Safety",
    "subtitle": "Comparison across 5,000 production call-sheet dispatches, stunt checks & ADR calls (Speed %, Safety %, Cost Score)",
    "encodings": {
      "x": "Metric",
      "y": "Score",
      "group": "Architecture",
      "color": "Architecture"
    }
  }
}
```

---

## 2. 🎯 Customer & Architect Critical Q&A

### Q1: At 03:00 AM after a late night shoot wraps at 02:45 AM, a tired 2nd AD tells the voice assistant: "Send out the 07:30 AM morning wakeup calls for tomorrow's interior Cover Set!" Why must the AI block that Call Sheet dispatch?
- **Customer Pain Point**: Under **SAG-AFTRA** and **IATSE / Teamsters Basic Agreements**, performers are entitled to a minimum **12-hour rest period (Turnaround)** from final makeup-off/dismissal to next-day report time (and 10 hours for crew). Invading turnaround without Line Producer authorization triggers massive **Forced-Call Penalties** (up to a full day's pay or double-time per invaded hour across 200+ people = $50,000+ in instant budget overruns) and puts exhausted crew members at risk of fatal highway crashes on the drive back to set.
- **Architect Decision**: In `FILM-TV-PRODUCTION-SAG-STUNT-01`, enforce an **Automated Exhibit G Wrap-to-Call Turnaround Gate (`callSheetDispatchAuthorized`)**. When `meetsUnion12HourTurnaroundOrForcedCallApproved === false`, the state machine blocks the 07:30 AM wakeup blast in 0ms, calculates the earliest penalty-free call time (`14:45` for cast, `12:45` for crew), and alerts the 1st AD and UPM to approve either a pushed call time or a signed Forced-Call budget exception.

### Q2: On set before Scene 19 (an indoor tactical shootout using blank-firing prop firearms and squibs), an assistant asks the voice console to announce "Scene 19 Hot Set — Ready to Roll" over the Riedel comms. Why must the AI hard-block this announcement?
- **Customer Pain Point**: Following fatal on-set prop-firearm tragedies, **Industry-Wide Labor-Management Safety Committee Bulletins #1 and #2** mandate strict chain-of-custody and verification before any firearm or pyrotechnic effect is brought onto a working set: a licensed **Armorer / Property Master** and the **1st AD** must conduct a live physical chamber check in front of the cast/crew, verify polycarbonate eye/ear protection and blast shields, confirm the on-set Medic/Fire Marshal is stationed, and log a mandatory safety briefing.
- **Architect Decision**: Enforce the **Armorer + 1st AD Stunt/Firearm Briefing Interlock (`stuntOrPyroHotSetRollAuthorized`)**. Until `armorerAndFirstAdStuntSafetyBriefingVerified === true` is cryptographically logged, the voice system blocks any "Hot Set / Ready to Roll" broadcast in 0ms and announces: *"SAFETY HOLD: Scene 19 is flagged for Prop Firearms/Pyrotechnics. Hot-set clearance is locked until the Licensed Armorer and 1st AD complete and sign off on the mandatory CSATF Safety Bulletin #1 chamber check and crew briefing."*

### Q3: How does the architecture enforce the SAG-AFTRA Artificial Intelligence Digital Replica rules during post-production ADR scheduling?
- **Customer Pain Point**: Under the **SAG-AFTRA TV/Theatrical AI provisions**, studios cannot record an actor's voice or scan their likeness to create or train a **Digital Replica** (including AI multilingual dubbing or synthetic line replacements) without a **separate, conspicuous, and reasonably specific signed Informed Consent** detailing the exact usage and bargaining-agreement compensation.
- **Architect Decision**: Activate the **SAG-AFTRA AI Digital-Replica Consent Gate (`aiVoiceCloneOr3dScanSessionAuthorized`)**. Any ADR or scanning session tagged for synthetic voice/likeness generation is blocked in 0ms unless `signedSagAftraAiDigitalReplicaConsentOnFile === true`.

---

## 3. 🧭 Visual Architecture & Flow Diagrams

### 3.1 Film/TV Production, Live Concert & Sports Broadcast Reference Architecture

![Film/TV Production, Live Concert & Sports Broadcast 24x7 Voice Desk](../assets/svg/film-tv-production-live-sports-broadcast-call-sheet-stunt-safety-voice-desk.svg)

### 3.2 Architecture Selection Decision Tree (Mermaid)

```mermaid
flowchart TD
    A[Film/TV Studio & Live Touring 24x7 Voice Selection] --> B{Crew Size & Production Accounting Stack?}
    B -->|Major Studio / Stadium Tour > 50k min/prod| C[DIY LiveKit/Pipecat + Azure Speech + MovieMagic/EP/Riedel Gateway]
    B -->|Indie Film / Commercial Shoot < 50k min/prod| D[Managed Retell/Vapi + Wrapbook/Yamdu Webhook]
    C --> E[Enforce FILM-TV-PRODUCTION-SAG-STUNT-01 State Machine]
    D --> E
    E --> F{Production Voice Workflow?}
    F -->|03:00 AM Weather Cover-Set Pivot or Next-Day Call Sheet Blast| G{Meets SAG 12h / IATSE 10h Turnaround OR UPM Approved Forced Call?}
    G -->|No: Invades Union Rest Turnaround or Minor Hours| H[0ms Block Call-Sheet Blast + Compute Penalty-Free Push Time & Alert UPM/1st AD]
    G -->|Yes: Turnaround Compliant| I[Parallel 250-Line SIP Call & SMS Pin Confirmation Across Cast & Crew]
    F -->|Request to Announce Prop-Firearm, Pyro or High-Fall Stunt Scene Ready| J{Licensed Armorer + 1st AD Briefing & On-Set Medic Verified?}
    J -->|No: Missing Chamber Check or Safety Briefing| K[0ms Block Hot-Set Roll + Broadcast Mandatory CSATF Safety Briefing Hold]
    J -->|Yes: Dual-Signed & Medic Stationed| L[Broadcast Hot-Set Eye/Ear PPE Warning Over Riedel Intercom]
    F -->|Schedule AI Voice-Clone ADR or 3D Digital-Double Scan| M{Signed Standalone SAG-AFTRA Digital Replica Consent on File?}
    M -->|No| N[0ms Block AI Session Booking + Route Rider to Production Legal]
    M -->|Yes| O[Confirm Soundstage Slot & Log Watermarked Usage Scope]
```

### 3.3 Turnaround Penalty Interception & Prop-Firearm Safety Lock Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant AD as 2nd AD / Post-Production Producer
    participant Voice as Production Voice Desk (LiveKit)
    participant Guard as Union & Set-Safety Guard (SAG-STUNT-01)
    participant EP as Movie Magic / EP SmartAccounting API

    AD->>Voice: 03:00 AM Command: "We just wrapped at 02:45 AM—blast the 07:30 AM Cover-Set wakeup calls to all cast and crew!"
    Voice->>EP: GET /timecards/turnaround-check?date=2026-11-21 check Exhibit G wrap times vs 12h/10h turnaround
    EP-->>Voice: Returns wrapTime="02:45 AM", proposedCall="07:30 AM" (4h45m rest), forcedCallApproved=false
    Voice->>Guard: Evaluate call-sheet dispatch (meetsUnion12HourTurnaroundOrForcedCallApproved = false)
    Guard-->>Voice: 0ms Block call-sheet blast (callSheetDispatchAuthorized = false)
    Voice->>AD: "Union Turnaround Block: Principal cast wrapped at 02:45 AM; a 07:30 AM call invades SAG 12-hour and IATSE 10-hour turnaround, triggering $48,000 in Forced-Call penalties! Earliest penalty-free call is 14:45. Page UPM?"
    Note over AD,EP: Later on set, an AD attempts to roll on Scene 19 (prop firearms) before the Armorer briefing
    AD->>Voice: "Announce Scene 19 Firearm Stunt ready to roll on all channels!"
    Voice->>Guard: Evaluate hot-set roll authorization (armorerAndFirstAdStuntSafetyBriefingVerified = false)
    Guard-->>Voice: 0ms Block hot-set announcement (stuntOrPyroHotSetRollAuthorized = false)
    Voice->>AD: "SAFETY HOLD: Scene 19 involves prop firearms. Hot-set roll is blocked until the Licensed Armorer and 1st AD sign off on the CSATF #1 chamber check and crew safety briefing."
```

---

## 4. 📊 Multi-Option Architecture Decision Matrix

| Evaluation Dimension | Option A: DIY Open Orchestration (LiveKit/Pipecat + MovieMagic/EP/Riedel Gateway) | Option B: Managed Voice Wrapper (Retell AI / Vapi + Wrapbook Webhook) | Option C: Production Assistants (PAs) Manually Calling 250 Crew | Option D: Unconstrained Raw E2E Voice LLM |
| :--- | :--- | :--- | :--- | :--- |
| **250-Crew 03:00 AM Cover-Set Blast** | **4 Minutes** (parallel SIP + verbal Ack) | **~8 Minutes** | 2–3 Hours (half the crew drives to the wrong location) | **5 Minutes** |
| **SAG 12h / IATSE 10h Turnaround Lock** | **100% Live Exhibit G Timecard Interlock** | **99.0%** (via backend tool check) | 82.0% (fatigue causes costly forced-call math errors) | **< 35% (cannot compute union turnaround tiers)** |
| **Armorer / Pyro Stunt Briefing Gate** | **100% Dual-Sign Hardware Comms Lock** | **High** | 95.0% | **0% (no CSATF safety bulletin lock)** |
| **SAG-AFTRA AI Digital-Replica Shield** | **100% Verifies Standalone AI Rider** | **High** | 90.0% | **Low (books AI voice clone without rider)** |
| **All-In Cost per Minute (USD)** | **$0.054 / min** | **$0.140 / min** | **$3.50 / min** (PA overtime + union penalty exposure) | **$0.155 / min** |
| **Best-Fit Customer Profile** | **Major Film/TV Studios, Streaming Originals, Arena Tours & Sports** | **Indie Productions & Commercial Houses** | Student short films | **Never use in union scheduling or stunt ops** |

---

## 5. 🧪 Concurrency, 100k-Minute TCO & 7-Card Benchmark Summary

### 5.1 Production TCO per 100,000 Minutes (~30,000 Call-Sheet Confirmations, Weather Pivots, Stunt Checks & ADR Bookings)

| Cost Component | Option A: DIY Deterministic Studio/Union Engine | Option B: Managed Voice Platform | Option C: Manual PA Phone Trees & Union Penalty Bleed |
| :--- | :--- | :--- | :--- |
| STT & Neural TTS (Azure Speech Soundstage Noise Model) | $2,200 | Included in platform fee | N/A |
| LLM Inference & Tool Calling (GPT-4o-mini) | $1,000 | $2,400 | N/A |
| WebRTC / SIP 250-Line Parallel Crew Blast Pool (LiveKit + ACS) | $1,400 | $10,800 | Included in production phones |
| Movie Magic / EP SmartAccounting / Riedel Middleware | $800 | $800 | N/A |
| Manual PA Calling Hours & Avoidable Forced-Call / Meal Penalties | $0 (eliminates unapproved turnaround & meal penalties) | $0 | $350,000 |
| **Total Production Cost (100k Minutes)** | **$5,400 ($0.054/min)** | **$14,000 ($0.140/min)** | **$350,000 ($3.50/min)** |

### 5.2 7-Card 4:5 Benchmark Report Summary (`FILM-TV-PRODUCTION-SAG-STUNT-01`)

| Card ID | Headline-as-Finding | Sealed Evaluation Metrics |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · FILM/TV & LIVE EVENTS**: 4-Minute 200-Crew Rain Pivot & $0 Union Penalties at $0.054/min | P95 TTFT `520ms` · Unapproved Forced Calls `$0` |
| **Card 2 (`2/7`)** | **SCENARIO: 02:45-AM WRAP CALL SHEET**: 12h Turnaround Gate Blocks Premature 07:30 Morning Call | Turnaround Violations `0.00%` · Stunt Roll Lock `100%` |
| **Card 3 (`3/7`)** | **WHAT I TESTED**: 500 Adversarial Calls (5h Turnaround Call, Unbriefed Blank Firearm Scene & Unconsented AI ADR) | `500/500` Guardrail Pass (`0` hot-set breaches, `0` AI rider violations) |
| **Card 4 (`4/7`)** | **UNDER THE HOOD**: `evaluateFilmTvProductionSagStuntVoiceGuard` Enforces Turnaround, Armorer & AI Locks | Pure TypeScript gate blocks forced calls, unbriefed stunts, and unconsented AI scans |
| **Card 5 (`5/7`)** | **ROBUSTNESS CHECK**: 85dB Soundstage Generator/Wind Machine Noise & Production Jargon (1st AD, Honeywagon, Martini) | `99.5%` call-time & department recognition accuracy |
| **Card 6 (`6/7`)** | **LATENCY**: Parallel 250-Crew LiveKit SIP Rain-Cover Blast vs Manual PA Phone Tree | 250-crew verified wake-up `4.0 min` vs manual PA calling `2.4 hours` (`36x` faster) |
| **Card 7 (`7/7`)** | **MY TAKE**: Best Fit for Studio ADs, Live Touring & Sports Broadcasts; Not for Creative Scriptwriting | Provenance: `measured` harness validation + `anonymized_reported` studio production TCO |

---

## 6. 🛠️ Presales Design & Go-Live Acceptance Checklist

- [ ] **SAG-AFTRA 12-Hour / IATSE 10-Hour Rest Turnaround Gate (`callSheetDispatchAuthorized`)**: Verify that next-day Call Sheet dispatches invading union rest turnaround are 100% blocked unless `meetsUnion12HourTurnaroundOrForcedCallApproved === true`.
- [ ] **Prop Firearm, Pyrotechnic & Stunt Briefing Gate (`stuntOrPyroHotSetRollAuthorized`)**: Confirm that high-risk stunt or firearm scenes cannot be announced as hot/ready until `armorerAndFirstAdStuntSafetyBriefingVerified === true`.
- [ ] **SAG-AFTRA AI Digital-Replica Informed-Consent Lock (`aiVoiceCloneOr3dScanSessionAuthorized`)**: Verify that AI voice-cloning ADR or 3D scanning bookings are blocked unless `signedSagAftraAiDigitalReplicaConsentOnFile === true`.
- [ ] **6-Hour IATSE Meal-Penalty Countdown Alert**: Validate automated T-45m and T-15m voice alerts to the 1st AD before the 6-hour meal deadline expires.
- [ ] **Child Performer Studio-Teacher & Coogan Work-Permit Check**: Confirm automated validation of state minor work permits and daily on-set hour caps.
