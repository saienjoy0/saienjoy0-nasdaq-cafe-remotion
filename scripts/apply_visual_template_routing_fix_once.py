import json
import subprocess
from pathlib import Path

renderer_path = Path("src/components/spec/VisualTemplateRenderer.tsx")
renderer = renderer_path.read_text(encoding="utf-8")
old = '''    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "verification-checklist": return <VerificationChecklist content={content}/>;
    case "conclusion-card":
    case "metric-comparison-board":
    case "index-return-bars":
    case "evidence-boundary": return <EvidenceBoundary content={content}/>;
    case "analogy-steps":
    case "news-media":
    case "text-focus":
      return <SpecVisualMode content={content}/>;'''
new = '''    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "verification-checklist": return <VerificationChecklist content={content}/>;
    case "evidence-boundary": return <EvidenceBoundary content={content}/>;
    case "conclusion-card":
    case "metric-comparison-board":
    case "index-return-bars":
    case "analogy-steps":
    case "news-media":
    case "text-focus":
      return <SpecVisualMode content={content}/>;'''
if renderer.count(old) != 1:
    raise SystemExit(f"routing block mismatch: {renderer.count(old)}")
renderer = renderer.replace(old, new, 1)
renderer_path.write_text(renderer, encoding="utf-8")

test_path = Path("scripts/test-stage-legibility-contract.tsx")
test = test_path.read_text(encoding="utf-8")
anchor = '  assert.match(renderer, /case "evidence-boundary": return <EvidenceBoundary/);\n'
extra = '''  assert.match(renderer, /case "metric-comparison-board":\\n    case "index-return-bars":\\n    case "analogy-steps":/);\n  assert.doesNotMatch(renderer, /case "metric-comparison-board":\\n    case "index-return-bars":\\n    case "evidence-boundary":/);\n'''
if anchor not in test:
    raise SystemExit("stage test routing anchor missing")
if extra not in test:
    test = test.replace(anchor, anchor + extra, 1)
test_path.write_text(test, encoding="utf-8")

package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package.get("scripts", {}).pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

Path("scripts/apply_visual_template_routing_fix_once.py").unlink(missing_ok=True)

subprocess.run([
    "git", "add", "--",
    "package.json",
    "src/components/spec/VisualTemplateRenderer.tsx",
    "scripts/test-stage-legibility-contract.tsx",
    "scripts/apply_visual_template_routing_fix_once.py",
], check=True)

print("visual template routing corrected and staged")
