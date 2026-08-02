import {createHash} from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {episodeFinalSchema, type EpisodeFinal} from "../src/schemas/episode-final";
import {createTtsProvider} from "../src/tts/provider-registry";
import {normalizeSpeech, pronunciationDictionaryVersion} from "../src/tts/pronunciation";
import {
  generateSceneAudio,
  probeAudio,
  type SceneAudioMetadata,
} from "../src/tts/tts-service";
import type {SelectedVoice} from "../src/tts/types";
import {loadEpisodeV1} from "./load-episode-v1";
import {PROJECT_DIR} from "./render-helpers";

const inputPath = process.argv[2];
const force = process.argv.includes("--force");
if (!inputPath) {
  throw new Error(
    "Phase 2 JSONのパスが必要です。例: npm run generate:voiceover -- build/2026-07-10/episode_data.json",
  );
}

const resolvedInput = path.isAbsolute(inputPath)
  ? inputPath
  : path.resolve(process.cwd(), inputPath);
const baseBytesBefore = await readFile(resolvedInput);
const baseEpisodeDataSha256 = createHash("sha256")
  .update(baseBytesBefore)
  .digest("hex");
const baseEpisode = await loadEpisodeV1(resolvedInput);
const date = baseEpisode.episode.date;
const buildDirectory = path.join(PROJECT_DIR, "build", date);
const audioDirectory = path.join(buildDirectory, "audio");
const captionsDirectory = path.join(buildDirectory, "captions");
const logsDirectory = path.join(buildDirectory, "logs");
const publicDirectory = path.join(PROJECT_DIR, "public", "generated", date);
const publicAudioDirectory = path.join(publicDirectory, "audio");
const publicCaptionsDirectory = path.join(publicDirectory, "captions");
const cacheDirectory = path.join(PROJECT_DIR, ".cache", "tts");
await Promise.all(
  [
    audioDirectory,
    captionsDirectory,
    logsDirectory,
    publicAudioDirectory,
    publicCaptionsDirectory,
    cacheDirectory,
  ].map((directory) => mkdir(directory, {recursive: true})),
);

const provider = createTtsProvider();
if (provider.name === "gemini") {
  throw new Error("Geminiの旧Scene単位TTSは廃止されました。render_spec.jsonを入力し、npm run generate:voiceover:gemini または npm run episode:build:gemini を使用してください。");
}
const voice = await provider.selectVoice();
const voiceProfile = provider.name === "gemini" ? "gemini-charon" : "fox-main";

const hashText = (text: string) =>
  createHash("sha256").update(text).digest("hex");

const loadReusableMetadata = async (
  sceneId: string,
  displayText: string,
  speakingRate: number,
  selectedVoice: SelectedVoice,
) => {
  if (force) return null;
  try {
    const metadataPath = path.join(audioDirectory, `${sceneId}.metadata.json`);
    const metadata = JSON.parse(
      await readFile(metadataPath, "utf8"),
    ) as SceneAudioMetadata;
    const probe = await probeAudio(path.join(audioDirectory, `${sceneId}.wav`));
    if (
      metadata.provider === provider.name &&
      metadata.displayTextSha256 === hashText(displayText) &&
      metadata.speakingRate === speakingRate &&
      metadata.styleId === selectedVoice.styleId &&
      metadata.speakerUuid === selectedVoice.speakerUuid &&
      metadata.providerVersion === selectedVoice.engineVersion &&
      metadata.dictionaryVersion === pronunciationDictionaryVersion &&
      probe.durationMs === metadata.durationMs &&
      probe.sampleRate === 48000 &&
      probe.channels === 1
    ) {
      return metadata;
    }
  } catch {
    return null;
  }
  return null;
};

const generateAllScenes = async (speakingRate: number, regenerate = false) => {
  const output: SceneAudioMetadata[] = [];
  for (const scene of baseEpisode.scenes) {
    const reusable = regenerate
      ? null
      : await loadReusableMetadata(
          scene.id,
          scene.narration.displayText,
          speakingRate,
          voice,
        );
    if (reusable) {
      console.log(`Phase 4 ${scene.id}: 既存Scene WAVを再利用`);
      output.push(reusable);
      continue;
    }
    console.log(`Phase 4 ${scene.id}: ${provider.name}音声を生成`);
    output.push(
      await generateSceneAudio({
        sceneId: scene.id,
        displayText: scene.narration.displayText,
        outputDirectory: audioDirectory,
        cacheDirectory,
        provider,
        voice,
        voiceProfile,
        speakingRate,
      }),
    );
  }
  return output;
};

let speakingRate = 1.05;
if (!force) {
  try {
    const previous = JSON.parse(
      await readFile(path.join(audioDirectory, "scene-01.metadata.json"), "utf8"),
    ) as SceneAudioMetadata;
    if (
      previous.provider === provider.name &&
      previous.speakingRate >= 0.95 &&
      previous.speakingRate <= 1.15
    ) {
      speakingRate = previous.speakingRate;
    }
  } catch {
    // First complete generation starts at the specified default 1.05.
  }
}
let audioMetadata = await generateAllScenes(speakingRate);
const transitionSeconds =
  ((baseEpisode.scenes.length - 1) * baseEpisode.timeline.transitionFrames) /
  baseEpisode.episode.fps;
let measuredVideoSeconds =
  audioMetadata.reduce((sum, item) => sum + item.durationMs / 1000, 0) -
  transitionSeconds;
if (
  provider.name === "voicevox" &&
  (measuredVideoSeconds < 405 || measuredVideoSeconds > 465)
) {
  const targetSeconds = 435;
  const adjusted = Math.min(
    1.15,
    Math.max(0.95, speakingRate * (measuredVideoSeconds / targetSeconds)),
  );
  if (Math.abs(adjusted - speakingRate) >= 0.005) {
    speakingRate = Number(adjusted.toFixed(3));
    console.warn(
      `完成尺${measuredVideoSeconds.toFixed(1)}秒が許容外のため、話速${speakingRate}で一度だけ再生成します`,
    );
    audioMetadata = await generateAllScenes(speakingRate, true);
    measuredVideoSeconds =
      audioMetadata.reduce((sum, item) => sum + item.durationMs / 1000, 0) -
      transitionSeconds;
  }
}
if (
  provider.name === "gemini" &&
  (measuredVideoSeconds < 300 || measuredVideoSeconds > 465)
) {
  console.warn(
    `Gemini生成尺${measuredVideoSeconds.toFixed(1)}秒は目標外です。自動再生成せず、音声確認後に話速指示を調整してください。`,
  );
}

const captionChunks = (text: string) => {
  const tokens = text
    .split(/(?<=[、。！？!?])/u)
    .map((value) => value.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const token of tokens) {
    let remaining = token;
    while (remaining.length > 28) {
      const window = remaining.slice(0, 29);
      const breakAt = Math.max(window.lastIndexOf("、"), window.lastIndexOf(" "));
      const index = breakAt >= 10 ? breakAt + 1 : 28;
      chunks.push(remaining.slice(0, index));
      remaining = remaining.slice(index);
    }
    if (remaining) chunks.push(remaining);
  }
  return chunks;
};

const createCaptions = (metadata: SceneAudioMetadata) => {
  const captions: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: null;
    confidence: null;
    timingSource: "phrase-audio";
  }> = [];
  for (const segment of metadata.segments) {
    const chunks = captionChunks(segment.displayText);
    const totalWeight = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    let elapsedWeight = 0;
    for (const [index, chunk] of chunks.entries()) {
      const startMs = Math.round(
        segment.startMs +
          (segment.durationMs * elapsedWeight) / Math.max(1, totalWeight),
      );
      elapsedWeight += chunk.length;
      const endMs =
        index === chunks.length - 1
          ? segment.endMs
          : Math.round(
              segment.startMs +
                (segment.durationMs * elapsedWeight) / Math.max(1, totalWeight),
            );
      captions.push({
        text: chunk,
        startMs,
        endMs: Math.max(startMs + 1, endMs),
        timestampMs: null,
        confidence: null,
        timingSource: "phrase-audio",
      });
    }
  }
  return captions;
};

const normalizeForSearch = (value: string) =>
  value.replace(/[\s、。，．。！？!?「」『』]/gu, "");

const expressionWarnings: Array<{
  sceneId: string;
  triggerText: string;
  action: "initial-expression-maintained";
}> = [];

const resolveExpressionSwitches = (
  scene: (typeof baseEpisode.scenes)[number],
  metadata: SceneAudioMetadata,
) => {
  return scene.expressionSwitches.flatMap((item) => {
    const normalizedTrigger = normalizeForSearch(item.triggerText);
    for (const segment of metadata.segments) {
      const exactLocal = segment.displayText.indexOf(item.triggerText);
      if (exactLocal >= 0) {
        return {
          triggerText: item.triggerText,
          expression: item.expression,
          atMs: Math.round(
            segment.startMs +
              segment.durationMs * (exactLocal / Math.max(1, segment.displayText.length)),
          ),
          resolution: "exact" as const,
        };
      }
      const normalizedSegment = normalizeForSearch(segment.displayText);
      const normalizedLocal = normalizedSegment.indexOf(normalizedTrigger);
      if (normalizedLocal >= 0) {
        return {
          triggerText: item.triggerText,
          expression: item.expression,
          atMs: Math.round(
            segment.startMs +
              segment.durationMs *
                (normalizedLocal / Math.max(1, normalizedSegment.length)),
          ),
          resolution: "normalized" as const,
        };
      }
    }
    expressionWarnings.push({
      sceneId: scene.id,
      triggerText: item.triggerText,
      action: "initial-expression-maintained",
    });
    console.warn(
      `WARNING: ${scene.id}の表情切り替え語句がdisplayTextにないため初期表情を維持します: ${item.triggerText}`,
    );
    return [];
  });
};

const finalScenes: EpisodeFinal["scenes"] = [];
const pronunciationReport: Array<{
  sceneId: string;
  display: string;
  speech: string;
  count: number;
}> = [];

for (const [index, scene] of baseEpisode.scenes.entries()) {
  const metadata = audioMetadata[index];
  const captions = createCaptions(metadata);
  const captionBuildPath = path.join(
    captionsDirectory,
    `${scene.id}.captions.json`,
  );
  const captionPublicPath = path.join(publicCaptionsDirectory, `${scene.id}.json`);
  await Promise.all([
    writeFile(captionBuildPath, `${JSON.stringify(captions, null, 2)}\n`, "utf8"),
    writeFile(captionPublicPath, `${JSON.stringify(captions, null, 2)}\n`, "utf8"),
    copyFile(
      path.join(audioDirectory, `${scene.id}.wav`),
      path.join(publicAudioDirectory, `${scene.id}.wav`),
    ),
    copyFile(
      path.join(audioDirectory, `${scene.id}.metadata.json`),
      path.join(publicAudioDirectory, `${scene.id}.metadata.json`),
    ),
  ]);
  for (const segment of metadata.segments) {
    for (const change of segment.pronunciationChanges) {
      pronunciationReport.push({sceneId: scene.id, ...change});
    }
  }
  const normalized = normalizeSpeech(scene.narration.displayText);
  finalScenes.push({
    ...scene,
    durationInFrames: Math.ceil(
      (metadata.durationMs / 1000) * baseEpisode.episode.fps,
    ),
    durationSource: "audio-measured",
    expressionSwitches: resolveExpressionSwitches(scene, metadata),
    narration: {
      displayText: scene.narration.displayText,
      speechText: normalized.speechText,
      audioSrc: `generated/${date}/audio/${scene.id}.wav`,
      metadataSrc: `generated/${date}/audio/${scene.id}.metadata.json`,
      durationMs: metadata.durationMs,
    },
    captions: {
      src: `generated/${date}/captions/${scene.id}.json`,
      quality: "phrase-audio",
      items: captions,
    },
  });
}

let nextStartFrame = 0;
const timelineScenes = finalScenes.map((scene, index) => {
  const transitionFramesAfter =
    index === finalScenes.length - 1 ? 0 : baseEpisode.timeline.transitionFrames;
  const startFrame = nextStartFrame;
  const endFrame = startFrame + scene.durationInFrames - 1;
  nextStartFrame = endFrame + 1 - transitionFramesAfter;
  return {
    sceneId: scene.id,
    startFrame,
    endFrame,
    durationInFrames: scene.durationInFrames,
    transitionFramesAfter,
  };
});

const voiceCredit = provider.name === "gemini" ? "音声：Google Gemini TTS" : "音声：VOICEVOX";
const speakerCredit = `使用音声：${voice.styleName}`;
const finalEpisode = episodeFinalSchema.parse({
  schemaVersion: "1.1.0",
  source: {
    ...baseEpisode.source,
    generatedAt: new Date().toISOString(),
    baseEpisodeDataSha256,
  },
  episode: baseEpisode.episode,
  assets: {...baseEpisode.assets, bgmId: null},
  tts: {
    provider: provider.name,
    providerVersion: voice.engineVersion,
    voiceProfile,
    characterName: voice.characterName,
    styleName: voice.styleName,
    styleId: voice.styleId,
    speakerUuid: voice.speakerUuid,
    speakingRate,
    pronunciationDictionaryVersion,
    capabilities: provider.capabilities,
  },
  credits: {
    description: `${voiceCredit}\n${speakerCredit}`,
    voice: voiceCredit,
    speaker: speakerCredit,
  },
  scenes: finalScenes,
  timeline: {
    provisional: false,
    durationSource: "audio-measured",
    fps: baseEpisode.episode.fps,
    transitionFrames: baseEpisode.timeline.transitionFrames,
    totalDurationInFrames: timelineScenes.at(-1)!.endFrame + 1,
    scenes: timelineScenes,
  },
});

const finalPath = path.join(buildDirectory, "episode_data.final.json");
await writeFile(finalPath, `${JSON.stringify(finalEpisode, null, 2)}\n`, "utf8");
await Promise.all([
  writeFile(
    path.join(logsDirectory, "tts.log"),
    `${JSON.stringify(
      {
        provider: provider.name,
        voice,
        speakingRate,
        measuredVideoSeconds,
        scenes: audioMetadata.map((item) => ({
          sceneId: item.sceneId,
          durationMs: item.durationMs,
          cacheHits: item.segments.filter((segment) => segment.cacheHit).length,
          segments: item.segments.length,
        })),
      },
      null,
      2,
    )}\n`,
    "utf8",
  ),
  writeFile(
    path.join(logsDirectory, "speech-normalization.log"),
    `${JSON.stringify(pronunciationReport, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    path.join(logsDirectory, "caption-alignment.log"),
    `${JSON.stringify(
      finalScenes.map((scene) => ({
        sceneId: scene.id,
        captionCount: scene.captions.items.length,
        quality: scene.captions.quality,
        expressionSwitches: scene.expressionSwitches,
      })),
      null,
      2,
    )}\n`,
    "utf8",
  ),
  writeFile(
    path.join(buildDirectory, "expression-warnings.json"),
    `${JSON.stringify(expressionWarnings, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    path.join(logsDirectory, "timeline.log"),
    `${JSON.stringify(finalEpisode.timeline, null, 2)}\n`,
    "utf8",
  ),
]);

const baseBytesAfter = await readFile(resolvedInput);
if (!baseBytesBefore.equals(baseBytesAfter)) {
  throw new Error("既存episode_data.jsonが変更されました");
}
await stat(finalPath);
console.log(`Phase 4〜5完了: ${finalPath}`);
console.log(
  `${provider.name}: ${voice.characterName} / ${voice.styleName} / ID ${voice.styleId} / ${voice.engineVersion}`,
);
console.log(`実測動画尺: ${measuredVideoSeconds.toFixed(3)}秒`);
