import type {RenderSpec} from "./render-spec";
import {
  getVisualGrammarAppearance,
  isVisualGrammarTemplatePairAllowed,
} from "./visual-grammar-contract";
import {
  VISUAL_TEMPLATE_CONTRACTS,
  type VisualTemplateId,
  type VisualTemplateVariant,
} from "./visual-template-contract";
import {
  visualCandidateCatalogSchema,
  type EvidenceCapability,
  type VisualCandidate,
  type VisualCandidateCatalog,
  type VisualCapabilityHints,
} from "./visual-director-contract";

type Beat = RenderSpec["scenes"][number]["visualBeats"][number];
type Scene = RenderSpec["scenes"][number];

const CAPABILITY_TEMPLATES: Record<EvidenceCapability, readonly VisualTemplateId[]> = {
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

const TEMPLATE_CAPABILITY: Partial<Record<VisualTemplateId, EvidenceCapability>> = {
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

const VARIANT_BY_TEMPLATE: Record<VisualTemplateId, VisualTemplateVariant> = {
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

const VISUAL_MODE_BY_TEMPLATE: Record<VisualTemplateId, Beat["visualMode"]> = {
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

const realityCapabilities = new Set<EvidenceCapability>([
  "source-document", "quote-social", "time-series", "entity", "image-media",
]);

const unique = <T,>(values: readonly T[]) => [...new Set(values)];

const inferCapabilities = (beat: Beat): EvidenceCapability[] => {
  const result = new Set<EvidenceCapability>();
  result.add(TEMPLATE_CAPABILITY[beat.visualTemplate] ?? "text-only");
  if (beat.entity) result.add("entity");
  if (beat.pictureBook) result.add("image-media");
  if (beat.templateConfig.reactionTimeline?.precision === "verified-intraday-series") result.add("time-series");
  return [...result].sort();
};

const objectInventory = (scene: Scene, beat: Beat) => {
  const selected = new Set(beat.objectIds);
  return {
    cards: scene.cards.filter((item) => selected.has(item.cardId)),
    numbers: scene.numbers.filter((item) => selected.has(item.numberId)),
    nodes: scene.nodes.filter((item) => selected.has(item.nodeId)),
    arrows: scene.arrows.filter((item) => selected.has(item.arrowId)),
  };
};

const within = (value: number, range: {min: number; max: number}) =>
  range.min <= value && value <= range.max;

const comparisonBasisAligned = (scene: Scene, beat: Beat) => {
  const numbers = objectInventory(scene, beat).numbers;
  if (numbers.length < 2 || numbers.some((item) => item.numericValue == null)) return false;
  const units = new Set(numbers.map((item) => item.unit));
  const bases = new Set(numbers.map((item) => item.comparison));
  return units.size === 1 && bases.size === 1 && !bases.has(null);
};

const sourcePlacementIds = (scene: Scene, beat: Beat) => {
  const placements = new Map(scene.assetPlacements.map((item) => [item.placementId, item] as const));
  return beat.assetPlacementIds.filter((id) => {
    const placement = placements.get(id);
    return placement?.role === "main-media" || placement?.role === "entity-card" || placement?.role === "picture-book" || placement?.role === "illustration";
  });
};

const screenStateFor = (template: VisualTemplateId, beat: Beat, hasMedia: boolean) => {
  if (template === "news-media") return "News" as const;
  if (template === "entity-card-full") return beat.screenState === "MainWithEntity" ? "MainWithEntity" as const : "EntityFocus" as const;
  if (template === "source-receipt" && hasMedia) return "News" as const;
  const supported = VISUAL_TEMPLATE_CONTRACTS[template].supportedScreenStates;
  return supported.includes(beat.screenState) ? beat.screenState : supported[0];
};

const canBuild = (
  capability: EvidenceCapability,
  template: VisualTemplateId,
  scene: Scene,
  beat: Beat,
) => {
  const inventory = objectInventory(scene, beat);
  const contract = VISUAL_TEMPLATE_CONTRACTS[template];
  if (!within(inventory.cards.length, contract.cards) ||
      !within(inventory.numbers.length, contract.numbers) ||
      !within(inventory.nodes.length, contract.nodes) ||
      !within(inventory.arrows.length, contract.arrows)) return false;
  if (contract.requiresNumericValue && inventory.numbers.some((item) => item.numericValue == null)) return false;
  if (!beat.visualGrammarId || !isVisualGrammarTemplatePairAllowed(beat.visualGrammarId, template)) return false;
  if ((beat.shots?.length ?? 0) > 0 || beat.financialVisualTrace) return template === beat.visualTemplate;
  if (capability === "comparison-set" && !comparisonBasisAligned(scene, beat)) return false;
  if (capability === "time-series") {
    const reaction = beat.templateConfig.reactionTimeline;
    if (reaction?.precision !== "verified-intraday-series") return false;
    if (!reaction.intradaySeries && reaction.seriesObjectIds.length < 2) return false;
  }
  if ((capability === "source-document" || capability === "quote-social" || template === "news-media" || template === "source-receipt") && beat.evidenceSourceIds.length === 0) return false;
  if ((template === "source-receipt" || template === "news-media") && sourcePlacementIds(scene, beat).length !== 1) return false;
  if (template === "news-media" && sourcePlacementIds(scene, beat).length !== 1) return false;
  if (template === "entity-card-full" && (!beat.entity || sourcePlacementIds(scene, beat).length !== 1)) return false;
  return true;
};

const templateConfigFor = (template: VisualTemplateId, scene: Scene, beat: Beat) => {
  if (template === beat.visualTemplate) return structuredClone(beat.templateConfig);
  const variant = VARIANT_BY_TEMPLATE[template];
  const inventory = objectInventory(scene, beat);
  return {
    variant,
    comparisonBasis: beat.templateConfig.comparisonBasis,
    dataBasis: beat.templateConfig.dataBasis,
    nodeOrder: inventory.nodes.map((item) => item.nodeId),
    laneLabels: template === "verification-matrix" ? ["強める", "弱める"] : [],
    outcomeNodeId: inventory.nodes.at(-1)?.nodeId ?? null,
    ...(template === "event-reaction-timeline" && beat.templateConfig.reactionTimeline
      ? {reactionTimeline: structuredClone(beat.templateConfig.reactionTimeline)}
      : {}),
  };
};

const candidateSignature = (candidate: Omit<VisualCandidate, "candidateId">) =>
  [candidate.visualTemplate, candidate.templateVariant, candidate.screenState, candidate.capability].join("|");

export const buildVisualCandidateCatalog = ({
  spec,
  sourceRenderSpecSha256,
  hints,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
}): VisualCandidateCatalog => {
  if (spec.schemaVersion !== "2.4.0") throw new Error("Visual Director requires render_spec 2.4.0");
  if (hints && hints.episodeDate !== spec.episode.targetDate) throw new Error("capability hint episodeDate mismatch");
  const hintMap = new Map(hints?.beats.map((item) => [item.visualBeatId, item.capabilities] as const) ?? []);
  const candidates: VisualCandidate[] = [];

  for (const scene of spec.scenes) {
    for (const beat of scene.visualBeats) {
      const capabilities = unique([...(hintMap.get(beat.beatId) ?? []), ...inferCapabilities(beat)]).sort();
      const drafts = new Map<string, Omit<VisualCandidate, "candidateId">>();
      for (const capability of capabilities) {
        const templates = unique([beat.visualTemplate, ...CAPABILITY_TEMPLATES[capability]]).sort();
        for (const template of templates) {
          if (!canBuild(capability, template, scene, beat)) continue;
          const templateConfig = templateConfigFor(template, scene, beat);
          const variant = templateConfig.variant;
          const assetPlacementIds = template === beat.visualTemplate
            ? [...beat.assetPlacementIds]
            : sourcePlacementIds(scene, beat);
          const placementMap = new Map(scene.assetPlacements.map((item) => [item.placementId, item] as const));
          const assetIds = assetPlacementIds.map((id) => placementMap.get(id)!.assetId);
          const screenState = screenStateFor(template, beat, assetPlacementIds.length > 0);
          const appearance = getVisualGrammarAppearance(template, variant);
          const draft: Omit<VisualCandidate, "candidateId"> = {
            visualBeatId: beat.beatId,
            capability,
            visualTemplate: template,
            templateVariant: variant,
            screenState,
            visualMode: template === beat.visualTemplate ? beat.visualMode : VISUAL_MODE_BY_TEMPLATE[template],
            templateConfig,
            appearanceClass: appearance.appearanceClass,
            dominantSurface: appearance.dominantSurface,
            realityAnchor: realityCapabilities.has(capability) && template !== "analogy-steps",
            evidenceSourceIds: [...beat.evidenceSourceIds],
            objectIds: [...beat.objectIds],
            assetPlacementIds,
            assetIds,
            assetState: assetPlacementIds.length === 0 ? "not-required" : beat.assetState === "user-review-required" ? "user-review-required" : "ready",
            requirementsSatisfied: true as const,
          };
          drafts.set(candidateSignature(draft), draft);
        }
      }
      const ordered = [...drafts.values()].sort((left, right) => candidateSignature(left).localeCompare(candidateSignature(right)));
      if (ordered.length === 0) throw new Error(`${beat.beatId}: Candidate Builder produced no legal candidate`);
      ordered.forEach((draft, index) => candidates.push({
        candidateId: `vc-${beat.beatId}-${String(index + 1).padStart(2, "0")}`,
        ...draft,
      }));
    }
  }

  return visualCandidateCatalogSchema.parse({
    contractVersion: "1.0.0",
    episodeDate: spec.episode.targetDate,
    rendererContractVersion: "2.4.0",
    sourceRenderSpecSha256,
    candidates,
  });
};

export const candidateTemplatesForCapabilities = (capabilities: readonly EvidenceCapability[]) =>
  unique(capabilities.flatMap((capability) => CAPABILITY_TEMPLATES[capability])).sort();
