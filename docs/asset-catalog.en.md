# Voice Agent Technical Asset Catalog & Bilingual Presales Index

> 🌐 **Language / 语言切换**: **[中文版 (`docs/asset-catalog.md`)](./asset-catalog.md)** | **English (Current)** · **[Back to Home (`README.en.md`)](../README.en.md)** · **[中文首页 (`README.md`)](../README.md)**
>
> **Scope**: Indexes all enterprise Voice Agent deliverables across `turbo998/voice-agent-lab`, `turbo998/gpt-live-1-demo`, `turbo998/benchmark-harness-engineering`, and live Azure environments, maintained in both **Chinese and English**.

---

## 1. Live Interactive Portals & Executive Decks

| Asset Name | Format | Live URL / Path | Description |
| :--- | :--- | :--- | :--- |
| **Enterprise Voice Agent Presales & Sandbox Portal** | 🌐 Trilingual H5 (`zh-CN` / `zh-TW` / `en`) | `https://turbo998.github.io/voice-agent-lab/` (`site/index.html`) | **20 Vertical Scenarios (`S1–S20`)**, 4 Reference Architectures, 7 Competitor Battlecards, **96 Live POC Trap Probes (`A01–P78`)**, Latency Waterfall Analyzer, and FinOps TCO + PTU/PAYGO Burst Calculator. |
| **12-Slide Azure Executive Briefing Deck** | 📽️ 16:9 HTML Deck | `https://turbo998.github.io/voice-agent-lab/deck.html` (`site/deck.html`) | 12-slide executive presentation with bilingual headings, keyboard navigation, and print-to-PDF support. |
| **7-Card 4:5 Visual Benchmark Report** | 📊 7-Card Visual Deck | `https://turbo998.github.io/voice-agent-lab/benchmark-cards.html` (`site/benchmark-cards.html`) | 7-card 4:5 portrait evaluation report backed by sealed JSON telemetry (`site/data/voice-agent-benchmark-report.json`). |
| **GPT-Live (`gpt-live-1`) Partner Engineering Training Portal** | 🎓 Trilingual H5 | `https://turbo998.github.io/gpt-live-1-demo/training.html` | 6 engineering modules, 3 high-res architecture diagrams, FinOps calculator, and partner certification quiz. |

---

## 2. Bilingual Documentation Pairings (`main` Branch)

| Topic | Chinese Document (`中文`) | English Document (`English`) | Core Coverage |
| :--- | :--- | :--- | :--- |
| **Repository Overview & Quickstart** | [`README.md`](../README.md) | [`README.en.md`](../README.en.md) | Architecture overview, live portal links, 87 deterministic guardrails summary, and test commands. |
| **Solution Architecture & 87 Guardrails** | [`docs/solution-architecture.md`](./solution-architecture.md) | [`docs/solution-architecture.en.md`](./solution-architecture.en.md) | Paradigms A–D, PSTN/SIP vs. WebRTC Opus, `turnEpoch` state machine, and Sections 4.10–4.50 (`T07`–`P78`). |
| **Competitive Analysis & Battlecards** | [`docs/competitive-analysis.md`](./competitive-analysis.md) | [`docs/competitive-analysis.en.md`](./competitive-analysis.en.md) | Sierra AI, Retell AI, ElevenLabs, Vapi/LiveKit, AWS Nova Sonic & 40-row guardrail migration table. |
| **Presales Playbook & 96 POC Trap Probes** | [`docs/presales-playbook.md`](./presales-playbook.md) | [`docs/presales-playbook.en.md`](./presales-playbook.en.md) | 5-dimensional discovery, competitor trap questions, 2-week POC rubric, and 96 live POC probes (`A01–P78`). |
| **20 Vertical Business Scenarios & ROI** | [`docs/business-scenarios.md`](./docs/business-scenarios.md) | [`docs/business-scenarios.en.md`](./business-scenarios.en.md) | Scenarios `S1–S20` call flows, deterministic guardrails, and TCO/ROI models. |
| **Technical Asset Catalog** | [`docs/asset-catalog.md`](./asset-catalog.md) | [`docs/asset-catalog.en.md`](./asset-catalog.en.md) | Full cross-repository index of whitepapers, code packages, Bicep IaC, and unit test suites (`P73-TELEHEALTH-DEA-EPCS-CONTROLLED-SUBSTANCE-REFILL-GUARD`, `P74-WEBRTC-MDNS-LOCAL-IP-LEAK-AND-SDP-CANDIDATE-SANITIZER-GUARD`, `P75-AVIATION-ATFM-NOTAM-RUNWAY-READBACK-HEARBACK-GUARD`, `P76-VOICE-BIOMETRIC-BIPA-WRITTEN-CONSENT-AND-RETENTION-GUARD`, `P77-UTILITY-WINTER-MORATORIUM-LIFE-SUPPORT-SHUTOFF-GUARD`, `P78-RTP-JITTER-BUFFER-UNDERRUN-CLOCK-DRIFT-RESYNC-GUARD`). |
