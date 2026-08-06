import assert from "node:assert/strict";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {DEFAULT_MOTION_DURATION_MS} from "../src/spec/motion-preset-contract";
import {SHOT_CROSSFADE_MS, SHARED_ELEMENT_MS} from "../src/spec/shot-contract";
import {createSpecAudioCacheKey} from "./spec-audio";

const expected = {
  "fade-soft": 240,
  "slide-soft-left": 400,
  "slide-soft-right": 400,
  "rise-soft": 380,
  "scale-settle": 420,
  "grow-from-baseline": 460,
  "grow-from-center": 460,
  "draw-line": 600,
  "count-up": 460,
  "focus-ring": 300,
  "scale-focus": 360,
  "dim-others": 300,
  "pulse-once": 360,
  "fade-out": 260,
  "slide-out-soft": 360,
  "collapse-to-outcome": 420,
} as const;

assert.deepEqual(DEFAULT_MOTION_DURATION_MS, expected);
console.log("PASS: motion presets use the Visual Grammar pacing contract");

assert.equal(SHOT_CROSSFADE_MS, 300);
assert.equal(SHARED_ELEMENT_MS, 420);
console.log("PASS: crossfade and shared-element durations remain fixed");

const fixture = structuredClone(fixtureJson);
const firstScene = fixture.scenes[0];
const firstChunk = firstScene.narrationChunks[0];
const before = createSpecAudioCacheKey({
  voiceProfileId: fixture.voiceProfileId,
  speechText: firstChunk.speechText,
  pronunciations: fixture.pronunciations,
});

firstScene.visualEvents[0].motionPreset = "fade-soft";
firstScene.visualEvents[0].durationMs = 240;
firstScene.visualEvents[0].easingPreset = "smooth-out";
firstScene.visualBeats[0].finalHoldMs = 600;
firstScene.transition = {type: "cut", durationMs: 0};

const after = createSpecAudioCacheKey({
  voiceProfileId: fixture.voiceProfileId,
  speechText: firstChunk.speechText,
  pronunciations: fixture.pronunciations,
});
assert.equal(after, before);
console.log("PASS: motion-only changes preserve TTS identity");

assert.equal(firstChunk.speechText, fixtureJson.scenes[0].narrationChunks[0].speechText);
assert.equal(firstChunk.captionText, fixtureJson.scenes[0].narrationChunks[0].captionText);
console.log("PASS: motion-only changes preserve narration and captions");

console.log("Visual Grammar motion language tests: 4 passed");
