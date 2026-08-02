import {Img, staticFile} from "remotion";
import {baseFont, colors} from "../styles/theme";
import {personPresentations} from "./person-presentations";
import type {RemainingAsset} from "./types";

const InstitutionMark: React.FC<{label: string; accent: string}> = ({label, accent}) => (
  <div style={{width: 360, height: 430, borderRadius: 42, border: `3px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: "linear-gradient(160deg,rgba(18,34,57,.98),rgba(4,9,19,.98))", boxShadow: `0 24px 90px ${accent}22`}}>
    <div style={{width: 190, height: 190, borderRadius: 95, border: `9px double ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 70, fontWeight: 900}}>
      {label.slice(0, 2).toUpperCase()}
    </div>
    <div style={{marginTop: 28, color: colors.muted, fontSize: 22, fontWeight: 800}}>OFFICIAL PHOTO PENDING</div>
  </div>
);

export const PersonCard: React.FC<{asset: RemainingAsset}> = ({asset}) => {
  const presentation = personPresentations[asset.asset_id];
  if (!presentation) throw new Error(`人物表示定義がありません: ${asset.asset_id}`);
  const accent = asset.asset_type === "person_role" ? "#55D9C4" : "#FFBD4A";
  const hasPortrait = Boolean(presentation.portraitPath);
  return (
    <div style={{...baseFont, width: "100%", height: "100%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{width: 1240, height: 650, borderRadius: 38, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 500px", background: "linear-gradient(145deg,rgba(4,9,20,.98),rgba(11,25,43,.98))", border: `4px solid ${accent}`, boxShadow: "0 36px 120px rgba(0,0,0,.58)"}}>
        <div style={{padding: "58px 58px 48px", display: "flex", flexDirection: "column", justifyContent: "center"}}>
          <div style={{color: accent, fontSize: 24, fontWeight: 900, letterSpacing: ".1em"}}>{asset.asset_type === "person_role" ? "INSTITUTION ROLE" : "MARKET PERSON"}</div>
          <div style={{marginTop: 20, color: colors.text, fontSize: presentation.japaneseName.length > 12 ? 49 : 58, lineHeight: 1.13, fontWeight: 900, letterSpacing: "-.035em"}}>{presentation.japaneseName}</div>
          <div style={{marginTop: 16, color: colors.cyanSoft, fontSize: 31, lineHeight: 1.3, fontWeight: 850}}>{presentation.organization}</div>
          <div style={{marginTop: 14, color: colors.text, fontSize: 29, lineHeight: 1.35, fontWeight: 800}}>{presentation.role}</div>
          <div style={{marginTop: 30, paddingTop: 22, borderTop: "1px solid rgba(177,208,235,.2)", color: colors.muted, fontSize: 20, lineHeight: 1.45}}>
            {hasPortrait ? "公式写真・本人確認済み" : asset.asset_type === "person_role" ? "特定人物に依存しない機関カード" : "公式写真の取得後に差し替え"}
          </div>
        </div>
        <div style={{position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at 45% 30%,${accent}2A,rgba(2,7,15,.98) 68%)`}}>
          {hasPortrait ? (
            <Img src={staticFile(presentation.portraitPath!)} style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top"}} />
          ) : (
            <InstitutionMark label={presentation.organization} accent={accent} />
          )}
        </div>
      </div>
    </div>
  );
};
