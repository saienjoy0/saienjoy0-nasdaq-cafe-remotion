#!/usr/bin/env python3
from __future__ import annotations

import copy

from apply_causal_motion_request import validate_request


def valid_request() -> dict:
    return {
        "requestVersion": "1.0",
        "episodeDate": "2026-07-31",
        "expectedSpecSha256": "a" * 64,
        "expectedEpisodePackageBlobSha": "b" * 40,
        "sceneId": "scene-06",
        "beatId": "scene-06-beat-001",
        "expectedVisualTemplate": "evidence-boundary",
        "visualTemplate": "causal-lane",
        "templateConfig": {
            "variant": "left-to-right",
            "comparisonBasis": "市場記事内の支援材料と相殺材料",
            "dataBasis": "取引区分と終値",
            "nodeOrder": ["s6-node-report", "s6-node-support", "s6-node-rates"],
            "laneLabels": [],
            "outcomeNodeId": "s6-node-rates",
        },
        "sequencePolicy": "object-order-fallback",
        "viewerTexts": ["市場記事の説明", "支援材料", "金利の相殺"],
        "changeCue": "市場記事の説明",
        "nodes": [
            {"nodeId": "s6-node-report", "label": "市場記事の説明"},
            {"nodeId": "s6-node-support", "label": "Amazonと半導体株が支援"},
            {"nodeId": "s6-node-rates", "label": "金利上昇が上値を抑制"},
        ],
        "arrows": [
            {"arrowId": "s6-arrow-report-support", "fromNodeId": "s6-node-report", "toNodeId": "s6-node-support", "label": "記事内の説明"},
            {"arrowId": "s6-arrow-support-rates", "fromNodeId": "s6-node-support", "toNodeId": "s6-node-rates", "label": "一方"},
        ],
        "visualEvents": [
            {"eventId": "event-901", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "highlight", "targetId": "s6-node-report", "offsetMs": 7400, "expression": None, "motionPreset": "focus-ring", "durationMs": 200, "easingPreset": "smooth-out"},
            {"eventId": "event-902", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "unhighlight", "targetId": "s6-node-report", "offsetMs": 8350, "expression": None, "motionPreset": "scale-settle", "durationMs": 180, "easingPreset": "smooth-out"},
            {"eventId": "event-903", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "highlight", "targetId": "s6-node-support", "offsetMs": 8350, "expression": None, "motionPreset": "focus-ring", "durationMs": 200, "easingPreset": "smooth-out"},
            {"eventId": "event-904", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "show", "targetId": "s6-arrow-report-support", "offsetMs": 8500, "expression": None, "motionPreset": "draw-line", "durationMs": 900, "easingPreset": "smooth-out"},
            {"eventId": "event-905", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "unhighlight", "targetId": "s6-node-support", "offsetMs": 9350, "expression": None, "motionPreset": "scale-settle", "durationMs": 180, "easingPreset": "smooth-out"},
            {"eventId": "event-906", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "highlight", "targetId": "s6-node-rates", "offsetMs": 9350, "expression": None, "motionPreset": "dim-others", "durationMs": 200, "easingPreset": "smooth-out"},
            {"eventId": "event-907", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "show", "targetId": "s6-arrow-support-rates", "offsetMs": 9500, "expression": None, "motionPreset": "draw-line", "durationMs": 3000, "easingPreset": "smooth-out"},
            {"eventId": "event-908", "atChunkId": "scene-06-chunk-001", "timing": "chunk-start", "action": "unhighlight", "targetId": "s6-node-rates", "offsetMs": 10000, "expression": None, "motionPreset": "scale-settle", "durationMs": 3000, "easingPreset": "smooth-out"},
        ],
        "confirmation": "APPLY_CAUSAL_MOTION",
    }


def expect_failure(mutator, expected: str) -> None:
    request = valid_request()
    mutator(request)
    try:
        validate_request(request)
    except SystemExit as error:
        assert expected in str(error), (expected, str(error))
        return
    raise AssertionError(f"expected failure containing {expected!r}")


validate_request(valid_request())
expect_failure(lambda request: request.update(sequencePolicy="explicit"), "object-order-fallback")
expect_failure(lambda request: request["visualEvents"].__setitem__(2, copy.deepcopy(request["visualEvents"][0])), "event IDs")
expect_failure(lambda request: request["visualEvents"][2].update(offsetMs=8200), "ordered by offsetMs")
expect_failure(lambda request: request["visualEvents"][3].update(targetId="s6-node-report"), "draw-line")
expect_failure(lambda request: request["visualEvents"].pop(), "settle")

print("PASS: causal motion requests are append-only, path-bounded, single-focus, traced, settled, and TTS-preserving")
