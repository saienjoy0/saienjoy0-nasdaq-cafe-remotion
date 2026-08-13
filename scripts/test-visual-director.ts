import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {RenderSpec} from "../src/spec/render-spec";
import {
  buildVisualCandidateCatalog,
  buildVisualCandidateCatalogVNext,
  candidateTemplatesForCapabilities,
} from "../src/spec/visual-candidate-builder";
import {
  buildVisualCandidateInputFromRenderSpec,
  buildVisualCapabilityInventory,
} from "../src/spec/visual-candidate-input";
import {VISUAL_COMPONENT_REGISTRY} from "../src/spec/visual-component-registry";
import {VISUAL_TEMPLATE_IDS} from "../src/spec/visual-template-contract";
import {
  assertProtectedSemanticFieldsUnchanged,
  compileVisualDirection,
} from "../src/spec/visual-direction-compiler";
import {
  sha256Json,
  visualDirectionPlanSchema,
  type EvidenceCapability,
  type VisualCandidateCatalog,
  type VisualDirectionPlan,
} from "../src/spec/visual-director-contract";
import {validateVisualGrammarContract} from "../src/spec/validate-visual-grammar";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const spec = makeCurrentVisualDirectorFixture();
validateVisualGrammarContract(spec);
const sourceSha = sha256Json(spec);

assert.equal(Object.keys(VISUAL_COMPONENT_REGISTRY).length, VISUAL_TEMPLATE_IDS.length, "registry must cover every Visual Template");
for (const templateId of VISUAL_TEMPLATE_IDS) {
  const descriptor = VISUAL_COMPONENT_REGISTRY[templateId];
  assert.equal(descriptor.id, templateId);
  assert.equal(descriptor.status, "production");
  assert.ok(descriptor.allowedGrammarIds.length > 0);
  assert.ok(descriptor.variants.includes(descriptor.defaultVariant));
}

const candidateInput = buildVisualCandidateInputFromRenderSpec({
  spec,
  editorialSnapshotSha256: sourceSha,
});
const sourceBeatCount = spec.scenes.reduce((sum, scene) => sum + scene.visualBeats.length, 0);
assert.equal(candidateInput.beats.length, sourceBeatCount, "VisualCandidateInput must cover every Beat");
assert.equal(candidateInput.editorialSnapshotSha256, sourceSha);
const capabilityInventory = buildVisualCapabilityInventory(candidateInput);
assert.equal(capabilityInventory.beats.length, sourceBeatCount, "Capability Inventory must cover every Beat");
assert.equal(capabilityInventory.visualCandidateInputSha256, sha256Json(candidateInput));

type BeatEntry = {
  scene: RenderSpec["scenes"][number];
  beat: RenderSpec["scenes"][number]["visualBeats"][number];
};

const beatEntries = (value: RenderSpec): BeatEntry[] =>
  value.scenes.flatMap((scene) => scene.visualBeats.map((beat) => ({scene, beat})));

const beat = (value: RenderSpec, id: string) =>
  beatEntries(value).find((item) => item.beat.beatId === id)?.beat ??
  (() => { throw new Error(`missing synthetic Visual Beat: ${id}`); })();

const selectedNumbers = (entry: BeatEntry) => {
  const selected = new Set(entry.beat.objectIds);
  return entry.scene.numbers.filter((number) => selected.has(number.numberId));
};

const scenarios = JSON.parse(readFileSync("fixtures/visual-director/capability-scenarios.json", "utf8")) as Array<{
  name: string;
  capabilities: EvidenceCapability[];
  mustInclude: string[];
}>;
for (const scenario of scenarios) {
  const templates = candidateTemplatesForCapabilities(scenario.capabilities);
  scenario.mustInclude.forEach((template) => assert.ok(templates.includes(template as never), `${scenario.name} must include ${template}`));
}

const catalog = buildVisualCandidateCatalog({spec, sourceRenderSpecSha256: sourceSha});
assert.deepEqual(catalog, buildVisualCandidateCatalog({spec, sourceRenderSpecSha256: sourceSha}), "catalog must be deterministic");

const gapEntry = beatEntries(spec).find((item) => item.beat.visualTemplate === "expected-actual-gap-flow");
assert.ok(gapEntry, "synthetic fixture requires a gap Beat");
assert.ok(catalog.candidates.some((item) => item.visualBeatId === gapEntry.beat.beatId && item.capability === "gap"));

const verificationEntry = beatEntries(spec).find((item) => item.beat.visualTemplate === "verification-checklist");
assert.ok(verificationEntry, "synthetic fixture requires a verification Beat");
assert.ok(catalog.candidates.some((item) => item.visualBeatId === verificationEntry.beat.beatId && item.capability === "verification"));

const entityEntry = beatEntries(spec).find((item) => item.beat.entity != null);
assert.ok(entityEntry, "synthetic fixture requires an entity Beat");
assert.ok(catalog.candidates.some((item) => item.visualBeatId === entityEntry.beat.beatId && item.capability === "entity" && item.realityAnchor));

const currentCandidate = (value: RenderSpec, beatId: string, source: VisualCandidateCatalog) => {
  const current = beat(value, beatId);
  const found = source.candidates.find((candidate) =>
    candidate.visualBeatId === beatId &&
    candidate.visualTemplate === current.visualTemplate &&
    candidate.screenState === current.screenState &&
    candidate.visualMode === current.visualMode &&
    sha256Json(candidate.templateConfig) === sha256Json(current.templateConfig) &&
    sha256Json(candidate.objectIds) === sha256Json(current.objectIds) &&
    sha256Json(candidate.assetPlacementIds) === sha256Json(current.assetPlacementIds));
  assert.ok(found, `current candidate missing for ${beatId}`);
  return found;
};

const selections = spec.scenes.flatMap((scene) => scene.visualBeats.map((item) => ({
  visualBeatId: item.beatId,
  candidateId: currentCandidate(spec, item.beatId, catalog).candidateId,
})));
const plan: VisualDirectionPlan = {
  contractVersion: "1.0.0",
  episodeDate: spec.episode.targetDate,
  candidateCatalogSha256: sha256Json(catalog),
  selections,
};
const compiled = compileVisualDirection({spec, sourceRenderSpecSha256: sourceSha, catalog, plan});
assert.equal(compiled.report.semanticDiff, "PASS");
assert.deepEqual(compiled.spec, spec, "selecting current candidates must be identity-preserving");

const comparison = cloneTestValue(spec);
const comparisonEntry = beatEntries(comparison).find((item) =>
  item.beat.visualTemplate === "metric-comparison-board" && selectedNumbers(item).length >= 2,
);
assert.ok(comparisonEntry, "synthetic fixture requires an aligned metric comparison Beat");
const comparisonHints = {
  contractVersion: "1.0.0" as const,
  episodeDate: comparison.episode.targetDate,
  beats: [{visualBeatId: comparisonEntry.beat.beatId, capabilities: ["comparison-set" as const]}],
};
const comparisonCatalog = buildVisualCandidateCatalog({
  spec: comparison,
  sourceRenderSpecSha256: sha256Json(comparison),
  hints: comparisonHints,
});
assert.ok(comparisonCatalog.candidates.some((item) => item.visualBeatId === comparisonEntry.beat.beatId && item.capability === "comparison-set"));

const comparisonSceneIndex = comparison.scenes.findIndex((scene) =>
  scene.visualBeats.some((item) => item.beatId === comparisonEntry.beat.beatId));
assert.ok(comparisonSceneIndex >= 0);
const vNextComparison = cloneTestValue(comparison);
vNextComparison.scenes = [vNextComparison.scenes[comparisonSceneIndex]];
vNextComparison.scenes[0].visualBeats = vNextComparison.scenes[0].visualBeats.filter((item) => item.beatId === comparisonEntry.beat.beatId);
const vNextCatalog = buildVisualCandidateCatalogVNext({
  spec: vNextComparison,
  sourceRenderSpecSha256: sha256Json(vNextComparison),
  hints: {
    contractVersion: "1.0.0",
    episodeDate: vNextComparison.episode.targetDate,
    beats: [{visualBeatId: comparisonEntry.beat.beatId, capabilities: ["comparison-set"]}],
  },
});
assert.ok(vNextCatalog.candidates.some((item) => item.visualTemplate === "focus-matrix"), "vNext must discover a legal alternative instead of locking to the authored template");
assert.throws(() => buildVisualCandidateCatalogVNext({
  spec: vNextComparison,
  sourceRenderSpecSha256: sha256Json(vNextComparison),
  hints: {
    contractVersion: "1.1.0",
    episodeDate: vNextComparison.episode.targetDate,
    beats: [{
      visualBeatId: comparisonEntry.beat.beatId,
      capabilities: ["comparison-set"],
      templatePolicy: {mode: "authored-only"},
    }],
  },
}), /authored-only requires the legacy compatibility path/);

const mismatch = cloneTestValue(comparison);
const mismatchEntry = beatEntries(mismatch).find((item) => item.beat.beatId === comparisonEntry.beat.beatId)!;
const mismatchNumbers = selectedNumbers(mismatchEntry);
assert.ok(mismatchNumbers.length >= 2);
mismatchNumbers[0].comparison = "終日";
mismatchNumbers[1].comparison = "1分";
const mismatchCatalog = buildVisualCandidateCatalog({
  spec: mismatch,
  sourceRenderSpecSha256: sha256Json(mismatch),
  hints: {
    ...comparisonHints,
    episodeDate: mismatch.episode.targetDate,
  },
});
assert.ok(!mismatchCatalog.candidates.some((item) => item.visualBeatId === mismatchEntry.beat.beatId && item.capability === "comparison-set"), "mixed comparison bases must be rejected");

const sourceDocument = cloneTestValue(spec);
const sourceScene = sourceDocument.scenes[0];
const sourceBeat = sourceScene.visualBeats[0];
const sourcePlacementId = "scene-01-placement-source-test";
sourceScene.assetPlacements.push({
  placementId: sourcePlacementId,
  assetId: "company_nvda",
  role: "main-media",
  region: "main-stage",
  fit: "contain",
  opacity: 1,
  startChunkId: sourceBeat.startChunkId,
  endChunkId: sourceBeat.endChunkId,
});
sourceBeat.visualTemplate = "source-receipt";
sourceBeat.visualGrammarId = "evidence";
sourceBeat.templateVariant = "receipt";
sourceBeat.visualMode = "news-media";
sourceBeat.screenState = "Data";
sourceBeat.templateConfig = {
  variant: "receipt",
  comparisonBasis: null,
  dataBasis: "TEST SOURCE DOCUMENT",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
};
sourceBeat.objectIds = [sourceScene.cards[0].cardId];
sourceBeat.assetPlacementIds = [sourcePlacementId];
sourceBeat.assetState = "ready";
sourceBeat.evidenceSourceIds = ["source-001"];
const sourceCatalog = buildVisualCandidateCatalog({
  spec: sourceDocument,
  sourceRenderSpecSha256: sha256Json(sourceDocument),
});
assert.ok(sourceCatalog.candidates.some((item) => item.visualBeatId === sourceBeat.beatId && item.capability === "source-document" && item.realityAnchor));

const noEvidence = cloneTestValue(sourceDocument);
noEvidence.scenes[0].visualBeats[0].evidenceSourceIds = [];
assert.throws(
  () => buildVisualCandidateCatalog({
    spec: noEvidence,
    sourceRenderSpecSha256: sha256Json(noEvidence),
  }),
  /Candidate Builder produced no legal candidate/,
  "source receipt must fail closed without cited evidence",
);

const verifiedSeries = cloneTestValue(spec);
const seriesScene = verifiedSeries.scenes[0];
const seriesBeat = seriesScene.visualBeats[0];
seriesScene.numbers.push(
  {numberId: "timeline-event", label: "公式発表", value: "0.0%", numericValue: 0, precision: 2, unit: "%", comparison: null, tone: "neutral"},
  {numberId: "timeline-lead", label: "主役銘柄", value: "+4.2%", numericValue: 4.2, precision: 2, unit: "%", comparison: null, tone: "positive"},
  {numberId: "timeline-index", label: "NASDAQ", value: "+0.8%", numericValue: 0.8, precision: 2, unit: "%", comparison: null, tone: "positive"},
);
seriesBeat.visualTemplate = "event-reaction-timeline";
seriesBeat.visualGrammarId = "reaction";
seriesBeat.templateVariant = "verified-series";
seriesBeat.visualMode = "timeline";
seriesBeat.screenState = "Chart";
seriesBeat.objectIds = ["timeline-event", "timeline-lead", "timeline-index"];
seriesBeat.templateConfig = {
  variant: "verified-series",
  comparisonBasis: "official event and verified market series",
  dataBasis: "verified intraday series",
  nodeOrder: [],
  laneLabels: [],
  outcomeNodeId: null,
  reactionTimeline: {
    precision: "verified-intraday-series",
    eventOrderIds: ["timeline-event", "timeline-lead", "timeline-index"],
    seriesObjectIds: ["timeline-event", "timeline-lead", "timeline-index"],
  },
};
const verifiedSeriesCatalog = buildVisualCandidateCatalog({
  spec: verifiedSeries,
  sourceRenderSpecSha256: sha256Json(verifiedSeries),
});
assert.ok(verifiedSeriesCatalog.candidates.some((item) => item.visualBeatId === seriesBeat.beatId && item.visualTemplate === "event-reaction-timeline" && item.templateVariant === "verified-series"));

const noSeries = cloneTestValue(verifiedSeries);
delete noSeries.scenes[0].visualBeats[0].templateConfig.reactionTimeline;
assert.throws(
  () => buildVisualCandidateCatalog({spec: noSeries, sourceRenderSpecSha256: sha256Json(noSeries)}),
  /Candidate Builder produced no legal candidate/,
  "verified timeline must fail closed without verified series evidence",
);

const companyMention = cloneTestValue(spec);
companyMention.scenes[0].narrationChunks[0].speechText += " NVIDIA";
companyMention.scenes[0].narrationChunks[0].captionText += " NVIDIA";
const companyCatalog = buildVisualCandidateCatalog({spec: companyMention, sourceRenderSpecSha256: sha256Json(companyMention)});
const firstBeatId = companyMention.scenes[0].visualBeats[0].beatId;
assert.ok(!companyCatalog.candidates.some((item) => item.visualBeatId === firstBeatId && item.visualTemplate === "entity-card-full"), "first mention alone must not require entity card");

const badCatalog = cloneTestValue(catalog);
const chosen = badCatalog.candidates.find((item) => item.candidateId === selections[0].candidateId)!;
chosen.assetIds.push("fictional-asset");
const badPlan = {...plan, candidateCatalogSha256: sha256Json(badCatalog)};
assert.throws(() => compileVisualDirection({spec, sourceRenderSpecSha256: sourceSha, catalog: badCatalog, plan: badPlan}), /asset inventory mismatch/);

const mutated = cloneTestValue(spec);
mutated.scenes[0].narrationChunks[0].speechText += " mutation";
assert.throws(() => assertProtectedSemanticFieldsUnchanged(spec, mutated), /PROTECTED_SEMANTIC_DIFF_FAIL/);

assert.throws(() => visualDirectionPlanSchema.parse({
  ...plan,
  selections: [{...plan.selections[0], visualTemplate: "text-focus"}],
}), /unrecognized_keys|Unrecognized key/);

console.log(`visual director tests passed: ${catalog.candidates.length} candidates / ${selections.length} Beats`);
