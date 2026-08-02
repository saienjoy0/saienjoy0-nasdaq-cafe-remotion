import {interpolate, useCurrentFrame} from "remotion";
import {colors} from "../styles/theme";

const particles = Array.from({length: 24}, (_, index) => ({
  x: (index * 173 + 91) % 1920,
  y: (index * 97 + 53) % 1080,
  size: 2 + (index % 4),
  speed: 0.18 + (index % 5) * 0.07,
}));

export const AmbientBackground: React.FC<{accent?: string}> = ({
  accent = colors.cyan,
}) => {
  const frame = useCurrentFrame();
  const scanX = interpolate(frame % 300, [0, 299], [-220, 2140]);
  const traceProgress = interpolate(frame % 180, [0, 140, 179], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", background: colors.background}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 30%, rgba(25,105,159,.24), transparent 32%), radial-gradient(circle at 82% 70%, rgba(255,150,40,.09), transparent 30%), linear-gradient(135deg, #02050c 0%, #071426 48%, #02050c 100%)",
        }}
      />
      <svg width="1920" height="1080" style={{position: "absolute", inset: 0, opacity: 0.44}}>
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke="rgba(85,172,215,.15)" strokeWidth="1" />
          </pattern>
          <linearGradient id="trace" x1="0" x2="1">
            <stop offset="0" stopColor="transparent" />
            <stop offset="0.32" stopColor={accent} />
            <stop offset="1" stopColor={colors.blue} />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#grid)" />
        <path
          d="M0 790 C170 760 255 820 390 735 S650 640 790 705 S1060 585 1230 620 S1500 465 1920 500"
          fill="none"
          stroke="url(#trace)"
          strokeWidth="4"
          strokeDasharray="2300"
          strokeDashoffset={2300 * (1 - traceProgress)}
          opacity="0.3"
        />
      </svg>
      {particles.map((particle, index) => {
        const y = (particle.y - frame * particle.speed + 1200) % 1200 - 60;
        const flicker = 0.25 + 0.5 * ((Math.sin((frame + index * 19) / 18) + 1) / 2);
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: particle.x,
              top: y,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              background: index % 6 === 0 ? colors.amber : accent,
              boxShadow: `0 0 12px ${accent}`,
              opacity: flicker,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: scanX,
          width: 180,
          background: `linear-gradient(90deg, transparent, ${accent}18, transparent)`,
          transform: "skewX(-12deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 180px rgba(0,0,0,.82)",
        }}
      />
    </div>
  );
};
