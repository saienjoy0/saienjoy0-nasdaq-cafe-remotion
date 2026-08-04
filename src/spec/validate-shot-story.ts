import type {RenderSpec} from "./render-spec";
import {SHOT_RECIPE_FAMILIES} from "./shot-contract";

const fail = (path: string, message: string): never => {
  throw new Error(`${path}: ${message}`);
};

const shotMoment = (
  chunkOrder: Map<string, number>,
  chunkId: string,
  progress: number,
  offsetMs: number,
) => {
  const index = chunkOrder.get(chunkId);
  if (index == null) return Number.NaN;
  return (index + progress) * 100_000 + offsetMs;
};

export const validateShotStoryContract = (
  spec: RenderSpec,
  options: {enforceVariety?: boolean} = {},
) => {
  let totalShots = 0;
  let totalContinuities = 0;
  let totalNiyari = 0;
  const recipes: string[] = [];
  const layouts: string[] = [];
  const cameras: string[] = [];

  spec.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `$.scenes[${sceneIndex}]`;
    const chunkOrder = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));
    const objectIds = new Set([
      ...scene.cards.map((item) => item.cardId),
      ...scene.numbers.map((item) => item.numberId),
      ...scene.nodes.map((item) => item.nodeId),
      ...scene.arrows.map((item) => item.arrowId),
      ...scene.assetPlacements.map((item) => item.placementId),
    ]);
    let expressionChanges = 0;
    let previousExpression = scene.initialExpression;

    scene.visualBeats.forEach((beat, beatIndex) => {
      const shots = beat.shots ?? [];
      if (shots.length === 0) return;
      const path = `${scenePath}.visualBeats[${beatIndex}].shots`;
      if (shots.length > 4) fail(path, `one Visual Beat may contain at most 4 Shots, got ${shots.length}`);
      totalShots += shots.length;
      const beatStartIndex = chunkOrder.get(beat.startChunkId) ?? fail(`${path}.startChunkId`, `unknown chunk ${beat.startChunkId}`);
      const beatEndIndex = chunkOrder.get(beat.endChunkId) ?? fail(`${path}.endChunkId`, `unknown chunk ${beat.endChunkId}`);
      let previousEnd = -1;
      let previousShot: typeof shots[number] | null = null;
      let beatSoundCues = 0;

      shots.forEach((shot, shotIndex) => {
        const shotPath = `${path}[${shotIndex}]`;
        const startIndex = chunkOrder.get(shot.startChunkId) ?? fail(`${shotPath}.startChunkId`, `unknown chunk ${shot.startChunkId}`);
        const endIndex = chunkOrder.get(shot.endChunkId) ?? fail(`${shotPath}.endChunkId`, `unknown chunk ${shot.endChunkId}`);
        if (startIndex < beatStartIndex || startIndex > beatEndIndex) fail(`${shotPath}.startChunkId`, "Shot must start inside its Visual Beat");
        if (endIndex < beatStartIndex || endIndex > beatEndIndex) fail(`${shotPath}.endChunkId`, "Shot must end inside its Visual Beat");
        const startMoment = shotMoment(chunkOrder, shot.startChunkId, shot.startProgress, shot.startOffsetMs);
        const endMoment = shotMoment(chunkOrder, shot.endChunkId, shot.endProgress, shot.endOffsetMs);
        if (endMoment <= startMoment) fail(shotPath, "Shot end must be after Shot start");
        if (startMoment < previousEnd - 1e-6) fail(shotPath, "Shots must not overlap and must be ordered");
        previousEnd = endMoment;

        if (shot.primaryTargetId && !objectIds.has(shot.primaryTargetId)) {
          fail(`${shotPath}.primaryTargetId`, `unknown object ID ${shot.primaryTargetId}`);
        }
        if (shot.primaryTargetId && !beat.objectIds.includes(shot.primaryTargetId) && !beat.assetPlacementIds.includes(shot.primaryTargetId)) {
          fail(`${shotPath}.primaryTargetId`, "Shot target must be selected by its Visual Beat");
        }
        if (shot.typographyTreatment && !shot.typographyText) fail(`${shotPath}.typographyText`, "typographyTreatment requires typographyText");
        if (!shot.typographyTreatment && shot.typographyText) fail(`${shotPath}.typographyTreatment`, "typographyText requires typographyTreatment");
        if (shot.typographyText && shot.typographyText.length > 22) fail(`${shotPath}.typographyText`, "kinetic typography must be at most 22 characters");
        if (shot.soundCue) beatSoundCues += 1;
        if (shot.foxExpression !== previousExpression) expressionChanges += 1;
        previousExpression = shot.foxExpression;
        if (shot.foxExpression === "ニヤリ") totalNiyari += 1;
        if (shot.foxExpression === "眠そう" && sceneIndex !== 8) fail(`${shotPath}.foxExpression`, "眠そう is reserved for Scene 9");
        if (previousShot?.continuityKey && shot.continuityKey && previousShot.continuityKey === shot.continuityKey) totalContinuities += 1;
        if (shot.transitionIn === "reframe-shared-element" && (!previousShot || !shot.continuityKey || previousShot.continuityKey !== shot.continuityKey)) {
          fail(`${shotPath}.transitionIn`, "reframe-shared-element requires the same continuityKey on the previous Shot");
        }
        recipes.push(SHOT_RECIPE_FAMILIES[shot.shotRecipe]);
        layouts.push(shot.stageLayout);
        cameras.push(shot.cameraPreset);
        previousShot = shot;
      });
      if (beatSoundCues > 2) fail(path, "one Visual Beat may use at most 2 sound cues");
    });

    if (expressionChanges > 2) fail(scenePath, `fox expression may change at most twice in one Scene, got ${expressionChanges}`);
  });

  if (totalNiyari > 2) fail("$.scenes", `ニヤリ may be used at most twice, got ${totalNiyari}`);

  if (options.enforceVariety && totalShots > 0) {
    if (totalShots < 24 || totalShots > 50) fail("$.scenes", `v3 episode requires 24-50 Shots, got ${totalShots}`);
    if (new Set(recipes).size < 6) fail("$.scenes", `v3 episode requires at least 6 Shot families, got ${new Set(recipes).size}`);
    if (totalContinuities < 3) fail("$.scenes", `v3 episode requires at least 3 continuity handoffs, got ${totalContinuities}`);
    const longestRun = (values: string[]) => values.reduce((state, value) => {
      const current = value === state.previous ? state.current + 1 : 1;
      return {previous: value, current, longest: Math.max(state.longest, current)};
    }, {previous: "", current: 0, longest: 0}).longest;
    if (longestRun(layouts) > 3) fail("$.scenes", "the same Stage Layout may not lead more than 3 consecutive Shots");
    if (longestRun(cameras) > 4) fail("$.scenes", "the same Camera Preset may not lead more than 4 consecutive Shots");
  }
};
