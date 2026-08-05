import type {ShotRecipe} from "./shot-contract";
import type {ResolvedShot} from "./shot-timeline";

export const SHOT_INTRO_DURATION_MS = 320;
export const MIN_SHOT_FINAL_HOLD_MS = 450;
export const MAX_SHOT_ENTER_MS = 400;
export const MAX_SHOT_BUILD_MS = 2_400;
export const CAMERA_SETTLE_BEFORE_END_MS = 200;
export const NARRATION_ITEM_REVEAL_MS = 420;

export type ShotMotionProfile = {
  enterMs: number;
  buildMs: number;
  staggerMs: number;
  holdMinMs: number;
};

export const SHOT_MOTION_PROFILES: Record<ShotRecipe, ShotMotionProfile> = {
  "hero-metric-impact": {enterMs: 340, buildMs: 340, staggerMs: 0, holdMinMs: 600},
  "contradiction-interrupt": {enterMs: 240, buildMs: 240, staggerMs: 0, holdMinMs: 550},
  "expected-anchor": {enterMs: 320, buildMs: 360, staggerMs: 0, holdMinMs: 600},
  "actual-crosses-expected": {enterMs: 340, buildMs: 420, staggerMs: 0, holdMinMs: 600},
  "gap-macro": {enterMs: 320, buildMs: 360, staggerMs: 0, holdMinMs: 600},
  "causal-build": {enterMs: 220, buildMs: 2_200, staggerMs: 420, holdMinMs: 700},
  "counterforce-interrupt": {enterMs: 240, buildMs: 280, staggerMs: 0, holdMinMs: 550},
  "entity-cutaway": {enterMs: 300, buildMs: 320, staggerMs: 0, holdMinMs: 600},
  "split-opposition": {enterMs: 300, buildMs: 420, staggerMs: 0, holdMinMs: 600},
  "focus-matrix-reveal": {enterMs: 260, buildMs: 1_800, staggerMs: 380, holdMinMs: 700},
  "verification-two-paths": {enterMs: 260, buildMs: 2_000, staggerMs: 400, holdMinMs: 750},
  "recap-assembly": {enterMs: 240, buildMs: 2_200, staggerMs: 420, holdMinMs: 850},
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
