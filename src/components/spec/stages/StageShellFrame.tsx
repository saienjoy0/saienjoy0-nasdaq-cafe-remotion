import type {CSSProperties, ReactNode} from "react";
import {
  getStageTheme,
  getStageThemeId,
  stageThemeCssVariables,
  type StageThemeId,
} from "../../../spec/stage-theme-contract";
import type {StageShellId} from "../../../spec/visual-grammar-contract";

export type StageShellProps = {
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
  themeId?: StageThemeId;
};

type StageShellFrameProps = StageShellProps & {
  shellId: StageShellId;
  background?: string;
  border?: string;
  borderRadius?: number;
  boxShadow?: string;
  ornaments?: ReactNode;
};

export const stagePalette = {
  paper: "var(--stage-surface,#FFFFFF)",
  paperSoft: "var(--stage-surface-strong,#E7EEF4)",
  ink: "var(--stage-text-primary,#102033)",
  secondary: "var(--stage-text-secondary,#314A60)",
  muted: "var(--stage-text-muted,#506A7F)",
  line: "var(--stage-line,#6D8294)",
  cyan: "#078EAE",
  positive: "#087B58",
  negative: "#B63849",
  warning: "#8A5200",
  emphasis: "#5C348F",
  dark: "var(--stage-background,#07111F)",
} as const;

export const StageShellFrame: React.FC<StageShellFrameProps> = ({
  children,
  accent = stagePalette.cyan,
  style,
  shellId,
  themeId = getStageThemeId(shellId),
  background,
  border = "none",
  borderRadius = 0,
  boxShadow = "none",
  ornaments,
}) => {
  const theme = getStageTheme(themeId);
  return <div
    data-stage-shell={shellId}
    data-stage-theme={themeId}
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      color: theme.textPrimary,
      background: background ?? theme.background,
      border,
      borderRadius,
      boxShadow,
      ...stageThemeCssVariables(theme, accent),
      "--stage-shell-radius": `${borderRadius}px`,
      // The production Shot recipes still own content layout. Candidate Stage
      // mode removes only their old generic board and supplies semantic colors.
      "--shot-stage-background": "transparent",
      "--shot-stage-border": "none",
      "--shot-stage-border-radius": "0px",
      "--shot-stage-box-shadow": "none",
    } as CSSProperties}
  >
    {ornaments}
    <div style={{position: "relative", zIndex: 2, width: "100%", height: "100%", boxSizing: "border-box", ...style}}>
      {children}
    </div>
  </div>;
};

export const stageOrnament = (style: CSSProperties) => (
  <div aria-hidden="true" style={{position: "absolute", pointerEvents: "none", zIndex: 1, ...style}}/>
);
