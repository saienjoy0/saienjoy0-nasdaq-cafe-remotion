export type SpeechSegment = {
  displayText: string;
  speechText: string;
  terminalPauseMs: number;
};

const splitLongText = (text: string, maximum = 80) => {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maximum) {
    const window = remaining.slice(0, maximum + 1);
    const candidates = ["、", "，", " "];
    const cut = Math.max(...candidates.map((token) => window.lastIndexOf(token)));
    const index = cut >= 25 ? cut + 1 : maximum;
    chunks.push(remaining.slice(0, index));
    remaining = remaining.slice(index);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
};

export const segmentDisplayText = (
  displayText: string,
  normalize: (text: string) => string,
): SpeechSegment[] => {
  const sentenceParts = displayText
    .split(/(?<=[。！？!?])|\n+/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .flatMap((value) => splitLongText(value));

  const merged: string[] = [];
  for (const part of sentenceParts) {
    const previous = merged.at(-1);
    if (previous && previous.length < 25 && previous.length + part.length <= 80) {
      merged[merged.length - 1] = `${previous}${part}`;
    } else {
      merged.push(part);
    }
  }

  return merged.map((text) => ({
    displayText: text,
    speechText: normalize(text),
    terminalPauseMs: /[。！？!?]$/u.test(text) ? 280 : 160,
  }));
};
