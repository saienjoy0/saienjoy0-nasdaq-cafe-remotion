import {baseFont, colors} from "../styles/theme";
import type {RemainingAsset} from "./types";

const accentFor = (id: string) => {
  if (id.includes("rate") || id.includes("bond") || id.includes("fed")) return "#FFBD4A";
  if (id.includes("ai") || id.includes("semiconductor") || id.includes("hbm")) return "#76D6FF";
  if (id.includes("risk") || id.includes("down") || id.includes("tariff")) return "#FF7B72";
  return "#55D9C4";
};

export const ConceptCard: React.FC<{asset: RemainingAsset}> = ({asset}) => {
  const accent = accentFor(asset.asset_id);
  const nodes = [asset.support_1, asset.main_subject, asset.support_2].filter(Boolean);
  return (
    <div style={{...baseFont, width: "100%", height: "100%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{width: 1320, height: 700, borderRadius: 36, background: "linear-gradient(145deg,rgba(5,12,25,.985),rgba(12,29,48,.985))", border: `3px solid ${accent}`, boxShadow: "0 34px 110px rgba(0,0,0,.54)", padding: "52px 64px", display: "grid", gridTemplateRows: "auto 1fr auto"}}>
        <div>
          <div style={{color: accent, fontSize: 22, fontWeight: 900, letterSpacing: ".12em"}}>MARKET CONCEPT</div>
          <div style={{marginTop: 10, color: colors.text, fontSize: 54, fontWeight: 900, letterSpacing: "-.035em"}}>{asset.display_name}</div>
        </div>
        <div style={{display: "grid", gridTemplateColumns: `repeat(${nodes.length},1fr)`, alignItems: "center", gap: 48, position: "relative"}}>
          <div style={{position: "absolute", left: 96, right: 96, top: "50%", height: 5, background: `linear-gradient(90deg,${accent}44,${accent},${accent}44)`, borderRadius: 4}} />
          {nodes.map((node, index) => (
            <div key={node} style={{position: "relative", minHeight: 210, borderRadius: 26, border: `2px solid ${accent}${index === 1 ? "FF" : "88"}`, background: index === 1 ? `${accent}22` : "rgba(3,8,18,.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 24px", color: colors.text, fontSize: node.length > 24 ? 24 : 29, lineHeight: 1.4, fontWeight: 850, textAlign: "center", boxShadow: "0 18px 50px rgba(0,0,0,.28)"}}>
              <div style={{position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", width: 28, height: 28, borderRadius: 14, background: accent, boxShadow: `0 0 24px ${accent}`}} />
              {node}
            </div>
          ))}
        </div>
        <div style={{padding: "22px 28px", borderRadius: 20, background: "rgba(2,7,16,.72)", borderLeft: `7px solid ${accent}`, color: colors.cyanSoft, fontSize: asset.beginner_message.length > 38 ? 25 : 29, lineHeight: 1.4, fontWeight: 800}}>
          {asset.beginner_message}
        </div>
      </div>
    </div>
  );
};
