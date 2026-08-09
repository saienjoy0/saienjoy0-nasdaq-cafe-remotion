#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one anchor, found {count}: {old[:100]!r}")
    write(path, text.replace(old, new, 1))


# 1) Give reusable entity cards their own public slot instead of flattening
# every EntityFocus asset into a background-sized full slot.
replace_once(
    "src/spec/public-view-model.ts",
    '  slot: "full" | "focus-media" | "primary" | "entity" | "lower";',
    '  slot: "full" | "focus-media" | "primary" | "entity" | "entity-card" | "lower";',
)
replace_once(
    "src/spec/public-view-model.ts",
    '''  const mainAssets = activeBeatPlacements.map((placement) => publicAsset(\n    placement,\n    assets,\n    beat.screenState === "EntityFocus" ? "full" : undefined,\n  ));''',
    '''  const mainAssets = activeBeatPlacements.map((placement) => publicAsset(\n    placement,\n    assets,\n    beat.screenState === "EntityFocus" && placement.role === "entity-card"\n      ? "entity-card"\n      : beat.screenState === "EntityFocus"\n        ? "full"\n        : undefined,\n  ));''',
)

# 2) Reserve a 16:9 foreground slot on the right side of the fixed main stage.
replace_once(
    "src/components/spec/SpecAssetLayer.tsx",
    '  entity: {position: "absolute", right: 32, top: 32, width: 424, height: 584},\n',
    '  entity: {position: "absolute", right: 32, top: 32, width: 424, height: 584},\n  "entity-card": {position: "absolute", right: 38, top: 34, width: 620, height: 349, borderRadius: 22, boxShadow: "0 18px 42px rgba(16,32,51,.24)", background: "rgba(249,252,254,.98)"},\n',
)

# 3) Draw entity-card assets after the generated Stage content while keeping all
# other main assets behind the Stage.
replace_once(
    "src/compositions/NasdaqCafeSpecEpisode.tsx",
    '''  const chromeMode: StageChromeMode = stageMode === "candidate" && stageShellId\n    ? getStageChromeModeForShell(stageShellId)\n    : "full";\n\n  return <AbsoluteFill''',
    '''  const chromeMode: StageChromeMode = stageMode === "candidate" && stageShellId\n    ? getStageChromeModeForShell(stageShellId)\n    : "full";\n  const foregroundEntityAssets = view.mainAssets.filter((asset) => asset.slot === "entity-card");\n  const backgroundMainAssets = view.mainAssets.filter((asset) => asset.slot !== "entity-card");\n\n  return <AbsoluteFill''',
)
replace_once(
    "src/compositions/NasdaqCafeSpecEpisode.tsx",
    '''    <div data-stage-layout="fixed" style={{...MAIN_STAGE_FRAME_STYLE, borderRadius: stageMode === "legacy" ? 30 : 0}}>\n      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>\n      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}\n    </div>''',
    '''    <div data-stage-layout="fixed" style={{...MAIN_STAGE_FRAME_STYLE, borderRadius: stageMode === "legacy" ? 30 : 0}}>\n      <SpecAssetLayer assets={backgroundMainAssets} zIndex={10}/>\n      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}\n      <SpecAssetLayer assets={foregroundEntityAssets} zIndex={30}/>\n    </div>''',
)

# 4) When a prebuilt company/person card exists, reserve the upper-right area for
# it and keep the viewer-facing daily point in a compact lower-right panel.
template_path = "src/components/spec/AdditionalVisualTemplates.tsx"
template_text = read(template_path)
start_marker = 'export const EntityFocusStoryTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {'
end_marker = 'export const FinalAssemblyTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {'
start = template_text.find(start_marker)
end = template_text.find(end_marker)
if start < 0 or end < 0 or end <= start:
    raise SystemExit("AdditionalVisualTemplates.tsx: EntityFocusStoryTemplate markers not found")
new_entity_template = '''export const EntityFocusStoryTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {\n  const number = content.numbers[0];\n  const entityStart = number?.revealAtMs ?? content.beatStartMs;\n  const publicPoint = getEntityFocusPublicPoint(content);\n  const prebuiltCard = content.entityPresentation === "prebuilt-card";\n  const point = <><div style={{fontSize: 27, color: palette.muted, fontWeight: 900}}>{number ? number.label : "今朝のポイント"}</div>{number ? <div style={{marginTop: 18}}><Value content={content} number={number} size={88}/></div> : <div style={{marginTop: 14, fontSize: prebuiltCard ? 38 : 45, lineHeight: 1.18, color: palette.emphasis, fontWeight: 950, overflowWrap: "anywhere"}}>{publicPoint}</div>}</>;\n  return <Surface accent={palette.cyan} style={{position: "relative", padding: "42px 48px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 30}}>\n    <div style={{...revealStyle(content, entityStart, "left"), display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0}}><div style={{fontSize: 25, color: palette.cyan, fontWeight: 950}}>{content.entity?.subjectType === "company" ? "企業" : content.entity?.subjectType === "person" ? "人物" : "主役"}</div><div style={{marginTop: 16, fontSize: 66, lineHeight: 1.08, fontWeight: 950}}>{content.entity?.displayName ?? content.headline}</div><div style={{marginTop: 20, color: palette.muted, fontSize: 31, lineHeight: 1.32, fontWeight: 850}}>{content.entity?.role ?? content.screenQuestion}</div></div>\n    {prebuiltCard\n      ? <div style={{...revealStyle(content, number?.revealAtMs ?? entityStart + 500, "right"), display: "flex", alignItems: "flex-end", minWidth: 0, paddingTop: 382}}><div data-entity-point-panel="true" style={{width: "100%", minHeight: 146, boxSizing: "border-box", padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 22, background: "rgba(249,252,254,.96)", border: `3px solid ${palette.cyan}`, textAlign: "center"}}>{point}</div></div>\n      : <div style={{...revealStyle(content, number?.revealAtMs ?? entityStart + 500, "right"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "rgba(7,142,174,.09)", border: `3px solid ${palette.cyan}`, textAlign: "center"}}>{point}</div>}\n  </Surface>;\n};\n\n'''
write(template_path, template_text[:start] + new_entity_template + template_text[end:])

# 5) Add a static regression contract so this foreground layering cannot silently regress.
test_path = "scripts/test-stage-legibility-contract.tsx"
test_text = read(test_path)
contract = '''\n\ntest("prebuilt entity cards use a dedicated foreground slot", () => {\n  const viewModel = readFileSync("src/spec/public-view-model.ts", "utf8");\n  const assetLayer = readFileSync("src/components/spec/SpecAssetLayer.tsx", "utf8");\n  const episode = readFileSync("src/compositions/NasdaqCafeSpecEpisode.tsx", "utf8");\n  const templates = readFileSync("src/components/spec/AdditionalVisualTemplates.tsx", "utf8");\n  assert.match(viewModel, /placement\\.role === "entity-card"[\\s\\S]*\\? "entity-card"/);\n  assert.match(assetLayer, /"entity-card": \\{position: "absolute", right: 38, top: 34, width: 620, height: 349/);\n  assert.match(episode, /const foregroundEntityAssets = view\\.mainAssets\\.filter/);\n  assert.match(episode, /<SpecAssetLayer assets=\\{foregroundEntityAssets\\} zIndex=\\{30\\}\\/>/);\n  assert.match(templates, /const prebuiltCard = content\\.entityPresentation === "prebuilt-card"/);\n  assert.match(templates, /data-entity-point-panel="true"/);\n});\n'''
if 'prebuilt entity cards use a dedicated foreground slot' not in test_text:
    write(test_path, test_text.rstrip() + contract)

# Remove the temporary hook and stage only the permanent changes.
package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package["scripts"].pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

stage_paths = [
    "src/spec/public-view-model.ts",
    "src/components/spec/SpecAssetLayer.tsx",
    "src/compositions/NasdaqCafeSpecEpisode.tsx",
    "src/components/spec/AdditionalVisualTemplates.tsx",
    "scripts/test-stage-legibility-contract.tsx",
    "package.json",
]
subprocess.run(["git", "add", "--", *stage_paths], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "-f", "--", "scripts/apply_entity_card_foreground_fix.py"], cwd=ROOT, check=True)
print("Entity-card foreground repair staged successfully")
