#!/usr/bin/env python3
from pathlib import Path

path = Path(__file__).with_name("generate-financial-handoff-fixture.py")
text = path.read_text(encoding="utf-8")
old = '    beat["primaryFunction"] = "Show expected, actual, and gap"\n'
new = '    beat["primaryFunction"] = "Compare"\n'
if text.count(old) != 1:
    raise SystemExit("fixture primaryFunction anchor not found exactly once")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("corrected shared fixture primaryFunction")
