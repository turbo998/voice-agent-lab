# VoxCPM2 48 kHz 声学频谱实证与量化残差消融实验套件（Reproducible DSP Benchmark）

> **Language / 语言切换**: **[中文 (当前)](README.md)** | **[English (`README.en.md`)](README.en.md)**
> **配套资产 (Related Deliverables)**: [中英双语架构选型指南 (`docs/voxcpm2-vs-azure-speech-tts-benchmark-selection-faq.md`)](../../docs/voxcpm2-vs-azure-speech-tts-benchmark-selection-faq.md) · [混合路由与频谱架构图 (`docs/assets/voxcpm2-vs-azure-speech-architecture.svg`)](../../docs/assets/voxcpm2-vs-azure-speech-architecture.svg) · [7-Card 视觉评测报告 (`site/voxcpm2-benchmark-cards.zh-CN.html`)](../../site/voxcpm2-benchmark-cards.zh-CN.html) · [交互式混合语音路由与 TCO 测算台 (`site/voxcpm2-workbench.html`)](../../site/voxcpm2-workbench.html)

---

## 一、实验目标与工程背景

本实验套件提供零第三方依赖的纯 Python 数字信号处理（DSP）评估管线（`run_benchmark.py`），用于对清华大学 OpenBMB 开源的 **VoxCPM2（2B 参数连续隐空间扩散自回归语音基座，`arXiv:2606.06928`）** 官方发布的 **11 组多场景参考与合成音频（`OpenBMB/voxcpm2-demopage`）** 进行可复现的物理频谱测量与量化信噪失真比（SDR）消融验证：

1. **验证非对称 `AudioVAE V2`（`16 kHz 输入 -> 48 kHz 重建`）的真实超宽带频谱能量分布**：区分“空插值升采样（12 kHz 以上无能量）”与“生成式高频空气感重建（12–24 kHz 齿擦音与呼吸谐波）”。
2. **验证 `6.25 Hz`（`P=4` 帧聚合）块级自回归步长的物理时长量化特征**：检验所有 VoxCPM2 48 kHz 输出文件时长是否严格对齐 `N × 160 ms`（`7,680` 采样点整数倍）。
3. **验证半离散 `FSQ (dim=512, scale=9)` + 连续残差旁路（`RALM + LocDiT`）相对于纯离散瓶颈的失真抑制增益**：定量测算元音浊音帧（Voiced Frames）与低幅高频清音/耳语呼吸帧（Unvoiced / Whisper Frames）的信噪失真比（SDR）。

---

## 二、测试样本矩阵（11 组官方音频）

密封结果文件 `voxcpm2_acoustic_benchmark_results.json` 收录了以下 11 组官方 WAV 样本的实测指标（仓库不提交二进制大体积音频文件，仅保留脱敏确定性测量结果与复现脚本）：

| 样本文件名 | 场景类别 | 采样率 / Nyquist | 时长 (`s`) | `16–24 kHz` 频段功率 | `-52 dB` 有效带宽 (`f_eff`) | 清音/呼吸帧占比 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `style_prompt1.wav` | 24 kHz 原始克隆参考输入 | 24 kHz / 12 kHz | `6.538s` | `null`（受限于 12k 奈奎斯特） | `11,625 Hz` | `23.9%` |
| `style_result1_1.wav` | 可控克隆输出（指令：焦急加速） | 48 kHz / 24 kHz | `2.880s` (`18×0.16s`) | **`-47.64 dB`** | **`17,672 Hz`** | `20.8%` |
| `style_result1_2.wav` | 可控克隆输出（指令：冷静放缓） | 48 kHz / 24 kHz | `4.320s` (`27×0.16s`) | **`-48.96 dB`** | **`17,391 Hz`** | `11.6%` |
| `vd_emotion_grief.wav` | 零参考声音设计（悲伤哽咽） | 48 kHz / 24 kHz | `7.360s` (`46×0.16s`) | `-51.93 dB` | **`17,578 Hz`** | `11.7%` |
| `vd_acoustic_asmr.wav` | 零参考声音设计（近讲耳语 ASMR） | 48 kHz / 24 kHz | `12.640s` (`79×0.16s`) | `-57.01 dB` | `14,859 Hz` | `7.8%` |
| `ref_speaker.wav` | 48 kHz 高保真说话人参考样本 | 48 kHz / 24 kHz | `12.800s` (`80×0.16s`) | `-60.61 dB` | `17,250 Hz` | `9.1%` |
| `zh_cn.wav` | 标准普通话基准合成 | 48 kHz / 24 kHz | `12.000s` (`75×0.16s`) | `-59.43 dB` | `14,250 Hz` | `9.7%` |
| `minnan.wav` | 方言合成（闽南语） | 48 kHz / 24 kHz | `25.600s` (`160×0.16s`) | `-66.39 dB` | `16,172 Hz` | `9.5%` |
| `yue.wav` | 方言合成（粤语） | 48 kHz / 24 kHz | `20.640s` (`129×0.16s`) | `-83.01 dB` | `16,078 Hz` | `6.9%` |
| `dongbei.wav` | 方言合成（东北官话） | 48 kHz / 24 kHz | `9.120s` (`57×0.16s`) | `-70.80 dB` | `15,000 Hz` | `18.4%` |
| `voxcpm_example.wav` | 上一代基线（VoxCPM 1.5） | 44.1 kHz / 22.05 kHz | `8.158s` | `-92.08 dB`（高频截止） | `10,034 Hz` | `18.4%` |

---

## 三、DSP 测量协议与量化消融方法

1. **1024 点 Hann 窗 Welch 功率谱密度（PSD）估计**：
   - 采用纯 Python 迭代式基-2 Cooley-Tukey FFT（`N_FFT = 1024`，50% 帧移重叠，48 kHz 下频率分辨率 `46.875 Hz/bin`），自动剔除低于全局均值 `-22 dB` 的静音帧。
   - 按 `80–4k`、`4–8k`、`8–12k`、`12–16k` 及 `16–23.9k` 超宽带计算频段平均功率谱密度（dB），并求解同时报告 `95%`/`99.5%` 滚降频率与相对于谱峰 `-52 dB` 门限的物理有效带宽上限 `f_eff`。
2. **清音/呼吸帧 vs. 元音浊音帧量化消融（`quantization_ablation`）**：
   - 将 20 ms 语音帧按能量与过零率（`ZCR > 1600 Hz` 且幅值位于低能量区间）划分为浊音帧与清音/呼吸帧。
   - 对比粗粒度 4-bit 均匀离散瓶颈与 `FSQ(scale=9, round(tanh(x)*9)/9)` + 连续残差补偿（模拟 `RALM + LocDiT` 连续潜变量恢复）的逐帧重构 SDR：在 `style_result1_1.wav` 上，纯离散路径在清音呼吸帧产生 **`7.13 dB`** 的信噪比跌落（`23.25 dB -> 16.12 dB`），而半离散 FSQ + 连续残差路径将清音呼吸帧 SDR 提升至 **`50.88 dB`**（净增益 **`+34.76 dB`**）。

---

## 四、本地快速验证与复现命令

脚本仅使用 Python 3.10+ 标准库（`math`、`cmath`、`struct`、`json`、`argparse`），无需安装 `numpy`、`scipy` 或 `librosa`：

```powershell
# 1. 查看命令行参数说明
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --help

# 2. 离线校验密封的 11 组官方样本指标不变量 + 运行 48 kHz 合成信号 DSP 单元测试
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --verify-sealed

# 3. 对本地下载的 OpenBMB/voxcpm2-demopage WAV 目录重新运行全量频谱与消融分析
python experiments/voxcpm2-acoustic-benchmark/run_benchmark.py --wav-dir ./wav_samples --output ./custom_results.json
```
