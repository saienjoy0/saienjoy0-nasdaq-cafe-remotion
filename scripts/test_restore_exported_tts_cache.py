#!/usr/bin/env python3
from __future__ import annotations

import io
import json
import pathlib
import tarfile
import tempfile
import zipfile

from restore_exported_tts_cache import extract_portable_cache, load_registry, validate_cache

SHA = "a" * 64


def write_registry(root: pathlib.Path) -> None:
    path = root / "tts-cache-exports" / f"{SHA}.json"
    path.parent.mkdir(parents=True)
    path.write_text(
        json.dumps(
            {
                "registryVersion": "1.0",
                "ttsInputSha": SHA,
                "specSha256": "b" * 64,
                "artifactId": 123,
                "artifactName": "portable-cache",
                "runId": 456,
                "exportedAt": "2026-08-04T00:00:00Z",
            }
        ),
        encoding="utf-8",
    )


def make_artifact(
    path: pathlib.Path,
    prefix: str = ".cache/spec-tts-blocks",
) -> None:
    tar_bytes = io.BytesIO()
    with tarfile.open(fileobj=tar_bytes, mode="w:gz") as archive:
        for index in range(2):
            payload = b"RIFF-test"
            name = f"{prefix}/block-{index}/audio.wav"
            info = tarfile.TarInfo(name)
            info.size = len(payload)
            archive.addfile(info, io.BytesIO(payload))
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("portable-cache.tar.gz", tar_bytes.getvalue())


def main() -> None:
    with tempfile.TemporaryDirectory() as temporary:
        root = pathlib.Path(temporary)
        write_registry(root)
        registry = load_registry(root, SHA)
        assert registry["artifactId"] == 123
        artifact = root / "artifact.zip"
        make_artifact(artifact)
        extract_portable_cache(artifact, root)
        assert len(validate_cache(root)) == 2

    with tempfile.TemporaryDirectory() as temporary:
        root = pathlib.Path(temporary)
        artifact = root / "unsafe.zip"
        make_artifact(artifact, "../escaped")
        try:
            extract_portable_cache(artifact, root)
        except ValueError as error:
            assert "unsafe cache archive path" in str(error)
        else:
            raise AssertionError("unsafe archive path was accepted")

    print("portable TTS cache restore tests: pass")


if __name__ == "__main__":
    main()
