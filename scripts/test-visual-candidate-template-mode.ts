import assert from "node:assert/strict";
import {buildVisualCandidateCatalogVNext} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {getVisualComponentDescriptor} from "../src/spec/visual-component-registry";
import {cloneTestValue, makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const sourceReceiptDescriptor = getVisualComponentDescriptor("source-receipt");
assert.equal(
  sourceReceiptDescriptor.visualMode,
  "text-focus",
  "source-receipt is a card-based source receipt and must not inherit news-media's main-media requirement",
);
assert.ok(
  sourceReceiptDescriptor.supportedScreenStates.includes("Data"),
  "source-receipt must remain legal on the Data screen without an invented main-media placement",
);

const spec = cloneTestValue(makeCurrentVisualDirectorFixture());
const scene = spec.scenes[0];
const beat = scene.visualBeats[0];
const descriptor = getVisualComponentDescriptor("text-focus");

const pick = <T,>(items: T[], min: number, max: number, idOf: (value: T) => string) => {
  const selected = items.slice(0, max).map(idOf);
  assert.ok(selected.length >= min, `fixture cannot satisfy text-focus inventory min=${min}`);
  return selected;
};

beat.visualTemplate = "text-focus";
beat.templateVariant = descriptor.defaultVariant;
// This deliberately simulates a producer/scene-level mode that drifted before
// Candidate generation. Candidate legality must come from the selected Template's
// Registry descriptor, not from this stale authored mode.
beat.visualMode = "expected-actual-gap";
beat.visualGrammarId = descriptor.allowedGrammarIds[0];
beat.screenState = descriptor.supportedScreenStates[0];
beat.viewerTexts = beat.viewerTexts.length > 0 ? beat.viewerTexts : ["境界を確認"];
beat.objectIds = [
  ...pick(scene.cards, descriptor.inventory.cards.min, descriptor.inventory.cards.max, (item) => item.cardId),
  ...pick(scene.numbers, descriptor.inventory.numbers.min, descriptor.inventory.numbers.max, (item) => item.numberId),
  ...pick(scene.nodes, descriptor.inventory.nodes.min, descriptor.inventory.nodes.max, (item) => item.nodeId),
  ...pick(scene.arrows, descriptor.inventory.arrows.min, descriptor.inventory.arrows.max, (item) => item.arrowId),
];
beat.assetPlacementIds = [];
beat.assetState = "not-required";
beat.templateConfig = {
  variant: descriptor.defaultVariant,
  comparisonBasis: null,
  dataBasis: "synthetic stale-mode regression",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
};

const isolated = cloneTestValue(spec);
isolated.scenes = [cloneTestValue(scene)];
isolated.scenes[0].visualBeats = [cloneTestValue(beat)];

const catalog = buildVisualCandidateCatalogVNext({
  spec: isolated,
  sourceRenderSpecSha256: sha256Json(isolated),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: isolated.episode.targetDate,
    beats: [{visualBeatId: beat.beatId, capabilities: ["text-only"]}],
  },
});
const candidate = catalog.candidates.find((item) => item.visualTemplate === "text-focus");
assert.ok(candidate, "vNext must retain a legal text-focus candidate");
assert.equal(
  candidate.visualMode,
  "text-focus",
  "Candidate visualMode must be derived from the candidate Template Registry, never stale producer mode",
);

console.log("visual candidate template-mode authority test passed");
