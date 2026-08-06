import {mkdir, readFile, writeFile, copyFile} from "node:fs/promises";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia} from "@remotion/renderer";
import {loadProductionData, loadRenderSpecForProduction} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {inspectSpecMedia} from "./spec-inspect";
import {parseVisualGrammarStageMode} from "../src/spec/visual-grammar-stage-mode";

const input = process.argv[2];
const mode = parseVisualGrammarStageMode(process.argv[3]);

if (!input) {
  throw new Error(
    "usage: render-visual-grammar-ab-preview <render_spec.json> <candidate|legacy>",
  );
}
if (process.env.VISUAL_GRAMMAR_AB_PREVIEW !== "1") {
  throw new Error(
    "Visual Grammar A/B rendering requires VISUAL_GRAMMAR_AB_PREVIEW=1",
  );
}
if (process.env.SPEC_TTS_CACHE_ONLY !== "1") {
  throw new Error(
    "Visual Grammar A/B rendering requires SPEC_TTS_CACHE_ONLY=1",
  );
}

const loaded = await loadRenderSpecForProduction(input);
const {spec, sha256} = loaded;
if (spec.schemaVersion !== "2.4.0") {
  throw new Error(
    `Visual Grammar A/B requires render_spec 2.4.0; got=${spec.schemaVersion}`,
  );
}

const workspace = path.join(PROJECT_DIR, "build", spec.episode.id);
const productionPath = path.join(workspace, "render_data.production.json");
const technicalPath = path.join(workspace, "technical_report.json");
const data = await loadProductionData(productionPath);
if (data.inputSpecSha256 !== sha256) {
  throw new Error(
    `production data spec SHA mismatch: ${data.inputSpecSha256} != ${sha256}`,
  );
}

const inputProps = {
  data,
  visualGrammarStageMode: mode,
};
const serveUrl = await bundle({
  entryPoint: path.join(PROJECT_DIR, "src", "index.ts"),
});
const compositions = await getCompositions(serveUrl, {inputProps});
const composition = compositions.find((item) => item.id === "NasdaqCafeSpec");
if (!composition) throw new Error("composition not found: NasdaqCafeSpec");

const outputDirectory = path.join(
  PROJECT_DIR,
  "renders",
  "visual-grammar-ab",
  spec.episode.id,
);
const modeWorkspace = path.join(
  workspace,
  "visual-grammar-ab",
  mode,
);
await mkdir(outputDirectory, {recursive: true});
await mkdir(modeWorkspace, {recursive: true});

const output = path.join(outputDirectory, `${mode}.mp4`);
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  outputLocation: output,
  codec: "h264",
  audioCodec: "aac",
  sampleRate: 48000,
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
  crf: 30,
  scale: 0.5,
});

const expectedDurationMs = Math.round(
  (data.timeline.totalDurationInFrames * 1000) / data.episode.fps,
);
const toleranceMs = Math.max(
  1000,
  Math.ceil((2 * 1000) / data.episode.fps),
);
const inspection = await inspectSpecMedia(output, {
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
const inspectionReport = {
  status: inspection.status,
  inspectedAt: new Date().toISOString(),
  episodeId: spec.episode.id,
  inputSpecPath: input,
  inputSpecSha256: sha256,
  visualGrammarStageMode: mode,
  finalAuthorized: false,
  previewPath: output,
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
const inspectionPath = path.join(modeWorkspace, "preview_inspection.json");
await writeFile(
  inspectionPath,
  `${JSON.stringify(inspectionReport, null, 2)}\n`,
  "utf8",
);
if (inspection.status !== "valid") {
  throw new Error(
    `Visual Grammar ${mode} Preview inspection failed: ${inspection.status}`,
  );
}

const baseTechnical = JSON.parse(
  await readFile(technicalPath, "utf8"),
) as Record<string, unknown>;
const technical = {
  ...baseTechnical,
  status: "preview-generated",
  abPreview: true,
  visualGrammarStageMode: mode,
  finalAuthorized: false,
  previewPath: output,
  previewInspection: inspectionReport,
};
const modeTechnicalPath = path.join(modeWorkspace, "technical_report.json");
await writeFile(
  modeTechnicalPath,
  `${JSON.stringify(technical, null, 2)}\n`,
  "utf8",
);
const modeProductionPath = path.join(
  modeWorkspace,
  "render_data.production.json",
);
await copyFile(productionPath, modeProductionPath);

console.log(
  JSON.stringify(
    {
      status: "preview-generated",
      episodeId: spec.episode.id,
      visualGrammarStageMode: mode,
      finalAuthorized: false,
      previewPath: output,
      technicalReportPath: modeTechnicalPath,
      inspectionPath,
      productionDataPath: modeProductionPath,
    },
    null,
    2,
  ),
);
