import type {ResolvedShot} from "./shot-timeline";

export const SHOT_INTRO_DURATION_MS = 800;
export const MIN_SHOT_FINAL_HOLD_MS = 350;

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

export type ShotMotionTiming = Pick<ResolvedShot, "startMs" | "endMs" | "progress">;

export const getShotDurationMs = (shot: ShotMotionTiming) =>
  Math.max(1, shot.endMs - shot.startMs);

export const getShotElapsedMs = (shot: ShotMotionTiming) =>
  clampUnit(shot.progress) * getShotDurationMs(shot);

export const getShotIntroElapsedMs = (
  shot: ShotMotionTiming,
  introDurationMs = SHOT_INTRO_DURATION_MS,
) => Math.min(Math.max(0, introDurationMs), getShotElapsedMs(shot));

export const getShotIntroFrame = (
  shot: ShotMotionTiming,
  fps: number,
  introDurationMs = SHOT_INTRO_DURATION_MS,
) => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("fps must be a positive finite number");
  }
  return (getShotIntroElapsedMs(shot, introDurationMs) / 1000) * fps;
};

export const getShotIntroDurationInFrames = (
  fps: number,
  introDurationMs = SHOT_INTRO_DURATION_MS,
) => {
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("fps must be a positive finite number");
  }
  return Math.max(1, Math.round((Math.max(1, introDurationMs) / 1000) * fps));
};

export const getShotIntroLinearProgress = (
  shot: ShotMotionTiming,
  introDurationMs = SHOT_INTRO_DURATION_MS,
) => clampUnit(getShotElapsedMs(shot) / Math.max(1, introDurationMs));
