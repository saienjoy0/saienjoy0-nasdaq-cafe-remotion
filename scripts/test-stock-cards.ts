import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {reusableEntities} from "../src/config/reusable-entity-cues";
import {productionAssetPaths} from "../src/config/production-assets";

const root = process.cwd();
const manifestPath = path.join(
  root,
  "public",
  "assets",
  "nasdaq-cafe",
  "stock-cards",
  "render-manifest.json",
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Array<{
  ticker: string;
  filename: string;
  status: string;
}>;
const tickerEntities = reusableEntities.filter(
  (entity) => entity.kind === "ticker-card",
);

assert.equal(manifest.length, 64);
assert.equal(
  manifest.filter((item) => item.status === "rendered").length,
  64,
);
assert.equal(tickerEntities.length, 64);
assert.equal(
  Object.keys(productionAssetPaths).filter((id) => id.startsWith("company_"))
    .length,
  64,
);

for (const entity of tickerEntities) {
  assert.ok(
    fs.existsSync(path.join(root, "public", entity.assetPath)),
    `Missing stock-card asset: ${entity.assetPath}`,
  );
  assert.ok(entity.aliases.length >= 2, `Missing aliases: ${entity.key}`);
}

console.log("PASS: 64 stock cards are rendered and connected to popup cues");
