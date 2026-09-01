import assert from "node:assert/strict";
import {splitComparisonCardItems} from "../src/components/spec/AdditionalVisualTemplates";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const makeCardBackedComparison = () => {
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
  return {spec, scene, beat, card};
};

const catalogFor = (spec: ReturnType<typeof makeCurrentVisualDirectorFixture>, beatId: string) =>
  buildVisualCandidateCatalog({
    spec,
    sourceRenderSpecSha256: sha256Json(spec),
    hints: {
      contractVersion: "1.0.0",
      episodeDate: spec.episode.targetDate,
      beats: [{visualBeatId: beatId, capabilities: ["comparison-set"]}],
    },
  });

const {spec, beat, card} = makeCardBackedComparison();
const catalog = catalogFor(spec, beat.beatId);
const candidate = catalog.candidates.find((item) =>
  item.visualBeatId === beat.beatId &&
  item.visualTemplate === "split-comparison" &&
  item.capability === "comparison-set",
);
assert.ok(candidate, "card-backed two-item comparison must produce a legal split-comparison candidate");
assert.deepEqual(candidate.objectIds, [card.cardId], "candidate must preserve authored card identity");

const publicItems = splitComparisonCardItems({
  cards: [{
    key: card.cardId,
    revealAtMs: 0,
    lines: card.lines,
  } as Parameters<typeof splitComparisonCardItems>[0]["cards"][number]],
});
assert.deepEqual(
  publicItems.map((item) => item.value),
  ["数字：予想超え", "株価：引け後から5%超下落"],
  "renderer must preserve authored card text instead of inventing numeric values",
);

const oneItem = makeCardBackedComparison();
oneItem.card.lines = oneItem.card.lines.slice(0, 1);
assert.throws(
  () => catalogFor(oneItem.spec, oneItem.beat.beatId),
  /Candidate Builder produced no legal candidate/,
  "one-item card comparison must remain fail-closed",
);

const threeItems = makeCardBackedComparison();
threeItems.card.lines.push({label: "third", value: "追加の別論点", tone: "neutral"});
assert.throws(
  () => catalogFor(threeItems.spec, threeItems.beat.beatId),
  /Candidate Builder produced no legal candidate/,
  "three-item card comparison must remain fail-closed",
);

const mixed = makeCardBackedComparison();
const sourceNumber = cloneTestValue(mixed.scene.numbers[0]);
assert.ok(sourceNumber, "fixture requires a number for mixed-form rejection");
sourceNumber.numberId = "mixed-comparison-number";
sourceNumber.numericValue = 5;
sourceNumber.value = "5";
sourceNumber.unit = "%";
sourceNumber.comparison = "mixed basis";
mixed.scene.numbers.push(sourceNumber);
mixed.beat.objectIds.push(sourceNumber.numberId);
assert.throws(
  () => catalogFor(mixed.spec, mixed.beat.beatId),
  /Candidate Builder produced no legal candidate/,
  "mixed numeric and card comparison must remain fail-closed",
);

console.log("card-backed split comparison candidate tests passed");
