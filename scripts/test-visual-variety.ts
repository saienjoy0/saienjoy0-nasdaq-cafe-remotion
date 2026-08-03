import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";

const project = process.cwd();
const specPath = path.join(project, "render-specs/2026-07-31/render_spec.json");
const spec = renderSpecSchema.parse(JSON.parse(await readFile(specPath, "utf8")));
const beats = spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => ({
  sceneNumber: scene.sceneNumber,
  beatId: beat.beatId,
  template: beat.visualTemplate,
  config: beat.templateConfig,
  screenState: beat.screenState,
})));

const distinctTemplates = new Set(beats.map((beat) => beat.template));
assert.ok(distinctTemplates.size >= 4, `visual template families must be at least 4, got ${distinctTemplates.size}`);

let longestRun = 0;
let currentRun = 0;
let previous: string | null = null;
for (const beat of beats) {
  currentRun = beat.template === previous ? currentRun + 1 : 1;
  longestRun = Math.max(longestRun, currentRun);
  previous = beat.template;
}
assert.ok(longestRun <= 2, `the same visual template must not lead more than 2 consecutive Beats, got ${longestRun}`);

const opening = spec.scenes[0].visualBeats.map((beat) => beat.visualTemplate);
assert.ok(opening.includes("opening-contradiction"), "Scene 1 requires opening-contradiction");
const closing = spec.scenes[8].visualBeats.map((beat) => beat.visualTemplate);
assert.ok(closing.includes("closing-recap"), "Scene 9 requires closing-recap");

const verification = spec.scenes[7].visualBeats.map((beat) => beat.visualTemplate);
assert.ok(
  verification.some((template) => template === "verification-matrix" || template === "verification-checklist"),
  "Scene 8 requires a verification template",
);

for (const beat of beats) {
  assert.ok(beat.config.dataBasis.trim().length > 0, `${beat.beatId} requires templateConfig.dataBasis`);
  assert.ok(beat.config.nodeOrder.length <= 4, `${beat.beatId} exceeds nodeOrder limit`);
  assert.ok(beat.config.laneLabels.length <= 2, `${beat.beatId} exceeds lane label limit`);
}

const firstHalf = new Set(beats.filter((beat) => beat.sceneNumber <= 4).map((beat) => beat.template));
const secondHalf = new Set(beats.filter((beat) => beat.sceneNumber >= 5).map((beat) => beat.template));
assert.ok(firstHalf.size >= 3, "Scenes 1-4 require at least 3 visual template families");
assert.ok(secondHalf.size >= 3, "Scenes 5-9 require at least 3 visual template families");
assert.notEqual(opening[0], closing.at(-1), "opening and closing must not use the same visual template");

console.log(`PASS: visual variety (${distinctTemplates.size} templates, longest run ${longestRun})`);
