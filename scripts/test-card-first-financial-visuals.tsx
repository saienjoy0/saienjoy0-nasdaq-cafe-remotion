import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {CardFirstFinancialRenderer} from "../src/components/spec/CardFirstFinancialRenderer";
import {SourceStrip, gridTemplateForCardCount} from "../src/components/spec/cards/FinancialCards";
import {VerificationGateStage} from "../src/components/spec/stages/VerificationGateStage";
import {localizeStageViewerLabel} from "../src/components/spec/StageSafeArea";
import type {PublicMainContent, PublicNode, PublicNumber} from "../src/spec/public-view-model";
import {STAGE_THEMES} from "../src/spec/stage-theme-contract";
import {getVisualGrammarAppearance} from "../src/spec/visual-grammar-contract";
import {VISUAL_TEMPLATE_CONTRACTS} from "../src/spec/visual-template-contract";

const tests: Array<{name: string; run: () => void}> = [];
const test = (name: string, run: () => void) => tests.push({name, run});

const number = (key: string, label: string, value: string, tone: PublicNumber["tone"] = "neutral"): PublicNumber => ({
  key,
  label,
  value,
  numericValue: Number.parseFloat(value),
  precision: 2,
  unit: "%",
  comparison: "同一セッション",
  tone,
  highlighted: false,
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
});

const node = (key: string, label: string): PublicNode => ({
  key,
  label,
  highlighted: false,
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
});

const content = (overrides: Partial<PublicMainContent> = {}): PublicMainContent => ({
  renderKind: "numbers",
  layout: "full",
  headline: "テスト",
  supportingTexts: [],
  uncertainty: null,
  screenQuestion: "何が起きたか",
  primaryElement: "確認済み材料",
  primaryFunction: "evidence" as never,
  visualTemplate: "metric-comparison-board",
  templateConfig: {
    variant: "default",
    comparisonBasis: null,
    dataBasis: null,
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
  } as never,
  sequencePolicy: "static",
  finalHoldMs: 600,
  shot: null,
  previousShot: null,
  nextShot: null,
  cards: [],
  numbers: [],
  nodes: [],
  arrows: [],
  texts: [],
  sceneTimeMs: 1200,
  beatStartMs: 0,
  beatEndMs: 3000,
  beatProgress: .4,
  holdProgress: 0,
  entityPresentation: null,
  entity: null,
  ...overrides,
});

test("card grid has no synthetic empty slot", () => {
  assert.equal(gridTemplateForCardCount(2), "repeat(2,minmax(0,1fr))");
  assert.equal(gridTemplateForCardCount(3), "repeat(3,minmax(0,1fr))");
  assert.equal(gridTemplateForCardCount(4), "repeat(2,minmax(0,1fr))");
  assert.equal(gridTemplateForCardCount(5), "repeat(3,minmax(0,1fr))");
  assert.equal(gridTemplateForCardCount(6), "repeat(3,minmax(0,1fr))");

  const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content({
    visualTemplate: "focus-matrix",
    numbers: [number("n1", "NVDA", "-2.05", "negative"), number("n2", "QQQ", "-0.67", "negative"), number("n3", "SOXX", "-0.58", "negative")],
  })}/>);
  assert.match(markup, /data-card-grid-count="3"/);
  assert.equal((markup.match(/data-finance-card="metric"/g) ?? []).length, 3);
});

test("causal card path uses only short connectors", () => {
  const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content({
    renderKind: "causal",
    visualTemplate: "causal-lane",
    templateConfig: {variant: "left-to-right", comparisonBasis: null, dataBasis: null, nodeOrder: ["a", "b", "c", "d"], laneLabels: [], outcomeNodeId: "d"} as never,
    nodes: [node("a", "ホルムズ不透明"), node("b", "原油高"), node("c", "インフレ / Fed不安"), node("d", "大型テック圧力")],
    arrows: [
      {key: "ab", fromKey: "a", toKey: "b", label: "", highlighted: false, revealAtMs: 0, highlightedAtMs: null, enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null},
      {key: "bc", fromKey: "b", toKey: "c", label: "", highlighted: false, revealAtMs: 0, highlightedAtMs: null, enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null},
      {key: "cd", fromKey: "c", toKey: "d", label: "", highlighted: false, revealAtMs: 0, highlightedAtMs: null, enterMotion: null, exitMotion: null, highlightMotion: null, unhighlightMotion: null},
    ],
  })}/>);
  assert.equal((markup.match(/data-finance-card="step"/g) ?? []).length, 4);
  assert.equal((markup.match(/data-card-connector="short"/g) ?? []).length, 3);
  assert.doesNotMatch(markup, /<svg|<polyline|<line/);
});

test("reported sequence verification is explicit card-board appearance", () => {
  const defaultAppearance = getVisualGrammarAppearance("verification-matrix", "strengthen-vs-weaken");
  const sequenceAppearance = getVisualGrammarAppearance("verification-matrix", "reported-sequence");
  assert.equal(defaultAppearance.dominantSurface, "matrix");
  assert.equal(sequenceAppearance.dominantSurface, "card-board");
  assert.equal(sequenceAppearance.stageShell, "VerificationGateStage");

  const markup = renderToStaticMarkup(<CardFirstFinancialRenderer content={content({
    renderKind: "verification",
    visualTemplate: "verification-matrix",
    templateConfig: {variant: "reported-sequence", comparisonBasis: null, dataBasis: null, nodeOrder: [], laneLabels: [], outcomeNodeId: null} as never,
    texts: ["通常取引", "引け後", "原因へ遡及しない"],
  })}/>);
  assert.match(markup, /data-verification-layout="reported-sequence"/);
  assert.equal((markup.match(/data-finance-card="step"/g) ?? []).length, 3);
});

test("verification shell does not force fixed thirds", () => {
  const source = readFileSync("src/components/spec/stages/VerificationGateStage.tsx", "utf8");
  assert.doesNotMatch(source, /33\.333|66\.666/);
  const markup = renderToStaticMarkup(<VerificationGateStage><span>確認</span></VerificationGateStage>);
  assert.doesNotMatch(markup, /33\.333|66\.666/);
});

test("viewer fixed UI is Japanese including title case", () => {
  assert.equal(localizeStageViewerLabel("EXPECTED"), "予想");
  assert.equal(localizeStageViewerLabel("Expected｜consensus"), "予想｜consensus");
  assert.equal(localizeStageViewerLabel("Actual"), "実際");
  assert.equal(localizeStageViewerLabel("Gap：差"), "差分：差");
});

test("analysis surfaces stay opaque while the container remains fully opaque", () => {
  assert.equal(STAGE_THEMES["open-causal"].surface, "rgba(255,255,255,.96)");
  const cards = readFileSync("src/components/spec/cards/FinancialCards.tsx", "utf8");
  assert.match(cards, /opacity: 1/);
  assert.doesNotMatch(cards, /height:\s*["']100%["']/);
});

test("source strip is viewer-facing and opaque", () => {
  const markup = renderToStaticMarkup(<SourceStrip text="Reuters / AP"/>);
  assert.match(markup, /data-source-strip="viewer-facing"/);
  assert.match(markup, /Reuters \/ AP/);
  assert.match(markup, /opacity:1/);
});

test("market pulse remains a three-to-six metric template", () => {
  assert.deepEqual(VISUAL_TEMPLATE_CONTRACTS["market-pulse-grid"].numbers, {min: 3, max: 6});
});

test("card-first renderer contains no invented fallback market copy", () => {
  const source = readFileSync("src/components/spec/CardFirstFinancialRenderer.tsx", "utf8");
  assert.doesNotMatch(source, /基準値/);
  assert.doesNotMatch(source, /AI需要崩壊ではない/);
  assert.doesNotMatch(source, /原油高とFed不安が重石/);
});

let failed = 0;
for (const item of tests) {
  try {
    item.run();
    console.log(`PASS: ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${item.name}`);
    console.error(error);
  }
}
if (failed > 0) process.exit(1);
console.log(`Card-first financial visual tests: ${tests.length} passed`);
