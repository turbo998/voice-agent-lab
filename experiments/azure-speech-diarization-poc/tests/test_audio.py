from __future__ import annotations

import tempfile
import unittest
import wave
import zipfile
from array import array
from pathlib import Path

from speech_poc.audio import UnsafeArchiveError, preprocess_wav, safe_extract_wavs


class AudioTests(unittest.TestCase):
    def test_split_downmix_and_metrics(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "input.wav"
            frames = [(1000, -500), (-1000, 500), (2000, 1000), (-2000, -1000)]
            samples = array("h", [sample for frame in frames for sample in frame])
            with wave.open(str(source), "wb") as writer:
                writer.setnchannels(2)
                writer.setsampwidth(2)
                writer.setframerate(8000)
                writer.writeframes(samples.tobytes())

            prepared = preprocess_wav(source, root / "prepared", silence_threshold=0)

            self.assertEqual(self._read_samples(prepared.left), [1000, -1000, 2000, -2000])
            self.assertEqual(self._read_samples(prepared.right), [-500, 500, 1000, -1000])
            self.assertEqual(self._read_samples(prepared.downmix), [250, -250, 1500, -1500])
            self.assertEqual(prepared.metrics.frames, 4)
            self.assertAlmostEqual(prepared.metrics.left_silence_rate, 0)

    def test_safe_zip_extracts_wav(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "input.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("nested/example.wav", b"wav")
                output.writestr("notes.txt", b"ignored")
            files = safe_extract_wavs(archive, root / "extracted")
            self.assertEqual([path.relative_to(root / "extracted").as_posix() for path in files], ["nested/example.wav"])

    def test_safe_zip_rejects_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "input.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("../escape.wav", b"bad")
            with self.assertRaises(UnsafeArchiveError):
                safe_extract_wavs(archive, root / "extracted")

    @staticmethod
    def _read_samples(path: Path) -> list[int]:
        with wave.open(str(path), "rb") as reader:
            samples = array("h")
            samples.frombytes(reader.readframes(reader.getnframes()))
            return list(samples)


if __name__ == "__main__":
    unittest.main()
