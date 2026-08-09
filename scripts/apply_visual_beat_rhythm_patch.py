from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "render-specs/2026-08-06/render_spec.json"
PACKAGE = ROOT / "episode-packages/2026-08-06/episode_package_2026-08-06.md"
PKG = ROOT / "package.json"
SELF = Path(__file__).resolve()


def scene(data: dict, scene_id: str) -> dict:
    for item in data["scenes"]:
        if item["sceneId"] == scene_id:
            return item
    raise RuntimeError(f"missing scene: {scene_id}")


def beat(item: dict, beat_id: str) -> dict:
    for value in item["visualBeats"]:
        if value["beatId"] == beat_id:
            return value
    raise RuntimeError(f"missing beat: {beat_id}")


def number(item: dict, number_id: str) -> dict:
    for value in item["numbers"]:
        if value["numberId"] == number_id:
            return value
    raise RuntimeError(f"missing number: {number_id}")


def narration_fingerprint(data: dict) -> list[tuple[str, str, str]]:
    return [
        (chunk["chunkId"], chunk["speechText"], chunk["captionText"])
        for sc in data["scenes"]
        for chunk in sc["narrationChunks"]
    ]


def replace_once(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"expected exactly one markdown match, found {count}: {old[:80]!r}")
    return text.replace(old, new, 1)


def replace_in_beat(text: str, beat_id: str, end_marker: str, replacements: list[tuple[str, str]]) -> str:
    start_marker = f"- **{beat_id}**"
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    segment = text[start:end]
    for old, new in replacements:
        count = segment.count(old)
        if count != 1:
            raise RuntimeError(f"{beat_id}: expected one match, found {count}: {old!r}")
        segment = segment.replace(old, new, 1)
    return text[:start] + segment + text[end:]


data = json.loads(SPEC.read_text(encoding="utf-8"))
before_narration = narration_fingerprint(data)

# Scene 3: stop treating three Q2 values as equal-weight cards. Make the actual result the single focal point.
s3 = scene(data, "scene-03")
s3_actual = number(s3, "scene-03-beat-001-number-02")
s3_actual["tone"] = "positive"
s3_actual["comparison"] = "会社見通し中心112億ドルを+3.4億ドル上回る"
s3b1 = beat(s3, "scene-03-beat-001")
s3b1.update({
    "contentType": "hero-number",
    "objectIds": ["scene-03-beat-001-number-02"],
    "primaryElement": "Q2実績 115.4億ドル",
    "primaryFunction": "Evidence",
    "screenQuestion": "Q2実績は会社見通しを超えたか",
    "screenState": "Data",
    "sequencePolicy": "explicit",
    "templateVariant": "default",
    "viewerTexts": [
        "Q2実績 115.4億ドル",
        "会社見通し中心 112億ドル",
        "差 +3.4億ドル",
    ],
    "visualGrammarId": "evidence",
    "visualMode": "number-comparison",
    "visualTemplate": "hero-number",
})
s3b1["templateConfig"]["displayOrder"] = ["scene-03-beat-001-number-02"]
s3b1["templateConfig"]["variant"] = "default"
for event in s3["visualEvents"]:
    if event["eventId"] == "event-005":
        event["targetId"] = "scene-03-beat-001-number-02"

# Scene 6: preserve the existing financial recipe, but reveal the market evidence in semantic order.
s6 = scene(data, "scene-06")
for nid in [
    "scene-06-beat-002-number-01",
    "scene-06-beat-002-number-02",
    "scene-06-beat-002-number-03",
]:
    number(s6, nid)["tone"] = "negative"
s6b2 = beat(s6, "scene-06-beat-002")
s6b2.update({
    "primaryElement": "半導体 → 大型テックの別要因",
    "screenQuestion": "AMD一社でNASDAQ全体を説明できるか",
    "sequencePolicy": "explicit",
    "viewerTexts": [
        "① 半導体｜SOXX -2.12%",
        "② 大型テック｜Alphabet -4.03%",
        "③ 大型テック｜Microsoft -1.09%",
    ],
})
existing_targets = {event.get("targetId") for event in s6["visualEvents"]}
new_events = [
    {
        "action": "show",
        "atChunkId": "scene-06-chunk-002",
        "durationMs": 560,
        "easingPreset": "smooth-out",
        "eventId": "event-019",
        "expression": None,
        "motionPreset": "rise-soft",
        "offsetMs": 900,
        "targetId": "scene-06-beat-002-number-02",
        "timing": "chunk-start",
    },
    {
        "action": "show",
        "atChunkId": "scene-06-chunk-002",
        "durationMs": 560,
        "easingPreset": "smooth-out",
        "eventId": "event-020",
        "expression": None,
        "motionPreset": "rise-soft",
        "offsetMs": 1800,
        "targetId": "scene-06-beat-002-number-03",
        "timing": "chunk-start",
    },
]
for event in new_events:
    if event["targetId"] not in existing_targets:
        s6["visualEvents"].append(event)

# Scene 7: color the divergence, then stop repeating another split comparison.
s7 = scene(data, "scene-07")
number(s7, "scene-07-beat-001-number-01")["tone"] = "positive"
number(s7, "scene-07-beat-001-number-02")["tone"] = "negative"
number(s7, "scene-07-beat-001-number-03")["tone"] = "negative"
s7b2 = beat(s7, "scene-07-beat-002")
s7b2.update({
    "contentType": "text-focus",
    "primaryElement": "AI全面安でも、単一原因でもない",
    "primaryFunction": "Explain",
    "screenQuestion": "どこまで因果を言えるか",
    "screenState": "Data",
    "sequencePolicy": "static",
    "templateVariant": "default",
    "viewerTexts": [
        "AI全面安ではない",
        "NVIDIAだけでNASDAQ全体は説明できない",
        "大型テック安とDow高が、単一原因への断定を弱める",
    ],
    "visualGrammarId": "bridge-text",
    "visualMode": "text-focus",
    "visualTemplate": "text-focus",
})
s7b2["templateConfig"].update({
    "comparisonBasis": None,
    "displayOrder": ["scene-07-card-002"],
    "laneLabels": [],
    "variant": "default",
})

# Record the visual-only re-review without touching facts or narration.
changes = data.setdefault("review", {}).setdefault("changesApplied", [])
for change in [
    "Scene 3のQ2実績を単一Heroへ変更し、数字の優先順位を明確化",
    "Scene 6の市場要因をSOXX→Alphabet→Microsoftの順に段階表示",
    "Scene 7後半を比較カードの反復から因果境界のテキスト回収へ変更",
]:
    if change not in changes:
        changes.append(change)

if narration_fingerprint(data) != before_narration:
    raise RuntimeError("visual-only patch changed narration or caption text")

spec_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
SPEC.write_text(spec_text, encoding="utf-8")
spec_sha = hashlib.sha256(spec_text.encode("utf-8")).hexdigest()

# Keep the human review package aligned with the executable visual plan.
md = PACKAGE.read_text(encoding="utf-8")
md = replace_once(md,
    "| 3 | Data → Chart | AMD決算の確認済み数値を解釈前に置く |",
    "| 3 | Data → Chart | Q2実績をHero表示し、Q3の追い風・向かい風へ進む |")
md = replace_once(md,
    "| 6 | Chart → Data | 発表順と終値を使い、主役反応とNASDAQ全体を分ける |",
    "| 6 | Chart → Data | 発表順の後、SOXX→Alphabet→Microsoftの順に市場要因を段階表示する |")
md = replace_once(md,
    "| 7 | Chart → Data | 仮説の限界を三銘柄比較で示す |",
    "| 7 | Chart → Data | 三銘柄差の後、単一原因へ断定できない境界を大きく回収する |")

md = replace_in_beat(md, "scene-03-beat-001", "- **scene-03-beat-002**", [
    ("  - Visual Template ID：metric-comparison-board", "  - Visual Template ID：hero-number"),
    ("  - 入力構造：会社見通し中心 112億ドル / 実績 115.4億ドル / 差 +3.4億ドル", "  - 入力構造：実績 115.4億ドル / 会社見通し中心 112億ドル / 差 +3.4億ドル"),
    ("  - 主要要素：Q2会社見通しと実績", "  - 主要要素：Q2実績 115.4億ドル"),
    ("  - 視聴者向けテキスト：会社見通し中心 112億ドル / 実績 115.4億ドル / 差 +3.4億ドル", "  - 視聴者向けテキスト：Q2実績 115.4億ドル / 会社見通し中心 112億ドル / 差 +3.4億ドル"),
])
md = replace_once(md,
    "- 画面で見せる内容：Q2会社見通しと実績; Q3売上見通しと粗利率",
    "- 画面で見せる内容：Q2実績115.4億ドルをHero表示し会社見通しとの差を一目で示す; Q3売上見通しと粗利率")

md = replace_in_beat(md, "scene-06-beat-002", "### 完成ナレーション", [
    ("  - 入力構造：SOXX -2.12% / Alphabet -4.03% / Microsoft -1.09%", "  - 入力構造：①半導体 SOXX -2.12% / ②大型テック Alphabet -4.03% / ③大型テック Microsoft -1.09%"),
    ("  - 画面の問い：AMDとNASDAQ全体をどう分けるか", "  - 画面の問い：AMD一社でNASDAQ全体を説明できるか"),
    ("  - 主要要素：主役反応と大型テック別要因", "  - 主要要素：半導体 → 大型テックの別要因"),
    ("  - 視聴者向けテキスト：SOXX -2.12% / Alphabet -4.03% / Microsoft -1.09%", "  - 視聴者向けテキスト：① 半導体｜SOXX -2.12% / ② 大型テック｜Alphabet -4.03% / ③ 大型テック｜Microsoft -1.09%"),
])
md = replace_once(md,
    "- 画面で見せる内容：SpaceX→AMD→翌日終値; 主役反応と大型テック別要因",
    "- 画面で見せる内容：SpaceX→AMD→翌日終値; SOXX→Alphabet→Microsoftの順に市場要因を段階表示")

md = replace_in_beat(md, "scene-07-beat-002", "### 完成ナレーション", [
    ("  - Visual Grammar：comparison / continuation", "  - Visual Grammar：bridge-text / continuation"),
    ("  - Visual Template ID：dual-asset-split", "  - Visual Template ID：text-focus"),
    ("  - Template Variant：default", "  - Template Variant：default"),
    ("  - 入力構造：半導体：採用証拠の差 / NASDAQ：大型テック安も重なる / Dow +0.5%の混合相場", "  - 入力構造：AI全面安ではない / NVIDIAだけでNASDAQ全体は説明できない / 大型テック安とDow高が単一原因への断定を弱める"),
    ("  - 主要要素：半導体の相対評価とNASDAQ別要因", "  - 主要要素：AI全面安でも、単一原因でもない"),
    ("  - 視聴者向けテキスト：仮説を支える｜半導体：採用証拠の差 / 断定を弱める｜NASDAQ：大型テック安も重なる / 断定を弱める｜Dow +0.5%の混合相場", "  - 視聴者向けテキスト：AI全面安ではない / NVIDIAだけでNASDAQ全体は説明できない / 大型テック安とDow高が、単一原因への断定を弱める"),
])
md = replace_once(md,
    "- 画面で見せる内容：NVIDIA・AMD・Alphabet比較; 半導体の相対評価とNASDAQ別要因",
    "- 画面で見せる内容：NVIDIA・AMD・Alphabet比較; AI全面安でも単一原因でもないという因果の境界を回収")
md = replace_once(md,
    "- 必須修正と反映結果：『数字のGapはプラス、期待のGapはマイナス』へ分離。Scene 6でAMDとNASDAQ全体を分離。",
    "- 必須修正と反映結果：『数字のGapはプラス、期待のGapはマイナス』へ分離。Scene 6でAMDとNASDAQ全体を分離。追加Visual審問としてScene 3をHero化、Scene 6を段階表示、Scene 7後半を因果境界の回収へ変更。事実・ナレーション・TTSは変更なし。")

# Replace the embedded execution snapshot so the Markdown and standalone render_spec remain one source of truth.
pattern = re.compile(r"(<!--BEGIN_FINAL_PRODUCTION_SOURCE-->\n```json\n)(.*?)(\n```\n<!--END_FINAL_PRODUCTION_SOURCE-->)", re.S)
match = pattern.search(md)
if not match:
    raise RuntimeError("missing FINAL_PRODUCTION_SOURCE block")
final_source = json.loads(match.group(2))
final_source["render_spec"] = data
for key in ["render_spec_sha256", "renderSpecSha256"]:
    if key in final_source:
        final_source[key] = spec_sha
replacement = match.group(1) + json.dumps(final_source, ensure_ascii=False, indent=2) + match.group(3)
md = md[:match.start()] + replacement + md[match.end():]
PACKAGE.write_text(md, encoding="utf-8")

# Remove the temporary lifecycle hook before the workflow commits the actual patch.
pkg = json.loads(PKG.read_text(encoding="utf-8"))
pkg["scripts"].pop("pretypecheck", None)
PKG.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

subprocess.run(["git", "add", str(SPEC.relative_to(ROOT)), str(PACKAGE.relative_to(ROOT)), str(PKG.relative_to(ROOT))], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "-f", str(SELF.relative_to(ROOT))], cwd=ROOT, check=True)
print("Visual Beat rhythm patch staged successfully; narration/TTS identity preserved")
