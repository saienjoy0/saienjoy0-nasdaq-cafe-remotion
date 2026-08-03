import {Img, staticFile} from "remotion";
import type {PublicPlacedAsset} from "../../spec/public-view-model";

const slotStyle: Record<PublicPlacedAsset["slot"], React.CSSProperties> = {
  full: {position: "absolute", inset: 0},
  "focus-media": {
    position: "absolute",
    left: 24,
    top: 32,
    width: 608,
    height: 584,
    borderRadius: 24,
    background: "rgba(5,12,25,.92)",
    border: "2px solid rgba(61,220,255,.45)",
    boxShadow: "0 18px 40px rgba(0,0,0,.28)",
  },
  primary: {position: "absolute", left: 32, top: 32, width: 920, height: 584},
  entity: {position: "absolute", right: 32, top: 32, width: 424, height: 584},
  lower: {position: "absolute", left: 0, right: 0, bottom: 0, height: 135},
};

export const SpecAssetLayer: React.FC<{
  assets: PublicPlacedAsset[];
  zIndex: number;
}> = ({assets, zIndex}) => <>{assets.map((asset) =>
  <div key={asset.key} style={{...slotStyle[asset.slot], zIndex, opacity: asset.opacity, overflow: "hidden"}}>
    <Img src={staticFile(asset.src)} style={{width: "100%", height: "100%", objectFit: asset.fit, objectPosition: asset.objectPosition}}/>
  </div>,
)}</>;
