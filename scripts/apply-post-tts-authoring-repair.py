#!/usr/bin/env python3
"""Apply an explicitly-authored post-TTS visual repair without changing editorial text.

The request is the source of the exact repair operations. This helper never chooses
visuals, rewrites narration, invents objects, or loosens validators. It only applies
pre-authored beat template changes and narration-chunk boundary splits, then keeps the
human episode package, Visual Grammar annex, and embedded FINAL_PRODUCTION_SOURCE in
sync with the resulting render_spec.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
from typing import Any


class RepairError(ValueError):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RepairError(f"cannot read JSON {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise RepairError(f"JSON root must be object: {path}")
    return value


def write_json(path: Path, value: dict[str, Any], *, sort_keys: bool = True) -> str:
    text = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=sort_keys) + "\n"
    path.write_text(text, encoding="utf-8")
    return sha256_bytes(text.encode("utf-8"))


def find_scene(spec: dict[str, Any], scene_id: str) -> dict[str, Any]:
    scenes = spec.get("scenes")
    if not isinstance(scenes, list):
        raise RepairError("render_spec scenes missing")
    for scene in scenes:
        if isinstance(scene, dict) and scene.get("sceneId") == scene_id:
            return scene
    raise RepairError(f"scene not found: {scene_id}")


def find_beat(spec: dict[str, Any], beat_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
    for scene in spec.get("scenes", []):
        if not isinstance(scene, dict):
            continue
        for beat in scene.get("visualBeats", []):
            if isinstance(beat, dict) and beat.get("beatId") == beat_id:
                return scene, beat
    raise RepairError(f"beat not found: {beat_id}")


def grammar_id(beat: dict[str, Any]) -> str | None:
    value = beat.get("visualGrammarId")
    if isinstance(value, str):
        return value
    vg = beat.get("visualGrammar")
    if isinstance(vg, dict) and isinstance(vg.get("grammarId"), str):
        return vg["grammarId"]
    return None


def set_visual_contract(beat: dict[str, Any], replacement: dict[str, Any]) -> None:
    template = replacement.get("visualTemplate")
    grammar = replacement.get("visualGrammarId")
    variant = replacement.get("templateVariant")
    if not all(isinstance(item, str) and item for item in (template, grammar, variant)):
        raise RepairError(f"invalid visual replacement: {replacement}")
    beat["visualTemplate"] = template
    beat["visualGrammarId"] = grammar
    if isinstance(beat.get("visualGrammar"), dict):
        beat["visualGrammar"]["grammarId"] = grammar
    beat["templateVariant"] = variant
    config = beat.get("templateConfig")
    if not isinstance(config, dict):
        raise RepairError(f"beat {beat.get('beatId')} missing templateConfig")
    config["variant"] = variant
    if isinstance(replacement.get("transitionRole"), str):
        beat["transitionRole"] = replacement["transitionRole"]
    if isinstance(replacement.get("changeCue"), str):
        beat["changeCue"] = replacement["changeCue"]


def assert_visual_expected(beat: dict[str, Any], expected: dict[str, Any]) -> None:
    actual = {
        "visualTemplate": beat.get("visualTemplate"),
        "visualGrammarId": grammar_id(beat),
        "templateVariant": beat.get("templateVariant") or beat.get("templateConfig", {}).get("variant"),
    }
    for key, value in expected.items():
        if actual.get(key) != value:
            raise RepairError(
                f"{beat.get('beatId')} visual precondition drift for {key}: {actual.get(key)!r} != {value!r}"
            )


def split_chunks_and_beats(spec: dict[str, Any], operation: dict[str, Any]) -> None:
    scene_id = operation.get("sceneId")
    if not isinstance(scene_id, str):
        raise RepairError("split operation sceneId missing")
    scene = find_scene(spec, scene_id)
    chunks = scene.get("narrationChunks")
    beats = scene.get("visualBeats")
    if not isinstance(chunks, list) or not isinstance(beats, list):
        raise RepairError(f"{scene_id}: narrationChunks/visualBeats missing")

    chunk_by_id = {item.get("chunkId"): item for item in chunks if isinstance(item, dict)}
    beat_by_id = {item.get("beatId"): item for item in beats if isinstance(item, dict)}
    split_chunk_ids = [item.get("sourceChunkId") for item in operation.get("chunkSplits", [])]
    split_beat_ids = [item.get("sourceBeatId") for item in operation.get("beatRebuilds", [])]
    if len(split_chunk_ids) != len(set(split_chunk_ids)) or len(split_beat_ids) != len(set(split_beat_ids)):
        raise RepairError(f"{scene_id}: duplicate split source IDs")

    replacements_by_chunk: dict[str, list[dict[str, Any]]] = {}
    for item in operation.get("chunkSplits", []):
        if not isinstance(item, dict):
            raise RepairError("chunk split must be object")
        source_id = item.get("sourceChunkId")
        source = chunk_by_id.get(source_id)
        if not isinstance(source, dict):
            raise RepairError(f"source chunk missing: {source_id}")
        parts = item.get("parts")
        if not isinstance(parts, list) or len(parts) < 2:
            raise RepairError(f"{source_id}: split must contain at least two parts")
        speech_parts: list[str] = []
        caption_parts: list[str] = []
        new_chunks: list[dict[str, Any]] = []
        for index, part in enumerate(parts):
            if not isinstance(part, dict):
                raise RepairError(f"{source_id}: invalid split part")
            new_id = part.get("chunkId")
            speech = part.get("speechText")
            caption = part.get("captionText")
            if not all(isinstance(value, str) and value for value in (new_id, speech, caption)):
                raise RepairError(f"{source_id}: invalid split part fields")
            speech_parts.append(speech)
            caption_parts.append(caption)
            cloned = copy.deepcopy(source)
            cloned["chunkId"] = new_id
            cloned["speechText"] = speech
            cloned["captionText"] = caption
            cloned["pauseAfterMs"] = source.get("pauseAfterMs", 0) if index == len(parts) - 1 else 0
            new_chunks.append(cloned)
        if "".join(speech_parts) != source.get("speechText"):
            raise RepairError(f"{source_id}: split speech does not exactly reconstruct source")
        if "".join(caption_parts) != source.get("captionText"):
            raise RepairError(f"{source_id}: split caption does not exactly reconstruct source")
        replacements_by_chunk[source_id] = new_chunks

    rebuilt_chunks: list[dict[str, Any]] = []
    for chunk in chunks:
        source_id = chunk.get("chunkId") if isinstance(chunk, dict) else None
        rebuilt_chunks.extend(replacements_by_chunk.get(source_id, [chunk]))
    scene["narrationChunks"] = rebuilt_chunks

    rebuilt_by_source_beat: dict[str, list[dict[str, Any]]] = {}
    for item in operation.get("beatRebuilds", []):
        if not isinstance(item, dict):
            raise RepairError("beat rebuild must be object")
        source_id = item.get("sourceBeatId")
        source = beat_by_id.get(source_id)
        if not isinstance(source, dict):
            raise RepairError(f"source beat missing: {source_id}")
        expected = item.get("expected")
        if isinstance(expected, dict):
            assert_visual_expected(source, expected)
        parts = item.get("parts")
        if not isinstance(parts, list) or len(parts) < 2:
            raise RepairError(f"{source_id}: beat rebuild needs at least two parts")
        new_beats: list[dict[str, Any]] = []
        for part in parts:
            if not isinstance(part, dict):
                raise RepairError(f"{source_id}: invalid beat part")
            beat_id = part.get("beatId")
            chunk_id = part.get("chunkId")
            if not isinstance(beat_id, str) or not isinstance(chunk_id, str):
                raise RepairError(f"{source_id}: beatId/chunkId missing")
            chunk = next((c for c in rebuilt_chunks if isinstance(c, dict) and c.get("chunkId") == chunk_id), None)
            if not isinstance(chunk, dict):
                raise RepairError(f"{source_id}: rebuilt chunk missing: {chunk_id}")
            cloned = copy.deepcopy(source)
            cloned["beatId"] = beat_id
            cloned["startChunkId"] = chunk_id
            cloned["endChunkId"] = chunk_id
            speech = chunk["speechText"]
            cloned["narrationStartCue"] = speech[:80]
            cloned["narrationEndCue"] = speech[-80:]
            replacement = part.get("visual")
            if isinstance(replacement, dict):
                set_visual_contract(cloned, replacement)
            if isinstance(part.get("transitionRole"), str):
                cloned["transitionRole"] = part["transitionRole"]
            if isinstance(part.get("changeCue"), str):
                cloned["changeCue"] = part["changeCue"]
            new_beats.append(cloned)
        rebuilt_by_source_beat[source_id] = new_beats

    rebuilt_beats: list[dict[str, Any]] = []
    for beat in beats:
        source_id = beat.get("beatId") if isinstance(beat, dict) else None
        rebuilt_beats.extend(rebuilt_by_source_beat.get(source_id, [beat]))
    scene["visualBeats"] = rebuilt_beats


def full_scene_text(scene: dict[str, Any], field: str) -> str:
    return "".join(
        item.get(field, "")
        for item in scene.get("narrationChunks", [])
        if isinstance(item, dict)
    )


def update_human_beat(md: str, scene_id: str, beat: dict[str, Any]) -> str:
    marker = f"<!--VISUAL_BEAT:{scene_id}:{beat['beatId']}-->"
    if marker not in md:
        return md
    start = md.index(marker)
    end = md.find("<!--VISUAL_BEAT:", start + len(marker))
    if end < 0:
        end = md.find("### 完成ナレーション", start)
    if end < 0:
        raise RepairError(f"cannot bound human beat block: {beat['beatId']}")
    block = md[start:end]
    replacements = {
        "Visual Grammar": f"  - Visual Grammar：{beat['visualGrammarId']} / {beat['transitionRole']}",
        "Visual Template ID": f"  - Visual Template ID：{beat['visualTemplate']}",
        "Template Variant": f"  - Template Variant：{beat['templateVariant']}",
    }
    lines = block.splitlines()
    for label, replacement in replacements.items():
        prefix = f"  - {label}："
        matches = [i for i, line in enumerate(lines) if line.startswith(prefix)]
        if len(matches) != 1:
            raise RepairError(f"{beat['beatId']}: expected one human {label} line")
        lines[matches[0]] = replacement
    block = "\n".join(lines) + ("\n" if block.endswith("\n") else "")
    return md[:start] + block + md[end:]


def render_human_beat(scene_id: str, human_id: str, beat: dict[str, Any]) -> str:
    viewer = beat.get("viewerTexts") or []
    evidence = beat.get("evidenceSourceIds") or []
    if not isinstance(viewer, list) or not isinstance(evidence, list):
        raise RepairError(f"{beat.get('beatId')}: viewer/evidence contract drift")
    viewer_text = " / ".join(str(item) for item in viewer)
    evidence_text = ", ".join(str(item) for item in evidence)
    return f"""<!--VISUAL_BEAT:{scene_id}:{beat['beatId']}-->
- **{human_id}**
  - 開始合図：{beat['narrationStartCue']}
  - 終了合図：{beat['narrationEndCue']}
  - 主要視覚機能：{beat['primaryFunction']}
  - 画面状態：{beat['screenState']}
  - Visual Grammar：{beat['visualGrammarId']} / {beat['transitionRole']}
  - Visual Template ID：{beat['visualTemplate']}
  - Template Variant：{beat['templateVariant']}
  - 入力構造：{viewer_text}
  - 画面の問い：{beat['screenQuestion']}
  - 主要要素：{beat['primaryElement']}
  - 視聴者向けテキスト：{viewer_text}
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：{evidence_text}
"""


def rebuild_human_scene_beats(md: str, scene: dict[str, Any]) -> str:
    scene_id = scene["sceneId"]
    scene_number = scene["sceneNumber"]
    heading = f"## Scene {scene_number}｜"
    start = md.find(heading)
    if start < 0:
        raise RepairError(f"human scene heading missing: {scene_id}")
    visual_start = md.find("### Visual Beats", start)
    narration_start = md.find("### 完成ナレーション", visual_start)
    if visual_start < 0 or narration_start < 0:
        raise RepairError(f"human Visual Beats section missing: {scene_id}")
    blocks = []
    for index, beat in enumerate(scene.get("visualBeats", []), start=1):
        suffix = "" if index <= 2 else chr(ord("a") + index - 3)
        human_id = f"{scene_id}-beat-{index:03d}{suffix}"
        blocks.append(render_human_beat(scene_id, human_id, beat))
    replacement = "### Visual Beats\n\n" + "\n".join(blocks) + "\n"
    return md[:visual_start] + replacement + md[narration_start:]


def rewrite_visual_grammar_annex(md: str, spec: dict[str, Any]) -> str:
    begin = "<!--BEGIN_VISUAL_GRAMMAR_ANNEX-->"
    if begin not in md:
        raise RepairError("Visual Grammar annex missing")
    marker = md.index(begin)
    json_start = md.index("```json", marker) + len("```json")
    json_end = md.index("```", json_start)
    annex = json.loads(md[json_start:json_end].strip())
    annex["scenes"] = []
    for scene in spec["scenes"]:
        annex["scenes"].append({
            "sceneId": scene["sceneId"],
            "visualBeats": [
                {
                    "visualBeatId": beat["beatId"],
                    "visualGrammar": {
                        "contractVersion": "1.0.0",
                        "grammarId": beat["visualGrammarId"],
                        "returnTargetBeatId": None,
                        "transitionRole": beat["transitionRole"],
                    },
                }
                for beat in scene["visualBeats"]
            ],
        })
    rendered = "\n" + json.dumps(annex, ensure_ascii=False, indent=2) + "\n"
    return md[:json_start] + rendered + md[json_end:]


def rewrite_final_production_source(md: str, spec: dict[str, Any]) -> str:
    begin = "<!--BEGIN_FINAL_PRODUCTION_SOURCE-->"
    if begin not in md:
        raise RepairError("FINAL_PRODUCTION_SOURCE missing")
    marker = md.index(begin)
    json_start = md.index("```json", marker) + len("```json")
    json_end = md.index("```", json_start)
    source = json.loads(md[json_start:json_end].strip())
    source["render_spec"] = spec
    rendered = "\n" + json.dumps(source, ensure_ascii=False, indent=2) + "\n"
    return md[:json_start] + rendered + md[json_end:]


def apply(*, repo_root: Path, request_path: Path) -> dict[str, Any]:
    request = load_json(request_path)
    if request.get("contractVersion") != "1.0.0":
        raise RepairError("unsupported request contractVersion")
    if request.get("confirmation") != "APPLY_POST_TTS_AUTHORING_REPAIR":
        raise RepairError("invalid request confirmation")
    date = request.get("episodeDate")
    if not isinstance(date, str):
        raise RepairError("episodeDate missing")
    spec_path = repo_root / f"render-specs/{date}/render_spec.json"
    package_path = repo_root / f"episode-packages/{date}/episode_package_{date}.md"
    ready_path = repo_root / f"render-specs/{date}/production_ready.json"
    old_spec_bytes = spec_path.read_bytes()
    old_package_bytes = package_path.read_bytes()
    if sha256_bytes(old_spec_bytes) != request.get("expectedBeforeRenderSpecSha256"):
        raise RepairError("render_spec SHA drift")
    if sha256_bytes(old_package_bytes) != request.get("expectedBeforeEpisodePackageSha256"):
        raise RepairError("episode_package SHA drift")
    old_spec = json.loads(old_spec_bytes.decode("utf-8"))
    spec = copy.deepcopy(old_spec)

    for change in request.get("existingBeatChanges", []):
        if not isinstance(change, dict):
            raise RepairError("existingBeatChanges entry must be object")
        _, beat = find_beat(spec, change["beatId"])
        assert_visual_expected(beat, change.get("expected", {}))
        set_visual_contract(beat, change["replacement"])

    for split in request.get("sceneSplits", []):
        if not isinstance(split, dict):
            raise RepairError("sceneSplits entry must be object")
        split_chunks_and_beats(spec, split)

    spec["visualGrammarContract"]["beatCount"] = sum(
        len(scene.get("visualBeats", [])) for scene in spec["scenes"]
    )

    for old_scene, new_scene in zip(old_spec["scenes"], spec["scenes"]):
        if old_scene["sceneId"] != new_scene["sceneId"]:
            raise RepairError("scene ordering changed")
        if full_scene_text(old_scene, "speechText") != full_scene_text(new_scene, "speechText"):
            raise RepairError(f"{old_scene['sceneId']}: narration wording changed")
        if full_scene_text(old_scene, "captionText") != full_scene_text(new_scene, "captionText"):
            raise RepairError(f"{old_scene['sceneId']}: caption wording changed")
        if sum(c.get("pauseAfterMs", 0) for c in old_scene["narrationChunks"]) != sum(
            c.get("pauseAfterMs", 0) for c in new_scene["narrationChunks"]
        ):
            raise RepairError(f"{old_scene['sceneId']}: explicit pause budget changed")
        for key in (
            "headline", "cards", "numbers", "nodes", "arrows", "supportingTexts",
            "uncertainty", "evidenceSourceIds", "assetPlacements", "visualEvents",
        ):
            if old_scene.get(key) != new_scene.get(key):
                raise RepairError(f"forbidden scene content mutation: {old_scene['sceneId']}.{key}")
    for key in ("editorial", "publishing", "review", "pronunciations", "voiceProfileId", "sources", "corrections"):
        if old_spec.get(key) != spec.get(key):
            raise RepairError(f"forbidden root mutation: {key}")

    spec_text = json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    new_spec_sha = sha256_bytes(spec_text.encode("utf-8"))
    if new_spec_sha != request.get("expectedAfterRenderSpecSha256"):
        raise RepairError(f"unexpected repaired render_spec SHA: {new_spec_sha}")
    spec_path.write_text(spec_text, encoding="utf-8")

    md = old_package_bytes.decode("utf-8")
    for replacement in request.get("packageSummaryReplacements", []):
        old = replacement.get("old")
        new_text = replacement.get("new")
        if not isinstance(old, str) or not isinstance(new_text, str) or md.count(old) != 1:
            raise RepairError(f"package summary replacement precondition failed: {old!r}")
        md = md.replace(old, new_text, 1)
    for change in request.get("existingBeatChanges", []):
        scene, beat = find_beat(spec, change["beatId"])
        md = update_human_beat(md, scene["sceneId"], beat)
    for split in request.get("sceneSplits", []):
        scene = find_scene(spec, split["sceneId"])
        md = rebuild_human_scene_beats(md, scene)
    md = rewrite_visual_grammar_annex(md, spec)
    md = rewrite_final_production_source(md, spec)
    new_package_sha = sha256_bytes(md.encode("utf-8"))
    if new_package_sha != request.get("expectedAfterEpisodePackageSha256"):
        raise RepairError(f"unexpected repaired episode_package SHA: {new_package_sha}")
    package_path.write_text(md, encoding="utf-8")

    if ready_path.exists():
        ready_path.unlink()

    return {
        "contractVersion": "1.0.0",
        "status": "patched-awaiting-validator",
        "episodeDate": date,
        "oldRenderSpecSha256": request["expectedBeforeRenderSpecSha256"],
        "newRenderSpecSha256": new_spec_sha,
        "oldEpisodePackageSha256": request["expectedBeforeEpisodePackageSha256"],
        "newEpisodePackageSha256": new_package_sha,
        "narrationWordingChanged": False,
        "captionWordingChanged": False,
        "editorialChanged": False,
        "numbersChanged": False,
        "sourcesChanged": False,
        "explicitPauseBudgetChanged": False,
        "chunkBoundariesChanged": True,
        "visualGrammarBeatCount": spec["visualGrammarContract"]["beatCount"],
        "changedExistingBeatIds": [item["beatId"] for item in request.get("existingBeatChanges", [])],
        "splitSceneIds": [item["sceneId"] for item in request.get("sceneSplits", [])],
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
        result = apply(repo_root=root, request_path=request)
    except (RepairError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "fail", "errors": [str(exc)]}, ensure_ascii=False, indent=2))
        return 2
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
