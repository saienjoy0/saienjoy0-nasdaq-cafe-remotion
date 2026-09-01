import assert from "node:assert/strict";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const spec = cloneTestValue(makeCurrentVisualDirectorFixture());
const scene = spec.scenes[0];
const beat = scene.visualBeats[0];
const card = scene.cards[0];
assert.ok(card, "fixture requires one card for card-backed comparison test");

card.title = "good news vs selloff";
card.lines = [
  {label: "left", value: "数字：予想超え", tone: "positive"},
  {label: "right", value: "株価：引け後から5%超下落", tone: "negative"},
];
beat.visualTemplate = "split-comparison";
beat.visualGrammarId = "comparison";
beat.visualMode = "stock-comparison";
beat.screenState = "Data";
beat.templateVariant = "two-lane";
beat.templateConfig = {
  variant: "two-lane",
  comparisonBasis: null,
  dataBasis: "reported result vs market reaction",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
};
beat.objectIds = [card.cardId];
beat.assetPlacementIds = [];
beat.assetState = "not-required";
scene.visualMode = "stock-comparison";

const catalog = buildVisualCandidateCatalog({
  spec,
  sourceRenderSpecSha256: sha256Json(spec),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: spec.episode.targetDate,
    beats: [{visualBeatId: beat.beatId, capabilities: ["comparison-set"]}],
  },
});

const candidate = catalog.candidates.find((item) =>
  item.visualBeatId === beat.beatId &&
  item.visualTemplate === "split-comparison" &&
  item.capability === "comparison-set",
);
assert.ok(candidate, "card-backed two-item comparison must produce a legal split-comparison candidate");
assert.deepEqual(candidate.objectIds, [card.cardId], "candidate must preserve authored card identity");

console.log("card-backed split comparison candidate test passed");
