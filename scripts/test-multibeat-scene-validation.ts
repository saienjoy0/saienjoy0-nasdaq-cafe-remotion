import assert from "node:assert/strict";
import voiceProfilesJson from "../config/voice-profiles.json";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {renderSpecSchema} from "../src/spec/render-spec";
import {validateRenderSpecReferences} from "../src/spec/validate-render-spec";
import {validateRenderSpecReferencesMultiBeat} from "../src/spec/validate-render-spec-multibeat";

const base = renderSpecSchema.parse(fixtureJson);
const makeMultiBeatGapScene = () => {
  const value = structuredClone(base);
  const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap");
  assert.ok(scene, "fixture must contain an expected-actual-gap Scene");
  assert.equal(scene.visualBeats[0].visualMode, "expected-actual-gap");
  assert.ok(scene.narrationChunks.length >= 2, "fixture E/A/G Scene must have at least two chunks");

  const firstBeat = scene.visualBeats[0];
  const firstChunk = scene.narrationChunks[0];
  const secondChunk = scene.narrationChunks[1];
  const lastChunk = scene.narrationChunks.at(-1)!;
  firstBeat.endChunkId = firstChunk.chunkId;
  firstBeat.narrationEndCue = firstChunk.speechText;

  const secondBeat = structuredClone(firstBeat);
  secondBeat.beatId = `${scene.sceneId}-beat-later`;
  secondBeat.startChunkId = secondChunk.chunkId;
  secondBeat.endChunkId = lastChunk.chunkId;
  secondBeat.narrationStartCue = secondChunk.speechText;
  secondBeat.narrationEndCue = lastChunk.speechText;
  secondBeat.screenState = "Data";
  secondBeat.visualMode = "text-focus";
  secondBeat.visualTemplate = "text-focus";
  secondBeat.viewerTexts = ["Later Beat context"];
  secondBeat.assetPlacementIds = [];
  secondBeat.assetState = "not-required";
  secondBeat.returnScreenState = null;
  secondBeat.entity = null;
  secondBeat.pictureBook = null;

  const sourceCard = scene.cards[0];
  const extraCard = structuredClone(sourceCard);
  extraCard.cardId = `${scene.sceneId}-later-beat-card`;
  extraCard.role = null;
  extraCard.title = "Later Beat context";
  extraCard.lines = [{label: "Context", value: "Later Beat owns this card", tone: "neutral"}];
  scene.cards.push(extraCard);
  secondBeat.objectIds = [extraCard.cardId];
  scene.visualBeats = [firstBeat, secondBeat];
  return value;
};

{
  const value = makeMultiBeatGapScene();
  const before = JSON.stringify(value);
  assert.throws(
    () => validateRenderSpecReferences(value, productionAssetManifest, voiceProfilesJson),
    /required data missing for expected-actual-gap|explicit role/,
    "legacy Scene-wide E/A/G validation should reproduce the regression",
  );
  validateRenderSpecReferencesMultiBeat(value, productionAssetManifest, voiceProfilesJson);
  assert.equal(JSON.stringify(value), before, "compatibility validation must not mutate the RenderSpec");
}

{
  const value = makeMultiBeatGapScene();
  const scene = value.scenes.find((item) => item.visualMode === "expected-actual-gap")!;
  const firstBeatCards = scene.cards.filter((card) => scene.visualBeats[0].objectIds.includes(card.cardId));
  const actual = firstBeatCards.find((card) => card.role === "actual");
  assert.ok(actual);
  actual.role = "expected";
  assert.throws(
    () => validateRenderSpecReferencesMultiBeat(value, productionAssetManifest, voiceProfilesJson),
    /exactly one Beat-owned expected card|exactly one Beat-owned actual card/,
    "multi-Beat compatibility must keep the first Beat E/A/G contract strict",
  );
}

console.log("multi-Beat scene validation tests passed");
