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
const TOKEN_PATTERN = /[$+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:%|[A-Za-z]+)?|[A-Za-z][A-Za-z0-9]*(?:[._'/-][A-Za-z0-9]+)*|\s|./gu;

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
  let line = "";
  for (const token of boundedTokens(normalized)) {
    if (line && Array.from(line + token).length > MAX_LINE_CHARS) {
      lines.push(line);
      line = token;
    } else {
      line += token;
    }
  }
  if (line) lines.push(line);

  const pages: string[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    pages.push(lines.slice(index, index + 2).join("\n"));
  }
  return pages;
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
