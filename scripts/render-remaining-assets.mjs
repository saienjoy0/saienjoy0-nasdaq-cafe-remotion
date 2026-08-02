import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({
    loopback: [{address: "127.0.0.1", netmask: "255.0.0.0", family: "IPv4", mac: "00:00:00:00:00:00", internal: true, cidr: "127.0.0.1/8"}],
  });
}

const {bundle} = await import("@remotion/bundler");
const {renderStill, selectComposition} = await import("@remotion/renderer");
const root = process.cwd();
const assets = JSON.parse(await fs.readFile(path.join(root, "data", "remaining-assets.json"), "utf8"));
const outputRoot = path.join(root, "public", "assets", "nasdaq-cafe", "remaining");
const manifestPath = path.join(outputRoot, "render-manifest.json");
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const typeDir = {person: "people", person_role: "roles", concept: "concepts", background: "backgrounds"};
const typesArgument = process.argv.find((argument) => argument.startsWith("--types="));
const requestedTypes = typesArgument
  ? new Set(typesArgument.slice("--types=".length).split(",").map((value) => value.trim()).filter(Boolean))
  : null;
const renderTargets = assets.filter((asset) => !requestedTypes || requestedTypes.has(asset.asset_type));

for (const directory of Object.values(typeDir)) {
  await fs.mkdir(path.join(outputRoot, directory), {recursive: true});
}

const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "remaining-assets", "index.ts"),
  webpackOverride: (config) => config,
});

let previousResults = [];
try {
  previousResults = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch {
  previousResults = [];
}
const resultsById = new Map(
  previousResults.map((result) => [result.asset_id, result]),
);
for (const [index, asset] of renderTargets.entries()) {
  const output = path.join(outputRoot, typeDir[asset.asset_type], asset.output_filename);
  const inputProps = {assetId: asset.asset_id};
  try {
    const composition = await selectComposition({
      serveUrl,
      id: "RemainingAssetStill",
      inputProps,
      browserExecutable,
    });
    await renderStill({
      composition,
      serveUrl,
      output,
      inputProps,
      imageFormat: "png",
      browserExecutable,
    });
    resultsById.set(asset.asset_id, {...asset, path: path.relative(path.join(root, "public"), output).replaceAll(path.sep, "/"), status: "rendered"});
    console.log(`${index + 1}/${renderTargets.length} rendered: ${asset.output_filename}`);
  } catch (error) {
    resultsById.set(asset.asset_id, {...asset, status: "failed", error: error instanceof Error ? error.message : String(error)});
    console.error(`${index + 1}/${renderTargets.length} failed: ${asset.asset_id}`);
  }
}

const results = assets.map((asset) => resultsById.get(asset.asset_id) ?? {...asset, status: "not-rendered"});
await fs.writeFile(manifestPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
const requestedResults = renderTargets.map((asset) => resultsById.get(asset.asset_id));
const success = requestedResults.filter((item) => item?.status === "rendered").length;
console.log(`Completed: ${success}/${renderTargets.length} requested remaining assets rendered.`);
if (success !== renderTargets.length) process.exitCode = 1;
