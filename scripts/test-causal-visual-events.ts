import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {
  causalFocusProgress,
  causalTraceProgress,
  motionProgressAt,
} from "../src/components/spec/shots/CausalVisualEventOverlay";
import {collectCausalVisualEventIssues} from "../src/spec/causal-visual-event-contract";
import type {
  PublicArrow,
  PublicMotionInstruction,
  PublicNode,
} from "../src/spec/public-view-model";

const root = process.cwd();
const [stageSource, overlaySource, validatorSource] = await Promise.all([
  readFile(path.join(root, "src/components/spec/ShotStageRenderer.tsx"), "utf8"),
  readFile(path.join(root, "src/components/spec/shots/CausalVisualEventOverlay.tsx"), "utf8"),
  readFile(path.join(root, "src/spec/validate-visual-story.ts"), "utf8"),
]);

assert.match(stageSource, /<CausalVisualEventOverlay content=\{content\}\/>/u);
assert.match(overlaySource, /data-causal-visual-event-overlay/u);
assert.match(overlaySource, /preset === "draw-line"/u);
assert.match(overlaySource, /highlightedAtMs/u);
assert.match(validatorSource, /collectCausalVisualEventIssues/u);

assert.equal(motionProgressAt(0, null, 0, 200), 0);
assert.equal(motionProgressAt(200, null, 0, 200), 1);
assert.equal(motionProgressAt(400, null, 0, 200), 1);

const smoothInstruction: PublicMotionInstruction = {
  preset: "focus-ring",
  durationMs: 200,
  easing: "smooth-out",
  startedAtMs: 100,
};
assert.equal(motionProgressAt(100, smoothInstruction, 0, 1), 0);
assert.ok(motionProgressAt(200, smoothInstruction, 0, 1) > 0.5);
assert.equal(motionProgressAt(300, smoothInstruction, 0, 1), 1);

const node = {
  key: "node-a",
  label: "A",
  highlighted: true,
  highlightedAtMs: 100,
  revealAtMs: 0,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: smoothInstruction,
  unhighlightMotion: null,
} as PublicNode;
assert.equal(causalFocusProgress(100, node), 0);
assert.equal(causalFocusProgress(300, node), 1);

const arrowInstruction: PublicMotionInstruction = {
  preset: "draw-line",
  durationMs: 480,
  easing: "linear",
  startedAtMs: 100,
};
const arrow = {
  key: "arrow-a-b",
  fromKey: "node-a",
  toKey: "node-b",
  label: "",
  highlighted: false,
  highlightedAtMs: null,
  revealAtMs: 100,
  enterMotion: arrowInstruction,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
} as PublicArrow;
assert.equal(causalTraceProgress(100, arrow), 0);
assert.equal(causalTraceProgress(580, arrow), 1);

const objectType = new Map([
  ["node-a", "node"],
  ["node-b", "node"],
  ["arrow-a-b", "arrow"],
] as const);

assert.deepEqual(
  collectCausalVisualEventIssues([
    {eventIndex: 0, action: "highlight", targetId: "node-a", motionPreset: "focus-ring"},
    {eventIndex: 1, action: "unhighlight", targetId: "node-a", motionPreset: "scale-settle"},
    {eventIndex: 2, action: "highlight", targetId: "node-b", motionPreset: "focus-ring"},
    {eventIndex: 3, action: "unhighlight", targetId: "node-b", motionPreset: "scale-settle"},
    {eventIndex: 4, action: "show", targetId: "arrow-a-b", motionPreset: "draw-line"},
  ], objectType),
  [],
);

assert.match(
  collectCausalVisualEventIssues([
    {eventIndex: 0, action: "highlight", targetId: "node-a", motionPreset: "focus-ring"},
    {eventIndex: 1, action: "highlight", targetId: "node-b", motionPreset: "focus-ring"},
  ], objectType)[0]?.message ?? "",
  /only one node/u,
);
assert.match(
  collectCausalVisualEventIssues([
    {eventIndex: 0, action: "show", targetId: "node-a", motionPreset: "draw-line"},
  ], objectType)[0]?.message ?? "",
  /causal arrow/u,
);
assert.match(
  collectCausalVisualEventIssues([
    {eventIndex: 0, action: "highlight", targetId: "node-a", motionPreset: "focus-ring"},
  ], objectType).at(-1)?.message ?? "",
  /settle/u,
);

console.log("PASS: causal-build reuses explicit visualEvents for one-at-a-time focus and one-shot arrow traces while preserving the legacy Recipe underneath");
