import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import assetManifest from "../config/asset-manifest.json";
import expressionMap from "../config/fox-expression-map.json";
import {
  resolveActiveVisualMode,
  resolveActiveVisualModeIndex,
} from "../src/components/v2/VisualModeRenderer";
import {
  COMPOSITION_ID,
  DURATION_IN_FRAMES,
  FPS,
  HEIGHT,
  WIDTH,
} from "../src/config";
import {parseEpisodePackage} from "../src/parser/episode-package";
import {episodeDataSchema} from "../src/schemas/episode";
import {loadEpisode} from "./load-episode";
import {loadEpisodeV1} from "./load-episode-v1";
import {PROJECT_DIR} from "./render-helpers";

const sample = await loadEpisode(
  path.join(PROJECT_DIR, "samples", "episode_data.sample.json"),
);
assert.equal(sample.schemaVersion, "1.0");
assert.equal(COMPOSITION_ID, "NasdaqCafeEpisode");
assert.equal(WIDTH, 1920);
assert.equal(HEIGHT, 1080);
assert.equal(FPS, 30);
assert.equal(DURATION_IN_FRAMES, 1350);

const optionalMissing = await loadEpisode(
  path.join(PROJECT_DIR, "samples", "episode_data.optional-missing.json"),
);
assert.deepEqual(optionalMissing.marketReaction.items, []);
assert.deepEqual(optionalMissing.tickers, []);
assert.deepEqual(optionalMissing.watchPoints, []);
assert.equal(optionalMissing.host.name, "狐の大学生アナリスト");

const tooLong = {
  ...sample,
  episode: {...sample.episode, title: "長".repeat(49)},
};
const longResult = episodeDataSchema.safeParse(tooLong);
assert.equal(longResult.success, false);
if (!longResult.success) {
  assert.ok(
    longResult.error.issues.some(
      (issue) => issue.path.join(".") === "episode.title",
    ),
  );
}

const unclearTicker = episodeDataSchema.parse({
  ...sample,
  tickers: [
    {
      symbol: "TEST",
      change: "-0.1%",
      direction: "down",
      materialStatus: "unclear",
    },
  ],
});
assert.equal(unclearTicker.tickers[0].materialStatus, "unclear");
assert.equal(unclearTicker.tickers[0].reason, "");

assert.equal(assetManifest.provisional, false);
assert.equal(assetManifest.layout.enabled, true);

for (const assetId of Object.keys(assetManifest.assets) as Array<keyof typeof assetManifest.assets>) {
  const asset = assetManifest.assets[assetId];
  const filePath = path.join(PROJECT_DIR, "public", asset.path);
  const [file, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);

  assert.equal(file.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(file.readUInt32BE(16), asset.width);
  assert.equal(file.readUInt32BE(20), asset.height);
  const expectedColorType = asset.colorMode === "RGBA" ? 6 : 2;
  assert.equal(file[25], expectedColorType, `${assetId}のPNG color type`);
  assert.equal(asset.hasAlpha, asset.colorMode === "RGBA");
  assert.equal(asset.hasTransparentMargin, asset.role === "fox-expression");
  assert.equal(fileStat.size, asset.fileSizeBytes);
  assert.equal(createHash("sha256").update(file).digest("hex"), asset.sha256);
  assert.ok(Math.abs(asset.aspectRatio - asset.width / asset.height) < 0.000001);
  assert.equal(asset.role, assetId === "mainBackground" ? "background" : "fox-expression");
}

const registeredAssetIds = new Set<string>();
for (const requestedExpression of [
  "通常",
  "分析",
  "ニヤリ",
  "軽い驚き",
  "困惑",
  "警戒",
  "眠そう",
] as const) {
  const mapping = expressionMap.expressions[requestedExpression];
  assert.equal(mapping.requestedExpression, requestedExpression);
  assert.ok(mapping.assetId in assetManifest.assets);
  assert.equal(mapping.fallback, false);
  assert.equal(registeredAssetIds.has(mapping.assetId), false);
  registeredAssetIds.add(mapping.assetId);
  assert.ok(mapping.reason.length > 0);
}

const episodePackagePath = path.join(
  PROJECT_DIR,
  "episodes",
  "2026-07-10",
  "episode_package_2026-07-10.md",
);
const episodePackage = await readFile(episodePackagePath, "utf8");
const packageSha256 = createHash("sha256")
  .update(await readFile(episodePackagePath))
  .digest("hex");
const parsedPackage = parseEpisodePackage(episodePackage, {
  packagePath: "episodes/2026-07-10/episode_package_2026-07-10.md",
  packageSha256,
  generatedAt: "2026-07-10T00:00:00.000Z",
});
assert.deepEqual(
  parsedPackage.episodeData.scenes.map((scene) => scene.number),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
);
for (const scene of parsedPackage.episodeData.scenes) {
  assert.ok(episodePackage.includes(scene.narration.displayText));
  assert.equal(scene.narration.speechText, scene.narration.displayText);
}
assert.equal(
  parsedPackage.episodeData.scenes[3].expectedBasis?.category,
  "主要報道・アナリスト見解",
);
assert.equal(
  parsedPackage.episodeData.scenes[5].timelineBasis,
  "Reuters公開時刻・本文の順序説明。市場全体は終値と主要報道",
);
assert.equal(parsedPackage.episodeData.timeline.totalDurationInFrames, 14628);

const scene1 = parsedPackage.episodeData.scenes[0];
assert.equal(resolveActiveVisualMode(scene1, 0), "結論カード");
assert.equal(resolveActiveVisualMode(scene1, 374), "結論カード");
assert.equal(resolveActiveVisualMode(scene1, 375), "数字比較");
assert.equal(resolveActiveVisualMode(scene1, 749), "数字比較");

const scene3 = parsedPackage.episodeData.scenes[2];
assert.equal(resolveActiveVisualMode(scene3, 974), "数字比較");
assert.equal(resolveActiveVisualMode(scene3, 975), "ニュース映像");
assert.ok(scene3.supportingTexts.length > 0);

const scene6 = parsedPackage.episodeData.scenes[5];
assert.equal(resolveActiveVisualMode(scene6, 849), "タイムライン");
assert.equal(resolveActiveVisualMode(scene6, 850), "チャート");
assert.equal(resolveActiveVisualMode(scene6, 1699), "チャート");
assert.equal(resolveActiveVisualMode(scene6, 1700), "数字比較");
assert.ok(scene6.numbers.length > 0);

assert.equal(
  resolveActiveVisualModeIndex({frame: -1, durationInFrames: 10, modeCount: 3}),
  0,
);
assert.equal(
  resolveActiveVisualModeIndex({frame: 99, durationInFrames: 10, modeCount: 3}),
  2,
);
assert.throws(() =>
  resolveActiveVisualModeIndex({frame: 0, durationInFrames: 0, modeCount: 1}),
);

const scene8 = parsedPackage.episodeData.scenes[7];
assert.equal(scene8.visualModes[0], "検証ポイント");
assert.equal(scene8.supportingTexts.length, 3);
assert.deepEqual(scene8.supportingTexts, [
  "①Metaの相対強度",
  "②供給網の反応差",
  "③原油・米10年",
]);

for (const [index, timelineScene] of parsedPackage.episodeData.timeline.scenes.entries()) {
  const scene = parsedPackage.episodeData.scenes[index];
  const previous = parsedPackage.episodeData.timeline.scenes[index - 1];
  const expectedStart =
    index === 0
      ? 0
      : previous.endFrame + 1 - previous.transitionFramesAfter;
  assert.equal(timelineScene.sceneId, scene.id);
  assert.equal(timelineScene.startFrame, expectedStart);
  assert.equal(
    timelineScene.endFrame,
    timelineScene.startFrame + scene.durationInFrames - 1,
  );
  assert.equal(timelineScene.durationInFrames, scene.durationInFrames);
  assert.equal(timelineScene.transitionFramesAfter, index === 8 ? 0 : 9);
}

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "nasdaq-cafe-remotion-test-"),
);
try {
  const mismatchedHashPath = path.join(
    temporaryDirectory,
    "episode_data.hash-mismatch.json",
  );
  await writeFile(
    mismatchedHashPath,
    JSON.stringify({
      ...parsedPackage.episodeData,
      source: {
        ...parsedPackage.episodeData.source,
        packageSha256: "0".repeat(64),
      },
    }),
    "utf8",
  );
  await assert.rejects(
    () => loadEpisodeV1(mismatchedHashPath),
    /元MarkdownのSHA-256がJSONと一致しません/,
  );
} finally {
  await rm(temporaryDirectory, {recursive: true, force: true});
}

assert.throws(() =>
  parseEpisodePackage(
    episodePackage.replace("## Scene 4｜市場は何を期待していた？", "## 市場は何を期待していた？"),
    {
      packagePath: "missing-scene.md",
      packageSha256,
      generatedAt: "2026-07-10T00:00:00.000Z",
    },
  ),
);
assert.throws(() =>
  parseEpisodePackage(
    episodePackage.replace("### ナレーション", "### 読み上げ"),
    {
      packagePath: "missing-narration.md",
      packageSha256,
      generatedAt: "2026-07-10T00:00:00.000Z",
    },
  ),
);
assert.throws(() =>
  parseEpisodePackage(
    episodePackage.replace("## Scene 9｜いってらっしゃい、おやすみ", "## Scene 8｜いってらっしゃい、おやすみ"),
    {
      packagePath: "duplicate-scene.md",
      packageSha256,
      generatedAt: "2026-07-10T00:00:00.000Z",
    },
  ),
);
assert.throws(() =>
  parseEpisodePackage(
    episodePackage.replace("結論カード＋数字比較", "未知画面＋数字比較"),
    {
      packagePath: "unknown-mode.md",
      packageSha256,
      generatedAt: "2026-07-10T00:00:00.000Z",
    },
  ),
);

console.log("PASS: サンプルJSONの検証");
console.log("PASS: optional項目欠損時の既定値");
console.log("PASS: 長すぎる日本語（episode.title 49文字）の検知");
console.log("PASS: 不明材料をunclearのまま保持");
console.log("PASS: 固定8素材のPNG寸法・RGB・容量・SHA-256");
console.log("PASS: 7表情の一対一明示マッピングとfallback:false");
console.log("PASS: 制作パッケージからScene 1〜9と原文ナレーションを抽出");
console.log("PASS: Scene 4 Expected根拠区分とScene 6時系列根拠");
console.log("PASS: 複合画面モードのフレーム境界とニュース・チャートフォールバック入力");
console.log("PASS: Scene 8の三つの検証カード入力");
console.log("PASS: 9Scene TimelineのID・順序・開始終了・トランジション・全体尺");
console.log("PASS: 元MarkdownのSHA-256不一致時に正式JSON読込を停止");
console.log("PASS: 既存5Scene CompositionのID・解像度・fps・1350フレームを維持");
console.log("PASS: Scene欠落・ナレーション見出し違い・重複・未知画面モードを拒否");
