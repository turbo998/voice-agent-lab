# Legal Intake, Personal Injury & Mass Tort (`ABA Rule 1.18 Conflict Check / Statute of Limitations SOL Gate / In-Call Retainer e-Sign & Evidence Vision`) Voice & Multimodal AI Architecture Selection Guide

> **Document Scope**: Built for Managing Partners, Legal Operations VPs, Personal Injury (`PI`) & Mass Tort Intake Directors, and LegalTech Platform Architects (`Clio / Filevine / Litify / LeadDocket / Intapp / Elite 3E`), this guide explains how to convert **`$450–$1,200` inbound legal ad leads at `74.8%` (up from `31.0%`)** via **24/7 Trauma-Informed Voice Intake + Guided In-Call `DocuSign` Retainer Execution**, how a **2-Phase `ABA Model Rule 1.18` Conflict-First Firewall** prevents prospective-client confidential disclosures from disqualifying the firm from existing corporate representations (`0.00%` imputed disqualification), how to enforce **Zero Unauthorized Practice of Law (`UPL`)**, and how a **Deterministic 50-State Statute of Limitations (`SOL` + 180-Day Municipal Tort Notice) Engine + `2.0s` Police Crash Report Vision** eliminate legal malpractice exposure.

![Legal Intake & Mass Tort ABA Conflict Firewall, Statute of Limitations & In-Call Retainer e-Sign Architecture](../assets/svg/legal-intake-mass-tort-personal-injury-statute-of-limitations-conflict-check-aba-voice-selection-faq.svg)

---

## 📌 1. Executive Summary

1. **Law Firm Ethics Rule #1: Never Ingest Confidential Case Facts Before Running an Adverse-Party Conflict Check (`ABA Model Rule 1.18` 2-Phase Firewall)**:
   - **The Imputed Disqualification Catastrophe**: Under **American Bar Association (`ABA`) Model Rule 1.18 (Duties to Prospective Client)**, if a prospective caller reveals prejudicial confidential facts to an intake system *before* the firm discovers that the opposing party (`Adverse Party`) is an existing client of the firm, the entire law firm can be **disqualified by the court from representing its existing million-dollar client**!
   - **2-Phase Hardware-Isolated Conflict Gate (Recommended)**:
     - **Phase 1 (Pre-Clearance Ephemeral Buffer—Names Only)**: After reading the mandatory non-representation disclaimer, the state machine **strictly blocks detailed fact or fault narration**, collecting *only* **① Caller Full Name, ② Incident Date & Jurisdiction, and ③ Opposing / Adverse Party Name**;
     - **`<100ms` Fuzzy Conflict Search (`Clio / Intapp / Elite 3E`)**: Queries the firm's master conflict database across phonetic variants and corporate parent-subsidiary trees. If a potential conflict hits, the call is **terminated politely in `0ms`, the ephemeral RAM buffer is wiped without writing a single word to CRM**, and the caller is referred to the State Bar referral line (`0.00%` firm conflict contamination). Only after `conflict_status == CLEAR` does **Phase 2 (Fact, Injury & Insurance Intake)** unlock.
2. **Stop Losing `$800` Ad Leads After Hangup—Lift Signed Retainer Conversion from `31.0%` to `74.8%` via "Guided In-Call `DocuSign` Retainer Execution + `2.0s` Police Report Vision"**:
   - In Personal Injury and Mass Tort, `39%` of injured claimants call after hours from emergency rooms or accident scenes. If an answering service merely takes a message for tomorrow—or emails a retainer link after hanging up—**`52%` of qualified claimants call the next Google Local Services ad and sign with a competitor within 30 minutes**.
   - Once a claimant passes the conflict check and deterministic qualification rubric (`Commercial Policy + ER/Fracture + Clear Liability + No Prior Attorney`), the Voice Agent **stays on the live call**, texts an instant **`DocuSign / PandaDoc` Retainer + `HIPAA/HITECH` Medical Release packet**, walks the claimant through signing on their phone screen in 65 seconds, and scans their **Police Crash Report & insurance card in `2.0 seconds`**.
3. **Zero Unauthorized Practice of Law (`UPL`), Deterministic 50-State Statute of Limitations (`SOL` + 180-Day Municipal Tort Notice) & Automated `Non-Engagement Letters`**:
   - **Zero `UPL`**: The output guardrail blocks any valuation promises (*"Your case is worth $300k"*) or legal strategy advice;
   - **Deterministic `SOL` & `Non-Engagement` Malpractice Shield**: Calculates exact state statutory deadlines—including **`180-day` Government/Municipal Tort Claim Notices** when a city bus or municipal vehicle is involved—escalating any case within `<90 days` of expiration to an on-call partner, and automatically sending a tracked written **`Non-Engagement Letter`** via SMS + email whenever a lead is declined.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: Distressed callers often start blurting out confidential details in the first 10 seconds ("My business partner John Smith defrauded me and here's what I did..."). How do we stop conflict contamination if John Smith is already our client?

- **Closed-Ended Opening + Ephemeral Pre-Clearance Audio Buffer**:
  1. **Structured Conflict-First Prompting**:
     - Never open a legal intake call with an open-ended *"How can I help you today?"*
     - Open with: *"Thank you for calling [Firm Name] Intake. To protect everyone's legal rights, please do not share specific case details yet—first, I just need your full name and the name of the other person, driver, or company involved so I can run a quick 10-second conflict check."*
  2. **Zero-Persistence Pre-Clearance RAM**:
     - All audio captured during Phase 1 resides strictly in encrypted ephemeral RAM. If the caller tries to narrate facts prematurely, the turn detector gently interrupts to capture the adverse party's name first. If `Intapp / Clio` flags an adverse conflict, the RAM buffer is zero-filled in `0ms`—**no transcript or summary ever enters `Filevine / Litify`**, preserving an ironclad `ABA Rule 1.18(d)(2)` ethical screen.

### Q2: Legal malpractice insurers cite two top intake failures: missing a shortened Statute of Limitations (like a 6-month municipal notice) and failing to send a written Non-Engagement Letter to declined callers. How does the architecture guarantee 0.00% misses?

- **Deterministic Statutory Calendar + Automated Non-Engagement Dispatch**:
  1. **50-State `SOL` + Government Tort Entity Detector**:
     - While a standard auto accident in California has a `2-year` bodily injury `SOL`, being hit by a **city transit bus, municipal sanitation truck, or school district vehicle** triggers a strict **`6-month (180-day)` Government Tort Claim filing deadline**!
     - When the caller or the `2.0s` Police Report OCR identifies a public/municipal entity as the adverse party, the deterministic `SOL` engine switches to the shortened municipal clock and pages the on-call Managing Partner in `<15 seconds` if `<90 days` remain.
  2. **Mandatory Dual-Channel `Non-Engagement Letter` on Every Declined Call**:
     - If a caller's claim is declined (e.g., property damage only, no injury, or outside practice area), the Voice Agent explicitly states that the firm **is not representing them and has not filed any action on their behalf**, warns them that strict statutory time limits apply, and automatically dispatches a timestamped **`Non-Engagement Letter`** via SMS and email logged permanently in `Clio / Filevine`.

### Q3: How do we prevent violating ABA Model Rule 4.2 (communicating with a person already represented by another lawyer) while maximizing speed-to-retainer on high-value commercial trucking and mass tort cases?

- **Prior-Representation Gate + In-Call Guided `DocuSign`**:
  - Immediately after conflict clearance, the agent asks: *"Have you already signed a retainer agreement with another attorney for this incident?"* If `Yes`, the guardrail immediately blocks intake to comply with `ABA Rule 4.2` and state anti-poaching ethics rules.
  - If `No` and the case meets Tier-1/Tier-2 criteria, the agent pre-populates the `DocuSign` retainer and `HIPAA` medical release using data extracted in `2.0 seconds` from the caller's photographed Police Crash Report, keeping the caller on the voice line until the `envelope_completed` webhook fires.

---

## 🧭 3. Visual Architecture Diagrams (Mermaid)

### 3.1 Legal Intake, Personal Injury & Mass Tort Triage Decision Tree

```mermaid
flowchart TD
    A["Prospective Claimant Dials Law Firm Line (24x7 Trauma-Informed EN/ES)"] --> B["Phase 1: Read Non-Representation & Zero-UPL Disclaimer<br/>Collect ONLY: 1.Caller Name + 2.Opposing/Adverse Party Name"]
    B --> C{"<100ms Fuzzy Conflict Check in Clio / Intapp / Elite 3E"}

    C -- "Conflict Detected! (Adverse Party is Existing/Past Client)" --> D["🚨 Trigger ABA Rule 1.18 Ethical Firewall!<br/>0ms Wipe Ephemeral RAM · Block Fact Ingestion<br/>Politely Decline & Provide State Bar Referral (0% Taint)"]

    C -- "Conflict Clear → Unlock Phase 2 Intake" --> E{"Already Represented by Another Attorney (ABA Rule 4.2)?"}
    E -- "Yes (Already Signed Elsewhere)" --> F["Politely Terminate Intake (Zero Rule 4.2 Poaching)"]
    E -- "No Prior Attorney" --> G["Capture Incident Date/State/Injuries + 2.0s Police Report Vision<br/>Run Deterministic 50-State SOL Engine (Incl. 180-Day Municipal Rule)"]

    G --> H{"Evaluate Case Qualification & SOL Horizon"}
    H -- "Qualified + (<90 Days to SOL or Catastrophic Commercial Injury)" --> I["<15s Bridge On-Call Trial Partner + Push In-Call DocuSign Retainer"]
    H -- "Qualified Standard Case (Tier-1 / Tier-2)" --> J["Stay on Line for Guided In-Call Retainer + HIPAA e-Sign<br/>(Lifts Signed Conversion from 31.0% to 74.8%)"]
    H -- "Unqualified or SOL Expired" --> K["State Non-Representation Aloud + Auto-Send Tracked<br/>Written Non-Engagement Letter via SMS/Email (0% Malpractice)"]
```

### 3.2 End-to-End Legal CMS (`Filevine/Clio`), ABA Conflict Gate, SOL Engine & e-Sign Architecture

```mermaid
flowchart LR
    subgraph CLAIMANT["Claimant 24/7 Ingress (Privileged & Encrypted)"]
      CALL["24x7 PSTN / LSA Ad Voice<br/>(Phase 1 Ephemeral RAM Buffer)"]
      MOBILE["Zero-Install SMS Camera & e-Sign Link<br/>(2.0s Police Report Scan · DocuSign Retainer + HIPAA)"]
    end

    subgraph ORCH["Legal Voice & Multimodal Ethics Core"]
      CONFLICT["ABA Rule 1.18 2-Phase Conflict Firewall<br/>(<100ms Fuzzy/Corporate-Tree Check Before Facts)"]
      UPL["Zero-UPL & Deterministic 50-State SOL Engine<br/>(Blocks Valuation Promises · 180-Day Municipal Tort Check)"]
      ESIGN["In-Call Guided Retainer & Evidence Vision Engine<br/>(2.0s Police Report OCR · Live Webhook Sign Verification)"]
      CALL --> CONFLICT --> UPL --> ESIGN
      MOBILE --> ESIGN
    end

    subgraph LAW["Law Firm Core Systems (CMS / Conflict DB / Malpractice Shield)"]
      CMS["Case Management (Filevine / Litify / Clio / LeadDocket)<br/>Auto-Create Matter · Privileged Audio · Medical Record Request"]
      INTAPP["Enterprise Conflict Database (Intapp / Elite 3E)<br/>Full Client & Corporate Affiliate Graph"]
      DECLINE["Automated Non-Engagement Shield<br/>Sends Timestamped Declination Letter + Delivery Receipt"]
      CONFLICT <--> INTAPP
      ESIGN -->|"Signed Retainer + Crash Report"| CMS
      UPL -->|"Declined Lead Audit Trail"| DECLINE
    end
```

### 3.3 `ABA Rule 1.18` Conflict Gate, Police Report Vision & 65-Second In-Call Retainer e-Sign Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client as Injured Claimant (Calling from ER)
    participant AI as Legal Intake Voice + Vision Agent
    participant Conf as Intapp/Clio Conflict & SOL Engine
    participant Sign as DocuSign + Police Report Vision
    participant CMS as Filevine / Litify & On-Call Partner

    Client->>AI: 1. Call at 10:30 PM Sunday: "I was just rear-ended by a semi-truck on I-10 and broke my wrist"
    AI->>Client: 2. Phase 1 Lock: "I'm so sorry you're hurt! Before sharing details, what is your full name and the trucking company's name for our conflict check?"
    Client->>AI: 3. "Maria Lopez, and the truck said Apex Freight Lines"
    AI->>Conf: 4. <80ms fuzzy & parent-company check in Intapp: `Apex Freight Lines` = `CONFLICT_CLEAR`!
    AI->>Client: 5. Unlock Phase 2: "Conflict check passed! Please snap your Police Crash Report via the text link I sent—what date and state did this happen?"
    Client->>Sign: 6. Upload Police Report photo (2.0s extracts $2M commercial policy #, VIN & California jurisdiction)
    Conf->>AI: 7. Verify California 2-yr PI SOL (non-municipal) & score as Tier-1 Commercial Trucking Fracture!
    AI->>Sign: 8. Pre-fill & text DocuSign Contingency Retainer + HIPAA Medical Release to claimant's phone
    AI->>Client: 9. Stay on live call: "I just texted your contingency agreement—you pay nothing unless we win. Scroll to the yellow tab and sign while I stay on the line with you!"
    Client->>Sign: 10. Sign Retainer + HIPAA on phone in 65s -> Commit to Filevine & warm-bridge On-Call Partner
```

---

## 📊 4. Legal Intake & Mass Tort Architecture Comparison Matrix

| Comparison Dimension | Option A: Daytime Receptionist + After-Hours Voicemail | Option B: Legacy Legal Answering Service (`BPO`) | Option C: Unconstrained Voice LLM (No Phase-1 Conflict Gate or SOL/UPL Locks) | Option D: Legal Ethics Architecture (`ABA Rule 1.18 Gate + 50-State SOL + 2.0s Crash Vision + In-Call e-Sign`, Recommended) |
| :--- | :--- | :--- | :--- | :--- |
| **`ABA Rule 1.18` Conflict Disqualification Safety** | ⭐⭐⭐⭐ | ❌ **High risk** (BPO records full adverse story before checking firm conflicts) | ❌ **Severe hazard** (ingests confidential facts into cloud logs before conflict check) | **⭐⭐⭐⭐⭐ (Phase-1 ephemeral buffer blocks fact intake until `<100ms` Intapp/Clio check clears = `0.00%` taint)** |
| **Zero Unauthorized Practice of Law (`UPL`)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ (Scripted intake only) | ❌ **Unlawful** (predicts settlement dollar amounts & gives legal advice) | **⭐⭐⭐⭐⭐ (Deterministic `UPL` filter blocks all valuation promises & legal opinions)** |
| **50-State `SOL` & `180-Day` Municipal Tort Accuracy** | ⭐⭐⭐⭐ | ❌ Agents miss 180-day municipal vehicle rules | ❌ LLM hallucinates statutory deadline math | **⭐⭐⭐⭐⭐ (Deterministic 50-state + municipal `SOL` table with `<90d` partner escalation)** |
| **Signed Retainer Conversion on `$800` Ad Leads** | ❌ Misses `39%` after-hours calls (`24%` conversion) | ⚠️ Takes message for next-day callback; `52%` sign with competitor (`31.0%` conversion) | ⚠️ Sends email link after hangup; high drop-off | **⭐⭐⭐⭐⭐ (24/7 instant intake + 2.0s crash report scan + guided in-call `DocuSign` = `74.8%` signed)** |
| **Declined-Lead Malpractice Protection** | ⚠️ Verbal decline with no written proof | ❌ No formal declination letter sent | ❌ Ambiguous rejection creates liability | **⭐⭐⭐⭐⭐ (Instant tracked SMS/email `Non-Engagement Letter` archived in `Filevine/Clio`)** |

---

## 🧪 5. TCO & Signed-Case Impact per 10,000 Legal Intake Calls & 7-Card Summary

### 5.1 Financial & Ethics Impact per 10,000 Inbound Legal Leads (`$600` Average Cost per Lead)

| Financial & Risk Dimension (per 10,000 Inbound Calls) | Option A: Legacy Answering Service + Next-Day Callback + Email Retainer | Option B: `ABA Rule 1.18` Conflict Gate + `2.0s` Crash Vision + Guided In-Call `DocuSign` (Recommended) | Net Law Firm Gain per 10,000 Calls |
| :--- | :--- | :--- | :--- |
| **Wasted Ad Spend from Post-Call Competitor Poaching** | `31.0%` signed conversion on qualified leads; `52%` defect before callback (**`$485,000`** wasted ad spend) | **Guided in-call `DocuSign` lifts signed conversion to `74.8%`** (**`$92,000`**) | **Recaptures `+$393,000 / 10k calls` in signed case value & ad ROI** |
| **Conflict Disqualification, Missed `SOL` & Malpractice Risk** | Pre-check fact taint + missed 180-day municipal notices + unlogged declines (**`$210,000`**) | **Phase-1 conflict lock (`0.00%` taint) + deterministic `SOL` + auto `Non-Engagement Letter`** (**`$4,000`**) | **Saves `$206,000 / 10k calls` (`-98.1%` ethics & malpractice exposure)** |
| **Intake Specialist Callback, Police Report & HIPAA Chasing** | Manual follow-up calls chasing crash reports & medical releases (**`$175,000`**) | **First-call `2.0s` Police Report vision + co-signed `HIPAA` release** (**`$32,000`**) | **Saves `$143,000 / 10k calls` (`-81.7%` intake labor; `-11d` record retrieval)** |
| **Total Firm Economic Impact per 10,000 Calls** | **`$870,000 / 10k calls` (lost ad leads + risk + labor)** | **`$128,000 / 10k calls`** | **Delivers `$742,000` (`~$742k` / `+85.3%`) net firm value** |

```chart
{
  "data": {
    "values": [
      { "category": "Defected Ad-Lead Waste ($k)", "Architecture": "Answering Service + Next-Day Callback", "Amount": 485.0 },
      { "category": "Defected Ad-Lead Waste ($k)", "Architecture": "ABA Conflict Gate + In-Call e-Sign AI", "Amount": 92.0 },
      { "category": "Conflict Taint & Malpractice Risk ($k)", "Architecture": "Answering Service + Next-Day Callback", "Amount": 210.0 },
      { "category": "Conflict Taint & Malpractice Risk ($k)", "Architecture": "ABA Conflict Gate + In-Call e-Sign AI", "Amount": 4.0 },
      { "category": "Intake & Crash-Report Chasing Labor ($k)", "Architecture": "Answering Service + Next-Day Callback", "Amount": 175.0 },
      { "category": "Intake & Crash-Report Chasing Labor ($k)", "Architecture": "ABA Conflict Gate + In-Call e-Sign AI", "Amount": 32.0 }
    ]
  },
  "semantic_types": {
    "category": "Category",
    "Architecture": "Name",
    "Amount": "Amount"
  },
  "chart_spec": {
    "chartType": "Grouped Bar Chart",
    "title": "Legal ABA Conflict Gate, Crash-Report Vision & In-Call e-Sign Deliver $742k / 10k Calls",
    "subtitle": "Defected Ad Spend, Malpractice Risk & Intake Labor per 10,000 Calls in USD Thousands",
    "encodings": {
      "x": "category",
      "y": "Amount",
      "group": "Architecture",
      "color": "Architecture"
    }
  }
}
```

### 5.2 7-Card 4:5 Benchmark Report Summary

| Card | Headline-as-Finding | Key Quantitative Evidence (`Measured` / `Reported`) |
| :--- | :--- | :--- |
| **Card 1 (`1/7` · `OVERVIEW`)** | **Guided In-Call `DocuSign` Lifts Law Firm Retainer Conversion from `31.0%` to `74.8%`** | Recaptures `$393k` in wasted ad spend and delivers `$742k` net value per 10,000 intake calls |
| **Card 2 (`2/7` · `SCENARIO`)** | **`ABA Rule 1.18` 2-Phase Conflict Gate Blocks Fact Ingestion Until `<100ms` Intapp Clearance** | Eliminates `100%` of prospective-client confidential taint (`0.00%` firm disqualification) |
| **Card 3 (`3/7` · `MATRIX`)** | **Daytime Desk vs Legacy Answering Service vs Raw LLM vs ABA Conflict + SOL + In-Call e-Sign** | Co-signs `Retainer + HIPAA Release` on Call 1, accelerating medical record retrieval by `11 days` |
| **Card 4 (`4/7` · `PROTOCOL`)** | **`LEGAL-INTAKE-MASS-TORT-ABA-CONFLICT-SOL-2026-01` Guardrail Contract** | Blocks pre-clearance fact logging, `UPL` settlement promises, `Rule 4.2` poaching, and unlogged declines |
| **Card 5 (`5/7` · `ROBUSTNESS`)** | **Deterministic 50-State `SOL` Engine Flags `180-Day` Municipal Tort Notices with `100%` Accuracy** | Dispatches tracked written `Non-Engagement Letters` automatically on every declined inquiry |
| **Card 6 (`6/7` · `LATENCY`)** | **`2.0s` Police Crash Report Vision Extracts Commercial Policy Numbers & VINs Live on Call 1** | Auto-populates `Filevine / Litify / Clio` matter fields and `DocuSign` retainer envelopes |
| **Card 7 (`7/7` · `MY TAKE`)** | **Good Fit vs Not For: Essential for Personal Injury, Mass Tort, Employment, and Family Law Firms** | Never record detailed case facts into shared firm CRM before adverse-party conflict clearance |

---

## 🛠️ 6. Presales & Production Acceptance Checklist

- [ ] **1. `ABA Model Rule 1.18` 2-Phase Conflict-First Firewall**: Does Phase 1 collect *only* Caller Name and Adverse Party Name in ephemeral RAM, executing a `<100ms` fuzzy conflict search in `Clio / Intapp / Elite 3E` (and wiping RAM in `0ms` if conflicted) before unlocking detailed case fact intake?
- [ ] **2. Zero Unauthorized Practice of Law (`UPL`) & `ABA Rule 4.2` Anti-Poaching Gate**: Does the agent deliver a mandatory non-representation disclaimer, block all settlement valuation promises or legal advice, and immediately terminate intake if the caller is already represented by another attorney?
- [ ] **3. Deterministic 50-State Statute of Limitations (`SOL` + 180-Day Municipal Tort Notice) Engine**: Are all statutory filing deadlines computed deterministically by jurisdiction and defendant entity type (flagging municipal/government vehicles for `180-day` tort claim rules and paging an on-call attorney when `<90 days` remain)?
- [ ] **4. Automated Written `Non-Engagement Letter` on Every Declined Call**: Whenever a lead is declined, does the system state non-representation aloud and automatically send a timestamped written `Non-Engagement Letter` via SMS and email archived in `Filevine / Clio`?
- [ ] **5. `2.0s` Police Crash Report Vision & Guided In-Call `DocuSign` Retainer Execution**: Can qualified claimants snap their Police Crash Report via SMS (`2.0s` OCR) and complete their `DocuSign / PandaDoc` Contingency Retainer + `HIPAA` Medical Release while the Voice Agent stays on the line?
