import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {loadRenderSpecForProduction} from "./load-render-spec";

const [episodeDate, confirmation] = process.argv.slice(2);
if (!episodeDate || !/^\d{4}-\d{2}-\d{2}$/.test(episodeDate)) {
  throw new Error(
    "Usage: npm run episode:spec:ready -- YYYY-MM-DD --consistency-pass",
  );
}
if (confirmation !== "--consistency-pass") {
  throw new Error(
    "Refusing to create production_ready.json without --consistency-pass",
  );
}

const specPath = `render-specs/${episodeDate}/render_spec.json`;
const episodePackagePath = `episode-packages/${episodeDate}/episode_package_${episodeDate}.md`;
const readyPath = `render-specs/${episodeDate}/production_ready.json`;

const loaded = await loadRenderSpecForProduction(specPath);
if (loaded.spec.episode.id !== episodeDate) {
  throw new Error(
    `render_spec episode.id mismatch: ${loaded.spec.episode.id} != ${episodeDate}`,
  );
}
if (loaded.spec.episode.targetDate !== episodeDate) {
  throw new Error(
    `render_spec episode.targetDate mismatch: ${loaded.spec.episode.targetDate} != ${episodeDate}`,
  );
}

const packageBytes = await readFile(path.resolve(process.cwd(), episodePackagePath));
if (packageBytes.length === 0 || packageBytes.toString("utf8").trim().length === 0) {
  throw new Error(`episode package is empty: ${episodePackagePath}`);
}
const episodePackageSha256 = createHash("sha256")
  .update(packageBytes)
  .digest("hex");

const manifest = {
  version: 1,
  status: "ready",
  episodeDate,
  renderSpecPath: specPath,
  renderSpecSha256: loaded.sha256,
  episodePackagePath,
  episodePackageSha256,
  validatorStatus: "pass",
  consistencyStatus: "pass",
  unresolvedStateCount: 0,
  createdAt: new Date().toISOString(),
};

await mkdir(path.dirname(path.resolve(process.cwd(), readyPath)), {
  recursive: true,
});
await writeFile(
  path.resolve(process.cwd(), readyPath),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`production-ready manifest written: ${readyPath}`);
console.log(`render spec SHA-256: ${loaded.sha256}`);
console.log(`episode package SHA-256: ${episodePackageSha256}`);
