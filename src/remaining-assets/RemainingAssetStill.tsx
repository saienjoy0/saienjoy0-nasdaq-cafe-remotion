import remainingAssetsJson from "../../data/remaining-assets.json";
import {ConceptCard} from "./ConceptCard";
import {PersonCard} from "./PersonCard";
import {SceneBackground} from "./SceneBackground";
import type {RemainingAsset} from "./types";

const remainingAssets = remainingAssetsJson as RemainingAsset[];

export type RemainingAssetStillProps = {assetId: string};

export const RemainingAssetStill: React.FC<RemainingAssetStillProps> = ({assetId}) => {
  const asset = remainingAssets.find((item) => item.asset_id === assetId);
  if (!asset) throw new Error(`残り素材IDが見つかりません: ${assetId}`);
  if (asset.asset_type === "background") return <SceneBackground asset={asset} />;
  if (asset.asset_type === "concept") return <ConceptCard asset={asset} />;
  return <PersonCard asset={asset} />;
};
