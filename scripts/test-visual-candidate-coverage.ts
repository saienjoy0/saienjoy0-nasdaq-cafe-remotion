import assert from "node:assert/strict";
import {
  analyzeVisualCandidateCatalogVNext,
} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const spec = cloneTestValue(makeCurrentVisualDirectorFixture());
const entries = spec.scenes.flatMap((scene) =>
  scene.visualBeats.map((beat) => ({scene, beat})),
);
const targets = entries
  .filter(({scene, beat}) =>
    beat.financialVisualTrace === undefined &&
    beat.entity == null &&
    beat.pictureBook == null &&
    scene.cards.length > 0,
  )
  .slice(0, 2);
assert.equal(targets.length, 2, "fixture must provide two non-financial card Beats");

for (const {scene, beat} of targets) {
  const card = scene.cards[0];
  beat.visualGrammarId = "evidence";
  beat.visualTemplate = "source-receipt";
  beat.templateVariant = "receipt";
  beat.visualMode = "news-media";
  beat.screenState = "Data";
  beat.templateConfig = {
    variant: "receipt",
    comparisonBasis: null,
    dataBasis: "coverage regression without legal source evidence",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
  };
  beat.objectIds = [card.cardId];
  beat.assetPlacementIds = [];
  beat.assetState = "not-required";
  beat.evidenceSourceIds = [];
}

const targetIds = targets.map(({beat}) => beat.beatId);
const result = analyzeVisualCandidateCatalogVNext({
  spec,
  sourceRenderSpecSha256: sha256Json(spec),
  hints: {
    contractVersion: "1.1.0",
    episodeDate: spec.episode.targetDate,
    beats: targets.map(({beat}) => ({
      visualBeatId: beat.beatId,
      capabilities: ["source-document"],
      templatePolicy: {
        mode: "allow-list",
        allowedTemplateIds: ["source-receipt"],
      },
    })),
  },
});

assert.equal(result.coverage.status, "UNAVAILABLE");
assert.equal(result.coverage.unavailableBeatCount, 2);
assert.deepEqual(result.coverage.unavailableBeats, targetIds);
assert.equal(result.catalog, null, "partial Candidate Catalog must never be production-ready");
for (const beatId of targetIds) {
  const row = result.coverage.beats.find((item) => item.visualBeatId === beatId);
  assert.ok(row, `coverage row missing for ${beatId}`);
  assert.equal(row.legalCandidateCount, 0);
  assert.equal(row.failureCode, "E_VISUAL_CANDIDATE_NONE");
}

console.log("visual candidate multi-Beat coverage regression PASS");
