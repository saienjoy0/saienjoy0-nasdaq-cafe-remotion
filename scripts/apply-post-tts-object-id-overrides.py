#!/usr/bin/env python3
"""Apply explicitly-authored objectIds overrides between visual repair and event copies.

This helper never chooses objects. It only applies an ``objectIds`` array already
present on a rebuilt beat part in the repair request, then keeps the embedded
FINAL_PRODUCTION_SOURCE render_spec synchronized.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


class OverrideError(ValueError):
    pass


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise OverrideError(f"JSON root must be object: {path}")
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
        raise OverrideError("invalid confirmation")
    date = request.get("episodeDate")
    if not isinstance(date, str):
        raise OverrideError("episodeDate missing")

    spec_path = repo_root / f"render-specs/{date}/render_spec.json"
    package_path = repo_root / f"episode-packages/{date}/episode_package_{date}.md"
    spec_bytes = spec_path.read_bytes()
    package_bytes = package_path.read_bytes()
    if sha256(spec_bytes) != request.get("expectedAfterRenderSpecSha256"):
        raise OverrideError("pre-override render_spec SHA drift")
    if sha256(package_bytes) != request.get("expectedAfterEpisodePackageSha256"):
        raise OverrideError("pre-override episode_package SHA drift")

    spec = json.loads(spec_bytes.decode("utf-8"))
    beats = {
        beat.get("beatId"): beat
        for scene in spec.get("scenes", []) if isinstance(scene, dict)
        for beat in scene.get("visualBeats", []) if isinstance(beat, dict)
    }
    applied: list[dict[str, Any]] = []
    for split in request.get("sceneSplits", []):
        if not isinstance(split, dict):
            continue
        for rebuild in split.get("beatRebuilds", []):
            if not isinstance(rebuild, dict):
                continue
            for part in rebuild.get("parts", []):
                if not isinstance(part, dict) or "objectIds" not in part:
                    continue
                beat_id = part.get("beatId")
                object_ids = part.get("objectIds")
                if not isinstance(beat_id, str):
                    raise OverrideError("objectIds override beatId missing")
                if not isinstance(object_ids, list) or not all(isinstance(value, str) for value in object_ids):
                    raise OverrideError(f"{beat_id}: objectIds must be string array")
                beat = beats.get(beat_id)
                if not isinstance(beat, dict):
                    raise OverrideError(f"override beat missing: {beat_id}")
                beat["objectIds"] = object_ids
                applied.append({"beatId": beat_id, "objectIds": object_ids})

    spec_text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    intermediate_spec_sha = sha256(spec_text.encode("utf-8"))
    if intermediate_spec_sha != request.get("expectedIntermediateRenderSpecSha256"):
        raise OverrideError(f"unexpected intermediate render_spec SHA: {intermediate_spec_sha}")
    spec_path.write_text(spec_text, encoding="utf-8")

    md = update_final_source(package_bytes.decode("utf-8"), spec)
    intermediate_package_sha = sha256(md.encode("utf-8"))
    if intermediate_package_sha != request.get("expectedIntermediateEpisodePackageSha256"):
        raise OverrideError(f"unexpected intermediate episode_package SHA: {intermediate_package_sha}")
    package_path.write_text(md, encoding="utf-8")

    return {
        "contractVersion": "1.0.0",
        "status": "object-id-overrides-applied-awaiting-validator",
        "episodeDate": date,
        "overrides": applied,
        "intermediateRenderSpecSha256": intermediate_spec_sha,
        "intermediateEpisodePackageSha256": intermediate_package_sha,
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
    except (OverrideError, OSError, json.JSONDecodeError, ValueError, KeyError) as exc:
        print(json.dumps({"status": "fail", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 2
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
