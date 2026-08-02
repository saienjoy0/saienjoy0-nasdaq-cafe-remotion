import {mkdir} from "node:fs/promises";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderStill} from "@remotion/renderer";
import fixtureJson from "../render-specs/fixtures/renderable-9scene/render_spec.json";
import {productionAssetPaths} from "../src/config/production-assets";
import {renderSpecSchema} from "../src/spec/render-spec";
import {PROJECT_DIR} from "./render-helpers";

const fixture = renderSpecSchema.parse(fixtureJson);
const scene = fixture.scenes[0];
const outputDirectory = path.join(
  PROJECT_DIR,
  "renders",
  "tests",
  "visual-beat-switch",
);
await mkdir(outputDirectory, {recursive: true});

const serveUrl = await bundle({
  entryPoint: path.join(PROJECT_DIR, "src", "index.ts"),
});

const representatives = [
  {name: "01-data", timeMs: 500},
  {name: "02-entity-focus", timeMs: 1500},
  {name: "03-return-data", timeMs: 2500},
] as const;
const selectedRepresentatives = process.env.BEAT_STILL
  ? representatives.filter((item) => item.name === process.env.BEAT_STILL)
  : representatives;
if (selectedRepresentatives.length === 0) {
  throw new Error(`unknown BEAT_STILL: ${process.env.BEAT_STILL}`);
}

for (const representative of selectedRepresentatives) {
  const inputProps = {
    scene,
    assets: productionAssetPaths,
    timeMs: representative.timeMs,
  };
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find(
    (item) => item.id === "NasdaqCafeSpecDebugStill",
  );
  if (!composition) throw new Error("NasdaqCafeSpecDebugStill not found");
  const output = path.join(outputDirectory, `${representative.name}.png`);
  await renderStill({
    composition,
    serveUrl,
    inputProps,
    output,
    imageFormat: "png",
  });
  console.log(`visual Beat still: ${output}`);
}
