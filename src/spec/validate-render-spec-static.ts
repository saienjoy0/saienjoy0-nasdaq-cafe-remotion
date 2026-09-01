import type {RenderSpec} from "./render-spec";
import {preflightProductionExpressions} from "./preflight-render-spec";
import {preflightStaticViewerLayout} from "./preflight-static-viewer-layout";
import {preflightViewerSurface} from "./preflight-viewer-surface";
import {validateShotStoryContract} from "./validate-shot-story";
import {validateVisualStoryContract} from "./validate-visual-story";

export const validateRenderSpecVisualProductionContract = (
  spec: RenderSpec,
  options: {enforceVariety: boolean},
) => {
  validateVisualStoryContract(spec, options);
  validateShotStoryContract(spec, options);
  preflightStaticViewerLayout(spec);
};

export const validateRenderSpecStaticProductionContract = (
  spec: RenderSpec,
  options: {enforceVariety: boolean},
) => {
  validateRenderSpecVisualProductionContract(spec, options);
  const expressionPreflight = preflightProductionExpressions(spec);
  const viewerSurfacePreflight = preflightViewerSurface(spec);
  return {expressionPreflight, viewerSurfacePreflight};
};
