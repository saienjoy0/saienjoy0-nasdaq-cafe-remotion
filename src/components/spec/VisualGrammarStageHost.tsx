import type {CSSProperties, ReactNode} from "react";
import type {VisualTemplateId, VisualTemplateVariant} from "../../spec/visual-template-contract";
import {getVisualGrammarAppearance, type StageShellId} from "../../spec/visual-grammar-contract";
import {AssemblyStage} from "./stages/AssemblyStage";
import {CausalPathStage} from "./stages/CausalPathStage";
import {DocumentMediaStage} from "./stages/DocumentMediaStage";
import {DualLaneStage} from "./stages/DualLaneStage";
import {EntityStage} from "./stages/EntityStage";
import {MatrixStage} from "./stages/MatrixStage";
import {MetricBoardStage} from "./stages/MetricBoardStage";
import {OpenHeroStage} from "./stages/OpenHeroStage";
import {PictureBookStage} from "./stages/PictureBookStage";
import {ProgressiveChartStage} from "./stages/ProgressiveChartStage";
import {SplitComparisonStage} from "./stages/SplitComparisonStage";
import type {StageShellProps} from "./stages/StageShellFrame";
import {TextBridgeStage} from "./stages/TextBridgeStage";
import {TimelineStage} from "./stages/TimelineStage";
import {VerificationGateStage} from "./stages/VerificationGateStage";

const STAGE_SHELL_COMPONENTS: Record<StageShellId, React.FC<StageShellProps>> = {
  OpenHeroStage,
  EntityStage,
  DocumentMediaStage,
  MetricBoardStage,
  ProgressiveChartStage,
  CausalPathStage,
  DualLaneStage,
  TimelineStage,
  SplitComparisonStage,
  MatrixStage,
  VerificationGateStage,
  PictureBookStage,
  AssemblyStage,
  TextBridgeStage,
};

export const getVisualGrammarStageShellId = (
  visualTemplate: VisualTemplateId,
  variant: VisualTemplateVariant,
): StageShellId => getVisualGrammarAppearance(visualTemplate, variant).stageShell;

export const VISUAL_GRAMMAR_STAGE_SHELL_IDS = Object.freeze(
  Object.keys(STAGE_SHELL_COMPONENTS) as StageShellId[],
);

export const VisualGrammarStageHost: React.FC<{
  visualTemplate: VisualTemplateId;
  variant: VisualTemplateVariant;
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
}> = ({visualTemplate, variant, children, accent, style}) => {
  const stageShellId = getVisualGrammarStageShellId(visualTemplate, variant);
  const StageShell = STAGE_SHELL_COMPONENTS[stageShellId];
  return <StageShell accent={accent} style={style}>{children}</StageShell>;
};
