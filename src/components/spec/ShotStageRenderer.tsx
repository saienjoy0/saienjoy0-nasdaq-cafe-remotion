import type {PublicMainContent, PublicShot} from "../../spec/public-view-model";
import {VisualTemplateRenderer} from "./VisualTemplateRenderer";
import {ShotTransitionHost} from "./ShotTransitionHost";
import {palette, safeFontSize} from "./StageSafeArea";
import {DedicatedShotRenderer} from "./shots/ShotRecipes";

const typographyStyle = (shot: PublicShot): React.CSSProperties => ({
  position: "absolute",
  zIndex: 45,
  left: 64,
  right: 64,
  bottom: 24,
  minHeight: 68,
  display: "flex",
  alignItems: "center",
  justifyContent: shot.typographyTreatment === "zero-line-split" || shot.typographyTreatment === "final-phrase-lock" ? "center" : "flex-start",
  padding: "8px 18px",
  boxSizing: "border-box",
  borderRadius: 16,
  color: shot.typographyTreatment === "gap-highlight" || shot.typographyTreatment === "final-phrase-lock" ? palette.warning : palette.ink,
  background: "rgba(5,12,28,.90)",
  border: `2px solid ${shot.typographyTreatment === "gap-highlight" ? palette.emphasis : palette.cyan}88`,
  fontSize: safeFontSize(shot.typographyText ?? "", shot.typographyTreatment === "final-phrase-lock" ? 48 : 39, 27, 1190),
  lineHeight: 1.12,
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
});

const ShotTypography: React.FC<{shot: PublicShot}> = ({shot}) => shot.typographyTreatment && shot.typographyText
  ? <div data-kinetic-typography={shot.typographyTreatment} style={typographyStyle(shot)}>{shot.typographyText}</div>
  : null;

const renderShot = (content: PublicMainContent) => <>
  <DedicatedShotRenderer content={content}/>
  <ShotTypography shot={content.shot!}/>
</>;

export const ShotStageRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  // v2 compatibility remains only for inputs that have no Shot plan.
  if (!content.shot) return <VisualTemplateRenderer content={content}/>;
  return <ShotTransitionHost content={content} renderShot={renderShot}/>;
};
