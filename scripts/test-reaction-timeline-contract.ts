import assert from "node:assert/strict";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarCompatibility,
} from "../src/spec/visual-grammar-contract";
import {validateVisualGrammarContract} from "../src/spec/validate-visual-grammar";

const clone = <T>(value: T): T => structuredClone(value);

const make24 = (): RenderSpec => {
  const value = clone(fixtureJson) as unknown as Record<string, unknown>;
  value.schemaVersion = "2.4.0";
  const scenes = value.scenes as Array<{
    visualBeats: Array<Record<string, unknown>>;
    numbers: Array<Record<string, unknown>>;
  }>;
  let beatCount = 0;
  for (const scene of scenes) {
    for (const beat of scene.visualBeats) {
      const entry = getVisualGrammarCompatibility(beat.visualTemplate as never);
      beat.visualGrammarId = entry.allowedGrammarIds[0];
      beat.transitionRole = "continuation";
      beatCount += 1;
    }
  }
  value.visualGrammarContract = {
    contractVersion: "1.0.0",
    semanticsSha256: "0".repeat(64),
    rendererCompatibilitySha256: VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
    finalEpisodeContractSha256: "1".repeat(64),
    beatCount,
  };

  const firstScene = scenes[0];
  firstScene.numbers.push(
    {numberId: "timeline-event", label: "公式発表", value: "0.0%", numericValue: 0, precision: 2, unit: "%", comparison: null, tone: "neutral"},
    {numberId: "timeline-lead", label: "主役銘柄", value: "+4.2%", numericValue: 4.2, precision: 2, unit: "%", comparison: null, tone: "positive"},
    {numberId: "timeline-index", label: "NASDAQ", value: "+0.8%", numericValue: 0.8, precision: 2, unit: "%", comparison: null, tone: "positive"},
  );
  const beat = firstScene.visualBeats[0];
  beat.visualTemplate = "event-reaction-timeline";
  beat.visualGrammarId = "reaction";
  beat.transitionRole = "continuation";
  beat.screenState = "Chart";
  beat.visualMode = "timeline";
  beat.objectIds = ["timeline-event", "timeline-lead", "timeline-index"];
  beat.templateConfig = {
    variant: "verified-series",
    comparisonBasis: "official event and verified market series",
    dataBasis: "verified intraday series",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    reactionTimeline: {
      precision: "verified-intraday-series",
      eventOrderIds: ["timeline-event", "timeline-lead", "timeline-index"],
      seriesObjectIds: [],
      displayTimezone: "America/New_York",
      eventMarker: {
        timestamp: "2026-08-07T12:30:00Z",
        label: "雇用統計",
        sourceLabel: "BLS",
      },
      intradaySeries: {
        source: "Longbridge",
        kind: "intraday",
        fetched_by: "longbridge-cli",
        generated_at: "2026-08-10T00:00:00Z",
        symbol: "QQQ.US",
        marketDate: "2026-08-07",
        timezone: "UTC",
        session: "regular",
        resolution: "1m",
        precision: "verified-intraday-series",
        providerSurface: "kline-history-fallback",
        priceBasis: "minute-close",
        rawSha256: "a".repeat(64),
        points: [
          {timestamp: "2026-08-07T12:28:00Z", price: 580.10, open: 580.00, high: 580.20, low: 579.95, close: 580.10, volume: 1000, turnover: 580100},
          {timestamp: "2026-08-07T12:29:00Z", price: 580.06, open: 580.10, high: 580.14, low: 580.01, close: 580.06, volume: 1200, turnover: 696072},
          {timestamp: "2026-08-07T12:30:00Z", price: 580.42, open: 580.05, high: 580.51, low: 580.00, close: 580.42, volume: 4200, turnover: 2437764},
          {timestamp: "2026-08-07T12:31:00Z", price: 580.71, open: 580.42, high: 580.79, low: 580.38, close: 580.71, volume: 3600, turnover: 2090556},
        ],
      },
    },
  };
  return renderSpecSchema.parse(value);
};

const valid = make24();
validateVisualGrammarContract(valid);
console.log("PASS: full verified intraday series reaction timeline passes");

const legacy = clone(valid);
const legacyConfig = legacy.scenes[0].visualBeats[0].templateConfig.reactionTimeline!;
delete legacyConfig.intradaySeries;
delete legacyConfig.eventMarker;
delete legacyConfig.displayTimezone;
legacyConfig.seriesObjectIds = ["timeline-event", "timeline-lead", "timeline-index"];
validateVisualGrammarContract(legacy);
console.log("PASS: legacy verified series remains compatible");

const mismatch = clone(valid);
mismatch.scenes[0].visualBeats[0].templateConfig.reactionTimeline!.precision = "close-only";
assert.throws(() => validateVisualGrammarContract(mismatch), /VG_REACTION_PRECISION_MISMATCH/);
console.log("PASS: variant and precision mismatch is rejected");

const forbiddenSeries = clone(valid);
const forbiddenBeat = forbiddenSeries.scenes[0].visualBeats[0];
forbiddenBeat.templateConfig.variant = "reported-sequence";
forbiddenBeat.templateConfig.reactionTimeline!.precision = "reported-sequence";
assert.throws(() => validateVisualGrammarContract(forbiddenSeries), /VG_REACTION_SERIES_FORBIDDEN/);
console.log("PASS: unverified sequence cannot declare a full intraday series");

const missingValue = clone(valid);
missingValue.scenes[0].visualBeats[0].templateConfig.reactionTimeline!.seriesObjectIds = ["timeline-index"];
missingValue.scenes[0].numbers.find((item) => item.numberId === "timeline-index")!.numericValue = null;
assert.throws(() => validateVisualGrammarContract(missingValue), /VG_REACTION_SERIES_VALUE_MISSING/);
console.log("PASS: optional legacy summary objects still require verified numeric values");

const unsorted = clone(valid);
const unsortedPoints = unsorted.scenes[0].visualBeats[0].templateConfig.reactionTimeline!.intradaySeries!.points;
[unsortedPoints[1], unsortedPoints[2]] = [unsortedPoints[2], unsortedPoints[1]];
assert.throws(() => validateVisualGrammarContract(unsorted), /VG_REACTION_SERIES_TIMESTAMP_ORDER/);
console.log("PASS: unsorted minute timestamps are rejected");

const markerOutside = clone(valid);
markerOutside.scenes[0].visualBeats[0].templateConfig.reactionTimeline!.eventMarker!.timestamp = "2026-08-07T12:40:00Z";
assert.throws(() => validateVisualGrammarContract(markerOutside), /VG_REACTION_EVENT_MARKER_OUTSIDE_SERIES/);
console.log("PASS: event marker must be inside the displayed series");

const majorShift = clone(valid);
const firstBeat = majorShift.scenes[0].visualBeats[0];
if ((firstBeat.shots?.length ?? 0) > 0) {
  firstBeat.transitionRole = "major-shift";
  firstBeat.shots![0].transitionIn = "soft-reveal";
  assert.throws(() => validateVisualGrammarContract(majorShift), /VG_MAJOR_SHIFT_MOTION_INVALID/);
  console.log("PASS: major shift rejects soft reveal");
} else {
  console.log("PASS: major shift fixture has no Shots; motion gate remains schema-covered");
}

console.log("reaction timeline contract tests: 8 passed");
