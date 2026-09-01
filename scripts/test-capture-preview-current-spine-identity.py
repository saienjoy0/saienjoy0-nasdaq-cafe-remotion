#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAPTURE_PATH = ROOT / "scripts" / "capture-preview-current-spine-identity.py"

spec = importlib.util.spec_from_file_location("capture_preview_identity", CAPTURE_PATH)
if spec is None or spec.loader is None:
    raise AssertionError("could not load capture-preview-current-spine-identity.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def render_spec() -> dict:
    scenes = []
    for scene_number in range(1, 10):
        scene_id = f"scene-{scene_number:02d}"
        scenes.append(
            {
                "sceneNumber": scene_number,
                "sceneId": scene_id,
                "narrationChunks": [
                    {"chunkId": f"{scene_id}-chunk-01", "speechText": f"speech {scene_number}-1"},
                    {"chunkId": f"{scene_id}-chunk-02", "speechText": f"speech {scene_number}-2"},
                ],
            }
        )
    return {"scenes": scenes}


def technical_report(first_key: str, second_key: str) -> dict:
    chunks = []
    for scene_number in range(1, 10):
        scene_id = f"scene-{scene_number:02d}"
        cache_key = first_key if scene_number <= 4 else second_key
        for chunk_number in (1, 2):
            chunks.append(
                {
                    "sceneId": scene_id,
                    "chunkId": f"{scene_id}-chunk-{chunk_number:02d}",
                    "cacheKey": cache_key,
                }
            )
    return {"chunks": chunks}


def expect_system_exit(fn, needle: str) -> None:
    try:
        fn()
    except SystemExit as exc:
        if needle not in str(exc):
            raise AssertionError(f"expected SystemExit containing {needle!r}, got {exc!r}") from exc
    else:
        raise AssertionError(f"expected SystemExit containing {needle!r}")


def main() -> int:
    if not hasattr(module, "expected_block_cache_keys"):
        raise AssertionError("capture helper must derive TTS block cache keys from exact spec + technical report")

    first_key = "a" * 64
    second_key = "b" * 64
    value = render_spec()
    technical = technical_report(first_key, second_key)

    block_keys = module.expected_block_cache_keys(value, technical)
    assert block_keys == {
        "scenes-01-04": first_key,
        "scenes-05-09": second_key,
    }, block_keys

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        first_audio = root / first_key / "audio.wav"
        second_audio = root / second_key / "audio.wav"
        unknown_audio = root / ("c" * 64) / "audio.wav"
        for audio in (first_audio, second_audio, unknown_audio):
            audio.parent.mkdir(parents=True, exist_ok=True)
            audio.write_bytes(b"RIFF")

        assert module.identify_audio(first_audio, block_keys) == "scenes-01-04"
        assert module.identify_audio(second_audio, block_keys) == "scenes-05-09"
        expect_system_exit(
            lambda: module.identify_audio(unknown_audio, block_keys),
            "cannot bind cached audio to exactly one TTS block",
        )

    mixed = technical_report(first_key, second_key)
    mixed["chunks"][0]["cacheKey"] = second_key
    expect_system_exit(
        lambda: module.expected_block_cache_keys(value, mixed),
        "multiple cache keys",
    )

    missing = technical_report(first_key, second_key)
    missing.pop("chunks")
    expect_system_exit(
        lambda: module.expected_block_cache_keys(value, missing),
        "technical report chunks",
    )

    missing_chunk = technical_report(first_key, second_key)
    missing_chunk["chunks"].pop(0)
    expect_system_exit(
        lambda: module.expected_block_cache_keys(value, missing_chunk),
        "chunk coverage mismatch",
    )

    duplicate = technical_report(first_key, second_key)
    duplicate["chunks"].append(dict(duplicate["chunks"][0]))
    expect_system_exit(
        lambda: module.expected_block_cache_keys(value, duplicate),
        "duplicate technical chunk",
    )

    same_key = technical_report(first_key, first_key)
    expect_system_exit(
        lambda: module.expected_block_cache_keys(value, same_key),
        "TTS block cache keys must be distinct",
    )

    print("current Preview TTS block cache binding tests: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
