import {readFile, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import type {MotionPreset} from "../src/spec/motion-preset-contract";

const args = process.argv.slice(2);
const outputFlag = args.indexOf("--output-dir");
if (outputFlag < 0 || !args[outputFlag + 1]) {
  throw new Error("usage: migrate-visual-story-v2 --output-dir <dir> <render_spec.json> [...]");
}
const outputDir = path.resolve(args[outputFlag + 1]);
const inputPaths = args.filter((_, index) => index !== outputFlag && index !== outputFlag + 1);
if (inputPaths.length === 0) throw new Error("at least one render_spec.json is required");

const parseNumeric = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const precisionOf = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.(\d+))?/);
  return match?.[1]?.length ?? 0;
};

const finalHoldFor = (template: string) => {
  if (["opening-contradiction", "closing-recap", "expected-actual-gap-flow", "causal-lane"].includes(template)) return 900;
  if (["expected-actual-bullet", "tailwind-headwind", "verification-matrix"].includes(template)) return 750;
  return 500;
};

const showMotionFor = (
  template: string,
  targetId: string,
  scene: RenderSpec["scenes"][number],
): {preset: MotionPreset; durationMs: number; easing: "smooth-out" | "spring-settle"} => {
  if (scene.arrows.some((arrow) => arrow.arrowId === targetId)) {
    return {preset: "draw-line", durationMs: 720, easing: "smooth-out"};
  }
  if (scene.numbers.some((number) => number.numberId === targetId)) {
    if (["expected-actual-bullet", "index-return-bars", "diverging-stock-bars"].includes(template)) {
      return {preset: "count-up", durationMs: 760, easing: "spring-settle"};
    }
    return {preset: "count-up", durationMs: 680, easing: "spring-settle"};
  }
  if (scene.nodes.some((node) => node.nodeId === targetId)) {
    return {preset: "scale-settle", durationMs: 620, easing: "spring-settle"};
  }
  return {preset: "rise-soft", durationMs: 560, easing: "smooth-out"};
};

const outcomeFor = (
  beat: RenderSpec["scenes"][number]["visualBeats"][number],
  scene: RenderSpec["scenes"][number],
) => {
  if (beat.templateConfig.outcomeNodeId) return beat.templateConfig.outcomeNodeId;
  const gap = scene.cards.find((card) => card.role === "gap" && beat.objectIds.includes(card.cardId));
  if (gap) return gap.cardId;
  return beat.objectIds.at(-1) ?? null;
};

const migrate = (input: RenderSpec): RenderSpec => {
  const value = structuredClone(input);
  let nextEvent = Math.max(
    0,
    ...value.scenes.flatMap((scene) => scene.visualEvents.map((event) => Number(event.eventId.replace("event-", "")) || 0)),
  ) + 1;
  const eventId = () => `event-${String(nextEvent++).padStart(3, "0")}`;

  for (const scene of value.scenes) {
    for (const number of scene.numbers) {
      if (number.numericValue == null) number.numericValue = parseNumeric(number.value);
      if (number.precision == null) number.precision = precisionOf(number.value);
    }

    for (const event of scene.visualEvents) {
      if (event.action === "set-expression" || event.motionPreset != null) continue;
      if (event.action === "show") {
        const target = event.targetId;
        if (!target) continue;
        const beat = scene.visualBeats.find((candidate) => candidate.objectIds.includes(target));
        const motion = showMotionFor(beat?.visualTemplate ?? "text-focus", target, scene);
        event.motionPreset = motion.preset;
        event.durationMs = motion.durationMs;
        event.easingPreset = motion.easing;
      } else if (event.action === "hide") {
        event.motionPreset = "fade-out";
        event.durationMs = 360;
        event.easingPreset = "smooth-out";
      } else if (event.action === "highlight") {
        event.motionPreset = "focus-ring";
        event.durationMs = 420;
        event.easingPreset = "smooth-out";
      } else if (event.action === "unhighlight") {
        event.motionPreset = "fade-soft";
        event.durationMs = 300;
        event.easingPreset = "smooth-out";
      }
    }

    for (const beat of scene.visualBeats) {
      beat.finalHoldMs = beat.finalHoldMs ?? finalHoldFor(beat.visualTemplate);
      if (beat.objectIds.length === 0 || beat.screenState === "News" || beat.screenState === "PictureBook") {
        beat.sequencePolicy = "static";
        continue;
      }
      beat.sequencePolicy = "explicit";
      const existingShows = new Set(
        scene.visualEvents
          .filter((event) => event.action === "show" && event.targetId)
          .map((event) => event.targetId as string),
      );
      beat.objectIds.forEach((targetId, index) => {
        if (existingShows.has(targetId)) return;
        const motion = showMotionFor(beat.visualTemplate, targetId, scene);
        scene.visualEvents.push({
          eventId: eventId(),
          atChunkId: beat.startChunkId,
          timing: "chunk-start",
          action: "show",
          targetId,
          offsetMs: Math.min(7_500, index * 620),
          expression: null,
          motionPreset: motion.preset,
          durationMs: motion.durationMs,
          easingPreset: motion.easing,
        });
      });
      const outcomeId = outcomeFor(beat, scene);
      const hasHighlight = outcomeId && scene.visualEvents.some(
        (event) => event.action === "highlight" && event.targetId === outcomeId,
      );
      if (outcomeId && !hasHighlight) {
        scene.visualEvents.push({
          eventId: eventId(),
          atChunkId: beat.endChunkId,
          timing: "chunk-end",
          action: "highlight",
          targetId: outcomeId,
          offsetMs: 0,
          expression: null,
          motionPreset: "focus-ring",
          durationMs: 420,
          easingPreset: "smooth-out",
        });
      }
    }
    scene.visualEvents.sort((a, b) => {
      const chunkA = scene.narrationChunks.findIndex((chunk) => chunk.chunkId === a.atChunkId);
      const chunkB = scene.narrationChunks.findIndex((chunk) => chunk.chunkId === b.atChunkId);
      return chunkA - chunkB || a.offsetMs - b.offsetMs || a.eventId.localeCompare(b.eventId);
    });
  }
  return renderSpecSchema.parse(value);
};

await mkdir(outputDir, {recursive: true});
for (const inputPath of inputPaths) {
  const resolved = path.resolve(inputPath);
  const parsed = renderSpecSchema.parse(JSON.parse(await readFile(resolved, "utf8")));
  const migrated = migrate(parsed);
  const relative = path.relative(process.cwd(), resolved);
  const output = path.join(outputDir, relative);
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, `${JSON.stringify(migrated, null, 2)}\n`, "utf8");
  console.log(`migrated: ${relative} -> ${path.relative(process.cwd(), output)}`);
}
