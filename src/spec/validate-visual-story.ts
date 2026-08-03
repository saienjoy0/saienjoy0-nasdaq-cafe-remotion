import type {RenderSpec} from "./render-spec";
import {VISUAL_TEMPLATE_CONTRACTS} from "./visual-template-contract";

const fail = (path: string, message: string): never => {
  throw new Error(`${path}: ${message}`);
};

const countInRange = (
  count: number,
  range: {min: number; max: number},
  path: string,
  label: string,
) => {
  if (count < range.min || count > range.max) {
    fail(path, `${label} count must be ${range.min}-${range.max}, got ${count}`);
  }
};

const numericFromText = (value: string) => {
  const match = value.replace(/,/g, "").match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const normalized = (value: string) => value.replace(/[\s　|｜、。,.・:：+＋−-]/g, "").toLowerCase();

export const validateVisualStoryContract = (
  spec: RenderSpec,
  options: {enforceVariety?: boolean} = {},
) => {
  const families: string[] = [];

  spec.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `$.scenes[${sceneIndex}]`;
    const objectType = new Map<string, "card" | "number" | "node" | "arrow">([
      ...scene.cards.map((item) => [item.cardId, "card"] as const),
      ...scene.numbers.map((item) => [item.numberId, "number"] as const),
      ...scene.nodes.map((item) => [item.nodeId, "node"] as const),
      ...scene.arrows.map((item) => [item.arrowId, "arrow"] as const),
    ]);
    const chunkOrder = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));

    scene.visualBeats.forEach((beat, beatIndex) => {
      const path = `${scenePath}.visualBeats[${beatIndex}]`;
      const contract = VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate];
      families.push(contract.family);

      if (!contract.supportedScreenStates.includes(beat.screenState)) {
        fail(`${path}.screenState`, `${beat.visualTemplate} does not support ${beat.screenState}`);
      }
      if (!contract.variants.includes(beat.templateConfig.variant)) {
        fail(`${path}.templateConfig.variant`, `${beat.templateConfig.variant} is not registered for ${beat.visualTemplate}`);
      }

      const selectedCards = scene.cards.filter((item) => beat.objectIds.includes(item.cardId));
      const selectedNumbers = scene.numbers.filter((item) => beat.objectIds.includes(item.numberId));
      const selectedNodes = scene.nodes.filter((item) => beat.objectIds.includes(item.nodeId));
      const selectedArrows = scene.arrows.filter((item) => beat.objectIds.includes(item.arrowId));
      countInRange(selectedCards.length, contract.cards, `${path}.objectIds`, "card");
      countInRange(selectedNumbers.length, contract.numbers, `${path}.objectIds`, "number");
      countInRange(selectedNodes.length, contract.nodes, `${path}.objectIds`, "node");
      countInRange(selectedArrows.length, contract.arrows, `${path}.objectIds`, "arrow");

      if (contract.requiresNumericValue) {
        selectedNumbers.forEach((number) => {
          const numberIndex = scene.numbers.indexOf(number);
          const numericValue = number.numericValue;
          if (numericValue == null) {
            fail(`${scenePath}.numbers[${numberIndex}].numericValue`, `${beat.visualTemplate} requires numericValue`);
          }
          const parsed = numericFromText(number.value);
          if (parsed !== null && Math.abs(parsed - numericValue) > 1e-8) {
            fail(`${scenePath}.numbers[${numberIndex}].numericValue`, `must match visible value ${number.value}`);
          }
        });
        if (selectedNumbers.length > 1) {
          const units = new Set(selectedNumbers.map((number) => number.unit));
          if (units.size !== 1) fail(`${path}.objectIds`, `${beat.visualTemplate} requires one shared unit`);
        }
      }

      const policy = beat.sequencePolicy ?? (beat.objectIds.length === 0 ? "static" : "object-order-fallback");
      const showTargets = new Set(
        scene.visualEvents
          .filter((event) => event.action === "show" && event.targetId && beat.objectIds.includes(event.targetId))
          .map((event) => event.targetId as string),
      );
      if (policy === "explicit") {
        beat.objectIds.forEach((id, objectIndex) => {
          if (!showTargets.has(id)) fail(`${path}.objectIds[${objectIndex}]`, `explicit sequence requires a show event for ${id}`);
        });
      }
      if (policy === "static" && showTargets.size > 0) {
        fail(`${path}.sequencePolicy`, "static sequence must not contain show events for Beat objects");
      }
      if (beat.finalHoldMs == null) {
        fail(`${path}.finalHoldMs`, "finalHoldMs must be resolved before production");
      }

      const startIndex = chunkOrder.get(beat.startChunkId)!;
      const endIndex = chunkOrder.get(beat.endChunkId)!;
      scene.visualEvents.forEach((event, eventIndex) => {
        if (event.action === "set-expression" || !event.targetId || !beat.objectIds.includes(event.targetId)) return;
        const eventChunkIndex = chunkOrder.get(event.atChunkId);
        if (eventChunkIndex === undefined || eventChunkIndex < startIndex || eventChunkIndex > endIndex) {
          fail(`${scenePath}.visualEvents[${eventIndex}].atChunkId`, `event for ${event.targetId} must stay inside ${beat.beatId}`);
        }
      });

      const objectOrder = new Map(beat.objectIds.map((id, index) => [id, index]));
      selectedArrows.forEach((arrow) => {
        const arrowIndex = objectOrder.get(arrow.arrowId)!;
        const fromIndexValue = objectOrder.get(arrow.fromNodeId);
        const toIndexValue = objectOrder.get(arrow.toNodeId);
        if (fromIndexValue === undefined || toIndexValue === undefined) {
          fail(`${path}.objectIds`, `arrow ${arrow.arrowId} requires both connected nodes in the same Beat`);
        }
        const fromIndex = fromIndexValue as number;
        const toIndex = toIndexValue as number;
        if (arrowIndex <= fromIndex || arrowIndex <= toIndex) {
          fail(`${path}.objectIds[${arrowIndex}]`, `arrow ${arrow.arrowId} must appear after both connected nodes`);
        }
      });

      beat.templateConfig.nodeOrder.forEach((id, orderIndex) => {
        if (!beat.objectIds.includes(id) || objectType.get(id) !== "node") {
          fail(`${path}.templateConfig.nodeOrder[${orderIndex}]`, `${id} must be a selected node`);
        }
      });
      if (beat.templateConfig.outcomeNodeId && !beat.objectIds.includes(beat.templateConfig.outcomeNodeId)) {
        fail(`${path}.templateConfig.outcomeNodeId`, "outcomeNodeId must be selected by objectIds");
      }
    });
  });

  if (options.enforceVariety) {
    const distinctFamilies = new Set(families);
    if (distinctFamilies.size < 4) fail("$.scenes", `normal episode requires at least 4 visual families, got ${distinctFamilies.size}`);
    let longestRun = 0;
    let currentRun = 0;
    let previous: string | null = null;
    families.forEach((family) => {
      currentRun = family === previous ? currentRun + 1 : 1;
      longestRun = Math.max(longestRun, currentRun);
      previous = family;
    });
    if (longestRun > 2) fail("$.scenes", `the same visual family may lead at most 2 consecutive Beats, got ${longestRun}`);

    const firstHalf = new Set(spec.scenes.slice(0, 4).flatMap((scene) => scene.visualBeats.map((beat) => VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate].family)));
    const secondHalf = new Set(spec.scenes.slice(4).flatMap((scene) => scene.visualBeats.map((beat) => VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate].family)));
    if (firstHalf.size < 3) fail("$.scenes[0:4]", "Scenes 1-4 require at least 3 visual families");
    if (secondHalf.size < 3) fail("$.scenes[4:9]", "Scenes 5-9 require at least 3 visual families");
    if (!spec.scenes[0].visualBeats.some((beat) => beat.visualTemplate === "opening-contradiction")) {
      fail("$.scenes[0].visualBeats", "Scene 1 requires opening-contradiction");
    }
    if (!spec.scenes[7].visualBeats.some((beat) => VISUAL_TEMPLATE_CONTRACTS[beat.visualTemplate].family === "verification")) {
      fail("$.scenes[7].visualBeats", "Scene 8 requires a verification template");
    }
    if (!spec.scenes[8].visualBeats.some((beat) => beat.visualTemplate === "closing-recap")) {
      fail("$.scenes[8].visualBeats", "Scene 9 requires closing-recap");
    }

    const earlierText = normalized(spec.scenes.slice(0, 8).flatMap((scene) => [
      scene.headline,
      ...scene.supportingTexts,
      ...scene.visualBeats.flatMap((beat) => beat.viewerTexts),
      ...scene.cards.flatMap((card) => card.lines.map((line) => line.value)),
    ]).join(" "));
    spec.scenes[8].cards.flatMap((card) => card.lines).forEach((line, index) => {
      const value = normalized(line.value);
      if (value.length > 0 && !earlierText.includes(value)) {
        fail(`$.scenes[8].cards[*].lines[${index}].value`, "Scene 9 must assemble an already introduced conclusion, not new evidence");
      }
    });
  }
};
