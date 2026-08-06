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
