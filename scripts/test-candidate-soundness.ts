import assert from "node:assert/strict";
import test from "node:test";
import type {RenderSpec} from "../src/spec/render-spec";
import {isFinancialVisualTemplate} from "../src/spec/financial-visual-contract";
import {preflightStaticViewerLayout} from "../src/spec/preflight-static-viewer-layout";
import {buildVisualCandidateCatalogVNext} from "../src/spec/visual-candidate-builder";
import {sha256Json} from "../src/spec/visual-director-contract";
import {makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const singleBeatSpec = (
  source: RenderSpec,
  sceneIndex: number,
  beatId: string,
): RenderSpec => {
  const value = structuredClone(source);
  const scene = value.scenes[sceneIndex];
  const beat = scene.visualBeats.find((item) => item.beatId === beatId);
  if (!beat) throw new Error(`missing test Beat ${beatId}`);
  scene.visualBeats = [beat];
  value.scenes = [scene];
  return value;
};

const findBeat = (
  value: RenderSpec,
  predicate: (beat: RenderSpec["scenes"][number]["visualBeats"][number], scene: RenderSpec["scenes"][number]) => boolean,
) => {
  for (let sceneIndex = 0; sceneIndex < value.scenes.length; sceneIndex += 1) {
    const scene = value.scenes[sceneIndex];
    const beat = scene.visualBeats.find((item) => predicate(item, scene));
    if (beat) return {sceneIndex, beat};
  }
  throw new Error("missing synthetic Beat for candidate soundness test");
};

test("static preflight rejects verification-matrix lane drift before Chromium", () => {
  const source = makeCurrentVisualDirectorFixture();
  const found = findBeat(source, (beat) => beat.visualTemplate === "verification-matrix");
  const value = singleBeatSpec(source, found.sceneIndex, found.beat.beatId);
  const scene = value.scenes[0];
  const beat = scene.visualBeats[0];

  // Keep the fixture focused on the lane contract instead of unrelated inventory.
  beat.objectIds = [];
  beat.viewerTexts = ["強める｜確認材料", "弱める｜反対材料"];
  beat.templateConfig.laneLabels = ["強める", "弱める"];
  assert.doesNotThrow(() => preflightStaticViewerLayout(value));

  beat.templateConfig.laneLabels = [];
  assert.throws(
    () => preflightStaticViewerLayout(value),
    /verification-matrix requires exactly two lanes/,
  );
});

test("vNext derives bilateral lane labels only from existing viewer text", () => {
  const source = makeCurrentVisualDirectorFixture();
  const found = findBeat(source, (beat) => beat.visualTemplate === "verification-checklist");
  const value = singleBeatSpec(source, found.sceneIndex, found.beat.beatId);
  const scene = value.scenes[0];
  const beat = scene.visualBeats[0];
  const card = scene.cards[0];
  assert.ok(card, "verification test requires one card");

  beat.objectIds = [card.cardId];
  beat.viewerTexts = ["強める｜確認材料", "弱める｜反対材料"];
  const hints = {
    contractVersion: "1.0.0" as const,
    episodeDate: value.episode.targetDate,
    beats: [{visualBeatId: beat.beatId, capabilities: ["verification" as const]}],
  };
  const catalog = buildVisualCandidateCatalogVNext({
    spec: value,
    sourceRenderSpecSha256: sha256Json(value),
    hints,
  });
  const matrix = catalog.candidates.find((candidate) =>
    candidate.visualBeatId === beat.beatId && candidate.visualTemplate === "verification-matrix",
  );
  assert.ok(matrix, "bilateral viewer text must make verification-matrix locally legal");
  assert.deepEqual(matrix.templateConfig.laneLabels, ["強める", "弱める"]);

  const malformed = structuredClone(value);
  malformed.scenes[0].visualBeats[0].viewerTexts = ["確認材料だけ"];
  const malformedCatalog = buildVisualCandidateCatalogVNext({
    spec: malformed,
    sourceRenderSpecSha256: sha256Json(malformed),
    hints: {...hints, episodeDate: malformed.episode.targetDate},
  });
  assert.ok(
    !malformedCatalog.candidates.some((candidate) =>
      candidate.visualBeatId === beat.beatId && candidate.visualTemplate === "verification-matrix"),
    "machine must not invent lane semantics when viewer text does not expose two lanes",
  );
});

test("generic Beats exclude financial-only Templates and traced Beats stay on their approved Template", () => {
  const source = makeCurrentVisualDirectorFixture();
  const found = findBeat(source, (beat, scene) => {
    if (beat.visualTemplate !== "metric-comparison-board") return false;
    const selected = new Set(beat.objectIds);
    return scene.numbers.filter((number) => selected.has(number.numberId)).length >= 2;
  });
  const generic = singleBeatSpec(source, found.sceneIndex, found.beat.beatId);
  const genericBeat = generic.scenes[0].visualBeats[0];
  const hints = {
    contractVersion: "1.0.0" as const,
    episodeDate: generic.episode.targetDate,
    beats: [{visualBeatId: genericBeat.beatId, capabilities: ["comparison-set" as const]}],
  };
  const genericCatalog = buildVisualCandidateCatalogVNext({
    spec: generic,
    sourceRenderSpecSha256: sha256Json(generic),
    hints,
  });
  assert.ok(
    genericCatalog.candidates.some((candidate) => candidate.visualTemplate === "focus-matrix"),
    "generic comparison Beat must retain legitimate AI-B visual choice",
  );
  assert.ok(
    genericCatalog.candidates.every((candidate) => !isFinancialVisualTemplate(candidate.visualTemplate)),
    "generic Beat must not receive financial-only Templates without financial lineage",
  );

  const traced = structuredClone(generic);
  const tracedScene = traced.scenes[0];
  const tracedBeat = tracedScene.visualBeats[0];
  const selected = new Set(tracedBeat.objectIds);
  const metricIds = tracedScene.numbers
    .filter((number) => selected.has(number.numberId))
    .map((number) => number.numberId)
    .slice(0, 6);
  const comparisonBasis = tracedBeat.templateConfig.comparisonBasis ?? "TEST COMPARISON BASIS";
  tracedBeat.templateConfig.comparisonBasis = comparisonBasis;
  tracedBeat.templateConfig.displayOrder = [...tracedBeat.objectIds];
  tracedBeat.templateConfig.metricIds = [...metricIds];
  tracedBeat.templateConfig.causalStepIds = [];
  tracedBeat.financialReturnTarget = "TEST RETURN TARGET";
  tracedBeat.financialVisualTrace = {
    contractVersion: "1.0.0",
    intentId: "fvi-test-candidate-lock",
    selectedPlanId: "fvp-test-candidate-lock",
    selectedPlanSha256: "0".repeat(64),
    selectedPath: "fallback",
    recipeId: "expected-anchor",
    recipePlanSha256: "1".repeat(64),
    finalEpisodeContractSha256: "2".repeat(64),
    sourceIds: [...tracedBeat.evidenceSourceIds],
    metricIds: [...metricIds],
    causalStepIds: [],
    displayOrder: [...tracedBeat.objectIds],
    comparisonBasis,
    reasonCodes: ["synthetic fallback"],
  };

  const tracedCatalog = buildVisualCandidateCatalogVNext({
    spec: traced,
    sourceRenderSpecSha256: sha256Json(traced),
    hints: {...hints, episodeDate: traced.episode.targetDate},
  });
  const candidates = tracedCatalog.candidates.filter((candidate) => candidate.visualBeatId === tracedBeat.beatId);
  assert.ok(candidates.length > 0, "traced Beat must keep its approved financial Candidate");
  assert.ok(
    candidates.every((candidate) => candidate.visualTemplate === tracedBeat.visualTemplate),
    "v1.2 traced Beat must expose only the currently approved Financial Template",
  );
  assert.deepEqual(candidates[0].templateConfig.displayOrder, tracedBeat.templateConfig.displayOrder);
  assert.deepEqual(candidates[0].templateConfig.metricIds, tracedBeat.templateConfig.metricIds);
  assert.deepEqual(candidates[0].templateConfig.causalStepIds, tracedBeat.templateConfig.causalStepIds);
});
