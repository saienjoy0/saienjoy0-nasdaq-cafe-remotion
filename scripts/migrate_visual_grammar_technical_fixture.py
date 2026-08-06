#!/usr/bin/env python3
"""Deterministically add Visual Grammar 1.0.0 metadata to one approved technical fixture.

The migration never infers from Scene numbers, narration, numeric direction, or
market content. Every Beat is matched by beatId and the expected preselected
visualTemplate in an explicit mapping file.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
from pathlib import Path
from typing import Any

EXPECTED_RENDERER_COMPATIBILITY_SHA256 = (
    "563bc71c58120552c3f601cab662a4f4287e44c149e46268ef5678d279b1adb6"
)
GRAMMAR_IDS = {
    "contradiction", "entity", "evidence", "gap", "causal", "reaction",
    "comparison", "verification", "analogy", "assembly", "bridge-text",
}
TRANSITION_ROLES = {"continuation", "major-shift", "return", "closing"}
SHA256_RE = re.compile(r"^[a-f0-9]{64}$")


class MigrationError(RuntimeError):
    pass


def sha_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_sha(value: Any) -> str:
    encoded = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return sha_bytes(encoded)


def load_json_bytes(path: Path) -> tuple[Any, bytes]:
    raw = path.read_bytes()
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise MigrationError(f"invalid UTF-8 JSON: {path}: {exc}") from exc
    return value, raw


def all_beats(spec: dict[str, Any]) -> list[dict[str, Any]]:
    scenes = spec.get("scenes")
    if not isinstance(scenes, list) or len(scenes) != 9:
        raise MigrationError("source fixture must contain exactly nine Scenes")
    beats: list[dict[str, Any]] = []
    for scene in scenes:
        scene_beats = scene.get("visualBeats") if isinstance(scene, dict) else None
        if not isinstance(scene_beats, list) or not scene_beats:
            scene_id = scene.get("sceneId") if isinstance(scene, dict) else "unknown"
            raise MigrationError(f"Scene has no Visual Beats: {scene_id}")
        for beat in scene_beats:
            if not isinstance(beat, dict):
                raise MigrationError("Visual Beat must be an object")
            beats.append(beat)
    return beats


def tts_identity(spec: dict[str, Any]) -> str:
    scenes = spec["scenes"]
    blocks = []
    for block_id, first_scene, last_scene in (
        ("scenes-01-04", 1, 4),
        ("scenes-05-09", 5, 9),
    ):
        speech = [
            chunk["speechText"]
            for scene in scenes
            if first_scene <= scene["sceneNumber"] <= last_scene
            for chunk in scene["narrationChunks"]
        ]
        blocks.append({"id": block_id, "speechText": speech})
    return canonical_sha({
        "synthesisVersion": "gemini-two-block-v1",
        "model": "gemini-3.1-flash-tts-preview",
        "voice": "Charon",
        "voiceProfileId": spec.get("voiceProfileId"),
        "pronunciations": spec.get("pronunciations"),
        "blocks": blocks,
    })


def migrate(
    *,
    source_path: Path,
    mapping_path: Path,
    registry_path: Path,
) -> tuple[dict[str, Any], dict[str, Any]]:
    source, source_raw = load_json_bytes(source_path)
    mapping, mapping_raw = load_json_bytes(mapping_path)
    _, registry_raw = load_json_bytes(registry_path)
    if not isinstance(source, dict) or not isinstance(mapping, dict):
        raise MigrationError("source and mapping roots must be objects")

    if mapping.get("contractVersion") != "1.0.0":
        raise MigrationError("mapping contractVersion must be 1.0.0")
    episode_id = mapping.get("episodeId")
    if source.get("episode", {}).get("id") != episode_id:
        raise MigrationError("mapping episodeId does not match source episode.id")
    if source.get("schemaVersion") != mapping.get("sourceSchemaVersion"):
        raise MigrationError("mapping sourceSchemaVersion does not match source")
    if mapping.get("targetSchemaVersion") != "2.4.0":
        raise MigrationError("mapping targetSchemaVersion must be 2.4.0")
    if mapping.get("sourceSpecPath") != source_path.as_posix():
        raise MigrationError("mapping sourceSpecPath does not match the requested source")
    if source.get("visualGrammarContract") is not None:
        raise MigrationError("source fixture already contains visualGrammarContract")

    registry_sha = sha_bytes(registry_raw)
    if registry_sha != EXPECTED_RENDERER_COMPATIBILITY_SHA256:
        raise MigrationError(
            "renderer compatibility registry changed; create a reviewed mapping revision "
            f"before migration (expected={EXPECTED_RENDERER_COMPATIBILITY_SHA256}, actual={registry_sha})"
        )

    beats = all_beats(source)
    source_by_id: dict[str, dict[str, Any]] = {}
    for beat in beats:
        beat_id = beat.get("beatId")
        if not isinstance(beat_id, str) or not beat_id:
            raise MigrationError("source Beat has no beatId")
        if beat_id in source_by_id:
            raise MigrationError(f"duplicate source beatId: {beat_id}")
        if "visualGrammarId" in beat or "transitionRole" in beat:
            raise MigrationError(f"source Beat already has Visual Grammar metadata: {beat_id}")
        source_by_id[beat_id] = beat

    mapped = mapping.get("beats")
    if not isinstance(mapped, list) or len(mapped) != len(beats):
        mapped_count = len(mapped) if isinstance(mapped, list) else "invalid"
        raise MigrationError(
            f"mapping must contain exactly {len(beats)} Beat entries; got={mapped_count}"
        )
    mapping_by_id: dict[str, dict[str, Any]] = {}
    for item in mapped:
        if not isinstance(item, dict):
            raise MigrationError("mapping Beat must be an object")
        beat_id = item.get("beatId")
        if not isinstance(beat_id, str) or not beat_id:
            raise MigrationError("mapping Beat has no beatId")
        if beat_id in mapping_by_id:
            raise MigrationError(f"duplicate mapping beatId: {beat_id}")
        source_beat = source_by_id.get(beat_id)
        if source_beat is None:
            raise MigrationError(f"mapping references unknown beatId: {beat_id}")
        expected_template = item.get("visualTemplate")
        if source_beat.get("visualTemplate") != expected_template:
            raise MigrationError(
                f"{beat_id}: visualTemplate mismatch; mapping={expected_template}, "
                f"source={source_beat.get('visualTemplate')}"
            )
        grammar_id = item.get("visualGrammarId")
        transition_role = item.get("transitionRole")
        if grammar_id not in GRAMMAR_IDS:
            raise MigrationError(f"{beat_id}: unsupported visualGrammarId: {grammar_id}")
        if transition_role not in TRANSITION_ROLES:
            raise MigrationError(f"{beat_id}: unsupported transitionRole: {transition_role}")
        if transition_role == "return":
            raise MigrationError(
                f"{beat_id}: this technical fixture mapping does not use return; "
                "resolve a production return target first"
            )
        mapping_by_id[beat_id] = item

    missing = sorted(set(source_by_id) - set(mapping_by_id))
    if missing:
        raise MigrationError(f"unmapped source Beats: {', '.join(missing)}")

    output = copy.deepcopy(source)
    output["schemaVersion"] = "2.4.0"
    output_beats = all_beats(output)
    for beat in output_beats:
        item = mapping_by_id[beat["beatId"]]
        beat["visualGrammarId"] = item["visualGrammarId"]
        beat["transitionRole"] = item["transitionRole"]

    source_sha = sha_bytes(source_raw)
    mapping_sha = sha_bytes(mapping_raw)
    output["visualGrammarContract"] = {
        "contractVersion": "1.0.0",
        "semanticsSha256": mapping_sha,
        "rendererCompatibilitySha256": registry_sha,
        "finalEpisodeContractSha256": source_sha,
        "beatCount": len(output_beats),
    }

    source_tts = tts_identity(source)
    output_tts = tts_identity(output)
    if source_tts != output_tts:
        raise MigrationError("migration changed the two-block TTS identity")

    manifest = {
        "contractVersion": "1.0.0",
        "status": "migrated-technical-fixture",
        "episodeId": episode_id,
        "sourceSpecPath": source_path.as_posix(),
        "sourceSpecSha256": source_sha,
        "mappingPath": mapping_path.as_posix(),
        "mappingSha256": mapping_sha,
        "rendererCompatibilityPath": registry_path.as_posix(),
        "rendererCompatibilitySha256": registry_sha,
        "targetSchemaVersion": "2.4.0",
        "beatCount": len(output_beats),
        "ttsInputSha256Before": source_tts,
        "ttsInputSha256After": output_tts,
        "ttsIdentityChanged": False,
        "marketMeaningChanged": False,
        "narrationChanged": False,
        "captionsChanged": False,
        "numbersChanged": False,
        "sourcesChanged": False,
        "productionEligible": False,
        "finalAuthorized": False,
    }
    return output, manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--mapping", required=True)
    parser.add_argument(
        "--registry",
        default="contracts/visual_grammar_renderer_compatibility.json",
    )
    parser.add_argument("--output", required=True)
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    source_path = Path(args.source)
    mapping_path = Path(args.mapping)
    registry_path = Path(args.registry)
    output_path = Path(args.output)
    manifest_path = Path(args.manifest)
    output, manifest = migrate(
        source_path=source_path,
        mapping_path=mapping_path,
        registry_path=registry_path,
    )
    output_text = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(output_text, encoding="utf-8")
    manifest = {
        **manifest,
        "outputSpecPath": output_path.as_posix(),
        "outputSpecSha256": sha_bytes(output_text.encode("utf-8")),
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
