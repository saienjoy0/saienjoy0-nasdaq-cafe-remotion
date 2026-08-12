import type {CSSProperties, FC, ReactNode} from "react";
import {Easing, interpolate, spring} from "remotion";
import type {
  PublicArrow,
  PublicMainContent,
  PublicNode,
  PublicNumber,
} from "../../spec/public-view-model";
import {planSourceReceiptLayout} from "../../spec/template-layout/source-receipt-layout";

const FPS = 30;
const palette = {
  paper: "rgba(249,252,254,.98)",
  paperSoft: "rgba(229,239,246,.97)",
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  neutral: "#527691",
  emphasis: "#7046a8",
  line: "rgba(82,118,145,.25)",
  white: "#f8fbff",
} as const;

type Tone = PublicNumber["tone"];
const toneColor = (tone: Tone) => palette[tone];
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const progressAt = (
  content: PublicMainContent,
  startedAtMs: number,
  durationMs = 620,
) => {
  const frame = Math.max(0, Math.round(((content.sceneTimeMs - startedAtMs) / 1000) * FPS));
  return spring({
    fps: FPS,
    frame,
    config: {damping: 22, stiffness: 145, mass: 0.72},
    durationInFrames: Math.max(12, Math.round((durationMs / 1000) * FPS)),
  });
};

const entryStyle = (
  content: PublicMainContent,
  revealAtMs: number,
  axis: "x" | "y" = "y",
): CSSProperties => {
  const progress = progressAt(content, revealAtMs);
  return {
    opacity: interpolate(progress, [0, 0.24, 1], [0, 0.86, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }),
    translate: axis === "x"
      ? `${interpolate(progress, [0, 1], [42, 0])}px 0`
      : `0 ${interpolate(progress, [0, 1], [34, 0])}px`,
    scale: interpolate(progress, [0, 1], [0.96, 1]),
  };
};

const Surface: FC<{children: ReactNode; accent?: string; style?: CSSProperties}> = ({children, style}) => (
  <div style={{
    position: "relative",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    overflowWrap: "anywhere",
    ...style,
  }}>
    {children}
  </div>
);

const Pill: FC<{children: ReactNode; tone?: Tone}> = ({children, tone = "neutral"}) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    minHeight: 38,
    padding: "4px 16px",
    borderRadius: 999,
    color: toneColor(tone),
    background: `${toneColor(tone)}14`,
    border: `2px solid ${toneColor(tone)}`,
    fontSize: 22,
    fontWeight: 950,
    letterSpacing: ".02em",
  }}>
    {children}
  </div>
);

const numericValue = (number: PublicNumber) => {
  if (number.numericValue !== null && Number.isFinite(number.numericValue)) return number.numericValue;
  const match = number.value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const AnimatedMetric: FC<{
  content: PublicMainContent;
  number: PublicNumber;
  size?: number;
}> = ({content, number, size = 58}) => {
  const progress = progressAt(content, number.revealAtMs, 760);
  const raw = numericValue(number);
  const decimals = number.precision ?? (number.value.includes(".") ? number.value.split(".").at(-1)?.length ?? 0 : 0);
  const explicitPlus = number.value.trim().startsWith("+");
  const shown = raw === null
    ? number.value
    : `${explicitPlus && raw >= 0 ? "+" : ""}${(raw * progress).toFixed(decimals)}`;
  return (
    <div style={{display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap"}}>
      <span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{shown}</span>
      <span style={{fontSize: Math.round(size * 0.4), fontWeight: 900}}>{number.unit}</span>
    </div>
  );
};

export const assertFinancialTemplateContent = (
  template: PublicMainContent["visualTemplate"],
  content: PublicMainContent,
) => {
  if (template === "market-pulse-grid" && (content.numbers.length < 3 || content.numbers.length > 6)) {
    throw new Error("market-pulse-grid requires three to six visible numbers");
  }
  if (template === "earnings-surprise" && content.numbers.length !== 3) {
    throw new Error("earnings-surprise requires exactly three visible numbers");
  }
  if (template === "dual-asset-split" && content.numbers.length !== 2) {
    throw new Error("dual-asset-split requires exactly two visible numbers");
  }
  if (template === "macro-pressure") {
    if (content.nodes.length < 2 || content.nodes.length > 4) {
      throw new Error("macro-pressure requires two to four visible nodes");
    }
    if (content.arrows.length < 1 || content.arrows.length > 3) {
      throw new Error("macro-pressure requires one to three visible arrows");
    }
  }
  if (template === "source-receipt") {
    if (
      content.cards.length === 0 &&
      content.numbers.length === 0 &&
      content.texts.length === 0
    ) {
      throw new Error("source-receipt requires at least one visible evidence item");
    }
    if (content.numbers.some((number) => number.numericValue === null || !Number.isFinite(number.numericValue))) {
      throw new Error("E_SOURCE_RECEIPT_NON_NUMERIC_NUMBER");
    }
  }
};

export const MarketPulseGridTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  assertFinancialTemplateContent("market-pulse-grid", content);
  const columns = content.numbers.length <= 4 ? 2 : 3;
  return (
    <Surface accent={palette.cyan} style={{padding: "27px 34px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 19}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24}}>
        <div><Pill tone="neutral">市場スナップショット</Pill><div style={{marginTop: 9, fontSize: 32, fontWeight: 950}}>{content.headline}</div></div>
        <div style={{maxWidth: 470, color: palette.emphasis, textAlign: "right", fontSize: 30, lineHeight: 1.2, fontWeight: 950}}>{content.screenQuestion}</div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`, gap: 16, alignContent: "center"}}>
        {content.numbers.map((number) => (
          <div key={number.key} style={{
            ...entryStyle(content, number.revealAtMs),
            minWidth: 0,
            minHeight: content.numbers.length <= 4 ? 176 : 142,
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            padding: content.numbers.length <= 4 ? "20px 23px" : "16px 18px",
            borderRadius: 21,
            background: `${toneColor(number.tone)}0c`,
            border: `3px solid ${toneColor(number.tone)}`,
          }}>
            <div style={{fontSize: content.numbers.length <= 4 ? 28 : 24, fontWeight: 950}}>{number.label}</div>
            <div style={{display: "flex", alignItems: "center", color: toneColor(number.tone)}}>
              <AnimatedMetric content={content} number={number} size={content.numbers.length <= 4 ? 62 : 50}/>
            </div>
            <div style={{minHeight: 26, color: palette.muted, fontSize: 20, fontWeight: 850}}>{number.comparison ?? "同一セッション"}</div>
          </div>
        ))}
      </div>
      <div style={{display: "flex", justifyContent: "space-between", gap: 22, color: palette.muted, fontSize: 22, fontWeight: 850}}>
        <span>{content.templateConfig.comparisonBasis ?? "同じ単位・同じセッションで比較"}</span>
        <span>{content.primaryElement}</span>
      </div>
    </Surface>
  );
};

const SurprisePanel: FC<{
  content: PublicMainContent;
  number: PublicNumber;
  title: string;
  tone: Tone;
  featured?: boolean;
}> = ({content, number, title, tone, featured = false}) => (
  <div style={{
    ...entryStyle(content, number.revealAtMs),
    minWidth: 0,
    display: "grid",
    gridTemplateRows: "auto auto 1fr",
    gap: 17,
    padding: featured ? "28px 27px" : "25px 24px",
    borderRadius: 24,
    background: featured ? `${toneColor(tone)}16` : `${toneColor(tone)}0a`,
    border: `${featured ? 6 : 3}px solid ${toneColor(tone)}`,
    boxShadow: featured ? `0 0 0 7px ${toneColor(tone)}18` : "0 12px 22px rgba(16,32,51,.08)",
  }}>
    <div style={{textAlign: "center"}}><Pill tone={tone}>{title}</Pill></div>
    <div style={{display: "flex", justifyContent: "center", color: toneColor(tone)}}>
      <AnimatedMetric content={content} number={number} size={featured ? 72 : 60}/>
    </div>
    <div style={{alignSelf: "end", textAlign: "center"}}>
      <div style={{fontSize: 27, lineHeight: 1.18, fontWeight: 950}}>{number.label}</div>
      <div style={{marginTop: 9, color: palette.muted, fontSize: 21, lineHeight: 1.25, fontWeight: 850}}>{number.comparison ?? "同一基準"}</div>
    </div>
  </div>
);

export const EarningsSurpriseTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  assertFinancialTemplateContent("earnings-surprise", content);
  const [expected, actual, gap] = content.numbers;
  return (
    <Surface accent={palette.emphasis} style={{padding: "27px 32px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 20}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22}}>
        <div><Pill tone="emphasis">予想・実際・差分</Pill><div style={{marginTop: 9, fontSize: 32, fontWeight: 950}}>{content.headline}</div></div>
        <div style={{maxWidth: 440, color: palette.emphasis, textAlign: "right", fontSize: 31, lineHeight: 1.2, fontWeight: 950}}>{content.screenQuestion}</div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1.08fr", gap: 18, alignContent: "stretch"}}>
        <SurprisePanel content={content} number={expected} title="予想" tone="neutral"/>
        <SurprisePanel content={content} number={actual} title="実際" tone="positive"/>
        <SurprisePanel content={content} number={gap} title="差分" tone="emphasis" featured/>
      </div>
      <div style={{display: "flex", justifyContent: "space-between", gap: 22, color: palette.muted, fontSize: 22, fontWeight: 850}}>
        <span>{content.templateConfig.comparisonBasis ?? "同一企業・同一期間・同一通貨"}</span>
        <span style={{color: palette.emphasis}}>{content.primaryElement}</span>
      </div>
    </Surface>
  );
};

export const DualAssetSplitTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  assertFinancialTemplateContent("dual-asset-split", content);
  const [left, right] = content.numbers;
  const values = [numericValue(left) ?? 0, numericValue(right) ?? 0];
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  const panel = (number: PublicNumber, value: number, side: "left" | "right") => {
    const width = `${clamp((Math.abs(value) / max) * progressAt(content, number.revealAtMs, 760)) * 42}%`;
    return (
      <div style={{...entryStyle(content, number.revealAtMs, "x"), minWidth: 0, display: "grid", gridTemplateRows: "auto 1fr auto", gap: 20, padding: "25px 27px"}}>
        <div style={{textAlign: side === "left" ? "left" : "right"}}><Pill tone={number.tone}>{number.label}</Pill></div>
        <div style={{position: "relative", minHeight: 185, borderRadius: 22, background: `${toneColor(number.tone)}0a`, border: `3px solid ${toneColor(number.tone)}`}}>
          <div style={{position: "absolute", left: "50%", top: 17, bottom: 17, width: 3, background: palette.line}}/>
          <div style={{
            position: "absolute",
            top: 50,
            height: 78,
            borderRadius: 17,
            background: toneColor(number.tone),
            ...(value < 0 ? {right: "50%", width} : {left: "50%", width}),
          }}/>
          <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: toneColor(number.tone)}}>
            <AnimatedMetric content={content} number={number} size={69}/>
          </div>
        </div>
        <div style={{color: palette.muted, textAlign: side === "left" ? "left" : "right", fontSize: 23, lineHeight: 1.25, fontWeight: 850}}>{number.comparison ?? "同一セッション"}</div>
      </div>
    );
  };
  return (
    <Surface accent={palette.emphasis} style={{display: "grid", gridTemplateRows: "auto 1fr auto", padding: "27px 30px", gap: 16}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22}}>
        <div><Pill tone="emphasis">銘柄の明暗</Pill><div style={{marginTop: 9, fontSize: 32, fontWeight: 950}}>{content.headline}</div></div>
        <div style={{maxWidth: 460, color: palette.emphasis, textAlign: "right", fontSize: 31, lineHeight: 1.2, fontWeight: 950}}>{content.screenQuestion}</div>
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 4px 1fr", gap: 6, alignItems: "stretch"}}>
        {panel(left, values[0], "left")}
        <div style={{borderRadius: 99, background: `linear-gradient(180deg,transparent,${palette.emphasis},transparent)`}}/>
        {panel(right, values[1], "right")}
      </div>
      <div style={{display: "flex", justifyContent: "space-between", gap: 22, color: palette.muted, fontSize: 22, fontWeight: 850}}>
        <span>{content.templateConfig.comparisonBasis ?? "同じ単位・同じ市場セッション"}</span>
        <span style={{color: palette.emphasis}}>{content.primaryElement}</span>
      </div>
    </Surface>
  );
};

const nodePositions = (nodes: PublicNode[]) => new Map(nodes.map((node, index) => [
  node.key,
  {
    x: nodes.length === 1 ? 50 : 11 + (78 * index) / Math.max(1, nodes.length - 1),
    y: index % 2 === 0 ? 43 : 58,
  },
]));

export const MacroPressureTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  assertFinancialTemplateContent("macro-pressure", content);
  const order = (content.templateConfig.nodeOrder ?? []).length > 0
    ? content.templateConfig.nodeOrder
    : content.nodes.map((node) => node.key);
  const nodes = order
    .map((id) => content.nodes.find((node) => node.key === id))
    .filter((node): node is PublicNode => Boolean(node));
  const positions = nodePositions(nodes);
  return (
    <Surface accent={palette.warning} style={{padding: "25px 30px"}}>
      <div style={{position: "absolute", left: 30, right: 30, top: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22, zIndex: 2}}>
        <div><Pill tone="warning">マクロの波及</Pill><div style={{marginTop: 9, fontSize: 31, fontWeight: 950}}>{content.headline}</div></div>
        <div style={{maxWidth: 470, color: palette.emphasis, textAlign: "right", fontSize: 30, lineHeight: 1.2, fontWeight: 950}}>{content.screenQuestion}</div>
      </div>
      <svg viewBox="0 0 1400 620" style={{position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible"}}>
        <defs><marker id="financial-macro-arrow" markerWidth="13" markerHeight="13" refX="10" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={palette.warning}/></marker></defs>
        {content.arrows.map((arrow: PublicArrow) => {
          const from = positions.get(arrow.fromKey);
          const to = positions.get(arrow.toKey);
          if (!from || !to) return null;
          const progress = progressAt(content, arrow.revealAtMs, 720);
          const x1 = from.x * 14;
          const y1 = from.y * 6.2;
          const x2 = to.x * 14;
          const y2 = to.y * 6.2;
          return (
            <g key={arrow.key} opacity={progress}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke={arrow.highlighted ? palette.emphasis : palette.warning} strokeWidth={arrow.highlighted ? 10 : 7} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#financial-macro-arrow)"/>
              {arrow.label ? <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 18} fill={palette.ink} fontSize="24" textAnchor="middle" stroke={palette.paper} strokeWidth="9" paintOrder="stroke" fontWeight="900">{arrow.label}</text> : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((node, index) => {
        const point = positions.get(node.key)!;
        const isAnchor = index === 0;
        return (
          <div key={node.key} style={{
            ...entryStyle(content, node.revealAtMs),
            position: "absolute",
            left: `${point.x}%`,
            top: `${point.y}%`,
            translate: "-50% -50%",
            width: isAnchor ? 270 : 245,
            minHeight: isAnchor ? 132 : 118,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            padding: 19,
            borderRadius: 23,
            textAlign: "center",
            background: isAnchor ? "rgba(186,107,0,.16)" : "rgba(7,142,174,.09)",
            border: `${node.highlighted || isAnchor ? 6 : 3}px solid ${node.highlighted ? palette.emphasis : isAnchor ? palette.warning : palette.cyan}`,
            fontSize: 28,
            lineHeight: 1.22,
            fontWeight: 950,
          }}>
            {node.label}
          </div>
        );
      })}
      <div style={{position: "absolute", left: 30, right: 30, bottom: 23, display: "flex", justifyContent: "space-between", gap: 22, color: palette.muted, fontSize: 21, fontWeight: 850}}>
        <span>{content.templateConfig.comparisonBasis ?? "確認済みの因果経路"}</span>
        <span style={{color: palette.emphasis}}>{content.primaryElement}</span>
      </div>
    </Surface>
  );
};

const uniqueEvidence = (values: Array<string | null | undefined>) =>
  [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];

const ReceiptEvidence: FC<{
  content: PublicMainContent;
  evidence: string[];
  fontSize: number;
  compact?: boolean;
}> = ({content, evidence, fontSize, compact = false}) => (
  <div style={{
    ...entryStyle(content, content.beatStartMs + 380, "x"),
    position: "relative",
    minWidth: 0,
    minHeight: compact ? 300 : 390,
    padding: compact ? "25px 28px 52px" : "30px 29px 58px",
    borderRadius: 18,
    background: "rgba(255,255,255,.92)",
    border: `2px solid ${palette.line}`,
    boxShadow: "0 18px 35px rgba(16,32,51,.13)",
  }}>
    <div style={{position: "absolute", left: 22, right: 22, top: 18, height: 3, background: `repeating-linear-gradient(90deg,${palette.neutral} 0 12px,transparent 12px 21px)`}}/>
    <div style={{marginTop: 10, display: "flex", justifyContent: "space-between", gap: 15, color: palette.muted, fontSize: 20, fontWeight: 900}}><span>確認済み資料</span><span>出典メモ</span></div>
    <div style={{marginTop: 20, display: "grid", gap: compact ? 12 : 16}}>
      {evidence.map((item, index) => (
        <div key={`${index}-${item}`} style={{
          ...entryStyle(content, content.beatStartMs + 620 + index * 360),
          display: "grid",
          gridTemplateColumns: "34px minmax(0,1fr)",
          gap: 13,
          alignItems: "start",
          paddingBottom: compact ? 10 : 14,
          borderBottom: `2px dashed ${palette.line}`,
        }}>
          <div style={{width: 28, height: 28, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: palette.white, background: palette.positive, fontSize: 18, fontWeight: 950}}>✓</div>
          <div style={{minWidth: 0, fontSize, lineHeight: 1.3, fontWeight: 900, overflowWrap: "anywhere"}}>{item}</div>
        </div>
      ))}
    </div>
    <div style={{position: "absolute", left: 29, right: 29, bottom: 20, color: palette.muted, fontSize: 19, lineHeight: 1.25, fontWeight: 850, overflowWrap: "anywhere"}}>{content.templateConfig.comparisonBasis ?? "確認できた範囲だけを表示"}</div>
  </div>
);

export const SourceReceiptTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  assertFinancialTemplateContent("source-receipt", content);
  const evidence = uniqueEvidence([
    ...content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title]),
    ...content.texts,
  ]).slice(0, 4);
  const primaryElement = content.primaryElement || content.headline;
  const plan = planSourceReceiptLayout({
    primaryElement,
    screenQuestion: content.screenQuestion,
    evidence,
    comparisonBasis: content.templateConfig.comparisonBasis,
  });

  const heading = (
    <div style={{display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0}}>
      <div style={entryStyle(content, content.beatStartMs)}><Pill tone="neutral">確認済みの根拠</Pill></div>
      <div style={{...entryStyle(content, content.beatStartMs + 250), marginTop: 16, fontSize: plan.titleFontSize, lineHeight: 1.16, fontWeight: 950, overflowWrap: "anywhere"}}>{primaryElement}</div>
      <div style={{...entryStyle(content, content.beatStartMs + 500), marginTop: 13, color: palette.emphasis, fontSize: plan.questionFontSize, lineHeight: 1.28, fontWeight: 950, overflowWrap: "anywhere"}}>{content.screenQuestion}</div>
      {content.numbers.slice(0, 2).map((number) => (
        <div key={number.key} style={{...entryStyle(content, number.revealAtMs), marginTop: 16, color: toneColor(number.tone)}}>
          <AnimatedMetric content={content} number={number} size={plan.mode === "stacked" ? 45 : 52}/>
        </div>
      ))}
    </div>
  );

  if (plan.mode === "stacked") {
    return (
      <Surface accent={palette.neutral} style={{padding: "24px 38px", display: "grid", gridTemplateRows: "auto minmax(0,1fr)", gap: 18}}>
        {heading}
        <ReceiptEvidence content={content} evidence={evidence} fontSize={plan.evidenceFontSize} compact/>
      </Surface>
    );
  }

  return (
    <Surface accent={palette.neutral} style={{padding: "28px 38px", display: "grid", gridTemplateColumns: "1.08fr .92fr", gap: 26}}>
      {heading}
      <ReceiptEvidence content={content} evidence={evidence} fontSize={plan.evidenceFontSize}/>
    </Surface>
  );
};
