import {access, readFile} from "node:fs/promises";
import path from "node:path";
import type {AssetManifestForSpec} from "../spec/validate-render-spec";
import {productionAssetManifest, productionAssetPaths} from "./production-assets";

export type RuntimeAssetRegistryEntry = {
  assetId: string;
  path: string;
  sha256: string | null;
  source: "static" | "handoff";
};

export type RuntimeAssetRegistryFile = {
  contractVersion: "1.0.0";
  bundleId: string;
  episodeDate: string;
  assets: RuntimeAssetRegistryEntry[];
};

export type RuntimeAssetContext = {
  bundleId: string | null;
  episodeDate: string | null;
  manifest: AssetManifestForSpec;
  paths: Record<string, string>;
};

const safeAssetId = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const sha256 = /^[0-9a-f]{64}$/;
const episodeDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const safePublicPath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/\-]+$/;

const staticManifest: AssetManifestForSpec = productionAssetManifest;

const staticContext = (): RuntimeAssetContext => ({
  bundleId: null,
  episodeDate: null,
  manifest: staticManifest,
  paths: productionAssetPaths,
});

const resolveRuntimeRegistryPath = async (
  explicitPath: string | undefined,
): Promise<string | null> => {
  if (explicitPath) return explicitPath;
  const episodeId = process.env.EPISODE_ID;
  if (!episodeId || !episodeDatePattern.test(episodeId)) return null;
  const promotedPath = path.resolve(
    `runtime-assets/${episodeId}/runtime_asset_registry.json`,
  );
  try {
    await access(promotedPath);
    return promotedPath;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw error;
  }
};

export const loadRuntimeAssetContext = async (
  registryPath = process.env.NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY,
): Promise<RuntimeAssetContext> => {
  const selectedRegistryPath = await resolveRuntimeRegistryPath(registryPath);
  if (!selectedRegistryPath) return staticContext();
  const resolved = path.resolve(selectedRegistryPath);
  const raw = JSON.parse(await readFile(resolved, "utf8")) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("runtime asset registry root must be an object");
  }
  const registry = raw as Partial<RuntimeAssetRegistryFile>;
  if (registry.contractVersion !== "1.0.0") {
    throw new Error("runtime asset registry contractVersion must be 1.0.0");
  }
  if (typeof registry.bundleId !== "string" || !sha256.test(registry.bundleId)) {
    throw new Error("runtime asset registry bundleId must be a SHA-256");
  }
  if (
    typeof registry.episodeDate !== "string" ||
    !episodeDatePattern.test(registry.episodeDate)
  ) {
    throw new Error("runtime asset registry episodeDate must be YYYY-MM-DD");
  }
  const episodeId = process.env.EPISODE_ID;
  if (
    episodeId &&
    episodeDatePattern.test(episodeId) &&
    registry.episodeDate !== episodeId
  ) {
    throw new Error(
      `runtime asset registry episodeDate mismatch: ${registry.episodeDate} != ${episodeId}`,
    );
  }
  if (!Array.isArray(registry.assets)) {
    throw new Error("runtime asset registry assets must be an array");
  }

  const assets: AssetManifestForSpec["assets"] = {
    ...productionAssetManifest.assets,
  };
  const paths: Record<string, string> = {...productionAssetPaths};
  const seen = new Set<string>();
  for (const [index, item] of registry.assets.entries()) {
    if (!item || typeof item !== "object") {
      throw new Error(`runtime asset registry assets[${index}] must be an object`);
    }
    const entry = item as RuntimeAssetRegistryEntry;
    if (!safeAssetId.test(entry.assetId)) {
      throw new Error(`runtime asset registry assets[${index}].assetId is invalid`);
    }
    if (seen.has(entry.assetId)) {
      throw new Error(`runtime asset registry duplicate assetId: ${entry.assetId}`);
    }
    seen.add(entry.assetId);
    if (!safePublicPath.test(entry.path)) {
      throw new Error(`runtime asset registry unsafe public path: ${entry.path}`);
    }
    if (entry.sha256 !== null && !sha256.test(entry.sha256)) {
      throw new Error(`runtime asset registry invalid sha256 for ${entry.assetId}`);
    }
    if (entry.source !== "static" && entry.source !== "handoff") {
      throw new Error(`runtime asset registry invalid source for ${entry.assetId}`);
    }

    const staticAsset = productionAssetManifest.assets[
      entry.assetId as keyof typeof productionAssetManifest.assets
    ] as {path: string; type?: string; role?: string} | undefined;
    if (staticAsset) {
      if (entry.source !== "static" || entry.path !== staticAsset.path) {
        throw new Error(
          `runtime asset registry attempted to override static assetId: ${entry.assetId}`,
        );
      }
      continue;
    }
    if (entry.source !== "handoff") {
      throw new Error(`non-static asset must be sourced from handoff: ${entry.assetId}`);
    }
    assets[entry.assetId] = {type: "image", path: entry.path};
    paths[entry.assetId] = entry.path;
  }

  return {
    bundleId: registry.bundleId,
    episodeDate: registry.episodeDate,
    manifest: {assets},
    paths,
  };
};
