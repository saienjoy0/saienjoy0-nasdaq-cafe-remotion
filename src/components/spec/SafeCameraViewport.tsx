import {interpolate} from "remotion";
import type {PublicShot} from "../../spec/public-view-model";
import {CAMERA_PRESET_TRANSFORMS} from "../../spec/shot-contract";
import {getShotCameraProgress} from "../../spec/shot-motion-contract";

export const SafeCameraViewport: React.FC<{
  shot: PublicShot;
  children: React.ReactNode;
  origin?: string;
  style?: React.CSSProperties;
}> = ({shot, children, origin = "50% 50%", style}) => {
  const preset = CAMERA_PRESET_TRANSFORMS[shot.cameraPreset];
  const progress = getShotCameraProgress(shot);
  return <div data-camera-target={shot.cameraTargetId ?? shot.primaryTargetId ?? "content"} style={{
    position: "relative",
    width: "100%",
    height: "100%",
    transformOrigin: origin,
    transform: `translate(${interpolate(progress, [0, 1], [preset.startX, preset.endX])}px, ${interpolate(progress, [0, 1], [preset.startY, preset.endY])}px) scale(${interpolate(progress, [0, 1], [preset.startScale, preset.endScale])})`,
    ...style,
  }}>{children}</div>;
};
