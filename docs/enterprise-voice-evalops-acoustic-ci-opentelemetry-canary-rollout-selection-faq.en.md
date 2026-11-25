# Enterprise Voice AI Evaluation (Voice EvalOps), 500-Call Acoustic Regression CI/CD, 7-Hop OpenTelemetry Latency Flamegraph & Canary Rollout Architecture Selection Guide

> **Document Scope**: Built for Contact Center VPs, AI Platform Architects, and Voice SRE Leads, this guide answers why a Voice Agent that scores `98.2%` on text-based unit tests (`Promptfoo / Ragas`) still fails in `23.4%` of live phone calls, how to run a **500-Call Multi-Persona Noisy Acoustic Regression CI/CD suite in `4.2 minutes` for `$18.50`**, how to pinpoint `"the bot felt slow"` complaints in **`90 seconds` (down from `4.5 hours`)** using a **7-Hop OpenTelemetry Per-Turn Latency Flamegraph (`voice.turn.id`)**, and how to architect **Call-ID Sticky Canary Rollouts with a `<15-second` Acoustic Auto-Rollback Circuit Breaker**.

![Enterprise Voice EvalOps, 7-Hop OpenTelemetry Flamegraph & Canary Rollout Architecture](../assets/svg/enterprise-voice-evalops-acoustic-ci-opentelemetry-canary-rollout-selection-faq.svg)

---

## 📌 1. Executive Summary

1. **Why Text-Only Evaluations (`Promptfoo / Ragas`) Miss `78%+` of Voice Production Bugs—Mandating a "500-Call Acoustic Simulation CI/CD Gate"**:
   - **The Text-Eval Blindspot**: Text unit tests feed clean, well-punctuated strings into an LLM. Live telephony (`8kHz G.711`) involves **`5dB SNR` subway/café background noise, mid-sentence breathing pauses that trigger premature VAD cutoffs, homophone/digit collisions (`"15"` vs `"50"`), and mid-utterance self-corrections (`"Reschedule to Wednesday... oh wait, make it Friday afternoon"`)**. In production benchmarks, voice agents passing `98.2%` of text evals suffer a `23.4%` live call failure rate.
   - **Acoustic Simulation CI/CD (`Coval / Cekura / Roark / Pipecat Eval + Azure AI Foundry Evaluation`)**: On every prompt edit, tool schema change, or model upgrade, GitHub Actions spins up **500 parallel adversarial voice simulator calls** across diverse accents, speaking rates, background noise profiles, and barge-in timings over real WebRTC/SIP audio tracks. The full 500-call suite completes in **`4.2 minutes` for `$18.50`** (replacing `3 days` and `$4,200` of manual QA dialing) and reduces escaped acoustic defects below `0.8%`.
2. **Eliminate 4-Hour Cross-Team Blame Games with a Unified `W3C TraceContext (voice.turn.id)` 7-Hop OpenTelemetry Flamegraph**:
   - Every conversational turn traverses 7 asynchronous stages: **① `SBC/WebRTC Jitter` → ② `Silero VAD End-of-Utterance (EoU)` → ③ `STT Finalization` → ④ `RAG/MCP Tool Execution` → ⑤ `LLM TTFT` → ⑥ `TTS First-Chunk Synthesis (TTFB)` → ⑦ `Downlink RTP Playback`**.
   - By emitting a single `voice.turn.id` parent span with all 7 child spans plus **net user-perceived latency (subtracting wait time masked by progressive `800ms` filler micro-utterances)** to `Azure Monitor Application Insights / Arize Phoenix / Langfuse`, SRE teams cut slow-call Mean Time to Resolution (MTTR) from **`4.5 hours` to `90 seconds` (`-96.7%`)**.
3. **Zero-Drop Canary Releases via "Call-ID Sticky Routing (`1% → 10% → 50%`)" + 3-Metric `<15s` Auto-Rollback Circuit Breaker**:
   - **Never Switch Models Mid-Call**: Bind each call at ringback via consistent hashing on `Call-ID` to an immutable `Bundle Snapshot ID` (System Prompt + Model Snapshot + TTS Voice ID + VAD thresholds).
   - **Acoustic Circuit Breaker**: HTTP `200 OK` does not mean the voice call succeeded. Monitor rolling 50-call canary windows for **① User Repeat-Utterance Rate (`> 12.0%`)**, **② Frustrated Barge-In Rate (`> 28.0%`) or P95 Turn Latency (`> 1,350ms`)**, and **③ Emergency Human-Transfer Spike (`> +4.0%` over baseline)**. Breaching any threshold triggers an automatic **`<15-second` rollback to the Last-Known-Good (`LKG`) snapshot**.

---

## 🎯 2. Architect & Customer Deep-Dive Q&A

### Q1: We already run 1,000 text test cases in Promptfoo/DeepEval. Why do minor prompt tweaks or TTS voice updates still cause customer complaints about interruptions, misheard digits, or loops?

- **Root Cause**: Real-time voice is a coupled system of **continuous acoustic signals and full-duplex state machines**. Text-only tests are blind to **4 categories responsible for `78%+` of voice production incidents**:
  1. **Premature VAD Cutoff & Half-Intent Execution**: A caller says *"My card number is 4532... [550ms pause to read card] ...8801."* Text evals pass the complete string, whereas live VAD fires at 550ms and invokes the backend API with a truncated card number.
  2. **TTS Prosody & Number/Currency Intelligibility Regressions**: The LLM outputs `"$1,250.00"`, but a TTS update reads it unnaturally or clips the decimal, causing the caller to repeatedly ask *"Wait, how much?"*
  3. **Barge-In & Tool-Cancellation Race Conditions**: The caller shouts *"Wait, don't submit that!"* just as the agent starts speaking. Text tests cannot verify `<=220ms` WebRTC buffer flush latency or `Generation Epoch Fencing`.
  4. **8kHz Telephony Compression & Background Speech Crosstalk**: A caller in a noisy taxi or open office has background speech transcribed into their turn by STT.
- **3-Tier Automated Voice EvalOps Pipeline**:
  - **Tier 1 (Every Commit · 30 sec · `$0.40`)**: `100` deterministic text unit tests verifying prompt syntax and `MCP Tool Schema` AST parameter binding.
  - **Tier 2 (Every PR Merge · 4.2 min · `$18.50`)**: **500-Call Parallel Acoustic Simulation (`Coval / Cekura / Roark` or `Pipecat + G.711/Opus Channel Impairment Harness`)** injecting `5dB–15dB SNR` café/traffic noise, 12 regional accents/speaking speeds, and 35% mid-sentence barge-in/self-correction perturbations—scored simultaneously by an **Audio Judge** (barge-in stop latency `<=220ms`, overlap rate `<1.5%`, TTS MOS) and a **Transcript Judge** (100% tool argument AST accuracy, `0.00%` policy violations).
  - **Tier 3 (Nightly Failure-to-Fixture Loop)**: Any production call with a hangup, repeated utterance, or emergency human transfer is automatically PII-redacted and converted into a mandatory acoustic regression fixture for the next day's CI run.

### Q2: When business leaders report "The voice bot felt sluggish this morning," how do we avoid a 4-hour war room between Telephony, Speech, LLM, and Backend API teams?

- **Root Cause**: Traditional logs only show overall call duration and raw LLM latency, hiding queuing delays between the 7 asynchronous voice hops.
- **7-Hop OpenTelemetry (`voice.turn.id`) Flamegraph Specification**:
  - The orchestrator (`LiveKit Agents / Pipecat`) opens a parent span `voice.turn` on every user turn and records **7 standardized child spans**:
    1. **`hop1.ingress_sbc_webrtc`**: RTP jitter buffer delay, packet loss %, and AEC processing (`<= 30ms` baseline);
    2. **`hop2.vad_eou_detection`**: Silence duration from the user's final phoneme to semantic End-of-Utterance commit (`150ms – 320ms` baseline; misconfigured static VAD often balloons to `900ms+`);
    3. **`hop3.stt_finalization`**: Streaming STT final transcript stabilization latency and word confidence (`<= 140ms` baseline);
    4. **`hop4.rag_mcp_tool_exec`**: Vector search or external CRM/ERP API latency, tagged with `masked_by_filler: true/false`;
    5. **`hop5.llm_ttft`**: Time to first token / first speakable clause boundary from the LLM (`<= 280ms` baseline);
    6. **`hop6.tts_first_chunk`**: Streaming TTS synthesis time to first `20ms PCM/Opus` audio frame (`<= 110ms` baseline);
    7. **`hop7.egress_rtp_playback`**: Downlink RTP frame transmission to client audio buffer (`<= 35ms` baseline).
  - **Instant Attribution**: Clicking any slow turn in `Azure Monitor / Arize Phoenix / Langfuse` immediately reveals whether a `2,400ms` spike came from `hop2.vad_eou_detection` (`1,100ms` conservative threshold) or `hop6.tts_first_chunk` (`1,200ms` regional TTS quota throttling), shrinking MTTR from **`4.5 hours` to `90 seconds`**.

### Q3: How do we safely roll out prompt or model updates in real-time voice without dropping active calls or causing mass customer frustration?

- **Three Production Canary Engineering Rules**:
  1. **Call-ID Sticky Canary Routing (Zero Mid-Call Config Switching)**:
     - Traffic splitting (`1% → 10% → 50% → 100%`) happens **exclusively at SIP `INVITE` / WebRTC session initialization**. Every turn inside an active call remains pinned to the exact same `Bundle Snapshot ID` (Prompt + Model + TTS Voice + VAD config).
  2. **Asynchronous Shadow Replay before Live Traffic**:
     - Before routing `1%` of live callers to a new model snapshot, mirror live audio streams in **Shadow Mode** for 2 hours (suppressing shadow TTS output while comparing shadow tool calls and latency against production), requiring `>= 98.5%` tool parity.
  3. **3-Metric Acoustic Circuit Breaker (`<15s` Auto-Rollback to LKG)**:
     - Because hallucinating or deaf voice agents still return HTTP `200 OK`, monitor rolling 50-call canary windows across **3 acoustic health signals**:
       - **User Repeat-Utterance Rate `> 12.0%`** (caller forced to repeat themselves in consecutive turns);
       - **Frustrated Barge-In Rate `> 28.0%`** or **P95 Perceived Turn Latency `> 1,350ms`**;
       - **Emergency Human-Transfer Delta `> +4.0%`** above LKG baseline.
     - Breaching any rule automatically drains the canary and restores `100%` LKG routing in **`<15 seconds`**.

---

## 🧭 3. Visual Architecture Diagrams (Mermaid)

### 3.1 Enterprise Voice EvalOps & Observability Selection Decision Tree

```mermaid
flowchart TD
    A["Enterprise Voice AI EvalOps & Observability Requirement"] --> B{"Which engineering lifecycle stage?"}
    B -- "Stage 1: Pre-Merge CI/CD Regression<br/>(Catch VAD cutoffs, noise WER & tool regressions)" --> C{"Managed Simulation vs Self-Hosted Harness?"}
    C -- "Turnkey multi-accent/noise dialing<br/>+ voice-native MOS/barge-in scoring" --> D["Managed Voice Eval: Coval / Cekura / Roark<br/>(500-call parallel SIP/WebRTC CI in 4.2 min)"]
    C -- "Deep custom state assertions<br/>+ private VPC data residency" --> E["Pipecat / LiveKit Eval Harness<br/>+ Azure AI Foundry Evaluation SDK"]

    B -- "Stage 2: Production Per-Turn Latency Attribution<br/>(Pinpoint slow calls in 90 seconds)" --> F["W3C TraceContext (voice.turn.id) 7-Hop Spans<br/>Exported to Azure Monitor + Arize Phoenix / Langfuse"]

    B -- "Stage 3: Zero-Incident Release Management<br/>(Prevent mid-call drift & bad prompt rollouts)" --> G["Call-ID Sticky Canary Gateway (1%→10%→50%)<br/>+ 3-Metric Acoustic Breaker (<15s LKG Rollback)"]
```

### 3.2 End-to-End Voice EvalOps, 7-Hop OpenTelemetry & Sticky Canary Architecture

```mermaid
flowchart LR
    subgraph CICD["Pre-Merge: 500-Call Acoustic Simulation CI/CD (4.2 min / $18.50)"]
      SIM["Adversarial Voice Simulator Fleet<br/>(8kHz G.711 + 5dB SNR + Barge-In/Self-Correction)"]
      JUDGE["Dual Judges (Audio + Transcript AST)<br/>100% Tool AST Match · Barge-In Stop <=220ms"]
      GATE["GitHub Actions Release Gate<br/>(TSR >=96% & Policy Violations = 0%)"]
      SIM --> JUDGE --> GATE
    end

    subgraph PROD["Production Plane: Call-ID Sticky Canary & Voice Orchestrator"]
      ROUTER["Call-ID Sticky Canary Router<br/>(90% LKG Stable / 10% Canary Snapshot)"]
      AGENT["Voice Orchestrator (LiveKit / Pipecat)<br/>Emits Parent Span: voice.turn.id"]
      BREAKER["3-Metric Acoustic Breaker (<15s Rollback)<br/>Repeat Rate >12% / Transfer Spike >+4%"]
      GATE -->|"Gate Passed"| ROUTER
      ROUTER --> AGENT
      BREAKER -.->|"Breach -> Instant LKG Cutover"| ROUTER
    end

    subgraph OTEL["Observability Plane: 7-Hop OpenTelemetry & Failure-to-Fixture Loop"]
      SPANS["7-Hop Child Spans<br/>1.SBC 2.VAD 3.STT 4.MCP 5.LLM 6.TTS 7.RTP"]
      OBS["Azure Monitor / Arize Phoenix / Langfuse<br/>P50/P95 Perceived Latency Flamegraph (MTTR 90s)"]
      LOOP["Failure-to-Fixture Redaction Pipeline<br/>Failed Live Calls -> Next-Day CI Suite"]
      AGENT --> SPANS --> OBS --> BREAKER
      OBS --> LOOP --> SIM
    end
```

### 3.3 500-Call Acoustic CI Gate, 10% Sticky Canary & `<15s` Auto-Rollback Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer PR (Prompt / TTS Update)
    participant CI as 500-Call Acoustic CI (Coval/Foundry)
    participant GW as Call-ID Sticky Canary Router
    participant Orch as Voice Orchestrator (7-Hop OTel)
    participant Obs as Acoustic Circuit Breaker (Phoenix/Monitor)

    Dev->>CI: 1. Trigger GitHub Actions Acoustic Regression Suite
    CI->>CI: 2. Execute 500 parallel noisy/barge-in calls (4.2 min, $18.50)
    CI-->>Dev: 3. Pass: TSR=97.2%, Barge-In Stop=185ms, Violations=0%
    Dev->>GW: 4. Launch 10% Call-ID Sticky Canary (Snapshot v2.4)
    GW->>Orch: 5. Pin new calls by Call-ID hash to v2.4 (zero mid-call switching)
    Orch->>Obs: 6. Stream 7-Hop OTel Spans + Repeat-Utterance / Barge-In metrics
    Note over Obs: Alert: Regional dialect cohort shows<br/>Repeat-Utterance Rate = 14.8% (>12% limit)!
    Obs->>GW: 7. Fire <15s Auto-Rollback Command (Revert 100% to LKG v2.3)
    GW->>GW: 8. Route all new calls to v2.3 & export failed traces to CI fixtures
```

---

## 📊 4. Voice Evaluation & Observability Stack Comparison Matrix

| Evaluation / Observability Stack | Acoustic Channel & Noise Simulation (`8kHz`/SNR/Barge-In) | Tool AST & Business State Assertions | 7-Hop Voice Latency Flamegraph | Live Canary Monitoring & Auto-Rollback | Cost & Time per 500-Call Suite | Best-Fit Enterprise Scenario |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Text-Only Eval Frameworks (`Promptfoo / Ragas / DeepEval`)** | ❌ None (clean static strings only) | ⭐⭐⭐⭐⭐ (Fast JSON/AST schema checks for Tier 1 smoke tests) | ❌ No audio, VAD, or RTP hop visibility | ❌ Offline CI only | `30 sec` / **$0.40** | **Tier 1 Commit Smoke Checks**: Fast prompt syntax & tool schema validation |
| **Managed Voice Eval Platforms (`Coval / Cekura / Roark`)** | ⭐⭐⭐⭐⭐ (Built-in PSTN `8kHz`, café/traffic SNR, accents & barge-in) | ⭐⭐⭐⭐⭐ (Multi-turn Task Success Rate TSR + Acoustic MOS judges) | ⭐⭐⭐⭐⭐ (Synchronized dual-track waveform, overlap & hop breakdown) | ⭐⭐⭐⭐⭐ (Live call sampling + webhook circuit-breaker triggers) | `4.2 min` / **$18.50** | **Enterprise Contact Centers**: Turnkey 500-call acoustic CI/CD with zero infra overhead |
| **Self-Hosted Simulation (`Pipecat / LiveKit Eval` + `Azure AI Foundry Eval`)** | ⭐⭐⭐⭐ (Virtual WebRTC tracks injecting noisy WAVs & barge-in pulses) | ⭐⭐⭐⭐⭐ (Direct assertions on internal state machines & DB transactions) | ⭐⭐⭐⭐ (Standard OpenTelemetry 7-hop span exporter) | ⭐⭐⭐⭐ (Native integration with `Azure Monitor` & API gateways) | `5.0 min` / **$11.20** | **Regulated BFSI / Healthcare Private VPCs**: 100% audio & PII stay inside tenant boundary |
| **LLM Observability Platforms (`Arize Phoenix / Langfuse / LangSmith` + Voice OTel)** | ⚠️ Requires external audio simulator | ⭐⭐⭐⭐⭐ (Deep multi-agent trajectory diffing & prompt versioning) | ⭐⭐⭐⭐⭐ (Full 7-hop flamegraph via `voice.turn.id` custom spans) | ⭐⭐⭐⭐ (Real-time metric alerts triggering gateway rollback APIs) | Usage-based (~**$0.002 / call**) | **Unified Observability Plane**: Single pane of glass for both text and voice agents |

---

## 🧪 5. Quarterly EvalOps & SRE TCO Analysis & 7-Card Benchmark Summary

### 5.1 Quarterly TCO Comparison (10M Minutes/Month Platform · 3 Releases/Week = 36 Releases/Quarter)

| Cost & Quality Dimension | Option A: Text Evals + Manual QA Dialing + Siloed Logs | Option B: 500-Call Acoustic CI + 7-Hop OTel + Sticky Canary (Recommended) | Net Engineering & Financial Gain |
| :--- | :--- | :--- | :--- |
| **Regression Testing Cost & Time** | Manual QA dialing (150 calls) takes `3 days` / `$4,200` (**`$151,200 / qtr`**) | 500 parallel acoustic calls take **`4.2 min` / `$18.50`** (**`$666 / qtr`**) | **`-99.6%` testing cost; `1,000x` faster release cycle** |
| **Escaped Acoustic Defect Rate** | `23.4%` (VAD cutoffs, noisy digit errors, TTS prosody bugs missed) | **`0.72%`** (caught pre-merge under `5dB SNR` & barge-in simulation) | **`-96.9%` escaped production voice defects** |
| **Slow-Call Root-Cause MTTR** | `4.5 hrs / incident` across 4 teams (**`$48,000 / qtr`** SRE engineering time) | **`90 sec / incident`** via 7-hop `voice.turn.id` flamegraph (**`$1,600 / qtr`**) | **`-96.7%` MTTR reduction** |
| **Bad Release Blast Radius & Credits** | `38 min` manual detection/rollback (**`$52,000 / qtr`** SLA credits & overtime) | **`< 15 sec` automatic LKG rollback** (**`< $2,800 / qtr`**) | **`-94.6%` production incident blast radius** |
| **Total Quarterly Quality & SRE Cost** | **`$251,200 / quarter`** | **`$5,066 / quarter`** | **Saves `$246,134` (`~$246k`) per quarter** |

```chart
{
  "data": {
    "values": [
      { "metric": "Regression QA Cost ($k/qtr)", "Architecture": "Manual QA + Siloed Logs", "Value": 151.2 },
      { "metric": "Regression QA Cost ($k/qtr)", "Architecture": "500-Call Acoustic CI + 7-Hop OTel", "Value": 0.7 },
      { "metric": "Slow-Call War-Room SRE Cost ($k/qtr)", "Architecture": "Manual QA + Siloed Logs", "Value": 48.0 },
      { "metric": "Slow-Call War-Room SRE Cost ($k/qtr)", "Architecture": "500-Call Acoustic CI + 7-Hop OTel", "Value": 1.6 },
      { "metric": "Release Incident SLA Cost ($k/qtr)", "Architecture": "Manual QA + Siloed Logs", "Value": 52.0 },
      { "metric": "Release Incident SLA Cost ($k/qtr)", "Architecture": "500-Call Acoustic CI + 7-Hop OTel", "Value": 2.8 }
    ]
  },
  "semantic_types": {
    "metric": "Category",
    "Architecture": "Name",
    "Value": "Amount"
  },
  "chart_spec": {
    "chartType": "Grouped Bar Chart",
    "title": "Automated Acoustic CI/CD & 7-Hop OTel Flamegraphs Save $246k per Quarter",
    "subtitle": "Quarterly Cost in USD Thousands across 36 Production Releases (3 Releases/Week)",
    "encodings": {
      "x": "metric",
      "y": "Value",
      "group": "Architecture",
      "color": "Architecture"
    }
  }
}
```

### 5.2 7-Card 4:5 Benchmark Report Summary

| Card | Headline-as-Finding | Key Quantitative Evidence (`Measured` / `Reported`) |
| :--- | :--- | :--- |
| **Card 1 (`1/7` · `OVERVIEW`)** | **500-Call Acoustic Simulation CI Catches `96.9%` of Voice Bugs Missed by Text Evals in `4.2m`** | Costs `$18.50/run` across `8kHz G.711`, `5dB SNR` noise, and mid-sentence barge-in |
| **Card 2 (`2/7` · `SCENARIO`)** | **Noisy `5dB SNR` Taxi Caller Self-Correction Exposes Premature `400ms` VAD Cutoff Pre-Merge** | Semantic EoU tuning lifts multi-digit card capture accuracy to `99.1%` |
| **Card 3 (`3/7` · `MATRIX`)** | **Text Evals vs Manual QA vs Managed Acoustic CI (`Coval/Cekura/Roark`) vs Foundry Harness** | Compresses release validation from `3 days` to `4.2 minutes` with `100%` AST tool verification |
| **Card 4 (`4/7` · `PROTOCOL`)** | **`ENTERPRISE-VOICE-EVALOPS-ACOUSTIC-CI-OTEL-CANARY-2026-01` Guardrail Contract** | Blocks releases missing 500-call acoustic CI or 7-hop OTel spans; auto-rolls back in `<15s` |
| **Card 5 (`5/7` · `ROBUSTNESS`)** | **7-Hop `voice.turn.id` Flamegraph Cuts Slow-Call Root-Cause MTTR from `4.5h` to `90s`** | Isolates `VAD EoU (180ms)`, `LLM TTFT (245ms)`, and `TTS First-Byte (95ms)` per turn |
| **Card 6 (`6/7` · `LATENCY`)** | **3-Metric Acoustic Circuit Breaker Reverts Regressed Canary Releases to LKG in `<15s`** | Detects `>12%` repeat utterances and `>+4%` transfer spikes even when HTTP returns `200 OK` |
| **Card 7 (`7/7` · `MY TAKE`)** | **Good Fit vs Not For: Mandatory for Weekly-Release Production Contact Centers** | Internal static demos only need Tier 1 text checks; customer-facing voice requires full EvalOps |

---

## 🛠️ 6. Presales & Production Acceptance Checklist

- [ ] **1. 500-Call Multi-Persona Acoustic Simulation CI Gate**: Does every PR run `500` parallel simulated voice calls covering `8kHz G.711` compression, `5dB SNR` background noise, regional accents, mid-sentence pauses, and barge-in self-corrections—requiring `TSR >= 96.0%` and `0.00%` policy violations before merge?
- [ ] **2. Dual Audio + Transcript AST Judges**: Are both acoustic metrics (**barge-in stop latency `<= 220ms`, overlap rate `< 1.5%`, TTS digit intelligibility**) and deterministic tool argument AST bindings verified automatically?
- [ ] **3. 7-Hop OpenTelemetry (`voice.turn.id`) Flamegraph Instrumentation**: Does the orchestrator emit a unified `voice.turn.id` parent span with all 7 child spans (`1.SBC/WebRTC → 2.VAD EoU → 3.STT Final → 4.RAG/MCP → 5.LLM TTFT → 6.TTS First-Chunk → 7.Downlink RTP`) plus filler-masking tags?
- [ ] **4. Call-ID Sticky Canary Routing (Zero Mid-Call Config Drift)**: Are canary weights (`1% → 10% → 50%`) bound strictly at call initiation via `Call-ID` consistent hashing so no active call ever switches prompt, model, or TTS voice mid-conversation?
- [ ] **5. 3-Metric `<15s` Auto-Rollback Breaker & Failure-to-Fixture Loop**: Does the gateway automatically revert to `LKG` within `<15 seconds` if rolling 50-call **Repeat-Utterance Rate (`>12%`), Frustrated Barge-In Rate (`>28%`), or Emergency Human-Transfer Delta (`>+4%`)** breaches threshold, while auto-converting failed calls into redacted CI fixtures?
