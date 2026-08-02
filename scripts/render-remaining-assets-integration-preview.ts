import {mkdir} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import fixtureSpecJson from "../render-specs/fixtures/minimal/render_spec.json";
import {productionAssetPaths} from "../src/config/production-assets";
import {defaultEpisodeV1} from "../src/data/default-episode-v1";
import type {EpisodeV1} from "../src/schemas/episode-v1";
import type {RenderSpecScene} from "../src/spec/render-spec";

try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({
    loopback: [
      {
        address: "127.0.0.1",
        netmask: "255.0.0.0",
        family: "IPv4",
        mac: "00:00:00:00:00:00",
        internal: true,
        cidr: "127.0.0.1/8",
      },
    ],
  });
}

const {bundle} = await import("@remotion/bundler");
const {renderStill, selectComposition} = await import("@remotion/renderer");
const root = process.cwd();
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const outputDir = path.join(root, "renders", "qa");
await mkdir(outputDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(root, "src", "index.ts")});

const specScene = structuredClone(fixtureSpecJson.scenes[0]) as RenderSpecScene;
specScene.visualMode = "news-media";
specScene.cards = [];
specScene.assetPlacements = [
  {
    placementId: "remaining-background-preview",
    assetId: "background_scene_expected_gap",
    role: "background",
    region: "full-canvas",
    fit: "cover",
    opacity: 1,
    startChunkId: null,
    endChunkId: null,
  },
  ...specScene.assetPlacements.filter(
    (placement) => placement.role === "fox-expression",
  ),
  {
    placementId: "remaining-concept-preview",
    assetId: "concept_expected_actual_gap",
    role: "main-media",
    region: "main-stage",
    fit: "contain",
    opacity: 1,
    startChunkId: null,
    endChunkId: null,
  },
];
const specProps = {scene: specScene, assets: productionAssetPaths, timeMs: 0};
const specComposition = await selectComposition({
  serveUrl,
  id: "NasdaqCafeSpecDebugStill",
  inputProps: specProps,
  browserExecutable,
});
await renderStill({
  composition: specComposition,
  serveUrl,
  inputProps: specProps,
  output: path.join(outputDir, "remaining-assets-spec-preview.png"),
  imageFormat: "png",
  browserExecutable,
});

const episode = structuredClone(defaultEpisodeV1) as EpisodeV1;
episode.scenes[0].narration.displayText =
  "Christopher Waller（ウォラー）FRB理事の発言を確認します。";
episode.scenes[0].narration.speechText =
  episode.scenes[0].narration.displayText;
const v2Props = {episode};
const v2Composition = await selectComposition({
  serveUrl,
  id: "NasdaqCafeEpisodeV2",
  inputProps: v2Props,
  browserExecutable,
});
await renderStill({
  composition: v2Composition,
  serveUrl,
  inputProps: v2Props,
  frame: 20,
  output: path.join(outputDir, "remaining-assets-v2-preview.png"),
  imageFormat: "png",
  browserExecutable,
});

console.log(`Remaining-assets previews: ${outputDir}`);
