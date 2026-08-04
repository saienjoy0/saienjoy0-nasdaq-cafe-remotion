import {Img, interpolate, staticFile} from "remotion";
import type {PublicSceneViewModel} from "../../spec/public-view-model";

export const FoxExpressionLayer: React.FC<{
  fox: PublicSceneViewModel["fox"];
  previousFox: PublicSceneViewModel["previousFox"];
  transitionProgress: number;
}> = ({fox, previousFox, transitionProgress}) => {
  const progress = Math.max(0, Math.min(1, transitionProgress));
  const common: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: fox.fit,
    filter: "drop-shadow(0 14px 18px rgba(0,0,0,.32))",
  };
  return <div style={{position: "absolute", inset: 0, overflow: "visible"}}>
    {previousFox && previousFox.src !== fox.src ? <Img src={staticFile(previousFox.src)} style={{...common, opacity: interpolate(progress, [0, 1], [1, 0])}}/> : null}
    <Img src={staticFile(fox.src)} style={{...common, opacity: previousFox && previousFox.src !== fox.src ? interpolate(progress, [0, 1], [0, 1]) : fox.opacity}}/>
  </div>;
};
