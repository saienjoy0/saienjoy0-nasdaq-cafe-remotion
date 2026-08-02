import remainingAssetsJson from "../../data/remaining-assets.json";
import {personPresentations} from "../remaining-assets/person-presentations";
import type {RemainingAsset} from "../remaining-assets/types";
import type {ReusableEntity} from "./reusable-entity-cues";

const assets = remainingAssetsJson as RemainingAsset[];
const typeDir = {
  person: "people",
  person_role: "roles",
  concept: "concepts",
  background: "backgrounds",
} as const;

export const remainingAssetPath = (asset: RemainingAsset) =>
  `assets/nasdaq-cafe/remaining/${typeDir[asset.asset_type]}/${asset.output_filename}`;

export const buildRemainingAssetEntities = (): ReusableEntity[] =>
  assets
    .filter((asset) => asset.asset_type !== "background")
    .map((asset) => {
      const presentation = personPresentations[asset.asset_id];
      const isPerson = asset.asset_type === "person" || asset.asset_type === "person_role";
      return {
        key: `remaining:${asset.asset_id}`,
        kind: isPerson ? "person-card" : "concept-card",
        aliases: isPerson
          ? presentation.aliases
          : [...new Set([asset.display_name, asset.beginner_message])],
        displayName: presentation?.japaneseName ?? asset.display_name,
        role: presentation?.role ?? asset.beginner_message,
        assetPath: remainingAssetPath(asset),
        accent: isPerson ? "#FFBD4A" : "#55D9C4",
        maxDurationSec: isPerson ? 7 : 6,
        credit:
          presentation?.sourceStatus === "official-photo"
            ? "公式写真・本人確認済み"
            : undefined,
      } satisfies ReusableEntity;
    });
