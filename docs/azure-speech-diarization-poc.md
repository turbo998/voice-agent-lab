# 🎙️ Azure Speech Fast Transcription 说话人分离（Speaker Diarization）与双声道归属一致性 PoC 报告

> 🌐 **Language / 语言切换**: **[中文 (当前)](./azure-speech-diarization-poc.md)** | **[English (`docs/azure-speech-diarization-poc.en.md`)](./azure-speech-diarization-poc.en.md)** · **[返回首页 (`README.md`)](../README.md)** · **[English Home (`README.en.md`)](../README.en.md)**

---

## ⚡ 1. 执行摘要（Executive Summary）

在企业联络中心（Contact Center）与合规双录（Dual-Recording）场景中，**“坐席与客户角色归属（Speaker Attribution）”** 是影响质检合规率、情绪分析与下游 LLM 摘要准确度的核心地基。

针对客户提供的 **8 kHz、16-bit PCM 双声道录音数据集（5 个 WAV 文件）**，我们在本实验室（[`experiments/azure-speech-diarization-poc/`](../experiments/azure-speech-diarization-poc/)）及独立公开仓 **[`turbo998/azure-speech-diarization-poc`](https://github.com/turbo998/azure-speech-diarization-poc)** 中完成了端到端根因定位与三组对比实验：

1. **定位并修复 Python SDK `azure-ai-transcription==1.0.0` 序列化缺陷**：发现仅设置 `TranscriptionDiarizationOptions(max_speakers=2)` 时，SDK 生成的 multipart `definition` 为 `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}`，缺失了服务端必需的 `"enabled": true` 开关，导致服务端返回 `0/8`（`0.0%`）说话人标签。显式追加 `diarization.enabled = True` 后，官方双人控制样本恢复 **`8 / 8`（`100.0%`）** 说话人标签覆盖（识别出 Speaker `1` 与 `2`，平均置信度 **`0.9267`**，`RTF = 0.304`）。
2. **最长双声道客户录音（`customer-file-02.wav`，`224.8s`）100% 分离与声道对齐**：配合 `--locale auto`（自动识别为西班牙语 `es-ES`），单声道混音说话人分离（Experiment B）实现 **`28 / 28`（`100.0%`）** 语句标签覆盖，识别出 `2` 名说话人，处理耗时仅 `12.85s`（**`RTF = 0.0572`**，快于实时 **17.5 倍**）。与双声道物理分轨转写（Experiment A）在 **`33.75 秒`**非重叠可比语音区间内进行最优二分图匹配，**声道与说话人归属一致率达 `100.0%`**（`Speaker 1 → Channel 1`，`Speaker 2 → Channel 0`）。
3. **说话人上限敏感度与音频质量门禁（Experiment C）**：将 `maxSpeakers` 放宽至 `3` 和 `4` 时，`customer-file-02.wav` 依然稳定输出 `2` 名说话人（`28/28` 覆盖，`RTF = 0.0543`），零过分割（Zero Over-clustering）。同时通过本地 PCM 预检将静音/无有效语音样本（`file-03`、`file-04`）和低置信度短样本（`file-05`，`0.2158`）精准路由至人工复核，避免将音频源问题误判为 SDK/模型故障。

- 📊 **7-Card (4:5) 视觉基准评测报告**：[`site/diarization-benchmark-cards.html`](../site/diarization-benchmark-cards.html) · [在线查看 (`https://turbo998.github.io/voice/diarization-benchmark-cards.html`)](https://turbo998.github.io/voice/diarization-benchmark-cards.html)
- 📦 **独立公开代码仓**：[`https://github.com/turbo998/azure-speech-diarization-poc`](https://github.com/turbo998/azure-speech-diarization-poc)
- 🧪 **本仓实验源码与证据包**：[`experiments/azure-speech-diarization-poc/`](../experiments/azure-speech-diarization-poc/)

---

## 🔬 2. 协议层根因对比（Before vs. After Fix）

| 对照项 | 修复前（`before-fix`） | 修复后（`after-fix`） | 证据路径 |
| :--- | :--- | :--- | :--- |
| **SDK 调用方式** | `TranscriptionDiarizationOptions(max_speakers=2)` | 追加 `diarization.enabled = True` | `speech_poc/azure_client.py` |
| **Wire JSON 定义 (`definition`)** | `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}` | `{"locales":["en-US"],"diarization":{"maxSpeakers":2,"enabled":true}}` | `evidence/official-control/*/request-definition.json` |
| **官方双人控制样本 (`29.4875s`)** | `8` 句转写，`0` 句带 speaker（**`0.0%`**），识别 `0` 人 | `8` 句转写，**`8` 句带 speaker（`100.0%`）**，识别 `[1, 2]` 共 `2` 人 | `evidence/official-control/*/summary.json` |
| **平均置信度 & 实时率 (RTF)** | `0.9255` · 耗时 `8.268s`（`RTF = 0.2804`） | **`0.9267`** · 耗时 `8.967s`（`RTF = 0.3041`） | `evidence/official-control/*/summary.json` |

---

## 📊 3. 客户 5 文件双声道数据集评测矩阵（脱敏指标）

| 样本代号 | 时长 (秒) | 识别语种 (`--locale auto`) | 转写句数 | Speaker 覆盖率 | 识别说话人列表 | 平均置信度 | 实时率 (`RTF`) | 双声道对齐一致率 (`Experiment A vs B`) | 质量门禁动作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`customer-file-01.wav`** | `147.50s` | `es-ES` | `1` | `100.0%` (`1/1`) | `[1]` (1 人) | `0.7560` | `0.0274` (`4.04s`) | 单句样本，不做双人映射 | `Confirm`（单人/短话音复核） |
| **`customer-file-02.wav`** | **`224.80s`** | **`es-ES`** | **`28`** | **`100.0%` (`28/28`)** | **`[1, 2]` (2 人)** | **`0.6028`** | **`0.0572` (`12.85s`)** | **`100.0%`**（`33,750 ms` 非重叠区间，`1→Ch1, 2→Ch0`） | **`Act automatically`（通过）** |
| **`customer-file-03.wav`** | `126.28s` | `[]` | `0` | `null` (`0` 句) | `[]` (0 人) | `null` | `0.0205` (`2.59s`) | 无有效可比语音 | `Send to a human`（静音/噪音） |
| **`customer-file-04.wav`** | `116.92s` | `[]` | `0` | `null` (`0` 句) | `[]` (0 人) | `null` | `0.0224` (`2.62s`) | 无有效可比语音 | `Send to a human`（静音/噪音） |
| **`customer-file-05.wav`** | `108.28s` | `en-US, es-ES` | `2` | `100.0%` (`2/2`) | `[1, 2]` (2 人) | `0.2158` | `0.0262` (`2.84s`) | 置信度过低（`<0.50`） | `Send to a human`（低信噪比复核） |

---

## 🛡️ 4. 与 Voice Agent Lab 架构护栏（Lane ④ & `P92`）的工程联动

- **与 Lane ④ 级联确定性管道联动**：在合规双录（`WM-DUAL-01`）与质检回溯中，若录音源自带物理双声道（坐席 Ch0 / 客户 Ch1），优先采用 **Channel Transcription（Experiment A）** 获取零歧义角色归属；若上游仅提供单声道混音录音，则必须强制开启 `diarization.enabled = True` + `--locale auto` 并执行置信度与非重叠一致性门禁。
- **与 `P92-MULTIPARTY-CONFERENCE-SPEAKER-DIARIZATION-CROSS-TALK-ATTRIBUTION-AND-ROLE-ISOLATION-GUARD` 联动**：防止多方通话或混音录制中将客户诱导指令误归属为坐席/授权操作员指令。
