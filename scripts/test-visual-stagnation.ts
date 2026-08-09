import assert from "node:assert/strict";
import type {RenderSpec} from "../src/spec/render-spec";
import {evaluateVisualGrammarTiming, type MeasuredVisualGrammarBeat} from "../src/spec/measure-visual-grammar";
import {addVisualStagnationWarnings, VISUAL_STAGNATION_WARNING_MS} from "../src/spec/visual-stagnation";

const makeSpec = (assetForSecondBeat = "daily-proof") => ({
  scenes: [
    {
      sceneId: "scene-01",
      visualBeats: [
        {
          beatId: "vb-01-01",
          visualTemplate: "news-media",
          screenState: "News",
          assetPlacementIds: ["placement-1"],
          transitionRole: "continuation",
        },
        {
          beatId: "vb-01-02",
          visualTemplate: "news-media",
          screenState: "News",
          assetPlacementIds: ["placement-2"],
          transitionRole: "continuation",
        },
      ],
      assetPlacements: [
        {
          placementId: "placement-1",
          assetId: "daily-proof",
          role: "main-media",
          region: "main-stage",
        },
        {
          placementId: "placement-2",
          assetId: assetForSecondBeat,
          role: "main-media",
          region: "main-stage",
        },
      ],
    },
  ],
}) as unknown as RenderSpec;

const beats: MeasuredVisualGrammarBeat[] = [
  {
    sceneId: "scene-01",
    sceneNumber: 1,
    beatId: "vb-01-01",
    startMs: 0,
    endMs: 4500,
    durationMs: 4500,
    visualGrammarId: "evidence",
    transitionRole: "continuation",
    appearanceClass: "document-media",
    dominantSurface: "media",
    stageShell: "DocumentMediaStage",
    selectedPath: "not-applicable",
  },
  {
    sceneId: "scene-01",
    sceneNumber: 1,
    beatId: "vb-01-02",
    startMs: 4500,
    endMs: 9000,
    durationMs: 4500,
    visualGrammarId: "evidence",
    transitionRole: "continuation",
    appearanceClass: "document-media",
    dominantSurface: "media",
    stageShell: "DocumentMediaStage",
    selectedPath: "not-applicable",
  },
];

const baseReport = evaluateVisualGrammarTiming({
  episodeId: "2026-08-06",
  durationMode: "shortened",
  inputRenderSpecSha256: "a".repeat(64),
  semanticsSha256: "b".repeat(64),
  rendererCompatibilitySha256: "c".repeat(64),
  finalEpisodeContractSha256: "d".repeat(64),
  beats,
});

const warned = addVisualStagnationWarnings(makeSpec(), baseReport);
assert.equal(warned.visualStagnation.thresholdMs, VISUAL_STAGNATION_WARNING_MS);
assert.equal(warned.visualStagnation.status, "warning");
assert.equal(warned.visualStagnation.warningCount, 1);
const stagnation = warned.warnings.find((warning) => warning.code === "W_VISUAL_STAGNATION");
assert(stagnation && "durationMs" in stagnation);
assert.equal(stagnation.durationMs, 9000);
assert.deepEqual(stagnation.beatIds, ["vb-01-01", "vb-01-02"]);

const changedAsset = addVisualStagnationWarnings(makeSpec("daily-proof-2"), baseReport);
assert.equal(changedAsset.visualStagnation.status, "clear");
assert.equal(changedAsset.visualStagnation.warningCount, 0);
assert.equal(changedAsset.visualStagnation.longestRunMs, 4500);

console.log("PASS: eight-second visual stagnation warning uses actual presentation signature and remains warning-only");
