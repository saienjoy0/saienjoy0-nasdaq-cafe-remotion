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
  // The shared fixture targets local grammar coverage. Specialize this copy into
  // a whole-episode production baseline so strict compile validation has one
  // unambiguous boundary to exercise.
  const openingBeat = spec.scenes[0].visualBeats[0];
  openingBeat.visualTemplate = "opening-contradiction";
  openingBeat.visualMode = "conclusion-card";
  openingBeat.visualGrammarId = "contradiction";
  openingBeat.templateVariant = "default";
  openingBeat.templateConfig.variant = "default";
  spec.scenes[0].visualMode = "conclusion-card";
  const finalAssemblyBeat = spec.scenes[8].visualBeats[0];
  finalAssemblyBeat.visualTemplate = "final-assembly";
  finalAssemblyBeat.visualMode = "conclusion-card";
  finalAssemblyBeat.visualGrammarId = "assembly";
  finalAssemblyBeat.templateVariant = "default";
  finalAssemblyBeat.templateConfig.variant = "default";
  spec.scenes[8].visualMode = "conclusion-card";
  const withoutSyntheticSceneNumber = (value: string) => value.replace(/\b9\b/g, "nine");
  spec.scenes[8].headline = withoutSyntheticSceneNumber(spec.scenes[8].headline);
  spec.scenes[8].supportingTexts = spec.scenes[8].supportingTexts.map(withoutSyntheticSceneNumber);
  for (const beat of spec.scenes[8].visualBeats) {
    beat.viewerTexts = beat.viewerTexts.map(withoutSyntheticSceneNumber);
  }
  for (const card of spec.scenes[8].cards) {
    for (const line of card.lines) line.value = withoutSyntheticSceneNumber(line.value);
  }
  for (const number of spec.scenes[8].numbers) {
    number.value = withoutSyntheticSceneNumber(number.value);
  }
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

  console.log(`visual director CLI vNext tests passed: ${catalog.candidates.length} candidates`);
} finally {
  rmSync(root, {recursive: true, force: true});
}
