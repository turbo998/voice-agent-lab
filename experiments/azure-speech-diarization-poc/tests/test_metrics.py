from __future__ import annotations

import unittest

from speech_poc.audio import calculate_signal_metrics
from speech_poc.metrics import calculate_channel_consistency, normalize_result


class MetricsTests(unittest.TestCase):
    def test_signal_metrics_identify_low_correlation_channels(self) -> None:
        metrics = calculate_signal_metrics(
            frames=4,
            sample_rate=2,
            left_sum=0,
            right_sum=0,
            left_sq=4_000_000,
            right_sq=4_000_000,
            cross_sum=0,
            left_silent=0,
            right_silent=0,
        )
        self.assertEqual(metrics.separation_status, "separable_candidate")
        self.assertEqual(metrics.duration_seconds, 2)

    def test_signal_metrics_reject_zero_variance_channels(self) -> None:
        metrics = calculate_signal_metrics(
            frames=4,
            sample_rate=2,
            left_sum=4_000,
            right_sum=4_000,
            left_sq=4_000_000,
            right_sq=4_000_000,
            cross_sum=4_000_000,
            left_silent=0,
            right_silent=0,
        )
        self.assertEqual(metrics.separation_status, "manual_review_required")

    def test_normalization_calculates_speaker_coverage_and_rtf(self) -> None:
        result = normalize_result(
            {
                "phrases": [
                    {
                        "speaker": 1,
                        "offsetMilliseconds": 0,
                        "durationMilliseconds": 500,
                        "text": "hello",
                        "confidence": 0.9,
                    },
                    {
                        "offsetMilliseconds": 500,
                        "durationMilliseconds": 500,
                        "text": "world",
                        "confidence": 0.8,
                    },
                ]
            },
            source_name="sample.wav",
            experiment="B-diarization-2",
            elapsed_seconds=0.5,
            audio_duration_seconds=1,
        )
        self.assertEqual(result["speaker_label_coverage"], 0.5)
        self.assertEqual(result["real_time_factor"], 0.5)

    def test_channel_consistency_finds_best_speaker_mapping(self) -> None:
        channel_phrases = [
            {"channel": 0, "offset_milliseconds": 0, "end_milliseconds": 1000},
            {"channel": 1, "offset_milliseconds": 1000, "end_milliseconds": 2000},
        ]
        diarized_phrases = [
            {"speaker": 7, "offset_milliseconds": 0, "end_milliseconds": 1000},
            {"speaker": 9, "offset_milliseconds": 1000, "end_milliseconds": 2000},
        ]
        result = calculate_channel_consistency(channel_phrases, diarized_phrases)
        self.assertEqual(result["agreement_rate"], 1)
        self.assertEqual(result["speaker_channel_map"], {"7": 0, "9": 1})

    def test_channel_consistency_handles_extra_speaker_clusters(self) -> None:
        channel_phrases = [
            {"channel": 0, "offset_milliseconds": 0, "end_milliseconds": 2000},
            {"channel": 1, "offset_milliseconds": 2000, "end_milliseconds": 3000},
        ]
        diarized_phrases = [
            {"speaker": 1, "offset_milliseconds": 0, "end_milliseconds": 1000},
            {"speaker": 2, "offset_milliseconds": 1000, "end_milliseconds": 2000},
            {"speaker": 3, "offset_milliseconds": 2000, "end_milliseconds": 3000},
        ]
        result = calculate_channel_consistency(channel_phrases, diarized_phrases)
        self.assertEqual(result["agreement_rate"], 1)
        self.assertEqual(result["speaker_channel_map"], {"1": 0, "2": 0, "3": 1})


if __name__ == "__main__":
    unittest.main()
