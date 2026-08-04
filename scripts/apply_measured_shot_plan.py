#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import pathlib
import re
import subprocess
from typing import Any

STYLE_FIELDS = {
    "shotRecipe",
    "primaryTargetId",
    "referenceTargetId",
    "outcomeTargetId",
    "secondaryTargetIds",
    "cameraTargetId",
    "stageLayout",
    "cameraPreset",
    "transitionIn",
    "transitionOut",
    "continuityKey",
    "typographyTreatment",
    "typographyText",
    "soundCue",
    "foxExpression",
}
REQUEST_FIELDS = {
    "requestVersion",
    "episodeDate",
    "expectedSpecSha256",
    "expectedEpisodePackageBlobSha",
    "shotPlanVersion",
    "expectedShotCount",
    "localTimingAudit",
    "beats",
    "confirmation",
}
TIMING_FIELDS = {
    "sourceProductionDurationMs",
    "maximumShotDurationMs",
    "maximumGapMs",
    "maximumOverlapMs",
    "maximumTailGapMs",
}
PLAN_ITEM_FIELDS = {"startCue", "endCue", "sourceShot", "overrides"}
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
BLOB_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
BEAT_ID_RE = re.compile(r"^scene-0[1-9]-beat-[0-9]{3}$")


def fail(message: str) -> None:
    raise SystemExit(message)


def normalize(value: str) -> str:
    return re.sub(r"\s+", "", value).strip()


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git_blob_sha(path: pathlib.Path, root: pathlib.Path) -> str:
    return subprocess.run(
        ["git", "hash-object", str(path.relative_to(root))],
        cwd=root,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    ).stdout.strip()


def cue_progress(speech_text: str, cue: str, edge: str) -> float:
    speech = normalize(speech_text)
    needle = normalize(cue)
    if not needle:
        fail("Shot cue must not be empty")
    occurrences = [match.start() for match in re.finditer(re.escape(needle), speech)]
    if len(occurrences) != 1:
        fail(f"Shot cue must occur exactly once; cue={cue!r} occurrences={len(occurrences)}")
    index = occurrences[0]
    if edge == "end":
        index += len(needle)
    return index / len(speech)


def render_shot_section(spec: dict[str, Any]) -> str:
    shot_count = sum(
        len(beat.get("shots", []))
        for scene in spec["scenes"]
        for beat in scene["visualBeats"]
    )
    lines = [
        "## Visual Story Engine v3 Shot Plan",
        "",
        "固定背景・狐左位置・字幕領域を維持し、メイン表示領域内だけでShot、内部カメラ、前後要素の引継ぎを行う。",
        "",
        f"- 総Shot数：{shot_count}",
    ]
    for scene in spec["scenes"]:
        lines.append(f"### {scene['sceneId']}")
        for beat in scene["visualBeats"]:
            shots = beat.get("shots", [])
            if not shots:
                continue
            lines.append(f"- `{beat['beatId']}` / `{beat['visualTemplate']}`")
            for shot in shots:
                lines.append(
                    "  - "
                    f"`{shot['shotId']}`: `{shot['shotRecipe']}` / "
                    f"`{shot['stageLayout']}` / camera `{shot['cameraPreset']}` / "
                    f"fox `{shot['foxExpression']}` / "
                    f"`{shot['startChunkId']}@{shot['startProgress']:.3f} → "
                    f"{shot['endChunkId']}@{shot['endProgress']:.3f}` / "
                    f"continuity `{shot['continuityKey']}`"
                )
    return "\n".join(lines).rstrip() + "\n\n"


def update_episode_package(
    package_text: str,
    spec: dict[str, Any],
    request: dict[str, Any],
) -> str:
    start_marker = "## Visual Story Engine v3 Shot Plan\n"
    end_marker = "## Visual Story Engine v3.1 stabilization"
    start = package_text.find(start_marker)
    end = package_text.find(end_marker)
    if start < 0 or end < 0 or end <= start:
        fail("episode package Shot Plan section markers were not found")

    package_text = (
        package_text[:start]
        + render_shot_section(spec)
        + package_text[end:]
    )
    package_text = re.sub(
        r"^- \d+ Shotを維持し、全12 Recipeを専用Rendererへ接続。$",
        f"- {request['expectedShotCount']} Shotへ再設計し、全12 Recipeを専用Rendererへ接続。",
        package_text,
        flags=re.MULTILINE,
    )
    timing = request["localTimingAudit"]
    audit_line = (
        "- 実測403.2秒タイムラインによるShot timing監査："
        f"最長{timing['maximumShotDurationMs']}ms、"
        f"最大gap {timing['maximumGapMs']}ms、"
        f"最大overlap {timing['maximumOverlapMs']}ms、"
        f"最大Beat末尾余白 {timing['maximumTailGapMs']}ms。"
    )
    package_text = re.sub(
        r"^- 実測403\.2秒タイムラインによるShot timing監査：.*$\n?",
        "",
        package_text,
        flags=re.MULTILINE,
    )
    stabilization_heading = "## Visual Story Engine v3.1 stabilization\n\n"
    if stabilization_heading not in package_text:
        fail("episode package stabilization heading was not found")
    package_text = package_text.replace(
        stabilization_heading,
        stabilization_heading + audit_line + "\n",
        1,
    )
    return package_text


def apply_request(root: pathlib.Path, request_path: pathlib.Path) -> dict[str, Any]:
    request = json.loads(request_path.read_text(encoding="utf-8"))
    if not isinstance(request, dict) or set(request) != REQUEST_FIELDS:
        fail("Shot plan request fields are invalid")
    if request["requestVersion"] != "1.0":
        fail("requestVersion must be 1.0")
    if request["confirmation"] != "APPLY_MEASURED_SHOT_PLAN":
        fail("confirmation must be APPLY_MEASURED_SHOT_PLAN")
    episode_date = request["episodeDate"]
    if not isinstance(episode_date, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", episode_date):
        fail("episodeDate must match YYYY-MM-DD")
    expected_spec_sha = request["expectedSpecSha256"]
    expected_package_blob = request["expectedEpisodePackageBlobSha"]
    if not isinstance(expected_spec_sha, str) or not SHA256_RE.fullmatch(expected_spec_sha):
        fail("expectedSpecSha256 must be lowercase SHA-256")
    if not isinstance(expected_package_blob, str) or not BLOB_SHA_RE.fullmatch(expected_package_blob):
        fail("expectedEpisodePackageBlobSha must be a Git blob SHA")
    if not isinstance(request["expectedShotCount"], int) or isinstance(request["expectedShotCount"], bool):
        fail("expectedShotCount must be an integer")
    if not isinstance(request["localTimingAudit"], dict) or set(request["localTimingAudit"]) != TIMING_FIELDS:
        fail("localTimingAudit fields are invalid")
    for key, value in request["localTimingAudit"].items():
        if not isinstance(value, int) or isinstance(value, bool) or value < 0:
            fail(f"localTimingAudit.{key} must be a non-negative integer")
    if request["localTimingAudit"]["maximumShotDurationMs"] > 10_000:
        fail("localTimingAudit maximumShotDurationMs exceeds production contract")
    if request["localTimingAudit"]["maximumGapMs"] > 500:
        fail("localTimingAudit maximumGapMs exceeds production contract")
    if request["localTimingAudit"]["maximumOverlapMs"] > 250:
        fail("localTimingAudit maximumOverlapMs exceeds production contract")
    if request["localTimingAudit"]["maximumTailGapMs"] > 500:
        fail("localTimingAudit maximumTailGapMs exceeds production contract")
    if not isinstance(request["beats"], dict) or not request["beats"]:
        fail("beats must be a non-empty object")

    spec_path = root / "render-specs" / episode_date / "render_spec.json"
    package_path = root / "episode-packages" / episode_date / f"episode_package_{episode_date}.md"
    if not spec_path.is_file() or not package_path.is_file():
        fail("render spec or episode package was not found")
    old_spec_sha = sha256(spec_path)
    old_package_sha = sha256(package_path)
    if old_spec_sha != expected_spec_sha:
        fail(f"render_spec SHA mismatch: expected={expected_spec_sha} actual={old_spec_sha}")
    actual_blob = git_blob_sha(package_path, root)
    if actual_blob != expected_package_blob:
        fail(f"episode package blob mismatch: expected={expected_package_blob} actual={actual_blob}")

    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    original_spec = copy.deepcopy(spec)
    beats_by_id: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {}
    for scene in spec["scenes"]:
        for beat in scene["visualBeats"]:
            beats_by_id[beat["beatId"]] = (scene, beat)

    changed_beats: list[str] = []
    for beat_id, items in request["beats"].items():
        if not isinstance(beat_id, str) or not BEAT_ID_RE.fullmatch(beat_id):
            fail(f"invalid beat ID: {beat_id!r}")
        if beat_id not in beats_by_id:
            fail(f"unknown beat ID: {beat_id}")
        if not isinstance(items, list) or not 1 <= len(items) <= 4:
            fail(f"{beat_id} must define 1-4 Shots")
        scene, beat = beats_by_id[beat_id]
        if beat["startChunkId"] != beat["endChunkId"]:
            fail(f"{beat_id} spans multiple chunks; this measured plan requires one chunk")
        chunk = next(
            (item for item in scene["narrationChunks"] if item["chunkId"] == beat["startChunkId"]),
            None,
        )
        if chunk is None:
            fail(f"{beat_id} references an unknown narration chunk")
        original_shots = copy.deepcopy(beat.get("shots", []))
        if not original_shots:
            fail(f"{beat_id} has no source Shots")

        new_shots: list[dict[str, Any]] = []
        previous_end = 0.0
        for index, item in enumerate(items, start=1):
            if not isinstance(item, dict) or set(item) != PLAN_ITEM_FIELDS:
                fail(f"{beat_id} Shot {index} fields are invalid")
            source_shot = item["sourceShot"]
            if not isinstance(source_shot, int) or isinstance(source_shot, bool):
                fail(f"{beat_id} Shot {index} sourceShot must be an integer")
            if not 1 <= source_shot <= len(original_shots):
                fail(f"{beat_id} Shot {index} sourceShot is out of range")
            overrides = item["overrides"]
            if not isinstance(overrides, dict) or not set(overrides).issubset(STYLE_FIELDS):
                fail(f"{beat_id} Shot {index} has invalid overrides")
            start_cue = item["startCue"]
            end_cue = item["endCue"]
            if not isinstance(start_cue, str) or not isinstance(end_cue, str):
                fail(f"{beat_id} Shot {index} cues must be strings")
            start_progress = cue_progress(chunk["speechText"], start_cue, "start")
            end_progress = cue_progress(chunk["speechText"], end_cue, "end")
            if end_progress <= start_progress:
                fail(f"{beat_id} Shot {index} ends before it starts")
            if index == 1 and start_progress != 0:
                fail(f"{beat_id} first Shot must start at narration progress 0")
            if start_progress < previous_end:
                fail(f"{beat_id} Shot {index} overlaps the previous Shot")
            if start_progress - previous_end > 0.02:
                fail(f"{beat_id} Shot {index} leaves an excessive semantic gap")
            previous_end = end_progress

            source = original_shots[source_shot - 1]
            style = {field: copy.deepcopy(source.get(field)) for field in STYLE_FIELDS}
            style.update(copy.deepcopy(overrides))
            shot = {
                "shotId": f"{beat_id}-shot-{index:03d}",
                "shotRecipe": style.pop("shotRecipe"),
                "startChunkId": beat["startChunkId"],
                "startProgress": round(start_progress, 6),
                "startOffsetMs": 0,
                "endChunkId": beat["endChunkId"],
                "endProgress": round(end_progress, 6),
                "endOffsetMs": 0,
                "startCue": start_cue,
                "endCue": end_cue,
                **style,
            }
            new_shots.append(shot)
        if abs(previous_end - 1.0) > 1e-9:
            fail(f"{beat_id} final Shot must end at narration progress 1")
        beat["shots"] = new_shots
        changed_beats.append(beat_id)

    total_shots = sum(
        len(beat.get("shots", []))
        for scene in spec["scenes"]
        for beat in scene["visualBeats"]
    )
    if total_shots != request["expectedShotCount"]:
        fail(f"expected {request['expectedShotCount']} Shots, got {total_shots}")

    original_without_shots = copy.deepcopy(original_spec)
    updated_without_shots = copy.deepcopy(spec)
    for value in (original_without_shots, updated_without_shots):
        for scene in value["scenes"]:
            for beat in scene["visualBeats"]:
                beat.pop("shots", None)
    if original_without_shots != updated_without_shots:
        fail("Shot plan attempted to modify non-Shot render_spec content")

    spec_path.write_text(
        json.dumps(spec, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    package_text = package_path.read_text(encoding="utf-8")
    updated_package = update_episode_package(package_text, spec, request)
    package_path.write_text(updated_package, encoding="utf-8")

    report = {
        "reportVersion": "1.0",
        "status": "shot-plan-applied-awaiting-motion-preview",
        "episodeDate": episode_date,
        "shotPlanVersion": request["shotPlanVersion"],
        "requestPath": str(request_path.relative_to(root)),
        "changedBeatIds": changed_beats,
        "shotCount": total_shots,
        "localTimingAudit": request["localTimingAudit"],
        "oldRenderSpecSha256": old_spec_sha,
        "newRenderSpecSha256": sha256(spec_path),
        "oldEpisodePackageSha256": old_package_sha,
        "newEpisodePackageSha256": sha256(package_path),
        "narrationChanged": False,
        "sceneOrderChanged": False,
        "visualBeatOrderChanged": False,
        "ttsInputExpectedUnchanged": True,
    }
    report_path = root / "shot-timing-reports" / f"{episode_date}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False))
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("request")
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = pathlib.Path(args.root).resolve()
    request_path = pathlib.Path(args.request)
    if not request_path.is_absolute():
        request_path = root / request_path
    apply_request(root, request_path)


if __name__ == "__main__":
    main()
