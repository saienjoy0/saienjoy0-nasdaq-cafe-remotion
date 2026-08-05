#!/usr/bin/env python3
from __future__ import annotations

import copy
import hashlib
import json
import pathlib
import re
import sys
from typing import Any

FIELDS = {
    "requestVersion",
    "episodeDate",
    "expectedSpecSha256",
    "expectedReportSha256",
    "sceneId",
    "beatId",
    "expectedSequencePolicy",
    "sequencePolicy",
    "nodeShowEvents",
    "confirmation",
}
EVENT_FIELDS = {
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
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
EVENT_RE = re.compile(r"^event-[0-9]{3}$")
APPROVED_NODES = ["s6-node-report", "s6-node-support", "s6-node-rates"]
APPROVED_EXISTING_EVENTS = {f"event-{number}" for number in range(901, 909)}


def fail(message: str) -> None:
    raise SystemExit(message)


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_request(value: dict[str, Any]) -> None:
    if set(value) != FIELDS:
        fail("causal sequence fix request fields are invalid")
    if value["requestVersion"] != "1.0" or value["confirmation"] != "FIX_CAUSAL_SEQUENCE":
        fail("request identity is invalid")
    if not isinstance(value["episodeDate"], str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value["episodeDate"]):
        fail("episodeDate must match YYYY-MM-DD")
    for key in ("expectedSpecSha256", "expectedReportSha256"):
        if not isinstance(value[key], str) or not SHA_RE.fullmatch(value[key]):
            fail(f"{key} must be lowercase SHA-256")
    if value["sceneId"] != "scene-06" or value["beatId"] != "scene-06-beat-001":
        fail("only the approved Scene 6 Beat may be corrected")
    if value["expectedSequencePolicy"] != "object-order-fallback" or value["sequencePolicy"] != "explicit":
        fail("the only approved correction is object-order-fallback to explicit")
    events = value["nodeShowEvents"]
    if not isinstance(events, list) or len(events) != len(APPROVED_NODES):
        fail("exactly three node show events are required")
    seen_events: set[str] = set()
    seen_targets: list[str] = []
    for index, event in enumerate(events):
        if not isinstance(event, dict) or set(event) != EVENT_FIELDS:
            fail(f"nodeShowEvents[{index}] fields are invalid")
        if not isinstance(event["eventId"], str) or not EVENT_RE.fullmatch(event["eventId"]):
            fail(f"nodeShowEvents[{index}].eventId is invalid")
        if event["eventId"] in seen_events or event["eventId"] in APPROVED_EXISTING_EVENTS:
            fail("node show event IDs must be new and unique")
        seen_events.add(event["eventId"])
        seen_targets.append(event["targetId"])
        expected = {
            "atChunkId": "scene-06-chunk-001",
            "timing": "chunk-start",
            "action": "show",
            "offsetMs": 0,
            "expression": None,
            "motionPreset": "fade-soft",
            "durationMs": 300,
            "easingPreset": "smooth-out",
        }
        for key, expected_value in expected.items():
            if event[key] != expected_value:
                fail(f"nodeShowEvents[{index}].{key} is not approved")
    if seen_targets != APPROVED_NODES:
        fail("node show events must follow the approved node order")


def apply(root: pathlib.Path, request_path: pathlib.Path) -> dict[str, Any]:
    value = json.loads(request_path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        fail("request root must be an object")
    validate_request(value)

    episode_date = value["episodeDate"]
    spec_path = root / "render-specs" / episode_date / "render_spec.json"
    report_path = root / "causal-motion-reports" / f"{episode_date}.json"
    if not spec_path.is_file() or not report_path.is_file():
        fail("canonical render spec or causal report is missing")
    old_spec_sha = sha256(spec_path)
    old_report_sha = sha256(report_path)
    if old_spec_sha != value["expectedSpecSha256"]:
        fail(f"render_spec SHA mismatch: expected={value['expectedSpecSha256']} actual={old_spec_sha}")
    if old_report_sha != value["expectedReportSha256"]:
        fail(f"causal report SHA mismatch: expected={value['expectedReportSha256']} actual={old_report_sha}")

    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    original = copy.deepcopy(spec)
    scene = next((item for item in spec["scenes"] if item["sceneId"] == value["sceneId"]), None)
    if scene is None:
        fail("approved Scene was not found")
    beat = next((item for item in scene["visualBeats"] if item["beatId"] == value["beatId"]), None)
    if beat is None:
        fail("approved Beat was not found")
    if beat["visualTemplate"] != "causal-lane" or beat["sequencePolicy"] != value["expectedSequencePolicy"]:
        fail("approved causal Beat no longer matches the correction source")
    if beat["objectIds"][:3] != APPROVED_NODES:
        fail("approved node order changed")
    if [node["nodeId"] for node in scene["nodes"]] != APPROVED_NODES:
        fail("Scene 6 nodes changed")
    existing_event_ids = {event["eventId"] for event in scene["visualEvents"]}
    if not APPROVED_EXISTING_EVENTS.issubset(existing_event_ids):
        fail("approved causal visual events are incomplete")
    new_event_ids = {event["eventId"] for event in value["nodeShowEvents"]}
    if existing_event_ids & new_event_ids:
        fail("node show event IDs already exist")

    beat["sequencePolicy"] = value["sequencePolicy"]
    scene["visualEvents"].extend(copy.deepcopy(value["nodeShowEvents"]))

    check = copy.deepcopy(spec)
    check_scene = next(item for item in check["scenes"] if item["sceneId"] == value["sceneId"])
    check_beat = next(item for item in check_scene["visualBeats"] if item["beatId"] == value["beatId"])
    original_scene = next(item for item in original["scenes"] if item["sceneId"] == value["sceneId"])
    original_beat = next(item for item in original_scene["visualBeats"] if item["beatId"] == value["beatId"])
    check_beat["sequencePolicy"] = original_beat["sequencePolicy"]
    check_scene["visualEvents"] = original_scene["visualEvents"]
    if check != original:
        fail("correction attempted to modify unapproved render_spec paths")

    original_tts = [
        (chunk["chunkId"], chunk["speechText"], chunk["captionText"], chunk["pauseAfterMs"], chunk["expression"])
        for candidate in original["scenes"]
        for chunk in candidate["narrationChunks"]
    ]
    updated_tts = [
        (chunk["chunkId"], chunk["speechText"], chunk["captionText"], chunk["pauseAfterMs"], chunk["expression"])
        for candidate in spec["scenes"]
        for chunk in candidate["narrationChunks"]
    ]
    if original_tts != updated_tts:
        fail("correction changed narration, captions, or TTS identity")

    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    report = json.loads(report_path.read_text(encoding="utf-8"))
    report.update({
        "status": "causal-motion-sequence-corrected-awaiting-motion-preview",
        "sequenceFixRequestPath": str(request_path.relative_to(root)),
        "preSequenceFixRenderSpecSha256": old_spec_sha,
        "newRenderSpecSha256": sha256(spec_path),
        "sequencePolicyBefore": value["expectedSequencePolicy"],
        "sequencePolicyAfter": value["sequencePolicy"],
        "addedNodeShowEventIds": [event["eventId"] for event in value["nodeShowEvents"]],
        "narrationChanged": False,
        "captionChanged": False,
        "ttsInputExpectedUnchanged": True,
        "shotPlanChanged": False,
        "finalRenderRequested": False,
    })
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: apply_causal_sequence_fix.py <request.json>")
    root = pathlib.Path.cwd()
    request_path = pathlib.Path(sys.argv[1])
    if not request_path.is_absolute():
        request_path = root / request_path
    if not request_path.is_file():
        fail("request file was not found")
    print(json.dumps(apply(root, request_path), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
