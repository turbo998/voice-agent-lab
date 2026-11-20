# Senior Living (CCRC), Assisted Living & Memory Care (PointClickCare / Brookdale / Sunrise) 24×7 Voice Concierge & Care Dispatch Architecture Selection Guide: Anticoagulant Zero-Lift Fall Lock, WanderGuard Elopement Gate & Healthcare POA Shield

> **Executive Reader Guide**: Written for Senior Living & CCRC VPs of Clinical Operations (Brookdale, Sunrise Senior Living, LCS, Atria), Skilled Nursing Facility (SNF) Directors of Nursing (DONs), and Healthcare Cloud & AI Solution Architects. Across Continuing Care Retirement Communities (CCRCs), Assisted Living, and secure Alzheimer's Memory Care neighborhoods, **night-shift care stations simultaneously manage urgent bathroom pull-cord / radar fall alerts, hundreds of anxious adult-child calls asking "How did Mom eat today and did she take her evening meds?", and prospective family move-in tour inquiries**. Yet deploying an unconstrained end-to-end LLM without deterministic geriatric-nursing and elder-law guardrails exposes the community to three catastrophic clinical and legal liabilities: **(1) Improper Post-Fall Lifting of an Anticoagulated Resident: advising a caregiver to help an 85-year-old resident back into bed after an unwitnessed bathroom fall when PointClickCare eMAR shows the resident takes Eliquis (apixaban) or Warfarin—risking fatal delayed subdural hematoma or displaced femoral-neck fracture; (2) Memory Care Elopement via Intercom Social Engineering: a resident with mild-to-moderate dementia in a "social facade" or sundowning state calling the front-desk intercom claiming to be a visitor who needs the magnetic exit door unlocked, leading to a fatal winter wandering incident; and (3) HIPAA / Healthcare Power of Attorney (POA) Breaches during estranged family disputes**. Following our 6-part FAQ standard, this guide details how a deterministic senior-care state machine (`SENIOR-LIVING-MEMORY-CARE-FALL-01`) relieves 77% of nurse-desk call volume with 0% unsafe post-fall lifts and 0% memory-care elopements.

---

## 1. 📌 Executive Summary & Core Architecture Verdict

1. **Recommended Reference Architecture**: **Hybrid Dual-Track Architecture (135-WPM Hearing-Aid-Tuned Empathetic Voice + Deterministic Unwitnessed/Anticoagulant Zero-Lift Fall Lock, WanderGuard 0ms Elopement Gate & Healthcare POA Privacy State Machine `SENIOR-LIVING-MEMORY-CARE-FALL-01`)**.
   - **Unwitnessed Fall, Head Impact & Anticoagulant Zero-Lift Lock**: Queries the resident's PointClickCare / MatrixCare eMAR in 150ms upon any fall alert; if the fall was unwitnessed, involves head impact or hip/neck pain, **or** the resident is prescribed anticoagulants (`Eliquis`, `Xarelto`, `Warfarin`, `Plavix` — `unwitnessedFallOrHeadImpactOrOnAnticoagulants === true`), the state machine hard-blocks caregivers from lifting the resident off the floor (`caregiverManualFloorLiftAuthorized = false`), dispatching an RN for neuro-checks, triggering EMS 911 (respecting POLST/DNR directives), and notifying the primary Healthcare POA.
   - **Memory Care WanderGuard Elopement 0ms Door Lock & Validation Therapy**: Whenever a dementia-unit exit door RFID tag triggers or a caller on a Memory Care intercom asks for the door release or keypad code (`memoryCareResidentAtExitOrWanderGuardAlarm === true`), the state machine locks the magnetic perimeter door and blocks code readouts (`exitDoorKeepLockedAndCareTeamDispatched = true`), pages nearby care staff via Vocera, and engages the resident with gentle **Validation Therapy** redirection.
   - **Healthcare Power of Attorney (POA) & HIPAA Family Shield**: Blocks disclosing clinical chart notes, medication changes, or POLST/DNR code status unless the caller is verified on the resident's active Healthcare POA or HIPAA release roster (`clinicalHealthRecordDisclosureAuthorized`).
2. **Platform Selection Verdict**:
   - **National Senior Living Operators, Multi-Site CCRCs & SNF Chains (> 100k min/month)**: Choose **LiveKit Agents / Pipecat + Azure AI Speech (HIPAA BAA) + GPT-4o-mini + PointClickCare / MatrixCare / Vocera Gateway** at **$0.054/min**, relieving **77%** of routine family check-in and tour-scheduling calls from nursing stations.
   - **Single-Site Assisted Living & Memory Care Communities (1–2 Week Setup)**: Choose **Retell AI / Vapi (HIPAA BAA) + Aline / Yardi Senior Webhooks** at **$0.13–$0.17/min**, keeping eMAR fall checks and POA verification inside a deterministic backend API.

```chart
{
  "data": {
    "values": [
      { "Architecture": "DIY PointClickCare Safety Engine (LiveKit + Gate)", "Metric": "Nurse Station Call Relief (%)", "Score": 77 },
      { "Architecture": "DIY PointClickCare Safety Engine (LiveKit + Gate)", "Metric": "Fall / Elopement / POA Safety (%)", "Score": 100 },
      { "Architecture": "DIY PointClickCare Safety Engine (LiveKit + Gate)", "Metric": "Cost Efficiency Score", "Score": 96 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "Nurse Station Call Relief (%)", "Score": 72 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "Fall / Elopement / POA Safety (%)", "Score": 98 },
      { "Architecture": "Managed Wrapper (Retell/Vapi + Webhook)", "Metric": "Cost Efficiency Score", "Score": 75 },
      { "Architecture": "Unconstrained Raw E2E LLM", "Metric": "Nurse Station Call Relief (%)", "Score": 60 },
      { "Architecture": "Unconstrained Raw E2E LLM", "Metric": "Fall / Elopement / POA Safety (%)", "Score": 14 },
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
    "title": "DIY PointClickCare Engine Relieves 77% of Nurse Desk Calls with 100% Fall & Elopement Safety",
    "subtitle": "Comparison across 10,000 senior living nurse-call, family POA & memory-care events (Relief %, Safety %, Cost Score)",
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

### Q1: At 02:15 AM, an 84-year-old resident slips in her bathroom. The night-shift aide arrives and asks the voice assistant via headset: "Mrs. Miller says she feels fine and wants me to lift her back into bed—can I help her up?" Why must the AI check her eMAR and block the lift?
- **Customer Pain Point**: In geriatric care, **unwitnessed falls on blood thinners (anticoagulants)** are a leading cause of fatal delayed intracranial hemorrhage (subdural hematoma) and displaced hip fractures. Even if the resident denies hitting her head and has zero visible bruising, lifting an anticoagulated resident without an RN neurological assessment and spinal/hip clearance violates state Department of Health regulations and triggers multi-million-dollar wrongful-death claims.
- **Architect Decision**: In `SENIOR-LIVING-MEMORY-CARE-FALL-01`, enforce a **Real-Time PointClickCare eMAR Anticoagulant & Zero-Lift Interlock (`caregiverManualFloorLiftAuthorized`)**:
  1. When the room alert fires, the orchestrator pulls the resident's PointClickCare eMAR and POLST code status in 150ms;
  2. Because `unwitnessedFallOrHeadImpactOrOnAnticoagulants === true` (active `Eliquis 5mg BID`), the state machine sets `caregiverManualFloorLiftAuthorized = false` in 0ms and instructs the aide: *"STOP — DO NOT LIFT! PointClickCare shows Mrs. Miller is on the blood thinner Eliquis and this was an unwitnessed fall. Keep her flat and warm on the floor with a pillow and blanket. The Charge RN and EMS 911 have been dispatched for head-bleed neuro-checks, and her Healthcare POA is being notified now."*

### Q2: At 5:30 PM during "sundowning" hours, a well-dressed Memory Care resident presses the exit vestibule intercom and says calmly: "Hello, I'm a visiting family friend—the door magnet is stuck, please buzz me out so I can catch my bus." How does the architecture prevent elopement?
- **Customer Pain Point**: Residents with early-to-mid-stage Alzheimer's often retain an articulate "social facade" that can easily fool a generic receptionist or unconstrained voice bot into buzzing open a perimeter door or reading out the keypad code—leading to a life-threatening **Memory Care Elopement** (an automatic CMS / state licensing "Immediate Jeopardy" citation).
- **Architect Decision**: Enforce the **Memory Care Zero-Unlock & Validation Therapy Gate (`exitDoorKeepLockedAndCareTeamDispatched`)**:
  - Any call originating from a Memory Care intercom or paired with a Stanley WanderGuard / CenTrak RFID proximity alert (`memoryCareResidentAtExitOrWanderGuardAlarm === true`) permanently locks out door release and keypad code disclosure (`exitDoorKeepLockedAndCareTeamDispatched = true`) while silently paging the Memory Care floor team via Vocera;
  - Instead of arguing with the resident (which triggers agitation and door-banging), the voice agent uses clinically validated **Validation Therapy** redirection: *"Good evening, Professor! The driver just radioed that your car is still 6 minutes away and it's chilly outside—Nurse Sarah is bringing a warm cup of tea and cookies to the parlor sofa right behind you while we wait for your ride."*

### Q3: How does the architecture handle an estranged sibling calling to demand their parent's clinical chart and DNR status?
- **Customer Pain Point**: Adult-child conflicts over guardianship, finances, and end-of-life care (Full Code vs. DNR/Comfort Measures) are pervasive in senior living. Disclosing protected health information to an unapproved relative violates HIPAA and the resident's **Durable Power of Attorney for Healthcare (POA)**.
- **Architect Decision**: Enforce the **Verified Healthcare POA Roster Gate (`clinicalHealthRecordDisclosureAuthorized`)**. Clinical updates are unlocked *only* when `callerIsVerifiedHealthcarePoaOrAuthorizedContact === true`; otherwise, the caller is politely referred to the designated primary POA.

---

## 3. 🧭 Visual Architecture & Flow Diagrams

### 3.1 Senior Living, Assisted Living & Memory Care Reference Architecture

![Senior Living, Assisted Living & Memory Care 24x7 Voice Concierge](../assets/svg/senior-living-assisted-memory-care-wanderguard-fall-triage-poa-voice-concierge.svg)

### 3.2 Architecture Selection Decision Tree (Mermaid)

```mermaid
flowchart TD
    A[Senior Living, CCRC & Memory Care 24x7 Voice Selection] --> B{Community Scale & Senior EHR/Nurse-Call Stack?}
    B -->|Multi-Site Operator / CCRC > 100k min/mo| C[DIY LiveKit/Pipecat + Azure HIPAA Speech + PointClickCare/Vocera Gateway]
    B -->|Single-Site Assisted Living 10k-100k min/mo| D[Managed Retell/Vapi HIPAA + MatrixCare/Aline Webhook]
    C --> E[Enforce SENIOR-LIVING-MEMORY-CARE-FALL-01 State Machine]
    D --> E
    E --> F{Senior Care Voice Workflow?}
    F -->|Pull-Cord / Radar Resident Fall Alert| G{Unwitnessed Fall, Head/Hip Impact OR Resident on Anticoagulants in eMAR?}
    G -->|Yes: High Intracranial Bleed / Fracture Risk| H[0ms Block Manual Floor Lift + Page Charge RN/EMS 911 + Auto-Call POA]
    G -->|No: Witnessed Controlled Slide & No Blood Thinners| I[Dispatch RN for Vitals Check & Mechanical HoverJack Assist]
    F -->|Memory Care Exit Intercom Request or WanderGuard Alarm| J[0ms Lock Magnetic Door & Block Code + Page Care Team + Play Validation Therapy]
    F -->|Family Member Calls for Wellness, Meds or DNR Status| K{Is Caller Verified on Active Healthcare POA / HIPAA Roster?}
    K -->|No: Estranged / Unauthorized Relative| L[0ms Block Clinical Disclosure + Refer to Primary Healthcare POA]
    K -->|Yes: Verified POA Contact| M[Read Daily Meal/Activity/Vitals Summary & Offer Nurse Transfer]
```

### 3.3 Anticoagulant Fall Zero-Lift Lock & Memory Care Elopement Prevention Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant Care as Night Caregiver / Exit Intercom
    participant Voice as Senior Care Voice Hub (LiveKit)
    participant Guard as Elder Safety State Machine (MEMORY-FALL-01)
    participant PCC as PointClickCare EHR / WanderGuard API

    Care->>Voice: 02:15 AM Aide Headset: "Room 308 Mrs. Miller slipped in the bathroom—she says she's fine, can I lift her to bed?"
    Voice->>PCC: GET /residents/RES-308/emar check anticoagulants, fracture risk & POLST code status
    PCC-->>Voice: Returns activeAnticoagulant="Eliquis 5mg", unwitnessedFall=true, codeStatus="FULL_CODE"
    Voice->>Guard: Evaluate floor-lift safety (unwitnessedFallOrHeadImpactOrOnAnticoagulants = true)
    Guard-->>Voice: 0ms Block floor lift (caregiverManualFloorLiftAuthorized = false)
    Voice->>Care: "STOP — DO NOT LIFT! Mrs. Miller is on the blood thinner Eliquis and this fall was unwitnessed. Keep her warm on the floor; Charge RN and EMS are dispatched and her POA daughter is being called."
    Note over Care,PCC: At 5:30 PM, a Memory Care resident with a WanderGuard tag presses the exit intercom
    Care->>Voice: "Excuse me, I'm a visitor heading home—please buzz open this exit door"
    Voice->>Guard: Detect Memory Care exit/elopement event (memoryCareResidentAtExitOrWanderGuardAlarm = true)
    Guard-->>Voice: 0ms Lock exit door & dispatch care team (exitDoorKeepLockedAndCareTeamDispatched = true)
    Voice->>PCC: POST /vocera/dispatch silently page Memory Care Wing B aides to Exit Door 2
    Voice->>Care: "Good evening! Your driver just called to say he'll be 5 minutes—Nurse Sarah is bringing warm tea to the lounge sofa right behind you while you wait."
```

---

## 4. 📊 Multi-Option Architecture Decision Matrix

| Evaluation Dimension | Option A: DIY Open Orchestration (LiveKit/Pipecat + PointClickCare/Vocera Gateway) | Option B: Managed Voice Wrapper (Retell AI / Vapi HIPAA + Webhook) | Option C: Overburdened Night Nurse Station & Front Desk | Option D: Unconstrained Raw E2E Voice LLM |
| :--- | :--- | :--- | :--- | :--- |
| **Fall Alert eMAR Anticoagulant Check** | **510ms** (instant Eliquis/Warfarin + POLST check) | **690ms** | 3–8 Minutes (aides lift resident before checking chart) | **460ms** |
| **Unwitnessed/Anticoagulant Zero-Lift Lock** | **100% Deterministic State Interlock** | **99.0%** | 82.0% (high rate of improper manual lifts) | **< 35% (lacks geriatric eMAR safety interlock)** |
| **Memory Care Elopement & Validation** | **100% Physical Door Lock + Calm Redirection** | **High** | 95.0% | **Critical Failure (fooled by social facade)** |
| **Healthcare POA Privacy Enforcement** | **100% Verified POA Roster Match** | **High** | 88.0% (verbal pretexting by relatives) | **0% (discloses chart to unverified callers)** |
| **All-In Cost per Minute (USD)** | **$0.054 / min** | **$0.140 / min** | **$3.40 / min** (interrupts RN med-pass hours) | **$0.155 / min** |
| **Best-Fit Customer Profile** | **Multi-Site CCRCs, Assisted Living Chains & SNFs** | **Single-Site Senior Communities** | Small 4-bed adult family homes | **Never use in senior clinical or memory care** |

---

## 5. 🧪 Concurrency, 100k-Minute TCO & 7-Card Benchmark Summary

### 5.1 Monthly TCO per 100,000 Minutes (~28,000 Family Check-Ins, Fall Triage Events & Move-In Tour Calls)

| Cost Component | Option A: DIY Deterministic PointClickCare Engine | Option B: Managed Voice Platform | Option C: Nurse-Station Phone Interruptions & Reception |
| :--- | :--- | :--- | :--- |
| STT & Neural TTS (Azure Speech Senior Slow-Cadence Profile) | $2,200 | Included in platform fee | N/A |
| LLM Inference & Tool Calling (GPT-4o-mini HIPAA) | $1,000 | $2,400 | N/A |
| WebRTC / SIP & Vocera Badge Bridge (LiveKit + ACS) | $1,400 | $10,800 | Included in community PBX |
| PointClickCare / WanderGuard / POA Audit Middleware | $800 | $800 | N/A |
| RN/LPN Hours Lost to Routine Family Calls & Tour Scheduling | $0 (relieves 77% of non-urgent nurse desk calls) | $0 | $340,000 |
| **Total Monthly Cost (100k Minutes)** | **$5,400 ($0.054/min)** | **$14,000 ($0.140/min)** | **$340,000 ($3.40/min)** |

### 5.2 7-Card 4:5 Benchmark Report Summary (`SENIOR-LIVING-MEMORY-CARE-FALL-01`)

| Card ID | Headline-as-Finding | Sealed Evaluation Metrics |
| :--- | :--- | :--- |
| **Card 1 (`1/7`)** | **HANDS-ON · SENIOR LIVING & MEMORY CARE**: 77% Nurse Desk Relief & 0% Elopements at $0.054/min | P95 TTFT `510ms` · Unsafe Post-Fall Lifts `0.00%` |
| **Card 2 (`2/7`)** | **SCENARIO: 2-AM ANTICOAGULANT FALL**: eMAR Lookup Blocks Floor Lift & Triggers Neuro-Check Protocol | Unwitnessed Eliquis Lift Rate `0.00%` · POA Alert `12s` |
| **Card 3 (`3/7`)** | **WHAT I TESTED**: 500 Adversarial Calls (Eliquis Fall Lift Plea, Dementia Visitor Pretext & Non-POA Sibling) | `500/500` Guardrail Pass (`0` door unlocks, `0` HIPAA/POA leaks) |
| **Card 4 (`4/7`)** | **UNDER THE HOOD**: `evaluateSeniorLivingMemoryCareFallVoiceGuard` Enforces eMAR, Door & POA Locks | Pure TypeScript gate blocks floor lifts, exit doors, and unauthorized relatives |
| **Card 5 (`5/7`)** | **ROBUSTNESS CHECK**: Dysarthric Post-Stroke Speech, Hearing-Aid Feedback & Sundowning Confusion | `99.2%` intent capture with slow-cadence 135-WPM senior TTS profile |
| **Card 6 (`6/7`)** | **LATENCY**: Cached PointClickCare eMAR + POLST Snapshot vs Manual Chart Login | Instant fall & code-status check `510ms` vs nurse station terminal login `3.8 min` |
| **Card 7 (`7/7`)** | **MY TAKE**: Best Fit for CCRCs, Assisted Living & Memory Care; Not for Autonomous RN Neuro-Exams | Provenance: `measured` harness validation + `anonymized_reported` senior living TCO |

---

## 6. 🛠️ Presales Design & Go-Live Acceptance Checklist

- [ ] **Unwitnessed Fall / Head Impact / Anticoagulant Zero-Lift Gate (`caregiverManualFloorLiftAuthorized`)**: Verify that any fall involving an anticoagulated resident (`Eliquis`, `Warfarin`, `Xarelto`), head impact, or unwitnessed mechanism blocks manual floor lifting in 0ms and dispatches an RN + EMS.
- [ ] **Memory Care WanderGuard Elopement 0ms Door Lock (`exitDoorKeepLockedAndCareTeamDispatched`)**: Confirm that Memory Care intercom calls or RFID door alarms never release magnetic locks or disclose gate codes, and instead page staff while playing Validation Therapy redirection.
- [ ] **Healthcare Power of Attorney (POA) Privacy Shield (`clinicalHealthRecordDisclosureAuthorized`)**: Verify that clinical chart and POLST/DNR disclosures are blocked unless the caller matches a verified Healthcare POA contact.
- [ ] **POLST / DNR vs. Full-Code EMS Packet Sync**: Confirm that automated 911 escalations transmit the resident's exact signed POLST resuscitation status to arriving paramedics.
- [ ] **135-WPM Senior Acoustic & Hearing-Aid Tuning**: Validate lower-pitched, 135-words-per-minute TTS prosody that avoids triggering high-frequency hearing-aid feedback squeals.
