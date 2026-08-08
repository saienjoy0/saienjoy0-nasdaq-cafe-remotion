import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {getEntityFocusPublicPoint} from "../src/components/spec/AdditionalVisualTemplates";

const project = process.cwd();
const sources = await Promise.all(
  [
    "src/components/v2/EpisodeSceneV2.tsx",
    "src/components/v2/VisualModeRenderer.tsx",
    "src/components/v2/ReusableEntityCue.tsx",
    "src/components/spec/SpecVisualModes.tsx",
    "src/components/spec/VisualTemplateRenderer.tsx",
    "src/components/spec/AdditionalVisualTemplates.tsx",
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
  "画面の論点",
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

assert.equal(getEntityFocusPublicPoint({
  texts: ["AMD", "CPUとGPUを設計する半導体会社"],
  primaryElement: "AMD企業カード",
  headline: "AMD -7.04%",
  entity: {subjectType: "company", displayName: "AMD", role: "CPUとGPUを設計する半導体会社", variant: "company"},
}), "AMD -7.04%", "machine-only AMD企業カード must fall back to the public scene headline");

assert.equal(getEntityFocusPublicPoint({
  texts: ["NVIDIA", "SpaceXがGPUを専属採用"],
  primaryElement: "NVIDIA企業カード",
  headline: "NVIDIA +3.43%",
  entity: {subjectType: "company", displayName: "NVIDIA", role: "AI向けGPU企業", variant: "company"},
}), "SpaceXがGPUを専属採用", "viewer text must outrank machine-only NVIDIA企業カード");

assert.equal(getEntityFocusPublicPoint({
  texts: ["AMD", "CPUとGPUを設計する半導体会社"],
  primaryElement: "大型顧客の獲得",
  headline: "AMD",
  entity: {subjectType: "company", displayName: "AMD", role: "CPUとGPUを設計する半導体会社", variant: "company"},
}), "大型顧客の獲得", "public primaryElement must remain usable");

console.log("PASS: 視聴者向け画面から制作・デバッグ表示を除去");
