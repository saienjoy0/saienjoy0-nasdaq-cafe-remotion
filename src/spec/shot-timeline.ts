import type {ProductionScene, ProductionVisualBeat} from "./render-spec";

export type ProductionShot = NonNullable<ProductionVisualBeat["shots"]>[number];
export type ResolvedShot = ProductionShot & {
  startMs: number;
  endMs: number;
  progress: number;
};
export type ActiveShotState = {
  shot: ResolvedShot | null;
  previousShot: ResolvedShot | null;
  nextShot: ResolvedShot | null;
  shotIndex: number | null;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const normalize = (value: string) => value.replace(/\s+/gu, "").trim();

const chunkById = (scene: ProductionScene, chunkId: string) => {
  const chunk = scene.narrationChunks.find((item) => item.chunkId === chunkId);
  if (!chunk) throw new Error(`$.scenes[${scene.sceneNumber - 1}].visualBeats.shots: unknown chunk ${chunkId}`);
  return chunk;
};

const cueProgress = (
  speechText: string,
  cue: string | undefined,
  edge: "start" | "end",
  fallbackProgress: number,
) => {
  if (!cue) return null;
  const speech = normalize(speechText);
  const needle = normalize(cue);
  if (!needle || speech.length === 0) return null;
  const occurrences: number[] = [];
  let from = 0;
  while (from <= speech.length - needle.length) {
    const index = speech.indexOf(needle, from);
    if (index < 0) break;
    occurrences.push(index);
    from = index + 1;
  }
  if (occurrences.length === 0) return null;
  const target = clamp(fallbackProgress) * speech.length;
  const index = occurrences.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
  return clamp((index + (edge === "end" ? needle.length : 0)) / speech.length);
};

const pointInsideChunk = (
  chunk: ProductionScene["narrationChunks"][number],
  progress: number,
  offsetMs: number,
  cue: string | undefined,
  edge: "start" | "end",
) => {
  const semanticProgress = cueProgress(chunk.speechText, cue, edge, progress);
  const resolvedProgress = semanticProgress ?? clamp(progress);
  return chunk.startMs + (chunk.endMs - chunk.startMs) * resolvedProgress + offsetMs;
};

export const resolveShotRange = (
  scene: ProductionScene,
  beat: ProductionVisualBeat,
  shot: ProductionShot,
): Omit<ResolvedShot, "progress"> => {
  const startChunk = chunkById(scene, shot.startChunkId);
  const endChunk = chunkById(scene, shot.endChunkId);
  const startMs = Math.max(beat.startMs, Math.min(beat.endMs - 1, pointInsideChunk(startChunk, shot.startProgress, shot.startOffsetMs, shot.startCue, "start")));
  const endMs = Math.min(beat.endMs, Math.max(beat.startMs + 1, pointInsideChunk(endChunk, shot.endProgress, shot.endOffsetMs, shot.endCue, "end")));
  if (endMs <= startMs) throw new Error(`$.scenes[${scene.sceneNumber - 1}].visualBeats.shots.${shot.shotId}: end must be after start`);
  return {...shot, startMs, endMs};
};

export const resolveBeatShots = (scene: ProductionScene, beat: ProductionVisualBeat): ResolvedShot[] => (beat.shots ?? []).map((shot) => ({...resolveShotRange(scene, beat, shot), progress: 0}));

export const resolveActiveShot = (scene: ProductionScene, beat: ProductionVisualBeat, timeMs: number): ActiveShotState => {
  const shots = resolveBeatShots(scene, beat);
  if (shots.length === 0) return {shot: null, previousShot: null, nextShot: null, shotIndex: null};
  let shotIndex = shots.findIndex((shot) => shot.startMs <= timeMs && timeMs < shot.endMs);
  if (shotIndex < 0) shotIndex = timeMs < shots[0].startMs ? 0 : shots.length - 1;
  const selected = shots[shotIndex];
  const progress = clamp((timeMs - selected.startMs) / Math.max(1, selected.endMs - selected.startMs));
  return {
    shot: {...selected, progress},
    previousShot: shotIndex > 0 ? {...shots[shotIndex - 1], progress: 1} : null,
    nextShot: shotIndex < shots.length - 1 ? {...shots[shotIndex + 1], progress: 0} : null,
    shotIndex,
  };
};
