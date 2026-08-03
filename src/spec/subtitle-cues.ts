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
  const minimum = Math.max(10, Math.ceil(characters.length / 2) - 4);
  const maximum = Math.min(MAX_LINE_CHARS, characters.length - 1);
  for (let index = maximum; index >= minimum; index--) {
    if (/[、，,。！？!?]/u.test(characters[index - 1] ?? "")) return index;
  }
  return Math.min(MAX_LINE_CHARS, Math.ceil(characters.length / 2));
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
  const normalizedSpeech = normalizeSpeech(speechText);
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
