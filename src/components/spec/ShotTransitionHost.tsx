import type {PublicMainContent} from "../../spec/public-view-model";
import {getShotTransitionOpacities} from "../../spec/shot-transition-contract";
import {SharedElementLayer} from "./SharedElementLayer";

// PreviousShot and CurrentShot are rendered as simultaneous transition layers.
export const ShotTransitionHost: React.FC<{
  content: PublicMainContent;
  renderShot: (content: PublicMainContent) => React.ReactNode;
}> = ({content, renderShot}) => {
  const shot = content.shot;
  if (!shot) return null;
  const previousShot = content.previousShot;
  const elapsedMs = Math.max(0, content.sceneTimeMs - shot.startMs);
  const transition = getShotTransitionOpacities(
    elapsedMs,
    previousShot !== null,
    shot.transitionIn,
  );
  const previousContent = previousShot
    ? {...content, shot: {...previousShot, progress: 1}, previousShot: null, nextShot: shot}
    : null;
  return <div style={{position: "absolute", inset: 0, overflow: "hidden", borderRadius: 30}}>
    {previousContent && transition.previous > 0 ? <div data-shot-layer="previous" style={{position: "absolute", inset: 0, opacity: transition.previous}}>{renderShot(previousContent)}</div> : null}
    <div data-shot-layer="current" style={{position: "absolute", inset: 0, opacity: transition.current}}>{renderShot(content)}</div>
    {previousShot ? <SharedElementLayer content={content} previousShot={previousShot} currentShot={shot} progress={transition.sharedProgress}/> : null}
  </div>;
};
