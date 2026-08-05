import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {
  CAMERA_SETTLE_BEFORE_END_MS,
  MAX_SHOT_BUILD_MS,
  MAX_SHOT_ENTER_MS,
  SHOT_MOTION_PROFILES,
  getShotBuildLinearProgress,
  getShotCameraProgress,
  getShotFinalHoldMs,
  getShotIntroDurationInFrames,
  getShotIntroDurationMs,
  getShotIntroFrame,
  getShotIntroLinearProgress,
  getShotStaggerProgress,
  type ShotMotionTiming,
} from "../src/spec/shot-motion-contract";
import {
  SHOT_REFRAME_FADE_MS,
  SHOT_SHARED_REFRAME_MS,
  SHOT_SOFT_REVEAL_MS,
  getShotTransitionOpacities,
} from "../src/spec/shot-transition-contract";

const root = process.cwd();
const [recipesSource, motionHelperSource, transitionHostSource, cameraSource] = await Promise.all([
  readFile(path.join(root, "src/components/spec/shots/ShotRecipes.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/shots/useShotMotion.ts"), "utf8"),
  readFile(path.join(root, "src/components/spec/ShotTransitionHost.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/SafeCameraViewport.tsx"), "utf8"),
]);

assert.doesNotMatch(
  recipesSource,
  /Math\.round\(\s*shot\.progress\s*\*\s*\d+/u,
  "Shot Recipe motion must not quantize normalized Shot progress into fixed steps",
);
assert.doesNotMatch(
  recipesSource,
  /shot\.progress\s*\*/u,
  "Recipe reveal timing must not stretch across the complete Shot duration",
);
assert.match(recipesSource, /staggerProgress\(index, labels\.length\)/u);
assert.match(recipesSource, /staggerProgress\(index, items\.length\)/u);
assert.match(
  motionHelperSource,
  /introOpacity:\s*shotTransitionUsesLayerFade/u,
  "outer layer fades must suppress duplicate full-content opacity fades",
);
assert.match(transitionHostSource, /shot\.transitionIn/u);
assert.match(transitionHostSource, /transition\.sharedProgress/u);
assert.match(cameraSource, /getShotCameraProgress\(shot\)/u);

const shotAt = (elapsedMs: number, durationMs = 5_000): ShotMotionTiming => ({
  startMs: 0,
  endMs: durationMs,
  progress: Math.max(0, Math.min(1, elapsedMs / durationMs)),
});

for (const [recipe, profile] of Object.entries(SHOT_MOTION_PROFILES)) {
  assert.ok(profile.enterMs <= MAX_SHOT_ENTER_MS, `${recipe} enter exceeds ${MAX_SHOT_ENTER_MS}ms`);
  assert.ok(profile.buildMs <= MAX_SHOT_BUILD_MS, `${recipe} build exceeds ${MAX_SHOT_BUILD_MS}ms`);
  assert.ok(profile.holdMinMs >= 450, `${recipe} final hold is too short`);
  const settledShot = shotAt(profile.buildMs, 5_000);
  assert.equal(
    getShotBuildLinearProgress(settledShot, profile.buildMs, profile.holdMinMs),
    1,
    `${recipe} build must complete within its calibrated window`,
  );
  assert.ok(
    getShotFinalHoldMs(shotAt(0), Math.max(profile.enterMs, profile.buildMs), profile.holdMinMs) >= profile.holdMinMs,
    `${recipe} does not preserve its readable final hold`,
  );
}

for (const fps of [30, 60]) {
  const profile = SHOT_MOTION_PROFILES["hero-metric-impact"];
  const durationFrames = getShotIntroDurationInFrames(shotAt(0), fps, profile.enterMs, profile.holdMinMs);
  const frames = Array.from({length: durationFrames + 1}, (_, frame) =>
    getShotIntroFrame(shotAt((frame / fps) * 1000), fps, profile.enterMs, profile.holdMinMs),
  );
  assert.equal(
    new Set(frames.map((value) => value.toFixed(8))).size,
    frames.length,
    `${fps}fps intro motion must update on every rendered frame`,
  );
  const renderedMs = (durationFrames / fps) * 1000;
  assert.ok(
    Math.abs(renderedMs - profile.enterMs) <= 1000 / fps,
    `${fps}fps changed the human-visible enter duration`,
  );
  assert.equal(
    getShotIntroFrame(shotAt(3_000), fps, profile.enterMs, profile.holdMinMs),
    durationFrames,
    `${fps}fps intro must settle into a stable hold`,
  );
}

const causalProfile = SHOT_MOTION_PROFILES["causal-build"];
for (let index = 0; index < 4; index += 1) {
  assert.equal(
    getShotStaggerProgress(shotAt(causalProfile.buildMs), index, 4, causalProfile),
    1,
    `causal-build item ${index} did not finish within ${causalProfile.buildMs}ms`,
  );
}

const shortShot = shotAt(0, 900);
const shortProfile = SHOT_MOTION_PROFILES["contradiction-interrupt"];
assert.equal(
  getShotIntroDurationMs(shortShot, shortProfile.enterMs, shortProfile.holdMinMs),
  shortProfile.enterMs,
);
assert.ok(
  getShotFinalHoldMs(shortShot, shortProfile.enterMs, shortProfile.holdMinMs) >= shortProfile.holdMinMs,
);
assert.equal(getShotIntroLinearProgress(shotAt(shortProfile.enterMs), shortProfile.enterMs, shortProfile.holdMinMs), 1);

assert.equal(getShotCameraProgress(shotAt(5_000 - CAMERA_SETTLE_BEFORE_END_MS)), 1);
assert.equal(getShotCameraProgress(shotAt(5_000)), 1);

const softStart = getShotTransitionOpacities(0, true, "soft-reveal");
const softEnd = getShotTransitionOpacities(SHOT_SOFT_REVEAL_MS, true, "soft-reveal");
assert.deepEqual({previous: softStart.previous, current: softStart.current}, {previous: 1, current: 0});
assert.deepEqual({previous: softEnd.previous, current: softEnd.current}, {previous: 0, current: 1});
assert.deepEqual(
  getShotTransitionOpacities(0, true, "carry-forward"),
  {previous: 0, current: 1, progress: 1, sharedProgress: 1},
  "carry-forward must not fade the complete screen again",
);
const reframeFadeEnd = getShotTransitionOpacities(SHOT_REFRAME_FADE_MS, true, "reframe-shared-element");
assert.equal(reframeFadeEnd.current, 1);
assert.ok(reframeFadeEnd.sharedProgress < 1, "shared element movement ended with the background fade");
assert.equal(
  getShotTransitionOpacities(SHOT_SHARED_REFRAME_MS, true, "reframe-shared-element").sharedProgress,
  1,
);

assert.throws(() => getShotIntroFrame(shotAt(0), 0), /fps must be a positive finite number/u);

console.log(
  "PASS: Shot motion uses calibrated Recipe timing, completes builds within one second, avoids duplicate layer fades, settles camera motion, and preserves readable holds",
);
