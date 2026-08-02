import {z} from "zod";

const requiredText = (label: string, max: number) =>
  z
    .string({error: `${label}は文字列で指定してください`})
    .trim()
    .min(1, `${label}を空にはできません`)
    .max(max, `${label}は${max}文字以内にしてください`);

const optionalText = (label: string, max: number) =>
  z
    .string({error: `${label}は文字列で指定してください`})
    .trim()
    .max(max, `${label}は${max}文字以内にしてください`)
    .optional()
    .default("");

export const directionSchema = z.enum(["up", "down", "flat"]);
export const materialStatusSchema = z.enum([
  "confirmed",
  "sector_related",
  "unclear",
]);

export const marketItemSchema = z
  .object({
    label: requiredText("市場項目名", 24),
    value: requiredText("市場項目の値", 20),
    direction: directionSchema.optional().default("flat"),
    context: optionalText("市場項目の補足", 48),
  })
  .strict();

export const tickerSchema = z
  .object({
    symbol: requiredText("ティッカー", 12).transform((value) =>
      value.toUpperCase(),
    ),
    change: requiredText("騰落率", 20),
    direction: directionSchema.optional().default("flat"),
    reason: optionalText("銘柄材料", 64),
    materialStatus: materialStatusSchema.optional().default("unclear"),
  })
  .strict();

const sourceSchema = z
  .object({
    name: optionalText("情報源名", 80),
    url: z.string().url("source.urlは有効なURLにしてください").optional(),
    publishedAt: z.string().optional(),
  })
  .passthrough();

const otherNewsSchema = z
  .object({
    headline: requiredText("その他ニュース見出し", 64),
    summary: optionalText("その他ニュース要約", 120),
  })
  .passthrough();

export const episodeDataSchema = z
  .object({
    schemaVersion: z.literal("1.0", {
      error: 'schemaVersionは"1.0"を指定してください',
    }),
    episode: z
      .object({
        id: requiredText("episode.id", 48),
        date: requiredText("episode.date", 24),
        title: requiredText("episode.title", 48),
        programType: optionalText("episode.programType", 48),
      })
      .strict(),
    host: z
      .object({
        name: requiredText("host.name", 40),
        mood: optionalText("host.mood", 32),
      })
      .strict()
      .optional()
      .default({name: "狐の大学生アナリスト", mood: "slightly_smiling"}),
    conclusion: z
      .object({
        screenText: requiredText("conclusion.screenText", 28),
        narration: optionalText("conclusion.narration", 180),
      })
      .strict()
      .optional()
      .default({screenText: "今朝の市場を確認", narration: ""}),
    mainNews: z
      .object({
        headline: requiredText("mainNews.headline", 48),
        summary: optionalText("mainNews.summary", 100),
        points: z
          .array(requiredText("mainNews.points[]", 36))
          .max(3, "mainNews.pointsは3件以内にしてください")
          .optional()
          .default([]),
        confidence: z.enum(["high", "medium", "low", "unknown"]).optional(),
      })
      .strict()
      .optional()
      .default({
        headline: "主要ニュースは未設定です",
        summary: "入力JSONにmainNewsを追加すると表示されます。",
        points: [],
      }),
    marketReaction: z
      .object({
        items: z
          .array(marketItemSchema)
          .max(4, "marketReaction.itemsは4件以内にしてください")
          .optional()
          .default([]),
      })
      .strict()
      .optional()
      .default({items: []}),
    tickers: z
      .array(tickerSchema)
      .max(8, "tickersは8件以内にしてください")
      .optional()
      .default([]),
    otherNews: z.array(otherNewsSchema).optional().default([]),
    watchPoints: z
      .array(requiredText("watchPoints[]", 48))
      .max(5, "watchPointsは5件以内にしてください")
      .optional()
      .default([]),
    disclaimer: optionalText("disclaimer", 120).transform(
      (value) =>
        value ||
        "投資助言ではなく、取得情報に基づく市場ニュースの整理です。",
    ),
    media: z
      .object({
        narrationAudioPath: z.string().nullable().optional().default(null),
        captionsPath: z.string().nullable().optional().default(null),
      })
      .strict()
      .optional()
      .default({narrationAudioPath: null, captionsPath: null}),
    sources: z.array(sourceSchema).optional().default([]),
  })
  .strict();

export const episodeCompositionSchema = z.object({
  episode: episodeDataSchema,
});

export type EpisodeData = z.infer<typeof episodeDataSchema>;
export type EpisodeCompositionProps = z.infer<typeof episodeCompositionSchema>;
export type MarketItem = z.infer<typeof marketItemSchema>;
export type Ticker = z.infer<typeof tickerSchema>;
