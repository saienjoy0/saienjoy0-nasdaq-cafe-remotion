import type {PublicMainContent} from "../../spec/public-view-model";
import {resolveSemanticShotTransition} from "../../spec/shot-semantic-transition-contract";
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
  const effectiveTransition = resolveSemanticShotTransition(content, previousShot, shot);
  const transition = getShotTransitionOpacities(
    elapsedMs,
    previousShot !== null,
    effectiveTransition,
  );
  const effectiveShot = effectiveTransition === shot.transitionIn
    ? shot
    : {...shot, transitionIn: effectiveTransition};
  const currentContent = effectiveShot === shot ? content : {...content, shot: effectiveShot};
  const previousContent = previousShot
    ? {...content, shot: {...previousShot, progress: 1}, previousShot: null, nextShot: effectiveShot}
    : null;
  return <div data-effective-transition={effectiveTransition} style={{position: "absolute", inset: 0, overflow: "hidden", borderRadius: "var(--stage-shell-radius,0px)"}}>
    {previousContent && transition.previous > 0 ? <div data-shot-layer="previous" style={{position: "absolute", inset: 0, opacity: transition.previous}}>{renderShot(previousContent)}</div> : null}
    <div data-shot-layer="current" style={{position: "absolute", inset: 0, opacity: transition.current}}>{renderShot(currentContent)}</div>
    {previousShot && effectiveTransition === "reframe-shared-element" ? <SharedElementLayer content={currentContent} previousShot={previousShot} currentShot={effectiveShot} progress={transition.sharedProgress}/> : null}
  </div>;
};
