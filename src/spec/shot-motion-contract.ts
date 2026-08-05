import type {ResolvedShot} from "./shot-timeline";

export const SHOT_INTRO_DURATION_MS = 800;
export const MIN_SHOT_FINAL_HOLD_MS = 350;

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

export type ShotMotionTiming = Pick<ResolvedShot, "startMs" | "endMs" | "progress">;

export const getShotDurationMs = (shot: ShotMotionTiming) =>
  Math.max(1, shot.endMs - shot.startMs);

export const getShotElapsedMs = (shot: ShotMotionTiming) =>
  clampUnit(shot.progress) * getShotDurationMs(shot);

export const getShotIntroDurationMs = (
  shot: ShotMotionTiming,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => {
  const shotDurationMs = getShotDurationMs(shot);
  const availableBeforeHoldMs = Math.max(1, shotDurationMs - Math.max(0, minimumHoldMs));
  return Math.min(Math.max(1, requestedIntroMs), availableBeforeHoldMs);
};

export const getShotFinalHoldMs = (
  shot: ShotMotionTiming,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => getShotDurationMs(shot) - getShotIntroDurationMs(shot, requestedIntroMs, minimumHoldMs);

export const getShotIntroDurationInFrames = (
  shot: ShotMotionTiming,
  fps: number,
  requestedIntroMs = SHOT_INTRO_DURATION_MS,
  minimumHoldMs = MIN_SHOT_FINAL_HOLD_MS,
) => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("fps must be a positive finite number");
  }
  const durationMs = getShotIntroDurationMs(shot, requestedIntroMs, minimumHoldMs);
  return Math.max(1, Math.floor((durationMs / 1000) * fps));
};

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
) => clampUnit(
  getShotElapsedMs(shot) /
  getShotIntroDurationMs(shot, requestedIntroMs, minimumHoldMs),
);
