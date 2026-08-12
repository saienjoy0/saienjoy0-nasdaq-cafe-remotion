import fixtureJson from "../../render-specs/fixtures/complete-9scene/render_spec.json";
import {renderSpecSchema, type RenderSpec} from "../../src/spec/render-spec";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarCompatibility,
} from "../../src/spec/visual-grammar-contract";
import type {VisualTemplateId} from "../../src/spec/visual-template-contract";

export const cloneTestValue = <T>(value: T): T => structuredClone(value);

export const makeCurrentVisualGrammarFixture = (): RenderSpec => {
  const value = cloneTestValue(fixtureJson) as unknown as Record<string, unknown>;
  value.schemaVersion = "2.4.0";

  const scenes = value.scenes as Array<{visualBeats: Array<Record<string, unknown>>}>;
  let beatCount = 0;
  for (const scene of scenes) {
    for (const beat of scene.visualBeats) {
      const visualTemplate = beat.visualTemplate as VisualTemplateId;
      const compatibility = getVisualGrammarCompatibility(visualTemplate);
      beat.visualGrammarId = compatibility.allowedGrammarIds[0];
      beat.transitionRole = "continuation";
      beatCount += 1;
    }
  }

  value.visualGrammarContract = {
    contractVersion: "1.0.0",
    semanticsSha256: "0".repeat(64),
    rendererCompatibilitySha256: VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
    finalEpisodeContractSha256: "1".repeat(64),
    beatCount,
  };

  return renderSpecSchema.parse(value);
};
