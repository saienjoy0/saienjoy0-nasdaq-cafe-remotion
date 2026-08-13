import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import voiceProfilesJson from "../config/voice-profiles.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {renderSpecSchema, productionDataSchema} from "../src/spec/render-spec";
import {
  assertProductionTextSafe,
  type AssetManifestForSpec,
} from "../src/spec/validate-render-spec";
import {validateRenderSpecReferencesMultiBeat} from "../src/spec/validate-render-spec-multibeat";
import {validateVisualStoryContract} from "../src/spec/validate-visual-story";
import {validateShotStoryContract} from "../src/spec/validate-shot-story";
import {preflightProductionExpressions} from "../src/spec/preflight-render-spec";
import {preflightViewerSurface} from "../src/spec/preflight-viewer-surface";
import {preflightStaticViewerLayout} from "../src/spec/preflight-static-viewer-layout";
import {verifyFinalApprovalPreflight} from "./final-approval-preflight";

export const resolveSpecPath = (input: string) => path.resolve(process.cwd(), input);
const format = (issues: Array<{path: PropertyKey[]; message: string}>) =>
  issues.map((issue) => `$.${issue.path.join(".")}: ${issue.message}`).join("\n");

export const loadRenderSpec = async (
  input: string,
  assetManifest: AssetManifestForSpec = productionAssetManifest,
) => {
  const resolved = resolveSpecPath(input);
  const source = await readFile(resolved);
  const parsed = renderSpecSchema.safeParse(JSON.parse(source.toString("utf8")));
  if (!parsed.success) {
    throw new Error(`render_spec validation failed:\n${format(parsed.error.issues)}`);
  }
  validateRenderSpecReferencesMultiBeat(parsed.data, assetManifest, voiceProfilesJson);
  const enforceVariety = !resolved.includes(`${path.sep}fixtures${path.sep}`);
  validateVisualStoryContract(parsed.data, {enforceVariety});
  validateShotStoryContract(parsed.data, {enforceVariety});
  preflightStaticViewerLayout(parsed.data);
  const expressionPreflight = preflightProductionExpressions(parsed.data);
  const viewerSurfacePreflight = preflightViewerSurface(parsed.data);
  return {
    spec: parsed.data,
    resolved,
    sha256: createHash("sha256").update(source).digest("hex"),
    expressionPreflight,
    viewerSurfacePreflight,
  };
};

export const loadRenderSpecForProduction = async (
  input: string,
  assetManifest: AssetManifestForSpec = productionAssetManifest,
) => {
  const loaded = await loadRenderSpec(input, assetManifest);
  const isFixture = loaded.resolved.includes(`${path.sep}fixtures${path.sep}`);
  if (process.argv[2] === "final" && !isFixture) {
    await verifyFinalApprovalPreflight({
      episodeDate: loaded.spec.episode.id,
      inputSpecSha256: loaded.sha256,
    });
  }
  return loaded;
};

export const loadProductionData = async (input: string) => {
  const resolved = path.resolve(process.cwd(), input);
  const parsed = productionDataSchema.safeParse(JSON.parse(await readFile(resolved, "utf8")));
  if (!parsed.success) {
    throw new Error(`production data validation failed:\n${format(parsed.error.issues)}`);
  }
  // shortenedReason is internal production metadata and is not rendered or voiced.
  // Public-text safety remains strict for every viewer-facing field.
  assertProductionTextSafe({
    ...parsed.data,
    episode: {...parsed.data.episode, shortenedReason: undefined},
  });
  return parsed.data;
};
