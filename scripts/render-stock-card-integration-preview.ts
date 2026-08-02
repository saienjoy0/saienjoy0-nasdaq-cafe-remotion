import {mkdir} from "node:fs/promises";
import path from "node:path";
import fixtureSpecJson from "../render-specs/fixtures/minimal/render_spec.json";
import {productionAssetPaths} from "../src/config/production-assets";
import type {RenderSpecScene} from "../src/spec/render-spec";

const {bundle} = await import("@remotion/bundler");
const {renderStill, selectComposition} = await import("@remotion/renderer");

const root = process.cwd();
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const scene = structuredClone(fixtureSpecJson.scenes[0]) as RenderSpecScene;
scene.visualMode = "news-media";
scene.cards = [];
scene.assetPlacements = [
  ...scene.assetPlacements.filter(
    (placement) =>
      placement.role === "background" || placement.role === "fox-expression",
  ),
  {
    placementId: "stock-card-preview",
    assetId: "company_nvda",
    role: "main-media",
    region: "main-stage",
    fit: "contain",
    opacity: 1,
    startChunkId: null,
    endChunkId: null,
  },
];

const inputProps = {
  scene,
  assets: productionAssetPaths,
  timeMs: 0,
};
const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "index.ts"),
});
const composition = await selectComposition({
  serveUrl,
  id: "NasdaqCafeSpecDebugStill",
  inputProps,
  browserExecutable,
});
const output = path.join(
  root,
  "renders",
  "qa",
  "stock-card-spec-preview.png",
);
await mkdir(path.dirname(output), {recursive: true});
await renderStill({
  composition,
  serveUrl,
  inputProps,
  output,
  imageFormat: "png",
  browserExecutable,
});
console.log(`Stock-card spec preview: ${output}`);
