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

type InternalExpressionUse = ExpressionUse & {sceneIndex: number};

export type ExpressionPreflightResult = {
  checked: ExpressionUse[];
  assets: Array<ExpressionUse & {assetId: string; assetPath: string}>;
};

const fixedFoxPlacementFor = (
  spec: RenderSpec,
  use: InternalExpressionUse,
  assetId: string,
) => {
  const scene = spec.scenes[use.sceneIndex];
  const matches = scene.assetPlacements.filter(
    (placement) =>
      placement.role === "fox-expression" &&
      placement.region === "fox-left" &&
      placement.assetId === assetId,
  );
  if (matches.length !== 1) {
    throw new Error(
      `${use.path}: Scene ID=${use.sceneId}; expression=${use.expression}; assetId=${assetId}; expected exactly one matching fox-left placement, found=${matches.length}`,
    );
  }
  const placement = matches[0];
  if (
    placement.fit !== "contain" ||
    placement.opacity !== 1 ||
    placement.startChunkId !== null ||
    placement.endChunkId !== null
  ) {
    throw new Error(
      `${use.path}: Scene ID=${use.sceneId}; expression=${use.expression}; assetId=${assetId}; fox-expression placement must be fixed for the full Scene`,
    );
  }
  const visibilityEvents = scene.visualEvents.filter(
    (event) =>
      (event.action === "show" || event.action === "hide") &&
      event.targetId === placement.placementId,
  );
  if (visibilityEvents.length > 0) {
    throw new Error(
      `${use.path}: Scene ID=${use.sceneId}; expression=${use.expression}; assetId=${assetId}; fixed fox-expression placement must not be controlled by show/hide events`,
    );
  }
  return placement;
};

export const preflightProductionExpressions = (spec: RenderSpec): ExpressionPreflightResult => {
  const uses: InternalExpressionUse[] = [];
  spec.scenes.forEach((scene, sceneIndex) => {
    uses.push({
      path: `$.scenes[${sceneIndex}].initialExpression`,
      sceneId: scene.sceneId,
      chunkId: "initialExpression",
      expression: scene.initialExpression,
      sceneIndex,
    });
    scene.narrationChunks.forEach((chunk, chunkIndex) => uses.push({
      path: `$.scenes[${sceneIndex}].narrationChunks[${chunkIndex}].expression`,
      sceneId: scene.sceneId,
      chunkId: chunk.chunkId,
      expression: chunk.expression,
      sceneIndex,
    }));
    scene.visualEvents.forEach((event, eventIndex) => {
      if (event.action === "set-expression" && event.expression) uses.push({
        path: `$.scenes[${sceneIndex}].visualEvents[${eventIndex}].expression`,
        sceneId: scene.sceneId,
        chunkId: event.atChunkId,
        expression: event.expression,
        sceneIndex,
      });
    });
    scene.visualBeats.forEach((beat, beatIndex) => {
      beat.shots?.forEach((shot, shotIndex) => {
        if (!shot.foxExpression) return;
        uses.push({
          path: `$.scenes[${sceneIndex}].visualBeats[${beatIndex}].shots[${shotIndex}].foxExpression`,
          sceneId: scene.sceneId,
          chunkId: shot.startChunkId,
          expression: shot.foxExpression,
          sceneIndex,
        });
      });
    });
  });

  const assets = uses.map(({sceneIndex, ...use}) => {
    const registeredAssetId = expressionRegistrations[use.expression]?.assetId ?? "(unregistered)";
    try {
      const resolved = resolveStrictExpressionAsset(use.expression);
      const publicRoot = path.resolve(process.cwd(), "public");
      const file = path.resolve(publicRoot, resolved.path);
      if (!file.startsWith(`${publicRoot}${path.sep}`) || !existsSync(file)) {
        throw new Error(`production file missing or outside public: ${file}`);
      }
      fixedFoxPlacementFor(spec, {...use, sceneIndex}, resolved.assetId);
      return {...use, assetId: resolved.assetId, assetPath: resolved.path};
    } catch (error) {
      throw new Error(`${use.path}: Scene ID=${use.sceneId}; chunk=${use.chunkId}; expression=${use.expression}; assetId=${registeredAssetId}; ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return {
    checked: uses.map(({sceneIndex: _sceneIndex, ...use}) => use),
    assets,
  };
};
