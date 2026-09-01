#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "restore-approved-preview-for-final.py"
DATE = "2099-07-01"
RENDERER_COMMIT = "b" * 40
CONTRACT = "2.4.0"
REGISTRY_SHA = "c" * 64
SPEC_BYTES = b'{"scenes":[]}\n'
REGISTRY_BYTES = b'{"assets":[]}\n'
TTS_INPUT_SHA = "d" * 64


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="nasdaq-final-restore-") as tmp:
        root = Path(tmp)
        approved = root / "approved-preview-inputs"
        cache = approved / "approved-tts-cache"
        handoff = approved / "approved-handoff"
        data = approved / "approved-production-data"
        handoff.mkdir(parents=True)
        data.mkdir(parents=True)

        first_audio = b"RIFF-approved-scenes-01-04"
        second_audio = b"RIFF-approved-scenes-05-09"
        first_sha = digest(first_audio)
        second_sha = digest(second_audio)
        for key, audio_bytes in (("1" * 64, first_audio), ("2" * 64, second_audio)):
            target = cache / key / "audio.wav"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(audio_bytes)

        spec_path = data / "render_spec.json"
        registry_path = data / "runtime_asset_registry.json"
        spec_path.write_bytes(SPEC_BYTES)
        registry_path.write_bytes(REGISTRY_BYTES)
        identity = {
            "contractVersion": "1.0.0",
            "episodeDate": DATE,
            "rendererCommit": RENDERER_COMMIT,
            "rendererContractVersion": CONTRACT,
            "registrySnapshotSha256": REGISTRY_SHA,
            "inputSpecSha256": digest(SPEC_BYTES),
            "ttsInputSha256": TTS_INPUT_SHA,
            "ttsBlockAudioSha256": {
                "scenes-01-04": first_sha,
                "scenes-05-09": second_sha,
            },
            "runtimeRegistrySha256": digest(REGISTRY_BYTES),
            "expectedBundleId": "bundle-id",
            "expectedManifestSha256": "e" * 64,
        }
        identity_path = approved / "preview_identity.json"
        identity_path.write_text(
            json.dumps(identity, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        output = root / "restored"
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--preview-root", str(root),
                "--episode-date", DATE,
                "--renderer-commit", RENDERER_COMMIT,
                "--renderer-contract-version", CONTRACT,
                "--registry-sha256", REGISTRY_SHA,
                "--spec-sha256", digest(SPEC_BYTES),
                "--tts-input-sha256", TTS_INPUT_SHA,
                "--audio-01-04-sha256", first_sha,
                "--audio-05-09-sha256", second_sha,
                "--preview-identity-sha256", digest(identity_path.read_bytes()),
                "--output-root", str(output),
            ],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        if result.returncode != 0:
            raise AssertionError(
                "Final restore must bind hash-keyed approved cache audio by exact approved audio SHA, "
                f"not filename/adjacent-label inference. Output:\n{result.stdout}"
            )
        restored = json.loads(result.stdout)
        expected = identity["ttsBlockAudioSha256"]
        if restored.get("ttsBlockAudioSha256") != expected:
            raise AssertionError(f"restored audio binding mismatch: {restored}")
        if not (output / "tts-cache" / ("1" * 64) / "audio.wav").is_file():
            raise AssertionError("approved cache bytes were not restored")

    print("approved Preview Final restore SHA binding PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
