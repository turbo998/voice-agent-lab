# Speaker diarization technical evidence

## Root cause

- Package under test: `azure-ai-transcription==1.0.0`.
- The Python model documentation implies that `maxSpeakers` enables diarization.
- In practice, the serialized request omitted `enabled`.
- Explicitly assigning `diarization.enabled = True` produced the required wire shape.

## Official control

| Request | Phrases | Labeled phrases | Speakers | Mean confidence | RTF |
|---|---:|---:|---|---:|---:|
| Before explicit enablement | 8 | 0 | none | 0.927 | 0.280 |
| After explicit enablement | 8 | 8 | 1, 2 | 0.927 | 0.304 |

The official-control raw responses, metric summaries, audio metadata, and sanitized request definitions are included under `evidence/official-control/`. The control audio itself is excluded.

## Sanitized customer metrics

The longest recording produced 28 phrases with 100% speaker-label coverage, speakers 1 and 2, locale `es-ES`, mean confidence 0.603, and RTF 0.057. Setting the speaker ceiling to 3 or 4 did not change the detected speaker count. Channel agreement was 100% over 33.75 seconds of eligible non-overlap.

See `evidence/customer-metrics-sanitized.json`. It contains metrics only: no audio and no transcript text.

## Code workaround

The client explicitly sets the SDK model's `enabled` field:

```python
diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
diarization.enabled = True
```

Regression tests verify both fixed-locale and automatic-language request shapes.

## Provenance

- Source commit: `31b25c867982590d5d9ac8490e18a956b925df59`
- Package behavior: local PCM preprocessing plus Azure Fast Transcription A/B/C experiments.
- Resource identifiers, user identities, machine paths, customer filenames, audio, and customer transcript text are excluded.
