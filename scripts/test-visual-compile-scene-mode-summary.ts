import assert from "node:assert/strict";
import {
  buildVisualCandidateCatalog,
} from "../src/spec/visual-candidate-builder";
import {
  compileVisualDirection,
} from "../src/spec/visual-direction-compiler";
import {
  sha256Json,
  type VisualDirectionPlan,
} from "../src/spec/visual-director-contract";
import {
  cloneTestValue,
  makeCurrentVisualDirectorFixture,
} from "./test-support/current-visual-grammar-fixture";

const spec = cloneTestValue(makeCurrentVisualDirectorFixture());
const sourceSha = sha256Json(spec);
const catalog = buildVisualCandidateCatalog({spec, sourceRenderSpecSha256: sourceSha});

const allBeats = spec.scenes.flatMap((scene) =>
  scene.visualBeats.map((beat) => ({scene, beat})),
);

const same = (left: unknown, right: unknown) => sha256Json(left) === sha256Json(right);
const currentCandidateFor = (sceneId: string, beatId: string) => {
  const scene = spec.scenes.find((item) => item.sceneId === sceneId)!;
  const beat = scene.visualBeats.find((item) => item.beatId === beatId)!;
  const candidate = catalog.candidates.find((item) =>
    item.visualBeatId === beatId &&
    item.visualTemplate === beat.visualTemplate &&
    item.visualMode === beat.visualMode &&
    item.screenState === beat.screenState &&
    same(item.templateConfig, beat.templateConfig) &&
    same(item.objectIds, beat.objectIds) &&
    same(item.assetPlacementIds, beat.assetPlacementIds));
  assert.ok(candidate, `current candidate missing for ${beatId}`);
  return candidate;
};

const target = allBeats.find(({scene, beat}) =>
  catalog.candidates.some((candidate) =>
    candidate.visualBeatId === beat.beatId && candidate.visualMode !== scene.visualMode),
);
assert.ok(target, "fixture must expose a legal Candidate whose mode differs from the authored Scene summary");

const targetCandidate = catalog.candidates.find((candidate) =>
  candidate.visualBeatId === target.beat.beatId && candidate.visualMode !== target.scene.visualMode,
)!;

const selections = allBeats.map(({scene, beat}) => ({
  visualBeatId: beat.beatId,
  candidateId:
    beat.beatId === target.beat.beatId
      ? targetCandidate.candidateId
      : currentCandidateFor(scene.sceneId, beat.beatId).candidateId,
}));
const plan: VisualDirectionPlan = {
  contractVersion: "1.0.0",
  episodeDate: spec.episode.targetDate,
  candidateCatalogSha256: sha256Json(catalog),
  selections,
};

const compiled = compileVisualDirection({
  spec,
  sourceRenderSpecSha256: sourceSha,
  catalog,
  plan,
});
assert.equal(compiled.report.semanticDiff, "PASS");

for (const scene of compiled.spec.scenes) {
  assert.ok(scene.visualBeats.length > 0);
  assert.equal(
    scene.visualMode,
    scene.visualBeats[0].visualMode,
    `${scene.sceneId}: Scene summary mode must equal the first compiled Visual Beat`,
  );
}

const compiledTargetScene = compiled.spec.scenes.find((scene) =>
  scene.visualBeats.some((beat) => beat.beatId === target.beat.beatId),
)!;
assert.equal(compiledTargetScene.visualMode, compiledTargetScene.visualBeats[0].visualMode);
assert.equal(spec.scenes.find((scene) => scene.sceneId === target.scene.sceneId)!.visualMode, target.scene.visualMode);

console.log(
  `visual compile scene-mode summary test passed: ${target.scene.sceneId}/${target.beat.beatId} -> ${targetCandidate.visualMode}`,
);
