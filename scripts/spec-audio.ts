import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {createTtsCacheKey} from "../src/tts/cache";
import {probeAudio} from "../src/tts/tts-service";
import {GeminiTtsProvider} from "../src/tts/providers/gemini-tts-provider";
import {VoicevoxProvider} from "../src/tts/providers/voicevox-provider";
import type {SelectedVoice} from "../src/tts/types";
import type {RenderSpec} from "../src/spec/render-spec";
import type {ChunkSynthesizer, SynthesizedChunk} from "../src/spec/compile-render-spec";
import voiceProfilesJson from "../config/voice-profiles.json";
import {PROJECT_DIR} from "./render-helpers";

const execFileAsync = promisify(execFile);
export const SPEC_AUDIO_STANDARD = {
  sampleRate: 48000,
  channels: 1,
  codec: "pcm_s16le",
  bitsPerSample: 16,
  sampleFormat: "s16",
  normalization: "format-only:no-rate-pitch-content-processing",
} as const;

type VoiceProfile = {
  provider: "voicevox" | "gemini";
  model?: string;
  voice?: string;
  speakingRate: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  characterName: string;
  styleName: string;
  styleId: number;
  speakerUuid: string;
};

const profiles = voiceProfilesJson.profiles as unknown as Record<string, VoiceProfile>;
const getProfile = (id: string) => {
  const profile = profiles[id];
  if (!profile) throw new Error(`$.voiceProfileId: unknown voice profile ${id}`);
  return profile;
};

const profileChecks = new Map<string, Promise<SelectedVoice>>();
export const assertSpecVoiceProfile = async (voiceProfileId: string, baseUrl?: string) => {
  const profile = getProfile(voiceProfileId);
  const key = profile.provider === "voicevox"
    ? `${baseUrl ?? process.env.VOICEVOX_BASE_URL ?? "http://127.0.0.1:50021"}:${voiceProfileId}`
    : `${profile.model}:${profile.voice}:${voiceProfileId}`;
  if (!profileChecks.has(key)) {
    const check = profile.provider === "voicevox"
      ? new VoicevoxProvider(baseUrl).assertFixedVoice(profile)
      : new GeminiTtsProvider(profile.model, profile.voice).selectVoice();
    profileChecks.set(key, check.then((voice) => {
      if (voice.speakerUuid !== profile.speakerUuid || voice.styleId !== profile.styleId) {
        throw new Error(`fixed voice mismatch: ${voiceProfileId}`);
      }
      return voice;
    }).catch((error) => {
      profileChecks.delete(key);
      throw new Error(`$.voiceProfileId: ${profile.provider} profile preflight failed for ${voiceProfileId}; no provider/speaker/style fallback: ${error instanceof Error ? error.message : String(error)}`);
    }));
  }
  return profileChecks.get(key)!;
};

export const createSpecAudioCacheKey = (value: {
  voiceProfileId: string;
  speechText: string;
  pronunciations: RenderSpec["pronunciations"];
}) => {
  const profile = getProfile(value.voiceProfileId);
  return createTtsCacheKey({
    provider: profile.provider,
    speakerUuid: profile.speakerUuid,
    styleId: profile.styleId,
    speakingRate: profile.speakingRate,
    pitchScale: profile.pitchScale,
    intonationScale: profile.intonationScale,
    volumeScale: profile.volumeScale,
    speechText: value.speechText,
    pronunciations: value.pronunciations,
    audioStandard: SPEC_AUDIO_STANDARD,
  });
};

export const createSpecAudioFileName = (value: {
  episodeId: string;
  sceneId: string;
  chunkId: string;
  voiceProfileId: string;
  speechText: string;
  pronunciations: RenderSpec["pronunciations"];
}) => {
  for (const [field, item] of Object.entries(value).filter(([key]) => !["speechText", "pronunciations"].includes(key))) {
    if (typeof item === "string" && !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(item)) throw new Error(`unsafe ${field}: ${item}`);
  }
  const identityHash = createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);
  return `${value.episodeId}__${value.sceneId}__${value.chunkId}__${value.voiceProfileId}__${identityHash}.wav`;
};

const standardize = async (input: string, output: string) => {
  await execFileAsync("ffmpeg", ["-y", "-v", "error", "-i", input, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", output], {windowsHide: true});
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const rateLimitDelayMs = (error: unknown) => {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as {status?: unknown}).status)
      : null;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("GEMINI_ALL_PROJECTS_DAILY_EXHAUSTED")) return null;
  if (status !== 429 && !message.includes("429")) return null;
  const match = message.match(/retry in ([0-9.]+)s/i);
  const requested = match ? Math.ceil(Number(match[1]) * 1000) : 20_000;
  return Math.min(75_000, Math.max(15_000, requested + 15_000));
};

const synthesizeWithRateLimitRetry = async (
  provider: VoicevoxProvider | GeminiTtsProvider,
  request: Parameters<VoicevoxProvider["synthesize"]>[0],
  voice: SelectedVoice,
) => {
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      return await provider.synthesize(request, voice);
    } catch (error) {
      const delayMs = rateLimitDelayMs(error);
      if (delayMs === null || attempt === 8) throw error;
      console.warn(
        `Gemini TTS rate limit: ${Math.ceil(delayMs / 1000)}秒後に再試行 (${attempt}/8)`,
      );
      await wait(delayMs);
    }
  }
  throw new Error("unreachable TTS retry state");
};

const assertStandard = async (file: string) => {
  const probe = await probeAudio(file);
  if (probe.sampleRate !== SPEC_AUDIO_STANDARD.sampleRate || probe.channels !== SPEC_AUDIO_STANDARD.channels || probe.codec !== SPEC_AUDIO_STANDARD.codec || probe.bitsPerSample !== SPEC_AUDIO_STANDARD.bitsPerSample) {
    throw new Error(`audio standard mismatch: ${file}; expected 48kHz mono pcm_s16le 16-bit, got ${JSON.stringify(probe)}`);
  }
  await execFileAsync("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], {windowsHide: true});
  return probe;
};

export const synthesizeSpecChunk = async (value: {
  episodeId: string;
  sceneId: string;
  chunkId: string;
  speechText: string;
  voiceProfileId: string;
  pronunciations: RenderSpec["pronunciations"];
}) => {
  const profile = getProfile(value.voiceProfileId);
  const voice = await assertSpecVoiceProfile(value.voiceProfileId);
  const key = createSpecAudioCacheKey(value);
  const cacheDir = path.join(PROJECT_DIR, ".cache", "spec-tts", key);
  const cachePath = path.join(cacheDir, "audio.wav");
  const metadataPath = path.join(cacheDir, "metadata.json");
  const publicDir = path.join(PROJECT_DIR, "public", "spec-audio", value.episodeId);
  const fileName = createSpecAudioFileName(value);
  const output = path.join(publicDir, fileName);
  await mkdir(cacheDir, {recursive: true});
  await mkdir(publicDir, {recursive: true});

  let cacheHit = false;
  try {
    const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {cacheKey?: string; speakerUuid?: string; styleId?: number};
    await stat(cachePath);
    await assertStandard(cachePath);
    cacheHit = metadata.cacheKey === key && metadata.speakerUuid === profile.speakerUuid && metadata.styleId === profile.styleId;
  } catch {
    cacheHit = false;
  }

  if (!cacheHit) {
    const rawPath = path.join(cacheDir, "provider-output.wav");
    const provider = profile.provider === "voicevox"
      ? new VoicevoxProvider()
      : new GeminiTtsProvider(profile.model, profile.voice);
    await synthesizeWithRateLimitRetry(
      provider,
      {
        displayText: value.speechText,
        speechText: value.speechText,
        voiceProfile: value.voiceProfileId,
        speakingRate: profile.speakingRate,
        pitchScale: profile.pitchScale,
        intonationScale: profile.intonationScale,
        volumeScale: profile.volumeScale,
        outputFormat: "wav",
        requestAlignment: false,
        outputPath: rawPath,
      },
      voice,
    );
    await standardize(rawPath, cachePath);
    const probe = await assertStandard(cachePath);
    await writeFile(metadataPath, `${JSON.stringify({cacheKey: key, provider: profile.provider, speakerUuid: profile.speakerUuid, styleId: profile.styleId, voiceProfileId: value.voiceProfileId, speechTextSha256: createHash("sha256").update(value.speechText).digest("hex"), pronunciationsSha256: createHash("sha256").update(JSON.stringify(value.pronunciations)).digest("hex"), audioStandard: SPEC_AUDIO_STANDARD, probe}, null, 2)}\n`, "utf8");
  }
  await copyFile(cachePath, output);
  const probe = await assertStandard(output);
  if ((await readFile(output)).subarray(0, 4).toString("ascii") !== "RIFF") throw new Error(`invalid WAV: ${output}`);
  return {
    audioSrc: path.relative(path.join(PROJECT_DIR, "public"), output).split(path.sep).join("/"),
    audioPath: output,
    durationMs: probe.durationMs,
    cacheKey: key,
    cacheHit,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    codec: probe.codec,
  };
};

const BLOCK_SYNTHESIS_VERSION = "gemini-two-block-v1";
export const SPEC_TTS_BLOCKS = [
  {id: "scenes-01-04", firstScene: 1, lastScene: 4, fileName: "tts_scenes_01_04.wav"},
  {id: "scenes-05-09", firstScene: 5, lastScene: 9, fileName: "tts_scenes_05_09.wav"},
] as const;

type BlockUnit = {
  episodeId: string;
  sceneId: string;
  chunkId: string;
  speechText: string;
  voiceProfileId: string;
  pronunciations: RenderSpec["pronunciations"];
};

type Silence = {startMs: number; endMs: number; midpointMs: number};

const detectSilences = async (audioPath: string): Promise<Silence[]> => {
  const {stderr} = await execFileAsync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", audioPath, "-af", "silencedetect=noise=-35dB:d=0.18", "-f", "null", "-"],
    {windowsHide: true, maxBuffer: 16 * 1024 * 1024},
  );
  const starts: number[] = [];
  const silences: Silence[] = [];
  for (const line of stderr.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) starts.push(Number(start[1]) * 1000);
    const end = line.match(/silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/);
    if (!end) continue;
    const endMs = Number(end[1]) * 1000;
    const durationMs = Number(end[2]) * 1000;
    const startMs = starts.shift() ?? endMs - durationMs;
    silences.push({startMs, endMs, midpointMs: (startMs + endMs) / 2});
  }
  return silences.filter((item) => item.startMs > 100 && item.endMs > item.startMs);
};

const chooseCueSilences = (units: BlockUnit[], silences: Silence[], durationMs: number) => {
  if (units.length <= 1) return [];
  if (silences.length < units.length - 1) {
    throw new Error(`measured cue detection failed: need ${units.length - 1} paragraph silences, found ${silences.length}`);
  }
  const weights = units.map((unit) => Math.max(1, Array.from(unit.speechText).length));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let cumulative = 0;
  let previousIndex = -1;
  return weights.slice(0, -1).map((weight, boundaryIndex) => {
    cumulative += weight;
    const expected = (durationMs * cumulative) / totalWeight;
    const remaining = units.length - 2 - boundaryIndex;
    const maximumIndex = silences.length - remaining - 1;
    let selectedIndex = previousIndex + 1;
    for (let index = previousIndex + 1; index <= maximumIndex; index++) {
      if (Math.abs(silences[index].midpointMs - expected) < Math.abs(silences[selectedIndex].midpointMs - expected)) selectedIndex = index;
    }
    const selected = silences[selectedIndex];
    const averageUnitMs = durationMs / units.length;
    if (Math.abs(selected.midpointMs - expected) > Math.max(2500, averageUnitMs * 0.8)) {
      throw new Error(`measured cue detection is ambiguous near paragraph ${boundaryIndex + 1}; expected ${Math.round(expected)}ms, nearest silence ${Math.round(selected.midpointMs)}ms`);
    }
    previousIndex = selectedIndex;
    return selected;
  });
};

const cutMeasuredUnits = async (audioPath: string, units: BlockUnit[], outputDirectory: string) => {
  const probe = await assertStandard(audioPath);
  const silences = await detectSilences(audioPath);
  const cues = chooseCueSilences(units, silences, probe.durationMs);
  await mkdir(outputDirectory, {recursive: true});
  return Promise.all(units.map(async (unit, index) => {
    const startMs = index === 0 ? 0 : cues[index - 1].endMs;
    const endMs = index === units.length - 1 ? probe.durationMs : cues[index].startMs;
    if (endMs <= startMs) throw new Error(`invalid measured cue range for ${unit.chunkId}: ${startMs}..${endMs}`);
    const output = path.join(outputDirectory, `${String(index + 1).padStart(3, "0")}-${unit.chunkId}.wav`);
    await execFileAsync("ffmpeg", ["-y", "-v", "error", "-i", audioPath, "-ss", (startMs / 1000).toFixed(3), "-to", (endMs / 1000).toFixed(3), "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", output], {windowsHide: true});
    const segmentProbe = await assertStandard(output);
    return {unit, output, durationMs: segmentProbe.durationMs, startMs, endMs};
  }));
};

const joinBlocks = async (first: string, second: string, output: string) => {
  await execFileAsync("ffmpeg", ["-y", "-v", "error", "-i", first, "-i", second, "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[out]", "-map", "[out]", "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", output], {windowsHide: true});
  await assertStandard(output);
};

/**
 * Production Gemini contract: exactly two provider calls (Scenes 1–4 and 5–9).
 * Each block is cached independently, then divided only at measured paragraph
 * silences. A failed block can be rerun without regenerating the successful one.
 */
export const createSpecBlockSynthesizer = (spec: RenderSpec): ChunkSynthesizer => {
  const allUnits: BlockUnit[] = spec.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => ({
    episodeId: spec.episode.id,
    sceneId: scene.sceneId,
    chunkId: chunk.chunkId,
    speechText: chunk.speechText,
    voiceProfileId: spec.voiceProfileId,
    pronunciations: spec.pronunciations,
  })));
  const byChunkId = new Map(allUnits.map((unit) => [unit.chunkId, unit]));
  const blockPromises = new Map<string, Promise<Map<string, SynthesizedChunk>>>();
  const publicDir = path.join(PROJECT_DIR, "public", "spec-audio", spec.episode.id);
  const statePath = path.join(publicDir, "tts-block-state.json");

  const unitsForBlock = (firstScene: number, lastScene: number) => allUnits.filter((unit) => {
    const sceneNumber = Number(unit.sceneId.match(/([0-9]+)$/)?.[1]);
    return sceneNumber >= firstScene && sceneNumber <= lastScene;
  });

  const updateState = async (blockId: string, patch: Record<string, unknown>) => {
    let state: {version: string; episodeId: string; blocks: Record<string, Record<string, unknown>>};
    try {
      state = JSON.parse(await readFile(statePath, "utf8"));
    } catch {
      state = {version: BLOCK_SYNTHESIS_VERSION, episodeId: spec.episode.id, blocks: {}};
    }
    state.blocks[blockId] = {...state.blocks[blockId], ...patch};
    await mkdir(publicDir, {recursive: true});
    await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  };

  const ensureBlock = (block: typeof SPEC_TTS_BLOCKS[number]) => {
    if (blockPromises.has(block.id)) return blockPromises.get(block.id)!;
    const promise = (async () => {
      const units = unitsForBlock(block.firstScene, block.lastScene);
      if (units.length === 0) throw new Error(`${block.id}: no narration chunks`);
      const profile = getProfile(spec.voiceProfileId);
      if (profile.provider !== "gemini") {
        throw new Error(`two-block production synthesis requires Gemini; got ${profile.provider}`);
      }
      const voice = await assertSpecVoiceProfile(spec.voiceProfileId);
      const speechText = units.map((unit) => unit.speechText).join("\n\n");
      const key = createHash("sha256").update(JSON.stringify({
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
      })).digest("hex");
      const cacheDir = path.join(PROJECT_DIR, ".cache", "spec-tts-blocks", key);
      const cachePath = path.join(cacheDir, "audio.wav");
      const metadataPath = path.join(cacheDir, "metadata.json");
      const segmentDir = path.join(cacheDir, "measured-segments");
      await mkdir(cacheDir, {recursive: true});
      await mkdir(publicDir, {recursive: true});
      let cacheHit = false;
      try {
        const metadata = JSON.parse(await readFile(metadataPath, "utf8")) as {cacheKey?: string; synthesisVersion?: string};
        await assertStandard(cachePath);
        cacheHit = metadata.cacheKey === key && metadata.synthesisVersion === BLOCK_SYNTHESIS_VERSION;
      } catch {
        cacheHit = false;
      }
      try {
        await updateState(block.id, {status: "running", cacheKey: key, fileName: block.fileName});
        if (!cacheHit) {
          const rawPath = path.join(cacheDir, "provider-output.wav");
          const provider = new GeminiTtsProvider(profile.model, profile.voice);
          await synthesizeWithRateLimitRetry(provider, {
            displayText: speechText,
            speechText,
            voiceProfile: spec.voiceProfileId,
            speakingRate: profile.speakingRate,
            pitchScale: profile.pitchScale,
            intonationScale: profile.intonationScale,
            volumeScale: profile.volumeScale,
            styleInstruction: "Each paragraph is one editing cue. Read paragraphs in order and insert a clear silent pause of about 0.45 seconds between paragraphs. Do not speak paragraph numbers or separators.",
            outputFormat: "wav",
            requestAlignment: false,
            outputPath: rawPath,
          }, voice);
          await standardize(rawPath, cachePath);
          const blockProbe = await assertStandard(cachePath);
          await writeFile(metadataPath, `${JSON.stringify({cacheKey: key, synthesisVersion: BLOCK_SYNTHESIS_VERSION, provider: profile.provider, model: profile.model, voice: profile.voice, voiceProfileId: spec.voiceProfileId, speechTextSha256: createHash("sha256").update(speechText).digest("hex"), pronunciationsSha256: createHash("sha256").update(JSON.stringify(spec.pronunciations)).digest("hex"), audioStandard: SPEC_AUDIO_STANDARD, probe: blockProbe}, null, 2)}\n`, "utf8");
        }
        const publicBlock = path.join(publicDir, block.fileName);
        await copyFile(cachePath, publicBlock);
        const segments = await cutMeasuredUnits(cachePath, units, segmentDir);
        const results = new Map<string, SynthesizedChunk>();
        for (const segment of segments) {
          const fileName = createSpecAudioFileName(segment.unit);
          const output = path.join(publicDir, fileName);
          await copyFile(segment.output, output);
          results.set(segment.unit.chunkId, {
            audioSrc: path.relative(path.join(PROJECT_DIR, "public"), output).split(path.sep).join("/"),
            audioPath: output,
            durationMs: segment.durationMs,
            cacheKey: key,
            cacheHit,
            sampleRate: SPEC_AUDIO_STANDARD.sampleRate,
            channels: SPEC_AUDIO_STANDARD.channels,
            codec: SPEC_AUDIO_STANDARD.codec,
          });
        }
        await updateState(block.id, {status: "complete", cacheKey: key, cacheHit, fileName: block.fileName, measuredCueCount: segments.length - 1, chunkCount: segments.length});
        const first = path.join(publicDir, SPEC_TTS_BLOCKS[0].fileName);
        const second = path.join(publicDir, SPEC_TTS_BLOCKS[1].fileName);
        try {
          await stat(first);
          await stat(second);
          await joinBlocks(first, second, path.join(publicDir, "tts_narration.wav"));
        } catch {
          // The joined file is created after both independently recoverable blocks exist.
        }
        return results;
      } catch (error) {
        await updateState(block.id, {status: "failed", error: error instanceof Error ? error.message : String(error)});
        throw error;
      }
    })();
    blockPromises.set(block.id, promise);
    return promise;
  };

  return async (request) => {
    const unit = byChunkId.get(request.chunkId);
    if (!unit || unit.sceneId !== request.sceneId || unit.speechText !== request.speechText) throw new Error(`unknown or altered narration chunk: ${request.chunkId}`);
    const sceneNumber = Number(request.sceneId.match(/([0-9]+)$/)?.[1]);
    const block = SPEC_TTS_BLOCKS.find((item) => sceneNumber >= item.firstScene && sceneNumber <= item.lastScene);
    if (!block) throw new Error(`scene is outside the two-block contract: ${request.sceneId}`);
    const results = await ensureBlock(block);
    const result = results.get(request.chunkId);
    if (!result) throw new Error(`measured block segment missing: ${request.chunkId}`);
    return result;
  };
};
