import {mkdir} from "node:fs/promises";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderStill} from "@remotion/renderer";
import {makeCardFirstCurrentFixtures} from "../src/dev/card-first-current-fixtures";
import {PROJECT_DIR} from "./render-helpers";

const outputRoot = path.join(PROJECT_DIR, "renders", "tests", "card-first-current-contract");
await mkdir(outputRoot, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(PROJECT_DIR, "src", "index.ts")});
const fixtures = makeCardFirstCurrentFixtures();

for (const fixture of fixtures) {
  const inputProps = {content: fixture.content};
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find((item) => item.id === "CardFirstContractStill");
  if (!composition) throw new Error("CardFirstContractStill not found");
  const output = path.join(outputRoot, fixture.fileName);
  await renderStill({
    composition,
    serveUrl,
    inputProps,
    output,
    imageFormat: "png",
  });
  console.log(`card-first current-contract still: ${output}`);
}

if (fixtures.length !== 5) throw new Error(`expected five representative stills, got ${fixtures.length}`);
