#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    if text.count(old) != 1:
        raise SystemExit(f"{path}: expected one anchor, found {text.count(old)}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "src/components/spec/VisualTemplateRenderer.tsx",
    'const heroSize = Array.from(hero).length <= 10 ? 70 : Array.from(hero).length <= 16 ? 58 : 48;',
    'const heroSize = Array.from(hero).length <= 10 ? 58 : Array.from(hero).length <= 16 ? 50 : 44;',
)
replace_once(
    "src/components/spec/VisualTemplateRenderer.tsx",
    'fontSize: heroSize, lineHeight: 1.08, fontWeight: 950, overflowWrap: "anywhere"',
    'fontSize: heroSize, lineHeight: 1.08, fontWeight: 950, whiteSpace: "nowrap"',
)
replace_once(
    "src/components/spec/VisualTemplateRenderer.tsx",
    '<div style={{textAlign: "right", color: color.emphasis, fontSize: 31, fontWeight: 950}}>{content.primaryElement}</div>\n  </Surface>;\n};\n\nconst VerificationChecklist',
    '<div data-evidence-summary="true" style={{justifySelf: "end", maxWidth: "72%", textAlign: "right", color: color.emphasis, fontSize: 27, lineHeight: 1.16, fontWeight: 950, overflowWrap: "anywhere"}}>{content.primaryElement}</div>\n  </Surface>;\n};\n\nconst VerificationChecklist',
)
replace_once(
    "scripts/test-stage-legibility-contract.tsx",
    r'assert.match(renderer, /const heroSize = Array\\.from\\(hero\\)\\.length <= 10 \\? 70/);',
    r'assert.match(renderer, /const heroSize = Array\\.from\\(hero\\)\\.length <= 10 \\? 58/);',
)
replace_once(
    "scripts/test-stage-legibility-contract.tsx",
    '  assert.match(renderer, /overflowWrap: "anywhere"/);\n',
    '  assert.match(renderer, /overflowWrap: "anywhere"/);\n  assert.match(renderer, /whiteSpace: "nowrap"/);\n  assert.match(renderer, /data-evidence-summary/);\n',
)

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package["scripts"].pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

stage_paths = [
    "src/components/spec/VisualTemplateRenderer.tsx",
    "scripts/test-stage-legibility-contract.tsx",
    "package.json",
]
subprocess.run(["git", "add", "--", *stage_paths], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "-f", "--", "scripts/apply_legibility_followup.py"], cwd=ROOT, check=True)
print("Legibility follow-up staged successfully")
