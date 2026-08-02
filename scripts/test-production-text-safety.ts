import assert from "node:assert/strict";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {compileRenderSpec} from "../src/spec/compile-render-spec";
import {assertProductionTextSafe} from "../src/spec/production-text-safety";
import {renderSpecSchema} from "../src/spec/render-spec";

const fixture = renderSpecSchema.parse(fixtureJson);
const clone = () => structuredClone(fixture);
const assetPaths = Object.fromEntries(
  Object.entries(productionAssetManifest.assets).map(([id, asset]) => [id, asset.path]),
);
const technicalSynth = async ({chunkId}: {chunkId: string}) => ({
  audioSrc: `audio/${chunkId}.wav`,
  durationMs: 1000,
});

{
  const value = clone();
  value.review.requiredChanges = ["Charon実測尺を確認し正式レンダーを検証する"];
  assertProductionTextSafe(value);
  await compileRenderSpec(value, technicalSynth, assetPaths);
}

{
  const value = clone();
  value.scenes[0].headline = "実測時間を表示";
  assert.throws(
    () => assertProductionTextSafe(value),
    /\$\.scenes\[0\]\.headline: production forbidden text: 実測/,
  );
}

{
  const value = clone();
  value.scenes[0].narrationChunks[0].captionText = "実測時間を表示";
  assert.throws(
    () => assertProductionTextSafe(value),
    /\$\.scenes\[0\]\.narrationChunks\[0\]\.captionText: production forbidden text: 実測/,
  );
}

{
  const value = clone();
  value.scenes[0].headline = "実測時間を表示";
  let synthesisCalls = 0;
  await assert.rejects(
    () => compileRenderSpec(value, async () => {
      synthesisCalls += 1;
      return {audioSrc: "audio/should-not-run.wav", durationMs: 1000};
    }, assetPaths),
    /production forbidden text: 実測/,
  );
  assert.equal(synthesisCalls, 0);
}

console.log("PASS: production text safety checks public text before TTS");
