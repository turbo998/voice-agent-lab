# Azure Speech 说话人分离 PoC 复现与操作手册

## Purpose

本手册帮助合作伙伴在 Windows PowerShell 中复现本地 WAV 预处理、Azure Speech Fast Transcription、双通道转写和说话人分离。它是快速验证手册，不是生产部署设计。

## Prerequisites

- Windows PowerShell 7 或 Windows PowerShell 5.1
- Python 3.9 或更高版本
- Azure CLI
- 可用的 Azure 订阅和支持 Fast Transcription 的区域
- 一个现有 Speech S0 账户，或创建该账户的明确授权
- 已获授权的测试音频；客户 ZIP 中仅放置 8 kHz、16-bit PCM、双声道 WAV
- 执行人的 Microsoft Entra object ID

## Steps

### 1. 解压并进入目录

```powershell
Expand-Archive .\azure-speech-diarization-poc-partner.zip -DestinationPath .\partner-poc
Set-Location .\partner-poc\azure-speech-diarization-poc-partner
```

### 2. 创建 Python 环境

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m unittest discover -s tests -q
```

### 3. 登录并选择订阅

```powershell
az login --tenant <tenant-id>
az account set --subscription <subscription-id>
az account show --output table
```

### 4. 使用现有 Speech 账户

确认执行人在目标 Speech 账户范围拥有 `Cognitive Services Speech User`。设置 endpoint：

```powershell
$env:AZURE_SPEECH_ENDPOINT = 'https://<speech-account>.cognitiveservices.azure.com/'
Remove-Item Env:AZURE_SPEECH_API_KEY -ErrorAction SilentlyContinue
```

CLI 使用 `DefaultAzureCredential`，通常会复用当前 Azure CLI 登录。

### 5. 可选：通过 Bicep 创建非生产 Speech S0

仅在资源所有者明确批准后执行。先复制并填写占位参数：

```powershell
Copy-Item .\infra\main.example.bicepparam .\infra\main.local.bicepparam
notepad .\infra\main.local.bicepparam
az bicep build --file .\infra\main.bicep
az bicep build-params --file .\infra\main.local.bicepparam
az deployment sub validate --location <azure-region> --template-file .\infra\main.bicep --parameters .\infra\main.local.bicepparam
az deployment sub what-if --location <azure-region> --template-file .\infra\main.bicep --parameters .\infra\main.local.bicepparam
```

审阅 what-if 后，只有资源所有者批准才可运行 subscription deployment。模板创建 Speech S0，并在该 Speech 账户范围为指定 object ID 分配 `Cognitive Services Speech User`。模板禁用本地密钥认证。

### 6. 本地 dry run

此步骤不访问 Azure：

```powershell
.\.venv\Scripts\python -m speech_poc .\samples\customer-recordings.zip --output outputs --local-only
```

确认产生：

- `preflight.json`
- 左右声道 WAV
- mono downmix WAV
- `report.md`

### 7. 官方控制测试

从可信的官方 Azure Speech 示例仓库自行下载双人 mono WAV；本包不分发音频。把文件放入单独目录后运行：

```powershell
.\.venv\Scripts\python .\tools\run_official_control.py .\official-control\official-two-speaker-control.wav --output .\outputs\official-control --locale en-US
```

控制脚本直接调用修复后的 Fast Transcription 客户端，可接受官方 mono 样本。不得用客户音频替代公开控制样本。

### 8. 客户 ZIP 测试

未知语言时使用 auto：

```powershell
.\.venv\Scripts\python -m speech_poc .\samples\customer-recordings.zip --output outputs --locale auto --sensitivity-speakers 3 4
```

`--locale auto` 会完全省略 locale 候选，使服务自动识别语言。

### 9. 重要 SDK workaround

`azure-ai-transcription==1.0.0` 的文档表示设置 `maxSpeakers` 会自动启用 diarization，但实测序列化未包含服务所需字段。本包显式执行：

```python
diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
diarization.enabled = True
```

期望 wire definition：

```json
{"diarization":{"maxSpeakers":2,"enabled":true}}
```

不要删除该 workaround，除非升级 SDK 后已通过官方双人控制样本和回归测试确认行为。

## Expected outcome

每个 run 目录包含：

```text
run-<timestamp>/
  input/
  preprocessed/
  azure/
    <file>/
      A-channels/
      B-diarization-2/
      C-diarization-3/
      C-diarization-4/
  preflight.json
  report.md
```

每个实验目录包含 `raw.json`、`normalized.json`、`phrases.csv` 和 `transcript.txt`。

验收参考：

- 所有有效文件均完成处理
- Azure 请求快于实时
- 有效语句 speaker 覆盖率至少 95%
- 仅在确认双通道分轨且有足够非重叠语音时，要求 speaker/channel 一致率至少 90%
- 无语句、语句稀少或低置信度时必须人工复核

## Troubleshooting

### Missing endpoint

确认当前 PowerShell 进程已设置：

```powershell
$env:AZURE_SPEECH_ENDPOINT
```

### 401 或 403

- 重新执行 `az account show`
- 确认 tenant 和 subscription 正确
- 确认角色分配位于具体 Speech 账户范围
- 新角色分配可能需要等待传播

### 返回文本但没有 speaker

1. 检查 request definition 是否包含 `"enabled": true`。
2. 确认输入为 mono downmix，而不是同时启用 channels。
3. 使用 `--locale auto` 或正确固定 locale。
4. 用公开双人控制样本区分请求缺陷与客户音频质量问题。

### 无识别语句

检查采样率、位深、声道数、静音率、音量、语言和录音内容。不要把空结果计为 speaker 覆盖率通过。

## Teardown

删除资源会造成不可逆影响。只有资源所有者明确批准后，才可删除测试资源组或角色分配。执行前必须再次核对 subscription、resource group、影响范围和保留要求。本手册不提供自动删除命令。
