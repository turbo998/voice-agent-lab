"""Transcription result normalization and experiment metrics."""

from __future__ import annotations

import itertools
from collections import defaultdict
from typing import Iterable


def pick(mapping: dict[str, object], *names: str, default: object = None) -> object:
    """Read the first present model key across snake_case and wire casing."""

    for name in names:
        if name in mapping:
            return mapping[name]
    return default


def normalize_result(
    raw: dict[str, object],
    *,
    source_name: str,
    experiment: str,
    elapsed_seconds: float,
    audio_duration_seconds: float,
) -> dict[str, object]:
    """Normalize an SDK transcription result into stable JSON fields."""

    phrases_raw = pick(raw, "phrases", default=[])
    if not isinstance(phrases_raw, list):
        raise ValueError("Azure response field 'phrases' is not a list")
    phrases: list[dict[str, object]] = []
    for item in phrases_raw:
        if not isinstance(item, dict):
            continue
        offset = int(pick(item, "offsetMilliseconds", "offset_milliseconds", default=0))
        duration = int(pick(item, "durationMilliseconds", "duration_milliseconds", default=0))
        phrases.append(
            {
                "source": source_name,
                "experiment": experiment,
                "channel": pick(item, "channel"),
                "speaker": pick(item, "speaker"),
                "offset_milliseconds": offset,
                "duration_milliseconds": duration,
                "end_milliseconds": offset + duration,
                "text": str(pick(item, "text", default="")),
                "locale": pick(item, "locale"),
                "confidence": pick(item, "confidence"),
            }
        )
    valid = [phrase for phrase in phrases if str(phrase["text"]).strip()]
    labeled = [phrase for phrase in valid if phrase["speaker"] is not None]
    speakers = sorted({int(phrase["speaker"]) for phrase in labeled})
    diarization_experiment = experiment.startswith(("B-", "C-"))
    return {
        "source": source_name,
        "experiment": experiment,
        "elapsed_seconds": elapsed_seconds,
        "audio_duration_seconds": audio_duration_seconds,
        "real_time_factor": elapsed_seconds / audio_duration_seconds if audio_duration_seconds else None,
        "faster_than_real_time": elapsed_seconds < audio_duration_seconds,
        "speaker_label_coverage": (
            len(labeled) / len(valid)
            if diarization_experiment and valid
            else None
        ),
        "recognized_speaker_count": len(speakers),
        "recognized_speakers": speakers,
        "phrases": phrases,
    }


def calculate_channel_consistency(
    channel_phrases: Iterable[dict[str, object]],
    diarized_phrases: Iterable[dict[str, object]],
) -> dict[str, object]:
    """Compare diarized speakers with uniquely active channel phrase intervals."""

    channel_intervals: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for phrase in channel_phrases:
        channel = phrase.get("channel")
        if channel is None:
            continue
        channel_intervals[int(channel)].append(
            (int(phrase["offset_milliseconds"]), int(phrase["end_milliseconds"]))
        )
    channel_intervals = {
        channel: _merge_intervals(intervals)
        for channel, intervals in channel_intervals.items()
    }
    channels = sorted(channel_intervals)
    overlap_by_speaker: dict[int, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    eligible_milliseconds = 0
    for phrase in diarized_phrases:
        speaker = phrase.get("speaker")
        if speaker is None:
            continue
        start = int(phrase["offset_milliseconds"])
        end = int(phrase["end_milliseconds"])
        overlaps = {
            channel: _interval_overlap(start, end, channel_intervals[channel])
            for channel in channels
        }
        active = [channel for channel, overlap in overlaps.items() if overlap > 0]
        if len(active) != 1:
            continue
        channel = active[0]
        overlap = overlaps[channel]
        overlap_by_speaker[int(speaker)][channel] += overlap
        eligible_milliseconds += overlap

    speakers = sorted(overlap_by_speaker)
    if not speakers or not channels or eligible_milliseconds == 0:
        return {
            "status": "insufficient_non_overlap",
            "agreement_rate": None,
            "eligible_milliseconds": eligible_milliseconds,
            "speaker_channel_map": {},
        }
    best_score = -1
    best_map: dict[int, int] = {}
    for assigned_channels in itertools.product(channels, repeat=len(speakers)):
        candidate = dict(zip(speakers, assigned_channels, strict=True))
        score = sum(overlap_by_speaker[speaker][channel] for speaker, channel in candidate.items())
        if score > best_score:
            best_score = score
            best_map = candidate
    return {
        "status": "calculated",
        "agreement_rate": best_score / eligible_milliseconds,
        "eligible_milliseconds": eligible_milliseconds,
        "speaker_channel_map": {str(key): value for key, value in best_map.items()},
    }


def _interval_overlap(start: int, end: int, intervals: list[tuple[int, int]]) -> int:
    return sum(max(0, min(end, other_end) - max(start, other_start)) for other_start, other_end in intervals)


def _merge_intervals(intervals: list[tuple[int, int]]) -> list[tuple[int, int]]:
    merged: list[tuple[int, int]] = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append((start, end))
        else:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
    return merged
