import type {TtsProvider} from "./types";
import {GeminiTtsProvider} from "./providers/gemini-tts-provider";
import {VoicevoxProvider} from "./providers/voicevox-provider";

export const createTtsProvider = (): TtsProvider => {
  const provider = process.env.TTS_PROVIDER ?? "gemini";
  if (provider === "voicevox") {
    return new VoicevoxProvider();
  }
  if (provider === "gemini") {
    return new GeminiTtsProvider();
  }
  throw new Error(`未登録のTTS Providerです: ${provider}`);
};
