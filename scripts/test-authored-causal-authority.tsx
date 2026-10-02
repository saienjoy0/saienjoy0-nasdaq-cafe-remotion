import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {CardFirstFinancialRenderer} from "../src/components/spec/CardFirstFinancialRenderer";
import {DedicatedShotRenderer} from "../src/components/spec/shots/ShotRecipes";
import type {PublicMainContent, PublicNode} from "../src/spec/public-view-model";
import {toPublicSceneViewModel} from "../src/spec/public-view-model";
import type {ProductionScene} from "../src/spec/render-spec";
import {getSceneRenderState} from "../src/spec/render-state";
import {analyzeVisualCandidateCatalogVNext, buildVisualCandidateCatalogVNext} from "../src/spec/visual-candidate-builder";
import {compileVisualDirection} from "../src/spec/visual-direction-compiler";
import {sha256Json, type VisualCandidateCatalog} from "../src/spec/visual-director-contract";
import {assertStaticTemplateSoundness} from "../src/spec/static-template-soundness";
import {validateShotStoryContract} from "../src/spec/validate-shot-story";
import {makeCurrentVisualDirectorFixture} from "./test-support/current-visual-grammar-fixture";

const tests: Array<{name: string; run: () => void}> = [];
const test = (name: string, run: () => void) => tests.push({name, run});

const graphFixture = (disconnected = false) => {
  const spec = makeCurrentVisualDirectorFixture();
  const scene = spec.scenes[5];
  const beat = scene.visualBeats[0];
  scene.nodes = [
    {nodeId: "scene-06-node-002", label: "企業の株価"},
    {nodeId: "scene-06-node-001", label: "企業の材料"},
    ...(disconnected ? [
      {nodeId: "scene-06-node-004", label: "物価への圧力"},
      {nodeId: "scene-06-node-003", label: "原油の材料"},
    ] : []),
  ];
  scene.arrows = [
    ...(disconnected ? [{arrowId: "scene-06-arrow-002", fromNodeId: "scene-06-node-003", toNodeId: "scene-06-node-004", label: "マクロの経路"}] : []),
    {arrowId: "scene-06-arrow-001", fromNodeId: "scene-06-node-001", toNodeId: "scene-06-node-002", label: "企業の経路"},
  ];
  scene.visualEvents = [];
  beat.visualTemplate = "causal-lane";
  beat.templateVariant = "left-to-right";
  beat.visualGrammarId = "causal";
  beat.visualMode = "causal-diagram";
  beat.screenState = "Data";
  scene.visualMode = "causal-diagram";
  beat.objectIds = [...scene.nodes.map((node) => node.nodeId), ...scene.arrows.map((arrow) => arrow.arrowId)];
  beat.viewerTexts = ["追い風｜企業の材料", "向かい風｜マクロの材料"];
  beat.sequencePolicy = "static";
  beat.templateConfig = {
    variant: "left-to-right", comparisonBasis: null, dataBasis: "synthetic authored graph",
    nodeOrder: disconnected
      ? ["scene-06-node-001", "scene-06-node-002", "scene-06-node-003", "scene-06-node-004"]
      : ["scene-06-node-001", "scene-06-node-002"],
    laneLabels: [], outcomeNodeId: null,
  };
  return {spec, scene, beat};
};

const planFor = (spec: ReturnType<typeof graphFixture>["spec"], catalog: VisualCandidateCatalog, alternateId?: string) => ({
  contractVersion: "1.0.0" as const,
  episodeDate: spec.episode.targetDate,
  candidateCatalogSha256: sha256Json(catalog),
  selections: spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => {
    const candidate = alternateId && beat.beatId === "scene-06-beat-001"
      ? catalog.candidates.find((item) => item.candidateId === alternateId)
      : catalog.candidates.find((item) => item.visualBeatId === beat.beatId && item.visualTemplate === beat.visualTemplate && sha256Json(item.templateConfig) === sha256Json(beat.templateConfig));
    assert.ok(candidate, `identity candidate unavailable for ${beat.beatId}`);
    return {visualBeatId: beat.beatId, candidateId: candidate.candidateId};
  })),
});

test("alternative selection preserves authored order and nullable outcome", () => {
  const {spec, beat} = graphFixture();
  const catalog = buildVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256: sha256Json(spec)});
  const alternative = catalog.candidates.find((item) => item.visualBeatId === beat.beatId && item.visualTemplate === "tailwind-headwind");
  assert.ok(alternative, "the supported comparison alternative must remain available");
  assert.deepEqual(alternative.templateConfig.nodeOrder, ["scene-06-node-001", "scene-06-node-002"]);
  assert.equal(alternative.templateConfig.outcomeNodeId, null);
  const result = compileVisualDirection({spec, sourceRenderSpecSha256: sha256Json(spec), catalog, plan: planFor(spec, catalog, alternative.candidateId)});
  assert.deepEqual(result.spec.scenes[5].visualBeats[0].templateConfig.nodeOrder, ["scene-06-node-001", "scene-06-node-002"]);
  assert.equal(result.spec.scenes[5].visualBeats[0].templateConfig.outcomeNodeId, null);
});

for (const field of ["nodeOrder", "outcomeNodeId", "objectIds", "objectOrder"] as const) {
  test(`compilation rejects a Catalog changing ${field}`, () => {
    const {spec, beat} = graphFixture();
    const catalog = buildVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256: sha256Json(spec)});
    const candidate = catalog.candidates.find((item) => item.visualBeatId === beat.beatId && item.visualTemplate === "causal-lane")!;
    if (field === "nodeOrder") candidate.templateConfig.nodeOrder.reverse();
    if (field === "outcomeNodeId") candidate.templateConfig.outcomeNodeId = "scene-06-node-001";
    if (field === "objectIds") candidate.objectIds = candidate.objectIds.filter((id) => id !== "scene-06-arrow-001");
    if (field === "objectOrder") candidate.objectIds.reverse();
    assert.throws(() => compileVisualDirection({spec, sourceRenderSpecSha256: sha256Json(spec), catalog, plan: planFor(spec, catalog, candidate.candidateId)}), /PROTECTED_SEMANTIC_DIFF_FAIL/);
  });
}

test("independent company and macro chains have a legal compiled Current candidate", () => {
  const {spec, beat} = graphFixture(true);
  const result = analyzeVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256: sha256Json(spec)});
  assert.ok(result.catalog, "two explicit independent chains must not become E_VISUAL_CANDIDATE_NONE");
  const candidate = result.catalog.candidates.find((item) => item.visualBeatId === beat.beatId && item.visualTemplate === "causal-lane");
  assert.ok(candidate);
  const compiled = compileVisualDirection({spec, sourceRenderSpecSha256: sha256Json(spec), catalog: result.catalog, plan: planFor(spec, result.catalog, candidate.candidateId)});
  assert.deepEqual(compiled.spec.scenes[5].arrows, [
    {arrowId: "scene-06-arrow-002", fromNodeId: "scene-06-node-003", toNodeId: "scene-06-node-004", label: "マクロの経路"},
    {arrowId: "scene-06-arrow-001", fromNodeId: "scene-06-node-001", toNodeId: "scene-06-node-002", label: "企業の経路"},
  ]);
});

const publicNode = (key: string, label: string): PublicNode => ({
  key, label, highlighted: false, revealAtMs: 0, highlightedAtMs: null,
  enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null,
});
const publicGraph = (): PublicMainContent => ({
  renderKind: "causal", layout: "full", headline: "要因の切り分け", supportingTexts: [], uncertainty: null,
  screenQuestion: "企業とマクロの経路", primaryElement: "二つの要因", primaryFunction: "Explain",
  visualTemplate: "causal-lane", sequencePolicy: "static", finalHoldMs: 600,
  templateConfig: {variant: "left-to-right", comparisonBasis: null, dataBasis: "synthetic authored graph", nodeOrder: ["company-news", "company-price", "oil", "prices"], laneLabels: [], outcomeNodeId: null},
  shot: null, previousShot: null, nextShot: null, cards: [], numbers: [],
  nodes: [publicNode("prices", "物価"), publicNode("oil", "原油"), publicNode("company-price", "企業の株価"), publicNode("company-news", "企業の材料")],
  arrows: [
    {key: "macro-edge", fromKey: "oil", toKey: "prices", label: "マクロの経路", highlighted: false, revealAtMs: 2_000, highlightedAtMs: null, enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null},
    {key: "company-edge", fromKey: "company-news", toKey: "company-price", label: "企業の経路", highlighted: false, revealAtMs: 0, highlightedAtMs: null, enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null},
  ],
  texts: ["企業の材料", "原油の材料"], sceneTimeMs: 1_200, beatStartMs: 0, beatEndMs: 3_000, beatProgress: .4, holdProgress: 0,
  entityPresentation: null, entity: null,
});

test("rendering keeps separate edges, labels, nullable outcome and authored timing", () => {
  const content = publicGraph();
  const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content}/>);
  assert.equal((markup.match(/data-card-connector="short"/g) ?? []).length, 2);
  assert.deepEqual([...markup.matchAll(/data-causal-arrow="([^"]+)"/g)].map((item) => item[1]), ["company-edge", "macro-edge"]);
  assert.deepEqual([...markup.matchAll(/data-card-tone="([^"]+)"/g)].map((item) => item[1]), ["neutral", "neutral", "neutral", "neutral"]);
  assert.match(markup, /data-causal-arrow="macro-edge"[^>]*opacity:0/);
  assert.ok(markup.indexOf("企業の材料") < markup.indexOf("企業の株価"));
  assert.ok(markup.indexOf("企業の株価") < markup.indexOf("原油"));
  assert.doesNotMatch(markup, /NASDAQまでの経路/);
  assert.match(markup, /企業とマクロの経路/);
  content.templateConfig.outcomeNodeId = "company-price";
  const outcomeMarkup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content}/>);
  assert.deepEqual([...outcomeMarkup.matchAll(/data-card-tone="([^"]+)"/g)].map((item) => item[1]), ["neutral", "emphasis", "neutral", "neutral"]);
});

test("a causal renderer cannot derive a graph from text", () => {
  const content = publicGraph();
  content.nodes = [];
  content.arrows = [];
  content.templateConfig.nodeOrder = [];
  const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content}/>);
  assert.equal((markup.match(/data-finance-card="step"/g) ?? []).length, 0);
  assert.equal((markup.match(/data-card-connector="short"/g) ?? []).length, 0);
});

test("causal-build under a text template requires an authored graph", () => {
  const {spec, scene, beat} = graphFixture();
  const chunk = scene.narrationChunks[0];
  beat.shots = [{shotId: "scene-06-beat-001-shot-001", shotRecipe: "causal-build", startChunkId: beat.startChunkId, startProgress: 0, startOffsetMs: 0, endChunkId: beat.endChunkId, endProgress: 1, endOffsetMs: 0, startCue: chunk.speechText, endCue: scene.narrationChunks.at(-1)!.speechText, stageLayout: "lane-left-right", cameraPreset: "static", primaryTargetId: null, referenceTargetId: null, outcomeTargetId: null, cameraTargetId: null, secondaryTargetIds: [], foxExpression: scene.initialExpression, transitionIn: "hard-cut", transitionOut: "hard-cut", continuityKey: null, typographyTreatment: null, typographyText: null, soundCue: null}];
  beat.visualTemplate = "text-focus";
  beat.visualMode = "text-focus";
  beat.objectIds = [scene.cards[0].cardId];
  beat.templateConfig.nodeOrder = [];
  assert.throws(() => validateShotStoryContract(spec), /E_AUTHORED_CAUSAL_PATH_INVALID:\$\.scenes\[5\]\.visualBeats\[0\]\.objectIds/);
  assert.throws(() => assertStaticTemplateSoundness(scene, beat, "$.scenes[5].visualBeats[0]"), /E_AUTHORED_CAUSAL_PATH_INVALID/);
});

test("missing order, dangling endpoints and undisplayable edges fail closed", () => {
  for (const defect of ["order", "endpoint", "crossing"] as const) {
    const {scene, beat} = graphFixture(true);
    if (defect === "order") beat.templateConfig.nodeOrder = [];
    if (defect === "endpoint") scene.arrows[0].toNodeId = "absent";
    if (defect === "crossing") scene.arrows[0].fromNodeId = "scene-06-node-001";
    assert.throws(() => assertStaticTemplateSoundness(scene, beat, "$.scenes[5].visualBeats[0]"), /E_AUTHORED_CAUSAL_PATH_INVALID.*RETURN_TO_STORY/);
  }
});

test("dedicated causal Shot shares the explicit edge renderer", () => {
  const content = publicGraph();
  content.shot = {shotRecipe: "causal-build", cameraPreset: "static", cameraProgress: 0, typographyTreatment: null} as unknown as PublicMainContent["shot"];
  const markup = renderToStaticMarkup(<DedicatedShotRenderer content={content}/>);
  assert.equal((markup.match(/data-card-connector="short"/g) ?? []).length, 2);
  assert.deepEqual([...markup.matchAll(/data-causal-arrow="([^"]+)"/g)].map((item) => item[1]), ["company-edge", "macro-edge"]);
});

test("real timeline projection supports authored reveal and hide states", () => {
  const scene = {
    sceneNumber: 1, initialExpression: "通常", headline: "企業の経路", supportingTexts: [], sourceLabel: "", uncertainty: null,
    narrationChunks: [{chunkId: "scene-01-chunk-001", speechText: "経路を確認", startMs: 0, endMs: 3_000, pauseAfterMs: 0, caption: {text: "経路を確認"}, expression: "通常"}],
    visualBeats: [{beatId: "scene-01-beat-001", startMs: 0, endMs: 3_000, screenState: "Data", visualMode: "causal-diagram", visualTemplate: "causal-lane", templateConfig: {variant: "left-to-right", comparisonBasis: null, dataBasis: "test", nodeOrder: ["a", "b"], laneLabels: [], outcomeNodeId: null}, sequencePolicy: "explicit", finalHoldMs: 500, primaryFunction: "Explain", screenQuestion: "企業の経路", primaryElement: "企業材料", objectIds: ["a", "b", "ab"], assetPlacementIds: [], viewerTexts: ["表示前に使わない説明文"], entity: null}],
    visualEvents: [
      {action: "show", targetId: "a", offsetMs: 100},
      {action: "show", targetId: "b", offsetMs: 500},
      {action: "show", targetId: "ab", offsetMs: 1_000},
      {action: "hide", targetId: "b", offsetMs: 2_000},
      {action: "hide", targetId: "ab", offsetMs: 2_000},
    ].map((event) => ({...event, atChunkId: "scene-01-chunk-001", timing: "chunk-start", expression: null, motionPreset: null, durationMs: null, easingPreset: null})),
    cards: [], numbers: [], nodes: [{nodeId: "a", label: "企業材料"}, {nodeId: "b", label: "企業の株価"}],
    arrows: [{arrowId: "ab", fromNodeId: "a", toNodeId: "b", label: "確認した経路"}],
    assetPlacements: [
      {placementId: "background", assetId: "mainBackground", role: "background", region: "full-canvas", fit: "cover", focalPoint: null, opacity: 1, startChunkId: null, endChunkId: null},
      {placementId: "fox", assetId: "foxNormal", role: "fox-expression", region: "fox-left", fit: "contain", focalPoint: null, opacity: 1, startChunkId: null, endChunkId: null},
    ],
    // eslint-disable-next-line @remotion/non-pure-animation -- Static scene metadata, not a CSS transition.
    durationMs: 3_000, durationInFrames: 90, transition: {type: "none", durationMs: 0},
  } as unknown as ProductionScene;
  for (const [time, expectedNodes, expectedEdges] of [[50, [], 0], [300, ["a"], 0], [750, ["a", "b"], 0], [1_300, ["a", "b"], 1], [2_500, ["a"], 0]] as const) {
    const content = toPublicSceneViewModel(scene, getSceneRenderState(scene, time), {mainBackground: "background.png", foxNormal: "fox.png"}).mainContent;
    assert.ok(content);
    assert.deepEqual(content.nodes.map((node) => node.key), expectedNodes);
    const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content}/>);
    assert.equal((markup.match(/data-finance-card="step"/g) ?? []).length, expectedNodes.length);
    assert.equal((markup.match(/data-card-connector="short"/g) ?? []).length, expectedEdges);
    assert.doesNotMatch(markup, /表示前に使わない説明文/);
  }
});

test("invalid native endpoints identify the real Scene arrow field", () => {
  const {scene, beat} = graphFixture(true);
  scene.arrows[0].toNodeId = "absent";
  assert.throws(() => assertStaticTemplateSoundness(scene, beat, "$.scenes[5].visualBeats[0]"), /E_AUTHORED_CAUSAL_PATH_INVALID:\$\.scenes\[5\]\.arrows\[0\]\.toNodeId/);
});

test("alternative enumeration cannot hide an unsupported authored causal path", () => {
  const {spec, scene, beat} = graphFixture();
  scene.nodes.push({nodeId: "scene-06-node-003", label: "次の影響"});
  scene.arrows.push({arrowId: "scene-06-arrow-002", fromNodeId: "scene-06-node-002", toNodeId: "scene-06-node-003", label: "次の経路"});
  beat.objectIds.push("scene-06-node-003", "scene-06-arrow-002");
  beat.templateConfig.nodeOrder = ["scene-06-node-001", "scene-06-node-003", "scene-06-node-002"];
  assert.throws(() => analyzeVisualCandidateCatalogVNext({spec, sourceRenderSpecSha256: sha256Json(spec)}), /E_AUTHORED_CAUSAL_PATH_INVALID.*RETURN_TO_STORY/);
});

let failed = 0;
for (const item of tests) {
  try {item.run(); console.log(`PASS: ${item.name}`);} catch (error) {failed += 1; console.error(`FAIL: ${item.name}`); console.error(error);}
}
assert.equal(failed, 0, `${failed} authored causal authority regressions failed`);
