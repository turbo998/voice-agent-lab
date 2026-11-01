"""Run one mono official-control file through corrected diarization settings."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from speech_poc.azure_client import FastTranscriber
from speech_poc.metrics import normalize_result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("audio", type=Path)
    parser.add_argument("--output", type=Path, default=Path("outputs/official-control"))
    parser.add_argument("--locale", default="en-US")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    transcriber = FastTranscriber()
    raw, elapsed = transcriber.transcribe_diarized(
        args.audio,
        locale=args.locale,
        max_speakers=2,
    )
    duration_ms = int(raw.get("durationMilliseconds", 0))
    normalized = normalize_result(
        raw,
        source_name="official-control.wav",
        experiment="B-diarization-2",
        elapsed_seconds=elapsed,
        audio_duration_seconds=duration_ms / 1000,
    )
    (args.output / "raw.json").write_text(
        json.dumps(raw, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (args.output / "normalized.json").write_text(
        json.dumps(normalized, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "phrases": len(normalized["phrases"]),
                "speaker_label_coverage": normalized["speaker_label_coverage"],
                "recognized_speakers": normalized["recognized_speakers"],
                "real_time_factor": normalized["real_time_factor"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
