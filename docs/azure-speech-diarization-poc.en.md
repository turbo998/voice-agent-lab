# 🎙️ Azure Speech Fast Transcription Speaker Diarization & Stereo Channel Attribution PoC Report

> 🌐 **Language / 语言切换**: **[中文 (`docs/azure-speech-diarization-poc.md`)](./azure-speech-diarization-poc.md)** | **[English (Current)](./azure-speech-diarization-poc.en.md)** · **[Back to Home (`README.en.md`)](../README.en.md)** · **[中文首页 (`README.md`)](../README.md)**

---

## ⚡ 1. Executive Summary

Accurate speaker attribution is a foundational requirement for contact-center quality assurance, regulated dual-recording (`WM-DUAL-01`), and post-call LLM summarization.

Evaluating a 5-file customer dataset of **8 kHz, 16-bit PCM stereo WAV recordings**, we built a reproducible verification harness in [`experiments/azure-speech-diarization-poc/`](../experiments/azure-speech-diarization-poc/) and published the standalone repository **[`turbo998/azure-speech-diarization-poc`](https://github.com/turbo998/azure-speech-diarization-poc)**:

1. **Diagnosed & Resolved the `azure-ai-transcription==1.0.0` Wire Serialization Bug**: Passing `TranscriptionDiarizationOptions(max_speakers=2)` alone serializes `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}` without `"enabled": true`, resulting in `0/8` (`0.0%`) speaker-labeled phrases. Explicitly setting `diarization.enabled = True` restores **`8 / 8` (`100.0%`)** speaker labeling on the official two-speaker control sample across Speakers `1` and `2` (mean confidence **`0.9267`**, `RTF = 0.304`).
2. **100% Speaker Coverage & 100% Stereo Channel Agreement on Longest Customer Call (`customer-file-02.wav`, `224.8s`)**: Combining `diarization.enabled = True` with `--locale auto` (auto-identifying `es-ES`) achieves **`28 / 28` (`100.0%`)** speaker-labeled phrases across 2 speakers in `12.85s` (**`RTF = 0.0572`**, **17.5× faster than real time**). Comparing mono downmix diarization (`Experiment B`) against physical stereo channel transcription (`Experiment A`) across **`33.75s`** (`33,750 ms`) of non-overlapping speech yields **`100.0%` agreement** (`Speaker 1 → Channel 1`, `Speaker 2 → Channel 0`).
3. **Speaker-Ceiling Sensitivity (`Experiment C`) & Signal Triage Gates**: Raising `maxSpeakers` to `3` and `4` on `customer-file-02.wav` maintains `28/28` (`100%`) coverage and stably detects `2` speakers (`RTF = 0.0543`) with zero false speaker splitting. Silent recordings (`file-03`, `file-04`) and low-confidence audio (`file-05`, `0.2158`) are isolated by preflight and abstention gates rather than misclassified as diarization passes.

- 📊 **7-Card (4:5) Visual Benchmark Report**: [`site/diarization-benchmark-cards.html`](../site/diarization-benchmark-cards.html) · [Live Deck (`https://turbo998.github.io/voice/diarization-benchmark-cards.html`)](https://turbo998.github.io/voice/diarization-benchmark-cards.html)
- 📦 **Standalone Public Repository**: [`https://github.com/turbo998/azure-speech-diarization-poc`](https://github.com/turbo998/azure-speech-diarization-poc)
- 🧪 **Lab Source & Sanitized Evidence**: [`experiments/azure-speech-diarization-poc/`](../experiments/azure-speech-diarization-poc/)

---

## 🔬 2. Wire-Format Comparison (Before vs. After Fix)

| Dimension | Before Fix (`before-fix`) | After Fix (`after-fix`) | Evidence Artifact |
| :--- | :--- | :--- | :--- |
| **SDK Construction** | `TranscriptionDiarizationOptions(max_speakers=2)` | Plus `diarization.enabled = True` | `speech_poc/azure_client.py` |
| **Serialized `definition` JSON** | `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}` | `{"locales":["en-US"],"diarization":{"maxSpeakers":2,"enabled":true}}` | `evidence/official-control/*/request-definition.json` |
| **Official 2-Speaker Control (`29.4875s`)** | `8` phrases, `0` speaker-labeled (**`0.0%`**), `0` speakers | `8` phrases, **`8` speaker-labeled (`100.0%`)**, speakers `[1, 2]` | `evidence/official-control/*/summary.json` |
| **Mean Confidence & RTF** | `0.9255` · `8.268s` (`RTF = 0.2804`) | **`0.9267`** · `8.967s` (`RTF = 0.3041`) | `evidence/official-control/*/summary.json` |

---

## 📊 3. 5-File Customer Cohort Evaluation Matrix (Sanitized Metrics)

| File ID | Duration | Detected Locale (`--locale auto`) | Phrases | Speaker Coverage | Speakers Detected | Mean Confidence | Real-Time Factor (`RTF`) | Stereo Channel Agreement (`Exp A vs B`) | Gating Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`customer-file-01.wav`** | `147.50s` | `es-ES` | `1` | `100.0%` (`1/1`) | `[1]` (1 spk) | `0.7560` | `0.0274` (`4.04s`) | Single phrase; skipped | `Confirm` (Single-speaker) |
| **`customer-file-02.wav`** | **`224.80s`** | **`es-ES`** | **`28`** | **`100.0%` (`28/28`)** | **`[1, 2]` (2 spk)** | **`0.6028`** | **`0.0572` (`12.85s`)** | **`100.0%`** (`33,750 ms` eligible, `1→Ch1, 2→Ch0`) | **`Act automatically`** |
| **`customer-file-03.wav`** | `126.28s` | `[]` | `0` | `null` (`0` phrases) | `[]` (0 spk) | `null` | `0.0205` (`2.59s`) | No speech segments | `Send to a human` (Silent/Noise) |
| **`customer-file-04.wav`** | `116.92s` | `[]` | `0` | `null` (`0` phrases) | `[]` (0 spk) | `null` | `0.0224` (`2.62s`) | No speech segments | `Send to a human` (Silent/Noise) |
| **`customer-file-05.wav`** | `108.28s` | `en-US, es-ES` | `2` | `100.0%` (`2/2`) | `[1, 2]` (2 spk) | `0.2158` | `0.0262` (`2.84s`) | Low confidence (`<0.50`) | `Send to a human` (Low SNR) |
