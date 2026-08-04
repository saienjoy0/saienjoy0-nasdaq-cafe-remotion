import {Easing, interpolate, spring} from "remotion";
import type {PublicCard, PublicMainContent, PublicNumber, PublicShot} from "../../spec/public-view-model";
import {CAMERA_PRESET_TRANSFORMS} from "../../spec/shot-contract";
import {VisualTemplateRenderer} from "./VisualTemplateRenderer";

const FPS = 30;
const palette = {
  ink: "#f7fbff",
  dark: "rgba(5,12,28,.92)",
  darkSoft: "rgba(14,31,53,.82)",
  cyan: "#29d7f0",
  positive: "#39d99a",
  negative: "#ff6b7a",
  warning: "#ffc74a",
  neutral: "#8fb7d1",
  emphasis: "#b78cff",
};

type Tone = PublicNumber["tone"];
const toneColor = (tone: Tone) => palette[tone];
const clamp = (value: number) => Math.max(0, Math.min(1, value));

const parseNumeric = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const smooth = (progress: number) => interpolate(progress, [0, 1], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(.16, 1, .3, 1),
});

const shotSpring = (content: PublicMainContent) => spring({
  fps: FPS,
  frame: Math.max(0, Math.round(content.shot!.progress * 24)),
  config: {damping: 22, stiffness: 145, mass: .72},
  durationInFrames: 24,
});

const findNumber = (content: PublicMainContent, id: string | null) =>
  content.numbers.find((item) => item.key === id) ?? content.numbers[0] ?? null;
const findCard = (content: PublicMainContent, id: string | null) =>
  content.cards.find((item) => item.key === id) ?? content.cards[0] ?? null;
const findNode = (content: PublicMainContent, id: string | null) =>
  content.nodes.find((item) => item.key === id) ?? content.nodes[0] ?? null;

const formattedNumber = (number: PublicNumber) => `${number.value}${number.unit}`;

const cameraStyle = (shot: PublicShot): React.CSSProperties => {
  const preset = CAMERA_PRESET_TRANSFORMS[shot.cameraPreset];
  const progress = smooth(shot.progress);
  return {
    scale: interpolate(progress, [0, 1], [preset.startScale, preset.endScale]),
    translate: `${interpolate(progress, [0, 1], [preset.startX, preset.endX])}px ${interpolate(progress, [0, 1], [preset.startY, preset.endY])}px`,
    transformOrigin: "50% 50%",
  };
};

const transitionStyle = (shot: PublicShot): React.CSSProperties => {
  const progress = smooth(shot.progress);
  const enter = clamp(progress / .18);
  const exit = clamp((1 - progress) / .12);
  const opacity = Math.min(enter, shot.transitionOut === "hard-cut" ? 1 : exit);
  if (shot.transitionIn === "hard-cut") return {opacity: 1};
  if (shot.transitionIn === "soft-reveal") {
    return {opacity: enter, clipPath: `inset(${interpolate(enter, [0, 1], [10, 0])}% ${interpolate(enter, [0, 1], [8, 0])}% round 26px)`};
  }
  return {opacity};
};

const Stage: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties}> = ({children, accent = palette.cyan, style}) => <div style={{
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  borderRadius: 30,
  color: palette.ink,
  background: `radial-gradient(circle at 70% 25%,${accent}28,transparent 44%),linear-gradient(145deg,${palette.dark},${palette.darkSoft})`,
  border: `2px solid ${accent}88`,
  boxShadow: "0 24px 58px rgba(0,0,0,.36)",
  ...style,
}}>{children}</div>;

const BigMetric: React.FC<{number: PublicNumber; size?: number}> = ({number, size = 142}) => <div style={{display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12, color: toneColor(number.tone), whiteSpace: "nowrap"}}>
  <span style={{fontSize: size, lineHeight: .92, fontWeight: 950, letterSpacing: "-.04em"}}>{number.value}</span>
  <span style={{fontSize: Math.round(size * .34), fontWeight: 900}}>{number.unit}</span>
</div>;

const HeroMetric: React.FC<{content: PublicMainContent; number: PublicNumber | null; card: PublicCard | null}> = ({content, number, card}) => {
  const p = shotSpring(content);
  return <Stage accent={number ? toneColor(number.tone) : palette.emphasis} style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 46}}>
    <div style={{opacity: p, translate: `0 ${interpolate(p, [0, 1], [30, 0])}px`, fontSize: 31, color: palette.neutral, fontWeight: 900}}>{number?.label ?? card?.title ?? content.primaryElement}</div>
    <div style={{marginTop: 24, scale: interpolate(p, [0, 1], [.72, 1])}}>{number ? <BigMetric number={number}/> : <div style={{fontSize: 82, lineHeight: 1.08, color: palette.emphasis, fontWeight: 950}}>{card?.lines[0]?.value ?? content.primaryElement}</div>}</div>
    <div style={{marginTop: 26, width: `${interpolate(p, [0, 1], [0, 72])}%`, height: 7, borderRadius: 99, background: `linear-gradient(90deg,transparent,${number ? toneColor(number.tone) : palette.emphasis},transparent)`}}/>
  </Stage>;
};

const Contradiction: React.FC<{content: PublicMainContent}> = ({content}) => {
  const primary = findNumber(content, content.shot!.primaryTargetId);
  const secondary = content.numbers.find((item) => item.key !== primary?.key) ?? null;
  const p = shotSpring(content);
  return <Stage accent={palette.warning} style={{padding: 40, display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: 24, alignItems: "center"}}>
    {[primary, secondary].map((item, index) => <div key={item?.key ?? index} style={{opacity: p, translate: `${interpolate(p, [0, 1], [index === 0 ? -70 : 70, 0])}px 0`, padding: 28, borderRadius: 24, background: item ? `${toneColor(item.tone)}18` : "rgba(143,183,209,.10)", border: `3px solid ${item ? toneColor(item.tone) : palette.neutral}`, textAlign: "center"}}>
      <div style={{fontSize: 31, fontWeight: 900}}>{item?.label ?? "反対材料"}</div>
      {item ? <div style={{marginTop: 20}}><BigMetric number={item} size={76}/></div> : null}
    </div>)}
    <div style={{gridColumn: 2, gridRow: 1, fontSize: 62, color: palette.warning, textAlign: "center", fontWeight: 950, scale: interpolate(p, [0, 1], [.5, 1])}}>≠</div>
    <div style={{position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontSize: 36, color: palette.warning, fontWeight: 950}}>{content.shot?.typographyText ?? content.screenQuestion}</div>
  </Stage>;
};

const ExpectedAnchor: React.FC<{content: PublicMainContent}> = ({content}) => {
  const number = findNumber(content, content.shot!.primaryTargetId);
  const card = findCard(content, content.shot!.primaryTargetId);
  const text = number ? formattedNumber(number) : card?.lines[0]?.value ?? content.primaryElement;
  const p = shotSpring(content);
  return <Stage accent={palette.neutral} style={{padding: 54, display: "flex", flexDirection: "column", justifyContent: "center"}}>
    <div style={{fontSize: 28, color: palette.neutral, fontWeight: 900}}>EXPECTED</div>
    <div style={{marginTop: 26, position: "relative", height: 150}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 72, height: 5, background: "rgba(143,183,209,.35)"}}/>
      <div style={{position: "absolute", left: `${interpolate(p, [0, 1], [0, 58])}%`, top: 18, width: 6, height: 112, borderRadius: 99, background: palette.warning, boxShadow: "0 0 30px rgba(255,199,74,.45)"}}/>
      <div style={{position: "absolute", left: `${interpolate(p, [0, 1], [0, 58])}%`, top: 0, translate: "-50% 0", fontSize: 54, color: palette.warning, fontWeight: 950}}>{text}</div>
    </div>
    <div style={{fontSize: 30, color: palette.neutral, fontWeight: 850}}>{content.templateConfig.comparisonBasis ?? "市場が置いていた基準"}</div>
  </Stage>;
};

const ActualCrosses: React.FC<{content: PublicMainContent}> = ({content}) => {
  const actual = findNumber(content, content.shot!.primaryTargetId);
  const actualValue = Math.abs(actual?.numericValue ?? parseNumeric(actual?.value ?? "") ?? 0);
  const expectedValue = Math.abs(parseNumeric(actual?.comparison ?? "") ?? actualValue * .88);
  const max = Math.max(1, actualValue, expectedValue) * 1.08;
  const p = shotSpring(content);
  const width = (actualValue / max) * p * 100;
  const expectedX = (expectedValue / max) * 100;
  return <Stage accent={palette.positive} style={{padding: 52, display: "grid", gridTemplateRows: "auto 1fr auto", gap: 30}}>
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><div style={{fontSize: 31, color: palette.neutral, fontWeight: 900}}>ACTUAL</div>{actual ? <BigMetric number={actual} size={72}/> : null}</div>
    <div style={{position: "relative", alignSelf: "center", height: 170, borderRadius: 24, background: "rgba(143,183,209,.10)", border: "2px solid rgba(143,183,209,.25)", overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, width: `${width}%`, background: "linear-gradient(90deg,rgba(57,217,154,.45),rgba(57,217,154,.95))"}}/>
      <div style={{position: "absolute", left: `${expectedX}%`, top: 0, bottom: 0, width: 7, background: palette.warning, boxShadow: "0 0 0 4px rgba(5,12,28,.86)"}}/>
      <div style={{position: "absolute", left: `${expectedX}%`, top: 16, translate: "-50% 0", fontSize: 25, color: palette.warning, fontWeight: 900}}>EXPECTED</div>
    </div>
    <div style={{fontSize: 34, color: width > expectedX ? palette.positive : palette.negative, textAlign: "center", fontWeight: 950}}>{width > expectedX ? "予想線を越えた" : "予想線に届かなかった"}</div>
  </Stage>;
};

const GapMacro: React.FC<{content: PublicMainContent}> = ({content}) => {
  const number = findNumber(content, content.shot!.primaryTargetId);
  const card = findCard(content, content.shot!.primaryTargetId);
  const p = shotSpring(content);
  return <Stage accent={palette.emphasis} style={{display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
    <div style={{position: "absolute", width: 480, height: 480, borderRadius: 999, border: `${interpolate(p, [0, 1], [2, 18])}px solid rgba(183,140,255,.38)`, scale: interpolate(p, [0, 1], [.55, 1]), opacity: .9}}/>
    <div style={{position: "relative", zIndex: 2, scale: interpolate(p, [0, 1], [.62, 1])}}><div style={{fontSize: 31, color: palette.emphasis, fontWeight: 950}}>GAP</div>{number ? <div style={{marginTop: 18}}><BigMetric number={number} size={132}/></div> : <div style={{marginTop: 20, fontSize: 80, color: palette.emphasis, fontWeight: 950}}>{card?.lines[0]?.value ?? content.primaryElement}</div>}<div style={{marginTop: 24, fontSize: 31, color: palette.neutral, fontWeight: 850}}>{content.shot?.typographyText ?? "市場が反応した差分"}</div></div>
  </Stage>;
};

const GenericShot: React.FC<{content: PublicMainContent}> = ({content}) => <Stage accent={palette.cyan} style={{padding: 0}}><VisualTemplateRenderer content={content}/></Stage>;

const KineticTypography: React.FC<{shot: PublicShot}> = ({shot}) => {
  if (!shot.typographyTreatment || !shot.typographyText) return null;
  const p = smooth(shot.progress);
  const base: React.CSSProperties = {position: "absolute", zIndex: 20, color: palette.ink, fontWeight: 950, textShadow: "0 6px 20px rgba(0,0,0,.72)"};
  switch (shot.typographyTreatment) {
    case "number-roll": return <div style={{...base, right: 38, top: 30, fontSize: 58, opacity: p, translate: `0 ${interpolate(p, [0, 1], [28, 0])}px`}}>{shot.typographyText}</div>;
    case "word-build": return <div style={{...base, left: 42, bottom: 34, fontSize: 50, letterSpacing: `${interpolate(p, [0, 1], [.16, .01])}em`, opacity: p}}>{shot.typographyText}</div>;
    case "underline-draw": return <div style={{...base, left: 42, bottom: 34, fontSize: 48}}>{shot.typographyText}<div style={{marginTop: 8, width: `${p * 100}%`, height: 7, background: palette.warning}}/></div>;
    case "cross-out-assumption": return <div style={{...base, left: 42, bottom: 34, fontSize: 46}}>{shot.typographyText}<div style={{position: "absolute", left: 0, top: "52%", width: `${p * 100}%`, height: 7, background: palette.negative, rotate: "-4deg"}}/></div>;
    case "gap-highlight": return <div style={{...base, right: 42, bottom: 32, padding: "10px 18px", borderRadius: 14, background: "rgba(183,140,255,.20)", border: `3px solid ${palette.emphasis}`, fontSize: 48, scale: interpolate(p, [0, 1], [.78, 1])}}>{shot.typographyText}</div>;
    case "zero-line-split": return <div style={{...base, left: "50%", top: 26, translate: "-50% 0", fontSize: 46, opacity: p}}>{shot.typographyText}</div>;
    case "final-phrase-lock": return <div style={{...base, left: 0, right: 0, bottom: 34, textAlign: "center", fontSize: 58, color: palette.warning, scale: interpolate(p, [0, 1], [.86, 1])}}>{shot.typographyText}</div>;
  }
};

const ContinuityBadge: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot;
  const previous = content.previousShot;
  if (!shot?.continuityKey || !previous || previous.continuityKey !== shot.continuityKey) return null;
  const number = findNumber(content, previous.primaryTargetId);
  const node = findNode(content, previous.primaryTargetId);
  const label = number ? `${number.label} ${formattedNumber(number)}` : node?.label ?? previous.typographyText;
  if (!label) return null;
  const p = smooth(shot.progress);
  return <div style={{position: "absolute", zIndex: 30, right: interpolate(p, [0, 1], [480, 28]), top: interpolate(p, [0, 1], [250, 24]), maxWidth: 370, padding: "10px 17px", borderRadius: 999, color: palette.ink, background: "rgba(5,12,28,.88)", border: `2px solid ${palette.cyan}`, fontSize: interpolate(p, [0, 1], [36, 23]), fontWeight: 900, scale: interpolate(p, [0, 1], [1.12, 1])}}>{label}</div>;
};

export const ShotStageRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  if (!content.shot) return <VisualTemplateRenderer content={content}/>;
  const shot = content.shot;
  const number = findNumber(content, shot.primaryTargetId);
  const card = findCard(content, shot.primaryTargetId);
  const body = (() => {
    switch (shot.shotRecipe) {
      case "hero-metric-impact": return <HeroMetric content={content} number={number} card={card}/>;
      case "contradiction-interrupt": return <Contradiction content={content}/>;
      case "expected-anchor": return <ExpectedAnchor content={content}/>;
      case "actual-crosses-expected": return <ActualCrosses content={content}/>;
      case "gap-macro": return <GapMacro content={content}/>;
      case "causal-build":
      case "counterforce-interrupt":
      case "entity-cutaway":
      case "split-opposition":
      case "focus-matrix-reveal":
      case "verification-two-paths":
      case "recap-assembly":
        return <GenericShot content={content}/>;
    }
  })();
  return <div style={{position: "absolute", inset: 0, overflow: "hidden", borderRadius: 30, ...transitionStyle(shot)}}>
    <div style={{position: "absolute", inset: -40, ...cameraStyle(shot)}}>{body}</div>
    <KineticTypography shot={shot}/>
    <ContinuityBadge content={content}/>
  </div>;
};
