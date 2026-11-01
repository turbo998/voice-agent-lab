# Azure Speech Diarization PoC — Partner Reproduction & Operations Runbook

> 🌐 **Language / 语言切换**: **[中文 (`PARTNER_RUNBOOK.md`)](PARTNER_RUNBOOK.md)** | **[English (Current)](PARTNER_RUNBOOK.en.md)**

## Purpose

This runbook guides partner engineers through reproducing local WAV signal preflight, Azure Speech Fast Transcription, stereo channel transcription (`Experiment A`), mono speaker diarization (`Experiment B`), and speaker-ceiling sensitivity checks (`Experiment C`) in Windows PowerShell. It is a rapid PoC verification manual, not a multi-tenant production deployment design.

## Prerequisites

- Windows PowerShell 7 or Windows PowerShell 5.1
- Python 3.9 or later
- Azure CLI (`az`)
- An approved Azure subscription and a region supporting Fast Transcription
- An existing Speech `S0` account, or explicit authorization from the resource owner to provision one
- Authorized test audio; customer ZIP archives must contain 8 kHz, 16-bit PCM stereo WAV files
- The operator's Microsoft Entra object ID

## Step-by-Step Procedure

### 1. Extract or Clone Repository

```powershell
Expand-Archive .\azure-speech-diarization-poc-partner.zip -DestinationPath .\partner-poc
Set-Location .\partner-poc\azure-speech-diarization-poc-partner
```

### 2. Create Python Environment & Run Unit Tests

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m unittest discover -s tests -q
```

### 3. Sign In to Azure & Verify Subscription

```powershell
az login --tenant <tenant-id>
az account set --subscription <subscription-id>
az account show --output table
```

### 4. Configure Keyless Speech Endpoint (`DefaultAzureCredential`)

Verify that the operator has `Cognitive Services Speech User` assigned at the target Speech resource scope, then configure the endpoint without an API key:

```powershell
$env:AZURE_SPEECH_ENDPOINT = 'https://<speech-account>.cognitiveservices.azure.com/'
Remove-Item Env:AZURE_SPEECH_API_KEY -ErrorAction SilentlyContinue
```

### 5. Optional: Provision Non-Production Speech S0 via Bicep

Run only with explicit owner approval:

```powershell
Copy-Item .\infra\main.example.bicepparam .\infra\main.local.bicepparam
notepad .\infra\main.local.bicepparam
az bicep build --file .\infra\main.bicep
az bicep build-params --file .\infra\main.local.bicepparam
az deployment sub validate --location <azure-region> --template-file .\infra\main.bicep --parameters .\infra\main.local.bicepparam
az deployment sub what-if --location <azure-region> --template-file .\infra\main.bicep --parameters .\infra\main.local.bicepparam
```

The Bicep template provisions a Speech `S0` resource with `disableLocalAuth: true` and assigns `Cognitive Services Speech User` at the resource scope.

### 6. Local Dry Run (Zero Azure Calls)

```powershell
.\.venv\Scripts\python -m speech_poc .\samples\customer-recordings.zip --output outputs --local-only
```

Verifies extraction, stereo channel splitting, mono downmix generation, `preflight.json`, and `report.md`.

### 7. Official Two-Speaker Control Verification

Download a public two-speaker mono WAV sample from the official Azure Speech sample repository and run:

```powershell
.\.venv\Scripts\python .\tools\run_official_control.py .\official-control\official-two-speaker-control.wav --output .\outputs\official-control --locale en-US
```

Expected: `8/8` phrases labeled across speakers `1` and `2` (`100%` coverage).

### 8. Customer ZIP Evaluation (`--locale auto`)

```powershell
.\.venv\Scripts\python -m speech_poc .\samples\customer-recordings.zip --output outputs --locale auto --sensitivity-speakers 3 4
```

Passing `--locale auto` omits candidate locales so Fast Transcription performs automatic language identification (e.g., detecting `es-ES`).

### 9. Critical SDK Workaround (`azure-ai-transcription==1.0.0`)

```python
diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
diarization.enabled = True
```

Expected wire definition:

```json
{"diarization":{"maxSpeakers":2,"enabled":true}}
```

Do not remove this workaround unless a newer SDK version is verified against both the regression test suite and the official two-speaker control sample.
