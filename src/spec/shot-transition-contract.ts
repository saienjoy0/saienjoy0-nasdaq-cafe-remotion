import type {ShotTransition} from "./shot-contract";

export const SHOT_SOFT_REVEAL_MS = 180;
export const SHOT_REFRAME_FADE_MS = 120;
export const SHOT_SHARED_REFRAME_MS = 240;
export const SHOT_STRUCTURAL_FADE_MS = 160;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
};

const normalizeTransition = (transition: ShotTransition | boolean): ShotTransition =>
  typeof transition === "boolean"
    ? transition
      ? "hard-cut"
      : "soft-reveal"
    : transition;

export const getShotLayerFadeDurationMs = (transition: ShotTransition) => {
  switch (transition) {
    case "soft-reveal": return SHOT_SOFT_REVEAL_MS;
    case "reframe-shared-element": return SHOT_REFRAME_FADE_MS;
    case "pin-to-corner":
    case "collapse-to-node": return SHOT_STRUCTURAL_FADE_MS;
    case "merge-to-outcome": return SHOT_SOFT_REVEAL_MS;
    case "continue-from-previous":
    case "carry-forward":
    case "hard-cut":
    case "hold-outcome": return 0;
  }
};

export const shotTransitionUsesLayerFade = (transition: ShotTransition) =>
  getShotLayerFadeDurationMs(transition) > 0;

export const getShotTransitionOpacities = (
  elapsedMs: number,
  hasPrevious: boolean,
  transition: ShotTransition | boolean = "soft-reveal",
) => {
  const normalized = normalizeTransition(transition);
  const fadeDurationMs = getShotLayerFadeDurationMs(normalized);
  if (!hasPrevious || fadeDurationMs === 0) {
    return {previous: 0, current: 1, progress: 1, sharedProgress: 1};
  }
  const progress = smoothstep(elapsedMs / fadeDurationMs);
  const sharedProgress = smoothstep(
    elapsedMs /
    (normalized === "reframe-shared-element" ? SHOT_SHARED_REFRAME_MS : fadeDurationMs),
  );
  return {
    previous: 1 - progress,
    current: progress,
    progress,
    sharedProgress,
  };
};
