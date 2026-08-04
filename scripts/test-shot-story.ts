import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {renderSpecSchema} from "../src/spec/render-spec";
import {validateShotStoryContract} from "../src/spec/validate-shot-story";

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

const composition = await readFile("src/compositions/NasdaqCafeSpecEpisode.tsx", "utf8");
assert.match(composition, /left: 416, top: 144, width: 1440, height: 648/, "Main Stage geometry must stay fixed");
assert.match(composition, /left: 64, top: 176, width: 320, height: 720/, "fox geometry must stay fixed");
assert.match(composition, /left: 208, top: 812, width: 1664, height: 208/, "subtitle geometry must stay fixed");
assert.doesNotMatch(composition, /ShotStageRenderer[^\n]*subtitle/, "Shot camera must not wrap subtitles");

console.log(`Visual Story Engine v3 shot tests: pass (${shots.length} Shots)`);
