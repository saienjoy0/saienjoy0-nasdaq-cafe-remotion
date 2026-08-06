import type {CSSProperties, ReactNode} from "react";

export type StageShellProps = {
  children: ReactNode;
  accent?: string;
  style?: CSSProperties;
};

type StageShellFrameProps = StageShellProps & {
  shellId: string;
  background: string;
  border?: string;
  borderRadius?: number;
  boxShadow?: string;
  ornaments?: ReactNode;
};

export const stagePalette = {
  paper: "rgba(248,251,253,.97)",
  paperSoft: "rgba(228,239,246,.96)",
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  emphasis: "#7046a8",
  dark: "#101923",
} as const;

export const StageShellFrame: React.FC<StageShellFrameProps> = ({
  children,
  accent = stagePalette.cyan,
  style,
  shellId,
  background,
  border = "none",
  borderRadius = 0,
  boxShadow = "none",
  ornaments,
}) => (
  <div
    data-stage-shell={shellId}
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
      color: stagePalette.ink,
      background,
      border,
      borderRadius,
      boxShadow,
      "--stage-accent": accent,
    } as CSSProperties}
  >
    {ornaments}
    <div style={{position: "relative", zIndex: 2, width: "100%", height: "100%", boxSizing: "border-box", ...style}}>
      {children}
    </div>
  </div>
);

export const stageOrnament = (style: CSSProperties) => (
  <div aria-hidden="true" style={{position: "absolute", pointerEvents: "none", zIndex: 1, ...style}}/>
);
