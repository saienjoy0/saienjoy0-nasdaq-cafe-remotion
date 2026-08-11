import type {PublicMainContent, PublicNumber} from "../../spec/public-view-model";

const palette = {
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  paper: "rgba(248,251,253,.94)",
  grid: "rgba(83,105,123,.18)",
  axis: "rgba(83,105,123,.52)",
} as const;

const revealStyle = (content: PublicMainContent, revealAtMs: number): React.CSSProperties => {
  const elapsed = content.sceneTimeMs - revealAtMs;
  const progress = Math.max(0, Math.min(1, elapsed / 320));
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 12}px)`,
  };
};

const orderedTimelineObjects = (content: PublicMainContent) => {
  const config = content.templateConfig.reactionTimeline;
  if (!config) return [];
  const byId = new Map<string, PublicNumber | {key: string; label: string; value: string; revealAtMs: number; tone: string}>([
    ...content.numbers.map((item) => [item.key, item] as const),
    ...content.cards.map((item) => [item.key, {
      key: item.key,
      label: item.title,
      value: item.lines.map((line) => line.value).join(" / "),
      revealAtMs: item.revealAtMs,
      tone: item.lines[0]?.tone ?? "neutral",
    }] as const),
  ]);
  return config.eventOrderIds.flatMap((id) => {
    const value = byId.get(id);
    return value ? [value] : [];
  });
};

const toneColor = (tone: string) =>
  tone === "positive" ? palette.positive :
    tone === "negative" ? palette.negative :
      tone === "warning" ? palette.warning : palette.cyan;

const LegacySeriesView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const config = content.templateConfig.reactionTimeline!;
  const series = config.seriesObjectIds.flatMap((id) => {
    const item = content.numbers.find((number) => number.key === id);
    return item?.numericValue == null ? [] : [item];
  });
  const values = series.map((item) => item.numericValue as number);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1e-9, maximum - minimum);
  const points = series.map((item, index) => {
    const x = series.length === 1 ? 50 : 7 + (index / (series.length - 1)) * 86;
    const y = 80 - (((item.numericValue as number) - minimum) / range) * 58;
    return `${x},${y}`;
  }).join(" ");

  return <div data-market-chart="legacy-summary" style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: "34px 44px 38px", boxSizing: "border-box"}}>
    <div style={{fontSize: 31, fontWeight: 950, color: palette.ink}}>{content.screenQuestion}</div>
    <div style={{position: "relative", minHeight: 0}}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: "absolute", inset: "10% 2% 18%", width: "96%", height: "72%", overflow: "visible"}}>
        <line x1="5" y1="82" x2="95" y2="82" stroke="rgba(83,105,123,.32)" strokeWidth="1"/>
        <polyline data-timeline-series="verified" points={points} fill="none" stroke={palette.cyan} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round"/>
        {series.map((item, index) => {
          const [x, y] = points.split(" ")[index].split(",");
          return <circle key={item.key} cx={x} cy={y} r="2.4" fill={toneColor(item.tone)}/>;
        })}
      </svg>
      <div style={{position: "absolute", left: "5%", right: "5%", bottom: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, series.length)},1fr)`, gap: 10}}>
        {series.map((item) => <div key={item.key} style={{...revealStyle(content, item.revealAtMs), textAlign: "center"}}>
          <div style={{fontSize: 20, fontWeight: 800, color: palette.muted}}>{item.label}</div>
          <div style={{fontSize: 28, fontWeight: 950, color: toneColor(item.tone)}}>{item.value}</div>
        </div>)}
      </div>
    </div>
  </div>;
};

const IntradaySeriesView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const config = content.templateConfig.reactionTimeline!;
  const series = config.intradaySeries!;
  const points = series.points;
  const values = points.map((point) => point.price);
  const timestamps = points.map((point) => Date.parse(point.timestamp));
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const rawRange = Math.max(1e-9, rawMaximum - rawMinimum);
  const padding = Math.max(rawRange * 0.09, Math.abs(rawMaximum) * 0.00035, 0.01);
  const minimum = rawMinimum - padding;
  const maximum = rawMaximum + padding;
  const range = maximum - minimum;
  const startTime = timestamps[0];
  const endTime = timestamps[timestamps.length - 1];
  const timeRange = Math.max(1, endTime - startTime);
  const first = points[0].price;
  const last = points[points.length - 1].price;
  const change = last - first;
  const changePercent = first === 0 ? 0 : (change / first) * 100;
  const trendColor = change >= 0 ? palette.positive : palette.negative;
  const displayTimezone = config.displayTimezone ?? (series.symbol.endsWith(".US") ? "America/New_York" : series.timezone);
  const timezoneLabel = displayTimezone === "America/New_York" ? "ET" : displayTimezone;
  const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: displayTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formatTime = (timestamp: number) => timeFormatter.format(new Date(timestamp));
  const priceDecimals = rawRange < 1 ? 3 : rawMaximum < 100 ? 2 : 2;
  const formatPrice = (value: number) => value.toFixed(priceDecimals);

  const viewWidth = 1000;
  const viewHeight = 500;
  const left = 28;
  const right = 105;
  const top = 38;
  const bottom = 62;
  const plotWidth = viewWidth - left - right;
  const plotHeight = viewHeight - top - bottom;
  const xFor = (timestamp: number) => left + ((timestamp - startTime) / timeRange) * plotWidth;
  const yFor = (value: number) => top + ((maximum - value) / range) * plotHeight;
  const linePath = points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${xFor(timestamps[index]).toFixed(2)},${yFor(point.price).toFixed(2)}`;
  }).join(" ");
  const priceTicks = Array.from({length: 5}, (_, index) => maximum - (range * index) / 4);
  const timeTicks = Array.from({length: 5}, (_, index) => startTime + (timeRange * index) / 4);
  const markerTimestamp = config.eventMarker ? Date.parse(config.eventMarker.timestamp) : null;
  const markerX = markerTimestamp === null ? null : xFor(markerTimestamp);
  const markerLabelX = markerX === null ? null : Math.max(left + 72, Math.min(left + plotWidth - 72, markerX));

  return <div
    data-market-chart="intraday-line"
    data-intraday-point-count={points.length}
    style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 12, padding: "25px 32px 24px", boxSizing: "border-box"}}
  >
    <div style={{display: "flex", alignItems: "end", justifyContent: "space-between", gap: 28}}>
      <div>
        <div style={{fontSize: 20, fontWeight: 900, color: palette.muted, letterSpacing: ".04em"}}>{series.symbol} · 1分足 · {series.marketDate}</div>
        <div style={{marginTop: 5, fontSize: 31, fontWeight: 950, color: palette.ink}}>{content.screenQuestion}</div>
      </div>
      <div style={{display: "flex", alignItems: "baseline", gap: 15, whiteSpace: "nowrap"}}>
        <span style={{fontSize: 38, fontWeight: 950, color: palette.ink}}>{formatPrice(last)}</span>
        <span style={{fontSize: 28, fontWeight: 950, color: trendColor}}>{changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%</span>
      </div>
    </div>

    <div style={{position: "relative", minHeight: 0, borderRadius: 18, background: "rgba(248,251,253,.74)", border: "1px solid rgba(83,105,123,.18)", overflow: "hidden"}}>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
        {priceTicks.map((value) => {
          const y = yFor(value);
          return <g key={`price-${value}`}>
            <line x1={left} y1={y} x2={left + plotWidth} y2={y} stroke={palette.grid} strokeWidth="1"/>
            <text x={left + plotWidth + 12} y={y + 6} fill={palette.muted} fontSize="18" fontWeight="750">{formatPrice(value)}</text>
          </g>;
        })}
        {timeTicks.map((timestamp) => {
          const x = xFor(timestamp);
          return <g key={`time-${timestamp}`}>
            <line x1={x} y1={top} x2={x} y2={top + plotHeight} stroke={palette.grid} strokeWidth="1"/>
            <text x={x} y={top + plotHeight + 31} textAnchor="middle" fill={palette.muted} fontSize="18" fontWeight="750">{formatTime(timestamp)}</text>
          </g>;
        })}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke={palette.axis} strokeWidth="1.4"/>
        <path data-timeline-series="verified" d={linePath} fill="none" stroke={trendColor} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
        {markerX !== null && markerLabelX !== null && config.eventMarker ? <g data-event-marker={config.eventMarker.timestamp}>
          <line x1={markerX} y1={top} x2={markerX} y2={top + plotHeight} stroke={palette.warning} strokeWidth="2.4" strokeDasharray="8 7"/>
          <circle cx={markerX} cy={yFor(points.reduce((closest, point) => Math.abs(Date.parse(point.timestamp) - markerTimestamp!) < Math.abs(Date.parse(closest.timestamp) - markerTimestamp!) ? point : closest).price)} r="5.5" fill={palette.warning}/>
          <rect x={markerLabelX - 83} y={top + 8} width="166" height="36" rx="10" fill="rgba(186,107,0,.12)" stroke="rgba(186,107,0,.55)"/>
          <text x={markerLabelX} y={top + 32} textAnchor="middle" fill={palette.warning} fontSize="18" fontWeight="900">{formatTime(markerTimestamp!)} {config.eventMarker.label}</text>
        </g> : null}
      </svg>
    </div>

    <div style={{display: "flex", justifyContent: "space-between", gap: 24, color: palette.muted, fontSize: 19, fontWeight: 800}}>
      <span>Source: {series.source} · {series.resolution} · {series.providerSurface}</span>
      <span>{timezoneLabel}表示 · {points.length} bars · {series.priceBasis}</span>
    </div>
  </div>;
};

const SeriesView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const config = content.templateConfig.reactionTimeline!;
  return config.intradaySeries
    ? <IntradaySeriesView content={content}/>
    : <LegacySeriesView content={content}/>;
};

const SequenceView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = orderedTimelineObjects(content);
  const precision = content.templateConfig.reactionTimeline!.precision;
  return <div style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: "34px 40px 40px", boxSizing: "border-box"}}>
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24}}>
      <div style={{fontSize: 31, fontWeight: 950, color: palette.ink}}>{content.screenQuestion}</div>
      <div style={{fontSize: 18, fontWeight: 850, color: palette.muted}}>{content.primaryElement}</div>
    </div>
    <div style={{position: "relative", display: "grid", gridTemplateColumns: `repeat(${Math.max(1, items.length)},1fr)`, gap: 18, alignItems: "center"}}>
      <div aria-hidden="true" style={{position: "absolute", left: "5%", right: "5%", top: "50%", height: 5, borderRadius: 99, background: "rgba(7,142,174,.35)"}}/>
      {items.map((item, index) => <div key={item.key} data-timeline-item={precision} style={{...revealStyle(content, item.revealAtMs), position: "relative", zIndex: 2, alignSelf: index % 2 === 0 ? "start" : "end", padding: "18px 18px 20px", borderRadius: 14, background: palette.paper, border: `2px solid ${toneColor(item.tone)}55`, boxShadow: "0 12px 25px rgba(0,0,0,.13)"}}>
        <div style={{position: "absolute", left: "calc(50% - 8px)", [index % 2 === 0 ? "bottom" : "top"]: -34, width: 16, height: 16, borderRadius: 99, background: toneColor(item.tone), boxShadow: `0 0 0 7px ${toneColor(item.tone)}20`}}/>
        <div style={{fontSize: 21, fontWeight: 850, color: palette.muted}}>{item.label}</div>
        <div style={{marginTop: 8, fontSize: 28, lineHeight: 1.18, fontWeight: 950, color: palette.ink}}>{item.value}</div>
      </div>)}
    </div>
  </div>;
};

export const EventReactionTimelineTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const config = content.templateConfig.reactionTimeline;
  if (!config) throw new Error("event-reaction-timeline requires reactionTimeline config");
  return config.precision === "verified-intraday-series"
    ? <SeriesView content={content}/>
    : <SequenceView content={content}/>;
};
