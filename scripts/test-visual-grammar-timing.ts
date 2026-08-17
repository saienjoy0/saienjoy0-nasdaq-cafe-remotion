import assert from "node:assert/strict";
import {
  evaluateVisualGrammarTiming,
  measureStaticState,
  type MeasuredVisualGrammarBeat,
} from "../src/spec/measure-visual-grammar";
import type {RenderProductionData} from "../src/spec/render-spec";
import type {
  AppearanceClass,
  DominantSurface,
  TransitionRole,
  VisualGrammarId,
} from "../src/spec/visual-grammar-contract";

const sha = (value: string) => value.repeat(64).slice(0, 64);

const beat = (
  index: number,
  grammar: VisualGrammarId,
  appearanceClass: AppearanceClass,
  dominantSurface: DominantSurface,
  durationMs = 7000,
  transitionRole: TransitionRole = index === 1 ? "major-shift" : "continuation",
  selectedPath: MeasuredVisualGrammarBeat["selectedPath"] = "not-applicable",
): MeasuredVisualGrammarBeat => ({
  sceneId: `scene-0${index}`,
  sceneNumber: index,
  beatId: `vb-0${index}-01`,
  startMs: 0,
  endMs: durationMs,
  durationMs,
  visualGrammarId: grammar,
  transitionRole,
  appearanceClass,
  dominantSurface,
  stageShell: `${appearanceClass}-stage`,
  selectedPath,
});

const validBeats = (): MeasuredVisualGrammarBeat[] => [
  beat(1, "contradiction", "open-hero", "open-canvas"),
  beat(2, "entity", "entity-canvas", "entity"),
  beat(3, "evidence", "document-media", "media", 7000, "major-shift", "fallback"),
  beat(4, "gap", "progressive-chart", "plot"),
  beat(5, "causal", "causal-path", "network"),
  beat(6, "reaction", "timeline-track", "plot"),
  beat(7, "comparison", "split-comparison", "split"),
  beat(8, "verification", "verification-gates", "matrix"),
];

const evaluate = (
  beats: MeasuredVisualGrammarBeat[],
  durationMode: "standard" | "shortened" = "standard",
) => evaluateVisualGrammarTiming({
  episodeId: "2026-08-06",
  durationMode,
  inputRenderSpecSha256: sha("a"),
  semanticsSha256: sha("b"),
  rendererCompatibilitySha256: sha("c"),
  finalEpisodeContractSha256: sha("d"),
  beats,
});

const warningCodes = (report: ReturnType<typeof evaluate>) =>
  new Set(report.warnings.map((warning) => warning.code));

const valid = evaluate(validBeats());
assert.equal(valid.contractVersion, "1.1.0");
assert.equal(valid.status, "PASS");
assert.equal(valid.timingBasis, "post-tts-production-data");
assert.equal(valid.fallbackDiversityRecheck, "completed");
assert.deepEqual(valid.selectedFallbackBeatIds, ["vb-03-01"]);
assert.equal(valid.unresolvedStateCount, 0);
assert.equal(valid.metrics.nonAnalysisDurationMs, 14000);
assert.equal(valid.staticState.mode, "report-only");
assert.equal(valid.staticState.failureCandidateCount, 0);
assert.deepEqual(valid.failures, []);
console.log("PASS: standard measured timing report passes with report-only quality findings");

const longRunBeats = validBeats();
for (let index = 0; index < 5; index += 1) {
  longRunBeats[index] = {
    ...longRunBeats[index],
    appearanceClass: "metric-board",
    dominantSurface: index % 2 === 0 ? "card-board" : "plot",
  };
}
const longRun = evaluate(longRunBeats);
assert.equal(longRun.status, "PASS");
assert.deepEqual(longRun.failures, []);
assert.ok(warningCodes(longRun).has("VG_SAME_APPEARANCE_RUN_TOO_LONG"));
console.log("PASS: same Appearance run over 28 seconds is advisory");

const surfaceHeavy = validBeats().map((item, index) => ({
  ...item,
  dominantSurface: index < 5 ? "plot" as const : item.dominantSurface,
}));
const surfaceReport = evaluate(surfaceHeavy);
assert.equal(surfaceReport.status, "PASS");
assert.deepEqual(surfaceReport.failures, []);
assert.ok(warningCodes(surfaceReport).has("VG_DOMINANT_SURFACE_OVERWEIGHT"));
console.log("PASS: Dominant Surface occupancy over 45 percent is advisory");

const cardHeavy = validBeats().map((item, index) => ({
  ...item,
  appearanceClass: index < 5 ? "metric-board" as const : item.appearanceClass,
  dominantSurface: index < 5 ? "card-board" as const : item.dominantSurface,
}));
const cardReport = evaluate(cardHeavy);
assert.equal(cardReport.status, "PASS");
assert.deepEqual(cardReport.failures, []);
assert.ok(warningCodes(cardReport).has("VG_CARD_BOARD_OVERWEIGHT"));
console.log("PASS: card-board occupancy over 55 percent is advisory");

const noNonAnalysis = validBeats().map((item) =>
  ["entity-canvas", "document-media", "picturebook-canvas"].includes(item.appearanceClass)
    ? {...item, appearanceClass: "metric-board" as const, dominantSurface: "card-board" as const}
    : item,
);
const noNonAnalysisReport = evaluate(noNonAnalysis);
assert.equal(noNonAnalysisReport.status, "PASS");
assert.deepEqual(noNonAnalysisReport.failures, []);
assert.ok(warningCodes(noNonAnalysisReport).has("VG_NON_ANALYSIS_DURATION_TOO_LOW"));
console.log("PASS: insufficient non-analysis duration is advisory");

const bridgeHeavy = validBeats();
bridgeHeavy[6] = {
  ...bridgeHeavy[6],
  visualGrammarId: "bridge-text",
  appearanceClass: "text-bridge",
  dominantSurface: "text",
};
const bridgeReport = evaluate(bridgeHeavy);
assert.equal(bridgeReport.status, "PASS");
assert.deepEqual(bridgeReport.failures, []);
assert.ok(warningCodes(bridgeReport).has("VG_BRIDGE_TEXT_OVERUSED"));
console.log("PASS: bridge-text over 12 percent is advisory");

const shortMajorShift = validBeats();
shortMajorShift[2] = {...shortMajorShift[2], durationMs: 3000, endMs: 3000};
const shortMajorShiftReport = evaluate(shortMajorShift);
assert.equal(shortMajorShiftReport.status, "PASS");
assert.deepEqual(shortMajorShiftReport.failures, []);
assert.ok(warningCodes(shortMajorShiftReport).has("VG_MAJOR_SHIFT_HOLD_TOO_SHORT"));
console.log("PASS: major shift Stage under four seconds is advisory");

const shortenedBeats = validBeats();
shortenedBeats[1] = {...shortenedBeats[1], durationMs: 4000, endMs: 4000};
shortenedBeats[2] = {...shortenedBeats[2], durationMs: 4000, endMs: 4000};
const shortened = evaluate(shortenedBeats, "shortened");
assert.equal(shortened.thresholds.nonAnalysisMinMs, 8000);
assert.equal(warningCodes(shortened).has("VG_NON_ANALYSIS_DURATION_TOO_LOW"), false);
console.log("PASS: shortened episode uses the eight-second non-analysis advisory threshold");

const beatRangeWarnings = valid.warnings.filter(
  (warning) => warning.code === "VG_NON_ANALYSIS_BEAT_OUTSIDE_RECOMMENDED_RANGE",
);
assert.ok(beatRangeWarnings.every(
  (warning) => warning.recommendedMinMs === 5000 && warning.recommendedMaxMs === 8000,
));
console.log("PASS: non-analysis five-to-eight-second guidance remains advisory");

const staticData = {
  scenes: [
    {
      sceneId: "scene-01",
      sceneNumber: 1,
      durationMs: 20_000,
      narrationChunks: [
        {
          chunkId: "scene-01-chunk-001",
          startMs: 0,
          endMs: 20_000,
          pauseAfterMs: 0,
        },
      ],
      visualBeats: [
        {
          beatId: "scene-01-beat-001",
          startMs: 0,
          endMs: 20_000,
          shots: [],
        },
      ],
      visualEvents: [
        {
          atChunkId: "scene-01-chunk-001",
          timing: "chunk-start",
          action: "show",
          targetId: "number-a",
          offsetMs: 0,
        },
        {
          atChunkId: "scene-01-chunk-001",
          timing: "chunk-start",
          action: "highlight",
          targetId: "number-a",
          offsetMs: 9_000,
        },
      ],
      assetPlacements: [],
    },
  ],
} as unknown as RenderProductionData;
const staticReport = measureStaticState(staticData);
assert.equal(staticReport.mode, "report-only");
assert.equal(staticReport.warningThresholdMs, 8000);
assert.equal(staticReport.failureCandidateThresholdMs, 16000);
assert.equal(staticReport.longestStaticStateMs, 11_000);
assert.equal(staticReport.warningCount, 2);
assert.equal(staticReport.failureCandidateCount, 0);
console.log("PASS: Static State uses mechanical event boundaries and does not hard-fail");

console.log("Visual Grammar measured timing tests: 10 passed");
