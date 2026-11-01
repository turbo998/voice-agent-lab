"""Azure Fast Transcription SDK adapter."""

from __future__ import annotations

import os
import time
from pathlib import Path


class MissingCredentialsError(RuntimeError):
    """Raised when the required Speech endpoint is unavailable."""


class AzureTranscriptionError(RuntimeError):
    """Raised when an Azure transcription request fails."""


class FastTranscriber:
    """Perform synchronous Fast Transcription calls without logging secrets."""

    def __init__(self) -> None:
        endpoint = os.environ.get("AZURE_SPEECH_ENDPOINT")
        api_key = os.environ.get("AZURE_SPEECH_API_KEY")
        if not endpoint:
            raise MissingCredentialsError(
                "Azure transcription was not started. Missing environment variable: "
                "AZURE_SPEECH_ENDPOINT"
            )
        endpoint = endpoint.rstrip("/")
        from azure.ai.transcription import TranscriptionClient
        from azure.core.credentials import AzureKeyCredential

        if api_key:
            credential = AzureKeyCredential(api_key)
        else:
            from azure.identity import DefaultAzureCredential

            credential = DefaultAzureCredential()
        self._client = TranscriptionClient(endpoint=endpoint, credential=credential)

    def transcribe_channels(
        self, audio_path: Path, *, locale: str | None
    ) -> tuple[dict[str, object], float]:
        """Transcribe stereo channels 0 and 1 separately."""

        return self._transcribe(audio_path, locale=locale, active_channels=[0, 1])

    def transcribe_diarized(
        self,
        audio_path: Path,
        *,
        locale: str | None,
        max_speakers: int,
    ) -> tuple[dict[str, object], float]:
        """Transcribe mono audio with speaker diarization."""

        return self._transcribe(audio_path, locale=locale, max_speakers=max_speakers)

    def _transcribe(
        self,
        audio_path: Path,
        *,
        locale: str | None,
        active_channels: list[int] | None = None,
        max_speakers: int | None = None,
    ) -> tuple[dict[str, object], float]:
        from azure.ai.transcription.models import (
            TranscriptionContent,
            TranscriptionDiarizationOptions,
            TranscriptionOptions,
        )
        from azure.core.exceptions import AzureError

        kwargs: dict[str, object] = {}
        if locale is not None:
            kwargs["locales"] = [locale]
        if active_channels is not None:
            kwargs["active_channels"] = active_channels
        if max_speakers is not None:
            diarization = TranscriptionDiarizationOptions(max_speakers=max_speakers)
            # SDK 1.0.0 does not serialize the service-required flag automatically.
            diarization.enabled = True
            kwargs["diarization_options"] = diarization
        options = TranscriptionOptions(**kwargs)
        started = time.perf_counter()
        try:
            with audio_path.open("rb") as audio:
                result = self._client.transcribe(TranscriptionContent(definition=options, audio=audio))
        except AzureError as exc:
            raise AzureTranscriptionError(
                f"Azure Fast Transcription failed for {audio_path.name}: {type(exc).__name__}: {exc}"
            ) from exc
        return result.as_dict(), time.perf_counter() - started
