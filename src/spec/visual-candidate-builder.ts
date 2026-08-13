import type {RenderSpec} from "./render-spec";
import {
  getVisualGrammarAppearance,
  isVisualGrammarTemplatePairAllowed,
} from "./visual-grammar-contract";
import type {
  VisualTemplateId,
  VisualTemplateVariant,
} from "./visual-template-contract";
import {
  visualCandidateCatalogSchema,
  type EvidenceCapability,
  type VisualCandidate,
  type VisualCandidateCatalog,
  type VisualCapabilityHints,
  type VisualTemplatePolicy,
} from "./visual-director-contract";
import {candidateTemplatesForPolicy} from "./visual-template-policy";
import {
  candidateTemplatesForCapability,
  getVisualComponentDescriptor,
  primaryCapabilityForTemplate,
  visualModeForTemplate,
} from "./visual-component-registry";
import {passesVisualEligibilityRules} from "./visual-eligibility-rule-registry";
import {
  buildVisualCandidateInputFromRenderSpec,
  buildVisualCapabilityInventory,
} from "./visual-candidate-input";

type Beat = RenderSpec["scenes"][number]["visualBeats"][number];
type Scene = RenderSpec["scenes"][number];

const realityCapabilities = new Set<EvidenceCapability>([
  "source-document", "quote-social", "time-series", "entity", "image-media",
]);

const unique = <T,>(values: readonly T[]) => [...new Set(values)];

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
  const supported = getVisualComponentDescriptor(template).supportedScreenStates;
  return supported.includes(beat.screenState) ? beat.screenState : supported[0];
};

const canBuild = (
  capability: EvidenceCapability,
  template: VisualTemplateId,
  scene: Scene,
  beat: Beat,
) => {
  const inventory = objectInventory(scene, beat);
  const descriptor = getVisualComponentDescriptor(template);
  const contract = descriptor.inventory;
  if (!within(inventory.cards.length, contract.cards) ||
      !within(inventory.numbers.length, contract.numbers) ||
      !within(inventory.nodes.length, contract.nodes) ||
      !within(inventory.arrows.length, contract.arrows)) return false;
  if (contract.requiresNumericValue && inventory.numbers.some((item) => item.numericValue == null)) return false;
  if (!beat.visualGrammarId || !isVisualGrammarTemplatePairAllowed(beat.visualGrammarId, template)) return false;
  const placements = sourcePlacementIds(scene, beat);
  if (!passesVisualEligibilityRules(descriptor.eligibilityRuleIds, {
    scene,
    beat,
    capability,
    sourcePlacementIds: placements,
  })) return false;
  return true;
};

const templateConfigFor = (template: VisualTemplateId, scene: Scene, beat: Beat) => {
  if (template === beat.visualTemplate) return structuredClone(beat.templateConfig);
  const variant = getVisualComponentDescriptor(template).defaultVariant;
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

const templatesForNewPath = (
  capability: EvidenceCapability,
  policy: VisualTemplatePolicy | undefined,
) => {
  const capabilityTemplates = candidateTemplatesForCapability(capability);
  if (!policy) return capabilityTemplates;
  if (policy.mode === "authored-only") {
    throw new Error("authored-only requires the legacy compatibility path");
  }
  const allowed = new Set(policy.allowedTemplateIds);
  return capabilityTemplates.filter((template) => allowed.has(template));
};

const buildCatalog = ({
  spec,
  sourceRenderSpecSha256,
  hints,
  includeAuthoredCompatibility,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
  includeAuthoredCompatibility: boolean;
}): VisualCandidateCatalog => {
  if (spec.schemaVersion !== "2.4.0") throw new Error("Visual Director requires render_spec 2.4.0");
  if (hints && hints.episodeDate !== spec.episode.targetDate) throw new Error("capability hint episodeDate mismatch");

  const candidateInput = buildVisualCandidateInputFromRenderSpec({
    spec,
    editorialSnapshotSha256: sourceRenderSpecSha256,
  });
  const capabilityInventory = buildVisualCapabilityInventory(candidateInput);
  const inventoryMap = new Map(capabilityInventory.beats.map((item) => [item.visualBeatId, item.capabilities] as const));
  const hintMap = new Map(hints?.beats.map((item) => [item.visualBeatId, item] as const) ?? []);
  const candidates: VisualCandidate[] = [];

  for (const scene of spec.scenes) {
    for (const beat of scene.visualBeats) {
      const hint = hintMap.get(beat.beatId);
      const primaryCapability = primaryCapabilityForTemplate(beat.visualTemplate);
      const capabilities = hint?.templatePolicy?.mode === "authored-only"
        ? [primaryCapability]
        : unique([
            ...(hint?.capabilities ?? []),
            ...(inventoryMap.get(beat.beatId) ?? []),
            primaryCapability,
          ]).sort();
      const drafts = new Map<string, Omit<VisualCandidate, "candidateId">>();
      for (const capability of capabilities) {
        const discoveryTemplates = candidateTemplatesForCapability(capability);
        const templates = includeAuthoredCompatibility
          ? candidateTemplatesForPolicy(beat.visualTemplate, discoveryTemplates, hint?.templatePolicy)
          : templatesForNewPath(capability, hint?.templatePolicy);
        for (const template of templates) {
          if (!canBuild(capability, template, scene, beat)) continue;
          const templateConfig = templateConfigFor(template, scene, beat);
          const variant = templateConfig.variant as VisualTemplateVariant;
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
            // Candidate legality belongs to the candidate Template Registry. Producer
            // visualMode may be a stale scene-level value, so it must never override
            // the Renderer-owned template -> visualMode contract, even for an authored
            // template retained as a vNext candidate.
            visualMode: visualModeForTemplate(template),
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

export const buildVisualCandidateCatalog = ({
  spec,
  sourceRenderSpecSha256,
  hints,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
}): VisualCandidateCatalog => buildCatalog({
  spec,
  sourceRenderSpecSha256,
  hints,
  includeAuthoredCompatibility: true,
});

export const buildVisualCandidateCatalogVNext = ({
  spec,
  sourceRenderSpecSha256,
  hints,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
}): VisualCandidateCatalog => buildCatalog({
  spec,
  sourceRenderSpecSha256,
  hints,
  includeAuthoredCompatibility: false,
});

export const candidateTemplatesForCapabilities = (capabilities: readonly EvidenceCapability[]) =>
  unique(capabilities.flatMap((capability) => candidateTemplatesForCapability(capability))).sort();
