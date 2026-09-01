import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";
import {
  analyzeVisualCandidateCatalogVNext,
  buildVisualCandidateCatalog,
  buildVisualCandidateCatalogVNext,
} from "../src/spec/visual-candidate-builder";
import {
  buildVisualCandidateInputFromRenderSpec,
  buildVisualCapabilityInventory,
} from "../src/spec/visual-candidate-input";
import {compileVisualDirection} from "../src/spec/visual-direction-compiler";
import {validateRenderSpecVisualProductionContract} from "../src/spec/validate-render-spec-static";
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
    const builder = optionalArg("--candidate-builder") ?? "legacy";
    if (builder !== "legacy" && builder !== "vnext") {
      throw new Error("--candidate-builder must be legacy|vnext");
    }
    if (builder === "vnext") {
      const editorialSnapshotSha256 = arg("--editorial-snapshot-sha256");
      if (!/^[a-f0-9]{64}$/.test(editorialSnapshotSha256)) {
        throw new Error("--editorial-snapshot-sha256 must be a 64-character lowercase SHA-256");
      }
      const candidateInputPath = arg("--candidate-input");
      const capabilityInventoryPath = arg("--capability-inventory");
      const coveragePath = optionalArg("--coverage");
      const candidateInput = buildVisualCandidateInputFromRenderSpec({
        spec,
        editorialSnapshotSha256,
      });
      const capabilityInventory = buildVisualCapabilityInventory(candidateInput);
      await writeJson(candidateInputPath, candidateInput);
      await writeJson(capabilityInventoryPath, capabilityInventory);
      if (coveragePath) {
        const analysis = analyzeVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256, hints});
        await writeJson(coveragePath, analysis.coverage);
        if (!analysis.catalog) {
          const error = new Error(
            `E_VISUAL_CANDIDATE_COVERAGE_UNAVAILABLE:${analysis.coverage.unavailableBeats.join(",")}`,
          );
          error.name = "VisualCandidateCoverageUnavailable";
          throw error;
        }
        await writeJson(arg("--catalog"), analysis.catalog);
        return;
      }
      await writeJson(
        arg("--catalog"),
        buildVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256, hints}),
      );
      return;
    }
    await writeJson(
      arg("--catalog"),
      buildVisualCandidateCatalog({spec, sourceRenderSpecSha256, hints}),
    );
    return;
  }
  if (command === "compile") {
    const catalog = visualCandidateCatalogSchema.parse(await readJson(arg("--catalog")));
    const plan = visualDirectionPlanSchema.parse(await readJson(arg("--plan")));
    const result = compileVisualDirection({
      spec,
      sourceRenderSpecSha256,
      catalog,
      plan,
      validateOutput: (value) => {
        validateRenderSpecVisualProductionContract(value, {enforceVariety: true});
      },
    });
    await writeJson(arg("--output"), result.spec);
    await writeJson(arg("--report"), result.report);
    return;
  }
  throw new Error("usage: visual-director-cli.ts build|compile --spec ... [--candidate-builder legacy|vnext]");
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = message.startsWith("E_VISUAL_CANDIDATE_COVERAGE_UNAVAILABLE:") ? 3 : 1;
});
