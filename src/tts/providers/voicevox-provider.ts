import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import type {
  SelectedVoice,
  TtsCapabilities,
  TtsProvider,
  TtsRequest,
} from "../types";

type VoicevoxStyle = {name: string; id: number; type?: string};
type VoicevoxSpeaker = {
  name: string;
  speaker_uuid: string;
  styles: VoicevoxStyle[];
};

const CHARACTER_PRIORITIES = ["男声2", "男性2", "玄野武宏", "青山龍星"];
const STYLE_PRIORITIES = ["ノーマル", "通常"];

const fetchWithRetry = async (
  input: string,
  init?: RequestInit,
  attempts = 3,
): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(input, init);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
    }
  }
  throw new Error(
    `VOICEVOXリクエストが${attempts}回失敗しました: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
};

export class VoicevoxProvider implements TtsProvider {
  public readonly name = "voicevox";
  public readonly capabilities: TtsCapabilities = {
    styleInstructions: false,
    emotionControl: false,
    wordAlignment: false,
    phraseAlignment: false,
    voiceCloning: false,
    streaming: false,
    outputFormats: ["wav"],
  };

  public constructor(
    private readonly baseUrl =
      process.env.VOICEVOX_BASE_URL ?? "http://127.0.0.1:50021",
  ) {}

  public async getEngineVersion() {
    const response = await fetchWithRetry(`${this.baseUrl}/version`);
    const value = (await response.json()) as unknown;
    return typeof value === "string" ? value : String(value);
  }

  public async getSpeakers() {
    const response = await fetchWithRetry(`${this.baseUrl}/speakers`);
    const speakers = (await response.json()) as VoicevoxSpeaker[];
    if (!Array.isArray(speakers) || speakers.length === 0) {
      throw new Error("VOICEVOX /speakersが空です");
    }
    return speakers;
  }

  public async assertFixedVoice(profile: {speakerUuid: string; styleId: number; characterName: string; styleName: string}) {
    const [speakers, engineVersion] = await Promise.all([this.getSpeakers(), this.getEngineVersion()]);
    const speaker = speakers.find((candidate) => candidate.speaker_uuid === profile.speakerUuid);
    if (!speaker) throw new Error(`VOICEVOX /speakers: speaker UUID not found: ${profile.speakerUuid}`);
    if (speaker.name !== profile.characterName) throw new Error(`VOICEVOX /speakers: character mismatch for ${profile.speakerUuid}: expected ${profile.characterName}, got ${speaker.name}`);
    const style = speaker.styles.find((candidate) => candidate.id === profile.styleId);
    if (!style) throw new Error(`VOICEVOX /speakers: style ID ${profile.styleId} does not belong to ${profile.speakerUuid}`);
    if (style.name !== profile.styleName) throw new Error(`VOICEVOX /speakers: style name mismatch for ${profile.styleId}: expected ${profile.styleName}, got ${style.name}`);
    return {engineVersion, speakerUuid: speaker.speaker_uuid, characterName: speaker.name, styleId: style.id, styleName: style.name};
  }

  public async selectVoice(): Promise<SelectedVoice> {
    const [speakers, engineVersion] = await Promise.all([
      this.getSpeakers(),
      this.getEngineVersion(),
    ]);

    const explicitlyRequested = process.env.VOICEVOX_CHARACTER_NAME?.trim();
    const priorities = explicitlyRequested
      ? [explicitlyRequested, ...CHARACTER_PRIORITIES]
      : CHARACTER_PRIORITIES;
    let speaker = priorities
      .map((name) => speakers.find((candidate) => candidate.name === name))
      .find((candidate): candidate is VoicevoxSpeaker => Boolean(candidate));

    if (!speaker) {
      const maleLeaningNames = [
        "剣崎雌雄",
        "白上虎太郎",
        "†聖騎士 紅桜†",
        "雀松朱司",
        "麒ヶ島宗麟",
        "栗田まろん",
        "離途",
        "黒沢冴白",
      ];
      speaker = maleLeaningNames
        .map((name) => speakers.find((candidate) => candidate.name === name))
        .find((candidate): candidate is VoicevoxSpeaker => Boolean(candidate));
    }
    if (!speaker) {
      speaker = speakers[0];
    }

    const explicitlyRequestedStyle = process.env.VOICEVOX_STYLE_NAME?.trim();
    const stylePriorities = explicitlyRequestedStyle
      ? [explicitlyRequestedStyle, ...STYLE_PRIORITIES]
      : STYLE_PRIORITIES;
    const style =
      stylePriorities
        .map((name) => speaker.styles.find((candidate) => candidate.name === name))
        .find((candidate): candidate is VoicevoxStyle => Boolean(candidate)) ??
      speaker.styles[0];
    if (!style) {
      throw new Error(`VOICEVOX話者 ${speaker.name} にstyleがありません`);
    }

    return {
      characterName: speaker.name,
      styleName: style.name,
      styleId: style.id,
      speakerUuid: speaker.speaker_uuid,
      engineVersion,
    };
  }

  public async synthesize(request: TtsRequest, voice: SelectedVoice) {
    const queryUrl = new URL(`${this.baseUrl}/audio_query`);
    queryUrl.searchParams.set("text", request.speechText);
    queryUrl.searchParams.set("speaker", String(voice.styleId));
    const queryResponse = await fetchWithRetry(queryUrl.toString(), {
      method: "POST",
    });
    const query = (await queryResponse.json()) as Record<string, unknown>;
    query.speedScale = request.speakingRate ?? 1.05;
    query.pitchScale = request.pitchScale ?? 0;
    query.intonationScale = request.intonationScale ?? 1;
    query.volumeScale = request.volumeScale ?? 1;

    const synthesisUrl = new URL(`${this.baseUrl}/synthesis`);
    synthesisUrl.searchParams.set("speaker", String(voice.styleId));
    const synthesisResponse = await fetchWithRetry(synthesisUrl.toString(), {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(query),
    });
    const audio = Buffer.from(await synthesisResponse.arrayBuffer());
    if (audio.length < 44 || audio.subarray(0, 4).toString("ascii") !== "RIFF") {
      throw new Error("VOICEVOX synthesisが正常なWAVを返しませんでした");
    }
    await mkdir(path.dirname(request.outputPath), {recursive: true});
    await writeFile(request.outputPath, audio);
    return {providerVersion: voice.engineVersion};
  }
}
