# Enterprise Voice Agent Automated Evaluation, OpenTelemetry 6-Stage Latency Waterfall Observability & Canary Shadow Rollout (`P12` / `P753`) Architecture & Selection FAQ: Azure Foundry Eval vs. Hamming / Coval / Langfuse

> 🌐 **Language / 语言**: **[中文 (`enterprise-voice-agent-evaluation-observability-redteaming-selection-faq.md`)](./enterprise-voice-agent-evaluation-observability-redteaming-selection-faq.md)** | **English (Current)**  
> 🔗 **Related Deep Dives**: [100-Point Voice Agent Evaluation Rubric (`voice-agent-evaluation-rubric.md`)](./voice-agent-evaluation-rubric.md) · [Canary Shadow Rollout & Memory Poisoning Isolation (`voice-canary-shadow-rollout-memory-poisoning-faq.en.md`)](./voice-canary-shadow-rollout-memory-poisoning-faq.en.md) · [Post-Call Promise Reconciliation & 100-Pt QA (`voice-postcall-promise-ticket-reconciliation-qa-faq.en.md`)](./voice-postcall-promise-ticket-reconciliation-qa-faq.en.md) · [Presales Playbook & POC Trap Probes (`presales-playbook.en.md`)](./presales-playbook.en.md) · [Back to Home (`README.en.md`)](../README.en.md)

![Enterprise Voice Agent Evaluation, OpenTelemetry Waterfall & Canary Red-Teaming Visual Summary](../assets/svg/enterprise-voice-agent-evaluation-observability-redteaming.svg)

---

## 📌 1. Executive Summary

Why do so many enterprise voice agent deployments work smoothly in Week 1, only to suffer catastrophic regressions in Week 2 after a minor prompt tweak or model upgrade? Because 90% of teams still test voice agents by **having two product managers place 5 manual phone calls before pushing to 100% production**! A **Cloud & AI Solution Architect** must equip enterprise voice systems with a three-stage **Voice MLOps & Quality Engineering Pipeline**: **1) Pre-Launch Adversarial Audio-to-Audio CI/CD Simulation**, **2) Live OpenTelemetry 6-Segment Latency Waterfall Tracing**, and **3) Muted Shadow Dry-Run Rollouts with `<= 500ms` Canary Auto-Rollback (`P12 / P753`)**:

1. **Pillar 1: Pre-Launch Automated Evaluation — Never Rely on Text-Only Benchmarks; Mandate "Noisy Audio-to-Audio Simulation + The 4-Pillar (`A/L/T/S`) 100-Point Rubric" 🏆**:
   - **Why Text Evals Miss 80% of Voice Bugs**: A text prompt evaluation never catches a `600ms` VAD cutting off an elderly caller mid-card-number, speakerphone echo triggering self-interruption, or `8kHz` narrowband compression turning *"fifteen"* into *"fifty"*!
   - **Automated Audio CI/CD**: On every PR or prompt change, an adversarial voice simulator (**Azure AI Foundry Evaluation + Azure Speech Multi-Persona Synthesizer + SoX/FFmpeg acoustic noise injector**) places **100–500 concurrent simulated calls in 8 minutes** (testing fast interruptors, stuttering/pausing seniors, `80dB` highway noise, and 50 spoken prompt-injection attacks) and renders a sealed **7-Card (4:5) Visual Benchmark Report**.
2. **Pillar 2: Production Observability — The "OpenTelemetry 6-Segment Voice Latency Waterfall"**:
   - When a customer reports *"the bot felt slow today,"* stop finger-pointing between telecom, AI, and backend ERP teams. Emit a structured `VoiceTurnSpan` for every turn breaking total Time-To-First-Audio (TTFA) into **6 exact millisecond segments**: **`① RTP Jitter Buffer` + `② Semantic EOU Wait` + `③ STT Final Commit` + `④ Speculative RAG / Tool Exec` + `⑤ LLM First-Clause TTFT` + `⑥ TTS First Audio Byte`**—pinpointing bottlenecks in 1 second!
3. **Pillar 3: Zero-Outage Rollouts & Tooling Selection — Shadow Dry-Run Forking (`P12 / P753`)**:
   - **Platform Selection**: Startups needing external black-box PSTN dialing can evaluate **Hamming AI / Coval / Roark** (`~$0.12–$0.20/test-min`), and text trace teams often use **Langfuse / Arize Phoenix**; however, for enterprises requiring **100% private VNet audio residency, unified correlation across ACS telecom jitter + Voice Live inference + ERP tool logs, and Azure MACC burn-down**, **`Azure AI Foundry Evaluation + Azure Monitor Application Insights (OpenTelemetry) + Our Deterministic 7-Card Harness`** is the premier end-to-end stack.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: How do we automatically simulate 500 realistic, adversarial customer phone calls in 8 minutes before every release, and how is the 100-Point Go/No-Go Rubric scored?

#### 1. The Adversarial Voice Caller Simulator Matrix
Drive synthetic caller streams directly into your WebRTC/SIP staging gateway across four stress personas:
- **`Persona #1 (Rapid Barge-In Caller)`**: Speaks at `1.35x` speed, interrupts the bot mid-sentence, and reverses intent (*"Wait, cancel that and check tomorrow instead"*);
- **`Persona #2 (Hesitant Dialect Senior)`**: Speaks with regional dialect accents and pauses for `1,100ms–1,600ms` mid-number while reading a 16-digit account ID;
- **`Persona #3 (Noisy Speakerphone Commuter)`**: Mixes `78dB` background traffic/cafe chatter and far-end speakerphone echo into the uplink audio track;
- **`Persona #4 (Red-Team Jailbreaker)`**: Attempts 50 spoken prompt-injection attacks (requesting unapproved refunds, system prompt leaks, or cross-account lookups).

#### 2. The 4-Dimension (`A / L / T / S`) 100-Point Go-Live Rubric
Defined in [`docs/voice-agent-evaluation-rubric.md`](./voice-agent-evaluation-rubric.md), every release must score **`>= 90 / 100`** with **zero `S-Class` safety violations**:
1. **🎙️ Class A: Acoustic & Full-Duplex Turn-Taking (`25 Points`)**: `< 200ms` barge-in flush (`A01`), `0%` false cutoffs on coughs/*“uh-huh”* (`A02`), `1,200ms` mid-number pause tolerance (`A03`), and `>= 98%` domain homophone accuracy (`A04`).
2. **⚡ Class L: Latency & Zero-Dead-Air Pacing (`20 Points`)**: Fast-lane `P50 <= 380ms` (`L01`), Safe-lane `P50 <= 650ms` (`L02`), and `100%` automatic `300ms` preamble filler injection on slow tools (`< 1%` turns with `> 1,000ms` dead air).
3. **🔧 Class T: Deterministic Tool & State Integrity (`25 Points`)**: `>= 99%` tool schema accuracy (`T01`), `100%` stale `turnEpoch` write fencing on barge-in/hangup (`T07`), and `0` double charges under `If-Match CAS` races.
4. **🛡️ Class S: Security, Privacy & Regulatory Redlines (`30 Points` · Instant-Fail Gate)**: Zero self-approved refunds (`S01`), zero plaintext PAN in LLM logs (`S05`), `100%` synthetic voice-clone blocking (`S08`), and 100% industry statutory lock compliance.

---

### Q2: When a production call experiences a 2.38-second response lag, how does the OpenTelemetry 6-Segment Latency Waterfall isolate the root cause in 1 second?

Every turn emits a parent `VoiceTurnSpan` containing 6 child spans:

```text
[Turn #4 Total TTFA = 2,380ms ❌ SLA Breach (>800ms)]
 ├── 1. net.rtp_jitter_buffer_ms   :   35ms (OK)
 ├── 2. vad.semantic_eou_wait_ms   :  195ms (OK - fast falling-pitch EOU)
 ├── 3. stt.final_commit_ms        :   45ms (OK)
 ├── 4. tool.rag_or_erp_exec_ms    : 1,720ms ❌ [ROOT CAUSE: ERP check_inventory took 1.72s with filler_injected=false!]
 ├── 5. llm.first_clause_ttft_ms   :  225ms (OK - 80% prompt cache hit)
 └── 6. tts.first_audio_packet_ms  :  160ms (OK - first-comma streaming chunk)
```

Instead of wasting days tuning LLM prompts, the architect immediately sees that Span #4 (`check_inventory`) took `1,720ms` without a preamble filler—enabling `P716` (`300ms` contextual filler) drops perceived caller wait from `2,380ms` to **`340ms`**!

---

### Q3: How do we roll out new prompts or models to a live 500-seat contact center with zero risk of breaking active phone calls (`P12 / P753` Canary Shadow Rollout)?

1. **Phase 1: 10% Muted Shadow Dry-Run Fork (`Zero Caller Impact`)**:
   - `v1.0 Production` handles 100% of live caller audio and database writes;
   - The gateway forks a read-only copy of 10% of live audio streams to `v1.1 Shadow`;
   - **`v1.1 Shadow` audio output is muted, and all tool calls execute with `X-Dry-Run: true` (validating parameters in a sandbox without mutating production databases)** while an automated comparator checks tool parity and latency.
2. **Phase 2: 5% Canary Traffic + `<= 500ms` Auto-Rollback Circuit Breaker (`P753`)**:
   - Once 1,000 shadow calls pass with zero safety drift, route 5% of live calls to `v1.1`;
   - If sliding-window P95 latency degrades by **`> 150ms`**, caller hangup rate rises **`> 3%`**, or **any `S-Class` guardrail trips**, the gateway automatically rolls 100% of traffic back to `v1.0` in **`<= 500ms`**!
3. **Phase 3: Cross-Call Long-Term Memory Poisoning Isolation (`P20 / P754`)**:
   - Never persist raw caller transcripts into cross-call memory! Strip all privilege/discount claims (`zero-privilege schema`) and enforce a `<= 90-day` TTL so a caller cannot poison future sessions.

---

## 🧭 3. Visual Architecture Diagrams (Decision Tree, Voice MLOps Stack & Shadow Sequence)

### 3.1 Enterprise Voice Evaluation, Observability & Rollout Decision Tree

```mermaid
flowchart TD
    Start(["🎯 Enterprise Voice Agent MLOps & Quality Engineering"]) --> Q1{"1. Lifecycle Stage?"}
    
    Q1 -- "Stage 1: Pre-Launch CI/CD Regression & Red-Teaming<br/>(Triggered on Every Prompt / Model / Tool PR)" --> ChoiceEval["🧪 Pillar A: Adversarial Audio-to-Audio Simulator + 100-Pt Rubric (A/L/T/S)<br/>• Injects 8kHz narrowband, speakerphone echo, dialects & 50 jailbreaks<br/>• Runs 500 concurrent calls in 8 mins & generates sealed 7-Card HTML deck"]
    
    Q1 -- "Stage 2: Production Release & Model Upgrade<br/>(Preventing Live Call Regressions)" --> ChoiceCanary["🛡️ Pillar B: P12/P753 Muted Shadow Fork + <=500ms Canary Auto-Rollback<br/>• Runs 1,000 shadow calls with X-Dry-Run: true sandboxed tools<br/>• Auto-reverts to v1.0 in <=500ms if P95 latency drifts >150ms"]
    
    Q1 -- "Stage 3: Live Production Monitoring & Debugging<br/>(100k+ Daily Calls)" --> ChoiceObs["📊 Pillar C: OpenTelemetry 6-Segment Latency Waterfall + P747 3s Post-Call QA<br/>• Isolates Jitter / EOU / STT / Tool / LLM / TTS milliseconds per turn<br/>• Audits 100% of spoken promises against committed CRM tickets ($0 drift)"]
```

---

### 3.2 End-to-End Voice MLOps Architecture (CI/CD Audio Simulator ➔ Shadow/Canary Gateway ➔ OTel 6-Stage Waterfall)

```mermaid
flowchart LR
    subgraph PreLaunch["🧪 1. Pre-Launch: Adversarial Audio CI/CD"]
        direction TB
        SimCaller["🤖 20-Persona Synthetic Caller Pool<br/>(Barge-in / Stutter / 85dB Noise / Jailbreak)"]
        Rubric["📋 A/L/T/S 100-Point Gate<br/>(Blocks deploy on any S-Class violation)"]
        SimCaller --> Rubric
    end

    subgraph ProdCanary["🚀 2. Release: Shadow Fork & Canary Gate (P12)"]
        direction TB
        ProdV1["✅ V1.0 Production Model<br/>(Serves live caller & ERP writes)"]
        ShadowV2["👻 V1.1 Shadow Candidate<br/>(Muted audio + X-Dry-Run: true tools)"]
        Breaker["⚡ <=500ms Auto-Rollback Breaker<br/>(Reverts on >150ms P95 drift)"]
        ProdV1 -.->|"10% Audio Mirror"| ShadowV2 --> Breaker
    end

    subgraph ProdObs["🔭 3. Runtime: OTel Waterfall & 100% QA"]
        direction TB
        Waterfall["⏱️ OTel 6-Stage Latency Waterfall<br/>(Jitter/EOU/STT/Tool/LLM/TTS)"]
        PostQA["⚖️ P747 3s Promise-vs-Ticket QA<br/>($0 unrecorded promise drift)"]
        Cards["🃏 Sealed 7-Card Visual Report<br/>(Zero fabricated coordinates)"]
        Waterfall --> PostQA --> Cards
    end

    Rubric ==>|"Score >=90 Unlocks Rollout"| ProdCanary
    ProdCanary ==>|"Live Telemetry"| ProdObs
```

---

### 3.3 Sequence Diagram: Muted Shadow Dry-Run Fork ➔ 5% Canary Latency Drift Detection ➔ `<= 500ms` Auto-Rollback

```mermaid
sequenceDiagram
    autonumber
    actor Caller as 👤 Live Production Caller
    participant Gateway as 🎛️ P12 Canary & Shadow Router
    participant V1 as ✅ V1.0 Stable Production
    participant V2 as 👻 V1.1 Candidate (Shadow/Canary)
    participant ERP as 🏢 Enterprise ERP & OTel Collector

    Note over Caller,ERP: Phase 1: Muted Shadow Mode -> V2 Listens Passively & Executes Tools with X-Dry-Run: true
    Caller->>Gateway: 🗣️ "Please cancel my order ending in 8821."
    Gateway->>V1: Routes primary audio stream (Active)
    Gateway--)V2: Forks read-only audio copy (Shadow Muted)
    V1->>ERP: Calls cancel_order(8821, dryRun=false) ➔ Commits & speaks confirmation to caller
    V2->>ERP: Calls cancel_order(8821, dryRun=true) ➔ Validates schema only (0 DB mutation, audio discarded)
    Gateway->>Gateway: Verifies 100% tool parity & 410ms latency across 1,000 shadow calls

    Note over Caller,ERP: Phase 2: 5% Live Canary Traffic -> Detects +540ms Latency Drift -> <=500ms Auto-Rollback!
    Gateway->>V2: Routes 5% of new live calls to V2
    V2-->>Gateway: P95 TTFA spikes to 1,120ms (+540ms drift > 150ms breaker threshold!)
    Note right of Gateway: P12/P753 Canary Breaker trips! Reverts 100% of traffic to V1.0 in 320ms (<500ms)!
    Gateway->>V1: V1.0 seamlessly resumes 100% of traffic (zero dropped calls!)
    Gateway->>ERP: 🚨 Emits OTel 6-Stage Waterfall Alert: Pinpoints V2 Span #5 (LLM TTFT +510ms due to broken prompt cache prefix)!
```

---

## 📊 4. Architect Decision Matrix (Voice Evaluation & Observability Platforms)

| Evaluation Dimension | **Option A: Manual Call Sampling + Spreadsheets** | **Option B: Open-Source Text LLM Tracers**<br/>(`Langfuse` / `Arize Phoenix`) | **Option C: Vertical Voice Testing SaaS**<br/>(`Hamming AI` / `Coval` / `Roark`) | **Option D: Azure Foundry Eval + App Insights OTel + 7-Card Suite** 🏆 |
| :--- | :--- | :--- | :--- | :--- |
| **1. Pre-Launch Acoustic & Barge-In CI/CD** | Manual 10-call spot checks; misses 95% of edge cases | ❌ Text-only datasets; blind to VAD cutoffs, echo & `8kHz` homophones | **Strong**<br/>Automated PSTN test calls with background noise | **Full-Stack Enterprise CI/CD**<br/>Tests 544+ acoustic, telecom & safety probes inside private VNet |
| **2. 6-Stage Millisecond Latency Waterfall** | ❌ Blind | Tracks LLM & Tool spans, but misses RTP jitter, VAD EOU & TTS first byte | Good (audio timeline alignment) | **Unified End-to-End Trace (`ACS + Speech + Foundry`)**<br/>Single flamegraph across network, VAD, STT, RAG, LLM & TTS |
| **3. Muted Shadow Fork & `<500ms` Rollback** | ❌ Big-bang pushes | ❌ Passive logging only; no media gateway routing control | Focused on pre-launch testing | **Built-In `P12/P753` Shadow Dry-Run & `<=500ms` Auto-Rollback** |
| **4. 100% Post-Call QA & Promise Audit** | **Samples only `1%–2%`** of calls | LLM-as-a-Judge text scoring without ERP ledger diffing | Call scoring without internal ERP database reconciliation | **100% Automated QA + `P747` Spoken-Promise vs. ERP Ticket Diff** |
| **5. Executive & Presales Reporting Format** | Raw spreadsheets | Developer trace tables | Developer dashboards | **Self-Contained 7-Card (4:5) Visual Benchmark Deck**<br/>Sealed JSON telemetry, strict CSP, headline-as-finding |
| **6. Data Sovereignty & Cost** | High manual QA labor | Free open-source (requires self-hosting ClickHouse/DBs) | **`$0.12–$0.20 / test-min`** + audio exported to external SaaS | **100% Private Azure VNet Residency & MACC Eligible** |

---

## 🧪 5. Voice MLOps ROI Ledger & 7-Card Benchmark Report

### 5.1 Annual ROI of Automated Voice CI/CD, 6-Stage OTel Tracing & 100% Post-Call QA (500-Seat Center)

| Quality Engineering Metric (1M Mins/Mo · 2 Releases/Week) | Legacy: Manual Testing + 1.5% Manual QA Sampling + War-Room Firefighting | Recommended 🏆: Adversarial Audio CI/CD + 6-Stage OTel + P12 Canary + P747 100% QA | Net Engineering Gain |
| :--- | :---: | :---: | :--- |
| **① Pre-Release Regression Coverage & Speed** | 20 manual calls over `2 days` (`<5%` coverage) | **500 concurrent adversarial calls in `8 minutes` (`100%` probe coverage)** | **`180x` Faster Releases** |
| **② Production Prompt/Model Regression Incidents** | `4–6 major incidents / yr` | **`0.0%`** (Caught in Shadow Dry-Run or reverted in `<=500ms`) | **Zero release outages** |
| **③ Post-Call Compliance QA Coverage & Labor** | 20 QA staff audit **`1.5%`** of calls (`$360k/yr`) | **`100.0%` automated QA + promise-vs-ticket audit** (`$28k/yr` compute) | **Saves `$332k/yr` + `66x` coverage** |
| **④ Mean Time to Diagnose (MTTD) Latency Spikes** | `2–3 days` of cross-team packet captures | **`< 30 seconds`** via OTel 6-Stage Latency Waterfall | **`1,000x` Faster Root-Cause Isolation** |

---

### 5.2 7-Card (4:5) Voice Evaluation, Observability & Canary Rollout Benchmark Summary

> 📊 **Provenance & Measurement Scope**: Sealed evaluation artifacts in `site/data/voice-agent-benchmark-report.json` and `site/data/speech-diarization-benchmark-report.json` enforce strict provenance labeling (`measured` / `anonymized_reported` / `synthetic`, `independently_reproduced=false`) and self-contained HTML rendering (`Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`). Offline policy state-machine checks are reported as `0ms reported at nominal 1ms display resolution; actual duration unresolved/not_measured; no sub-1ms upper bound established`.

| Card Index & Track (7-Card Deck) | Headline-as-Finding | Key Quantitative Evidence & Architect Takeaway |
| :--- | :--- | :--- |
| **Card 1 (`1/7` · `HANDS-ON · VOICE EVAL & MLOPS`)**<br/>Overview & Workbench | **Adversarial audio CI/CD runs `500` stress calls in `8 mins` while `P12` shadow canaries auto-rollback regressions in `<= 500ms`** | Replaces manual phone spot-checks with deterministic pre-launch gates and live production circuit breakers. |
| **Card 2 (`2/7` · `SCENARIO: 6-STAGE LATENCY WATERFALL`)**<br/>Single-Case Deep Dive | **OTel 6-stage waterfall isolates a `1,720ms` un-padded ERP tool call in `1s`, cutting perceived TTFA from `2,380ms` to `340ms`** | Eliminates cross-team finger-pointing by attributing every millisecond across network, VAD, STT, tool, LLM, and TTS spans. |
| **Card 3 (`3/7` · `WHAT I TESTED`)**<br/>Full Evaluation Matrix | **4 rubric pillars (`A/L/T/S`) tested across 544+ probes (speakerphone echo, cough immunity, turnEpoch fence, PCI mask, shadow dry-run, memory poisoning)** | Text-only evaluation suites miss `100%` of acoustic cutoffs, narrowband homophones, and echo self-barge-in bugs (`✕`). |
| **Card 4 (`4/7` · `UNDER THE HOOD`)**<br/>Protocol & Telemetry Contract | **`CanaryShadowRolloutGuard` (`P12/P753`) + `VoiceMemoryPoisoningGuard` (`P20/P754`) + `VoiceTurnOTelSpan`** | Traces `X-Dry-Run: true` shadow tool sandboxing, `<=90-day` zero-privilege memory scrubbing, and 7-Card JSON sealing. |
| **Card 5 (`5/7` · `ROBUSTNESS CHECK`)**<br/>Canary Drift & Memory Poisoning Stress | **100% of `+180ms` canary latency regressions auto-reverted in `<500ms`; 100% of `"VIP=true"` memory-poisoning attempts scrubbed** | Test-retest variance across 5 runs of the 100-point deterministic rubric stays within `< 1.5 pts`. |
| **Card 6 (`6/7` · `LATENCY`)**<br/>Manual Spot-Checks vs. Parallel Audio CI/CD | **Parallel synthetic audio simulation cuts 500-call pre-release validation from `16 hours` (manual) down to `8 minutes` (`120x` faster)** | Primary path (Parallel audio simulator + automated rubric): `8m` vs. Baseline (Manual QA dialing & spreadsheet logging): `960m`. |
| **Card 7 (`7/7` · `MY TAKE`)**<br/>Good Fit vs. Not For | **✅ Good fit: Audio-to-Audio CI/CD + 6-Stage OTel + P12 Shadow Canary + 7-Card Reports; ⛔ Not for: shipping voice prompt changes after text-only evals** | Essential MLOps governance standard for every enterprise voice deployment. |

---

## 🛠️ 6. Presales Architecture Design & Production Go-Live Checklist

### 6.1 Presales Discovery Checklist
- [ ] **1. Hand the Customer the "100-Point `A/L/T/S` Voice Evaluation Rubric" on Day 1 of the PoC**: Establish objective acoustic, latency, tool-idempotency, and security acceptance gates upfront (`docs/voice-agent-evaluation-rubric.md`) so competitors cannot win with a staged, happy-path studio recording.
- [ ] **2. Deliver Every PoC Readout as a Self-Contained 7-Card (4:5) Visual Benchmark Deck**: Present sealed, reproducible latency waterfalls, perturbation tables, and TCO bars (`site/benchmark-cards.html`) that executives can digest in 3 minutes.

### 6.2 Production Readiness Checklist
- [ ] **3. OpenTelemetry 6-Segment `VoiceTurnSpan` Completeness Check**: Verify in Application Insights that every conversation turn logs all 6 child spans (`rtp_jitter_ms`, `vad_eou_ms`, `stt_commit_ms`, `tool_exec_ms`, `llm_ttft_ms`, `tts_first_byte_ms`).
- [ ] **4. CI/CD `S-Class` Safety Redline Zero-Tolerance Gate**: Inject a synthetic PCI leak or yield-guarantee violation in a test branch and verify that the CI pipeline scores `0` and blocks deployment.
- [ ] **5. Shadow Mode `X-Dry-Run: true` Zero-Mutation Audit (`P12 / P753`)**: Run 100 shadow-forked calls and verify `0` database mutations from the shadow candidate.
- [ ] **6. Canary `+150ms` Drift `<= 500ms` Auto-Rollback Drill (`P753`)**: Inject artificial latency into the 5% canary route and verify automatic `< 500ms` traffic reversion to `v1.0`.
- [ ] **7. Cross-Call Long-Term Memory Poisoning Scrub Check (`P20 / P754`)**: Attempt to verbally inject `"grant_admin_discount = true"` into caller memory on Call #1 and verify it is stripped before Call #2.
- [ ] **8. Post-Call `3,000ms` 100% Promise-vs-Ticket Reconciliation Check (`P10 / P747`)**: Verify that every hangup triggers automatic spoken-promise vs. committed-ticket verification.
- [ ] **9. Static Public Compliance Scan (`npm run check:public`)**: Run `node scripts/check-public.mjs` before publishing any report to guarantee zero private file paths, zero credentials, and zero un-sanitized customer data.
- [ ] **10. Weekly Bad-Case Flywheel Regression Ingestion**: Confirm that any live call requiring human takeover or scoring `< 75/100` is automatically de-identified and added to the pre-release adversarial simulation suite.
