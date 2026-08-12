import {interpolate} from "remotion";
import type {PublicCard, PublicMainContent, PublicNode} from "../../spec/public-view-model";
import {SafeContent, safeFontSize, StageEyebrow} from "./StageSafeArea";
import {
  CardConnector,
  FinanceCardFrame,
  gridTemplateForCardCount,
  MetricCard,
  StepCard,
  TakeawayCard,
  TextCard,
  type FinancialCardTone,
} from "./cards/FinancialCards";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const revealStyle = (content: PublicMainContent, revealAtMs: number): React.CSSProperties => {
  const progress = clamp((content.sceneTimeMs - revealAtMs) / 300);
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [16, 0])}px)`,
  };
};

const timedStyle = (content: PublicMainContent, index: number) =>
  revealStyle(content, content.beatStartMs + index * 220);

const numberById = (content: PublicMainContent, id: string | null | undefined) =>
  id ? content.numbers.find((item) => item.key === id) ?? null : null;
const cardById = (content: PublicMainContent, id: string | null | undefined) =>
  id ? content.cards.find((item) => item.key === id) ?? null : null;

const toneForIndex = (index: number): FinancialCardTone => index === 0 ? "neutral" : index === 1 ? "warning" : index === 2 ? "emphasis" : "neutral";

const uniqueViewerText = (candidates: Array<string | null | undefined>, excluded: string[] = []) => {
  const excludedSet = new Set(excluded.filter(Boolean));
  return candidates.find((value): value is string => Boolean(value) && !excludedSet.has(value as string)) ?? null;
};

const SectionTitle: React.FC<{children: string; tone?: string}> = ({children, tone}) => <StageEyebrow tone={tone}>{children}</StageEyebrow>;

const OpeningCards: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  const lead = numberById(content, shot?.primaryTargetId) ?? content.numbers[0] ?? null;
  const secondaryIds = shot?.secondaryTargetIds ?? [];
  const secondaryCard = secondaryIds.map((id) => cardById(content, id)).find(Boolean) ?? content.cards[0] ?? null;
  const secondaryNumber = secondaryIds.map((id) => numberById(content, id)).find(Boolean) ?? content.numbers.find((item) => item.key !== lead?.key) ?? null;
  const verdict = secondaryCard?.lines[0]?.value ?? uniqueViewerText(
    [content.texts[0], content.primaryElement, content.screenQuestion],
    [lead?.label ?? "", lead?.value ?? ""],
  );
  const showVerdict = Boolean(verdict);
  const showSecondaryNumber = !showVerdict && Boolean(secondaryNumber);

  return <SafeContent reserveTypography={Boolean(shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18, alignContent: "center"}}>
    <SectionTitle>昨夜の方向と矛盾</SectionTitle>
    <div style={{display: "grid", gridTemplateColumns: lead && (showVerdict || showSecondaryNumber) ? "minmax(0,.9fr) minmax(0,1.1fr)" : "1fr", gap: 22, alignItems: "center"}}>
      {lead ? <div style={revealStyle(content, lead.revealAtMs)}><MetricCard number={lead}/></div> : null}
      {showVerdict && verdict ? <div style={secondaryCard ? revealStyle(content, secondaryCard.revealAtMs) : timedStyle(content, 1)}><TextCard title={secondaryCard?.title ?? "結論"} text={verdict} tone={secondaryCard?.lines[0]?.tone ?? "emphasis"} role="verdict"/></div> : null}
      {showSecondaryNumber && secondaryNumber ? <div style={revealStyle(content, secondaryNumber.revealAtMs)}><MetricCard number={secondaryNumber}/></div> : null}
    </div>
    {content.screenQuestion && content.screenQuestion !== verdict ? <div style={{...timedStyle(content, 2), fontSize: safeFontSize(content.screenQuestion, 34, 26, 1120), color: "var(--stage-text-secondary,#314A60)", fontWeight: 900, textAlign: "center"}}>{content.screenQuestion}</div> : <div/>}
  </SafeContent>;
};

const ExpectedCard: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  const number = numberById(content, shot?.primaryTargetId) ?? content.numbers[0] ?? null;
  const card = cardById(content, shot?.primaryTargetId) ?? content.cards.find((item) => item.role === "expected") ?? content.cards[0] ?? null;
  const text = card?.lines[0]?.value ?? uniqueViewerText([number?.comparison, content.primaryElement, content.texts[0]]);
  return <SafeContent reserveTypography={Boolean(shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 18, alignItems: "center"}}>
    <SectionTitle>予想｜市場の基準</SectionTitle>
    <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      {number ? <div style={{width: 720, ...revealStyle(content, number.revealAtMs)}}><MetricCard number={number} meta={number.comparison}/></div> : text ? <div style={{width: 860, ...(card ? revealStyle(content, card.revealAtMs) : timedStyle(content, 0))}}><TextCard title={card?.title ?? "予想"} text={text} tone="neutral" role="expected"/></div> : null}
    </div>
  </SafeContent>;
};

const ActualVsExpectedCards: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  const actualNumber = numberById(content, shot?.primaryTargetId) ?? content.numbers.find((item) => item.tone === "positive") ?? content.numbers[0] ?? null;
  const actualCard = cardById(content, shot?.primaryTargetId) ?? content.cards.find((item) => item.role === "actual") ?? null;
  const referenceCard = cardById(content, shot?.referenceTargetId) ?? content.cards.find((item) => item.role === "expected") ?? null;
  const expectedText = referenceCard?.lines[0]?.value ?? actualNumber?.comparison ?? null;
  const actualText = actualCard?.lines[0]?.value ?? null;
  const hasExpected = Boolean(expectedText);
  const hasActual = Boolean(actualNumber || actualText);
  return <SafeContent reserveTypography={Boolean(shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 18, alignItems: "center"}}>
    <SectionTitle>予想と実際</SectionTitle>
    <div style={{display: "grid", gridTemplateColumns: hasExpected && hasActual ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)", gap: 22, alignItems: "center"}}>
      {expectedText ? <div style={referenceCard ? revealStyle(content, referenceCard.revealAtMs) : timedStyle(content, 0)}><TextCard title="予想" text={expectedText} tone="neutral" role="expected"/></div> : null}
      {actualNumber ? <div style={revealStyle(content, actualNumber.revealAtMs)}><MetricCard number={actualNumber} meta={null}/></div> : actualText ? <div style={actualCard ? revealStyle(content, actualCard.revealAtMs) : timedStyle(content, 1)}><TextCard title="実際" text={actualText} tone="positive" role="actual"/></div> : null}
    </div>
  </SafeContent>;
};

const GapCard: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  const number = numberById(content, shot?.primaryTargetId) ?? content.numbers[0] ?? null;
  const card = cardById(content, shot?.primaryTargetId) ?? content.cards.find((item) => item.role === "gap") ?? content.cards[0] ?? null;
  const text = card?.lines[0]?.value ?? (number ? `${number.value}${number.unit}` : uniqueViewerText([content.primaryElement, content.texts[0]]));
  return <SafeContent reserveTypography={Boolean(shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 18, alignItems: "center"}}>
    <SectionTitle>差分｜予想との差</SectionTitle>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>{text ? <div style={{width: 880, ...(card ? revealStyle(content, card.revealAtMs) : number ? revealStyle(content, number.revealAtMs) : timedStyle(content, 0))}}><TakeawayCard title={card?.title ?? "差分"} text={text} tone="emphasis"/></div> : null}</div>
  </SafeContent>;
};

const MetricGrid: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = content.numbers.slice(0, 6);
  const takeaway = items.length <= 3 ? uniqueViewerText([content.texts[0], content.primaryElement], items.flatMap((item) => [item.label, item.value])) : null;
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: takeaway ? "1fr auto" : "1fr", gap: 18, alignItems: "center"}}>
    <div data-card-grid-count={items.length} style={{display: "grid", gridTemplateColumns: gridTemplateForCardCount(items.length), gap: 20, alignContent: "center"}}>
      {items.map((item) => <div key={item.key} style={revealStyle(content, item.revealAtMs)}><MetricCard number={item}/></div>)}
    </div>
    {takeaway ? <div style={timedStyle(content, items.length)}><TakeawayCard text={takeaway} tone="emphasis"/></div> : null}
  </SafeContent>;
};

const SplitCards: React.FC<{content: PublicMainContent}> = ({content}) => {
  const numbers = content.numbers.slice(0, 2);
  const texts = content.texts.slice(0, 2);
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 18, alignItems: "center"}}>
    <SectionTitle>同じ基準で比較</SectionTitle>
    <div style={{display: "grid", gridTemplateColumns: "minmax(0,1fr) 54px minmax(0,1fr)", gap: 18, alignItems: "center"}}>
      {numbers[0] ? <div style={revealStyle(content, numbers[0].revealAtMs)}><MetricCard number={numbers[0]}/></div> : texts[0] ? <TextCard text={texts[0]} tone="neutral"/> : null}
      <div style={{fontSize: 24, color: "var(--stage-text-muted,#506A7F)", textAlign: "center", fontWeight: 950}}>対比</div>
      {numbers[1] ? <div style={revealStyle(content, numbers[1].revealAtMs)}><MetricCard number={numbers[1]}/></div> : texts[1] ? <TextCard text={texts[1]} tone="warning"/> : null}
    </div>
  </SafeContent>;
};

const orderedNodes = (content: PublicMainContent): PublicNode[] => {
  const order = content.templateConfig.nodeOrder.length > 0 ? content.templateConfig.nodeOrder : content.nodes.map((item) => item.key);
  const map = new Map(content.nodes.map((node) => [node.key, node] as const));
  return order.map((id) => map.get(id)).filter((node): node is PublicNode => Boolean(node)).slice(0, 4);
};

const CausalStepCards: React.FC<{content: PublicMainContent}> = ({content}) => {
  const nodes = orderedNodes(content);
  const fallbacks = nodes.length > 0 ? [] : content.texts.slice(0, 4);
  const items = nodes.length > 0 ? nodes.map((node) => ({key: node.key, text: node.label, revealAtMs: node.revealAtMs, highlighted: node.highlighted})) : fallbacks.map((text, index) => ({key: `text-${index}`, text, revealAtMs: content.beatStartMs + index * 220, highlighted: false}));
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 18}}>
    <SectionTitle>NASDAQまでの経路</SectionTitle>
    <div data-causal-card-path={items.length} style={{display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0}}>
      {items.map((item, index) => <div key={item.key} style={{display: "contents"}}>
        <div style={{flex: "1 1 0", minWidth: 0, ...revealStyle(content, item.revealAtMs)}}><StepCard index={index + 1} text={item.text} tone={index === items.length - 1 ? "emphasis" : toneForIndex(index)} highlighted={item.highlighted}/></div>
        {index < items.length - 1 ? <CardConnector label={content.arrows[index]?.label || null}/> : null}
      </div>)}
    </div>
  </SafeContent>;
};

const cardText = (card: PublicCard) => card.lines[0]?.value ?? card.title;

const SequenceVerification: React.FC<{content: PublicMainContent}> = ({content}) => {
  const cardItems = content.cards.flatMap((card) => card.lines.map((line, index) => ({key: `${card.key}-${index}`, text: line.value, revealAtMs: card.revealAtMs, highlighted: card.highlighted})));
  const nodeItems = content.nodes.map((node) => ({key: node.key, text: node.label, revealAtMs: node.revealAtMs, highlighted: node.highlighted}));
  const textItems = content.texts.map((text, index) => ({key: `text-${index}`, text, revealAtMs: content.beatStartMs + index * 220, highlighted: false}));
  const items = (cardItems.length > 0 ? cardItems : nodeItems.length > 0 ? nodeItems : textItems).slice(0, 4);
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 14}}>
    <SectionTitle>時系列を分けて確認</SectionTitle>
    <div data-verification-layout="reported-sequence" style={{display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center"}}>
      {items.map((item, index) => <div key={item.key}>
        <div style={revealStyle(content, item.revealAtMs)}><StepCard index={index + 1} text={item.text} tone={index === items.length - 1 ? "emphasis" : "neutral"} highlighted={item.highlighted}/></div>
        {index < items.length - 1 ? <CardConnector vertical/> : null}
      </div>)}
    </div>
  </SafeContent>;
};

const LaneVerification: React.FC<{content: PublicMainContent}> = ({content}) => {
  const defaultLaneLabels = ["強まる条件", "弱まる条件"] as const;
  const labels = content.templateConfig.laneLabels.length >= 2 ? content.templateConfig.laneLabels.slice(0, 2) : [...defaultLaneLabels];
  const cards = content.cards.slice(0, 4);
  const textItems = cards.length > 0 ? [] : (content.nodes.length > 0 ? content.nodes.map((node) => node.label) : content.texts).slice(0, 4);
  const midpoint = Math.ceil((cards.length || textItems.length) / 2);
  const lane = (index: number) => cards.length > 0 ? cards.slice(index === 0 ? 0 : midpoint, index === 0 ? midpoint : undefined) : textItems.slice(index === 0 ? 0 : midpoint, index === 0 ? midpoint : undefined);
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 22}}>
    {[0, 1].map((laneIndex) => <div key={laneIndex} data-verification-lane={laneIndex} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 14}}>
      <SectionTitle>{labels[laneIndex] ?? defaultLaneLabels[laneIndex]}</SectionTitle>
      <div style={{display: "grid", gap: 14, alignContent: "center"}}>{lane(laneIndex).map((item, index) => typeof item === "string"
        ? <div key={`${laneIndex}-${index}`} style={timedStyle(content, laneIndex * midpoint + index)}><TextCard text={item} tone={laneIndex === 0 ? "positive" : "warning"} role="verification"/></div>
        : <div key={item.key} style={revealStyle(content, item.revealAtMs)}><TextCard title={item.title} text={cardText(item)} tone={item.lines[0]?.tone ?? (laneIndex === 0 ? "positive" : "warning")} highlighted={item.highlighted} role="verification"/></div>)}</div>
    </div>)}
  </SafeContent>;
};

const VerificationCards: React.FC<{content: PublicMainContent}> = ({content}) =>
  content.templateConfig.variant === "reported-sequence" ? <SequenceVerification content={content}/> : <LaneVerification content={content}/>;

const ExpectedActualGapCards: React.FC<{content: PublicMainContent}> = ({content}) => {
  const roles = ["expected", "actual", "gap"] as const;
  const cards = roles.map((role) => content.cards.find((card) => card.role === role)).filter((card): card is PublicCard => Boolean(card));
  if (cards.length !== 3) return null;
  const labels = {expected: "予想", actual: "実際", gap: "差分"} as const;
  return <SafeContent reserveTypography={Boolean(content.shot?.typographyTreatment)} style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20, alignItems: "center"}}>
    {cards.map((card) => <div key={card.key} style={revealStyle(content, card.revealAtMs)}><FinanceCardFrame tone={card.role === "actual" ? "positive" : card.role === "gap" ? "emphasis" : "neutral"} highlighted={card.highlighted} minHeight={150} maxHeight={250} dataRole={card.role ?? "gap"}>
      <div style={{fontSize: 23, color: "var(--stage-text-muted,#506A7F)", fontWeight: 900}}>{labels[card.role!]}</div>
      <div style={{marginTop: 8, fontSize: safeFontSize(card.title, 28, 23, 360), fontWeight: 950}}>{card.title}</div>
      {card.lines[0] ? <div style={{marginTop: 13, fontSize: safeFontSize(card.lines[0].value, 34, 25, 380), lineHeight: 1.15, fontWeight: 950}}>{card.lines[0].value}</div> : null}
    </FinanceCardFrame></div>)}
  </SafeContent>;
};

const CARD_FIRST_SHOT_RECIPES = new Set([
  "contradiction-interrupt",
  "expected-anchor",
  "actual-crosses-expected",
  "gap-macro",
  "causal-build",
  "split-opposition",
  "focus-matrix-reveal",
  "verification-two-paths",
]);

const CARD_FIRST_TEMPLATES = new Set([
  "opening-contradiction",
  "market-pulse-grid",
  "metric-comparison-board",
  "dual-asset-split",
  "split-comparison",
  "focus-matrix",
  "causal-lane",
  "macro-pressure",
  "verification-matrix",
  "expected-actual-gap-flow",
]);

export const isCardFirstFinancialContent = (content: PublicMainContent) =>
  Boolean(content.shot && CARD_FIRST_SHOT_RECIPES.has(content.shot.shotRecipe)) || CARD_FIRST_TEMPLATES.has(content.visualTemplate);

export const CardFirstFinancialRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  const recipe = content.shot?.shotRecipe;
  if (recipe === "contradiction-interrupt" || (!recipe && content.visualTemplate === "opening-contradiction")) return <OpeningCards content={content}/>;
  if (recipe === "expected-anchor") return <ExpectedCard content={content}/>;
  if (recipe === "actual-crosses-expected") return <ActualVsExpectedCards content={content}/>;
  if (recipe === "gap-macro") return <GapCard content={content}/>;
  if (recipe === "causal-build" || ["causal-lane", "macro-pressure"].includes(content.visualTemplate)) return <CausalStepCards content={content}/>;
  if (recipe === "split-opposition" || ["dual-asset-split", "split-comparison"].includes(content.visualTemplate)) return <SplitCards content={content}/>;
  if (recipe === "focus-matrix-reveal" || ["focus-matrix", "market-pulse-grid", "metric-comparison-board"].includes(content.visualTemplate)) return <MetricGrid content={content}/>;
  if (recipe === "verification-two-paths" || content.visualTemplate === "verification-matrix") return <VerificationCards content={content}/>;
  if (content.visualTemplate === "expected-actual-gap-flow") return <ExpectedActualGapCards content={content}/>;
  return null;
};
