#!/usr/bin/env python3
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"{label}: expected exactly one insertion point, found {text.count(old)}")
    return text.replace(old, new, 1)


layout_path = Path("src/spec/validate-render-layout.ts")
layout = layout_path.read_text(encoding="utf-8")
layout = replace_once(
    layout,
    'import type {RenderProductionData} from "./render-spec";',
    'import type {RenderProductionData} from "./render-spec";\nimport {createSubtitleCues} from "./subtitle-cues";',
    "subtitle cue import",
)
layout = replace_once(
    layout,
    'captionText: {perLine: 34, lines: 3},',
    'captionText: {perLine: 22, lines: 2},',
    "rendered subtitle limits",
)
helper_marker = "const assertCausalShape = (\n"
helper = '''export type SubtitleLayoutChunk = {
  speechText: string;
  startMs: number;
  endMs: number;
  caption: {text: string};
};

export const assertSubtitleCueTextFits = (value: string, path = "$.subtitle") =>
  assertWrapped(value, limits.captionText.perLine, limits.captionText.lines, path, "subtitle");

export const assertNarrationChunkSubtitleLayoutFits = (
  chunk: SubtitleLayoutChunk,
  path: string,
) => {
  // The public subtitle layer renders time-sliced speechText cues. caption.text
  // remains production metadata and must not be treated as one visible page.
  const cues = createSubtitleCues(chunk.speechText, chunk.startMs, chunk.endMs);
  cues.forEach((cue, cueIndex) =>
    assertSubtitleCueTextFits(cue.text, `${path}.subtitleCues[${cueIndex}].text`),
  );
  return cues;
};

'''
layout = replace_once(layout, helper_marker, helper + helper_marker, "subtitle layout helper")
layout = replace_once(
    layout,
    'scene.narrationChunks.forEach((chunk, index) => assertWrapped(chunk.caption.text, limits.captionText.perLine, limits.captionText.lines, `${base}.narrationChunks[${index}].caption.text`, "caption"));',
    'scene.narrationChunks.forEach((chunk, index) => assertNarrationChunkSubtitleLayoutFits(chunk, `${base}.narrationChunks[${index}]`));',
    "narration layout validation",
)
layout_path.write_text(layout, encoding="utf-8")

subtitle_test_path = Path("scripts/test-subtitles.ts")
subtitle_tests = subtitle_test_path.read_text(encoding="utf-8")
import_line = 'import {createSubtitleCues, getSubtitleTextAtTime} from "../src/spec/subtitle-cues";'
subtitle_tests = replace_once(
    subtitle_tests,
    import_line,
    import_line + '\nimport {assertNarrationChunkSubtitleLayoutFits, assertSubtitleCueTextFits} from "../src/spec/validate-render-layout";',
    "subtitle test import",
)
footer = 'console.log(`subtitle contract tests: ${cues.length + hardSplitCues.length} cues passed`);'
regression = '''const layoutCues = assertNarrationChunkSubtitleLayoutFits({
  speechText: speech,
  startMs: 0,
  endMs: 19_219,
  caption: {text: "あ".repeat(156)},
}, "$.scenes[0].narrationChunks[0]");
assert.deepEqual(layoutCues, cues, "validator and renderer must use the same subtitle cues");
assert.equal(
  layoutCues.map((cue) => cue.text.replace(/\\n/gu, "")).join(""),
  speech,
  "layout-only paging must preserve every narration character",
);
assert.throws(
  () => assertSubtitleCueTextFits("あ".repeat(23), "$.too-wide"),
  /23 characters exceed subtitle limit 22/u,
);
assert.throws(
  () => assertSubtitleCueTextFits("一行目\\n二行目\\n三行目", "$.too-tall"),
  /subtitle exceeds 2 lines/u,
);

''' + footer
subtitle_tests = replace_once(subtitle_tests, footer, regression, "subtitle regression footer")
subtitle_test_path.write_text(subtitle_tests, encoding="utf-8")

print("subtitle layout fix applied")
