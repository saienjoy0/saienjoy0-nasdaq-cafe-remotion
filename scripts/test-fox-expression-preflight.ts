import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import {preflightProductionExpressions} from "../src/spec/preflight-render-spec";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(HERE, "..");
const fixturePath = path.join(
  PROJECT_DIR,
  "render-specs",
  "fixtures",
  "schema-all-expressions",
  "render_spec.json",
);
const fixture = renderSpecSchema.parse(
  JSON.parse(await readFile(fixturePath, "utf8")),
) as RenderSpec;

const baseline = preflightProductionExpressions(fixture);
assert(baseline.checked.length > 0);
assert(baseline.assets.some((item) => item.assetId === "foxSlightSurprise"));

const missingPlacement = structuredClone(fixture);
missingPlacement.scenes[0].assetPlacements = missingPlacement.scenes[0].assetPlacements.filter(
  (placement) => placement.assetId !== "foxSlightSurprise",
);
assert.throws(
  () => preflightProductionExpressions(missingPlacement),
  /foxSlightSurprise.*expected exactly one matching fox-left placement, found=0/s,
);

const duplicatePlacement = structuredClone(fixture);
const foxNormal = duplicatePlacement.scenes[0].assetPlacements.find(
  (placement) => placement.assetId === "foxNormal",
);
assert(foxNormal);
duplicatePlacement.scenes[0].assetPlacements.push({
  ...foxNormal,
  placementId: `${foxNormal.placementId}-duplicate`,
});
assert.throws(
  () => preflightProductionExpressions(duplicatePlacement),
  /foxNormal.*expected exactly one matching fox-left placement, found=2/s,
);

const scopedPlacement = structuredClone(fixture);
const scoped = scopedPlacement.scenes[0].assetPlacements.find(
  (placement) => placement.assetId === "foxSlightSurprise",
);
assert(scoped);
scoped.startChunkId = scopedPlacement.scenes[0].narrationChunks[0].chunkId;
assert.throws(
  () => preflightProductionExpressions(scopedPlacement),
  /foxSlightSurprise.*must be fixed for the full Scene/s,
);

const shotExpression = structuredClone(fixture);
const shotScene = shotExpression.scenes[1];
shotScene.assetPlacements = shotScene.assetPlacements.filter(
  (placement) => placement.assetId !== "foxSlightSurprise",
);
(shotScene.visualBeats[0] as unknown as {shots: Array<Record<string, unknown>>}).shots = [
  {
    foxExpression: "軽い驚き",
    startChunkId: shotScene.visualBeats[0].startChunkId,
  },
];
assert.throws(
  () => preflightProductionExpressions(shotExpression),
  /visualBeats\[0\]\.shots\[0\]\.foxExpression.*foxSlightSurprise/s,
);

console.log("PASS: fox expression preflight covers initial/chunk/event/Shot expressions and fixed Scene placements");
