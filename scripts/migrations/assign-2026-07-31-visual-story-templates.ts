import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../../src/spec/render-spec";

const input = path.resolve(process.cwd(), process.argv[2] ?? "render-specs/2026-07-31/render_spec.json");
const spec = renderSpecSchema.parse(JSON.parse(await readFile(input, "utf8")));

let nextEvent = Math.max(
  0,
  ...spec.scenes.flatMap((scene) => scene.visualEvents.map((event) => Number(event.eventId.replace("event-", "")) || 0)),
) + 1;
const eventId = () => `event-${String(nextEvent++).padStart(3, "0")}`;

const scene2 = spec.scenes[1];
const scene2Hero = scene2.visualBeats[0];
scene2Hero.visualTemplate = "hero-number";
scene2Hero.templateConfig.variant = "prebuilt-card";
scene2Hero.templateConfig.comparisonBasis = "主役企業と株価反応";
scene2Hero.objectIds = ["s2-number-amzn"];
scene2Hero.sequencePolicy = "explicit";
scene2Hero.finalHoldMs = 750;
if (!scene2.visualEvents.some((event) => event.action === "show" && event.targetId === "s2-number-amzn" && event.atChunkId === scene2Hero.startChunkId)) {
  scene2.visualEvents.push({
    eventId: eventId(),
    atChunkId: scene2Hero.startChunkId,
    timing: "chunk-start",
    action: "show",
    targetId: "s2-number-amzn",
    offsetMs: 350,
    expression: null,
    motionPreset: "count-up",
    durationMs: 760,
    easingPreset: "spring-settle",
  });
}

const scene6 = spec.scenes[5];
const scene6Comparison = scene6.visualBeats[1];
scene6Comparison.visualTemplate = "split-comparison";
scene6Comparison.templateConfig.variant = "two-lane";
scene6Comparison.templateConfig.comparisonBasis = "指数上昇と半導体への広がり";
scene6Comparison.templateConfig.laneLabels = ["指数", "半導体"];
scene6Comparison.finalHoldMs = 750;

const scene7 = spec.scenes[6];
const scene7Matrix = scene7.visualBeats[1];
scene7Matrix.visualTemplate = "focus-matrix";
scene7Matrix.templateConfig.variant = "default";
scene7Matrix.templateConfig.comparisonBasis = "大型テックと半導体の波及差";
scene7Matrix.finalHoldMs = 750;

const scene9 = spec.scenes[8];
const scene9Final = scene9.visualBeats[0];
scene9Final.visualTemplate = "final-assembly";
scene9Final.templateConfig.variant = "left-to-right";
scene9Final.templateConfig.comparisonBasis = "既出要素の再構成";
scene9Final.primaryElement = "投資額より回収";
scene9Final.finalHoldMs = 1_000;

for (const scene of spec.scenes) {
  const order = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));
  scene.visualEvents.sort((a, b) => {
    const chunk = (order.get(a.atChunkId) ?? 0) - (order.get(b.atChunkId) ?? 0);
    if (chunk !== 0) return chunk;
    const timing = (a.timing === "chunk-start" ? 0 : 1) - (b.timing === "chunk-start" ? 0 : 1);
    return timing || a.offsetMs - b.offsetMs || a.eventId.localeCompare(b.eventId);
  });
}

const result = renderSpecSchema.parse(spec);
await writeFile(input, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`updated: ${path.relative(process.cwd(), input)}`);
