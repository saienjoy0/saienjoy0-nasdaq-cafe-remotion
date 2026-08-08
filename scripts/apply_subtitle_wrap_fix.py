#!/usr/bin/env python3
from pathlib import Path

subtitle_path = Path("src/spec/subtitle-cues.ts")
source = subtitle_path.read_text(encoding="utf-8")
old = '''const findLineBreak = (characters: string[]) => {
  const minimum = Math.max(10, Math.ceil(characters.length / 2) - 4);
  const maximum = Math.min(MAX_LINE_CHARS, characters.length - 1);
  for (let index = maximum; index >= minimum; index--) {
    if (/[、，,。！？!?]/u.test(characters[index - 1] ?? "")) return index;
  }
  return Math.min(MAX_LINE_CHARS, Math.ceil(characters.length / 2));
};'''
new = '''const findLineBreak = (characters: string[]) => {
  // A subtitle page can contain up to two 22-character lines. Prefer a
  // punctuation boundary only when BOTH resulting lines fit the public safe
  // area; otherwise a punctuation-first split can leave a 23+ character tail.
  const minimum = Math.max(1, characters.length - MAX_LINE_CHARS);
  const maximum = Math.min(MAX_LINE_CHARS, characters.length - 1);
  for (let index = maximum; index >= minimum; index--) {
    if (/[、，,。！？!?]/u.test(characters[index - 1] ?? "")) return index;
  }
  return Math.min(maximum, Math.max(minimum, Math.ceil(characters.length / 2)));
};'''
if source.count(old) != 1:
    raise SystemExit(f"subtitle findLineBreak insertion point changed: {source.count(old)}")
subtitle_path.write_text(source.replace(old, new, 1), encoding="utf-8")

test_path = Path("scripts/test-subtitles.ts")
tests = test_path.read_text(encoding="utf-8")
marker = '''assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, cues[1].startMs), cues[1].text, "subtitle changes exactly at its cue boundary");
'''
addition = '''assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, cues[1].startMs), cues[1].text, "subtitle changes exactly at its cue boundary");

const scene8Regression = "僕たちが次に見るのは三点です。第一に、AMDがSpaceX級の大型導入を新たに取れるか。第二に、粗利率が五十六パーセントから上向き、N3やCoWoSの供給制約が緩むか。第三に、半導体の上昇がNVIDIA一社からSOXX全体へ広がるかです。";
const scene8RegressionCues = createSubtitleCues(scene8Regression, 0, 18_211);
assert.ok(
  scene8RegressionCues.every((cue) => cue.text.split("\\n").every((line) => Array.from(line).length <= 22)),
  "punctuation-aware wrapping must never leave a subtitle tail wider than 22 characters",
);
assert.equal(
  scene8RegressionCues.map((cue) => cue.text.replace(/\\n/gu, "")).join(""),
  scene8Regression,
  "Scene 8 regression wrapping must preserve every narration character",
);
'''
if tests.count(marker) != 1:
    raise SystemExit(f"subtitle test insertion point changed: {tests.count(marker)}")
test_path.write_text(tests.replace(marker, addition, 1), encoding="utf-8")

print("subtitle safe-wrap fix applied")
