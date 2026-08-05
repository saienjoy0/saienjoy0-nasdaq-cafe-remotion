import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import type {PublicMainContent, PublicShot} from "../src/spec/public-view-model";
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
  getSharedSemanticTargetId,
  resolveSemanticShotTransition,
} from "../src/spec/shot-semantic-transition-contract";
import {
  SHOT_REFRAME_FADE_MS,
  SHOT_SHARED_REFRAME_MS,
  SHOT_SOFT_REVEAL_MS,
  getShotTransitionOpacities,
} from "../src/spec/shot-transition-contract";

const root = process.cwd();
const [recipesSource, motionHelperSource, transitionHostSource, sharedLayerSource, cameraSource] = await Promise.all([
  readFile(path.join(root, "src/components/spec/shots/ShotRecipes.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/shots/useShotMotion.ts"), "utf8"),
  readFile(path.join(root, "src/components/spec/ShotTransitionHost.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/SharedElementLayer.tsx"), "utf8"),
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
assert.match(transitionHostSource, /resolveSemanticShotTransition/u);
assert.match(transitionHostSource, /data-effective-transition/u);
assert.match(transitionHostSource, /transition\.sharedProgress/u);
assert.doesNotMatch(
  sharedLayerSource,
  /shot\.typographyText/u,
  "typography text alone must never become a flying shared element",
);
assert.match(sharedLayerSource, /getSharedSemanticTargetId/u);
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
assert.ok(causalProfile.buildMs >= 1_800 && causalProfile.buildMs <= 2_400);
assert.equal(getShotStaggerProgress(shotAt(0), 0, 2, causalProfile), 0);
assert.equal(getShotStaggerProgress(shotAt(1_000), 1, 2, causalProfile), 0);
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
  "the low-level carry-forward contract remains fade-free after semantic eligibility",
);
const reframeFadeEnd = getShotTransitionOpacities(SHOT_REFRAME_FADE_MS, true, "reframe-shared-element");
assert.equal(reframeFadeEnd.current, 1);
assert.ok(reframeFadeEnd.sharedProgress < 1, "shared element movement ended with the background fade");
assert.equal(
  getShotTransitionOpacities(SHOT_SHARED_REFRAME_MS, true, "reframe-shared-element").sharedProgress,
  1,
);

const semanticContent = {
  numbers: [{key: "shared-number"}],
  cards: [],
  nodes: [],
} as unknown as PublicMainContent;
const semanticShot = (overrides: Partial<PublicShot> = {}) => ({
  continuityKey: "scene-flow",
  transitionIn: "reframe-shared-element",
  primaryTargetId: null,
  outcomeTargetId: null,
  referenceTargetId: null,
  secondaryTargetIds: [],
  typographyText: "文字だけの見出し",
  ...overrides,
}) as unknown as PublicShot;
const typographyOnlyPrevious = semanticShot();
const typographyOnlyCurrent = semanticShot();
assert.equal(getSharedSemanticTargetId(semanticContent, typographyOnlyPrevious, typographyOnlyCurrent), null);
assert.equal(
  resolveSemanticShotTransition(semanticContent, typographyOnlyPrevious, typographyOnlyCurrent),
  "soft-reveal",
);
assert.equal(
  resolveSemanticShotTransition(
    semanticContent,
    semanticShot({transitionIn: "carry-forward"}),
    semanticShot({transitionIn: "carry-forward"}),
  ),
  "soft-reveal",
);
const sharedPrevious = semanticShot({primaryTargetId: "shared-number"});
const sharedCurrent = semanticShot({primaryTargetId: "shared-number"});
assert.equal(getSharedSemanticTargetId(semanticContent, sharedPrevious, sharedCurrent), "shared-number");
assert.equal(resolveSemanticShotTransition(semanticContent, sharedPrevious, sharedCurrent), "reframe-shared-element");

assert.throws(() => getShotIntroFrame(shotAt(0), 0), /fps must be a positive finite number/u);

console.log(
  "PASS: Shot motion uses narration-paced builds, rejects typography-only shared elements, downgrades ineligible carry/reframe transitions, settles camera motion, and preserves readable holds",
);
