import path from "node:path";
import {copyFile, readFile, rm} from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {renderMedia} from "@remotion/renderer";
import {
  PROJECT_DIR,
  createBrowserLogMonitor,
  ensureDirectory,
  prepareRender,
  prepareV1Render,
  printRenderSummary,
  safeEpisodeId,
} from "./render-helpers";
import {resolveInputPath} from "./load-episode";

const inputPath = process.argv[2];
const execFileAsync = promisify(execFile);

if (!inputPath) {
  throw new Error(
    "入力JSONのパスが必要です。例: npm run render:episode -- /path/to/episode_data.json",
  );
}

const raw = JSON.parse(await readFile(resolveInputPath(inputPath), "utf8")) as {
  schemaVersion?: string;
};
const isFinal = raw.schemaVersion === "1.1.0";
const isV2 = raw.schemaVersion === "1.0.0" || isFinal;
const prepared = isV2
  ? await prepareV1Render(inputPath)
  : await prepareRender(inputPath);
const rendersDir = path.join(PROJECT_DIR, "renders", isFinal ? "final" : "");
await ensureDirectory(rendersDir);
const outputLocation = path.join(
  rendersDir,
  `${safeEpisodeId(prepared.episode.episode.id)}_nasdaq-cafe${isFinal ? "" : ""}.mp4`,
);

let lastReported = -1;
const browserLogs = createBrowserLogMonitor();
await renderMedia({
  composition: prepared.composition,
  serveUrl: prepared.serveUrl,
  codec: "h264",
  audioCodec: "aac",
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
  outputLocation,
  inputProps: prepared.inputProps,
  onBrowserLog: browserLogs.onBrowserLog,
  onProgress: ({progress}) => {
    const bucket = Math.floor(progress * 10) * 10;
    if (bucket !== lastReported) {
      lastReported = bucket;
      console.log(`レンダリング: ${Math.min(bucket, 100)}%`);
    }
  },
});

browserLogs.assertClean();
if (isFinal) {
  const compatibleOutput = `${outputLocation}.yuv420p.mp4`;
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-i",
      outputLocation,
      "-vf",
      "scale=in_range=full:out_range=tv,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-c:a",
      "copy",
      "-movflags",
      "+faststart",
      compatibleOutput,
    ],
    {windowsHide: true, maxBuffer: 16 * 1024 * 1024},
  );
  await copyFile(compatibleOutput, outputLocation);
  await rm(compatibleOutput);
  console.log(`最終MP4: ${outputLocation}`);
} else if (prepared.episode.schemaVersion === "1.0") {
  printRenderSummary(prepared.episode, outputLocation);
} else {
  console.log(`9Scene仮尺MP4: ${outputLocation}`);
}
