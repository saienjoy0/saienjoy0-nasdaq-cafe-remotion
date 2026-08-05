import {Easing, interpolate, spring} from "remotion";
import type {
  PublicArrow,
  PublicCard,
  PublicMainContent,
  PublicMotionInstruction,
  PublicNode,
  PublicNumber,
} from "../../spec/public-view-model";
import {SpecVisualMode} from "./SpecVisualModes";
import {
  EntityFocusStoryTemplate,
  FinalAssemblyTemplate as FinalAssemblyStoryTemplate,
  FocusMatrixTemplate,
  HeroNumberTemplate,
  SplitComparisonTemplate,
} from "./AdditionalVisualTemplates";

const FPS = 30;
const color = {
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
type MotionSource = {
  revealAtMs: number;
  enterMotion: PublicMotionInstruction | null;
  exitMotion: PublicMotionInstruction | null;
  highlightMotion: PublicMotionInstruction | null;
  unhighlightMotion: PublicMotionInstruction | null;
  highlighted: boolean;
};

const toneColor = (tone: Tone) => color[tone];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const parseNumeric = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizedProgress = (
  content: PublicMainContent,
  startedAtMs: number,
  durationMs: number,
) => clamp((content.sceneTimeMs - startedAtMs) / Math.max(1, durationMs));

const progressAt = (
  content: PublicMainContent,
  startedAtMs: number,
  durationMs = 620,
  easing: PublicMotionInstruction["easing"] = "spring-settle",
) => {
  const normalized = normalizedProgress(content, startedAtMs, durationMs);
  if (easing === "linear") return normalized;
  if (easing === "smooth-out") {
    return interpolate(normalized, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }
  return spring({
    fps: FPS,
    frame: Math.max(0, Math.round(((content.sceneTimeMs - startedAtMs) / 1000) * FPS)),
    config: {damping: 22, stiffness: 145, mass: 0.72},
    durationInFrames: Math.max(12, Math.round((durationMs / 1000) * FPS)),
  });
};

const entryStyle = (
  content: PublicMainContent,
  revealAtMs: number,
  axis: "x" | "y" = "y",
  instruction: PublicMotionInstruction | null = null,
): React.CSSProperties => {
  const startedAtMs = instruction?.startedAtMs ?? revealAtMs;
  const durationMs = instruction?.durationMs ?? 620;
  const progress = progressAt(content, startedAtMs, durationMs, instruction?.easing ?? "spring-settle");
  const preset = instruction?.preset;
  const baseOpacity = interpolate(progress, [0, 0.25, 1], [0, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (preset === "fade-soft" || preset === "count-up" || preset === "draw-line") {
    return {opacity: baseOpacity};
  }
  if (preset === "slide-soft-left") {
    return {opacity: baseOpacity, translate: `${interpolate(progress, [0, 1], [-48, 0])}px 0`};
  }
  if (preset === "slide-soft-right") {
    return {opacity: baseOpacity, translate: `${interpolate(progress, [0, 1], [48, 0])}px 0`};
  }
  if (preset === "rise-soft") {
    return {opacity: baseOpacity, translate: `0 ${interpolate(progress, [0, 1], [48, 0])}px`};
  }
  if (preset === "scale-settle") {
    return {opacity: baseOpacity, scale: interpolate(progress, [0, 1], [0.9, 1])};
  }
  if (preset === "grow-from-baseline") {
    return {opacity: baseOpacity, scale: `1 ${interpolate(progress, [0, 1], [0.04, 1])}`, transformOrigin: "50% 100%"};
  }
  if (preset === "grow-from-center") {
    return {opacity: baseOpacity, scale: `${interpolate(progress, [0, 1], [0.04, 1])} 1`, transformOrigin: "50% 50%"};
  }
  const distance = interpolate(progress, [0, 1], [42, 0]);
  return {
    opacity: baseOpacity,
    translate: axis === "x" ? `${distance}px 0` : `0 ${distance}px`,
    scale: interpolate(progress, [0, 1], [0.95, 1]),
  };
};

const exitStyle = (
  content: PublicMainContent,
  instruction: PublicMotionInstruction | null,
): React.CSSProperties => {
  if (!instruction) return {};
  const progress = progressAt(content, instruction.startedAtMs, instruction.durationMs, instruction.easing);
  if (instruction.preset === "slide-out-soft") {
    return {opacity: 1 - progress, translate: `${interpolate(progress, [0, 1], [0, 44])}px 0`};
  }
  if (instruction.preset === "collapse-to-outcome") {
    return {opacity: 1 - progress, scale: interpolate(progress, [0, 1], [1, 0.18])};
  }
  return {opacity: 1 - progress};
};

const allMotionItems = (content: PublicMainContent): MotionSource[] => [
  ...content.cards,
  ...content.numbers,
  ...content.nodes,
  ...content.arrows,
];

const emphasisStyle = (
  content: PublicMainContent,
  item: MotionSource,
): React.CSSProperties => {
  const dimOthers = allMotionItems(content).some(
    (candidate) => candidate.highlighted && candidate.highlightMotion?.preset === "dim-others",
  );
  const style: React.CSSProperties = dimOthers && !item.highlighted
    ? {opacity: 0.34, filter: "saturate(.45)"}
    : {};
  if (!item.highlighted || !item.highlightMotion) return style;
  const progress = progressAt(
    content,
    item.highlightMotion.startedAtMs,
    item.highlightMotion.durationMs,
    item.highlightMotion.easing,
  );
  if (item.highlightMotion.preset === "focus-ring") {
    return {...style, boxShadow: `0 0 0 ${Math.round(progress * 8)}px rgba(186,107,0,.38)`};
  }
  if (item.highlightMotion.preset === "scale-focus") {
    return {...style, scale: interpolate(progress, [0, 1], [1, 1.055])};
  }
  if (item.highlightMotion.preset === "pulse-once") {
    const pulse = Math.sin(clamp(progress) * Math.PI);
    return {...style, scale: 1 + pulse * 0.055, filter: `drop-shadow(0 0 ${Math.round(pulse * 22)}px rgba(186,107,0,.55))`};
  }
  return style;
};

const motionStyle = (
  content: PublicMainContent,
  item: MotionSource,
  axis: "x" | "y" = "y",
): React.CSSProperties => ({
  ...entryStyle(content, item.revealAtMs, axis, item.enterMotion),
  ...emphasisStyle(content, item),
  ...exitStyle(content, item.exitMotion),
});

const timedStyle = (
  content: PublicMainContent,
  revealAtMs: number,
  axis: "x" | "y" = "y",
): React.CSSProperties => entryStyle(content, revealAtMs, axis);

const Surface: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties}> = ({children, accent = color.cyan, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 28,
  color: color.ink,
  background: `linear-gradient(145deg,${color.paper},${color.paperSoft})`,
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

const numberProgress = (content: PublicMainContent, number: PublicNumber) => {
  const instruction = number.enterMotion;
  return progressAt(
    content,
    instruction?.startedAtMs ?? number.revealAtMs,
    instruction?.durationMs ?? 760,
    instruction?.easing ?? "spring-settle",
  );
};

const numberValue = (number: PublicNumber) => number.numericValue ?? parseNumeric(number.value);

const AnimatedNumber: React.FC<{content: PublicMainContent; number: PublicNumber; size?: number}> = ({content, number, size = 64}) => {
  const progress = numberProgress(content, number);
  const parsed = numberValue(number);
  const decimals = number.precision ?? (number.value.includes(".") ? number.value.split(".").at(-1)?.length ?? 0 : 0);
  const explicitPlus = number.value.trim().startsWith("+");
  const value = parsed === null
    ? number.value
    : `${explicitPlus && parsed >= 0 ? "+" : ""}${(parsed * progress).toFixed(decimals)}`;
  return <div style={{display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap"}}><span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{value}</span><span style={{fontSize: Math.round(size * 0.43), fontWeight: 900}}>{number.unit}</span></div>;
};

const OpeningContradiction: React.FC<{content: PublicMainContent}> = ({content}) => {
  const lead = content.numbers[0];
  const facts = content.numbers.slice(1, 4);
  const leadAt = lead?.revealAtMs ?? content.cards[0]?.revealAtMs ?? content.beatStartMs;
  return <Surface accent={color.emphasis} style={{padding: "34px 44px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}}>
    <div style={{...(lead ? motionStyle(content, lead) : timedStyle(content, leadAt)), display: "flex", alignItems: "center", justifyContent: "space-between"}}><div><Tag tone="positive">昨夜の方向</Tag><div style={{marginTop: 10, fontSize: 34, color: color.muted, fontWeight: 900}}>NASDAQ</div></div>{lead ? <div style={{color: toneColor(lead.tone)}}><AnimatedNumber content={content} number={lead} size={88}/></div> : <div style={{fontSize: 72, color: color.positive, fontWeight: 950}}>{content.cards[0]?.lines[0]?.value ?? content.headline}</div>}</div>
    <div style={{display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, facts.length || content.texts.length))},minmax(0,1fr))`, gap: 18}}>{facts.length > 0 ? facts.map((item) => <div key={item.key} style={{...motionStyle(content, item), borderRadius: 22, padding: "24px 20px", background: `${toneColor(item.tone)}10`, border: `3px solid ${toneColor(item.tone)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{fontSize: 30, fontWeight: 950}}>{item.label}</div><div style={{marginTop: 13, color: toneColor(item.tone)}}><AnimatedNumber content={content} number={item} size={52}/></div></div>) : content.texts.slice(0, 3).map((text, index) => <div key={text} style={{...timedStyle(content, content.beatStartMs + (index + 1) * 650), borderRadius: 22, padding: "24px 20px", background: "rgba(82,118,145,.10)", border: `3px solid ${index === 0 ? color.positive : index === 1 ? color.warning : color.negative}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 34, fontWeight: 950}}>{text}</div>)}</div>
    <div style={{...timedStyle(content, content.beatStartMs + Math.min(2800, (content.beatEndMs - content.beatStartMs) * 0.58)), display: "flex", justifyContent: "space-between", gap: 24}}><div style={{fontSize: 30, color: color.muted, fontWeight: 850}}>全部が同じ理由で動いた夜ではない</div><div style={{fontSize: 38, color: color.emphasis, fontWeight: 950}}>{content.screenQuestion}</div></div>
  </Surface>;
};

const ExpectedActualFlow: React.FC<{content: PublicMainContent}> = ({content}) => {
  const cards = [...content.cards].sort((a, b) => a.revealAtMs - b.revealAtMs);
  const labels = {expected: "EXPECTED", actual: "ACTUAL", gap: "GAP"} as const;
  return <Surface accent={color.emphasis} style={{padding: "28px 32px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20}}>{cards.map((card) => {
    const tone: Tone = card.role === "gap" ? "emphasis" : card.role === "actual" ? "positive" : "neutral";
    return <div key={card.key} style={{...motionStyle(content, card), display: "grid", gridTemplateRows: "auto 1fr", gap: 14, minWidth: 0}}><div style={{textAlign: "center"}}><Tag tone={tone}>{card.role ? labels[card.role] : card.title}</Tag></div><div style={{borderRadius: 23, padding: 24, background: `${toneColor(tone)}0d`, border: `${card.highlighted ? 6 : 3}px solid ${toneColor(tone)}`, boxShadow: card.highlighted ? `0 0 0 7px ${toneColor(tone)}22` : "0 12px 24px rgba(16,32,51,.10)"}}><div style={{fontSize: 32, fontWeight: 950}}>{card.title}</div><div style={{display: "grid", gap: 13, marginTop: 18}}>{card.lines.map((line) => <div key={`${line.label}-${line.value}`} style={{borderLeft: `7px solid ${toneColor(line.tone)}`, paddingLeft: 14}}><div style={{fontSize: 22, color: color.muted, fontWeight: 850}}>{line.label}</div><div style={{marginTop: 5, fontSize: 29, lineHeight: 1.2, fontWeight: 950}}>{line.value}</div></div>)}</div></div></div>;
  })}</Surface>;
};

const BulletComparison: React.FC<{content: PublicMainContent}> = ({content}) => {
  const actual = content.numbers[0];
  const gap = content.numbers[1];
  if (!actual) return <SpecVisualMode content={content}/>;
  const actualValue = Math.abs(numberValue(actual) ?? 0);
  const expectedValue = Math.abs(parseNumeric(actual.comparison ?? "") ?? 0);
  const max = Math.max(1, actualValue, expectedValue) * 1.08;
  const progress = numberProgress(content, actual);
  return <Surface accent={color.positive} style={{padding: "42px 50px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 30}}><div style={{...motionStyle(content, actual), display: "flex", justifyContent: "space-between", alignItems: "center"}}><div><Tag>予想と実績</Tag><div style={{marginTop: 13, fontSize: 36, fontWeight: 950}}>{actual.label}</div></div><div style={{color: toneColor(actual.tone)}}><AnimatedNumber content={content} number={actual} size={73}/></div></div><div style={{...motionStyle(content, actual), position: "relative", alignSelf: "center", height: 150, borderRadius: 24, background: "rgba(82,118,145,.14)", border: "2px solid rgba(82,118,145,.30)", overflow: "hidden"}}><div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${clamp((actualValue / max) * progress) * 100}%`, background: "linear-gradient(90deg,rgba(7,134,95,.55),rgba(7,134,95,.96))", transformOrigin: "0 50%"}}/>{expectedValue > 0 ? <div style={{position: "absolute", left: `${clamp(expectedValue / max) * 100}%`, top: 0, bottom: 0, width: 7, background: color.warning, boxShadow: "0 0 0 4px rgba(255,255,255,.82)"}}/> : null}<div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 31px", fontSize: 31, fontWeight: 950}}><span>実績</span><span>{actual.comparison ?? "市場予想"}</span></div></div>{gap ? <div style={{...motionStyle(content, gap), display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderRadius: 21, background: "rgba(112,70,168,.10)", border: `3px solid ${color.emphasis}`}}><div style={{fontSize: 30, color: color.muted, fontWeight: 900}}>{gap.label}</div><div style={{color: color.emphasis}}><AnimatedNumber content={content} number={gap} size={58}/></div></div> : null}</Surface>;
};

const CausalLane: React.FC<{content: PublicMainContent}> = ({content}) => {
  const order = content.templateConfig.nodeOrder.length > 0 ? content.templateConfig.nodeOrder : content.nodes.map((node) => node.key);
  const nodes = order.map((id) => content.nodes.find((node) => node.key === id)).filter((node): node is PublicNode => Boolean(node));
  const positions = new Map(nodes.map((node, index) => [node.key, {x: nodes.length === 1 ? 50 : 10 + (80 * index) / (nodes.length - 1), y: index % 2 === 0 ? 43 : 58}]));
  return <Surface accent={color.emphasis}><svg viewBox="0 0 1400 620" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}><defs><marker id="story-template-arrow" markerWidth="13" markerHeight="13" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={color.cyan}/></marker></defs>{content.arrows.map((arrow: PublicArrow) => {const from = positions.get(arrow.fromKey); const to = positions.get(arrow.toKey); if (!from || !to) return null; const instruction = arrow.enterMotion; const progress = progressAt(content, instruction?.startedAtMs ?? arrow.revealAtMs, instruction?.durationMs ?? 720, instruction?.easing ?? "smooth-out"); const x1 = from.x * 14; const y1 = from.y * 6.2; const x2 = to.x * 14; const y2 = to.y * 6.2; return <g key={arrow.key} style={emphasisStyle(content, arrow)} opacity={progress}><line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke={arrow.highlighted ? color.warning : color.cyan} strokeWidth={arrow.highlighted ? 10 : 7} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#story-template-arrow)"/>{arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 18} fill={color.ink} fontSize="25" textAnchor="middle" stroke={color.paper} strokeWidth="9" paintOrder="stroke" fontWeight="900">{arrow.label}</text> : null}</g>;})}</svg>{nodes.map((node: PublicNode) => {const point = positions.get(node.key)!; return <div key={node.key} style={{...motionStyle(content, node), position: "absolute", left: `${point.x}%`, top: `${point.y}%`, translate: "-50% -50%", width: 255, minHeight: 122, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: 20, borderRadius: 24, textAlign: "center", background: node.highlighted ? "rgba(186,107,0,.14)" : "rgba(7,142,174,.09)", border: `${node.highlighted ? 6 : 3}px solid ${node.highlighted ? color.warning : color.cyan}`, fontSize: 29, lineHeight: 1.24, fontWeight: 950}}>{node.label}</div>;})}{content.uncertainty ? <div style={{position: "absolute", left: 34, right: 34, bottom: 24, color: color.muted, fontSize: 22, textAlign: "center", fontWeight: 800}}>{content.uncertainty}</div> : null}</Surface>;
};

const TailwindHeadwind: React.FC<{content: PublicMainContent}> = ({content}) => {
  const labels = content.templateConfig.laneLabels.length === 2 ? content.templateConfig.laneLabels : ["追い風", "向かい風"];
  const texts = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;
  const left = texts.filter((_, index) => index % 2 === 0);
  const right = texts.filter((_, index) => index % 2 === 1);
  const lane = (items: string[], label: string, tone: Tone, offset: number) => <div style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 16}}><div style={{textAlign: "center"}}><Tag tone={tone}>{label}</Tag></div><div style={{display: "grid", gap: 14, alignContent: "center"}}>{items.map((text, index) => <div key={text} style={{...timedStyle(content, content.beatStartMs + (offset + index) * 620, "x"), padding: "19px 22px", borderRadius: 19, background: `${toneColor(tone)}0f`, border: `3px solid ${toneColor(tone)}`, textAlign: "center", fontSize: 30, lineHeight: 1.23, fontWeight: 930}}>{text}</div>)}</div></div>;
  return <Surface accent={color.warning} style={{padding: "30px 36px", display: "grid", gridTemplateColumns: "1fr 230px 1fr", gap: 22}}>{lane(left, labels[0], "positive", 0)}<div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{fontSize: 30, color: color.muted, fontWeight: 900}}>最終結果</div><div style={{marginTop: 16, fontSize: 48, lineHeight: 1.15, color: color.emphasis, fontWeight: 950}}>{content.primaryElement}</div></div>{lane(right, labels[1], "warning", left.length)}</Surface>;
};

const DivergingBars: React.FC<{content: PublicMainContent}> = ({content}) => {
  const values = content.numbers.map((number) => numberValue(number) ?? 0);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  return <Surface accent={color.emphasis} style={{padding: "26px 40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14}}>{content.numbers.map((number, index) => {const value = values[index]; const width = `${clamp((Math.abs(value) / max) * numberProgress(content, number)) * 47}%`; return <div key={number.key} style={{...motionStyle(content, number), display: "grid", gridTemplateColumns: "235px 1fr 190px", gap: 20, alignItems: "center", minHeight: 91}}><div style={{fontSize: 30, fontWeight: 950}}>{number.label}</div><div style={{position: "relative", height: 55, borderRadius: 14, background: "rgba(82,118,145,.12)", border: "2px solid rgba(82,118,145,.23)", overflow: "hidden"}}><div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: color.muted}}/><div style={{position: "absolute", top: 5, bottom: 5, ...(value < 0 ? {right: "50%", width} : {left: "50%", width}), borderRadius: 10, background: toneColor(number.tone)}}/></div><div style={{color: toneColor(number.tone), textAlign: "right"}}><AnimatedNumber content={content} number={number} size={48}/></div></div>;})}</Surface>;
};

const VerificationMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {
  const labels = content.templateConfig.laneLabels.length === 2 ? content.templateConfig.laneLabels : ["強まる", "弱まる"];
  const items = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;
  const midpoint = Math.ceil(items.length / 2);
  const lanes = [items.slice(0, midpoint), items.slice(midpoint)];
  return <Surface accent={color.warning} style={{padding: "28px 34px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18}}><div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}><div style={{textAlign: "center"}}><Tag tone="positive">{labels[0]}</Tag></div><div style={{textAlign: "center"}}><Tag tone="warning">{labels[1]}</Tag></div></div><div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>{lanes.map((laneItems, laneIndex) => <div key={labels[laneIndex]} style={{display: "grid", gap: 15, alignContent: "center"}}>{laneItems.map((text, index) => <div key={text} style={{...timedStyle(content, content.beatStartMs + (laneIndex * midpoint + index) * 620), display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "center", padding: "18px 20px", borderRadius: 18, background: laneIndex === 0 ? "rgba(7,134,95,.09)" : "rgba(186,107,0,.09)", border: `2px solid ${laneIndex === 0 ? "rgba(7,134,95,.30)" : "rgba(186,107,0,.30)"}`, fontSize: 29, lineHeight: 1.23, fontWeight: 900}}><div style={{width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: laneIndex === 0 ? color.positive : color.warning, fontSize: 23, fontWeight: 950}}>{laneIndex === 0 ? "+" : "−"}</div>{text}</div>)}</div>)}</div><div style={{textAlign: "center", color: color.emphasis, fontSize: 33, fontWeight: 950}}>{content.primaryElement}</div></Surface>;
};

const FinalAssembly: React.FC<{content: PublicMainContent}> = ({content}) => {
  const chips = [...content.texts, ...content.cards.flatMap((card) => card.lines.map((line) => line.value))].slice(0, 4);
  return <Surface accent={color.emphasis} style={{padding: "40px 52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={timedStyle(content, content.beatStartMs)}><Tag tone="emphasis">今朝の結論</Tag></div><div style={{display: "flex", gap: 15, marginTop: 26, width: "100%", justifyContent: "center"}}>{chips.map((chip, index) => <div key={`${index}-${chip}`} style={{...timedStyle(content, content.beatStartMs + (index + 1) * 520), flex: 1, maxWidth: 315, padding: "15px 17px", borderRadius: 17, background: "rgba(82,118,145,.10)", border: "2px solid rgba(82,118,145,.30)", fontSize: 26, lineHeight: 1.22, fontWeight: 900}}>{chip}</div>)}</div><div style={{...timedStyle(content, content.beatStartMs + Math.min(2600, (content.beatEndMs - content.beatStartMs) * 0.58)), marginTop: 32, fontSize: 70, lineHeight: 1.14, color: color.emphasis, fontWeight: 950}}>{content.primaryElement || content.headline}</div><div style={{marginTop: 30, width: `${62 + content.holdProgress * 18}%`, height: 7, borderRadius: 99, background: `linear-gradient(90deg,transparent,${color.cyan},transparent)`}}/></Surface>;
};


const FinancialTemplateImplementationPending: React.FC<{templateId: string}> = ({templateId}) => {
  throw new Error(`Financial Visual Template implementation is not available yet: ${templateId}`);
};

export const VisualTemplateRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  switch (content.visualTemplate) {
    case "market-pulse-grid":
    case "earnings-surprise":
    case "dual-asset-split":
    case "macro-pressure":
    case "source-receipt":
      return <FinancialTemplateImplementationPending templateId={content.visualTemplate}/>;
    case "hero-number": return <HeroNumberTemplate content={content}/>;
    case "split-comparison": return <SplitComparisonTemplate content={content}/>;
    case "focus-matrix": return <FocusMatrixTemplate content={content}/>;
    case "final-assembly": return <FinalAssemblyStoryTemplate content={content}/>;
    case "entity-card-full": return <EntityFocusStoryTemplate content={content}/>;
    case "opening-contradiction": return <OpeningContradiction content={content}/>;
    case "closing-recap": return <FinalAssembly content={content}/>;
    case "expected-actual-bullet": return <BulletComparison content={content}/>;
    case "expected-actual-gap-flow": return <ExpectedActualFlow content={content}/>;
    case "causal-lane": return <CausalLane content={content}/>;
    case "tailwind-headwind": return <TailwindHeadwind content={content}/>;
    case "diverging-stock-bars": return <DivergingBars content={content}/>;
    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "verification-checklist": return <VerificationMatrix content={content}/>;
    case "conclusion-card":
    case "metric-comparison-board":
    case "index-return-bars":
    case "evidence-boundary":
    case "analogy-steps":
    case "news-media":
    case "text-focus":
      return <SpecVisualMode content={content}/>;
  }
};
