import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {colors} from "../styles/theme";

export const FoxBadge: React.FC<{label?: string}> = ({label = "時差先行"}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({
    frame: frame - 8,
    fps,
    config: {damping: 18, mass: 0.7, stiffness: 140},
  });

  return (
    <div
      style={{
        width: 104,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: interpolate(entrance, [0, 1], [0, 1]),
        scale: interpolate(entrance, [0, 1], [0.7, 1]),
      }}
    >
      <svg width="72" height="72" viewBox="0 0 108 108" aria-label="狐アナリスト">
        <defs>
          <linearGradient id="foxFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={colors.amber} />
            <stop offset="1" stopColor="#E16D28" />
          </linearGradient>
          <filter id="foxGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="54" cy="54" r="50" fill="#071424" stroke={colors.cyan} strokeWidth="2" />
        <path d="M24 42 31 13 48 33Z" fill="url(#foxFill)" />
        <path d="M84 42 77 13 60 33Z" fill="url(#foxFill)" />
        <path d="M22 43 Q54 21 86 43 L78 78 Q54 100 30 78Z" fill="url(#foxFill)" filter="url(#foxGlow)" />
        <path d="M34 66 Q54 91 74 66 L68 85 Q54 98 40 85Z" fill="#F8D6A2" />
        <path d="M35 54 48 57 38 62Z" fill="#06111E" />
        <path d="M73 54 60 57 70 62Z" fill="#06111E" />
        <path d="M49 68 Q54 64 59 68 Q54 73 49 68Z" fill="#06111E" />
        <path d="M66 75 Q71 73 75 68" fill="none" stroke="#06111E" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div
        style={{
          color: colors.amber,
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: "0.12em",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};
