import type {RenderProductionData} from "./render-spec";

const limits = {
  headline: {perLine: 26, lines: 1},
  supportingText: {perLine: 28, lines: 3},
  captionText: {perLine: 34, lines: 3},
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
    scene.narrationChunks.forEach((chunk, index) => assertWrapped(chunk.caption.text, limits.captionText.perLine, limits.captionText.lines, `${base}.narrationChunks[${index}].caption.text`, "caption"));
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

      if (["number-comparison", "chart", "stock-comparison"].includes(beat.visualMode) && visibleNumbers.length > 4) {
        throw new Error(`${path}.objectIds: comparison view supports at most four visible numbers`);
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
    });
  });
  return data;
};
