import {z} from "zod";

export const REACTION_TIMELINE_VARIANTS = [
  "verified-series",
  "reported-sequence",
  "official-time-plus-close",
  "close-only",
] as const;

export const REACTION_TIMELINE_PRECISIONS = [
  "verified-intraday-series",
  "reported-sequence",
  "official-time-plus-close",
  "close-only",
] as const;

export const reactionTimelineVariantSchema = z.enum(REACTION_TIMELINE_VARIANTS);
export const reactionTimelinePrecisionSchema = z.enum(REACTION_TIMELINE_PRECISIONS);

const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);

export const reactionTimelineConfigSchema = z.object({
  precision: reactionTimelinePrecisionSchema,
  eventOrderIds: z.array(safeId).min(1).max(8),
  seriesObjectIds: z.array(safeId).max(6),
}).strict();

export const REACTION_TIMELINE_VARIANT_PRECISION = {
  "verified-series": "verified-intraday-series",
  "reported-sequence": "reported-sequence",
  "official-time-plus-close": "official-time-plus-close",
  "close-only": "close-only",
} as const;

export type ReactionTimelineVariant = z.infer<typeof reactionTimelineVariantSchema>;
export type ReactionTimelinePrecision = z.infer<typeof reactionTimelinePrecisionSchema>;
export type ReactionTimelineConfig = z.infer<typeof reactionTimelineConfigSchema>;

export const isReactionTimelineVariant = (value: string): value is ReactionTimelineVariant =>
  (REACTION_TIMELINE_VARIANTS as readonly string[]).includes(value);
