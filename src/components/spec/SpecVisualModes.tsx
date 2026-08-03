import {Easing, interpolate, spring, useVideoConfig} from "remotion";
import type {
  PublicCard,
  PublicMainContent,
  PublicNumber,
} from "../../spec/public-view-model";

const colors = {
  paper: "rgba(248,251,253,.96)",
  paperSoft: "rgba(229,239,246,.95)",
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  neutral: "#527691",
  emphasis: "#7046a8",
  white: "#f8fbff",
  dark: "rgba(5,13,27,.92)",
};

type Tone = PublicCard["lines"][number]["tone"];
type MotionItem = {
  revealAtMs: number;
  highlighted: boolean;
  highlightedAtMs: number | null;
};

const toneColor = (tone: Tone) => colors[tone];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const revealProgress = (
  content: PublicMainContent,
  item: Pick<MotionItem, "revealAtMs">,
  fps: number,
) => spring({
  fps,
  frame: Math.max(0, Math.round(((content.sceneTimeMs - item.revealAtMs) / 1000) * fps)),
  config: {damping: 18, stiffness: 125, mass: 0.7},
  durationInFrames: Math.max(15, Math.round(fps * 0.7)),
});

const highlightProgress = (
  content: PublicMainContent,
  item: MotionItem,
  fps: number,
) => item.highlighted && item.highlightedAtMs !== null
  ? spring({
      fps,
      frame: Math.max(0, Math.round(((content.sceneTimeMs - item.highlightedAtMs) / 1000) * fps)),
      config: {damping: 13, stiffness: 160, mass: 0.6},
      durationInFrames: Math.max(10, Math.round(fps * 0.45)),
    })
  : 0;

const motionStyle = (
  content: PublicMainContent,
  item: MotionItem,
  fps: number,
  axis: "x" | "y" = "x",
): React.CSSProperties => {
  const reveal = revealProgress(content, item, fps);
  const emphasis = highlightProgress(content, item, fps);
  const shift = interpolate(reveal, [0, 1], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return {
    opacity: interpolate(reveal, [0, 0.3, 1], [0, 0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: axis === "x" ? `${shift}px 0px` : `0px ${shift}px`,
    scale: interpolate(reveal + emphasis * 0.08, [0, 1.08], [0.94, 1.04], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};

const Surface: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({children, accent = colors.cyan, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 28,
  color: colors.ink,
  background: `linear-gradient(145deg,${colors.paper},${colors.paperSoft})`,
  border: `3px solid ${accent}`,
  boxShadow: "0 22px 50px rgba(0,0,0,.26)",
  ...style,
}}>{children}</div>;

const Pill: React.FC<{children: React.ReactNode; tone?: Tone}> = ({children, tone = "neutral"}) => <div style={{
  display: "inline-flex",
  alignItems: "center",
  minHeight: 42,
  padding: "4px 18px",
  borderRadius: 999,
  color: toneColor(tone),
  background: `${toneColor(tone)}18`,
  border: `2px solid ${toneColor(tone)}`,
  fontSize: 25,
  lineHeight: 1.2,
  fontWeight: 950,
}}>{children}</div>;

const parseNumeric = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const numeric = Number(match[0]);
  if (!Number.isFinite(numeric)) return null;
  return {
    numeric,
    decimals: match[0].includes(".") ? match[0].split(".")[1].length : 0,
    explicitPlus: match[0].startsWith("+"),
  };
};

const AnimatedValue: React.FC<{
  content: PublicMainContent;
  number: PublicNumber;
  size?: number;
}> = ({content, number, size = 66}) => {
  const {fps} = useVideoConfig();
  const progress = revealProgress(content, number, fps);
  const parsed = parseNumeric(number.value);
  const value = parsed
    ? `${parsed.explicitPlus && parsed.numeric >= 0 ? "+" : ""}${(parsed.numeric * progress).toFixed(parsed.decimals)}`
    : number.value;
  return <div style={{display: "flex", alignItems: "baseline", gap: 9, whiteSpace: "nowrap"}}>
    <span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{value}</span>
    <span style={{fontSize: Math.round(size * 0.45), fontWeight: 900}}>{number.unit}</span>
  </div>;
};

const CardPanel: React.FC<{
  content: PublicMainContent;
  card: PublicCard;
  compact?: boolean;
}> = ({content, card, compact = false}) => {
  const {fps} = useVideoConfig();
  const tone = card.lines[0]?.tone ?? "neutral";
  return <div style={{
    ...motionStyle(content, card, fps),
    height: "100%",
    boxSizing: "border-box",
    padding: compact ? 22 : 30,
    borderRadius: 23,
    background: `${toneColor(tone)}0d`,
    border: `${card.highlighted ? 6 : 3}px solid ${toneColor(tone)}`,
    boxShadow: card.highlighted ? `0 0 0 7px ${toneColor(tone)}25` : "0 12px 24px rgba(16,32,51,.10)",
  }}>
    <div style={{fontSize: compact ? 29 : 36, lineHeight: 1.2, fontWeight: 950}}>{card.title}</div>
    <div style={{display: "grid", gap: compact ? 11 : 16, marginTop: compact ? 16 : 24}}>
      {card.lines.map((line) => <div key={`${line.label}-${line.value}`} style={{display: "grid", gridTemplateColumns: compact ? "120px 1fr" : "165px 1fr", gap: 14, alignItems: "center", borderLeft: `7px solid ${toneColor(line.tone)}`, paddingLeft: 14}}>
        <div style={{fontSize: compact ? 22 : 27, color: colors.muted, fontWeight: 850}}>{line.label}</div>
        <div style={{fontSize: compact ? 27 : 35, lineHeight: 1.22, fontWeight: 950}}>{line.value}</div>
      </div>)}
    </div>
  </div>;
};

const ConclusionCard: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const card = content.cards[0];
  if (!card) return <TextFocus content={content}/>;
  const [direction, conclusion, ...rest] = card.lines;
  const reveal = motionStyle(content, card, fps, "y");
  return <Surface accent={toneColor(conclusion?.tone ?? "emphasis")} style={{padding: "38px 48px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}}>
    <div style={{...reveal, display: "flex", justifyContent: "space-between", alignItems: "center"}}>
      <Pill tone={direction?.tone ?? "positive"}>{direction?.label ?? card.title}</Pill>
      <div style={{fontSize: 86, lineHeight: 1, fontWeight: 950, color: toneColor(direction?.tone ?? "positive")}}>{direction?.value}</div>
    </div>
    <div style={{...reveal, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12px 34px", borderRadius: 24, background: "rgba(112,70,168,.09)"}}>
      <div><div style={{fontSize: 27, color: colors.muted, fontWeight: 900}}>{conclusion?.label ?? "中心"}</div><div style={{marginTop: 12, fontSize: 58, lineHeight: 1.18, color: colors.emphasis, fontWeight: 950}}>{conclusion?.value ?? card.title}</div></div>
    </div>
    <div style={{display: "flex", gap: 14}}>{rest.map((line) => <div key={line.label} style={{flex: 1, padding: "14px 18px", borderRadius: 16, background: `${toneColor(line.tone)}12`, borderLeft: `6px solid ${toneColor(line.tone)}`, fontSize: 25, fontWeight: 900}}>{line.value}</div>)}</div>
  </Surface>;
};

const NumberComparison: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const values = content.numbers.map((number) => Math.abs(parseNumeric(number.value)?.numeric ?? 0));
  const max = Math.max(1, ...values);
  return <Surface style={{padding: "30px 42px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18}}>
    {content.numbers.map((number, index) => {
      const progress = revealProgress(content, number, fps);
      return <div key={number.key} style={{...motionStyle(content, number, fps), display: "grid", gridTemplateColumns: "250px 1fr 230px", gap: 22, alignItems: "center", minHeight: 112}}>
        <div><div style={{fontSize: 33, lineHeight: 1.15, fontWeight: 950}}>{number.label}</div>{number.comparison ? <div style={{fontSize: 22, color: colors.muted, marginTop: 8, fontWeight: 800}}>{number.comparison}</div> : null}</div>
        <div style={{height: 64, borderRadius: 15, background: "rgba(82,118,145,.13)", border: "2px solid rgba(82,118,145,.25)", overflow: "hidden"}}><div style={{height: "100%", width: `${(values[index] / max) * 100 * progress}%`, borderRadius: 12, background: `linear-gradient(90deg,${toneColor(number.tone)}88,${toneColor(number.tone)})`}}/></div>
        <div style={{color: toneColor(number.tone), textAlign: "right"}}><AnimatedValue content={content} number={number} size={56}/></div>
      </div>;
    })}
  </Surface>;
};

const ExpectedActualGap: React.FC<{content: PublicMainContent}> = ({content}) => {
  const cards = [...content.cards].sort((a, b) => a.revealAtMs - b.revealAtMs);
  const labels = {expected: "EXPECTED", actual: "ACTUAL", gap: "GAP"} as const;
  return <Surface accent={colors.emphasis} style={{padding: "30px 34px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20}}>
    {cards.map((card) => <div key={card.key} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 13, minWidth: 0}}>
      <div style={{textAlign: "center"}}><Pill tone={card.role === "gap" ? "emphasis" : card.role === "actual" ? "positive" : "neutral"}>{card.role ? labels[card.role] : card.title}</Pill></div>
      <CardPanel content={content} card={card} compact/>
    </div>)}
  </Surface>;
};

const Timeline: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const beatDuration = Math.max(1, content.beatEndMs - content.beatStartMs);
  return <Surface style={{padding: "32px 48px", display: "flex", flexDirection: "column", justifyContent: "center"}}>
    <div style={{position: "absolute", left: 76, top: 70, bottom: 70, width: 7, borderRadius: 99, background: "rgba(7,142,174,.25)"}}/>
    <div style={{display: "grid", gap: 19}}>{content.texts.map((text, index) => {
      const item: MotionItem = {revealAtMs: content.beatStartMs + Math.min(index * 650, beatDuration * 0.65), highlighted: false, highlightedAtMs: null};
      return <div key={`${index}-${text}`} style={{...motionStyle(content, item, fps), position: "relative", marginLeft: 58, padding: "18px 26px", borderRadius: 18, background: "rgba(7,142,174,.08)", border: "2px solid rgba(7,142,174,.28)", fontSize: 33, lineHeight: 1.28, fontWeight: 900}}><span style={{position: "absolute", left: -46, top: 22, width: 25, height: 25, borderRadius: 99, background: colors.cyan, border: `6px solid ${colors.paper}`}}/>{text}</div>;
    })}</div>
  </Surface>;
};

const Chart: React.FC<{content: PublicMainContent}> = ({content}) => <NumberComparison content={content}/>;

const CausalDiagram: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const nodes = [...content.nodes].sort((a, b) => a.revealAtMs - b.revealAtMs);
  const positions = new Map(nodes.map((node, index) => [node.key, {
    x: nodes.length <= 1 ? 50 : 11 + (78 * index) / (nodes.length - 1),
    y: index % 2 === 0 ? 42 : 61,
  }]));
  return <Surface accent={colors.emphasis} style={{padding: 0}}>
    <svg viewBox="0 0 1400 620" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}>
      <defs><marker id="story-arrowhead" markerWidth="13" markerHeight="13" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={colors.cyan}/></marker></defs>
      {content.arrows.map((arrow) => {
        const from = positions.get(arrow.fromKey);
        const to = positions.get(arrow.toKey);
        if (!from || !to) return null;
        const progress = revealProgress(content, arrow, fps);
        const x1 = from.x * 14; const y1 = from.y * 6.2; const x2 = to.x * 14; const y2 = to.y * 6.2;
        return <g key={arrow.key} opacity={progress}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke={arrow.highlighted ? colors.warning : colors.cyan} strokeWidth={arrow.highlighted ? 10 : 7} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#story-arrowhead)"/>
          {arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 20} fill={colors.ink} fontSize="25" textAnchor="middle" stroke={colors.paper} strokeWidth="9" paintOrder="stroke" fontWeight="900">{arrow.label}</text> : null}
        </g>;
      })}
    </svg>
    {nodes.map((node) => {
      const point = positions.get(node.key)!;
      return <div key={node.key} style={{...motionStyle(content, node, fps, "y"), position: "absolute", left: `${point.x}%`, top: `${point.y}%`, translate: "-50% -50%", width: 255, minHeight: 122, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: 20, borderRadius: 24, textAlign: "center", background: node.highlighted ? "rgba(186,107,0,.14)" : "rgba(7,142,174,.09)", border: `${node.highlighted ? 6 : 3}px solid ${node.highlighted ? colors.warning : colors.cyan}`, fontSize: 29, lineHeight: 1.24, fontWeight: 950}}>{node.label}</div>;
    })}
  </Surface>;
};

const StockComparison: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const values = content.numbers.map((number) => parseNumeric(number.value)?.numeric ?? 0);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return <Surface accent={colors.emphasis} style={{padding: "28px 42px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16}}>
    {content.numbers.map((number, index) => {
      const value = values[index];
      const progress = revealProgress(content, number, fps);
      const width = `${(Math.abs(value) / max) * 47 * progress}%`;
      return <div key={number.key} style={{...motionStyle(content, number, fps), display: "grid", gridTemplateColumns: "240px 1fr 190px", gap: 20, alignItems: "center", minHeight: 94}}>
        <div style={{fontSize: 31, fontWeight: 950}}>{number.label}</div>
        <div style={{position: "relative", height: 55, borderRadius: 14, background: "rgba(82,118,145,.12)", border: "2px solid rgba(82,118,145,.23)", overflow: "hidden"}}><div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: colors.muted}}/><div style={{position: "absolute", top: 5, bottom: 5, ...(value < 0 ? {right: "50%", width} : {left: "50%", width}), borderRadius: 10, background: toneColor(number.tone)}}/></div>
        <div style={{color: toneColor(number.tone), textAlign: "right"}}><AnimatedValue content={content} number={number} size={49}/></div>
      </div>;
    })}
  </Surface>;
};

const NewsMedia: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "flex-end"}}>{content.cards.map((card) => <div key={card.key} style={{width: 480, height: "auto"}}><CardPanel content={content} card={card} compact/></div>)}</div>;

const VerificationPoints: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  return <Surface accent={colors.warning} style={{padding: "34px 46px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20}}>
    {content.cards.map((card) => <CardPanel key={card.key} content={content} card={card} compact/>)}
    {content.texts.map((text, index) => {
      const item: MotionItem = {revealAtMs: content.beatStartMs + index * 650, highlighted: false, highlightedAtMs: null};
      return <div key={text} style={{...motionStyle(content, item, fps), display: "grid", gridTemplateColumns: "52px 1fr", gap: 16, alignItems: "center", padding: "18px 24px", borderRadius: 18, background: "rgba(186,107,0,.08)", border: "2px solid rgba(186,107,0,.28)", fontSize: 31, lineHeight: 1.25, fontWeight: 900}}><div style={{width: 38, height: 38, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: colors.white, background: colors.warning, fontSize: 25, fontWeight: 950}}>✓</div>{text}</div>;
    })}
  </Surface>;
};

const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const beatDuration = Math.max(1, content.beatEndMs - content.beatStartMs);
  return <Surface accent={colors.emphasis} style={{padding: "42px 54px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26}}>
    {content.texts.map((text, index) => {
      const item: MotionItem = {revealAtMs: content.beatStartMs + Math.min(index * 800, beatDuration * 0.65), highlighted: index === content.texts.length - 1, highlightedAtMs: content.beatStartMs + Math.min(index * 800, beatDuration * 0.65)};
      return <div key={`${index}-${text}`} style={{...motionStyle(content, item, fps), position: "relative", padding: "22px 18px 22px 30px", fontSize: index === content.texts.length - 1 ? 54 : 42, lineHeight: 1.28, color: index === content.texts.length - 1 ? colors.emphasis : colors.ink, fontWeight: 950}}><span style={{position: "absolute", left: 0, top: 12, bottom: 12, width: 9, borderRadius: 99, background: index === content.texts.length - 1 ? colors.emphasis : colors.cyan}}/>{text}</div>;
    })}
  </Surface>;
};

const entityTypeLabel = {person: "人物", company: "企業", product: "製品"} as const;

const EntityFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  if (!content.entity) throw new Error("entity mode requires entity metadata");
  const {fps} = useVideoConfig();
  const item: MotionItem = {revealAtMs: content.beatStartMs, highlighted: true, highlightedAtMs: content.beatStartMs + 350};
  return <div style={{...motionStyle(content, item, fps, "y"), position: "absolute", right: 22, bottom: 28, width: 690, minHeight: 260, boxSizing: "border-box", padding: "32px 38px", borderRadius: 26, color: colors.white, background: "linear-gradient(135deg,rgba(5,13,27,.94),rgba(13,48,70,.94))", border: `4px solid ${colors.cyan}`, boxShadow: "0 18px 44px rgba(0,0,0,.38)"}}>
    <Pill tone="neutral">{entityTypeLabel[content.entity.subjectType]}</Pill>
    <div style={{marginTop: 20, fontSize: 55, lineHeight: 1.1, fontWeight: 950}}>{content.entity.displayName}</div>
    <div style={{marginTop: 19, color: "#c7d8e5", fontSize: 32, lineHeight: 1.3, fontWeight: 850}}>{content.entity.role}</div>
  </div>;
};

export const SpecVisualMode: React.FC<{content: PublicMainContent}> = ({content}) => {
  switch (content.renderKind) {
    case "conclusion": return <ConclusionCard content={content}/>;
    case "numbers": return <NumberComparison content={content}/>;
    case "expected-actual-gap": return <ExpectedActualGap content={content}/>;
    case "timeline": return <Timeline content={content}/>;
    case "chart": return <Chart content={content}/>;
    case "causal": return <CausalDiagram content={content}/>;
    case "stock-comparison": return <StockComparison content={content}/>;
    case "news": return <NewsMedia content={content}/>;
    case "verification": return <VerificationPoints content={content}/>;
    case "entity": return <EntityFocus content={content}/>;
    case "text": return <TextFocus content={content}/>;
  }
};
