import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {verifyFinalApprovalPreflight} from "./final-approval-preflight";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const DATE = "2099-06-06";
const SPEC_SHA = "1".repeat(64);
const PREVIEW_SHA = "2".repeat(64);
const TECH_SHA = "3".repeat(64);
const PLOT_COMMIT = "4".repeat(40);
const RUN_ID = "123456789";

const root = await mkdtemp(path.join(os.tmpdir(), "nasdaq-final-preflight-"));
await mkdir(path.join(root, "final-render-authorizations"), {recursive: true});

const reviewText = `${JSON.stringify({
  contractVersion: "1.0.0",
  episodeDate: DATE,
  previewSha256: PREVIEW_SHA,
  status: "approved",
  reviewedAt: "2099-06-06T10:00:00Z",
}, null, 2)}\n`;
const authText = `${JSON.stringify({
  contractVersion: "1.0.0",
  episode_date: DATE,
  status: "approved",
  final_requested: true,
  renderSpecSha256: SPEC_SHA,
  previewRunId: RUN_ID,
  previewSha256: PREVIEW_SHA,
  previewTechnicalReportSha256: TECH_SHA,
  humanPreviewReviewPath: `verification/${DATE}/human_preview_review.json`,
  humanPreviewReviewSha256: sha256(reviewText),
  visualIntelligencePackageSha256: "5".repeat(64),
  visualIntelligenceValidationSha256: "6".repeat(64),
}, null, 2)}\n`;
const sidecar = {
  contractVersion: "1.0.0",
  episodeDate: DATE,
  expectedSpecSha256: SPEC_SHA,
  previewRunId: RUN_ID,
  approvedPreviewSha256: PREVIEW_SHA,
  previewTechnicalReportSha256: TECH_SHA,
  plotAuthorizationCommit: PLOT_COMMIT,
  plotAuthorizationPath: `verification/${DATE}/final_render_authorization.json`,
  plotAuthorizationSha256: sha256(authText),
};
await writeFile(
  path.join(root, "final-render-authorizations", `${DATE}.json`),
  `${JSON.stringify(sidecar, null, 2)}\n`,
  "utf8",
);

const fetchText = async (url: string) => {
  if (url.endsWith(`/verification/${DATE}/final_render_authorization.json`)) {
    return authText;
  }
  if (url.endsWith(`/verification/${DATE}/human_preview_review.json`)) {
    return reviewText;
  }
  if (url.endsWith(`/actions/runs/${RUN_ID}`)) {
    return JSON.stringify({
      status: "completed",
      conclusion: "success",
      path: ".github/workflows/nasdaq-cafe-preview-handoff.yml",
    });
  }
  throw new Error(`unexpected URL: ${url}`);
};

const result = await verifyFinalApprovalPreflight({
  episodeDate: DATE,
  inputSpecSha256: SPEC_SHA,
  repoRoot: root,
  githubActions: "true",
  githubWorkflow: "Nasdaq Cafe Final Request",
  fetchText,
});
assert.equal(result.status, "PASS");
assert.equal(result.approvedPreviewSha256, PREVIEW_SHA);

await assert.rejects(
  verifyFinalApprovalPreflight({
    episodeDate: DATE,
    inputSpecSha256: SPEC_SHA,
    repoRoot: root,
    githubActions: "true",
    githubWorkflow: "Nasdaq Cafe Final",
    fetchText,
  }),
  /E_FINAL_APPROVAL_REQUEST_ROUTE_REQUIRED/,
);

const staleSidecar = {...sidecar, approvedPreviewSha256: "7".repeat(64)};
await writeFile(
  path.join(root, "final-render-authorizations", `${DATE}.json`),
  `${JSON.stringify(staleSidecar, null, 2)}\n`,
  "utf8",
);
await assert.rejects(
  verifyFinalApprovalPreflight({
    episodeDate: DATE,
    inputSpecSha256: SPEC_SHA,
    repoRoot: root,
    githubActions: "false",
    fetchText,
  }),
  /Preview SHA mismatch/,
);

console.log("final approval preflight tests passed");
