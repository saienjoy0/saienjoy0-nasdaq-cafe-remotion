import type {Expression, ProductionScene} from "./render-spec";

export type SceneRenderState = {
  timeMs: number;
  activeChunkIndex: number | null;
  activeBeatIndex: number;
  captionText: string | null;
  expression: Expression;
  visible: ReadonlySet<string>;
  highlighted: ReadonlySet<string>;
  visibleSinceMs: ReadonlyMap<string, number>;
  highlightedSinceMs: ReadonlyMap<string, number>;
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

export const getSceneRenderState = (
  scene: ProductionScene,
  timeMs: number,
): SceneRenderState => {
  const activeChunkIndex = scene.narrationChunks.findIndex(
    (chunk) => chunk.startMs <= timeMs && timeMs < chunk.endMs,
  );
  const activeBeatIndex = scene.visualBeats.findIndex(
    (beat) => beat.startMs <= timeMs && timeMs < beat.endMs,
  );
  const expressionChanges: Array<{timeMs: number; priority: number; order: number; expression: Expression}> = [
    {timeMs: 0, priority: 0, order: -1, expression: scene.initialExpression},
    ...scene.narrationChunks.map((chunk, index) => ({timeMs: chunk.startMs, priority: 1, order: index, expression: chunk.expression})),
    ...scene.visualEvents.flatMap((event, index) =>
      event.action === "set-expression" && event.expression
        ? [{timeMs: eventTimeMs(scene, event), priority: 2, order: index, expression: event.expression}]
        : [],
    ),
  ];
  const expression = expressionChanges
    .filter((change) => change.timeMs <= timeMs)
    .sort((a, b) => a.timeMs - b.timeMs || a.priority - b.priority || a.order - b.order)
    .at(-1)?.expression ?? scene.initialExpression;

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
  const visibleSinceMs = new Map(initiallyVisibleIds.map((id) => [id, 0] as const));
  const highlighted = new Set<string>();
  const highlightedSinceMs = new Map<string, number>();
  const reachedEvents = scene.visualEvents
    .map((event, order) => ({event, order, timeMs: eventTimeMs(scene, event)}))
    .filter((item) => item.timeMs <= timeMs)
    .sort((a, b) => a.timeMs - b.timeMs || a.order - b.order);
  for (const reached of reachedEvents) {
    const {event} = reached;
    if (event.action === "show" && event.targetId) {
      visible.add(event.targetId);
      visibleSinceMs.set(event.targetId, reached.timeMs);
    }
    if (event.action === "hide" && event.targetId) {
      visible.delete(event.targetId);
      visibleSinceMs.delete(event.targetId);
      highlighted.delete(event.targetId);
      highlightedSinceMs.delete(event.targetId);
    }
    if (event.action === "highlight" && event.targetId) {
      highlighted.add(event.targetId);
      highlightedSinceMs.set(event.targetId, reached.timeMs);
    }
    if (event.action === "unhighlight" && event.targetId) {
      highlighted.delete(event.targetId);
      highlightedSinceMs.delete(event.targetId);
    }
  }
  return {
    timeMs,
    activeChunkIndex: activeChunkIndex < 0 ? null : activeChunkIndex,
    activeBeatIndex: activeBeatIndex < 0 ? Math.max(0, scene.visualBeats.length - 1) : activeBeatIndex,
    // Contract B: captions are hidden during pauses.
    captionText: activeChunkIndex < 0 ? null : scene.narrationChunks[activeChunkIndex].caption.text,
    expression,
    visible,
    highlighted,
    visibleSinceMs,
    highlightedSinceMs,
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
