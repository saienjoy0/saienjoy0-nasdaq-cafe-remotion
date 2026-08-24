import assert from "node:assert/strict";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {cloneTestValue, makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const base = makeCurrentVisualDirectorFixture();

const makeTimeline = (variant: "reported-sequence" | "official-time-plus-close" | "close-only") => {
  const spec = cloneTestValue(base);
  const scene = spec.scenes[0];
  const beat = scene.visualBeats[0];
  const objectIds = beat.objectIds.length >= 2
    ? [...beat.objectIds]
    : [scene.cards[0].cardId, scene.cards[1]?.cardId ?? scene.cards[0].cardId];

  beat.visualTemplate = "event-reaction-timeline";
  beat.visualGrammarId = "reaction";
  beat.templateVariant = variant;
  beat.visualMode = "timeline";
  beat.screenState = "Data";
  beat.objectIds = objectIds;
  beat.templateConfig = {
    variant,
    comparisonBasis: "official event sequence",
    dataBasis: "official timestamps and close data",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    reactionTimeline: {
      precision: variant,
      eventOrderIds: objectIds,
      seriesObjectIds: [],
    },
  };

  return {spec, beat};
};

for (const variant of ["reported-sequence", "official-time-plus-close", "close-only"] as const) {
  const {spec, beat} = makeTimeline(variant);
  const catalog = buildVisualCandidateCatalog({
    spec,
    sourceRenderSpecSha256: sha256Json(spec),
  });
  assert.ok(
    catalog.candidates.some((candidate) =>
      candidate.visualBeatId === beat.beatId
      && candidate.visualTemplate === "event-reaction-timeline"
      && candidate.templateVariant === variant
      && candidate.capability === "time-series"),
    `${variant} must remain a legal event-reaction-timeline candidate without intraday series`,
  );
}

const verified = cloneTestValue(base);
const verifiedScene = verified.scenes[0];
const verifiedBeat = verifiedScene.visualBeats[0];
verifiedBeat.visualTemplate = "event-reaction-timeline";
verifiedBeat.visualGrammarId = "reaction";
verifiedBeat.templateVariant = "verified-series";
verifiedBeat.visualMode = "timeline";
verifiedBeat.screenState = "Chart";
verifiedBeat.templateConfig = {
  variant: "verified-series",
  comparisonBasis: "verified market series",
  dataBasis: "verified intraday series",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
  reactionTimeline: {
    precision: "verified-intraday-series",
    eventOrderIds: [...verifiedBeat.objectIds],
    seriesObjectIds: [],
  },
};
assert.throws(
  () => buildVisualCandidateCatalog({spec: verified, sourceRenderSpecSha256: sha256Json(verified)}),
  /Candidate Builder produced no legal candidate/,
  "verified-series must still fail closed without verified intraday series evidence",
);

console.log("reaction timeline candidate eligibility tests passed");
