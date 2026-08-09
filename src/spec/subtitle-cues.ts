export type SubtitleCue = {
  text: string;
  startMs: number;
  endMs: number;
};

const MAX_PAGE_CHARS = 44;
const MAX_LINE_CHARS = 22;
const cache = new Map<string, SubtitleCue[]>();

const visibleLength = (value: string) => Array.from(value.replace(/\s+/gu, "")).length;

const normalizeSpeech = (value?: string) => (value ?? "")
  .replace(/\r\n?/gu, "\n")
  .replace(/[\t ]+/gu, " ")
  .replace(/\n+/gu, " ")
  .trim();


const KANJI_DIGITS: Record<string, number> = {
  "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
  "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
};

const parseJapaneseInteger = (value: string): number | null => {
  const chars = Array.from(value);
  if (chars.length === 0) return null;
  if (chars.every((char) => char in KANJI_DIGITS)) {
    return Number(chars.map((char) => KANJI_DIGITS[char]).join(""));
  }
  const smallUnits: Record<string, number> = {"十": 10, "百": 100, "千": 1000};
  let total = 0;
  let section = 0;
  let digit: number | null = null;
  for (const char of chars) {
    if (char in KANJI_DIGITS) {
      digit = KANJI_DIGITS[char];
      continue;
    }
    if (char in smallUnits) {
      section += (digit ?? 1) * smallUnits[char];
      digit = null;
      continue;
    }
    if (char === "万") {
      section += digit ?? 0;
      total += (section || 1) * 10_000;
      section = 0;
      digit = null;
      continue;
    }
    return null;
  }
  return total + section + (digit ?? 0);
};

const parseJapaneseNumber = (value: string): string | null => {
  const [integerPart, fractionPart] = value.split("・");
  const integer = parseJapaneseInteger(integerPart);
  if (integer === null) return null;
  if (!fractionPart) return String(integer);
  const fraction = Array.from(fractionPart).map((char) => char in KANJI_DIGITS ? String(KANJI_DIGITS[char]) : "").join("");
  return fraction.length > 0 ? `${integer}.${fraction}` : String(integer);
};

export const normalizeSubtitleDisplayNumerals = (value: string) => {
  const numeral = "[〇零一二三四五六七八九十百千万]+(?:・[〇零一二三四五六七八九]+)?";
  const convert = (raw: string) => parseJapaneseNumber(raw) ?? raw;
  let output = value.replace(new RegExp(`第(${numeral})(?=に|、|。|：|:|\\s|$)`, "gu"), (_match, raw: string) => `第${convert(raw)}`);
  output = output.replace(
    new RegExp(`(${numeral})(パーセント|億ドル|兆ドル|億円|兆円|ギガワット|年|月|日|時|分|倍|点|社|つ|人|件|個|期|四半期)`, "gu"),
    (_match, raw: string, suffix: string) => `${convert(raw)}${suffix === "パーセント" ? "%" : suffix}`,
  );
  return output;
};

const hardSplit = (value: string, maxChars: number) => {
  const characters = Array.from(value);
  const parts: string[] = [];
  for (let offset = 0; offset < characters.length; offset += maxChars) {
    parts.push(characters.slice(offset, offset + maxChars).join(""));
  }
  return parts;
};

const sentenceParts = (speechText?: string) => {
  const normalized = normalizeSpeech(speechText);
  if (!normalized) return [];
  return normalized.match(/[^。！？!?]+[。！？!?]?/gu) ?? [normalized];
};

const clauseParts = (sentence: string) => {
  if (visibleLength(sentence) <= MAX_PAGE_CHARS) return [sentence];
  const clauses = sentence.match(/[^、，,]+[、，,]?/gu) ?? [sentence];
  return clauses.flatMap((clause) => visibleLength(clause) > MAX_PAGE_CHARS
    ? hardSplit(clause, MAX_PAGE_CHARS)
    : [clause]);
};

const buildPages = (speechText?: string) => {
  const units = sentenceParts(speechText).flatMap(clauseParts);
  const pages: string[] = [];
  let current = "";
  for (const unit of units) {
    if (!current) {
      current = unit;
      continue;
    }
    if (visibleLength(current + unit) <= MAX_PAGE_CHARS) {
      current += unit;
      continue;
    }
    pages.push(current);
    current = unit;
  }
  if (current) pages.push(current);
  return pages.flatMap((page) => visibleLength(page) > MAX_PAGE_CHARS
    ? hardSplit(page, MAX_PAGE_CHARS)
    : [page]);
};

const findLineBreak = (characters: string[]) => {
  // A subtitle page can contain up to two 22-character lines. Prefer a
  // punctuation boundary only when BOTH resulting lines fit the public safe
  // area; otherwise a punctuation-first split can leave a 23+ character tail.
  const minimum = Math.max(1, characters.length - MAX_LINE_CHARS);
  const maximum = Math.min(MAX_LINE_CHARS, characters.length - 1);
  for (let index = maximum; index >= minimum; index--) {
    if (/[、，,。！？!?]/u.test(characters[index - 1] ?? "")) return index;
  }
  return Math.min(maximum, Math.max(minimum, Math.ceil(characters.length / 2)));
};

const formatPage = (value: string) => {
  const characters = Array.from(value);
  if (characters.length <= MAX_LINE_CHARS) return value;
  const splitAt = findLineBreak(characters);
  return `${characters.slice(0, splitAt).join("")}\n${characters.slice(splitAt).join("")}`;
};

const speechWeight = (value: string) => Array.from(value).reduce((total, character) => {
  if (/\s/u.test(character)) return total;
  if (/[。！？!?]/u.test(character)) return total + 3.2;
  if (/[、，,]/u.test(character)) return total + 1.6;
  return total + 1;
}, 0);

export const createSubtitleCues = (
  speechText: string | undefined,
  startMs: number,
  endMs: number,
): SubtitleCue[] => {
  const normalizedSpeech = normalizeSubtitleDisplayNumerals(normalizeSpeech(speechText));
  const cacheKey = `${startMs}:${endMs}:${normalizedSpeech}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pages = buildPages(normalizedSpeech);
  if (pages.length === 0 || endMs <= startMs) return [];

  const totalDurationMs = endMs - startMs;
  const weights = pages.map((page) => Math.max(1, speechWeight(page)));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const fixedPerCueMs = Math.min(650, (totalDurationMs / pages.length) * 0.35);
  const weightedDurationMs = Math.max(0, totalDurationMs - fixedPerCueMs * pages.length);

  let cursor = startMs;
  const cues = pages.map((page, index): SubtitleCue => {
    const duration = index === pages.length - 1
      ? endMs - cursor
      : fixedPerCueMs + weightedDurationMs * (weights[index] / totalWeight);
    const cueStart = cursor;
    const cueEnd = index === pages.length - 1 ? endMs : Math.min(endMs, cursor + duration);
    cursor = cueEnd;
    return {
      text: formatPage(page),
      startMs: cueStart,
      endMs: cueEnd,
    };
  });
  cache.set(cacheKey, cues);
  return cues;
};

export const getSubtitleTextAtTime = (
  speechText: string | undefined,
  startMs: number,
  endMs: number,
  timeMs: number,
) => createSubtitleCues(speechText, startMs, endMs).find(
  (cue) => cue.startMs <= timeMs && timeMs < cue.endMs,
)?.text ?? null;
