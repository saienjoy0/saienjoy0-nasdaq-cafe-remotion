#!/usr/bin/env python3
from __future__ import annotations

import copy
import hashlib
import json
import pathlib
import re
import subprocess
import sys
from typing import Any

REQUEST_FIELDS = {
    "requestVersion",
    "episodeDate",
    "expectedSpecSha256",
    "expectedEpisodePackageBlobSha",
    "sceneId",
    "beatId",
    "expectedVisualTemplate",
    "visualTemplate",
    "templateConfig",
    "sequencePolicy",
    "viewerTexts",
    "changeCue",
    "nodes",
    "arrows",
    "visualEvents",
    "confirmation",
}
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
BLOB_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
SAFE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
EVENT_ID_RE = re.compile(r"^event-[0-9]{3}$")
SCENE_ID_RE = re.compile(r"^scene-0[1-9]$")
BEAT_ID_RE = re.compile(r"^scene-0[1-9]-beat-[0-9]{3}$")
ALLOWED_TEMPLATE_FIELDS = {
    "variant",
    "comparisonBasis",
    "dataBasis",
    "nodeOrder",
    "laneLabels",
    "outcomeNodeId",
}
ALLOWED_EVENT_FIELDS = {
    "eventId",
    "atChunkId",
    "timing",
    "action",
    "targetId",
    "offsetMs",
    "expression",
    "motionPreset",
    "durationMs",
    "easingPreset",
}
PACKAGE_HEADING = "## PR4B Scene 6 causal motion"


def fail(message: str) -> None:
    raise SystemExit(message)


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


def is_nonempty_text(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_id(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SAFE_ID_RE.fullmatch(value):
        fail(f"{label} must be a safe ID")
    return value


def validate_request(request: dict[str, Any]) -> None:
    if set(request) != REQUEST_FIELDS:
        fail("causal motion request fields are invalid")
    if request["requestVersion"] != "1.0":
        fail("requestVersion must be 1.0")
    if request["confirmation"] != "APPLY_CAUSAL_MOTION":
        fail("confirmation must be APPLY_CAUSAL_MOTION")
    if not isinstance(request["episodeDate"], str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", request["episodeDate"]):
        fail("episodeDate must match YYYY-MM-DD")
    if not isinstance(request["expectedSpecSha256"], str) or not SHA256_RE.fullmatch(request["expectedSpecSha256"]):
        fail("expectedSpecSha256 must be lowercase SHA-256")
    if not isinstance(request["expectedEpisodePackageBlobSha"], str) or not BLOB_SHA_RE.fullmatch(request["expectedEpisodePackageBlobSha"]):
        fail("expectedEpisodePackageBlobSha must be a Git blob SHA")
    if not isinstance(request["sceneId"], str) or not SCENE_ID_RE.fullmatch(request["sceneId"]):
        fail("sceneId is invalid")
    if not isinstance(request["beatId"], str) or not BEAT_ID_RE.fullmatch(request["beatId"]):
        fail("beatId is invalid")
    if not is_nonempty_text(request["expectedVisualTemplate"]) or request["visualTemplate"] != "causal-lane":
        fail("visualTemplate must explicitly migrate to causal-lane")
    if request["sequencePolicy"] != "object-order-fallback":
        fail("sequencePolicy must preserve stable node layout with object-order-fallback")
    if not isinstance(request["templateConfig"], dict) or set(request["templateConfig"]) != ALLOWED_TEMPLATE_FIELDS:
        fail("templateConfig fields are invalid")
    config = request["templateConfig"]
    if config["variant"] != "left-to-right":
        fail("causal-lane variant must be left-to-right")
    if not is_nonempty_text(config["dataBasis"]):
        fail("templateConfig.dataBasis is required")
    if config["laneLabels"] != []:
        fail("causal-lane laneLabels must be empty")
    if not isinstance(request["viewerTexts"], list) or not 1 <= len(request["viewerTexts"]) <= 4 or not all(is_nonempty_text(v) for v in request["viewerTexts"]):
        fail("viewerTexts must contain 1-4 non-empty strings")
    if not is_nonempty_text(request["changeCue"]):
        fail("changeCue is required")

    nodes = request["nodes"]
    arrows = request["arrows"]
    events = request["visualEvents"]
    if not isinstance(nodes, list) or not 2 <= len(nodes) <= 4:
        fail("nodes must contain 2-4 items")
    if not isinstance(arrows, list) or not 1 <= len(arrows) <= 3:
        fail("arrows must contain 1-3 items")
    node_ids: list[str] = []
    for index, node in enumerate(nodes):
        if not isinstance(node, dict) or set(node) != {"nodeId", "label"}:
            fail(f"nodes[{index}] fields are invalid")
        node_id = validate_id(node["nodeId"], f"nodes[{index}].nodeId")
        if not is_nonempty_text(node["label"]):
            fail(f"nodes[{index}].label is required")
        node_ids.append(node_id)
    if len(set(node_ids)) != len(node_ids):
        fail("node IDs must be unique")
    if config["nodeOrder"] != node_ids:
        fail("templateConfig.nodeOrder must exactly match nodes order")
    if config["outcomeNodeId"] not in node_ids:
        fail("templateConfig.outcomeNodeId must be one of the nodes")

    arrow_ids: list[str] = []
    node_set = set(node_ids)
    for index, arrow in enumerate(arrows):
        if not isinstance(arrow, dict) or set(arrow) != {"arrowId", "fromNodeId", "toNodeId", "label"}:
            fail(f"arrows[{index}] fields are invalid")
        arrow_id = validate_id(arrow["arrowId"], f"arrows[{index}].arrowId")
        if arrow["fromNodeId"] not in node_set or arrow["toNodeId"] not in node_set:
            fail(f"arrows[{index}] must connect registered nodes")
        if not isinstance(arrow["label"], str):
            fail(f"arrows[{index}].label must be a string")
        arrow_ids.append(arrow_id)
    if len(set(arrow_ids)) != len(arrow_ids) or set(node_ids) & set(arrow_ids):
        fail("node and arrow IDs must be globally unique within the request")

    if not isinstance(events, list) or not 1 <= len(events) <= 20:
        fail("visualEvents must contain 1-20 items")
    event_ids: list[str] = []
    active_focus: str | None = None
    saw_trace = False
    allowed_targets = node_set | set(arrow_ids)
    for index, event in enumerate(events):
        if not isinstance(event, dict) or set(event) != ALLOWED_EVENT_FIELDS:
            fail(f"visualEvents[{index}] fields are invalid")
        event_id = event["eventId"]
        if not isinstance(event_id, str) or not EVENT_ID_RE.fullmatch(event_id):
            fail(f"visualEvents[{index}].eventId is invalid")
        event_ids.append(event_id)
        if event["atChunkId"] != request["beatId"].replace("beat-001", "chunk-001"):
            fail(f"visualEvents[{index}] must target the approved Scene 6 narration chunk")
        if event["timing"] != "chunk-start":
            fail(f"visualEvents[{index}] timing must be chunk-start")
        if event["targetId"] not in allowed_targets:
            fail(f"visualEvents[{index}] target is not registered")
        if event["expression"] is not None:
            fail(f"visualEvents[{index}] must not alter expression")
        if not isinstance(event["offsetMs"], int) or isinstance(event["offsetMs"], bool) or not 0 <= event["offsetMs"] <= 10_000:
            fail(f"visualEvents[{index}].offsetMs must be 0-10000")
        if not isinstance(event["durationMs"], int) or isinstance(event["durationMs"], bool) or not 100 <= event["durationMs"] <= 3_000:
            fail(f"visualEvents[{index}].durationMs must be 100-3000")
        if event["easingPreset"] not in {"linear", "smooth-out", "spring-settle"}:
            fail(f"visualEvents[{index}].easingPreset is invalid")
        action = event["action"]
        target = event["targetId"]
        preset = event["motionPreset"]
        if action == "show":
            if target not in arrow_ids or preset != "draw-line":
                fail("show events are reserved for one-shot draw-line arrow traces")
            saw_trace = True
        elif action == "highlight":
            if target not in node_set or preset not in {"focus-ring", "dim-others"}:
                fail("highlight must target one node with focus-ring or dim-others")
            if active_focus is not None:
                fail("unhighlight the previous node before highlighting another")
            active_focus = target
        elif action == "unhighlight":
            if target != active_focus or preset != "scale-settle":
                fail("unhighlight must settle the currently focused node")
            active_focus = None
        else:
            fail("only show, highlight, and unhighlight are allowed")
    if len(set(event_ids)) != len(event_ids):
        fail("visual event IDs must be unique")
    if active_focus is not None:
        fail("causal focus must settle before the Beat ends")
    if not saw_trace:
        fail("at least one draw-line trace is required")
    offsets = [event["offsetMs"] for event in events]
    if offsets != sorted(offsets):
        fail("visualEvents must be ordered by offsetMs")


def update_episode_package(text: str, request: dict[str, Any]) -> str:
    section = "\n".join([
        PACKAGE_HEADING,
        "",
        f"- 対象：`{request['sceneId']}` / `{request['beatId']}`",
        "- 既存ナレーション、字幕、Shot順、Shot時刻、TTSは変更しない。",
        "- 市場記事の説明範囲を、記事内の支援材料と金利の相殺へ順番に焦点移動する。",
        "- 同時focusは一つ。矢印は一度だけtraceし、Shot終端前に通常状態へ戻す。",
        "- 最終採用経路：既存Remotion図解（当日固有画像なし）。",
        "",
    ])
    start = text.find(PACKAGE_HEADING)
    if start >= 0:
        next_heading = text.find("\n## ", start + len(PACKAGE_HEADING))
        end = len(text) if next_heading < 0 else next_heading + 1
        return text[:start] + section + text[end:]
    return text.rstrip() + "\n\n" + section


def apply_request(root: pathlib.Path, request_path: pathlib.Path) -> dict[str, Any]:
    request = json.loads(request_path.read_text(encoding="utf-8"))
    if not isinstance(request, dict):
        fail("request root must be an object")
    validate_request(request)

    episode_date = request["episodeDate"]
    spec_path = root / "render-specs" / episode_date / "render_spec.json"
    package_path = root / "episode-packages" / episode_date / f"episode_package_{episode_date}.md"
    if not spec_path.is_file() or not package_path.is_file():
        fail("render spec or episode package was not found")
    old_spec_sha = sha256(spec_path)
    old_package_sha = sha256(package_path)
    if old_spec_sha != request["expectedSpecSha256"]:
        fail(f"render_spec SHA mismatch: expected={request['expectedSpecSha256']} actual={old_spec_sha}")
    actual_package_blob = git_blob_sha(package_path, root)
    if actual_package_blob != request["expectedEpisodePackageBlobSha"]:
        fail(f"episode package blob mismatch: expected={request['expectedEpisodePackageBlobSha']} actual={actual_package_blob}")

    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    original = copy.deepcopy(spec)
    scene_index = next((i for i, scene in enumerate(spec["scenes"]) if scene["sceneId"] == request["sceneId"]), None)
    if scene_index is None:
        fail("approved scene was not found")
    scene = spec["scenes"][scene_index]
    beat_index = next((i for i, beat in enumerate(scene["visualBeats"]) if beat["beatId"] == request["beatId"]), None)
    if beat_index is None:
        fail("approved Beat was not found")
    beat = scene["visualBeats"][beat_index]
    if beat["visualTemplate"] != request["expectedVisualTemplate"]:
        fail("Beat visualTemplate no longer matches the approved source")
    causal_shots = [shot for shot in beat.get("shots", []) if shot["shotRecipe"] == "causal-build"]
    if len(causal_shots) != 1:
        fail("approved Beat must contain exactly one causal-build Shot")
    if scene["nodes"] or scene["arrows"]:
        fail("approved Scene already contains nodes or arrows")

    existing_ids = {
        *(item["cardId"] for item in scene["cards"]),
        *(item["numberId"] for item in scene["numbers"]),
        *(event["eventId"] for candidate in spec["scenes"] for event in candidate["visualEvents"]),
    }
    requested_ids = {
        *(node["nodeId"] for node in request["nodes"]),
        *(arrow["arrowId"] for arrow in request["arrows"]),
        *(event["eventId"] for event in request["visualEvents"]),
    }
    collision = existing_ids & requested_ids
    if collision:
        fail(f"request IDs already exist: {sorted(collision)}")

    scene["nodes"] = copy.deepcopy(request["nodes"])
    scene["arrows"] = copy.deepcopy(request["arrows"])
    scene["visualEvents"].extend(copy.deepcopy(request["visualEvents"]))
    beat["visualTemplate"] = request["visualTemplate"]
    beat["templateConfig"] = copy.deepcopy(request["templateConfig"])
    beat["sequencePolicy"] = request["sequencePolicy"]
    beat["viewerTexts"] = copy.deepcopy(request["viewerTexts"])
    beat["changeCue"] = request["changeCue"]
    beat["objectIds"] = [
        *(node["nodeId"] for node in request["nodes"]),
        *(arrow["arrowId"] for arrow in request["arrows"]),
    ]

    check = copy.deepcopy(spec)
    check_scene = check["scenes"][scene_index]
    check_beat = check_scene["visualBeats"][beat_index]
    original_scene = original["scenes"][scene_index]
    original_beat = original_scene["visualBeats"][beat_index]
    check_scene["nodes"] = copy.deepcopy(original_scene["nodes"])
    check_scene["arrows"] = copy.deepcopy(original_scene["arrows"])
    check_scene["visualEvents"] = copy.deepcopy(original_scene["visualEvents"])
    for key in ["visualTemplate", "templateConfig", "sequencePolicy", "viewerTexts", "changeCue", "objectIds"]:
        check_beat[key] = copy.deepcopy(original_beat[key])
    if check != original:
        fail("causal motion request attempted to modify content outside the approved paths")

    original_tts = [
        (chunk["chunkId"], chunk["speechText"], chunk["pauseAfterMs"], chunk["expression"])
        for candidate in original["scenes"]
        for chunk in candidate["narrationChunks"]
    ]
    updated_tts = [
        (chunk["chunkId"], chunk["speechText"], chunk["pauseAfterMs"], chunk["expression"])
        for candidate in spec["scenes"]
        for chunk in candidate["narrationChunks"]
    ]
    if original_tts != updated_tts:
        fail("causal motion request changed TTS identity")

    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    package_text = package_path.read_text(encoding="utf-8")
    package_path.write_text(update_episode_package(package_text, request), encoding="utf-8")

    report_path = root / "causal-motion-reports" / f"{episode_date}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "reportVersion": "1.0",
        "status": "causal-motion-applied-awaiting-motion-preview",
        "episodeDate": episode_date,
        "sceneId": request["sceneId"],
        "beatId": request["beatId"],
        "requestPath": str(request_path.relative_to(root)),
        "oldRenderSpecSha256": old_spec_sha,
        "newRenderSpecSha256": sha256(spec_path),
        "oldEpisodePackageSha256": old_package_sha,
        "newEpisodePackageSha256": sha256(package_path),
        "narrationChanged": False,
        "captionChanged": False,
        "ttsInputExpectedUnchanged": True,
        "shotPlanChanged": False,
        "addedNodeIds": [node["nodeId"] for node in request["nodes"]],
        "addedArrowIds": [arrow["arrowId"] for arrow in request["arrows"]],
        "addedEventIds": [event["eventId"] for event in request["visualEvents"]],
        "finalRenderRequested": False,
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: apply_causal_motion_request.py <request.json>")
    root = pathlib.Path.cwd()
    request_path = pathlib.Path(sys.argv[1])
    if not request_path.is_absolute():
        request_path = root / request_path
    if not request_path.is_file():
        fail("request file was not found")
    report = apply_request(root, request_path)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
