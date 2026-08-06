import {z} from "zod";
import {
  EASING_PRESET_IDS,
  MOTION_PRESET_IDS,
  SEQUENCE_POLICY_IDS,
  isMotionPresetAllowed,
  type MotionAction,
} from "./motion-preset-contract";
import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_VARIANT_IDS,
} from "./visual-template-contract";
import {
  transitionRoleSchema,
  visualGrammarIdSchema,
  visualGrammarRootContractSchema,
} from "./visual-grammar-contract";
import {
  financialVisualRootContractSchema,
  financialVisualTraceSchema,
  isFinancialRecipeTemplatePairAllowed,
  isFinancialVisualTemplate,
} from "./financial-visual-contract";
import {
  CAMERA_PRESET_IDS,
  SHOT_RECIPE_IDS,
  SHOT_TRANSITION_IDS,
  SOUND_CUE_IDS,
  STAGE_LAYOUT_IDS,
  TYPOGRAPHY_TREATMENT_IDS,
} from "./shot-contract";

const nonEmptyText = z.string().refine((value) => value.trim().length > 0, "must not be empty");
const nullableText = nonEmptyText.nullable();
const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const sourceIdSchema = z.string().regex(/^source-[0-9]{3}$/);

export const expressionSchema = z.enum([
  "通常", "分析", "ニヤリ", "軽い驚き", "困惑", "警戒", "眠そう",
]);
export const specVisualModeSchema = z.enum([
  "conclusion-card", "number-comparison", "expected-actual-gap", "timeline",
  "chart", "causal-diagram", "stock-comparison", "news-media",
  "verification-points", "text-focus",
]);
export const visualTemplateSchema = z.enum(VISUAL_TEMPLATE_IDS);
export const visualTemplateVariantSchema = z.enum(VISUAL_TEMPLATE_VARIANT_IDS);
export const sequencePolicySchema = z.enum(SEQUENCE_POLICY_IDS);
export const motionPresetSchema = z.enum(MOTION_PRESET_IDS);
export const easingPresetSchema = z.enum(EASING_PRESET_IDS);
export const shotRecipeSchema = z.enum(SHOT_RECIPE_IDS);
export const stageLayoutSchema = z.enum(STAGE_LAYOUT_IDS);
export const cameraPresetSchema = z.enum(CAMERA_PRESET_IDS);
export const shotTransitionSchema = z.enum(SHOT_TRANSITION_IDS);
export const typographyTreatmentSchema = z.enum(TYPOGRAPHY_TREATMENT_IDS);
export const soundCueSchema = z.enum(SOUND_CUE_IDS);
const visualTemplateConfigSchema = z.object({
  variant: visualTemplateVariantSchema,
  comparisonBasis: nullableText,
  dataBasis: nonEmptyText,
  nodeOrder: z.array(safeId).max(4),
  laneLabels: z.array(nonEmptyText).max(2),
  outcomeNodeId: safeId.nullable(),
  displayOrder: z.array(safeId).max(10).optional(),
  metricIds: z.array(safeId).max(6).optional(),
  causalStepIds: z.array(safeId).max(4).optional(),
  highlightObjectIds: z.array(safeId).max(4).optional(),
}).strict();
export const visualBeatFunctionSchema = z.enum([
  "Anchor", "Evidence", "Compare", "Explain", "Verify",
]);
export const screenStateSchema = z.enum([
  "Data", "Chart", "EntityFocus", "MainWithEntity", "PictureBook", "News",
]);
export const assetStateSchema = z.enum([
  "ready", "missing", "invalid", "user-review-required", "not-required",
]);
export const expectedBasisTypeSchema = z.enum([
  "official-consensus", "company-prior-guidance", "major-reporting",
  "analyst-view", "price-inference", "unconfirmed",
]);
export const voiceProfileSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("voicevox"),
    speakerUuid: nonEmptyText,
    styleId: z.number().int().nonnegative(),
    speakingRate: z.number().min(0.5).max(2),
    pitchScale: z.number().min(-0.15).max(0.15),
    intonationScale: z.number().min(0).max(2),
    volumeScale: z.number().min(0).max(2),
    characterName: nonEmptyText,
    styleName: nonEmptyText,
    provisional: z.boolean(),
  }).strict(),
  z.object({
    provider: z.literal("gemini"),
    model: nonEmptyText,
    voice: nonEmptyText,
    speakerUuid: nonEmptyText,
    styleId: z.number().int().nonnegative(),
    speakingRate: z.number().min(0.5).max(2),
    pitchScale: z.number().min(-0.15).max(0.15),
    intonationScale: z.number().min(0).max(2),
    volumeScale: z.number().min(0).max(2),
    characterName: nonEmptyText,
    styleName: nonEmptyText,
    provisional: z.boolean(),
  }).strict(),
]);

const episodeSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  marketSession: nonEmptyText,
  informationCutoff: nonEmptyText,
  episodeType: z.enum(["single-news", "composite-story", "reason-unknown"]),
  durationMode: z.enum(["standard", "shortened"]),
  shortenedReason: nullableText,
  fps: z.number().int().min(24).max(60),
  width: z.number().int().min(1280).max(3840),
  height: z.number().int().min(720).max(2160),
}).strict();

const editorialSchema = z.object({
  leadNews: nullableText,
  leadTheme: nullableText,
  targetIndices: z.array(nonEmptyText).min(1),
  storySpine: nonEmptyText,
  centralHypothesis: nonEmptyText,
  confidence: z.enum(["high", "medium", "low", "unknown"]),
  directMaterial: z.array(nonEmptyText),
  nasdaqDrivers: z.array(nonEmptyText),
  amplifiers: z.array(nonEmptyText),
  offsettingFactors: z.array(nonEmptyText),
  expected: nullableText,
  actual: nullableText,
  gap: nullableText,
  expectedBasisType: expectedBasisTypeSchema.nullable(),
  expectedBasisDetails: nullableText,
  expectedSourceIds: z.array(sourceIdSchema),
  timelineBasis: nullableText,
  counterEvidence: z.array(nonEmptyText),
  verificationPoints: z.array(nonEmptyText),
}).strict();

const publishingSchema = z.object({
  recommendedTitle: nonEmptyText,
  titleCandidates: z.array(nonEmptyText).length(3),
  recommendedThumbnailText: nonEmptyText,
  thumbnailTextCandidates: z.array(nonEmptyText).length(3),
  description: nonEmptyText,
}).strict();

const sourceSchema = z.object({
  sourceId: sourceIdSchema,
  title: nonEmptyText,
  publisher: nonEmptyText,
  sourceType: z.enum(["official", "company", "major-media", "analyst", "market-data", "other"]),
  reference: nonEmptyText,
  publishedAt: nullableText,
  accessedAt: nonEmptyText,
  usedFor: z.array(nonEmptyText).min(1),
  narrationAttribution: nonEmptyText,
}).strict();

const reviewSchema = z.object({
  verdict: z.enum(["approved", "approved-with-changes", "rejected"]),
  scores: z.object({
    openingHook: z.number().int().min(0).max(5),
    storyProgression: z.number().int().min(0).max(5),
    discovery: z.number().int().min(0).max(5),
    clarity: z.number().int().min(0).max(5),
    foxCharacter: z.number().int().min(0).max(5),
    reasonToFinish: z.number().int().min(0).max(5),
  }).strict(),
  totalScore: z.number().int().min(0).max(30),
  largestDropoffRisk: nonEmptyText,
  requiredChanges: z.array(nonEmptyText),
  changesApplied: z.array(nonEmptyText),
  titleThumbnailConsistency: z.enum(["consistent", "needs-revision"]),
  approvedForCodex: z.boolean(),
}).strict();

const pronunciationSchema = z.object({surface: nonEmptyText, reading: nonEmptyText}).strict();
const correctionSchema = z.object({
  correctionId: z.string().regex(/^correction-[0-9]{3}$/),
  original: nonEmptyText,
  corrected: nonEmptyText,
  reason: nonEmptyText,
}).strict();

const cardSchema = z.object({
  cardId: safeId,
  role: z.enum(["expected", "actual", "gap"]).nullable(),
  title: nonEmptyText,
  lines: z.array(z.object({
    label: nonEmptyText,
    value: nonEmptyText,
    tone: z.enum(["positive", "negative", "warning", "neutral", "emphasis"]),
  }).strict()).min(1),
}).strict();
const numberSchema = z.object({
  numberId: safeId,
  label: nonEmptyText,
  value: nonEmptyText,
  numericValue: z.number().finite().nullable().optional(),
  precision: z.number().int().min(0).max(6).optional(),
  unit: z.string(),
  comparison: nullableText,
  tone: z.enum(["positive", "negative", "warning", "neutral", "emphasis"]),
}).strict();
const nodeSchema = z.object({nodeId: safeId, label: nonEmptyText}).strict();
const arrowSchema = z.object({arrowId: safeId, fromNodeId: safeId, toNodeId: safeId, label: z.string()}).strict();
const narrationChunkSchema = z.object({
  chunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  speechText: nonEmptyText,
  captionText: nonEmptyText,
  expression: expressionSchema,
  pauseAfterMs: z.number().int().min(0).max(10_000),
}).strict();

const entityBeatSchema = z.object({
  subjectType: z.enum(["person", "company", "product"]),
  displayName: nonEmptyText,
  role: nonEmptyText,
  firstMentionCue: nonEmptyText,
  variant: z.enum(["photo", "noPhoto", "company", "product"]),
  assetId: safeId.nullable(),
  rightsStatus: z.enum(["cleared", "user-review-required", "not-required"]),
  targetDurationMs: z.number().int().min(5_000).max(8_000),
}).strict();

const pictureBookBeatSchema = z.object({
  difficultPoint: nonEmptyText,
  analogyPurpose: nonEmptyText,
  shortAnalogy: nonEmptyText,
  analogyType: z.enum([
    "university-life", "overseas-life", "hong-kong", "it",
    "household-shopping", "cooking", "fox-daily-life",
  ]),
  referenceAssetId: safeId,
  aspectRatio: z.literal("16:9"),
  generationPrompt: nonEmptyText,
  completedAssetId: safeId,
  marketReturnCue: nonEmptyText,
  sameFoxCheck: z.literal("pass"),
  pictureBookStyleCheck: z.literal("pass"),
  noBakedTextCheck: z.literal("pass"),
}).strict();

const shotSchema = z.object({
  shotId: z.string().regex(/^scene-0[1-9]-beat-[0-9]{3}-shot-[0-9]{3}$/),
  shotRecipe: shotRecipeSchema,
  startChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  startProgress: z.number().min(0).max(1),
  startOffsetMs: z.number().int().min(0).max(10_000),
  endChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  endProgress: z.number().min(0).max(1),
  endOffsetMs: z.number().int().min(0).max(10_000),
  startCue: nonEmptyText.optional(),
  endCue: nonEmptyText,
  primaryTargetId: safeId.nullable(),
  referenceTargetId: safeId.nullable().optional(),
  outcomeTargetId: safeId.nullable().optional(),
  secondaryTargetIds: z.array(safeId).max(6).optional(),
  cameraTargetId: safeId.nullable().optional(),
  stageLayout: stageLayoutSchema,
  cameraPreset: cameraPresetSchema,
  transitionIn: shotTransitionSchema,
  transitionOut: shotTransitionSchema,
  continuityKey: safeId.nullable(),
  typographyTreatment: typographyTreatmentSchema.nullable(),
  typographyText: nullableText,
  soundCue: soundCueSchema.nullable(),
  foxExpression: expressionSchema,
}).strict().superRefine((shot, context) => {
  if (shot.typographyTreatment !== null && shot.typographyText === null) {
    context.addIssue({code: "custom", path: ["typographyText"], message: "typographyTreatment requires typographyText"});
  }
  if (shot.typographyTreatment === null && shot.typographyText !== null) {
    context.addIssue({code: "custom", path: ["typographyTreatment"], message: "typographyText requires typographyTreatment"});
  }
});

const visualBeatSchema = z.object({
  beatId: z.string().regex(/^(?:scene-0[1-9]-beat-[0-9]{3}|vb-0[1-9]-[0-9]{2})$/),
  startChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  endChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  narrationStartCue: nonEmptyText,
  narrationEndCue: nonEmptyText,
  primaryFunction: visualBeatFunctionSchema,
  screenState: screenStateSchema,
  visualMode: specVisualModeSchema,
  visualTemplate: visualTemplateSchema,
  visualGrammarId: visualGrammarIdSchema.optional(),
  transitionRole: transitionRoleSchema.optional(),
  templateVariant: visualTemplateVariantSchema.optional(),
  templateConfig: visualTemplateConfigSchema,
  sequencePolicy: sequencePolicySchema.optional(),
  finalHoldMs: z.number().int().min(0).max(1_500).optional(),
  contentType: nonEmptyText,
  screenQuestion: nonEmptyText,
  primaryElement: nonEmptyText,
  viewerTexts: z.array(nonEmptyText).max(4),
  changeCue: nonEmptyText,
  objectIds: z.array(safeId),
  assetPlacementIds: z.array(safeId),
  assetState: assetStateSchema,
  returnScreenState: screenStateSchema.nullable(),
  evidenceSourceIds: z.array(sourceIdSchema),
  expressionChange: expressionSchema.nullable(),
  fallback: nullableText,
  financialReturnTarget: nonEmptyText.optional(),
  financialVisualTrace: financialVisualTraceSchema.optional(),
  entity: entityBeatSchema.nullable(),
  pictureBook: pictureBookBeatSchema.nullable(),
  shots: z.array(shotSchema).max(4).optional(),
}).strict();

export const visualActionSchema = z.enum(["show", "hide", "highlight", "unhighlight", "set-expression"]);
const visualEventSchema = z.object({
  eventId: z.string().regex(/^event-[0-9]{3}$/),
  atChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/),
  timing: z.enum(["chunk-start", "chunk-end"]),
  action: visualActionSchema,
  targetId: safeId.nullable(),
  offsetMs: z.number().int().min(0).max(10_000),
  expression: expressionSchema.nullable(),
  motionPreset: motionPresetSchema.nullable().optional(),
  durationMs: z.number().int().min(100).max(3_000).nullable().optional(),
  easingPreset: easingPresetSchema.nullable().optional(),
}).strict().superRefine((event, context) => {
  if (event.action === "set-expression") {
    if (event.expression === null) context.addIssue({code: "custom", path: ["expression"], message: "set-expression requires expression"});
    if (event.targetId !== null) context.addIssue({code: "custom", path: ["targetId"], message: "set-expression must not target an object"});
    if (event.motionPreset != null || event.durationMs != null || event.easingPreset != null) {
      context.addIssue({code: "custom", path: ["motionPreset"], message: "set-expression must not specify motion fields"});
    }
    return;
  }
  if (event.targetId === null) context.addIssue({code: "custom", path: ["targetId"], message: `${event.action} requires targetId`});
  if (event.expression !== null) context.addIssue({code: "custom", path: ["expression"], message: `${event.action} must not specify expression`});
  if (event.motionPreset != null) {
    if (!isMotionPresetAllowed(event.action as MotionAction, event.motionPreset)) {
      context.addIssue({code: "custom", path: ["motionPreset"], message: `${event.motionPreset} is not allowed for ${event.action}`});
    }
    if (event.durationMs == null) {
      context.addIssue({code: "custom", path: ["durationMs"], message: "motionPreset requires durationMs"});
    }
  } else if (event.durationMs != null || event.easingPreset != null) {
    context.addIssue({code: "custom", path: ["motionPreset"], message: "durationMs and easingPreset require motionPreset"});
  }
});

const assetPlacementSchema = z.object({
  placementId: safeId,
  assetId: safeId,
  role: z.enum([
    "background", "fox-expression", "main-media", "chart", "illustration",
    "entity-card", "picture-book", "overlay",
  ]),
  region: z.enum([
    "full-canvas", "fox-left", "main-stage", "main-primary",
    "main-entity", "lower-third",
  ]),
  fit: z.enum(["cover", "contain", "fill"]),
  focalPoint: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }).strict().nullable().optional(),
  opacity: z.number().min(0).max(1),
  startChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/).nullable(),
  endChunkId: z.string().regex(/^scene-0[1-9]-chunk-[0-9]{3}$/).nullable(),
}).strict();
const transitionSchema = z.object({
  type: z.enum(["cut", "fade", "none"]),
  durationMs: z.number().int().min(0).max(2_000),
}).strict();

const sceneSchema = z.object({
  sceneId: z.enum(["scene-01", "scene-02", "scene-03", "scene-04", "scene-05", "scene-06", "scene-07", "scene-08", "scene-09"]),
  sceneNumber: z.number().int().min(1).max(9),
  sceneRole: z.enum(["opening-hook-market-direction-greeting-conclusion", "editorial-body", "closing-recap-sendoff-goodnight"]),
  formalName: nonEmptyText,
  purpose: nonEmptyText,
  causalScope: z.enum(["lead-stock", "sector", "nasdaq", "multiple"]),
  performanceIntent: nonEmptyText,
  evidenceSourceIds: z.array(sourceIdSchema),
  uncertainty: nullableText,
  timelineBasis: nullableText,
  expectedBasisType: expectedBasisTypeSchema.nullable(),
  visualMode: specVisualModeSchema,
  initialExpression: expressionSchema,
  headline: nonEmptyText,
  supportingTexts: z.array(nonEmptyText),
  sourceLabel: z.string(),
  narrationChunks: z.array(narrationChunkSchema).min(1),
  visualBeats: z.array(visualBeatSchema).min(1),
  cards: z.array(cardSchema),
  numbers: z.array(numberSchema),
  nodes: z.array(nodeSchema),
  arrows: z.array(arrowSchema),
  visualEvents: z.array(visualEventSchema),
  assetPlacements: z.array(assetPlacementSchema),
  // eslint-disable-next-line @remotion/non-pure-animation -- Schema field, not a rendered animation.
  transition: transitionSchema,
}).strict();

export const renderSpecSchema = z.object({
  schemaVersion: z.union([
    z.literal("2.2.0"),
    z.literal("2.3.0"),
    z.literal("2.4.0"),
  ]),
  financialVisualContract: financialVisualRootContractSchema.optional(),
  visualGrammarContract: visualGrammarRootContractSchema.optional(),
  episode: episodeSchema,
  editorial: editorialSchema,
  publishing: publishingSchema,
  sources: z.array(sourceSchema).min(1),
  review: reviewSchema,
  pronunciations: z.array(pronunciationSchema),
  corrections: z.array(correctionSchema),
  voiceProfileId: safeId,
  scenes: z.array(sceneSchema).length(9),
}).strict().superRefine((spec, context) => {
  if (spec.episode.id !== spec.episode.targetDate) context.addIssue({code: "custom", path: ["episode", "targetDate"], message: "targetDate must match episode.id"});
  if (spec.episode.durationMode === "standard" && spec.episode.shortenedReason !== null) {
    context.addIssue({code: "custom", path: ["episode", "shortenedReason"], message: "standard duration requires shortenedReason: null"});
  }
  if (spec.episode.durationMode === "shortened" && spec.episode.shortenedReason === null) {
    context.addIssue({code: "custom", path: ["episode", "shortenedReason"], message: "shortened duration requires a reason"});
  }
  if (spec.episode.episodeType === "single-news" && spec.editorial.leadNews === null) context.addIssue({code: "custom", path: ["editorial", "leadNews"], message: "single-news requires leadNews"});
  if (spec.episode.episodeType === "composite-story" && spec.editorial.leadTheme === null) context.addIssue({code: "custom", path: ["editorial", "leadTheme"], message: "composite-story requires leadTheme"});
  if (spec.episode.episodeType !== "reason-unknown") {
    for (const key of ["expected", "actual", "gap", "expectedBasisType", "expectedBasisDetails"] as const) {
      if (spec.editorial[key] === null) context.addIssue({code: "custom", path: ["editorial", key], message: `${spec.episode.episodeType} requires ${key}`});
    }
  }
  if (!spec.publishing.titleCandidates.includes(spec.publishing.recommendedTitle)) context.addIssue({code: "custom", path: ["publishing", "recommendedTitle"], message: "recommendedTitle must be one of titleCandidates"});
  if (!spec.publishing.thumbnailTextCandidates.includes(spec.publishing.recommendedThumbnailText)) context.addIssue({code: "custom", path: ["publishing", "recommendedThumbnailText"], message: "recommendedThumbnailText must be one of thumbnailTextCandidates"});
  if (new Set(spec.publishing.titleCandidates).size !== 3) context.addIssue({code: "custom", path: ["publishing", "titleCandidates"], message: "titleCandidates must be unique"});
  if (new Set(spec.publishing.thumbnailTextCandidates).size !== 3) context.addIssue({code: "custom", path: ["publishing", "thumbnailTextCandidates"], message: "thumbnailTextCandidates must be unique"});
  const scoreTotal = Object.values(spec.review.scores).reduce((sum, score) => sum + score, 0);
  if (spec.review.totalScore !== scoreTotal) context.addIssue({code: "custom", path: ["review", "totalScore"], message: `totalScore must equal score sum ${scoreTotal}`});
  const uniqueAt = (values: string[], path: PropertyKey[]) => {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value)) context.addIssue({code: "custom", path: [...path, index], message: `duplicate ID: ${value}`});
      seen.add(value);
    });
  };
  uniqueAt(spec.sources.map((item) => item.sourceId), ["sources"]);
  uniqueAt(spec.pronunciations.map((item) => item.surface), ["pronunciations"]);
  uniqueAt(spec.corrections.map((item) => item.correctionId), ["corrections"]);
  uniqueAt(spec.scenes.flatMap((scene) => scene.narrationChunks.map((chunk) => chunk.chunkId)), ["scenes"]);
  uniqueAt(spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => beat.beatId)), ["scenes"]);
  uniqueAt(spec.scenes.flatMap((scene) => scene.visualEvents.map((event) => event.eventId)), ["scenes"]);
  uniqueAt(spec.scenes.flatMap((scene) => scene.visualBeats.flatMap((beat) => (beat.shots ?? []).map((shot) => shot.shotId))), ["scenes"]);
  const expectedIds = Array.from({length: 9}, (_, index) => `scene-${String(index + 1).padStart(2, "0")}`);
  spec.scenes.forEach((scene, index) => {
    if (scene.sceneId !== expectedIds[index] || scene.sceneNumber !== index + 1) context.addIssue({code: "custom", path: ["scenes", index], message: `expected ${expectedIds[index]} with sceneNumber ${index + 1}`});
    const expectedRole = index === 0 ? "opening-hook-market-direction-greeting-conclusion" : index === 8 ? "closing-recap-sendoff-goodnight" : "editorial-body";
    if (scene.sceneRole !== expectedRole) context.addIssue({code: "custom", path: ["scenes", index, "sceneRole"], message: `Scene ${index + 1} requires role ${expectedRole}`});
  });

  const arraysEqual = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);
  const financialTraceBeats = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.flatMap((beat, beatIndex) =>
      beat.financialVisualTrace ? [{sceneIndex, beatIndex, beat, trace: beat.financialVisualTrace}] : [],
    ),
  );
  const newFinancialTemplates = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.flatMap((beat, beatIndex) =>
      isFinancialVisualTemplate(beat.visualTemplate) ? [{sceneIndex, beatIndex, beat}] : [],
    ),
  );
  if (spec.schemaVersion === "2.2.0") {
    if (spec.financialVisualContract !== undefined) context.addIssue({code: "custom", path: ["financialVisualContract"], message: "render_spec 2.2.0 must not contain the financial root contract"});
    if (financialTraceBeats.length > 0 || newFinancialTemplates.length > 0) context.addIssue({code: "custom", path: ["scenes"], message: "financial Visual Beats require render_spec 2.3.0"});
  } else {
    if (newFinancialTemplates.some(({beat}) => beat.financialVisualTrace === undefined)) {
      context.addIssue({code: "custom", path: ["scenes"], message: "new financial Visual Templates require financialVisualTrace"});
    }
    if (financialTraceBeats.length > 0 && spec.financialVisualContract === undefined) {
      context.addIssue({code: "custom", path: ["financialVisualContract"], message: "financial Visual Beats require the root financialVisualContract"});
    }
    if (spec.financialVisualContract !== undefined) {
      if (spec.financialVisualContract.selectionCount !== financialTraceBeats.length) context.addIssue({code: "custom", path: ["financialVisualContract", "selectionCount"], message: `selectionCount must equal traced Beat count ${financialTraceBeats.length}`});
      const seenIntents = new Set<string>();
      const seenPlans = new Set<string>();
      financialTraceBeats.forEach(({sceneIndex, beatIndex, beat, trace}) => {
        const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
        if (seenIntents.has(trace.intentId)) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "intentId"], message: `duplicate financial intent: ${trace.intentId}`});
        if (seenPlans.has(trace.selectedPlanId)) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "selectedPlanId"], message: `duplicate selected financial plan: ${trace.selectedPlanId}`});
        seenIntents.add(trace.intentId);
        seenPlans.add(trace.selectedPlanId);
        if (trace.recipePlanSha256 !== spec.financialVisualContract?.recipePlanSha256) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "recipePlanSha256"], message: "trace Recipe Plan SHA must match root contract"});
        if (!isFinancialRecipeTemplatePairAllowed(trace.recipeId, beat.visualTemplate, trace.selectedPath)) context.addIssue({code: "custom", path: [...path, "visualTemplate"], message: `${trace.recipeId} is not allowed to select ${beat.visualTemplate} as ${trace.selectedPath}`});
        if (beat.templateVariant === undefined) context.addIssue({code: "custom", path: [...path, "templateVariant"], message: "financial Visual Beat requires templateVariant"});
        if (beat.templateVariant !== beat.templateConfig.variant) context.addIssue({code: "custom", path: [...path, "templateVariant"], message: "templateVariant must match templateConfig.variant"});
        if (!arraysEqual(beat.objectIds, trace.displayOrder)) context.addIssue({code: "custom", path: [...path, "objectIds"], message: "objectIds must equal selected displayOrder"});
        if (!arraysEqual(beat.evidenceSourceIds, trace.sourceIds)) context.addIssue({code: "custom", path: [...path, "evidenceSourceIds"], message: "evidenceSourceIds must equal selected sourceIds"});
        if (!arraysEqual(beat.templateConfig.displayOrder ?? [], trace.displayOrder)) context.addIssue({code: "custom", path: [...path, "templateConfig", "displayOrder"], message: "templateConfig.displayOrder must match trace"});
        if (!arraysEqual(beat.templateConfig.metricIds ?? [], trace.metricIds)) context.addIssue({code: "custom", path: [...path, "templateConfig", "metricIds"], message: "templateConfig.metricIds must match trace"});
        if (!arraysEqual(beat.templateConfig.causalStepIds ?? [], trace.causalStepIds)) context.addIssue({code: "custom", path: [...path, "templateConfig", "causalStepIds"], message: "templateConfig.causalStepIds must match trace"});
        if (beat.templateConfig.comparisonBasis !== trace.comparisonBasis) context.addIssue({code: "custom", path: [...path, "templateConfig", "comparisonBasis"], message: "comparison basis must match trace"});
        if (beat.financialReturnTarget === undefined) context.addIssue({code: "custom", path: [...path, "financialReturnTarget"], message: "financial Visual Beat requires a return target"});
        if (trace.selectedPath === "preferred" && trace.reasonCodes.length !== 0) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "reasonCodes"], message: "preferred selection must not contain fallback reason codes"});
        if (trace.selectedPath === "fallback" && trace.reasonCodes.length === 0) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "reasonCodes"], message: "fallback selection requires at least one reason code"});
      });
    }
  }
  const visualGrammarBeats = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.map((beat, beatIndex) => ({sceneIndex, beatIndex, beat})),
  );
  if (spec.schemaVersion === "2.4.0") {
    if (spec.visualGrammarContract === undefined) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract"],
        message: "render_spec 2.4.0 requires visualGrammarContract",
      });
    } else if (spec.visualGrammarContract.beatCount !== visualGrammarBeats.length) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract", "beatCount"],
        message: `beatCount must equal Visual Beat count ${visualGrammarBeats.length}`,
      });
    }
    visualGrammarBeats.forEach(({sceneIndex, beatIndex, beat}) => {
      const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
      if (beat.visualGrammarId === undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "visualGrammarId"],
          message: "render_spec 2.4.0 requires visualGrammarId",
        });
      }
      if (beat.transitionRole === undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "transitionRole"],
          message: "render_spec 2.4.0 requires transitionRole",
        });
      }
    });
  } else {
    if (spec.visualGrammarContract !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract"],
        message: `render_spec ${spec.schemaVersion} must not contain visualGrammarContract`,
      });
    }
    visualGrammarBeats.forEach(({sceneIndex, beatIndex, beat}) => {
      const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
      if (beat.visualGrammarId !== undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "visualGrammarId"],
          message: `render_spec ${spec.schemaVersion} must not contain visualGrammarId`,
        });
      }
      if (beat.transitionRole !== undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "transitionRole"],
          message: `render_spec ${spec.schemaVersion} must not contain transitionRole`,
        });
      }
    });
  }

});

export type RenderSpec = z.infer<typeof renderSpecSchema>;
export type RenderSpecScene = RenderSpec["scenes"][number];
export type Expression = z.infer<typeof expressionSchema>;
export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export type ProductionCaption = {text: string; startMs: number; endMs: number; timestampMs: null; confidence: null};
export type ProductionChunk = {
  chunkId: string; speechText: string; caption: ProductionCaption; expression: Expression;
  pauseAfterMs: number; audioSrc: string; audioDurationMs: number; startMs: number;
  endMs: number; startFrame: number; endFrame: number;
};
export type ProductionVisualBeat = RenderSpecScene["visualBeats"][number] & {
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
};
export type ProductionScene = Omit<RenderSpecScene, "narrationChunks" | "visualBeats"> & {
  narrationChunks: ProductionChunk[];
  visualBeats: ProductionVisualBeat[];
  durationMs: number;
  durationInFrames: number;
  startFrame: number;
  endFrame: number;
};
export type RenderProductionData = {
  schemaVersion: "2.1.0-production";
  episode: RenderSpec["episode"];
  editorial: RenderSpec["editorial"];
  publishing: RenderSpec["publishing"];
  sources: RenderSpec["sources"];
  review: RenderSpec["review"];
  pronunciations: RenderSpec["pronunciations"];
  corrections: RenderSpec["corrections"];
  voiceProfileId: string;
  inputSpecSha256: string;
  assets: Record<string, string>;
  scenes: ProductionScene[];
  timeline: {totalDurationInFrames: number; scenes: Array<{sceneId: string; startFrame: number; endFrame: number; durationInFrames: number}>};
};

const productionChunkSchema = z.object({
  chunkId: narrationChunkSchema.shape.chunkId,
  speechText: nonEmptyText,
  caption: z.object({text: nonEmptyText, startMs: z.number().nonnegative(), endMs: z.number().positive(), timestampMs: z.null(), confidence: z.null()}).strict(),
  expression: expressionSchema,
  pauseAfterMs: narrationChunkSchema.shape.pauseAfterMs,
  audioSrc: nonEmptyText,
  audioDurationMs: z.number().positive(),
  startMs: z.number().nonnegative(),
  endMs: z.number().positive(),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().nonnegative(),
}).strict();
const productionVisualBeatSchema = z.object({
  ...visualBeatSchema.shape,
  startMs: z.number().nonnegative(),
  endMs: z.number().positive(),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().nonnegative(),
}).strict();

export const productionDataSchema: z.ZodType<RenderProductionData> = z.object({
  schemaVersion: z.literal("2.1.0-production"),
  episode: episodeSchema,
  editorial: editorialSchema,
  publishing: publishingSchema,
  sources: z.array(sourceSchema).min(1),
  review: reviewSchema,
  pronunciations: z.array(pronunciationSchema),
  corrections: z.array(correctionSchema),
  voiceProfileId: safeId,
  inputSpecSha256: z.string().regex(/^[a-f0-9]{64}$/),
  assets: z.record(safeId, nonEmptyText),
  scenes: z.array(z.object({
    ...sceneSchema.omit({narrationChunks: true, visualBeats: true}).shape,
    narrationChunks: z.array(productionChunkSchema).min(1),
    visualBeats: z.array(productionVisualBeatSchema).min(1),
    durationMs: z.number().positive(),
    durationInFrames: z.number().int().positive(),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().nonnegative(),
  }).strict()).length(9),
  timeline: z.object({
    totalDurationInFrames: z.number().int().positive(),
    scenes: z.array(z.object({sceneId: sceneSchema.shape.sceneId, startFrame: z.number().int().nonnegative(), endFrame: z.number().int().nonnegative(), durationInFrames: z.number().int().positive()}).strict()).length(9),
  }).strict(),
}).strict();
