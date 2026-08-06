import type {PublicMainContent, PublicShot} from "../../spec/public-view-model";
import {getStageMotionRoleForShell, type StageMotionRole} from "../../spec/stage-theme-contract";
import {VisualGrammarStageHost, getVisualGrammarStageShellId} from "./VisualGrammarStageHost";
import {VisualTemplateRenderer} from "./VisualTemplateRenderer";
import {ShotTransitionHost} from "./ShotTransitionHost";
import {palette, safeFontSize} from "./StageSafeArea";
import {CausalVisualEventOverlay} from "./shots/CausalVisualEventOverlay";
import {DedicatedShotRenderer} from "./shots/ShotRecipes";

const typographyStyle = (shot: PublicShot): React.CSSProperties => ({
  position: "absolute",
  zIndex: 45,
  left: 64,
  right: 64,
  bottom: 20,
  minHeight: 66,
  display: "flex",
  alignItems: "center",
  justifyContent: shot.typographyTreatment === "zero-line-split" || shot.typographyTreatment === "final-phrase-lock" ? "center" : "flex-start",
  padding: "8px 18px",
  boxSizing: "border-box",
  borderRadius: 12,
  color: shot.typographyTreatment === "gap-highlight" || shot.typographyTreatment === "final-phrase-lock"
    ? palette.warning
    : "var(--stage-typography-text,var(--stage-text-primary,#F7FBFF))",
  background: "var(--stage-typography-background,rgba(5,12,28,.90))",
  border: "1px solid var(--stage-typography-border,rgba(197,215,228,.38))",
  boxShadow: "0 8px 22px rgba(7,17,31,.12)",
  fontSize: safeFontSize(shot.typographyText ?? "", shot.typographyTreatment === "final-phrase-lock" ? 48 : 39, 30, 1190),
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
  <CausalVisualEventOverlay content={content}/>
  <ShotTypography shot={content.shot!}/>
</>;

const clampUnit = (value: number) => Math.max(0, Math.min(1, value));

export const getStageMotionStyle = (
  role: StageMotionRole,
  beatProgress: number,
): React.CSSProperties => {
  const reveal = clampUnit(beatProgress / .11);
  if (role === "major-shift") return {
    opacity: reveal,
    transform: `translateY(${(1 - reveal) * 18}px) scale(${.985 + reveal * .015})`,
  };
  if (role === "return") return {
    opacity: .88 + reveal * .12,
    transform: `translateX(${(1 - reveal) * 12}px)`,
  };
  if (role === "closing") return {
    opacity: reveal,
    transform: `scale(${.965 + reveal * .035})`,
  };
  return {opacity: 1, transform: "none"};
};

export const ShotStageRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  // v2 compatibility remains only for inputs that have no Shot plan.
  if (!content.shot) return <VisualTemplateRenderer content={content}/>;

  const stageShellId = getVisualGrammarStageShellId(
    content.visualTemplate,
    content.templateConfig.variant,
  );
  const stageMotionRole = getStageMotionRoleForShell(stageShellId);

  return <div
    data-stage-motion-role={stageMotionRole}
    style={{position: "absolute", inset: 0, transformOrigin: "50% 50%", ...getStageMotionStyle(stageMotionRole, content.beatProgress)}}
  >
    <VisualGrammarStageHost
      visualTemplate={content.visualTemplate}
      variant={content.templateConfig.variant}
    >
      <ShotTransitionHost content={content} renderShot={renderShot}/>
    </VisualGrammarStageHost>
  </div>;
};
