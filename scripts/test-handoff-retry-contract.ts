import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const workflow = await readFile(
  path.join(PROJECT_DIR, ".github", "workflows", "nasdaq-cafe-preview-handoff.yml"),
  "utf8",
);
const runtimeLayout = await readFile(
  path.join(PROJECT_DIR, "src", "spec", "validate-render-layout.ts"),
  "utf8",
);

const restore = "Restore verified immutable handoff cache";
const resolveSigned = "Resolve signed Artifact transport from verified promotion request";
const tokenDownload = "Download immutable Plot handoff Artifact with configured token";
const signedDownload = "Download digest-pinned signed Plot handoff Artifact";
const intake = "Verify handoff bytes and stage daily assets";
const save = "Save verified immutable handoff cache";
const validate = "Validate handoff-driven render spec";

for (const marker of [restore, resolveSigned, tokenDownload, signedDownload, intake, save, validate]) {
  assert(workflow.includes(marker), `handoff workflow is missing: ${marker}`);
}
assert(workflow.includes("actions/cache/restore@v5"));
assert(workflow.includes("actions/cache/save@v5"));
assert(workflow.includes("nasdaq-cafe-handoff-v1-${{ inputs.expected_bundle_id }}-${{ inputs.expected_manifest_sha256 }}"));
assert(!workflow.includes("restore-keys:"), "immutable handoff cache must use an exact key only");
assert(workflow.indexOf(restore) < workflow.indexOf(resolveSigned));
assert(workflow.indexOf(restore) < workflow.indexOf(tokenDownload));
assert(workflow.indexOf(restore) < workflow.indexOf(signedDownload));
assert(workflow.indexOf(intake) < workflow.indexOf(save), "handoff bytes must be verified before caching");
assert(workflow.indexOf(save) < workflow.indexOf(validate), "verified bytes should be made retryable before later Preview work");
assert(
  workflow.includes("steps.handoff-cache.outputs.cache-hit != 'true' && env.PLOT_ARTIFACT_TOKEN != ''"),
  "authenticated cross-repo download must be skipped on an exact cache hit",
);
assert(
  workflow.includes("steps.handoff-cache.outputs.cache-hit != 'true' && env.PLOT_ARTIFACT_TOKEN == ''"),
  "signed URL download must be skipped on an exact cache hit",
);

assert(
  runtimeLayout.includes('import {assertStaticTemplateSoundness} from "./static-template-soundness"'),
  "composition-time layout must reuse the Candidate/preflight static Template contract",
);
assert(
  runtimeLayout.includes("assertStaticTemplateSoundness(scene, beat, path)"),
  "composition-time layout must invoke the shared static Template contract",
);
assert(
  !runtimeLayout.includes("verification-matrix requires exactly two lanes"),
  "runtime layout must not keep a second Template-static implementation",
);
assert(
  !runtimeLayout.includes('template === "macro-pressure"'),
  "runtime layout must not duplicate per-Template static branching",
);

console.log("PASS: handoff retries reuse verified immutable bytes and runtime Template soundness has one authority");
