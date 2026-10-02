export type SubtitleCue = {
  text: string;
  startMs: number;
  endMs: number;
};

const MAX_LINE_CHARS = 22;
const cache = new Map<string, SubtitleCue[]>();

const normalizeSpeech = (value?: string) => (value ?? "")
  .replace(/\r\n?/gu, "\n")
  .replace(/[\t ]+/gu, " ")
  .replace(/\n+/gu, " ")
  .trim();

// Keep Latin words and financial expressions atomic when they fit. Everything
// else remains a single code point so Japanese can wrap at any safe boundary.
const LATIN_TOKEN = String.raw`[\p{Script=Latin}][\p{Script=Latin}\p{M}\d]*(?:[._'’/&‐‑-][\p{Script=Latin}\p{M}\d]+)*`;
const CURRENCY = String.raw`(?:[\p{Script=Latin}]{1,3})?\p{Sc}`;
const NUMBER_TOKEN = String.raw`(?:[-+−]?(?:${CURRENCY})?|${CURRENCY}[-+−])(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:%|${LATIN_TOKEN})?`;
const TOKEN_PATTERN = new RegExp(`${NUMBER_TOKEN}|${LATIN_TOKEN}|\\s|.`, "gu");
const CLOSING_PUNCTUATION = /^[、。，．！？!?.,;:；：…"'\p{Pe}\p{Pf}]+$/u;
const isClosingPunctuation = (value: string) => CLOSING_PUNCTUATION.test(value.replace(/\s/gu, ""));

const subtitleTokens = (value: string) => value.match(TOKEN_PATTERN) ?? [];

const boundedTokens = (value: string) => subtitleTokens(value).flatMap((token) => {
  const characters = Array.from(token);
  if (characters.length <= MAX_LINE_CHARS) return [token];
  const parts: string[] = [];
  for (let offset = 0; offset < characters.length; offset += MAX_LINE_CHARS) {
    parts.push(characters.slice(offset, offset + MAX_LINE_CHARS).join(""));
  }
  return parts;
});

const buildPages = (speechText?: string) => {
  const normalized = normalizeSpeech(speechText);
  if (!normalized) return [];

  const lines: string[] = [];
  let lineTokens: string[] = [];
  for (const token of boundedTokens(normalized)) {
    const line = lineTokens.join("");
    if (line && Array.from(line + token).length > MAX_LINE_CHARS) {
      // Move the last complete text token with closing punctuation when it fits.
      // This preserves atomic words while keeping a sentence ending readable.
      let suffixStart = lineTokens.length;
      if (isClosingPunctuation(token)) {
        while (suffixStart > 0 && !/[\p{L}\p{N}]/u.test(lineTokens[suffixStart - 1])) suffixStart -= 1;
        if (suffixStart > 0) suffixStart -= 1;
      }
      const suffix = lineTokens.slice(suffixStart);
      if (suffixStart > 0 && Array.from(suffix.join("") + token).length <= MAX_LINE_CHARS) {
        lines.push(lineTokens.slice(0, suffixStart).join(""));
        lineTokens = [...suffix, token];
      } else {
        lines.push(line);
        lineTokens = [token];
      }
    } else {
      lineTokens.push(token);
    }
  }
  if (lineTokens.length) lines.push(lineTokens.join(""));

  const pages: string[][] = [];
  for (const line of lines) {
    const previousPage = pages.at(-1);
    if (!previousPage || previousPage.length === 2) {
      // A full-width word and its punctuation cannot share a line. Keep them
      // in the same cue by moving the preceding line into the new page.
      const carriedLine = previousPage && isClosingPunctuation(line)
        ? previousPage.pop()
        : undefined;
      pages.push(carriedLine === undefined ? [line] : [carriedLine, line]);
    } else {
      previousPage.push(line);
    }
  }
  return pages.map((page) => page.join("\n"));
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
      text: page,
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
