import {Easing, interpolate, spring, useVideoConfig} from "remotion";
import type {PublicCard, PublicMainContent, PublicNumber} from "../../spec/public-view-model";
import {SpecVisualMode} from "./SpecVisualModes";

const palette = {
  paper: "rgba(248,251,253,.97)",
  paperSoft: "rgba(228,239,246,.96)",
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  neutral: "#527691",
  emphasis: "#7046a8",
  white: "#f8fbff",
};

type Tone = PublicCard["lines"][number]["tone"];
const toneColor = (tone: Tone) => palette[tone];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const parseNumeric = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
};

const itemProgress = (
  content: PublicMainContent,
  revealAtMs: number,
  durationSeconds = 0.62,
) => {
  const {fps} = useVideoConfig();
  return spring({
    fps,
    frame: Math.max(0, Math.round(((content.sceneTimeMs - revealAtMs) / 1000) * fps)),
    config: {damping: 22, stiffness: 145, mass: 0.72},
    durationInFrames: Math.max(12, Math.round(fps * durationSeconds)),
  });
};

const enterStyle = (
  content: PublicMainContent,
  revealAtMs: number,
  axis: "x" | "y" = "y",
): React.CSSProperties => {
  const progress = itemProgress(content, revealAtMs);
  const distance = interpolate(progress, [0, 1], [42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return {
    opacity: interpolate(progress, [0, 0.25, 1], [0, 0.82, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: axis === "x" ? `${distance}px 0` : `0 ${distance}px`,
    scale: interpolate(progress, [0, 1], [0.95, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};

const Surface: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({children, accent = palette.cyan, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 28,
  color: palette.ink,
  background: `linear-gradient(145deg,${palette.paper},${palette.paperSoft})`,
  border: `3px solid ${accent}`,
  boxShadow: "0 22px 52px rgba(0,0,0,.27)",
  ...style,
}}>{children}</div>;

const Tag: React.FC<{children: React.ReactNode; tone?: Tone}> = ({children, tone = "neutral"}) => <div style={{
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "4px 17px",
  borderRadius: 999,
  color: toneColor(tone),
  background: `${toneColor(tone)}16`,
  border: `2px solid ${toneColor(tone)}`,
  fontSize: 24,
  fontWeight: 950,
}}>{children}</div>;

const AnimatedNumber: React.FC<{
  content: PublicMainContent;
  number: PublicNumber;
  size?: number;
}> = ({content, number, size = 68}) => {
  const progress = itemProgress(content, number.revealAtMs);
  const parsed = parseNumeric(number.value);
  const decimals = number.value.includes(".") ? number.value.split(".").at(-1)?.length ?? 0 : 0;
  const explicitPlus = number.value.trim().startsWith("+");
  const visibleValue = parsed === null
    ? number.value
    : `${explicitPlus && parsed >= 0 ? "+" : ""}${(parsed * progress).toFixed(decimals)}`;
  return <div style={{display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap"}}>
    <span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{visibleValue}</span>
    <span style={{fontSize: Math.round(size * 0.43), fontWeight: 900}}>{number.unit}</span>
  </div>;
};

const OpeningContradiction: React.FC<{content: PublicMainContent}> = ({content}) => {
  const headlineNumber = content.numbers[0];
  const leadCard = content.cards[0];
  const facts = content.numbers.slice(1, 4);
  const texts = content.texts.slice(0, 3);
  const firstReveal = headlineNumber?.revealAtMs ?? leadCard?.revealAtMs ?? content.beatStartMs;
  return <Surface accent={palette.emphasis} style={{padding: "34px 44px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}}>
    <div style={{...enterStyle(content, firstReveal), display: "flex", alignItems: "center", justifyContent: "space-between"}}>
      <div><Tag tone="positive">昨夜の方向</Tag><div style={{marginTop: 10, fontSize: 34, color: palette.muted, fontWeight: 900}}>NASDAQ</div></div>
      {headlineNumber ? <div style={{color: toneColor(headlineNumber.tone)}}><AnimatedNumber content={content} number={headlineNumber} size={88}/></div> : <div style={{fontSize: 72, color: palette.positive, fontWeight: 950}}>{leadCard?.lines[0]?.value ?? content.headline}</div>}
    </div>
    <div style={{display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, facts.length || texts.length))},minmax(0,1fr))`, gap: 18, alignItems: "stretch"}}>
      {(facts.length > 0 ? facts : texts.map((text, index) => ({key: `text-${index}`, label: text, value: "", unit: "", comparison: null, tone: index === 0 ? "positive" as const : index === 1 ? "warning" as const : "negative" as const, highlighted: false, revealAtMs: content.beatStartMs + (index + 1) * 650, highlightedAtMs: null}))).map((item) => <div key={item.key} style={{...enterStyle(content, item.revealAtMs), borderRadius: 22, padding: "24px 20px", background: `${toneColor(item.tone)}10`, border: `3px solid ${toneColor(item.tone)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
        <div style={{fontSize: 30, lineHeight: 1.2, fontWeight: 950}}>{item.label}</div>
        {item.value ? <div style={{marginTop: 13, color: toneColor(item.tone)}}><AnimatedNumber content={content} number={item} size={52}/></div> : null}
      </div>)}
    </div>
    <div style={{...enterStyle(content, content.beatStartMs + Math.min(2800, (content.beatEndMs - content.beatStartMs) * 0.58)), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24}}>
      <div style={{fontSize: 30, color: palette.muted, fontWeight: 850}}>全部が同じ理由で動いた夜ではない</div>
      <div style={{fontSize: 38, color: palette.emphasis, fontWeight: 950}}>{content.screenQuestion}</div>
    </div>
  </Surface>;
};

const ExpectedActualFlow: React.FC<{content: PublicMainContent}> = ({content}) => {
  const ordered = [...content.cards].sort((a, b) => a.revealAtMs - b.revealAtMs);
  const roleLabel = {expected: "EXPECTED", actual: "ACTUAL", gap: "GAP"} as const;
  return <Surface accent={palette.emphasis} style={{padding: "28px 32px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20}}>
    {ordered.map((card, index) => {
      const tone: Tone = card.role === "gap" ? "emphasis" : card.role === "actual" ? "positive" : "neutral";
      const progress = itemProgress(content, card.revealAtMs);
      return <div key={card.key} style={{...enterStyle(content, card.revealAtMs), display: "grid", gridTemplateRows: "auto 1fr auto", gap: 14, minWidth: 0}}>
        <div style={{textAlign: "center"}}><Tag tone={tone}>{card.role ? roleLabel[card.role] : card.title}</Tag></div>
        <div style={{borderRadius: 23, padding: 24, background: `${toneColor(tone)}0d`, border: `${card.highlighted ? 6 : 3}px solid ${toneColor(tone)}`, boxShadow: card.highlighted ? `0 0 0 7px ${toneColor(tone)}22` : "0 12px 24px rgba(16,32,51,.10)"}}>
          <div style={{fontSize: 32, lineHeight: 1.2, fontWeight: 950}}>{card.title}</div>
          <div style={{display: "grid", gap: 13, marginTop: 18}}>{card.lines.map((line) => <div key={`${line.label}-${line.value}`} style={{borderLeft: `7px solid ${toneColor(line.tone)}`, paddingLeft: 14}}><div style={{fontSize: 22, color: palette.muted, fontWeight: 850}}>{line.label}</div><div style={{marginTop: 5, fontSize: 29, lineHeight: 1.2, fontWeight: 950}}>{line.value}</div></div>)}</div>
        </div>
        <div style={{height: 8, borderRadius: 99, background: "rgba(82,118,145,.14)", overflow: "hidden"}}><div style={{height: "100%", width: `${clamp(progress) * 100}%`, background: toneColor(tone)}}/></div>
        {index < ordered.length - 1 ? <div style={{position: "absolute", right: -20, top: "48%", fontSize: 38, color: palette.cyan, fontWeight: 950}}>→</div> : null}
      </div>;
    })}
  </Surface>;
};

const BulletComparison: React.FC<{content: PublicMainContent}> = ({content}) => {
  const actual = content.numbers[0];
  const gap = content.numbers[1];
  if (!actual) return <SpecVisualMode content={content}/>;
  const actualValue = Math.abs(parseNumeric(actual.value) ?? 0);
  const expectedValue = Math.abs(parseNumeric(actual.comparison ?? "") ?? 0);
  const max = Math.max(1, actualValue, expectedValue) * 1.08;
  const progress = itemProgress(content, actual.revealAtMs);
  const actualWidth = `${clamp((actualValue / max) * progress) * 100}%`;
  const expectedLeft = `${clamp(expectedValue / max) * 100}%`;
  return <Surface accent={palette.positive} style={{padding: "42px 50px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 30}}>
    <div style={{...enterStyle(content, actual.revealAtMs), display: "flex", justifyContent: "space-between", alignItems: "center"}}><div><Tag>予想と実績</Tag><div style={{marginTop: 13, fontSize: 36, fontWeight: 950}}>{actual.label}</div></div><div style={{color: toneColor(actual.tone)}}><AnimatedNumber content={content} number={actual} size={73}/></div></div>
    <div style={{...enterStyle(content, actual.revealAtMs + 250), position: "relative", alignSelf: "center", height: 150, borderRadius: 24, background: "rgba(82,118,145,.14)", border: "2px solid rgba(82,118,145,.30)", overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: actualWidth, background: "linear-gradient(90deg,rgba(7,134,95,.55),rgba(7,134,95,.96))"}}/>
      {expectedValue > 0 ? <div style={{position: "absolute", left: expectedLeft, top: 0, bottom: 0, width: 7, background: palette.warning, boxShadow: "0 0 0 4px rgba(255,255,255,.82)"}}/> : null}
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 31px", fontSize: 31, fontWeight: 950}}><span>実績</span><span>{actual.comparison ?? "市場予想"}</span></div>
    </div>
    {gap ? <div style={{...enterStyle(content, gap.revealAtMs), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderRadius: 21, background: "rgba(112,70,168,.10)", border: `3px solid ${palette.emphasis}`}}><div style={{fontSize: 30, color: palette.muted, fontWeight: 900}}>{gap.label}</div><div style={{color: palette.emphasis}}><AnimatedNumber content={content} number={gap} size={58}/></div></div> : null}
  </Surface>;
};

const CausalLane: React.FC<{content: PublicMainContent}> = ({content}) => {
  const orderedIds = content.templateConfig.nodeOrder.length > 0 ? content.templateConfig.nodeOrder : content.nodes.map((node) => node.key);
  const nodes = orderedIds.map((id) => content.nodes.find((node) => node.key === id)).filter((node): node is NonNullable<typeof node> => Boolean(node));
  const positions = new Map(nodes.map((node, index) => [node.key, {x: nodes.length === 1 ? 50 : 10 + (80 * index) / (nodes.length - 1), y: index % 2 === 0 ? 43 : 58}]));
  return <Surface accent={palette.emphasis}>
    <svg viewBox="0 0 1400 620" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}>
      <defs><marker id="template-arrow" markerWidth="13" markerHeight="13" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={palette.cyan}/></marker></defs>
      {content.arrows.map((arrow) => {
        const from = positions.get(arrow.fromKey); const to = positions.get(arrow.toKey);
        if (!from || !to) return null;
        const progress = itemProgress(content, arrow.revealAtMs);
        const x1 = from.x * 14; const y1 = from.y * 6.2; const x2 = to.x * 14; const y2 = to.y * 6.2;
        return <g key={arrow.key} opacity={progress}><line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke={arrow.highlighted ? palette.warning : palette.cyan} strokeWidth={arrow.highlighted ? 10 : 7} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#template-arrow)"/>{arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 18} fill={palette.ink} fontSize="25" textAnchor="middle" stroke={palette.paper} strokeWidth="9" paintOrder="stroke" fontWeight="900">{arrow.label}</text> : null}</g>;
      })}
    </svg>
    {nodes.map((node) => {const point = positions.get(node.key)!; return <div key={node.key} style={{...enterStyle(content, node.revealAtMs), position: "absolute", left: `${point.x}%`, top: `${point.y}%`, translate: "-50% -50%", width: 255, minHeight: 122, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: 20, borderRadius: 24, textAlign: "center", background: node.highlighted ? "rgba(186,107,0,.14)" : "rgba(7,142,174,.09)", border: `${node.highlighted ? 6 : 3}px solid ${node.highlighted ? palette.warning : palette.cyan}`, fontSize: 29, lineHeight: 1.24, fontWeight: 950}}>{node.label}</div>;})}
    {content.uncertainty ? <div style={{position: "absolute", left: 34, right: 34, bottom: 24, color: palette.muted, fontSize: 22, textAlign: "center", fontWeight: 800}}>{content.uncertainty}</div> : null}
  </Surface>;
};

const TailwindHeadwind: React.FC<{content: PublicMainContent}> = ({content}) => {
  const lanes = content.templateConfig.laneLabels.length === 2 ? content.templateConfig.laneLabels : ["追い風", "向かい風"];
  const sourceCards = content.cards.length > 0 ? content.cards : content.texts.map((text, index): PublicCard => ({key: `lane-${index}`, title: text, lines: [{label: index % 2 === 0 ? lanes[0] : lanes[1], value: text, tone: index % 2 === 0 ? "positive" : "warning"}], highlighted: false, role: null, revealAtMs: content.beatStartMs + index * 650, highlightedAtMs: null}));
  const left = sourceCards.filter((_, index) => index % 2 === 0);
  const right = sourceCards.filter((_, index) => index % 2 === 1);
  const lane = (items: PublicCard[], title: string, tone: Tone, direction: "left" | "right") => <div style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 16}}><div style={{textAlign: "center"}}><Tag tone={tone}>{title}</Tag></div><div style={{display: "grid", gap: 14, alignContent: "center"}}>{items.map((card) => <div key={card.key} style={{...enterStyle(content, card.revealAtMs, "x"), padding: "19px 22px", borderRadius: 19, background: `${toneColor(tone)}0f`, border: `3px solid ${toneColor(tone)}`, textAlign: direction === "left" ? "right" : "left", fontSize: 30, lineHeight: 1.23, fontWeight: 930}}>{card.lines[0]?.value ?? card.title}</div>)}</div></div>;
  return <Surface accent={palette.warning} style={{padding: "30px 36px", display: "grid", gridTemplateColumns: "1fr 230px 1fr", gap: 22}}>
    {lane(left, lanes[0], "positive", "left")}
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{fontSize: 30, color: palette.muted, fontWeight: 900}}>最終結果</div><div style={{marginTop: 16, fontSize: 48, lineHeight: 1.15, color: palette.emphasis, fontWeight: 950}}>{content.primaryElement}</div><div style={{marginTop: 20, fontSize: 58, color: palette.cyan, fontWeight: 950}}>→</div></div>
    {lane(right, lanes[1], "warning", "right")}
  </Surface>;
};

const DivergingBars: React.FC<{content: PublicMainContent}> = ({content}) => {
  const values = content.numbers.map((number) => parseNumeric(number.value) ?? 0);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return <Surface accent={palette.emphasis} style={{padding: "26px 40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14}}>
    {content.numbers.map((number, index) => {
      const value = values[index]; const progress = itemProgress(content, number.revealAtMs); const width = `${clamp((Math.abs(value) / max) * progress) * 47}%`;
      return <div key={number.key} style={{...enterStyle(content, number.revealAtMs), display: "grid", gridTemplateColumns: "235px 1fr 190px", gap: 20, alignItems: "center", minHeight: 91}}><div style={{fontSize: 30, fontWeight: 950}}>{number.label}</div><div style={{position: "relative", height: 55, borderRadius: 14, background: "rgba(82,118,145,.12)", border: "2px solid rgba(82,118,145,.23)", overflow: "hidden"}}><div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: palette.muted}}/><div style={{position: "absolute", top: 5, bottom: 5, ...(value < 0 ? {right: "50%", width} : {left: "50%", width}), borderRadius: 10, background: toneColor(number.tone)}}/></div><div style={{color: toneColor(number.tone), textAlign: "right"}}><AnimatedNumber content={content} number={number} size={48}/></div></div>;
    })}
  </Surface>;
};

const VerificationMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {
  const labels = content.templateConfig.laneLabels.length === 2 ? content.templateConfig.laneLabels : ["強まる", "弱まる"];
  const items = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;
  const midpoint = Math.ceil(items.length / 2);
  const lanes = [items.slice(0, midpoint), items.slice(midpoint)];
  return <Surface accent={palette.warning} style={{padding: "28px 34px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18}}>
    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}><div style={{textAlign: "center"}}><Tag tone="positive">{labels[0]}</Tag></div><div style={{textAlign: "center"}}><Tag tone="warning">{labels[1]}</Tag></div></div>
    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>{lanes.map((laneItems, laneIndex) => <div key={labels[laneIndex]} style={{display: "grid", gap: 15, alignContent: "center"}}>{laneItems.map((text, index) => <div key={text} style={{...enterStyle(content, content.beatStartMs + (laneIndex * midpoint + index) * 620), display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "center", padding: "18px 20px", borderRadius: 18, background: laneIndex === 0 ? "rgba(7,134,95,.09)" : "rgba(186,107,0,.09)", border: `2px solid ${laneIndex === 0 ? "rgba(7,134,95,.30)" : "rgba(186,107,0,.30)"}`, fontSize: 29, lineHeight: 1.23, fontWeight: 900}}><div style={{width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: palette.white, background: laneIndex === 0 ? palette.positive : palette.warning, fontSize: 23, fontWeight: 950}}>{laneIndex === 0 ? "+" : "−"}</div>{text}</div>)}</div>)}</div>
    <div style={{textAlign: "center", color: palette.emphasis, fontSize: 33, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};

const FinalAssembly: React.FC<{content: PublicMainContent}> = ({content}) => {
  const chips = [...content.texts, ...content.cards.flatMap((card) => card.lines.map((line) => line.value))].slice(0, 4);
  const conclusion = content.primaryElement || content.headline;
  return <Surface accent={palette.emphasis} style={{padding: "40px 52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
    <div style={{...enterStyle(content, content.beatStartMs)}}><Tag tone="emphasis">今朝の結論</Tag></div>
    <div style={{display: "flex", gap: 15, marginTop: 26, width: "100%", justifyContent: "center"}}>{chips.map((chip, index) => <div key={`${index}-${chip}`} style={{...enterStyle(content, content.beatStartMs + (index + 1) * 520), flex: 1, maxWidth: 315, padding: "15px 17px", borderRadius: 17, background: "rgba(82,118,145,.10)", border: "2px solid rgba(82,118,145,.30)", fontSize: 26, lineHeight: 1.22, fontWeight: 900}}>{chip}</div>)}</div>
    <div style={{...enterStyle(content, content.beatStartMs + Math.min(2600, (content.beatEndMs - content.beatStartMs) * 0.58)), marginTop: 32, fontSize: 70, lineHeight: 1.14, color: palette.emphasis, fontWeight: 950}}>{conclusion}</div>
    <div style={{marginTop: 30, width: `${62 + content.holdProgress * 18}%`, height: 7, borderRadius: 99, background: `linear-gradient(90deg,transparent,${palette.cyan},transparent)`}}/>
  </Surface>;
};

export const VisualTemplateRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  switch (content.visualTemplate) {
    case "opening-contradiction": return <OpeningContradiction content={content}/>;
    case "closing-recap": return <FinalAssembly content={content}/>;
    case "expected-actual-bullet": return <BulletComparison content={content}/>;
    case "expected-actual-gap-flow": return <ExpectedActualFlow content={content}/>;
    case "causal-lane": return <CausalLane content={content}/>;
    case "tailwind-headwind": return <TailwindHeadwind content={content}/>;
    case "diverging-stock-bars": return <DivergingBars content={content}/>;
    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "verification-checklist": return <VerificationMatrix content={content}/>;
    case "metric-comparison-board":
    case "index-return-bars":
    case "conclusion-card":
    case "evidence-boundary":
    case "analogy-steps":
    case "entity-card-full":
    case "news-media":
    case "text-focus":
      return <SpecVisualMode content={content}/>;
  }
};
