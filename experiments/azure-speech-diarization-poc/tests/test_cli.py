from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType
from unittest.mock import MagicMock, patch

from speech_poc.azure_client import FastTranscriber, MissingCredentialsError
from speech_poc.cli import build_parser, main


class CliTests(unittest.TestCase):
    def test_auto_locale_omits_locale_candidates(self) -> None:
        args = build_parser().parse_args(["input.zip", "--locale", "auto"])
        self.assertIsNone(args.locale)

    def test_malformed_zip_returns_controlled_error(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary) / "bad.zip"
            source.write_bytes(b"not a zip")
            self.assertEqual(main([str(source), "--local-only"]), 1)

    def test_malformed_wav_returns_controlled_error(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "bad.wav").write_bytes(b"not a wav")
            self.assertEqual(main([str(root), "--output", str(root / "out"), "--local-only"]), 1)

    @patch("azure.ai.transcription.TranscriptionClient")
    def test_transcriber_uses_default_azure_credential_without_key(
        self,
        client_type: MagicMock,
    ) -> None:
        credential_type = MagicMock()
        credential = credential_type.return_value
        identity_module = ModuleType("azure.identity")
        identity_module.DefaultAzureCredential = credential_type
        with patch.dict(sys.modules, {"azure.identity": identity_module}):
            with patch.dict(
                "os.environ",
                {"AZURE_SPEECH_ENDPOINT": "https://speech.example.invalid/"},
                clear=True,
            ):
                FastTranscriber()
        credential_type.assert_called_once_with()
        client_type.assert_called_once_with(
            endpoint="https://speech.example.invalid",
            credential=credential,
        )

    @patch("azure.ai.transcription.TranscriptionClient")
    @patch("azure.core.credentials.AzureKeyCredential")
    def test_transcriber_retains_api_key_fallback(
        self,
        credential_type: MagicMock,
        client_type: MagicMock,
    ) -> None:
        credential = credential_type.return_value
        with patch.dict(
            "os.environ",
            {
                "AZURE_SPEECH_ENDPOINT": "https://speech.example.invalid",
                "AZURE_SPEECH_API_KEY": "test-key",
            },
            clear=True,
        ):
            FastTranscriber()
        credential_type.assert_called_once_with("test-key")
        client_type.assert_called_once_with(
            endpoint="https://speech.example.invalid",
            credential=credential,
        )

    @patch("azure.ai.transcription.TranscriptionClient")
    @patch("azure.core.credentials.AzureKeyCredential")
    def test_auto_locale_is_omitted_from_diarization_request(
        self,
        credential_type: MagicMock,
        client_type: MagicMock,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            audio_path = Path(temporary) / "audio.wav"
            audio_path.write_bytes(b"")
            with patch.dict(
                "os.environ",
                {
                    "AZURE_SPEECH_ENDPOINT": "https://speech.example.invalid",
                    "AZURE_SPEECH_API_KEY": "test-key",
                },
                clear=True,
            ):
                transcriber = FastTranscriber()
            transcriber.transcribe_diarized(audio_path, locale=None, max_speakers=2)

        content = client_type.return_value.transcribe.call_args.args[0]
        self.assertEqual(
            content.definition.as_dict(),
            {"diarization": {"maxSpeakers": 2, "enabled": True}},
        )

    def test_transcriber_requires_only_endpoint(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaisesRegex(MissingCredentialsError, "AZURE_SPEECH_ENDPOINT"):
                FastTranscriber()

    @patch("azure.ai.transcription.TranscriptionClient")
    @patch("azure.identity.DefaultAzureCredential")
    def test_diarization_request_explicitly_enables_service_feature(
        self,
        credential_type: MagicMock,
        client_type: MagicMock,
    ) -> None:
        client_type.return_value.transcribe.return_value.as_dict.return_value = {"phrases": []}
        with tempfile.TemporaryDirectory() as temporary:
            audio = Path(temporary) / "audio.wav"
            audio.write_bytes(b"audio")
            with patch.dict(
                "os.environ",
                {"AZURE_SPEECH_ENDPOINT": "https://speech.example.invalid"},
                clear=True,
            ):
                transcriber = FastTranscriber()
                transcriber.transcribe_diarized(audio, locale="en-US", max_speakers=2)

        content = client_type.return_value.transcribe.call_args.args[0]
        self.assertEqual(
            content.definition.as_dict(),
            {
                "locales": ["en-US"],
                "diarization": {"maxSpeakers": 2, "enabled": True},
            },
        )


if __name__ == "__main__":
    unittest.main()
