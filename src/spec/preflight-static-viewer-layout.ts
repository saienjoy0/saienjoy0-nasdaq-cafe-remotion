import type {RenderSpec} from "./render-spec";
import {assertStaticTemplateSoundness} from "./static-template-soundness";
import {viewerVisibleObjectIds} from "./viewer-visible-object-ids";

// These are the same public-surface budgets enforced again at composition time
// by validate-render-layout.ts. This preflight exists at the render_spec boundary
// so an immutable handoff cannot pass validation and fail only after Chrome starts.
const limits = {
  headline: {perLine: 26, lines: 1},
  supportingText: {perLine: 28, lines: 3},
  cardTitle: {perLine: 18, lines: 2},
  cardLabel: {perLine: 24, lines: 2},
  cardValue: {perLine: 28, lines: 3},
  numberLabel: 42,
  nodeLabel: 42,
  arrowLabel: 42,
  sourceLabel: {perLine: 52, lines: 1},
} as const;

const lengthOf = (value: string) => Array.from(value).length;

const assertLength = (value: string, limit: number, path: string, area: string) => {
  const length = lengthOf(value);
  if (length > limit) {
    throw new Error(`${path}: ${length} characters exceed ${area} limit ${limit}`);
  }
};

const assertWrapped = (
  value: string,
  perLine: number,
  lines: number,
  path: string,
  area: string,
) => {
  const explicitLines = value.split(/\r?\n/);
  if (explicitLines.length > lines) {
    throw new Error(`${path}: ${area} exceeds ${lines} lines`);
  }
  explicitLines.forEach((line, index) =>
    assertLength(line, perLine, `${path}[line ${index + 1}]`, area),
  );
  const total = lengthOf(value.replace(/\r?\n/g, ""));
  if (total > perLine * lines) {
    throw new Error(`${path}: ${total} characters exceed ${area} capacity ${perLine * lines}`);
  }
};

const sourceReceiptOnlyCardIds = (scene: RenderSpec["scenes"][number]) => {
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

export const preflightStaticViewerLayout = (spec: RenderSpec) => {
  spec.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    const visibleObjectIds = viewerVisibleObjectIds(scene);
    const receiptOnlyCardIds = sourceReceiptOnlyCardIds(scene);
    assertWrapped(
      scene.headline,
      limits.headline.perLine,
      limits.headline.lines,
      `${base}.headline`,
      "headline",
    );
    scene.supportingTexts.forEach((text, index) =>
      assertWrapped(
        text,
        limits.supportingText.perLine,
        limits.supportingText.lines,
        `${base}.supportingTexts[${index}]`,
        "supporting text",
      ),
    );
    scene.cards.forEach((card, cardIndex) => {
      if (!visibleObjectIds.has(card.cardId)) return;
      // source-receipt has its own fail-closed responsive planner with a stacked
      // layout budget (up to 56 visible title characters). Applying the generic
      // 18-character card-board budget first creates a contradictory double gate.
      // Generic budgets still apply if the same card is visible in any other Template.
      if (receiptOnlyCardIds.has(card.cardId)) return;
      assertWrapped(
        card.title,
        limits.cardTitle.perLine,
        limits.cardTitle.lines,
        `${base}.cards[${cardIndex}].title`,
        "card title",
      );
      card.lines.forEach((line, lineIndex) => {
        assertWrapped(
          line.label,
          limits.cardLabel.perLine,
          limits.cardLabel.lines,
          `${base}.cards[${cardIndex}].lines[${lineIndex}].label`,
          "card label",
        );
        assertWrapped(
          line.value,
          limits.cardValue.perLine,
          limits.cardValue.lines,
          `${base}.cards[${cardIndex}].lines[${lineIndex}].value`,
          "card value",
        );
      });
    });
    scene.numbers.forEach((number, index) => {
      if (!visibleObjectIds.has(number.numberId)) return;
      assertLength(
        number.label,
        limits.numberLabel,
        `${base}.numbers[${index}].label`,
        "number label",
      );
    });
    scene.nodes.forEach((node, index) => {
      if (!visibleObjectIds.has(node.nodeId)) return;
      assertLength(
        node.label,
        limits.nodeLabel,
        `${base}.nodes[${index}].label`,
        "node label",
      );
    });
    scene.arrows.forEach((arrow, index) => {
      if (!visibleObjectIds.has(arrow.arrowId)) return;
      assertLength(
        arrow.label,
        limits.arrowLabel,
        `${base}.arrows[${index}].label`,
        "arrow label",
      );
    });
    if (scene.sourceLabel) {
      assertWrapped(
        scene.sourceLabel,
        limits.sourceLabel.perLine,
        limits.sourceLabel.lines,
        `${base}.sourceLabel`,
        "source label",
      );
    }
    if (spec.schemaVersion === "2.4.0" || spec.schemaVersion === "2.5.0") {
      scene.visualBeats.forEach((beat, beatIndex) =>
        assertStaticTemplateSoundness(scene, beat, `${base}.visualBeats[${beatIndex}]`),
      );
    }
  });
  return spec;
};