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
  "source-receipt": "news-media",
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

const PRIMARY_CAPABILITY_BY_TEMPLATE: Partial<Record<VisualTemplateId, EvidenceCapability>> = {
  "source-receipt": "source-document",
  "news-media": "source-document",
  "event-reaction-timeline": "time-series",
  "index-return-bars": "comparison-set",
  "diverging-stock-bars": "comparison-set",
  "split-comparison": "comparison-set",
  "focus-matrix": "comparison-set",
  "expected-actual-bullet": "gap",
  "expected-actual-gap-flow": "gap",
  "earnings-surprise": "gap",
  "causal-lane": "causal-graph",
  "macro-pressure": "causal-graph",
  "tailwind-headwind": "causal-graph",
  "entity-card-full": "entity",
  "analogy-steps": "image-media",
  "verification-checklist": "verification",
  "verification-matrix": "verification",
  "evidence-boundary": "verification",
};

const DISCOVERY_TEMPLATES_BY_CAPABILITY: Record<EvidenceCapability, readonly VisualTemplateId[]> = {
  "source-document": ["source-receipt", "news-media"],
  "quote-social": ["source-receipt", "news-media"],
  "time-series": ["event-reaction-timeline"],
  "comparison-set": ["index-return-bars", "diverging-stock-bars", "split-comparison", "focus-matrix"],
  gap: ["expected-actual-bullet", "expected-actual-gap-flow"],
  "causal-graph": ["causal-lane", "tailwind-headwind", "evidence-boundary"],
  entity: ["entity-card-full", "hero-number"],
  "image-media": ["news-media", "source-receipt"],
  verification: ["verification-checklist", "verification-matrix", "evidence-boundary"],
  "text-only": ["hero-number", "text-focus", "conclusion-card"],
};

const RULES_BY_TEMPLATE: Partial<Record<VisualTemplateId, readonly VisualEligibilityRuleId[]>> = {
  "source-receipt": ["source-bound", "single-main-media"],
  "news-media": ["source-bound", "single-main-media"],
  "event-reaction-timeline": ["verified-intraday-series"],
  "index-return-bars": ["aligned-comparison", "numeric-values-present"],
  "diverging-stock-bars": ["aligned-comparison", "numeric-values-present"],
  "split-comparison": ["aligned-comparison", "numeric-values-present"],
  "focus-matrix": ["aligned-comparison", "numeric-values-present"],
  "expected-actual-bullet": ["numeric-values-present"],
  "entity-card-full": ["entity-bound", "single-main-media"],
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

const capabilitiesForTemplate = (template: VisualTemplateId): EvidenceCapability[] => {
  const discovery = (Object.entries(DISCOVERY_TEMPLATES_BY_CAPABILITY) as Array<[
    EvidenceCapability,
    readonly VisualTemplateId[],
  ]>)
    .filter(([, templates]) => templates.includes(template))
    .map(([capability]) => capability);
  return unique([
    PRIMARY_CAPABILITY_BY_TEMPLATE[template] ?? "text-only",
    ...discovery,
  ]).sort();
};

const registry = Object.fromEntries(VISUAL_TEMPLATE_IDS.map((id) => {
  const compatibility = getVisualGrammarCompatibility(id);
  const defaultVariant = DEFAULT_VARIANT_BY_TEMPLATE[id];
  const appearance = getVisualGrammarAppearance(id, defaultVariant);
  const primaryCapability = PRIMARY_CAPABILITY_BY_TEMPLATE[id] ?? "text-only";
  const descriptor: VisualComponentDescriptor = {
    id,
    version: "1.0.0",
    status: "production",
    family: VISUAL_TEMPLATE_CONTRACTS[id].family,
    allowedGrammarIds: compatibility.allowedGrammarIds,
    capabilities: capabilitiesForTemplate(id),
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
  [...DISCOVERY_TEMPLATES_BY_CAPABILITY[capability]];

export const primaryCapabilityForTemplate = (template: VisualTemplateId): EvidenceCapability =>
  PRIMARY_CAPABILITY_BY_TEMPLATE[template] ?? "text-only";

export const defaultVariantForTemplate = (template: VisualTemplateId) =>
  VISUAL_COMPONENT_REGISTRY[template].defaultVariant;

export const visualModeForTemplate = (template: VisualTemplateId) =>
  VISUAL_COMPONENT_REGISTRY[template].visualMode;
