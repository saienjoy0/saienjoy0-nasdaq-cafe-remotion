import assetManifestJson from "../../config/asset-manifest.json";

export const foxAssetIds = [
  "foxNormal", "foxAnalysis", "foxSmirk", "foxSlightSurprise",
  "foxConfused", "foxAlert", "foxSleepy",
] as const;
export type FoxAssetId = (typeof foxAssetIds)[number];
export type FixedAssetId = FoxAssetId | "mainBackground";

type FixedAssetEntry = {
  type: "image";
  role: "fox-expression" | "background";
  path: string;
  format: "PNG";
  width: number;
  height: number;
  aspectRatio: number;
  colorMode: "RGB" | "RGBA";
  hasAlpha: boolean;
  hasTransparentMargin: boolean;
  fileSizeBytes: number;
  sha256: string;
};

type AssetManifest = {
  version: string;
  provisional: boolean;
  layout: {
    enabled: boolean;
    previewFoxAssetId: FoxAssetId | null;
  };
  expectedSlots: Record<FixedAssetId, string>;
  assets: Partial<Record<FixedAssetId, FixedAssetEntry>>;
};

const assetManifest = assetManifestJson as AssetManifest;

export const getConfiguredAssetPath = (assetId: FixedAssetId) =>
  assetManifest.assets[assetId]?.path ?? null;

const selectedFoxPath = assetManifest.layout.previewFoxAssetId
  ? getConfiguredAssetPath(assetManifest.layout.previewFoxAssetId)
  : null;
const backgroundPath = getConfiguredAssetPath("mainBackground");

export const fixedAssetConfig = {
  version: assetManifest.version,
  provisional: assetManifest.provisional,
  expectedSlots: assetManifest.expectedSlots,
  assets: assetManifest.assets,
  enabled:
    assetManifest.layout.enabled &&
    backgroundPath !== null &&
    selectedFoxPath !== null,
  backgroundPath,
  selectedFoxAssetId: assetManifest.layout.previewFoxAssetId,
  selectedFoxPath,
} as const;
