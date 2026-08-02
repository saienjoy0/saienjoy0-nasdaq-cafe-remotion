import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {z} from "zod";
import voiceProfilesJson from "../config/voice-profiles.json";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import renderableFixtureJson from "../render-specs/fixtures/renderable-9scene/render_spec.json";
import {compileRenderSpec} from "../src/spec/compile-render-spec";
import {renderSpecSchema} from "../src/spec/render-spec";
import {getSceneRenderState, getSpecDurationInFrames, isPlacementActive} from "../src/spec/render-state";
import {assertSpecLayoutFits} from "../src/spec/validate-render-layout";
import {expressionRegistrations, missingProductionExpressions, resolveStrictExpressionAsset, supportedProductionExpressions} from "../src/config/spec-expressions";
import {preflightProductionExpressions} from "../src/spec/preflight-render-spec";
import {assertRenderSpecApprovedForCompile, validateRenderSpecReferences} from "../src/spec/validate-render-spec";
import {createSpecAudioCacheKey, createSpecAudioFileName, SPEC_AUDIO_STANDARD, SPEC_TTS_BLOCKS} from "./spec-audio";
import {productionAssetManifest} from "../src/config/production-assets";
import {toPublicSceneViewModel} from "../src/spec/public-view-model";

const assetManifestJson = productionAssetManifest;
const fixture = renderSpecSchema.parse(fixtureJson);
const renderableFixture = renderSpecSchema.parse(renderableFixtureJson);
const clone = () => structuredClone(fixture);
const tests: Array<{name: string; run: () => void | Promise<void>}> = [];
const test = (name: string, run: () => void | Promise<void>) => tests.push({name, run});
const rejects = (run: () => unknown, match?: RegExp) => match ? assert.throws(run, match) : assert.throws(run);
const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
const technicalSynth = async ({chunkId}: {chunkId: string}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000});

test("complete 9Scene fixture validates", () => {validateRenderSpecReferences(fixture, assetManifestJson, voiceProfilesJson);});
test("schemaVersion mismatch is rejected", () => {const value = clone() as unknown as {schemaVersion: string}; value.schemaVersion = "1.0.0"; rejects(() => renderSpecSchema.parse(value));});
test("root unknown field is rejected", () => rejects(() => renderSpecSchema.parse({...fixture, unknownField: true})));
test("nested unknown field is rejected", () => {const value = clone(); Object.assign(value.scenes[0], {unknownField: true}); rejects(() => renderSpecSchema.parse(value));});
test("8Scene is rejected", () => {const value = clone(); value.scenes.pop(); rejects(() => renderSpecSchema.parse(value));});
test("10Scene is rejected", () => {const value = clone(); value.scenes.push(structuredClone(value.scenes[8])); rejects(() => renderSpecSchema.parse(value));});
test("duplicate Scene is rejected", () => {const value = clone(); value.scenes[1] = structuredClone(value.scenes[0]); rejects(() => renderSpecSchema.parse(value), /duplicate ID|expected scene-02/);});
test("Scene order is rejected", () => {const value = clone(); [value.scenes[0], value.scenes[1]] = [value.scenes[1], value.scenes[0]]; rejects(() => renderSpecSchema.parse(value), /expected scene-01/);});
test("Scene 1 integrated role is required", () => {const value = clone(); value.scenes[0].sceneRole = "editorial-body"; rejects(() => renderSpecSchema.parse(value), /opening-hook-market-direction-greeting-conclusion/);});
test("Scene 9 fixed closing role is required", () => {const value = clone(); value.scenes[8].sceneRole = "editorial-body"; rejects(() => renderSpecSchema.parse(value), /closing-recap-sendoff-goodnight/);});
test("unsafe chunk ID is rejected", () => {const value = clone(); value.scenes[0].narrationChunks[0].chunkId = "../bad"; rejects(() => renderSpecSchema.parse(value));});
test("invalid visualMode is rejected", () => {const value = clone() as unknown as {scenes: Array<{visualMode: string}>}; value.scenes[0].visualMode = "auto"; rejects(() => renderSpecSchema.parse(value));});
test("invalid expression is rejected", () => {const value = clone() as unknown as {scenes: Array<{initialExpression: string}>}; value.scenes[0].initialExpression = "guess"; rejects(() => renderSpecSchema.parse(value));});
test("invalid visual event action is rejected", () => {const value = clone() as unknown as {scenes: Array<{visualEvents: Array<{action: string}>}>}; value.scenes[0].visualEvents[0].action = "toggle"; rejects(() => renderSpecSchema.parse(value));});
test("invalid number tone is rejected", () => {const value = clone() as unknown as {scenes: Array<{numbers: Array<{tone: string}>}>}; const scene = value.scenes.find((item) => item.numbers.length > 0)!; scene.numbers[0].tone = "auto"; rejects(() => renderSpecSchema.parse(value));});
test("invalid transition type is rejected", () => {const value = clone() as unknown as {scenes: Array<{transition: {type: string}}>} ; value.scenes[0].transition.type = "wipe"; rejects(() => renderSpecSchema.parse(value));});
test("invalid asset role is rejected", () => {const value = clone() as unknown as {scenes: Array<{assetPlacements: Array<{role: string}>}>}; value.scenes[0].assetPlacements[0].role = "auto"; rejects(() => renderSpecSchema.parse(value));});
test("cross-Scene duplicate chunk ID is rejected", () => {const value = clone(); value.scenes[1].narrationChunks[0].chunkId = value.scenes[0].narrationChunks[0].chunkId; rejects(() => renderSpecSchema.parse(value), /duplicate ID/);});
test("cross-Scene duplicate object ID is rejected", () => {const value = clone(); value.scenes[1].cards[0].cardId = value.scenes[0].cards[0].cardId; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /duplicate ID/);});
test("cross-Scene duplicate event ID is rejected", () => {const value = clone(); value.scenes[1].visualEvents[0].eventId = value.scenes[0].visualEvents[0].eventId; rejects(() => renderSpecSchema.parse(value), /duplicate ID/);});
test("missing source reference is rejected", () => {const value = clone(); value.scenes[0].evidenceSourceIds = ["source-999"]; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /unknown sourceId/);});
test("missing chunk reference is rejected", () => {const value = clone(); value.scenes[0].visualEvents[0].atChunkId = "scene-01-chunk-999"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /same Scene/);});
test("missing object target is rejected", () => {const value = clone(); value.scenes[0].visualEvents[0].targetId = "missing"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /targetId/);});
test("missing node reference is rejected", () => {const value = clone(); const scene = value.scenes[5]; scene.arrows[0].toNodeId = "missing"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /unknown nodeId/);});
test("missing asset reference is rejected", () => {const value = clone(); value.scenes[0].assetPlacements[0].assetId = "missing"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /unknown assetId/);});
test("invalid asset role-region pair is rejected", () => {const value = clone(); value.scenes[0].assetPlacements[0].region = "fox-left"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /invalid for role/);});
test("invalid placement chunk order is rejected", () => {const value = clone(); const scene = value.scenes[0]; scene.assetPlacements[0].startChunkId = scene.narrationChunks.at(-1)!.chunkId; scene.assetPlacements[0].endChunkId = scene.narrationChunks[0].chunkId; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /must not precede/);});
test("every Scene requires one canonical background", () => {const value = clone(); value.scenes[0].assetPlacements = value.scenes[0].assetPlacements.filter((item) => item.role !== "background"); rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /exactly one fixed background/);});
test("alternate Scene background is rejected", () => {const value = clone(); value.scenes[0].assetPlacements.find((item) => item.role === "background")!.assetId = "foxNormal"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /mainBackground/);});
test("overlapping main-stage assets are rejected", () => {const value = clone(); const scene = value.scenes[0]; scene.assetPlacements.push({placementId: "overlap-main-media", assetId: "foxNormal", role: "main-media", region: "main-stage", fit: "contain", opacity: 1, startChunkId: null, endChunkId: null}, {placementId: "overlap-chart", assetId: "foxAnalysis", role: "chart", region: "main-stage", fit: "contain", opacity: 1, startChunkId: null, endChunkId: null}); rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /main-stage assets overlap/);});
test("Expected role is required", () => {const value = clone(); const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!; scene.cards.find((card) => card.role === "expected")!.role = null; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /expected/);});
test("Actual role is required", () => {const value = clone(); const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!; scene.cards.find((card) => card.role === "actual")!.role = null; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /actual/);});
test("Gap role is required", () => {const value = clone(); const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!; scene.cards.find((card) => card.role === "gap")!.role = null; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /gap/);});
test("Expected Actual Gap roles cannot be duplicated", () => {const value = clone(); const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!; scene.cards.find((card) => card.role === "actual")!.role = "expected"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /duplicate|required data|required Beat data/);});
test("Visual Beats are required", () => {const value = clone(); value.scenes[0].visualBeats = []; rejects(() => renderSpecSchema.parse(value));});
test("Visual Beats must cover every chunk exactly once", () => {const value = clone(); value.scenes[0].visualBeats[2].startChunkId = value.scenes[0].narrationChunks[1].chunkId; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /contiguously/);});
test("Visual Beat narration cues must resolve to their chunks", () => {const value = clone(); value.scenes[0].visualBeats[0].narrationStartCue = "MISSING CUE"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /cue must occur/);});
test("incomplete Visual Beat assets are rejected", () => {const value = clone(); value.scenes[0].visualBeats[1].assetState = "missing"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /incomplete/);});
test("user-review-required external entity assets can reach MP4 production", () => {const value = clone(); const beat = value.scenes[0].visualBeats[1]; beat.assetState = "user-review-required"; beat.entity!.rightsStatus = "user-review-required"; validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson);});
test("noPhoto is a complete EntityFocus variant without an external asset", () => {const value = clone(); const scene = value.scenes[0]; const beat = scene.visualBeats[1]; const removed = new Set(beat.assetPlacementIds); scene.assetPlacements = scene.assetPlacements.filter((placement) => !removed.has(placement.placementId)); beat.assetPlacementIds = []; beat.assetState = "not-required"; beat.entity!.variant = "noPhoto"; beat.entity!.assetId = null; beat.entity!.rightsStatus = "not-required"; validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson);});
test("EntityFocus requires an explicit return Beat", () => {const value = clone(); value.scenes[0].visualBeats[1].returnScreenState = null; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /requires a return/);});
test("MainWithEntity validates only in the dedicated two-column slots", () => {
  const value = clone();
  const scene = value.scenes[0];
  const beat = scene.visualBeats[1];
  const placement = scene.assetPlacements.find((item) => item.placementId === beat.assetPlacementIds[0])!;
  beat.screenState = "MainWithEntity";
  beat.objectIds = [scene.cards[0].cardId];
  placement.region = "main-entity";
  validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson);
  placement.region = "main-stage";
  rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /main-entity/);
});
test("PictureBook requires checked same-fox metadata and one full-stage illustration", () => {
  const value = clone();
  const scene = value.scenes[0];
  const beat = scene.visualBeats[1];
  const placement = scene.assetPlacements.find((item) => item.placementId === beat.assetPlacementIds[0])!;
  beat.screenState = "PictureBook";
  beat.entity = null;
  beat.objectIds = [];
  beat.visualMode = "text-focus";
  placement.role = "picture-book";
  placement.region = "main-stage";
  beat.pictureBook = {
    difficultPoint: "TEST DIFFICULT POINT",
    analogyPurpose: "TEST ANALOGY PURPOSE",
    shortAnalogy: "TEST SHORT ANALOGY",
    analogyType: "university-life",
    referenceAssetId: "foxNormal",
    aspectRatio: "16:9",
    generationPrompt: "TEST PICTURE BOOK PROMPT",
    completedAssetId: placement.assetId,
    marketReturnCue: scene.narrationChunks[2].captionText,
    sameFoxCheck: "pass",
    pictureBookStyleCheck: "pass",
    noBakedTextCheck: "pass",
  };
  validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson);
  beat.pictureBook.sameFoxCheck = "fail" as "pass";
  rejects(() => renderSpecSchema.parse(value));
});
test("Expected Actual Gap semantics survive card reordering", () => {const value = clone(); const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!; const before = Object.fromEntries(scene.cards.map((card) => [card.role, card.cardId])); scene.cards.reverse(); validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson); assert.deepEqual(Object.fromEntries(scene.cards.map((card) => [card.role, card.cardId])), before);});
test("voice profile absence is rejected", () => {const value = clone(); value.voiceProfileId = "missing-profile"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /unknown voiceProfileId/);});
test("Gemini fox-main voice profile validates", () => {const value = clone(); value.voiceProfileId = "fox-main"; validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson);});
test("Spec production rejects VOICEVOX profiles", () => {const value = clone(); value.voiceProfileId = "voicevox-mochiko-anko"; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /Gemini.*Charon/);});
test("Mochiko Anko profile is fixed", () => {const profile = voiceProfilesJson.profiles["voicevox-mochiko-anko"]; assert.equal(profile.speakerUuid, "9f3ee141-26ad-437e-97bd-d22298d02ad2"); assert.equal(profile.styleId, 66);});
test("visualMode required data is enforced", () => {const value = clone(); value.scenes[5].nodes = []; value.scenes[5].arrows = []; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /required data missing|unknown object ID/);});
test("Scene transition contract is enforced", () => {const value = clone(); value.scenes[0].transition = {type: "none", durationMs: 0}; rejects(() => validateRenderSpecReferences(value, assetManifestJson, voiceProfilesJson), /Scene 1-8/);});
test("recommended publishing values belong to candidate arrays", () => {const value = clone(); value.publishing.recommendedTitle = "MISSING"; rejects(() => renderSpecSchema.parse(value), /recommendedTitle/);});
test("review total equals score sum", () => {const value = clone(); value.review.totalScore = 1; rejects(() => renderSpecSchema.parse(value), /score sum/);});
test("approvedForCodex false validates but cannot compile", () => {const value = clone(); value.review.approvedForCodex = false; renderSpecSchema.parse(value); rejects(() => assertRenderSpecApprovedForCompile(value), /compile requires/);});
test("compile preserves Phase 1 contract and order", async () => {
  const calls: string[] = [];
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => {calls.push(chunkId); return {audioSrc: `audio/${chunkId}.wav`, durationMs: 1000};}, assetPaths);
  assert.deepEqual(calls, fixture.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.chunkId)));
  assert.deepEqual(production.editorial, fixture.editorial);
  assert.deepEqual(production.publishing, fixture.publishing);
  assert.deepEqual(production.sources, fixture.sources);
  assert.deepEqual(production.scenes.map((scene) => scene.transition), fixture.scenes.map((scene) => scene.transition));
  assert.deepEqual(production.scenes.map((scene) => scene.visualEvents), fixture.scenes.map((scene) => scene.visualEvents));
  assert.deepEqual(production.scenes.map((scene) => scene.cards), fixture.scenes.map((scene) => scene.cards));
  assert.deepEqual(production.scenes.map((scene) => scene.numbers), fixture.scenes.map((scene) => scene.numbers));
  assert.deepEqual(production.scenes.map((scene) => scene.nodes), fixture.scenes.map((scene) => scene.nodes));
  assert.deepEqual(production.scenes.map((scene) => scene.arrows), fixture.scenes.map((scene) => scene.arrows));
  assert.deepEqual(production.scenes.map((scene) => scene.assetPlacements), fixture.scenes.map((scene) => scene.assetPlacements));
  assert.deepEqual(production.scenes.map((scene) => scene.visualBeats.map((beat) => {
    const sourceFields = {...beat} as Partial<typeof beat>;
    delete sourceFields.startMs;
    delete sourceFields.endMs;
    delete sourceFields.startFrame;
    delete sourceFields.endFrame;
    return sourceFields;
  })), fixture.scenes.map((scene) => scene.visualBeats));
  assert.deepEqual(production.review, fixture.review);
  assert.deepEqual(production.pronunciations, fixture.pronunciations);
  assert.deepEqual(production.corrections, fixture.corrections);
  assert.equal(production.voiceProfileId, fixture.voiceProfileId);
  assert.deepEqual(production.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.chunkId)), fixture.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.chunkId)));
  assert.deepEqual(production.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.speechText)), fixture.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.speechText)));
  assert.deepEqual(production.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.expression)), fixture.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.expression)));
  assert.deepEqual(production.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.caption.text)), fixture.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.captionText)));
});
test("compile records the supplied input spec SHA-256", async () => {const data = await compileRenderSpec(renderableFixture, technicalSynth, assetPaths, {inputSpecSha256: "c".repeat(64)}); assert.equal(data.inputSpecSha256, "c".repeat(64));});
test("production JSON is invariant across TTS cache hit and miss", async () => {
  const spec = structuredClone(renderableFixture);
  const common = {audioSrc: "spec-audio/deterministic.wav", audioPath: "C:/technical/audio.wav", durationMs: 1000, cacheKey: "a".repeat(64), sampleRate: 48000, channels: 1, codec: "pcm_s16le"};
  const miss = await compileRenderSpec(spec, async () => ({...common, cacheHit: false}), assetPaths, {inputSpecSha256: "b".repeat(64)});
  const hit = await compileRenderSpec(spec, async () => ({...common, cacheHit: true}), assetPaths, {inputSpecSha256: "b".repeat(64)});
  assert.deepEqual(hit, miss);
});
test("generated JSON Schema matches the Zod source", async () => {
  const stored = JSON.parse(await readFile(new URL("../schemas/render_spec.schema.json", import.meta.url), "utf8")) as Record<string, unknown>;
  const generated = z.toJSONSchema(renderSpecSchema, {target: "draft-2020-12", io: "input"}) as Record<string, unknown>;
  const storedCore = {...stored};
  delete storedCore.$id;
  delete storedCore.title;
  delete storedCore.description;
  assert.deepEqual(storedCore, generated);
});
test("renderer hides captions during pauses", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  const scene = production.scenes[0];
  assert.equal(getSceneRenderState(scene, 500).captionText, scene.narrationChunks[0].caption.text);
  assert.equal(getSceneRenderState(scene, 1050).captionText, null);
  assert.equal(getSceneRenderState(scene, 1150).captionText, scene.narrationChunks[1].caption.text);
});
test("renderer switches Visual Beats inside one Scene and returns to Data", async () => {
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  const scene = production.scenes[0];
  assert.equal(getSceneRenderState(scene, 500).activeBeatIndex, 0);
  assert.equal(getSceneRenderState(scene, 1500).activeBeatIndex, 1);
  assert.equal(getSceneRenderState(scene, 2500).activeBeatIndex, 2);
  const dataView = toPublicSceneViewModel(scene, getSceneRenderState(scene, 500), production.assets);
  const entityView = toPublicSceneViewModel(scene, getSceneRenderState(scene, 1500), production.assets);
  const returnView = toPublicSceneViewModel(scene, getSceneRenderState(scene, 2500), production.assets);
  assert(dataView.mainContent);
  assert.equal(dataView.mainAssets.length, 0);
  assert(entityView.mainContent);
  assert.equal(entityView.mainContent.renderKind, "entity");
  assert.equal(entityView.mainContent.entity?.displayName, "NVIDIA");
  assert.equal(entityView.mainAssets.length, 1);
  assert.match(entityView.mainAssets[0].src, /stock-cards/);
  assert(returnView.mainContent);
  assert.equal(returnView.mainAssets.length, 0);
});
test("public ViewModel excludes Scene, Beat, mode, expression, and build metadata", async () => {
  const production = await compileRenderSpec(fixture, technicalSynth, assetPaths);
  const scene = production.scenes[0];
  const serialized = JSON.stringify(toPublicSceneViewModel(scene, getSceneRenderState(scene, 1500), production.assets));
  for (const forbidden of ["sceneId", "sceneNumber", "beatId", "screenState", "visualMode", "expression", "inputSpecSha256", "assetId"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
test("expression priority is initial then chunk then same-time event", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  const scene = production.scenes[0];
  assert.equal(getSceneRenderState(scene, -1).expression, scene.initialExpression);
  assert.equal(getSceneRenderState(scene, 0).expression, scene.narrationChunks[0].expression);
  assert.equal(getSceneRenderState(scene, scene.narrationChunks[1].startMs).expression, scene.visualEvents.find((event) => event.action === "set-expression")?.expression);
});
test("visibility and highlight events are deterministic and Scene-local", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  const scene = production.scenes[0];
  const target = scene.visualEvents.find((event) => event.action === "show")!.targetId!;
  assert.equal(getSceneRenderState(scene, -1).visible.has(target), false);
  assert.equal(getSceneRenderState(scene, 0).visible.has(target), true);
  assert.equal(getSceneRenderState(production.scenes[1], 0).highlighted.has(target), false);
});
test("asset placement obeys chunk range", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  const scene = production.scenes[0];
  const fox = scene.assetPlacements.find((placement) => placement.role === "fox-expression")!;
  assert.equal(isPlacementActive(scene, fox, getSceneRenderState(scene, 0)), true);
  const last = scene.narrationChunks.at(-1)!;
  assert.equal(isPlacementActive(scene, fox, getSceneRenderState(scene, last.endMs + last.pauseAfterMs + 1)), false);
});
test("fade transitions reduce composition duration deterministically", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  assert.equal(getSpecDurationInFrames(production.scenes, production.episode.fps), production.timeline.totalDurationInFrames);
  assert(production.scenes[1].startFrame < production.scenes[0].endFrame + 1);
});
test("overflow is reported with a JSON path", async () => {
  const assetPaths = Object.fromEntries(Object.entries(assetManifestJson.assets).map(([id, asset]) => [id, asset.path]));
  const production = await compileRenderSpec(fixture, async ({chunkId}) => ({audioSrc: `audio/${chunkId}.wav`, durationMs: 1000}), assetPaths);
  assertSpecLayoutFits(production);
  production.scenes[0].headline = "長".repeat(73);
  rejects(() => assertSpecLayoutFits(production), /\$\.scenes\[0\]\.headline/);
});
const overflowTest = (name: string, mutate: (production: Awaited<ReturnType<typeof compileRenderSpec>>) => void, path: RegExp) => test(`overflow ${name} reports its JSON path`, async () => {
  const production = await compileRenderSpec(structuredClone(fixture), technicalSynth, assetPaths);
  mutate(production);
  rejects(() => assertSpecLayoutFits(production), path);
});
overflowTest("supportingTexts", (value) => {value.scenes[0].supportingTexts[0] = "長".repeat(91);}, /supportingTexts\[0\]/);
overflowTest("captionText", (value) => {value.scenes[0].narrationChunks[0].caption.text = "長".repeat(71);}, /caption\.text/);
overflowTest("card title", (value) => {value.scenes[0].cards[0].title = "長".repeat(49);}, /cards\[0\]\.title/);
overflowTest("card label", (value) => {value.scenes[0].cards[0].lines[0].label = "長".repeat(33);}, /lines\[0\]\.label/);
overflowTest("card value", (value) => {value.scenes[0].cards[0].lines[0].value = "長".repeat(73);}, /lines\[0\]\.value/);
overflowTest("number label", (value) => {value.scenes.find((scene) => scene.numbers.length > 0)!.numbers[0].label = "長".repeat(43);}, /numbers\[0\]\.label/);
overflowTest("node label", (value) => {value.scenes.find((scene) => scene.nodes.length > 0)!.nodes[0].label = "長".repeat(43);}, /nodes\[0\]\.label/);
overflowTest("arrow label", (value) => {value.scenes.find((scene) => scene.arrows.length > 0)!.arrows[0].label = "長".repeat(43);}, /arrows\[0\]\.label/);
overflowTest("source label", (value) => {value.scenes[0].sourceLabel = "長".repeat(91);}, /sourceLabel/);
test("expression registry never uses fallback assets", () => {
  assert.deepEqual(supportedProductionExpressions.sort(), ["通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう"].sort());
  assert.deepEqual(missingProductionExpressions, []);
  assert.equal(resolveStrictExpressionAsset("通常").assetId, "foxNormal");
  assert.equal(new Set(supportedProductionExpressions.map((expression) => resolveStrictExpressionAsset(expression).assetId)).size, 7);
});
test("production expression preflight accepts renderable fixture", () => {assert(preflightProductionExpressions(renderableFixture).checked.length > 0);});
test("production expression preflight accepts all-expression schema fixture", () => {assert(preflightProductionExpressions(fixture).checked.length > 0);});
test("production expression preflight error includes full location and asset diagnostics", () => {
  const original = expressionRegistrations["分析"];
  expressionRegistrations["分析"] = {assetId: "missing-analysis-asset", fallback: false};
  try {
    rejects(() => preflightProductionExpressions(renderableFixture), /\$\.scenes\[0\]\.narrationChunks\[1\]\.expression: Scene ID=scene-01; chunk=scene-01-chunk-002; expression=分析; assetId=missing-analysis-asset;/);
  } finally {
    expressionRegistrations["分析"] = original;
  }
});
test("all seven expressions are used by renderable fixture", () => {assert.deepEqual([...new Set(renderableFixture.scenes.flatMap((scene) => [scene.initialExpression, ...scene.narrationChunks.map((chunk) => chunk.expression), ...scene.visualEvents.filter((event) => event.action === "set-expression").map((event) => event.expression!)]))].sort(), ["通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう"].sort());});
test("audio cache key is deterministic", () => {const value = {voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST AUDIO", pronunciations: renderableFixture.pronunciations}; assert.equal(createSpecAudioCacheKey(value), createSpecAudioCacheKey(value));});
test("audio cache key changes with speechText", () => {const base = {voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST AUDIO", pronunciations: renderableFixture.pronunciations}; assert.notEqual(createSpecAudioCacheKey(base), createSpecAudioCacheKey({...base, speechText: "TEST AUDIO CHANGED"}));});
test("audio cache key changes with pronunciations", () => {const base = {voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST AUDIO", pronunciations: renderableFixture.pronunciations}; assert.notEqual(createSpecAudioCacheKey(base), createSpecAudioCacheKey({...base, pronunciations: [{surface: "TEST", reading: "テスト変更"}]}));});
test("audio cache key changes with profile", () => {const base = {voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST AUDIO", pronunciations: renderableFixture.pronunciations}; assert.notEqual(createSpecAudioCacheKey(base), createSpecAudioCacheKey({...base, voiceProfileId: "voicevox-kurono-normal"}));});
test("audio file path identity is safe and deterministic", () => {const value = {episodeId: renderableFixture.episode.id, sceneId: "scene-01", chunkId: "scene-01-chunk-001", voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST AUDIO", pronunciations: renderableFixture.pronunciations}; const name = createSpecAudioFileName(value); assert.equal(name, createSpecAudioFileName(value)); assert.match(name, /^[A-Za-z0-9._-]+\.wav$/); assert(name.includes("scene-01"));});
test("audio file path rejects traversal", () => {rejects(() => createSpecAudioFileName({episodeId: "../bad", sceneId: "scene-01", chunkId: "scene-01-chunk-001", voiceProfileId: renderableFixture.voiceProfileId, speechText: "TEST", pronunciations: []}), /unsafe episodeId/);});
test("audio standard is fixed to 48kHz mono PCM16", () => {assert.deepEqual({sampleRate: SPEC_AUDIO_STANDARD.sampleRate, channels: SPEC_AUDIO_STANDARD.channels, codec: SPEC_AUDIO_STANDARD.codec, bitsPerSample: SPEC_AUDIO_STANDARD.bitsPerSample}, {sampleRate: 48000, channels: 1, codec: "pcm_s16le", bitsPerSample: 16});});
test("Gemini production audio has exactly two fixed blocks", () => {assert.deepEqual(SPEC_TTS_BLOCKS.map(({firstScene, lastScene, fileName}) => ({firstScene, lastScene, fileName})), [{firstScene: 1, lastScene: 4, fileName: "tts_scenes_01_04.wav"}, {firstScene: 5, lastScene: 9, fileName: "tts_scenes_05_09.wav"}]);});
test("new spec CLI cannot reach legacy content-decision modules", async () => {const source = await readFile(new URL("./spec-cli.ts", import.meta.url), "utf8"); for (const forbidden of ["parser/", "segmenter", "triggerText", "render-preview.ts", "render-episode.ts", "NasdaqCafeEpisodeV2", "NasdaqCafeEpisode\""]) assert.equal(source.includes(forbidden), false, forbidden);});
test("preview and final select independent output branches", async () => {const source = await readFile(new URL("./spec-cli.ts", import.meta.url), "utf8"); assert(source.includes('command === "preview" || command === "final"')); assert(source.includes("mediaPath(kind")); assert.equal(source.includes("preview:episode"), false);});
test("production renderer does not read derived assetIds", async () => {const source = await readFile(new URL("../src/compositions/NasdaqCafeSpecEpisode.tsx", import.meta.url), "utf8"); assert.equal(source.includes("assetIds"), false);});

for (const {name, run} of tests) {
  await run();
  console.log(`PASS: ${name}`);
}
console.log(`render_spec named contract tests: ${tests.length} passed`);
