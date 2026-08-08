import json
import subprocess
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, got {count}")
    return text.replace(old, new, 1)

# 1) Keep machine-only entity-card labels out of viewer-facing text.
path = Path("src/components/spec/AdditionalVisualTemplates.tsx")
text = path.read_text(encoding="utf-8")
start = text.index('export const EntityFocusStoryTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {')
end = text.index('\n\nexport const FinalAssemblyTemplate:', start)
replacement = r'''const INTERNAL_ENTITY_CARD_LABEL = /(?:企業|人物|製品)カード$/u;

type EntityFocusTextSource = Pick<PublicMainContent, "texts" | "primaryElement" | "headline" | "entity">;

export const getEntityFocusPublicPoint = (content: EntityFocusTextSource): string => {
  const displayName = content.entity?.displayName.trim() ?? "";
  const role = content.entity?.role.trim() ?? "";
  const isMachineOnly = (value: string) => INTERNAL_ENTITY_CARD_LABEL.test(value.trim());
  const viewerText = content.texts
    .map((value) => value.trim())
    .find((value) => value.length > 0 && value !== displayName && value !== role && !isMachineOnly(value));
  if (viewerText) return viewerText;
  const primary = content.primaryElement.trim();
  if (primary && primary !== displayName && primary !== role && !isMachineOnly(primary)) return primary;
  return content.headline;
};

export const EntityFocusStoryTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const number = content.numbers[0];
  const entityStart = number?.revealAtMs ?? content.beatStartMs;
  const publicPoint = getEntityFocusPublicPoint(content);
  return <Surface accent={palette.cyan} style={{position: "relative", padding: "42px 48px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 30}}><div style={{...revealStyle(content, entityStart, "left"), display: "flex", flexDirection: "column", justifyContent: "center"}}><div style={{fontSize: 25, color: palette.cyan, fontWeight: 950}}>{content.entity?.subjectType === "company" ? "企業" : content.entity?.subjectType === "person" ? "人物" : "主役"}</div><div style={{marginTop: 16, fontSize: 66, lineHeight: 1.08, fontWeight: 950}}>{content.entity?.displayName ?? content.headline}</div><div style={{marginTop: 20, color: palette.muted, fontSize: 31, lineHeight: 1.32, fontWeight: 850}}>{content.entity?.role ?? content.screenQuestion}</div></div><div style={{...revealStyle(content, number?.revealAtMs ?? entityStart + 500, "right"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "rgba(7,142,174,.09)", border: `3px solid ${palette.cyan}`, textAlign: "center"}}>{number ? <><div style={{fontSize: 28, color: palette.muted, fontWeight: 900}}>{number.label}</div><div style={{marginTop: 18}}><Value content={content} number={number} size={88}/></div></> : <><div style={{fontSize: 27, color: palette.muted, fontWeight: 900}}>今朝のポイント</div><div style={{marginTop: 18, fontSize: 45, lineHeight: 1.2, color: palette.emphasis, fontWeight: 950}}>{publicPoint}</div></>}</div></Surface>;
};'''
text = text[:start] + replacement + text[end:]
path.write_text(text, encoding="utf-8")

# 2) Extend the public-screen test with behavior checks for entity-card label filtering.
path = Path("scripts/test-public-screen.ts")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'import path from "node:path";\n',
    'import path from "node:path";\nimport {getEntityFocusPublicPoint} from "../src/components/spec/AdditionalVisualTemplates";\n',
    "public screen helper import",
)
text = replace_once(
    text,
    '    "src/components/spec/VisualTemplateRenderer.tsx",\n',
    '    "src/components/spec/VisualTemplateRenderer.tsx",\n    "src/components/spec/AdditionalVisualTemplates.tsx",\n',
    "additional visual template source scan",
)
text = replace_once(
    text,
    '  "出典主体：",\n',
    '  "出典主体：",\n  "画面の論点",\n',
    "legacy entity focus label forbidden",
)
behavior = r'''
assert.equal(getEntityFocusPublicPoint({
  texts: ["AMD", "CPUとGPUを設計する半導体会社"],
  primaryElement: "AMD企業カード",
  headline: "AMD -7.04%",
  entity: {subjectType: "company", displayName: "AMD", role: "CPUとGPUを設計する半導体会社", variant: "company"},
}), "AMD -7.04%", "machine-only AMD企業カード must fall back to the public scene headline");

assert.equal(getEntityFocusPublicPoint({
  texts: ["NVIDIA", "SpaceXがGPUを専属採用"],
  primaryElement: "NVIDIA企業カード",
  headline: "NVIDIA +3.43%",
  entity: {subjectType: "company", displayName: "NVIDIA", role: "AI向けGPU企業", variant: "company"},
}), "SpaceXがGPUを専属採用", "viewer text must outrank machine-only NVIDIA企業カード");

assert.equal(getEntityFocusPublicPoint({
  texts: ["AMD", "CPUとGPUを設計する半導体会社"],
  primaryElement: "大型顧客の獲得",
  headline: "AMD",
  entity: {subjectType: "company", displayName: "AMD", role: "CPUとGPUを設計する半導体会社", variant: "company"},
}), "大型顧客の獲得", "public primaryElement must remain usable");
'''
text = replace_once(
    text,
    'console.log("PASS: 視聴者向け画面から制作・デバッグ表示を除去");\n',
    behavior + '\nconsole.log("PASS: 視聴者向け画面から制作・デバッグ表示を除去");\n',
    "entity public text behavior tests",
)
path.write_text(text, encoding="utf-8")

# 3) Make public-screen safety part of the normal visual-story CI and remove this one-shot hook.
package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package.get("scripts", {}).pop("pretypecheck", None)
visual_story = package["scripts"]["test:visual-story"]
if "npm run test:public-screen" not in visual_story:
    package["scripts"]["test:visual-story"] = visual_story + " && npm run test:public-screen"
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Leave only permanent source/test changes for the workflow's tested commit.
Path("scripts/apply_entity_card_public_text_fix_once.py").unlink(missing_ok=True)
subprocess.run([
    "git", "add", "--",
    "src/components/spec/AdditionalVisualTemplates.tsx",
    "scripts/test-public-screen.ts",
    "package.json",
    "scripts/apply_entity_card_public_text_fix_once.py",
], check=True)

print("entity-card public text repair applied and staged")
