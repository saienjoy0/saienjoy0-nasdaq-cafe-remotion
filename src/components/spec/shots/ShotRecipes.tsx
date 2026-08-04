import {interpolate, spring} from "remotion";
import type {PublicCard, PublicMainContent, PublicNumber, PublicShot} from "../../../spec/public-view-model";
import {SafeCameraViewport} from "../SafeCameraViewport";
import {palette, SafeContent, safeFontSize, StageEyebrow, StageShell} from "../StageSafeArea";

const FPS = 30;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const toneColor = (tone: PublicNumber["tone"]) => palette[tone];
const progressFor = (shot: PublicShot) => spring({
  fps: FPS,
  frame: Math.max(0, Math.round(shot.progress * 24)),
  config: {damping: 24, stiffness: 150, mass: .78},
  durationInFrames: 24,
});
const numberById = (content: PublicMainContent, id: string | null | undefined) => id ? content.numbers.find((item) => item.key === id) ?? null : null;
const cardById = (content: PublicMainContent, id: string | null | undefined) => id ? content.cards.find((item) => item.key === id) ?? null : null;
const nodeById = (content: PublicMainContent, id: string | null | undefined) => id ? content.nodes.find((item) => item.key === id) ?? null : null;
const targetText = (content: PublicMainContent, shot: PublicShot) => shot.typographyText ?? content.primaryElement;

const Metric: React.FC<{number: PublicNumber; size?: number}> = ({number, size = 112}) => <div style={{display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, color: toneColor(number.tone), whiteSpace: "nowrap"}}>
  <span style={{fontSize: size, lineHeight: .94, fontWeight: 950, letterSpacing: "-.035em"}}>{number.value}</span>
  <span style={{fontSize: Math.round(size * .34), fontWeight: 900}}>{number.unit}</span>
</div>;

const CardValue: React.FC<{card: PublicCard; accent?: string}> = ({card, accent = palette.emphasis}) => <div style={{width: "100%", padding: "24px 30px", borderRadius: 24, background: `${accent}14`, border: `3px solid ${accent}`, boxSizing: "border-box"}}>
  <div style={{fontSize: 30, fontWeight: 950}}>{card.title}</div>
  <div style={{display: "grid", gap: 12, marginTop: 17}}>{card.lines.map((line) => <div key={`${line.label}-${line.value}`} style={{display: "grid", gridTemplateColumns: "minmax(120px,.7fr) minmax(0,1.3fr)", gap: 16, alignItems: "center"}}><div style={{fontSize: 23, color: palette.neutral, fontWeight: 850}}>{line.label}</div><div style={{fontSize: safeFontSize(line.value, 38, 27, 650), color: toneColor(line.tone), fontWeight: 950, overflowWrap: "anywhere"}}>{line.value}</div></div>)}</div>
</div>;

const HeroMetric: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const number = numberById(content, shot.primaryTargetId);
  const card = cardById(content, shot.primaryTargetId);
  const text = targetText(content, shot);
  const p = progressFor(shot);
  return <StageShell accent={number ? toneColor(number.tone) : palette.emphasis}>
    <SafeContent reserveTypography={Boolean(shot.typographyTreatment)} style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <SafeCameraViewport shot={shot} style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
        <StageEyebrow tone={palette.neutral}>{number?.label ?? card?.title ?? content.screenQuestion}</StageEyebrow>
        <div style={{marginTop: 22, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px) scale(${interpolate(p, [0, 1], [.84, 1])})`}}>
          {number ? <Metric number={number}/> : card ? <div style={{width: 930}}><CardValue card={card}/></div> : <div style={{maxWidth: 1080, fontSize: safeFontSize(text, 78, 42), lineHeight: 1.13, color: palette.emphasis, fontWeight: 950, overflowWrap: "anywhere"}}>{text}</div>}
        </div>
      </SafeCameraViewport>
    </SafeContent>
  </StageShell>;
};

const Contradiction: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const ids = [shot.primaryTargetId, ...(shot.secondaryTargetIds ?? [])].filter(Boolean) as string[];
  const items = ids.map((id) => numberById(content, id) ?? cardById(content, id)).filter(Boolean).slice(0, 2);
  const texts = content.texts.length >= 2 ? content.texts : [content.primaryElement, content.screenQuestion];
  const p = progressFor(shot);
  return <StageShell accent={palette.warning}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px minmax(0,1fr)", gap: 22, alignItems: "center"}}>
      {[0, 1].map((index) => {
        const item = items[index];
        const number = item && "value" in item && "unit" in item ? item as PublicNumber : null;
        const card = item && "lines" in item ? item as PublicCard : null;
        const text = texts[index] ?? "反対材料";
        return <div key={index} style={{opacity: p, transform: `translateX(${interpolate(p, [0, 1], [index === 0 ? -44 : 44, 0])}px)`, minWidth: 0}}>{number ? <div style={{padding: 25, borderRadius: 23, border: `3px solid ${toneColor(number.tone)}`, background: `${toneColor(number.tone)}13`, textAlign: "center"}}><div style={{fontSize: 29, fontWeight: 950}}>{number.label}</div><div style={{marginTop: 15}}><Metric number={number} size={73}/></div></div> : card ? <CardValue card={card} accent={index === 0 ? palette.positive : palette.warning}/> : <div style={{padding: 28, borderRadius: 23, border: `3px solid ${index === 0 ? palette.positive : palette.warning}`, background: "rgba(143,183,209,.09)", textAlign: "center", fontSize: safeFontSize(text, 42, 28, 500), lineHeight: 1.18, fontWeight: 950}}>{text}</div>}</div>;
      })}
      <div style={{gridColumn: 2, gridRow: 1, fontSize: 58, color: palette.warning, textAlign: "center", fontWeight: 950, transform: `scale(${interpolate(p, [0, 1], [.6, 1])})`}}>≠</div>
    </SafeContent>
  </StageShell>;
};

const ExpectedAnchor: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const number = numberById(content, shot.primaryTargetId);
  const card = cardById(content, shot.primaryTargetId);
  const label = number ? `${number.value}${number.unit}` : card?.lines[0]?.value ?? targetText(content, shot);
  const p = progressFor(shot);
  return <StageShell accent={palette.neutral}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateRows: "auto 1fr auto", gap: 20}}>
      <StageEyebrow>EXPECTED｜市場が置いていた基準</StageEyebrow>
      <div style={{position: "relative", alignSelf: "center", height: 210, borderRadius: 26, background: "rgba(143,183,209,.08)", border: "2px solid rgba(143,183,209,.25)"}}>
        <div style={{position: "absolute", left: 54, right: 54, top: 126, height: 5, background: "rgba(143,183,209,.35)"}}/>
        <div style={{position: "absolute", left: `${interpolate(p, [0, 1], [18, 58])}%`, top: 55, width: 7, height: 128, borderRadius: 99, background: palette.warning, boxShadow: "0 0 26px rgba(255,199,74,.38)"}}/>
        <div style={{position: "absolute", left: `${interpolate(p, [0, 1], [18, 58])}%`, top: 18, translate: "-50% 0", maxWidth: 720, color: palette.warning, fontSize: safeFontSize(label, 48, 30, 720), lineHeight: 1.08, whiteSpace: "nowrap", fontWeight: 950}}>{label}</div>
      </div>
      <div style={{fontSize: 29, color: palette.neutral, lineHeight: 1.2, fontWeight: 850}}>{content.templateConfig.comparisonBasis ?? content.screenQuestion}</div>
    </SafeContent>
  </StageShell>;
};

const ActualCrosses: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const actualNumber = numberById(content, shot.primaryTargetId);
  const actualCard = cardById(content, shot.primaryTargetId);
  const expectedCard = cardById(content, shot.referenceTargetId);
  const actualLabel = actualNumber ? `${actualNumber.value}${actualNumber.unit}` : actualCard?.lines[0]?.value ?? targetText(content, shot);
  const expectedLabel = expectedCard?.lines[0]?.value ?? actualNumber?.comparison ?? "EXPECTED";
  const p = progressFor(shot);
  return <StageShell accent={palette.positive}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18}}>
      <div style={{display: "flex", justifyContent: "space-between", gap: 26, alignItems: "center"}}><StageEyebrow tone={palette.positive}>ACTUAL｜実際に出た結果</StageEyebrow><div style={{fontSize: safeFontSize(actualLabel, 48, 30, 590), color: palette.positive, fontWeight: 950, whiteSpace: "nowrap"}}>{actualLabel}</div></div>
      <div style={{position: "relative", alignSelf: "center", height: 190, borderRadius: 25, background: "rgba(143,183,209,.09)", border: "2px solid rgba(143,183,209,.24)", overflow: "hidden"}}>
        <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: `${interpolate(p, [0, 1], [0, 82])}%`, background: "linear-gradient(90deg,rgba(57,217,154,.35),rgba(57,217,154,.92))"}}/>
        <div style={{position: "absolute", left: "66%", top: 0, bottom: 0, width: 7, background: palette.warning, boxShadow: "0 0 0 4px rgba(5,12,28,.84)"}}/>
        <div style={{position: "absolute", left: "66%", top: 18, translate: "-50% 0", maxWidth: 520, padding: "5px 10px", background: "rgba(5,12,28,.78)", borderRadius: 10, color: palette.warning, fontSize: safeFontSize(expectedLabel, 26, 19, 500), lineHeight: 1.1, whiteSpace: "nowrap", fontWeight: 900}}>{expectedLabel}</div>
      </div>
      <div style={{fontSize: 34, color: palette.positive, textAlign: "center", fontWeight: 950}}>予想線を越え、差分が生まれた</div>
    </SafeContent>
  </StageShell>;
};

const GapMacro: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const number = numberById(content, shot.primaryTargetId);
  const card = cardById(content, shot.primaryTargetId);
  const value = number ? `${number.value}${number.unit}` : card?.lines[0]?.value ?? targetText(content, shot);
  const p = progressFor(shot);
  return <StageShell accent={palette.emphasis}>
    <SafeContent reserveTypography style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <SafeCameraViewport shot={shot}>
        <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{position: "absolute", width: 330, height: 330, borderRadius: 999, border: `${interpolate(p, [0, 1], [3, 14])}px solid rgba(183,140,255,.36)`, transform: `scale(${interpolate(p, [0, 1], [.72, 1])})`}}/>
          <div style={{position: "relative", zIndex: 2, width: 850, textAlign: "center"}}><StageEyebrow tone={palette.emphasis}>GAP｜市場が反応した差分</StageEyebrow><div style={{marginTop: 25, color: palette.emphasis, fontSize: safeFontSize(value, 86, 42, 850), lineHeight: 1.08, fontWeight: 950, overflowWrap: "anywhere"}}>{value}</div></div>
        </div>
      </SafeCameraViewport>
    </SafeContent>
  </StageShell>;
};

const CausalBuild: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const orderedIds = content.templateConfig.nodeOrder.length > 0 ? content.templateConfig.nodeOrder : content.nodes.map((item) => item.key);
  const nodes = orderedIds.map((id) => nodeById(content, id)).filter(Boolean).slice(0, 4) as NonNullable<ReturnType<typeof nodeById>>[];
  const fallbackTexts = content.texts.length > 1 ? content.texts : ["材料", "経路", "結果"];
  const labels = nodes.length > 0 ? nodes.map((item) => item.label) : fallbackTexts.slice(0, 4);
  const p = clamp(shot.progress);
  return <StageShell accent={palette.cyan}>
    <SafeContent style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
      <SafeCameraViewport shot={shot}>
        <div style={{position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${Math.max(1, labels.length)},minmax(0,1fr))`, gap: 42, alignItems: "center"}}>{labels.map((label, index) => {
          const reveal = clamp((p * labels.length - index) * 1.45);
          return <div key={`${label}-${index}`} style={{position: "relative", opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)`, minWidth: 0}}>
            <div style={{minHeight: 142, display: "flex", alignItems: "center", justifyContent: "center", padding: 22, borderRadius: 22, background: "rgba(41,215,240,.10)", border: `3px solid ${index === labels.length - 1 ? palette.emphasis : palette.cyan}`, textAlign: "center", fontSize: safeFontSize(label, 34, 25, 260), lineHeight: 1.17, fontWeight: 950, overflowWrap: "anywhere"}}>{label}</div>
            {index < labels.length - 1 ? <div style={{position: "absolute", left: "100%", top: "50%", width: 42, height: 4, background: palette.cyan, transform: `scaleX(${reveal})`, transformOrigin: "0 50%"}}><div style={{position: "absolute", right: -1, top: -7, width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: `14px solid ${palette.cyan}`}}/></div> : null}
          </div>;
        })}</div>
      </SafeCameraViewport>
    </SafeContent>
  </StageShell>;
};

const Counterforce: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const primary = numberById(content, shot.primaryTargetId);
  const reference = numberById(content, shot.referenceTargetId);
  const texts = content.texts;
  const tailwind = reference ? `${reference.label} ${reference.value}${reference.unit}` : texts[0] ?? "追い風｜AWS予想超過";
  const headwind = primary ? `${primary.label} ${primary.value}${primary.unit}` : texts[1] ?? targetText(content, shot);
  const p = progressFor(shot);
  return <StageShell accent={palette.warning}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateRows: "1fr 1fr", gap: 22, alignContent: "center"}}>
      {[{tag: "追い風", text: tailwind, color: palette.positive, x: -34}, {tag: "向かい風", text: headwind, color: palette.warning, x: 34}].map((item, index) => <div key={item.tag} style={{display: "grid", gridTemplateColumns: "190px minmax(0,1fr)", gap: 24, alignItems: "center", padding: "23px 30px", borderRadius: 23, background: `${item.color}12`, border: `3px solid ${item.color}`, opacity: index === 0 ? 1 : p, transform: `translateX(${index === 0 ? 0 : interpolate(p, [0, 1], [item.x, 0])}px)`}}><div style={{fontSize: 31, color: item.color, fontWeight: 950}}>{item.tag}</div><div style={{fontSize: safeFontSize(item.text, 40, 27, 900), lineHeight: 1.12, fontWeight: 950, overflowWrap: "anywhere"}}>{item.text}</div></div>)}
    </SafeContent>
  </StageShell>;
};

const EntityCutaway: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const number = numberById(content, shot.primaryTargetId);
  const entity = content.entity;
  return <StageShell accent={palette.cyan} transparent>
    <SafeContent style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 42}}>
      <div style={{maxWidth: 720, padding: "27px 32px", borderRadius: 24, background: "rgba(5,12,28,.84)", border: `2px solid ${palette.cyan}`}}><StageEyebrow tone={palette.cyan}>{entity?.subjectType === "company" ? "COMPANY" : "FOCUS"}</StageEyebrow><div style={{marginTop: 10, fontSize: safeFontSize(entity?.displayName ?? content.primaryElement, 62, 38, 680), lineHeight: 1.05, fontWeight: 950}}>{entity?.displayName ?? content.primaryElement}</div><div style={{marginTop: 16, fontSize: 29, lineHeight: 1.22, color: palette.neutral, fontWeight: 850}}>{entity?.role ?? content.screenQuestion}</div></div>
      {number ? <div style={{padding: "20px 27px", borderRadius: 22, background: "rgba(5,12,28,.86)", border: `3px solid ${toneColor(number.tone)}`}}><div style={{fontSize: 27, fontWeight: 900}}>{number.label}</div><div style={{marginTop: 12}}><Metric number={number} size={76}/></div></div> : null}
    </SafeContent>
  </StageShell>;
};

const SplitOpposition: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const primary = numberById(content, shot.primaryTargetId);
  const secondaries = (shot.secondaryTargetIds ?? []).map((id) => numberById(content, id)).filter(Boolean) as PublicNumber[];
  const secondary = secondaries[0] ?? content.numbers.find((item) => item.key !== primary?.key) ?? null;
  const p = progressFor(shot);
  const renderSide = (item: PublicNumber | null, label: string, color: string) => <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 0, opacity: p}}><div style={{fontSize: 31, color, fontWeight: 950}}>{item?.label ?? label}</div>{item ? <div style={{marginTop: 18}}><Metric number={item} size={82}/></div> : <div style={{marginTop: 18, fontSize: 38, fontWeight: 950}}>{label}</div>}</div>;
  return <StageShell accent={palette.emphasis}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateColumns: "1fr 5px 1fr", gap: 28, alignItems: "stretch"}}>
      {renderSide(primary, content.texts[0] ?? "主役", primary ? toneColor(primary.tone) : palette.positive)}
      <div style={{background: "linear-gradient(180deg,transparent,rgba(247,251,255,.75),transparent)", transform: `scaleY(${p})`, transformOrigin: "50% 50%"}}/>
      {renderSide(secondary, content.texts[1] ?? "比較", secondary ? toneColor(secondary.tone) : palette.warning)}
    </SafeContent>
  </StageShell>;
};

const FocusMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const ids = [shot.primaryTargetId, ...(shot.secondaryTargetIds ?? [])].filter(Boolean) as string[];
  const numbers = ids.map((id) => numberById(content, id)).filter(Boolean) as PublicNumber[];
  const items = numbers.length > 0 ? numbers.slice(0, 4) : content.numbers.slice(0, 4);
  return <StageShell accent={palette.cyan}>
    <SafeContent style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 20}}>{items.map((item, index) => {const reveal = clamp((shot.progress * items.length - index) * 1.5); return <div key={item.key} style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "22px 27px", borderRadius: 22, background: `${toneColor(item.tone)}11`, border: `3px solid ${toneColor(item.tone)}`, opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`}}><div style={{fontSize: safeFontSize(item.label, 33, 24, 420), fontWeight: 950, overflowWrap: "anywhere"}}>{item.label}</div><Metric number={item} size={58}/></div>;})}</SafeContent>
  </StageShell>;
};

const VerificationPaths: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const card = cardById(content, shot.primaryTargetId);
  const values = card ? card.lines.map((line) => line.value) : content.texts;
  const items = values.slice(0, 4);
  return <StageShell accent={palette.warning}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 22}}>{items.map((text, index) => {const strengthen = /強まる|継続|安定|波及/u.test(text) && !/弱まる|上昇継続|弱い/u.test(text); const color = strengthen ? palette.positive : index % 2 === 0 ? palette.cyan : palette.warning; const reveal = clamp((shot.progress * items.length - index) * 1.45); return <div key={`${text}-${index}`} style={{padding: "22px 25px", borderRadius: 22, background: `${color}10`, border: `3px solid ${color}`, opacity: reveal, transform: `translateY(${interpolate(reveal, [0, 1], [22, 0])}px)`}}><div style={{fontSize: 23, color, fontWeight: 900}}>{strengthen ? "強まる条件" : "確認条件"}</div><div style={{marginTop: 12, fontSize: safeFontSize(text, 35, 25, 550), lineHeight: 1.17, fontWeight: 950, overflowWrap: "anywhere"}}>{text.replace(/^強まる｜|^弱まる｜/u, "")}</div></div>;})}</SafeContent>
  </StageShell>;
};

const RecapAssembly: React.FC<{content: PublicMainContent}> = ({content}) => {
  const shot = content.shot!;
  const items = content.texts.slice(0, 4);
  const shotIndex = Number(shot.shotId.match(/shot-(\d+)$/u)?.[1] ?? "1");
  const baseVisible = shotIndex <= 1 ? Math.max(1, Math.ceil(items.length / 2)) : items.length;
  const visible = Math.min(items.length, Math.max(baseVisible, Math.ceil(shot.progress * items.length)));
  return <StageShell accent={palette.emphasis}>
    <SafeContent reserveTypography style={{display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 20, alignContent: "center"}}>{items.map((text, index) => <div key={`${text}-${index}`} style={{minHeight: 105, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 24px", borderRadius: 22, background: index === items.length - 1 ? "rgba(183,140,255,.18)" : "rgba(41,215,240,.09)", border: `3px solid ${index === items.length - 1 ? palette.emphasis : palette.cyan}`, opacity: index < visible ? 1 : .12, transform: `translateY(${index < visible ? 0 : 18}px)`, textAlign: "center", fontSize: safeFontSize(text, 35, 25, 560), lineHeight: 1.15, fontWeight: 950}}>{text}</div>)}</SafeContent>
    <div style={{position: "absolute", left: 64, right: 64, bottom: 24, height: 76, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "rgba(5,12,28,.92)", border: `2px solid ${palette.warning}`, color: palette.warning, fontSize: safeFontSize(content.primaryElement, 48, 34, 1120), fontWeight: 950}}>{content.primaryElement}</div>
  </StageShell>;
};

export const DedicatedShotRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {
  switch (content.shot!.shotRecipe) {
    case "hero-metric-impact": return <HeroMetric content={content}/>;
    case "contradiction-interrupt": return <Contradiction content={content}/>;
    case "expected-anchor": return <ExpectedAnchor content={content}/>;
    case "actual-crosses-expected": return <ActualCrosses content={content}/>;
    case "gap-macro": return <GapMacro content={content}/>;
    case "causal-build": return <CausalBuild content={content}/>;
    case "counterforce-interrupt": return <Counterforce content={content}/>;
    case "entity-cutaway": return <EntityCutaway content={content}/>;
    case "split-opposition": return <SplitOpposition content={content}/>;
    case "focus-matrix-reveal": return <FocusMatrix content={content}/>;
    case "verification-two-paths": return <VerificationPaths content={content}/>;
    case "recap-assembly": return <RecapAssembly content={content}/>;
  }
};

// Stable registry identifiers used by contracts and production diagnostics.
export const HeroMetricShot = "hero-metric-impact" as const;
export const ContradictionShot = "contradiction-interrupt" as const;
export const ExpectedAnchorShot = "expected-anchor" as const;
export const ActualCrossesExpectedShot = "actual-crosses-expected" as const;
export const GapMacroShot = "gap-macro" as const;
export const CausalBuildShot = "causal-build" as const;
export const CounterforceShot = "counterforce-interrupt" as const;
export const EntityCutawayShot = "entity-cutaway" as const;
export const SplitOppositionShot = "split-opposition" as const;
export const FocusMatrixShot = "focus-matrix-reveal" as const;
export const VerificationPathsShot = "verification-two-paths" as const;
export const RecapAssemblyShot = "recap-assembly" as const;
