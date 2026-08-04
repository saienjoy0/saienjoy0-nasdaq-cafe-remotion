import type {Expression, ProductionScene, ProductionVisualBeat} from "./render-spec";
import type {
  CameraPreset,
  ShotRecipe,
  ShotTransition,
  SoundCue,
  StageLayout,
  TypographyTreatment,
} from "./shot-contract";

export type ProductionShot = {
  shotId: string;
  shotRecipe: ShotRecipe;
  startChunkId: string;
  startOffsetMs: number;
  endChunkId: string;
  endOffsetMs: number;
  endCue: string;
  primaryTargetId: string | null;
  stageLayout: StageLayout;
  cameraPreset: CameraPreset;
  transitionIn: ShotTransition;
  transitionOut: ShotTransition;
  continuityKey: string | null;
  typographyTreatment: TypographyTreatment | null;
  typographyText: string | null;
  soundCue: SoundCue | null;
  foxExpression: Expression;
};

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

const chunkById = (scene: ProductionScene, chunkId: string) => {
  const chunk = scene.narrationChunks.find((item) => item.chunkId === chunkId);
  if (!chunk) throw new Error(`$.scenes[${scene.sceneNumber - 1}].visualBeats.shots: unknown chunk ${chunkId}`);
  return chunk;
};

export const resolveShotRange = (
  scene: ProductionScene,
  beat: ProductionVisualBeat,
  shot: ProductionShot,
): Omit<ResolvedShot, "progress"> => {
  const startChunk = chunkById(scene, shot.startChunkId);
  const endChunk = chunkById(scene, shot.endChunkId);
  const startMs = Math.max(beat.startMs, startChunk.startMs + shot.startOffsetMs);
  const endMs = Math.min(beat.endMs, endChunk.endMs + shot.endOffsetMs);
  if (endMs <= startMs) {
    throw new Error(`$.scenes[${scene.sceneNumber - 1}].visualBeats.shots.${shot.shotId}: end must be after start`);
  }
  return {...shot, startMs, endMs};
};

export const resolveBeatShots = (
  scene: ProductionScene,
  beat: ProductionVisualBeat,
): ResolvedShot[] => (beat.shots ?? []).map((shot) => {
  const resolved = resolveShotRange(scene, beat, shot);
  return {...resolved, progress: 0};
});

export const resolveActiveShot = (
  scene: ProductionScene,
  beat: ProductionVisualBeat,
  timeMs: number,
): ActiveShotState => {
  const shots = resolveBeatShots(scene, beat);
  if (shots.length === 0) return {shot: null, previousShot: null, nextShot: null, shotIndex: null};
  let shotIndex = shots.findIndex((shot) => shot.startMs <= timeMs && timeMs < shot.endMs);
  if (shotIndex < 0) {
    shotIndex = timeMs < shots[0].startMs ? 0 : shots.length - 1;
  }
  const selected = shots[shotIndex];
  const progress = clamp((timeMs - selected.startMs) / Math.max(1, selected.endMs - selected.startMs));
  const shot = {...selected, progress};
  const previousShot = shotIndex > 0 ? {...shots[shotIndex - 1], progress: 1} : null;
  const nextShot = shotIndex < shots.length - 1 ? {...shots[shotIndex + 1], progress: 0} : null;
  return {shot, previousShot, nextShot, shotIndex};
};
