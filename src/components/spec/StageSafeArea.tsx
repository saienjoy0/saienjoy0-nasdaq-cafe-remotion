export const MAIN_STAGE_WIDTH = 1440;
export const MAIN_STAGE_HEIGHT = 648;
export const STAGE_SAFE_X = 64;
export const STAGE_SAFE_TOP = 48;
export const STAGE_SAFE_BOTTOM = 42;
export const STAGE_LABEL_HEIGHT = 68;
export const STAGE_TYPOGRAPHY_HEIGHT = 92;

export const palette = {
  ink: "#f7fbff",
  dark: "rgba(5,12,28,.94)",
  darkSoft: "rgba(14,31,53,.86)",
  cyan: "#29d7f0",
  positive: "#39d99a",
  negative: "#ff6b7a",
  warning: "#ffc74a",
  neutral: "#8fb7d1",
  emphasis: "#b78cff",
};

export const visibleLength = (value: string) => Array.from(value.replace(/\s+/gu, "")).length;

export const safeFontSize = (value: string, preferred: number, minimum = 28, width = 1180) => {
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
    : `radial-gradient(circle at 70% 25%,${accent}20,transparent 44%),linear-gradient(145deg,${palette.dark},${palette.darkSoft})`;

  return <div style={{
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    // The fallbacks preserve the old Shot surface in legacy mode. A resolved
    // Visual Grammar Stage Shell provides inherited variables that remove this
    // generic board so its physically distinct background and ornaments show.
    borderRadius: "var(--shot-stage-border-radius, 30px)",
    color: palette.ink,
    background: `var(--shot-stage-background, ${legacyBackground})`,
    border: `var(--shot-stage-border, 2px solid ${accent}78)`,
    boxShadow: "var(--shot-stage-box-shadow, 0 24px 58px rgba(0,0,0,.34))",
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
  boxSizing: "border-box",
  ...style,
}}>{children}</div>;

export const StageEyebrow: React.FC<{children: React.ReactNode; tone?: string}> = ({children, tone = palette.neutral}) => <div style={{
  fontSize: 27,
  lineHeight: "34px",
  color: tone,
  fontWeight: 900,
  letterSpacing: ".04em",
}}>{children}</div>;
