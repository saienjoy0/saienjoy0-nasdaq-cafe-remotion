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
const utcTimestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
const marketDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const intradaySeriesPointSchema = z.object({
  timestamp: utcTimestamp,
  price: z.number().finite(),
  avgPrice: z.number().finite().optional(),
  open: z.number().finite().optional(),
  high: z.number().finite().optional(),
  low: z.number().finite().optional(),
  close: z.number().finite().optional(),
  volume: z.number().int().nonnegative().optional(),
  turnover: z.number().finite().nonnegative().optional(),
  session: z.string().min(1).optional(),
}).strict();

export const intradaySeriesSchema = z.object({
  source: z.string().min(1),
  kind: z.literal("intraday"),
  fetched_by: z.string().min(1).optional(),
  generated_at: z.string().min(1).optional(),
  symbol: z.string().min(1),
  marketDate,
  timezone: z.string().min(1),
  session: z.enum(["regular", "all"]),
  resolution: z.literal("1m"),
  precision: z.literal("verified-intraday-series"),
  providerSurface: z.string().min(1),
  priceBasis: z.string().min(1),
  rawSha256: sha256.optional(),
  points: z.array(intradaySeriesPointSchema).min(2).max(2_000),
}).strict();

export const reactionEventMarkerSchema = z.object({
  timestamp: utcTimestamp,
  label: z.string().min(1),
  sourceLabel: z.string().min(1).optional(),
}).strict();

export const reactionTimelineConfigSchema = z.object({
  precision: reactionTimelinePrecisionSchema,
  eventOrderIds: z.array(safeId).min(1).max(8),
  seriesObjectIds: z.array(safeId).max(6),
  intradaySeries: intradaySeriesSchema.optional(),
  eventMarker: reactionEventMarkerSchema.optional(),
  displayTimezone: z.string().min(1).optional(),
}).strict();

export const REACTION_TIMELINE_VARIANT_PRECISION = {
  "verified-series": "verified-intraday-series",
  "reported-sequence": "reported-sequence",
  "official-time-plus-close": "official-time-plus-close",
  "close-only": "close-only",
} as const;

export type ReactionTimelineVariant = z.infer<typeof reactionTimelineVariantSchema>;
export type ReactionTimelinePrecision = z.infer<typeof reactionTimelinePrecisionSchema>;
export type IntradaySeries = z.infer<typeof intradaySeriesSchema>;
export type ReactionTimelineConfig = z.infer<typeof reactionTimelineConfigSchema>;

export const isReactionTimelineVariant = (value: string): value is ReactionTimelineVariant =>
  (REACTION_TIMELINE_VARIANTS as readonly string[]).includes(value);
