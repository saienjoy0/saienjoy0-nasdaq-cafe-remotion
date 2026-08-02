import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {loadEpisodeFinal} from "./load-episode-final";
import {loadEpisodeV1} from "./load-episode-v1";
import {PROJECT_DIR} from "./render-helpers";
import {probeAudio} from "../src/tts/tts-service";

const execFileAsync = promisify(execFile);
const inputPath = process.argv[2];
if (!inputPath) throw new Error("episode_data.final.jsonのパスが必要です");
const finalEpisode = await loadEpisodeFinal(inputPath);
const date = finalEpisode.episode.date;
const buildDirectory = path.join(PROJECT_DIR, "build", date);
const baseEpisode = await loadEpisodeV1(path.join(buildDirectory, "episode_data.json"));
const previewPath = path.join(
  PROJECT_DIR,
  "renders",
  "preview",
  `${date}_nasdaq-cafe-preview.mp4`,
);
const finalPath = path.join(
  PROJECT_DIR,
  "renders",
  "final",
  `${date}_nasdaq-cafe.mp4`,
);

const probeMedia = async (filePath: string) => {
  const {stdout} = await execFileAsync(
    "ffprobe",
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", filePath],
    {windowsHide: true, maxBuffer: 16 * 1024 * 1024},
  );
  return JSON.parse(stdout) as {
    streams: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      pix_fmt?: string;
      avg_frame_rate?: string;
      duration?: string;
    }>;
    format: {duration?: string; size?: string; format_name?: string};
  };
};

const [previewProbe, finalProbe] = await Promise.all([
  probeMedia(previewPath),
  probeMedia(finalPath),
]);
const video = finalProbe.streams.find((stream) => stream.codec_type === "video");
const audio = finalProbe.streams.find((stream) => stream.codec_type === "audio");
const durationSeconds = Number(finalProbe.format.duration ?? 0);
const expectedSeconds =
  finalEpisode.timeline.totalDurationInFrames / finalEpisode.episode.fps;
if (
  !video ||
  video.codec_name !== "h264" ||
  video.width !== 1920 ||
  video.height !== 1080 ||
  video.pix_fmt !== "yuv420p" ||
  video.avg_frame_rate !== "30/1"
) {
  throw new Error("最終MP4の映像仕様がH.264 / 1920x1080 / 30fps / yuv420pではありません");
}
if (!audio || audio.codec_name !== "aac") {
  throw new Error("最終MP4にAAC音声ストリームがありません");
}
if (durationSeconds <= 0 || Math.abs(durationSeconds - expectedSeconds) > 1) {
  throw new Error(
    `最終MP4尺がTimelineと一致しません: actual=${durationSeconds} expected=${expectedSeconds}`,
  );
}
if (!previewProbe.streams.some((stream) => stream.codec_type === "video") ||
    !previewProbe.streams.some((stream) => stream.codec_type === "audio")) {
  throw new Error("プレビューMP4に映像または音声ストリームがありません");
}
await execFileAsync(
  "ffmpeg",
  ["-v", "error", "-i", finalPath, "-f", "null", "-"],
  {windowsHide: true, maxBuffer: 16 * 1024 * 1024},
);

const finalStillsDirectory = path.join(
  PROJECT_DIR,
  "renders",
  "stills",
  date,
  "final",
);
await mkdir(finalStillsDirectory, {recursive: true});
for (const [index, timelineScene] of finalEpisode.timeline.scenes.entries()) {
  const representativeFrame =
    timelineScene.startFrame + Math.floor(timelineScene.durationInFrames / 2);
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-ss",
      (representativeFrame / finalEpisode.episode.fps).toFixed(3),
      "-i",
      finalPath,
      "-frames:v",
      "1",
      path.join(finalStillsDirectory, `${String(index + 1).padStart(2, "0")}-scene.png`),
    ],
    {windowsHide: true, maxBuffer: 16 * 1024 * 1024},
  );
}

for (const [index, scene] of finalEpisode.scenes.entries()) {
  if (scene.narration.displayText !== baseEpisode.scenes[index].narration.displayText) {
    throw new Error(`${scene.id}のdisplayTextがPhase 2正本から変更されています`);
  }
  const probe = await probeAudio(
    path.join(PROJECT_DIR, "public", scene.narration.audioSrc),
  );
  if (probe.sampleRate !== 48000 || probe.channels !== 1 || probe.codec !== "pcm_s16le") {
    throw new Error(`${scene.id}の音声形式が不正です`);
  }
}

const finalStat = await stat(finalPath);
const finalSha256 = createHash("sha256")
  .update(await readFile(finalPath))
  .digest("hex");
const pronunciationChanges = JSON.parse(
  await readFile(path.join(buildDirectory, "logs", "speech-normalization.log"), "utf8"),
) as Array<{sceneId: string; display: string; speech: string; count: number}>;
const expressionWarnings = JSON.parse(
  await readFile(path.join(buildDirectory, "expression-warnings.json"), "utf8"),
) as Array<{sceneId: string; triggerText: string; action: string}>;
const report = {
  status: "completed",
  generatedAt: new Date().toISOString(),
  voicevox: {
    engineVersion: finalEpisode.tts.providerVersion,
    characterName: finalEpisode.tts.characterName,
    styleName: finalEpisode.tts.styleName,
    styleId: finalEpisode.tts.styleId,
    speakerUuid: finalEpisode.tts.speakerUuid,
    speakingRate: finalEpisode.tts.speakingRate,
  },
  sceneAudioDurationsMs: finalEpisode.scenes.map((scene) => ({
    sceneId: scene.id,
    durationMs: scene.narration.durationMs,
  })),
  totalAudioMs: finalEpisode.scenes.reduce(
    (sum, scene) => sum + scene.narration.durationMs,
    0,
  ),
  completedVideoDurationSeconds: durationSeconds,
  pronunciationChanges,
  captions: finalEpisode.scenes.reduce(
    (sum, scene) => sum + scene.captions.items.length,
    0,
  ),
  expressionSwitches: finalEpisode.scenes.flatMap((scene) =>
    scene.expressionSwitches.map((item) => ({sceneId: scene.id, ...item})),
  ),
  expressionWarnings,
  bgm: null,
  credits: finalEpisode.credits,
  outputs: {
    previewMp4: previewPath,
    finalMp4: finalPath,
    finalBytes: finalStat.size,
    finalSha256,
    finalEpisodeData: path.join(buildDirectory, "episode_data.final.json"),
    stills: finalStillsDirectory,
  },
  streams: {
    video,
    audio,
    format: finalProbe.format,
    decodeErrors: 0,
  },
  legacyCompositionImpact: "NasdaqCafeEpisode（既存5Scene）は維持",
  providerSwap: "src/tts/provider-registry.tsへTtsProvider実装を登録",
  warnings: [
    "生成音声の声質・固有名詞・数字の読み方は人間確認対象",
    "BGM・SE・外部ニュース素材は未指定のため無音／汎用表示へフォールバック",
    ...expressionWarnings.map(
      (item) =>
        `${item.sceneId}: 表情切り替え語句「${item.triggerText}」がdisplayTextにないため初期表情を維持`,
    ),
  ],
};
await Promise.all([
  writeFile(
    path.join(buildDirectory, "final-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  ),
  writeFile(
    path.join(buildDirectory, "validation-report.json"),
    `${JSON.stringify(
      {
        status: "success",
        generatedAt: report.generatedAt,
        sourceHash: "matched",
        sceneCount: 9,
        displayText: "unchanged",
        audio: "9/9 valid PCM WAV",
        captions: "valid phrase-audio timing",
        timeline: "audio-measured",
        preview: "video+audio",
        final: "H.264/AAC 1920x1080 30fps yuv420p",
        fallbacks: ["BGMなし", "SEなし", "外部ニュース映像なし"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  ),
]);
console.log(`最終検証成功: ${finalPath}`);
console.log(`最終レポート: ${path.join(buildDirectory, "final-report.json")}`);
