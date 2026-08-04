import {interpolate} from "remotion";
import type {PublicMainContent, PublicShot} from "../../spec/public-view-model";
import {palette, safeFontSize} from "./StageSafeArea";

const labelFor = (content: PublicMainContent, shot: PublicShot) => {
  const id = shot.outcomeTargetId ?? shot.primaryTargetId;
  if (!id) return shot.typographyText;
  const number = content.numbers.find((item) => item.key === id);
  if (number) return `${number.label} ${number.value}${number.unit}`;
  const card = content.cards.find((item) => item.key === id);
  if (card) return `${card.title} ${card.lines[0]?.value ?? ""}`.trim();
  const node = content.nodes.find((item) => item.key === id);
  return node?.label ?? shot.typographyText;
};

export const SharedElementLayer: React.FC<{
  content: PublicMainContent;
  previousShot: PublicShot;
  currentShot: PublicShot;
  progress: number;
}> = ({content, previousShot, currentShot, progress}) => {
  if (!previousShot.continuityKey || previousShot.continuityKey !== currentShot.continuityKey) return null;
  const label = labelFor(content, previousShot);
  if (!label) return null;
  const fade = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI);
  return <div data-shared-element={currentShot.continuityKey} style={{
    position: "absolute",
    zIndex: 60,
    left: interpolate(progress, [0, 1], [720, 1165]),
    top: interpolate(progress, [0, 1], [300, 34]),
    translate: "-50% -50%",
    maxWidth: 410,
    padding: `${interpolate(progress, [0, 1], [15, 8])}px ${interpolate(progress, [0, 1], [25, 14])}px`,
    borderRadius: 999,
    color: palette.ink,
    background: "rgba(5,12,28,.94)",
    border: `2px solid ${palette.cyan}`,
    boxShadow: "0 12px 28px rgba(0,0,0,.45)",
    fontSize: interpolate(progress, [0, 1], [safeFontSize(label, 40, 28, 520), safeFontSize(label, 24, 20, 350)]),
    lineHeight: 1.12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontWeight: 950,
    opacity: fade,
  }}>{label}</div>;
};
