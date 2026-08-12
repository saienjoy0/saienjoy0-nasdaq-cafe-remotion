import type {RenderSpec} from "./render-spec";
import {planSourceReceiptLayout} from "./template-layout/source-receipt-layout";
import {assertViewerSurfacePolicy} from "./viewer-surface-policy";

const unique = <T,>(values: T[]) => [...new Set(values)];

export const preflightViewerSurface = (spec: RenderSpec) => {
  const viewer = assertViewerSurfacePolicy(spec);
  let sourceReceiptCount = 0;
  for (const scene of spec.scenes) {
    const numberById = new Map(scene.numbers.map((item) => [item.numberId, item] as const));
    const cardById = new Map(scene.cards.map((item) => [item.cardId, item] as const));
    for (const beat of scene.visualBeats) {
      if (beat.visualTemplate !== "source-receipt") continue;
      sourceReceiptCount += 1;
      const visibleNumbers = beat.objectIds
        .map((id) => numberById.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      if (visibleNumbers.some((item) => item.numericValue == null)) {
        throw new Error(
          `E_SOURCE_RECEIPT_NON_NUMERIC_NUMBER:${scene.sceneId}/${beat.beatId}`,
        );
      }
      const visibleCards = beat.objectIds
        .map((id) => cardById.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const evidence = unique([
        ...visibleCards.flatMap((card) =>
          card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title],
        ),
        ...beat.viewerTexts,
      ].filter((value) => value.trim().length > 0)).slice(0, 5);
      planSourceReceiptLayout({
        primaryElement: beat.primaryElement || scene.headline,
        screenQuestion: beat.screenQuestion,
        evidence,
        comparisonBasis: beat.templateConfig.comparisonBasis,
      });
    }
  }
  return {status: "PASS" as const, viewerChecked: viewer.checked, sourceReceiptCount};
};
