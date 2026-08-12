import type {CSSProperties, FC} from "react";
import {interpolate, spring} from "remotion";
import type {PublicMainContent} from "../../spec/public-view-model";

const FPS = 30;
const palette = {
  ink: "#102033",
  muted: "#53697b",
  positive: "#07865f",
  neutral: "#527691",
  emphasis: "#7046a8",
  paper: "rgba(250,252,254,.97)",
  line: "rgba(82,118,145,.24)",
  white: "#f8fbff",
} as const;

const revealStyle = (content: PublicMainContent, startMs: number): CSSProperties => {
  const frame = Math.max(0, Math.round(((content.sceneTimeMs - startMs) / 1000) * FPS));
  const progress = spring({
    fps: FPS,
    frame,
    config: {damping: 24, stiffness: 150, mass: 0.72},
    durationInFrames: 20,
  });
  return {
    opacity: interpolate(progress, [0, 0.22, 1], [0, 0.86, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translate: `${interpolate(progress, [0, 1], [-34, 0])}px 0`,
  };
};

const checklistItems = (content: PublicMainContent) => {
  const fromCards = content.cards.flatMap((card) =>
    card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title],
  );
  return (fromCards.length > 0 ? fromCards : content.texts).slice(0, 4);
};

export const VerificationChecklistTemplate: FC<{content: PublicMainContent}> = ({content}) => {
  const items = checklistItems(content);
  if (items.length === 0) {
    throw new Error("verification-checklist requires at least one visible checklist item");
  }

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      padding: "34px 42px",
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      gap: 22,
      overflow: "hidden",
    }}>
      <div style={{display: "flex", alignItems: "end", justifyContent: "space-between", gap: 28}}>
        <div style={{minWidth: 0}}>
          <div style={{fontSize: 23, color: palette.positive, fontWeight: 950, letterSpacing: ".08em"}}>次に確認</div>
          <div style={{marginTop: 7, fontSize: 42, lineHeight: 1.13, color: palette.ink, fontWeight: 950}}>{content.primaryElement}</div>
        </div>
        <div style={{maxWidth: 520, textAlign: "right", color: palette.emphasis, fontSize: 27, lineHeight: 1.24, fontWeight: 900}}>{content.screenQuestion}</div>
      </div>

      <div style={{alignSelf: "center", display: "grid", gap: 14}}>
        {items.map((item, index) => (
          <div
            key={`${index}-${item}`}
            style={{
              ...revealStyle(content, content.beatStartMs + 260 + index * 420),
              minHeight: items.length <= 3 ? 112 : 92,
              display: "grid",
              gridTemplateColumns: "76px minmax(0,1fr) auto",
              gap: 19,
              alignItems: "center",
              padding: items.length <= 3 ? "19px 24px" : "14px 22px",
              borderRadius: 18,
              background: palette.paper,
              border: `2px solid ${palette.line}`,
              boxShadow: "0 10px 22px rgba(16,32,51,.09)",
            }}
          >
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.white,
              background: palette.positive,
              fontSize: 30,
              fontWeight: 950,
              boxShadow: "0 6px 14px rgba(7,134,95,.20)",
            }}>✓</div>
            <div style={{minWidth: 0, color: palette.ink, fontSize: items.length <= 3 ? 33 : 29, lineHeight: 1.2, fontWeight: 930, overflowWrap: "anywhere"}}>{item}</div>
            <div style={{
              minWidth: 52,
              height: 38,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.neutral,
              background: "rgba(82,118,145,.10)",
              border: `1px solid ${palette.line}`,
              fontSize: 20,
              fontWeight: 950,
            }}>{String(index + 1).padStart(2, "0")}</div>
          </div>
        ))}
      </div>

      <div style={{display: "flex", justifyContent: "space-between", gap: 24, color: palette.muted, fontSize: 21, lineHeight: 1.25, fontWeight: 850}}>
        <span>確認順にチェック</span>
        <span>{content.templateConfig.dataBasis ?? "次に確認する材料"}</span>
      </div>
    </div>
  );
};
