import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";

const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");

const sha256Pattern = /^[0-9a-f]{64}$/;
const commitPattern = /^[0-9a-f]{40}$/;
const runIdPattern = /^[0-9]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const PLOT_REPOSITORY = "saienjoy0/nasdaq-plot-creator-";
const PREVIEW_WORKFLOWS = new Set([
  ".github/workflows/nasdaq-cafe-preview.yml",
  ".github/workflows/nasdaq-cafe-preview-handoff.yml",
]);

type FetchText = (url: string) => Promise<string>;

const defaultFetchText: FetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "nasdaq-cafe-final-approval-preflight",
    },
  });
  if (!response.ok) {
    throw new Error(`Final approval evidence fetch failed: ${response.status} ${url}`);
  }
  return response.text();
};

const object = (text: string, label: string) => {
  const value = JSON.parse(text) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
};

const string = (value: unknown, label: string) => {
  if (typeof value !== "string" || !value) throw new Error(`${label} must be a string`);
  return value;
};

const rawPlotUrl = (commit: string, relativePath: string) => {
  if (!commitPattern.test(commit)) throw new Error("plotAuthorizationCommit must be 40-hex");
  if (!/^[A-Za-z0-9._/-]+$/.test(relativePath) || relativePath.includes("..")) {
    throw new Error("Plot approval evidence path is unsafe");
  }
  return `https://raw.githubusercontent.com/${PLOT_REPOSITORY}/${commit}/${relativePath}`;
};

export const verifyFinalApprovalPreflight = async ({
  episodeDate,
  inputSpecSha256,
  repoRoot = process.cwd(),
  githubActions = process.env.GITHUB_ACTIONS,
  githubWorkflow = process.env.GITHUB_WORKFLOW,
  fetchText = defaultFetchText,
}: {
  episodeDate: string;
  inputSpecSha256: string;
  repoRoot?: string;
  githubActions?: string;
  githubWorkflow?: string;
  fetchText?: FetchText;
}) => {
  if (!datePattern.test(episodeDate)) throw new Error("Final approval episodeDate is invalid");
  if (!sha256Pattern.test(inputSpecSha256)) throw new Error("Final input spec SHA is invalid");

  // CI Final must come through the append-only Final Request control plane.
  // This closes the direct workflow_dispatch bypass without changing local tooling.
  if (githubActions === "true" && githubWorkflow !== "Nasdaq Cafe Final Request") {
    throw new Error(
      `E_FINAL_APPROVAL_REQUEST_ROUTE_REQUIRED: Final CI must be invoked by Nasdaq Cafe Final Request; actual=${githubWorkflow ?? "unknown"}`,
    );
  }

  const sidecarPath = path.join(
    repoRoot,
    "final-render-authorizations",
    `${episodeDate}.json`,
  );
  const sidecarBytes = await readFile(sidecarPath);
  const sidecar = object(sidecarBytes.toString("utf8"), "Final authorization sidecar");
  const required = new Set([
    "contractVersion",
    "episodeDate",
    "expectedSpecSha256",
    "previewRunId",
    "approvedPreviewSha256",
    "previewTechnicalReportSha256",
    "plotAuthorizationCommit",
    "plotAuthorizationPath",
    "plotAuthorizationSha256",
  ]);
  const keys = Object.keys(sidecar);
  if (keys.length !== required.size || keys.some((key) => !required.has(key))) {
    throw new Error(`Final authorization sidecar fields mismatch: ${keys.sort().join(",")}`);
  }
  if (sidecar.contractVersion !== "1.0.0") throw new Error("Final authorization sidecar contractVersion must be 1.0.0");
  if (sidecar.episodeDate !== episodeDate) throw new Error("Final authorization sidecar episodeDate mismatch");
  if (sidecar.expectedSpecSha256 !== inputSpecSha256) throw new Error("Final authorization sidecar render_spec SHA mismatch");

  const previewRunId = string(sidecar.previewRunId, "previewRunId");
  const approvedPreviewSha256 = string(sidecar.approvedPreviewSha256, "approvedPreviewSha256");
  const previewTechnicalReportSha256 = string(
    sidecar.previewTechnicalReportSha256,
    "previewTechnicalReportSha256",
  );
  const plotAuthorizationCommit = string(
    sidecar.plotAuthorizationCommit,
    "plotAuthorizationCommit",
  );
  const plotAuthorizationPath = string(
    sidecar.plotAuthorizationPath,
    "plotAuthorizationPath",
  );
  const plotAuthorizationSha256 = string(
    sidecar.plotAuthorizationSha256,
    "plotAuthorizationSha256",
  );
  if (!runIdPattern.test(previewRunId)) throw new Error("previewRunId must be numeric");
  for (const [label, value] of [
    ["approvedPreviewSha256", approvedPreviewSha256],
    ["previewTechnicalReportSha256", previewTechnicalReportSha256],
    ["plotAuthorizationSha256", plotAuthorizationSha256],
  ] as const) {
    if (!sha256Pattern.test(value)) throw new Error(`${label} must be SHA-256`);
  }
  const canonicalAuthorizationPath = `verification/${episodeDate}/final_render_authorization.json`;
  if (plotAuthorizationPath !== canonicalAuthorizationPath) {
    throw new Error(`plotAuthorizationPath must be ${canonicalAuthorizationPath}`);
  }

  const authorizationText = await fetchText(
    rawPlotUrl(plotAuthorizationCommit, plotAuthorizationPath),
  );
  if (sha256(authorizationText) !== plotAuthorizationSha256) {
    throw new Error("Plot Final authorization SHA mismatch");
  }
  const authorization = object(authorizationText, "Plot Final authorization");
  if (
    authorization.contractVersion !== "1.0.0" ||
    authorization.episode_date !== episodeDate ||
    authorization.status !== "approved" ||
    authorization.final_requested !== true
  ) {
    throw new Error("Plot Final authorization is not explicit approved Final evidence");
  }
  if (authorization.renderSpecSha256 !== inputSpecSha256) {
    throw new Error("Plot Final authorization render_spec SHA mismatch");
  }
  if (String(authorization.previewRunId) !== previewRunId) {
    throw new Error("Plot Final authorization Preview run mismatch");
  }
  if (authorization.previewSha256 !== approvedPreviewSha256) {
    throw new Error("Plot Final authorization Preview SHA mismatch");
  }
  if (authorization.previewTechnicalReportSha256 !== previewTechnicalReportSha256) {
    throw new Error("Plot Final authorization technical-report SHA mismatch");
  }

  const humanReviewPath = string(
    authorization.humanPreviewReviewPath,
    "humanPreviewReviewPath",
  );
  const humanReviewSha256 = string(
    authorization.humanPreviewReviewSha256,
    "humanPreviewReviewSha256",
  );
  const canonicalHumanReviewPath = `verification/${episodeDate}/human_preview_review.json`;
  if (humanReviewPath !== canonicalHumanReviewPath || !sha256Pattern.test(humanReviewSha256)) {
    throw new Error("Plot human Preview review binding is invalid");
  }
  const humanReviewText = await fetchText(
    rawPlotUrl(plotAuthorizationCommit, humanReviewPath),
  );
  if (sha256(humanReviewText) !== humanReviewSha256) {
    throw new Error("Plot human Preview review SHA mismatch");
  }
  const review = object(humanReviewText, "Plot human Preview review");
  if (
    review.contractVersion !== "1.0.0" ||
    review.episodeDate !== episodeDate ||
    review.status !== "approved" ||
    review.previewSha256 !== approvedPreviewSha256
  ) {
    throw new Error("Plot human Preview review does not approve the authorized Preview SHA");
  }

  // The run metadata is public for this repository. We do not infer quality from it;
  // we only prove that the referenced Preview run exists, succeeded, and was a real
  // Preview workflow rather than an unrelated Actions run.
  const runText = await fetchText(
    `https://api.github.com/repos/saienjoy0/saienjoy0-nasdaq-cafe-remotion/actions/runs/${previewRunId}`,
  );
  const run = object(runText, "Preview workflow run");
  if (run.status !== "completed" || run.conclusion !== "success") {
    throw new Error("authorized Preview workflow run did not complete successfully");
  }
  if (!PREVIEW_WORKFLOWS.has(String(run.path))) {
    throw new Error(`authorized run is not a Preview workflow: ${String(run.path)}`);
  }

  return {
    status: "PASS" as const,
    episodeDate,
    inputSpecSha256,
    previewRunId,
    approvedPreviewSha256,
    previewTechnicalReportSha256,
    plotAuthorizationCommit,
    plotAuthorizationSha256,
    humanReviewSha256,
  };
};
