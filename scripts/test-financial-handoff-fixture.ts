import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import voiceProfilesJson from "../config/voice-profiles.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {compileRenderSpec} from "../src/spec/compile-render-spec";
import {renderSpecSchema} from "../src/spec/render-spec";
import {assertSpecLayoutFits} from "../src/spec/validate-render-layout";
import {validateRenderSpecReferences} from "../src/spec/validate-render-spec";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(ROOT, "shared-fixtures", "financial-visual-2.3", "render_spec.json");
const manifestPath = path.join(ROOT, "shared-fixtures", "financial-visual-2.3", "fixture_manifest.json");
const matrixPath = path.join(ROOT, "contracts", "financial_visual_compatibility.json");
const bytes = await readFile(fixturePath);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const matrixBytes = await readFile(matrixPath);
const raw = JSON.parse(bytes.toString("utf8"));
const digest = (value: Buffer) => createHash("sha256").update(value).digest("hex");

assert.equal(digest(bytes), manifest.renderSpecSha256);
assert.equal(digest(matrixBytes), manifest.compatibilityMatrixSha256);
assert.equal(manifest.compatibilityMatrixId, "financial-visual-compat-2026-08");
assert.equal(manifest.renderSpecVersion, "2.3.0");
assert.equal(manifest.selectedTemplate, "earnings-surprise");

const spec = renderSpecSchema.parse(raw);
assert.equal(spec.schemaVersion, "2.3.0");
assert.equal(spec.financialVisualContract?.selectionCount, 1);
validateRenderSpecReferences(spec, productionAssetManifest, voiceProfilesJson);
assertSpecLayoutFits(spec);

const scene = spec.scenes.find((item) => item.sceneId === manifest.selectedSceneId);
assert.ok(scene, "selected Scene must exist");
const beat = scene.visualBeats.find((item) => item.beatId === manifest.selectedVisualBeatId);
assert.ok(beat, "selected Visual Beat must exist");
assert.equal(beat.visualTemplate, "earnings-surprise");
assert.equal(beat.templateVariant, "zero-baseline");
assert.equal(beat.financialVisualTrace?.selectedPath, "preferred");
assert.equal(beat.financialVisualTrace?.recipeId, "earnings-surprise");
assert.deepEqual(beat.objectIds, beat.financialVisualTrace?.displayOrder);
assert.deepEqual(beat.evidenceSourceIds, beat.financialVisualTrace?.sourceIds);
assert.equal(beat.templateConfig.dataBasis, "financial-recipe-plan");
assert.deepEqual(beat.templateConfig.metricIds, beat.objectIds);
assert.deepEqual(beat.templateConfig.nodeOrder, []);
assert.equal(beat.templateConfig.outcomeNodeId, null);

const assetPaths = Object.fromEntries(
  Object.entries(productionAssetManifest.assets).map(([id, asset]) => [id, asset.path]),
);
const production = await compileRenderSpec(
  spec,
  async ({chunkId}) => ({
    audioSrc: `audio/${chunkId}.wav`,
    durationMs: 1000,
    cacheKey: createHash("sha256").update(chunkId).digest("hex"),
    sampleRate: 48000,
    channels: 1,
    codec: "pcm_s16le",
  }),
  assetPaths,
  {inputSpecSha256: manifest.renderSpecSha256},
);
assert.equal(production.inputSpecSha256, manifest.renderSpecSha256);
const productionScene = production.scenes.find((item) => item.sceneId === manifest.selectedSceneId);
assert.ok(productionScene);
const productionBeat = productionScene.visualBeats.find((item) => item.beatId === manifest.selectedVisualBeatId);
assert.ok(productionBeat);
assert.equal(productionBeat.visualTemplate, "earnings-surprise");
assert.equal(productionBeat.financialVisualTrace?.recipePlanSha256, "a".repeat(64));

console.log("shared financial handoff fixture acceptance: PASS");
