import {
  VISUAL_TEMPLATE_IDS,
  type VisualTemplateId,
} from "./visual-template-contract";

export const VISUAL_GRAMMAR_RENDERER_CONTRACT_VERSION = "1.0.0" as const;
export const VISUAL_GRAMMAR_SEMANTIC_VERSION = "1.0.0" as const;
export const VISUAL_GRAMMAR_RENDER_SPEC_TARGET_VERSION = "2.4.0" as const;

export const VISUAL_GRAMMAR_IDS = [
  "contradiction",
  "entity",
  "evidence",
  "gap",
  "causal",
  "reaction",
  "comparison",
  "verification",
  "analogy",
  "assembly",
  "bridge-text",
] as const;

export const VISUAL_GRAMMAR_TRANSITION_ROLES = [
  "continuation",
  "major-shift",
  "return",
  "closing",
] as const;

export const VISUAL_GRAMMAR_APPEARANCE_CLASSES = [
  "open-hero",
  "entity-canvas",
  "document-media",
  "metric-board",
  "progressive-chart",
  "causal-path",
  "dual-lane",
  "timeline-track",
  "split-comparison",
  "matrix-grid",
  "verification-gates",
  "picturebook-canvas",
  "assembly-map",
  "text-bridge",
] as const;

export const VISUAL_GRAMMAR_DOMINANT_SURFACES = [
  "open-canvas",
  "entity",
  "media",
  "card-board",
  "plot",
  "network",
  "split",
  "matrix",
  "picturebook",
  "assembly",
  "text",
] as const;

export const VISUAL_GRAMMAR_STAGE_SHELLS = [
  "OpenHeroStage",
  "EntityStage",
  "DocumentMediaStage",
  "MetricBoardStage",
  "ProgressiveChartStage",
  "CausalPathStage",
  "DualLaneStage",
  "TimelineStage",
  "SplitComparisonStage",
  "MatrixStage",
  "VerificationGateStage",
  "PictureBookStage",
  "AssemblyStage",
  "TextBridgeStage",
] as const;

export type VisualGrammarId = typeof VISUAL_GRAMMAR_IDS[number];
export type VisualGrammarTransitionRole = typeof VISUAL_GRAMMAR_TRANSITION_ROLES[number];
export type VisualGrammarAppearanceClass = typeof VISUAL_GRAMMAR_APPEARANCE_CLASSES[number];
export type VisualGrammarDominantSurface = typeof VISUAL_GRAMMAR_DOMINANT_SURFACES[number];
export type VisualGrammarStageShell = typeof VISUAL_GRAMMAR_STAGE_SHELLS[number];

export type VisualGrammarRendererCompatibilityEntry = {
  visualTemplateId: VisualTemplateId;
  allowedGrammarIds: readonly VisualGrammarId[];
  appearanceClass: VisualGrammarAppearanceClass;
  dominantSurface: VisualGrammarDominantSurface;
  stageShell: VisualGrammarStageShell;
  nonAnalysis: boolean;
  status: "active";
};

const compatibilityEntry = (
  visualTemplateId: VisualTemplateId,
  allowedGrammarIds: readonly VisualGrammarId[],
  appearanceClass: VisualGrammarAppearanceClass,
  dominantSurface: VisualGrammarDominantSurface,
  stageShell: VisualGrammarStageShell,
  nonAnalysis: boolean,
): VisualGrammarRendererCompatibilityEntry => ({
  visualTemplateId,
  allowedGrammarIds,
  appearanceClass,
  dominantSurface,
  stageShell,
  nonAnalysis,
  status: "active",
});

export const VISUAL_GRAMMAR_RENDERER_COMPATIBILITY = {
  contractVersion: VISUAL_GRAMMAR_RENDERER_CONTRACT_VERSION,
  semanticGrammarVersion: VISUAL_GRAMMAR_SEMANTIC_VERSION,
  renderSpecTargetVersion: VISUAL_GRAMMAR_RENDER_SPEC_TARGET_VERSION,
  entries: [
    compatibilityEntry("opening-contradiction", ["contradiction"], "open-hero", "open-canvas", "OpenHeroStage", false),
    compatibilityEntry("market-pulse-grid", ["evidence", "reaction"], "metric-board", "card-board", "MetricBoardStage", false),
    compatibilityEntry("earnings-surprise", ["gap"], "progressive-chart", "plot", "ProgressiveChartStage", false),
    compatibilityEntry("dual-asset-split", ["comparison"], "split-comparison", "split", "SplitComparisonStage", false),
    compatibilityEntry("macro-pressure", ["causal"], "causal-path", "network", "CausalPathStage", false),
    compatibilityEntry("source-receipt", ["evidence"], "document-media", "media", "DocumentMediaStage", true),
    compatibilityEntry("hero-number", ["contradiction", "evidence"], "open-hero", "open-canvas", "OpenHeroStage", false),
    compatibilityEntry("closing-recap", ["assembly"], "assembly-map", "assembly", "AssemblyStage", false),
    compatibilityEntry("final-assembly", ["assembly"], "assembly-map", "assembly", "AssemblyStage", false),
    compatibilityEntry("conclusion-card", ["assembly"], "assembly-map", "assembly", "AssemblyStage", false),
    compatibilityEntry("expected-actual-bullet", ["gap"], "progressive-chart", "plot", "ProgressiveChartStage", false),
    compatibilityEntry("expected-actual-gap-flow", ["gap"], "progressive-chart", "plot", "ProgressiveChartStage", false),
    compatibilityEntry("metric-comparison-board", ["evidence", "comparison"], "metric-board", "card-board", "MetricBoardStage", false),
    compatibilityEntry("index-return-bars", ["evidence", "reaction"], "progressive-chart", "plot", "ProgressiveChartStage", false),
    compatibilityEntry("diverging-stock-bars", ["comparison"], "split-comparison", "split", "SplitComparisonStage", false),
    compatibilityEntry("split-comparison", ["comparison"], "split-comparison", "split", "SplitComparisonStage", false),
    compatibilityEntry("focus-matrix", ["comparison", "evidence"], "matrix-grid", "matrix", "MatrixStage", false),
    compatibilityEntry("causal-lane", ["causal"], "causal-path", "network", "CausalPathStage", false),
    compatibilityEntry("tailwind-headwind", ["causal", "evidence"], "dual-lane", "split", "DualLaneStage", false),
    compatibilityEntry("evidence-boundary", ["evidence"], "dual-lane", "split", "DualLaneStage", false),
    compatibilityEntry("verification-checklist", ["verification"], "verification-gates", "split", "VerificationGateStage", false),
    compatibilityEntry("verification-matrix", ["verification"], "verification-gates", "matrix", "VerificationGateStage", false),
    compatibilityEntry("analogy-steps", ["analogy"], "picturebook-canvas", "picturebook", "PictureBookStage", true),
    compatibilityEntry("entity-card-full", ["entity"], "entity-canvas", "entity", "EntityStage", true),
    compatibilityEntry("news-media", ["evidence"], "document-media", "media", "DocumentMediaStage", true),
    compatibilityEntry("text-focus", ["bridge-text"], "text-bridge", "text", "TextBridgeStage", true),
  ] satisfies readonly VisualGrammarRendererCompatibilityEntry[],
} as const;

const compatibilityByTemplate = new Map<VisualTemplateId, VisualGrammarRendererCompatibilityEntry>(
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.entries.map((entry) => [entry.visualTemplateId, entry]),
);

export class VisualGrammarRendererContractError extends Error {
  public readonly code: "VG_TEMPLATE_NOT_REGISTERED" | "VG_GRAMMAR_TEMPLATE_MISMATCH";

  public constructor(
    code: "VG_TEMPLATE_NOT_REGISTERED" | "VG_GRAMMAR_TEMPLATE_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "VisualGrammarRendererContractError";
    this.code = code;
  }
}

export const getVisualGrammarRendererCompatibility = (
  visualTemplateId: string,
): VisualGrammarRendererCompatibilityEntry => {
  const entry = compatibilityByTemplate.get(visualTemplateId as VisualTemplateId);
  if (!entry) {
    throw new VisualGrammarRendererContractError(
      "VG_TEMPLATE_NOT_REGISTERED",
      `Visual Template is not registered for Visual Grammar rendering: ${visualTemplateId}`,
    );
  }
  return entry;
};

export const isVisualGrammarTemplatePairAllowed = (
  grammarId: VisualGrammarId,
  visualTemplateId: string,
): boolean => getVisualGrammarRendererCompatibility(visualTemplateId).allowedGrammarIds.includes(grammarId);

export const assertVisualGrammarTemplatePairAllowed = (
  grammarId: VisualGrammarId,
  visualTemplateId: string,
): VisualGrammarRendererCompatibilityEntry => {
  const entry = getVisualGrammarRendererCompatibility(visualTemplateId);
  if (!entry.allowedGrammarIds.includes(grammarId)) {
    throw new VisualGrammarRendererContractError(
      "VG_GRAMMAR_TEMPLATE_MISMATCH",
      `${grammarId} is not allowed to use ${visualTemplateId}; allowed=${entry.allowedGrammarIds.join(",")}`,
    );
  }
  return entry;
};

export const assertVisualGrammarRegistryCoversAllTemplates = (): void => {
  const registered = VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.entries.map((entry) => entry.visualTemplateId);
  const unique = new Set(registered);
  if (unique.size !== registered.length) {
    throw new Error("Visual Grammar renderer compatibility contains duplicate Visual Template IDs");
  }
  const expected = new Set<string>(VISUAL_TEMPLATE_IDS);
  const missing = VISUAL_TEMPLATE_IDS.filter((templateId) => !unique.has(templateId));
  const extra = registered.filter((templateId) => !expected.has(templateId));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(`Visual Grammar registry coverage mismatch: missing=${missing.join(",")} extra=${extra.join(",")}`);
  }
};
