import type {
  PublicCard,
  PublicMainContent,
  PublicNumber,
} from "../../spec/public-view-model";

const colors = {
  paper: "rgba(247,250,252,.96)",
  paperSoft: "rgba(231,240,246,.95)",
  ink: "#102033",
  mutedInk: "#53677a",
  line: "#2f83bd",
  cyan: "#0c8fb3",
  positive: "#0c8a66",
  negative: "#c73e4d",
  warning: "#b86b00",
  neutral: "#537692",
  emphasis: "#7047a8",
  dark: "rgba(5,12,25,.93)",
  white: "#f7fbff",
};

type Tone = PublicCard["lines"][number]["tone"];
const toneColor = (tone: Tone) => colors[tone];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const stage = (progress: number, index: number, total: number) => {
  const start = total <= 1 ? 0 : (index / total) * 0.62;
  return clamp((progress - start) / 0.2);
};
const stagedStyle = (progress: number, index: number, total: number): React.CSSProperties => {
  const amount = stage(progress, index, total);
  return {
    opacity: amount,
    translate: `${(1 - amount) * 22}px 0px`,
  };
};
const parseNumber = (value: string) => {
  const parsed = Number(value.replace(/[^0-9+\-.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const comparisonNumber = (value: string | null) => {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};
const formatNumber = (number: PublicNumber) => `${number.value}${number.unit}`;

const Surface: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}> = ({children, style, accent = colors.cyan}) => <div style={{
  height: "100%",
  boxSizing: "border-box",
  borderRadius: 28,
  background: `linear-gradient(145deg,${colors.paper},${colors.paperSoft})`,
  border: `3px solid ${accent}`,
  boxShadow: "0 20px 46px rgba(0,0,0,.24)",
  color: colors.ink,
  overflow: "hidden",
  ...style,
}}>{children}</div>;

const Label: React.FC<{children: React.ReactNode; tone?: Tone}> = ({children, tone = "neutral"}) => <div style={{
  display: "inline-flex",
  alignItems: "center",
  minHeight: 42,
  padding: "4px 18px",
  borderRadius: 999,
  background: `${toneColor(tone)}18`,
  border: `2px solid ${toneColor(tone)}`,
  color: toneColor(tone),
  fontSize: 25,
  fontWeight: 950,
  letterSpacing: ".03em",
}}>{children}</div>;

const ValueText: React.FC<{number: PublicNumber; size?: number}> = ({number, size = 64}) => <div style={{
  display: "flex",
  alignItems: "baseline",
  gap: 10,
  color: colors.ink,
  whiteSpace: "nowrap",
}}>
  <span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{number.value}</span>
  <span style={{fontSize: Math.round(size * .46), fontWeight: 900}}>{number.unit}</span>
</div>;

const OpeningContradiction: React.FC<{content: PublicMainContent}> = ({content}) => {
  const card = content.cards[0];
  const market = card?.lines.find((line) => line.label.includes("NASDAQ"));
  const center = card?.lines.find((line) => line.label.includes("中心"));
  const items = content.texts.filter((item) => !item.includes("NASDAQ")).slice(0, 3);
  return <Surface style={{padding: "34px 44px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}} accent={colors.emphasis}>
    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", ...stagedStyle(content.beatProgress, 0, 5)}}>
      <div><Label tone="positive">昨夜の方向</Label><div style={{marginTop: 12, fontSize: 36, color: colors.mutedInk, fontWeight: 850}}>NASDAQ</div></div>
      <div style={{fontSize: 88, lineHeight: 1, fontWeight: 950, color: colors.positive}}>{market?.value ?? content.texts.find((item) => item.includes("NASDAQ")) ?? "+1.00%"}</div>
    </div>
    <div style={{display: "grid", gridTemplateColumns: `repeat(${Math.max(1, items.length)},minmax(0,1fr))`, gap: 18, alignItems: "stretch"}}>
      {items.map((item, index) => <div key={item} style={{...stagedStyle(content.beatProgress, index + 1, 5), borderRadius: 22, padding: "24px 22px", background: index === 0 ? "rgba(12,138,102,.10)" : index === 1 ? "rgba(184,107,0,.10)" : "rgba(199,62,77,.10)", border: `3px solid ${index === 0 ? colors.positive : index === 1 ? colors.warning : colors.negative}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 38, lineHeight: 1.28, fontWeight: 950}}>{item}</div>)}
    </div>
    <div style={{...stagedStyle(content.beatProgress, 4, 5), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24}}>
      <div style={{fontSize: 31, color: colors.mutedInk, fontWeight: 850}}>全部のテックが同じ理由で上がった夜ではない</div>
      <div style={{fontSize: 36, color: colors.emphasis, fontWeight: 950}}>{center?.value ?? "市場は何を評価した？"}</div>
    </div>
  </Surface>;
};

const ClosingRecap: React.FC<{content: PublicMainContent}> = ({content}) => {
  const line = content.cards[0]?.lines[0];
  const conclusion = line?.value ?? content.texts.at(-1) ?? content.headline;
  const chips = content.texts.filter((item) => item !== conclusion).slice(0, 3);
  return <Surface style={{padding: "42px 54px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}} accent={colors.emphasis}>
    <div style={{...stagedStyle(content.beatProgress, 0, 5)}}><Label tone="emphasis">今朝の結論</Label></div>
    <div style={{display: "flex", gap: 16, marginTop: 28, width: "100%", justifyContent: "center"}}>{chips.map((chip, index) => <div key={chip} style={{...stagedStyle(content.beatProgress, index + 1, 5), flex: 1, maxWidth: 350, padding: "16px 18px", borderRadius: 18, background: "rgba(83,118,146,.10)", border: "2px solid rgba(83,118,146,.35)", fontSize: 28, fontWeight: 900}}>{chip}</div>)}</div>
    <div style={{...stagedStyle(content.beatProgress, 4, 5), marginTop: 34, fontSize: 82, lineHeight: 1.15, color: colors.emphasis, fontWeight: 950}}>{conclusion}</div>
    <div style={{marginTop: 34, width: "62%", height: 6, borderRadius: 999, background: `linear-gradient(90deg,transparent,${colors.cyan},transparent)`}}/>
  </Surface>;
};

const ConclusionCard: React.FC<{content: PublicMainContent}> = ({content}) => {
  const card = content.cards[0];
  const lines = card?.lines ?? [];
  return <Surface style={{padding: "44px 54px"}} accent={card ? toneColor(lines[0]?.tone ?? "neutral") : colors.cyan}>
    <div style={{fontSize: 42, fontWeight: 950}}>{card?.title ?? content.headline}</div>
    <div style={{marginTop: 30, display: "grid", gap: 22}}>{lines.map((line, index) => <div key={`${line.label}-${line.value}`} style={{...stagedStyle(content.beatProgress, index, lines.length), display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", gap: 28, padding: "22px 26px", borderRadius: 20, background: `${toneColor(line.tone)}12`, borderLeft: `10px solid ${toneColor(line.tone)}`}}><div style={{fontSize: 29, color: colors.mutedInk, fontWeight: 900}}>{line.label}</div><div style={{fontSize: 46, fontWeight: 950}}>{line.value}</div></div>)}</div>
  </Surface>;
};

const ExpectedActualBullet: React.FC<{content: PublicMainContent}> = ({content}) => {
  const actual = content.numbers[0];
  const gap = content.numbers[1];
  const expected = comparisonNumber(actual?.comparison ?? null);
  const actualValue = actual ? Math.abs(parseNumber(actual.value)) : 0;
  const expectedValue = expected === null ? 0 : Math.abs(expected);
  const max = Math.max(1, actualValue, expectedValue) * 1.08;
  const actualWidth = `${clamp(actualValue / max) * 100}%`;
  const expectedLeft = `${clamp(expectedValue / max) * 100}%`;
  return <Surface style={{padding: "44px 52px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 32}} accent={colors.positive}>
    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", ...stagedStyle(content.beatProgress, 0, 3)}}>
      <div><Label tone="neutral">予想と実績</Label><div style={{fontSize: 35, marginTop: 14, fontWeight: 900}}>{actual?.label}</div></div>
      {actual ? <ValueText number={actual} size={72}/> : null}
    </div>
    <div style={{position: "relative", alignSelf: "center", height: 150, borderRadius: 24, background: "rgba(83,118,146,.15)", border: "2px solid rgba(83,118,146,.34)", overflow: "hidden", ...stagedStyle(content.beatProgress, 1, 3)}}>
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: actualWidth, background: "linear-gradient(90deg,rgba(12,138,102,.55),rgba(12,138,102,.95))"}}/>
      {expected !== null ? <div style={{position: "absolute", left: expectedLeft, top: 0, bottom: 0, width: 7, background: colors.warning, boxShadow: "0 0 0 4px rgba(255,255,255,.8)"}}/> : null}
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", fontSize: 31, fontWeight: 950}}><span>実績</span><span>{expected !== null ? `予想 ${expected}${actual?.unit ?? ""}` : actual?.comparison}</span></div>
    </div>
    {gap ? <div style={{...stagedStyle(content.beatProgress, 2, 3), display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 22, padding: "22px 30px", background: "rgba(112,71,168,.10)", border: `3px solid ${colors.emphasis}`}}><div style={{fontSize: 30, color: colors.mutedInk, fontWeight: 900}}>{gap.label}</div><ValueText number={gap} size={58}/></div> : null}
  </Surface>;
};

const EvidenceMetricBoard: React.FC<{content: PublicMainContent}> = ({content}) => <Surface style={{padding: "34px 42px", display: "grid", gridTemplateColumns: `repeat(${Math.max(1, Math.min(3, content.numbers.length))},minmax(0,1fr))`, gap: 24, alignItems: "stretch"}} accent={colors.warning}>
  {content.numbers.map((number, index) => <div key={number.key} style={{...stagedStyle(content.beatProgress, index, content.numbers.length), borderRadius: 24, background: `${toneColor(number.tone)}12`, border: `3px solid ${toneColor(number.tone)}`, padding: "30px 28px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0}}>
    <div style={{fontSize: 30, color: colors.mutedInk, fontWeight: 900}}>{number.label}</div>
    <div style={{marginTop: 18}}><ValueText number={number} size={62}/></div>
    {number.comparison ? <div style={{marginTop: 20, fontSize: 27, lineHeight: 1.35, color: toneColor(number.tone), fontWeight: 900}}>{number.comparison}</div> : null}
  </div>)}
</Surface>;

const ReturnBars: React.FC<{content: PublicMainContent; diverging?: boolean}> = ({content, diverging = false}) => {
  const values = content.numbers.map((number) => parseNumber(number.value));
  const maxAbs = Math.max(1, ...values.map((value) => Math.abs(value)));
  return <Surface style={{padding: "30px 42px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18}} accent={diverging ? colors.emphasis : colors.cyan}>
    {content.numbers.map((number, index) => {
      const value = values[index];
      const isNegative = value < 0;
      const width = `${clamp(Math.abs(value) / maxAbs) * 43}%`;
      return <div key={number.key} style={{...stagedStyle(content.beatProgress, index, content.numbers.length), display: "grid", gridTemplateColumns: "260px 1fr 190px", alignItems: "center", gap: 20, minHeight: 92}}>
        <div style={{fontSize: 31, lineHeight: 1.2, color: colors.ink, fontWeight: 950}}>{number.label}</div>
        <div style={{position: "relative", height: 54, borderRadius: 14, background: "rgba(83,118,146,.12)", border: "2px solid rgba(83,118,146,.24)", overflow: "hidden"}}>
          {diverging ? <div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: colors.mutedInk}}/> : null}
          <div style={diverging ? {
            position: "absolute",
            top: 4,
            bottom: 4,
            ...(isNegative ? {right: "50%", width} : {left: "50%", width}),
            borderRadius: 10,
            background: toneColor(number.tone),
          } : {
            position: "absolute",
            left: 0,
            top: 4,
            bottom: 4,
            width: `${clamp(Math.abs(value) / maxAbs) * 100}%`,
            borderRadius: 10,
            background: toneColor(number.tone),
          }}/>
        </div>
        <div style={{textAlign: "right", fontSize: 45, fontWeight: 950, color: toneColor(number.tone)}}>{formatNumber(number)}</div>
      </div>;
    })}
    {diverging ? <div style={{display: "flex", justifyContent: "space-between", padding: "0 205px 0 280px", color: colors.mutedInk, fontSize: 23, fontWeight: 850}}><span>下落</span><span>0</span><span>上昇</span></div> : null}
  </Surface>;
};

const NumberComparison: React.FC<{content: PublicMainContent}> = ({content}) => {
  const values = content.numbers.map((number) => parseNumber(number.value));
  const units = new Set(content.numbers.map((number) => number.unit));
  const hasExpected = comparisonNumber(content.numbers[0]?.comparison ?? null) !== null;
  if (units.size === 1 && !content.numbers.every((number) => number.unit === "%") && hasExpected) {
    return <ExpectedActualBullet content={content}/>;
  }
  if (content.numbers.length === 2 && hasExpected && content.numbers[0]?.label.includes("AWS")) {
    return <ExpectedActualBullet content={content}/>;
  }
  const diverging = values.some((value) => value < 0) && values.some((value) => value >= 0);
  if (content.numbers.every((number) => number.unit === "%")) return <ReturnBars content={content} diverging={diverging}/>;
  return <EvidenceMetricBoard content={content}/>;
};

const ExpectedActualGap: React.FC<{content: PublicMainContent}> = ({content}) => {
  const ordered = (["expected", "actual", "gap"] as const).map((role) => content.cards.find((item) => item.role === role)).filter((item): item is PublicCard => Boolean(item));
  return <Surface style={{padding: "36px 34px", display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 18, alignItems: "stretch"}} accent={colors.emphasis}>
    {ordered.flatMap((card, index) => {
      const tone = card.lines[0]?.tone ?? "neutral";
      const cardNode = <div key={card.key} style={{...stagedStyle(content.beatProgress, index, ordered.length), borderRadius: 24, background: `${toneColor(tone)}12`, border: `3px solid ${toneColor(tone)}`, padding: "30px 28px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0}}>
        <Label tone={tone}>{card.title}</Label>
        <div style={{marginTop: 24, display: "grid", gap: 18}}>{card.lines.map((line) => <div key={`${line.label}-${line.value}`}><div style={{fontSize: 24, color: colors.mutedInk, fontWeight: 850}}>{line.label}</div><div style={{marginTop: 7, fontSize: 36, lineHeight: 1.28, fontWeight: 950}}>{line.value}</div></div>)}</div>
      </div>;
      if (index === ordered.length - 1) return [cardNode];
      return [cardNode, <div key={`arrow-${card.key}`} style={{...stagedStyle(content.beatProgress, index + .5, ordered.length), display: "flex", alignItems: "center", color: colors.cyan, fontSize: 54, fontWeight: 950}}>→</div>];
    })}
  </Surface>;
};

const EvidenceBoundary: React.FC<{content: PublicMainContent}> = ({content}) => <Surface style={{padding: "36px 42px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 28}} accent={colors.neutral}>
  <div style={{...stagedStyle(content.beatProgress, 0, 2), borderRadius: 24, padding: "30px 34px", background: "rgba(12,138,102,.10)", border: `3px solid ${colors.positive}`}}>
    <Label tone="positive">確認できる</Label>
    <div style={{marginTop: 24, display: "grid", gap: 20}}>{content.texts.map((text, index) => <div key={text} style={{display: "grid", gridTemplateColumns: "38px 1fr", gap: 16, alignItems: "start", fontSize: 35, lineHeight: 1.35, fontWeight: 900}}><span style={{color: colors.positive}}>✓</span><span>{text}</span></div>)}</div>
  </div>
  <div style={{...stagedStyle(content.beatProgress, 1, 2), borderRadius: 24, padding: "30px 34px", background: "rgba(184,107,0,.10)", border: `3px solid ${colors.warning}`}}>
    <Label tone="warning">断定しない</Label>
    <div style={{marginTop: 26, fontSize: 33, lineHeight: 1.5, color: colors.ink, fontWeight: 900}}>{content.uncertainty ?? "細かな時系列や単独原因までは断定しない"}</div>
  </div>
</Surface>;

const Timeline: React.FC<{content: PublicMainContent}> = ({content}) => {
  return <Surface style={{padding: "40px 52px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22}} accent={colors.cyan}>
    {content.texts.map((text, index) => <div key={text} style={{...stagedStyle(content.beatProgress, index, content.texts.length), display: "grid", gridTemplateColumns: "62px 1fr", gap: 22, alignItems: "center"}}><div style={{width: 54, height: 54, borderRadius: 999, background: colors.cyan, color: colors.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 950}}>{String(index + 1).padStart(2, "0")}</div><div style={{padding: "20px 26px", borderRadius: 20, background: "rgba(12,143,179,.10)", borderLeft: `8px solid ${colors.cyan}`, fontSize: 36, fontWeight: 900}}>{text}</div></div>)}
  </Surface>;
};

const Chart: React.FC<{content: PublicMainContent}> = ({content}) => {
  const values = content.numbers.map((number) => parseNumber(number.value));
  const diverging = values.some((value) => value < 0) && values.some((value) => value >= 0);
  return <ReturnBars content={content} diverging={diverging}/>;
};

const orderedNodes = (content: PublicMainContent) => {
  if (content.nodes.length <= 1) return content.nodes;
  const incoming = new Map(content.nodes.map((node) => [node.key, 0]));
  const outgoing = new Map<string, string[]>();
  for (const arrow of content.arrows) {
    incoming.set(arrow.toKey, (incoming.get(arrow.toKey) ?? 0) + 1);
    outgoing.set(arrow.fromKey, [...(outgoing.get(arrow.fromKey) ?? []), arrow.toKey]);
  }
  const roots = content.nodes.filter((node) => (incoming.get(node.key) ?? 0) === 0);
  if (roots.length !== 1) return content.nodes;
  const result = [] as typeof content.nodes;
  const seen = new Set<string>();
  let current: (typeof content.nodes)[number] | undefined = roots[0];
  while (current && !seen.has(current.key)) {
    result.push(current);
    seen.add(current.key);
    const nextKeys: string[] = outgoing.get(current.key) ?? [];
    if (nextKeys.length !== 1) break;
    current = content.nodes.find((node) => node.key === nextKeys[0]);
  }
  return result.length === content.nodes.length ? result : content.nodes;
};

const CausalLane: React.FC<{content: PublicMainContent}> = ({content}) => {
  const nodes = orderedNodes(content);
  return <Surface style={{padding: "50px 34px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14}} accent={colors.cyan}>
    {nodes.flatMap((node, index) => {
      const arrow = index < nodes.length - 1 ? content.arrows.find((item) => item.fromKey === node.key && item.toKey === nodes[index + 1].key) : undefined;
      const nodeElement = <div key={node.key} style={{...stagedStyle(content.beatProgress, index, nodes.length), width: nodes.length >= 4 ? 250 : 310, minHeight: 180, boxSizing: "border-box", padding: "26px 22px", borderRadius: 24, background: node.highlighted ? "rgba(255,196,95,.22)" : "rgba(12,143,179,.10)", border: `3px solid ${node.highlighted ? colors.warning : colors.cyan}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: nodes.length >= 4 ? 34 : 38, lineHeight: 1.3, fontWeight: 950}}>{node.label}</div>;
      if (!arrow) return [nodeElement];
      return [nodeElement, <div key={arrow.key} style={{...stagedStyle(content.beatProgress, index + .5, nodes.length), width: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: colors.cyan}}><div style={{fontSize: 58, lineHeight: 1, fontWeight: 950}}>→</div>{arrow.label ? <div style={{marginTop: 8, fontSize: 22, lineHeight: 1.2, textAlign: "center", color: colors.mutedInk, fontWeight: 850}}>{arrow.label}</div> : null}</div>];
    })}
  </Surface>;
};

const splitLaneTexts = (content: PublicMainContent, label: string): string[] => content.texts
  .filter((item) => item.startsWith(`${label}｜`))
  .map((item) => item.slice(label.length + 1));

const VerificationMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {
  const [strengthenLabel = "強まる", weakenLabel = "弱まる"] = content.templateConfig.laneLabels;
  const lanes = [
    {label: strengthenLabel, items: splitLaneTexts(content, strengthenLabel), tone: "positive" as const},
    {label: weakenLabel, items: splitLaneTexts(content, weakenLabel), tone: "warning" as const},
  ];
  return <Surface style={{padding: "34px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26}} accent={colors.emphasis}>
    {lanes.map((lane, laneIndex) => <div key={lane.label} style={{...stagedStyle(content.beatProgress, laneIndex, 2), borderRadius: 24, padding: "30px", background: `${toneColor(lane.tone)}12`, border: `3px solid ${toneColor(lane.tone)}`}}>
      <Label tone={lane.tone}>仮説が{lane.label}</Label>
      <div style={{marginTop: 24, display: "grid", gap: 18}}>{lane.items.map((item) => <div key={item} style={{padding: "18px 20px", borderRadius: 18, background: "rgba(255,255,255,.55)", fontSize: 32, lineHeight: 1.35, fontWeight: 900}}>{item}</div>)}</div>
    </div>)}
  </Surface>;
};

const TailwindHeadwind: React.FC<{content: PublicMainContent}> = ({content}) => {
  const [tailwindLabel = "追い風", headwindLabel = "向かい風"] = content.templateConfig.laneLabels;
  const lanes = [
    {label: tailwindLabel, items: splitLaneTexts(content, tailwindLabel), tone: "positive" as const},
    {label: headwindLabel, items: splitLaneTexts(content, headwindLabel), tone: "warning" as const},
  ];
  return <Surface style={{padding: "34px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26}} accent={colors.emphasis}>
    {lanes.map((lane, laneIndex) => <div key={lane.label} style={{...stagedStyle(content.beatProgress, laneIndex, 2), borderRadius: 24, padding: "30px", background: `${toneColor(lane.tone)}12`, border: `3px solid ${toneColor(lane.tone)}`, display: "flex", flexDirection: "column"}}>
      <Label tone={lane.tone}>{lane.label}</Label>
      <div style={{marginTop: 26, display: "grid", gap: 18}}>{lane.items.map((item, index) => <div key={item} style={{display: "grid", gridTemplateColumns: "42px 1fr", gap: 14, alignItems: "start", fontSize: 34, lineHeight: 1.35, fontWeight: 900}}><span style={{color: toneColor(lane.tone)}}>{index + 1}</span><span>{item}</span></div>)}</div>
    </div>)}
  </Surface>;
};

const CausalDiagram: React.FC<{content: PublicMainContent}> = ({content}) => {
  const incomingCounts = new Map(content.nodes.map((node) => [node.key, 0]));
  for (const arrow of content.arrows) incomingCounts.set(arrow.toKey, (incomingCounts.get(arrow.toKey) ?? 0) + 1);
  const converging = [...incomingCounts.values()].some((count) => count > 1);
  if (converging) return <VerificationMatrix content={content}/>;
  return <CausalLane content={content}/>;
};

const StockComparison: React.FC<{content: PublicMainContent}> = ({content}) => <ReturnBars content={content} diverging/>;

const NewsMedia: React.FC<{content: PublicMainContent}> = ({content}) => <Surface style={{padding: "34px 40px", display: "grid", gap: 22}} accent={colors.neutral}>
  {content.cards.map((card, index) => <div key={card.key} style={{...stagedStyle(content.beatProgress, index, content.cards.length), padding: "24px 28px", borderRadius: 22, background: colors.paper, borderLeft: `10px solid ${toneColor(card.lines[0]?.tone ?? "neutral")}`}}><div style={{fontSize: 38, fontWeight: 950}}>{card.title}</div>{card.lines.map((line) => <div key={`${line.label}-${line.value}`} style={{marginTop: 16, display: "grid", gridTemplateColumns: "180px 1fr", gap: 20}}><div style={{fontSize: 26, color: colors.mutedInk, fontWeight: 850}}>{line.label}</div><div style={{fontSize: 32, fontWeight: 900}}>{line.value}</div></div>)}</div>)}
</Surface>;

const VerificationPoints: React.FC<{content: PublicMainContent}> = ({content}) => {
  const lines = content.cards.flatMap((card) => card.lines);
  const items = lines.length > 0 ? lines.map((line) => line.value) : content.texts;
  return <Surface style={{padding: "36px 46px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20}} accent={colors.cyan}>
    {items.map((text, index) => <div key={`${index}-${text}`} style={{...stagedStyle(content.beatProgress, index, items.length), display: "grid", gridTemplateColumns: "82px 1fr", gap: 22, alignItems: "center", padding: "22px 28px", borderRadius: 22, background: index === Math.min(items.length - 1, Math.floor(content.beatProgress * items.length)) ? "rgba(12,143,179,.16)" : "rgba(83,118,146,.08)", border: `3px solid ${index === Math.min(items.length - 1, Math.floor(content.beatProgress * items.length)) ? colors.cyan : "rgba(83,118,146,.28)"}`}}><div style={{width: 62, height: 62, borderRadius: 999, background: colors.cyan, color: colors.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 27, fontWeight: 950}}>{String(index + 1).padStart(2, "0")}</div><div style={{fontSize: 39, lineHeight: 1.3, color: colors.ink, fontWeight: 950}}>{text}</div></div>)}
  </Surface>;
};

const AnalogySteps: React.FC<{content: PublicMainContent}> = ({content}) => {
  const steps = content.texts.length === 2 ? [content.texts[0], "使って成果へ", content.texts[1]] : content.texts;
  return <Surface style={{padding: "48px 42px", display: "flex", alignItems: "center", justifyContent: "center", gap: 18}} accent={colors.emphasis}>
    {steps.flatMap((text, index) => {
      const node = <div key={`${index}-${text}`} style={{...stagedStyle(content.beatProgress, index, steps.length), flex: 1, minHeight: 210, borderRadius: 26, padding: "30px 24px", background: index === steps.length - 1 ? "rgba(12,138,102,.12)" : "rgba(112,71,168,.10)", border: `3px solid ${index === steps.length - 1 ? colors.positive : colors.emphasis}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 40, lineHeight: 1.3, fontWeight: 950}}>{text}</div>;
      if (index === steps.length - 1) return [node];
      return [node, <div key={`arrow-${index}`} style={{fontSize: 58, color: colors.emphasis, fontWeight: 950}}>→</div>];
    })}
  </Surface>;
};

const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  return <Surface style={{padding: "46px 52px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26}} accent={colors.emphasis}>
    {content.texts.map((text, index) => <div key={`${index}-${text}`} style={{...stagedStyle(content.beatProgress, index, content.texts.length), padding: "26px 34px", borderRadius: 22, background: index === 0 ? "rgba(112,71,168,.12)" : "rgba(184,107,0,.10)", borderLeft: `12px solid ${index === 0 ? colors.emphasis : colors.warning}`, fontSize: 48, lineHeight: 1.3, color: colors.ink, fontWeight: 950}}>{text}</div>)}
  </Surface>;
};

const entityTypeLabel = {
  person: "人物",
  company: "企業",
  product: "製品",
} as const;

const EntityFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  if (!content.entity) throw new Error("entity mode requires entity metadata");
  const {entity} = content;
  if (content.entityPresentation === "prebuilt-card") {
    return <div data-entity-presentation="prebuilt-card" style={{position: "absolute", inset: 0, pointerEvents: "none"}}/>;
  }
  if (content.entityPresentation === "media") {
    return <div data-entity-presentation="media" style={{position: "absolute", right: 24, top: 70, bottom: 70, width: 560, padding: "36px 42px", boxSizing: "border-box", borderRadius: 28, background: "rgba(252,248,235,.96)", border: `4px solid ${colors.warning}`, boxShadow: "0 20px 46px rgba(0,0,0,.28)", color: colors.ink, display: "flex", flexDirection: "column", justifyContent: "center"}}>
      <Label tone="warning">{entityTypeLabel[entity.subjectType]}</Label>
      <div style={{marginTop: 24, fontSize: 58, lineHeight: 1.2, fontWeight: 950}}>{entity.displayName}</div>
      <div style={{marginTop: 26, fontSize: 35, lineHeight: 1.4, color: colors.mutedInk, fontWeight: 850}}>{entity.role}</div>
    </div>;
  }
  return <Surface style={{margin: "48px 80px", height: "calc(100% - 96px)", padding: "42px 52px", display: "flex", alignItems: "center", gap: 40}} accent={colors.neutral}>
    <div style={{width: 180, height: 180, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,143,179,.12)", border: `5px solid ${colors.cyan}`, fontSize: 76, fontWeight: 950}}>{entity.displayName.slice(0, 1)}</div>
    <div><Label tone="neutral">{entityTypeLabel[entity.subjectType]}</Label><div style={{marginTop: 20, fontSize: 58, lineHeight: 1.2, fontWeight: 950}}>{entity.displayName}</div><div style={{marginTop: 22, fontSize: 35, lineHeight: 1.4, color: colors.mutedInk, fontWeight: 850}}>{entity.role}</div></div>
  </Surface>;
};

void NumberComparison;
void Timeline;
void Chart;
void CausalDiagram;
void StockComparison;

export const SpecVisualMode: React.FC<{content: PublicMainContent}> = ({content}) => {
  switch (content.visualTemplate) {
    case "opening-contradiction": return <OpeningContradiction content={content}/>;
    case "closing-recap": return <ClosingRecap content={content}/>;
    case "conclusion-card": return <ConclusionCard content={content}/>;
    case "expected-actual-bullet": return <ExpectedActualBullet content={content}/>;
    case "expected-actual-gap-flow": return <ExpectedActualGap content={content}/>;
    case "metric-comparison-board": return <EvidenceMetricBoard content={content}/>;
    case "index-return-bars": return <ReturnBars content={content}/>;
    case "diverging-stock-bars": return <ReturnBars content={content} diverging/>;
    case "causal-lane": return <CausalLane content={content}/>;
    case "tailwind-headwind": return <TailwindHeadwind content={content}/>;
    case "evidence-boundary": return <EvidenceBoundary content={content}/>;
    case "verification-checklist": return <VerificationPoints content={content}/>;
    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "analogy-steps": return <AnalogySteps content={content}/>;
    case "entity-card-full": return <EntityFocus content={content}/>;
    case "news-media": return <NewsMedia content={content}/>;
    case "text-focus": return <TextFocus content={content}/>;
  }
};
