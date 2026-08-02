import {voiceProfileSchema, type RenderSpec, type VoiceProfile} from "./render-spec";

export type AssetManifestForSpec = {assets: Record<string, {path: string; type?: string}>};
export type VoiceProfilesForSpec = {profiles: Record<string, unknown>};

const fail = (path: string, message: string): never => {
  throw new Error(`${path}: ${message}`);
};

const unique = (values: string[], path: string) => {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) fail(`${path}[${index}]`, `duplicate ID: ${value}`);
    seen.add(value);
  });
};

const requireSourceIds = (ids: string[], sources: Set<string>, path: string) => {
  ids.forEach((sourceId, index) => {
    if (!sources.has(sourceId)) fail(`${path}[${index}]`, `unknown sourceId: ${sourceId}`);
  });
};

export const resolveVoiceProfile = (
  voiceProfileId: string,
  voiceProfiles: VoiceProfilesForSpec,
): VoiceProfile => {
  const raw = voiceProfiles.profiles[voiceProfileId];
  if (!raw) fail("$.voiceProfileId", `unknown voiceProfileId: ${voiceProfileId}`);
  const result = voiceProfileSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    fail("$.voiceProfileId", `invalid voice profile ${voiceProfileId}: ${details}`);
  }
  const profile = result.data!;
  if (
    profile.provider !== "gemini" ||
    profile.model !== "gemini-3.1-flash-tts-preview" ||
    profile.voice !== "Charon" ||
    profile.provisional
  ) {
    fail(
      "$.voiceProfileId",
      "production requires non-provisional Gemini gemini-3.1-flash-tts-preview / Charon",
    );
  }
  return profile;
};

export const validateRenderSpecReferences = (
  spec: RenderSpec,
  assetManifest: AssetManifestForSpec,
  voiceProfiles: VoiceProfilesForSpec,
) => {
  resolveVoiceProfile(spec.voiceProfileId, voiceProfiles);
  const sourceIds = new Set(spec.sources.map((source) => source.sourceId));
  requireSourceIds(spec.editorial.expectedSourceIds, sourceIds, "$.editorial.expectedSourceIds");
  unique(spec.scenes.map((scene) => scene.sceneId), "$.scenes");
  unique(spec.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.chunkId)), "$.scenes[*].narrationChunks");
  unique(spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => beat.beatId)), "$.scenes[*].visualBeats");
  unique(spec.scenes.flatMap((scene) => scene.visualEvents.map((event) => event.eventId)), "$.scenes[*].visualEvents");
  unique(spec.scenes.flatMap((scene) => [
    ...scene.cards.map((item) => item.cardId),
    ...scene.numbers.map((item) => item.numberId),
    ...scene.nodes.map((item) => item.nodeId),
    ...scene.arrows.map((item) => item.arrowId),
    ...scene.assetPlacements.map((item) => item.placementId),
  ]), "$.scenes[*].objects");

  spec.scenes.forEach((scene, sceneIndex) => {
    const base = `$.scenes[${sceneIndex}]`;
    requireSourceIds(scene.evidenceSourceIds, sourceIds, `${base}.evidenceSourceIds`);
    const chunkIds = scene.narrationChunks.map((item) => item.chunkId);
    const cardIds = scene.cards.map((item) => item.cardId);
    const numberIds = scene.numbers.map((item) => item.numberId);
    const nodeIds = scene.nodes.map((item) => item.nodeId);
    const arrowIds = scene.arrows.map((item) => item.arrowId);
    const placementIds = scene.assetPlacements.map((item) => item.placementId);
    unique([...cardIds, ...numberIds, ...nodeIds, ...arrowIds, ...placementIds], `${base}.objects`);
    const chunks = new Set(chunkIds);
    const chunkOrder = new Map(chunkIds.map((chunkId, index) => [chunkId, index]));
    const nodes = new Set(nodeIds);
    const objectTargets = new Set([...cardIds, ...numberIds, ...nodeIds, ...arrowIds]);
    const visibilityTargets = new Set([...objectTargets, ...placementIds]);
    const placementsById = new Map(scene.assetPlacements.map((placement) => [placement.placementId, placement]));

    scene.arrows.forEach((arrow, index) => {
      if (!nodes.has(arrow.fromNodeId)) fail(`${base}.arrows[${index}].fromNodeId`, `unknown nodeId: ${arrow.fromNodeId}`);
      if (!nodes.has(arrow.toNodeId)) fail(`${base}.arrows[${index}].toNodeId`, `unknown nodeId: ${arrow.toNodeId}`);
    });
    scene.visualEvents.forEach((event, index) => {
      if (!chunks.has(event.atChunkId)) fail(`${base}.visualEvents[${index}].atChunkId`, `chunkId must exist in the same Scene: ${event.atChunkId}`);
      if (event.action === "set-expression") return;
      const targets = event.action === "show" || event.action === "hide" ? visibilityTargets : objectTargets;
      if (!event.targetId || !targets.has(event.targetId)) fail(`${base}.visualEvents[${index}].targetId`, `invalid ${event.action} targetId: ${event.targetId}`);
    });
    scene.assetPlacements.forEach((placement, index) => {
      const path = `${base}.assetPlacements[${index}]`;
      if (!(placement.assetId in assetManifest.assets)) fail(`${path}.assetId`, `unknown assetId: ${placement.assetId}`);
      if (placement.startChunkId && !chunks.has(placement.startChunkId)) fail(`${path}.startChunkId`, `chunkId must exist in the same Scene: ${placement.startChunkId}`);
      if (placement.endChunkId && !chunks.has(placement.endChunkId)) fail(`${path}.endChunkId`, `chunkId must exist in the same Scene: ${placement.endChunkId}`);
      if (placement.startChunkId && placement.endChunkId && chunkOrder.get(placement.endChunkId)! < chunkOrder.get(placement.startChunkId)!) fail(`${path}.endChunkId`, "endChunkId must not precede startChunkId");
      const validRegion =
        (placement.role === "background" && placement.region === "full-canvas") ||
        (placement.role === "fox-expression" && placement.region === "fox-left") ||
        (["main-media", "chart", "illustration", "entity-card", "picture-book"].includes(placement.role) &&
          ["main-stage", "main-primary", "main-entity"].includes(placement.region)) ||
        (placement.role === "overlay" && ["full-canvas", "lower-third"].includes(placement.region));
      if (!validRegion) fail(`${path}.region`, `region ${placement.region} is invalid for role ${placement.role}`);
    });
    const backgrounds = scene.assetPlacements.filter((placement) => placement.role === "background");
    if (backgrounds.length !== 1) {
      fail(`${base}.assetPlacements`, "exactly one fixed background placement is required");
    }
    const background = backgrounds[0];
    if (
      background.assetId !== "mainBackground" ||
      background.region !== "full-canvas" ||
      background.fit !== "cover" ||
      background.opacity !== 1 ||
      background.startChunkId !== null ||
      background.endChunkId !== null
    ) {
      fail(
        `${base}.assetPlacements[${scene.assetPlacements.indexOf(background)}]`,
        "background must be the full-Scene mainBackground placement",
      );
    }

    const mainStageRoles = new Set(["main-media", "chart", "illustration"]);
    scene.narrationChunks.forEach((chunk, chunkIndex) => {
      const active = scene.assetPlacements.filter((placement) => {
        if (!mainStageRoles.has(placement.role)) return false;
        const start = placement.startChunkId
          ? chunkOrder.get(placement.startChunkId)!
          : 0;
        const end = placement.endChunkId
          ? chunkOrder.get(placement.endChunkId)!
          : scene.narrationChunks.length - 1;
        return start <= chunkIndex && chunkIndex <= end;
      });
      if (active.length > 1) {
        fail(
          `${base}.assetPlacements`,
          `main-stage assets overlap at ${chunk.chunkId}: ${active.map((item) => item.placementId).join(", ")}`,
        );
      }
    });

    const allObjectIds = new Set([...cardIds, ...numberIds, ...nodeIds, ...arrowIds]);
    let expectedBeatStart = 0;
    scene.visualBeats.forEach((beat, beatIndex) => {
      const path = `${base}.visualBeats[${beatIndex}]`;
      const startIndex = chunkOrder.get(beat.startChunkId) ??
        fail(`${path}.startChunkId`, `chunkId must exist in the same Scene: ${beat.startChunkId}`);
      const endIndex = chunkOrder.get(beat.endChunkId) ??
        fail(`${path}.endChunkId`, `chunkId must exist in the same Scene: ${beat.endChunkId}`);
      if (endIndex < startIndex) fail(`${path}.endChunkId`, "endChunkId must not precede startChunkId");
      if (startIndex !== expectedBeatStart) {
        fail(`${path}.startChunkId`, `Visual Beats must cover narration contiguously; expected ${chunkIds[expectedBeatStart]}`);
      }
      expectedBeatStart = endIndex + 1;

      const startChunk = scene.narrationChunks[startIndex];
      const endChunk = scene.narrationChunks[endIndex];
      if (!startChunk.speechText.includes(beat.narrationStartCue) && !startChunk.captionText.includes(beat.narrationStartCue)) {
        fail(`${path}.narrationStartCue`, "cue must occur in the referenced start chunk");
      }
      if (!endChunk.speechText.includes(beat.narrationEndCue) && !endChunk.captionText.includes(beat.narrationEndCue)) {
        fail(`${path}.narrationEndCue`, "cue must occur in the referenced end chunk");
      }
      requireSourceIds(beat.evidenceSourceIds, sourceIds, `${path}.evidenceSourceIds`);
      beat.objectIds.forEach((id, index) => {
        if (!allObjectIds.has(id)) fail(`${path}.objectIds[${index}]`, `unknown object ID: ${id}`);
      });
      beat.assetPlacementIds.forEach((id, index) => {
        const placement = placementsById.get(id) ??
          fail(`${path}.assetPlacementIds[${index}]`, `unknown placement ID: ${id}`);
        if (placement.role === "background" || placement.role === "fox-expression" || placement.role === "overlay") {
          fail(`${path}.assetPlacementIds[${index}]`, `Visual Beat cannot own ${placement.role} placement: ${id}`);
        }
      });
      if (!["ready", "user-review-required", "not-required"].includes(beat.assetState)) {
        fail(`${path}.assetState`, `production Beat is incomplete: ${beat.assetState}`);
      }
      if (beat.assetPlacementIds.length === 0 && beat.assetState !== "not-required") {
        fail(`${path}.assetState`, "Beat without an external asset requires not-required");
      }
      if (beat.assetPlacementIds.length > 0 && !["ready", "user-review-required"].includes(beat.assetState)) {
        fail(`${path}.assetState`, "Beat with an external asset requires ready or user-review-required");
      }

      const beatPlacements = beat.assetPlacementIds.map((id) => placementsById.get(id)!);
      const nextBeat = scene.visualBeats[beatIndex + 1];
      if (beat.returnScreenState !== null && nextBeat?.screenState !== beat.returnScreenState) {
        fail(`${path}.returnScreenState`, `next Beat must return to ${beat.returnScreenState}`);
      }
      if (["EntityFocus", "MainWithEntity", "PictureBook", "News"].includes(beat.screenState)) {
        if (!nextBeat) fail(`${path}.screenState`, `${beat.screenState} must return before the Scene ends`);
        if (beat.returnScreenState === null) fail(`${path}.returnScreenState`, `${beat.screenState} requires a return screen state`);
      }
      if (beat.screenState === "EntityFocus") {
        if (!beat.entity) fail(`${path}.entity`, "EntityFocus requires entity metadata");
        if (beat.entity?.variant === "noPhoto") {
          if (beatPlacements.length !== 0 || beat.assetState !== "not-required" || beat.entity.assetId !== null || beat.entity.rightsStatus !== "not-required") {
            fail(`${path}.entity`, "noPhoto requires no external placement, assetId null, not-required rights, and not-required asset state");
          }
        } else if (beatPlacements.length !== 1 || !["entity-card", "main-media"].includes(beatPlacements[0].role) || beatPlacements[0].region !== "main-stage") {
          fail(`${path}.assetPlacementIds`, "EntityFocus requires exactly one entity card in main-stage unless variant is noPhoto");
        }
      } else if (beat.screenState === "MainWithEntity") {
        if (!beat.entity) fail(`${path}.entity`, "MainWithEntity requires entity metadata");
        const entityPlacements = beatPlacements.filter((placement) => ["entity-card", "main-media"].includes(placement.role) && placement.region === "main-entity");
        if (beat.entity?.variant === "noPhoto") {
          if (entityPlacements.length !== 0 || beat.entity.assetId !== null || beat.entity.rightsStatus !== "not-required") fail(`${path}.entity`, "MainWithEntity noPhoto must not reference an external entity asset");
        } else if (entityPlacements.length !== 1) fail(`${path}.assetPlacementIds`, "MainWithEntity requires exactly one entity card in main-entity");
        if (beat.objectIds.length === 0 && !beatPlacements.some((placement) => placement.region === "main-primary")) {
          fail(`${path}.primaryElement`, "MainWithEntity requires a primary diagram or data object");
        }
      } else if (beat.entity !== null) {
        fail(`${path}.entity`, "entity metadata is only valid for EntityFocus or MainWithEntity");
      }
      if (beat.screenState === "PictureBook") {
        if (!beat.pictureBook) fail(`${path}.pictureBook`, "PictureBook requires checked illustration metadata");
        if (beatPlacements.length !== 1 || !["picture-book", "illustration"].includes(beatPlacements[0].role) || beatPlacements[0].region !== "main-stage") {
          fail(`${path}.assetPlacementIds`, "PictureBook requires exactly one illustration in main-stage");
        }
        if (beat.pictureBook && beat.pictureBook.completedAssetId !== beatPlacements[0].assetId) {
          fail(`${path}.pictureBook.completedAssetId`, "completed asset must match the Beat placement");
        }
        if (beatPlacements[0]?.fit !== "contain") fail(`${path}.assetPlacementIds`, "PictureBook must use contain without cropping");
      } else if (beat.pictureBook !== null) {
        fail(`${path}.pictureBook`, "pictureBook metadata is only valid for PictureBook");
      }
      if (beat.screenState === "News") {
        if (beatPlacements.length !== 1 || beatPlacements[0].role !== "main-media" || beatPlacements[0].region !== "main-stage") {
          fail(`${path}.assetPlacementIds`, "News requires exactly one cleared main-media placement");
        }
        if (beatPlacements[0]?.fit !== "contain") fail(`${path}.assetPlacementIds`, "News media must use contain without cropping");
      }

      if (beat.entity && beat.entity.variant !== "noPhoto") {
        const entityPlacement = beatPlacements.find((placement) => ["entity-card", "main-media"].includes(placement.role));
        if (beat.entity.variant === "photo") {
          if (entityPlacement?.fit !== "cover" || !entityPlacement.focalPoint) fail(`${path}.entity`, "person photo requires cover and an explicit focalPoint");
        } else if (entityPlacement?.fit !== "contain") {
          fail(`${path}.entity`, "company and product visuals must use contain without cropping");
        }
      }
      if (["Data", "Chart"].includes(beat.screenState) && beatPlacements.length > 1) {
        fail(`${path}.assetPlacementIds`, `${beat.screenState} allows at most one primary main asset`);
      }

      const beatCards = scene.cards.filter((item) => beat.objectIds.includes(item.cardId));
      const beatNumbers = scene.numbers.filter((item) => beat.objectIds.includes(item.numberId));
      const beatNodes = scene.nodes.filter((item) => beat.objectIds.includes(item.nodeId));
      const beatArrows = scene.arrows.filter((item) => beat.objectIds.includes(item.arrowId));
      const beatRequirements: Partial<Record<typeof beat.visualMode, boolean>> = {
        "conclusion-card": beatCards.length >= 1,
        "number-comparison": beatNumbers.length >= 2,
        "expected-actual-gap": beatCards.length === 3 && ["expected", "actual", "gap"].every((role) => beatCards.filter((card) => card.role === role).length === 1),
        "chart": beatNumbers.length >= 1 || beatPlacements.some((item) => item.role === "chart"),
        "causal-diagram": beatNodes.length >= 2 && beatArrows.length >= 1,
        "stock-comparison": beatNumbers.length >= 2,
        "news-media": beat.screenState === "News" && beatPlacements.some((item) => item.role === "main-media"),
        "verification-points": beatCards.length >= 1,
        "text-focus": beat.viewerTexts.length > 0,
      };
      if (beatRequirements[beat.visualMode] === false) {
        fail(`${path}.visualMode`, `required Beat data missing for ${beat.visualMode}`);
      }
    });
    if (expectedBeatStart !== scene.narrationChunks.length) {
      fail(`${base}.visualBeats`, "Visual Beats must cover every narration chunk exactly once");
    }
    if (scene.visualBeats[0].visualMode !== scene.visualMode) {
      fail(`${base}.visualMode`, "Scene visualMode must match the first Visual Beat");
    }

    const requirements: Partial<Record<RenderSpec["scenes"][number]["visualMode"], boolean>> = {
      "conclusion-card": scene.cards.length >= 1,
      "number-comparison": scene.numbers.length >= 2,
      "expected-actual-gap": scene.cards.length === 3 && ["expected", "actual", "gap"].every((role) => scene.cards.filter((card) => card.role === role).length === 1),
      "chart": scene.numbers.length >= 1 || scene.assetPlacements.some((item) => item.role === "chart"),
      "causal-diagram": scene.nodes.length >= 2 && scene.arrows.length >= 1,
      "stock-comparison": scene.numbers.length >= 2,
      "news-media": scene.assetPlacements.some((item) => item.role === "main-media"),
      "verification-points": scene.cards.length >= 1,
      "text-focus": scene.headline.trim().length > 0 || scene.supportingTexts.length > 0,
    };
    if (requirements[scene.visualMode] === false) fail(`${base}.visualMode`, `required data missing for ${scene.visualMode}`);
    if (scene.visualMode === "expected-actual-gap") {
      for (const role of ["expected", "actual", "gap"] as const) {
        const matches = scene.cards.map((card, index) => ({card, index})).filter(({card}) => card.role === role);
        if (matches.length === 0) fail(`${base}.cards`, `missing required card role: ${role}`);
        if (matches.length > 1) fail(`${base}.cards[${matches[1].index}].role`, `duplicate card role: ${role}`);
      }
      const withoutRole = scene.cards.findIndex((card) => card.role === null);
      if (withoutRole >= 0) fail(`${base}.cards[${withoutRole}].role`, "expected-actual-gap requires an explicit role");
    }

    if (sceneIndex < 8 && scene.transition.type === "none") fail(`${base}.transition.type`, "Scene 1-8 require cut or fade");
    if (sceneIndex === 8 && scene.transition.type !== "none") fail(`${base}.transition.type`, "Scene 9 transition must be none");
    if ((scene.transition.type === "cut" || scene.transition.type === "none") && scene.transition.durationMs !== 0) fail(`${base}.transition.durationMs`, `${scene.transition.type} requires durationMs 0`);
    if (scene.transition.type === "fade" && scene.transition.durationMs === 0) fail(`${base}.transition.durationMs`, "fade requires a positive durationMs");
  });
  return spec;
};

export const assertRenderSpecApprovedForCompile = (spec: RenderSpec) => {
  if (!spec.review.approvedForCodex) fail("$.review.approvedForCodex", "compile requires approvedForCodex: true");
};

export const PRODUCTION_FORBIDDEN_TEXT = [
  "fallback", "実測", "表示中", "画面構成：", "AUDIO-MEASURED",
  "conversion warning", "debug metadata", "タイトルの約束を回収", "図を再表示",
] as const;

export const assertProductionTextSafe = (value: unknown, path = "$"): void => {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    const found = PRODUCTION_FORBIDDEN_TEXT.find((item) => lower.includes(item.toLowerCase()));
    if (found) fail(path, `production forbidden text: ${found}`);
    return;
  }
  if (Array.isArray(value)) return value.forEach((item, index) => assertProductionTextSafe(item, `${path}[${index}]`));
  if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => assertProductionTextSafe(item, `${path}.${key}`));
};
