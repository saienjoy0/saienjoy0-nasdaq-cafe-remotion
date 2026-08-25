import type {RenderSpec} from "./render-spec";
import {isFinancialVisualTemplate} from "./financial-visual-contract";
import {assertStaticTemplateSoundness} from "./static-template-soundness";
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
  visualCandidateCoverageSchema,
  type EvidenceCapability,
  type VisualCandidate,
  type VisualCandidateCatalog,
  type VisualCandidateCoverage,
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

type CatalogAnalysis = {
  catalog: VisualCandidateCatalog | null;
  coverage: VisualCandidateCoverage | null;
};

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
  if (template === "source-receipt") return hasMedia ? "News" as const : "Data" as const;
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

const inferredLaneLabels = (beat: Beat) => {
  const labels = unique(beat.viewerTexts.flatMap((item) => {
    const separator = item.indexOf("｜");
    if (separator <= 0) return [];
    const label = item.slice(0, separator).trim();
    return label.length > 0 ? [label] : [];
  }));
  return labels.length === 2 ? labels : [];
};

const templateConfigFor = (template: VisualTemplateId, scene: Scene, beat: Beat) => {
  const descriptor = getVisualComponentDescriptor(template);
  if (template === beat.visualTemplate) {
    const config = structuredClone(beat.templateConfig);
    if (!descriptor.variants.includes(config.variant)) {
      config.variant = descriptor.defaultVariant;
    }
    return config;
  }
  const variant = descriptor.defaultVariant;
  const inventory = objectInventory(scene, beat);
  const needsLanes = template === "verification-matrix" || template === "tailwind-headwind";
  return {
    variant,
    comparisonBasis: beat.templateConfig.comparisonBasis,
    dataBasis: beat.templateConfig.dataBasis,
    nodeOrder: inventory.nodes.map((item) => item.nodeId),
    laneLabels: needsLanes ? inferredLaneLabels(beat) : [],
    outcomeNodeId: inventory.nodes.at(-1)?.nodeId ?? null,
    ...(beat.templateConfig.displayOrder
      ? {displayOrder: [...beat.templateConfig.displayOrder]}
      : {}),
    ...(beat.templateConfig.metricIds
      ? {metricIds: [...beat.templateConfig.metricIds]}
      : {}),
    ...(beat.templateConfig.causalStepIds
      ? {causalStepIds: [...beat.templateConfig.causalStepIds]}
      : {}),
    ...(beat.templateConfig.highlightObjectIds
      ? {highlightObjectIds: [...beat.templateConfig.highlightObjectIds]}
      : {}),
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

const buildCatalogAnalysis = ({
  spec,
  sourceRenderSpecSha256,
  hints,
  includeAuthoredCompatibility,
  collectCoverage,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
  includeAuthoredCompatibility: boolean;
  collectCoverage: boolean;
}): CatalogAnalysis => {
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
  const coverageBeats: VisualCandidateCoverage["beats"] = [];
  const unavailableBeats: string[] = [];

  for (const [sceneIndex, scene] of spec.scenes.entries()) {
    for (const [beatIndex, beat] of scene.visualBeats.entries()) {
      const hint = hintMap.get(beat.beatId);
      const primaryCapability = primaryCapabilityForTemplate(beat.visualTemplate);
      const financialOwned = beat.financialVisualTrace !== undefined;
      const inferredCapabilities = [...(inventoryMap.get(beat.beatId) ?? [])];
      const capabilities = financialOwned
        ? [primaryCapability]
        : hint?.templatePolicy?.mode === "authored-only"
          ? [primaryCapability]
          : unique([
              ...(hint?.capabilities ?? []),
              ...inferredCapabilities,
              primaryCapability,
            ]).sort();
      const drafts = new Map<string, Omit<VisualCandidate, "candidateId">>();
      for (const capability of capabilities) {
        const discoveryTemplates = candidateTemplatesForCapability(capability);
        const discovered = includeAuthoredCompatibility
          ? candidateTemplatesForPolicy(beat.visualTemplate, discoveryTemplates, hint?.templatePolicy)
          : templatesForNewPath(capability, hint?.templatePolicy);
        const templates = financialOwned ? [beat.visualTemplate] : discovered;
        for (const template of templates) {
          if (financialOwned && template !== beat.visualTemplate) continue;
          if (!financialOwned && isFinancialVisualTemplate(template)) continue;
          if (!canBuild(capability, template, scene, beat)) continue;
          const templateConfig = templateConfigFor(template, scene, beat);
          const variant = templateConfig.variant as VisualTemplateVariant;
          const assetPlacementIds = template === beat.visualTemplate
            ? [...beat.assetPlacementIds]
            : sourcePlacementIds(scene, beat);
          const placementMap = new Map(scene.assetPlacements.map((item) => [item.placementId, item] as const));
          const assetIds = assetPlacementIds.map((id) => placementMap.get(id)!.assetId);
          const screenState = screenStateFor(template, beat, assetPlacementIds.length > 0);
          const visualMode = visualModeForTemplate(template);
          const assetState = assetPlacementIds.length === 0
            ? "not-required" as const
            : beat.assetState === "user-review-required"
              ? "user-review-required" as const
              : "ready" as const;
          const projectedBeat: Beat = {
            ...beat,
            visualTemplate: template,
            templateVariant: variant,
            templateConfig,
            screenState,
            visualMode,
            assetPlacementIds,
            assetState,
          };

          try {
            assertStaticTemplateSoundness(
              scene,
              projectedBeat,
              `$.scenes[${sceneIndex}].visualBeats[${beatIndex}]`,
            );
          } catch {
            continue;
          }

          const appearance = getVisualGrammarAppearance(template, variant);
          const draft: Omit<VisualCandidate, "candidateId"> = {
            visualBeatId: beat.beatId,
            capability,
            visualTemplate: template,
            templateVariant: variant,
            screenState,
            visualMode,
            templateConfig,
            appearanceClass: appearance.appearanceClass,
            dominantSurface: appearance.dominantSurface,
            realityAnchor: realityCapabilities.has(capability) && template !== "analogy-steps",
            evidenceSourceIds: [...beat.evidenceSourceIds],
            objectIds: [...beat.objectIds],
            assetPlacementIds,
            assetIds,
            assetState,
            requirementsSatisfied: true as const,
          };
          drafts.set(candidateSignature(draft), draft);
        }
      }
      const ordered = [...drafts.values()].sort((left, right) => candidateSignature(left).localeCompare(candidateSignature(right)));
      if (ordered.length === 0 && !collectCoverage) {
        throw new Error(`${beat.beatId}: Candidate Builder produced no legal candidate`);
      }
      if (collectCoverage) {
        const inventory = objectInventory(scene, beat);
        coverageBeats.push({
          visualBeatId: beat.beatId,
          visualGrammarId: beat.visualGrammarId ?? "missing",
          authoredVisualTemplate: beat.visualTemplate,
          requestedCapabilities: [...(hint?.capabilities ?? [])],
          inferredCapabilities,
          inventory: {
            cards: inventory.cards.length,
            numbers: inventory.numbers.length,
            nodes: inventory.nodes.length,
            arrows: inventory.arrows.length,
          },
          legalCandidateCount: ordered.length,
          failureCode: ordered.length === 0 ? "E_VISUAL_CANDIDATE_NONE" : null,
        });
      }
      if (ordered.length === 0) {
        unavailableBeats.push(beat.beatId);
        continue;
      }
      ordered.forEach((draft, index) => candidates.push({
        candidateId: `vc-${beat.beatId}-${String(index + 1).padStart(2, "0")}`,
        ...draft,
      }));
    }
  }

  const coverage = collectCoverage
    ? visualCandidateCoverageSchema.parse({
        contractVersion: "1.0.0",
        episodeDate: spec.episode.targetDate,
        rendererContractVersion: "2.4.0",
        sourceRenderSpecSha256,
        status: unavailableBeats.length === 0 ? "PASS" : "UNAVAILABLE",
        beatCount: coverageBeats.length,
        unavailableBeatCount: unavailableBeats.length,
        beats: coverageBeats,
        unavailableBeats,
      })
    : null;

  if (unavailableBeats.length > 0) {
    return {catalog: null, coverage};
  }

  const catalog = visualCandidateCatalogSchema.parse({
    contractVersion: "1.0.0",
    episodeDate: spec.episode.targetDate,
    rendererContractVersion: "2.4.0",
    sourceRenderSpecSha256,
    candidates,
  });
  return {catalog, coverage};
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
  const result = buildCatalogAnalysis({
    spec,
    sourceRenderSpecSha256,
    hints,
    includeAuthoredCompatibility,
    collectCoverage: false,
  });
  if (!result.catalog) throw new Error("Candidate Builder produced no legal candidate");
  return result.catalog;
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

export const analyzeVisualCandidateCatalogVNext = ({
  spec,
  sourceRenderSpecSha256,
  hints,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  hints?: VisualCapabilityHints;
}): {catalog: VisualCandidateCatalog | null; coverage: VisualCandidateCoverage} => {
  const result = buildCatalogAnalysis({
    spec,
    sourceRenderSpecSha256,
    hints,
    includeAuthoredCompatibility: false,
    collectCoverage: true,
  });
  if (!result.coverage) throw new Error("Visual Candidate coverage missing");
  return {catalog: result.catalog, coverage: result.coverage};
};

export const candidateTemplatesForCapabilities = (capabilities: readonly EvidenceCapability[]) =>
  unique(capabilities.flatMap((capability) => candidateTemplatesForCapability(capability))).sort();
