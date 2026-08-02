import {
  episodeV1Schema,
  type EpisodeSceneV1,
  type ExpressionName,
  type VisualMode,
} from "../schemas/episode-v1";
import {createProvisionalTimeline} from "../timeline/episode-timeline";

const modeSets: VisualMode[][] = [
  ["結論カード", "数字比較"],
  ["タイムライン", "テキスト中心表示"],
  ["数字比較", "ニュース映像"],
  ["Expected / Actual / Gap"],
  ["因果図・供給網図"],
  ["タイムライン", "チャート", "数字比較"],
  ["銘柄比較"],
  ["検証ポイント"],
  ["テキスト中心表示"],
];

const expressions: ExpressionName[] = [
  "分析",
  "ニヤリ",
  "分析",
  "分析",
  "分析",
  "分析",
  "分析",
  "警戒",
  "眠そう",
];

const scenes: EpisodeSceneV1[] = modeSets.map((visualModes, index) => {
  const number = index + 1;
  return {
    id: `scene-0${number}`,
    number,
    name: `Scene ${number}プレビュー`,
    purpose: "データ駆動Sceneのプレビュー",
    estimatedDurationSeconds: 10,
    durationInFrames: 300,
    durationSource: "production-package-estimate-provisional",
    causalScope: "プレビュー",
    performanceIntent: "レイアウトを確認する",
    expression: expressions[index],
    expressionSwitches: [],
    visualModes,
    transitionText: "プレビュー用の接続文",
    narration: {
      displayText: "プレビュー用のナレーションです。",
      speechText: "プレビュー用のナレーションです。",
    },
    sourceAttribution: "プレビュー用データ",
    headline: `画面モード ${visualModes.join("＋")}`,
    supportingTexts: ["補助表示A", "補助表示B", "補助表示C"],
    numbers: ["確認値 1／確認値 2"],
    visualInstructions: "データから画面を構成する",
    evidence: ["プレビュー用データ"],
    expectedBasis:
      number === 4
        ? {
            expected: "公式コンセンサス未確認",
            category: "主要報道・アナリスト見解",
            concreteBasis: "プレビュー用根拠",
            attribution: "プレビュー用媒体",
            actual: "確認済みの内容",
            gap: "確認できた変化",
          }
        : null,
    timelineBasis:
      number === 2 || number === 6 ? "プレビュー用の時系列根拠" : null,
    uncertainty: "プレビュー用データのため市場判断には使用しない",
  };
});

export const defaultEpisodeV1 = episodeV1Schema.parse({
  schemaVersion: "1.0.0",
  source: {
    packagePath: "samples/default-v1",
    packageSha256: "0".repeat(64),
    generatedAt: "1970-01-01T00:00:00.000Z",
    converterVersion: "1.0.0",
  },
  episode: {
    id: "default-v1",
    date: "2000-01-01",
    targetSession: "preview",
    informationCutoff: "preview",
    episodeType: "画面モード確認用",
    targetIndices: ["preview"],
    targetDurationSeconds: 90,
    title: "9Sceneデータ駆動プレビュー",
    thumbnailText: "PREVIEW",
    width: 1920,
    height: 1080,
    fps: 30,
  },
  assets: {
    backgroundId: "mainBackground",
    assetManifestVersion: "1.0.0",
    foxExpressionMapVersion: "1.0.0",
  },
  scenes,
  timeline: createProvisionalTimeline(scenes),
});
