import assert from "node:assert/strict";
import {createSubtitleCues, getSubtitleTextAtTime} from "../src/spec/subtitle-cues";
import {assertNarrationChunkSubtitleLayoutFits, assertSubtitleCueTextFits} from "../src/spec/validate-render-layout";

const speech = "昨夜のNasdaq Compositeは一・〇〇パーセント上昇しました。主役は、十五パーセントを超えて急騰したAmazonです。ただし、半導体のETFは終値でほぼ横ばい。Appleは大幅安でした。全部のテック株が同じ理由で上がった夜ではありません。";
const shortSummary = "NASDAQ +1.00%";
const cues = createSubtitleCues(speech, 0, 19_219);

assert.ok(cues.length >= 3, "long narration must be split into readable subtitle pages");
assert.equal(cues[0].startMs, 0, "first subtitle starts with the chunk audio");
assert.equal(cues.at(-1)?.endMs, 19_219, "last subtitle ends with the chunk audio");
assert.equal(
  cues.map((cue) => cue.text.replace(/\n/gu, "")).join(""),
  speech,
  "subtitle pages must preserve the complete narration text",
);
assert.ok(cues.every((cue) => cue.text.split("\n").length <= 2), "subtitle pages must use at most two lines");
assert.ok(cues.every((cue) => cue.text.split("\n").every((line) => Array.from(line).length <= 22)), "each subtitle line must fit the public safe area");
assert.ok(cues.every((cue, index) => index === 0 || cue.startMs === cues[index - 1].endMs), "subtitle cues must be contiguous");
assert.ok(cues.every((cue) => cue.endMs > cue.startMs), "every subtitle cue must have positive duration");
assert.notEqual(cues[0].text, shortSummary, "summary telop must never be used as narration subtitle");
assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, -1), null, "subtitle is hidden before audio starts");
assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, 19_219), null, "subtitle is hidden after audio ends");
assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, cues[1].startMs), cues[1].text, "subtitle changes exactly at its cue boundary");

const scene8Regression = "僕たちが次に見るのは三点です。第一に、AMDがSpaceX級の大型導入を新たに取れるか。第二に、粗利率が五十六パーセントから上向き、N3やCoWoSの供給制約が緩むか。第三に、半導体の上昇がNVIDIA一社からSOXX全体へ広がるかです。";
const scene8RegressionCues = createSubtitleCues(scene8Regression, 0, 18_211);
assert.ok(
  scene8RegressionCues.every((cue) => cue.text.split("\n").every((line) => Array.from(line).length <= 22)),
  "punctuation-aware wrapping must never leave a subtitle tail wider than 22 characters",
);
assert.equal(
  scene8RegressionCues.map((cue) => cue.text.replace(/\n/gu, "")).join(""),
  scene8Regression,
  "Scene 8 regression wrapping must preserve every narration character",
);

const unpunctuated = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const hardSplitCues = createSubtitleCues(unpunctuated, 500, 6_500);
assert.equal(hardSplitCues[0].startMs, 500);
assert.equal(hardSplitCues.at(-1)?.endMs, 6_500);
assert.ok(hardSplitCues.every((cue) => cue.text.split("\n").length <= 2));

const layoutCues = assertNarrationChunkSubtitleLayoutFits({
  speechText: speech,
  startMs: 0,
  endMs: 19_219,
  caption: {text: "あ".repeat(156)},
}, "$.scenes[0].narrationChunks[0]");
assert.deepEqual(layoutCues, cues, "validator and renderer must use the same subtitle cues");
assert.equal(
  layoutCues.map((cue) => cue.text.replace(/\n/gu, "")).join(""),
  speech,
  "layout-only paging must preserve every narration character",
);
assert.throws(
  () => assertSubtitleCueTextFits("あ".repeat(23), "$.too-wide"),
  /23 characters exceed subtitle limit 22/u,
);
assert.throws(
  () => assertSubtitleCueTextFits("一行目\n二行目\n三行目", "$.too-tall"),
  /subtitle exceeds 2 lines/u,
);

console.log(`subtitle contract tests: ${cues.length + hardSplitCues.length} cues passed`);
