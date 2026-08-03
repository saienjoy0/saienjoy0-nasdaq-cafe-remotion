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
const [episodeSource, visualModesSource, assetLayerSource, renderStateSource, publicViewModelSource, episodeSpecSource] = await Promise.all([
  readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecVisualModes.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecAssetLayer.tsx"), "utf8"),
  readFile(path.join(project, "src/spec/render-state.ts"), "utf8"),
  readFile(path.join(project, "src/spec/public-view-model.ts"), "utf8"),
  readFile(path.join(project, "render-specs/2026-07-31/render_spec.json"), "utf8"),
]);

assert.match(renderStateSource, /activeChunk\.speechText/);
assert.doesNotMatch(renderStateSource, /captionText:\s*activeChunkIndex < 0 \? null : scene\.narrationChunks\[activeChunkIndex\]\.caption\.text/);
assert.match(episodeSource, /transform: "scale\(1\.34\)"/);
assert.match(episodeSource, /fontSize: 42/);
assert.match(episodeSource, /from=\{scene\.startFrame\}/);
assert.doesNotMatch(episodeSource, /TransitionSeries/);
assert.match(assetLayerSource, /width: 608/);
assert.match(assetLayerSource, /height: 584/);
assert.match(publicViewModelSource, /"prebuilt-card"/);
assert.match(publicViewModelSource, /placement\.role === "entity-card"/);
assert.match(publicViewModelSource, /beat\.screenState === "EntityFocus" \? "full"/);
assert.match(publicViewModelSource, /beatProgress/);
assert.match(episodeSource, /entityPresentation !== "prebuilt-card"/);
assert.match(episodeSource, /entityPresentation === "media"/);
assert.match(episodeSource, /rgba\(255,250,238,\.94\)/);

for (const component of [
  "OpeningContradiction",
  "ClosingRecap",
  "ExpectedActualBullet",
  "EvidenceMetricBoard",
  "ReturnBars",
  "EvidenceBoundary",
  "CausalLane",
  "VerificationMatrix",
  "AnalogySteps",
]) {
  assert.match(visualModesSource, new RegExp(`const ${component}`), `missing presentation component: ${component}`);
}
assert.doesNotMatch(visualModesSource, /Math\.cos|Math\.sin/, "causal diagrams must not use circular auto-layout");
assert.doesNotMatch(visualModesSource, /responsiveGrid/, "legacy card-grid chart renderer must stay removed");
assert.match(visualModesSource, /gridTemplateColumns: "260px 1fr 190px"/);
assert.match(visualModesSource, /確認できる/);
assert.match(visualModesSource, /断定しない/);
assert.match(visualModesSource, /下落/);
assert.match(visualModesSource, /上昇/);

const episodeSpec = JSON.parse(episodeSpecSource) as {
  scenes: Array<{
    sceneId: string;
    nodes: Array<{nodeId: string}>;
    arrows: Array<{arrowId: string; fromNodeId: string; toNodeId: string}>;
    visualBeats: Array<{visualMode: string; objectIds: string[]}>;
  }>;
};
for (const scene of episodeSpec.scenes) {
  for (const beat of scene.visualBeats.filter((item) => item.visualMode === "causal-diagram")) {
    const nodeIds = new Set(scene.nodes.filter((node) => beat.objectIds.includes(node.nodeId)).map((node) => node.nodeId));
    const arrows = scene.arrows.filter((arrow) => beat.objectIds.includes(arrow.arrowId) && nodeIds.has(arrow.fromNodeId) && nodeIds.has(arrow.toNodeId));
    assert.ok(nodeIds.size <= 4, `${scene.sceneId}: causal diagram exceeds four visible nodes`);
    assert.ok(arrows.length <= 3, `${scene.sceneId}: causal diagram exceeds three visible arrows`);
  }
}

console.log("PASS: subtitles, entity routing, and editorial presentation templates");
