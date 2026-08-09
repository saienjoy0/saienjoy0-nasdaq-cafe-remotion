from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "render-specs/2026-08-06/render_spec.json"
PACKAGE = ROOT / "episode-packages/2026-08-06/episode_package_2026-08-06.md"
RENDERER = ROOT / "src/components/spec/VisualTemplateRenderer.tsx"
PUBLIC_TEST = ROOT / "scripts/test-public-screen.ts"
PKG = ROOT / "package.json"
TRIGGER_WORKFLOW = ROOT / ".github/workflows/preview-scene4-japanese-plain-connectors.yml"
SELF = Path(__file__).resolve()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, got {count}")
    return text.replace(old, new, 1)


# 1) Viewer-facing template copy: Japanese labels + plain connector lines.
renderer = RENDERER.read_text(encoding="utf-8")
renderer = replace_once(
    renderer,
    'const labels = {expected: "EXPECTED", actual: "ACTUAL", gap: "GAP"} as const;',
    'const labels = {expected: "予想", actual: "実績", gap: "差"} as const;',
    "Expected/Actual/Gap labels",
)
marker_pattern = re.compile(
    r'<defs><marker id="story-template-arrow".*?</marker></defs>',
    re.S,
)
renderer, marker_count = marker_pattern.subn("", renderer, count=1)
if marker_count != 1:
    raise RuntimeError(f"causal arrow marker: expected one match, got {marker_count}")
renderer = replace_once(
    renderer,
    'strokeWidth={arrow.highlighted ? 10 : 7} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#story-template-arrow)"',
    'strokeWidth={arrow.highlighted ? 6 : 4} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - progress}',
    "causal connector style",
)
if "story-template-arrow" in renderer or 'markerEnd="url(#story-template-arrow)"' in renderer:
    raise RuntimeError("arrowhead marker still remains in the public causal renderer")
RENDERER.write_text(renderer, encoding="utf-8")

# 2) Scene 4 narration/subtitles: remove English editorial jargon from what viewers hear/read.
data = json.loads(SPEC.read_text(encoding="utf-8"))
scene4 = next(scene for scene in data["scenes"] if scene["sceneId"] == "scene-04")
chunks = {chunk["chunkId"]: chunk for chunk in scene4["narrationChunks"]}

chunk1 = (
    "普通の予想は、第三四半期売上が百二十五・二億ドル前後になることでした。"
    "実際に会社が示した見通しは百三十億ドル。差はプラスです。"
    "第二四半期実績も会社の事前見通しを上回りました。ここまでは合格です。"
)
chunk2 = (
    "ところがReutersは、最近の大型AI提携と株価上昇で、投資家がさらに大きなAIの回収を求めていたと伝えています。"
    "実際には粗利率見通しが横ばいで、供給制約も残りました。"
    "つまり通常の予想には勝ったのに、高くなった採点基準には届かなかった。これが株価とのズレです。"
)
for chunk_id, text in (("scene-04-chunk-001", chunk1), ("scene-04-chunk-002", chunk2)):
    chunks[chunk_id]["speechText"] = text
    chunks[chunk_id]["captionText"] = text

scene4["formalName"] = "予想・実績・差"
scene4["headline"] = "数字の差はプラス"
beats = {beat["beatId"]: beat for beat in scene4["visualBeats"]}
beat1 = beats["scene-04-beat-001"]
beat1["narrationStartCue"] = "普通の予想は、第三四半期売上が百二十五・二億ドル前後になることでした。"
beat1["narrationEndCue"] = "第二四半期実績も会社の事前見通しを上回りました。ここまでは合格です。"
beat1["changeCue"] = "予想 125.2億ドル"
beat1["screenQuestion"] = "通常予想との差は何か"
beat1["primaryElement"] = "予想 / 実績 / 差"
beat1["viewerTexts"] = ["予想 125.2億ドル", "実績 130億ドル", "差 +4.8億ドル"]
beat2 = beats["scene-04-beat-002"]
beat2["narrationStartCue"] = "ところがReutersは、最近の大型AI提携と株価上昇で、投資家がさらに大きなAIの回収を求めていたと伝えています。"
beat2["narrationEndCue"] = "つまり通常の予想には勝ったのに、高くなった採点基準には届かなかった。これが株価とのズレです。"

publishing = data.get("publishing", {})
if isinstance(publishing.get("description"), str):
    publishing["description"] = publishing["description"].replace("Expected / Actual / Gap", "予想 / 実績 / 差")
changes = data.setdefault("review", {}).setdefault("changesApplied", [])
change = "Scene 4の視聴者向けExpected / Actual / Gap表現を『予想 / 実績 / 差・ズレ』へ日本語化"
if change not in changes:
    changes.append(change)

viewer_copy = "\n".join(
    [scene4["headline"]]
    + [chunk["speechText"] for chunk in scene4["narrationChunks"]]
    + [chunk["captionText"] for chunk in scene4["narrationChunks"]]
    + [beat["screenQuestion"] for beat in scene4["visualBeats"]]
    + [beat["primaryElement"] for beat in scene4["visualBeats"]]
    + [text for beat in scene4["visualBeats"] for text in beat.get("viewerTexts", [])]
)
if re.search(r"\b(?:Expected|Actual|Gap)\b", viewer_copy, re.I):
    raise RuntimeError("Scene 4 viewer-facing copy still contains Expected/Actual/Gap")
if beat1["visualTemplate"] != "expected-actual-gap-flow" or beat1["visualMode"] != "expected-actual-gap":
    raise RuntimeError("internal Expected/Actual/Gap visual contract was changed")

spec_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
SPEC.write_text(spec_text, encoding="utf-8")
spec_sha = hashlib.sha256(spec_text.encode("utf-8")).hexdigest()

# 3) Keep the human-reviewed episode package aligned with the render spec.
md = PACKAGE.read_text(encoding="utf-8")
start = md.index("## Scene 4｜")
end = md.index("## Scene 5｜", start)
section = md[start:end]
section = section.replace("Expected", "予想").replace("Actual", "実績").replace("Gap", "差")
section = section.replace(
    "普通の予想は、第三四半期売上が百二十五・二億ドル前後になることでした。実績の会社見通しは百三十億ドル。数字の差はプラスです。第二四半期実績も会社の事前見通しを上回りました。ここまでは合格です。",
    chunk1,
)
section = section.replace(
    "つまり通常の予想には勝ったのに、高くなった採点基準には届かなかった。これが株価との差です。",
    "つまり通常の予想には勝ったのに、高くなった採点基準には届かなかった。これが株価とのズレです。",
)
section = section.replace("- 補助テロップ：期待の差はマイナス / 普通の合格点では足りなかった", "- 補助テロップ：期待とのズレはマイナス / 普通の合格点では足りなかった")
md = md[:start] + section + md[end:]
md = md.replace("Expected / Actual / Gap", "予想 / 実績 / 差")

pattern = re.compile(r"(<!--BEGIN_FINAL_PRODUCTION_SOURCE-->\n```json\n)(.*?)(\n```\n<!--END_FINAL_PRODUCTION_SOURCE-->)", re.S)
match = pattern.search(md)
if not match:
    raise RuntimeError("missing FINAL_PRODUCTION_SOURCE block")
source = json.loads(match.group(2))
source["render_spec"] = data
for key in ("render_spec_sha256", "renderSpecSha256"):
    if key in source:
        source[key] = spec_sha
md = md[:match.start()] + match.group(1) + json.dumps(source, ensure_ascii=False, indent=2) + match.group(3) + md[match.end():]
PACKAGE.write_text(md, encoding="utf-8")

# 4) Permanent regression checks for both requested visual fixes.
test = PUBLIC_TEST.read_text(encoding="utf-8")
anchor = 'console.log("PASS: 視聴者向け画面から制作・デバッグ表示を除去");'
insert = '''const spec = JSON.parse(await readFile(path.join(project, "render-specs/2026-08-06/render_spec.json"), "utf8"));
const scene4 = spec.scenes.find((scene: {sceneId: string}) => scene.sceneId === "scene-04");
const scene4ViewerCopy = [
  scene4.headline,
  ...scene4.narrationChunks.flatMap((chunk: {speechText: string; captionText: string}) => [chunk.speechText, chunk.captionText]),
  ...scene4.visualBeats.flatMap((beat: {screenQuestion: string; primaryElement: string; viewerTexts: string[]}) => [beat.screenQuestion, beat.primaryElement, ...beat.viewerTexts]),
].join("\\n");
assert.doesNotMatch(scene4ViewerCopy, /\\b(?:Expected|Actual|Gap)\\b/i, "Scene 4 viewer copy must use natural Japanese labels");
assert.match(renderedSource, /const labels = \\{expected: "予想", actual: "実績", gap: "差"\\} as const;/, "comparison card labels must be Japanese");
assert.doesNotMatch(renderedSource, /story-template-arrow/, "causal lane must not render arrowhead markers");
assert.match(renderedSource, /strokeWidth=\\{arrow.highlighted \\? 6 : 4\\} strokeLinecap="round"/, "causal lane must use thin rounded connector lines");

'''
if insert not in test:
    if anchor not in test:
        raise RuntimeError("public-screen test anchor missing")
    test = test.replace(anchor, insert + anchor, 1)
PUBLIC_TEST.write_text(test, encoding="utf-8")

# 5) Remove the temporary execution hook and persist the approved patch before the cached-TTS verification job continues.
pkg = json.loads(PKG.read_text(encoding="utf-8"))
pkg.get("scripts", {}).pop("pretypecheck", None)
PKG.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

subprocess.run(
    [
        "git",
        "add",
        str(SPEC.relative_to(ROOT)),
        str(PACKAGE.relative_to(ROOT)),
        str(RENDERER.relative_to(ROOT)),
        str(PUBLIC_TEST.relative_to(ROOT)),
        str(PKG.relative_to(ROOT)),
    ],
    cwd=ROOT,
    check=True,
)
if TRIGGER_WORKFLOW.exists():
    subprocess.run(["git", "rm", "-f", str(TRIGGER_WORKFLOW.relative_to(ROOT))], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "-f", str(SELF.relative_to(ROOT))], cwd=ROOT, check=True)
subprocess.run(["git", "diff", "--cached", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.name", "github-actions[bot]"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"], cwd=ROOT, check=True)
subprocess.run(["git", "commit", "-m", "Use Japanese comparison copy and plain causal connectors"], cwd=ROOT, check=True)
subprocess.run(["git", "push", "origin", "HEAD:fix/visual-rhythm-2026-08-06"], cwd=ROOT, check=True)
print("Scene 4 Japanese viewer copy and plain causal connectors applied and persisted")
