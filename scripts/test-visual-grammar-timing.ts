import assert from "node:assert/strict";
import {
  evaluateVisualGrammarTiming,
  type MeasuredVisualGrammarBeat,
} from "../src/spec/measure-visual-grammar";
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

const valid = evaluate(validBeats());
assert.equal(valid.status, "PASS");
assert.equal(valid.timingBasis, "post-tts-production-data");
assert.equal(valid.fallbackDiversityRecheck, "completed");
assert.deepEqual(valid.selectedFallbackBeatIds, ["vb-03-01"]);
assert.equal(valid.unresolvedStateCount, 0);
assert.equal(valid.metrics.nonAnalysisDurationMs, 14000);
console.log("PASS: standard measured timing report passes and includes fallback path");

const longRunBeats = validBeats();
for (let index = 0; index < 5; index += 1) {
  longRunBeats[index] = {
    ...longRunBeats[index],
    appearanceClass: "metric-board",
    dominantSurface: index % 2 === 0 ? "card-board" : "plot",
  };
}
const longRun = evaluate(longRunBeats);
assert.equal(longRun.status, "FAIL");
assert.ok(longRun.failures.some((failure) => failure.code === "VG_SAME_APPEARANCE_RUN_TOO_LONG"));
console.log("PASS: same Appearance run over 28 seconds is rejected");

const surfaceHeavy = validBeats().map((item, index) => ({
  ...item,
  dominantSurface: index < 5 ? "plot" as const : item.dominantSurface,
}));
const surfaceReport = evaluate(surfaceHeavy);
assert.ok(surfaceReport.failures.some((failure) => failure.code === "VG_DOMINANT_SURFACE_OVERWEIGHT"));
console.log("PASS: Dominant Surface occupancy over 45 percent is rejected");

const cardHeavy = validBeats().map((item, index) => ({
  ...item,
  appearanceClass: index < 5 ? "metric-board" as const : item.appearanceClass,
  dominantSurface: index < 5 ? "card-board" as const : item.dominantSurface,
}));
const cardReport = evaluate(cardHeavy);
assert.ok(cardReport.failures.some((failure) => failure.code === "VG_CARD_BOARD_OVERWEIGHT"));
console.log("PASS: card-board occupancy over 55 percent is rejected");

const noNonAnalysis = validBeats().map((item) =>
  ["entity-canvas", "document-media", "picturebook-canvas"].includes(item.appearanceClass)
    ? {...item, appearanceClass: "metric-board" as const, dominantSurface: "card-board" as const}
    : item,
);
const noNonAnalysisReport = evaluate(noNonAnalysis);
assert.ok(noNonAnalysisReport.failures.some((failure) => failure.code === "VG_NON_ANALYSIS_DURATION_TOO_LOW"));
console.log("PASS: insufficient non-analysis duration is rejected");

const bridgeHeavy = validBeats();
bridgeHeavy[6] = {
  ...bridgeHeavy[6],
  visualGrammarId: "bridge-text",
  appearanceClass: "text-bridge",
  dominantSurface: "text",
};
const bridgeReport = evaluate(bridgeHeavy);
assert.ok(bridgeReport.failures.some((failure) => failure.code === "VG_BRIDGE_TEXT_OVERUSED"));
console.log("PASS: bridge-text over 12 percent is rejected");

const shortMajorShift = validBeats();
shortMajorShift[2] = {...shortMajorShift[2], durationMs: 3000, endMs: 3000};
const shortMajorShiftReport = evaluate(shortMajorShift);
assert.ok(shortMajorShiftReport.failures.some((failure) => failure.code === "VG_MAJOR_SHIFT_HOLD_TOO_SHORT"));
console.log("PASS: major shift Stage under four seconds is rejected");

const shortenedBeats = validBeats();
shortenedBeats[1] = {...shortenedBeats[1], durationMs: 4000, endMs: 4000};
shortenedBeats[2] = {...shortenedBeats[2], durationMs: 4000, endMs: 4000};
const shortened = evaluate(shortenedBeats, "shortened");
assert.equal(shortened.thresholds.nonAnalysisMinMs, 8000);
assert.equal(shortened.failures.some((failure) => failure.code === "VG_NON_ANALYSIS_DURATION_TOO_LOW"), false);
console.log("PASS: shortened episode uses the eight-second non-analysis threshold");

assert.ok(valid.warnings.every((warning) => warning.recommendedMinMs === 5000 && warning.recommendedMaxMs === 8000));
console.log("PASS: non-analysis five-to-eight-second guidance remains advisory");

console.log("Visual Grammar measured timing tests: 9 passed");
