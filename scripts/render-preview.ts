import path from "node:path";
import {renderMedia} from "@remotion/renderer";
import {
  PROJECT_DIR,
  createBrowserLogMonitor,
  ensureDirectory,
  prepareV1Render,
  safeEpisodeId,
} from "./render-helpers";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("episode_data.final.jsonのパスが必要です");
}
const prepared = await prepareV1Render(inputPath);
if (prepared.episode.schemaVersion !== "1.1.0") {
  throw new Error("音声付きプレビューにはschemaVersion 1.1.0が必要です");
}
const outputDirectory = path.join(PROJECT_DIR, "renders", "preview");
await ensureDirectory(outputDirectory);
const outputLocation = path.join(
  outputDirectory,
  `${safeEpisodeId(prepared.episode.episode.id)}_nasdaq-cafe-preview.mp4`,
);
const browserLogs = createBrowserLogMonitor();
let lastReported = -1;
await renderMedia({
  composition: prepared.composition,
  serveUrl: prepared.serveUrl,
  codec: "h264",
  audioCodec: "aac",
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
  crf: 30,
  scale: 0.5,
  outputLocation,
  inputProps: prepared.inputProps,
  onBrowserLog: browserLogs.onBrowserLog,
  onProgress: ({progress}) => {
    const bucket = Math.floor(progress * 10) * 10;
    if (bucket !== lastReported) {
      lastReported = bucket;
      console.log(`低解像度プレビュー: ${Math.min(bucket, 100)}%`);
    }
  },
});
browserLogs.assertClean();
console.log(`低解像度プレビュー: ${outputLocation}`);
