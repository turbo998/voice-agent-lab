"""Safe input handling and PCM WAV preprocessing."""

from __future__ import annotations

import math
import shutil
import stat
import sys
import wave
import zipfile
from array import array
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath

EXPECTED_CHANNELS = 2
EXPECTED_SAMPLE_RATE = 8_000
EXPECTED_SAMPLE_WIDTH = 2
MAX_ARCHIVE_FILES = 1_000
MAX_ARCHIVE_BYTES = 1_000_000_000


@dataclass(frozen=True)
class SignalMetrics:
    """Stereo signal screening measurements."""

    frames: int
    duration_seconds: float
    left_rms: float
    right_rms: float
    left_silence_rate: float
    right_silence_rate: float
    correlation: float
    separation_status: str
    separation_reason: str

    def to_dict(self) -> dict[str, object]:
        """Return a JSON-safe representation."""

        return asdict(self)


@dataclass(frozen=True)
class PreparedAudio:
    """Paths and measurements produced for one stereo input."""

    source: Path
    left: Path
    right: Path
    downmix: Path
    metrics: SignalMetrics


class AudioFormatError(ValueError):
    """Raised when a WAV does not match the PoC input contract."""


class UnsafeArchiveError(ValueError):
    """Raised when a ZIP contains unsafe or ambiguous entries."""


def collect_wav_inputs(source: Path, extraction_root: Path) -> list[Path]:
    """Return WAV inputs from a directory or safely extract them from a ZIP."""

    if source.is_dir():
        files = sorted(path for path in source.rglob("*") if path.is_file() and path.suffix.lower() == ".wav")
    elif source.is_file() and source.suffix.lower() == ".zip":
        files = safe_extract_wavs(source, extraction_root)
    else:
        raise FileNotFoundError(f"Input must be an existing ZIP file or directory: {source}")
    if not files:
        raise FileNotFoundError(f"No WAV files found in input: {source}")
    return files


def safe_extract_wavs(zip_path: Path, destination: Path) -> list[Path]:
    """Extract only WAV files while rejecting traversal, links, and duplicates."""

    destination.mkdir(parents=True, exist_ok=False)
    extracted: list[Path] = []
    seen: set[str] = set()
    total_size = 0
    root = destination.resolve()
    with zipfile.ZipFile(zip_path) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            mode = info.external_attr >> 16
            if stat.S_ISLNK(mode):
                raise UnsafeArchiveError(f"ZIP symbolic links are not allowed: {info.filename}")
            normalized = info.filename.replace("\\", "/")
            member = PurePosixPath(normalized)
            if member.is_absolute() or ".." in member.parts or not member.parts:
                raise UnsafeArchiveError(f"Unsafe ZIP path: {info.filename}")
            if member.suffix.lower() != ".wav":
                continue
            key = "/".join(member.parts).casefold()
            if key in seen:
                raise UnsafeArchiveError(f"Duplicate ZIP path: {info.filename}")
            seen.add(key)
            total_size += info.file_size
            if len(seen) > MAX_ARCHIVE_FILES or total_size > MAX_ARCHIVE_BYTES:
                raise UnsafeArchiveError("ZIP exceeds the PoC extraction safety limits")
            target = destination.joinpath(*member.parts)
            try:
                target.resolve().relative_to(root)
            except ValueError as exc:
                raise UnsafeArchiveError(f"Unsafe ZIP path: {info.filename}") from exc
            if target.exists():
                raise UnsafeArchiveError(f"Refusing to overwrite extracted file: {target}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as source_stream, target.open("xb") as target_stream:
                shutil.copyfileobj(source_stream, target_stream)
            extracted.append(target)
    return sorted(extracted)


def preprocess_wav(source: Path, output_directory: Path, *, silence_threshold: int = 500) -> PreparedAudio:
    """Split stereo PCM WAV into channels/downmix and calculate signal metrics."""

    output_directory.mkdir(parents=True, exist_ok=False)
    left_path = output_directory / "channel_0.wav"
    right_path = output_directory / "channel_1.wav"
    downmix_path = output_directory / "downmix.wav"

    count = 0
    left_sq = right_sq = left_sum = right_sum = cross_sum = 0
    left_silent = right_silent = 0
    with wave.open(str(source), "rb") as reader:
        _validate_wav(reader, source)
        params = reader.getparams()
        with (
            wave.open(str(left_path), "wb") as left_writer,
            wave.open(str(right_path), "wb") as right_writer,
            wave.open(str(downmix_path), "wb") as downmix_writer,
        ):
            for writer in (left_writer, right_writer, downmix_writer):
                writer.setnchannels(1)
                writer.setsampwidth(params.sampwidth)
                writer.setframerate(params.framerate)
                writer.setcomptype("NONE", "not compressed")
            while chunk := reader.readframes(16_384):
                samples = array("h")
                samples.frombytes(chunk)
                if sys.byteorder == "big":
                    samples.byteswap()
                left = samples[0::2]
                right = samples[1::2]
                downmix = array("h", ((a + b) // 2 for a, b in zip(left, right, strict=True)))
                _write_samples(left_writer, left)
                _write_samples(right_writer, right)
                _write_samples(downmix_writer, downmix)
                for a, b in zip(left, right, strict=True):
                    count += 1
                    left_sum += a
                    right_sum += b
                    left_sq += a * a
                    right_sq += b * b
                    cross_sum += a * b
                    left_silent += abs(a) <= silence_threshold
                    right_silent += abs(b) <= silence_threshold

    metrics = calculate_signal_metrics(
        frames=count,
        sample_rate=EXPECTED_SAMPLE_RATE,
        left_sum=left_sum,
        right_sum=right_sum,
        left_sq=left_sq,
        right_sq=right_sq,
        cross_sum=cross_sum,
        left_silent=left_silent,
        right_silent=right_silent,
    )
    return PreparedAudio(source, left_path, right_path, downmix_path, metrics)


def calculate_signal_metrics(
    *,
    frames: int,
    sample_rate: int,
    left_sum: int,
    right_sum: int,
    left_sq: int,
    right_sq: int,
    cross_sum: int,
    left_silent: int,
    right_silent: int,
) -> SignalMetrics:
    """Calculate RMS, silence rates, correlation, and separation screening."""

    if frames <= 0:
        raise AudioFormatError("WAV contains no audio frames")
    left_rms = math.sqrt(left_sq / frames)
    right_rms = math.sqrt(right_sq / frames)
    numerator = frames * cross_sum - left_sum * right_sum
    left_variance = frames * left_sq - left_sum * left_sum
    right_variance = frames * right_sq - right_sum * right_sum
    denominator = math.sqrt(max(0, left_variance) * max(0, right_variance))
    has_variance = denominator > 0
    correlation = numerator / denominator if has_variance else 0.0
    left_silence_rate = left_silent / frames
    right_silence_rate = right_silent / frames

    both_active = min(left_rms, right_rms) >= 200
    not_nearly_silent = max(left_silence_rate, right_silence_rate) <= 0.98
    low_correlation = has_variance and abs(correlation) <= 0.50
    if both_active and not_nearly_silent and low_correlation:
        status = "separable_candidate"
        reason = "Both channels carry signal and have low cross-channel correlation."
    else:
        status = "manual_review_required"
        reason = (
            "Signal checks do not establish independent speaker channels; "
            "do not treat diarization/channel agreement as accuracy."
        )
    return SignalMetrics(
        frames=frames,
        duration_seconds=frames / sample_rate,
        left_rms=left_rms,
        right_rms=right_rms,
        left_silence_rate=left_silence_rate,
        right_silence_rate=right_silence_rate,
        correlation=correlation,
        separation_status=status,
        separation_reason=reason,
    )


def _validate_wav(reader: wave.Wave_read, source: Path) -> None:
    if reader.getnchannels() != EXPECTED_CHANNELS:
        raise AudioFormatError(f"{source.name}: expected stereo WAV, got {reader.getnchannels()} channel(s)")
    if reader.getsampwidth() != EXPECTED_SAMPLE_WIDTH:
        raise AudioFormatError(f"{source.name}: expected 16-bit PCM WAV")
    if reader.getframerate() != EXPECTED_SAMPLE_RATE:
        raise AudioFormatError(f"{source.name}: expected 8000 Hz WAV, got {reader.getframerate()} Hz")
    if reader.getcomptype() != "NONE":
        raise AudioFormatError(f"{source.name}: compressed WAV is not supported")


def _write_samples(writer: wave.Wave_write, samples: array[int]) -> None:
    if sys.byteorder == "big":
        samples.byteswap()
    writer.writeframesraw(samples.tobytes())
