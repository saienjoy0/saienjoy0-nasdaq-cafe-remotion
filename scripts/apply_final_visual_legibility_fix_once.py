import json
import subprocess
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, got {count}")
    return text.replace(old, new, 1)


renderer_path = Path("src/components/spec/VisualTemplateRenderer.tsx")
renderer = renderer_path.read_text(encoding="utf-8")

start = renderer.index('const EvidenceBoundary: React.FC<{content: PublicMainContent}> = ({content}) => {')
end = renderer.index('\n\nconst VerificationChecklist:', start)
new_evidence = r'''const EvidenceBoundary: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = content.texts.length > 0
    ? content.texts
    : content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title]);
  const columns = items.length === 1 ? "1fr" : "repeat(2,minmax(0,1fr))";
  return <Surface accent={color.emphasis} style={{padding: "32px 38px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}}>
    <div style={{fontSize: 28, color: color.muted, fontWeight: 900}}>{content.screenQuestion}</div>
    <div style={{display: "grid", gridTemplateColumns: columns, gridAutoRows: "minmax(0,1fr)", gap: "22px 42px", alignItems: "stretch"}}>
      {items.map((item, index) => {
        const active = index === items.length - 1;
        return <div key={`${index}-${item}`} data-evidence-lane={index + 1} style={{position: "relative", minWidth: 0, minHeight: 0, display: "flex", alignItems: "center", padding: "28px 28px 28px 82px", borderRadius: 24, background: active ? "rgba(112,70,168,.10)" : "rgba(7,142,174,.07)", border: `3px solid ${active ? "rgba(112,70,168,.38)" : "rgba(7,142,174,.25)"}`, overflow: "hidden"}}>
          <div style={{position: "absolute", left: 24, top: 24, width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: active ? color.emphasis : color.cyan, fontSize: 23, fontWeight: 950}}>{index + 1}</div>
          <div style={{...timedStyle(content, content.beatStartMs + index * 680, "x"), fontSize: active ? 41 : 36, lineHeight: 1.24, color: active ? color.emphasis : color.ink, fontWeight: 950}}>{item}</div>
        </div>;
      })}
    </div>
    <div style={{textAlign: "right", color: color.emphasis, fontSize: 29, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};'''
renderer = renderer[:start] + new_evidence + renderer[end:]

renderer = replace_once(
    renderer,
    '  const items = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;\n',
    '  const items = content.texts.length > 0 ? content.texts : content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title]);\n',
    'verification matrix item source',
)
renderer_path.write_text(renderer, encoding="utf-8")

modes_path = Path("src/components/spec/SpecVisualModes.tsx")
modes = modes_path.read_text(encoding="utf-8")
modes = replace_once(
    modes,
    'color: highlighted ? colors.emphasis : colors.ink, fontWeight: 950',
    'color: highlighted ? colors.emphasis : "#e8f4ff", fontWeight: 950',
    'text focus contrast',
)
modes_path.write_text(modes, encoding="utf-8")

test_path = Path("scripts/test-stage-legibility-contract.tsx")
test = test_path.read_text(encoding="utf-8")
anchor = '  assert.match(renderer, /data-evidence-row/);\n'
if anchor in test:
    test = test.replace(anchor, '  assert.match(renderer, /data-evidence-lane/);\n', 1)
else:
    test = test.replace('  assert.match(renderer, /case "evidence-boundary": return <EvidenceBoundary/);\n', '  assert.match(renderer, /case "evidence-boundary": return <EvidenceBoundary/);\n  assert.match(renderer, /data-evidence-lane/);\n', 1)
verify_anchor = '  assert.match(renderer, /data-verification-lane/);\n'
extra = '  assert.match(renderer, /content\\.texts\\.length > 0 \\? content\\.texts : content\\.cards\\.flatMap/);\n'
if extra not in test:
    test = test.replace(verify_anchor, verify_anchor + extra, 1)
text_anchor = '  assert.match(renderer, /count === 2/);\n'
contrast = '  assert.match(renderer, /#e8f4ff/);\n'
if contrast not in test:
    test = test.replace(text_anchor, text_anchor + contrast, 1)
test_path.write_text(test, encoding="utf-8")

package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package.get("scripts", {}).pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

Path("scripts/apply_final_visual_legibility_fix_once.py").unlink(missing_ok=True)

subprocess.run([
    "git", "add", "--",
    "package.json",
    "src/components/spec/VisualTemplateRenderer.tsx",
    "src/components/spec/SpecVisualModes.tsx",
    "scripts/test-stage-legibility-contract.tsx",
    "scripts/apply_final_visual_legibility_fix_once.py",
], check=True)

print("final visual legibility correction applied and staged")
