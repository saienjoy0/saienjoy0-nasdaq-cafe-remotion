import assetManifestJson from "../../config/asset-manifest.json";
import remainingAssetsJson from "../../data/remaining-assets.json";
import stockCardsJson from "../../data/stock-cards.json";
import type {RemainingAsset} from "../remaining-assets/types";

type StockCardAsset = {
  assetId: string;
  ticker: string;
};

const stockCards = stockCardsJson as StockCardAsset[];
const remainingAssets = remainingAssetsJson as RemainingAsset[];
const safeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stockCardAssets = Object.fromEntries(
  stockCards.map((card, index) => [
    card.assetId,
    {
      type: "image",
      role: "ticker-card",
      path: `assets/nasdaq-cafe/stock-cards/${String(index + 1).padStart(
        3,
        "0",
      )}_${safeName(card.ticker)}.png`,
      format: "PNG",
      width: 1536,
      height: 864,
      colorMode: "RGBA",
      hasAlpha: true,
    },
  ]),
);

const remainingTypeDir = {
  person: "people",
  person_role: "roles",
  concept: "concepts",
  background: "backgrounds",
} as const;

const remainingAssetsManifest = Object.fromEntries(
  remainingAssets.map((asset) => [
    asset.asset_id,
    {
      type: "image",
      role:
        asset.asset_type === "background"
          ? "background"
          : asset.asset_type === "concept"
            ? "illustration"
            : "main-media",
      path: `assets/nasdaq-cafe/remaining/${remainingTypeDir[asset.asset_type]}/${asset.output_filename}`,
      format: "PNG",
      width: 1536,
      height: 864,
      colorMode: "RGBA",
      hasAlpha: asset.asset_type !== "background",
    },
  ]),
);

export const productionAssetManifest = {
  ...assetManifestJson,
  assets: {
    ...assetManifestJson.assets,
    ...stockCardAssets,
    ...remainingAssetsManifest,
  },
};

export const productionAssetPaths = Object.fromEntries(
  Object.entries(productionAssetManifest.assets).map(([id, asset]) => [
    id,
    asset.path,
  ]),
);
