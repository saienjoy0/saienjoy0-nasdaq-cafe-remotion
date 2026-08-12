import {z} from "zod";
import compatibilityJson from "../../contracts/visual_grammar_renderer_compatibility.json";
import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_VARIANT_IDS,
  type VisualTemplateId,
  type VisualTemplateVariant,
} from "./visual-template-contract";

export const VISUAL_GRAMMAR_IDS = [
  "contradiction", "entity", "evidence", "gap", "causal", "reaction",
  "comparison", "verification", "analogy", "assembly", "bridge-text",
] as const;

export const TRANSITION_ROLE_IDS = [
  "continuation", "major-shift", "return", "closing",
] as const;

export const APPEARANCE_CLASS_IDS = [
  "open-hero", "entity-canvas", "document-media", "metric-board",
  "progressive-chart", "causal-path", "dual-lane", "timeline-track",
  "split-comparison", "matrix-grid", "verification-gates",
  "picturebook-canvas", "assembly-map", "text-bridge",
] as const;

export const DOMINANT_SURFACE_IDS = [
  "open-canvas", "entity", "media", "card-board", "plot", "network",
  "split", "matrix", "picturebook", "assembly", "text",
] as const;

export const STAGE_SHELL_IDS = [
  "OpenHeroStage", "EntityStage", "DocumentMediaStage", "MetricBoardStage",
  "ProgressiveChartStage", "CausalPathStage", "DualLaneStage", "TimelineStage",
  "SplitComparisonStage", "MatrixStage", "VerificationGateStage",
  "PictureBookStage", "AssemblyStage", "TextBridgeStage",
] as const;

export const MOTION_LANGUAGE_IDS = [
  "open-hero", "entity-focus", "document-reveal", "metric-board",
  "progressive-chart", "causal-path", "dual-lane", "timeline-track",
  "split-comparison", "matrix-grid", "verification-gates",
  "picturebook", "assembly", "text-bridge",
] as const;

export const visualGrammarIdSchema = z.enum(VISUAL_GRAMMAR_IDS);
export const transitionRoleSchema = z.enum(TRANSITION_ROLE_IDS);
export const appearanceClassSchema = z.enum(APPEARANCE_CLASS_IDS);
export const dominantSurfaceSchema = z.enum(DOMINANT_SURFACE_IDS);
export const stageShellSchema = z.enum(STAGE_SHELL_IDS);
export const motionLanguageSchema = z.enum(MOTION_LANGUAGE_IDS);

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const visualGrammarRootContractSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  semanticsSha256: sha256Schema,
  rendererCompatibilitySha256: sha256Schema,
  finalEpisodeContractSha256: sha256Schema,
  beatCount: z.number().int().min(9),
}).strict();

const variantAppearanceSchema = z.object({
  variant: z.enum(VISUAL_TEMPLATE_VARIANT_IDS),
  appearanceClass: appearanceClassSchema,
  dominantSurface: dominantSurfaceSchema,
  stageShell: stageShellSchema,
  motionLanguage: motionLanguageSchema,
}).strict();

const rendererCompatibilityEntrySchema = z.object({
  visualTemplateId: z.enum(VISUAL_TEMPLATE_IDS),
  allowedGrammarIds: z.array(visualGrammarIdSchema).min(1),
  appearanceClass: appearanceClassSchema,
  dominantSurface: dominantSurfaceSchema,
  stageShell: stageShellSchema,
  motionLanguage: motionLanguageSchema,
  variantOverrides: z.array(variantAppearanceSchema).max(4).optional(),
}).strict();

export const visualGrammarRendererCompatibilitySchema = z.object({
  contractVersion: z.literal("1.0.0"),
  templates: z.array(rendererCompatibilityEntrySchema).length(VISUAL_TEMPLATE_IDS.length),
}).strict();

export const VISUAL_GRAMMAR_RENDERER_COMPATIBILITY =
  visualGrammarRendererCompatibilitySchema.parse(compatibilityJson);

export const VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256 =
  "4bf9851e83b85b2371bfb2427af631906170724318df2641fd01460d6b8171f5" as const;

export type VisualGrammarId = z.infer<typeof visualGrammarIdSchema>;
export type TransitionRole = z.infer<typeof transitionRoleSchema>;
export type AppearanceClass = z.infer<typeof appearanceClassSchema>;
export type DominantSurface = z.infer<typeof dominantSurfaceSchema>;
export type StageShellId = z.infer<typeof stageShellSchema>;
export type MotionLanguageId = z.infer<typeof motionLanguageSchema>;
export type VisualGrammarRootContract = z.infer<typeof visualGrammarRootContractSchema>;

const compatibilityByTemplate = new Map(
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates.map((entry) => [
    entry.visualTemplateId,
    entry,
  ] as const),
);

export const getVisualGrammarCompatibility = (visualTemplate: VisualTemplateId) => {
  const entry = compatibilityByTemplate.get(visualTemplate);
  if (!entry) throw new Error(`unregistered Visual Template: ${visualTemplate}`);
  return entry;
};

export const getVisualGrammarAppearance = (
  visualTemplate: VisualTemplateId,
  variant: VisualTemplateVariant,
) => {
  const entry = getVisualGrammarCompatibility(visualTemplate);
  const override = entry.variantOverrides?.find((item) => item.variant === variant);
  return override ?? {
    appearanceClass: entry.appearanceClass,
    dominantSurface: entry.dominantSurface,
    stageShell: entry.stageShell,
    motionLanguage: entry.motionLanguage,
  };
};

export const isVisualGrammarTemplatePairAllowed = (
  grammarId: VisualGrammarId,
  visualTemplate: VisualTemplateId,
) => getVisualGrammarCompatibility(visualTemplate).allowedGrammarIds.includes(grammarId);
