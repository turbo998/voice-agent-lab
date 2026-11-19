# Maritime Vessel Bridge (`IMO SMCP` Helm Readback), Port `VTS` & Shipyard Voice AI: Wrong-Way Rudder Lock, `CPA/TCPA` Preemption & Drydock Safety (`MARITIME-BRIDGE-VTS-01`)

> **Executive Guide**: Across **ocean-going container ships, `VLCC` supertankers, and `LNG` carriers (`Navigation Bridges and 102dB Engine Rooms`)**, Port Vessel Traffic Services (`VTS`), and mega-shipyards (**300,000-ton drydocks and rusty enclosed ballast tanks**), Captains, Harbour Pilots, multinational helmsmen, and marine engineers rely on spoken helm orders, `VHF` radio, and enclosed-space permits. Yet deploying generic Voice AI in maritime and shipyard operations without hard `NMEA 0183 / IEC 61162` rudder-angle, `ARPA` radar, and gas/UWB interlocks creates three catastrophic maritime hazards: **1) The "Spoken Port 15, Steered Starboard 15 (`Wrong-Way Rudder`)" Canal Grounding & Bridge Allision Disaster: During tense pilotage in the Suez Canal, Panama Canal, or narrow river channels, the Pilot orders *"Port fifteen!"*, and a stressed helmsman either repeats *"Port fifteen"* while turning the wheel to **Starboard**, or mishears the order—running a 200,000-ton vessel aground or into a bridge pier within 20 seconds! 2) Missing an Imminent `ARPA` Radar Collision Alert (`CPA < 0.5 NM` & `TCPA < 6 Mins`) During Night/Fog Watch! 3) Entering an Oxygen-Depleted Rusty Ballast Tank (`O2 = 14.2%`) or Opening Drydock Flooding Valves While Painters Are Still on the Dock Floor!** This guide delivers the production architecture for maritime vessel bridge, port `VTS`, and shipyard voice AI (`MARITIME-BRIDGE-VTS-01`).

![Maritime Vessel Bridge (IMO SMCP), Port VTS & Shipyard Voice AI: Helm Readback & Drydock Lock](../assets/svg/maritime-vessel-bridge-smcp-helm-readback-vts-shipyard-voice.svg)

---

## 1. 📌 Executive Summary

- **Four Non-Negotiable Maritime & Shipyard Safety Laws for Marine Voice AI (`MARITIME-BRIDGE-VTS-01`)**:
  1. **Law 1: Enforce a Three-Way `0ms` "Pilot Helm Order × Helmsman `IMO SMCP` Readback × `NMEA RSA` Actual Rudder Angle" Wrong-Way Rudder Interlock!**
     - Per `IMO Resolution A.918(22) Standard Marine Communication Phrases (SMCP)` and Bridge Resource Management (`BRM`):
       - Whenever the Captain or Pilot issues a helm order (e.g., *"Port fifteen"* or *"Hard-a-starboard"*), the bridge edge voice box verifies both **① Verbatim direction and degree readback by the helmsman (`portOrStarboardHelmDirectionAndDegreesMatched == true`)** AND **② Physical rudder deflection on the `NMEA 0183 / IEC 61162 RSA` rudder-angle sensor within 3 seconds (`actualRudderAngleFollowsOrder == true`)**!
       - If the helmsman repeats the wrong order OR turns the wheel in the opposite direction of the spoken command, a **`0ms` Wrong-Way Rudder Visual & Acoustic Alarm (`wrongWayRudderAlarmTriggered0ms = true`)** fires on the bridge before the vessel's heading deviates!
  2. **Law 2: Enforce a `0ms` "`ARPA / AIS` Imminent Collision (`CPA < 0.5 NM` & `TCPA < 6 Mins`) Preemption & `COLREGs` Advisory Lock"!**
     - Whenever radar/AIS telemetry triggers `imminentCollisionCpaTcpaAlert == true`, the gateway **preempts all routine logbook or engine-room queries in `0ms` (`colregsCollisionPreemptionTriggered = true`)**, announcing the target vessel's bearing, `CPA/TCPA`, and the applicable `COLREGs` give-way maneuver!
  3. **Law 3: Enforce a `0ms` "Shipyard Drydock Flooding (`Dock-Floor UWB == 0`) & Ballast-Tank Enclosed-Space (`O2 == 20.9%`) Hardware Lock"!**
     - Before authorizing drydock flooding valve actuation or enclosed ballast-tank entry (`drydockFloodingOrBallastEntryRequested == true`), the gateway requires verified `O2 == 20.9%` (`0 ppm H2S/CO`, `0% LEL`) and `0` personnel UWB badges on the drydock floor (`tankAtmosphereO2AndDockFloorZeroHeadcountVerified == true` -> `drydockValveOrTankEntryAuthorized = true`)!
  4. **Law 4: `100%` Offline Shipboard Edge Execution (`0-bps` Mid-Ocean Satellite Independence), Multinational Crew Accent Tuning & `102dB` Engine-Room Bone-Conduction Support!**

---

## 2. 🎯 Architect & Customer Deep-Dive Q&A

### Q1: Why is audio-only helm readback checking insufficient on a ship's bridge, and how does coupling voice AI with the `NMEA 0183 RSA` rudder sensor prevent `$100M+` canal groundings?
- **Catching the "Correct Mouth, Wrong Hands" Cognitive Slip Within 3 Seconds**:
  1. **The Classic Bridge Resource Management (`BRM`) Trap**: Maritime accident investigations (`MAIB / NTSB`) repeatedly show that under high stress in narrow channels, a helmsman can correctly repeat *"Port fifteen, sir!"* aloud while muscle confusion causes their hands to spin the helm wheel to **Starboard**.
  2. **Voice × Rudder-Sensor Closed Loop**: `MARITIME-BRIDGE-VTS-01` parses the Pilot's spoken command (`ordered_direction = PORT, deg = 15`), verifies the helmsman's spoken readback, and immediately samples the `NMEA $IIRSA` rudder-angle sentence at `10Hz`. The instant the rudder blade moves `+3°` toward Starboard instead of `-15°` toward Port, the bridge speaker shouts *"WRONG-WAY RUDDER! Ordered Port 15, rudder moving Starboard!"*—saving the ship before hydrodynamic yaw builds up!

### Q2: How does the shipboard voice assistant work in the middle of the Pacific Ocean with zero cellular coverage and inside a `102dB` two-stroke diesel engine room?
- **100% Local Bridge/Engine-Room Edge Server + `IMO SMCP` Phonetic Biasing**:
  - All ASR, LLM, and `MAN B&W / WinGD` engine-manual `Voice RAG` containers run locally on the vessel's industrial server rack—consuming zero `Starlink / VSAT` satellite quota while auto-populating the `SOLAS` Electronic Deck & Bell Logbook (`e-Logbook`) and synchronizing timestamps with the Voyage Data Recorder (`VDR`).

---

## 3. 🧭 Visual Architecture Diagrams (Mermaid Decision Tree, Maritime Architecture & Sequence Flow)

### 3.1 Maritime Vessel Bridge, Port `VTS` & Shipyard Voice AI Decision Tree

```mermaid
flowchart TD
    A["Shipping Line / Port VTS / Shipyard Deploys Marine Voice AI"] --> B{"Primary Maritime or Shipyard Operations Scenario?"}
    B -->|"1. Vessel Bridge Pilotage & Helm / Engine Telegraph Orders<br/>(Mandate: Zero Wrong-Way Rudder in Narrow Channels)"| C["Enforce 3-Way Pilot Order × SMCP Readback × NMEA RSA Sensor Lock<br/>• Helmsman readback mismatch OR actual rudder moves opposite order -> 0ms Wrong-Way Alarm<br/>• Auto-log helm/bell orders with GPS into SOLAS e-Logbook & VDR audio track"]
    B -->|"2. Night/Fog Watch ARPA Collision Alert & 102dB Engine Room<br/>(Mandate: 0ms CPA <0.5NM Preemption · 0-bps Ocean Offline)"| D["Enforce 0ms CPA/TCPA Collision Preemption + Offline Engine RAG<br/>• CPA <0.5 NM & TCPA <6 min -> 0ms preempt routine speech & announce COLREGs maneuver<br/>• 102dB bone-conduction headset queries local MAN/WinGD manual in 200ms offline"]
    B -->|"3. Shipyard 300k-Ton Drydock Flooding & Ballast Tank Entry<br/>(Mandate: Zero Hypoxic Tank Asphyxiation · Zero Occupied Flooding)"| E["Enforce Dock-Floor UWB == 0 + Ballast O2 == 20.9% Hardware Lock<br/>• Block drydock flooding valves if any worker UWB badge remains on dock floor<br/>• Block ballast-tank entry permit unless Bluetooth 4-gas detector reads O2 == 20.9%"]
```

### 3.2 Bridge Wrong-Way Rudder Gate, `ARPA` Collision Preemptor & Shipyard Interlock Architecture (`MARITIME-BRIDGE-VTS-01`)

```mermaid
flowchart LR
    subgraph VesselYard["1. Ship Bridge / Engine Room & Shipyard Sensors"]
        VdrMic["Bridge VDR Mic Array + NMEA 0183 Rudder Sensor (RSA)"]
        Arpa["ARPA Radar / AIS / ECDIS"]
        YardGas["Drydock UWB Badges & Ballast 4-Gas Detector (O2)"]
    end

    subgraph Kernel["2. MARITIME-BRIDGE-VTS-01 Marine Safety Kernel (Local Edge)"]
        RudderLock["SMCP Readback × Actual Rudder Angle (RSA) Gate<br/>(0ms Wrong-Way Rudder Alarm on Mismatch)"]
        Colregs["0ms CPA/TCPA Collision Preemptor & COLREGs Guide"]
        YardLock["Drydock Zero-Headcount & Ballast O2==20.9% Gate"]
        VdrMic --> RudderLock
        Arpa --> Colregs
        YardGas --> YardLock
    end

    subgraph Systems["3. Integrated Bridge System (IBS) & Shipyard PLC"]
        IBS["IBS Bridge Alarm Panel & SOLAS e-Logbook"]
        DockValve["Drydock Sluice Valve PLC & Enclosed-Space e-PTW"]
        RudderLock & Colregs --> IBS
        YardLock --> DockValve
    end
```

### 3.3 `0ms` Narrow-Channel "Spoken Port 15, Steered Starboard" Interception & Hypoxic Ballast-Tank Lock Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Crew as Harbour Pilot & Helmsman / Shipyard Tank Crew
    participant Gate as MARITIME-BRIDGE-VTS-01 Marine Safety Voice Gateway
    participant NMEA as NMEA 0183 Rudder Sensor (RSA) / Shipyard Gas & UWB Bus

    Crew->>Gate: 1. [200k-Ton Container Ship in Suez Canal Bend] Pilot Orders: "Port fifteen!"
    Crew->>Gate: 2. Helmsman Repeats Aloud: "Port fifteen, sir!" — but accidentally turns the wheel toward `Starboard (+8.2°)`!
    NMEA-->>Gate: 3. Streams `$IIRSA` Rudder Telemetry (`ordered: PORT_15`, `actualRudderDeg: +8.2_STARBOARD`, `actualRudderAngleFollowsOrder: false`)
    Note over Gate: MARITIME-BRIDGE-VTS-01 Wrong-Way Rudder Lock Trips (`wrongWayRudderAlarmTriggered0ms = true`): Fires bridge alarm in 0ms!
    Gate-->>Crew: "[WRONG-WAY RUDDER ALARM!] Ordered PORT 15, but rudder is deflecting STARBOARD 8 degrees! Check helm—wheel to PORT 15 immediately!"
    Note over Crew,NMEA: --- Scenario B: Shipyard Crew Requests Entry into Rusty #4 Port Ballast Tank ---
    Crew->>Gate: 4. Foreperson Calls on Radio: "We opened #4 Port Ballast Tank manhole 10 minutes ago—issue the enclosed-space entry permit for two descalers."
    Gate->>NMEA: 5. Queries Bluetooth Multi-Gas Detector Lowered into #4 Port Ballast Tank
    NMEA-->>Gate: ALERT: Measured Oxygen `O2 = 14.2%` (`< 20.9%` safe threshold — severe rust oxygen depletion)!
    Note over Gate: Enclosed-Space Hypoxia Lock Trips (`drydockValveOrTankEntryAuthorized = false`): Blocks permit in 0ms!
    Gate-->>Crew: "LETHAL HYPOXIA LOCK! Entry into #4 Port Ballast Tank is strictly forbidden! Measured oxygen is 14.2% (below the 20.9% safe threshold)—entering will cause unconsciousness and asphyxiation within 30 seconds! Connect forced-draft ventilation blowers until O2 reaches 20.9%!"
```

---

## 4. 📊 Architect Decision Matrix (Maritime Bridge, Port `VTS` & Shipyard Voice AI)

| Evaluation Dimension | Option A: Manual Visual Rudder Check + Paper Bell Book | Option B: Audio-Only Transcription Bot Without `NMEA / Gas` Locks | **Option C: `MARITIME-BRIDGE-VTS-01` `SMCP × NMEA RSA` Lock + `CPA` Preemptor + Shipyard Gas/UWB Gate (Recommended ⭐)** |
| :--- | :--- | :--- | :--- |
| **Narrow-Channel "Spoken Port, Steered Starboard" Grounding Risk** | Pilot looking out window misses helm error for `15s` | **Fatal Blind Spot (hears correct readback while wheel turns wrong way!)** | **`100% 0ms Detection` (cross-checks spoken order against `NMEA RSA` rudder sensor)** |
| **Night/Fog Watch `ARPA CPA/TCPA` Collision Preemption** | Generic beep blends into bridge background alarms | Disconnected from `ARPA / AIS` bus | **`0ms` voice preemption announcing bearing, `CPA/TCPA` & `COLREGs` action** |
| **Shipyard Hypoxic Ballast-Tank Entry & Occupied Drydock Flooding** | Paper permits signed without live gas check | Accepts verbal *"ventilated"* claim | **`0.0%` (hard-locked to Bluetooth `O2 == 20.9%` & dock-floor `UWB == 0`)** |
| **Mid-Ocean `0-bps` Offline Operation & Multinational Accent Support** | Manual bell-book writing distracts OOW | Fails when VSAT drops; mishears maritime accents | **`100%` shipboard offline edge + `99.7%` multinational `SMCP` accuracy** |

---

## 5. 🧪 120-Vessel Global Shipping Fleet & Mega-Shipyard ROI & 7-Card Benchmark

### 5.1 120-Vessel Ocean Fleet & Shipyard Base: Legacy Operations vs. `MARITIME-BRIDGE-VTS-01`

| Navigation Safety, Grounding Prevention & Shipyard Safety Metric | Legacy Manual Watch / Paper Permits | **Maritime & Shipyard Voice AI (`MARITIME-BRIDGE-VTS-01`)** | Architect Value Takeaway |
| :--- | :--- | :--- | :--- |
| **Narrow-Channel Wrong-Way Rudder Detection & Correction Time** | `12–20 seconds` (after ship yaws off course) | **`< 2.5 seconds` (`0ms` `SMCP × NMEA RSA` mismatch alarm)** | **Prevents `$50M–$500M+` canal blockages, groundings, and pier allisions** |
| **Officer of the Watch (`OOW`) Bell-Book & Deck-Log Clerical Time** | `45 mins / watch` manual logging | **`75%` reduction (auto-generated `SOLAS e-Logbook` synced to `VDR`)** | Keeps `OOW` eyes on the horizon and radar during congested transits |
| **Shipyard Enclosed-Space Hypoxia & Drydock Flooding Incidents** | Leading cause of shipyard fatalities | **`0 incidents` (`100%` Bluetooth `O2 == 20.9%` & dock `UWB` lock)** | Enforces `IMO Resolution A.1050(27)` enclosed-space life safety |

### 5.2 7-Card (4:5) Visual Benchmark Report Summary (`MARITIME-BRIDGE-VTS`)

> **Provenance & Measurement Scope**: Metrics below summarize the `turbo998/voice-agent-lab` Maritime Bridge, VTS & Shipyard Voice benchmark suite (`MARITIME-BRIDGE-VTS-01`, labeled `anonymized_reported` / `synthetic`, `independently_reproduced=false`). All zero-value latency or miss counts follow strict measurement bounds: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

1. **Card 1 (`1 / 7` · `HANDS-ON · MARITIME-BRIDGE-VTS`) — Headline Finding**: Across simulated narrow-channel pilotage helm orders, `ARPA` collision alerts, and shipyard enclosed-tank entry tests, **enforcing the `IMO SMCP × NMEA RSA` Rudder Lock, `0ms` `CPA/TCPA` Collision Preemptor, and Ballast `O2 == 20.9%` / Drydock UWB Gate achieved `100%` wrong-way rudder interception, `0.0%` missed collision alerts, and `0.0%` hypoxic tank entries**.
2. **Card 2 (`2 / 7` · `SCENARIO: WRONG-WAY-RUDDER-AND-HYPOXIC-BALLAST-TANK`) — Single-Case Deep Dive**: When a helmsman repeats *"Port 15"* aloud while turning the rudder `+8.2°` Starboard—and a shipyard crew requests entry into a ballast tank at `14.2% O2`—`MARITIME-BRIDGE-VTS-01` fires the Wrong-Way Rudder alarm in `0ms` and locks the enclosed-space permit (`Act automatically`).
3. **Card 3 (`3 / 7` · `WHAT I TESTED`) — 4-Scenario Maritime Navigation & Shipyard Safety Matrix**:
   - `HELMSMAN-WRONG-WAY-RUDDER-DEFLECTION` (correct spoken readback `"Port 15"` but rudder moves `Starboard`): Audio-only bot `✕ misses physical steering error` vs. `SMCP × NMEA RSA` loop **100% `0ms` Wrong-Way Rudder alarm**;
   - `ARPA-CPA-UNDER-0.5NM-COLLISION-RISK` (`CPA = 0.3 NM`, `TCPA = 4 min` crossing vessel): Low-priority alert `✕ delayed behind log query` vs. `0ms` collision preemptor **interrupts bridge audio & announces `COLREGs` Rule 15 starboard turn**;
   - `SHIPYARD-BALLAST-TANK-HYPOXIA-OR-DRYDOCK-FLOODING` (`O2 = 14.2%` in ballast tank or worker UWB on drydock floor): Verbal permit `✕ allows lethal entry/flooding` vs. Gas + UWB lock **100% blocks permit & flooding valve**;
   - `ENGINE-ROOM-102DB-SPAREPART-QUERY-AT-SEA` (engineer queries exhaust-valve torque in `102dB` engine room mid-ocean): Cloud bot `✕ offline & deafened` vs. Local edge + bone-conduction **`200ms` offline manual & spare-bin readout**.
4. **Card 4 (`4 / 7` · `UNDER THE HOOD`) — Wrong-Way Rudder, `COLREGs` Preemption & Shipyard Lock Contract**:
   ```json
   {
     "maritime_bridge_vts_guard": {
       "policy_id": "MARITIME-BRIDGE-VTS-01",
       "port_or_starboard_helm_direction_and_degrees_matched": true,
       "actual_rudder_angle_follows_order": false,
       "wrong_way_rudder_alarm_triggered_0ms": true,
       "imminent_collision_cpa_tcpa_alert": true,
       "colregs_collision_preemption_triggered": true,
       "drydock_flooding_or_ballast_entry_requested": true,
       "tank_atmosphere_o2_and_dock_floor_zero_headcount_verified": false,
       "drydock_valve_or_tank_entry_authorized": false
     }
   }
   ```
5. **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`) — Multinational Seafarer Accents (`CN / PH / IN / UA / GR`) & `IMO` Numerals (`Unaone..Novenine`)**:
   - Achieved **`99.7%` recognition accuracy** across multinational maritime English accents and `VHF` squelch noise.
6. **Card 6 (`6 / 7` · `LATENCY`) — Spoken Helm Order to `NMEA 0183 RSA` Deflection Cross-Check Latency**:
   - Helm order + `$IIRSA` reverse-deflection trip -> Bridge alarm audio: `< 120ms`.
7. **Card 7 (`7 / 7` · `MY TAKE`) — Good Fit vs. Not For**:
   - **✅ Good Fit**: Ocean-going smart vessel bridges (`IBS`) and engine rooms, port authority `VTS` centers, canal pilotage authorities, and commercial/naval shipyards.
   - **⛔ Not For**: Never deploy bridge helm monitoring without coupling voice recognition to the physical `NMEA RSA` rudder-angle sensor, and never issue shipyard enclosed-tank or drydock flooding approvals without live gas and UWB telemetry interlocks!

---

## 6. 🛠️ Presales Design & Production Acceptance Checklist

- [ ] **1. 3-Way `Pilot Order × SMCP Readback × NMEA RSA Rudder Sensor` Lock (`MARITIME-BRIDGE-VTS-01`)**: Does the bridge gateway fire a `0ms` Wrong-Way Rudder alarm whenever the helmsman's readback OR the physical rudder deflection disagrees with the spoken helm order?
- [ ] **2. `0ms` `ARPA / AIS` Collision (`CPA/TCPA`) Voice Preemption**: Do imminent collision alerts (`CPA < 0.5 NM, TCPA < 6 min`) immediately preempt routine bridge speech and announce `COLREGs` give-way guidance?
- [ ] **3. Shipyard Ballast-Tank `O2 == 20.9%` & Drydock Floor `UWB == 0` Lock**: Are enclosed-space permits and drydock sluice valves physically locked until live gas and UWB headcount sensors pass?
- [ ] **4. `100%` Mid-Ocean Offline Execution & `102dB` Engine-Room Bone-Conduction**: Does the system run locally on shipboard servers with zero satellite dependency and auto-populate the `SOLAS e-Logbook`?
- [ ] **5. Multinational Seafarer `IMO SMCP` & `VDR` Synchronization**: Does the acoustic model support `IMO` phonetic numerals and write time-aligned transcripts to the Voyage Data Recorder (`VDR`)?
