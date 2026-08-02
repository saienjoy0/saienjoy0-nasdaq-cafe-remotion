import type {Caption} from "@remotion/captions";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {phase0Layout} from "../../styles/layout";
import {colors} from "../../styles/theme";

type TimedCaption = Caption & {timingSource: "phrase-audio"};

export const CaptionLayer: React.FC<{captions: TimedCaption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const active = captions.find(
    (caption) => caption.startMs <= timeMs && caption.endMs > timeMs,
  );
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: phase0Layout.caption.left,
        top: phase0Layout.caption.top,
        width: phase0Layout.caption.width,
        height: phase0Layout.caption.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "12px 36px",
        borderTop: `2px solid ${colors.cyan}66`,
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(3,7,17,.76), rgba(3,7,17,.94))",
        color: "#fff",
        fontSize: active.text.length > 24 ? 42 : 48,
        lineHeight: 1.35,
        fontWeight: 900,
        letterSpacing: ".01em",
        textAlign: "center",
        textShadow: "0 3px 10px rgba(0,0,0,.95)",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
      }}
    >
      {active.text}
    </div>
  );
};
