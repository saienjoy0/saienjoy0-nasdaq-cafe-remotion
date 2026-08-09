import type {PublicMainContent, PublicNumber} from "../../spec/public-view-model";

const palette = {
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  paper: "rgba(248,251,253,.94)",
} as const;

const revealStyle = (content: PublicMainContent, revealAtMs: number): React.CSSProperties => {
  const elapsed = content.sceneTimeMs - revealAtMs;
  const progress = Math.max(0, Math.min(1, elapsed / 320));
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 12}px)`,
  };
};

type TimelineObject = PublicNumber | {key: string; label: string; value: string; revealAtMs: number; tone: string};

const orderedTimelineObjects = (content: PublicMainContent): TimelineObject[] => {
  const config = content.templateConfig.reactionTimeline;
  if (!config) return [];
  const byId = new Map<string, TimelineObject[]>([
    ...content.numbers.map((item) => [item.key, [item] as TimelineObject[]] as const),
    ...content.cards.map((item) => [item.key, item.lines.length > 0
      ? item.lines.map((line, index) => ({
          key: `${item.key}-${index + 1}`,
          label: line.label,
          value: line.value,
          revealAtMs: item.revealAtMs + index * 620,
          tone: line.tone,
        }))
      : [{key: item.key, label: item.title, value: item.title, revealAtMs: item.revealAtMs, tone: "neutral"}]] as const),
  ]);
  return config.eventOrderIds.flatMap((id) => byId.get(id) ?? []);
};

const toneColor = (tone: string) =>
  tone === "positive" ? palette.positive :
    tone === "negative" ? palette.negative :
      tone === "warning" ? palette.warning : palette.cyan;

const SeriesView: React.FC<{content: PublicMainContent}> = ({content}) => {
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

  return <div style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: "34px 44px 38px", boxSizing: "border-box"}}>
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

const splitTimelineValue = (value: string) => {
  const match = value.match(/^(翌日|(?:[0-2]?\d:[0-5]\d)\s*ET)\s*(.*)$/u);
  return match ? {time: match[1], body: match[2]} : {time: "", body: value};
};

const SequenceView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = orderedTimelineObjects(content);
  const precision = content.templateConfig.reactionTimeline!.precision;
  const bodySize = items.length <= 3 ? 38 : 32;
  return <div style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: "32px 38px 38px", boxSizing: "border-box"}}>
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24}}>
      <div style={{fontSize: 34, fontWeight: 950, color: palette.ink}}>{content.screenQuestion}</div>
      <div style={{fontSize: 22, fontWeight: 850, color: palette.muted}}>{content.primaryElement}</div>
    </div>
    <div data-timeline-count={items.length} style={{position: "relative", display: "grid", gridTemplateColumns: `repeat(${Math.max(1, items.length)},minmax(0,1fr))`, gap: 22, alignItems: "center", minHeight: 0}}>
      {items.length > 1 ? <div aria-hidden="true" style={{position: "absolute", left: "8%", right: "8%", top: "50%", height: 4, borderRadius: 99, background: "rgba(7,142,174,.28)"}}/> : null}
      {items.map((item, index) => {
        const parts = splitTimelineValue(item.value);
        return <div key={item.key} data-timeline-item={precision} style={{...revealStyle(content, item.revealAtMs), position: "relative", zIndex: 2, minWidth: 0, minHeight: 250, padding: "24px 22px", borderRadius: 22, background: "rgba(248,251,253,.96)", border: `3px solid ${toneColor(item.tone)}66`, boxShadow: "0 14px 28px rgba(0,0,0,.14)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
          <div style={{position: "absolute", left: "calc(50% - 10px)", top: "calc(50% - 10px)", width: 20, height: 20, borderRadius: 99, background: toneColor(item.tone), boxShadow: `0 0 0 8px ${toneColor(item.tone)}20`, zIndex: -1}}/>
          <div style={{minHeight: 40, fontSize: 28, lineHeight: 1.15, fontWeight: 950, color: toneColor(item.tone)}}>{parts.time || item.label}</div>
          <div style={{marginTop: 18, fontSize: bodySize, lineHeight: 1.18, fontWeight: 950, color: palette.ink, overflowWrap: "anywhere"}}>{parts.body}</div>
        </div>;
      })}
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
