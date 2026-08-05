import assert from "node:assert/strict";
import {
  createGeminiNarrationPrompt,
  GeminiTtsProvider,
  pcm16ToWav,
} from "../src/tts/providers/gemini-tts-provider";

const pcm = Buffer.alloc(48_000, 1);
const wav = pcm16ToWav(pcm);
assert.equal(wav.subarray(0, 4).toString("ascii"), "RIFF");
assert.equal(wav.readUInt32LE(24), 24_000);
assert.equal(wav.readUInt16LE(22), 1);
assert.equal(wav.readUInt16LE(34), 16);
assert.equal(wav.length, pcm.length + 44);

const prompt = createGeminiNarrationPrompt("NASDAQは1%上昇しました。", 1.05);
assert.match(prompt, /Read only the transcript below/);
assert.match(prompt, /NASDAQは1%上昇しました。/);
assert.match(prompt, /ナスダック/);
assert.doesNotMatch(prompt, /GEMINI_API_KEY/);

const previousCacheOnly = process.env.SPEC_TTS_CACHE_ONLY;
const previousSingleKey = process.env.GEMINI_API_KEY;
const previousKeyList = process.env.GEMINI_API_KEYS;
const numberedKeys = Array.from({length: 10}, (_, index) => `GEMINI_API_KEY_${index + 1}`);
const previousNumberedKeys = new Map(
  numberedKeys.map((key) => [key, process.env[key]]),
);

process.env.SPEC_TTS_CACHE_ONLY = "1";
delete process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEYS;
for (const key of numberedKeys) delete process.env[key];

const provider = new GeminiTtsProvider();
const voice = await provider.selectVoice();
assert.equal(voice.speakerUuid, "gemini-3.1-flash-tts-preview:Charon");
await assert.rejects(
  provider.synthesize(
    {
      displayText: "テスト",
      speechText: "テスト",
      voiceProfile: "fox-calm-ja-v1",
      speakingRate: 1,
      pitchScale: 1,
      intonationScale: 1,
      volumeScale: 1,
      outputFormat: "wav",
      requestAlignment: false,
      outputPath: "/tmp/cache-only-must-not-generate.wav",
    },
    voice,
  ),
  /exact production TTS cache is missing; synthesis is forbidden/,
);

if (previousCacheOnly === undefined) delete process.env.SPEC_TTS_CACHE_ONLY;
else process.env.SPEC_TTS_CACHE_ONLY = previousCacheOnly;
if (previousSingleKey === undefined) delete process.env.GEMINI_API_KEY;
else process.env.GEMINI_API_KEY = previousSingleKey;
if (previousKeyList === undefined) delete process.env.GEMINI_API_KEYS;
else process.env.GEMINI_API_KEYS = previousKeyList;
for (const [key, value] of previousNumberedKeys) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

console.log("PASS: Gemini TTS PCM/WAV, narration prompt, and cache-only contract");
