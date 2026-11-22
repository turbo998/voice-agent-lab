# VoxCPM2 48 kHz Acoustic Spectrum & Quantization Ablation Suite (Reproducible DSP Benchmark)

> **Language / 语言切换**: **[中文 (`README.md`)](README.md)** | **[English (Current)](README.en.md)**
> **Related Deliverables**: [Bilingual SA Selection Guide (`docs/voxcpm2-vs-azure-speech-tts-benchmark-selection-faq.en.md`)](../../docs/voxcpm2-vs-azure-speech-tts-benchmark-selection-faq.en.md) · [Hybrid Architecture & Spectrum SVG (`docs/assets/voxcpm2-vs-azure-speech-architecture.svg`)](../../docs/assets/voxcpm2-vs-azure-speech-architecture.svg) · [7-Card Visual Benchmark Deck (`site/voxcpm2-benchmark-cards.html`)](../../site/voxcpm2-benchmark-cards.html) · [Interactive Hybrid Speech Router & TCO Workbench (`site/voxcpm2-workbench.html`)](../../site/voxcpm2-workbench.html)

---

## 1. Purpose & Engineering Scope

This directory provides a zero-dependency, pure-Python Digital Signal Processing (DSP) reproducibility suite (`run_benchmark.py`) evaluating Tsinghua University OpenBMB's **VoxCPM2 (2B-parameter continuous-latent diffusion-autoregressive speech model, `arXiv:2606.06928`)** across **11 official reference and synthesized WAV samples** from `OpenBMB/voxcpm2-demopage`:

1. **Asymmetric `AudioVAE V2` (`16 kHz Encode -> 48 kHz Decode`) Bandwidth Verification**: Distinguishes empty upsampling (brick-wall cutoff at 8–12 kHz) from genuine generative super-resolution across `12–24 kHz` sibilants and breath harmonics.
2. **Physical `6.25 Hz` (`P=4`) Patch Quantization Audit**: Verifies that every 48 kHz VoxCPM2 output duration aligns strictly to an integer multiple of `160 ms` (`7,680` PCM samples per autoregressive step).
3. **Semi-Discrete `FSQ (dim=512, scale=9)` + Continuous Residual SDR Ablation**: Measures frame-level Signal-to-Distortion Ratio (SDR) across high-energy voiced vowels versus low-amplitude, high-zero-crossing unvoiced/whisper frames (`voxcpm2.py:258,345`).

---

## 2. Evaluated Sample Matrix (11 Official WAVs)

`voxcpm2_acoustic_benchmark_results.json` seals empirical measurements across 11 official WAV files (raw binary WAVs are omitted from Git to keep the repository lightweight and deterministic):

| Sample File | Category | Sample Rate / Nyquist | Duration (`s`) | `16–24 kHz` Band PSD | `-52 dB` Effective BW (`f_eff`) | Unvoiced / Breath Ratio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `style_prompt1.wav` | 24 kHz Cloning Reference Input | 24 kHz / 12 kHz | `6.538s` | `null` (12 kHz Nyquist limit) | `11,625 Hz` | `23.9%` |
| `style_result1_1.wav` | Controllable Clone (Urgent / Faster) | 48 kHz / 24 kHz | `2.880s` (`18×0.16s`) | **`-47.64 dB`** | **`17,672 Hz`** | `20.8%` |
| `style_result1_2.wav` | Controllable Clone (Calm / Measured) | 48 kHz / 24 kHz | `4.320s` (`27×0.16s`) | **`-48.96 dB`** | **`17,391 Hz`** | `11.6%` |
| `vd_emotion_grief.wav` | Voice Design (Sorrowful / Choked) | 48 kHz / 24 kHz | `7.360s` (`46×0.16s`) | `-51.93 dB` | **`17,578 Hz`** | `11.7%` |
| `vd_acoustic_asmr.wav` | Voice Design (Close-Mic Whisper ASMR) | 48 kHz / 24 kHz | `12.640s` (`79×0.16s`) | `-57.01 dB` | `14,859 Hz` | `7.8%` |
| `ref_speaker.wav` | 48 kHz Studio Reference Speaker | 48 kHz / 24 kHz | `12.800s` (`80×0.16s`) | `-60.61 dB` | `17,250 Hz` | `9.1%` |
| `zh_cn.wav` | Standard Mandarin Baseline | 48 kHz / 24 kHz | `12.000s` (`75×0.16s`) | `-59.43 dB` | `14,250 Hz` | `9.7%` |
| `minnan.wav` | Chinese Dialect (Southern Min / Hokkien) | 48 kHz / 24 kHz | `25.600s` (`160×0.16s`) | `-66.39 dB` | `16,172 Hz` | `9.5%` |
| `yue.wav` | Chinese Dialect (Cantonese) | 48 kHz / 24 kHz | `20.640s` (`129×0.16s`) | `-83.01 dB` | `16,078 Hz` | `6.9%` |
| `dongbei.wav` | Chinese Dialect (Northeastern Mandarin) | 48 kHz / 24 kHz | `9.120s` (`57×0.16s`) | `-70.80 dB` | `15,000 Hz` | `18.4%` |
| `voxcpm_example.wav` | Prior Generation Baseline (VoxCPM 1.5) | 44.1 kHz / 22.05 kHz | `8.158s` | `-92.08 dB` (HF roll-off) | `10,034 Hz` | `18.4%` |

---

## 3. DSP Protocol & Quantization Ablation Methodology

1. **1024-Point Hann-Windowed Welch PSD Estimation**:
   - Uses an iterative Radix-2 Cooley-Tukey FFT (`N_FFT = 1024`, 50% overlap, `46.875 Hz/bin` resolution at 48 kHz) excluding silence frames below `global_rms_dbfs - 22 dB`.
   - Computes mean sub-band PSD across `80–4k`, `4–8k`, `8–12k`, `12–16k`, and super-wideband `16–23.9k Hz`, reporting `95%` / `99.5%` cumulative roll-off frequencies alongside the `-52 dB` spectral-floor effective bandwidth `f_eff`.
2. **Voiced vs. Unvoiced/Whisper Quantization Ablation (`quantization_ablation`)**:
   - Segments active 20 ms frames into voiced vowels vs. low-amplitude high-ZCR (`> 1600 Hz`) unvoiced/whisper frames.
   - Compares a coarse 4-bit uniform discrete bottleneck against `FSQ(scale=9, round(tanh(x)*9)/9)` paired with continuous residual refinement (`RALM + LocDiT`). On `style_result1_1.wav`, discrete-only quantization suffers a **`7.13 dB`** SDR drop on breath frames (`23.25 dB -> 16.12 dB`), whereas semi-discrete FSQ + continuous residual lifts breath-frame SDR to **`50.88 dB`** (**`+34.76 dB`** gain).

---

## 4. Quick Verification & Reproducibility Commands

Requires only Python 3.10+ standard library modules (`math`, `cmath`, `struct`, `json`, `argparse`):

```powershell
# 1. Inspect CLI options
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --help

# 2. Verify invariants on the sealed 11-WAV JSON and run offline 48 kHz DSP unit checks
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --verify-sealed

# 3. Re-compute metrics from a local directory of OpenBMB/voxcpm2-demopage WAV files
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --wav-dir ./wav_samples --output ./custom_results.json
```
