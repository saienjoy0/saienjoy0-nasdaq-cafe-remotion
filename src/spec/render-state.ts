import type {Expression, ProductionScene} from "./render-spec";

export type SceneRenderState = {
  timeMs: number;
  activeChunkIndex: number | null;
  activeBeatIndex: number;
  captionText: string | null;
  expression: Expression;
  visible: ReadonlySet<string>;
  highlighted: ReadonlySet<string>;
};

const CAPTION_PAGE_MAX_CHARS = 58;
const CAPTION_LINE_MAX_CHARS = 29;

const normalizeCaptionText = (value: string) => value.replace(/\s+/g, "").trim();

const splitLongCaptionPart = (value: string, maxChars: number) => {
  const parts: string[] = [];
  let remaining = value;
  while (remaining.length > maxChars) {
    const candidates = ["、", "，", ",", "・"];
    let splitAt = -1;
    for (const separator of candidates) {
      const index = remaining.lastIndexOf(separator, maxChars - 1);
      if (index > Math.floor(maxChars * 0.55)) splitAt = Math.max(splitAt, index + 1);
    }
    if (splitAt < 0) splitAt = maxChars;
    parts.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  if (remaining) parts.push(remaining);
  return parts;
};

export const paginateNarrationCaption = (speechText: string) => {
  const normalized = normalizeCaptionText(speechText);
  if (!normalized) return [];
  const sentenceParts = normalized.match(/[^。！？!?]+[。！？!?]?/g) ?? [normalized];
  const atomicParts = sentenceParts.flatMap((part) => splitLongCaptionPart(part, CAPTION_PAGE_MAX_CHARS));
  const pages: string[] = [];
  let current = "";
  for (const part of atomicParts) {
    if (!current) {
      current = part;
      continue;
    }
    if (current.length + part.length <= CAPTION_PAGE_MAX_CHARS) {
      current += part;
      continue;
    }
    pages.push(current);
    current = part;
  }
  if (current) pages.push(current);
  return pages.map((page) => {
    if (page.length <= CAPTION_LINE_MAX_CHARS) return page;
    const preferredBreak = ["。", "！", "？", "、", "，", ","]
      .map((separator) => page.lastIndexOf(separator, CAPTION_LINE_MAX_CHARS - 1))
      .filter((index) => index >= Math.floor(CAPTION_LINE_MAX_CHARS * 0.55))
      .sort((a, b) => b - a)[0];
    const breakAt = preferredBreak === undefined ? CAPTION_LINE_MAX_CHARS : preferredBreak + 1;
    return `${page.slice(0, breakAt)}\n${page.slice(breakAt)}`;
  });
};

export const getTimedNarrationCaption = (
  speechText: string,
  elapsedMs: number,
  durationMs: number,
) => {
  const pages = paginateNarrationCaption(speechText);
  if (pages.length === 0) return null;
  if (pages.length === 1 || durationMs <= 0) return pages[0];
  const progress = Math.min(0.999999, Math.max(0, elapsedMs / durationMs));
  return pages[Math.min(pages.length - 1, Math.floor(progress * pages.length))];
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
  const visible = new Set(
    allIds.filter((id) => firstVisibility.get(id) !== "show"),
  );
  const highlighted = new Set<string>();
  const reachedEvents = scene.visualEvents
    .map((event, order) => ({event, order, timeMs: eventTimeMs(scene, event)}))
    .filter((item) => item.timeMs <= timeMs)
    .sort((a, b) => a.timeMs - b.timeMs || a.order - b.order);
  for (const {event} of reachedEvents) {
    if (event.action === "show" && event.targetId) visible.add(event.targetId);
    if (event.action === "hide" && event.targetId) visible.delete(event.targetId);
    if (event.action === "highlight" && event.targetId) highlighted.add(event.targetId);
    if (event.action === "unhighlight" && event.targetId) highlighted.delete(event.targetId);
  }
  const activeChunk = activeChunkIndex < 0 ? null : scene.narrationChunks[activeChunkIndex];
  return {
    timeMs,
    activeChunkIndex: activeChunkIndex < 0 ? null : activeChunkIndex,
    activeBeatIndex: activeBeatIndex < 0 ? Math.max(0, scene.visualBeats.length - 1) : activeBeatIndex,
    // Subtitles follow the spoken narration. captionText remains available as a short viewer-facing summary only.
    captionText: activeChunk
      ? getTimedNarrationCaption(activeChunk.speechText, timeMs - activeChunk.startMs, activeChunk.endMs - activeChunk.startMs)
      : null,
    expression,
    visible,
    highlighted,
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
