import {existsSync} from "node:fs";
import path from "node:path";
import type {RenderSpec} from "./render-spec";
import {expressionRegistrations, resolveStrictExpressionAsset} from "../config/spec-expressions";

type ExpressionUse = {
  path: string;
  sceneId: string;
  chunkId: string | "initialExpression";
  expression: RenderSpec["scenes"][number]["initialExpression"];
};

export type ExpressionPreflightResult = {
  checked: ExpressionUse[];
  assets: Array<ExpressionUse & {assetId: string; assetPath: string}>;
};

export const preflightProductionExpressions = (spec: RenderSpec): ExpressionPreflightResult => {
  const uses: ExpressionUse[] = [];
  spec.scenes.forEach((scene, sceneIndex) => {
    uses.push({
      path: `$.scenes[${sceneIndex}].initialExpression`,
      sceneId: scene.sceneId,
      chunkId: "initialExpression",
      expression: scene.initialExpression,
    });
    scene.narrationChunks.forEach((chunk, chunkIndex) => uses.push({
      path: `$.scenes[${sceneIndex}].narrationChunks[${chunkIndex}].expression`,
      sceneId: scene.sceneId,
      chunkId: chunk.chunkId,
      expression: chunk.expression,
    }));
    scene.visualEvents.forEach((event, eventIndex) => {
      if (event.action === "set-expression" && event.expression) uses.push({
        path: `$.scenes[${sceneIndex}].visualEvents[${eventIndex}].expression`,
        sceneId: scene.sceneId,
        chunkId: event.atChunkId,
        expression: event.expression,
      });
    });
  });

  const assets = uses.map((use) => {
    const registeredAssetId = expressionRegistrations[use.expression]?.assetId ?? "(unregistered)";
    try {
      const resolved = resolveStrictExpressionAsset(use.expression);
      const publicRoot = path.resolve(process.cwd(), "public");
      const file = path.resolve(publicRoot, resolved.path);
      if (!file.startsWith(`${publicRoot}${path.sep}`) || !existsSync(file)) {
        throw new Error(`production file missing or outside public: ${file}`);
      }
      return {...use, assetId: resolved.assetId, assetPath: resolved.path};
    } catch (error) {
      throw new Error(`${use.path}: Scene ID=${use.sceneId}; chunk=${use.chunkId}; expression=${use.expression}; assetId=${registeredAssetId}; ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return {checked: uses, assets};
};
