import {createHash} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {GoogleGenAI} from "@google/genai";
import type {
  SelectedVoice,
  TtsCapabilities,
  TtsProvider,
  TtsRequest,
} from "../types";
import {
  collectGeminiApiKeys,
  GeminiApiKeyPool,
} from "./gemini-api-key-pool";

export const GEMINI_TTS_DEFAULT_MODEL = "gemini-3.1-flash-tts-preview";
export const GEMINI_TTS_DEFAULT_VOICE = "Charon";
let apiKeyPool: GeminiApiKeyPool | null = null;
const getApiKeyPool = () => {
  apiKeyPool ??= new GeminiApiKeyPool();
  return apiKeyPool;
};

const voiceStyleIds = new Map<string, number>();
const stableVoiceStyleId = (voice: string) => {
  const cached = voiceStyleIds.get(voice);
  if (cached !== undefined) return cached;
  const value = createHash("sha256").update(voice).digest().readUInt32BE(0);
  const id = 1_000_000 + (value % 1_000_000_000);
  voiceStyleIds.set(voice, id);
  return id;
};

export const pcm16ToWav = (
  pcm: Buffer,
  sampleRate = 24_000,
  channels = 1,
) => {
  if (pcm.length === 0 || pcm.length % 2 !== 0) {
    throw new Error(`Gemini TTS PCM byte length is invalid: ${pcm.length}`);
  }
  const header = Buffer.alloc(44);
  const blockAlign = channels * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

export const createGeminiNarrationPrompt = (
  transcript: string,
  speakingRate = 1.05,
  styleInstruction?: string,
) => `
### DIRECTOR'S NOTES

Language: Japanese
Speaker: A young overseas university student presenting a morning technology-market program.
Style: Calm, intelligent, approachable, and slightly sleepy. Speak like a friendly guide, not a formal television announcer. Keep emotion restrained. Make contradictions sound mildly interesting without exaggeration. Do not sound promotional or sensational.
Pacing: Moderately fast for a Japanese morning news video. Relative speed target: ${speakingRate.toFixed(2)}. Pause briefly after conclusions and before important contrasts. Read company names, index names, percentages, dates, and numbers clearly.
Pronunciation: NASDAQは「ナスダック」。SOXは「ソックス指数」。AIは「エーアイ」。企業名や英語略語を勝手に省略しない。
${styleInstruction ? `Additional direction: ${styleInstruction}` : ""}
Important: Read only the transcript below. Do not summarize, rewrite, translate, add introductions, or add closing remarks. Preserve all uncertainty expressions and qualifications.

### TRANSCRIPT

${transcript}
`.trim();

export class GeminiTtsProvider implements TtsProvider {
  public readonly name = "gemini";
  public readonly capabilities: TtsCapabilities = {
    styleInstructions: true,
    emotionControl: true,
    wordAlignment: false,
    phraseAlignment: false,
    voiceCloning: false,
    streaming: true,
    outputFormats: ["wav"],
  };

  public constructor(
    private readonly model = process.env.GEMINI_TTS_MODEL ?? GEMINI_TTS_DEFAULT_MODEL,
    private readonly voiceName = process.env.GEMINI_TTS_VOICE ?? GEMINI_TTS_DEFAULT_VOICE,
  ) {}

  public async selectVoice(): Promise<SelectedVoice> {
    if (
      collectGeminiApiKeys().length === 0 &&
      process.env.SPEC_TTS_CACHE_ONLY !== "1"
    ) {
      throw new Error(
        "Gemini APIキーが設定されていません。資格情報ファイルを確認してください。",
      );
    }
    return {
      characterName: "朝のNASDAQカフェの狐",
      styleName: `${this.voiceName} / Informative`,
      styleId: stableVoiceStyleId(this.voiceName),
      speakerUuid: `${this.model}:${this.voiceName}`,
      engineVersion: this.model,
    };
  }

  public async synthesize(request: TtsRequest, voice: SelectedVoice) {
    if (process.env.SPEC_TTS_CACHE_ONLY === "1") {
      throw new Error(
        "SPEC_TTS_CACHE_ONLY=1: exact production TTS cache is missing; synthesis is forbidden",
      );
    }
    const interaction = await getApiKeyPool().run(async (apiKey) => {
      const client = new GoogleGenAI({apiKey});
      return client.interactions.create({
        model: this.model,
        input: createGeminiNarrationPrompt(
          request.speechText,
          request.speakingRate,
          request.styleInstruction,
        ),
        response_format: {type: "audio"},
        generation_config: {
          speech_config: [{voice: this.voiceName, language: "ja"}],
        },
        store: false,
      });
    });
    const encoded = interaction.output_audio?.data;
    if (!encoded) throw new Error("Gemini APIから音声データが返されませんでした");
    const audio = Buffer.from(encoded, "base64");
    const output = audio.subarray(0, 4).toString("ascii") === "RIFF"
      ? audio
      : pcm16ToWav(
          audio,
          interaction.output_audio?.sample_rate ?? 24_000,
          interaction.output_audio?.channels ?? 1,
        );
    await mkdir(path.dirname(request.outputPath), {recursive: true});
    await writeFile(request.outputPath, output);
    return {providerVersion: voice.engineVersion};
  }
}
