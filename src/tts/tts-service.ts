import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import type {PronunciationChange} from "./pronunciation";
import {normalizeSpeech, pronunciationDictionaryVersion} from "./pronunciation";
import {segmentDisplayText} from "./segmenter";
import type {SelectedVoice, TtsProvider, TtsResult} from "./types";
import {createTtsCacheKey} from "./cache";

const execFileAsync = promisify(execFile);

export type AudioProbe = {
  durationMs: number;
  sampleRate: number;
  channels: number;
  codec: string;
  bitsPerSample: number;
  sampleFormat: string;
  fileSizeBytes: number;
};

export type SceneSegmentMetadata = {
  index: number;
  displayText: string;
  speechText: string;
  audioPath: string;
  cacheKey: string;
  cacheHit: boolean;
  startMs: number;
  endMs: number;
  durationMs: number;
  pauseAfterMs: number;
  pronunciationChanges: PronunciationChange[];
};

export type SceneAudioMetadata = {
  sceneId: string;
  displayTextSha256: string;
  provider: string;
  providerVersion: string;
  voiceProfile: string;
  characterName: string;
  styleName: string;
  styleId: number;
  speakerUuid: string;
  speakingRate: number;
  dictionaryVersion: string;
  audioPath: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  codec: string;
  fileSizeBytes: number;
  sha256: string;
  preRollMs: number;
  postRollMs: number;
  segments: SceneSegmentMetadata[];
  generatedAt: string;
};

const run = async (command: string, args: string[]) => {
  try {
    return await execFileAsync(command, args, {
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${command}の実行に失敗しました: ${message}`);
  }
};

export const probeAudio = async (audioPath: string): Promise<AudioProbe> => {
  const {stdout} = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_name,sample_rate,channels,bits_per_sample,sample_fmt",
    "-of",
    "json",
    audioPath,
  ]);
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{codec_name?: string; sample_rate?: string; channels?: number; bits_per_sample?: number; sample_fmt?: string}>;
    format?: {duration?: string; size?: string};
  };
  const stream = parsed.streams?.[0];
  const durationMs = Math.round(Number(parsed.format?.duration ?? 0) * 1000);
  const sampleRate = Number(stream?.sample_rate ?? 0);
  const channels = Number(stream?.channels ?? 0);
  const fileSizeBytes = Number(parsed.format?.size ?? 0);
  if (
    durationMs <= 0 ||
    sampleRate <= 0 ||
    channels <= 0 ||
    !stream?.codec_name ||
    fileSizeBytes <= 44
  ) {
    throw new Error(`音声メタデータが不正です: ${audioPath}`);
  }
  return {
    durationMs,
    sampleRate,
    channels,
    codec: stream.codec_name,
    bitsPerSample: Number(stream.bits_per_sample ?? 0),
    sampleFormat: stream.sample_fmt ?? "unknown",
    fileSizeBytes,
  };
};

const fileSha256 = async (filePath: string) =>
  createHash("sha256").update(await readFile(filePath)).digest("hex");

const standardizeWav = async (input: string, output: string) => {
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    output,
  ]);
};

const ensureSilence = async (cacheDirectory: string, durationMs: number) => {
  const output = path.join(cacheDirectory, `silence-${durationMs}.wav`);
  try {
    await stat(output);
    return output;
  } catch {
    await mkdir(cacheDirectory, {recursive: true});
    await run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=48000:cl=mono",
      "-t",
      (durationMs / 1000).toFixed(3),
      "-c:a",
      "pcm_s16le",
      output,
    ]);
    return output;
  }
};

const ensureSegment = async ({
  provider,
  voice,
  voiceProfile,
  speakingRate,
  displayText,
  speechText,
  cacheDirectory,
}: {
  provider: TtsProvider;
  voice: SelectedVoice;
  voiceProfile: string;
  speakingRate: number;
  displayText: string;
  speechText: string;
  cacheDirectory: string;
}) => {
  const cacheKey = createTtsCacheKey({
    provider: provider.name,
    providerVersion: voice.engineVersion,
    voiceProfile,
    providerVoiceId: String(voice.styleId),
    speakerUuid: voice.speakerUuid,
    speechText,
    speakingRate,
    dictionaryVersion: pronunciationDictionaryVersion,
    outputFormat: "wav",
  });
  const directory = path.join(cacheDirectory, cacheKey);
  const audioPath = path.join(directory, "audio.wav");
  const metadataPath = path.join(directory, "metadata.json");
  try {
    const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as TtsResult;
    const probe = await probeAudio(audioPath);
    if (
      metadata.cacheKey === cacheKey &&
      probe.sampleRate === 48000 &&
      probe.channels === 1
    ) {
      return {metadata, cacheHit: true};
    }
  } catch {
    // Cache miss or invalid cache: regenerate only this segment.
  }

  await mkdir(directory, {recursive: true});
  const rawPath = path.join(directory, "provider-output.wav");
  const generated = await provider.synthesize(
    {
      displayText,
      speechText,
      voiceProfile,
      speakingRate,
      outputFormat: "wav",
      outputPath: rawPath,
    },
    voice,
  );
  await standardizeWav(rawPath, audioPath);
  const probe = await probeAudio(audioPath);
  if (probe.sampleRate !== 48000 || probe.channels !== 1 || probe.codec !== "pcm_s16le") {
    throw new Error(`標準WAV形式へ変換できませんでした: ${audioPath}`);
  }
  const metadata: TtsResult = {
    audioPath,
    durationMs: probe.durationMs,
    provider: provider.name,
    providerVersion: generated.providerVersion,
    providerVoiceId: String(voice.styleId),
    voiceProfile,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    fileSizeBytes: probe.fileSizeBytes,
    sha256: await fileSha256(audioPath),
    cacheKey,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return {metadata, cacheHit: false};
};

const toConcatPath = (filePath: string) =>
  filePath.replaceAll("\\", "/").replaceAll("'", "'\\''");

export const generateSceneAudio = async ({
  sceneId,
  displayText,
  outputDirectory,
  cacheDirectory,
  provider,
  voice,
  voiceProfile = "fox-main",
  speakingRate = 1.05,
}: {
  sceneId: string;
  displayText: string;
  outputDirectory: string;
  cacheDirectory: string;
  provider: TtsProvider;
  voice: SelectedVoice;
  voiceProfile?: string;
  speakingRate?: number;
}): Promise<SceneAudioMetadata> => {
  const preRollMs = 200;
  const postRollMs = 600;
  const segments = segmentDisplayText(
    displayText,
    (text) => normalizeSpeech(text).speechText,
  );
  if (segments.length === 0) {
    throw new Error(`${sceneId}のTTS分割結果が空です`);
  }

  if (provider.name === "gemini") {
    await mkdir(outputDirectory, {recursive: true});
    const normalizedScene = normalizeSpeech(displayText);
    const generated = await ensureSegment({
      provider,
      voice,
      voiceProfile,
      speakingRate,
      displayText,
      speechText: normalizedScene.speechText,
      cacheDirectory,
    });
    const concatFiles = [
      await ensureSilence(cacheDirectory, preRollMs),
      generated.metadata.audioPath,
      await ensureSilence(cacheDirectory, postRollMs),
    ];
    const concatPath = path.join(outputDirectory, `${sceneId}.concat.txt`);
    await writeFile(
      concatPath,
      `${concatFiles.map((file) => `file '${toConcatPath(file)}'`).join("\n")}\n`,
      "utf8",
    );
    const rawScenePath = path.join(outputDirectory, `${sceneId}.pre-normalize.wav`);
    const scenePath = path.join(outputDirectory, `${sceneId}.wav`);
    await run("ffmpeg", [
      "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", concatPath,
      "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", rawScenePath,
    ]);
    await run("ffmpeg", [
      "-y", "-v", "error", "-i", rawScenePath,
      "-af", "loudnorm=I=-16:TP=-1:LRA=11",
      "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", scenePath,
    ]);
    const probe = await probeAudio(scenePath);
    if (probe.sampleRate !== 48_000 || probe.channels !== 1 || probe.codec !== "pcm_s16le") {
      throw new Error(`${sceneId}が48kHz mono PCM WAVではありません`);
    }
    const normalizedSegments = segments.map((segment) => ({
      segment,
      normalized: normalizeSpeech(segment.displayText),
    }));
    const totalWeight = normalizedSegments.reduce(
      (sum, item) => sum + Math.max(1, item.normalized.speechText.length),
      0,
    );
    let elapsedWeight = 0;
    const segmentMetadata = normalizedSegments.map((item, index) => {
      const startMs = preRollMs + Math.round(
        generated.metadata.durationMs * elapsedWeight / totalWeight,
      );
      elapsedWeight += Math.max(1, item.normalized.speechText.length);
      const endMs = preRollMs + Math.round(
        generated.metadata.durationMs * elapsedWeight / totalWeight,
      );
      return {
        index: index + 1,
        displayText: item.segment.displayText,
        speechText: item.normalized.speechText,
        audioPath: generated.metadata.audioPath,
        cacheKey: generated.metadata.cacheKey,
        cacheHit: generated.cacheHit,
        startMs,
        endMs,
        durationMs: Math.max(1, endMs - startMs),
        pauseAfterMs: index === normalizedSegments.length - 1 ? postRollMs : 0,
        pronunciationChanges: item.normalized.changes,
      } satisfies SceneSegmentMetadata;
    });
    const metadata: SceneAudioMetadata = {
      sceneId,
      displayTextSha256: createHash("sha256").update(displayText).digest("hex"),
      provider: provider.name,
      providerVersion: voice.engineVersion,
      voiceProfile,
      characterName: voice.characterName,
      styleName: voice.styleName,
      styleId: voice.styleId,
      speakerUuid: voice.speakerUuid,
      speakingRate,
      dictionaryVersion: pronunciationDictionaryVersion,
      audioPath: scenePath,
      durationMs: probe.durationMs,
      sampleRate: probe.sampleRate,
      channels: probe.channels,
      codec: probe.codec,
      fileSizeBytes: probe.fileSizeBytes,
      sha256: await fileSha256(scenePath),
      preRollMs,
      postRollMs,
      segments: segmentMetadata,
      generatedAt: new Date().toISOString(),
    };
    await writeFile(
      path.join(outputDirectory, `${sceneId}.metadata.json`),
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    );
    return metadata;
  }

  const segmentDirectory = path.join(outputDirectory, "segments");
  await mkdir(segmentDirectory, {recursive: true});
  const concatFiles: string[] = [await ensureSilence(cacheDirectory, preRollMs)];
  const segmentMetadata: SceneSegmentMetadata[] = [];
  let cursorMs = preRollMs;

  for (const [index, segment] of segments.entries()) {
    const normalized = normalizeSpeech(segment.displayText);
    const generated = await ensureSegment({
      provider,
      voice,
      voiceProfile,
      speakingRate,
      displayText: segment.displayText,
      speechText: normalized.speechText,
      cacheDirectory,
    });
    const segmentOutput = path.join(
      segmentDirectory,
      `${sceneId}-${String(index + 1).padStart(2, "0")}.wav`,
    );
    await copyFile(generated.metadata.audioPath, segmentOutput);
    const startMs = cursorMs;
    const endMs = startMs + generated.metadata.durationMs;
    const pauseAfterMs =
      index === segments.length - 1 ? postRollMs : segment.terminalPauseMs;
    segmentMetadata.push({
      index: index + 1,
      displayText: segment.displayText,
      speechText: normalized.speechText,
      audioPath: segmentOutput,
      cacheKey: generated.metadata.cacheKey,
      cacheHit: generated.cacheHit,
      startMs,
      endMs,
      durationMs: generated.metadata.durationMs,
      pauseAfterMs,
      pronunciationChanges: normalized.changes,
    });
    concatFiles.push(segmentOutput);
    concatFiles.push(await ensureSilence(cacheDirectory, pauseAfterMs));
    cursorMs = endMs + pauseAfterMs;
  }

  const concatPath = path.join(outputDirectory, `${sceneId}.concat.txt`);
  await writeFile(
    concatPath,
    `${concatFiles.map((file) => `file '${toConcatPath(file)}'`).join("\n")}\n`,
    "utf8",
  );
  const rawScenePath = path.join(outputDirectory, `${sceneId}.pre-normalize.wav`);
  const scenePath = path.join(outputDirectory, `${sceneId}.wav`);
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "1",
    rawScenePath,
  ]);
  await run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    rawScenePath,
    "-af",
    "loudnorm=I=-16:TP=-1:LRA=11",
    "-c:a",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "1",
    scenePath,
  ]);
  const probe = await probeAudio(scenePath);
  if (probe.sampleRate !== 48000 || probe.channels !== 1 || probe.codec !== "pcm_s16le") {
    throw new Error(`${sceneId}が48kHz mono PCM WAVではありません`);
  }
  const metadata: SceneAudioMetadata = {
    sceneId,
    displayTextSha256: createHash("sha256").update(displayText).digest("hex"),
    provider: provider.name,
    providerVersion: voice.engineVersion,
    voiceProfile,
    characterName: voice.characterName,
    styleName: voice.styleName,
    styleId: voice.styleId,
    speakerUuid: voice.speakerUuid,
    speakingRate,
    dictionaryVersion: pronunciationDictionaryVersion,
    audioPath: scenePath,
    durationMs: probe.durationMs,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    codec: probe.codec,
    fileSizeBytes: probe.fileSizeBytes,
    sha256: await fileSha256(scenePath),
    preRollMs,
    postRollMs,
    segments: segmentMetadata,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(
    path.join(outputDirectory, `${sceneId}.metadata.json`),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
  return metadata;
};
