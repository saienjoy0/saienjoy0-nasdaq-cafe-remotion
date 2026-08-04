import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {CAMERA_PRESET_TRANSFORMS, DEDICATED_SHOT_RECIPE_IDS, SHOT_RECIPE_IDS} from "../src/spec/shot-contract";
import {getShotTransitionOpacities} from "../src/spec/shot-transition-contract";
import {renderSpecSchema} from "../src/spec/render-spec";
import {validateShotStoryContract} from "../src/spec/validate-shot-story";

const root = process.cwd();
const approvedPlanPath = path.join(
  root,
  "shot-timing-requests/2026-08-04T2218-2026-07-31.json",
);
const [renderer, recipes, specSource, approvedPlanSource] = await Promise.all([
  readFile(path.join(root, "src/components/spec/ShotStageRenderer.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/shots/ShotRecipes.tsx"), "utf8"),
  readFile(path.join(root, "render-specs/2026-07-31/render_spec.json"), "utf8"),
  readFile(approvedPlanPath, "utf8"),
]);
const spec = renderSpecSchema.parse(JSON.parse(specSource));
const approvedPlan = JSON.parse(approvedPlanSource) as {
  episodeDate?: unknown;
  expectedShotCount?: unknown;
  confirmation?: unknown;
};
assert.equal(approvedPlan.episodeDate, "2026-07-31");
assert.equal(approvedPlan.confirmation, "APPLY_MEASURED_SHOT_PLAN");
assert.ok(
  Number.isInteger(approvedPlan.expectedShotCount) &&
    Number(approvedPlan.expectedShotCount) > 0,
  "approved measured Shot plan must define a positive expectedShotCount",
);
const expectedShotCount = Number(approvedPlan.expectedShotCount);
validateShotStoryContract(spec, {enforceVariety: true});

assert.deepEqual([...DEDICATED_SHOT_RECIPE_IDS].sort(), [...SHOT_RECIPE_IDS].sort());
assert.doesNotMatch(renderer, /GenericShot/);
assert.doesNotMatch(recipes, /VisualTemplateRenderer/);
assert.doesNotMatch(renderer, /inset:\s*-40/);
for (const transform of Object.values(CAMERA_PRESET_TRANSFORMS)) {
  assert.ok(Math.max(transform.startScale, transform.endScale) <= 1.08, "focus camera scale exceeds 1.08");
  assert.ok(Math.max(Math.abs(transform.startX), Math.abs(transform.endX)) <= 24, "focus camera X exceeds 24px");
  assert.ok(Math.max(Math.abs(transform.startY), Math.abs(transform.endY)) <= 16, "focus camera Y exceeds 16px");
}
for (let elapsed = 0; elapsed <= 300; elapsed += 10) {
  const opacities = getShotTransitionOpacities(elapsed, true, false);
  assert.ok(opacities.previous + opacities.current >= .999, `transition coverage dropped at ${elapsed}ms`);
}
let shotCount = 0;
for (const scene of spec.scenes) for (const beat of scene.visualBeats) for (const shot of beat.shots ?? []) {
  shotCount += 1;
  assert.ok(shot.startCue && shot.endCue, `${shot.shotId}: semantic cues required`);
  assert.ok("secondaryTargetIds" in shot, `${shot.shotId}: semantic target set required`);
}
assert.equal(
  shotCount,
  expectedShotCount,
  "render_spec Shot count must match the approved measured Shot plan",
);
assert.equal((spec.scenes[8].visualBeats[0].viewerTexts ?? []).length, 4, "Scene 9 must preserve four recap elements");
console.log(
  `PASS: Visual Story Engine v3.2 transition, safe camera, semantic targets, dedicated recipes, ${shotCount} approved Shots, and recap assembly`,
);
