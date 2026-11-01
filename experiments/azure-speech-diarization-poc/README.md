# 🎙️ Azure Speech Fast Transcription 说话人分离（Speaker Diarization）与双声道归属对比 PoC

> 🌐 **Language / 语言切换**: **[中文 (当前)](README.md)** | **[English (`README.en.md`)](README.en.md)**

---

## ⚡ 核心发现与管理摘要（Executive Summary）

本项目是面向合作伙伴与企业语音工程师的 **Azure AI Speech Fast Transcription 说话人分离（Speaker Diarization）与双声道（Stereo Channel）归属一致性验证 PoC 套件**。

在客户呼叫中心 8 kHz 16-bit PCM 双声道录音的说话人分离排查中，我们定位并修复了 Python SDK **`azure-ai-transcription==1.0.0`** 的关键序列化缺陷，建立了 **“本地 PCM 信号预检 + 官方双人控制样本 A/B 对照 + 双声道基线（Experiment A）vs. 单声道混音说话人分离（Experiment B）vs. 说话人上限敏感度（Experiment C）”** 的完整可复现实验工程。

- 📊 **7-Card (4:5) 视觉基准评测报告**：[`benchmark-cards.html`](benchmark-cards.html)（在线版：[`https://turbo998.github.io/voice/diarization-benchmark-cards.html`](https://turbo998.github.io/voice/diarization-benchmark-cards.html)）
- 📘 **中文操作与复现手册**：[`PARTNER_RUNBOOK.md`](PARTNER_RUNBOOK.md) · **[English Runbook (`PARTNER_RUNBOOK.en.md`)](PARTNER_RUNBOOK.en.md)**
- 📑 **管理层摘要与技术证据**：[`reports/executive-report-zh-CN.md`](reports/executive-report-zh-CN.md) · [`reports/technical-evidence.md`](reports/technical-evidence.md)

### 关键实验与诊断指标速览

| 评测维度 | 修复前（仅设 `maxSpeakers=2`） | 修复后（显式 `diarization.enabled=true`） | 核心工程结论与建议 |
| :--- | :--- | :--- | :--- |
| **序列化 Wire JSON 定义** | `{"locales":["en-US"],"diarization":{"maxSpeakers":2}}` | `{"locales":["en-US"],"diarization":{"maxSpeakers":2,"enabled":true}}` | `azure-ai-transcription==1.0.0` 仅传 `max_speakers` 时未自动序列化 `enabled: true`，导致服务端静默跳过分离 |
| **官方双人控制样本 (`29.49s`)** | `0 / 8` 语句带 speaker（覆盖率 **`0.0%`**），`RTF = 0.280` | **`8 / 8` 语句带 speaker（覆盖率 `100.0%`）**，识别 2 人（Speaker 1 & 2），置信度 **`0.927`**，`RTF = 0.304` | 显式设置 `diarization.enabled = True` 后 100% 恢复双人分离能力，耗时仅增加 `0.70s` |
| **客户最长双声道录音 (`customer-file-02.wav`, `224.8s`)** | 未启用 `enabled=true` 或错配固定 `en-US` 时缺失标签 | **`28 / 28` 语句带 speaker（覆盖率 `100.0%`）**，自动识别语言 `es-ES`，识别 2 人，平均置信度 `0.603`，**`RTF = 0.057`**（快于实时 **17.5×**） | 对未知语种录音必须使用 `--locale auto`（省略候选数组触发自动语种识别） |
| **说话人上限敏感度测试 (`maxSpeakers = 3 / 4`)** | — | `maxSpeakers=3` 与 `maxSpeakers=4` 下均稳定输出 **`28 / 28`（`100%`）** 且未分裂出虚假第 3/4 人（仍为 Speaker 1 & 2），`RTF = 0.054` | 放宽 `maxSpeakers` 上限不会在双人清晰录音上造成过分割（Over-clustering） |
| **双声道物理分轨 vs. 单声道 Diarization 一致率** | — | 在 **`33.75 秒`**非重叠可比语音区间内，Speaker 与左右物理声道映射一致率达 **`100.0%`**（`Speaker 1 → Ch 1`, `Speaker 2 → Ch 0`） | 若呼叫中心已具备物理双声道分轨（坐席/客户分轨），优先保留 Channel Transcription 作为确定性归属基线 |
| **5 条客户录音全量信号质量筛查** | — | `file-02`（28 句，2 人，100% 覆盖）、`file-01`（1 句，单人）、`file-05`（2 句，低置信度 `0.216`）、`file-03/04`（`0` 句有效语音） | 必须通过前置音频预检区分 **SDK 请求缺陷** 与 **静音/低信噪比音频质量问题**，严禁将空识别计入通过 |

---

## 🛠️ 根因拆解与一行关键代码修复（The Wire-Format Fix）

在 `azure-ai-transcription==1.0.0` 中，文档注释暗示传入 `TranscriptionDiarizationOptions(max_speakers=2)` 即可激活说话人分离，但底层序列化器忽略了服务端必需的布尔开关 `"enabled": true`：

```python
from azure.ai.transcription.models import (
    TranscriptionContent,
    TranscriptionDiarizationOptions,
    TranscriptionOptions,
)

diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
# 关键修复：SDK 1.0.0 不会自动序列化服务端必需的 enabled=True 字段
diarization.enabled = True
options = TranscriptionOptions(diarization_options=diarization)
```

同时，当录音语种未知（例如西班牙语 `es-ES` 与英语混杂）时，传入错误的固定 `locales=["en-US"]` 会严重劣化转写置信度；在 CLI 中使用 `--locale auto` 会省略 `locales` 字段，交由 Fast Transcription 服务端自动检测语种。

---

## 📂 仓库目录结构与快速导航

| 路径 | 说明 |
| :--- | :--- |
| [`PARTNER_RUNBOOK.md`](PARTNER_RUNBOOK.md) / [`PARTNER_RUNBOOK.en.md`](PARTNER_RUNBOOK.en.md) | 中英双语 Windows PowerShell 环境准备、本地 dry run、官方控制测试、客户 ZIP 测试与排障手册 |
| [`EXPECTED_RESULTS.md`](EXPECTED_RESULTS.md) | 单元测试、官方控制样本与 5 文件客户集验收标准 |
| [`reports/executive-report-zh-CN.md`](reports/executive-report-zh-CN.md) | 面向客户与合作伙伴管理层的中文结论摘要 |
| [`reports/technical-evidence.md`](reports/technical-evidence.md) | Wire JSON 对比、官方控制样本前后对照表与客户脱敏指标说明 |
| [`benchmark-cards.html`](benchmark-cards.html) | 自包含 **7-Card (4:5) 视觉评测报告**（涵盖概览工作台、修复前后单例深潜、5 文件矩阵、协议与双声道对齐算法、`maxSpeakers=2/3/4` 鲁棒性、RTF 延迟对比与适用边界） |
| [`evidence/`](evidence/) | 官方控制样本 `before-fix` vs `after-fix` 原始响应/摘要 JSON 及 `customer-metrics-sanitized.json` |
| [`speech_poc/`](speech_poc/) & [`tests/`](tests/) | 本地 WAV 预检/分轨/混音管道、Fast Transcription 零密钥客户端、声道一致性匹配算法与 16 项回归测试 |
| [`infra/`](infra/) | 禁用本地密钥认证（`disableLocalAuth: true`）并按资源范围授予 `Cognitive Services Speech User` 的 Bicep 模板 |
| [`SECURITY_AND_PRIVACY.md`](SECURITY_AND_PRIVACY.md) | 数据脱敏与隐私红线说明（零客户音频、零客户转写文本、零凭据与零订阅标识） |

---

## 🚀 本地验证与单元测试（零云端调用）

```powershell
python -m unittest discover -s tests -v
```

全部 **16 项单元测试**（含 ZIP 路径穿越防护、立体声分轨与单声道混音、显式 `diarization.enabled=true` 序列化断言、`--locale auto` 省略断言、匈牙利/全排列最优声道对齐算法）均在本地离线秒级通过。

