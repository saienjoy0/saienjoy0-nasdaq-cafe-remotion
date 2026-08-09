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
text = text.replace(old, new, 1)
old_timeline = '...content.numbers.map((item) => [item.key, [item]] as const),'
new_timeline = '...content.numbers.map((item) => [item.key, [item] as TimelineObject[]] as const),'
if old_timeline not in text:
    raise SystemExit("timeline mutability anchor missing")
text = text.replace(old_timeline, new_timeline, 1)
old_label = '{parts.time || `STEP ${index + 1}`}'
new_label = '{parts.time || item.label}'
if old_label not in text:
    raise SystemExit("timeline visible-label anchor missing")
text = text.replace(old_label, new_label, 1)
old_subtitle_patch = "text = text.replace('''      text: formatPage(page),\\n''', '''      text: normalizeSubtitleDisplayNumerals(formatPage(page)),\\n''', 1)"
new_subtitle_patch = "text = text.replace('''  const normalizedSpeech = normalizeSpeech(speechText);\\n''', '''  const normalizedSpeech = normalizeSubtitleDisplayNumerals(normalizeSpeech(speechText));\\n''', 1)"
if old_subtitle_patch not in text:
    raise SystemExit("subtitle pre-pagination normalization anchor missing")
text = text.replace(old_subtitle_patch, new_subtitle_patch, 1)
old_rm = 'subprocess.run(["git", "rm", "--", "scripts/apply_legibility_pass_v1.py"], cwd=ROOT, check=True)'
new_rm = 'subprocess.run(["git", "rm", "-f", "--", "scripts/apply_legibility_pass_v1.py"], cwd=ROOT, check=True)'
if old_rm not in text:
    raise SystemExit("legibility patcher cleanup anchor missing")
patcher.write_text(text.replace(old_rm, new_rm, 1), encoding="utf-8")
subprocess.run(["python3", str(patcher)], cwd=root, check=True)
subprocess.run(["git", "rm", "-f", "--", "scripts/run_legibility_pass_v1.py"], cwd=root, check=True)
