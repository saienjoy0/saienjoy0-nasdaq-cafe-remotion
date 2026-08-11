import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const workflowPath = path.join(
  PROJECT_DIR,
  ".github",
  "workflows",
  "nasdaq-cafe-handoff-promote.yml",
);
const workflow = await readFile(workflowPath, "utf8");

assert(
  workflow.includes("root.rglob('handoff_manifest.json')"),
  "handoff promote must discover manifests from verified Artifact contents",
);
assert(
  workflow.includes("value.get('episode_date') == episode_date") &&
    workflow.includes("value.get('bundle_id') == bundle_id"),
  "handoff promote must select by manifest episode_date + bundle_id",
);
assert(
  workflow.includes("if len(matches) != 1:"),
  "handoff promote must fail closed unless exactly one manifest matches",
);
assert(
  !workflow.includes("/h4-bundles/"),
  "handoff promote must not hard-code an H4 bundle generation directory",
);
assert(
  workflow.includes('ACTUAL_MANIFEST_SHA="$(sha256sum "$MANIFEST"') &&
    workflow.includes("value.get('mode') != 'preview'") &&
    workflow.includes("renderer.get('expected_base_commit') != renderer_commit"),
  "generation-agnostic discovery must retain manifest SHA, preview-only, and renderer-pin verification",
);

const readyScript = await readFile(
  path.join(PROJECT_DIR, "scripts", "create-production-ready.ts"),
  "utf8",
);
assert(
  readyScript.includes('import {loadRuntimeAssetContext} from "../src/config/runtime-assets";') &&
    readyScript.includes("const runtimeAssets = await loadRuntimeAssetContext();") &&
    readyScript.includes("loadRenderSpecForProduction(specPath, runtimeAssets.manifest)"),
  "production-ready creation must validate against the same runtime asset registry used by spec validation and preview",
);

const layoutRepairWorkflow = await readFile(
  path.join(
    PROJECT_DIR,
    ".github",
    "workflows",
    "nasdaq-cafe-layout-text-repair.yml",
  ),
  "utf8",
);
assert(
  layoutRepairWorkflow.includes(
    "NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY: runtime-assets/${{ steps.repair.outputs.episode_date }}/runtime_asset_registry.json",
  ) &&
    layoutRepairWorkflow.includes(
      "EPISODE_ID: ${{ steps.repair.outputs.episode_date }}",
    ),
  "layout text repair must validate and recreate ready with promoted runtime assets",
);

console.log("PASS: handoff promotion and display-only repair preserve runtime asset validation");
