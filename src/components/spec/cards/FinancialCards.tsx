import type {CSSProperties, ReactNode} from "react";
import type {PublicNumber} from "../../../spec/public-view-model";
import {safeFontSize} from "../StageSafeArea";

export type FinancialCardTone = PublicNumber["tone"];

const toneColor = (tone: FinancialCardTone) => ({
  positive: "var(--stage-positive,#087B58)",
  negative: "var(--stage-negative,#B63849)",
  warning: "var(--stage-warning,#8A5200)",
  neutral: "var(--stage-accent,#078EAE)",
  emphasis: "var(--stage-emphasis,#5C348F)",
}[tone]);

const cardSurface = "var(--stage-surface,#FFFFFF)";
const strongSurface = "var(--stage-surface-strong,#E7EEF4)";
const primaryText = "var(--stage-text-primary,#102033)";
const secondaryText = "var(--stage-text-secondary,#314A60)";
const mutedText = "var(--stage-text-muted,#506A7F)";

export const gridTemplateForCardCount = (count: number) => {
  if (count <= 1) return "minmax(0,1fr)";
  if (count === 2) return "repeat(2,minmax(0,1fr))";
  if (count === 3) return "repeat(3,minmax(0,1fr))";
  if (count === 4) return "repeat(2,minmax(0,1fr))";
  return "repeat(3,minmax(0,1fr))";
};

export const FinanceCardFrame: React.FC<{
  children: ReactNode;
  tone?: FinancialCardTone;
  highlighted?: boolean;
  minHeight?: number;
  maxHeight?: number;
  dataRole?: string;
  style?: CSSProperties;
}> = ({children, tone = "neutral", highlighted = false, minHeight = 120, maxHeight = 250, dataRole, style}) => {
  const accent = toneColor(tone);
  return <div
    data-finance-card={dataRole ?? "generic"}
    data-card-tone={tone}
    style={{
      boxSizing: "border-box",
      minWidth: 0,
      minHeight,
      maxHeight,
      padding: "24px 28px",
      borderRadius: 22,
      background: cardSurface,
      color: primaryText,
      border: `${highlighted ? 5 : 2}px solid ${accent}`,
      borderLeftWidth: highlighted ? 7 : 5,
      boxShadow: highlighted ? `0 0 0 5px color-mix(in srgb, ${accent} 18%, transparent)` : "0 10px 24px rgba(16,32,51,.10)",
      opacity: 1,
      overflow: "hidden",
      ...style,
    }}
  >{children}</div>;
};

export const MetricCard: React.FC<{
  number: PublicNumber;
  meta?: string | null;
  style?: CSSProperties;
}> = ({number, meta = number.comparison, style}) => <FinanceCardFrame
  tone={number.tone}
  highlighted={number.highlighted}
  minHeight={150}
  maxHeight={250}
  dataRole="metric"
  style={{display: "flex", flexDirection: "column", justifyContent: "center", ...style}}
>
  <div style={{fontSize: safeFontSize(number.label, 31, 24, 390), lineHeight: 1.12, color: secondaryText, fontWeight: 950, overflowWrap: "anywhere"}}>{number.label}</div>
  <div style={{display: "flex", alignItems: "baseline", gap: 8, marginTop: 14, color: toneColor(number.tone), whiteSpace: "nowrap"}}>
    <span style={{fontSize: safeFontSize(number.value, 68, 46, 330), lineHeight: .95, fontWeight: 950, letterSpacing: "-.025em"}}>{number.value}</span>
    <span style={{fontSize: 28, fontWeight: 900}}>{number.unit}</span>
  </div>
  {meta ? <div style={{marginTop: 14, fontSize: safeFontSize(meta, 23, 20, 390), lineHeight: 1.17, color: mutedText, fontWeight: 800, overflowWrap: "anywhere"}}>{meta}</div> : null}
</FinanceCardFrame>;

export const TextCard: React.FC<{
  text: string;
  title?: string | null;
  tone?: FinancialCardTone;
  highlighted?: boolean;
  role?: string;
  style?: CSSProperties;
}> = ({text, title = null, tone = "neutral", highlighted = false, role = "text", style}) => <FinanceCardFrame
  tone={tone}
  highlighted={highlighted}
  minHeight={120}
  maxHeight={220}
  dataRole={role}
  style={{display: "flex", flexDirection: "column", justifyContent: "center", ...style}}
>
  {title ? <div style={{fontSize: safeFontSize(title, 25, 21, 440), color: mutedText, fontWeight: 900}}>{title}</div> : null}
  <div style={{marginTop: title ? 10 : 0, fontSize: safeFontSize(text, 36, 26, 520), lineHeight: 1.18, color: primaryText, fontWeight: 950, overflowWrap: "anywhere"}}>{text}</div>
</FinanceCardFrame>;

export const StepCard: React.FC<{
  index: number;
  text: string;
  tone?: FinancialCardTone;
  highlighted?: boolean;
  style?: CSSProperties;
}> = ({index, text, tone = "neutral", highlighted = false, style}) => {
  const stepTone: FinancialCardTone = tone === "emphasis" ? "emphasis" : "neutral";
  return <FinanceCardFrame
    tone={stepTone}
    highlighted={highlighted}
    minHeight={124}
    maxHeight={190}
    dataRole="step"
    style={{display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", gap: 18, alignItems: "center", ...style}}
  >
    <div style={{width: 42, height: 42, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: strongSurface, color: toneColor(stepTone), border: `2px solid ${toneColor(stepTone)}`, fontSize: 23, fontWeight: 950}}>{index}</div>
    <div style={{fontSize: safeFontSize(text, 34, 25, 440), lineHeight: 1.16, fontWeight: 950, overflowWrap: "anywhere"}}>{text}</div>
  </FinanceCardFrame>;
};

export const CardConnector: React.FC<{label?: string | null; vertical?: boolean}> = ({label = null, vertical = false}) => <div
  data-card-connector="short"
  style={vertical
    ? {height: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--stage-accent,#078EAE)", fontWeight: 950}
    : {width: 38, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--stage-accent,#078EAE)", fontWeight: 950}}
>
  {label ? <div style={{fontSize: 18, lineHeight: 1, color: mutedText, whiteSpace: "nowrap", marginBottom: 2}}>{label}</div> : null}
  <div style={{fontSize: vertical ? 28 : 34, lineHeight: 1}}>{vertical ? "↓" : "→"}</div>
</div>;

export const TakeawayCard: React.FC<{text: string; tone?: FinancialCardTone; title?: string | null}> = ({text, tone = "emphasis", title = null}) => <TextCard text={text} title={title} tone={tone} role="takeaway"/>;

export const SourceStrip: React.FC<{text: string; style?: CSSProperties}> = ({text, style}) => <div
  data-source-strip="viewer-facing"
  style={{
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 40,
    maxWidth: 760,
    padding: "6px 14px",
    borderRadius: 10,
    background: "var(--stage-surface-strong,rgba(7,17,31,.96))",
    color: "var(--stage-text-primary,#F7FBFF)",
    border: "1px solid var(--stage-line,rgba(197,215,228,.45))",
    opacity: 1,
    fontSize: 23,
    lineHeight: 1.2,
    fontWeight: 850,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...style,
  }}
>{text}</div>;
