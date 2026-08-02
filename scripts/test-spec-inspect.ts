import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {PROJECT_DIR} from "./render-helpers";
import {inspectSpecMedia} from "./spec-inspect";

const execFileAsync = promisify(execFile);
const directory = path.join(PROJECT_DIR, "renders", "tests", "phase4-inspect-fixtures");
await mkdir(directory, {recursive: true});
const valid = path.join(directory, "valid.mp4");
await execFileAsync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=320x180:r=30:d=1", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", "1", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "1", valid], {windowsHide: true});
const expected = {codec: "h264", fps: 30, width: 320, height: 180, sampleRate: 48000, channels: 1, durationMs: 1000, toleranceMs: 100};
const tests: Array<{name: string; run: () => Promise<void>}> = [];
const test = (name: string, run: () => Promise<void>) => tests.push({name, run});
test("inspect valid media and full decode", async () => {const result = await inspectSpecMedia(valid, expected); assert.equal(result.status, "valid"); assert.equal(result.fullDecode, true);});
test("inspect not-generated", async () => {assert.equal((await inspectSpecMedia(path.join(directory, "missing.mp4"), expected)).status, "not-generated");});
test("inspect zero-byte", async () => {const file = path.join(directory, "zero.mp4"); await writeFile(file, ""); assert.equal((await inspectSpecMedia(file, expected)).status, "zero-byte");});
test("inspect invalid-codec", async () => {assert.equal((await inspectSpecMedia(valid, {...expected, codec: "vp9"})).status, "invalid-codec");});
test("inspect invalid-fps", async () => {assert.equal((await inspectSpecMedia(valid, {...expected, fps: 60})).status, "invalid-fps");});
test("inspect invalid-resolution", async () => {assert.equal((await inspectSpecMedia(valid, {...expected, width: 1920})).status, "invalid-resolution");});
test("inspect invalid-audio-format", async () => {assert.equal((await inspectSpecMedia(valid, {...expected, sampleRate: 44100})).status, "invalid-audio-format");});
test("inspect duration-mismatch", async () => {assert.equal((await inspectSpecMedia(valid, {...expected, durationMs: 5000})).status, "duration-mismatch");});
test("inspect decode-failed", async () => {const file = path.join(directory, "junk.mp4"); await writeFile(file, "not media"); assert.equal((await inspectSpecMedia(file, expected)).status, "decode-failed");});
for (const entry of tests) {await entry.run(); console.log(`PASS: ${entry.name}`);}
console.log(`spec inspect tests: ${tests.length} passed`);
