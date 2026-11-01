# Expected results

## Tests

Run:

```powershell
.\.venv\Scripts\python -m unittest discover -s tests -q
```

Expected: all bundled tests pass. The regression suite verifies that diarization requests explicitly serialize `"enabled": true`.

## Official control

With a compatible public two-speaker control WAV:

- Mono PCM input
- 8 recognized phrases in the reference run
- 8 labeled phrases
- Two speaker identifiers
- Speaker-label coverage: 100%

Exact latency varies by region, network, and service load.

## Customer-style input

For a five-file ZIP, the CLI should:

- Safely extract 5/5 valid WAV files
- Generate stereo channel files and mono downmix files
- Produce signal preflight metrics
- Run A channel transcription, B two-speaker diarization, and C sensitivity experiments
- Write raw JSON, normalized JSON/CSV, timestamped transcripts, and `report.md`
- Complete faster than real time for the reference data

## Acceptance

- Processing completeness: 5/5 valid files
- Faster-than-real-time: elapsed time less than audio duration
- Speaker-label coverage target: at least 95% of valid phrases
- Channel agreement target: at least 90% only when a recording is independently confirmed as split-channel and sufficient non-overlapping speech exists
- Empty or sparse recognition must be marked for manual review, not treated as successful diarization
