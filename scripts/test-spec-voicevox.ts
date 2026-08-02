import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {VoicevoxProvider} from "../src/tts/providers/voicevox-provider";
import {probeAudio} from "../src/tts/tts-service";
import {loadProductionData} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {assertSpecVoiceProfile, SPEC_AUDIO_STANDARD} from "./spec-audio";

const production = await loadProductionData(path.join(PROJECT_DIR, "build", "tests", "expression-final-verification", "2099-02-02", "render_data.production.json"));
const technicalReport = JSON.parse(await readFile(path.join(PROJECT_DIR, "build", "tests", "expression-final-verification", "2099-02-02", "technical_report.json"), "utf8")) as {chunks: Array<{audioPath: string; cacheHit: boolean}>};
const profile = {speakerUuid: "9f3ee141-26ad-437e-97bd-d22298d02ad2", styleId: 66, characterName: "もち子さん", styleName: "セクシー／あん子"};
const tests: Array<{name: string; run: () => Promise<void>}> = [];
const test = (name: string, run: () => Promise<void>) => tests.push({name, run});
test("VOICEVOX /speakers fixed profile succeeds", async () => {const result = await assertSpecVoiceProfile("voicevox-mochiko-anko"); assert.deepEqual({speakerUuid: result.speakerUuid, styleId: result.styleId, characterName: result.characterName, styleName: result.styleName}, profile);});
test("VOICEVOX invalid speaker UUID is rejected", async () => {await assert.rejects(new VoicevoxProvider().assertFixedVoice({...profile, speakerUuid: "invalid"}), /speaker UUID not found/);});
test("VOICEVOX invalid style ID is rejected", async () => {await assert.rejects(new VoicevoxProvider().assertFixedVoice({...profile, styleId: 999999}), /does not belong/);});
test("VOICEVOX stopped endpoint fails without fallback", async () => {await assert.rejects(assertSpecVoiceProfile("voicevox-mochiko-anko", "http://127.0.0.1:59999"), /no provider\/speaker\/style fallback/);});
test("VOICEVOX all 9Scene chunks have unique audio paths", async () => {assert.equal(technicalReport.chunks.length, 21); assert.equal(new Set(technicalReport.chunks.map((chunk) => chunk.audioPath)).size, technicalReport.chunks.length);});
test("VOICEVOX all chunks are valid standardized WAV", async () => {for (const chunk of technicalReport.chunks) {assert.equal((await readFile(chunk.audioPath)).subarray(0, 4).toString("ascii"), "RIFF"); const probe = await probeAudio(chunk.audioPath); assert.equal(probe.sampleRate, SPEC_AUDIO_STANDARD.sampleRate); assert.equal(probe.channels, SPEC_AUDIO_STANDARD.channels); assert.equal(probe.codec, SPEC_AUDIO_STANDARD.codec); assert.equal(probe.bitsPerSample, SPEC_AUDIO_STANDARD.bitsPerSample);}});
test("VOICEVOX cached compile reports cache hits", async () => {assert(technicalReport.chunks.every((chunk) => chunk.cacheHit));});
test("VOICEVOX pause-inclusive Scene durations are measured", async () => {for (const scene of production.scenes) {const last = scene.narrationChunks.at(-1)!; assert.equal(scene.durationMs, last.endMs + last.pauseAfterMs);}});
for (const entry of tests) {await entry.run(); console.log(`PASS: ${entry.name}`);}
console.log(`spec VOICEVOX integration tests: ${tests.length} passed`);
