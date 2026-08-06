import type {ShotRecipe} from "./shot-contract";
import type {ResolvedShot} from "./shot-timeline";

export const SHOT_INTRO_DURATION_MS = 260;
export const MIN_SHOT_FINAL_HOLD_MS = 500;
export const MAX_SHOT_ENTER_MS = 360;
export const MAX_SHOT_BUILD_MS = 1_800;
export const CAMERA_SETTLE_BEFORE_END_MS = 220;
export const NARRATION_ITEM_REVEAL_MS = 300;

export type ShotMotionProfile = {
  enterMs: number;
  buildMs: number;
  staggerMs: number;
  holdMinMs: number;
};

export const SHOT_MOTION_PROFILES: Record<ShotRecipe, ShotMotionProfile> = {
  "hero-metric-impact": {enterMs: 220, buildMs: 260, staggerMs: 0, holdMinMs: 650},
  "contradiction-interrupt": {enterMs: 180, buildMs: 220, staggerMs: 0, holdMinMs: 600},
  "expected-anchor": {enterMs: 240, buildMs: 300, staggerMs: 0, holdMinMs: 650},
  "actual-crosses-expected": {enterMs: 260, buildMs: 340, staggerMs: 0, holdMinMs: 650},
  "gap-macro": {enterMs: 220, buildMs: 280, staggerMs: 0, holdMinMs: 650},
  "causal-build": {enterMs: 180, buildMs: 1_400, staggerMs: 260, holdMinMs: 750},
  "counterforce-interrupt": {enterMs: 190, buildMs: 240, staggerMs: 0, holdMinMs: 600},
  "entity-cutaway": {enterMs: 230, buildMs: 280, staggerMs: 0, holdMinMs: 650},
  "split-opposition": {enterMs: 230, buildMs: 320, staggerMs: 0, holdMinMs: 650},
  "focus-matrix-reveal": {enterMs: 210, buildMs: 1_200, staggerMs: 260, holdMinMs: 750},
  "verification-two-paths": {enterMs: 210, buildMs: 1_300, staggerMs: 280, holdMinMs: 800},
  "recap-assembly": {enterMs: 240, buildMs: 1_500, staggerMs: 300, holdMinMs: 900},
};

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const progress = clampUnit(value);
  return progress * progress * (3 - 2 * progress);
};

export type ShotMotionTiming = Pick<ResolvedShot, "startMs" | "endMs" | "progress">;

export const getShotMotionProfile = (recipe: ShotRecipe) => SHOT_MOTION_PROFILES[recipe];

export const getShotDurationMs = (shot: ShotMotionTiming) =>
  Math.max(1, shot.endMs - shot.startMs);

export const getShotElapsedMs = (shot: ShotMotionTiming) =>
  clampUnit(shot.progress) * getShotDurationMs(shot);

const getShotPhaseDurationMs = (
  shot: ShotMotionTiming,
  requestedMs: number,
  minimumHoldMs: number,
) => {
  const availableBeforeHoldMs = Math.max(1, getShotDurationMs(shot) - Math.max(0, minimumHoldMs));
  return Math.min(Math.max(1, requestedMs), availableBeforeHoldMs);
};

export const getShotIntroDurationMs = (
  shot: ShotMotionTiming,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => getShotPhaseDurationMs(shot, requestedIntroMs, minimumHoldMs);

export const getShotBuildDurationMs = (
  shot: ShotMotionTiming,
  requestedBuildMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => getShotPhaseDurationMs(shot, requestedBuildMs, minimumHoldMs);

export const getShotFinalHoldMs = (
  shot: ShotMotionTiming,
  requestedMotionMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => getShotDurationMs(shot) - getShotPhaseDurationMs(shot, requestedMotionMs, minimumHoldMs);

const durationInFrames = (durationMs: number, fps: number) => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("fps must be a positive finite number");
  }
  return Math.max(1, Math.floor((durationMs / 1000) * fps));
};

export const getShotIntroDurationInFrames = (
  shot: ShotMotionTiming,
  fps: number,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => durationInFrames(
  getShotIntroDurationMs(shot, requestedIntroMs, minimumHoldMs),
  fps,
);

export const getShotIntroFrame = (
  shot: ShotMotionTiming,
  fps: number,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("fps must be a positive finite number");
  }
  const elapsedFrame = (getShotElapsedMs(shot) / 1000) * fps;
  return Math.min(
    getShotIntroDurationInFrames(shot, fps, requestedIntroMs, minimumHoldMs),
    elapsedFrame,
  );
};

export const getShotIntroLinearProgress = (
  shot: ShotMotionTiming,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => smoothstep(
  getShotElapsedMs(shot) /
  getShotIntroDurationMs(shot, requestedIntroMs, minimumHoldMs),
);

export const getShotBuildLinearProgress = (
  shot: ShotMotionTiming,
  requestedBuildMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => smoothstep(
  getShotElapsedMs(shot) /
  getShotBuildDurationMs(shot, requestedBuildMs, minimumHoldMs),
);

export const getShotStaggerProgress = (
  shot: ShotMotionTiming,
  index: number,
  itemCount: number,
  profile: ShotMotionProfile,
) => {
  const count = Math.max(1, itemCount);
  const safeIndex = Math.max(0, Math.min(count - 1, index));
  const buildMs = getShotBuildDurationMs(shot, profile.buildMs, profile.holdMinMs);
  const itemMs = Math.min(
    Math.max(NARRATION_ITEM_REVEAL_MS, profile.staggerMs),
    buildMs,
  );
  const lastStartMs = Math.max(0, buildMs - itemMs);
  const startMs = count <= 1 ? 0 : (safeIndex / (count - 1)) * lastStartMs;
  return smoothstep((getShotElapsedMs(shot) - startMs) / itemMs);
};

export const getShotCameraProgress = (
  shot: ShotMotionTiming,
  settleBeforeEndMs = CAMERA_SETTLE_BEFORE_END_MS,
) => {
  const activeMs = Math.max(1, getShotDurationMs(shot) - Math.max(0, settleBeforeEndMs));
  return smoothstep(getShotElapsedMs(shot) / activeMs);
};
