import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";
import {buildVisualCandidateCatalog} from "../src/spec/visual-candidate-builder";
import {compileVisualDirection} from "../src/spec/visual-direction-compiler";
import {
  visualCandidateCatalogSchema,
  visualCapabilityHintsSchema,
  visualDirectionPlanSchema,
} from "../src/spec/visual-director-contract";

const readJson = async (file: string) => JSON.parse(await readFile(path.resolve(file), "utf8"));
const writeJson = async (file: string, value: unknown) => writeFile(path.resolve(file), JSON.stringify(value, null, 2) + "\n");
const arg = (name: string) => {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`missing ${name}`);
  return process.argv[index + 1];
};
const optionalArg = (name: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async () => {
  const command = process.argv[2];
  const specPath = arg("--spec");
  const raw = await readFile(path.resolve(specPath));
  const spec = renderSpecSchema.parse(JSON.parse(raw.toString("utf8")));
  const sourceRenderSpecSha256 = createHash("sha256").update(raw).digest("hex");
  if (command === "build") {
    const hintsPath = optionalArg("--hints");
    const hints = hintsPath ? visualCapabilityHintsSchema.parse(await readJson(hintsPath)) : undefined;
    await writeJson(arg("--catalog"), buildVisualCandidateCatalog({spec, sourceRenderSpecSha256, hints}));
    return;
  }
  if (command === "compile") {
    const catalog = visualCandidateCatalogSchema.parse(await readJson(arg("--catalog")));
    const plan = visualDirectionPlanSchema.parse(await readJson(arg("--plan")));
    const result = compileVisualDirection({spec, sourceRenderSpecSha256, catalog, plan});
    await writeJson(arg("--output"), result.spec);
    await writeJson(arg("--report"), result.report);
    return;
  }
  throw new Error("usage: visual-director-cli.ts build|compile --spec ...");
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
