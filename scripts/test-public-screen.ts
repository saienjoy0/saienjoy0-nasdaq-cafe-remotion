import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const project = process.cwd();
const sources = await Promise.all(
  [
    "src/components/v2/EpisodeSceneV2.tsx",
    "src/components/v2/VisualModeRenderer.tsx",
    "src/components/v2/ReusableEntityCue.tsx",
    "src/components/spec/SpecVisualModes.tsx",
    "src/components/spec/SpecAssetLayer.tsx",
  ].map((file) => readFile(path.join(project, file), "utf8")),
);
const renderedSource = sources.join("\n");

for (const forbidden of [
  "AUDIO-MEASURED TIMELINE",
  "NO AUDIO / PROVISIONAL TIMELINE",
  "実測 ${",
  "仮尺 ${",
  "表示中 ${",
  "画面構成：",
  "expression.assetId",
  "NEWS VIDEO / NOT PROVIDED",
  "TEXT FALLBACK / CONFIRMED CONTENT",
  "INTRADAY CHART / NOT PROVIDED",
  "NUMBER FALLBACK / CONFIRMED VALUES",
  "ニュース映像は未割当",
  "分足チャートは未割当",
  "出典主体：",
]) {
  assert.equal(
    renderedSource.includes(forbidden),
    false,
    `視聴者向け画面に制作情報が残っています: ${forbidden}`,
  );
}

assert.match(renderedSource, /出典：/);
assert.doesNotMatch(renderedSource, /ここは未確認：/);
assert.doesNotMatch(renderedSource, /ProductionScene|RenderSpecScene|SceneRenderState/);
assert.match(renderedSource, /PublicMainContent|PublicPlacedAsset/);
console.log("PASS: 視聴者向け画面から制作・デバッグ表示を除去");
