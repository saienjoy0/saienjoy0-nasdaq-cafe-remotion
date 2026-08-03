import {createHash} from "node:crypto";
import type {RenderProductionData, RenderSpec} from "./render-spec";
import {assertProductionTextSafe, assertRenderSpecApprovedForCompile} from "./validate-render-spec";

export type SynthesizedChunk = {
  audioSrc: string;
  durationMs: number;
  audioPath?: string;
  cacheKey?: string;
  cacheHit?: boolean;
  sampleRate?: number;
  channels?: number;
  codec?: string;
};
export type ChunkSynthesizer = (value: {
  episodeId: string;
  sceneId: string;
  chunkId: string;
  speechText: string;
  voiceProfileId: string;
  pronunciations: RenderSpec["pronunciations"];
}) => Promise<SynthesizedChunk>;

export const compileRenderSpec = async (
  spec: RenderSpec,
  synthesize: ChunkSynthesizer,
  assetPaths: Record<string, string>,
  options: {inputSpecSha256?: string; onSynthesizedChunk?: (value: {sceneId: string; chunkId: string; audio: SynthesizedChunk}) => void} = {},
): Promise<RenderProductionData> => {
  assertRenderSpecApprovedForCompile(spec);
  let episodeFrame = 0;
  let previousTransitionFrames = 0;
  const scenes = [] as RenderProductionData["scenes"];
  for (const scene of spec.scenes) {
    let sceneMs = 0;
    const chunks = [] as RenderProductionData["scenes"][number]["narrationChunks"];
    for (const chunk of scene.narrationChunks) {
      const audio = await synthesize({
        episodeId: spec.episode.id,
        sceneId: scene.sceneId,
        chunkId: chunk.chunkId,
        speechText: chunk.speechText,
        voiceProfileId: spec.voiceProfileId,
        pronunciations: spec.pronunciations,
      });
      options.onSynthesizedChunk?.({sceneId: scene.sceneId, chunkId: chunk.chunkId, audio});
      const startMs = sceneMs;
      const endMs = startMs + audio.durationMs;
      chunks.push({
        chunkId: chunk.chunkId,
        speechText: chunk.speechText,
        caption: {text: chunk.captionText, startMs, endMs, timestampMs: null, confidence: null},
        expression: chunk.expression,
        pauseAfterMs: chunk.pauseAfterMs,
        audioSrc: audio.audioSrc,
        audioDurationMs: audio.durationMs,
        startMs,
        endMs,
        startFrame: Math.round((startMs * spec.episode.fps) / 1000),
        endFrame: Math.max(0, Math.ceil((endMs * spec.episode.fps) / 1000) - 1),
      });
      sceneMs = endMs + chunk.pauseAfterMs;
    }
    const visualBeats = scene.visualBeats.map((beat) => {
      const startChunk = chunks.find((chunk) => chunk.chunkId === beat.startChunkId);
      const endChunk = chunks.find((chunk) => chunk.chunkId === beat.endChunkId);
      if (!startChunk || !endChunk) {
        throw new Error(
          `$.scenes[${scene.sceneNumber - 1}].visualBeats: unknown chunk range ${beat.startChunkId}..${beat.endChunkId}`,
        );
      }
      const endMs = endChunk.endMs + endChunk.pauseAfterMs;
      return {
        ...beat,
        startMs: startChunk.startMs,
        endMs,
        startFrame: startChunk.startFrame,
        endFrame: Math.max(startChunk.startFrame, Math.ceil((endMs * spec.episode.fps) / 1000) - 1),
      };
    });
    const durationInFrames = Math.max(1, Math.ceil((sceneMs * spec.episode.fps) / 1000));
    const startFrame = Math.max(0, episodeFrame - previousTransitionFrames);
    const endFrame = startFrame + durationInFrames - 1;
    scenes.push({...scene, narrationChunks: chunks, visualBeats, durationMs: sceneMs, durationInFrames, startFrame, endFrame});
    episodeFrame = endFrame + 1;
    previousTransitionFrames = scene.transition.type === "fade"
      ? Math.max(1, Math.round((scene.transition.durationMs * spec.episode.fps) / 1000))
      : 0;
  }
  const data: RenderProductionData = {
    schemaVersion: "2.1.0-production",
    episode: spec.episode,
    editorial: spec.editorial,
    publishing: spec.publishing,
    sources: spec.sources,
    review: spec.review,
    pronunciations: spec.pronunciations,
    corrections: spec.corrections,
    voiceProfileId: spec.voiceProfileId,
    inputSpecSha256: options.inputSpecSha256 ?? createHash("sha256").update(JSON.stringify(spec)).digest("hex"),
    assets: Object.fromEntries([...new Set(spec.scenes.flatMap((scene) => scene.assetPlacements.map((placement) => placement.assetId)))].map((assetId) => [assetId, assetPaths[assetId]])),
    scenes,
    timeline: {
      totalDurationInFrames: episodeFrame,
      scenes: scenes.map(({sceneId, startFrame, endFrame, durationInFrames}) => ({sceneId, startFrame, endFrame, durationInFrames})),
    },
  };
  // shortenedReason is internal production metadata and is never rendered or voiced.
  // Keep public-text safety checks strict for every field that can reach the viewer.
  assertProductionTextSafe({
    ...data,
    episode: {...data.episode, shortenedReason: undefined},
  });
  return data;
};

export const resolveSceneStateAtChunk = (
  scene: RenderProductionData["scenes"][number],
  chunkId: string,
) => {
  const chunkIndex = scene.narrationChunks.findIndex((chunk) => chunk.chunkId === chunkId);
  if (chunkIndex < 0) throw new Error(`unknown chunkId: ${chunkId}`);
  const reached = new Set(scene.narrationChunks.slice(0, chunkIndex + 1).map((chunk) => chunk.chunkId));
  const visible = new Set<string>();
  const highlighted = new Set<string>();
  for (const event of scene.visualEvents.filter((item) => reached.has(item.atChunkId))) {
    if (event.action === "show" && event.targetId) visible.add(event.targetId);
    if (event.action === "hide" && event.targetId) visible.delete(event.targetId);
    if (event.action === "highlight" && event.targetId) highlighted.add(event.targetId);
    if (event.action === "unhighlight" && event.targetId) highlighted.delete(event.targetId);
  }
  return {expression: scene.narrationChunks[chunkIndex].expression, visible, highlighted};
};
