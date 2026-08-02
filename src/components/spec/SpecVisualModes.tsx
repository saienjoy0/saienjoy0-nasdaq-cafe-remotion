import type {
  PublicCard,
  PublicMainContent,
  PublicNumber,
} from "../../spec/public-view-model";

const colors = {
  panel: "rgba(8,17,34,.92)",
  line: "#2f83bd",
  text: "#f7fbff",
  muted: "#a7bdd0",
  cyan: "#3ddcff",
  positive: "#42e3a4",
  negative: "#ff6f79",
  warning: "#ffc45f",
  neutral: "#7da8c7",
  emphasis: "#c28cff",
};

type Tone = PublicCard["lines"][number]["tone"];
const toneColor = (tone: Tone) => colors[tone];

const CardView: React.FC<{card: PublicCard}> = ({card}) => {
  const tone = card.lines[0]?.tone ?? "neutral";
  return <div style={{padding: 24, borderRadius: 18, background: colors.panel, border: `2px solid ${toneColor(tone)}`, boxShadow: card.highlighted ? `0 0 0 5px ${colors.cyan}` : undefined}}>
    <div style={{fontSize: 35, lineHeight: 1.25, fontWeight: 900}}>{card.title}</div>
    <div style={{display: "grid", gap: 12, marginTop: 18}}>{card.lines.map((line, index) => <div key={`${index}-${line.label}`} style={{display: "grid", gridTemplateColumns: "minmax(140px,.7fr) 1.3fr", gap: 18, alignItems: "center", borderLeft: `7px solid ${toneColor(line.tone)}`, paddingLeft: 16}}><div style={{color: colors.muted, fontSize: 25, fontWeight: 800}}>{line.label}</div><div style={{fontSize: 30, fontWeight: 900}}>{line.value}</div></div>)}</div>
  </div>;
};

const NumberView: React.FC<{number: PublicNumber}> = ({number}) => <div data-number-tone={number.tone} style={{padding: 25, borderRadius: 18, background: colors.panel, border: `3px solid ${toneColor(number.tone)}`, boxShadow: number.highlighted ? `0 0 0 5px ${colors.cyan}` : undefined}}>
  <div style={{fontSize: 28, color: colors.muted, fontWeight: 800}}>{number.label}</div>
  <div style={{display: "flex", alignItems: "baseline", gap: 10, marginTop: 10}}><span style={{fontSize: 66, fontWeight: 950}}>{number.value}</span><span style={{fontSize: 32, fontWeight: 900}}>{number.unit}</span></div>
  {number.comparison ? <div style={{fontSize: 24, color: colors.cyan, marginTop: 10}}>{number.comparison}</div> : null}
</div>;

const ConclusionCard: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: "82%"}}>{content.cards.map((card) => <CardView key={card.key} card={card}/>)}</div></div>;
const NumberComparison: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: `repeat(${Math.min(3, content.numbers.length)}, minmax(0, 1fr))`, gap: 22, alignItems: "center"}}>{content.numbers.map((number) => <NumberView key={number.key} number={number}/>)}</div>;
const ExpectedActualGap: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18, alignItems: "stretch"}}>{(["expected", "actual", "gap"] as const).map((role) => {const card = content.cards.find((item) => item.role === role); if (!card) throw new Error(`expected-actual-gap missing role: ${role}`); return <CardView key={card.key} card={card}/>;})}</div>;
const Timeline: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, paddingLeft: 42, borderLeft: `6px solid ${colors.cyan}`}}>{content.texts.map((text, index) => <div key={`${index}-${text}`} style={{position: "relative", padding: "18px 24px", borderRadius: 14, background: colors.panel, fontSize: 31, fontWeight: 850}}><span style={{position: "absolute", left: -57, top: 26, width: 24, height: 24, borderRadius: 99, background: colors.cyan, border: "5px solid #071020"}}/>{text}</div>)}</div>;
const Chart: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", gap: 18, alignItems: "flex-end", justifyContent: "flex-end"}}>{content.numbers.map((number) => <div key={number.key} style={{width: 300}}><NumberView number={number}/></div>)}</div>;

const CausalDiagram: React.FC<{content: PublicMainContent}> = ({content}) => {
  const positions = new Map(content.nodes.map((node, index) => {
    const angle = content.nodes.length === 1 ? 0 : (Math.PI * 2 * index) / content.nodes.length - Math.PI / 2;
    return [node.key, {x: 50 + Math.cos(angle) * 35, y: 50 + Math.sin(angle) * 32}];
  }));
  return <div style={{position: "relative", width: "100%", height: "100%"}}>
    <svg viewBox="0 0 1000 520" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}>
      <defs><marker id="spec-arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={colors.cyan}/></marker></defs>
      {content.arrows.filter((arrow) => positions.has(arrow.fromKey) && positions.has(arrow.toKey)).map((arrow) => {
        const from = positions.get(arrow.fromKey)!;
        const to = positions.get(arrow.toKey)!;
        const x1 = from.x * 10; const y1 = from.y * 5.2; const x2 = to.x * 10; const y2 = to.y * 5.2;
        return <g key={arrow.key}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={arrow.highlighted ? colors.warning : colors.cyan} strokeWidth="6" markerEnd="url(#spec-arrowhead)"/>{arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 12} fill={colors.text} fontSize="24" textAnchor="middle" stroke="#071020" strokeWidth="7" paintOrder="stroke">{arrow.label}</text> : null}</g>;
      })}
    </svg>
    {content.nodes.map((node) => {const point = positions.get(node.key)!; return <div key={node.key} style={{position: "absolute", left: `${point.x}%`, top: `${point.y}%`, translate: "-50% -50%", width: 260, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20, borderRadius: 18, background: colors.panel, border: `3px solid ${colors.line}`, boxShadow: node.highlighted ? `0 0 0 5px ${colors.warning}` : undefined, fontSize: 29, fontWeight: 900}}>{node.label}</div>;})}
  </div>;
};

const StockComparison: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18, alignItems: "center"}}>{content.numbers.map((number) => <NumberView key={number.key} number={number}/>)}</div>;
const NewsMedia: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", gap: 16}}>{content.cards.map((card) => <div key={card.key} style={{width: 420}}><CardView card={card}/></div>)}</div>;
const VerificationPoints: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18, alignItems: "center"}}>{content.cards.map((card) => <CardView key={card.key} card={card}/>)}</div>;
const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22}}>{content.texts.map((text, index) => <div key={`${index}-${text}`} style={{fontSize: 42, lineHeight: 1.35, fontWeight: 900, padding: "24px 30px", borderRadius: 18, background: colors.panel, borderLeft: `8px solid ${colors.cyan}`}}>{text}</div>)}</div>;

const entityTypeLabel = {
  person: "人物",
  company: "企業",
  product: "製品",
} as const;

const EntityFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  if (!content.entity) throw new Error("entity mode requires entity metadata");
  const {entity} = content;
  const noPhoto = entity.variant === "noPhoto";
  return <div style={{position: "relative", width: "100%", height: "100%"}}>
    {noPhoto ? <div style={{position: "absolute", left: 32, top: 32, width: 520, height: 520, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "linear-gradient(145deg,rgba(20,49,75,.96),rgba(8,17,34,.96))", border: `3px solid ${colors.line}`}}>
      <div style={{width: 176, height: 176, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(61,220,255,.12)", border: `4px solid ${colors.cyan}`, fontSize: 74, fontWeight: 950}}>{entity.displayName.slice(0, 1)}</div>
      <div style={{marginTop: 30, color: colors.muted, fontSize: 28, fontWeight: 850}}>{entityTypeLabel[entity.subjectType]}</div>
    </div> : null}
    <div style={{position: "absolute", left: 600, right: 32, top: 80, bottom: 80, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 46px", borderRadius: 24, background: colors.panel, borderLeft: `9px solid ${colors.cyan}`}}>
      <div style={{color: colors.cyan, fontSize: 28, lineHeight: 1.3, fontWeight: 900}}>{entityTypeLabel[entity.subjectType]}</div>
      <div style={{marginTop: 18, fontSize: 48, lineHeight: 1.25, fontWeight: 950}}>{entity.displayName}</div>
      <div style={{marginTop: 24, color: colors.muted, fontSize: 34, lineHeight: 1.35, fontWeight: 850}}>{entity.role}</div>
    </div>
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
