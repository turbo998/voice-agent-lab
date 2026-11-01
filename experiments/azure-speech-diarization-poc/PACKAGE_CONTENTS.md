# Package contents

| Path | Purpose |
|---|---|
| `README.md` | Partner entry point |
| `PARTNER_RUNBOOK.md` | Chinese-first reproduction and operations guide |
| `EXPECTED_RESULTS.md` | Acceptance criteria and reference metrics |
| `SECURITY_AND_PRIVACY.md` | Privacy and security boundaries |
| `SHA256SUMS.txt` | SHA-256 inventory for package files |
| `speech_poc/` | Python CLI implementation |
| `tests/` | Unit and regression tests |
| `tools/run_official_control.py` | Minimal corrected official-control runner |
| `requirements.txt` | Pinned transcription SDK and identity dependency |
| `infra/main.bicep` | Subscription-scope example entry point |
| `infra/speech.bicep` | Speech S0 account and resource-scoped role assignment |
| `infra/main.example.bicepparam` | Placeholder-only deployment parameters |
| `reports/` | Sanitized executive and technical reports |
| `evidence/official-control/` | Sanitized before/after request and response evidence |
| `evidence/customer-metrics-sanitized.json` | Customer-derived metrics without text or audio |

## Intentionally excluded

- Customer and control audio
- Customer raw responses and transcripts
- Live deployment plan and live parameter file
- Local virtual environments and caches
- Git history and repository metadata
- Credentials, tokens, request headers, and secret values
- Machine paths and real Azure/user identifiers
