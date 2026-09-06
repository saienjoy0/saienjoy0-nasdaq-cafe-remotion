import type {RenderSpec} from "./render-spec";
import {renderSpecSchema} from "./render-spec";
import {validateVisualGrammarContract} from "./validate-visual-grammar";
import {
  sha256Json,
  visualCandidateCatalogSchema,
  visualDirectionPlanSchema,
  type VisualCandidate,
  type VisualCandidateCatalog,
  type VisualDirectionPlan,
} from "./visual-director-contract";

export type VisualDirectionWarningCode =
  | "DECORATIVE_ASSET"
  | "REDUNDANT_ENTITY"
  | "REALITY_ANCHOR_DROUGHT";

export type VisualDirectionCompileReport = {
  contractVersion: "1.0.0";
  episodeDate: string;
  sourceRenderSpecSha256: string;
  candidateCatalogSha256: string;
  selectionCount: number;
  semanticDiff: "PASS";
  warnings: Array<{code: VisualDirectionWarningCode; visualBeatId: string; message: string}>;
};

const visualMutationKeys = [
  "visualTemplate",
  "templateVariant",
  "templateConfig",
  "screenState",
  "visualMode",
  "objectIds",
  "assetPlacementIds",
  "assetState",
] as const;

const protectedSemanticInventory = (spec: RenderSpec) => {
  const inventory = structuredClone(spec) as RenderSpec & {
    scenes: Array<RenderSpec["scenes"][number] & {
      visualBeats: Array<Record<string, unknown>>;
    }>;
  };
  for (const scene of inventory.scenes) {
    // Scene visualMode is a derived summary of the first Visual Beat, not an
    // independent editorial field. Candidate compilation may legitimately change
    // the first Beat's mode, so exclude the summary from protected semantics too.
    delete (scene as unknown as Record<string, unknown>).visualMode;
    for (const beat of scene.visualBeats) {
      for (const key of visualMutationKeys) delete beat[key];
    }
  }
  return inventory;
};

export const assertProtectedSemanticFieldsUnchanged = (before: RenderSpec, after: RenderSpec) => {
  const beforeSha = sha256Json(protectedSemanticInventory(before));
  const afterSha = sha256Json(protectedSemanticInventory(after));
  if (beforeSha !== afterSha) {
    throw new Error(`PROTECTED_SEMANTIC_DIFF_FAIL: ${beforeSha} != ${afterSha}`);
  }
};

const analyzeWarnings = (selected: VisualCandidate[]) => {
  const warnings: VisualDirectionCompileReport["warnings"] = [];
  const entityAssets = new Map<string, string>();
  let droughtStart = 0;
  selected.forEach((candidate, index) => {
    if (candidate.assetIds.length > 0 && (candidate.capability === "text-only" || candidate.evidenceSourceIds.length === 0)) {
      warnings.push({code: "DECORATIVE_ASSET", visualBeatId: candidate.visualBeatId, message: "asset does not carry an evidence or identity capability"});
    }
    if (candidate.capability === "entity") {
      for (const assetId of candidate.assetIds) {
        const previous = entityAssets.get(assetId);
        if (previous) warnings.push({code: "REDUNDANT_ENTITY", visualBeatId: candidate.visualBeatId, message: `${assetId} already appeared at ${previous}`});
        else entityAssets.set(assetId, candidate.visualBeatId);
      }
    }
    if (candidate.realityAnchor) droughtStart = index + 1;
    if (index - droughtStart + 1 === 5) {
      warnings.push({code: "REALITY_ANCHOR_DROUGHT", visualBeatId: candidate.visualBeatId, message: "five consecutive selected Beats contain no reality anchor"});
    }
  });
  return warnings;
};

export const compileVisualDirection = ({
  spec,
  sourceRenderSpecSha256,
  catalog: rawCatalog,
  plan: rawPlan,
  validateOutput,
}: {
  spec: RenderSpec;
  sourceRenderSpecSha256: string;
  catalog: VisualCandidateCatalog;
  plan: VisualDirectionPlan;
  validateOutput?: (value: RenderSpec) => void;
}): {spec: RenderSpec; report: VisualDirectionCompileReport} => {
  const catalog = visualCandidateCatalogSchema.parse(rawCatalog);
  const plan = visualDirectionPlanSchema.parse(rawPlan);
  if (catalog.rendererContractVersion !== spec.schemaVersion) {
    throw new Error(`renderer contract version mismatch: catalog=${catalog.rendererContractVersion} spec=${spec.schemaVersion}`);
  }
  if (catalog.sourceRenderSpecSha256 !== sourceRenderSpecSha256) throw new Error("source render_spec SHA mismatch");
  if (catalog.episodeDate !== spec.episode.targetDate || plan.episodeDate !== spec.episode.targetDate) throw new Error("episodeDate mismatch");
  const catalogSha = sha256Json(catalog);
  if (plan.candidateCatalogSha256 !== catalogSha) throw new Error("candidate catalog SHA mismatch");

  const allBeats = spec.scenes.flatMap((scene) => scene.visualBeats);
  const candidateMap = new Map(catalog.candidates.map((candidate) => [candidate.candidateId, candidate] as const));
  const selectionMap = new Map<string, VisualCandidate>();
  for (const selection of plan.selections) {
    if (selectionMap.has(selection.visualBeatId)) throw new Error(`duplicate selection for ${selection.visualBeatId}`);
    const candidate = candidateMap.get(selection.candidateId);
    if (!candidate) throw new Error(`unknown candidateId: ${selection.candidateId}`);
    if (candidate.visualBeatId !== selection.visualBeatId) throw new Error(`${selection.candidateId}: Visual Beat mismatch`);
    selectionMap.set(selection.visualBeatId, candidate);
  }
  const missing = allBeats.filter((beat) => !selectionMap.has(beat.beatId)).map((beat) => beat.beatId);
  if (missing.length > 0 || selectionMap.size !== allBeats.length) throw new Error(`Visual Direction Plan must select exactly one candidate per Beat; missing=${missing.join(",")}`);

  const compiled = structuredClone(spec);
  const selected: VisualCandidate[] = [];
  for (const scene of compiled.scenes) {
    const placements = new Map(scene.assetPlacements.map((item) => [item.placementId, item] as const));
    for (const beat of scene.visualBeats) {
      const candidate = selectionMap.get(beat.beatId)!;
      if (spec.schemaVersion === "2.5.0" && candidate.semanticScope !== beat.semanticScope) {
        throw new Error(`${beat.beatId}: semanticScope drift: candidate=${candidate.semanticScope ?? "missing"} authored=${beat.semanticScope ?? "missing"}`);
      }
      if (sha256Json(candidate.evidenceSourceIds) !== sha256Json(beat.evidenceSourceIds)) throw new Error(`${beat.beatId}: evidence source drift`);
      const resolvedAssetIds = candidate.assetPlacementIds.map((id) => placements.get(id)?.assetId ?? (() => { throw new Error(`${beat.beatId}: unknown asset placement ${id}`); })());
      if (sha256Json(resolvedAssetIds) !== sha256Json(candidate.assetIds)) throw new Error(`${beat.beatId}: candidate asset inventory mismatch`);
      beat.visualTemplate = candidate.visualTemplate;
      beat.templateVariant = candidate.templateVariant;
      beat.templateConfig = structuredClone(candidate.templateConfig);
      beat.screenState = candidate.screenState;
      beat.visualMode = candidate.visualMode;
      beat.objectIds = [...candidate.objectIds];
      beat.assetPlacementIds = [...candidate.assetPlacementIds];
      beat.assetState = candidate.assetState;
      selected.push(candidate);
    }
    if (scene.visualBeats.length > 0) {
      // Renderer contract: Scene visualMode is derived metadata and must mirror the
      // first Visual Beat after Candidate compilation. Never leave the authored
      // pre-selection summary stale when the selected Candidate changes Beat 1 mode.
      scene.visualMode = scene.visualBeats[0].visualMode;
    }
  }

  const parsed = renderSpecSchema.parse(compiled);
  assertProtectedSemanticFieldsUnchanged(spec, parsed);
  validateVisualGrammarContract(parsed);
  validateOutput?.(parsed);
  return {
    spec: parsed,
    report: {
      contractVersion: "1.0.0",
      episodeDate: spec.episode.targetDate,
      sourceRenderSpecSha256,
      candidateCatalogSha256: catalogSha,
      selectionCount: selected.length,
      semanticDiff: "PASS",
      warnings: analyzeWarnings(selected),
    },
  };
};