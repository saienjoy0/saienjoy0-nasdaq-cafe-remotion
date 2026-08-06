import {createHash} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {productionAssetPaths} from "../src/config/production-assets";
import {compileRenderSpec, type SynthesizedChunk} from "../src/spec/compile-render-spec";
import {measureVisualGrammarTiming} from "../src/spec/measure-visual-grammar";
import {loadRenderSpecForProduction} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {createSpecBlockSynthesizer, SPEC_AUDIO_STANDARD} from "./spec-audio";

const input = process.argv[2];
if (!input) {
  throw new Error("usage: compile-visual-grammar-ab-technical <render_spec.json>");
}
if (process.env.VISUAL_GRAMMAR_TECHNICAL_AB !== "1") {
  throw new Error("technical A/B compilation requires VISUAL_GRAMMAR_TECHNICAL_AB=1");
}
if (process.env.SPEC_TTS_CACHE_ONLY !== "1") {
  throw new Error("technical A/B compilation requires SPEC_TTS_CACHE_ONLY=1");
}

const loaded = await loadRenderSpecForProduction(input);
const {spec, sha256, expressionPreflight} = loaded;
if (spec.schemaVersion !== "2.4.0") {
  throw new Error(`technical A/B requires render_spec 2.4.0; got=${spec.schemaVersion}`);
}
if (spec.episode.id !== "2099-02-02" || spec.episode.marketSession !== "技術検証") {
  throw new Error(
    "technical A/B compile bypass is restricted to the approved 2099-02-02 技術検証 fixture",
  );
}

const audioDiagnostics: Array<{
  sceneId: string;
  chunkId: string;
  audio: SynthesizedChunk;
}> = [];
const data = await compileRenderSpec(
  spec,
  createSpecBlockSynthesizer(spec),
  productionAssetPaths,
  {
    inputSpecSha256: sha256,
    onSynthesizedChunk: (value) => audioDiagnostics.push(value),
  },
);

const workspace = path.join(PROJECT_DIR, "build", spec.episode.id);
const productionPath = path.join(workspace, "render_data.production.json");
const technicalPath = path.join(workspace, "technical_report.json");
const timingPath = path.join(workspace, "visual_grammar_timing_report.json");
await mkdir(workspace, {recursive: true});
await writeFile(productionPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

const timing = measureVisualGrammarTiming(spec, data);
if (!timing) throw new Error("technical A/B requires a Visual Grammar timing report");
const timingJson = `${JSON.stringify(timing, null, 2)}\n`;
await writeFile(timingPath, timingJson, "utf8");
const timingSha256 = createHash("sha256").update(timingJson).digest("hex");

const chunks = data.scenes.flatMap((scene) =>
  scene.narrationChunks.map((chunk) => {
    const diagnostic = audioDiagnostics.find((item) => item.chunkId === chunk.chunkId)?.audio;
    if (!diagnostic) throw new Error(`missing audio diagnostic: ${chunk.chunkId}`);
    return {
      sceneId: scene.sceneId,
      chunkId: chunk.chunkId,
      cacheKey: diagnostic.cacheKey,
      cacheHit: diagnostic.cacheHit,
      audioPath: diagnostic.audioPath,
      audioSrc: chunk.audioSrc,
      durationMs: chunk.audioDurationMs,
      pauseAfterMs: chunk.pauseAfterMs,
      sampleRate: diagnostic.sampleRate,
      channels: diagnostic.channels,
      codec: diagnostic.codec,
    };
  }),
);

const report = {
  status: "technical-ab-compiled",
  generatedAt: new Date().toISOString(),
  technicalFixture: true,
  productionEligible: false,
  promotionBlocked: true,
  userReviewRequired: true,
  finalAuthorized: false,
  inputSpecPath: loaded.resolved,
  inputSpecSha256: sha256,
  schemaVersion: spec.schemaVersion,
  episodeId: spec.episode.id,
  voiceProfileId: spec.voiceProfileId,
  sceneCount: data.scenes.length,
  chunkCount: chunks.length,
  expressionPreflight: {
    status: "valid",
    checked: expressionPreflight.checked.length,
    assets: expressionPreflight.assets,
  },
  assetPreflight: {
    status: "valid",
    checked: data.scenes.flatMap((scene) => scene.assetPlacements).length,
  },
  cache: {
    mode: "cache-only",
    providerCallsAllowed: false,
    hits: chunks.filter((chunk) => chunk.cacheHit).length,
    misses: chunks.filter((chunk) => !chunk.cacheHit).length,
  },
  audioStandard: SPEC_AUDIO_STANDARD,
  chunks,
  visualGrammarTiming: {
    status: timing.status,
    diagnosticOnlyForTechnicalAb: true,
    productionPromotionAllowed: false,
    path: timingPath,
    sha256: timingSha256,
    failureCodes: timing.failures.map((failure) => failure.code),
  },
  totalProductionDuration: {
    frames: data.timeline.totalDurationInFrames,
    ms: Math.round((data.timeline.totalDurationInFrames * 1000) / data.episode.fps),
  },
  errors: timing.failures,
  productionJsonPath: productionPath,
  previewPath: null,
  render: {
    codec: "h264",
    fps: spec.episode.fps,
    width: spec.episode.width,
    height: spec.episode.height,
    audioExpected: true,
    audioCodec: "aac",
    sampleRate: 48000,
    channels: 2,
  },
};
await writeFile(technicalPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      status: report.status,
      episodeId: spec.episode.id,
      productionEligible: false,
      finalAuthorized: false,
      timingStatus: timing.status,
      productionPath,
      technicalPath,
      timingPath,
    },
    null,
    2,
  ),
);
