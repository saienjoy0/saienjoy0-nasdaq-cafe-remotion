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
  });
  return data;
};
