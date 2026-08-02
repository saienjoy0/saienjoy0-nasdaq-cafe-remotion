import {baseFont} from "../styles/theme";
import type {RemainingAsset} from "./types";

const palettes = [
  ["#071426", "#12314A", "#1A6070"],
  ["#0A1122", "#202B4B", "#6A4562"],
  ["#06131D", "#183B40", "#4E755E"],
  ["#100F1F", "#2E244B", "#6B4B6A"],
];

export const SceneBackground: React.FC<{asset: RemainingAsset}> = ({asset}) => {
  const seed = [...asset.asset_id].reduce(
    (sum, char, charIndex) => sum + char.charCodeAt(0) * (charIndex + 3),
    0,
  );
  const index = seed % palettes.length;
  const [deep, mid, glow] = palettes[index];
  const isThree = asset.asset_id.includes("comparison") || asset.asset_id.includes("expected") || asset.asset_id.includes("verification");
  const isLine = asset.asset_id.includes("timeline") || asset.asset_id.includes("causal");
  return (
    <div style={{...baseFont, position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(135deg,${deep},${mid} 58%,#030712)`}}>
      <div style={{position: "absolute", width: 860, height: 860, borderRadius: 430, right: -260, top: -320, background: `radial-gradient(circle,${glow}88,transparent 68%)`, filter: "blur(4px)", opacity: .55}} />
      <div style={{position: "absolute", width: 660, height: 660, borderRadius: 330, left: -300, bottom: -370, background: `radial-gradient(circle,${glow}55,transparent 70%)`, opacity: .5}} />
      <div style={{position: "absolute", left: 120 + (seed % 940), top: 100 + (seed % 360), width: 180 + (seed % 150), height: 180 + (seed % 150), borderRadius: "50%", border: `2px solid ${glow}18`, opacity: .4}} />
      {isThree ? [0, 1, 2].map((item) => <div key={item} style={{position: "absolute", left: 260 + item * 350, top: 220, width: 290, height: 360, borderRadius: 28, border: "2px solid rgba(167,214,234,.12)", background: "rgba(2,8,18,.14)"}} />) : null}
      {isLine ? <div style={{position: "absolute", left: 190, right: 170, top: 440, height: 5, borderRadius: 5, background: "linear-gradient(90deg,transparent,rgba(132,215,232,.28),transparent)"}} /> : null}
      <div style={{position: "absolute", inset: 0, opacity: .13, backgroundImage: "linear-gradient(rgba(160,220,238,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(160,220,238,.12) 1px,transparent 1px)", backgroundSize: "72px 72px", maskImage: "linear-gradient(to right,transparent,black 24%,black 82%,transparent)"}} />
    </div>
  );
};
