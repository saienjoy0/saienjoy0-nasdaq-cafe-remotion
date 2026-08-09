import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {EventReactionTimelineTemplate} from "../src/components/spec/EventReactionTimelineTemplate";
import type {PublicMainContent, PublicNumber} from "../src/spec/public-view-model";
import type {ReactionTimelinePrecision, ReactionTimelineVariant} from "../src/spec/reaction-timeline-contract";

const number = (key: string, label: string, value: string, numericValue: number): PublicNumber => ({
  key,
  label,
  value,
  numericValue,
  precision: 2,
  unit: "%",
  comparison: null,
  tone: numericValue >= 0 ? "positive" : "negative",
  highlighted: false,
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
});

const content = (
  variant: ReactionTimelineVariant,
  precision: ReactionTimelinePrecision,
): PublicMainContent => ({
  renderKind: "timeline",
  layout: "full",
  headline: "発表と市場反応",
  supportingTexts: [],
  uncertainty: null,
  screenQuestion: "いつ、何が確認できたか",
  primaryElement: "確認精度に合わせて表示",
  primaryFunction: "Evidence",
  visualTemplate: "event-reaction-timeline",
  templateConfig: {
    variant,
    comparisonBasis: null,
    dataBasis: "official and market data",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    reactionTimeline: {
      precision,
      eventOrderIds: ["event", "lead", "index"],
      seriesObjectIds: precision === "verified-intraday-series" ? ["event", "lead", "index"] : [],
    },
  },
  sequencePolicy: "static",
  finalHoldMs: 600,
  shot: null,
  previousShot: null,
  nextShot: null,
  cards: [],
  numbers: [
    number("event", "公式発表", "0.0%", 0),
    number("lead", "主役銘柄", "+4.2%", 4.2),
    number("index", "NASDAQ終値", "+0.8%", 0.8),
  ],
  nodes: [],
  arrows: [],
  texts: [],
  sceneTimeMs: 1000,
  beatStartMs: 0,
  beatEndMs: 7000,
  beatProgress: 0.14,
  holdProgress: 0,
  entityPresentation: null,
  entity: null,
});

const variants: Array<[ReactionTimelineVariant, ReactionTimelinePrecision]> = [
  ["verified-series", "verified-intraday-series"],
  ["reported-sequence", "reported-sequence"],
  ["official-time-plus-close", "official-time-plus-close"],
  ["close-only", "close-only"],
];

for (const [variant, precision] of variants) {
  const markup = renderToStaticMarkup(<EventReactionTimelineTemplate content={content(variant, precision)}/>);
  assert.match(markup, /いつ、何が確認できたか/);
  if (variant === "verified-series") {
    assert.match(markup, /data-timeline-series="verified"/);
    assert.match(markup, /<polyline/);
  } else {
    assert.doesNotMatch(markup, /<polyline/);
    assert.match(markup, new RegExp(`data-timeline-item="${precision}"`));
  }
  if (variant === "close-only") {
    assert.match(markup, /NASDAQ終値/);
    assert.doesNotMatch(markup, /[0-2][0-9]:[0-5][0-9]/);
  }
  console.log(`PASS: ${variant} timeline rendering`);
}


const cardContent = content("official-time-plus-close", "official-time-plus-close");
cardContent.numbers = [];
cardContent.cards = [{
  key: "events",
  title: "SpaceX→AMD→翌日終値",
  role: null,
  lines: [
    {label: "1", value: "16:30 ET SpaceX説明会", tone: "neutral"},
    {label: "2", value: "17:00 ET AMD説明会", tone: "neutral"},
    {label: "3", value: "翌日 AMD -7.04% / NVDA +3.43%", tone: "neutral"},
  ],
  highlighted: false,
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
}];
cardContent.templateConfig.reactionTimeline!.eventOrderIds = ["events"];
const cardMarkup = renderToStaticMarkup(<EventReactionTimelineTemplate content={cardContent}/>);
assert.match(cardMarkup, /data-timeline-count="3"/);
assert.match(cardMarkup, /16:30 ET/);
assert.match(cardMarkup, /17:00 ET/);
assert.match(cardMarkup, /翌日/);
assert.match(cardMarkup, /SpaceX説明会/);
assert.match(cardMarkup, /AMD -7.04%/);

console.log("event reaction timeline renderer tests: 5 passed");
