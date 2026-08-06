#!/usr/bin/env python3
from pathlib import Path

renderer_path = Path("src/components/spec/VisualTemplateRenderer.tsx")
renderer = renderer_path.read_text(encoding="utf-8")
old = 'const texts = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;'
new = '''const texts = content.cards.length > 0
    ? content.cards.flatMap((card) => card.lines.length > 0
      ? card.lines.map((line) => line.value)
      : [card.title])
    : content.texts;'''
if renderer.count(old) != 1:
    raise SystemExit(f"tailwind renderer insertion point changed: {renderer.count(old)}")
renderer_path.write_text(renderer.replace(old, new, 1), encoding="utf-8")

test_path = Path("scripts/test-visual-templates.ts")
tests = test_path.read_text(encoding="utf-8")
marker = 'assert.match(renderer, /TailwindHeadwind/);'
replacement = '''assert.match(renderer, /TailwindHeadwind/);
assert.match(
  renderer,
  /content\\.cards\\.flatMap\\(\\(card\\) => card\\.lines\\.length > 0/,
  "tailwind-headwind must render every visible card line rather than only the first line",
);'''
if tests.count(marker) != 1:
    raise SystemExit(f"visual template test insertion point changed: {tests.count(marker)}")
test_path.write_text(tests.replace(marker, replacement, 1), encoding="utf-8")

print("tailwind renderer fix applied")
