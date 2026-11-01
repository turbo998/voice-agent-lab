"""End-to-end local and Azure experiment pipeline."""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

from speech_poc.audio import PreparedAudio, collect_wav_inputs, preprocess_wav
from speech_poc.azure_client import (
    AzureTranscriptionError,
    FastTranscriber,
    MissingCredentialsError,
)
from speech_poc.metrics import calculate_channel_consistency, normalize_result


@dataclass(frozen=True)
class RunResult:
    """Top-level run locations and processing counts."""

    run_directory: Path
    report_path: Path
    processed_count: int


def execute(
    source: Path,
    output_root: Path,
    *,
    locale: str | None,
    silence_threshold: int,
    local_only: bool,
    sensitivity_speakers: Sequence[int],
    representative: str | None,
) -> RunResult:
    """Run preprocessing and optional Azure experiments."""

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    run_directory = output_root / f"run-{run_id}"
    run_directory.mkdir(parents=True, exist_ok=False)
    extraction_root = run_directory / "input"
    wavs = collect_wav_inputs(source, extraction_root)

    prepared: list[PreparedAudio] = []
    for index, wav in enumerate(wavs, start=1):
        prepared.append(
            preprocess_wav(
                wav,
                run_directory / "preprocessed" / f"{index:02d}-{wav.stem}",
                silence_threshold=silence_threshold,
            )
        )
    preflight = {
        "source": str(source),
        "processed_count": len(prepared),
        "files": [
            {"name": item.source.name, "metrics": item.metrics.to_dict()}
            for item in prepared
        ],
    }
    _write_json(run_directory / "preflight.json", preflight)
    report_path = run_directory / "report.md"
    initial_status = "skipped (--local-only)" if local_only else "pending"
    report_path.write_text(
        _render_report(prepared, [], azure_status=initial_status),
        encoding="utf-8",
    )
    experiments: list[dict[str, object]] = []
    if not local_only:
        try:
            experiments = _run_azure(
                prepared,
                run_directory,
                locale=locale,
                sensitivity_speakers=sensitivity_speakers,
                representative=representative,
            )
        except (MissingCredentialsError, AzureTranscriptionError) as exc:
            status = (
                "not started: missing credentials"
                if isinstance(exc, MissingCredentialsError)
                else "failed; inspect CLI error"
            )
            report_path.write_text(
                _render_report(prepared, experiments, azure_status=status),
                encoding="utf-8",
            )
            raise
    report_path.write_text(
        _render_report(prepared, experiments, azure_status=initial_status if local_only else "completed"),
        encoding="utf-8",
    )
    return RunResult(run_directory, report_path, len(prepared))


def _run_azure(
    prepared: list[PreparedAudio],
    run_directory: Path,
    *,
    locale: str | None,
    sensitivity_speakers: Sequence[int],
    representative: str | None,
) -> list[dict[str, object]]:
    transcriber = FastTranscriber()
    experiments: list[dict[str, object]] = []
    for index, item in enumerate(prepared, start=1):
        source_key = item.source.name
        artifact_id = f"{index:02d}-{item.source.stem}"
        raw_a, elapsed_a = transcriber.transcribe_channels(item.source, locale=locale)
        normalized_a = _save_experiment(
            run_directory,
            artifact_id,
            source_key,
            "A-channels",
            raw_a,
            elapsed_a,
            item.metrics.duration_seconds,
        )
        experiments.append(normalized_a)

        raw_b, elapsed_b = transcriber.transcribe_diarized(
            item.downmix, locale=locale, max_speakers=2
        )
        normalized_b = _save_experiment(
            run_directory,
            artifact_id,
            source_key,
            "B-diarization-2",
            raw_b,
            elapsed_b,
            item.metrics.duration_seconds,
        )
        if item.metrics.separation_status == "separable_candidate":
            normalized_b["channel_consistency"] = calculate_channel_consistency(
                normalized_a["phrases"], normalized_b["phrases"]
            )
        else:
            normalized_b["channel_consistency"] = {
                "status": "manual_review_required",
                "agreement_rate": None,
            }
        _rewrite_normalized(run_directory, artifact_id, "B-diarization-2", normalized_b)
        experiments.append(normalized_b)

    selected = _select_representative(prepared, representative)
    for speakers in sensitivity_speakers:
        if not 2 < speakers < 36:
            raise ValueError(f"Sensitivity max speakers must be between 3 and 35: {speakers}")
        experiment = f"C-diarization-{speakers}"
        raw, elapsed = transcriber.transcribe_diarized(
            selected.downmix, locale=locale, max_speakers=speakers
        )
        experiments.append(
            _save_experiment(
                run_directory,
                f"{prepared.index(selected) + 1:02d}-{selected.source.stem}",
                selected.source.name,
                experiment,
                raw,
                elapsed,
                selected.metrics.duration_seconds,
            )
        )
    return experiments


def _save_experiment(
    run_directory: Path,
    artifact_id: str,
    source_name: str,
    experiment: str,
    raw: dict[str, object],
    elapsed: float,
    duration: float,
) -> dict[str, object]:
    target = run_directory / "azure" / artifact_id / experiment
    target.mkdir(parents=True, exist_ok=False)
    _write_json(target / "raw.json", raw)
    normalized = normalize_result(
        raw,
        source_name=source_name,
        experiment=experiment,
        elapsed_seconds=elapsed,
        audio_duration_seconds=duration,
    )
    _write_normalized_files(target, normalized)
    return normalized


def _rewrite_normalized(
    run_directory: Path,
    artifact_id: str,
    experiment: str,
    normalized: dict[str, object],
) -> None:
    target = run_directory / "azure" / artifact_id / experiment
    _write_normalized_files(target, normalized)


def _write_normalized_files(target: Path, normalized: dict[str, object]) -> None:
    _write_json(target / "normalized.json", normalized)
    phrases = normalized["phrases"]
    if not isinstance(phrases, list):
        raise ValueError("Normalized phrases must be a list")
    fields = [
        "source",
        "experiment",
        "channel",
        "speaker",
        "offset_milliseconds",
        "duration_milliseconds",
        "end_milliseconds",
        "text",
        "locale",
        "confidence",
    ]
    with (target / "phrases.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(phrases)
    transcript = "\n".join(_format_phrase(phrase) for phrase in phrases)
    (target / "transcript.txt").write_text(transcript + ("\n" if transcript else ""), encoding="utf-8")


def _format_phrase(phrase: dict[str, object]) -> str:
    start = int(phrase["offset_milliseconds"])
    end = int(phrase["end_milliseconds"])
    label = (
        f"speaker={phrase['speaker']}"
        if phrase.get("speaker") is not None
        else f"channel={phrase['channel']}"
        if phrase.get("channel") is not None
        else "unlabeled"
    )
    return f"[{_timestamp(start)} --> {_timestamp(end)}] {label}: {phrase['text']}"


def _timestamp(milliseconds: int) -> str:
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, millis = divmod(remainder, 1_000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def _select_representative(prepared: list[PreparedAudio], requested: str | None) -> PreparedAudio:
    if requested:
        matches = [item for item in prepared if item.source.name == requested or item.source.stem == requested]
        if not matches:
            raise ValueError(f"Representative WAV was not found: {requested}")
        return matches[0]
    return max(prepared, key=lambda item: item.metrics.duration_seconds)


def _render_report(
    prepared: list[PreparedAudio],
    experiments: list[dict[str, object]],
    *,
    azure_status: str,
) -> str:
    lines = [
        "# Azure Speech diarization PoC report",
        "",
        f"- WAV files processed: **{len(prepared)}/{len(prepared)}**",
        f"- Azure execution: **{azure_status}**",
        "",
        "## Signal preflight",
        "",
        "| File | Duration (s) | Left RMS | Right RMS | Left silence | Right silence | Correlation | Screening |",
        "|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for item in prepared:
        metric = item.metrics
        lines.append(
            f"| {item.source.name} | {metric.duration_seconds:.2f} | {metric.left_rms:.1f} | "
            f"{metric.right_rms:.1f} | {metric.left_silence_rate:.1%} | "
            f"{metric.right_silence_rate:.1%} | {metric.correlation:.3f} | "
            f"{metric.separation_status} |"
        )
    lines.extend(["", "Signal screening is heuristic and requires human spot-checking.", ""])
    if experiments:
        lines.extend(
            [
                "## Azure experiments",
                "",
                "| File | Experiment | Elapsed (s) | RTF | Faster than real time | Speaker coverage | Speakers | Channel agreement |",
                "|---|---|---:|---:|---|---:|---:|---:|",
            ]
        )
        for experiment in experiments:
            consistency = experiment.get("channel_consistency")
            agreement = consistency.get("agreement_rate") if isinstance(consistency, dict) else None
            coverage = experiment.get("speaker_label_coverage")
            lines.append(
                f"| {experiment['source']} | {experiment['experiment']} | "
                f"{float(experiment['elapsed_seconds']):.2f} | "
                f"{float(experiment['real_time_factor']):.3f} | "
                f"{'yes' if experiment['faster_than_real_time'] else 'no'} | "
                f"{_percent(coverage)} | {experiment['recognized_speaker_count']} | "
                f"{_percent(agreement)} |"
            )
        diarized = [
            item for item in experiments if str(item["experiment"]).startswith(("B-", "C-"))
        ]
        coverage_pass = all(
            item["speaker_label_coverage"] is not None
            and float(item["speaker_label_coverage"]) >= 0.95
            for item in diarized
        )
        speed_pass = all(bool(item["faster_than_real_time"]) for item in experiments)
        lines.extend(
            [
                "",
                "## Acceptance indicators",
                "",
                f"- Speaker label coverage >=95%: **{'pass' if coverage_pass else 'review'}**",
                f"- Faster than real time: **{'pass' if speed_pass else 'review'}**",
                "- Channel agreement >=90% applies only to confirmed two-person split-channel recordings; "
                "otherwise the report marks it for manual review.",
            ]
        )
    return "\n".join(lines) + "\n"


def _percent(value: object) -> str:
    return "N/A" if value is None else f"{float(value):.1%}"


def _write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
