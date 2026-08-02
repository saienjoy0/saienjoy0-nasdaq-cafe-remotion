import {readFile} from "node:fs/promises";
import path from "node:path";
import {renderStill} from "@remotion/renderer";
import {resolveInputPath} from "./load-episode";
import {
  PROJECT_DIR,
  createBrowserLogMonitor,
  ensureDirectory,
  prepareRender,
  prepareV1Render,
  safeEpisodeId,
} from "./render-helpers";

const inputPath = process.argv[2] ?? "samples/episode_data.sample.json";

const rawInput = JSON.parse(await readFile(resolveInputPath(inputPath), "utf8")) as {
  schemaVersion?: string;
};

const renderLegacyStills = async () => {
  const prepared = await prepareRender(inputPath);
  const outputDir = path.join(
    PROJECT_DIR,
    "renders",
    "stills",
    safeEpisodeId(prepared.episode.episode.id),
  );
  await ensureDirectory(outputDir);

  const stills = [
    {name: "01-conclusion", frame: 60},
    {name: "02-main-news", frame: 330},
    {name: "03-market-reaction", frame: 600},
    {name: "04-tickers", frame: 990},
    {name: "05-watch-points", frame: 1290},
  ] as const;
  const browserLogs = createBrowserLogMonitor();

  for (const still of stills) {
    const output = path.join(outputDir, `${still.name}.png`);
    await renderStill({
      composition: prepared.composition,
      serveUrl: prepared.serveUrl,
      output,
      frame: still.frame,
      imageFormat: "png",
      inputProps: prepared.inputProps,
      onBrowserLog: browserLogs.onBrowserLog,
    });
    console.log(`静止画: frame ${still.frame} -> ${output}`);
  }

  const fixedAssetDir = path.join(outputDir, "00-fixed-assets");
  await ensureDirectory(fixedAssetDir);
  for (const calibration of [
    {compositionId: "FixedAssetFoxNormal", name: "fox-normal"},
    {compositionId: "FixedAssetFoxSmirk", name: "fox-smirk"},
  ] as const) {
    const composition = prepared.compositions.find(
      (candidate) => candidate.id === calibration.compositionId,
    );
    if (!composition) {
      throw new Error(`校正用Compositionが見つかりません: ${calibration.compositionId}`);
    }
    const output = path.join(fixedAssetDir, `${calibration.name}.png`);
    await renderStill({
      composition,
      serveUrl: prepared.serveUrl,
      output,
      frame: 0,
      imageFormat: "png",
      onBrowserLog: browserLogs.onBrowserLog,
    });
    console.log(`固定素材校正: ${calibration.compositionId} -> ${output}`);
  }
  browserLogs.assertClean();
};

const renderV1Stills = async () => {
  const prepared = await prepareV1Render(inputPath);
  const outputDir = path.join(
    PROJECT_DIR,
    "renders",
    "stills",
    safeEpisodeId(prepared.episode.episode.id),
    rawInput.schemaVersion === "1.1.0" ? "final" : "v2",
  );
  await ensureDirectory(outputDir);
  const browserLogs = createBrowserLogMonitor();

  const renderV1Still = async ({
    frame,
    output,
    label,
  }: {
    frame: number;
    output: string;
    label: string;
  }) => {
    await renderStill({
      composition: prepared.composition,
      serveUrl: prepared.serveUrl,
      output,
      frame,
      imageFormat: "png",
      inputProps: prepared.inputProps,
      onBrowserLog: browserLogs.onBrowserLog,
    });
    console.log(`${label} / frame ${frame} -> ${output}`);
  };

  for (const [index, timelineScene] of prepared.episode.timeline.scenes.entries()) {
    const scene = prepared.episode.scenes[index];
    const representativeModeIndex = Math.floor(scene.visualModes.length / 2);
    const representativeLocalFrame = Math.min(
      scene.durationInFrames - 1,
      Math.floor(
        ((representativeModeIndex + 0.5) * scene.durationInFrames) /
          scene.visualModes.length,
      ),
    );
    const frame = timelineScene.startFrame + representativeLocalFrame;
    const output = path.join(
      outputDir,
      `${String(index + 1).padStart(2, "0")}-scene.png`,
    );
    await renderV1Still({
      frame,
      output,
      label: `9Scene静止画: Scene ${index + 1}`,
    });
  }

  const modeCheckDir = path.join(outputDir, "mode-checks");
  await ensureDirectory(modeCheckDir);
  for (const [sceneIndex, timelineScene] of prepared.episode.timeline.scenes.entries()) {
    const scene = prepared.episode.scenes[sceneIndex];
    if (scene.visualModes.length < 2) {
      continue;
    }
    for (const [modeIndex, mode] of scene.visualModes.entries()) {
      const localFrame = Math.min(
        scene.durationInFrames - 1,
        Math.floor(
          ((modeIndex + 0.5) * scene.durationInFrames) /
            scene.visualModes.length,
        ),
      );
      const frame = timelineScene.startFrame + localFrame;
      const output = path.join(
        modeCheckDir,
        `${String(scene.number).padStart(2, "0")}-mode-${String(modeIndex + 1).padStart(2, "0")}.png`,
      );
      await renderV1Still({
        frame,
        output,
        label: `複合モード確認: Scene ${scene.number} / ${modeIndex + 1}/${scene.visualModes.length} ${mode}`,
      });
    }
  }
  browserLogs.assertClean();
};

if (rawInput.schemaVersion === "1.0.0" || rawInput.schemaVersion === "1.1.0") {
  await renderV1Stills();
} else {
  await renderLegacyStills();
}
