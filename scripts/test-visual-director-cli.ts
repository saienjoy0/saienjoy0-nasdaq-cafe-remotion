import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {primaryCapabilityForTemplate} from "../src/spec/visual-component-registry";
import {sha256Json} from "../src/spec/visual-director-contract";
import {makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const root = mkdtempSync(path.join(tmpdir(), "nasdaq-cafe-vnext-cli-"));
try {
  const spec = makeCurrentVisualDirectorFixture();
  // Visual Direction compile runs before Plot's final package materializer expands
  // expression-specific fox placements. The semantic expression is already fixed,
  // but compile must not require the later foxSlightSurprise placement yet.
  spec.scenes[0].initialExpression = "軽い驚き";
  spec.scenes[0].assetPlacements = spec.scenes[0].assetPlacements.filter(
    (placement) => placement.assetId !== "foxSlightSurprise",
  );
  const specPath = path.join(root, "render_spec.json");
  const hintsPath = path.join(root, "visual_capability_hints.json");
  const candidateInputPath = path.join(root, "visual_candidate_input.json");
  const capabilityInventoryPath = path.join(root, "visual_capability_inventory.json");
  const catalogPath = path.join(root, "visual_candidate_catalog.json");
  const editorialSnapshotSha256 = "c".repeat(64);
  const specBytes = JSON.stringify(spec, null, 2) + "\n";
  writeFileSync(specPath, specBytes);
  writeFileSync(
    hintsPath,
    JSON.stringify({
      contractVersion: "1.1.0",
      episodeDate: spec.episode.targetDate,
      beats: spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => ({
        visualBeatId: beat.beatId,
        capabilities: [primaryCapabilityForTemplate(beat.visualTemplate)],
        templatePolicy: {
          mode: "allow-list",
          allowedTemplateIds: [beat.visualTemplate],
        },
      }))),
    }, null, 2) + "\n",
  );

  const result = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "build",
      "--spec", specPath,
      "--catalog", catalogPath,
      "--hints", hintsPath,
      "--candidate-builder", "vnext",
      "--editorial-snapshot-sha256", editorialSnapshotSha256,
      "--candidate-input", candidateInputPath,
      "--capability-inventory", capabilityInventoryPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const candidateInput = JSON.parse(readFileSync(candidateInputPath, "utf8"));
  const capabilityInventory = JSON.parse(readFileSync(capabilityInventoryPath, "utf8"));
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  assert.equal(candidateInput.editorialSnapshotSha256, editorialSnapshotSha256);
  assert.equal(candidateInput.beats.length, spec.scenes.flatMap((scene) => scene.visualBeats).length);
  assert.equal(capabilityInventory.visualCandidateInputSha256, sha256Json(candidateInput));
  assert.equal(catalog.sourceRenderSpecSha256, createHash("sha256").update(specBytes).digest("hex"));
  assert.ok(catalog.candidates.length >= candidateInput.beats.length);

  const validSelections = candidateInput.beats.map((inputBeat: {visualBeatId: string}) => {
    const candidates = catalog.candidates.filter(
      (candidate: {visualBeatId: string}) => candidate.visualBeatId === inputBeat.visualBeatId,
    );
    assert.ok(candidates.length > 0, `missing Candidate for ${inputBeat.visualBeatId}`);
    return {visualBeatId: inputBeat.visualBeatId, candidateId: candidates[0].candidateId};
  });
  const validPlanPath = path.join(root, "valid_visual_direction_plan.json");
  const validOutputPath = path.join(root, "valid_visual_direction_compiled.json");
  const validReportPath = path.join(root, "valid_visual_direction_report.json");
  writeFileSync(
    validPlanPath,
    JSON.stringify({
      contractVersion: "1.0.0",
      episodeDate: spec.episode.targetDate,
      candidateCatalogSha256: sha256Json(catalog),
      selections: validSelections,
    }, null, 2) + "\n",
  );
  const validCompile = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "compile",
      "--spec", specPath,
      "--catalog", catalogPath,
      "--plan", validPlanPath,
      "--output", validOutputPath,
      "--report", validReportPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.equal(validCompile.status, 0, validCompile.stderr || validCompile.stdout);

  // Production compile must invoke the official Visual Story validator instead of
  // reporting success after broad schema/semantic checks only. This synthetic
  // Candidate is globally schema-valid but illegal for its selected Template. The
  // shared Director fixture can expose an earlier Visual Story violation after a
  // synthetic Candidate plan is applied, so this regression asserts the important
  // boundary invariant: the production CLI must fail with a JSON-path Visual Story
  // diagnostic. Candidate-specific variant legality is covered independently by
  // test-candidate-static-soundness.ts.
  const invalidCatalog = structuredClone(catalog);
  const invalidCandidate = invalidCatalog.candidates.find(
    (candidate: {visualTemplate: string}) => candidate.visualTemplate === "verification-checklist",
  );
  assert.ok(invalidCandidate, "fixture must expose a verification-checklist Candidate");
  invalidCandidate.templateVariant = "reported-sequence";
  invalidCandidate.templateConfig.variant = "reported-sequence";

  const selections = candidateInput.beats.map((inputBeat: {visualBeatId: string}) => {
    const candidates = invalidCatalog.candidates.filter(
      (candidate: {visualBeatId: string}) => candidate.visualBeatId === inputBeat.visualBeatId,
    );
    assert.ok(candidates.length > 0, `missing Candidate for ${inputBeat.visualBeatId}`);
    const selected = inputBeat.visualBeatId === invalidCandidate.visualBeatId
      ? invalidCandidate
      : candidates[0];
    return {visualBeatId: inputBeat.visualBeatId, candidateId: selected.candidateId};
  });
  const invalidCatalogPath = path.join(root, "invalid_visual_candidate_catalog.json");
  const invalidPlanPath = path.join(root, "invalid_visual_direction_plan.json");
  const invalidOutputPath = path.join(root, "invalid_visual_direction_compiled.json");
  const invalidReportPath = path.join(root, "invalid_visual_direction_report.json");
  writeFileSync(invalidCatalogPath, JSON.stringify(invalidCatalog, null, 2) + "\n");
  writeFileSync(
    invalidPlanPath,
    JSON.stringify({
      contractVersion: "1.0.0",
      episodeDate: spec.episode.targetDate,
      candidateCatalogSha256: sha256Json(invalidCatalog),
      selections,
    }, null, 2) + "\n",
  );

  const invalidCompile = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "compile",
      "--spec", specPath,
      "--catalog", invalidCatalogPath,
      "--plan", invalidPlanPath,
      "--output", invalidOutputPath,
      "--report", invalidReportPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.notEqual(
    invalidCompile.status,
    0,
    "production Visual Director compile must reject an invalid compiled Visual Story",
  );
  assert.match(
    `${invalidCompile.stderr}\n${invalidCompile.stdout}`,
    /\$\.scenes\[/,
    "compile rejection must come from the official Visual Story validator",
  );

  // A Candidate can be individually legal and still make the selected episode
  // globally illegal. Scene 9 requires at least one final-assembly, so replacing
  // its only final-assembly Candidate with closing-recap must fail during Director
  // compile rather than later during build-production.
  const closureCatalog = structuredClone(catalog);
  const scene9Assembly = closureCatalog.candidates.find(
    (candidate: {visualBeatId: string; visualTemplate: string}) =>
      candidate.visualBeatId.startsWith("scene-09-") && candidate.visualTemplate === "final-assembly",
  );
  assert.ok(scene9Assembly, "production fixture must expose a Scene 9 final-assembly Candidate");
  const closingCandidate = structuredClone(scene9Assembly);
  closingCandidate.candidateId = `${scene9Assembly.candidateId}-closing-recap`;
  closingCandidate.visualTemplate = "closing-recap";
  closingCandidate.templateVariant = "default";
  closingCandidate.templateConfig.variant = "default";
  closureCatalog.candidates.push(closingCandidate);
  const closureSelections = validSelections.map((selection: {visualBeatId: string; candidateId: string}) =>
    selection.visualBeatId === scene9Assembly.visualBeatId
      ? {visualBeatId: selection.visualBeatId, candidateId: closingCandidate.candidateId}
      : selection,
  );
  const closureCatalogPath = path.join(root, "closure_visual_candidate_catalog.json");
  const closurePlanPath = path.join(root, "closure_visual_direction_plan.json");
  const closureOutputPath = path.join(root, "closure_visual_direction_compiled.json");
  const closureReportPath = path.join(root, "closure_visual_direction_report.json");
  writeFileSync(closureCatalogPath, JSON.stringify(closureCatalog, null, 2) + "\n");
  writeFileSync(
    closurePlanPath,
    JSON.stringify({
      contractVersion: "1.0.0",
      episodeDate: spec.episode.targetDate,
      candidateCatalogSha256: sha256Json(closureCatalog),
      selections: closureSelections,
    }, null, 2) + "\n",
  );
  const closureCompile = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "compile",
      "--spec", specPath,
      "--catalog", closureCatalogPath,
      "--plan", closurePlanPath,
      "--output", closureOutputPath,
      "--report", closureReportPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.notEqual(
    closureCompile.status,
    0,
    "production Visual Director compile must reject a Scene 9 plan without final-assembly",
  );
  assert.match(
    `${closureCompile.stderr}\n${closureCompile.stdout}`,
    /\$\.scenes\[8\]\.visualBeats: Scene 9 requires final-assembly/,
    "Director compile must enforce the same Scene 9 production closure as build-production",
  );

  // Director compile is the first production boundary for the selected visual.
  // A visible card title that cannot fit the static viewer must fail here, before
  // Critic/PASS and before final build-production validates the same bytes.
  const layoutSpec = structuredClone(spec);
  const layoutScene = layoutSpec.scenes.find((scene) => scene.cards.length > 0);
  assert.ok(layoutScene, "production fixture must expose a visible card");
  const layoutCard = layoutScene.cards.find((card) =>
    layoutScene.visualBeats.some((beat) => beat.objectIds.includes(card.cardId))
  );
  assert.ok(layoutCard, "production fixture must expose a card referenced by a Visual Beat");
  layoutCard.title = "X".repeat(19);

  const layoutSpecPath = path.join(root, "layout_render_spec.json");
  const layoutCandidateInputPath = path.join(root, "layout_visual_candidate_input.json");
  const layoutCapabilityInventoryPath = path.join(root, "layout_visual_capability_inventory.json");
  const layoutCatalogPath = path.join(root, "layout_visual_candidate_catalog.json");
  const layoutPlanPath = path.join(root, "layout_visual_direction_plan.json");
  const layoutOutputPath = path.join(root, "layout_visual_direction_compiled.json");
  const layoutReportPath = path.join(root, "layout_visual_direction_report.json");
  writeFileSync(layoutSpecPath, JSON.stringify(layoutSpec, null, 2) + "\n");

  const layoutBuild = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "build",
      "--spec", layoutSpecPath,
      "--catalog", layoutCatalogPath,
      "--hints", hintsPath,
      "--candidate-builder", "vnext",
      "--editorial-snapshot-sha256", editorialSnapshotSha256,
      "--candidate-input", layoutCandidateInputPath,
      "--capability-inventory", layoutCapabilityInventoryPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.equal(layoutBuild.status, 0, layoutBuild.stderr || layoutBuild.stdout);

  const layoutCandidateInput = JSON.parse(readFileSync(layoutCandidateInputPath, "utf8"));
  const layoutCatalog = JSON.parse(readFileSync(layoutCatalogPath, "utf8"));
  const layoutSelections = layoutCandidateInput.beats.map((inputBeat: {visualBeatId: string}) => {
    const candidate = layoutCatalog.candidates.find(
      (item: {visualBeatId: string}) => item.visualBeatId === inputBeat.visualBeatId,
    );
    assert.ok(candidate, `missing layout Candidate for ${inputBeat.visualBeatId}`);
    return {visualBeatId: inputBeat.visualBeatId, candidateId: candidate.candidateId};
  });
  writeFileSync(
    layoutPlanPath,
    JSON.stringify({
      contractVersion: "1.0.0",
      episodeDate: layoutSpec.episode.targetDate,
      candidateCatalogSha256: sha256Json(layoutCatalog),
      selections: layoutSelections,
    }, null, 2) + "\n",
  );

  const layoutCompile = spawnSync(
    process.execPath,
    [
      "--import", "tsx",
      "scripts/visual-director-cli.ts", "compile",
      "--spec", layoutSpecPath,
      "--catalog", layoutCatalogPath,
      "--plan", layoutPlanPath,
      "--output", layoutOutputPath,
      "--report", layoutReportPath,
    ],
    {cwd: process.cwd(), encoding: "utf8"},
  );
  assert.notEqual(
    layoutCompile.status,
    0,
    "production Visual Director compile must reject a visible card-title overflow",
  );
  assert.match(
    `${layoutCompile.stderr}\n${layoutCompile.stdout}`,
    /\$\.scenes\[\d+\]\.cards\[\d+\]\.title\[line 1\]: 19 characters exceed card title limit 18/,
    "Director compile must enforce the same static viewer layout as build-production",
  );

  console.log(`visual director CLI vNext tests passed: ${catalog.candidates.length} candidates`);
} finally {
  rmSync(root, {recursive: true, force: true});
}
