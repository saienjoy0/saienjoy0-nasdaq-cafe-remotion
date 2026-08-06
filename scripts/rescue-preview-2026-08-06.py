#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
spec = json.loads(path.read_text(encoding="utf-8"))
if spec.get("episode", {}).get("id") != "2026-08-06" or spec.get("schemaVersion") != "2.4.0":
    raise SystemExit("unexpected rescue source")

for key in ("expectedConfirmed", "imageSelection", "tts", "visualGrammarContractVersion"):
    spec.pop(key, None)
for scene in spec["scenes"]:
    for visual_beat in scene["visualBeats"]:
        visual_beat.pop("visualBeatId", None)
        visual_beat.pop("visualGrammar", None)

def beat(scene_number: int, beat_number: int):
    return spec["scenes"][scene_number - 1]["visualBeats"][beat_number - 1]

def set_template(scene_number: int, beat_number: int, name: str, variant: str):
    visual_beat = beat(scene_number, beat_number)
    visual_beat["visualTemplate"] = name
    visual_beat["templateConfig"]["variant"] = variant

beat(2, 1)["returnScreenState"] = "Chart"
beat(2, 1)["sequencePolicy"] = "explicit"
set_template(2, 2, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(3, 1, "tailwind-headwind", "two-lane")
beat(3, 1)["templateConfig"]["laneLabels"] = ["基準", "実績"]
beat(3, 1)["viewerTexts"] = ["基準｜会社見通し中心 112億ドル", "実績｜実績 115.4億ドル", "実績｜差 +3.4億ドル"]
set_template(3, 2, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(4, 1, "tailwind-headwind", "two-lane")
beat(4, 1)["templateConfig"]["laneLabels"] = ["予想", "実績"]
beat(4, 1)["viewerTexts"] = ["予想｜Expected 125.2億ドル", "実績｜Actual 130億ドル", "実績｜Gap +4.8億ドル"]
beat(4, 2)["templateConfig"]["variant"] = "confirmed-vs-unconfirmed"
beat(5, 1)["returnScreenState"] = "Chart"
beat(5, 1)["sequencePolicy"] = "explicit"
set_template(5, 2, "tailwind-headwind", "two-lane")
beat(5, 2)["templateConfig"]["laneLabels"] = ["需要", "採用"]
beat(5, 2)["viewerTexts"] = ["需要｜SpaceX計算増設", "採用｜NVIDIA専属採用", "採用｜将来需要の具体化"]
set_template(6, 1, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(6, 2, "tailwind-headwind", "two-lane")
beat(6, 2)["templateConfig"]["laneLabels"] = ["半導体", "大型テック"]
beat(6, 2)["viewerTexts"] = ["半導体｜SOXX -2.12%", "大型テック｜Alphabet -4.03%", "大型テック｜Microsoft -1.09%"]
set_template(7, 1, "evidence-boundary", "confirmed-vs-unconfirmed")
set_template(7, 2, "tailwind-headwind", "two-lane")
beat(7, 2)["templateConfig"]["laneLabels"] = ["半導体", "NASDAQ"]
beat(7, 2)["viewerTexts"] = ["半導体｜採用証拠の差", "NASDAQ｜大型テック安も重なる", "NASDAQ｜Dow +0.5%の混合相場"]
set_template(8, 1, "verification-checklist", "default")

spec["scenes"][7]["visualMode"] = "verification-points"
for visual_beat in spec["scenes"][7]["visualBeats"]:
    visual_beat["visualMode"] = "verification-points"

spec["scenes"][8]["sceneRole"] = "closing-recap-sendoff-goodnight"
spec["scenes"][8]["visualMode"] = "conclusion-card"
spec["scenes"][8]["transition"] = {"type": "none", "durationMs": 0}
beat(9, 1)["visualMode"] = "conclusion-card"
beat(9, 1)["visualTemplate"] = "final-assembly"
spec["scenes"][8]["cards"][0]["lines"][0]["value"] = "AMD -7.04%"
spec["scenes"][8]["cards"][0]["lines"][1]["value"] = "NVIDIA +3.43%"
spec["scenes"][3]["cards"][0]["title"] = "予想・実績・Gap"
spec["scenes"][6]["cards"][0]["title"] = "NVIDIA・AMD\nAlphabet比較"

for scene_number in (3, 4, 7):
    scene = spec["scenes"][scene_number - 1]
    scene["visualMode"] = "text-focus"
    for visual_beat in scene["visualBeats"]:
        visual_beat["visualMode"] = "text-focus"

allowed_expected_basis = {
    "official-consensus",
    "company-prior-guidance",
    "major-reporting",
    "analyst-view",
    "price-inference",
    "unconfirmed",
}
for scene in spec["scenes"]:
    if scene.get("expectedBasisType") not in allowed_expected_basis:
        scene["expectedBasisType"] = None

captions = {
    "scene-01-chunk-001": "NASDAQ -0.83%、SOXX -2.12%\nNVIDIA +3.43%、AMD -7.04%\n同じAI半導体でも値動きは真逆",
    "scene-01-chunk-002": "市場が見たのはAI需要の有無ではない\n次の巨大需要を誰が確実に取るか\nNVIDIAにはSpaceX採用が加わった",
    "scene-02-chunk-001": "AMD Q2売上115.4億ドル\nデータセンター売上67.2億ドル\nAI需要が弱い決算ではない",
    "scene-02-chunk-002": "売上も見通しも予想超え\nそれでもAMD株は7.04%下落\n決算が悪かった夜ではない",
    "scene-03-chunk-001": "Q2売上は事前中心値を3.4億ドル超過\nデータセンター売上は前年比2倍超\n確認できた数字は強い",
    "scene-03-chunk-002": "Q3見通し130億ドル\n市場予想を4.8億ドル上回る\n粗利率見通しは56%で横ばい",
    "scene-04-chunk-001": "Expected 125.2億ドル\nActual 130億ドル\n数字のGapはプラス",
    "scene-04-chunk-002": "通常予想には勝った\n高まったAI期待には届かなかった\nこれが株価とのGap",
    "scene-05-chunk-001": "SpaceXはNVIDIA GPU専属方針\n次世代Vera Rubinを高く評価\nNVIDIAだけ上がった理由",
    "scene-05-chunk-002": "SpaceXは計算能力を大幅拡大予定\n次の増設先をNVIDIAへ固定\n具体的な大型顧客の採用証拠",
    "scene-05-chunk-003": "AMDの売上成長は消えない\nただしNVIDIAに顧客証拠が加わった\nAMDには一段強い証明が必要",
    "scene-06-chunk-001": "SpaceX説明会の後にAMD決算\nAMD -7.04%、NVIDIA +3.43%\nSOXXは2.12%安",
    "scene-06-chunk-002": "分足がなく瞬間寄与は断定できない\nNASDAQ安はAMD一社では説明不能\n大型テック安も重なった",
    "scene-07-chunk-001": "NVIDIA +3.43%\nAMD -7.04%、Alphabet -4.03%\nAIという一語では説明できない",
    "scene-07-chunk-002": "AI全面安ではない\n半導体は顧客採用の証拠で差がついた\nNASDAQには大型テック安も重なった",
    "scene-08-chunk-001": "次に見るのは三点\nAMDの大型顧客・粗利率と供給制約\nNVIDIA以外へ上昇が広がるか",
    "scene-08-chunk-002": "AMDの顧客獲得と利益率改善なら弱まる\nNVIDIA集中と粗利率横ばいなら強まる\n需要量より受注確実性を見る仮説",
    "scene-09-chunk-001": "悪い決算ではなく証拠の基準が上がった\nAMDには大型受注と利益率改善が必要\n以上、朝のNASDAQカフェでした",
}
for scene in spec["scenes"]:
    for chunk in scene["narrationChunks"]:
        chunk["captionText"] = captions[chunk["chunkId"]]

spec["schemaVersion"] = "2.2.0"
spec["sources"] = [
    source
    for source in spec["sources"]
    if re.fullmatch(r"source-[0-9]{3}", str(source.get("sourceId", "")))
]
for source in spec["sources"]:
    if source.get("sourceType") == "company-ir":
        source["sourceType"] = "company"

path.write_text(
    json.dumps(spec, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
)
