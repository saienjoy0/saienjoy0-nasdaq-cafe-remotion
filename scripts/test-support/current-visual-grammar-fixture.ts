import fixtureJson from "../../render-specs/fixtures/complete-9scene/render_spec.json";
import {renderSpecSchema, type RenderSpec} from "../../src/spec/render-spec";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarCompatibility,
} from "../../src/spec/visual-grammar-contract";
import {
  VISUAL_TEMPLATE_CONTRACTS,
  type VisualTemplateId,
} from "../../src/spec/visual-template-contract";

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

const chooseIds = <T,>(
  items: readonly T[],
  selected: ReadonlySet<string>,
  idOf: (item: T) => string,
  range: {min: number; max: number},
  predicate: (item: T) => boolean = () => true,
) => {
  const eligible = items.filter(predicate);
  const ordered = [
    ...eligible.filter((item) => selected.has(idOf(item))),
    ...eligible.filter((item) => !selected.has(idOf(item))),
  ];
  const ids = ordered.slice(0, range.max).map(idOf);
  if (ids.length < range.min) {
    throw new Error(`synthetic fixture cannot satisfy template inventory min=${range.min}`);
  }
  return ids;
};

export const makeCurrentVisualDirectorFixture = (): RenderSpec => {
  const value = makeCurrentVisualGrammarFixture();

  for (const scene of value.scenes) {
    for (const beat of scene.visualBeats) {
      const contract = VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate];
      const selected = new Set(beat.objectIds);
      const cardIds = chooseIds(scene.cards, selected, (item) => item.cardId, contract.cards);
      const numberIds = chooseIds(
        scene.numbers,
        selected,
        (item) => item.numberId,
        contract.numbers,
        (item) => !contract.requiresNumericValue || item.numericValue != null,
      );
      const nodeIds = chooseIds(scene.nodes, selected, (item) => item.nodeId, contract.nodes);
      const arrowIds = chooseIds(scene.arrows, selected, (item) => item.arrowId, contract.arrows);
      beat.objectIds = [...cardIds, ...numberIds, ...nodeIds, ...arrowIds];
      beat.templateVariant = beat.templateConfig.variant;
    }
  }

  return renderSpecSchema.parse(value);
};
