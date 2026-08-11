import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {loadRuntimeAssetContext} from "../src/config/runtime-assets";
import {loadProductionData, loadRenderSpec} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {inspectSpecMedia} from "./spec-inspect";

const input = process.argv[2];
if (!input) throw new Error("usage: inspect-preview <render_spec.json>");

const runtimeAssets = await loadRuntimeAssetContext();
const {spec, sha256} = await loadRenderSpec(input, runtimeAssets.manifest);
const workspace = path.join(PROJECT_DIR, "build", spec.episode.id);
const productionPath = path.join(workspace, "render_data.production.json");
const technicalPath = path.join(workspace, "technical_report.json");
const outputPath = path.join(workspace, "preview_inspection.json");
const previewPath = path.join(
  PROJECT_DIR,
  "renders",
  "preview",
  `${spec.episode.id}_nasdaq-cafe-spec-preview.mp4`,
);

const data = await loadProductionData(productionPath);
if (data.inputSpecSha256 !== sha256) {
  throw new Error(
    `production data spec SHA mismatch: ${data.inputSpecSha256} != ${sha256}`,
  );
}

const expectedDurationMs = Math.round(
  (data.timeline.totalDurationInFrames * 1000) / data.episode.fps,
);
const toleranceMs = Math.max(
  1000,
  Math.ceil((2 * 1000) / data.episode.fps),
);
const inspection = await inspectSpecMedia(previewPath, {
  codec: "h264",
  pixelFormat: "yuv420p",
  fps: data.episode.fps,
  width: Math.round(data.episode.width * 0.5),
  height: Math.round(data.episode.height * 0.5),
  audioCodec: "aac",
  sampleRate: 48000,
  channels: 2,
  videoStreams: 1,
  audioStreams: 1,
  durationMs: expectedDurationMs,
  toleranceMs,
  requireNonSilentAudio: true,
});

const report = {
  status: inspection.status,
  inspectedAt: new Date().toISOString(),
  episodeId: spec.episode.id,
  inputSpecPath: input,
  inputSpecSha256: sha256,
  productionPath,
  previewPath,
  expected: {
    codec: "h264",
    pixelFormat: "yuv420p",
    fps: data.episode.fps,
    width: Math.round(data.episode.width * 0.5),
    height: Math.round(data.episode.height * 0.5),
    audioCodec: "aac",
    sampleRate: 48000,
    channels: 2,
    durationMs: expectedDurationMs,
    toleranceMs,
  },
  inspection,
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (inspection.status !== "valid") {
  throw new Error(
    `preview inspection failed: ${inspection.status}; report=${outputPath}`,
  );
}

const technical = JSON.parse(
  await readFile(technicalPath, "utf8"),
) as Record<string, unknown>;
await writeFile(
  technicalPath,
  `${JSON.stringify({...technical, previewInspection: report}, null, 2)}\n`,
  "utf8",
);

console.log(`preview inspection valid: ${outputPath}`);
