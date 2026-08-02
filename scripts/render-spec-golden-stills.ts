import {mkdir} from "node:fs/promises";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderStill} from "@remotion/renderer";
import fixtureJson from "../render-specs/fixtures/renderable-9scene/render_spec.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {renderSpecSchema, type Expression, type RenderSpecScene} from "../src/spec/render-spec";
import {PROJECT_DIR} from "./render-helpers";

const fixture = renderSpecSchema.parse(fixtureJson);
const assets = Object.fromEntries(Object.entries(productionAssetManifest.assets).map(([id, asset]) => [id, asset.path]));
const newsSource = structuredClone(fixture.scenes[3]);
const newsPlacement = {
  placementId: "scene-04-placement-main-media",
  assetId: "company_nvda",
  role: "main-media" as const,
  region: "main-stage" as const,
  fit: "contain" as const,
  opacity: 1,
  startChunkId: newsSource.narrationChunks[0].chunkId,
  endChunkId: newsSource.narrationChunks[0].chunkId,
};
const newsScene: RenderSpecScene = {
  ...newsSource,
  visualMode: "news-media",
  initialExpression: "通常",
  narrationChunks: newsSource.narrationChunks.map((chunk, index) => ({...chunk, expression: index === 0 ? "通常" : chunk.expression})),
  visualBeats: [
    {
      ...newsSource.visualBeats[0],
      beatId: "scene-04-beat-001",
      startChunkId: newsSource.narrationChunks[0].chunkId,
      endChunkId: newsSource.narrationChunks[0].chunkId,
      narrationStartCue: newsSource.narrationChunks[0].captionText,
      narrationEndCue: newsSource.narrationChunks[0].captionText,
      screenState: "News",
      visualMode: "news-media",
      objectIds: [],
      assetPlacementIds: [newsPlacement.placementId],
      assetState: "ready",
      returnScreenState: "Data",
    },
    {
      ...newsSource.visualBeats[0],
      beatId: "scene-04-beat-002",
      startChunkId: newsSource.narrationChunks[1].chunkId,
      endChunkId: newsSource.narrationChunks[1].chunkId,
      narrationStartCue: newsSource.narrationChunks[1].captionText,
      narrationEndCue: newsSource.narrationChunks[1].captionText,
      screenState: "Data",
      visualMode: "text-focus",
      objectIds: [],
      assetPlacementIds: [],
      assetState: "not-required",
      returnScreenState: null,
    },
  ],
  assetPlacements: [
    ...newsSource.assetPlacements,
    newsPlacement,
  ],
};
const scenes = [...fixture.scenes, newsScene];
const outputRoot = path.join(PROJECT_DIR, "renders", "tests", "expression-final-verification");
const visualModeDirectory = path.join(outputRoot, "visual-modes");
const expressionDirectory = path.join(outputRoot, "expressions");
await mkdir(visualModeDirectory, {recursive: true});
await mkdir(expressionDirectory, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(PROJECT_DIR, "src", "index.ts")});
for (const scene of scenes) {
  const inputProps = {scene, assets, timeMs: 0};
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find((item) => item.id === "NasdaqCafeSpecDebugStill");
  if (!composition) throw new Error("NasdaqCafeSpecDebugStill not found");
  const output = path.join(visualModeDirectory, `${scene.visualMode}.png`);
  await renderStill({composition, serveUrl, inputProps, output, imageFormat: "png"});
  console.log(`golden still: ${output}`);
}

const expressionFiles: Array<{expression: Expression; file: string}> = [
  {expression: "通常", file: "normal.png"},
  {expression: "分析", file: "analysis.png"},
  {expression: "ニヤリ", file: "smirk.png"},
  {expression: "軽い驚き", file: "slight-surprise.png"},
  {expression: "困惑", file: "confused.png"},
  {expression: "警戒", file: "alert.png"},
  {expression: "眠そう", file: "sleepy.png"},
];
for (const entry of expressionFiles) {
  const scene: RenderSpecScene = {
    ...structuredClone(fixture.scenes[0]),
    initialExpression: entry.expression,
    narrationChunks: fixture.scenes[0].narrationChunks.map((chunk, index) => ({
      ...chunk,
      expression: index === 0 ? entry.expression : chunk.expression,
    })),
  };
  const inputProps = {scene, assets, timeMs: 0};
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find((item) => item.id === "NasdaqCafeSpecDebugStill");
  if (!composition) throw new Error("NasdaqCafeSpecDebugStill not found");
  const output = path.join(expressionDirectory, entry.file);
  await renderStill({composition, serveUrl, inputProps, output, imageFormat: "png"});
  console.log(`expression still: ${entry.expression} -> ${output}`);
}
