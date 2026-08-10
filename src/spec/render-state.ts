import type {Expression, ProductionScene} from "./render-spec";
import type {EasingPreset, MotionPreset} from "./motion-preset-contract";
import {resolveActiveShot, type ResolvedShot} from "./shot-timeline";
import {getSubtitleTextAtTime} from "./subtitle-cues";

export type MotionInstruction = {
  preset: MotionPreset;
  durationMs: number;
  easing: EasingPreset;
  startedAtMs: number;
};

export type SceneRenderState = {
  timeMs: number;
  activeChunkIndex: number | null;
  activeBeatIndex: number;
  activeShotIndex: number | null;
  activeShot: ResolvedShot | null;
  previousShot: ResolvedShot | null;
  nextShot: ResolvedShot | null;
  captionText: string | null;
  subtitleText: string | null;
  expression: Expression;
  previousExpression: Expression | null;
  expressionTransitionProgress: number;
  visible: ReadonlySet<string>;
  highlighted: ReadonlySet<string>;
  visibleSinceMs: ReadonlyMap<string, number>;
  highlightedSinceMs: ReadonlyMap<string, number>;
  showMotionByTarget: ReadonlyMap<string, MotionInstruction>;
  hideMotionByTarget: ReadonlyMap<string, MotionInstruction>;
  highlightMotionByTarget: ReadonlyMap<string, MotionInstruction>;
  unhighlightMotionByTarget: ReadonlyMap<string, MotionInstruction>;
};

const eventTimeMs = (
  scene: ProductionScene,
  event: ProductionScene["visualEvents"][number],
) => {
  const chunk = scene.narrationChunks.find((item) => item.chunkId === event.atChunkId);
  if (!chunk) throw new Error(`$.scenes[${scene.sceneNumber - 1}].visualEvents: unknown chunk ${event.atChunkId}`);
  const boundary = event.timing === "chunk-start" ? chunk.startMs : chunk.endMs;
  return boundary + event.offsetMs;
};

const motionInstruction = (
  event: ProductionScene["visualEvents"][number],
  startedAtMs: number,
): MotionInstruction | null => event.motionPreset && event.durationMs
  ? {
      preset: event.motionPreset,
      durationMs: event.durationMs,
      easing: event.easingPreset ?? "smooth-out",
      startedAtMs,
    }
  : null;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export const getSceneRenderState = (
  scene: ProductionScene,
  timeMs: number,
): SceneRenderState => {
  const activeChunkIndex = scene.narrationChunks.findIndex(
    (chunk) => chunk.startMs <= timeMs && timeMs < chunk.endMs,
  );
  const foundBeatIndex = scene.visualBeats.findIndex(
    (beat) => beat.startMs <= timeMs && timeMs < beat.endMs,
  );
  const activeBeatIndex = foundBeatIndex < 0 ? Math.max(0, scene.visualBeats.length - 1) : foundBeatIndex;
  const activeBeat = scene.visualBeats[activeBeatIndex];
  const shotState = activeBeat
    ? resolveActiveShot(scene, activeBeat, timeMs)
    : {shot: null, previousShot: null, nextShot: null, shotIndex: null};

  const expressionChanges: Array<{timeMs: number; priority: number; order: number; expression: Expression}> = [
    {timeMs: 0, priority: 0, order: -1, expression: scene.initialExpression},
    ...scene.narrationChunks.map((chunk, index) => ({timeMs: chunk.startMs, priority: 1, order: index, expression: chunk.expression})),
    ...scene.visualEvents.flatMap((event, index) =>
      event.action === "set-expression" && event.expression
        ? [{timeMs: eventTimeMs(scene, event), priority: 2, order: index, expression: event.expression}]
        : [],
    ),
  ];
  const reachedExpressionChanges = expressionChanges
    .filter((change) => change.timeMs <= timeMs)
    .sort((a, b) => a.timeMs - b.timeMs || a.priority - b.priority || a.order - b.order);
  const latestBaseExpression = reachedExpressionChanges.at(-1) ?? expressionChanges[0];
  const baseExpression = latestBaseExpression.expression;
  const expression = shotState.shot?.foxExpression ?? baseExpression;
  const priorExpression = shotState.previousShot?.foxExpression ?? baseExpression;
  const previousExpression = priorExpression === expression ? null : priorExpression;
  const expressionStartedAtMs = shotState.shot?.startMs ?? latestBaseExpression.timeMs;
  const expressionTransitionProgress = previousExpression
    ? clamp((timeMs - expressionStartedAtMs) / 180)
    : 1;

  const visibilityEvents = scene.visualEvents.filter(
    (event) => event.action === "show" || event.action === "hide",
  );
  const firstVisibility = new Map<string, "show" | "hide">();
  for (const event of visibilityEvents) {
    if (event.targetId && !firstVisibility.has(event.targetId)) {
      firstVisibility.set(event.targetId, event.action as "show" | "hide");
    }
  }
  const allIds = [
    ...scene.cards.map((item) => item.cardId),
    ...scene.numbers.map((item) => item.numberId),
    ...scene.nodes.map((item) => item.nodeId),
    ...scene.arrows.map((item) => item.arrowId),
    ...scene.assetPlacements.map((item) => item.placementId),
  ];
  const initiallyVisibleIds = allIds.filter((id) => firstVisibility.get(id) !== "show");
  const visible = new Set(initiallyVisibleIds);
  const visibleSinceMs = new Map<string, number>(initiallyVisibleIds.map((id) => [id, 0]));
  const highlighted = new Set<string>();
  const highlightedSinceMs = new Map<string, number>();
  const showMotionByTarget = new Map<string, MotionInstruction>();
  const hideMotionByTarget = new Map<string, MotionInstruction>();
  const highlightMotionByTarget = new Map<string, MotionInstruction>();
  const unhighlightMotionByTarget = new Map<string, MotionInstruction>();

  const reachedEvents = scene.visualEvents
    .map((event, order) => ({event, order, timeMs: eventTimeMs(scene, event)}))
    .filter((item) => item.timeMs <= timeMs)
    .sort((a, b) => a.timeMs - b.timeMs || a.order - b.order);

  for (const reached of reachedEvents) {
    const {event} = reached;
    if (event.action === "show" && event.targetId) {
      visible.add(event.targetId);
      visibleSinceMs.set(event.targetId, reached.timeMs);
      hideMotionByTarget.delete(event.targetId);
      const instruction = motionInstruction(event, reached.timeMs);
      if (instruction) showMotionByTarget.set(event.targetId, instruction);
    }
    if (event.action === "hide" && event.targetId) {
      const instruction = motionInstruction(event, reached.timeMs);
      const isExiting = instruction && timeMs < reached.timeMs + instruction.durationMs;
      if (isExiting && instruction) {
        visible.add(event.targetId);
        hideMotionByTarget.set(event.targetId, instruction);
      } else {
        visible.delete(event.targetId);
        visibleSinceMs.delete(event.targetId);
        highlighted.delete(event.targetId);
        highlightedSinceMs.delete(event.targetId);
        showMotionByTarget.delete(event.targetId);
        hideMotionByTarget.delete(event.targetId);
        highlightMotionByTarget.delete(event.targetId);
        unhighlightMotionByTarget.delete(event.targetId);
      }
    }
    if (event.action === "highlight" && event.targetId) {
      highlighted.add(event.targetId);
      highlightedSinceMs.set(event.targetId, reached.timeMs);
      unhighlightMotionByTarget.delete(event.targetId);
      const instruction = motionInstruction(event, reached.timeMs);
      if (instruction) highlightMotionByTarget.set(event.targetId, instruction);
    }
    if (event.action === "unhighlight" && event.targetId) {
      const instruction = motionInstruction(event, reached.timeMs);
      const isSettling = instruction && timeMs < reached.timeMs + instruction.durationMs;
      if (isSettling && instruction) {
        highlighted.add(event.targetId);
        unhighlightMotionByTarget.set(event.targetId, instruction);
      } else {
        highlighted.delete(event.targetId);
        highlightedSinceMs.delete(event.targetId);
        highlightMotionByTarget.delete(event.targetId);
        unhighlightMotionByTarget.delete(event.targetId);
      }
    }
  }

  const activeChunk = activeChunkIndex < 0 ? null : scene.narrationChunks[activeChunkIndex];
  return {
    timeMs,
    activeChunkIndex: activeChunkIndex < 0 ? null : activeChunkIndex,
    activeBeatIndex,
    activeShotIndex: shotState.shotIndex,
    activeShot: shotState.shot,
    previousShot: shotState.previousShot,
    nextShot: shotState.nextShot,
    captionText: activeChunk?.caption.text ?? null,
    subtitleText: activeChunk
      ? getSubtitleTextAtTime(activeChunk.caption.text, activeChunk.startMs, activeChunk.endMs, timeMs)
      : null,
    expression,
    previousExpression,
    expressionTransitionProgress,
    visible,
    highlighted,
    visibleSinceMs,
    highlightedSinceMs,
    showMotionByTarget,
    hideMotionByTarget,
    highlightMotionByTarget,
    unhighlightMotionByTarget,
  };
};

export const isPlacementActive = (
  scene: ProductionScene,
  placement: ProductionScene["assetPlacements"][number],
  state: SceneRenderState,
) => {
  if (!state.visible.has(placement.placementId)) return false;
  const start = placement.startChunkId
    ? scene.narrationChunks.find((chunk) => chunk.chunkId === placement.startChunkId)?.startMs
    : 0;
  const end = placement.endChunkId
    ? (() => {const chunk = scene.narrationChunks.find((item) => item.chunkId === placement.endChunkId); return chunk ? chunk.endMs + chunk.pauseAfterMs : undefined;})()
    : scene.durationMs;
  if (start === undefined || end === undefined) throw new Error(`$.scenes[${scene.sceneNumber - 1}].assetPlacements: invalid chunk range`);
  return start <= state.timeMs && state.timeMs < end;
};

export const getTransitionDurationInFrames = (
  scene: ProductionScene,
  fps: number,
) => scene.transition.type === "fade"
  ? Math.max(1, Math.round((scene.transition.durationMs * fps) / 1000))
  : 0;

export const getSpecDurationInFrames = (
  scenes: ProductionScene[],
  fps: number,
) => scenes.reduce(
  (total, scene, index) => total + scene.durationInFrames - (index < scenes.length - 1 ? getTransitionDurationInFrames(scene, fps) : 0),
  0,
);
