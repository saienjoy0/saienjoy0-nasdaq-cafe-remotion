import type {RenderProductionData, RenderSpec} from "./render-spec";
import {resolveBeatShots} from "./shot-timeline";
import {DEDICATED_SHOT_RECIPE_IDS, SHOT_RECIPE_FAMILIES} from "./shot-contract";

const fail = (path: string, message: string): never => {throw new Error(`${path}: ${message}`);};
const normalize = (value: string) => value.replace(/\s+/gu, "").trim();
const longestRun = (values: string[]) => values.reduce((state, value) => {const current = value === state.previous ? state.current + 1 : 1; return {previous: value, current, longest: Math.max(state.longest, current)};}, {previous: "", current: 0, longest: 0}).longest;
const shotMoment = (chunkOrder: Map<string, number>, chunkId: string, progress: number, offsetMs: number) => {const index = chunkOrder.get(chunkId); return index == null ? Number.NaN : (index + progress) * 100_000 + offsetMs;};

export const validateShotStoryContract = (spec: RenderSpec, options: {enforceVariety?: boolean} = {}) => {
  let totalShots = 0;
  let totalContinuities = 0;
  let totalNiyari = 0;
  const recipes: string[] = [];
  const dedicated = new Set(DEDICATED_SHOT_RECIPE_IDS);

  spec.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `$.scenes[${sceneIndex}]`;
    const chunkOrder = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));
    const objectIds = new Set([...scene.cards.map((item) => item.cardId), ...scene.numbers.map((item) => item.numberId), ...scene.nodes.map((item) => item.nodeId), ...scene.arrows.map((item) => item.arrowId), ...scene.assetPlacements.map((item) => item.placementId)]);
    const cardRole = new Map(scene.cards.map((item) => [item.cardId, item.role]));
    let expressionChanges = 0;
    let previousExpression = scene.initialExpression;

    scene.visualBeats.forEach((beat, beatIndex) => {
      const shots = beat.shots ?? [];
      if (shots.length === 0) return;
      const path = `${scenePath}.visualBeats[${beatIndex}].shots`;
      totalShots += shots.length;
      const beatStartIndex = chunkOrder.get(beat.startChunkId) ?? fail(`${path}.startChunkId`, `unknown chunk ${beat.startChunkId}`);
      const beatEndIndex = chunkOrder.get(beat.endChunkId) ?? fail(`${path}.endChunkId`, `unknown chunk ${beat.endChunkId}`);
      let previousEnd = -1;
      let previousShot: typeof shots[number] | null = null;
      let beatSoundCues = 0;

      shots.forEach((shot, shotIndex) => {
        const shotPath = `${path}[${shotIndex}]`;
        if (!dedicated.has(shot.shotRecipe)) fail(`${shotPath}.shotRecipe`, `production Shot has no dedicated renderer: ${shot.shotRecipe}`);
        const startIndex = chunkOrder.get(shot.startChunkId) ?? fail(`${shotPath}.startChunkId`, `unknown chunk ${shot.startChunkId}`);
        const endIndex = chunkOrder.get(shot.endChunkId) ?? fail(`${shotPath}.endChunkId`, `unknown chunk ${shot.endChunkId}`);
        if (startIndex < beatStartIndex || startIndex > beatEndIndex || endIndex < beatStartIndex || endIndex > beatEndIndex) fail(shotPath, "Shot must stay inside its Visual Beat");
        const startMoment = shotMoment(chunkOrder, shot.startChunkId, shot.startProgress, shot.startOffsetMs);
        const endMoment = shotMoment(chunkOrder, shot.endChunkId, shot.endProgress, shot.endOffsetMs);
        if (endMoment <= startMoment) fail(shotPath, "Shot end must be after Shot start");
        if (startMoment < previousEnd - 1e-6) fail(shotPath, "Shots must not overlap and must be ordered");
        previousEnd = endMoment;

        const startChunk = scene.narrationChunks[startIndex];
        const endChunk = scene.narrationChunks[endIndex];
        if (!shot.startCue || !normalize(startChunk.speechText).includes(normalize(shot.startCue))) fail(`${shotPath}.startCue`, "startCue must exist in startChunk speechText");
        if (!shot.endCue || !normalize(endChunk.speechText).includes(normalize(shot.endCue))) fail(`${shotPath}.endCue`, "endCue must exist in endChunk speechText");

        const targetIds = [shot.primaryTargetId, shot.referenceTargetId, shot.outcomeTargetId, shot.cameraTargetId, ...(shot.secondaryTargetIds ?? [])].filter(Boolean) as string[];
        for (const id of targetIds) {
          if (!objectIds.has(id)) fail(`${shotPath}.targets`, `unknown object ID ${id}`);
          if (!beat.objectIds.includes(id) && !beat.assetPlacementIds.includes(id)) fail(`${shotPath}.targets`, `Shot target ${id} must be selected by its Visual Beat`);
        }
        if (shot.cameraPreset !== "static" && !shot.cameraTargetId && !shot.primaryTargetId && beat.viewerTexts.length === 0) fail(`${shotPath}.cameraTargetId`, "moving camera requires a semantic target");
        if (shot.shotRecipe === "expected-anchor" && shot.primaryTargetId && cardRole.has(shot.primaryTargetId) && cardRole.get(shot.primaryTargetId) !== "expected") fail(`${shotPath}.primaryTargetId`, "expected-anchor card target must have role expected");
        if (shot.shotRecipe === "actual-crosses-expected" && shot.primaryTargetId && cardRole.has(shot.primaryTargetId) && cardRole.get(shot.primaryTargetId) !== "actual") fail(`${shotPath}.primaryTargetId`, "actual-crosses-expected card target must have role actual");
        if (shot.shotRecipe === "gap-macro" && shot.primaryTargetId && cardRole.has(shot.primaryTargetId) && cardRole.get(shot.primaryTargetId) !== "gap") fail(`${shotPath}.primaryTargetId`, "gap-macro card target must have role gap");
        if (shot.shotRecipe === "causal-build" && scene.nodes.filter((node) => beat.objectIds.includes(node.nodeId)).length === 0 && beat.viewerTexts.length < 2) fail(shotPath, "causal-build requires nodes or at least two viewerTexts");
        if (shot.shotRecipe === "split-opposition" && scene.numbers.filter((number) => beat.objectIds.includes(number.numberId)).length < 2 && beat.viewerTexts.length < 2) fail(shotPath, "split-opposition requires two comparison targets");
        if (shot.shotRecipe === "recap-assembly" && beat.viewerTexts.length < 3) fail(shotPath, "recap-assembly requires at least three existing recap elements");
        if (shot.typographyText && Array.from(shot.typographyText).length > 22) fail(`${shotPath}.typographyText`, "kinetic typography must be at most 22 characters");
        if (shot.soundCue) beatSoundCues += 1;
        if (shot.foxExpression !== previousExpression) expressionChanges += 1;
        previousExpression = shot.foxExpression;
        if (shot.foxExpression === "ニヤリ") totalNiyari += 1;
        if (shot.foxExpression === "眠そう" && sceneIndex !== 8) fail(`${shotPath}.foxExpression`, "眠そう is reserved for Scene 9");
        if (previousShot?.continuityKey && shot.continuityKey && previousShot.continuityKey === shot.continuityKey) totalContinuities += 1;
        if (shot.transitionIn === "reframe-shared-element" && (!previousShot || !shot.continuityKey || previousShot.continuityKey !== shot.continuityKey)) fail(`${shotPath}.transitionIn`, "reframe-shared-element requires the same continuityKey on the previous Shot");
        recipes.push(SHOT_RECIPE_FAMILIES[shot.shotRecipe]);
        previousShot = shot;
      });

      if (beatSoundCues > 2) fail(path, "one Visual Beat may use at most 2 sound cues");
      if (longestRun(shots.map((shot) => shot.stageLayout)) > 3) fail(path, "the same Stage Layout may not lead more than 3 consecutive Shots inside one Visual Beat");
      if (longestRun(shots.map((shot) => shot.cameraPreset)) > 4) fail(path, "the same Camera Preset may not lead more than 4 consecutive Shots inside one Visual Beat");
    });
    if (expressionChanges > 2) fail(scenePath, `fox expression may change at most twice in one Scene, got ${expressionChanges}`);
  });

  if (totalNiyari > 2) fail("$.scenes", `ニヤリ may be used at most twice, got ${totalNiyari}`);
  if (options.enforceVariety && totalShots > 0) {
    if (totalShots < 24 || totalShots > 50) fail("$.scenes", `v3 episode requires 24-50 Shots, got ${totalShots}`);
    if (new Set(recipes).size < 6) fail("$.scenes", `v3 episode requires at least 6 Shot families, got ${new Set(recipes).size}`);
    if (totalContinuities < 3) fail("$.scenes", `v3 episode requires at least 3 continuity handoffs, got ${totalContinuities}`);
  }
};

export const DEFAULT_MAX_SHOT_DURATION_MS = 10_000;
export const DEFAULT_MAX_OUTCOME_HOLD_MS = 8_000;
export const DEFAULT_MAX_SHOT_GAP_MS = 500;
export const DEFAULT_MAX_SHOT_OVERLAP_MS = 250;

export type ProductionShotTimingSummary = {
  totalShots: number;
  maximumShotDurationMs: number;
  scenes: Array<{
    sceneId: string;
    durationMs: number;
    shotCount: number;
    maximumShotDurationMs: number;
  }>;
};

export const validateProductionShotTimingContract = (
  data: RenderProductionData,
  options: {
    maxShotDurationMs?: number;
    maxOutcomeHoldMs?: number;
    maxGapMs?: number;
    maxOverlapMs?: number;
  } = {},
): ProductionShotTimingSummary => {
  const maxShotDurationMs = options.maxShotDurationMs ?? DEFAULT_MAX_SHOT_DURATION_MS;
  const maxOutcomeHoldMs = options.maxOutcomeHoldMs ?? DEFAULT_MAX_OUTCOME_HOLD_MS;
  const maxGapMs = options.maxGapMs ?? DEFAULT_MAX_SHOT_GAP_MS;
  const maxOverlapMs = options.maxOverlapMs ?? DEFAULT_MAX_SHOT_OVERLAP_MS;
  const episodeUsesShots = data.scenes.some((scene) =>
    scene.visualBeats.some((beat) => (beat.shots?.length ?? 0) > 0),
  );
  let totalShots = 0;
  let maximumShotDurationMs = 0;
  const scenes: ProductionShotTimingSummary["scenes"] = [];

  for (const [sceneIndex, scene] of data.scenes.entries()) {
    let sceneShotCount = 0;
    let sceneMaximumShotDurationMs = 0;

    for (const [beatIndex, beat] of scene.visualBeats.entries()) {
      const beatPath = `$.scenes[${sceneIndex}].visualBeats[${beatIndex}]`;
      const beatDurationMs = beat.endMs - beat.startMs;
      const declaredShots = beat.shots ?? [];
      if (declaredShots.length === 0) {
        if (episodeUsesShots && beatDurationMs > maxShotDurationMs) {
          fail(
            `${beatPath}.shots`,
            `v3 Visual Beat has no Shots for ${Math.round(beatDurationMs)}ms; add an explicit Shot plan before preview`,
          );
        }
        continue;
      }

      const resolvedShots = resolveBeatShots(scene, beat);
      let previousEndMs = beat.startMs;
      for (const [shotIndex, shot] of resolvedShots.entries()) {
        const shotPath = `${beatPath}.shots[${shotIndex}]`;
        const gapMs = shot.startMs - previousEndMs;
        if (gapMs > maxGapMs) {
          fail(
            `${shotPath}.startCue`,
            `resolved Shot gap is ${Math.round(gapMs)}ms; maximum is ${maxGapMs}ms`,
          );
        }
        const overlapMs = previousEndMs - shot.startMs;
        if (overlapMs > maxOverlapMs) {
          fail(
            `${shotPath}.startCue`,
            `resolved Shot overlap is ${Math.round(overlapMs)}ms; maximum is ${maxOverlapMs}ms`,
          );
        }

        const durationMs = shot.endMs - shot.startMs;
        if (durationMs > maxShotDurationMs) {
          fail(
            shotPath,
            `resolved Shot lasts ${Math.round(durationMs)}ms; maximum is ${maxShotDurationMs}ms`,
          );
        }
        if (
          scene.sceneNumber !== 9 &&
          shot.transitionOut === "hold-outcome" &&
          durationMs > maxOutcomeHoldMs
        ) {
          fail(
            `${shotPath}.transitionOut`,
            `completed outcome hold lasts ${Math.round(durationMs)}ms outside Scene 9; maximum is ${maxOutcomeHoldMs}ms`,
          );
        }

        totalShots += 1;
        sceneShotCount += 1;
        maximumShotDurationMs = Math.max(maximumShotDurationMs, durationMs);
        sceneMaximumShotDurationMs = Math.max(sceneMaximumShotDurationMs, durationMs);
        previousEndMs = shot.endMs;
      }

      const tailGapMs = beat.endMs - previousEndMs;
      if (tailGapMs > maxGapMs) {
        fail(
          `${beatPath}.shots`,
          `resolved Shot plan ends ${Math.round(tailGapMs)}ms before the Visual Beat; maximum tail gap is ${maxGapMs}ms`,
        );
      }
    }

    scenes.push({
      sceneId: scene.sceneId,
      durationMs: scene.durationMs,
      shotCount: sceneShotCount,
      maximumShotDurationMs: sceneMaximumShotDurationMs,
    });
  }

  return {totalShots, maximumShotDurationMs, scenes};
};
