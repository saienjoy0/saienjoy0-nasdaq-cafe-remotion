#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

BLOCK_RANGES = (
    ("scenes-01-04", 1, 4),
    ("scenes-05-09", 5, 9),
)
BLOCK_IDS = tuple(block_id for block_id, _, _ in BLOCK_RANGES)
CACHE_KEY_RE = re.compile(r"[0-9a-f]{64}")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise SystemExit(f"JSON root must be object: {path}")
    return value


def tts_input_sha(spec: dict[str, Any]) -> str:
    blocks = []
    for block_id, first, last in BLOCK_RANGES:
        speech = [
            chunk["speechText"]
            for scene in spec["scenes"]
            if first <= scene["sceneNumber"] <= last
            for chunk in scene["narrationChunks"]
        ]
        if not speech:
            raise SystemExit(f"{block_id} has no speechText")
        blocks.append({"id": block_id, "speechText": speech})
    payload = {
        "synthesisVersion": "gemini-two-block-v1",
        "model": os.environ.get("GEMINI_TTS_MODEL", "gemini-3.1-flash-tts-preview"),
        "voice": os.environ.get("GEMINI_TTS_VOICE", "Charon"),
        "voiceProfileId": spec.get("voiceProfileId"),
        "pronunciations": spec.get("pronunciations"),
        "blocks": blocks,
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def expected_block_cache_keys(
    spec: dict[str, Any], technical: dict[str, Any]
) -> dict[str, str]:
    scenes = spec.get("scenes")
    if not isinstance(scenes, list):
        raise SystemExit("render spec scenes must be an array")

    expected_by_block: dict[str, list[tuple[str, str]]] = {
        block_id: [] for block_id in BLOCK_IDS
    }
    expected_pairs: set[tuple[str, str]] = set()
    for scene in scenes:
        if not isinstance(scene, dict):
            raise SystemExit("render spec scene must be an object")
        scene_number = scene.get("sceneNumber")
        scene_id = scene.get("sceneId")
        chunks = scene.get("narrationChunks")
        if not isinstance(scene_number, int) or isinstance(scene_number, bool):
            raise SystemExit("render spec sceneNumber must be an integer")
        if not isinstance(scene_id, str) or not scene_id:
            raise SystemExit("render spec sceneId must be a non-empty string")
        if not isinstance(chunks, list):
            raise SystemExit(f"{scene_id}: narrationChunks must be an array")

        block_id = next(
            (
                candidate
                for candidate, first, last in BLOCK_RANGES
                if first <= scene_number <= last
            ),
            None,
        )
        if block_id is None:
            continue
        for chunk in chunks:
            if not isinstance(chunk, dict):
                raise SystemExit(f"{scene_id}: narration chunk must be an object")
            chunk_id = chunk.get("chunkId")
            if not isinstance(chunk_id, str) or not chunk_id:
                raise SystemExit(f"{scene_id}: chunkId must be a non-empty string")
            pair = (scene_id, chunk_id)
            if pair in expected_pairs:
                raise SystemExit(f"duplicate render spec chunk: {scene_id}/{chunk_id}")
            expected_pairs.add(pair)
            expected_by_block[block_id].append(pair)

    for block_id, pairs in expected_by_block.items():
        if not pairs:
            raise SystemExit(f"{block_id} has no render spec chunks")

    technical_chunks = technical.get("chunks")
    if not isinstance(technical_chunks, list):
        raise SystemExit("technical report chunks must be an array")

    technical_by_pair: dict[tuple[str, str], str] = {}
    for item in technical_chunks:
        if not isinstance(item, dict):
            raise SystemExit("technical report chunk must be an object")
        scene_id = item.get("sceneId")
        chunk_id = item.get("chunkId")
        cache_key = item.get("cacheKey")
        if not isinstance(scene_id, str) or not isinstance(chunk_id, str):
            raise SystemExit("technical report chunk identity must contain sceneId/chunkId")
        pair = (scene_id, chunk_id)
        if pair in technical_by_pair:
            raise SystemExit(f"duplicate technical chunk: {scene_id}/{chunk_id}")
        if not isinstance(cache_key, str) or not CACHE_KEY_RE.fullmatch(cache_key):
            raise SystemExit(f"invalid technical cacheKey for {scene_id}/{chunk_id}")
        technical_by_pair[pair] = cache_key

    actual_pairs = set(technical_by_pair)
    if actual_pairs != expected_pairs:
        missing = sorted(expected_pairs - actual_pairs)
        extra = sorted(actual_pairs - expected_pairs)
        raise SystemExit(
            f"technical chunk coverage mismatch: missing={missing} extra={extra}"
        )

    block_keys: dict[str, str] = {}
    for block_id, pairs in expected_by_block.items():
        keys = {technical_by_pair[pair] for pair in pairs}
        if len(keys) != 1:
            raise SystemExit(f"{block_id} has multiple cache keys: {sorted(keys)}")
        block_keys[block_id] = next(iter(keys))

    if len(set(block_keys.values())) != len(BLOCK_IDS):
        raise SystemExit("TTS block cache keys must be distinct")
    return block_keys


def identify_audio(audio: Path, block_cache_keys: dict[str, str]) -> str:
    cache_key = audio.parent.name
    matches = [
        block_id
        for block_id, expected_cache_key in block_cache_keys.items()
        if cache_key == expected_cache_key
    ]
    if len(matches) != 1:
        raise SystemExit(f"cannot bind cached audio to exactly one TTS block: {audio}")
    return matches[0]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--episode-date", required=True)
    p.add_argument("--spec", required=True, type=Path)
    p.add_argument("--runtime-registry", required=True, type=Path)
    p.add_argument("--handoff-download-root", required=True, type=Path)
    p.add_argument("--technical-report", required=True, type=Path)
    p.add_argument("--renderer-contract-version", required=True)
    p.add_argument("--registry-sha256", required=True)
    p.add_argument("--expected-bundle-id", required=True)
    p.add_argument("--expected-manifest-sha256", required=True)
    p.add_argument("--output-root", required=True, type=Path)
    args = p.parse_args()

    spec = args.spec.resolve()
    registry = args.runtime_registry.resolve()
    report = args.technical_report.resolve()
    for path in (spec, registry, report):
        if not path.is_file():
            raise SystemExit(f"required Preview evidence missing: {path}")

    spec_value = load(spec)
    technical = load(report)
    block_cache_keys = expected_block_cache_keys(spec_value, technical)
    renderer_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    cache = Path(".cache/spec-tts-blocks").resolve()
    audios = sorted(cache.rglob("audio.wav")) if cache.is_dir() else []
    if len(audios) != 2:
        raise SystemExit(f"expected exactly two cached TTS audio.wav files; found {len(audios)}")
    by_block: dict[str, Path] = {}
    for audio in audios:
        block = identify_audio(audio, block_cache_keys)
        if block in by_block:
            raise SystemExit(f"duplicate cached audio for {block}")
        by_block[block] = audio
    if set(by_block) != set(BLOCK_IDS):
        raise SystemExit(f"TTS block coverage mismatch: {sorted(by_block)}")

    out = args.output_root.resolve()
    out.mkdir(parents=True, exist_ok=True)
    approved_cache = out / "approved-tts-cache"
    if approved_cache.exists():
        shutil.rmtree(approved_cache)
    shutil.copytree(cache, approved_cache)
    approved_handoff = out / "approved-handoff"
    if approved_handoff.exists():
        shutil.rmtree(approved_handoff)
    shutil.copytree(args.handoff_download_root.resolve(), approved_handoff)
    approved_data = out / "approved-production-data"
    approved_data.mkdir(parents=True, exist_ok=True)
    shutil.copy2(spec, approved_data / "render_spec.json")
    shutil.copy2(registry, approved_data / "runtime_asset_registry.json")

    identity = {
        "contractVersion": "1.0.0",
        "episodeDate": args.episode_date,
        "rendererCommit": renderer_commit,
        "rendererContractVersion": args.renderer_contract_version,
        "registrySnapshotSha256": args.registry_sha256,
        "inputSpecSha256": sha256(spec),
        "ttsInputSha256": tts_input_sha(spec_value),
        "ttsBlockAudioSha256": {
            block: sha256(by_block[block]) for block in BLOCK_IDS
        },
        "expectedBundleId": args.expected_bundle_id,
        "expectedManifestSha256": args.expected_manifest_sha256,
        "runtimeRegistrySha256": sha256(registry),
    }
    identity_path = out / "preview_identity.json"
    identity_path.write_text(
        json.dumps(identity, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    technical["currentSpineIdentity"] = {
        **identity,
        "previewIdentitySha256": sha256(identity_path),
    }
    report.write_text(
        json.dumps(technical, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(identity, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
