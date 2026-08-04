import {createHash} from "node:crypto";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia} from "@remotion/renderer";
import voiceProfilesJson from "../config/voice-profiles.json";
import {productionAssetPaths} from "../src/config/production-assets";
import {compileRenderSpec} from "../src/spec/compile-render-spec";
import {resolveVoiceProfile} from "../src/spec/validate-render-spec";
import {probeAudio} from "../src/tts/tts-service";
import {loadRenderSpecForProduction} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {
  createSpecBlockSynthesizer,
  SPEC_AUDIO_STANDARD,
  SPEC_TTS_BLOCKS,
} from "./spec-audio";

const BLOCK_SYNTHESIS_VERSION = "gemini-two-block-v1";

const usage = () => {
  throw new Error(
    "usage: render-motion-preview <render_spec.json> <scene-number 1-9> [offset-seconds=0] [duration-seconds=20]",
  );
};

const input = process.argv[2];
const sceneNumber = Number(process.argv[3]);
const offsetSeconds = Number(process.argv[4] ?? "0");
const durationSeconds = Number(process.argv[5] ?? "20");

if (!input) usage();
if (!Number.isInteger(sceneNumber) || sceneNumber < 1 || sceneNumber > 9) usage();
if (!Number.isFinite(offsetSeconds) || offsetSeconds < 0) usage();
if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 30) {
  throw new Error("duration-seconds must be greater than 0 and at most 30");
}

const loaded = await loadRenderSpecForProduction(input);
const {spec, sha256} = loaded;
const profile = resolveVoiceProfile(spec.voiceProfileId, voiceProfilesJson);
const selectedSpecScene = spec.scenes.find(
  (scene) => scene.sceneNumber === sceneNumber,
);
if (!selectedSpecScene) {
  throw new Error(`scene ${sceneNumber} does not exist in ${spec.episode.id}`);
}

const verifiedCaches: Array<{blockId: string; cacheKey: string; audioPath: string}> = [];
for (const block of SPEC_TTS_BLOCKS) {
  const units = spec.scenes
    .filter(
      (scene) =>
        scene.sceneNumber >= block.firstScene &&
        scene.sceneNumber <= block.lastScene,
    )
    .flatMap((scene) => scene.narrationChunks);
  if (units.length === 0) {
    throw new Error(`${block.id}: no narration chunks`);
  }
  const speechText = units.map((unit) => unit.speechText).join("\n\n");
  const cacheKey = createHash("sha256")
    .update(
      JSON.stringify({
        synthesisVersion: BLOCK_SYNTHESIS_VERSION,
        provider: profile.provider,
        model: profile.model,
        voice: profile.voice,
        speakerUuid: profile.speakerUuid,
        styleId: profile.styleId,
        voiceProfileId: spec.voiceProfileId,
        speechText,
        pronunciations: spec.pronunciations,
        audioStandard: SPEC_AUDIO_STANDARD,
      }),
    )
    .digest("hex");
  const cacheDir = path.join(
    PROJECT_DIR,
    ".cache",
    "spec-tts-blocks",
    cacheKey,
  );
  const audioPath = path.join(cacheDir, "audio.wav");
  const metadataPath = path.join(cacheDir, "metadata.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {
    cacheKey?: string;
    synthesisVersion?: string;
  };
  const audioStats = await stat(audioPath);
  if (
    metadata.cacheKey !== cacheKey ||
    metadata.synthesisVersion !== BLOCK_SYNTHESIS_VERSION ||
    audioStats.size <= 44
  ) {
    throw new Error(
      `${block.id}: exact production TTS cache is missing or invalid; Motion Preview never calls TTS`,
    );
  }
  const probe = await probeAudio(audioPath);
  if (
    probe.sampleRate !== SPEC_AUDIO_STANDARD.sampleRate ||
    probe.channels !== SPEC_AUDIO_STANDARD.channels ||
    probe.codec !== SPEC_AUDIO_STANDARD.codec ||
    probe.bitsPerSample !== SPEC_AUDIO_STANDARD.bitsPerSample
  ) {
    throw new Error(`${block.id}: cached audio standard mismatch`);
  }
  verifiedCaches.push({blockId: block.id, cacheKey, audioPath});
}

// The production synthesizer performs a local fixed-voice identity check even on
// a cache hit. Supply a deliberately invalid sentinel only after both exact
// caches have been verified. No real credential is inherited by this process.
for (let index = 1; index <= 10; index += 1) {
  delete process.env[`GEMINI_API_KEY_${index}`];
}
delete process.env.GEMINI_API_KEYS;
delete process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY_1 = "motion-preview-cache-only-sentinel";

const data = await compileRenderSpec(
  spec,
  createSpecBlockSynthesizer(spec),
  productionAssetPaths,
  {inputSpecSha256: sha256},
);
const selectedScene = data.scenes.find(
  (scene) => scene.sceneId === selectedSpecScene.sceneId,
);
if (!selectedScene) {
  throw new Error(`compiled scene missing: ${selectedSpecScene.sceneId}`);
}

const fps = data.episode.fps;
const requestedStart =
  selectedScene.startFrame + Math.floor(offsetSeconds * fps);
const sceneLastFrame = Math.max(
  selectedScene.startFrame,
  selectedScene.endFrame - 1,
);
if (requestedStart > sceneLastFrame) {
  throw new Error(
    `offset ${offsetSeconds}s starts after Scene ${sceneNumber} ends`,
  );
}
const requestedEnd = requestedStart + Math.ceil(durationSeconds * fps) - 1;
const endFrame = Math.min(requestedEnd, sceneLastFrame);
const startFrame = requestedStart;

const inputProps = {data};
const serveUrl = await bundle({
  entryPoint: path.join(PROJECT_DIR, "src", "index.ts"),
});
const compositions = await getCompositions(serveUrl, {inputProps});
const composition = compositions.find((item) => item.id === "NasdaqCafeSpec");
if (!composition) {
  throw new Error("composition not found: NasdaqCafeSpec");
}

const outputDirectory = path.join(PROJECT_DIR, "renders", "motion-preview");
await mkdir(outputDirectory, {recursive: true});
const output = path.join(
  outputDirectory,
  `${spec.episode.id}_scene-${String(sceneNumber).padStart(2, "0")}_${startFrame}-${endFrame}.mp4`,
);

await renderMedia({
  composition,
  serveUrl,
  inputProps,
  outputLocation: output,
  codec: "h264",
  audioCodec: "aac",
  sampleRate: 48_000,
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
  crf: 32,
  scale: 0.5,
  frameRange: [startFrame, endFrame],
  concurrency: Math.max(1, Math.min(3, os.cpus().length)),
});

const reportDirectory = path.join(PROJECT_DIR, "build", spec.episode.id);
await mkdir(reportDirectory, {recursive: true});
const reportPath = path.join(reportDirectory, "motion_preview_report.json");
await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      status: "motion-preview-generated",
      generatedAt: new Date().toISOString(),
      inputSpecPath: loaded.resolved,
      inputSpecSha256: sha256,
      episodeId: spec.episode.id,
      sceneNumber,
      sceneId: selectedScene.sceneId,
      requestedOffsetSeconds: offsetSeconds,
      requestedDurationSeconds: durationSeconds,
      frameRange: [startFrame, endFrame],
      actualDurationSeconds: (endFrame - startFrame + 1) / fps,
      fps,
      output,
      render: {
        width: Math.round(data.episode.width * 0.5),
        height: Math.round(data.episode.height * 0.5),
        codec: "h264",
        audioCodec: "aac",
        crf: 32,
        scale: 0.5,
        concurrency: Math.max(1, Math.min(3, os.cpus().length)),
      },
      tts: {
        mode: "cache-only",
        providerCallsAllowed: false,
        verifiedCaches,
      },
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`motion preview: ${output}`);
console.log(`motion preview report: ${reportPath}`);
