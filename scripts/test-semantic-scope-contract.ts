import assert from "node:assert/strict";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import {buildVisualCandidateInputFromRenderSpec} from "../src/spec/visual-candidate-input";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {sha256Json, type VisualDirectionPlan} from "../src/spec/visual-director-contract";
import {compileVisualDirection} from "../src/spec/visual-direction-compiler";
import {cloneTestValue, makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const SCOPES = ["lead-stock", "sector", "nasdaq", "multiple"] as const;

const makeV25 = (): RenderSpec => {
  const raw = cloneTestValue(makeCurrentVisualDirectorFixture()) as unknown as {
    schemaVersion: string;
    scenes: Array<{visualBeats: Array<Record<string, unknown>>}>;
  };
  raw.schemaVersion = "2.5.0";
  let index = 0;
  for (const scene of raw.scenes) {
    for (const beat of scene.visualBeats) {
      beat.semanticScope = SCOPES[index % SCOPES.length];
      index += 1;
    }
  }
  return renderSpecSchema.parse(raw);
};

const spec = makeV25();
assert.equal(spec.schemaVersion, "2.5.0");
const sourceSha = sha256Json(spec);

const candidateInput = buildVisualCandidateInputFromRenderSpec({spec, editorialSnapshotSha256: sourceSha});
const authoredScopes = spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => beat.semanticScope));
assert.deepEqual(candidateInput.beats.map((beat) => beat.semanticScope), authoredScopes, "VisualCandidateInput must preserve each authored semanticScope");

const catalog = buildVisualCandidateCatalog({spec, sourceRenderSpecSha256: sourceSha});
assert.equal(catalog.rendererContractVersion, "2.5.0");
for (const candidate of catalog.candidates) {
  const authored = spec.scenes.flatMap((scene) => scene.visualBeats).find((beat) => beat.beatId === candidate.visualBeatId);
  assert.ok(authored);
  assert.equal(candidate.semanticScope, authored.semanticScope);
}

const selections = spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => {
  const candidate = catalog.candidates.find((item) => item.visualBeatId === beat.beatId);
  assert.ok(candidate, `missing candidate for ${beat.beatId}`);
  return {visualBeatId: beat.beatId, candidateId: candidate.candidateId};
}));
const plan: VisualDirectionPlan = {contractVersion: "1.0.0", episodeDate: spec.episode.targetDate, candidateCatalogSha256: sha256Json(catalog), selections};
const compiled = compileVisualDirection({spec, sourceRenderSpecSha256: sourceSha, catalog, plan});
assert.deepEqual(compiled.spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => beat.semanticScope)), authoredScopes, "Visual Director compile must preserve semanticScope");

const tampered = cloneTestValue(catalog);
const first = tampered.candidates[0];
assert.ok(first);
first.semanticScope = first.semanticScope === "nasdaq" ? "lead-stock" : "nasdaq";
const tamperedPlan = {...plan, candidateCatalogSha256: sha256Json(tampered)};
assert.throws(() => compileVisualDirection({spec, sourceRenderSpecSha256: sourceSha, catalog: tampered, plan: tamperedPlan}), /semanticScope|semantic scope/i, "candidate semanticScope drift must fail closed");

const legacy = makeCurrentVisualDirectorFixture();
const legacyCatalog = buildVisualCandidateCatalog({spec: legacy, sourceRenderSpecSha256: sha256Json(legacy)});
assert.equal(legacyCatalog.rendererContractVersion, "2.4.0");

console.log("semantic scope renderer contract tests passed");
