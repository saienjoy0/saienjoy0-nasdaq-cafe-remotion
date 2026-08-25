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

  console.log(`visual director CLI vNext tests passed: ${catalog.candidates.length} candidates`);
} finally {
  rmSync(root, {recursive: true, force: true});
}
