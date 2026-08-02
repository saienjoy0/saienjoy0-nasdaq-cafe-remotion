import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import path from "node:path";
import {resolveStrictExpressionAsset} from "../src/config/spec-expressions";
import {getSceneRenderState, getTransitionDurationInFrames, isPlacementActive} from "../src/spec/render-state";
import {loadProductionData} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {inspectSpecMedia} from "./spec-inspect";

const root = path.join(PROJECT_DIR, "build", "tests", "expression-final-verification", "2099-02-02");
const data = await loadProductionData(path.join(root, "render_data.production.json"));
const preview = path.join(PROJECT_DIR, "renders", "tests", "expression-final-verification", "preview", "2099-02-02_nasdaq-cafe-spec-preview.mp4");
const testFinal = path.join(PROJECT_DIR, "renders", "tests", "expression-final-verification", "final", "2099-02-02_nasdaq-cafe-spec.mp4");
const expectedDurationMs = Math.round((data.timeline.totalDurationInFrames * 1000) / data.episode.fps);
const inspection = await inspectSpecMedia(preview, {
  codec: "h264", fps: 30, width: 960, height: 540,
  sampleRate: 48000, channels: 2, durationMs: expectedDurationMs,
  toleranceMs: Math.ceil(2000 / data.episode.fps),
});
assert.equal(inspection.status, "valid");
assert.equal(inspection.fullDecode, true);
assert.equal(existsSync(testFinal), false, "preview workflow must not create test final");

const displayedExpressions = new Set<string>();
for (const [sceneIndex, scene] of data.scenes.entries()) {
  for (const chunk of scene.narrationChunks) {
    const sampleMs = chunk.startMs + Math.min(10, Math.max(0, chunk.audioDurationMs / 2));
    const state = getSceneRenderState(scene, sampleMs);
    displayedExpressions.add(state.expression);
    const resolved = resolveStrictExpressionAsset(state.expression);
    const active = scene.assetPlacements.filter((placement) =>
      placement.role === "fox-expression" &&
      placement.region === "fox-left" &&
      placement.assetId === resolved.assetId &&
      isPlacementActive(scene, placement, state),
    );
    assert.equal(active.length, 1, `${scene.sceneId}/${chunk.chunkId} must resolve one fox-left expression asset`);
    assert.equal(state.captionText, chunk.caption.text, `${scene.sceneId}/${chunk.chunkId} caption must match audio interval`);
    assert.equal(chunk.caption.startMs, chunk.startMs);
    assert.equal(chunk.caption.endMs, chunk.endMs);
    assert.equal(chunk.endMs - chunk.startMs, chunk.audioDurationMs);
    if (chunk.pauseAfterMs > 0) {
      assert.equal(getSceneRenderState(scene, chunk.endMs + Math.min(1, chunk.pauseAfterMs / 2)).captionText, null, `${scene.sceneId}/${chunk.chunkId} pause must hide future captions`);
    }
  }
  const sceneObjectIds = new Set([
    ...scene.cards.map((item) => item.cardId),
    ...scene.numbers.map((item) => item.numberId),
    ...scene.nodes.map((item) => item.nodeId),
    ...scene.arrows.map((item) => item.arrowId),
    ...scene.assetPlacements.map((item) => item.placementId),
  ]);
  const initialState = getSceneRenderState(scene, 0);
  assert([...initialState.visible].every((id) => sceneObjectIds.has(id)), `${scene.sceneId} visible state must be Scene-local`);
  assert([...initialState.highlighted].every((id) => sceneObjectIds.has(id)), `${scene.sceneId} highlight state must be Scene-local`);
  if (sceneIndex < data.scenes.length - 1) {
    const frames = getTransitionDurationInFrames(scene, data.episode.fps);
    assert.equal(frames, scene.transition.type === "fade" ? 9 : 0);
  }
}
assert.deepEqual([...displayedExpressions].sort(), ["通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう"].sort());
console.log("PASS: rendered preview displays all seven registered expressions with one fox-left placement each");
console.log("PASS: set-expression, pause captions, Scene-local state, transitions, audio/caption timing, full decode, and no-final contract");
console.log(JSON.stringify(inspection));
