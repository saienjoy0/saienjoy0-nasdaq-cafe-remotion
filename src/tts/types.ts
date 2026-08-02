export type TtsRequest = {
  displayText: string;
  speechText: string;
  voiceProfile: string;
  speakingRate?: number;
  pitchScale?: number;
  intonationScale?: number;
  volumeScale?: number;
  styleInstruction?: string;
  outputFormat: "wav";
  requestAlignment?: boolean;
  outputPath: string;
};

export type TtsAlignment = {
  text: string;
  startMs: number;
  endMs: number;
};

export type TtsResult = {
  audioPath: string;
  durationMs: number;
  provider: string;
  providerVersion?: string;
  model?: string;
  providerVoiceId: string;
  voiceProfile: string;
  alignment?: TtsAlignment[];
  sampleRate: number;
  channels: number;
  fileSizeBytes: number;
  sha256: string;
  cacheKey: string;
  generatedAt: string;
};

export type TtsCapabilities = {
  styleInstructions: boolean;
  emotionControl: boolean;
  wordAlignment: boolean;
  phraseAlignment: boolean;
  voiceCloning: boolean;
  streaming: boolean;
  outputFormats: string[];
};

export type SelectedVoice = {
  characterName: string;
  styleName: string;
  styleId: number;
  speakerUuid: string;
  engineVersion: string;
};

export interface TtsProvider {
  readonly name: string;
  readonly capabilities: TtsCapabilities;
  selectVoice(): Promise<SelectedVoice>;
  synthesize(
    request: TtsRequest,
    voice: SelectedVoice,
  ): Promise<{providerVersion: string}>;
}
