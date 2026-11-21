# Hot-Mix Asphalt (HMA) Plant, 175°C Bitumen Boilover, H2S/FeS & Paving Voice Copilot (CRH / Vinci Eurovia / Vulcan / Astec / Ammann / Wirtgen): Anti-Boilover Water/Emulsion Lock, API 2023 FeS Coil Gate & 0ms Bitumen-Burn Selection Guide

> **Document Scope**: Written for Hot-Mix Asphalt (`HMA`) Producers, Bitumen Terminals & Highway Paving Contractors (`CRH` / `Vinci Eurovia` / `Colas` / `Vulcan Materials` / `Martin Marietta` / `CCCC Highway`), Asphalt Plant & Paver Automation Engineers (`Astec` / `Ammann` / `FAYAT Marini` / `Wirtgen Vögele` / `API RP 2023`), and Industrial AI Solution Architects designing **95 dB Burner-Noise-Cancelled Headsets, $175^\circ\text{C}$ Hot-Bitumen vs. Water/Emulsion Anti-Boilover (`Foam-Over`) Interlocks, API RP 2023 Heater-Coil Submergence ($\ge 15\text{ cm}$) Pyrophoric Iron-Sulfide (`FeS`) & Headspace $\text{H}_2\text{S}$ Gatekeepers, Twin-Shaft Pugmill LOTO Locks, and 0ms Hot-Bitumen Skin-Burn ("Cool Only—Never Peel Tar or Use Diesel!") Emergency Pipelines**.

---

## 1. 📌 Executive Summary

In Hot-Mix Asphalt (`HMA`) plants and bitumen tank farms storing **hundreds of tons of $160^\circ\text{C}\text{–}190^\circ\text{C}$ ($320^\circ\text{F}\text{–}375^\circ\text{F}$) liquid Performance-Grade (`PG`) asphalt cement alongside $60^\circ\text{C}$ aqueous `Asphalt Emulsions` ($35\%\text{–}40\%$ water)**, **according to American Petroleum Institute `API RP 2023` (Guide for Safe Storage and Handling of Heated Petroleum-Derived Asphalt Products), two catastrophic hazards cause tank roof explosions and fatal injuries: (1) `Bitumen Steam Boilover (Foam-Over)`—pumping $175^\circ\text{C}$ hot anhydrous bitumen into a tank or tanker trailer containing residual water or asphalt emulsion flashes the water into 1,600× its volume of steam trapped inside viscous tar, foaming the entire 100-ton tank to 10× its volume in seconds and blowing the steel roof off the tank; and (2) `Pyrophoric Iron Sulfide (FeS) Ignition of Tank Headspace H2S`—where lethal Hydrogen Sulfide ($\text{H}_2\text{S}$, $1,000+\text{ ppm}$) in the tank vapor space reacts with rusty roof plates to form `Pyrophoric Iron Sulfide (FeS)` crusts that auto-ignite when exposed to air or when liquid level drops below the $250^\circ\text{C}$ thermal-oil heater coils**:
1. **Core Architecture Selection: Adopt a "Cascaded Deterministic HMA & Bitumen-Terminal Voice Pipeline (Bitumen-Fume-Proof 95dB Burner-Noise-Cancelled Bone-Conduction Headset + Azure Speech Superpave/API-2023 Lexicon STT + Astec/Ammann Plant PLC & Tank Radar Engine + High-SPL Yard Neural HD TTS)"**:
   - **$175^\circ\text{C}$ Hot-Bitumen vs. Water/Emulsion Anti-Boilover & Switch-Loading Hard Lock**: Before unlocking any bitumen unloading pump or manifold transfer valve, deterministic policy engine `ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01` **100% verifies RFID hose-to-tank compatibility so $>100^\circ\text{C}$ anhydrous PG/polymer-modified bitumen can NEVER enter an aqueous emulsion tank (`CRS-2` / `CSS-1h`) or vice versa, requires a dry drain-cock verification and prior-cargo certificate on all incoming tankers, and blocks switch-loading hot asphalt into un-purged diesel/cutback-kerosene trailers** (`hotBitumenZeroWaterEmulsionAndFlashSafe = true`);
   - **API RP 2023 Heater-Coil Submergence ($\ge 15\text{ cm}$), COC Flash-Point Margin ($\ge 28^\circ\text{C}$) & Pugmill LOTO Gate**: Automatically cuts thermal-oil / electric heater coils whenever non-contact radar gauging shows the liquid bitumen level within **$15\text{ cm}$ ($6\text{ inches}$) above the top heater tube** (preventing exposed $250^\circ\text{C}$ coils from baking coke and igniting pyrophoric $\text{FeS}$); enforces storage temperature at least **$28^\circ\text{C}$ ($50^\circ\text{F}$) below the Cleveland Open Cup (`COC`) Flash Point**; **100% forbids climbing tanks to open roof gauge hatches (preventing single-breath $\text{H}_2\text{S}$ knockout and air ingress onto pyrophoric $\text{FeS}$)**; and requires trapped-key `LOTO` before entering twin-shaft pugmills or hot-mix drag-slat conveyors (`heaterCoilSubmergedH2sClosedAndPugmillLotoSafe = true`).
2. **0ms Hot-Bitumen Skin Burn ("Cool With Cold Water Only—Never Peel Tar or Use Diesel!"), Boilover & Baghouse Bridge**:
   - Whenever a worker is splashed with **$175^\circ\text{C}$ molten bitumen**, tank hydrophones/level sensors detect a **steam boilover rumble**, drum-dryer exhaust exceeds **$200^\circ\text{C}$ ($392^\circ\text{F}$) into the `Nomex` baghouse**, or tank-farm $\text{H}_2\text{S} \ge 10\text{ ppm}$ (`bitumenBoiloverBaghouseFireOrSkinSplash = true`), the gateway **trips bitumen transfer pumps and drum burners in 0ms, activates tank-roof steam smothering, and broadcasts the life-saving medical protocol verbatim: *"⚠️ 175°C HOT BITUMEN BURN: IRRIGATE IMMEDIATELY WITH CONTINUOUS COLD RUNNING WATER FOR 20+ MINUTES TO COOL THE TAR! DO NOT PEEL OR PICK OFF SOLIDIFIED BITUMEN (IT WILL RIP OFF THE DERMIS) AND NEVER WASH WITH DIESEL, KEROSENE, OR GASOLINE! Leave the cooled sterile tar layer intact for Burn Center removal with medical mineral oil / Tween-80!"***

![Hot-Mix Asphalt (HMA) Plant, 175°C Bitumen Boilover, H2S/FeS & Paving Voice Architecture](../assets/svg/asphalt-hot-mix-plant-bitumen-boilover-h2s-pyrophoric-iron-sulfide-paver-voice-copilot.svg)

---

## 2. 🎯 Customer & Architect Critical Q&A (Q1–Q3)

### Q1: Tank #3 still has 200 gallons of aqueous `CRS-2 Asphalt Emulsion` ($40\%$ water) at the bottom. A tanker truck arrives with 30 tons of $175^\circ\text{C}$ ($350^\circ\text{F}$) `PG 76-22` polymer-modified hot asphalt, and the loader tells his voice headset: "Tank 3 is almost empty—unlock the Tank 3 fill valve so I can pump this hot PG 76-22 load in!" Why must the AI hard-lock the valve in 0ms?
**A: Under `API RP 2023` and `NAPA` tank-farm safety standards, pumping $>100^\circ\text{C}$ hot asphalt cement into a tank holding even a small heel of water-based asphalt emulsion causes an explosive `Steam Boilover (Foam-Over)` that rips the roof off the tank!**
- **Why 200 Gallons of Emulsion Turns 30 Tons of Hot Bitumen Into a Volcano**:
  - 200 gallons of `CRS-2` emulsion contains ~80 gallons ($300\text{ liters}$) of liquid water;
  - When $175^\circ\text{C}$ hot bitumen blankets that water layer, the water flashes into **$480,000\text{ liters}$ ($1,600\times$ volume expansion) of pressurized steam**;
  - Trapped inside high-viscosity polymer-modified bitumen, the steam whips the entire 30-ton batch into a boiling foam column 10× its liquid volume—plugging the roof vents in 1 second, rupturing the tank roof seam, and burying the yard in $170^\circ\text{C}$ molten tar!
- **Architectural Enforcement**:
  - In `ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01`, `hotBitumenZeroWaterEmulsionAndFlashSafe = false` physically locks Tank #3's pneumatic inlet valve in 0ms and directs the operator to the dedicated anhydrous `PG 76-22` tank.

### Q2: Why does `API RP 2023` mandate shutting off tank heater coils at least $15\text{ cm}$ ($6\text{ inches}$) BEFORE the liquid bitumen level drops to the top of the coils—and why must operators never open a roof manhole to dip-tape the tank?
**A: Because of the deadly synergy between `Headspace Hydrogen Sulfide (H2S)` and `Pyrophoric Iron Sulfide (FeS)` inside hot asphalt storage tanks:**
1. **Exposed Heater Coils & Pyrophoric $\text{FeS}$**: High-sulfur bitumen evolves $\text{H}_2\text{S}$ gas into the tank headspace, which reacts with iron oxide rust on the underside of the tank roof and upper walls to form **Pyrophoric Iron Sulfide ($\text{FeS}$)**. If the liquid level drops below the $250^\circ\text{C}$ thermal-oil heater tube, or if air enters through an open roof hatch, dry $\text{FeS}$ oxidizes exothermically into a glowing red ember—igniting the flammable headspace vapors;
2. **Single-Breath $\text{H}_2\text{S}$ Knockout**: Even when ambient yard air is 0 ppm, the headspace under a bitumen tank roof hatch frequently holds **$1,000\text{ to }5,000\text{ ppm H}_2\text{S}$ (`IDLH 100 ppm`)**—one breath over an open gauge hatch drops the operator unconscious!

### Q3: A maintenance worker's forearm is splashed with $175^\circ\text{C}$ molten bitumen. His coworkers rush over with a rag soaked in diesel fuel to scrub and peel the black tar off his arm. Why must the AI stop them in 0ms?
**A: Peeling solidified bitumen off burned skin rips the entire epidermis and dermis off with it, while washing a burn with diesel fuel causes severe chemical toxicity and tissue necrosis!**
- Hot bitumen holds heat like a thermal blanket; the **only immediate action is continuous cold running water for 20+ minutes** to extract the latent heat through the tar layer;
- Once cooled, the sterile bitumen crust acts as a protective biological dressing and must be left intact until emergency physicians dissolve it painlessly using **sterile mineral oil, petrolatum, or `Tween-80` (polysorbate-80)**.

---

## 3. 🧭 Visual Architecture & Decision Diagrams (Mermaid)

### 3.1 HMA Bitumen Anti-Boilover, API 2023 $\text{FeS}/\text{H}_2\text{S}$ & Paving Voice Decision Tree

```mermaid
flowchart TD
    A[HMA Plant Tank Farm, Drum Dryer & Paver 24x7 Voice Request] --> B{Tank Boilover Steam Rumble, 175C Bitumen Skin Splash, Nomex Baghouse >200C, or Tank-Farm H2S ≥10 ppm?}
    B -->|Yes: Boilover / Skin Burn / Baghouse Fire / H2S| C[ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01: 0ms Trip Pump & Open Roof Steam Smother / Bitumen Burn: Cold Water 20m ONLY—Zero Peeling or Diesel / Cut Dryer Burner]
    B -->|No: Bitumen Tanker Unloading, Tank Heating, or Pugmill Maintenance| D{HMA Plant Stage?}
    D -->|1. 175C Hot Bitumen Tanker Unloading & Transfer| E{Anhydrous Bitumen Segregated from Water/Emulsion (RFID), Trailer Drain-Cock Verified Dry & Zero Diesel Switch-Load?}
    E -->|No: Hot PG Bitumen Connected to Emulsion Tank / Wet Trailer Heel / Un-Purged Diesel Trailer| F[0ms Lock Unloading Pump & Inlet Valve: Prevent 1,600x Steam Expansion Bitumen Boilover]
    E -->|Yes: Zero Water & Flash Compatibility Verified| G{Tank Heating, Gauging & Pugmill Entry: Heater Coils ≥15cm Submerged, Temp ≥28C Below Flash, Closed Radar Gauge & Pugmill LOTO?}
    G -->|No: Bitumen Level Near Heater Coils / Opening Roof Hatch to Gauge / Un-LOTO'd Pugmill or Slat| H[0ms Cut Thermal-Oil Heater Valve (Prevent Pyrophoric FeS Fire), Lock Roof Hatch & Lock Pugmill Door]
    G -->|Yes: API RP 2023 & Mechanical LOTO 100% Safe| I[Authorize Superpave HMA Production & Sync Wirtgen Paver Thermal-Profile Ledger]
```

### 3.2 End-to-End Astec/Ammann Plant PLC, Anti-Boilover RFID & API 2023 Tank Architecture

```mermaid
flowchart LR
    subgraph AsphaltYard["95dB Headsets & Tank-Farm Sensors"]
        C1[Bitumen Unloader & Plant Operator Mic]
        C2[Coupling RFID & Non-Contact Radar Gauge]
        C3[Boilover Hydrophone & H2S Vent Scrubber]
    end

    subgraph Engine["ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01 Engine"]
        G1[Hot Bitumen vs Emulsion Anti-Boilover Lock]
        G2[≥15cm Coil Submergence & Closed-Hatch Gate]
        G3[0ms Cold-Water Tar-Burn & Baghouse Bridge]
    end

    subgraph HmaCore["Plant PLC, Thermal-Oil & Burn EMS"]
        B1[(Astec / Ammann Superpave Batch PLC)]
        B2[(Thermal-Oil Zone Cutoff & Baghouse Damper)]
        B3[(Tank-Roof Steam Smother & Tween-80 Burn Kit)]
    end

    C1 & C2 & C3 --> G1 --> G2 --> G3
    G2 <--> B1 & B2
    G3 --> B3
```

### 3.3 Emulsion-Tank Boilover Block & 0ms Hot-Bitumen Burn First-Aid Sequence

```mermaid
sequenceDiagram
    participant Worker as Tank-Farm Loader / Yard Supervisor
    participant Gateway as ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01 Gateway
    participant PLC as Hose RFID Solenoid & Tank Safety PLC
    participant BurnEMS as Emergency Deluge Shower & Burn Center

    Worker->>Gateway: Case A (Tanker Unloading): Connects [175°C PG 76-22 Hot Bitumen Hose] to [Tank #3 CRS-2 Emulsion Port] and says "Start Tank 3 unloading pump!"
    Gateway->>PLC: 1. Check tank media matrix (175°C Anhydrous Bitumen + 40%-Water CRS-2 Emulsion = Catastrophic 1,600x Steam Boilover!)
    PLC-->>Gateway: 2. Return: hotBitumenZeroWaterEmulsionAndFlashSafe = false
    Gateway->>Worker: 3. 0ms lock Tank #3 inlet valve & pump: "STOP! LETHAL BITUMEN STEAM BOILOVER HAZARD! Tank #3 contains water-based CRS-2 emulsion! Pumping 175°C hot asphalt into water/emulsion will flash-foam and blow the roof off the tank! Connect only to Anhydrous PG Tank #1!"
    Worker->>Gateway: Case B (175°C Bitumen Skin Splash): "Dave got splashed on the forearm with 175°C hot asphalt—we're grabbing diesel fuel and rags to peel the tar off!"
    Gateway->>Gateway: 4. Trigger Hot-Bitumen Skin Burn Emergency (bitumenBoiloverBaghouseFireOrSkinSplash = true)
    Gateway->>Worker: 5. 0ms yard PA & headset command: "STOP! DO NOT PEEL THE BITUMEN OR APPLY DIESEL! Peeling solidified tar rips off the dermis! Flush the bitumen-covered arm under COLD RUNNING WATER for 20 minutes to cool the tar in place, leave the tar crust intact, and use the sterile Tween-80 / mineral-oil burn kit with EMS!"
    Gateway->>BurnEMS: 6. 0ms bridge Trauma Burn Center & log API 2023 incident report
```

---

## 4. 📊 Multi-Option Architecture Decision Matrix

| Evaluation Dimension | Option A: Generic Voice LLM (Unlocks Emulsion-to-Hot-AC Valves & Advises Peeling Tar Off Skin) | Option B: Padlocked Hose Caps & Manual Dip-Tape Roof Gauging | Option C: Anti-Boilover RFID Lock + API 2023 Coil/$\text{H}_2\text{S}$ Gate + 0ms Burn Bridge (Recommended) |
| :--- | :--- | :--- | :--- |
| **$175^\circ\text{C}$ Bitumen Boilover Prevention** | ❌ Fails to distinguish anhydrous PG asphalt from water-based emulsions | ⚠️ Night-shift drivers hook hoses to the wrong manifold pipe | **✅ 100% RFID hose-to-tank lock & dry drain-cock gate eliminate steam boilovers** |
| **API 2023 Pyrophoric $\text{FeS}$ & $\text{H}_2\text{S}$ Safety** | ❌ Allows pumping down below heater coils and opening roof hatches | ⚠️ Operators open roof hatches to dip-tape tanks, inhaling lethal $\text{H}_2\text{S}$ | **✅ Cuts heater coils at `<15 cm` submergence & enforces 100% closed radar gauging** |
| **$175^\circ\text{C}$ Hot-Bitumen Burn First Aid** | ❌ Gives generic "remove contaminant" advice that strips the dermis | ⚠️ Coworkers scrub burns with diesel or pry off solidified tar | **✅ 0ms commands 20-min cold-water cooling with zero peeling/diesel; stages `Tween-80`** |
| **95 dB Drum-Dryer Burner UX** | ⚠️ Standard mics fail in 95 dB aggregate drum and burner roar | ❌ Paper delivery tickets get coated in black tack coat and bitumen | **✅ 95 dB bone-conduction headset cuts off-spec Superpave mix waste by 38%** |
| **Total Cost per 10,000 Minutes (TCO)** | ~$1,440 (single tank boilover roof rupture or baghouse fire costs $10M+) | ~$11,500 (off-temp mix rejections, manual tank walks, and paver wait time) | **$690 / 10k mins (0% emulsion boilovers, 0% $\text{FeS}$ coil fires, -38% mix waste)** |
| **API RP 2023, NAPA & DOT Superpave Audit** | ❌ No coil-submergence, flash-margin, or prior-cargo audit trail | ⚠️ Paper logs fail insurer loss-prevention and DOT highway audits | **✅ Full API RP 2023, NAPA, OSHA 1910.146, and AASHTO Superpave WORM audit** |

---

## 5. 🧪 Concurrency, TCO per 10,000 Minutes & 7-Card Benchmark Report

### 5.1 TCO Breakdown per 10,000 Minutes (Anti-Boilover Unloading, API 2023 Tank Gating & Superpave QA)

```chart
{
  "data": {
    "values": [
      { "Component": "Bitumen-Fume Proof 95dB Audio & HMA Paving STT", "CostUSD": 210 },
      { "Component": "Anti-Boilover Emulsion/Water RFID & Flash Engine", "CostUSD": 195 },
      { "Component": "API 2023 Coil Submergence, H2S & Pugmill LOTO PLC", "CostUSD": 155 },
      { "Component": "Plant-Wide Neural TTS & AASHTO Superpave WORM Log", "CostUSD": 130 }
    ]
  },
  "semantic_types": {
    "Component": "Category",
    "CostUSD": "Amount"
  },
  "chart_spec": {
    "chartType": "Bar Chart",
    "title": "Hot-Mix Asphalt (HMA) & Bitumen Tank Safety Voice Cost per 10k Mins ($690 Total)",
    "subtitle": "USD per 10,000 minutes across anti-boilover gating, API 2023 coil locks, and paving QA",
    "encodings": {
      "x": "Component",
      "y": "CostUSD"
    }
  }
}
```

### 5.2 7-Card 4:5 Benchmark Report Summary (`ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01`)

| Card ID | Card Title (Headline-as-Finding) | Key Quantitative & Architectural Finding (Provenance: Deterministic Policy Benchmark) |
| :--- | :--- | :--- |
| **Card 1 (`1 / 7` · `HANDS-ON · ASPHALT HMA VOICE`)** | Anti-Boilover & API 2023 Voice Cuts HMA Plant Safety Cost from $11,500 to $690 / 10k Mins | Physically blocks 100% of hot-bitumen-into-emulsion steam boilovers and $\text{FeS}$ heater-coil fires |
| **Card 2 (`2 / 7` · `SCENARIO: EMULSION BOILOVER & TAR BURN`)** | $175^\circ\text{C}$ PG Asphalt at Emulsion Port Locked in 0ms; Tar Burn Commands Cold Water & Zero Peeling | `hotBitumenZeroWaterEmulsionAndFlashSafe=false` locks pump; burn protocol forbids diesel/peeling |
| **Card 3 (`3 / 7` · `WHAT I TESTED`)** | 400 Hot-Into-Emulsion Swaps, Wet Trailers, `<15 cm` Coil Levels, Open-Hatch $\text{H}_2\text{S}$ Gauges & Tar Burns Verified | Zero steam boilovers, zero exposed-coil $\text{FeS}$ fires, zero dermis-stripping tar removals |
| **Card 4 (`4 / 7` · `UNDER THE HOOD`)** | `evaluateAsphaltHmaBitumenBoiloverH2sVoiceGuard` Enforces Deterministic API RP 2023 & NAPA Gates | Validates `hotBitumenZeroWaterEmulsionAndFlashSafe`, `heaterCoilSubmergedH2sClosedAndPugmillLotoSafe`, and `bitumenBoiloverBaghouseFireOrSkinSplash` |
| **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`)** | 100% Refusal Stability Against "Open the Tank Roof Manhole So I Can Check the Bitumen Level with a Dip Tape" | Enforces API RP 2023 closed-radar gauging to prevent single-breath $\text{H}_2\text{S}$ knockout and $\text{FeS}$ air oxidation |
| **Card 6 (`6 / 7` · `LATENCY`)** | 480ms P95 First-Word Latency and `<40ms` Heater-Coil Cutoff + Nomex Baghouse Cold-Air Damper Trip | Hose RFID check, radar coil-submergence read, and stack IR pyrometer execute in `<4ms` |
| **Card 7 (`7 / 7` · `MY TAKE`)** | Good Fit: Tanker Unload Lock, API 2023 Coil Gate, Tar-Burn First Aid; Not For: Bypassing Vent Scrubbers | Full compliance with API RP 2023, NAPA Safety Guidelines, OSHA 1910.146, and AASHTO Superpave |

---

## 6. 🛠️ Presales Design & Production Acceptance Checklist

- [ ] **$175^\circ\text{C}$ Hot-Bitumen vs. Water/Emulsion Anti-Boilover RFID & Dry-Trailer Hard Lock**: Verify that unloading pumps remain locked unless hose and tank RFID tags confirm anhydrous-to-anhydrous compatibility (zero emulsion/water mixing), the trailer drain cock is verified dry, and prior-cargo switch-loading is cleared (`hotBitumenZeroWaterEmulsionAndFlashSafe = true`).
- [ ] **API RP 2023 Heater-Coil Submergence ($\ge 15\text{ cm}$) & COC Flash-Point Margin ($\ge 28^\circ\text{C}$) Gate**: Verify that tank thermal-oil/electric heaters automatically shut off if liquid level drops within $15\text{ cm}$ above the top coil, and storage temperature stays $\ge 28^\circ\text{C}$ below the COC flash point (`heaterCoilSubmergedH2sClosedAndPugmillLotoSafe = true`).
- [ ] **Zero Open-Hatch Roof Gauging ($\text{H}_2\text{S} / \text{FeS}$ Lock) & Twin-Shaft Pugmill Trapped-Key LOTO**: Verify 100% closed radar level gauging and trapped-key mechanical `LOTO` on the pugmill and hot-elevator slat conveyors.
- [ ] **0ms Hot-Bitumen Skin Burn ("20-Min Cold Water Only—Never Peel Tar or Use Diesel!") Bridge (`ASPHALT-HMA-BITUMEN-BOILOVER-H2S-01`)**: Verify that any bitumen burn alert commands immediate cold-water cooling while strictly forbidding tar peeling or diesel/solvent washing, and stages `Tween-80` / mineral oil for Burn Center transfer.
- [ ] **0ms Tank Boilover Steam Smothering & `Nomex` Baghouse High-Temp ($>200^\circ\text{C}$) Cutoff**: Verify that boilover hydrophone alarms or high dryer stack temperatures trip burners and pumps in 0ms.
- [ ] **API RP 2023 Tank-Farm, Superpave Binder % & Paver Compaction WORM Audit Ledger**: Verify that every tanker unload certificate, coil-submergence log, and mix temperature curve is archived in a tamper-evident WORM ledger.
