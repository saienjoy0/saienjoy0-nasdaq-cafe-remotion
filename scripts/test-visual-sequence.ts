import assert from "node:assert/strict";
import {toPublicSceneViewModel} from "../src/spec/public-view-model";
import type {ProductionScene} from "../src/spec/render-spec";
import {getSceneRenderState} from "../src/spec/render-state";

const timedScene = {
  sceneNumber: 1,
  initialExpression: "通常",
  narrationChunks: [{
    chunkId: "scene-01-chunk-001",
    startMs: 0,
    endMs: 2_000,
    pauseAfterMs: 0,
    caption: {text: "test"},
    expression: "通常",
  }],
  visualBeats: [{startMs: 0, endMs: 2_000}],
  visualEvents: [
    {atChunkId: "scene-01-chunk-001", timing: "chunk-start", action: "show", targetId: "object-b", offsetMs: 500, expression: null, motionPreset: "rise-soft", durationMs: 560, easingPreset: "smooth-out"},
    {atChunkId: "scene-01-chunk-001", timing: "chunk-start", action: "highlight", targetId: "object-b", offsetMs: 900, expression: null, motionPreset: "focus-ring", durationMs: 420, easingPreset: "smooth-out"},
    {atChunkId: "scene-01-chunk-001", timing: "chunk-start", action: "hide", targetId: "object-b", offsetMs: 1_500, expression: null, motionPreset: "fade-out", durationMs: 300, easingPreset: "smooth-out"},
  ],
  cards: [{cardId: "object-a"}, {cardId: "object-b"}],
  numbers: [],
  nodes: [],
  arrows: [],
  assetPlacements: [],
  durationMs: 2_000,
  durationInFrames: 60,
  transition: {type: "none", durationMs: 0},
} as unknown as ProductionScene;

assert.equal(getSceneRenderState(timedScene, 400).visible.has("object-b"), false);
const shown = getSceneRenderState(timedScene, 700);
assert.equal(shown.visible.has("object-b"), true);
assert.equal(shown.visibleSinceMs.get("object-b"), 500);
assert.equal(shown.showMotionByTarget.get("object-b")?.preset, "rise-soft");
assert.equal(shown.showMotionByTarget.get("object-b")?.durationMs, 560);
const highlighted = getSceneRenderState(timedScene, 1_000);
assert.equal(highlighted.highlighted.has("object-b"), true);
assert.equal(highlighted.highlightedSinceMs.get("object-b"), 900);
assert.equal(highlighted.highlightMotionByTarget.get("object-b")?.preset, "focus-ring");
const exiting = getSceneRenderState(timedScene, 1_600);
assert.equal(exiting.visible.has("object-b"), true);
assert.equal(exiting.hideMotionByTarget.get("object-b")?.preset, "fade-out");
const hidden = getSceneRenderState(timedScene, 1_850);
assert.equal(hidden.visible.has("object-b"), false);
assert.equal(hidden.highlighted.has("object-b"), false);
assert.equal(hidden.hideMotionByTarget.has("object-b"), false);

const orderedScene = {
  sceneNumber: 1,
  initialExpression: "通常",
  headline: "Test",
  supportingTexts: [],
  sourceLabel: "",
  uncertainty: null,
  narrationChunks: [{
    chunkId: "scene-01-chunk-001",
    startMs: 0,
    endMs: 10_000,
    pauseAfterMs: 0,
    caption: {text: "test"},
    expression: "通常",
  }],
  visualBeats: [{
    beatId: "scene-01-beat-001",
    startMs: 1_000,
    endMs: 10_000,
    screenState: "Data",
    visualMode: "number-comparison",
    visualTemplate: "metric-comparison-board",
    templateConfig: {variant: "default", comparisonBasis: null, dataBasis: "test", nodeOrder: [], laneLabels: [], outcomeNodeId: null},
    sequencePolicy: "object-order-fallback",
    finalHoldMs: 500,
    primaryFunction: "Compare",
    screenQuestion: "test",
    primaryElement: "test",
    objectIds: ["number-b", "number-a"],
    assetPlacementIds: [],
    viewerTexts: [],
    entity: null,
  }],
  visualEvents: [],
  cards: [],
  numbers: [
    {numberId: "number-a", label: "A", value: "1", numericValue: 1, precision: 0, unit: "%", comparison: null, tone: "neutral"},
    {numberId: "number-b", label: "B", value: "2", numericValue: 2, precision: 0, unit: "%", comparison: null, tone: "positive"},
  ],
  nodes: [],
  arrows: [],
  assetPlacements: [
    {placementId: "background", assetId: "mainBackground", role: "background", region: "full-canvas", fit: "cover", focalPoint: null, opacity: 1, startChunkId: null, endChunkId: null},
    {placementId: "fox", assetId: "foxNormal", role: "fox-expression", region: "fox-left", fit: "contain", focalPoint: null, opacity: 1, startChunkId: null, endChunkId: null},
  ],
  durationMs: 10_000,
  durationInFrames: 300,
  transition: {type: "none", durationMs: 0},
} as unknown as ProductionScene;

const orderState = getSceneRenderState(orderedScene, 2_000);
const view = toPublicSceneViewModel(orderedScene, orderState, {
  mainBackground: "background.png",
  foxNormal: "fox.png",
});
assert.ok(view.mainContent);
assert.equal(view.mainContent.sequencePolicy, "object-order-fallback");
assert.equal(view.mainContent.finalHoldMs, 500);
assert.deepEqual(view.mainContent.numbers.map((number) => number.key), ["number-b", "number-a"]);
assert.ok(view.mainContent.numbers[0].revealAtMs < view.mainContent.numbers[1].revealAtMs);
assert.deepEqual(view.mainContent.numbers.map((number) => number.numericValue), [2, 1]);

console.log("PASS: render_spec controls reveal order, motion timing, highlight timing, and animated exit retention");
