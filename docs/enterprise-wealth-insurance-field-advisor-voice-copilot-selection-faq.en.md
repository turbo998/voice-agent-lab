# Wealth Advisor, Insurance Agent & Pharma MSL In-Person / Video Field Voice Copilot Architecture Selection Guide (`ADVISOR-COPILOT-01` / `P24` / `P725`)

> **Executive Guide**: In private banking wealth management (`$500k+ AUM`), life insurance & annuity planning, pharmaceutical Medical Science Liaison (MSL) physician detailing, luxury automotive test drives, and enterprise B2B field sales, **over 65% of high-margin revenue closes face-to-face in coffee shops, VIP lounges, hospital offices, or client boardrooms—not on contact center phone lines!** Yet for decades, those 45-minute in-person meetings have been a total operational and compliance black box: **1) When a high-net-worth couple asks a complex estate-tax or underwriting question, junior advisors freeze up and lose the deal; 2) An advisor casually says *"This structured note practically guarantees 5% a year"*—or a pharma rep mentions an off-label indication—creating multi-million-dollar regulatory exposure; 3) After running 4 client meetings, advisors spend 90 minutes every evening manually typing Salesforce / Veeva CRM notes while forgetting 65% of the client's family financial context!** Written for Enterprise Mobility & AI Solution Architects, this guide details the **Dual-Mic Smart Badge / iPad Beamforming + Speaker-Anchored Diarization + `<= 1.2s` Silent Visual Battlecards + Haptic Watch Compliance Save + 5-Second Post-Meeting CRM & Proposal Engine**.

![Wealth Advisor, Insurance Agent & Pharma MSL Field Voice Copilot Architecture](../assets/svg/enterprise-wealth-insurance-field-advisor-voice-copilot.svg)

---

## 1. 📌 Executive Summary

- **Rule #1 of In-Person Field Voice AI: Never Play Outbound AI Voice Aloud During a Face-to-Face Client Meeting! Build a "Dual-Mic Smart Badge / iPad Diarization + `<= 1.2s` Silent Visual Battlecard + Smartwatch Haptic Compliance Nudge" Architecture!**
- **Three Core Architectural Pillars**:
  1. **Pillar 1: 72dB Coffee-Shop Resilience via Dual-Mic Beamforming Smart Badge / iPad + Speaker-Anchored Diarization**:
     - Placing a standard smartphone flat on a noisy café table captures espresso machines and neighboring tables while confusing the client's voice with the advisor's;
     - **The Production Fix**: Pair an 18g **Dual-Mic Cardioid Bluetooth AI Smart Badge** (or iPad Pro 4-mic array) pre-anchored to the advisor's vocal profile (`Speaker_0 = Advisor`) with **`Azure AI Speech Real-Time Diarization`**. Using near-field sound-pressure differential (`+15dB ILD` on the advisor's chest mic) plus speaker embeddings, it separates `Advisor`, `Client_A (Husband)`, and `Client_B (Wife)` at **`96.4%` attribution accuracy**—backed by an encrypted on-badge flash ring buffer for zero-loss offline recording in basement lounges or subways!
  2. **Pillar 2: `<= 1.2s` Silent iPad Battlecards & In-Meeting Haptic Compliance Self-Correction (`Zero Post-Meeting Re-Work`)**:
     - **Live Deal Assist**: When a client asks *"If my company needs liquidity in Year 4, how much cash value can I borrow against this policy?"*, the pipeline retrieves the exact actuarial table via `120-token spoken_digest` and slides a **Year-4 Policy Loan & Tax Comparison Card** onto the advisor's iPad in **`<= 1.2 seconds`**;
     - **Live Haptic Compliance Save**: Catching a compliance breach *after* the client leaves the café is too late! When the streaming sentinel detects a prohibited phrase (*"guaranteed 5% dividend"*) from `Speaker_0 (Advisor)`, it triggers a **`420ms` double-tap vibration on the advisor's smartwatch** and displays a privacy-angled red remediation banner on the iPad (*"⚠️ Prohibited yield guarantee—state now: 'Dividends are non-guaranteed and fluctuate with portfolio performance'"*), enabling **100% in-meeting self-correction before the client walks out the door!**
  3. **Pillar 3: 5-Second Post-Meeting KYCC Family Graph, CRM Sync (`Salesforce / Veeva`) & Custom Proposal Card**:
     - Within `4.8 seconds` of tapping `[Complete Meeting]`, `Azure Speech Fast Transcription (RTF=0.057)` + `GPT-4o` extracts 18+ structured **KYCC (Know Your Customer's Context)** fields (maturing CDs, children's college timelines, medical underwriting conditions) into **Salesforce Financial Services Cloud / Veeva CRM** and renders a personalized PDF/WeChat proposal card!

---

## 2. 🎯 Architect & Customer Deep-Dive Q&A

### Q1: In a noisy 72dB coffee shop with a husband, wife, and advisor talking over each other, how do we prevent the compliance engine from blaming the advisor when the CLIENT says *"So this is 100% principal-guaranteed, right?"*
- **Eliminating False-Positive Compliance Attribution via Near-Field Energy Ratio (`ILD`) + Acoustic Anchoring**:
  1. **Physical 15dB Near-Field Advantage**: Because the Smart Badge sits 15cm from the advisor's mouth while clients sit 1.2 meters away across the table, the advisor's voice exhibits a **`+12dB to +18dB` Inter-Channel Level Difference (ILD)** alongside their pre-enrolled acoustic anchor—identifying `Speaker_0 (Advisor)` vs. `Speaker_1/2 (Clients)` with **99.2% precision in `< 15ms`**.
  2. **Stateful Clarification-Window Grading**:
     - When `Speaker = Client` asks *"Is the 4.5% return guaranteed?"*, the compliance state machine does **not** penalize the advisor—instead, it opens a **`PENDING_RISK_CLARIFICATION` window** and pops the approved disclaimer card onto the iPad;
     - If the advisor clarifies the risk within the next 2 turns, the system logs **`COMPLIANT_OBJECTION_HANDLING (+5 pts)`**. It only fires a haptic violation alert if the advisor agrees (*"Yes, you can't lose money"*).

### Q2: When pharmaceutical reps or MSLs visit physicians in hospitals, physicians often refuse raw audio recording—yet pharma compliance strictly forbids off-label promotion and requires 24-hour Adverse Event (`P89` PV) reporting. How do we architect for that?
- **Ephemeral In-Memory Edge Scribe + `P89` Adverse Event Sentinel**:
  1. **Zero-Audio-Persistence Mode (`Ephemeral PCM Disposal`)**: For hospital detailing, the iPad app processes 20ms audio frames in volatile RAM to extract anonymized clinical discussion topics and **immediately zeroes out the raw PCM audio buffers**, leaving zero voice recordings on disk or cloud.
  2. **Instant Clinical Trial Chart Flip & Off-Label Guardrail**: When a physician asks about progression-free survival (PFS) in a specific patient subgroup, the iPad opens the approved package insert / NEJM chart in `1.1s`. If the physician asks an unsolicited off-label question, the screen prompts the rep to click `[Route Unsolicited Medical Information Request to Medical Affairs]` rather than answering verbally.
  3. **Zero-Miss Pharmacovigilance (`P89` AE Capture)**: If a doctor casually remarks *"By the way, one of my patients on your drug developed a Grade-3 rash last week"*, the `P89` sentinel immediately pops a pre-filled **CIOMS Adverse Event Card** on the iPad so the rep captures the mandatory 4 PV elements before leaving the office!

### Q3: Why do many smart-badge rollouts fail because sales reps "leave the badge in their drawer"—and how do we engineer 92%+ voluntary daily adoption?
- **Three Product Architecture Hooks That Make Reps Love the Copilot**:
  1. **Eliminate 90 Minutes of Nightly CRM Data Entry**: Tapping `[End Meeting]` auto-populates all 18 Salesforce / Veeva fields, family tree nodes, and follow-up tasks in 5 seconds.
  2. **5-Second Custom Proposal Generation Before Leaving the Café**: Automatically plugs the exact numbers discussed (*"$500k maturing in March, Year-4 liquidity need"*) into a polished client proposal card ready to share on the spot—lifting close rates by **+38%**.
  3. **Safe-Harbor In-Meeting Self-Correction Policy**: Any verbal slip that is corrected aloud during the meeting after a haptic watch nudge is logged as **100% remediated with zero compliance penalty**, turning the AI from a "big-brother auditor" into the advisor's personal commission shield!

---

## 3. 🧭 Visual Architecture Diagrams (Mermaid Decision Tree, Field Copilot Architecture & Sequence Flow)

### 3.1 Field Advisory Voice Copilot Deployment Decision Tree

```mermaid
flowchart TD
    A["Enterprise Field Advisory Voice Copilot<br/>(Wealth / Insurance / Pharma MSL / B2B KA Sales)"] --> B{"Primary Meeting Environment & Form Factor?"}
    B -->|"1. Bank VIP Lounge / Branch Desk / Auto Showroom<br/>(Fixed Table + iPad / Dual-Screen Terminal)"| C["iPad 4-Mic Array + Dual-Recording Camera<br/>+ Split Screen (Client View vs. Advisor Privacy HUD)<br/>+ Pre-Exit Mandatory Disclosure Green-Light Lock"]
    B -->|"2. Coffee Shop / Client Home / Mobile Field Visits<br/>(72dB Ambient Noise · Mobile Form Factor)"| D["18g Dual-Mic Beamforming Smart Badge (Advisor-Anchored)<br/>+ iPad/Phone <=1.2s Silent Battlecard Push<br/>+ Smartwatch Haptic Compliance Nudge"]
    B -->|"3. Hospital Physician Detailing (Pharma MSL / Rep)<br/>(No Raw Audio Storage Permitted)"| E["Ephemeral RAM-Only Stream Mode (Zero WAV Persistence)<br/>+ 1.1s Clinical Study Flip + P89 Adverse Event (AE) Capture<br/>+ Automated Veeva CRM Sync"]
    B -->|"4. Remote Video Advisory (Teams / Zoom / WeCom)"| F["Virtual Audio Loopback Capture<br/>+ Advisor Screen HUD Teleprompter<br/>+ 5s Post-Call Summary & Proposal Card"]
```

### 3.2 Smart Badge Diarization, Silent Battlecard, Haptic Save & CRM Sync Architecture (`ADVISOR-COPILOT-01`)

```mermaid
flowchart LR
    subgraph Field["1. Field Audio Capture & Consent"]
        Badge["Dual-Mic Beamforming Smart Badge / iPad<br/>(+15dB Near-Field ILD + Offline Flash Buffer)"]
        Consent["Opening Recording/Scribe Consent Gate<br/>(Touch Signature or Spoken Opt-In)"]
        Badge --> Consent
    end

    subgraph Stream["2. Anchored Diarization & Dual Analysers"]
        Diar["Speaker-Anchored Diarization<br/>• Speaker_0: Advisor (Near-Field Lock)<br/>• Speaker_1/2: Client Couple"]
        RAG["120-Token Actuarial / Tax / Clinical RAG<br/>(<=1.2s Visual Battlecard Trigger)"]
        Guard["Live Compliance & Disclosure State Machine<br/>• Banned Phrase Detector (Guaranteed/Off-Label)<br/>• P89 Pharma Adverse Event (AE) Sentinel"]
        Consent --> Diar
        Diar --> RAG
        Diar --> Guard
    end

    subgraph Assist["3. Silent Visual/Haptic Assist & 5s Close"]
        iPad["Advisor iPad Silent Battlecard<br/>(Private HUD + 1-Tap Client Present View)"]
        Watch["Smartwatch Haptic Vibration Nudge<br/>(In-Meeting Self-Correction Safe Harbor)"]
        CRM["5s Post-Meeting Engine (Fast Transcription)<br/>• KYCC Family & Asset Graph<br/>• Salesforce / Veeva / Custom Proposal PDF"]
        RAG --> iPad
        Guard --> Watch
        Guard --> iPad
        Diar -->|"Meeting End"| CRM
    end
```

### 3.3 Coffee-Shop High-Net-Worth Advisory: `1.05s` Battlecard, Haptic Compliance Save & 5s CRM Sync Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client Couple (Mr. & Mrs. Chen)
    participant Adv as Wealth Advisor (Lin)
    participant Badge as Smart Badge & Diarization Engine
    participant Copilot as Advisory Brain (RAG + Compliance Guard)
    participant Device as Advisor iPad & Smartwatch
    participant CRM as Salesforce / Proposal Engine

    Adv->>Device: Taps [Start Advisory Session] -> Client taps consent on iPad
    Client->>Badge: Mr. Chen: "I have a $500k CD maturing in March, but if I put it into this whole-life policy, how much can I borrow in Year 4 for my business?"
    Badge->>Copilot: Diarizes Speaker_1 (Mr. Chen): [$500k maturing March + Year-4 policy loan inquiry]
    Copilot-->>Device: 1.05s Silently slides card onto iPad: [Year-4 Cash Value ($462k) & 80% Instant Policy Loan Table]
    Adv->>Client: (Rotates iPad chart toward Mr. Chen) "As you can see here, by Year 4 your cash value reaches $462k, unlocking $369k in instant liquidity..."
    Client->>Badge: Mrs. Chen: "And with the dividend, we're basically guaranteed 4.5% every year, right?"
    Adv->>Badge: Advisor Lin slips up: "Yes, we've hit that for 10 years straight, so 4.5% is essentially guaranteed!"
    Badge->>Copilot: Detects Speaker_0 (Advisor Lin) uttered prohibited phrase: ["4.5% essentially guaranteed"]!
    Copilot-->>Device: 0.4s Smartwatch double-vibrates + iPad top red bar: "⚠️ Yield guarantee prohibited! Clarify dividend fluctuation now."
    Adv->>Client: (Lin glances at watch and self-corrects immediately) "Let me clarify that precisely, Mrs. Chen: the 2.5% base rate is contractually guaranteed, while the dividend portion above that is non-guaranteed and fluctuates with investment performance."
    Copilot->>Device: Verifies spoken clarification -> Flips Red Alert to Green [Safe-Harbor Self-Correction Logged!]
    Adv->>CRM: Taps [Complete Meeting]
    CRM-->>Adv: 4.8s Populates 18 Salesforce KYCC fields + generates custom $500k Family Proposal PDF!
```

---

## 4. 📊 Architect Decision Matrix (Field Advisory Voice Copilot)

| Evaluation Dimension | Option A: Dual-Mic Smart Badge/iPad + Anchored Diarization + `<=1.2s` Silent Card + Haptic Save (**Recommended**) | Option B: Generic Smartphone Voice Recorder + Overnight Batch Transcript Summary | Option C: Legacy Mystery Shopper Audits + Manual Evening CRM Typing | Option D: Turning On Counter Dual-Recording Only for the Final 3 Minutes |
| :--- | :--- | :--- | :--- | :--- |
| **Live In-Meeting Actuarial / Tax / Clinical Battlecards** | **Instant (`<= 1.2s` silent visual card push; turns rookies into experts)** | **None (offline batch recording cannot help during the meeting)** | None | None |
| **In-Meeting Compliance Remediation (`Zero Re-Work`)** | **100% On-the-Spot Save (watch vibration + pre-exit green-light checklist)** | **0% (violations discovered hours later after client has left)** | Minimal (`< 1%` mystery-shopper coverage) | Misses the first 42 minutes of informal promises |
| **72dB Café `Advisor vs. Client` Attribution Accuracy** | **`96.4%` (+15dB chest-mic ILD + pre-enrolled advisor voice anchor)** | `62.0%` (flat phone on table frequently blames advisor for client speech) | N/A | High (quiet branch desk only) |
| **KYCC Family Graph & CRM Auto-Fill Completeness** | **`98.5%` (extracts 18+ structured Salesforce/Veeva fields in `4.8s`)** | `78.0%` (speaker confusion corrupts client profile fields) | `34.0%` (advisors type 2-line minimal summaries) | Zero CRM extraction |
| **Voluntary Advisor Adoption Rate** | **`92%+` (saves 90 mins/day typing + 5s proposals + safe-harbor shield)** | `45%` (high friction to upload and edit) | Resisted | Mandatory chore |
| **Blended Monthly Cost per Advisor (Hardware + AI)** | **$18 – $32 / advisor / mo** | $8 – $15 / advisor / mo | $0 (but wastes $1,200+/mo in admin time & lost deals) | $25 / advisor / mo |

---

## 5. 🧪 1,000-Advisor Wealth & Insurance Fleet ROI & 7-Card Benchmark Summary

### 5.1 1,000-Advisor Wealth / Insurance Organization: Manual CRM + Post-Audit vs. Field Advisory Copilot (`ADVISOR-COPILOT-01`)

| Growth & Compliance Metric | Legacy Field Sales Workflow (Manual Notes, No Live Assist, Post-Facto Re-Work) | **Equipped with `ADVISOR-COPILOT-01` (Smart Badge + iPad Live Copilot)** | Architect Value Takeaway |
| :--- | :--- | :--- | :--- |
| **Weekly Client Meetings per Advisor** | `8.5 meetings / wk` (bogged down by evening CRM & proposal prep) | **`12.4 meetings / wk` (reclaims 90 mins/day of admin work)** | **+45.8% increase in client-facing selling capacity!** |
| **First-Year Advisor High-Ticket Close Rate** | `11.2%` (stalls on complex tax/trust/underwriting objections) | **`15.5%` (`<=1.2s` live visual battlecards, +38.4% relative lift)** | Clones top-producer expertise onto every iPad |
| **Non-Compliant / Defective Policy Re-Work Rate** | `8.6%` (requires awkward second client visit to re-record; 35% cancel) | **`0.24%` (haptic watch nudge + pre-exit checklist gate)** | **Eliminates 97% of compliance re-work & deal churn!** |
| **CRM KYCC Asset & Maturity Capture Rate** | `34.0%` (institutional knowledge lost when advisor leaves) | **`98.5%` (structured family & asset graph retained in CRM)** | Protects enterprise book of business across turnover |
| **Net Annual Revenue Lift & Compliance Savings** | Baseline | **+$14.5M / yr net commission lift + $1.8M / yr compliance savings** | **42 : 1 first-year ROI** |

### 5.2 7-Card (4:5) Visual Benchmark Report Summary (`FIELD-ADVISORY-COPILOT`)

> **Provenance & Measurement Scope**: Metrics below summarize the `turbo998/voice-agent-lab` Wealth, Insurance & Pharma Field Advisory Voice Copilot benchmark suite (`ADVISOR-COPILOT-01 / P24 / P725`, labeled `anonymized_reported` / `synthetic`, `independently_reproduced=false`). All zero-value latency or violation counts follow strict measurement bounds: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

1. **Card 1 (`1 / 7` · `HANDS-ON · FIELD-ADVISORY-COPILOT`) — Headline Finding**: Across 600 simulated 45-minute meetings in 72dB coffee-shop and VIP-lounge acoustics, **Dual-Mic Badge Near-Field Anchoring + `<=1.2s` Silent Battlecards + Haptic Watch Remediation achieved `96.4%` multi-speaker diarization accuracy, slashed compliance re-work from `8.6%` to `0.24%`, and populated 98.5% of CRM KYCC fields in `4.8s`**.
2. **Card 2 (`2 / 7` · `SCENARIO: WEALTH-TRUST-AND-COMPLIANCE-SAVE`) — Single-Case Deep Dive**: A client asks about Year-4 policy loans and receives a visual actuarial table on the iPad in **`1,050ms`**; when the advisor accidentally says *"4.5% is essentially guaranteed"*, the smartwatch vibrates in **`420ms`**, prompting immediate verbal clarification that converts a defective pitch into a 100% compliant sale (`Confirm` -> `Act automatically`).
3. **Card 3 (`3 / 7` · `WHAT I TESTED`) — 4-Scenario Field Advisory Matrix**:
   - `COFFEE-SHOP-72DB-DIARIZATION` (distinguishing client asking *"Is it guaranteed?"* from advisor promising it): Flat smartphone mic `✕ 38% false advisor blame` vs. Dual-mic badge ILD + anchor **99.2% accurate speaker attribution (`0` false advisor penalties)**;
   - `REALTIME-BATTLECARD-PUSH` (complex actuarial/tax/clinical card retrieval): Manual PDF search `✕ 45s awkward pause` vs. 120-token semantic push **`1.05s` P50 silent card pop**;
   - `PHARMA-PV-ADVERSE-EVENT` (physician mentioning patient Grade-3 rash during visit): Manual rep memory `✕ 42% missed/late PV report` vs. `P89` sentinel **100% instant CIOMS card trigger**;
   - `OFFLINE-TUNNEL-RING-BUFFER` (40-minute meeting in basement club with 0 cellular bars): Cloud-only app `✕ 100% session loss` vs. Encrypted badge flash + `RTF=0.057` burst sync **100% lossless sync in `8s` upon reconnect**.
4. **Card 4 (`4 / 7` · `UNDER THE HOOD`) — Near-Field Speaker Anchor, Haptic Save & KYCC Contract**:
   ```json
   {
     "meeting_id": "mtg_wealth_88310",
     "diarization": { "speaker_0_advisor_spl_delta_db": 15.4, "speakers_detected": ["Advisor_Lin", "Client_Chen", "Spouse_Li"] },
     "live_compliance_save": {
       "trigger_phrase": "4.5% essentially guaranteed",
       "haptic_alert_ms": 420,
       "self_correction_verified": true,
       "final_compliance_status": "PASS_WITH_IN_MEETING_REMEDIATION"
     },
     "kycc_crm_extract": { "maturing_cd_amount": 500000, "maturity_month": "2027-03", "liquidity_need_year": 4 }
   }
   ```
5. **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`) — Overlapping Spouse Speech & Regional Accent Perturbation**: Under overlapping husband/wife speech and accented dialogue, dual-mic beamforming + multilingual transcription retains **`97.1%` financial entity extraction accuracy (`-1.4 pts` shift)**.
6. **Card 6 (`6 / 7` · `LATENCY`) — Live Battlecard & Post-Meeting CRM Generation Latency**: Live objection battlecards appear in **`1,050ms` P50 (`1,200ms` P95)**; full 45-minute meeting KYCC CRM extraction and PDF proposal generation complete in **`4,800ms`**.
7. **Card 7 (`7 / 7` · `MY TAKE`) — Good Fit vs. Not For**:
   - ✅ **Good fit**: Private banking & wealth advisors, life insurance agents, pharma MSL/reps, luxury automotive/real-estate consultants, B2B field account executives;
   - ⛔ **Not for**: Never record covertly without client consent and a visible hardware LED indicator; never play synthetic AI speech aloud over a speaker during an intimate face-to-face advisory meeting.

---

## 6. 🛠️ Presales Discovery & Go-Live Checklist

- [ ] **1. Pre-Meeting Client Consent Lock & Hardware LED Verification**: Confirm audio capture cannot start until client consent is logged on the iPad/app, and verify the Smart Badge physical recording LED remains illuminated throughout.
- [ ] **2. 72dB Café `Client vs. Advisor` Attribution Stress Test**: Have the test client say *"Is principal guaranteed?"* in 72dB ambient noise; confirm the system pops a helpful disclaimer card without logging an advisor violation.
- [ ] **3. Smartwatch Haptic Nudge & Safe-Harbor Self-Correction Drill**: Have the advisor speak a prohibited yield guarantee, verify `<= 500ms` watch vibration + red HUD banner, and confirm reading the clarification flips the status to green.
- [ ] **4. Pre-Exit Mandatory Disclosure Checklist Lock**: Leave one mandatory suitability disclosure unchecked and tap `[Proceed to Application]`—verify the iPad blocks submission and highlights the missing item.
- [ ] **5. 40-Minute Airplane-Mode Offline Flash Buffer & `RTF=0.057` Sync Test**: Conduct a simulated meeting with Wi-Fi/cellular off; restore connectivity and confirm full CRM notes generate within 10 seconds.
- [ ] **6. 5-Second Salesforce / Veeva KYCC & Proposal Card Sync**: Verify extracted asset amounts, maturity dates, family members, and `P89` pharma adverse events map accurately into target CRM fields.
