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
const motionQueueScript = await readFile(
  path.join(PROJECT_DIR, "scripts", "motion_preview_request_queue.py"),
  "utf8",
);
const shotPlanScript = await readFile(
  path.join(PROJECT_DIR, "scripts", "apply_measured_shot_plan.py"),
  "utf8",
);

const previewName = "nasdaq-cafe-preview.yml";
const scheduledName = "nasdaq-cafe-scheduled-preview.yml";
const statusName = "nasdaq-cafe-preview-status.yml";
const motionPreviewName = "nasdaq-cafe-motion-preview.yml";
const motionRequestName = "nasdaq-cafe-motion-preview-request.yml";
const shotPlanName = "nasdaq-cafe-shot-plan-apply.yml";
for (const required of [
  previewName,
  scheduledName,
  statusName,
  motionPreviewName,
  motionRequestName,
  shotPlanName,
]) {
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

const motionPreview = contents.get(motionPreviewName)!;
assert(hasEvent(motionPreview, "workflow_dispatch"));
assert(hasEvent(motionPreview, "workflow_call"));
for (const event of automaticEvents) {
  assert(
    !hasEvent(motionPreview, event),
    `${motionPreviewName}: reusable renderer cannot own automatic event ${event}`,
  );
}
assert(
  motionPreview.includes("runs-on: [self-hosted, linux, x64, nasdaq-cafe-codespace]"),
  `${motionPreviewName}: Codespace runner label is required`,
);
assert(
  motionPreview.includes("github.workflow == 'Nasdaq Cafe Motion Preview'") &&
    motionPreview.includes("github.actor == github.repository_owner"),
  `${motionPreviewName}: direct manual execution must remain repository-owner-only`,
);
assert(
  motionPreview.includes("github.workflow == 'Nasdaq Cafe Motion Preview Request'") &&
    motionPreview.includes("github.repository == 'saienjoy0/saienjoy0-nasdaq-cafe-remotion'"),
  `${motionPreviewName}: reusable execution must accept only the trusted queue workflow`,
);
assert(!motionPreview.includes("github.event_name != 'workflow_dispatch' && github.repository"));
assert(motionPreview.includes("actions/cache/restore@v5"));
assert(motionPreview.includes("Exact two-block production TTS cache was not found"));
assert(motionPreview.includes("Motion Preview does not generate or regenerate narration"));
assert(!motionPreview.includes("GEMINI_API_KEY_"));
assert(!motionPreview.includes("episode:spec:preview"));
assert(!motionPreview.includes("episode:spec:final"));
console.log("PASS: Motion Preview is reusable, trusted-caller-only, and cache-only");

const motionRequest = contents.get(motionRequestName)!;
assert(hasEvent(motionRequest, "push"));
assert(hasEvent(motionRequest, "schedule"));
assert(hasEvent(motionRequest, "workflow_dispatch"));
assert(
  motionRequest.includes("github.actor == github.repository_owner"),
  `${motionRequestName}: explicit queue triggers must remain repository-owner-only`,
);
assert(
  motionRequest.includes("group: nasdaq-cafe-motion-preview-request-queue"),
  `${motionRequestName}: all queue triggers must share one concurrency group`,
);
assert(
  motionRequest.includes("cancel-in-progress: false"),
  `${motionRequestName}: pending queue work cannot be cancelled by a later trigger`,
);
assert(
  motionRequest.includes("uses: ./.github/workflows/nasdaq-cafe-motion-preview.yml"),
  `${motionRequestName}: queue must call the reusable Motion Preview workflow directly`,
);
assert(
  !motionRequest.includes("actions/workflows/nasdaq-cafe-motion-preview.yml/dispatches"),
  `${motionRequestName}: REST workflow dispatch is forbidden`,
);
assert(
  motionRequest.includes("scripts/motion_preview_request_queue.py") &&
    motionRequest.includes("outcome_path"),
  `${motionRequestName}: tested durable queue logic is required`,
);
assert(
  motionQueueScript.includes('"motion-preview-state" / "outcomes"') &&
    motionQueueScript.includes("digest.update(relative_path.encode") &&
    motionQueueScript.includes("sort_keys=True"),
  "Motion Preview queue must use path-scoped canonical terminal outcomes",
);
assert(
  motionQueueScript.includes('status = "succeeded"') &&
    motionQueueScript.includes('status = "failed"') &&
    motionQueueScript.includes('status = "rejected"'),
  "every selected Motion Preview request must reach one terminal outcome",
);
assert(
  motionRequest.includes("always()") &&
    motionRequest.includes("Persist one terminal request outcome"),
  `${motionRequestName}: failed and rejected requests must be durably closed`,
);
assert(
  motionRequest.includes("request_valid == 'true'") &&
    motionRequest.includes("Rejected Motion Preview request"),
  `${motionRequestName}: invalid requests must not wake the Codespace`,
);
assert(
  !motionRequest.includes("actions/cache/restore") &&
    !motionRequest.includes("actions/cache/save"),
  `${motionRequestName}: dependency cache cannot be used as a request ledger`,
);
assert(
  motionRequest.indexOf("uses: ./.github/workflows/nasdaq-cafe-motion-preview.yml") <
    motionRequest.indexOf("Persist one terminal request outcome"),
  `${motionRequestName}: terminal outcome must be recorded after reusable preview completion`,
);
assert(
  motionRequest.includes("permissions:\n  contents: read\n  actions: read") &&
    motionRequest.includes("permissions:\n      contents: write"),
  `${motionRequestName}: contents write must be isolated to the outcome job`,
);
assert(!motionRequest.includes("GEMINI_API_KEY_"));
assert(!motionRequest.includes("episode:spec:preview"));
assert(!motionRequest.includes("episode:spec:final"));
console.log("PASS: Motion Preview queue is serialized, tested, at-most-once, and least-privilege");

const shotPlan = contents.get(shotPlanName)!;
assert(hasEvent(shotPlan, "push"));
for (const event of ["pull_request", "issues", "schedule", "workflow_run", "workflow_dispatch"]) {
  assert(!hasEvent(shotPlan, event), `${shotPlanName}: unexpected trigger ${event}`);
}
assert(
  shotPlan.includes('      - "shot-timing-requests/*.json"'),
  `${shotPlanName}: the workflow must be restricted to measured Shot requests`,
);
assert(
  shotPlan.includes("github.actor == github.repository_owner"),
  `${shotPlanName}: only the repository owner may apply an approved Shot plan`,
);
assert(
  shotPlan.includes("Exactly one Shot timing request must be added") &&
    shotPlan.includes("Shot timing requests are append-only JSON files"),
  `${shotPlanName}: requests must be append-only and singular`,
);
assert(
  shotPlan.includes("scripts/apply_measured_shot_plan.py") &&
    shotPlan.includes("npm run episode:spec:validate") &&
    shotPlan.includes("npm run test:shot-story"),
  `${shotPlanName}: generated render input must be mechanically applied and validated`,
);
assert(
  shotPlan.includes("Restrict generated changes") &&
    shotPlan.includes("shot-timing-reports/${EPISODE_DATE}.json"),
  `${shotPlanName}: generated changes must be path-restricted and auditable`,
);
assert(shotPlan.includes("permissions:\n  contents: write"));
assert(!shotPlan.includes("GEMINI_API_KEY"));
assert(!shotPlan.includes("episode:spec:preview"));
assert(!shotPlan.includes("episode:spec:final"));
assert(
  shotPlanScript.includes("Shot plan attempted to modify non-Shot render_spec content") &&
    shotPlanScript.includes("expectedEpisodePackageBlobSha") &&
    shotPlanScript.includes("localTimingAudit") &&
    shotPlanScript.includes("ttsInputExpectedUnchanged"),
  "measured Shot applicator must preserve content and record its audit boundary",
);
console.log("PASS: measured Shot plans are owner-only, append-only, mechanical, and content-preserving");

console.log(`workflow contract tests: ${workflowFiles.length} workflow files checked`);
