import type {RenderSpec} from "./render-spec";
import type {EvidenceCapability} from "./visual-director-contract";
import {
  getVisualGrammarAppearance,
  getVisualGrammarCompatibility,
  type AppearanceClass,
  type DominantSurface,
  type MotionLanguageId,
  type StageShellId,
  type VisualGrammarId,
} from "./visual-grammar-contract";
import {
  VISUAL_TEMPLATE_CONTRACTS,
  VISUAL_TEMPLATE_IDS,
  type TemplateScreenState,
  type VisualTemplateContract,
  type VisualTemplateId,
  type VisualTemplateVariant,
} from "./visual-template-contract";

type Beat = RenderSpec["scenes"][number]["visualBeats"][number];
export type VisualMode = Beat["visualMode"];

export type VisualEligibilityRuleId =
  | "source-bound"
  | "single-main-media"
  | "aligned-comparison"
  | "verified-intraday-series"
  | "gap-structure"
  | "entity-bound"
  | "causal-graph-complete"
  | "verification-bilateral"
  | "assembly-existing-only"
  | "numeric-values-present";

export type VisualComponentStatus = "experimental" | "production" | "deprecated";

export type VisualComponentDescriptor = {
  id: VisualTemplateId;
  version: "1.0.0";
  status: VisualComponentStatus;
  family: string;
  allowedGrammarIds: readonly VisualGrammarId[];
  capabilities: readonly EvidenceCapability[];
  eligibilityRuleIds: readonly VisualEligibilityRuleId[];
  supportedScreenStates: readonly TemplateScreenState[];
  variants: readonly VisualTemplateVariant[];
  defaultVariant: VisualTemplateVariant;
  visualMode: VisualMode;
  inventory: VisualTemplateContract;
  appearance: {
    appearanceClass: AppearanceClass;
    dominantSurface: DominantSurface;
    stageShell: StageShellId;
    motionLanguage: MotionLanguageId;
  };
  realityAnchor: boolean;
  compatibleAlternativeTemplateIds: VisualTemplateId[];
};

const DEFAULT_VARIANT_BY_TEMPLATE: Record<VisualTemplateId, VisualTemplateVariant> = {
  "opening-contradiction": "default",
  "market-pulse-grid": "grid",
  "earnings-surprise": "zero-baseline",
  "dual-asset-split": "center-zero",
  "macro-pressure": "left-to-right",
  "source-receipt": "receipt",
  "hero-number": "default",
  "closing-recap": "default",
  "final-assembly": "default",
  "conclusion-card": "default",
  "expected-actual-bullet": "zero-baseline",
  "expected-actual-gap-flow": "left-to-right",
  "metric-comparison-board": "default",
  "index-return-bars": "zero-baseline",
  "diverging-stock-bars": "center-zero",
  "split-comparison": "two-lane",
  "focus-matrix": "default",
  "causal-lane": "left-to-right",
  "tailwind-headwind": "two-lane",
  "evidence-boundary": "confirmed-vs-unconfirmed",
  "verification-checklist": "default",
  "verification-matrix": "strengthen-vs-weaken",
  "analogy-steps": "default",
  "entity-card-full": "default",
  "news-media": "default",
  "event-reaction-timeline": "verified-series",
  "text-focus": "default",
};

const VISUAL_MODE_BY_TEMPLATE: Record<VisualTemplateId, VisualMode> = {
  "opening-contradiction": "conclusion-card",
  "market-pulse-grid": "number-comparison",
  "earnings-surprise": "expected-actual-gap",
  "dual-asset-split": "stock-comparison",
  "macro-pressure": "causal-diagram",
  "source-receipt": "text-focus",
  "hero-number": "text-focus",
  "closing-recap": "conclusion-card",
  "final-assembly": "conclusion-card",
  "conclusion-card": "conclusion-card",
  "expected-actual-bullet": "expected-actual-gap",
  "expected-actual-gap-flow": "expected-actual-gap",
  "metric-comparison-board": "number-comparison",
  "index-return-bars": "stock-comparison",
  "diverging-stock-bars": "stock-comparison",
  "split-comparison": "stock-comparison",
  "focus-matrix": "stock-comparison",
  "causal-lane": "causal-diagram",
  "tailwind-headwind": "causal-diagram",
  "evidence-boundary": "verification-points",
  "verification-checklist": "verification-points",
  "verification-matrix": "verification-points",
  "analogy-steps": "causal-diagram",
  "entity-card-full": "text-focus",
  "news-media": "news-media",
  "event-reaction-timeline": "timeline",
  "text-focus": "text-focus",
};

const PRIMARY_CAPABILITY_BY_TEMPLATE: Record<VisualTemplateId, EvidenceCapability> = {
  "opening-contradiction": "text-only",
  "market-pulse-grid": "comparison-set",
  "earnings-surprise": "gap",
  "dual-asset-split": "comparison-set",
  "macro-pressure": "causal-graph",
  "source-receipt": "source-document",
  "hero-number": "text-only",
  "closing-recap": "text-only",
  "final-assembly": "text-only",
  "conclusion-card": "text-only",
  "expected-actual-bullet": "gap",
  "expected-actual-gap-flow": "gap",
  "metric-comparison-board": "text-only",
  "index-return-bars": "comparison-set",
  "diverging-stock-bars": "comparison-set",
  "split-comparison": "comparison-set",
  "focus-matrix": "comparison-set",
  "causal-lane": "causal-graph",
  "tailwind-headwind": "causal-graph",
  "evidence-boundary": "verification",
  "verification-checklist": "verification",
  "verification-matrix": "verification",
  "analogy-steps": "image-media",
  "entity-card-full": "entity",
  "news-media": "source-document",
  "event-reaction-timeline": "time-series",
  "text-focus": "text-only",
};

const EXTRA_CAPABILITIES_BY_TEMPLATE: Partial<Record<VisualTemplateId, readonly EvidenceCapability[]>> = {
  "source-receipt": ["quote-social", "image-media"],
  "hero-number": ["entity"],
  "metric-comparison-board": ["comparison-set"],
  "tailwind-headwind": ["verification"],
  "evidence-boundary": ["causal-graph"],
  "news-media": ["quote-social", "image-media"],
};

const RULES_BY_TEMPLATE: Partial<Record<VisualTemplateId, readonly VisualEligibilityRuleId[]>> = {
  "source-receipt": ["source-bound"],
  "news-media": ["source-bound", "single-main-media"],
  "event-reaction-timeline": ["verified-intraday-series"],
  "market-pulse-grid": ["aligned-comparison", "numeric-values-present"],
  "dual-asset-split": ["aligned-comparison", "numeric-values-present"],
  "index-return-bars": ["aligned-comparison", "numeric-values-present"],
  "diverging-stock-bars": ["aligned-comparison", "numeric-values-present"],
  "split-comparison": ["aligned-comparison", "numeric-values-present"],
  "focus-matrix": ["aligned-comparison", "numeric-values-present"],
  "expected-actual-bullet": ["numeric-values-present"],
  "entity-card-full": ["entity-bound", "single-main-media"],
  "macro-pressure": ["causal-graph-complete"],
  "causal-lane": ["causal-graph-complete"],
};

const realityCapabilities = new Set<EvidenceCapability>([
  "source-document",
  "quote-social",
  "time-series",
  "entity",
  "image-media",
]);

const unique = <T,>(values: readonly T[]) => [...new Set(values)];

const registry = Object.fromEntries(VISUAL_TEMPLATE_IDS.map((id) => {
  const compatibility = getVisualGrammarCompatibility(id);
  const defaultVariant = DEFAULT_VARIANT_BY_TEMPLATE[id];
  const appearance = getVisualGrammarAppearance(id, defaultVariant);
  const primaryCapability = PRIMARY_CAPABILITY_BY_TEMPLATE[id];
  const capabilities = unique([
    primaryCapability,
    ...(EXTRA_CAPABILITIES_BY_TEMPLATE[id] ?? []),
  ]).sort();
  const descriptor: VisualComponentDescriptor = {
    id,
    version: "1.0.0",
    status: "production",
    family: VISUAL_TEMPLATE_CONTRACTS[id].family,
    allowedGrammarIds: compatibility.allowedGrammarIds,
    capabilities,
    eligibilityRuleIds: RULES_BY_TEMPLATE[id] ?? [],
    supportedScreenStates: VISUAL_TEMPLATE_CONTRACTS[id].supportedScreenStates,
    variants: VISUAL_TEMPLATE_CONTRACTS[id].variants,
    defaultVariant,
    visualMode: VISUAL_MODE_BY_TEMPLATE[id],
    inventory: VISUAL_TEMPLATE_CONTRACTS[id],
    appearance,
    realityAnchor: realityCapabilities.has(primaryCapability) && id !== "analogy-steps",
    compatibleAlternativeTemplateIds: [],
  };
  return [id, descriptor] as const;
})) as Record<VisualTemplateId, VisualComponentDescriptor>;

for (const id of VISUAL_TEMPLATE_IDS) {
  const descriptor = registry[id];
  const capabilities = new Set(descriptor.capabilities);
  descriptor.compatibleAlternativeTemplateIds = VISUAL_TEMPLATE_IDS.filter((candidateId) => {
    if (candidateId === id) return false;
    const candidate = registry[candidateId];
    return candidate.capabilities.some((capability) => capabilities.has(capability));
  });
}

export const VISUAL_COMPONENT_REGISTRY = registry;

export const getVisualComponentDescriptor = (template: VisualTemplateId) =>
  VISUAL_COMPONENT_REGISTRY[template];

export const candidateTemplatesForCapability = (capability: EvidenceCapability) =>
  VISUAL_TEMPLATE_IDS.filter((id) => VISUAL_COMPONENT_REGISTRY[id].capabilities.includes(capability));

export const primaryCapabilityForTemplate = (template: VisualTemplateId): EvidenceCapability =>
  PRIMARY_CAPABILITY_BY_TEMPLATE[template];

export const defaultVariantForTemplate = (template: VisualTemplateId) =>
  VISUAL_COMPONENT_REGISTRY[template].defaultVariant;

export const visualModeForTemplate = (template: VisualTemplateId) =>
  VISUAL_COMPONENT_REGISTRY[template].visualMode;
