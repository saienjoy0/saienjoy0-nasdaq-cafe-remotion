import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import type {RenderSpec, RenderSpecScene} from "../src/spec/render-spec";
import {renderSpecSchema} from "../src/spec/render-spec";
import {PROJECT_DIR} from "./render-helpers";

const expressions = ["通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう"] as const;
type FixtureExpression = (typeof expressions)[number];
const expressionAssetIds: Record<FixtureExpression, string> = {
  "通常": "foxNormal",
  "分析": "foxAnalysis",
  "ニヤリ": "foxSmirk",
  "軽い驚き": "foxSlightSurprise",
  "困惑": "foxConfused",
  "警戒": "foxAlert",
  "眠そう": "foxSleepy",
};
const renderableSceneExpressions: readonly (readonly FixtureExpression[])[] = [
  ["通常", "分析", "ニヤリ", "軽い驚き"],
  ["困惑", "警戒"],
  ["分析", "困惑"],
  ["警戒", "通常"],
  ["ニヤリ", "分析"],
  ["分析", "警戒"],
  ["困惑", "通常"],
  ["警戒", "分析"],
  ["眠そう", "ニヤリ", "眠そう"],
];
const modes = [
  "conclusion-card", "number-comparison", "expected-actual-gap", "timeline",
  "chart", "causal-diagram", "stock-comparison", "verification-points", "text-focus",
] as const;
const templateForMode = {
  "conclusion-card": "conclusion-card",
  "number-comparison": "metric-comparison-board",
  "expected-actual-gap": "expected-actual-gap-flow",
  timeline: "evidence-boundary",
  chart: "metric-comparison-board",
  "causal-diagram": "causal-lane",
  "stock-comparison": "diverging-stock-bars",
  "verification-points": "verification-checklist",
  "text-focus": "text-focus",
} as const;

const sceneRole = (index: number): RenderSpecScene["sceneRole"] =>
  index === 0
    ? "opening-hook-market-direction-greeting-conclusion"
    : index === 8
      ? "closing-recap-sendoff-goodnight"
      : "editorial-body";

type FixtureKind = "minimal" | "schema" | "renderable";
const makeScene = (index: number, kind: FixtureKind): RenderSpecScene => {
  const complete = kind !== "minimal";
  const renderable = kind === "renderable";
  const number = index + 1;
  const sceneId = `scene-${String(number).padStart(2, "0")}` as RenderSpecScene["sceneId"];
  const mode = complete ? modes[index] : "text-focus";
  const chunkCount = complete ? (index === 0 ? 4 : index === 8 ? 3 : 2) : 1;
  const narrationChunks = Array.from({length: chunkCount}, (_, chunkIndex) => ({
    chunkId: `${sceneId}-chunk-${String(chunkIndex + 1).padStart(3, "0")}`,
    speechText:
      index === 0
        ? ["TEST OPENING HOOK。", "TEST INDEX DIRECTION。", "TEST SHORT GREETING。", "TEST CENTRAL CONCLUSION。"][chunkIndex]
        : index === 8
          ? ["TEST SHORT RECAP。", "いってらっしゃい。", "狐側のおやすみなさい。"][chunkIndex]
          : `TEST SCENE ${number} SPEECH ${chunkIndex + 1}。`,
    captionText:
      index === 0
        ? ["TEST OPENING HOOK", "TEST INDEX DIRECTION", "TEST SHORT GREETING", "TEST CENTRAL CONCLUSION"][chunkIndex]
        : index === 8
          ? ["TEST SHORT RECAP", "いってらっしゃい", "狐側のおやすみなさい"][chunkIndex]
          : `TEST SCENE ${number} CAPTION ${chunkIndex + 1}`,
    expression: renderable
      ? renderableSceneExpressions[index][chunkIndex]
      : chunkIndex === 0 ? "通常" : expressions[(index + chunkIndex) % expressions.length],
    pauseAfterMs: chunkIndex === chunkCount - 1 ? 200 : 100,
  }));
  const baseCard = {cardId: `${sceneId}-card-001`, role: null, title: `TEST CARD ${number}`, lines: [{label: "TEST LABEL", value: "TEST VALUE", tone: "neutral" as const}]};
  const cards: RenderSpecScene["cards"] = mode === "expected-actual-gap"
    ? [
        {...baseCard, role: "gap" as const, title: "TEST GAP"},
        {...baseCard, cardId: `${sceneId}-card-002`, role: "expected" as const, title: "TEST EXPECTED"},
        {...baseCard, cardId: `${sceneId}-card-003`, role: "actual" as const, title: "TEST ACTUAL"},
      ]
    : mode === "conclusion-card" || mode === "verification-points" || complete
      ? [baseCard]
      : [];
  if (mode === "verification-points") cards.push({...baseCard, cardId: `${sceneId}-card-002`, title: "TEST VERIFY 2"}, {...baseCard, cardId: `${sceneId}-card-003`, title: "TEST VERIFY 3"});
  const numbers: RenderSpecScene["numbers"] = mode === "number-comparison" || mode === "stock-comparison"
    ? [
        {numberId: `${sceneId}-number-001`, label: "TEST NUMBER A", value: "10", unit: "%", comparison: "TEST BASE", tone: "positive"},
        {numberId: `${sceneId}-number-002`, label: "TEST NUMBER B", value: "-20", unit: "%", comparison: "TEST BASE", tone: "negative"},
      ]
    : mode === "chart"
      ? [
          {numberId: `${sceneId}-number-001`, label: "TEST CHART VALUE A", value: "30", unit: "pt", comparison: "TEST BASE", tone: "emphasis"},
          {numberId: `${sceneId}-number-002`, label: "TEST CHART VALUE B", value: "20", unit: "pt", comparison: "TEST BASE", tone: "neutral"},
        ]
      : [];
  if (mode === "stock-comparison") numbers.push({numberId: `${sceneId}-number-003`, label: "TEST NUMBER C", value: "30", unit: "%", comparison: "TEST BASE", tone: "warning"});
  const nodes = mode === "causal-diagram" ? [{nodeId: `${sceneId}-node-001`, label: "TEST NODE A"}, {nodeId: `${sceneId}-node-002`, label: "TEST NODE B"}] : [];
  const arrows = mode === "causal-diagram" ? [{arrowId: `${sceneId}-arrow-001`, fromNodeId: nodes[0].nodeId, toNodeId: nodes[1].nodeId, label: "TEST ARROW"}] : [];
  const objectTarget = cards[0]?.cardId ?? numbers[0]?.numberId ?? nodes[0]?.nodeId;
  const objectIds = [
    ...cards.map((card) => card.cardId),
    ...numbers.map((item) => item.numberId),
    ...nodes.map((node) => node.nodeId),
    ...arrows.map((arrow) => arrow.arrowId),
  ];
  const events: RenderSpecScene["visualEvents"] = objectTarget
    ? [{eventId: `event-${String(index * 3 + 1).padStart(3, "0")}`, atChunkId: narrationChunks[0].chunkId, timing: "chunk-start", action: "show", targetId: objectTarget, offsetMs: 0, expression: null}]
    : [];
  if (complete && chunkCount > 1) {
    events.push({eventId: `event-${String(index * 3 + 2).padStart(3, "0")}`, atChunkId: narrationChunks[1].chunkId, timing: "chunk-start", action: "set-expression", targetId: null, offsetMs: 0, expression: renderable ? renderableSceneExpressions[index][1] : expressions[(index + 2) % expressions.length]});
    if (objectTarget) events.push({eventId: `event-${String(index * 3 + 3).padStart(3, "0")}`, atChunkId: narrationChunks[1].chunkId, timing: "chunk-end", action: "highlight", targetId: objectTarget, offsetMs: 0, expression: null});
  }
  const entityPlacementId = `${sceneId}-placement-entity`;
  const assetPlacements: RenderSpecScene["assetPlacements"] = [
    {placementId: `${sceneId}-placement-background`, assetId: "mainBackground", role: "background", region: "full-canvas", fit: "cover", opacity: 1, startChunkId: null, endChunkId: null},
    ...expressions.map((expression) => ({
      placementId: `${sceneId}-placement-${expressionAssetIds[expression]}`,
      assetId: expressionAssetIds[expression],
      role: "fox-expression" as const,
      region: "fox-left" as const,
      fit: "contain" as const,
      opacity: 1,
      startChunkId: null,
      endChunkId: null,
    })),
    ...(complete && index === 0 ? [{
      placementId: entityPlacementId,
      assetId: "company_nvda",
      role: "entity-card" as const,
      region: "main-stage" as const,
      fit: "contain" as const,
      opacity: 1,
      startChunkId: narrationChunks[1].chunkId,
      endChunkId: narrationChunks[1].chunkId,
    }] : []),
  ];
  const defaultScreenState = (["timeline", "chart", "causal-diagram", "stock-comparison"] as const).includes(mode as "timeline" | "chart" | "causal-diagram" | "stock-comparison")
    ? "Chart" as const
    : "Data" as const;
  const makeBeat = (
    beatNumber: number,
    startIndex: number,
    endIndex: number,
    values: Partial<RenderSpecScene["visualBeats"][number]> = {},
  ): RenderSpecScene["visualBeats"][number] => ({
    beatId: `${sceneId}-beat-${String(beatNumber).padStart(3, "0")}`,
    startChunkId: narrationChunks[startIndex].chunkId,
    endChunkId: narrationChunks[endIndex].chunkId,
    narrationStartCue: narrationChunks[startIndex].speechText,
    narrationEndCue: narrationChunks[endIndex].speechText,
    primaryFunction: "Explain",
    screenState: defaultScreenState,
    visualMode: mode,
    visualTemplate: templateForMode[mode],
    templateConfig: {
      variant: mode === "causal-diagram" ? "left-to-right" : mode === "stock-comparison" ? "center-zero" : "default",
      comparisonBasis: ["number-comparison", "chart", "stock-comparison"].includes(mode) ? `TEST BASIS ${number}-${beatNumber}` : null,
      dataBasis: "TEST TIMELINE BASIS",
      nodeOrder: mode === "causal-diagram" ? nodes.map((node) => node.nodeId) : [],
      laneLabels: [],
      outcomeNodeId: null,
    },
    contentType: `TEST ${mode}`,
    screenQuestion: `TEST QUESTION ${number}-${beatNumber}`,
    primaryElement: `TEST PRIMARY ${number}-${beatNumber}`,
    viewerTexts: [`TEST VIEWER TEXT ${number}-${beatNumber}`],
    changeCue: narrationChunks[startIndex].captionText,
    objectIds,
    assetPlacementIds: [],
    assetState: "not-required",
    returnScreenState: null,
    evidenceSourceIds: ["source-001"],
    expressionChange: null,
    fallback: null,
    entity: null,
    pictureBook: null,
    ...values,
  });
  const visualBeats: RenderSpecScene["visualBeats"] = complete && index === 0
    ? [
        makeBeat(1, 0, 0),
        makeBeat(2, 1, 1, {
          primaryFunction: "Anchor",
          screenState: "EntityFocus",
          visualMode: "text-focus",
          visualTemplate: "entity-card-full",
          templateConfig: {variant: "prebuilt-card", comparisonBasis: null, dataBasis: "TEST TIMELINE BASIS", nodeOrder: [], laneLabels: [], outcomeNodeId: null},
          contentType: "TEST COMPANY CARD",
          primaryElement: "NVIDIA",
          viewerTexts: ["AI計算向け半導体"],
          objectIds: [],
          assetPlacementIds: [entityPlacementId],
          assetState: "ready",
          returnScreenState: "Data",
          entity: {
            subjectType: "company",
            displayName: "NVIDIA",
            role: "AI計算向け半導体",
            firstMentionCue: narrationChunks[1].captionText,
            variant: "company",
            assetId: "company_nvda",
            rightsStatus: "not-required",
            targetDurationMs: 6_000,
          },
        }),
        makeBeat(3, 2, 3),
      ]
    : [makeBeat(1, 0, chunkCount - 1)];
  return {
    sceneId,
    sceneNumber: number,
    sceneRole: sceneRole(index),
    formalName: `TEST SCENE ${number}`,
    purpose: index === 0 ? "TEST OPENING INTEGRATED PURPOSE" : index === 8 ? "TEST FIXED CLOSING PURPOSE" : `TEST PURPOSE ${number}`,
    causalScope: index === 0 || index === 8 ? "nasdaq" : "multiple",
    performanceIntent: `TEST PERFORMANCE ${number}`,
    evidenceSourceIds: ["source-001"],
    uncertainty: "TEST UNCERTAINTY",
    timelineBasis: "TEST TIMELINE BASIS",
    expectedBasisType: "major-reporting",
    visualMode: mode,
    initialExpression: renderable ? renderableSceneExpressions[index][0] : "通常",
    headline: `TEST HEADLINE ${number}`,
    supportingTexts: [`TEST SUPPORT ${number}`],
    sourceLabel: "TEST SOURCE",
    narrationChunks,
    visualBeats,
    cards,
    numbers,
    nodes,
    arrows,
    visualEvents: events,
    assetPlacements,
    // eslint-disable-next-line @remotion/non-pure-animation -- Static fixture data, not a rendered animation.
    transition: index === 8 ? {type: "none", durationMs: 0} : index % 2 === 0 ? {type: "fade", durationMs: 300} : {type: "cut", durationMs: 0},
  };
};

const makeSpec = (kind: FixtureKind): RenderSpec => {
  const complete = kind !== "minimal";
  return ({
  schemaVersion: "2.2.0",
  episode: {
    id: complete ? "2099-02-02" : "2099-01-01",
    targetDate: complete ? "2099-02-02" : "2099-01-01",
    marketSession: "TEST SESSION",
    informationCutoff: "2099-01-01T00:00:00Z",
    episodeType: "composite-story",
    durationMode: "shortened",
    shortenedReason: "技術検証用フィクスチャ",
    fps: 30,
    width: 1920,
    height: 1080,
  },
  editorial: {
    leadNews: null,
    leadTheme: "TEST LEAD THEME",
    targetIndices: ["TEST INDEX"],
    storySpine: "TEST STORY SPINE",
    centralHypothesis: "TEST CENTRAL HYPOTHESIS",
    confidence: "unknown",
    directMaterial: ["TEST DIRECT MATERIAL"],
    nasdaqDrivers: ["TEST NASDAQ DRIVER"],
    amplifiers: ["TEST AMPLIFIER"],
    offsettingFactors: ["TEST OFFSETTING FACTOR"],
    expected: "TEST EXPECTED",
    actual: "TEST ACTUAL",
    gap: "TEST GAP",
    expectedBasisType: "major-reporting",
    expectedBasisDetails: "TEST EXPECTED BASIS DETAILS",
    expectedSourceIds: ["source-001"],
    timelineBasis: "TEST TIMELINE BASIS",
    counterEvidence: ["TEST COUNTER EVIDENCE"],
    verificationPoints: ["TEST VERIFICATION POINT"],
  },
  publishing: {
    recommendedTitle: "TEST TITLE A",
    titleCandidates: ["TEST TITLE A", "TEST TITLE B", "TEST TITLE C"],
    recommendedThumbnailText: "TEST THUMBNAIL A",
    thumbnailTextCandidates: ["TEST THUMBNAIL A", "TEST THUMBNAIL B", "TEST THUMBNAIL C"],
    description: "TEST DESCRIPTION",
  },
  sources: [{
    sourceId: "source-001",
    title: "TEST SOURCE TITLE",
    publisher: "TEST PUBLISHER",
    sourceType: "other",
    reference: "test://source-001",
    publishedAt: null,
    accessedAt: "2099-01-01T00:00:00Z",
    usedFor: ["TEST VALIDATION"],
    narrationAttribution: "TEST SOURCE",
  }],
  review: {
    verdict: "approved",
    scores: {openingHook: 4, storyProgression: 4, discovery: 4, clarity: 4, foxCharacter: 4, reasonToFinish: 4},
    totalScore: 24,
    largestDropoffRisk: "TEST RISK",
    requiredChanges: [],
    changesApplied: [],
    titleThumbnailConsistency: "consistent",
    approvedForCodex: true,
  },
  pronunciations: complete ? [{surface: "TEST SURFACE", reading: "テスト リーディング"}] : [],
  corrections: complete ? [{correctionId: "correction-001", original: "TEST ORIGINAL", corrected: "TEST CORRECTED", reason: "TEST REASON"}] : [],
  voiceProfileId: "fox-main",
  scenes: Array.from({length: 9}, (_, index) => makeScene(index, kind)),
  });
};

for (const [directory, kind] of [["minimal", "minimal"], ["schema-all-expressions", "schema"], ["complete-9scene", "schema"], ["renderable-9scene", "renderable"]] as const) {
  const fixture = renderSpecSchema.parse(makeSpec(kind));
  const outputDirectory = path.join(PROJECT_DIR, "render-specs", "fixtures", directory);
  await mkdir(outputDirectory, {recursive: true});
  await writeFile(path.join(outputDirectory, "render_spec.json"), `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
}
console.log("generated render_spec fixtures: minimal, schema-all-expressions, complete-9scene, renderable-9scene");
