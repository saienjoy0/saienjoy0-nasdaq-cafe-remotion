import type {RenderProductionData, RenderSpec} from "./render-spec";

export const PRODUCTION_FORBIDDEN_TEXT = [
  "fallback", "実測", "表示中", "画面構成：", "AUDIO-MEASURED",
  "conversion warning", "debug metadata", "タイトルの約束を回収", "図を再表示",
] as const;

type ProductionTextSource = RenderSpec | RenderProductionData;

const assertStringSafe = (value: string, path: string) => {
  const lower = value.toLowerCase();
  const found = PRODUCTION_FORBIDDEN_TEXT.find((item) => lower.includes(item.toLowerCase()));
  if (found) throw new Error(`${path}: production forbidden text: ${found}`);
};

const assertStringsSafe = (values: string[], path: string) => {
  values.forEach((value, index) => assertStringSafe(value, `${path}[${index}]`));
};

export const assertProductionTextSafe = (value: ProductionTextSource): void => {
  assertStringSafe(value.publishing.recommendedTitle, "$.publishing.recommendedTitle");
  assertStringsSafe(value.publishing.titleCandidates, "$.publishing.titleCandidates");
  assertStringSafe(value.publishing.recommendedThumbnailText, "$.publishing.recommendedThumbnailText");
  assertStringsSafe(value.publishing.thumbnailTextCandidates, "$.publishing.thumbnailTextCandidates");
  assertStringSafe(value.publishing.description, "$.publishing.description");

  value.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    assertStringSafe(scene.headline, `${base}.headline`);
    assertStringsSafe(scene.supportingTexts, `${base}.supportingTexts`);
    if (scene.sourceLabel) assertStringSafe(scene.sourceLabel, `${base}.sourceLabel`);

    scene.narrationChunks.forEach((chunk, chunkIndex) => {
      const chunkBase = `${base}.narrationChunks[${chunkIndex}]`;
      assertStringSafe(chunk.speechText, `${chunkBase}.speechText`);
      if ("caption" in chunk) {
        assertStringSafe(chunk.caption.text, `${chunkBase}.caption.text`);
      } else {
        assertStringSafe(chunk.captionText, `${chunkBase}.captionText`);
      }
    });

    scene.visualBeats.forEach((beat, beatIndex) => {
      const beatBase = `${base}.visualBeats[${beatIndex}]`;
      assertStringsSafe(beat.viewerTexts, `${beatBase}.viewerTexts`);
      if (beat.entity) {
        assertStringSafe(beat.entity.displayName, `${beatBase}.entity.displayName`);
        assertStringSafe(beat.entity.role, `${beatBase}.entity.role`);
      }
    });

    scene.cards.forEach((card, cardIndex) => {
      const cardBase = `${base}.cards[${cardIndex}]`;
      assertStringSafe(card.title, `${cardBase}.title`);
      card.lines.forEach((line, lineIndex) => {
        const lineBase = `${cardBase}.lines[${lineIndex}]`;
        assertStringSafe(line.label, `${lineBase}.label`);
        assertStringSafe(line.value, `${lineBase}.value`);
      });
    });

    scene.numbers.forEach((number, numberIndex) => {
      const numberBase = `${base}.numbers[${numberIndex}]`;
      assertStringSafe(number.label, `${numberBase}.label`);
      assertStringSafe(number.value, `${numberBase}.value`);
      if (number.unit) assertStringSafe(number.unit, `${numberBase}.unit`);
      if (number.comparison) assertStringSafe(number.comparison, `${numberBase}.comparison`);
    });

    scene.nodes.forEach((node, nodeIndex) => {
      assertStringSafe(node.label, `${base}.nodes[${nodeIndex}].label`);
    });
    scene.arrows.forEach((arrow, arrowIndex) => {
      if (arrow.label) assertStringSafe(arrow.label, `${base}.arrows[${arrowIndex}].label`);
    });
  });
};
