import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";

const project = process.cwd();
const [episodeSource, rendererSource, shotRendererSource, shotRecipesSource, transitionHostSource, assetLayerSource, renderStateSource, publicViewModelSource, layoutValidatorSource, episodeSpecSource] = await Promise.all([
  readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/VisualTemplateRenderer.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/ShotStageRenderer.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/shots/ShotRecipes.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/ShotTransitionHost.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecAssetLayer.tsx"), "utf8"),
  readFile(path.join(project, "src/spec/render-state.ts"), "utf8"),
  readFile(path.join(project, "src/spec/public-view-model.ts"), "utf8"),
  readFile(path.join(project, "src/spec/validate-render-layout.ts"), "utf8"),
  readFile(path.join(project, "render-specs/2026-07-31/render_spec.json"), "utf8"),
]);
const episodeSpec = renderSpecSchema.parse(JSON.parse(episodeSpecSource));
assert.equal(episodeSpec.schemaVersion, "2.2.0");
assert.equal(episodeSpec.scenes.length, 9);
assert.match(renderStateSource, /activeShot/);
assert.match(renderStateSource, /previousExpression/);
assert.match(publicViewModelSource, /shot: state\.activeShot/);
assert.match(publicViewModelSource, /previousShot: state\.previousShot/);
assert.match(episodeSource, /ShotStageRenderer/);
assert.match(episodeSource, /FoxExpressionLayer/);
assert.match(episodeSource, /SoundCueTrack/);
assert.match(shotRendererSource, /VisualTemplateRenderer/);
assert.match(shotRendererSource, /ShotTransitionHost/);
assert.match(transitionHostSource, /data-shot-layer="previous"/);
assert.match(transitionHostSource, /data-shot-layer="current"/);
assert.doesNotMatch(shotRendererSource, /GenericShot/);
for (const component of ["HeroMetric", "Contradiction", "ExpectedAnchor", "ActualCrosses", "GapMacro", "CausalBuild", "Counterforce", "EntityCutaway", "SplitOpposition", "FocusMatrix", "VerificationPaths", "RecapAssembly"]) assert.match(shotRecipesSource, new RegExp(`const ${component}`), `missing dedicated Shot component: ${component}`);
assert.match(rendererSource, /switch \(content\.visualTemplate\)/);
assert.match(shotRecipesSource, /switch \(content\.shot!\.shotRecipe\)/);
assert.doesNotMatch(shotRecipesSource, /componentPath|new Function|eval\(|Math\.random/);
assert.match(layoutValidatorSource, /causal diagram supports at most four visible nodes/);
assert.match(assetLayerSource, /PublicPlacedAsset/);
let shotCount = 0;
for (const scene of episodeSpec.scenes) for (const beat of scene.visualBeats) shotCount += beat.shots?.length ?? 0;
assert.equal(shotCount, 39);
console.log("PASS: Visual Story v3.1 dedicated Shot presentation, v2 no-Shot fallback, stable transition, and layout constraints");
