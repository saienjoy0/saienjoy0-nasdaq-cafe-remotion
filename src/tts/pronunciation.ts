import dictionary from "../../config/pronunciation-dictionary.json";

export type PronunciationChange = {
  display: string;
  speech: string;
  count: number;
};

export const pronunciationDictionaryVersion = dictionary.version;

export const normalizeSpeech = (displayText: string) => {
  let speechText = displayText;
  const changes: PronunciationChange[] = [];
  for (const entry of dictionary.entries) {
    const parts = speechText.split(entry.display);
    const count = parts.length - 1;
    if (count > 0) {
      speechText = parts.join(entry.speech);
      changes.push({...entry, count});
    }
  }
  return {speechText, changes};
};
