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
  screenQuestion: "8:30の発表直後、QQQはどう動いた？",
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
      seriesObjectIds: [],
      ...(precision === "verified-intraday-series" ? {
        displayTimezone: "America/New_York",
        eventMarker: {
          timestamp: "2026-08-07T12:30:00Z",
          label: "雇用統計",
          sourceLabel: "BLS",
        },
        intradaySeries: {
          source: "Longbridge",
          kind: "intraday" as const,
          fetched_by: "longbridge-cli",
          generated_at: "2026-08-10T00:00:00Z",
          symbol: "QQQ.US",
          marketDate: "2026-08-07",
          timezone: "UTC",
          session: "regular" as const,
          resolution: "1m" as const,
          precision: "verified-intraday-series" as const,
          providerSurface: "kline-history-fallback",
          priceBasis: "minute-close",
          rawSha256: "a".repeat(64),
          points: [
            {timestamp: "2026-08-07T12:28:00Z", price: 580.10, open: 580.00, high: 580.20, low: 579.95, close: 580.10, volume: 1000, turnover: 580100},
            {timestamp: "2026-08-07T12:29:00Z", price: 580.06, open: 580.10, high: 580.14, low: 580.01, close: 580.06, volume: 1200, turnover: 696072},
            {timestamp: "2026-08-07T12:30:00Z", price: 580.42, open: 580.05, high: 580.51, low: 580.00, close: 580.42, volume: 4200, turnover: 2437764},
            {timestamp: "2026-08-07T12:31:00Z", price: 580.71, open: 580.42, high: 580.79, low: 580.38, close: 580.71, volume: 3600, turnover: 2090556},
            {timestamp: "2026-08-07T12:32:00Z", price: 580.63, open: 580.71, high: 580.75, low: 580.55, close: 580.63, volume: 2800, turnover: 1625764},
          ],
        },
      } : {}),
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
  assert.match(markup, /8:30の発表直後/);
  if (variant === "verified-series") {
    assert.match(markup, /data-market-chart="intraday-line"/);
    assert.match(markup, /data-intraday-point-count="5"/);
    assert.match(markup, /data-timeline-series="verified"/);
    assert.match(markup, /data-event-marker="2026-08-07T12:30:00Z"/);
    assert.match(markup, /QQQ\.US/);
    assert.match(markup, /雇用統計/);
    assert.match(markup, /Source: Longbridge/);
    assert.match(markup, /5 bars/);
  } else {
    assert.doesNotMatch(markup, /data-market-chart="intraday-line"/);
    assert.match(markup, new RegExp(`data-timeline-item="${precision}"`));
  }
  if (variant === "close-only") {
    assert.match(markup, /NASDAQ終値/);
    assert.doesNotMatch(markup, /data-event-marker/);
  }
  console.log(`PASS: ${variant} timeline rendering`);
}

console.log("event reaction timeline renderer tests: 4 passed");
