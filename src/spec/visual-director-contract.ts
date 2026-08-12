import {createHash} from "node:crypto";
import {z} from "zod";
import {
  screenStateSchema,
  specVisualModeSchema,
  visualTemplateConfigSchema,
  visualTemplateSchema,
  visualTemplateVariantSchema,
} from "./render-spec";
import {
  appearanceClassSchema,
  dominantSurfaceSchema,
} from "./visual-grammar-contract";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const episodeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const evidenceCapabilitySchema = z.enum([
  "source-document",
  "quote-social",
  "time-series",
  "comparison-set",
  "gap",
  "causal-graph",
  "entity",
  "image-media",
  "verification",
  "text-only",
]);

export const visualCandidateSchema = z.object({
  candidateId: z.string().regex(/^vc-[A-Za-z0-9._-]+$/),
  visualBeatId: safeId,
  capability: evidenceCapabilitySchema,
  visualTemplate: visualTemplateSchema,
  templateVariant: visualTemplateVariantSchema,
  screenState: screenStateSchema,
  visualMode: specVisualModeSchema,
  templateConfig: visualTemplateConfigSchema,
  appearanceClass: appearanceClassSchema,
  dominantSurface: dominantSurfaceSchema,
  realityAnchor: z.boolean(),
  evidenceSourceIds: z.array(safeId),
  objectIds: z.array(safeId),
  assetPlacementIds: z.array(safeId),
  assetIds: z.array(safeId),
  assetState: z.enum(["ready", "user-review-required", "not-required"]),
  requirementsSatisfied: z.literal(true),
}).strict();

export const visualCandidateCatalogSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  episodeDate: episodeDateSchema,
  rendererContractVersion: z.literal("2.4.0"),
  sourceRenderSpecSha256: sha256Schema,
  candidates: z.array(visualCandidateSchema).min(1),
}).strict();

export const visualDirectionPlanSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  episodeDate: episodeDateSchema,
  candidateCatalogSha256: sha256Schema,
  selections: z.array(z.object({
    visualBeatId: safeId,
    candidateId: z.string().regex(/^vc-[A-Za-z0-9._-]+$/),
    reason: z.string().min(1).optional(),
  }).strict()).min(1),
}).strict();

export const visualTemplatePolicySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("authored-only"),
    allowedTemplateIds: z.array(visualTemplateSchema).max(0).optional(),
  }).strict(),
  z.object({
    mode: z.literal("allow-list"),
    allowedTemplateIds: z.array(visualTemplateSchema).min(1),
  }).strict(),
]);

export const visualCapabilityHintsSchema = z.object({
  contractVersion: z.enum(["1.0.0", "1.1.0"]),
  episodeDate: episodeDateSchema,
  beats: z.array(z.object({
    visualBeatId: safeId,
    capabilities: z.array(evidenceCapabilitySchema).min(1),
    templatePolicy: visualTemplatePolicySchema.optional(),
  }).strict()),
}).strict().superRefine((value, context) => {
  if (value.contractVersion !== "1.1.0") return;
  value.beats.forEach((beat, index) => {
    if (!beat.templatePolicy) {
      context.addIssue({
        code: "custom",
        path: ["beats", index, "templatePolicy"],
        message: "E_VISUAL_DIRECTOR_TEMPLATE_POLICY_MISSING",
      });
    }
  });
});

export type EvidenceCapability = z.infer<typeof evidenceCapabilitySchema>;
export type VisualCandidate = z.infer<typeof visualCandidateSchema>;
export type VisualCandidateCatalog = z.infer<typeof visualCandidateCatalogSchema>;
export type VisualDirectionPlan = z.infer<typeof visualDirectionPlanSchema>;
export type VisualTemplatePolicy = z.infer<typeof visualTemplatePolicySchema>;
export type VisualCapabilityHints = z.infer<typeof visualCapabilityHintsSchema>;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
};

export const canonicalJson = (value: unknown) => JSON.stringify(canonicalize(value), null, 0);
export const sha256Json = (value: unknown) =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");
