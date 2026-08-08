import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {renderSpecSchema, type RenderProductionData} from "../src/spec/render-spec";
import {
  validateProductionShotTimingContract,
  validateShotStoryContract,
} from "../src/spec/validate-shot-story";

const source = JSON.parse(await readFile("render-specs/2026-07-31/render_spec.json", "utf8"));
const parsed = renderSpecSchema.parse(source);
validateShotStoryContract(parsed, {enforceVariety: true});

const shots = parsed.scenes.flatMap((scene) => scene.visualBeats.flatMap((beat) => beat.shots ?? []));
assert.ok(shots.length >= 24, `expected at least 24 Shots, got ${shots.length}`);
assert.ok(new Set(shots.map((shot) => shot.shotRecipe)).size >= 8, "Shot recipes should be varied");
assert.ok(shots.some((shot) => shot.cameraPreset === "macro-detail"), "Gap macro camera is required");
assert.ok(shots.some((shot) => shot.transitionIn === "reframe-shared-element"), "shared-element continuity is required");
assert.ok(shots.some((shot) => shot.foxExpression === "軽い驚き"), "existing fox surprise expression should be choreographed");
assert.ok(shots.some((shot) => shot.foxExpression === "警戒"), "existing fox warning expression should be choreographed");
assert.equal(shots.filter((shot) => shot.foxExpression === "眠そう").every((shot) => shot.shotId.startsWith("scene-09-")), true);

const badTarget = structuredClone(parsed);
const badBeat = badTarget.scenes[0].visualBeats.find((beat) => (beat.shots?.length ?? 0) > 0)!;
badBeat.shots![0].primaryTargetId = "missing-object";
assert.throws(() => validateShotStoryContract(badTarget), /unknown object ID/);

const badExpression = structuredClone(parsed);
const sceneOneShot = badExpression.scenes[0].visualBeats.find((beat) => (beat.shots?.length ?? 0) > 0)!.shots![0];
sceneOneShot.foxExpression = "眠そう";
assert.throws(() => validateShotStoryContract(badExpression), /reserved for Scene 9/);

const timingShot = (
  id: string,
  startProgress: number,
  endProgress: number,
  transitionOut = "cut",
) => ({
  shotId: id,
  startChunkId: "scene-01-chunk-001",
  startProgress,
  startOffsetMs: 0,
  endChunkId: "scene-01-chunk-001",
  endProgress,
  endOffsetMs: 0,
  transitionOut,
});

const timingData = (
  durationMs: number,
  timingShots: ReturnType<typeof timingShot>[],
  sceneNumber = 1,
) => ({
  scenes: [{
    sceneId: `scene-${String(sceneNumber).padStart(2, "0")}`,
    sceneNumber,
    durationMs,
    narrationChunks: [{
      chunkId: "scene-01-chunk-001",
      speechText: "measured narration timing",
      startMs: 0,
      endMs: durationMs,
    }],
    visualBeats: [{
      startMs: 0,
      endMs: durationMs,
      shots: timingShots,
    }],
  }],
}) as unknown as RenderProductionData;

const timingSummary = validateProductionShotTimingContract(timingData(9_000, [
  timingShot("scene-01-beat-001-shot-001", 0, 0.5),
  timingShot("scene-01-beat-001-shot-002", 0.5, 1),
]));
assert.equal(timingSummary.totalShots, 2);
assert.equal(timingSummary.maximumShotDurationMs, 4_500);

assert.throws(
  () => validateProductionShotTimingContract(timingData(11_000, [
    timingShot("scene-01-beat-001-shot-001", 0, 1),
  ])),
  /maximum is 10000ms/,
);
assert.throws(
  () => validateProductionShotTimingContract(timingData(8_000, [
    timingShot("scene-01-beat-001-shot-001", 0, 0.4),
    timingShot("scene-01-beat-001-shot-002", 0.6, 1),
  ])),
  /resolved Shot gap/,
);
assert.throws(
  () => validateProductionShotTimingContract(timingData(9_000, [
    timingShot("scene-01-beat-001-shot-001", 0, 1, "hold-outcome"),
  ])),
  /completed outcome hold/,
);
validateProductionShotTimingContract(timingData(9_000, [
  timingShot("scene-09-beat-001-shot-001", 0, 1, "hold-outcome"),
], 9));

const composition = await readFile("src/compositions/NasdaqCafeSpecEpisode.tsx", "utf8");
assert.match(composition, /getStageLayoutProfileForShell/, "Main Stage geometry must be selected by semantic Stage shell");
assert.match(composition, /data-stage-layout=\{layoutProfile\}/, "Main Stage must expose the semantic layout profile");
assert.match(composition, /getFoxFrameStyle\(layoutProfile, view\.fox\.opacity\)/, "fox placement must follow the semantic layout profile");
assert.match(composition, /data-subtitle-chrome="compact"/, "subtitle chrome must use the compact public layout");
assert.doesNotMatch(composition, /ShotStageRenderer[^\n]*subtitle/, "Shot camera must not wrap subtitles");

console.log(`Visual Story Engine v3 shot tests: pass (${shots.length} Shots)`);
