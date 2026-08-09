import {Easing, interpolate, spring} from "remotion";
import type {PublicMainContent, PublicNumber} from "../../spec/public-view-model";

const FPS = 30;
const palette = {
  paper: "rgba(249,252,254,.97)",
  paperSoft: "rgba(229,240,247,.96)",
  ink: "#102033",
  muted: "#53697b",
  cyan: "#078eae",
  positive: "#07865f",
  negative: "#c74452",
  warning: "#ba6b00",
  neutral: "#527691",
  emphasis: "#7046a8",
};

type Tone = PublicNumber["tone"];
const toneColor = (tone: Tone) => palette[tone];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

const parseNumeric = (number: PublicNumber) => {
  if (number.numericValue != null) return number.numericValue;
  const match = number.value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const progressAt = (content: PublicMainContent, startMs: number, durationMs = 620) => spring({
  fps: FPS,
  frame: Math.max(0, Math.round(((content.sceneTimeMs - startMs) / 1000) * FPS)),
  config: {damping: 22, stiffness: 145, mass: 0.72},
  durationInFrames: Math.max(12, Math.round((durationMs / 1000) * FPS)),
});

const revealStyle = (
  content: PublicMainContent,
  startMs: number,
  direction: "left" | "right" | "up" = "up",
): React.CSSProperties => {
  const progress = progressAt(content, startMs);
  const x = direction === "left" ? -46 : direction === "right" ? 46 : 0;
  const y = direction === "up" ? 42 : 0;
  return {
    opacity: interpolate(progress, [0, 0.25, 1], [0, 0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: `${interpolate(progress, [0, 1], [x, 0], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}px ${interpolate(progress, [0, 1], [y, 0], {easing: Easing.bezier(0.16, 1, 0.3, 1)})}px`,
    scale: interpolate(progress, [0, 1], [0.95, 1]),
  };
};

const Surface: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties}> = ({children, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  ...style,
}}>{children}</div>;

const Value: React.FC<{content: PublicMainContent; number: PublicNumber; size?: number}> = ({content, number, size = 74}) => {
  const numeric = parseNumeric(number);
  const progress = progressAt(content, number.enterMotion?.startedAtMs ?? number.revealAtMs, number.enterMotion?.durationMs ?? 760);
  const precision = number.precision ?? (number.value.includes(".") ? number.value.split(".").at(-1)?.length ?? 0 : 0);
  const plus = number.value.trim().startsWith("+");
  const text = numeric == null ? number.value : `${plus && numeric >= 0 ? "+" : ""}${(numeric * progress).toFixed(precision)}`;
  return <div style={{display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, color: toneColor(number.tone), whiteSpace: "nowrap"}}><span style={{fontSize: size, lineHeight: 1, fontWeight: 950}}>{text}</span><span style={{fontSize: Math.round(size * .42), fontWeight: 900}}>{number.unit}</span></div>;
};

export const HeroNumberTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const number = content.numbers[0];
  const card = content.cards[0];
  const start = number?.revealAtMs ?? card?.revealAtMs ?? content.beatStartMs;
  return <Surface accent={number ? toneColor(number.tone) : palette.emphasis} style={{position: "relative", padding: "38px 54px", display: "grid", gridTemplateColumns: content.entity ? "1fr 1.35fr" : "1fr", alignItems: "center", gap: 36}}>
    {content.entity ? <div style={{...revealStyle(content, start, "left"), minWidth: 0}}><div style={{fontSize: 25, color: palette.cyan, fontWeight: 950}}>主役</div><div style={{marginTop: 14, fontSize: 62, lineHeight: 1.08, fontWeight: 950}}>{content.entity.displayName}</div><div style={{marginTop: 18, color: palette.muted, fontSize: 30, lineHeight: 1.3, fontWeight: 850}}>{content.entity.role}</div></div> : null}
    <div style={{...revealStyle(content, start, "right"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{fontSize: 29, color: palette.muted, fontWeight: 900}}>{number?.label ?? card?.title ?? content.primaryElement}</div>{number ? <div style={{marginTop: 20}}><Value content={content} number={number} size={112}/></div> : <div style={{marginTop: 24, fontSize: 64, lineHeight: 1.15, color: palette.emphasis, fontWeight: 950}}>{card?.lines[0]?.value ?? content.headline}</div>}{number?.comparison ? <div style={{marginTop: 18, fontSize: 28, color: palette.cyan, fontWeight: 900}}>{number.comparison}</div> : null}</div>
    <div style={{position: "absolute", left: "10%", right: "10%", bottom: 28, height: 7, borderRadius: 99, background: `linear-gradient(90deg,transparent,${number ? toneColor(number.tone) : palette.emphasis},transparent)`, scale: `${.7 + content.holdProgress * .3} 1`}}/>
  </Surface>;
};

export const SplitComparisonTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const left = content.numbers[0];
  const rightItems = content.numbers.slice(1);
  const right = rightItems[0];
  const startLeft = left?.revealAtMs ?? content.beatStartMs;
  const startRight = right?.revealAtMs ?? content.beatStartMs + 700;
  const panel = (number: PublicNumber | undefined, side: "left" | "right", extras: PublicNumber[]) => <div style={{...revealStyle(content, side === "left" ? startLeft : startRight, side), position: "relative", padding: "34px 36px", borderRadius: 24, background: side === "left" ? "rgba(7,134,95,.09)" : "rgba(199,68,82,.08)", border: `3px solid ${number ? toneColor(number.tone) : palette.neutral}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{fontSize: 32, color: palette.muted, fontWeight: 900}}>{number?.label ?? (side === "left" ? "支援" : "相殺")}</div>{number ? <div style={{marginTop: 20}}><Value content={content} number={number} size={82}/></div> : null}{number?.comparison ? <div style={{marginTop: 16, fontSize: 25, color: toneColor(number.tone), fontWeight: 900}}>{number.comparison}</div> : null}{extras.length > 1 ? <div style={{marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center"}}>{extras.slice(1).map((item) => <div key={item.key} style={{padding: "9px 14px", borderRadius: 14, background: `${toneColor(item.tone)}12`, border: `2px solid ${toneColor(item.tone)}`, fontSize: 23, fontWeight: 900}}>{item.label} {item.value}{item.unit}</div>)}</div> : null}</div>;
  return <Surface accent={palette.emphasis} style={{padding: "30px 36px", display: "grid", gridTemplateColumns: "1fr 90px 1fr", gap: 18, alignItems: "stretch"}}>{panel(left, "left", left ? [left] : [])}<div style={{display: "flex", alignItems: "center", justifyContent: "center", color: palette.emphasis, fontSize: 52, fontWeight: 950}}>VS</div>{panel(right, "right", rightItems)}</Surface>;
};

export const FocusMatrixTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const values = content.numbers.map((number) => Math.abs(parseNumeric(number) ?? 0));
  const max = Math.max(1, ...values);
  return <Surface accent={palette.cyan} style={{padding: "28px 38px", display: "grid", gridTemplateRows: "auto 1fr", gap: 20}}><div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><div><div style={{fontSize: 24, color: palette.cyan, fontWeight: 950}}>波及の強さ</div><div style={{marginTop: 8, fontSize: 36, fontWeight: 950}}>{content.screenQuestion}</div></div><div style={{fontSize: 27, color: palette.muted, fontWeight: 850}}>話している対象だけを明るくする</div></div><div style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16}}>{content.numbers.map((number, index) => {const progress = progressAt(content, number.enterMotion?.startedAtMs ?? number.revealAtMs, number.enterMotion?.durationMs ?? 720); const ratio = clamp((values[index] / max) * progress); const focused = number.highlighted || number.highlightMotion != null; return <div key={number.key} style={{...revealStyle(content, number.revealAtMs), opacity: focused ? 1 : content.numbers.some((item) => item.highlighted) ? .38 : 1, padding: "20px 22px", borderRadius: 20, background: `${toneColor(number.tone)}0d`, border: `${focused ? 5 : 2}px solid ${toneColor(number.tone)}`, display: "grid", gridTemplateColumns: "180px 1fr 118px", alignItems: "center", gap: 16}}><div style={{fontSize: 29, fontWeight: 950}}>{number.label}</div><div style={{height: 34, borderRadius: 99, background: "rgba(82,118,145,.13)", overflow: "hidden"}}><div style={{height: "100%", width: `${ratio * 100}%`, borderRadius: 99, background: toneColor(number.tone)}}/></div><div style={{textAlign: "right", color: toneColor(number.tone), fontSize: 34, fontWeight: 950}}>{number.value}{number.unit}</div></div>;})}</div></Surface>;
};

const INTERNAL_ENTITY_CARD_LABEL = /(?:企業|人物|製品)カード$/u;

type EntityFocusTextSource = Pick<PublicMainContent, "texts" | "primaryElement" | "headline" | "entity">;

export const getEntityFocusPublicPoint = (content: EntityFocusTextSource): string => {
  const displayName = content.entity?.displayName.trim() ?? "";
  const role = content.entity?.role.trim() ?? "";
  const isMachineOnly = (value: string) => INTERNAL_ENTITY_CARD_LABEL.test(value.trim());
  const viewerText = content.texts
    .map((value) => value.trim())
    .find((value) => value.length > 0 && value !== displayName && value !== role && !isMachineOnly(value));
  if (viewerText) return viewerText;
  const primary = content.primaryElement.trim();
  if (primary && primary !== displayName && primary !== role && !isMachineOnly(primary)) return primary;
  return content.headline;
};

export const EntityFocusStoryTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const number = content.numbers[0];
  const entityStart = number?.revealAtMs ?? content.beatStartMs;
  const publicPoint = getEntityFocusPublicPoint(content);
  const prebuiltCard = content.entityPresentation === "prebuilt-card";
  const point = <><div style={{fontSize: 27, color: palette.muted, fontWeight: 900}}>{number ? number.label : "今朝のポイント"}</div>{number ? <div style={{marginTop: 18}}><Value content={content} number={number} size={88}/></div> : <div style={{marginTop: 14, fontSize: prebuiltCard ? 38 : 45, lineHeight: 1.18, color: palette.emphasis, fontWeight: 950, overflowWrap: "anywhere"}}>{publicPoint}</div>}</>;
  return <Surface accent={palette.cyan} style={{position: "relative", padding: "42px 48px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 30}}>
    <div style={{...revealStyle(content, entityStart, "left"), display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0}}><div style={{fontSize: 25, color: palette.cyan, fontWeight: 950}}>{content.entity?.subjectType === "company" ? "企業" : content.entity?.subjectType === "person" ? "人物" : "主役"}</div><div style={{marginTop: 16, fontSize: 66, lineHeight: 1.08, fontWeight: 950}}>{content.entity?.displayName ?? content.headline}</div><div style={{marginTop: 20, color: palette.muted, fontSize: 31, lineHeight: 1.32, fontWeight: 850}}>{content.entity?.role ?? content.screenQuestion}</div></div>
    {prebuiltCard
      ? <div style={{...revealStyle(content, number?.revealAtMs ?? entityStart + 500, "right"), display: "flex", alignItems: "flex-end", minWidth: 0, paddingTop: 382}}><div data-entity-point-panel="true" style={{width: "100%", minHeight: 146, boxSizing: "border-box", padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 22, background: "rgba(249,252,254,.96)", border: `3px solid ${palette.cyan}`, textAlign: "center"}}>{point}</div></div>
      : <div style={{...revealStyle(content, number?.revealAtMs ?? entityStart + 500, "right"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 24, background: "rgba(7,142,174,.09)", border: `3px solid ${palette.cyan}`, textAlign: "center"}}>{point}</div>}
  </Surface>;
};

export const FinalAssemblyTemplate: React.FC<{content: PublicMainContent}> = ({content}) => {
  const chips = [...content.texts, ...content.cards.flatMap((card) => card.lines.map((line) => line.value))].filter((value, index, list) => list.indexOf(value) === index).slice(0, 4);
  const conclusion = content.cards[0]?.lines[0]?.value ?? content.primaryElement ?? content.headline;
  return <Surface accent={palette.emphasis} style={{padding: "40px 52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}><div style={{...revealStyle(content, content.beatStartMs), padding: "7px 19px", borderRadius: 99, color: palette.emphasis, border: `2px solid ${palette.emphasis}`, background: "rgba(112,70,168,.10)", fontSize: 25, fontWeight: 950}}>今朝の結論</div><div style={{display: "flex", gap: 14, marginTop: 27, width: "100%", justifyContent: "center"}}>{chips.map((chip, index) => <div key={`${index}-${chip}`} style={{...revealStyle(content, content.beatStartMs + (index + 1) * 520), flex: 1, maxWidth: 310, padding: "15px 17px", borderRadius: 17, background: "rgba(82,118,145,.10)", border: "2px solid rgba(82,118,145,.30)", fontSize: 25, lineHeight: 1.22, fontWeight: 900}}>{chip}</div>)}</div><div style={{...revealStyle(content, content.beatStartMs + Math.min(2600, (content.beatEndMs - content.beatStartMs) * .58)), marginTop: 34, fontSize: 75, lineHeight: 1.12, color: palette.emphasis, fontWeight: 950}}>{conclusion}</div><div style={{marginTop: 31, width: `${58 + content.holdProgress * 24}%`, height: 8, borderRadius: 99, background: `linear-gradient(90deg,transparent,${palette.cyan},transparent)`}}/></Surface>;
};
