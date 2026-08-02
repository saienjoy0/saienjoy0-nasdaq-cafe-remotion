import {fromMarkdown} from "mdast-util-from-markdown";
import assetManifestJson from "../../config/asset-manifest.json";
import {
  episodeV1Schema,
  expressionNameSchema,
  visualModeSchema,
  type EpisodeSceneV1,
  type EpisodeV1,
  type ExpressionName,
} from "../schemas/episode-v1";
import {foxExpressionMapVersion, resolveFoxExpression} from "../config/fox-expressions";
import {createProvisionalTimeline, timelineConfig} from "../timeline/episode-timeline";

type AstNode = {
  type: string;
  value?: string;
  depth?: number;
  children?: AstNode[];
  position?: {
    start: {offset?: number};
    end: {offset?: number};
  };
};

export type ParseContext = {
  packagePath: string;
  packageSha256: string;
  generatedAt: string;
};

export type ConversionReport = {
  status: "success";
  converterVersion: "1.0.0";
  generatedAt: string;
  source: {
    packagePath: string;
    packageSha256: string;
  };
  extracted: {
    episodeFields: string[];
    sceneCount: number;
    sceneNumbers: number[];
    sceneFields: string[];
    narrationCharacters: number[];
    expectedBasisScene: number;
    timelineBasisScenes: number[];
  };
  fallbacks: Array<{
    expression: ExpressionName;
    assetId: import("../config/fixed-assets").FoxAssetId;
    reason: string;
  }>;
  warnings: string[];
  errors: string[];
  unmappedSections: string[];
};

const converterVersion = "1.0.0" as const;

const toPlainText = (node: AstNode): string => {
  if (typeof node.value === "string") {
    return node.value;
  }
  if (!node.children) {
    return "";
  }
  return node.children.map(toPlainText).join("");
};

const isHeading = (node: AstNode, depth: number, text?: string) =>
  node.type === "heading" &&
  node.depth === depth &&
  (text === undefined || toPlainText(node).trim() === text);

const requireValue = (fields: Map<string, string>, label: string, scene?: number) => {
  const value = fields.get(label)?.trim();
  if (!value) {
    throw new Error(
      `${scene ? `Scene ${scene}の` : ""}必須項目「${label}」がありません`,
    );
  }
  return value;
};

const collectLabeledFields = (nodes: AstNode[], scope: string) => {
  const fields = new Map<string, string>();
  for (const node of nodes) {
    if (node.type !== "list" || !node.children) {
      continue;
    }
    for (const item of node.children) {
      const text = toPlainText(item).trim();
      const separator = text.indexOf("：");
      if (separator < 1) {
        continue;
      }
      const label = text.slice(0, separator).trim();
      const value = text.slice(separator + 1).trim();
      if (fields.has(label)) {
        throw new Error(`${scope}で項目「${label}」が重複しています`);
      }
      fields.set(label, value);
    }
  }
  return fields;
};

const findSection = (children: AstNode[], heading: string) => {
  const start = children.findIndex((node) => isHeading(node, 2, heading));
  if (start < 0) {
    throw new Error(`固定見出し「${heading}」がありません`);
  }
  const end = children.findIndex(
    (node, index) => index > start && node.type === "heading" && node.depth === 2,
  );
  return children.slice(start + 1, end < 0 ? children.length : end);
};

const findRecommendedText = (children: AstNode[], sectionHeading: string) => {
  const section = findSection(children, sectionHeading);
  const recommended = section.findIndex((node) => isHeading(node, 3, "推奨案"));
  if (recommended < 0) {
    throw new Error(`${sectionHeading}に固定見出し「推奨案」がありません`);
  }
  const paragraph = section.slice(recommended + 1).find((node) => node.type === "paragraph");
  const text = paragraph ? toPlainText(paragraph).trim() : "";
  if (!text) {
    throw new Error(`${sectionHeading}の推奨案が空です`);
  }
  return text;
};

const extractNarration = (markdown: string, nodes: AstNode[], sceneNumber: number) => {
  const headingIndex = nodes.findIndex((node) => isHeading(node, 3, "ナレーション"));
  if (headingIndex < 0) {
    throw new Error(`Scene ${sceneNumber}に固定見出し「ナレーション」がありません`);
  }

  const narrationNodes: AstNode[] = [];
  for (const node of nodes.slice(headingIndex + 1)) {
    if (node.type === "list" || node.type === "heading") {
      break;
    }
    if (node.type === "paragraph") {
      narrationNodes.push(node);
    }
  }
  if (narrationNodes.length === 0) {
    throw new Error(`Scene ${sceneNumber}のナレーションが空です`);
  }

  const start = narrationNodes[0].position?.start.offset;
  const end = narrationNodes.at(-1)?.position?.end.offset;
  if (start === undefined || end === undefined) {
    throw new Error(`Scene ${sceneNumber}のナレーション位置を取得できません`);
  }
  const narration = markdown.slice(start, end).trim();
  if (!narration) {
    throw new Error(`Scene ${sceneNumber}のナレーションが空です`);
  }
  return narration;
};

const parseDurationSeconds = (value: string, label: string) => {
  const minuteSecond = value.match(/^(?:約)?(?:(\d+)分)?(?:(\d+)秒)?/);
  const minutes = Number(minuteSecond?.[1] ?? 0);
  const seconds = Number(minuteSecond?.[2] ?? 0);
  const total = minutes * 60 + seconds;
  if (total <= 0) {
    throw new Error(`${label}から時間を抽出できません: ${value}`);
  }
  return total;
};

const parseExpressionSwitches = (value: string, sceneNumber: number) => {
  if (value === "なし") {
    return [];
  }
  const matches = [
    ...value.matchAll(
      /「([^」]+)」で(?:[^、。]*?から)?(通常|分析|ニヤリ|軽い驚き|困惑|警戒|眠そう)(?:へ切り替え)?/g,
    ),
  ];
  if (matches.length === 0) {
    throw new Error(
      `Scene ${sceneNumber}の表情切り替えを固定書式で解析できません: ${value}`,
    );
  }
  return matches.map((match) => ({
    triggerText: match[1],
    expression: expressionNameSchema.parse(match[2]),
    atMs: null,
  }));
};

const parseVisualModes = (value: string, sceneNumber: number) =>
  value.split("＋").map((mode) => {
    const parsed = visualModeSchema.safeParse(mode.trim());
    if (!parsed.success) {
      throw new Error(`Scene ${sceneNumber}の未知の画面モードです: ${mode}`);
    }
    return parsed.data;
  });

const splitSupportingTexts = (value: string) => {
  if (value.includes("／")) {
    return value
      .split("／")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (/①.+②.+③/.test(value)) {
    return [...value.matchAll(/([①②③④⑤⑥⑦⑧⑨])([^①②③④⑤⑥⑦⑧⑨]+)/g)].map(
      (match) => `${match[1]}${match[2].trim()}`,
    );
  }
  return [value.trim()];
};

const parseScene = (
  markdown: string,
  sceneHeading: AstNode,
  nodes: AstNode[],
): EpisodeSceneV1 => {
  const heading = toPlainText(sceneHeading).trim();
  const match = heading.match(/^Scene ([1-9])｜(.+)$/);
  if (!match) {
    throw new Error(`Scene見出しが固定書式ではありません: ${heading}`);
  }
  const number = Number(match[1]);
  const fields = collectLabeledFields(nodes, `Scene ${number}`);
  const estimatedDurationSeconds = parseDurationSeconds(
    requireValue(fields, "目安時間", number),
    `Scene ${number}の目安時間`,
  );
  const expression = expressionNameSchema.parse(
    requireValue(fields, "狐の表情", number),
  );

  let expectedBasis = null;
  if (number === 4) {
    const expectedCategory = requireValue(fields, "根拠区分", number);
    const repeatedCategory = requireValue(fields, "Expectedの根拠区分", number);
    if (expectedCategory !== repeatedCategory) {
      throw new Error(
        `Scene 4のExpected根拠区分が一致しません: ${expectedCategory} / ${repeatedCategory}`,
      );
    }
    expectedBasis = {
      expected: requireValue(fields, "Expected", number),
      category: expectedCategory,
      concreteBasis: requireValue(fields, "具体的な根拠", number),
      attribution: requireValue(fields, "ナレーションで示す主体・媒体", number),
      actual: requireValue(fields, "Actual", number),
      gap: requireValue(fields, "Gap", number),
    };
  }

  const timelineBasis = fields.get("時系列の根拠")?.trim() || null;
  if (number === 6 && !timelineBasis) {
    throw new Error("Scene 6の必須項目「時系列の根拠」がありません");
  }

  const narration = extractNarration(markdown, nodes, number);
  return {
    id: `scene-0${number}`,
    number,
    name: match[2].trim(),
    purpose: requireValue(fields, "目的", number),
    estimatedDurationSeconds,
    durationInFrames: estimatedDurationSeconds * timelineConfig.fps,
    durationSource: "production-package-estimate-provisional",
    causalScope: requireValue(fields, "因果の対象", number),
    performanceIntent: requireValue(fields, "狐の演技意図", number),
    expression,
    expressionSwitches: parseExpressionSwitches(
      requireValue(fields, "表情切り替え", number),
      number,
    ),
    visualModes: parseVisualModes(requireValue(fields, "画面モード", number), number),
    transitionText: requireValue(fields, "前後の接続文", number),
    narration: {displayText: narration, speechText: narration},
    sourceAttribution: requireValue(
      fields,
      "ナレーションで示す出典主体・媒体",
      number,
    ),
    headline: requireValue(fields, "大テロップ", number),
    supportingTexts: splitSupportingTexts(
      requireValue(fields, "補助テロップ", number),
    ),
    numbers: [requireValue(fields, "使用する数字", number)],
    visualInstructions: requireValue(fields, "画面で見せる内容", number),
    evidence: [requireValue(fields, "根拠となる情報源", number)],
    expectedBasis,
    timelineBasis,
    uncertainty: requireValue(fields, "不確実性・反対材料", number),
  };
};

export const parseEpisodePackage = (
  markdown: string,
  context: ParseContext,
): {episodeData: EpisodeV1; report: ConversionReport} => {
  const root = fromMarkdown(markdown) as unknown as {children: AstNode[]};
  const children = root.children;

  const topHeading = children.find((node) => isHeading(node, 1));
  const topText = topHeading ? toPlainText(topHeading).trim() : "";
  const titleDate = topText.match(/^朝のNASDAQカフェ｜(\d{4}-\d{2}-\d{2}) 制作パッケージ$/);
  if (!titleDate) {
    throw new Error(`H1が固定書式ではありません: ${topText || "(なし)"}`);
  }

  const overviewStart = children.findIndex((node) =>
    isHeading(node, 2, "A. エピソード概要"),
  );
  if (overviewStart < 0) {
    throw new Error("固定見出し「A. エピソード概要」がありません");
  }
  const overviewEnd = children.findIndex(
    (node, index) => index > overviewStart && node.type === "heading" && node.depth === 3,
  );
  const overviewFields = collectLabeledFields(
    children.slice(overviewStart + 1, overviewEnd),
    "エピソード概要",
  );

  const sceneHeadings = children
    .map((node, index) => ({node, index, text: toPlainText(node).trim()}))
    .filter(
      ({node, text}) =>
        node.type === "heading" && node.depth === 2 && /^Scene [1-9]｜/.test(text),
    );
  if (sceneHeadings.length !== 9) {
    throw new Error(`Scene 1〜9が必要です。検出: ${sceneHeadings.length}`);
  }

  const scenes = sceneHeadings.map(({node, index}, sceneIndex) => {
    const nextIndex = sceneHeadings[sceneIndex + 1]?.index;
    const sectionEnd =
      nextIndex ??
      children.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index &&
          candidate.type === "heading" &&
          candidate.depth === 2 &&
          /^C\./.test(toPlainText(candidate).trim()),
      );
    return parseScene(
      markdown,
      node,
      children.slice(index + 1, sectionEnd < 0 ? children.length : sectionEnd),
    );
  });

  scenes.forEach((scene, index) => {
    if (scene.number !== index + 1) {
      throw new Error(
        `Scene順が不正です。位置${index + 1}にScene ${scene.number}があります`,
      );
    }
  });

  const episodeDate = titleDate[1];
  const overviewDate = requireValue(overviewFields, "対象日").match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (overviewDate !== episodeDate) {
    throw new Error(`H1の日付${episodeDate}と対象日${overviewDate ?? "不明"}が一致しません`);
  }

  const targetDurationSeconds = parseDurationSeconds(
    requireValue(overviewFields, "目標尺"),
    "目標尺",
  );
  const targetIndices = requireValue(overviewFields, "対象指数")
    .split("、")
    .map((value) => value.trim())
    .filter(Boolean);
  const timeline = createProvisionalTimeline(scenes);

  const episodeData = episodeV1Schema.parse({
    schemaVersion: "1.0.0",
    source: {
      packagePath: context.packagePath,
      packageSha256: context.packageSha256,
      generatedAt: context.generatedAt,
      converterVersion,
    },
    episode: {
      id: episodeDate,
      date: episodeDate,
      targetSession: requireValue(overviewFields, "対象米国市場セッション"),
      informationCutoff: requireValue(overviewFields, "情報締切"),
      episodeType: requireValue(overviewFields, "エピソード種別"),
      targetIndices,
      targetDurationSeconds,
      title: findRecommendedText(children, "C. タイトル"),
      thumbnailText: findRecommendedText(children, "D. サムネイル文言"),
      width: 1920,
      height: 1080,
      fps: 30,
    },
    assets: {
      backgroundId: "mainBackground",
      assetManifestVersion: assetManifestJson.version,
      foxExpressionMapVersion,
    },
    scenes,
    timeline,
  });

  const requestedExpressions = new Set<ExpressionName>();
  for (const scene of scenes) {
    requestedExpressions.add(scene.expression);
    scene.expressionSwitches.forEach((item) => requestedExpressions.add(item.expression));
  }
  const fallbacks = [...requestedExpressions]
    .map((expression) => ({expression, mapping: resolveFoxExpression(expression)}))
    .filter(({mapping}) => mapping.fallback)
    .map(({expression, mapping}) => ({
      expression,
      assetId: mapping.assetId,
      reason: mapping.reason,
    }));

  const estimatedTotalSeconds = scenes.reduce(
    (sum, scene) => sum + scene.estimatedDurationSeconds,
    0,
  );
  const warnings: string[] = [];
  if (estimatedTotalSeconds !== targetDurationSeconds) {
    warnings.push(
      `Scene目安時間の合計${estimatedTotalSeconds}秒と目標尺${targetDurationSeconds}秒に${estimatedTotalSeconds - targetDurationSeconds}秒の差があります。仮尺は各Sceneの目安時間を優先しました。`,
    );
  }
  warnings.push(
    "外部ニュース映像・分足チャートは割り当てず、実在する固定素材と汎用図解だけを使用します。",
  );

  return {
    episodeData,
    report: {
      status: "success",
      converterVersion,
      generatedAt: context.generatedAt,
      source: {
        packagePath: context.packagePath,
        packageSha256: context.packageSha256,
      },
      extracted: {
        episodeFields: [
          "id",
          "date",
          "targetSession",
          "informationCutoff",
          "episodeType",
          "targetIndices",
          "targetDurationSeconds",
          "title",
          "thumbnailText",
        ],
        sceneCount: scenes.length,
        sceneNumbers: scenes.map((scene) => scene.number),
        sceneFields: [
          "purpose",
          "estimatedDurationSeconds",
          "causalScope",
          "performanceIntent",
          "expression",
          "expressionSwitches",
          "visualModes",
          "transitionText",
          "narration",
          "sourceAttribution",
          "headline",
          "supportingTexts",
          "numbers",
          "visualInstructions",
          "evidence",
          "expectedBasis",
          "timelineBasis",
          "uncertainty",
        ],
        narrationCharacters: scenes.map(
          (scene) => scene.narration.displayText.length,
        ),
        expectedBasisScene: 4,
        timelineBasisScenes: scenes
          .filter((scene) => scene.timelineBasis !== null)
          .map((scene) => scene.number),
      },
      fallbacks,
      warnings,
      errors: [],
      unmappedSections: [
        "E. 概要欄",
        "F. 制作上の注意",
        "G. 使用情報源",
        "04 興味深さ・わかりやすさ審問結果",
      ],
    },
  };
};
