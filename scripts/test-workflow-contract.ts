import assert from "node:assert/strict";
import {readdir, readFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const workflowDir = path.join(PROJECT_DIR, ".github", "workflows");
const workflowFiles = (await readdir(workflowDir))
  .filter((file) => /\.ya?ml$/i.test(file))
  .sort();
const contents = new Map<string, string>();
for (const file of workflowFiles) {
  contents.set(file, await readFile(path.join(workflowDir, file), "utf8"));
}

const previewName = "nasdaq-cafe-preview.yml";
const scheduledName = "nasdaq-cafe-scheduled-preview.yml";
const statusName = "nasdaq-cafe-preview-status.yml";
for (const required of [previewName, scheduledName, statusName]) {
  assert(contents.has(required), `required workflow is missing: ${required}`);
}

const forbiddenName = /(chatgpt|one[-_]?time|temporary|temp[-_]?dispatch|issue[-_]?preview|test[-_]?dispatch)/i;
for (const file of workflowFiles) {
  assert(!forbiddenName.test(file), `temporary or unofficial workflow is forbidden: ${file}`);
}

const automaticEvents = ["push", "pull_request", "issues", "schedule", "workflow_run"];
const hasEvent = (text: string, event: string) =>
  new RegExp(`^\\s{2}${event}:`, "m").test(text);

for (const [file, text] of contents) {
  const startsPreview =
    text.includes("episode:spec:preview") || text.includes("GEMINI_API_KEY_");
  if (startsPreview) {
    assert.equal(
      file,
      previewName,
      `only ${previewName} may call Gemini TTS or render a preview: ${file}`,
    );
  }

  const dispatchesPreview =
    text.includes("actions/workflows/") &&
    text.includes("/dispatches") &&
    text.includes("nasdaq-cafe-preview.yml");
  if (dispatchesPreview) {
    assert.equal(
      file,
      scheduledName,
      `only ${scheduledName} may dispatch the preview workflow: ${file}`,
    );
  }

  if (text.includes("episode:spec:final")) {
    assert(hasEvent(text, "workflow_dispatch"), `${file}: final must be manual-only`);
    for (const event of automaticEvents) {
      assert(!hasEvent(text, event), `${file}: final cannot use automatic event ${event}`);
    }
  }
}

const preview = contents.get(previewName)!;
assert(hasEvent(preview, "workflow_dispatch"));
for (const event of automaticEvents) {
  assert(!hasEvent(preview, event), `${previewName}: unexpected automatic event ${event}`);
}
assert(preview.includes("build-preview:"), `${previewName}: build-preview job is required`);
assert(preview.includes("inspect-preview:"), `${previewName}: inspect-preview job is required`);
assert(preview.includes("Upload raw preview payload"), `${previewName}: raw MP4 upload is required`);
assert(preview.includes("Download raw preview payload"), `${previewName}: raw MP4 download is required`);
assert(
  preview.indexOf("Upload raw preview payload") < preview.indexOf("inspect-preview:"),
  `${previewName}: raw MP4 must be saved before the inspection job`,
);
assert(
  preview.includes("nasdaq-cafe-preview-raw-${{ needs.input-preflight.outputs.episode_id }}-${{ github.run_id }}"),
  `${previewName}: raw artifact name must be stable across failed-job reruns`,
);
console.log("PASS: preview rendering and inspection are separate, replayable jobs");

const scheduled = contents.get(scheduledName)!;
assert(hasEvent(scheduled, "schedule"));
assert(hasEvent(scheduled, "workflow_dispatch"));
assert(!scheduled.includes("episode:spec:preview"));
assert(!scheduled.includes("GEMINI_API_KEY_"));
console.log("PASS: scheduled gate dispatches but never renders or calls Gemini directly");

const status = contents.get(statusName)!;
assert(hasEvent(status, "workflow_run"));
assert(!status.includes("episode:spec:preview"));
assert(!status.includes("GEMINI_API_KEY_"));
console.log("PASS: status workflow is read-only with respect to production rendering");

console.log(`workflow contract tests: ${workflowFiles.length} workflow files checked`);
