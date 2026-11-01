"""Command-line interface."""

from __future__ import annotations

import argparse
import logging
import wave
import zipfile
from pathlib import Path
from typing import Sequence

from speech_poc.azure_client import AzureTranscriptionError, MissingCredentialsError
from speech_poc.pipeline import execute

LOGGER = logging.getLogger("speech_poc")


def _parse_locale(value: str) -> str | None:
    return None if value.casefold() == "auto" else value


def build_parser() -> argparse.ArgumentParser:
    """Create the argument parser."""

    parser = argparse.ArgumentParser(description="Azure Speech split-channel and diarization PoC")
    parser.add_argument("input", type=Path, help="ZIP file or directory containing stereo PCM WAV files")
    parser.add_argument("--output", type=Path, default=Path("outputs"), help="Output root directory")
    parser.add_argument(
        "--locale",
        type=_parse_locale,
        default="zh-CN",
        help="Speech locale, or 'auto' to omit locale candidates (default: zh-CN)",
    )
    parser.add_argument(
        "--silence-threshold",
        type=int,
        default=500,
        help="Absolute 16-bit sample threshold used for silence screening",
    )
    parser.add_argument("--local-only", action="store_true", help="Skip all Azure requests")
    parser.add_argument(
        "--sensitivity-speakers",
        type=int,
        nargs="*",
        default=[3, 4],
        help="Max-speaker values for representative-file C experiments (default: 3 4)",
    )
    parser.add_argument(
        "--representative",
        help="Representative WAV filename/stem for C experiments; defaults to the longest file",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run the CLI and return a process status."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    logging.getLogger("azure").setLevel(logging.WARNING)
    args = build_parser().parse_args(argv)
    try:
        result = execute(
            args.input.resolve(),
            args.output.resolve(),
            locale=args.locale,
            silence_threshold=args.silence_threshold,
            local_only=args.local_only,
            sensitivity_speakers=args.sensitivity_speakers,
            representative=args.representative,
        )
    except (MissingCredentialsError, AzureTranscriptionError) as exc:
        LOGGER.error("%s", exc)
        LOGGER.error(
            "Local preprocessing remains in the newest output run. Set AZURE_SPEECH_ENDPOINT, "
            "then sign in with Azure CLI or Azure PowerShell, or set the optional API key."
        )
        return 2
    except (FileNotFoundError, ValueError, OSError, wave.Error, zipfile.BadZipFile) as exc:
        LOGGER.error("%s", exc)
        return 1
    LOGGER.info("Processed %d WAV file(s).", result.processed_count)
    LOGGER.info("Report: %s", result.report_path)
    return 0
