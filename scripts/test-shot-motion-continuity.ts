import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {
  MIN_SHOT_FINAL_HOLD_MS,
  SHOT_INTRO_DURATION_MS,
  getShotFinalHoldMs,
  getShotIntroDurationInFrames,
  getShotIntroDurationMs,
  getShotIntroFrame,
  getShotIntroLinearProgress,
  type ShotMotionTiming,
} from "../src/spec/shot-motion-contract";

const root = process.cwd();
const [recipesSource, motionHelperSource] = await Promise.all([
  readFile(path.join(root, "src/components/spec/shots/ShotRecipes.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/shots/useShotMotion.ts"), "utf8"),
]);

assert.doesNotMatch(
  recipesSource,
  /Math\.round\(\s*shot\.progress\s*\*\s*\d+/u,
  "Shot Recipe motion must not quantize normalized Shot progress into a fixed number of steps",
);
assert.doesNotMatch(
  recipesSource,
  /durationInFrames:\s*24/u,
  "Shot Recipe motion must not use a fixed 24-frame clock",
);
assert.match(
  motionHelperSource,
  /getShotIntroFrame\(shot, fps\)/u,
  "Shot Recipe motion must use the fps-aware elapsed-time clock",
);
assert.match(
  motionHelperSource,
  /getShotIntroDurationInFrames\(shot, fps\)/u,
  "Shot intro duration must be derived from Shot duration and fps",
);

const shotAt = (elapsedMs: number, durationMs = 5_000): ShotMotionTiming => ({
  startMs: 0,
  endMs: durationMs,
  progress: Math.max(0, Math.min(1, elapsedMs / durationMs)),
});

const sampleActiveFrames = (fps: number) => {
  const referenceShot = shotAt(0);
  const durationFrames = getShotIntroDurationInFrames(referenceShot, fps);
  return Array.from({length: durationFrames + 1}, (_, frame) =>
    getShotIntroFrame(shotAt((frame / fps) * 1000), fps),
  );
};

for (const fps of [30, 60]) {
  const frames = sampleActiveFrames(fps);
  assert.equal(
    new Set(frames.map((value) => value.toFixed(8))).size,
    frames.length,
    `${fps}fps intro motion must update on every rendered frame`,
  );
  for (let index = 1; index < frames.length; index += 1) {
    const delta = frames[index] - frames[index - 1];
    assert.ok(delta > 0.999999 && delta < 1.000001, `${fps}fps clock skipped or repeated frame ${index}`);
  }
  const durationSeconds = frames.at(-1)! / fps;
  assert.ok(
    Math.abs(durationSeconds - SHOT_INTRO_DURATION_MS / 1000) < 1e-9,
    `${fps}fps changed the intro duration in seconds`,
  );
  assert.equal(
    getShotIntroFrame(shotAt(3_000), fps),
    getShotIntroDurationInFrames(shotAt(3_000), fps),
    `${fps}fps intro motion must settle into a stable hold`,
  );
}

assert.equal(getShotIntroDurationInFrames(shotAt(0), 30), 24);
assert.equal(getShotIntroDurationInFrames(shotAt(0), 60), 48);
assert.equal(getShotIntroLinearProgress(shotAt(0)), 0);
assert.equal(getShotIntroLinearProgress(shotAt(SHOT_INTRO_DURATION_MS)), 1);
assert.equal(getShotIntroLinearProgress(shotAt(4_000)), 1);

const shortShot = shotAt(0, 900);
assert.equal(getShotIntroDurationMs(shortShot), 550);
assert.equal(getShotFinalHoldMs(shortShot), MIN_SHOT_FINAL_HOLD_MS);
for (const fps of [30, 60]) {
  const renderedIntroMs = (getShotIntroDurationInFrames(shortShot, fps) / fps) * 1000;
  assert.ok(
    shortShot.endMs - shortShot.startMs - renderedIntroMs >= MIN_SHOT_FINAL_HOLD_MS,
    `${fps}fps shortened the readable final hold below ${MIN_SHOT_FINAL_HOLD_MS}ms`,
  );
}

assert.throws(() => getShotIntroFrame(shotAt(0), 0), /fps must be a positive finite number/u);
assert.throws(
  () => getShotIntroDurationInFrames(shotAt(0), Number.NaN),
  /fps must be a positive finite number/u,
);

console.log(
  "PASS: Shot intro motion is elapsed-time based, updates every output frame, preserves duration across 30/60fps, and reserves a readable final hold",
);
