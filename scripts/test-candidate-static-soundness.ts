import "./test-visual-candidate-coverage";
import assert from "node:assert/strict";
import {assertStaticTemplateSoundness} from "../src/spec/static-template-soundness";
import {buildVisualCandidateCatalogVNext} from "../src/spec/visual-candidate-builder";
import {getVisualComponentDescriptor} from "../src/spec/visual-component-registry";
import {sha256Json} from "../src/spec/visual-director-contract";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const source = makeCurrentVisualDirectorFixture();
const verificationScene = source.scenes.find((scene) =>
  scene.visualBeats.some((beat) => beat.visualTemplate === "verification-checklist"),
);
assert.ok(verificationScene, "current fixture requires a verification Beat");
const verificationBeat = verificationScene.visualBeats.find(
  (beat) => beat.visualTemplate === "verification-checklist",
);
assert.ok(verificationBeat);

const invalidMatrixScene = cloneTestValue(verificationScene);
const invalidMatrixBeat = invalidMatrixScene.visualBeats.find(
  (beat) => beat.beatId === verificationBeat.beatId,
)!;
invalidMatrixBeat.visualTemplate = "verification-matrix";
invalidMatrixBeat.templateVariant = "strengthen-vs-weaken";
invalidMatrixBeat.visualMode = "verification-points";
invalidMatrixBeat.screenState = "Data";
invalidMatrixBeat.viewerTexts = ["支持｜確認材料", "反証｜反対材料"];
invalidMatrixBeat.templateConfig = {
  ...invalidMatrixBeat.templateConfig,
  variant: "strengthen-vs-weaken",
  laneLabels: [],
};
assert.throws(
  () => assertStaticTemplateSoundness(
    invalidMatrixScene,
    invalidMatrixBeat,
    "$.synthetic.verification-matrix",
  ),
  /verification-matrix requires exactly two lanes/,
  "the render-time lane invariant must be available before Chrome starts",
);
invalidMatrixBeat.templateConfig.laneLabels = ["支持", "反証"];
assert.doesNotThrow(() => assertStaticTemplateSoundness(
  invalidMatrixScene,
  invalidMatrixBeat,
  "$.synthetic.verification-matrix",
));

// Exact Current-v2 compatibility shape: the pre-VI RenderSpec has the authored
// template but no explicit templateVariant, while templateConfig.variant carries
// the schema-compatible placeholder "default". Candidate Builder owns the
// Renderer registry and must never publish that placeholder as a legal Candidate
// when the selected template does not register it.
const matrixCandidateSpec = cloneTestValue(source);
const matrixSceneIndex = matrixCandidateSpec.scenes.findIndex((scene) =>
  scene.visualBeats.some((beat) => beat.beatId === verificationBeat.beatId),
);
assert.ok(matrixSceneIndex >= 0);
const matrixScene = matrixCandidateSpec.scenes[matrixSceneIndex];
const matrixBeat = matrixScene.visualBeats.find((beat) => beat.beatId === verificationBeat.beatId)!;
matrixBeat.visualTemplate = "verification-matrix";
matrixBeat.templateVariant = undefined;
matrixBeat.visualMode = "verification-points";
matrixBeat.screenState = "Data";
matrixBeat.viewerTexts = ["支持｜確認材料", "反証｜反対材料"];
matrixBeat.templateConfig = {
  ...matrixBeat.templateConfig,
  variant: "default",
  laneLabels: ["支持", "反証"],
};
matrixCandidateSpec.scenes = [matrixScene];
matrixScene.visualBeats = [matrixBeat];
const matrixCatalog = buildVisualCandidateCatalogVNext({
  spec: matrixCandidateSpec,
  sourceRenderSpecSha256: sha256Json(matrixCandidateSpec),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: matrixCandidateSpec.episode.targetDate,
    beats: [{visualBeatId: matrixBeat.beatId, capabilities: ["verification"]}],
  },
});
const matrixCandidate = matrixCatalog.candidates.find(
  (candidate) => candidate.visualTemplate === "verification-matrix",
);
assert.ok(matrixCandidate, "verification-matrix must remain available when its static contract is satisfiable");
assert.deepEqual(
  matrixCandidate.templateConfig.laneLabels,
  ["支持", "反証"],
  "lane labels must be derived from existing viewer text rather than invented by Machine",
);
assert.equal(
  matrixCandidate.templateVariant,
  "strengthen-vs-weaken",
  "an unsupported pre-VI placeholder must resolve to the Renderer registry default",
);
assert.equal(
  matrixCandidate.templateConfig.variant,
  "strengthen-vs-weaken",
  "Candidate templateConfig.variant must match the Renderer registry default",
);
for (const candidate of matrixCatalog.candidates) {
  const descriptor = getVisualComponentDescriptor(candidate.visualTemplate);
  assert.ok(
    descriptor.variants.includes(candidate.templateVariant),
    `${candidate.candidateId}: Candidate templateVariant must be registered for ${candidate.visualTemplate}`,
  );
  assert.ok(
    descriptor.variants.includes(candidate.templateConfig.variant),
    `${candidate.candidateId}: Candidate templateConfig.variant must be registered for ${candidate.visualTemplate}`,
  );
  assert.equal(
    candidate.templateVariant,
    candidate.templateConfig.variant,
    `${candidate.candidateId}: Candidate variant fields must stay identical`,
  );
}

const noLaneEvidenceSpec = cloneTestValue(source);
const noLaneSceneIndex = noLaneEvidenceSpec.scenes.findIndex((scene) =>
  scene.visualBeats.some((beat) => beat.beatId === verificationBeat.beatId),
);
const noLaneScene = noLaneEvidenceSpec.scenes[noLaneSceneIndex];
const noLaneBeat = noLaneScene.visualBeats.find((beat) => beat.beatId === verificationBeat.beatId)!;
noLaneBeat.viewerTexts = ["確認材料", "反対材料"];
noLaneEvidenceSpec.scenes = [noLaneScene];
noLaneScene.visualBeats = [noLaneBeat];
const noLaneCatalog = buildVisualCandidateCatalogVNext({
  spec: noLaneEvidenceSpec,
  sourceRenderSpecSha256: sha256Json(noLaneEvidenceSpec),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: noLaneEvidenceSpec.episode.targetDate,
    beats: [{visualBeatId: noLaneBeat.beatId, capabilities: ["verification"]}],
  },
});
assert.ok(
  !noLaneCatalog.candidates.some((candidate) => candidate.visualTemplate === "verification-matrix"),
  "an unverifiable two-lane Candidate must be removed from the Catalog instead of patched later",
);

const financialSpec = cloneTestValue(source);
const financialScene = financialSpec.scenes[0];
const financialBeat = financialScene.visualBeats[0];
const financialCard = financialScene.cards[0];
financialBeat.visualTemplate = "source-receipt";
financialBeat.visualGrammarId = "evidence";
financialBeat.templateVariant = "receipt";
financialBeat.visualMode = "text-focus";
financialBeat.screenState = "Data";
financialBeat.viewerTexts = ["確認｜公式資料"];
financialBeat.objectIds = [financialCard.cardId];
financialBeat.assetPlacementIds = [];
financialBeat.assetState = "not-required";
financialBeat.evidenceSourceIds = ["source-001"];
financialBeat.financialReturnTarget = "NASDAQへ戻る";
financialBeat.templateConfig = {
  variant: "receipt",
  comparisonBasis: "financial-owned synthetic boundary",
  dataBasis: "financial-recipe-plan",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
  displayOrder: [financialCard.cardId],
  metricIds: [],
  causalStepIds: [],
};
financialBeat.financialVisualTrace = {
  contractVersion: "1.0.0",
  intentId: "fvi-synthetic-source-receipt",
  selectedPlanId: "fvp-synthetic-source-receipt",
  selectedPlanSha256: "a".repeat(64),
  selectedPath: "preferred",
  recipeId: "source-receipt",
  recipePlanSha256: "b".repeat(64),
  finalEpisodeContractSha256: "c".repeat(64),
  sourceIds: ["source-001"],
  metricIds: [],
  causalStepIds: [],
  displayOrder: [financialCard.cardId],
  comparisonBasis: "financial-owned synthetic boundary",
  reasonCodes: [],
};
financialSpec.scenes = [financialScene];
financialScene.visualBeats = [financialBeat];
const financialCatalog = buildVisualCandidateCatalogVNext({
  spec: financialSpec,
  sourceRenderSpecSha256: sha256Json(financialSpec),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: financialSpec.episode.targetDate,
    beats: [{visualBeatId: financialBeat.beatId, capabilities: ["source-document", "quote-social"]}],
  },
});
assert.ok(financialCatalog.candidates.length >= 1);
assert.ok(
  financialCatalog.candidates.every((candidate) => candidate.visualTemplate === "source-receipt"),
  "a genuine Financial-owned Beat must expose only its already-authorized v1.2 Template",
);

console.log("candidate static soundness tests: PASS");
