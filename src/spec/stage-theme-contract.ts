import type {CSSProperties} from "react";
import type {StageShellId, TransitionRole, VisualGrammarId} from "./visual-grammar-contract";

export const STAGE_THEME_IDS = [
  "dark-hero",
  "evidence-paper",
  "gap-rail",
  "open-causal",
  "split-comparison",
  "verification-gate",
  "closing",
] as const;

export type StageThemeId = (typeof STAGE_THEME_IDS)[number];
export type StageChromeMode = "full" | "minimal" | "none";

export type StageTheme = {
  id: StageThemeId;
  background: string;
  surface: string;
  surfaceStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  line: string;
  positive: string;
  negative: string;
  warning: string;
  emphasis: string;
  typographyBackground: string;
  typographyText: string;
  typographyBorder: string;
};

const darkBase = {
  textPrimary: "#F7FBFF",
  textSecondary: "#D5E3EE",
  textMuted: "#AFC4D3",
  line: "#5C7890",
  positive: "#55E0A7",
  negative: "#FF7D8A",
  warning: "#FFD166",
  emphasis: "#C5A5FF",
  typographyBackground: "rgba(7,17,31,.78)",
  typographyText: "#F7FBFF",
  typographyBorder: "rgba(197,215,228,.38)",
} as const;

const lightBase = {
  textPrimary: "#102033",
  textSecondary: "#314A60",
  textMuted: "#506A7F",
  line: "#6D8294",
  positive: "#087B58",
  negative: "#B63849",
  warning: "#8A5200",
  emphasis: "#5C348F",
  typographyBackground: "rgba(255,255,255,.90)",
  typographyText: "#102033",
  typographyBorder: "rgba(49,74,96,.34)",
} as const;

export const STAGE_THEMES: Record<StageThemeId, StageTheme> = {
  "dark-hero": {
    id: "dark-hero",
    background: "#07111F",
    surface: "#0E1B2D",
    surfaceStrong: "#13243A",
    ...darkBase,
  },
  "evidence-paper": {
    id: "evidence-paper",
    background: "#F4F7FA",
    surface: "#FFFFFF",
    surfaceStrong: "#E7EEF4",
    ...lightBase,
  },
  "gap-rail": {
    id: "gap-rail",
    background: "#F1F5F8",
    surface: "#FFFFFF",
    surfaceStrong: "#DEE8F0",
    ...lightBase,
  },
  "open-causal": {
    id: "open-causal",
    background: "#EAF2F7",
    surface: "rgba(255,255,255,.72)",
    surfaceStrong: "#D8E6EF",
    ...lightBase,
  },
  "split-comparison": {
    id: "split-comparison",
    background: "#F6F8FA",
    surface: "#FFFFFF",
    surfaceStrong: "#E5ECF2",
    ...lightBase,
  },
  "verification-gate": {
    id: "verification-gate",
    background: "#F2F6F8",
    surface: "#FFFFFF",
    surfaceStrong: "#E2EBF0",
    ...lightBase,
  },
  closing: {
    id: "closing",
    background: "#081421",
    surface: "#102237",
    surfaceStrong: "#17314B",
    ...darkBase,
  },
};

const SHELL_THEME_IDS: Record<StageShellId, StageThemeId> = {
  OpenHeroStage: "dark-hero",
  EntityStage: "evidence-paper",
  DocumentMediaStage: "evidence-paper",
  MetricBoardStage: "evidence-paper",
  ProgressiveChartStage: "gap-rail",
  CausalPathStage: "open-causal",
  DualLaneStage: "split-comparison",
  TimelineStage: "evidence-paper",
  SplitComparisonStage: "split-comparison",
  MatrixStage: "verification-gate",
  VerificationGateStage: "verification-gate",
  PictureBookStage: "evidence-paper",
  AssemblyStage: "closing",
  TextBridgeStage: "closing",
};

export const getStageThemeId = (shellId: StageShellId): StageThemeId => SHELL_THEME_IDS[shellId];
export const getStageTheme = (themeId: StageThemeId): StageTheme => STAGE_THEMES[themeId];

export const getStageChromeMode = (
  grammarId: VisualGrammarId,
  transitionRole: TransitionRole,
): StageChromeMode => {
  if (transitionRole === "closing" || grammarId === "assembly" || grammarId === "bridge-text") return "none";
  if (["causal", "comparison", "verification", "gap", "reaction"].includes(grammarId)) return "none";
  if (grammarId === "contradiction") return "full";
  return "minimal";
};

const parseHex = (value: string) => {
  const match = /^#([a-f\d]{6})$/iu.exec(value);
  if (!match) throw new Error(`Stage contrast colors must be six-digit hex values: ${value}`);
  return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16) / 255);
};

const channelLuminance = (value: number) => value <= .04045
  ? value / 12.92
  : ((value + .055) / 1.055) ** 2.4;

export const getContrastRatio = (foreground: string, background: string) => {
  const [fr, fg, fb] = parseHex(foreground).map(channelLuminance);
  const [br, bg, bb] = parseHex(background).map(channelLuminance);
  const foregroundLuminance = .2126 * fr + .7152 * fg + .0722 * fb;
  const backgroundLuminance = .2126 * br + .7152 * bg + .0722 * bb;
  return (Math.max(foregroundLuminance, backgroundLuminance) + .05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + .05);
};

export const validateStageThemeContrast = (theme: StageTheme) => {
  const checks = [
    {name: "primary text", ratio: getContrastRatio(theme.textPrimary, theme.background), minimum: 4.5},
    {name: "secondary text", ratio: getContrastRatio(theme.textSecondary, theme.background), minimum: 4.5},
    {name: "muted text", ratio: getContrastRatio(theme.textMuted, theme.background), minimum: 4.5},
    {name: "meaningful line", ratio: getContrastRatio(theme.line, theme.background), minimum: 3},
  ];
  return checks.filter((check) => check.ratio < check.minimum);
};

export const stageThemeCssVariables = (theme: StageTheme, accent: string): CSSProperties => ({
  "--stage-background": theme.background,
  "--stage-surface": theme.surface,
  "--stage-surface-strong": theme.surfaceStrong,
  "--stage-text-primary": theme.textPrimary,
  "--stage-text-secondary": theme.textSecondary,
  "--stage-text-muted": theme.textMuted,
  "--stage-line": theme.line,
  "--stage-positive": theme.positive,
  "--stage-negative": theme.negative,
  "--stage-warning": theme.warning,
  "--stage-emphasis": theme.emphasis,
  "--stage-accent": accent,
  "--stage-typography-background": theme.typographyBackground,
  "--stage-typography-text": theme.typographyText,
  "--stage-typography-border": theme.typographyBorder,
} as CSSProperties);
