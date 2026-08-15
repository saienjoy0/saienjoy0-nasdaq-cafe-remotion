import type {RenderProductionData} from "./render-spec";
import {assertStaticTemplateSoundness} from "./static-template-soundness";
import {createSubtitleCues} from "./subtitle-cues";
import {viewerVisibleObjectIds} from "./viewer-visible-object-ids";

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

const sourceReceiptOnlyCardIds = (scene: RenderProductionData["scenes"][number]) => {
  const cardIds = new Set(scene.cards.map((card) => card.cardId));
  const uses = new Map<string, Set<string>>();
  for (const beat of scene.visualBeats) {
    for (const objectId of beat.objectIds) {
      if (!cardIds.has(objectId)) continue;
      const templates = uses.get(objectId) ?? new Set<string>();
      templates.add(beat.visualTemplate);
      uses.set(objectId, templates);
    }
  }
  return new Set(
    [...uses.entries()]
      .filter(([, templates]) => templates.size === 1 && templates.has("source-receipt"))
      .map(([cardId]) => cardId),
  );
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
  // The public subtitle layer renders time-sliced caption.text cues. speechText
  // remains the TTS surface and is intentionally allowed to differ.
  const cues = createSubtitleCues(chunk.caption.text, chunk.startMs, chunk.endMs);
  cues.forEach((cue, cueIndex) =>
    assertSubtitleCueTextFits(cue.text, `${path}.subtitleCues[${cueIndex}].text`),
  );
  return cues;
};

export const assertSpecLayoutFits = (data: RenderProductionData) => {
  data.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    const visibleObjectIds = viewerVisibleObjectIds(scene);
    const receiptOnlyCardIds = sourceReceiptOnlyCardIds(scene);
    assertWrapped(scene.headline, limits.headline.perLine, limits.headline.lines, `${base}.headline`, "headline");
    scene.supportingTexts.forEach((text, index) => assertWrapped(text, limits.supportingText.perLine, limits.supportingText.lines, `${base}.supportingTexts[${index}]`, "supporting text"));
    scene.narrationChunks.forEach((chunk, index) => assertNarrationChunkSubtitleLayoutFits(chunk, `${base}.narrationChunks[${index}]`));
    scene.cards.forEach((card, cardIndex) => {
      if (!visibleObjectIds.has(card.cardId)) return;
      // source-receipt is rendered by its own fail-closed responsive layout planner.
      // Do not re-apply generic card-board budgets to receipt-only card inventory.
      if (receiptOnlyCardIds.has(card.cardId)) return;
      assertWrapped(card.title, limits.cardTitle.perLine, limits.cardTitle.lines, `${base}.cards[${cardIndex}].title`, "card title");
      card.lines.forEach((line, lineIndex) => {
        assertWrapped(line.label, limits.cardLabel.perLine, limits.cardLabel.lines, `${base}.cards[${cardIndex}].lines[${lineIndex}].label`, "card label");
        assertWrapped(line.value, limits.cardValue.perLine, limits.cardValue.lines, `${base}.cards[${cardIndex}].lines[${lineIndex}].value`, "card value");
      });
    });
    scene.numbers.forEach((number, index) => {
      if (!visibleObjectIds.has(number.numberId)) return;
      assertLength(number.label, limits.numberLabel, `${base}.numbers[${index}].label`, "number label");
    });
    scene.nodes.forEach((node, index) => {
      if (!visibleObjectIds.has(node.nodeId)) return;
      assertLength(node.label, limits.nodeLabel, `${base}.nodes[${index}].label`, "node label");
    });
    scene.arrows.forEach((arrow, index) => {
      if (!visibleObjectIds.has(arrow.arrowId)) return;
      assertLength(arrow.label, limits.arrowLabel, `${base}.arrows[${index}].label`, "arrow label");
    });
    if (scene.sourceLabel) assertWrapped(scene.sourceLabel, limits.sourceLabel.perLine, limits.sourceLabel.lines, `${base}.sourceLabel`, "source label");

    scene.visualBeats.forEach((beat, beatIndex) => {
      const path = `${base}.visualBeats[${beatIndex}]`;
      // Candidate Catalog, immutable preflight, and composition-time validation
      // intentionally share one Template-static contract. Runtime remains the
      // final defense, but must not carry a second implementation that can drift.
      assertStaticTemplateSoundness(scene, beat, path);
    });
  });
  return data;
};
