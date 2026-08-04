import {SHOT_CROSSFADE_MS} from "./shot-contract";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export const getShotTransitionOpacities = (
  elapsedMs: number,
  hasPrevious: boolean,
  hardCut = false,
) => {
  if (!hasPrevious || hardCut) return {previous: 0, current: 1, progress: 1};
  const progress = clamp(elapsedMs / SHOT_CROSSFADE_MS);
  return {
    previous: 1 - progress,
    current: progress,
    progress,
  };
};
