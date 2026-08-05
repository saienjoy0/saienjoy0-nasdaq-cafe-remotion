import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {
  PublicArrow,
  PublicCard,
  PublicMainContent,
  PublicNode,
  PublicNumber,
} from "../src/spec/public-view-model";
import {
  assertFinancialTemplateContent,
  DualAssetSplitTemplate,
  EarningsSurpriseTemplate,
  MacroPressureTemplate,
  MarketPulseGridTemplate,
  SourceReceiptTemplate,
} from "../src/components/spec/FinancialVisualTemplates";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const motion = {
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
};

const number = (
  key: string,
  label: string,
  value: number,
  tone: PublicNumber["tone"] = "neutral",
): PublicNumber => ({
  key,
  label,
  value: `${value >= 0 ? "+" : ""}${value.toFixed(1)}`,
  numericValue: value,
  precision: 1,
  unit: "%",
  comparison: "same session",
  tone,
  highlighted: false,
  ...motion,
});

const card = (key: string, value: string): PublicCard => ({
  key,
  title: "Official source",
  lines: [{label: "Confirmed", value, tone: "neutral"}],
  highlighted: false,
  role: null,
  ...motion,
});

const node = (key: string, label: string): PublicNode => ({
  key,
  label,
  highlighted: false,
  ...motion,
});

const arrow = (key: string, fromKey: string, toKey: string): PublicArrow => ({
  key,
  fromKey,
  toKey,
  label: "transmits",
  highlighted: false,
  ...motion,
});

const baseContent = (overrides: Partial<PublicMainContent>): PublicMainContent => ({
  renderKind: "chart",
  layout: "full",
  headline: "Financial visual contract",
  supportingTexts: ["Confirmed evidence"],
  uncertainty: null,
  screenQuestion: "What changed?",
  primaryElement: "NASDAQ impact",
  primaryFunction: "Explain",
  visualTemplate: "market-pulse-grid",
  templateConfig: {
    variant: "grid",
    comparisonBasis: "same session and unit",
    dataBasis: "financial-recipe-plan",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    displayOrder: [],
    metricIds: [],
    causalStepIds: [],
    highlightObjectIds: [],
  },
  sequencePolicy: "object-order-fallback",
  finalHoldMs: 600,
  shot: null,
  previousShot: null,
  nextShot: null,
  cards: [],
  numbers: [],
  nodes: [],
  arrows: [],
  texts: [],
  sceneTimeMs: 1600,
  beatStartMs: 0,
  beatEndMs: 5000,
  beatProgress: 0.32,
  holdProgress: 0,
  entityPresentation: null,
  entity: null,
  ...overrides,
});

const render = (component: React.ReactElement) => renderToStaticMarkup(component);

const market = baseContent({
  visualTemplate: "market-pulse-grid",
  numbers: [
    number("nasdaq", "NASDAQ", 0.6, "positive"),
    number("amazon", "Amazon", -1.7, "negative"),
    number("apple", "Apple", 1.2, "positive"),
    number("soxx", "SOXX", -0.4, "warning"),
  ],
});
const marketMarkup = render(<MarketPulseGridTemplate content={market}/>);
assert.match(marketMarkup, /MARKET SNAPSHOT/);
assert.match(marketMarkup, /NASDAQ/);
assert.match(marketMarkup, /SOXX/);

const earnings = baseContent({
  visualTemplate: "earnings-surprise",
  templateConfig: {...baseContent({}).templateConfig, variant: "zero-baseline"},
  numbers: [
    number("expected", "Expected", 42.3, "neutral"),
    number("actual", "Actual", 43.0, "positive"),
    number("gap", "Gap", 0.7, "emphasis"),
  ],
});
const earningsMarkup = render(<EarningsSurpriseTemplate content={earnings}/>);
assert.match(earningsMarkup, /EXPECTED/);
assert.match(earningsMarkup, /ACTUAL/);
assert.match(earningsMarkup, /GAP/);

const divergence = baseContent({
  visualTemplate: "dual-asset-split",
  templateConfig: {...baseContent({}).templateConfig, variant: "center-zero"},
  numbers: [
    number("left", "Amazon", -1.7, "negative"),
    number("right", "Apple", 1.2, "positive"),
  ],
});
const divergenceMarkup = render(<DualAssetSplitTemplate content={divergence}/>);
assert.match(divergenceMarkup, /ENTITY DIVERGENCE/);
assert.match(divergenceMarkup, /Amazon/);
assert.match(divergenceMarkup, /Apple/);

const macro = baseContent({
  visualTemplate: "macro-pressure",
  renderKind: "causal",
  templateConfig: {
    ...baseContent({}).templateConfig,
    variant: "pressure-lane",
    nodeOrder: ["rates", "valuation", "nasdaq"],
    causalStepIds: ["rates", "valuation", "nasdaq"],
    displayOrder: ["rates", "valuation", "nasdaq", "a1", "a2"],
  },
  nodes: [
    node("rates", "Rates rose"),
    node("valuation", "Valuation pressure"),
    node("nasdaq", "NASDAQ"),
  ],
  arrows: [
    arrow("a1", "rates", "valuation"),
    arrow("a2", "valuation", "nasdaq"),
  ],
});
const macroMarkup = render(<MacroPressureTemplate content={macro}/>);
assert.match(macroMarkup, /MACRO TRANSMISSION/);
assert.match(macroMarkup, /Rates rose/);
assert.match(macroMarkup, /NASDAQ/);

const receipt = baseContent({
  visualTemplate: "source-receipt",
  renderKind: "news",
  templateConfig: {...baseContent({}).templateConfig, variant: "receipt"},
  cards: [card("receipt", "Amazon reported AWS revenue")],
  texts: ["Company filing", "Market close data"],
});
const receiptMarkup = render(<SourceReceiptTemplate content={receipt}/>);
assert.match(receiptMarkup, /SOURCE EVIDENCE/);
assert.match(receiptMarkup, /Amazon reported AWS revenue/);
assert.doesNotMatch(receiptMarkup, /financialVisualTrace|recipePlanSha256|selectedPlanId/);

assert.throws(
  () => assertFinancialTemplateContent("market-pulse-grid", baseContent({visualTemplate: "market-pulse-grid", numbers: market.numbers.slice(0, 2)})),
  /three to six/,
);
assert.throws(
  () => assertFinancialTemplateContent("earnings-surprise", baseContent({visualTemplate: "earnings-surprise", numbers: earnings.numbers.slice(0, 2)})),
  /exactly three/,
);
assert.throws(
  () => assertFinancialTemplateContent("dual-asset-split", baseContent({visualTemplate: "dual-asset-split", numbers: [divergence.numbers[0]]})),
  /exactly two/,
);
assert.throws(
  () => assertFinancialTemplateContent("macro-pressure", baseContent({visualTemplate: "macro-pressure", nodes: [macro.nodes[0]], arrows: []})),
  /two to four/,
);
assert.throws(
  () => assertFinancialTemplateContent("source-receipt", baseContent({visualTemplate: "source-receipt", cards: [], numbers: [], texts: [], supportingTexts: []})),
  /at least one/,
);

const rendererSource = await readFile(path.join(ROOT, "src/components/spec/VisualTemplateRenderer.tsx"), "utf8");
assert.doesNotMatch(rendererSource, /FinancialTemplateImplementationPending/);
for (const templateId of [
  "market-pulse-grid",
  "earnings-surprise",
  "dual-asset-split",
  "macro-pressure",
  "source-receipt",
]) {
  assert.match(rendererSource, new RegExp(`case \\"${templateId}\\"`));
}

const publicViewModelSource = await readFile(path.join(ROOT, "src/spec/public-view-model.ts"), "utf8");
assert.doesNotMatch(publicViewModelSource, /financialVisualTrace|recipePlanSha256|selectedPlanSha256/);

console.log("financial visual template component tests: PASS");
