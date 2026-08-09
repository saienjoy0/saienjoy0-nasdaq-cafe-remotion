#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
patcher = root / "scripts" / "apply_legibility_pass_v1.py"
text = patcher.read_text(encoding="utf-8")
old = 'out, count = re.subn(pattern, replacement, text, count=1, flags=re.S)'
new = 'out, count = re.subn(pattern, lambda _match: replacement, text, count=1, flags=re.S)'
if old not in text:
    raise SystemExit("legibility patcher helper anchor missing")
patcher.write_text(text.replace(old, new, 1), encoding="utf-8")
subprocess.run(["python3", str(patcher)], cwd=root, check=True)
subprocess.run(["git", "rm", "--", "scripts/run_legibility_pass_v1.py"], cwd=root, check=True)
