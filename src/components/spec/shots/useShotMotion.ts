import {spring, useVideoConfig} from "remotion";
import type {PublicShot} from "../../../spec/public-view-model";
import {
  getShotBuildLinearProgress,
  getShotCameraProgress,
  getShotIntroDurationInFrames,
  getShotIntroFrame,
  getShotIntroLinearProgress,
  getShotMotionProfile,
  getShotNarrationFocusIndex,
  getShotStaggerProgress,
} from "../../../spec/shot-motion-contract";
import {shotTransitionUsesLayerFade} from "../../../spec/shot-transition-contract";

export const useShotMotion = (shot: PublicShot) => {
  const {fps} = useVideoConfig();
  const profile = getShotMotionProfile(shot.shotRecipe);
  const introProgress = spring({
    fps,
    frame: getShotIntroFrame(shot, fps, profile.enterMs, profile.holdMinMs),
    durationInFrames: getShotIntroDurationInFrames(shot, fps, profile.enterMs, profile.holdMinMs),
    config: {
      damping: 28,
      stiffness: 210,
      mass: 0.68,
      overshootClamping: true,
    },
  });
  const introLinearProgress = getShotIntroLinearProgress(
    shot,
    profile.enterMs,
    profile.holdMinMs,
  );

  return {
    profile,
    introProgress,
    introLinearProgress,
    introOpacity: shotTransitionUsesLayerFade(shot.transitionIn) ? 1 : introLinearProgress,
    buildProgress: getShotBuildLinearProgress(shot, profile.buildMs, profile.holdMinMs),
    cameraProgress: getShotCameraProgress(shot),
    staggerProgress: (index: number, itemCount: number) =>
      getShotStaggerProgress(shot, index, itemCount, profile),
    narrationFocusIndex: (itemCount: number) =>
      getShotNarrationFocusIndex(shot, itemCount, profile),
  };
};
