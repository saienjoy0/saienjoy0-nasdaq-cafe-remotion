import type {RenderProductionData} from "./render-spec";
import {createSubtitleCues} from "./subtitle-cues";

const limits = {
  headline: {perLine: 26, lines: 1},
  supportingText: {perLine: 28, lines: 3},
  captionText: {perLine: 22, lines: 2},
  cardTitle: {perLine: 18, lines: 2},
  cardLabel: {perLine: 24, lines: 2},
  cardValue: {perLine: 28, lines: 3},
  numberLabel: 42,
  nodeLabel: 42,
  arrowLabel: 42,
  sourceLabel: {perLine: 52, lines: 1},
} as const;

const assertLength = (value: string, limit: number, path: string, area: string) => {
  if (Array.from(value).length > limit) {
    throw new Error(`${path}: ${Array.from(value).length} characters exceed ${area} limit ${limit}`);
  }
};

const assertWrapped = (value: string, perLine: number, lines: number, path: string, area: string) => {
  const explicitLines = value.split(/\r?\n/);
  if (explicitLines.length > lines) throw new Error(`${path}: ${area} exceeds ${lines} lines`);
  explicitLines.forEach((line, index) => assertLength(line, perLine, `${path}[line ${index + 1}]`, area));
  const total = Array.from(value.replace(/\r?\n/g, "")).length;
  if (total > perLine * lines) throw new Error(`${path}: ${total} characters exceed ${area} capacity ${perLine * lines}`);
};

export type SubtitleLayoutChunk = {
  speechText: string;
  startMs: number;
  endMs: number;
  caption: {text: string};
};

export const assertSubtitleCueTextFits = (value: string, path = "$.subtitle") =>
  assertWrapped(value, limits.captionText.perLine, limits.captionText.lines, path, "subtitle");

export const assertNarrationChunkSubtitleLayoutFits = (
  chunk: SubtitleLayoutChunk,
  path: string,
) => {
  // The public subtitle layer renders time-sliced caption text. speechText stays
  // TTS-facing; caption text may use display-friendly Arabic numerals.
  const cues = createSubtitleCues(chunk.caption.text || chunk.speechText, chunk.startMs, chunk.endMs);
  cues.forEach((cue, cueIndex) =>
    assertSubtitleCueTextFits(cue.text, `${path}.subtitleCues[${cueIndex}].text`),
  );
  return cues;
};

const assertCausalShape = (
  nodeIds: string[],
  arrows: Array<{fromNodeId: string; toNodeId: string}>,
  path: string,
) => {
  if (nodeIds.length > 4) throw new Error(`${path}: causal diagram supports at most four visible nodes`);
  if (arrows.length > 3) throw new Error(`${path}: causal diagram supports at most three visible arrows`);
  if (nodeIds.length < 2 || arrows.length < 1) return;

  const nodeSet = new Set(nodeIds);
  const incoming = new Map(nodeIds.map((id) => [id, 0]));
  const outgoing = new Map(nodeIds.map((id) => [id, 0]));
  for (const arrow of arrows) {
    if (!nodeSet.has(arrow.fromNodeId) || !nodeSet.has(arrow.toNodeId)) continue;
    outgoing.set(arrow.fromNodeId, (outgoing.get(arrow.fromNodeId) ?? 0) + 1);
    incoming.set(arrow.toNodeId, (incoming.get(arrow.toNodeId) ?? 0) + 1);
  }

  const roots = nodeIds.filter((id) => (incoming.get(id) ?? 0) === 0);
  const sinks = nodeIds.filter((id) => (outgoing.get(id) ?? 0) === 0);
  const isSingleChain =
    arrows.length === nodeIds.length - 1 &&
    roots.length === 1 &&
    sinks.length === 1 &&
    nodeIds.every((id) => (incoming.get(id) ?? 0) <= 1 && (outgoing.get(id) ?? 0) <= 1);

  const sink = sinks.length === 1 ? sinks[0] : null;
  const isDirectConvergence =
    sink !== null &&
    arrows.length === nodeIds.length - 1 &&
    nodeIds
      .filter((id) => id !== sink)
      .every((id) => arrows.some((arrow) => arrow.fromNodeId === id && arrow.toNodeId === sink));

  if (!isSingleChain && !isDirectConvergence) {
    throw new Error(`${path}: causal diagram must be a single chain or direct convergence without crossing paths`);
  }
};

export const assertSpecLayoutFits = (data: RenderProductionData) => {
  data.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    assertWrapped(scene.headline, limits.headline.perLine, limits.headline.lines, `${base}.headline`, "headline");
    scene.supportingTexts.forEach((text, index) => assertWrapped(text, limits.supportingText.perLine, limits.supportingText.lines, `${base}.supportingTexts[${index}]`, "supporting text"));
    scene.narrationChunks.forEach((chunk, index) => assertNarrationChunkSubtitleLayoutFits(chunk, `${base}.narrationChunks[${index}]`));
    scene.cards.forEach((card, cardIndex) => {
      assertWrapped(card.title, limits.cardTitle.perLine, limits.cardTitle.lines, `${base}.cards[${cardIndex}].title`, "card title");
      card.lines.forEach((line, lineIndex) => {
        assertWrapped(line.label, limits.cardLabel.perLine, limits.cardLabel.lines, `${base}.cards[${cardIndex}].lines[${lineIndex}].label`, "card label");
        assertWrapped(line.value, limits.cardValue.perLine, limits.cardValue.lines, `${base}.cards[${cardIndex}].lines[${lineIndex}].value`, "card value");
      });
    });
    scene.numbers.forEach((number, index) => assertLength(number.label, limits.numberLabel, `${base}.numbers[${index}].label`, "number label"));
    scene.nodes.forEach((node, index) => assertLength(node.label, limits.nodeLabel, `${base}.nodes[${index}].label`, "node label"));
    scene.arrows.forEach((arrow, index) => assertLength(arrow.label, limits.arrowLabel, `${base}.arrows[${index}].label`, "arrow label"));
    if (scene.sourceLabel) assertWrapped(scene.sourceLabel, limits.sourceLabel.perLine, limits.sourceLabel.lines, `${base}.sourceLabel`, "source label");

    scene.visualBeats.forEach((beat, beatIndex) => {
      const path = `${base}.visualBeats[${beatIndex}]`;
      const objectIds = new Set(beat.objectIds);
      const visibleNumbers = scene.numbers.filter((number) => objectIds.has(number.numberId));
      const visibleCards = scene.cards.filter((card) => objectIds.has(card.cardId));
      const visibleNodes = scene.nodes.filter((node) => objectIds.has(node.nodeId));
      const visibleNodeIds = new Set(visibleNodes.map((node) => node.nodeId));
      const visibleArrows = scene.arrows.filter(
        (arrow) =>
          objectIds.has(arrow.arrowId) &&
          visibleNodeIds.has(arrow.fromNodeId) &&
          visibleNodeIds.has(arrow.toNodeId),
      );

      const comparisonLimit = beat.visualTemplate === "market-pulse-grid" ? 6 : 4;
      if (["number-comparison", "chart", "stock-comparison"].includes(beat.visualMode) && visibleNumbers.length > comparisonLimit) {
        throw new Error(`${path}.objectIds: comparison view supports at most ${comparisonLimit} visible numbers`);
      }
      if (beat.visualMode === "verification-points") {
        const itemCount = visibleCards.reduce((total, card) => total + card.lines.length, 0);
        if (itemCount > 4) throw new Error(`${path}.objectIds: verification view supports at most four items`);
      }
      if (beat.visualMode === "causal-diagram") {
        assertCausalShape(
          visibleNodes.map((node) => node.nodeId),
          visibleArrows,
          `${path}.objectIds`,
        );
      }
      const template = beat.visualTemplate;
    const values = visibleNumbers
      .map((number) => Number(number.value.replace(/[^0-9+\-.]/g, "")))
      .filter((value) => Number.isFinite(value));
    const requiresNumbers = ["expected-actual-bullet", "metric-comparison-board", "index-return-bars", "diverging-stock-bars"].includes(template);
    if (requiresNumbers && (visibleNumbers.length < 2 || visibleNumbers.length > 4)) throw new Error(`${path}.objectIds: ${template} requires two to four visible numbers`);
    if (template === "diverging-stock-bars" && !(values.some((value) => value < 0) && values.some((value) => value >= 0))) throw new Error(`${path}.objectIds: diverging-stock-bars requires both negative and non-negative values`);
    if (template === "expected-actual-gap-flow") {
      const roles = new Set(visibleCards.map((card) => card.role));
      for (const role of ["expected", "actual", "gap"] as const) if (!roles.has(role)) throw new Error(`${path}.objectIds: expected-actual-gap-flow missing ${role} card`);
    }
    if (template === "causal-lane") {
      assertCausalShape(visibleNodes.map((node) => node.nodeId), visibleArrows, `${path}.objectIds`);
      if (beat.templateConfig.nodeOrder.length !== visibleNodes.length || beat.templateConfig.nodeOrder.length < 2) throw new Error(`${path}.templateConfig.nodeOrder: causal-lane requires the complete two-to-four node order`);
      const order = beat.templateConfig.nodeOrder;
      for (let index = 0; index < order.length - 1; index += 1) if (!visibleArrows.some((arrow) => arrow.fromNodeId === order[index] && arrow.toNodeId === order[index + 1])) throw new Error(`${path}.templateConfig.nodeOrder: missing sequential arrow ${order[index]} -> ${order[index + 1]}`);
    }
    if (["tailwind-headwind", "verification-matrix"].includes(template)) {
      if (beat.templateConfig.laneLabels.length !== 2) throw new Error(`${path}.templateConfig.laneLabels: ${template} requires exactly two lanes`);
      for (const label of beat.templateConfig.laneLabels) if (!beat.viewerTexts.some((item) => item.startsWith(`${label}｜`))) throw new Error(`${path}.viewerTexts: ${template} requires an item prefixed ${label}｜`);
    }
    if (template === "evidence-boundary" && (!scene.uncertainty || beat.viewerTexts.length < 1)) throw new Error(`${path}: evidence-boundary requires confirmed viewer text and uncertainty`);
    if (template === "verification-checklist") {
      const itemCount = visibleCards.reduce((total, card) => total + card.lines.length, 0) || beat.viewerTexts.length;
      if (itemCount < 2 || itemCount > 4) throw new Error(`${path}: verification-checklist requires two to four items`);
    }
    if (template === "market-pulse-grid" && (visibleNumbers.length < 3 || visibleNumbers.length > 6)) throw new Error(`${path}.objectIds: market-pulse-grid requires three to six visible numbers`);
    if (template === "earnings-surprise" && visibleNumbers.length !== 3) throw new Error(`${path}.objectIds: earnings-surprise requires exactly three visible numbers`);
    if (template === "dual-asset-split" && visibleNumbers.length !== 2) throw new Error(`${path}.objectIds: dual-asset-split requires exactly two visible numbers`);
    if (template === "macro-pressure") {
      assertCausalShape(visibleNodes.map((node) => node.nodeId), visibleArrows, `${path}.objectIds`);
      if (visibleNodes.length < 2 || visibleNodes.length > 4) throw new Error(`${path}.objectIds: macro-pressure requires two to four visible nodes`);
      if (visibleArrows.length < 1 || visibleArrows.length > 3) throw new Error(`${path}.objectIds: macro-pressure requires one to three visible arrows`);
      const order = beat.templateConfig.nodeOrder;
      if (order.length !== visibleNodes.length) throw new Error(`${path}.templateConfig.nodeOrder: macro-pressure requires the complete visible node order`);
      for (let index = 0; index < order.length - 1; index += 1) if (!visibleArrows.some((arrow) => arrow.fromNodeId === order[index] && arrow.toNodeId === order[index + 1])) throw new Error(`${path}.templateConfig.nodeOrder: missing sequential arrow ${order[index]} -> ${order[index + 1]}`);
    }
    if (template === "source-receipt") {
      const evidenceCount = visibleCards.reduce((total, card) => total + Math.max(1, card.lines.length), 0) + visibleNumbers.length + beat.viewerTexts.length;
      if (evidenceCount < 1 || evidenceCount > 6) throw new Error(`${path}: source-receipt requires one to six visible evidence items`);
    }
    if (template === "entity-card-full" && (beat.screenState !== "EntityFocus" || !beat.entity)) throw new Error(`${path}: entity-card-full requires EntityFocus and entity metadata`);
    if (template === "opening-contradiction" && scene.sceneNumber !== 1) throw new Error(`${path}: opening-contradiction is reserved for Scene 1`);
    if (template === "closing-recap" && scene.sceneNumber !== 9) throw new Error(`${path}: closing-recap is reserved for Scene 9`);
    });
  });
  return data;
};
