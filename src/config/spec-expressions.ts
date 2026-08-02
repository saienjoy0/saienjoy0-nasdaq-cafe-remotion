import expressionMapJson from "../../config/fox-expression-map.json";
import assetManifestJson from "../../config/asset-manifest.json";
import type {Expression} from "../spec/render-spec";

type Mapping = {assetId: string; fallback: boolean};
const expressionMap = expressionMapJson.expressions as Record<Expression, Mapping>;

export const expressionRegistrations = expressionMap;

export const resolveStrictExpressionAsset = (expression: Expression) => {
  const mapping = expressionMap[expression];
  if (!mapping || mapping.fallback) {
    throw new Error(`$.expression: no dedicated non-fallback asset registered for ${expression}`);
  }
  const asset = (assetManifestJson.assets as Record<string, {path: string}>)[mapping.assetId];
  if (!asset) throw new Error(`$.expression: registered asset ${mapping.assetId} does not exist`);
  const normalized = asset.path.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`$.expression: registered asset ${mapping.assetId} has unsafe production path ${asset.path}`);
  }
  return {assetId: mapping.assetId, path: asset.path};
};

export const supportedProductionExpressions = (Object.entries(expressionMap) as Array<[Expression, Mapping]>)
  .filter(([, mapping]) => !mapping.fallback)
  .map(([expression]) => expression);

export const missingProductionExpressions = (Object.entries(expressionMap) as Array<[Expression, Mapping]>)
  .filter(([, mapping]) => mapping.fallback)
  .map(([expression]) => expression);
