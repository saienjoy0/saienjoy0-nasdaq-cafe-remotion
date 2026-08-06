#!/usr/bin/env python3
"""Build Scene 9 only from exact lines already introduced in Scenes 1-8.

The fixed ending narration is untouched. The closing card reuses prior lines
verbatim so the Renderer final-assembly contract does not introduce new evidence.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from copy import deepcopy
from pathlib import Path

DESIRED_LINES = [
    "確認済み：売上・見通しは上振れ",
    "SpaceXがGPUを専属採用",
    "大型顧客の獲得",
    "粗利率・供給制約",
    "NASDAQ：大型テック安も重なる",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--ready", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    introduced: dict[str, dict[str, str]] = {}
    for scene in spec["scenes"][:-1]:
        for card in scene.get("cards", []):
            for line in card.get("lines", []):
                introduced.setdefault(line["value"].strip(), deepcopy(line))

    missing = [value for value in DESIRED_LINES if value not in introduced]
    if missing:
        raise ValueError(f"closing lines were not previously introduced: {missing}")

    scene9 = spec["scenes"][-1]
    card = scene9["cards"][0]
    previous_lines = [line["value"] for line in card["lines"]]
    card["lines"] = [deepcopy(introduced[value]) for value in DESIRED_LINES]

    text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    args.spec.write_text(text, encoding="utf-8")
    sha = hashlib.sha256(text.encode("utf-8")).hexdigest()

    change = {
        "sceneId": scene9["sceneId"],
        "cardId": card["cardId"],
        "previousLines": previous_lines,
        "resolvedLines": DESIRED_LINES,
        "allResolvedLinesPreviouslyIntroduced": True,
        "newEvidenceIntroduced": False,
        "narrationChanged": False,
        "numbersChanged": False,
        "sceneOrderChanged": False,
        "marketMeaningChanged": False,
    }

    ready = json.loads(args.ready.read_text(encoding="utf-8"))
    ready["renderSpecSha256"] = sha
    normalization = dict(ready.get("rendererNormalization", {}))
    normalization["finalAssemblyLineRepair"] = change
    ready["rendererNormalization"] = normalization
    args.ready.write_text(
        json.dumps(ready, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    report = json.loads(args.report.read_text(encoding="utf-8"))
    report["normalizedRenderSpecSha256"] = sha
    report["finalAssemblyLineRepair"] = change
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "assembled", "sha256": sha}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
