import expressionMapJson from "../../config/fox-expression-map.json";
import type {ExpressionName} from "../schemas/episode-v1";
import {getConfiguredAssetPath, type FoxAssetId} from "./fixed-assets";

type ExpressionMapping = {
  requestedExpression: ExpressionName;
  assetId: FoxAssetId;
  fallback: boolean;
  reason: string;
};

const expressionMap = expressionMapJson.expressions as Record<
  ExpressionName,
  ExpressionMapping
>;

export const resolveFoxExpression = (expression: ExpressionName) => {
  const mapping = expressionMap[expression];
  if (!mapping) {
    throw new Error(`未対応の狐表情です: ${expression}`);
  }

  const path = getConfiguredAssetPath(mapping.assetId);
  if (!path) {
    throw new Error(
      `表情${expression}の固定素材がmanifestにありません: ${mapping.assetId}`,
    );
  }

  return {...mapping, path};
};

export const foxExpressionMapVersion = expressionMapJson.version;
