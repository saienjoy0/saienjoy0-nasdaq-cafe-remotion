import {spring, useVideoConfig} from "remotion";
import type {PublicShot} from "../../../spec/public-view-model";
import {
  getShotIntroDurationInFrames,
  getShotIntroFrame,
  getShotIntroLinearProgress,
} from "../../../spec/shot-motion-contract";

export const useShotMotion = (shot: PublicShot) => {
  const {fps} = useVideoConfig();
  const introProgress = spring({
    fps,
    frame: getShotIntroFrame(shot, fps),
    durationInFrames: getShotIntroDurationInFrames(shot, fps),
    config: {
      damping: 24,
      stiffness: 150,
      mass: 0.78,
      overshootClamping: true,
    },
  });

  return {
    introProgress,
    introLinearProgress: getShotIntroLinearProgress(shot),
  };
};
