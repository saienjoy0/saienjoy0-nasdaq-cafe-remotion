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
const handoffPreviewName = "nasdaq-cafe-preview-handoff.yml";
const candidatePreviewRequestName = "nasdaq-cafe-handoff-preview-request-v4.yml";
const candidatePreviewWorkerName = "nasdaq-cafe-preview-handoff-v2.yml";
const candidateFinalRequestName = "nasdaq-cafe-final-request-v2.yml";
const candidateFinalWorkerName = "nasdaq-cafe-final-v2.yml";
const currentRequestGateName = "current-request-publication-gate.yml";
const scheduledName = "nasdaq-cafe-scheduled-preview.yml";
const statusName = "nasdaq-cafe-preview-status.yml";
const motionPreviewName = "nasdaq-cafe-motion-preview.yml";
const motionRequestName = "nasdaq-cafe-motion-preview-request.yml";
const finalName = "nasdaq-cafe-final.yml";
const finalRequestName = "nasdaq-cafe-final-request.yml";
const shotPlanName = "nasdaq-cafe-shot-plan-apply.yml";
for (const required of [
  previewName,
  handoffPreviewName,
  candidatePreviewRequestName,
  candidatePreviewWorkerName,
  candidateFinalRequestName,
  candidateFinalWorkerName,
  currentRequestGateName,
  scheduledName,
  statusName,
  motionPreviewName,
  motionRequestName,
  finalName,
  finalRequestName,
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
const officialPreviewWorkflows = new Set([previewName, handoffPreviewName]);

for (const [file, text] of contents) {
  const startsPreview =
    text.includes("episode:spec:preview") || text.includes("GEMINI_API_KEY_");
  if (startsPreview) {
    if (file === candidatePreviewWorkerName) {
      assert(hasEvent(text, "workflow_call"), `${file}: candidate Preview worker must be reusable`);
      assert(!hasEvent(text, "workflow_dispatch"), `${file}: candidate Preview worker cannot be manually dispatched`);
      for (const event of automaticEvents) {
        assert(!hasEvent(text, event), `${file}: candidate Preview worker cannot own automatic event ${event}`);
      }
    } else {
      assert(
        officialPreviewWorkflows.has(file),
        `only official legacy/manual Preview workflows or the qualified candidate worker may call Gemini TTS or render a preview: ${file}`,
      );
      assert(hasEvent(text, "workflow_dispatch"), `${file}: preview must be manual-only`);
      for (const event of automaticEvents) {
        assert(!hasEvent(text, event), `${file}: preview cannot use automatic event ${event}`);
      }
    }
  }

  const dispatchesPreview =
    text.includes("actions/workflows/") &&
    text.includes("/dispatches") &&
    text.includes("nasdaq-cafe-preview.yml");
  if (dispatchesPreview) {
    assert.equal(
      file,
      scheduledName,
      `only ${scheduledName} may dispatch the legacy preview workflow: ${file}`,
    );
  }

  if (text.includes("episode:spec:final")) {
    assert.equal(file, finalName, `only ${finalName} may render Final: ${file}`);
    assert(hasEvent(text, "workflow_call"), `${file}: Final renderer must be reusable-only`);
    assert(!hasEvent(text, "workflow_dispatch"), `${file}: direct Final dispatch is forbidden`);
    for (const event of automaticEvents) {
      assert(!hasEvent(text, event), `${file}: Final renderer cannot own automatic event ${event}`);
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
console.log("PASS: legacy preview rendering and inspection remain separate and replayable");

const handoffPreview = contents.get(handoffPreviewName)!;
assert(hasEvent(handoffPreview, "workflow_dispatch"));
for (const event of automaticEvents) {
  assert(!hasEvent(handoffPreview, event), `${handoffPreviewName}: unexpected automatic event ${event}`);
}
assert(
  handoffPreview.includes("actions/download-artifact@v4") &&
    handoffPreview.includes("repository: saienjoy0/nasdaq-plot-creator-") &&
    handoffPreview.includes("run-id: ${{ inputs.plot_run_id }}"),
  `${handoffPreviewName}: cross-repository immutable handoff Artifact download is required`,
);
assert(
  handoffPreview.includes("npm run handoff:intake") &&
    handoffPreview.includes("expected-bundle-id") &&
    handoffPreview.includes("expected-manifest-sha256"),
  `${handoffPreviewName}: bundle identity and manifest SHA must be verified before preview`,
);
assert(
  handoffPreview.includes("NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY") &&
    handoffPreview.indexOf("handoff:intake") < handoffPreview.indexOf("episode:spec:validate") &&
    handoffPreview.indexOf("episode:spec:validate") < handoffPreview.indexOf("episode:spec:preview"),
  `${handoffPreviewName}: runtime assets must be staged before validation and preview`,
);
assert(!handoffPreview.includes("episode:spec:final"));
console.log("PASS: handoff preview is manual-only, immutable-input-driven, and preview-only");

const candidatePreviewRequest = contents.get(candidatePreviewRequestName)!;
const candidatePreviewWorker = contents.get(candidatePreviewWorkerName)!;
const currentRequestGate = contents.get(currentRequestGateName)!;
assert(hasEvent(candidatePreviewRequest, "push"));
assert(candidatePreviewRequest.includes("uses: ./.github/workflows/nasdaq-cafe-preview-handoff-v2.yml"));
assert(candidatePreviewRequest.includes("ref: ${{ github.sha }}"));
assert(!candidatePreviewRequest.includes("github.actor == github.repository_owner"));
assert(!candidatePreviewRequest.includes("signedArtifactUrl"));
assert(hasEvent(candidatePreviewWorker, "workflow_call"));
assert(!hasEvent(candidatePreviewWorker, "workflow_dispatch"));
assert(candidatePreviewWorker.includes("NASDAQ_CAFE_PLOT_ARTIFACT_TOKEN is required for Current Preview"));
assert(candidatePreviewWorker.includes("retention-days: 90"));
assert(!candidatePreviewWorker.includes("signed_artifact_url"));
assert(hasEvent(currentRequestGate, "pull_request"));
assert(currentRequestGate.includes('      - "handoff-preview-requests-v4/*.json"'));
assert(currentRequestGate.includes('      - "final-render-requests-v2/*.json"'));
console.log("PASS: candidate Current Preview is reusable, event-pinned, token-only, and pre-merge request-gated");

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

const final = contents.get(finalName)!;
assert(hasEvent(final, "workflow_call"));
assert(!hasEvent(final, "workflow_dispatch"));
for (const event of automaticEvents) {
  assert(!hasEvent(final, event), `${finalName}: unexpected automatic event ${event}`);
}
assert(
  final.includes("github.workflow == 'Nasdaq Cafe Final Request'") &&
    final.includes("github.repository == 'saienjoy0/saienjoy0-nasdaq-cafe-remotion'"),
  `${finalName}: only the canonical Final Request caller may invoke Final`,
);
assert(
  final.includes("Restore validated Final approval sidecar") &&
    final.includes(".final-lineage/final_approval_lineage.json") &&
    final.includes("final-render-authorizations/${EPISODE_DATE}.json"),
  `${finalName}: validated lineage receipt and sidecar are mandatory`,
);
assert(final.includes("episode:spec:final"));
console.log("PASS: Final renderer is reusable-only and lineage-receipt-gated");

const finalRequest = contents.get(finalRequestName)!;
assert(hasEvent(finalRequest, "push"));
for (const event of ["pull_request", "issues", "schedule", "workflow_run", "workflow_dispatch"]) {
  assert(!hasEvent(finalRequest, event), `${finalRequestName}: unexpected trigger ${event}`);
}
assert(
  finalRequest.includes('      - "final-render-requests/*.json"'),
  `${finalRequestName}: Final requests must be append-only files on main`,
);
assert(
  finalRequest.includes("github.actor == github.repository_owner"),
  `${finalRequestName}: only the repository owner may submit Final requests`,
);
assert(
  finalRequest.includes('value["requestVersion"] != "1.1"') &&
    finalRequest.includes('value["confirmation"] != "FINAL_RENDER"'),
  `${finalRequestName}: v1.1 explicit Final request contract is required`,
);
assert(
  finalRequest.includes("scripts/validate-final-approval-lineage.py") &&
    finalRequest.includes("scripts/create-final-approval-sidecar.py") &&
    finalRequest.includes("needs: [resolve-request, validate-lineage]"),
  `${finalRequestName}: exact Preview/Plot/human approval lineage must PASS before runner wake`,
);
assert(
  finalRequest.includes("uses: ./.github/workflows/nasdaq-cafe-final.yml") &&
    finalRequest.includes("needs: [resolve-request, validate-lineage, wake-codespace]"),
  `${finalRequestName}: canonical queue must call the reusable Final workflow only after lineage and runner readiness`,
);
assert(!finalRequest.includes("actions/workflows/nasdaq-cafe-final.yml/dispatches"));
assert(!finalRequest.includes("episode:spec:final"));
console.log("PASS: Final request queue is owner-only, append-only, lineage-bound, and single-entry");

const candidateFinalRequest = contents.get(candidateFinalRequestName)!;
const candidateFinalWorker = contents.get(candidateFinalWorkerName)!;
assert(hasEvent(candidateFinalRequest, "push"));
assert(candidateFinalRequest.includes("uses: ./.github/workflows/nasdaq-cafe-final-v2.yml"));
assert(candidateFinalRequest.includes("ref: ${{ github.sha }}"));
assert(!candidateFinalRequest.includes("github.actor == github.repository_owner"));
for (const token of ("plotAuthorizationRunId", "humanPreviewReviewSha256", "plotFinalAuthorizationSha256", "finalFingerprint")) {
  assert(candidateFinalRequest.includes(token), `${candidateFinalRequestName}: missing ${token}`);
}
assert(hasEvent(candidateFinalWorker, "workflow_call"));
assert(candidateFinalWorker.includes("verify-final-authorization-bundle.py"));
assert(candidateFinalWorker.includes("NASDAQ_CAFE_PLOT_ARTIFACT_TOKEN"));
assert(candidateFinalWorker.includes("nasdaq-cafe-final-outcome-${{ inputs.final_fingerprint }}"));
assert(candidateFinalWorker.includes("ALREADY_COMPLETED"));
assert(candidateFinalWorker.includes("retention-days: 90"));
assert(!candidateFinalWorker.includes("signed_artifact_url"));
console.log("PASS: candidate Current Final is authorization-bound, token-only, idempotent, and reusable");

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
