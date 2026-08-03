import type {
  PublicCard,
  PublicMainContent,
  PublicNumber,
} from "../../spec/public-view-model";

const colors = {
  panel: "rgba(8,17,34,.94)",
  panelSoft: "rgba(13,29,52,.88)",
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
  return <div style={{height: "100%", boxSizing: "border-box", padding: 30, borderRadius: 22, background: colors.panel, border: `3px solid ${toneColor(tone)}`, boxShadow: card.highlighted ? `0 0 0 6px ${colors.cyan}` : "0 16px 36px rgba(0,0,0,.24)"}}>
    <div style={{fontSize: 39, lineHeight: 1.22, fontWeight: 950}}>{card.title}</div>
    <div style={{display: "grid", gap: 16, marginTop: 22}}>{card.lines.map((line, index) => <div key={`${index}-${line.label}`} style={{display: "grid", gridTemplateColumns: "minmax(150px,.72fr) 1.28fr", gap: 18, alignItems: "center", borderLeft: `8px solid ${toneColor(line.tone)}`, paddingLeft: 18}}><div style={{color: colors.muted, fontSize: 27, fontWeight: 850}}>{line.label}</div><div style={{fontSize: 33, lineHeight: 1.25, fontWeight: 950}}>{line.value}</div></div>)}</div>
  </div>;
};

const NumberView: React.FC<{number: PublicNumber}> = ({number}) => <div data-number-tone={number.tone} style={{height: "100%", boxSizing: "border-box", padding: 30, borderRadius: 22, background: `linear-gradient(145deg,${colors.panel},${colors.panelSoft})`, border: `3px solid ${toneColor(number.tone)}`, boxShadow: number.highlighted ? `0 0 0 6px ${colors.cyan}` : "0 18px 38px rgba(0,0,0,.24)", display: "flex", flexDirection: "column", justifyContent: "center"}}>
  <div style={{fontSize: 30, color: colors.muted, fontWeight: 850}}>{number.label}</div>
  <div style={{display: "flex", alignItems: "baseline", gap: 12, marginTop: 12, flexWrap: "wrap"}}><span style={{fontSize: 76, lineHeight: 1, fontWeight: 950}}>{number.value}</span><span style={{fontSize: 34, fontWeight: 900}}>{number.unit}</span></div>
  {number.comparison ? <div style={{fontSize: 27, lineHeight: 1.3, color: colors.cyan, marginTop: 16, fontWeight: 800}}>{number.comparison}</div> : null}
</div>;

const responsiveGrid = (count: number) => {
  if (count <= 1) return "1fr";
  if (count === 2) return "repeat(2,minmax(0,1fr))";
  if (count === 3) return "repeat(3,minmax(0,1fr))";
  return "repeat(2,minmax(0,1fr))";
};

const ConclusionCard: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: "92%", minHeight: 360}}>{content.cards.map((card) => <CardView key={card.key} card={card}/>)}</div></div>;
const NumberComparison: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: responsiveGrid(content.numbers.length), gridAutoRows: content.numbers.length > 3 ? "minmax(0,1fr)" : "auto", gap: 24, alignItems: "stretch", padding: 18, boxSizing: "border-box"}}>{content.numbers.map((number) => <NumberView key={number.key} number={number}/>)}</div>;
const ExpectedActualGap: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 22, alignItems: "stretch", padding: 12, boxSizing: "border-box"}}>{(["expected", "actual", "gap"] as const).map((role) => {const card = content.cards.find((item) => item.role === role); if (!card) throw new Error(`expected-actual-gap missing role: ${role}`); return <CardView key={card.key} card={card}/>;})}</div>;
const Timeline: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, padding: "20px 40px 20px 70px", boxSizing: "border-box", borderLeft: `7px solid ${colors.cyan}`}}>{content.texts.map((text, index) => <div key={`${index}-${text}`} style={{position: "relative", padding: "22px 28px", borderRadius: 18, background: colors.panel, border: "2px solid rgba(125,168,199,.35)", fontSize: 34, lineHeight: 1.3, fontWeight: 900, boxShadow: "0 14px 30px rgba(0,0,0,.2)"}}><span style={{position: "absolute", left: -65, top: 28, width: 26, height: 26, borderRadius: 99, background: colors.cyan, border: "5px solid #071020"}}/>{text}</div>)}</div>;
const Chart: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{position: "relative", height: "100%", display: "grid", gridTemplateColumns: responsiveGrid(content.numbers.length), gap: 26, alignItems: "stretch", padding: "72px 42px 48px", boxSizing: "border-box", borderRadius: 28, background: "linear-gradient(180deg,rgba(5,15,31,.76),rgba(7,24,43,.94))", border: "2px solid rgba(61,220,255,.32)"}}>
  <div style={{position: "absolute", left: 42, right: 42, bottom: 38, height: 4, borderRadius: 99, background: "linear-gradient(90deg,rgba(61,220,255,.15),rgba(61,220,255,.85),rgba(61,220,255,.15))"}}/>
  {content.numbers.map((number) => <NumberView key={number.key} number={number}/>)}</div>;

const CausalDiagram: React.FC<{content: PublicMainContent}> = ({content}) => {
  const positions = new Map(content.nodes.map((node, index) => {
    const angle = content.nodes.length === 1 ? 0 : (Math.PI * 2 * index) / content.nodes.length - Math.PI / 2;
    return [node.key, {x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 31}];
  }));
  return <div style={{position: "relative", width: "100%", height: "100%", borderRadius: 28, background: "radial-gradient(circle at center,rgba(18,48,74,.46),rgba(5,12,25,.82))", border: "2px solid rgba(61,220,255,.22)"}}>
    <svg viewBox="0 0 1000 520" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}>
      <defs><marker id="spec-arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={colors.cyan}/></marker></defs>
      {content.arrows.filter((arrow) => positions.has(arrow.fromKey) && positions.has(arrow.toKey)).map((arrow) => {
        const from = positions.get(arrow.fromKey)!;
        const to = positions.get(arrow.toKey)!;
        const x1 = from.x * 10; const y1 = from.y * 5.2; const x2 = to.x * 10; const y2 = to.y * 5.2;
        return <g key={arrow.key}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={arrow.highlighted ? colors.warning : colors.cyan} strokeWidth="7" markerEnd="url(#spec-arrowhead)"/>{arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 12} fill={colors.text} fontSize="26" textAnchor="middle" stroke="#071020" strokeWidth="8" paintOrder="stroke">{arrow.label}</text> : null}</g>;
      })}
    </svg>
    {content.nodes.map((node) => {const point = positions.get(node.key)!; return <div key={node.key} style={{position: "absolute", left: `${point.x}%`, top: `${point.y}%`, translate: "-50% -50%", width: 280, minHeight: 108, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 22, borderRadius: 20, background: colors.panel, border: `3px solid ${colors.line}`, boxShadow: node.highlighted ? `0 0 0 6px ${colors.warning}` : "0 14px 30px rgba(0,0,0,.24)", fontSize: 31, fontWeight: 950}}>{node.label}</div>;})}
  </div>;
};

const StockComparison: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: responsiveGrid(content.numbers.length), gridAutoRows: content.numbers.length > 3 ? "minmax(0,1fr)" : "auto", gap: 24, alignItems: "stretch", padding: 18, boxSizing: "border-box"}}>{content.numbers.map((number) => <NumberView key={number.key} number={number}/>)}</div>;
const NewsMedia: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: responsiveGrid(content.cards.length), gap: 24, alignItems: "stretch", padding: 22, boxSizing: "border-box"}}>{content.cards.map((card) => <CardView key={card.key} card={card}/>)}</div>;
const VerificationPoints: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "grid", gridTemplateColumns: responsiveGrid(content.cards.length), gap: 24, alignItems: "stretch", padding: 22, boxSizing: "border-box"}}>{content.cards.map((card) => <CardView key={card.key} card={card}/>)}</div>;
const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => <div style={{height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, padding: 24, boxSizing: "border-box"}}>{content.texts.map((text, index) => <div key={`${index}-${text}`} style={{fontSize: 46, lineHeight: 1.35, fontWeight: 950, padding: "28px 34px", borderRadius: 22, background: colors.panel, borderLeft: `10px solid ${colors.cyan}`, boxShadow: "0 16px 34px rgba(0,0,0,.24)"}}>{text}</div>)}</div>;

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
    {noPhoto ? <div style={{position: "absolute", left: 24, top: 32, width: 608, height: 584, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "linear-gradient(145deg,rgba(20,49,75,.96),rgba(8,17,34,.96))", border: `3px solid ${colors.line}`}}>
      <div style={{width: 210, height: 210, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(61,220,255,.12)", border: `5px solid ${colors.cyan}`, fontSize: 88, fontWeight: 950}}>{entity.displayName.slice(0, 1)}</div>
      <div style={{marginTop: 34, color: colors.muted, fontSize: 31, fontWeight: 900}}>{entityTypeLabel[entity.subjectType]}</div>
    </div> : null}
    <div style={{position: "absolute", left: 664, right: 24, top: 48, bottom: 48, display: "flex", flexDirection: "column", justifyContent: "center", padding: "44px 50px", borderRadius: 24, background: colors.panel, borderLeft: `10px solid ${colors.cyan}`, boxShadow: "0 18px 40px rgba(0,0,0,.28)"}}>
      <div style={{color: colors.cyan, fontSize: 31, lineHeight: 1.3, fontWeight: 900}}>{entityTypeLabel[entity.subjectType]}</div>
      <div style={{marginTop: 20, fontSize: 58, lineHeight: 1.2, fontWeight: 950}}>{entity.displayName}</div>
      <div style={{marginTop: 30, color: colors.muted, fontSize: 37, lineHeight: 1.38, fontWeight: 850}}>{entity.role}</div>
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
