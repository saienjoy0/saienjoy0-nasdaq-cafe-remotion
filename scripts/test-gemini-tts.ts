import assert from "node:assert/strict";
import {createGeminiNarrationPrompt, pcm16ToWav} from "../src/tts/providers/gemini-tts-provider";

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

console.log("PASS: Gemini TTS PCM/WAV and narration prompt contract");
