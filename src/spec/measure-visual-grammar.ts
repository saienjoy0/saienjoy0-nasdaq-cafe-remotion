import type {RenderProductionData, RenderSpec} from "./render-spec";
import {resolveBeatShots} from "./shot-timeline";
import {
  getVisualGrammarAppearance,
  type AppearanceClass,
  type DominantSurface,
  type TransitionRole,
  type VisualGrammarId,
} from "./visual-grammar-contract";

export const VISUAL_GRAMMAR_TIMING_REPORT_VERSION = "1.1.0" as const;
export const STATIC_STATE_WARNING_MS = 8000 as const;
export const STATIC_STATE_FAILURE_CANDIDATE_MS = 16000 as const;

export const VISUAL_GRAMMAR_TIMING_FAILURE_CODES = [
  "VG_TIMING_METADATA_MISSING",
] as const;

export const VISUAL_GRAMMAR_TIMING_QUALITY_WARNING_CODES = [
  "VG_SAME_APPEARANCE_RUN_TOO_LONG",
  "VG_DOMINANT_SURFACE_OVERWEIGHT",
  "VG_CARD_BOARD_OVERWEIGHT",
  "VG_NON_ANALYSIS_DURATION_TOO_LOW",
  "VG_BRIDGE_TEXT_OVERUSED",
  "VG_MAJOR_SHIFT_HOLD_TOO_SHORT",
] as const;

export type VisualGrammarTimingFailureCode =
  typeof VISUAL_GRAMMAR_TIMING_FAILURE_CODES[number];

export type VisualGrammarTimingQualityWarningCode =
  typeof VISUAL_GRAMMAR_TIMING_QUALITY_WARNING_CODES[number];

export type MeasuredVisualGrammarBeat = {
  sceneId: string;
  sceneNumber: number;
  beatId: string;
  startMs: number;
  endMs: number;
  durationMs: number;
  visualGrammarId: VisualGrammarId;
  transitionRole: TransitionRole;
  appearanceClass: AppearanceClass;
  dominantSurface: DominantSurface;
  stageShell: string;
  selectedPath: "preferred" | "fallback" | "not-applicable";
};

export type VisualGrammarTimingFailure = {
  code: VisualGrammarTimingFailureCode;
  path: string;
  beatId: string | null;
  message: string;
  actual: number;
  limit: number;
  unit: "ms" | "ratio" | "count";
};

export type VisualGrammarTimingQualityWarning = {
  code: VisualGrammarTimingQualityWarningCode;
  path: string;
  beatId: string | null;
  message: string;
  actual: number;
  limit: number;
  unit: "ms" | "ratio" | "count";
};

export type VisualGrammarTimingBeatWarning = {
  code: "VG_NON_ANALYSIS_BEAT_OUTSIDE_RECOMMENDED_RANGE";
  beatId: string;
  durationMs: number;
  recommendedMinMs: 5000;
  recommendedMaxMs: 8000;
};

export type VisualGrammarTimingWarning =
  | VisualGrammarTimingQualityWarning
  | VisualGrammarTimingBeatWarning;

export type StaticStateBoundaryKind =
  | "scene-boundary"
  | "beat-boundary"
  | "shot-boundary"
  | "show"
  | "hide"
  | "highlight"
  | "unhighlight"
  | "main-stage-placement-change";

export type StaticStateFinding = {
  sceneId: string;
  beatId: string | null;
  startMs: number;
  endMs: number;
  durationMs: number;
  startBoundaryKinds: StaticStateBoundaryKind[];
  endBoundaryKinds: StaticStateBoundaryKind[];
};

export type StaticStateReport = {
  mode: "report-only";
  warningThresholdMs: typeof STATIC_STATE_WARNING_MS;
  failureCandidateThresholdMs: typeof STATIC_STATE_FAILURE_CANDIDATE_MS;
  longestStaticStateMs: number;
  longestStaticStateSceneId: string | null;
  longestStaticStateBeatId: string | null;
  warningCount: number;
  failureCandidateCount: number;
  warnings: StaticStateFinding[];
  failureCandidates: StaticStateFinding[];
};

export type VisualGrammarTimingReport = {
  contractVersion: typeof VISUAL_GRAMMAR_TIMING_REPORT_VERSION;
  status: "PASS" | "FAIL";
  timingBasis: "post-tts-production-data";
  episodeId: string;
  durationMode: "standard" | "shortened";
  inputRenderSpecSha256: string;
  semanticsSha256: string;
  rendererCompatibilitySha256: string;
  finalEpisodeContractSha256: string;
  sceneRange: "scene-01..scene-08";
  fallbackDiversityRecheck: "completed";
  selectedFallbackBeatIds: string[];
  unresolvedStateCount: 0;
  thresholds: {
    sameAppearanceRunMaxMs: 28000;
    dominantSurfaceMaxRatio: 0.45;
    cardBoardMaxRatio: 0.55;
    nonAnalysisMinMs: number;
    bridgeTextMaxRatio: 0.12;
    bridgeTextMaxMs: 18000;
    majorShiftStageMinMs: 4000;
  };
  metrics: {
    measuredBeatCount: number;
    totalMeasuredMs: number;
    appearanceClassCount: number;
    dominantSurfaceCount: number;
    majorShiftCount: number;
    longestSameAppearanceRunMs: number;
    longestSameAppearanceRunBeatIds: string[];
    dominantSurfaceMaxRatio: number;
    dominantSurfaceMaxId: DominantSurface | null;
    cardBoardRatio: number;
    nonAnalysisDurationMs: number;
    bridgeTextDurationMs: number;
    bridgeTextRatio: number;
    appearanceDurationMs: Partial<Record<AppearanceClass, number>>;
    dominantSurfaceDurationMs: Partial<Record<DominantSurface, number>>;
  };
  staticState: StaticStateReport;
  beats: MeasuredVisualGrammarBeat[];
  failures: VisualGrammarTimingFailure[];
  warnings: VisualGrammarTimingWarning[];
};

const NON_ANALYSIS_APPEARANCES = new Set<AppearanceClass>([
  "entity-canvas",
  "document-media",
  "picturebook-canvas",
]);

const increment = <Key extends string>(
  record: Partial<Record<Key, number>>,
  key: Key,
  amount: number,
) => {
  record[key] = (record[key] ?? 0) + amount;
};

const ratio = (value: number, total: number) => total <= 0 ? 0 : value / total;
const roundRatio = (value: number) => Math.round(value * 1_000_000) / 1_000_000;

const emptyStaticState = (): StaticStateReport => ({
  mode: "report-only",
  warningThresholdMs: STATIC_STATE_WARNING_MS,
  failureCandidateThresholdMs: STATIC_STATE_FAILURE_CANDIDATE_MS,
  longestStaticStateMs: 0,
  longestStaticStateSceneId: null,
  longestStaticStateBeatId: null,
  warningCount: 0,
  failureCandidateCount: 0,
  warnings: [],
  failureCandidates: [],
});

const addBoundary = (
  boundaries: Map<number, Set<StaticStateBoundaryKind>>,
  value: number,
  kind: StaticStateBoundaryKind,
  durationMs: number,
) => {
  const timeMs = Math.max(0, Math.min(durationMs, value));
  const kinds = boundaries.get(timeMs) ?? new Set<StaticStateBoundaryKind>();
  kinds.add(kind);
  boundaries.set(timeMs, kinds);
};

const eventTimeMs = (
  scene: RenderProductionData["scenes"][number],
  event: RenderProductionData["scenes"][number]["visualEvents"][number],
) => {
  const chunk = scene.narrationChunks.find((item) => item.chunkId === event.atChunkId);
  if (!chunk) throw new Error(`VG_TIMING_METADATA_MISSING ${scene.sceneId}: unknown event chunk ${event.atChunkId}`);
  return (event.timing === "chunk-start" ? chunk.startMs : chunk.endMs) + event.offsetMs;
};

export const measureStaticState = (data: RenderProductionData): StaticStateReport => {
  const findings: StaticStateFinding[] = [];
  for (const scene of data.scenes.filter((item) => item.sceneNumber <= 8)) {
    const boundaries = new Map<number, Set<StaticStateBoundaryKind>>();
    addBoundary(boundaries, 0, "scene-boundary", scene.durationMs);
    addBoundary(boundaries, scene.durationMs, "scene-boundary", scene.durationMs);

    for (const beat of scene.visualBeats) {
      addBoundary(boundaries, beat.startMs, "beat-boundary", scene.durationMs);
      addBoundary(boundaries, beat.endMs, "beat-boundary", scene.durationMs);
      for (const shot of resolveBeatShots(scene, beat)) {
        addBoundary(boundaries, shot.startMs, "shot-boundary", scene.durationMs);
        addBoundary(boundaries, shot.endMs, "shot-boundary", scene.durationMs);
      }
    }

    for (const event of scene.visualEvents) {
      if (!["show", "hide", "highlight", "unhighlight"].includes(event.action)) continue;
      addBoundary(
        boundaries,
        eventTimeMs(scene, event),
        event.action as "show" | "hide" | "highlight" | "unhighlight",
        scene.durationMs,
      );
    }

    for (const placement of scene.assetPlacements) {
      if (!["main-media", "chart", "illustration"].includes(placement.role)) continue;
      const startChunk = placement.startChunkId
        ? scene.narrationChunks.find((item) => item.chunkId === placement.startChunkId)
        : null;
      const endChunk = placement.endChunkId
        ? scene.narrationChunks.find((item) => item.chunkId === placement.endChunkId)
        : null;
      const startMs = placement.startChunkId ? startChunk?.startMs : 0;
      const endMs = placement.endChunkId
        ? endChunk ? endChunk.endMs + endChunk.pauseAfterMs : undefined
        : scene.durationMs;
      if (startMs === undefined || endMs === undefined) {
        throw new Error(`VG_TIMING_METADATA_MISSING ${scene.sceneId}: invalid main-stage placement range`);
      }
      addBoundary(boundaries, startMs, "main-stage-placement-change", scene.durationMs);
      addBoundary(boundaries, endMs, "main-stage-placement-change", scene.durationMs);
    }

    const times = [...boundaries.keys()].sort((left, right) => left - right);
    for (let index = 0; index < times.length - 1; index += 1) {
      const startMs = times[index];
      const endMs = times[index + 1];
      if (endMs <= startMs) continue;
      const activeBeat = scene.visualBeats.find(
        (beat) => beat.startMs <= startMs && startMs < beat.endMs,
      );
      findings.push({
        sceneId: scene.sceneId,
        beatId: activeBeat?.beatId ?? null,
        startMs,
        endMs,
        durationMs: endMs - startMs,
        startBoundaryKinds: [...(boundaries.get(startMs) ?? [])].sort(),
        endBoundaryKinds: [...(boundaries.get(endMs) ?? [])].sort(),
      });
    }
  }

  const longest = [...findings].sort((left, right) => right.durationMs - left.durationMs)[0];
  const warnings = findings.filter((item) => item.durationMs > STATIC_STATE_WARNING_MS);
  const failureCandidates = findings.filter(
    (item) => item.durationMs > STATIC_STATE_FAILURE_CANDIDATE_MS,
  );
  return {
    mode: "report-only",
    warningThresholdMs: STATIC_STATE_WARNING_MS,
    failureCandidateThresholdMs: STATIC_STATE_FAILURE_CANDIDATE_MS,
    longestStaticStateMs: longest?.durationMs ?? 0,
    longestStaticStateSceneId: longest?.sceneId ?? null,
    longestStaticStateBeatId: longest?.beatId ?? null,
    warningCount: warnings.length,
    failureCandidateCount: failureCandidates.length,
    warnings,
    failureCandidates,
  };
};

export const evaluateVisualGrammarTiming = (input: {
  episodeId: string;
  durationMode: "standard" | "shortened";
  inputRenderSpecSha256: string;
  semanticsSha256: string;
  rendererCompatibilitySha256: string;
  finalEpisodeContractSha256: string;
  beats: MeasuredVisualGrammarBeat[];
  staticState?: StaticStateReport;
}): VisualGrammarTimingReport => {
  const thresholds = {
    sameAppearanceRunMaxMs: 28000 as const,
    dominantSurfaceMaxRatio: 0.45 as const,
    cardBoardMaxRatio: 0.55 as const,
    nonAnalysisMinMs: input.durationMode === "shortened" ? 8000 : 10000,
    bridgeTextMaxRatio: 0.12 as const,
    bridgeTextMaxMs: 18000 as const,
    majorShiftStageMinMs: 4000 as const,
  };
  const failures: VisualGrammarTimingFailure[] = [];
  const warnings: VisualGrammarTimingWarning[] = [];
  const appearanceDurationMs: Partial<Record<AppearanceClass, number>> = {};
  const dominantSurfaceDurationMs: Partial<Record<DominantSurface, number>> = {};
  const selectedFallbackBeatIds: string[] = [];
  let totalMeasuredMs = 0;
  let nonAnalysisDurationMs = 0;
  let bridgeTextDurationMs = 0;
  let majorShiftCount = 0;

  for (const beat of input.beats) {
    totalMeasuredMs += beat.durationMs;
    increment(appearanceDurationMs, beat.appearanceClass, beat.durationMs);
    increment(dominantSurfaceDurationMs, beat.dominantSurface, beat.durationMs);
    if (NON_ANALYSIS_APPEARANCES.has(beat.appearanceClass)) {
      nonAnalysisDurationMs += beat.durationMs;
      if (beat.durationMs < 5000 || beat.durationMs > 8000) {
        warnings.push({
          code: "VG_NON_ANALYSIS_BEAT_OUTSIDE_RECOMMENDED_RANGE",
          beatId: beat.beatId,
          durationMs: beat.durationMs,
          recommendedMinMs: 5000,
          recommendedMaxMs: 8000,
        });
      }
    }
    if (beat.visualGrammarId === "bridge-text") bridgeTextDurationMs += beat.durationMs;
    if (beat.selectedPath === "fallback") selectedFallbackBeatIds.push(beat.beatId);
    if (beat.transitionRole === "major-shift") {
      majorShiftCount += 1;
      if (beat.durationMs < thresholds.majorShiftStageMinMs) {
        warnings.push({
          code: "VG_MAJOR_SHIFT_HOLD_TOO_SHORT",
          path: `episode://${beat.sceneId}/${beat.beatId}/durationMs`,
          beatId: beat.beatId,
          message: "major-shift Stage hold is below the four-second editorial target",
          actual: beat.durationMs,
          limit: thresholds.majorShiftStageMinMs,
          unit: "ms",
        });
      }
    }
  }

  let currentAppearance: AppearanceClass | null = null;
  let currentRunMs = 0;
  let currentRunBeatIds: string[] = [];
  let longestSameAppearanceRunMs = 0;
  let longestSameAppearanceRunBeatIds: string[] = [];
  const closeRun = () => {
    if (currentRunMs > longestSameAppearanceRunMs) {
      longestSameAppearanceRunMs = currentRunMs;
      longestSameAppearanceRunBeatIds = [...currentRunBeatIds];
    }
    if (currentRunMs > thresholds.sameAppearanceRunMaxMs) {
      warnings.push({
        code: "VG_SAME_APPEARANCE_RUN_TOO_LONG",
        path: `episode://${currentRunBeatIds[0] ?? "unknown"}/appearance-run`,
        beatId: currentRunBeatIds[0] ?? null,
        message: `same Appearance Class continued across ${currentRunBeatIds.join(", ")}`,
        actual: currentRunMs,
        limit: thresholds.sameAppearanceRunMaxMs,
        unit: "ms",
      });
    }
  };
  for (const beat of input.beats) {
    if (beat.appearanceClass !== currentAppearance) {
      closeRun();
      currentAppearance = beat.appearanceClass;
      currentRunMs = 0;
      currentRunBeatIds = [];
    }
    currentRunMs += beat.durationMs;
    currentRunBeatIds.push(beat.beatId);
  }
  closeRun();

  const surfaceEntries = Object.entries(dominantSurfaceDurationMs) as Array<[
    DominantSurface,
    number,
  ]>;
  const [dominantSurfaceMaxId, dominantSurfaceMaxMs] = surfaceEntries
    .sort((left, right) => right[1] - left[1])[0] ?? [null, 0];
  const dominantSurfaceMaxRatio = roundRatio(ratio(dominantSurfaceMaxMs, totalMeasuredMs));
  const cardBoardRatio = roundRatio(ratio(dominantSurfaceDurationMs["card-board"] ?? 0, totalMeasuredMs));
  const bridgeTextRatio = roundRatio(ratio(bridgeTextDurationMs, totalMeasuredMs));

  if (dominantSurfaceMaxRatio > thresholds.dominantSurfaceMaxRatio) {
    warnings.push({
      code: "VG_DOMINANT_SURFACE_OVERWEIGHT",
      path: `$.metrics.dominantSurfaceDurationMs.${dominantSurfaceMaxId ?? "unknown"}`,
      beatId: null,
      message: `${dominantSurfaceMaxId ?? "unknown"} occupies more than the editorial target in Scene 1–8`,
      actual: dominantSurfaceMaxRatio,
      limit: thresholds.dominantSurfaceMaxRatio,
      unit: "ratio",
    });
  }
  if (cardBoardRatio > thresholds.cardBoardMaxRatio) {
    warnings.push({
      code: "VG_CARD_BOARD_OVERWEIGHT",
      path: "$.metrics.dominantSurfaceDurationMs.card-board",
      beatId: null,
      message: "card-board occupies more than the editorial target in Scene 1–8",
      actual: cardBoardRatio,
      limit: thresholds.cardBoardMaxRatio,
      unit: "ratio",
    });
  }
  if (nonAnalysisDurationMs < thresholds.nonAnalysisMinMs) {
    warnings.push({
      code: "VG_NON_ANALYSIS_DURATION_TOO_LOW",
      path: "$.metrics.nonAnalysisDurationMs",
      beatId: null,
      message: "Entity, Document/Media, and PictureBook time is below the editorial target",
      actual: nonAnalysisDurationMs,
      limit: thresholds.nonAnalysisMinMs,
      unit: "ms",
    });
  }
  if (
    bridgeTextDurationMs > thresholds.bridgeTextMaxMs ||
    bridgeTextRatio > thresholds.bridgeTextMaxRatio
  ) {
    warnings.push({
      code: "VG_BRIDGE_TEXT_OVERUSED",
      path: "$.metrics.bridgeTextDurationMs",
      beatId: null,
      message: "bridge-text exceeds the editorial absolute or proportional target",
      actual: Math.max(bridgeTextDurationMs, bridgeTextRatio),
      limit: bridgeTextDurationMs > thresholds.bridgeTextMaxMs
        ? thresholds.bridgeTextMaxMs
        : thresholds.bridgeTextMaxRatio,
      unit: bridgeTextDurationMs > thresholds.bridgeTextMaxMs ? "ms" : "ratio",
    });
  }

  return {
    contractVersion: VISUAL_GRAMMAR_TIMING_REPORT_VERSION,
    status: failures.length === 0 ? "PASS" : "FAIL",
    timingBasis: "post-tts-production-data",
    episodeId: input.episodeId,
    durationMode: input.durationMode,
    inputRenderSpecSha256: input.inputRenderSpecSha256,
    semanticsSha256: input.semanticsSha256,
    rendererCompatibilitySha256: input.rendererCompatibilitySha256,
    finalEpisodeContractSha256: input.finalEpisodeContractSha256,
    sceneRange: "scene-01..scene-08",
    fallbackDiversityRecheck: "completed",
    selectedFallbackBeatIds,
    unresolvedStateCount: 0,
    thresholds,
    metrics: {
      measuredBeatCount: input.beats.length,
      totalMeasuredMs,
      appearanceClassCount: Object.keys(appearanceDurationMs).length,
      dominantSurfaceCount: Object.keys(dominantSurfaceDurationMs).length,
      majorShiftCount,
      longestSameAppearanceRunMs,
      longestSameAppearanceRunBeatIds,
      dominantSurfaceMaxRatio,
      dominantSurfaceMaxId,
      cardBoardRatio,
      nonAnalysisDurationMs,
      bridgeTextDurationMs,
      bridgeTextRatio,
      appearanceDurationMs,
      dominantSurfaceDurationMs,
    },
    staticState: input.staticState ?? emptyStaticState(),
    beats: input.beats,
    failures,
    warnings,
  };
};

export const measureVisualGrammarTiming = (
  spec: RenderSpec,
  data: RenderProductionData,
): VisualGrammarTimingReport | null => {
  if (spec.schemaVersion !== "2.4.0") return null;
  const contract = spec.visualGrammarContract;
  if (!contract) throw new Error("VG_TIMING_METADATA_MISSING $.visualGrammarContract: required for 2.4.0");

  const beats: MeasuredVisualGrammarBeat[] = data.scenes
    .filter((scene) => scene.sceneNumber <= 8)
    .flatMap((scene) => scene.visualBeats.map((beat, beatIndex) => {
      if (beat.visualGrammarId === undefined || beat.transitionRole === undefined) {
        throw new Error(
          `VG_TIMING_METADATA_MISSING $.scenes[${scene.sceneNumber - 1}].visualBeats[${beatIndex}]: visualGrammarId and transitionRole are required`,
        );
      }
      const appearance = getVisualGrammarAppearance(
        beat.visualTemplate,
        beat.templateConfig.variant,
      );
      return {
        sceneId: scene.sceneId,
        sceneNumber: scene.sceneNumber,
        beatId: beat.beatId,
        startMs: beat.startMs,
        endMs: beat.endMs,
        durationMs: beat.endMs - beat.startMs,
        visualGrammarId: beat.visualGrammarId,
        transitionRole: beat.transitionRole,
        appearanceClass: appearance.appearanceClass,
        dominantSurface: appearance.dominantSurface,
        stageShell: appearance.stageShell,
        selectedPath: beat.financialVisualTrace?.selectedPath ?? "not-applicable",
      };
    }));

  return evaluateVisualGrammarTiming({
    episodeId: spec.episode.id,
    durationMode: spec.episode.durationMode,
    inputRenderSpecSha256: data.inputSpecSha256,
    semanticsSha256: contract.semanticsSha256,
    rendererCompatibilitySha256: contract.rendererCompatibilitySha256,
    finalEpisodeContractSha256: contract.finalEpisodeContractSha256,
    beats,
    staticState: measureStaticState(data),
  });
};
