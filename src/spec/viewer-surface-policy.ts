import type {RenderSpec} from "./render-spec";

const NUMERIC_KANJI = "〇零一二三四五六七八九十百千万億兆";
// Japanese magnitude characters remain useful display units after an Arabic
// coefficient (for example 5,000億ドル / 25.8億ドル). Do not reinterpret that unit
// suffix as an unconverted Japanese numeral. A genuine Japanese numeral still starts
// at a non-Arabic boundary and therefore fails closed.
const NUMERIC_CONTEXT = new RegExp(
  `(?<![0-9,.])[${NUMERIC_KANJI}・]+(?=(?:パーセント|%|ドル|円|時|分|秒|年|月|日|回|件|社|人|位|番目|段|つ|分足))`,
  "u",
);
const NUMERIC_PREFIX = new RegExp(`第[${NUMERIC_KANJI}・]+`, "u");
const FIXED_UI_ENGLISH = /^(?:EXPECTED|ACTUAL|GAP)(?:$|｜)/u;

export const assertViewerTextSafe = (value: string, path: string) => {
  if (NUMERIC_CONTEXT.test(value) || NUMERIC_PREFIX.test(value)) {
    throw new Error(`E_VIEWER_NUMERIC_KANJI_REMAINS:${path}:${value}`);
  }
  if (FIXED_UI_ENGLISH.test(value)) {
    throw new Error(`E_VIEWER_FIXED_UI_ENGLISH:${path}:${value}`);
  }
};

const pushText = (rows: Array<[string, string]>, path: string, value: unknown) => {
  if (typeof value === "string" && value.trim()) rows.push([path, value]);
};

export const collectViewerSurfaceStrings = (spec: RenderSpec) => {
  const rows: Array<[string, string]> = [];
  spec.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    pushText(rows, `${base}.headline`, scene.headline);
    scene.supportingTexts.forEach((value, index) =>
      pushText(rows, `${base}.supportingTexts[${index}]`, value),
    );
    scene.narrationChunks.forEach((chunk, index) =>
      pushText(rows, `${base}.narrationChunks[${index}].captionText`, chunk.captionText),
    );
    scene.cards.forEach((card, cardIndex) => {
      pushText(rows, `${base}.cards[${cardIndex}].title`, card.title);
      card.lines.forEach((line, lineIndex) => {
        pushText(rows, `${base}.cards[${cardIndex}].lines[${lineIndex}].label`, line.label);
        pushText(rows, `${base}.cards[${cardIndex}].lines[${lineIndex}].value`, line.value);
      });
    });
    scene.visualBeats.forEach((beat, beatIndex) => {
      const beatBase = `${base}.visualBeats[${beatIndex}]`;
      pushText(rows, `${beatBase}.screenQuestion`, beat.screenQuestion);
      pushText(rows, `${beatBase}.primaryElement`, beat.primaryElement);
      beat.viewerTexts.forEach((value, index) =>
        pushText(rows, `${beatBase}.viewerTexts[${index}]`, value),
      );
    });
  });
  return rows;
};

export const assertViewerSurfacePolicy = (spec: RenderSpec) => {
  collectViewerSurfaceStrings(spec).forEach(([path, value]) => assertViewerTextSafe(value, path));
  return {status: "PASS" as const, checked: collectViewerSurfaceStrings(spec).length};
};
