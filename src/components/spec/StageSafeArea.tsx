export const MAIN_STAGE_WIDTH = 1440;
export const MAIN_STAGE_HEIGHT = 648;
export const STAGE_SAFE_X = 64;
export const STAGE_SAFE_TOP = 48;
export const STAGE_SAFE_BOTTOM = 42;
export const STAGE_LABEL_HEIGHT = 68;
export const STAGE_TYPOGRAPHY_HEIGHT = 92;

export const palette = {
  ink: "var(--stage-text-primary,#F7FBFF)",
  dark: "var(--stage-surface-strong,rgba(5,12,28,.94))",
  darkSoft: "var(--stage-surface,rgba(14,31,53,.86))",
  cyan: "var(--stage-accent,#29D7F0)",
  positive: "var(--stage-positive,#39D99A)",
  negative: "var(--stage-negative,#FF6B7A)",
  warning: "var(--stage-warning,#FFC74A)",
  neutral: "var(--stage-text-muted,#8FB7D1)",
  emphasis: "var(--stage-emphasis,#B78CFF)",
};

const EXACT_STAGE_VIEWER_LABELS: Record<string, string> = {
  "EXPECTED｜市場が置いていた基準": "予想｜市場の基準",
  "ACTUAL｜実際に出た結果": "実際｜発表された結果",
  "GAP｜市場が反応した差分": "差分｜予想との差",
  EXPECTED: "予想",
  ACTUAL: "実際",
  GAP: "差分",
  実績: "実際",
  差: "差分",
};

const FIXED_UI_JAPANESE: Record<string, string> = {
  EXPECTED: "予想",
  ACTUAL: "実際",
  GAP: "差分",
};

export const localizeStageViewerLabel = (value: string) => {
  for (const [english, japanese] of Object.entries(EXACT_STAGE_VIEWER_LABELS)) {
    if (value.toLocaleUpperCase("en-US") === english.toLocaleUpperCase("en-US")) return japanese;
  }
  const match = /^(expected|actual|gap)(?=$|｜|：|:)/iu.exec(value);
  if (match) {
    const japanese = FIXED_UI_JAPANESE[match[1].toUpperCase()];
    return `${japanese}${value.slice(match[1].length)}`;
  }
  return value;
};

export const visibleLength = (value: string) => Array.from(value.replace(/\s+/gu, "")).length;

export const safeFontSize = (value: string, preferred: number, minimum = 30, width = 1180) => {
  const length = Math.max(1, visibleLength(value));
  const estimated = Math.floor(width / (length * .62));
  return Math.max(minimum, Math.min(preferred, estimated));
};

export const StageShell: React.FC<{
  children: React.ReactNode;
  accent?: string;
  transparent?: boolean;
  style?: React.CSSProperties;
}> = ({children, accent = palette.cyan, transparent = false, style}) => {
  const legacyBackground = transparent
    ? "linear-gradient(145deg,rgba(5,12,28,.38),rgba(14,31,53,.30))"
    : "radial-gradient(circle at 70% 25%,rgba(41,215,240,.14),transparent 44%),linear-gradient(145deg,rgba(5,12,28,.94),rgba(14,31,53,.86))";

  return <div style={{
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    overflowWrap: "anywhere",
    wordBreak: "normal",
    boxSizing: "border-box",
    borderRadius: "var(--shot-stage-border-radius,30px)",
    color: palette.ink,
    background: `var(--shot-stage-background,${legacyBackground})`,
    border: `var(--shot-stage-border,2px solid ${accent})`,
    boxShadow: "var(--shot-stage-box-shadow,0 24px 58px rgba(0,0,0,.34))",
    ...style,
  }}>{children}</div>;
};

export const SafeContent: React.FC<{
  children: React.ReactNode;
  reserveTypography?: boolean;
  style?: React.CSSProperties;
}> = ({children, reserveTypography = false, style}) => <div style={{
  position: "absolute",
  left: STAGE_SAFE_X,
  right: STAGE_SAFE_X,
  top: STAGE_SAFE_TOP,
  bottom: reserveTypography ? STAGE_SAFE_BOTTOM + STAGE_TYPOGRAPHY_HEIGHT : STAGE_SAFE_BOTTOM,
  overflow: "hidden",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
  ...style,
}}>{children}</div>;

export const StageEyebrow: React.FC<{children: React.ReactNode; tone?: string}> = ({children, tone = palette.neutral}) => {
  const viewerLabel = typeof children === "string" ? localizeStageViewerLabel(children) : children;
  return <div style={{
    fontSize: 29,
    lineHeight: "36px",
    color: tone,
    fontWeight: 900,
    letterSpacing: ".035em",
  }}>{viewerLabel}</div>;
};
