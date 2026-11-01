# 🎙️ Azure Speech Fast Transcription Speaker Diarization & Stereo Channel Attribution PoC

> 🌐 **Language / 语言切换**: **[中文 (`README.md`)](README.md)** | **[English (Current)](README.en.md)**

---

## ⚡ Executive Summary & Key Findings

This repository provides a reproducible **Azure AI Speech Fast Transcription Speaker Diarization & Stereo Channel Attribution PoC** for partner engineers and enterprise solution architects.

During a customer contact-center PoC involving 8 kHz, 16-bit PCM stereo recordings, we diagnosed and resolved a critical wire-serialization defect in **`azure-ai-transcription==1.0.0`**, and built a 3-stage verification pipeline: **Local PCM Signal Preflight + Official 2-Speaker Control A/B Verification + Three-Way Attribution Experiments (Experiment A: Stereo Channel Transcription vs. Experiment B: Mono Downmix Diarization vs. Experiment C: `maxSpeakers=3/4` Sensitivity)**.

- 📊 **7-Card (4:5) Visual Benchmark Report**: [`benchmark-cards.html`](benchmark-cards.html) (Live on GitHub Pages: [`https://turbo998.github.io/voice/diarization-benchmark-cards.html`](https://turbo998.github.io/voice/diarization-benchmark-cards.html))
- 📘 **Partner Runbook**: **[English (`PARTNER_RUNBOOK.en.md`)](PARTNER_RUNBOOK.en.md)** · **[中文操作手册 (`PARTNER_RUNBOOK.md`)](PARTNER_RUNBOOK.md)**
- 📑 **Executive & Technical Evidence**: [`reports/technical-evidence.md`](reports/technical-evidence.md) · [`reports/executive-report-zh-CN.md`](reports/executive-report-zh-CN.md)

### Summary of Measured Results

| Dimension | Before Fix (`maxSpeakers=2` only) | After Fix (`diarization.enabled=true` + `--locale auto`) | Architectural Takeaway |
| :--- | :--- | :--- | :--- |
| **Wire JSON Definition** | `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}` | `{"locales":["en-US"],"diarization":{"maxSpeakers":2,"enabled":true}}` | `azure-ai-transcription==1.0.0` omits `enabled: true` unless explicitly assigned on the model instance. |
| **Official 2-Speaker Control (`29.49s`)** | `0 / 8` labeled phrases (**`0.0%`** coverage), `RTF = 0.280` | **`8 / 8` labeled phrases (`100.0%` coverage)**, 2 speakers (`1, 2`), mean confidence **`0.927`**, `RTF = 0.304` | Setting `diarization.enabled = True` restores 100% speaker labeling with negligible (`+0.024` RTF) latency overhead. |
| **Longest Customer Recording (`customer-file-02.wav`, `224.8s`)** | Unlabeled or degraded when locale/flag misconfigured | **`28 / 28` labeled phrases (`100.0%` coverage)**, auto-detected `es-ES`, 2 speakers, mean confidence `0.603`, **`RTF = 0.057`** (**17.5×** faster than real time) | Use `--locale auto` (omits locale array) when recordings may contain Spanish (`es-ES`) or mixed languages. |
| **Speaker Ceiling Sensitivity (`maxSpeakers = 3 / 4`)** | — | Both `maxSpeakers=3` and `maxSpeakers=4` yield **`28 / 28` (`100%`)** labeled phrases and stably detect **2 speakers (`1, 2`)** at `RTF = 0.054` | Raising `maxSpeakers` to 3 or 4 does not cause false speaker splitting on clean two-party calls. |
| **Stereo Channel vs. Diarization Agreement** | — | **`100.0%` speaker-to-channel agreement** across **`33.75s`** (`33,750 ms`) of eligible non-overlapping speech (`Speaker 1 → Ch 1`, `Speaker 2 → Ch 0`) | Keep stereo channel transcription (`Experiment A`) as the deterministic ground-truth baseline whenever split-channel audio is available. |
| **5-File Customer Cohort Triage** | — | `file-02` (`28` phrases, 2 speakers, `100%`), `file-01` (`1` phrase, 1 speaker), `file-05` (`2` low-confidence `0.216` phrases), `file-03/04` (`0` phrases) | Always run local PCM preflight and official control tests to separate SDK wire bugs from silent/sparse audio files. |

---

## 🛠️ Root Cause & One-Line SDK Workaround

In `azure-ai-transcription==1.0.0`, passing `max_speakers` to `TranscriptionDiarizationOptions` does not serialize `"enabled": true` in the multipart `definition` payload. Explicitly setting `diarization.enabled = True` produces the required wire shape:

```python
from azure.ai.transcription.models import (
    TranscriptionContent,
    TranscriptionDiarizationOptions,
    TranscriptionOptions,
)

diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
# SDK 1.0.0 does not serialize the service-required flag automatically.
diarization.enabled = True
options = TranscriptionOptions(diarization_options=diarization)
```

---

## 📂 Repository Contents

| Path | Purpose |
| :--- | :--- |
| [`PARTNER_RUNBOOK.en.md`](PARTNER_RUNBOOK.en.md) / [`PARTNER_RUNBOOK.md`](PARTNER_RUNBOOK.md) | Bilingual step-by-step reproduction guide (Windows PowerShell, Entra RBAC, dry run, official control, customer ZIP) |
| [`EXPECTED_RESULTS.md`](EXPECTED_RESULTS.md) | Acceptance criteria and reference metrics |
| [`reports/technical-evidence.md`](reports/technical-evidence.md) / [`reports/executive-report-zh-CN.md`](reports/executive-report-zh-CN.md) | Technical root-cause report and Chinese executive summary |
| [`benchmark-cards.html`](benchmark-cards.html) | Self-contained **7-Card (4:5) Visual Benchmark Deck** |
| [`evidence/`](evidence/) | Sanitized official-control `before-fix` / `after-fix` JSON payloads and `customer-metrics-sanitized.json` |
| [`speech_poc/`](speech_poc/) & [`tests/`](tests/) | Python CLI package (`audio.py`, `azure_client.py`, `metrics.py`, `pipeline.py`) and 16 unit/regression tests |
| [`infra/`](infra/) | Zero-key Bicep templates (`speech.bicep` with `disableLocalAuth: true` and resource-scoped `Cognitive Services Speech User`) |
| [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md) | Privacy and security boundaries (no audio, no customer transcripts, no secrets or tenant IDs) |

---

## 🚀 Quick Verification (Offline Unit & Regression Suite)

```powershell
python -m unittest discover -s tests -v
```
