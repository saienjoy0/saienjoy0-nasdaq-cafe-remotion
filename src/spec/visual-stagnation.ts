import type {RenderSpec} from "./render-spec";
import type {VisualGrammarTimingReport} from "./measure-visual-grammar";

export const VISUAL_STAGNATION_WARNING_MS = 8000 as const;

export type VisualStagnationWarning = {
  code: "W_VISUAL_STAGNATION";
  beatIds: string[];
  durationMs: number;
  thresholdMs: typeof VISUAL_STAGNATION_WARNING_MS;
  signature: string;
};

export type VisualStagnationRun = {
  signature: string;
  beatIds: string[];
  durationMs: number;
};

export type VisualGrammarTimingWithStagnation = Omit<
  VisualGrammarTimingReport,
  "warnings"
> & {
  warnings: Array<VisualGrammarTimingReport["warnings"][number] | VisualStagnationWarning>;
  visualStagnation: {
    status: "clear" | "warning";
    thresholdMs: typeof VISUAL_STAGNATION_WARNING_MS;
    longestRunMs: number;
    longestRunBeatIds: string[];
    longestRunSignature: string | null;
    warningCount: number;
  };
};

const MAIN_ROLES = new Set([
  "main-media",
  "illustration",
  "entity-card",
  "picture-book",
]);
const MAIN_REGIONS = new Set(["main-stage", "main-primary", "main-entity"]);

const signatureFor = (spec: RenderSpec, sceneId: string, beatId: string) => {
  const scene = spec.scenes.find((item) => item.sceneId === sceneId);
  const beat = scene?.visualBeats.find((item) => item.beatId === beatId);
  if (!scene || !beat) {
    throw new Error(`W_VISUAL_STAGNATION metadata missing for ${sceneId}/${beatId}`);
  }
  const placementIds = new Set(beat.assetPlacementIds);
  const mainAssetIds = scene.assetPlacements
    .filter(
      (placement) =>
        placementIds.has(placement.placementId) &&
        MAIN_ROLES.has(placement.role) &&
        MAIN_REGIONS.has(placement.region),
    )
    .map((placement) => placement.assetId)
    .sort();
  return [
    beat.visualTemplate,
    beat.screenState,
    mainAssetIds.length > 0 ? mainAssetIds.join(",") : "native",
    beat.transitionRole ?? "none",
  ].join("|");
};

export const addVisualStagnationWarnings = (
  spec: RenderSpec,
  report: VisualGrammarTimingReport,
): VisualGrammarTimingWithStagnation => {
  const runs: VisualStagnationRun[] = [];
  let current: VisualStagnationRun | null = null;
  const close = () => {
    if (current) runs.push(current);
    current = null;
  };

  for (const beat of report.beats) {
    const signature = signatureFor(spec, beat.sceneId, beat.beatId);
    if (!current || current.signature !== signature) {
      close();
      current = {signature, beatIds: [], durationMs: 0};
    }
    current.beatIds.push(beat.beatId);
    current.durationMs += beat.durationMs;
  }
  close();

  const warnings: VisualStagnationWarning[] = runs
    .filter((run) => run.durationMs > VISUAL_STAGNATION_WARNING_MS)
    .map((run) => ({
      code: "W_VISUAL_STAGNATION",
      beatIds: run.beatIds,
      durationMs: run.durationMs,
      thresholdMs: VISUAL_STAGNATION_WARNING_MS,
      signature: run.signature,
    }));
  const longest = [...runs].sort((left, right) => right.durationMs - left.durationMs)[0] ?? null;

  return {
    ...report,
    warnings: [...report.warnings, ...warnings],
    visualStagnation: {
      status: warnings.length > 0 ? "warning" : "clear",
      thresholdMs: VISUAL_STAGNATION_WARNING_MS,
      longestRunMs: longest?.durationMs ?? 0,
      longestRunBeatIds: longest?.beatIds ?? [],
      longestRunSignature: longest?.signature ?? null,
      warningCount: warnings.length,
    },
  };
};
