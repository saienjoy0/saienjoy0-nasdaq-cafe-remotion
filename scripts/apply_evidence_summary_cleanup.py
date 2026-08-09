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
    'return <Surface accent={color.emphasis} style={{padding: "30px 36px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 20}}>',
    'return <Surface accent={color.emphasis} style={{padding: "30px 36px", display: "grid", gridTemplateRows: "auto 1fr", gap: 20}}>',
)
replace_once(
    "src/components/spec/VisualTemplateRenderer.tsx",
    '    <div data-evidence-summary="true" style={{justifySelf: "end", maxWidth: "72%", textAlign: "right", color: color.emphasis, fontSize: 27, lineHeight: 1.16, fontWeight: 950, overflowWrap: "anywhere"}}>{content.primaryElement}</div>\n',
    '',
)
replace_once(
    "scripts/test-stage-legibility-contract.tsx",
    '  assert.match(renderer, /data-evidence-summary/);\n',
    '  assert.doesNotMatch(renderer, /data-evidence-summary/);\n',
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
subprocess.run(["git", "rm", "-f", "--", "scripts/apply_evidence_summary_cleanup.py"], cwd=ROOT, check=True)
print("Evidence summary cleanup staged successfully")
