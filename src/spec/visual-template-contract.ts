export const VISUAL_TEMPLATE_IDS = [
  "opening-contradiction",
  "closing-recap",
  "conclusion-card",
  "expected-actual-bullet",
  "expected-actual-gap-flow",
  "metric-comparison-board",
  "index-return-bars",
  "diverging-stock-bars",
  "causal-lane",
  "tailwind-headwind",
  "evidence-boundary",
  "verification-checklist",
  "verification-matrix",
  "analogy-steps",
  "entity-card-full",
  "news-media",
  "text-focus",
] as const;

export const VISUAL_TEMPLATE_VARIANT_IDS = [
  "default",
  "left-to-right",
  "zero-baseline",
  "center-zero",
  "two-lane",
  "confirmed-vs-unconfirmed",
  "strengthen-vs-weaken",
  "prebuilt-card",
] as const;

export type VisualTemplateId = typeof VISUAL_TEMPLATE_IDS[number];
export type VisualTemplateVariant = typeof VISUAL_TEMPLATE_VARIANT_IDS[number];
export type TemplateScreenState = "Data" | "Chart" | "EntityFocus" | "MainWithEntity" | "PictureBook" | "News";

type CountRange = {min: number; max: number};
export type VisualTemplateContract = {
  family: string;
  supportedScreenStates: readonly TemplateScreenState[];
  variants: readonly VisualTemplateVariant[];
  cards: CountRange;
  numbers: CountRange;
  nodes: CountRange;
  arrows: CountRange;
  requiresNumericValue: boolean;
};

const range = (min: number, max: number): CountRange => ({min, max});

export const VISUAL_TEMPLATE_CONTRACTS: Record<VisualTemplateId, VisualTemplateContract> = {
  "opening-contradiction": {family: "opening", supportedScreenStates: ["Data", "Chart"], variants: ["default"], cards: range(0, 1), numbers: range(0, 4), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "closing-recap": {family: "closing", supportedScreenStates: ["Data"], variants: ["default"], cards: range(0, 1), numbers: range(0, 3), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "conclusion-card": {family: "conclusion", supportedScreenStates: ["Data"], variants: ["default"], cards: range(1, 1), numbers: range(0, 0), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "expected-actual-bullet": {family: "expected-actual", supportedScreenStates: ["Data", "Chart"], variants: ["default", "zero-baseline"], cards: range(0, 1), numbers: range(1, 2), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},
  "expected-actual-gap-flow": {family: "expected-actual", supportedScreenStates: ["Data", "Chart"], variants: ["default", "left-to-right"], cards: range(3, 3), numbers: range(0, 3), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "metric-comparison-board": {family: "metrics", supportedScreenStates: ["Data", "Chart"], variants: ["default"], cards: range(0, 0), numbers: range(1, 4), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "index-return-bars": {family: "bars", supportedScreenStates: ["Data", "Chart"], variants: ["zero-baseline"], cards: range(0, 0), numbers: range(2, 6), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},
  "diverging-stock-bars": {family: "bars", supportedScreenStates: ["Data", "Chart"], variants: ["center-zero"], cards: range(0, 0), numbers: range(2, 6), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},
  "causal-lane": {family: "causal", supportedScreenStates: ["Data", "Chart", "MainWithEntity"], variants: ["left-to-right"], cards: range(0, 0), numbers: range(0, 1), nodes: range(2, 4), arrows: range(1, 3), requiresNumericValue: false},
  "tailwind-headwind": {family: "forces", supportedScreenStates: ["Data", "Chart"], variants: ["two-lane"], cards: range(0, 4), numbers: range(0, 2), nodes: range(0, 4), arrows: range(0, 2), requiresNumericValue: false},
  "evidence-boundary": {family: "evidence", supportedScreenStates: ["Data"], variants: ["confirmed-vs-unconfirmed"], cards: range(2, 4), numbers: range(0, 2), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "verification-checklist": {family: "verification", supportedScreenStates: ["Data"], variants: ["default"], cards: range(1, 4), numbers: range(0, 0), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "verification-matrix": {family: "verification", supportedScreenStates: ["Data"], variants: ["strengthen-vs-weaken"], cards: range(2, 4), numbers: range(0, 0), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "analogy-steps": {family: "analogy", supportedScreenStates: ["Data", "PictureBook"], variants: ["default"], cards: range(0, 3), numbers: range(0, 0), nodes: range(0, 4), arrows: range(0, 3), requiresNumericValue: false},
  "entity-card-full": {family: "entity", supportedScreenStates: ["EntityFocus", "MainWithEntity"], variants: ["prebuilt-card", "default"], cards: range(0, 1), numbers: range(0, 2), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "news-media": {family: "media", supportedScreenStates: ["News"], variants: ["default"], cards: range(0, 1), numbers: range(0, 0), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
  "text-focus": {family: "text", supportedScreenStates: ["Data"], variants: ["default"], cards: range(0, 1), numbers: range(0, 1), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},
};
