import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import {
  buildVisualCandidateCatalog,
  candidateTemplatesForCapabilities,
} from "../src/spec/visual-candidate-builder";
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

const specBytes = readFileSync("render-specs/2026-08-10/render_spec.json");
const spec = renderSpecSchema.parse(JSON.parse(specBytes.toString("utf8")));
const sourceSha = createHash("sha256").update(specBytes).digest("hex");
const clone = <T,>(value: T): T => structuredClone(value);
const beat = (value: RenderSpec, id: string) => value.scenes.flatMap((scene) => scene.visualBeats).find((item) => item.beatId === id)!;

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
assert.ok(catalog.candidates.some((item) => item.visualBeatId === "vb-06-01" && item.visualTemplate === "event-reaction-timeline" && item.templateVariant === "verified-series"));
assert.ok(catalog.candidates.some((item) => item.visualBeatId === "vb-07-01" && item.capability === "source-document" && item.realityAnchor));
assert.ok(catalog.candidates.some((item) => item.visualBeatId === "vb-03-01" && item.capability === "gap"));
assert.ok(catalog.candidates.some((item) => item.visualBeatId === "scene-08-beat-001" && item.capability === "verification"));

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

const noSeriesCatalog = buildVisualCandidateCatalog({
  spec,
  sourceRenderSpecSha256: sourceSha,
  hints: {contractVersion: "1.0.0", episodeDate: spec.episode.targetDate, beats: [{visualBeatId: "vb-01-01", capabilities: ["time-series"]}]},
});
assert.ok(!noSeriesCatalog.candidates.some((item) => item.visualBeatId === "vb-01-01" && item.visualTemplate === "event-reaction-timeline"), "verified timeline must not exist without verified series");

const mismatch = clone(spec);
const mismatchBeat = beat(mismatch, "vb-02-01");
const mismatchScene = mismatch.scenes.find((scene) => scene.visualBeats.includes(mismatchBeat))!;
const selectedNumbers = mismatchScene.numbers.filter((number) => mismatchBeat.objectIds.includes(number.numberId));
assert.ok(selectedNumbers.length >= 2);
selectedNumbers[0].comparison = "終日";
selectedNumbers[1].comparison = "1分";
const mismatchCatalog = buildVisualCandidateCatalog({
  spec: mismatch,
  sourceRenderSpecSha256: sourceSha,
  hints: {contractVersion: "1.0.0", episodeDate: spec.episode.targetDate, beats: [{visualBeatId: "vb-02-01", capabilities: ["comparison-set"]}]},
});
assert.ok(!mismatchCatalog.candidates.some((item) => item.visualBeatId === "vb-02-01" && item.capability === "comparison-set"), "mixed comparison bases must be rejected");

const noEvidence = clone(spec);
beat(noEvidence, "vb-02-01").evidenceSourceIds = [];
const noEvidenceCatalog = buildVisualCandidateCatalog({
  spec: noEvidence,
  sourceRenderSpecSha256: sourceSha,
  hints: {contractVersion: "1.0.0", episodeDate: spec.episode.targetDate, beats: [{visualBeatId: "vb-02-01", capabilities: ["source-document"]}]},
});
assert.ok(!noEvidenceCatalog.candidates.some((item) => item.visualBeatId === "vb-02-01" && ["source-receipt", "news-media"].includes(item.visualTemplate)), "source receipt needs cited evidence");

const companyMention = clone(spec);
companyMention.scenes[0].narrationChunks[0].speechText += " NVIDIA";
companyMention.scenes[0].narrationChunks[0].captionText += " NVIDIA";
const companyCatalog = buildVisualCandidateCatalog({spec: companyMention, sourceRenderSpecSha256: sourceSha});
assert.ok(!companyCatalog.candidates.some((item) => item.visualBeatId === "vb-01-01" && item.visualTemplate === "entity-card-full"), "first mention alone must not require entity card");

const badCatalog = clone(catalog);
const chosen = badCatalog.candidates.find((item) => item.candidateId === selections[0].candidateId)!;
chosen.assetIds.push("fictional-asset");
const badPlan = {...plan, candidateCatalogSha256: sha256Json(badCatalog)};
assert.throws(() => compileVisualDirection({spec, sourceRenderSpecSha256: sourceSha, catalog: badCatalog, plan: badPlan}), /asset inventory mismatch/);

const mutated = clone(spec);
mutated.scenes[0].narrationChunks[0].speechText += " mutation";
assert.throws(() => assertProtectedSemanticFieldsUnchanged(spec, mutated), /PROTECTED_SEMANTIC_DIFF_FAIL/);

assert.throws(() => visualDirectionPlanSchema.parse({
  ...plan,
  selections: [{...plan.selections[0], visualTemplate: "text-focus"}],
}), /unrecognized_keys|Unrecognized key/);

console.log(`visual director tests passed: ${catalog.candidates.length} candidates / ${selections.length} Beats`);
