import assert from "node:assert/strict";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {getVisualComponentDescriptor} from "../src/spec/visual-component-registry";
import {sha256Json} from "../src/spec/visual-director-contract";
import {makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

await import("./test-visual-director");

const sourceReceipt = getVisualComponentDescriptor("source-receipt");
const newsMedia = getVisualComponentDescriptor("news-media");
assert.deepEqual(
  sourceReceipt.eligibilityRuleIds,
  ["source-bound"],
  "source-receipt is a cited reconstructed receipt and must not require a main-media placement",
);
assert.deepEqual(
  newsMedia.eligibilityRuleIds,
  ["source-bound", "single-main-media"],
  "news-media must remain bound to exactly one real main-media placement",
);

const authoredOnlySpec = makeCurrentVisualDirectorFixture();
const authoredOnlyBeat = authoredOnlySpec.scenes
  .flatMap((scene) => scene.visualBeats)
  .find((beat) => beat.visualTemplate === "expected-actual-gap-flow");
assert.ok(authoredOnlyBeat, "synthetic fixture requires an authored gap Beat");

const authoredOnlyCatalog = buildVisualCandidateCatalog({
  spec: authoredOnlySpec,
  sourceRenderSpecSha256: sha256Json(authoredOnlySpec),
  hints: {
    contractVersion: "1.1.0",
    episodeDate: authoredOnlySpec.episode.targetDate,
    beats: [{
      visualBeatId: authoredOnlyBeat.beatId,
      capabilities: ["gap"],
      templatePolicy: {mode: "authored-only"},
    }],
  },
});
const authoredOnlyCandidates = authoredOnlyCatalog.candidates.filter(
  (candidate) => candidate.visualBeatId === authoredOnlyBeat.beatId,
);
assert.equal(authoredOnlyCandidates.length, 1, "explicit authored-only compatibility must emit exactly one candidate");
assert.equal(authoredOnlyCandidates[0].visualTemplate, authoredOnlyBeat.visualTemplate);

console.log("visual architecture v1.5 acceptance tests passed");
