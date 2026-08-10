import {readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {addVisualStagnationWarnings} from "../src/spec/visual-stagnation";
import {measureVisualGrammarTiming} from "../src/spec/measure-visual-grammar";
import type {RenderProductionData, RenderSpec} from "../src/spec/render-spec";

const [specArg, productionArg, outputArg] = process.argv.slice(2);
if (!specArg || !productionArg || !outputArg) {
  throw new Error(
    "usage: tsx scripts/measure-visual-grammar-from-production.ts <render_spec.json> <render_data.production.json> <output.json>",
  );
}

const spec = JSON.parse(await readFile(resolve(specArg), "utf8")) as RenderSpec;
const production = JSON.parse(
  await readFile(resolve(productionArg), "utf8"),
) as RenderProductionData;

if (spec.episode.id !== production.episode.id) {
  throw new Error(
    `episode id mismatch: ${spec.episode.id} != ${production.episode.id}`,
  );
}
if (spec.episode.targetDate !== production.episode.targetDate) {
  throw new Error("episode targetDate mismatch");
}

const specChunks = spec.scenes.flatMap((scene) =>
  scene.narrationChunks.map((chunk) => ({
    sceneId: scene.sceneId,
    chunkId: chunk.chunkId,
    speechText: chunk.speechText,
    captionText: chunk.captionText,
    pauseAfterMs: chunk.pauseAfterMs,
  })),
);
const productionChunks = production.scenes.flatMap((scene) =>
  scene.narrationChunks.map((chunk) => ({
    sceneId: scene.sceneId,
    chunkId: chunk.chunkId,
    speechText: chunk.speechText,
    captionText: chunk.caption.text,
    pauseAfterMs: chunk.pauseAfterMs,
  })),
);
if (JSON.stringify(specChunks) !== JSON.stringify(productionChunks)) {
  throw new Error(
    "production timing cannot be reused because narration/captions/pause contract changed",
  );
}

const measured = measureVisualGrammarTiming(spec, production);
if (!measured) {
  throw new Error("visual grammar timing measurement was not produced");
}
const report = addVisualStagnationWarnings(spec, measured);
await writeFile(resolve(outputArg), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      status: report.status,
      unresolvedStateCount: report.unresolvedStateCount,
      failureCodes: report.failures.map((failure) => failure.code),
      timingBasis: report.timingBasis,
      visualStagnation: report.visualStagnation,
    },
    null,
    2,
  ),
);
if (report.status !== "PASS" || report.unresolvedStateCount !== 0) {
  process.exitCode = 2;
}
