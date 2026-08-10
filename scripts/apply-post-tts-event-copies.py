#!/usr/bin/env python3
"""Copy explicitly named existing visual events to explicitly authored new chunk cues."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
from typing import Any


class EventCopyError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise EventCopyError(f"JSON root must be object: {path}")
    return value


def update_final_source(md: str, spec: dict[str, Any]) -> str:
    marker = "<!--BEGIN_FINAL_PRODUCTION_SOURCE-->"
    start = md.index(marker)
    json_start = md.index("```json", start) + len("```json")
    json_end = md.index("```", json_start)
    source = json.loads(md[json_start:json_end].strip())
    source["render_spec"] = spec
    rendered = "\n" + json.dumps(source, ensure_ascii=False, indent=2) + "\n"
    return md[:json_start] + rendered + md[json_end:]


def apply(repo_root: Path, request_path: Path) -> dict[str, Any]:
    request = load(request_path)
    if request.get("confirmation") != "APPLY_POST_TTS_AUTHORING_REPAIR_WITH_EVENT_COPIES":
        raise EventCopyError("invalid event-copy confirmation")
    date = request.get("episodeDate")
    if not isinstance(date, str):
        raise EventCopyError("episodeDate missing")
    spec_path = repo_root / f"render-specs/{date}/render_spec.json"
    package_path = repo_root / f"episode-packages/{date}/episode_package_{date}.md"
    spec_bytes = spec_path.read_bytes()
    package_bytes = package_path.read_bytes()
    if sha256(spec_bytes) != request.get("expectedIntermediateRenderSpecSha256"):
        raise EventCopyError("intermediate render_spec SHA drift")
    if sha256(package_bytes) != request.get("expectedIntermediateEpisodePackageSha256"):
        raise EventCopyError("intermediate episode_package SHA drift")
    spec = json.loads(spec_bytes.decode("utf-8"))
    scenes = {scene.get("sceneId"): scene for scene in spec.get("scenes", []) if isinstance(scene, dict)}
    all_event_ids = {
        event.get("eventId")
        for scene in scenes.values()
        for event in scene.get("visualEvents", [])
        if isinstance(event, dict)
    }
    applied: list[dict[str, str]] = []
    for item in request.get("visualEventCopies", []):
        if not isinstance(item, dict):
            raise EventCopyError("visualEventCopies entry must be object")
        scene_id = item.get("sceneId")
        source_id = item.get("sourceEventId")
        new_id = item.get("newEventId")
        at_chunk = item.get("atChunkId")
        if not all(isinstance(value, str) and value for value in (scene_id, source_id, new_id, at_chunk)):
            raise EventCopyError(f"invalid event copy: {item}")
        scene = scenes.get(scene_id)
        if not isinstance(scene, dict):
            raise EventCopyError(f"scene missing: {scene_id}")
        source = next(
            (event for event in scene.get("visualEvents", []) if isinstance(event, dict) and event.get("eventId") == source_id),
            None,
        )
        if not isinstance(source, dict):
            raise EventCopyError(f"source event missing: {source_id}")
        if source.get("action") != "show" or source.get("timing") != "chunk-start":
            raise EventCopyError(f"source event must be chunk-start show: {source_id}")
        if new_id in all_event_ids:
            raise EventCopyError(f"new eventId already exists: {new_id}")
        chunks = {c.get("chunkId") for c in scene.get("narrationChunks", []) if isinstance(c, dict)}
        if at_chunk not in chunks:
            raise EventCopyError(f"target chunk missing: {at_chunk}")
        copied = copy.deepcopy(source)
        copied["eventId"] = new_id
        copied["atChunkId"] = at_chunk
        scene["visualEvents"].append(copied)
        all_event_ids.add(new_id)
        applied.append({
            "sceneId": scene_id,
            "sourceEventId": source_id,
            "newEventId": new_id,
            "atChunkId": at_chunk,
            "targetId": str(copied.get("targetId")),
        })

    spec_text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    final_spec_sha = sha256(spec_text.encode("utf-8"))
    if final_spec_sha != request.get("expectedFinalRenderSpecSha256"):
        raise EventCopyError(f"unexpected final render_spec SHA: {final_spec_sha}")
    spec_path.write_text(spec_text, encoding="utf-8")

    md = update_final_source(package_bytes.decode("utf-8"), spec)
    final_package_sha = sha256(md.encode("utf-8"))
    if final_package_sha != request.get("expectedFinalEpisodePackageSha256"):
        raise EventCopyError(f"unexpected final episode_package SHA: {final_package_sha}")
    package_path.write_text(md, encoding="utf-8")
    return {
        "contractVersion": "1.0.0",
        "status": "event-copies-applied-awaiting-validator",
        "episodeDate": date,
        "eventCopies": applied,
        "finalRenderSpecSha256": final_spec_sha,
        "finalEpisodePackageSha256": final_package_sha,
        "editorialChanged": False,
        "narrationWordingChanged": False,
        "captionWordingChanged": False,
        "numbersChanged": False,
        "sourcesChanged": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = args.repo_root.resolve()
    request = args.request if args.request.is_absolute() else root / args.request
    output = args.output if args.output.is_absolute() else root / args.output
    try:
        result = apply(root, request)
    except (EventCopyError, OSError, json.JSONDecodeError, ValueError) as exc:
        print(json.dumps({"status": "fail", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 2
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
