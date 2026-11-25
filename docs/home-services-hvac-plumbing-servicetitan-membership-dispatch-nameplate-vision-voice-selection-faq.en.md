# Home Services, HVAC, Plumbing & Electrical (`ServiceTitan Capacity & Zone Dispatch / Equipment Nameplate & Error-Code Vision / Membership & Two-Decision-Maker Rule`) Voice & Multimodal AI Architecture Selection Guide

> **Document Scope**: Built for Residential Home Services Platform CTOs (HVAC, Plumbing, Electrical, Garage Door & Roofing Roll-Ups), Private-Equity-Backed Home Service Operators, and Field Service Management (`FSM`) Architects (`ServiceTitan / Housecall Pro / Jobber / Salesforce Field Service`), this guide explains how to route **`>=12-Year-Old` HVAC/Water-Heater Breakdowns (`$12,500+` replacement potential)** to top-performing **Turnover Technicians & Comfort Advisors** (`+$215` revenue per call), how **`1.8-Second` Smartphone Camera Equipment Nameplate Serial Decoding (`Carrier / Trane / Lennox` manufacture year, tonnage & refrigerant)** lifts First-Time Fix Rate (`FTFR`) from **`71.0%` to `92.6%`**, and how **County Assessor Homeowner Verification, the Two-Decision-Maker Rule, and Waived-Fee `$199/yr` Club Membership Upgrades (`38.4%` conversion)** maximize fleet profitability.

![Home Services & HVAC ServiceTitan Dispatch, Nameplate Vision & Replacement Routing Architecture](../assets/svg/home-services-hvac-plumbing-servicetitan-membership-dispatch-nameplate-vision-voice-selection-faq.svg)

---

## 📌 1. Executive Summary

1. **Right-Tech-to-Right-Job Dispatch (`+$215/Call` Lift): Identify "`>=12-Year-Old` Aging Equipment" in `<100ms` to Route High-Value Replacement Opportunities to Top Turnover Techs**:
   - **The FIFO Dispatch Mistake**: During a 100°F July heatwave, naive call centers and basic booking bots assign trucks First-In-First-Out (`FIFO`)—sending a senior diagnostic/sales tech to a 2-year-old warranty capacitor swap while sending a junior maintenance tech to a **15-year-old failed R-22/R-410A condenser (`$12,500+` full system replacement opportunity)**.
   - **Equipment-Age & Value-Tiered Dispatch (`ServiceTitan Adjustable Capacity Planning`)**:
     - Query `ServiceTitan` installed-equipment history, municipal building permits, and property age in `<100ms` at ringback;
     - Whenever an affected HVAC unit or water heater is **`>= 10–12 years old`**, tag the job as a `HIGH_VALUE_TURNOVER_OPPORTUNITY` and route it exclusively to a **Senior Turnover Technician or Comfort Advisor**, lifting average revenue per call by **`+$215`**.
2. **Eliminate `74%` of Second-Trip Parts Runs via "`1.8-Second` Outdoor Condenser Nameplate Serial Decoding & Thermostat Error-Code Vision"**:
   - `28%` of residential HVAC/appliance calls require a costly second truck roll (`$165` wasted fleet cost) because the technician arrives without the specific OEM control board, ECM blower motor, or igniter.
   - During the intake call, the Voice Agent texts a zero-install SMS camera link: **`Azure Document Intelligence + GPT-4o Vision` reads the weathered aluminum equipment data plate (`Model #` & `Serial #`) and thermostat error screen in `1.8 seconds`**—decoding the exact manufacture month/year, BTU tonnage, refrigerant type (`R-410A vs R-454B`), and OEM warranty status, so the warehouse pre-loads the exact part onto the truck and lifts First-Time Fix Rate (`FTFR`) from **`71.0%` to `92.6%`**.
3. **Three Margin & Cash-Flow Multipliers: "County Assessor Homeowner Gate" + "Two-Decision-Maker Replacement Rule" + "`$199/yr` Waived-Dispatch Membership Conversion (`38.4%`)"**:
   - **Zero Unpaid Tenant Invoices**: Cross-check the service address against **County Tax Assessor Deed Records** in `<80ms`. If the caller is a tenant, require **SMS Landlord Authorization + `$99` Dispatch-Fee Card Hold** before rolling a truck (`0.00%` unauthorized tenant write-offs);
   - **Defeating the "One-Legger" Sales Trap**: For `>=12-year` replacement estimates, gently align appointment times when **all property co-owners/decision-makers are home**, boosting replacement close rates from `14%` (one-legger) to **`62%`**;
   - **Instant `$199/yr` Club Membership Upgrade**: Offer to waive today's `$99` diagnostic dispatch fee when the homeowner enrolls in the `$199/yr` maintenance plan during the call (`38.4%` conversion).

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: During a 100°F heatwave or deep freeze, call volume spikes 8x and homeowners call the next contractor on Google if put on hold for 60 seconds. How do we capture 100% of leads while keeping trucks clustered by zip-code zone?

- **Zero-Hold Intake + `ServiceTitan` Zone Clustering & False-Emergency Filtering**:
  1. **`<1s` Answer + 3-Mile Geo-Zone Truck Slotting**:
     - Answers 100% of surge calls instantly, checks `ServiceTitan Adjustable Capacity Planning` by zip-code zone, and offers slots adjacent to a technician already working in the neighborhood (`-34%` windshield drive time).
  2. **Camera Pre-Check Filters `22%` of Tripped-Breaker / Thermostat-Mode False Calls**:
     - Before dispatching a scarce master tech during a heatwave, the SMS camera link checks two things in 30 seconds: **① Is the thermostat accidentally set to `Heat / Fan Only` or showing low battery? ② Is the 240V double-pole `AC Breaker` tripped in the electrical panel?** Guiding the homeowner to flip a tripped breaker resolves minor issues immediately while reserving trucks for high-revenue repairs and replacements.

### Q2: Why do HVAC Comfort Advisors waste half their week running "One-Legger" replacement appointments where only one spouse is home—or worse, showing up to a rental house where the tenant can't approve a $14,000 system?

- **Two Deterministic Qualification Gates Before Rolling a Replacement Truck**:
  1. **County Assessor Deed Lookup (`Homeowner vs Tenant Gate`)**:
     - Queries property tax deed records (`Attom / CoreLogic / County Assessor API`) by street address in `<80ms` to verify owner-occupancy and owner names (`e.g., Robert & Linda Chen`).
     - If the caller is a tenant, the agent never books a Comfort Advisor directly—it texts an instant **Landlord Authorization & Credit Card Hold link** to the property owner first.
  2. **The Two-Decision-Maker Scheduling Script**:
     - Because a `$12,000–$18,000` HVAC replacement involves ductwork design, utility rebates, and `GoodLeap / GreenSky` financing signatures, the agent naturally frames the appointment: *"Since our Senior Comfort Advisor will walk through system sizing, utility tax credits, and monthly financing options on the spot, we ask that all homeowners be present so you don't have to play middleman—would 5:30 PM after work or Saturday morning work best for both you and Robert?"*

### Q3: Outdoor AC condenser nameplates are often sun-faded or covered in dirt, and homeowners don't know how to read serial numbers. How does `1.8s` Vision turn a blurry photo into actionable technician prep?

- **OEM Serial-Number Nomenclature Decoder + Pre-Dispatch Parts Staging**:
  - Every major HVAC and water-heater OEM (`Carrier, Bryant, Trane, American Standard, Lennox, Rheem, Ruud, Goodman, Daikin, Bradford White`) encodes the **exact manufacture week/year and BTU tonnage** inside the `Model #` and `Serial #` (e.g., Carrier Serial `1812E...` = Week 18 of 2012; Tonnage `036` = 3.0 Tons).
  - The vision pipeline extracts the alphanumeric strings in `1.8 seconds`, runs them through a deterministic **OEM Serial Decoder**, checks whether the 10-year parts warranty is still active, and attaches the exact capacitor/igniter/blower SKU list to the `ServiceTitan` work order before the technician leaves the shop.

---

## 🧭 3. Visual Architecture Diagrams (Mermaid)

### 3.1 Home Services (HVAC / Plumbing / Electrical) Voice + Vision Decision Tree

```mermaid
flowchart TD
    A["Homeowner or Resident Dials Home Services Line (24x7)"] --> B{"<80ms Life-Safety Check & County Assessor Deed Lookup"}

    B -- "Gas Rotten-Egg Odor / CO Alarm / Sparking Panel" --> C["🚨 0ms Life-Safety Evacuation Instruction!<br/>Direct Caller Outdoors + Dial 911 / Gas Utility<br/>+ Flag Priority-1 Emergency Dispatch"]

    B -- "No Cooling / No Heat / Water Leak / Breaker Trip" --> D{"Is Caller the Deed-Verified Homeowner?"}
    D -- "No: Caller is a Tenant" --> E["Trigger Tenant Billing Gate: Text Landlord Link<br/>Require Landlord e-Sign + $99 Dispatch Card Hold"]
    D -- "Yes: Verified Homeowner" --> F["Send Zero-Install SMS Camera Link<br/>1.8s Scan Condenser Nameplate + Thermostat Error + Breaker Panel"]

    E --> F
    F --> G{"Decode Serial-Number Equipment Age & Job Scope"}
    G -- "Equipment Age >= 12 Years or Replacement Quote" --> H["Apply Two-Decision-Maker Scheduling Alignment<br/>Route Exclusively to Senior Turnover Tech / Comfort Advisor"]
    G -- "Equipment Age < 12 Years Standard Repair" --> I["Offer $199/yr Club Membership (Waives Today's $99 Dispatch Fee)<br/>+ Pre-Stage Truck Parts by Model # + Book Zip-Zone Slot"]
```

### 3.2 End-to-End `ServiceTitan` Dispatch, Nameplate Vision, Deed Check & Membership Architecture

```mermaid
flowchart LR
    subgraph HOMEOWNER["Homeowner Omnichannel Ingress"]
      VOICE["24x7 Service Line / 30m Pre-Arrival Call"]
      CAM["Zero-Install SMS Camera & Card-Hold Link<br/>(1.8s Nameplate OCR / Thermostat Code / Landlord Auth)"]
    end

    subgraph ORCH["Home Services Voice & Multimodal Core"]
      DEED["County Assessor Deed & Two-Decision-Maker Gate<br/>(Blocks Unapproved Tenant Calls · Aligns Co-Owners)"]
      PLATE["1.8s OEM Nameplate Serial & Error Decoder<br/>(Extracts Mfg Year, Tonnage, Refrigerant & Parts)"]
      DISP["ServiceTitan Zone × Skill × Equipment-Age Router<br/>(>=12-Yr Units -> Turnover Tech · $199 Membership Upsell)"]
      VOICE --> DEED --> DISP
      CAM --> PLATE --> DISP
      CAM --> DEED
    end

    subgraph FIELD["Field Service Management & Fleet Systems (FSM)"]
      ST["ServiceTitan / Housecall Pro / SFS<br/>Adjustable Capacity Planning · Membership Billing"]
      TRUCK["Technician Tablet & Truck Inventory<br/>Pre-Loads OEM Board/Capacitor · Sends Bio + GPS Link"]
      FIN["Point-of-Sale Financing (GoodLeap / GreenSky)<br/>Instant Soft-Pull Replacement Monthly Payment"]
      DISP <--> ST
      PLATE -->|"Attach Model/Age & Parts SKU"| TRUCK
      ST --> TRUCK
      DISP --> FIN
    end
```

### 3.3 Heatwave AC Breakdown `1.8s` Nameplate Decode, `$199` Membership Upgrade & Turnover Tech Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Home as Homeowner (100°F Heatwave Call + Photo)
    participant AI as HVAC Voice + Vision Agent
    participant Vision as 1.8s OEM Nameplate & Error Decoder
    participant ST as ServiceTitan Capacity & Deed Engine
    participant Tech as Senior Turnover Tech Tablet

    Home->>AI: 1. Inbound call: "Our downstairs AC is blowing warm air and the thermostat is flashing red!"
    AI->>ST: 2. <80ms County Deed check: Confirms caller is homeowner (`David & Sarah Miller`)
    AI->>Home: 3. "We'll get you cooled down today! Tap the text link I sent to snap a quick photo of the metal label on your outdoor AC unit and your thermostat screen."
    Home->>Vision: 4. Upload outdoor condenser data plate & thermostat photo
    Vision-->>AI: 5. 1.8s decode: `Carrier 4-Ton R-410A`, Serial `1811E...` = **2011 Mfg (15 Years Old!)**, high-pressure lockout code
    AI->>ST: 6. Equipment >=12 yrs -> Tag `HIGH_VALUE_TURNOVER` & reserve Senior Turnover Tech 3:00 PM zip-zone slot
    AI->>Home: 7. "Got your 2011 Carrier 4-ton unit! Our dispatch fee is $99, or if you join our $199/yr Club Membership today we waive the $99 fee and give you 15% off repairs. Also, since the unit is 15 years old, will both you and David be home at 3 PM to review repair-vs-replace options?"
    Home->>AI: 8. "Yes, we'll both be home—let's do the $199 membership to waive today's fee!"
    AI->>Tech: 9. Sync to ServiceTitan: 15-yr Carrier nameplate, pre-load 45/5 capacitor + fan motor, Two-Decision-Makers confirmed
```

---

## 📊 4. Home Services (HVAC / Plumbing) Architecture Comparison Matrix

| Comparison Dimension | Option A: In-House CSRs Daytime Only + Voicemail | Option B: Generic Answering Service (`BPO`) | Option C: Basic Calendar Voice Bot (FIFO Dispatch + No Nameplate Vision) | Option D: Home Services Architecture (`ServiceTitan Age Router + 1.8s Nameplate OCR + Deed/2-Party Gate + Membership`, Recommended) |
| :--- | :--- | :--- | :--- | :--- |
| **Heatwave / Freeze Surge Capture & Zone Clustering** | ❌ Misses `41%` of peak/after-hours calls | ⚠️ Takes messages only; homeowner calls competitor | ⭐⭐⭐⭐ (Books slots, but ignores zip-code drive zones) | **⭐⭐⭐⭐⭐ (`100%` instant answer + zip-zone clustering cuts drive time by `34%`)** |
| **`>=12-Year` Equipment Identification & Turnover Routing** | ⭐⭐⭐⭐ (Experienced CSRs ask age) | ❌ Sends junior maintenance tech to 15-year breakdown | ❌ FIFO dispatch wastes `$12,500` replacement leads | **⭐⭐⭐⭐⭐ (`<100ms` permit lookup + 1.8s serial decode routes `>=12-yr` units to Turnover Techs)** |
| **First-Time Fix Rate (`FTFR`) & Parts Pre-Staging** | `71.0%` (`28%` require 2nd trip for OEM parts) | `68.0%` | `71.0%` (voice-only cannot read weathered data plates) | **⭐⭐⭐⭐⭐ (`92.6%` FTFR via 1.8s nameplate & error-code vision; `-74%` 2nd trips)** |
| **Tenant Write-Off Prevention & Two-Decision-Maker Rule** | ⚠️ Skipped during rush -> unpaid tenant bills | ❌ Dispatches Comfort Advisor to unapproved tenants | ❌ `14%` close rate on "One-Legger" single-party calls | **⭐⭐⭐⭐⭐ (Assessor Deed check + landlord card hold + 2-party alignment = `2.8x` close rate)** |
| **`$199/yr` Club Membership Conversion on Service Calls** | ⚠️pitched on `<9%` of peak calls | ❌ Never pitches memberships | ❌ Robotic script | **⭐⭐⭐⭐⭐ ("Waive today's `$99` fee with `$199/yr` membership" converts `38.4%` of callers)** |

---

## 🧪 5. TCO & Fleet Revenue Impact per 10,000 Service Calls & 7-Card Summary

### 5.1 Financial & Fleet Impact per 10,000 Home Service Calls (`100-Truck Residential HVAC/Plumbing Fleet`)

| Financial & Fleet Dimension (per 10,000 Calls) | Option A: In-House CSRs + Legacy Answering Service + Blind FIFO Dispatch | Option B: `ServiceTitan` Age Router + `1.8s` Nameplate Vision + Deed Gate + Membership AI (Recommended) | Net Fleet Gain per 10,000 Calls |
| :--- | :--- | :--- | :--- |
| **Missed `>=12-Yr` Replacement Leads & "One-Legger" Fallout** | Aging units sent to junior techs + single-spouse quotes (**`$295,000`** foregone replacement margin) | **1.8s serial age decode -> Turnover Tech + Two-Decision-Maker alignment (`+$215/call`)** (**`$45,000`**) | **Captures `+$250,000 / 10k calls` in system replacement margin** |
| **2nd-Trip Parts Runs (`$165/trip`), Tripped-Breaker Rolls & Tenant Bad Debt** | `28%` 2nd trips for parts + false breaker calls + unpaid tenant invoices (**`$218,000`**) | **`92.6%` FTFR via nameplate pre-staging + landlord card hold** (**`$32,000`**) | **Saves `$186,000 / 10k calls` (`-85.3%` wasted truck rolls & bad debt)** |
| **Foregone `$199/yr` Club Memberships & CSR Overtime** | Missed membership upgrades + seasonal CSR/BPO fees (**`$168,000`**) | **`38.4%` waived-dispatch membership conversion + automated booking** (**`$22,000`**) | **Generates `+$146,000 / 10k calls` in recurring membership & labor savings** |
| **Total Fleet Economic Impact per 10,000 Calls** | **`$681,000 / 10k calls` (foregone margin + wasted rolls + CSR)** | **`$99,000 / 10k calls`** | **Delivers `$582,000` (`~$582k` / `+85.5%`) net fleet value** |

```chart
{
  "data": {
    "values": [
      { "category": "Missed Replacement & 1-Legger Loss ($k)", "Architecture": "CSR + Blind FIFO Dispatch", "Amount": 295.0 },
      { "category": "Missed Replacement & 1-Legger Loss ($k)", "Architecture": "Nameplate Age Router + 2-Party + Club AI", "Amount": 45.0 },
      { "category": "2nd-Trip Parts Runs & Tenant Debt ($k)", "Architecture": "CSR + Blind FIFO Dispatch", "Amount": 218.0 },
      { "category": "2nd-Trip Parts Runs & Tenant Debt ($k)", "Architecture": "Nameplate Age Router + 2-Party + Club AI", "Amount": 32.0 },
      { "category": "Foregone Memberships & CSR Cost ($k)", "Architecture": "CSR + Blind FIFO Dispatch", "Amount": 168.0 },
      { "category": "Foregone Memberships & CSR Cost ($k)", "Architecture": "Nameplate Age Router + 2-Party + Club AI", "Amount": 22.0 }
    ]
  },
  "semantic_types": {
    "category": "Category",
    "Architecture": "Name",
    "Amount": "Amount"
  },
  "chart_spec": {
    "chartType": "Grouped Bar Chart",
    "title": "Home Services Nameplate Vision, Age Routing & Membership AI Deliver $582k / 10k Calls",
    "subtitle": "Foregone Replacements, Wasted Truck Rolls & Membership Value per 10,000 Calls in USD Thousands",
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
| **Card 1 (`1/7` · `OVERVIEW`)** | **`1.8s` Condenser Nameplate Vision Lifts First-Time Fix Rate (`FTFR`) from `71.0%` to `92.6%`** | Eliminates `74%` of `$165` second-trip parts runs and delivers `$582k` net value per 10,000 calls |
| **Card 2 (`2/7` · `SCENARIO`)** | **OEM Serial Decoder Flags `>=12-Year` Units to Route Turnover Techs (`+$215/Call` Revenue Lift)** | Pairing with Two-Decision-Maker scheduling lifts `$12,500` system replacement close rates by `2.8x` |
| **Card 3 (`3/7` · `MATRIX`)** | **Daytime CSR vs Answering Service vs FIFO Bot vs `ServiceTitan` Age + Nameplate Vision** | "Waive today's `$99` fee with `$199/yr` Club Membership" converts `38.4%` of service callers |
| **Card 4 (`4/7` · `PROTOCOL`)** | **`HOME-SERVICES-HVAC-PLUMBING-SERVICETITAN-VISION-2026-01` Guardrail Contract** | Blocks unapproved tenant dispatches, junior-tech assignment on `>=12-yr` units, and gas-leak delays |
| **Card 5 (`5/7` · `ROBUSTNESS`)** | **`<80ms` County Assessor Deed Check + Landlord Card Hold Achieves `0.00%` Tenant Bad Debt** | Camera breaker-panel check filters `22%` of false heatwave dispatches before rolling a truck |
| **Card 6 (`6/7` · `LATENCY`)** | **Automated 30-Minute Pre-Arrival Call + Tech Bio/GPS Link Cuts Not-Home Rate to `0.8%`** | Syncs decoded model/serial, refrigerant type, and warranty status directly into `ServiceTitan` |
| **Card 7 (`7/7` · `MY TAKE`)** | **Good Fit vs Not For: Essential for Every HVAC, Plumbing, Electrical & Garage Door Fleet on ServiceTitan** | Never use blind FIFO scheduling during peak weather surges—equipment age and homeowner verification drive margin |

---

## 🛠️ 6. Presales & Production Acceptance Checklist

- [ ] **1. `<80ms` County Assessor Deed Verification & Tenant Landlord-Authorization Gate**: Does the orchestrator verify property ownership by address—and if the caller is a tenant, require an SMS Landlord e-Signature + `$99` Dispatch-Fee Credit Card Hold before rolling a truck?
- [ ] **2. `1.8s` Equipment Nameplate Serial Decoder & Truck Parts Pre-Staging**: Can homeowners snap a photo of their outdoor AC condenser / water-heater data plate and thermostat via SMS so the system decodes manufacture year, tonnage, refrigerant type, and OEM warranty status?
- [ ] **3. `ServiceTitan` `>=12-Year` Turnover Routing & Two-Decision-Maker Alignment**: Are breakdowns on equipment `>=10–12 years old` automatically routed to Senior Turnover Technicians / Comfort Advisors with scheduling aligned when all property decision-makers are home?
- [ ] **4. Waived-Dispatch-Fee `$199/yr` Club Membership Conversion State Machine**: When quoting the `$99` diagnostic fee to non-members, does the agent offer instant enrollment in the `$199/yr` maintenance membership to waive today's dispatch fee?
- [ ] **5. `0ms` Gas/CO Evacuation Gate & Breaker-Panel Visual Pre-Check**: Do gas-odor or CO-alarm keywords trigger an immediate `0ms` outdoor evacuation + `911` instruction, and does camera triage check for tripped 240V breakers before dispatching peak-surge trucks?
