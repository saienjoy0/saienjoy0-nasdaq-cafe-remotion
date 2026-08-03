import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {getTimedNarrationCaption, paginateNarrationCaption} from "../src/spec/render-state";

const narration = "昨夜のNASDAQは1.00％上昇しました。ところがAmazonは大幅高、Appleは大幅安でした。同じ大型テックでも反応が分かれた理由を確認します。";
const pages = paginateNarrationCaption(narration);
assert.ok(pages.length >= 2, "long narration should be split into readable subtitle pages");
assert.ok(pages.every((page) => page.replace("\n", "").length <= 58), "subtitle pages must stay within the fixed text budget");
assert.equal(getTimedNarrationCaption(narration, 0, 10_000), pages[0]);
assert.equal(getTimedNarrationCaption(narration, 9_999, 10_000), pages.at(-1));
assert.equal(getTimedNarrationCaption("短い字幕です。", 0, 1_000), "短い字幕です。");

const project = process.cwd();
const [episodeSource, visualModesSource, assetLayerSource, renderStateSource] = await Promise.all([
  readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecVisualModes.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecAssetLayer.tsx"), "utf8"),
  readFile(path.join(project, "src/spec/render-state.ts"), "utf8"),
]);

assert.match(renderStateSource, /activeChunk\.speechText/);
assert.doesNotMatch(renderStateSource, /captionText:\s*activeChunkIndex < 0 \? null : scene\.narrationChunks\[activeChunkIndex\]\.caption\.text/);
assert.match(episodeSource, /transform: "scale\(1\.34\)"/);
assert.match(episodeSource, /fontSize: 42/);
assert.match(episodeSource, /from=\{scene\.startFrame\}/);
assert.doesNotMatch(episodeSource, /TransitionSeries/);
assert.match(visualModesSource, /responsiveGrid/);
assert.match(visualModesSource, /gridTemplateColumns: responsiveGrid\(content\.numbers\.length\)/);
assert.match(assetLayerSource, /width: 608/);
assert.match(assetLayerSource, /height: 584/);

console.log("PASS: subtitle paging and fixed presentation contracts");
