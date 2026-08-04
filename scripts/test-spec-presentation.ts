import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";

const project = process.cwd();
const [episodeSource, rendererSource, shotRendererSource, assetLayerSource, renderStateSource, publicViewModelSource, layoutValidatorSource, episodeSpecSource] = await Promise.all([
  readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/VisualTemplateRenderer.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/ShotStageRenderer.tsx"), "utf8"),
  readFile(path.join(project, "src/components/spec/SpecAssetLayer.tsx"), "utf8"),
  readFile(path.join(project, "src/spec/render-state.ts"), "utf8"),
  readFile(path.join(project, "src/spec/public-view-model.ts"), "utf8"),
  readFile(path.join(project, "src/spec/validate-render-layout.ts"), "utf8"),
  readFile(path.join(project, "render-specs/2026-07-31/render_spec.json"), "utf8"),
]);

const episodeSpec = renderSpecSchema.parse(JSON.parse(episodeSpecSource));
assert.equal(episodeSpec.schemaVersion, "2.2.0");
assert.equal(episodeSpec.scenes.length, 9);

assert.match(renderStateSource, /visibleSinceMs/);
assert.match(renderStateSource, /highlightedSinceMs/);
assert.match(renderStateSource, /eventTimeMs/);
assert.match(renderStateSource, /event\.action === "show"/);
assert.match(renderStateSource, /event\.action === "hide"/);
assert.match(renderStateSource, /event\.action === "highlight"/);
assert.match(renderStateSource, /event\.action === "unhighlight"/);
assert.match(renderStateSource, /activeShot/);
assert.match(renderStateSource, /previousExpression/);

assert.match(publicViewModelSource, /visualTemplate: beat\.visualTemplate/);
assert.match(publicViewModelSource, /templateConfig: beat\.templateConfig/);
assert.match(publicViewModelSource, /sequencePolicy/);
assert.match(publicViewModelSource, /object-order-fallback/);
assert.match(publicViewModelSource, /showTargets/);
assert.match(publicViewModelSource, /holdProgress/);
assert.match(publicViewModelSource, /entityPresentation/);
assert.match(publicViewModelSource, /shot: state\.activeShot/);
assert.match(publicViewModelSource, /previousShot: state\.previousShot/);

assert.match(episodeSource, /ShotStageRenderer/);
assert.match(episodeSource, /FoxExpressionLayer/);
assert.match(episodeSource, /SoundCueTrack/);
assert.match(shotRendererSource, /VisualTemplateRenderer/);
assert.doesNotMatch(episodeSource, /<SpecVisualMode content=/);
assert.match(episodeSource, /linear-gradient\(90deg,rgba\(4,10,23/);
assert.match(episodeSource, /TransitionSeries/);
assert.match(assetLayerSource, /PublicPlacedAsset/);

for (const component of [
  "OpeningContradiction",
  "ExpectedActualFlow",
  "BulletComparison",
  "CausalLane",
  "TailwindHeadwind",
  "DivergingBars",
  "VerificationMatrix",
  "FinalAssembly",
]) {
  assert.match(rendererSource, new RegExp(`const ${component}`), `missing presentation component: ${component}`);
}
for (const component of [
  "HeroMetric",
  "Contradiction",
  "ExpectedAnchor",
  "ActualCrosses",
  "GapMacro",
  "KineticTypography",
  "ContinuityBadge",
]) {
  assert.match(shotRendererSource, new RegExp(`const ${component}`), `missing Shot presentation component: ${component}`);
}
assert.match(rendererSource, /switch \(content\.visualTemplate\)/);
assert.match(shotRendererSource, /switch \(shot\.shotRecipe\)/);
assert.doesNotMatch(rendererSource, /componentPath|new Function|eval\(|Math\.random/);
assert.doesNotMatch(shotRendererSource, /componentPath|new Function|eval\(|Math\.random/);
assert.doesNotMatch(rendererSource, /const angle =|Math\.PI \* 2 \* index/, "causal diagrams must not use circular auto-layout");
assert.match(rendererSource, /strokeDashoffset=\{1 - progress\}/, "causal arrows must draw progressively");
assert.match(rendererSource, /AnimatedNumber/, "numbers must support count-up presentation");

assert.match(layoutValidatorSource, /causal diagram supports at most four visible nodes/);
assert.match(layoutValidatorSource, /causal diagram supports at most three visible arrows/);
assert.match(layoutValidatorSource, /comparison view supports at most four visible numbers/);
assert.match(layoutValidatorSource, /verification view supports at most four items/);

let shotCount = 0;
for (const scene of episodeSpec.scenes) {
  for (const beat of scene.visualBeats) {
    assert.ok(beat.visualTemplate.length > 0, `${beat.beatId}: visualTemplate is required`);
    assert.ok(beat.templateConfig.dataBasis.trim().length > 0, `${beat.beatId}: dataBasis is required`);
    shotCount += beat.shots?.length ?? 0;
    if (beat.visualTemplate === "causal-lane") {
      const selectedNodes = scene.nodes.filter((node) => beat.objectIds.includes(node.nodeId));
      const selectedArrows = scene.arrows.filter((arrow) => beat.objectIds.includes(arrow.arrowId));
      assert.ok(selectedNodes.length <= 4, `${beat.beatId}: causal lane exceeds four nodes`);
      assert.ok(selectedArrows.length <= 3, `${beat.beatId}: causal lane exceeds three arrows`);
      const objectOrder = new Map(beat.objectIds.map((id, index) => [id, index]));
      for (const arrow of selectedArrows) {
        assert.ok((objectOrder.get(arrow.arrowId) ?? -1) > (objectOrder.get(arrow.fromNodeId) ?? Number.MAX_SAFE_INTEGER), `${beat.beatId}: arrow appears before its source node`);
        assert.ok((objectOrder.get(arrow.arrowId) ?? -1) > (objectOrder.get(arrow.toNodeId) ?? Number.MAX_SAFE_INTEGER), `${beat.beatId}: arrow appears before its target node`);
      }
    }
  }
}
assert.equal(shotCount, 39, "July 31 production input should contain the approved 39-Shot plan");

console.log("PASS: Visual Story v3 Shot presentation, v2 fallback routing, and layout constraints");
