import fixtureJson from "../../render-specs/fixtures/complete-9scene/render_spec.json";
import {renderSpecSchema, type RenderSpec} from "../../src/spec/render-spec";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarCompatibility,
} from "../../src/spec/visual-grammar-contract";
import {getVisualComponentDescriptor} from "../../src/spec/visual-component-registry";
import {
  VISUAL_TEMPLATE_CONTRACTS,
  type VisualTemplateId,
} from "../../src/spec/visual-template-contract";

export const cloneTestValue = <T,>(value: T): T => structuredClone(value);

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

const currentSequencePolicyFor = (
  scene: RenderSpec["scenes"][number],
  beat: RenderSpec["scenes"][number]["visualBeats"][number],
) => {
  if (beat.objectIds.length === 0) return "static" as const;

  const chunkOrder = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));
  const startIndex = chunkOrder.get(beat.startChunkId);
  const endIndex = chunkOrder.get(beat.endChunkId);
  if (startIndex === undefined || endIndex === undefined) {
    throw new Error(`synthetic fixture cannot resolve Beat chunk range: ${beat.beatId}`);
  }

  const showTargets = new Set(
    scene.visualEvents
      .filter((event) => {
        if (event.action !== "show" || !event.targetId || !beat.objectIds.includes(event.targetId)) return false;
        const eventChunkIndex = chunkOrder.get(event.atChunkId);
        return eventChunkIndex !== undefined && startIndex <= eventChunkIndex && eventChunkIndex <= endIndex;
      })
      .map((event) => event.targetId as string),
  );

  if (showTargets.size === 0) return "static" as const;
  if (beat.objectIds.every((objectId) => showTargets.has(objectId))) return "explicit" as const;
  return "object-order-fallback" as const;
};

export const makeCurrentVisualDirectorFixture = (): RenderSpec => {
  const value = makeCurrentVisualGrammarFixture();

  for (const scene of value.scenes) {
    for (const beat of scene.visualBeats) {
      const contract = VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate];
      const descriptor = getVisualComponentDescriptor(beat.visualTemplate);
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
      // Current synthetic fixtures represent the current Registry contract, not stale
      // historical producer combinations. Candidate tests may deliberately introduce
      // drift after this point, but the shared fixture itself must be canonical.
      beat.visualMode = descriptor.visualMode;
      if (!contract.supportedScreenStates.includes(beat.screenState)) {
        beat.screenState = contract.supportedScreenStates[0];
      }
      // The source fixture is historical and may carry sequence metadata whose show
      // events fall outside the current Beat range. Derive only the synthetic fixture's
      // sequence policy from the events that actually exist inside the Beat; never invent
      // events and never apply this normalization to production RenderSpecs.
      beat.sequencePolicy = currentSequencePolicyFor(scene, beat);
    }
    if (scene.visualBeats.length > 0) {
      scene.visualMode = scene.visualBeats[0].visualMode;
    }
  }

  return renderSpecSchema.parse(value);
};
