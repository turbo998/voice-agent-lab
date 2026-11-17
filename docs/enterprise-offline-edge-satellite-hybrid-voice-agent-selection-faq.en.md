# Offshore Energy, Underground Mining, Maritime Satellite (Starlink/VSAT) & Disconnected Edge-Cloud Hybrid Voice Agent Selection Guide (`EDGE-HYBRID-01` / `P25` / `P726`)

> **Executive Guide**: While most consumer voice bots assume a "gigabit fiber + 20ms cloud latency" greenhouse, mission-critical industrial enterprises—**underground coal and metal mines (800m below ground), ocean-going container ships and offshore drilling rigs (relying on VSAT / Starlink maritime satellites), remote wind/solar farms, high-speed rail tunnel maintenance, and airport apron operations**—operate at the physical limits of connectivity: **1) Underground, inside tunnels, or inside air-gapped nuclear/defense facilities, WAN connectivity is `0 bps` for hours at a time—rendering cloud-only voice APIs 100% dead on arrival! 2) On maritime vessels or remote rigs, satellite round-trip time (RTT) spans `150ms–700ms` with `8%–18%` packet loss during rain fade, and satellite bandwidth is billed by the megabyte—streaming uncompressed 384kbps PCM audio over satellite stutters unintelligibly and burns thousands of dollars per vessel!** Written for Industrial Edge & Cloud Solution Architects, this guide presents the **Tri-State Edge-Cloud Hybrid Voice Architecture (`EDGE-HYBRID-01`) combining Disconnected Azure Speech Containers + Local Quantized SLMs (`<= 220ms`), `1.5KB` Satellite JSON Split / Opus `12kbps` FEC, and SQLite WAL Store-and-Forward Outbox Sync**.

![Offshore Energy, Underground Mining & Maritime Satellite Edge-Cloud Voice AI Architecture](../assets/svg/enterprise-offline-edge-satellite-hybrid-voice-agent.svg)

---

## 1. 📌 Executive Summary

- **For Mining, Maritime, Oil & Gas, Rail Tunnels, and Ramp Operations, NEVER Deploy a Cloud-Only Audio Streaming Architecture! Deploy a "Tri-State Network-Adaptive Edge-Cloud Hybrid Architecture (`EDGE-HYBRID-01`)"!**
- **How the Tri-State Adaptive Router Operates Across Connectivity Regimes**:
  1. **State 1: Completely Disconnected / Air-Gapped (`0 bps` — Underground Mines, Rail Tunnels, Nuclear/Defense Plants)**:
     - **100% On-Edge Autonomous Loop (`<= 220ms` Latency)**: Deploy a ruggedized edge appliance (`NVIDIA Jetson Orin AGX Industrial` or `Azure Stack Edge Rugged`) running **Disconnected `Azure AI Speech Containers` (offline license token caching) + 4-bit Quantized Local Multimodal SLM (`Phi-4-multimodal-instruct` / `Qwen2.5-Omni-7B-AWQ`) + Local `Qdrant / SQLite` 50,000-Page Equipment SOP Index**;
     - Field technicians query repair SOPs, read local PLC/SCADA registers over Modbus/OPC-UA, and log voice work orders 100% locally in **`<= 220ms`**. All mutations write to a tamper-evident **SQLite WAL Outbox** and sync idempotently to **SAP Plant Maintenance (PM) / IBM Maximo** once connectivity returns!
  2. **State 2: High-RTT / Metered Satellite Link (`RTT 150ms–700ms`, `5%–18%` Packet Loss — Maritime Vessels, Offshore Rigs, Remote Wind Farms)**:
     - **Never Stream Raw PCM Audio Over Satellite! Use the "Edge Audio + Satellite `1.5KB` JSON Split"**:
       - The vessel/rig edge box runs streaming STT locally and fires an immediate **`<= 180ms` local TTS acknowledgment** (*"Got it, checking Singapore port spare parts inventory via satellite..."*), completely masking the 650ms satellite latency;
       - Only the compressed **structured JSON intent (`< 1.5 KB` over QUIC/HTTP3)** traverses the Starlink/VSAT satellite link to headquarters ERP/LLMs, cutting satellite bandwidth consumption by **99.2%!**
     - **When Live Human Voice Escalation Over Satellite Is Required**: Automatically switch to **Opus `12 kbps` with 30% In-Band Forward Error Correction (FEC) + Packet Loss Concealment (PLC)**, surviving 18% packet loss while slashing satellite data costs from `$4.20/min` to **`$0.06/min`**.
  3. **State 3: Docked / Surface 5G / Wi-Fi (`RTT < 40ms`)**:
     - Seamlessly burst to cloud `Azure OpenAI Voice Live (GPT-Live-1)`, drain the local `P0–P3` Outbox queue to SAP/Maximo, and pull incremental SOP vector diffs and model patches.

---

## 2. 🎯 Architect & Customer Deep-Dive Q&A

### Q1: How can a compact ruggedized edge box (like a 32GB/64GB Jetson Orin AGX mounted on a mine vehicle or ship bridge) run real-time STT, LLM reasoning, RAG over 50,000 manual pages, and Neural TTS simultaneously?
- **The 14.3 GB VRAM Industrial Edge Voice Budget (Supporting 8 Concurrent Headsets on One `Orin AGX 64GB`)**:
  1. **Local Streaming STT (`Azure AI Speech STT Container` + Custom Equipment Vocabulary)**: `3.5 GB RAM` (`< 120ms` partial frame latency).
  2. **Local Neural TTS (`Azure AI Speech Neural TTS Container`)**: `2.8 GB RAM` (`< 65ms` time-to-first-audio).
  3. **Local Quantized Brain (`Phi-4-multimodal-instruct` or `Qwen2.5-7B-Instruct-AWQ` via TensorRT-LLM)**: **`6.2 GB VRAM`** (`95ms` TTFT, `65 tokens/sec` decode).
  4. **Local Vector SOP Engine (`Qdrant Edge / SQLite-vec` indexing 50,000 pages of `120-token spoken_digest` chunks)**: **`1.8 GB RAM`** (`< 8ms` retrieval).
  - **Total Footprint = `14.3 GB`**, delivering **`<= 220ms` end-to-end voice response** with zero internet connectivity!

### Q2: Many ocean vessels and offshore rigs now have Starlink or VSAT. Why do standard cloud WebSocket voice agents still stutter, drop out, and rack up huge bills over maritime satellite?
- **The 3 Physical Traps of Maritime & Remote Satellite Links**:
  1. **LEO Satellite Beam-Handover Micro-Outages (`300ms–1,200ms` Jitter)**: Every few minutes, LEO satellite handovers trigger TCP head-of-line blocking; uncompressed WebSocket PCM streams stall and then dump fast-forwarded audio bursts.
  2. **GEO VSAT Speed-of-Light Delay (`650ms+` RTT)**: A 36,000km geostationary hop adds 650ms before cloud VAD or TTS can even react.
  3. **345 MB/Hour Full-Duplex PCM Bandwidth Drain**: Bidirectional 24kHz PCM consumes ~768 kbps (`345 MB/hr`), exhausting costly maritime data plans.
- **The Solution Architect Fix (`Edge Turn-Taking + QUIC 1.5KB JSON Split`)**:
  - Keep VAD, barge-in, 85% of local SOP lookups, and `180ms` acoustic preambles **100% on the ship's edge box**;
  - For the 15% of queries requiring shore-side ERP data, transmit a `< 1.5 KB` gzip JSON request over **QUIC (UDP-based, zero head-of-line blocking)**—slashing satellite data usage from `345 MB/hr` to **`0.8 MB/hr` (-99.7%!)**.

### Q3: When an underground miner logs 20 voice repair tickets while disconnected for 6 hours, how do we guarantee zero data loss, zero duplicate tickets on reconnect, and safe conflict resolution if the surface control room edited the same asset?
- **SQLite WAL Encrypted Outbox + `UUIDv7` Idempotency + Safety-First Conflict Merge**:
  1. **Instant On-Edge Persistence**: Every voice-confirmed ticket writes a signed record with a time-ordered **`UUIDv7` idempotency key** and a `12 KB` Opus voice clip to local RAID-1 SSD (`SQLite WAL`).
  2. **Priority-Tiered Reconnect Drain (`P0 -> P3`)**: Upon surface Wi-Fi/5G reconnection, the sync daemon drains **`P0 Safety Hazards (<1s)` -> `P1 Repair & Spare Locks` -> `P2 Routine Checklists` -> `P3 Throttled Audio Archives`**.
  3. **Deterministic Conflict Resolution**: If both an underground worker and a surface dispatcher update the same pump status while partitioned, the gateway preserves both timeline entries and applies **`Safety-Critical State Wins`** (e.g., an underground `LOCKOUT_REQUIRED` state cannot be overwritten by a surface `READY` state).

---

## 3. 🧭 Visual Architecture Diagrams (Mermaid Decision Tree, Hybrid Architecture & Sequence Flow)

### 3.1 Disconnected & Satellite Edge-Cloud Voice Architecture Decision Tree

```mermaid
flowchart TD
    A["Industrial / Remote Field Voice Agent<br/>(Mining / Maritime / Offshore Rig / Rail Tunnel / Tarmac)"] --> B{"Live Link Telemetry Probe (RTT & Packet Loss)?"}
    B -->|"1. Disconnected or Air-Gapped (0 bps)<br/>(Underground Mine / Tunnel / Nuclear Plant)"| C["Mode A: 100% On-Edge Autonomous Mode (<=220ms)<br/>Disconnected Azure Speech Containers + Local SLM (Phi-4/Qwen)<br/>+ Local Qdrant SOP Index + SQLite WAL Outbox"]
    B -->|"2. Metered / High-RTT Satellite (RTT > 150ms or Loss > 5%)<br/>(Maritime VSAT/Starlink / Desert Wind Farm / Polar)"| D{"Does Query Require Shore HQ ERP / Cloud Brain?"}
    D -->|"Local SOP / SCADA Sufficient (85%)"| C
    D -->|"Requires HQ ERP / Shore Specialist (15%)"| E["Mode B: Edge Audio + Satellite 1.5KB JSON Split<br/>Local 180ms Preamble + QUIC Gzip JSON (-99.2% Bandwidth)<br/>(Or Opus 12kbps + 30% FEC for Live Specialist Audio)"]
    B -->|"3. Docked / Surface 5G / Wi-Fi (RTT < 40ms)"| F["Mode C: Full Cloud + Bidirectional Sync<br/>Cloud Voice Live + Drain P0-P3 Outbox to SAP/Maximo<br/>+ Pull Delta SOP Vector Index & Model Patches"]
```

### 3.2 Ruggedized Edge Box, Satellite Split & Store-and-Forward Sync Architecture (`EDGE-HYBRID-01`)

```mermaid
flowchart LR
    subgraph Worker["1. Harsh Field Wearable"]
        Mic["Rugged Bone-Conduction Headset<br/>(90dB Denoise + Hardware PTT)"]
        PLC["Local PLC / SCADA Sensors<br/>(Modbus / OPC-UA LAN)"]
    end

    subgraph EdgeBox["2. Ruggedized Edge Appliance (Jetson Orin / Azure Stack Edge)"]
        Probe["Live Link Probe (RTT / Loss)<br/>0ms Tri-State Router"]
        Speech["Disconnected Azure Speech Containers<br/>(Local Streaming STT + Neural TTS)"]
        SLM["Local Quantized SLM (<=220ms)<br/>(Phi-4-mm / Qwen2.5-7B-AWQ)"]
        LocalDB["Local Storage Dual-Engine<br/>• Qdrant 50k-Page SOP Index<br/>• SQLite WAL Offline Outbox"]
        Mic <--> Speech
        Speech <--> SLM
        SLM <--> LocalDB
        PLC --> SLM
        SLM --> Probe
    end

    subgraph SatLink["3. Satellite Resilient Transport"]
        JSON["QUIC Gzip JSON Intent Channel<br/>(<1.5 KB/turn · -99.2% Bandwidth)"]
        Opus["Opus 12kbps + 30% In-Band FEC<br/>(Survives 18% Rain-Fade Loss)"]
        Probe -->|"Satellite Split"| JSON
        Probe -->|"Live Audio Escalation"| Opus
    end

    subgraph CloudHQ["4. Shore HQ Cloud & Enterprise EAM"]
        CloudLLM["Shore Azure OpenAI / Specialist Desk"]
        EAM["SAP PM / IBM Maximo<br/>(UUIDv7 Idempotent Merge)"]
        JSON <--> CloudLLM
        Opus <--> CloudLLM
        LocalDB -.->|"P0-P3 Priority Reconnect Drain"| EAM
    end
```

### 3.3 Maritime Satellite `1.5KB` Split Troubleshooting & Underground `0 bps` Outbox Sync Sequence

```mermaid
sequenceDiagram
    autonumber
    participant W as Chief Engineer / Underground Miner
    participant Edge as Rugged Edge Voice Box (Local Containers + SLM)
    participant Outbox as Local SQLite WAL Outbox
    participant Sat as Maritime Satellite Link (RTT=640ms, 12% Loss)
    participant HQ as Shore HQ Cloud & SAP PM

    Note over W,HQ: Scenario 1: Maritime Storm Engine Alarm Over 640ms Satellite Link
    W->>Edge: Speaks into headset: "Cylinder 3 exhaust temp alarm at 485°C! Pull the SOP and check if Singapore port has a spare injector!"
    Edge->>Edge: Local STT (110ms) + Local Qdrant SOP lookup + Local OPC-UA RPM read
    Edge-->>W: T+195ms Local TTS speaks immediately: "Cylinder 3 is at 485°C. Step 1: Reduce load to 75% now. Checking Singapore port spare stock via satellite..."
    Edge->>Sat: Sends 1.2KB Gzip JSON over QUIC: {intent: "check_port_spares", part: "INJ-992", port: "SGSIN"}
    Sat->>HQ: Queries Shore SAP Global Inventory
    HQ-->>Sat: Returns 0.8KB JSON: {in_stock: 4, berth_eta: "Tomorrow 08:00"}
    Sat-->>Edge: Vessel Edge Box synthesizes response via Local Neural TTS
    Edge-->>W: "Shore HQ confirms 4 injector assemblies are in stock at Singapore port and reserved for tomorrow's berth!"

    Note over W,HQ: Scenario 2: 800m Underground Coal Mine (0 bps) Inspection & Surface Reconnect Sync
    W->>Edge: (0 bps Offline) "Log hazard: West Wing conveyor roller #14 bearing seized at 82°C, schedule night-shift replacement."
    Edge->>Outbox: Persist UUIDv7 Ticket #WO_0192 + 12KB Opus audio signature to SQLite WAL (18ms)
    Edge-->>W: T+210ms "Logged West Wing Roller #14 replacement ticket #WO_0192 in encrypted local outbox."
    Note over Edge,HQ: 2 Hours Later: Mine Vehicle Reaches Surface 5G Coverage
    Outbox->>HQ: Drains P1 Ticket #WO_0192 idempotently to SAP PM & dispatches night-shift crew!
```

---

## 4. 📊 Architect Decision Matrix (Edge-Cloud Hybrid & Satellite Voice)

| Evaluation Dimension | Option A: Tri-State Edge-Cloud Hybrid (Edge Box + Satellite `1.5KB` JSON / Opus FEC + WAL Outbox, **Recommended**) | Option B: Cloud-Only WebSocket PCM Streaming | Option C: Legacy Offline Embedded Keyword Chip (50 Fixed Commands Only) | Option D: Paper Clipboards + Post-Shift Manual PC Data Entry |
| :--- | :--- | :--- | :--- | :--- |
| **`0 bps` Disconnected Availability (Underground / Tunnel / Air-Gap)** | **100% Full Capability (local STT/TTS + local SLM + 50k-page SOP RAG)** | **`0%` (completely dead when offline!)** | Basic switch commands only; no SOP RAG or freeform tickets | Usable (but impossible while wearing heavy work gloves) |
| **First-Audio Latency Under `650ms` Satellite RTT + `15%` Loss** | **`180ms – 220ms` (local edge answers & reads SOP immediately)** | `2,400ms – 5,000ms+` (severe TCP head-of-line stalls & robotic garbling) | `150ms` | N/A |
| **Hourly Satellite / Metered Link Bandwidth Usage** | **`0.8 MB / hr` (JSON split) or `5.4 MB / hr` (Opus 12kbps FEC)** | **`345.0 MB / hr` (raw bidirectional PCM; 64x–430x more expensive!)** | `0 MB` | `0 MB` |
| **50,000-Page Manual RAG & Local PLC/SCADA Integration** | **Native (local Qdrant `<8ms` search + LAN Modbus/OPC-UA telemetry)** | Poor (cloud cannot reach isolated industrial LAN PLCs) | None | None |
| **72-Hour Disconnected Ticket & Audio Evidence Durability** | **100% Zero-Loss (SQLite WAL + `UUIDv7` idempotent replay)** | Fails (in-flight sessions drop on link loss) | None | Poor (`> 30%` omitted or damaged paper logs) |
| **Blended Monthly Cost per Vessel / Mine Site** | **$160 – $280 / site / mo** | **$1,800 – $4,500 / vessel / mo** (runaway satellite bandwidth bills!) | $30 / mo | Massive unplanned downtime & compliance risk |

---

## 5. 🧪 50-Vessel / Mine-Site Fleet TCO & 7-Card Benchmark Summary

### 5.1 50-Vessel Maritime / Offshore Fleet: Cloud-Only Satellite PCM vs. Edge-Cloud Hybrid (`EDGE-HYBRID-01`)

| Cost & Reliability Metric | Cloud-Only Voice Streaming Over VSAT / Starlink (Raw Bidirectional PCM) | **Tri-State Edge-Cloud Hybrid (`EDGE-HYBRID-01`)** | Architect Value Takeaway |
| :--- | :--- | :--- | :--- |
| **Monthly Voice Troubleshooting & Inspection Usage** | `3,000 mins (50 hrs) / vessel / mo` | `3,000 mins (50 hrs) / vessel / mo` | Covers engine room, deck inspections & emergency SOPs |
| **Annual Fleet Maritime Satellite Bandwidth Bill** | `862 GB / yr` priority satellite data → **$690,000 / yr** | **`2.4 GB / yr` compressed JSON + Opus** → **$19,200 / yr** | **Cuts satellite bandwidth costs by 97.2%!** |
| **Voice Availability During Rain Fade (15% Packet Loss)** | `41.5%` (frequent WebSocket drops; crew abandons tool) | **`99.94%` (85% local edge + 15% QUIC resilient split)** | Works reliably during severe storms when emergencies happen |
| **Inspection Work-Order Loss Rate During Blackouts** | `28.0%` (dropped sessions lose uncommitted tickets) | **`0.0%` (local SQLite WAL outbox + idempotent sync)** | 100% ISM maritime & mine safety audit compliance |
| **Total Annual Fleet TCO (Edge Hardware + Data + Cloud)** | **$840,000 / yr** (unusable during storms/blackouts) | **$142,000 / yr (Saves $698,000/yr, -83.1% TCO!)** | **Satellite data savings pay back edge hardware in < 3 months** |

### 5.2 7-Card (4:5) Visual Benchmark Report Summary (`EDGE-CLOUD-SATELLITE-VOICE`)

> **Provenance & Measurement Scope**: Metrics below summarize the `turbo998/voice-agent-lab` Disconnected & Satellite Edge-Cloud Hybrid Voice benchmark suite (`EDGE-HYBRID-01 / P25 / P726`, labeled `anonymized_reported` / `synthetic`, `independently_reproduced=false`). All zero-value latency or ticket-loss counts follow strict measurement bounds: `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

1. **Card 1 (`1 / 7` · `HANDS-ON · EDGE-CLOUD-SATELLITE-VOICE`) — Headline Finding**: Across `0 bps` underground mine blackouts and `650ms RTT / 15% packet-loss` maritime satellite stress tests, **`EDGE-HYBRID-01` maintained a `210ms` P50 local voice response, reduced satellite bandwidth usage by `99.2%` (JSON split) to `96.8%` (Opus 12kbps FEC), and achieved `100%` lossless work-order synchronization after 72-hour disconnections**.
2. **Card 2 (`2 / 7` · `SCENARIO: MARITIME-ENGINE-ALARM-650MS-RTT`) — Single-Case Deep Dive**: During a storm with `640ms` satellite RTT, a Chief Engineer reports a 485°C cylinder exhaust alarm; the shipboard edge box reads local OPC-UA telemetry and speaks the load-reduction SOP in **`195ms`** while sending a **`1.2 KB`** QUIC JSON query to reserve a spare injector at Singapore port (`Act automatically`).
3. **Card 3 (`3 / 7` · `WHAT I TESTED`) — 4-Scenario Harsh-Connectivity Matrix**:
   - `UNDERGROUND-ZERO-BPS` (48-hour WAN cable unplug test): Cloud-only stack `✕ 0% availability` vs. Disconnected Azure Speech Containers + Local SLM **100% voice SOP & work-order availability (`210ms` P50)**;
   - `SATELLITE-650MS-15PCT-LOSS` (`650ms` RTT + `15%` packet loss): Raw WebSocket PCM `✕ severe garbling, 44% WER` vs. Edge STT + QUIC JSON / Opus 30% FEC **`< 4.8%` WER & `195ms` first audio**;
   - `OFFLINE-72H-OUTBOX-SYNC` (500 voice tickets logged offline + sudden power pull): In-memory queue `✕ 100% lost on reboot` vs. SQLite WAL + `UUIDv7` **`0` lost tickets & `0` duplicate SAP PM writes**;
   - `CONCURRENT-CONFLICT-MERGE` (underground offline edit vs. surface control room edit): Last-write-wins `✕ overwrites safety lockout` vs. `Safety-Critical Wins` merge **100% hazard state preservation**.
4. **Card 4 (`4 / 7` · `UNDER THE HOOD`) — Tri-State Link Router & Offline Outbox Sync Contract**:
   ```json
   {
     "node_id": "EDGE_VESSEL_PACIFIC_07",
     "link_telemetry": { "mode": "SATELLITE_CONSTRAINED", "rtt_ms": 640, "packet_loss_pct": 12.4 },
     "edge_execution": { "stt_container": "local_az_speech_v4", "slm": "phi4_mm_q4_orin", "local_response_ms": 195 },
     "satellite_payload": { "protocol": "QUIC_GZIP_JSON", "payload_bytes": 1240, "bandwidth_saved_pct": 99.2 },
     "outbox_sync": { "work_order_id": "01933e8a-7c10-7000-8000-112233445566", "wal_persisted": true, "sap_pm_ack": true }
   }
   ```
5. **Card 5 (`5 / 7` · `ROBUSTNESS CHECK`) — 92dB Engine-Room Noise + 18% Burst Packet Loss Perturbation**: Under 92dB turbine noise and 18% burst loss, bone-conduction pickup + local edge STT maintains **`96.9%` equipment tag recognition accuracy (`-1.2 pts` shift)**.
6. **Card 6 (`6 / 7` · `LATENCY`) — Perceived First-Audio Latency Over 650ms Satellite**: Edge-Cloud split delivers **`195ms` P50** perceived response—**13.7x faster** than cloud round-trip streaming (`2,680ms` P50).
7. **Card 7 (`7 / 7` · `MY TAKE`) — Good Fit vs. Not For**:
   - ✅ **Good fit**: Underground mining, maritime shipping, offshore oil & gas rigs, remote wind/solar/pipeline inspection, rail tunnels, airport tarmacs, disaster-response vehicles;
   - ⛔ **Not for**: Never stream uncompressed `24kHz PCM` over metered satellite links; never make emergency equipment shutoff interlocks dependent on WAN connectivity!

---

## 6. 🛠️ Presales Site Survey & Go-Live Checklist

- [ ] **1. 48-Hour Physical WAN Cable Unplug (`0 bps` Air-Gap) Acceptance Test**: Physically unplug the edge appliance WAN port for 48 hours and verify 100% local voice SOP lookup, OPC-UA sensor readout, and work-order logging without license expiration.
- [ ] **2. `650ms RTT + 15% Loss` Satellite Network Emulator (`tc netem`) Stress Test**: Inject `650ms` RTT and `15%` packet loss; confirm automatic transition to "Local 180ms Preamble + QUIC 1.5KB JSON / Opus 30% FEC" with zero audio stutter.
- [ ] **3. Sudden Power-Pull SQLite WAL Durability Test**: Pull the edge box power cord 1 second after verbal ticket confirmation; reboot on WAN and verify the ticket syncs intact to SAP PM / Maximo.
- [ ] **4. `UUIDv7` Idempotent Replay Verification**: Replay the same offline outbox batch 3 times over a flapping link and confirm exactly 1 work order is created in EAM.
- [ ] **5. `P0–P3` Priority Reconnect Bandwidth Throttling**: Confirm `P0` safety alerts sync in `< 1s` upon reconnect while `P3` audio archives upload in a rate-limited background queue.
- [ ] **6. Off-Peak Delta SOP Vector Sync**: Update 2 pages of an equipment manual at HQ and verify the remote edge box downloads only the `< 200 KB` vector delta rather than a multi-gigabyte container image.
