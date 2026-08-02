import {z} from "zod";
import {
  expectedBasisSchema,
  expressionNameSchema,
  visualModeSchema,
} from "./episode-v1";

const nonEmptyText = z.string().trim().min(1);

export const captionSchema = z
  .object({
    text: nonEmptyText,
    startMs: z.number().nonnegative(),
    endMs: z.number().positive(),
    timestampMs: z.number().nullable(),
    confidence: z.number().nullable(),
    timingSource: z.literal("phrase-audio"),
  })
  .strict();

export const finalExpressionSwitchSchema = z
  .object({
    triggerText: nonEmptyText,
    expression: expressionNameSchema,
    atMs: z.number().nonnegative(),
    resolution: z.enum(["exact", "normalized"]),
  })
  .strict();

export const episodeSceneFinalSchema = z
  .object({
    id: z.string().regex(/^scene-0[1-9]$/),
    number: z.number().int().min(1).max(9),
    name: nonEmptyText,
    purpose: nonEmptyText,
    estimatedDurationSeconds: z.number().positive(),
    durationInFrames: z.number().int().positive(),
    durationSource: z.literal("audio-measured"),
    causalScope: nonEmptyText,
    performanceIntent: nonEmptyText,
    expression: expressionNameSchema,
    expressionSwitches: z.array(finalExpressionSwitchSchema),
    visualModes: z.array(visualModeSchema).min(1),
    transitionText: nonEmptyText,
    narration: z
      .object({
        displayText: nonEmptyText,
        speechText: nonEmptyText,
        audioSrc: nonEmptyText,
        metadataSrc: nonEmptyText,
        durationMs: z.number().positive(),
      })
      .strict(),
    captions: z
      .object({
        src: nonEmptyText,
        quality: z.literal("phrase-audio"),
        items: z.array(captionSchema).min(1),
      })
      .strict(),
    sourceAttribution: nonEmptyText,
    headline: nonEmptyText,
    supportingTexts: z.array(nonEmptyText),
    numbers: z.array(nonEmptyText),
    visualInstructions: nonEmptyText,
    evidence: z.array(nonEmptyText).min(1),
    expectedBasis: expectedBasisSchema.nullable(),
    timelineBasis: nonEmptyText.nullable(),
    uncertainty: nonEmptyText,
  })
  .strict();

const timelineSceneFinalSchema = z
  .object({
    sceneId: z.string().regex(/^scene-0[1-9]$/),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().nonnegative(),
    durationInFrames: z.number().int().positive(),
    transitionFramesAfter: z.number().int().nonnegative(),
  })
  .strict();

export const episodeFinalSchema = z
  .object({
    schemaVersion: z.literal("1.1.0"),
    source: z
      .object({
        packagePath: nonEmptyText,
        packageSha256: z.string().regex(/^[a-f0-9]{64}$/),
        generatedAt: nonEmptyText,
        converterVersion: z.literal("1.0.0"),
        baseEpisodeDataSha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
    episode: z
      .object({
        id: nonEmptyText,
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        targetSession: nonEmptyText,
        informationCutoff: nonEmptyText,
        episodeType: nonEmptyText,
        targetIndices: z.array(nonEmptyText).min(1),
        targetDurationSeconds: z.number().positive(),
        title: nonEmptyText,
        thumbnailText: nonEmptyText,
        width: z.literal(1920),
        height: z.literal(1080),
        fps: z.literal(30),
      })
      .strict(),
    assets: z
      .object({
        backgroundId: z.literal("mainBackground"),
        assetManifestVersion: nonEmptyText,
        foxExpressionMapVersion: nonEmptyText,
        bgmId: z.null(),
      })
      .strict(),
    tts: z
      .object({
        provider: z.enum(["voicevox", "gemini"]),
        providerVersion: nonEmptyText,
        voiceProfile: nonEmptyText,
        characterName: nonEmptyText,
        styleName: nonEmptyText,
        styleId: z.number().int().nonnegative(),
        speakerUuid: nonEmptyText,
        speakingRate: z.number().positive(),
        pronunciationDictionaryVersion: nonEmptyText,
        capabilities: z.record(z.string(), z.unknown()),
      })
      .strict(),
    credits: z
      .object({
        description: nonEmptyText,
        voice: nonEmptyText,
        speaker: nonEmptyText,
      })
      .strict(),
    scenes: z.array(episodeSceneFinalSchema).length(9),
    timeline: z
      .object({
        provisional: z.literal(false),
        durationSource: z.literal("audio-measured"),
        fps: z.literal(30),
        transitionFrames: z.number().int().positive(),
        totalDurationInFrames: z.number().int().positive(),
        scenes: z.array(timelineSceneFinalSchema).length(9),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    for (const [index, scene] of value.scenes.entries()) {
      if (scene.number !== index + 1 || scene.id !== `scene-0${index + 1}`) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index],
          message: "Sceneは1〜9の順番で指定してください",
        });
      }
      const timeline = value.timeline.scenes[index];
      const expectedStart =
        index === 0
          ? 0
          : value.timeline.scenes[index - 1].endFrame +
            1 -
            value.timeline.scenes[index - 1].transitionFramesAfter;
      if (
        !timeline ||
        timeline.sceneId !== scene.id ||
        timeline.startFrame !== expectedStart ||
        timeline.endFrame !== expectedStart + scene.durationInFrames - 1 ||
        timeline.durationInFrames !== scene.durationInFrames
      ) {
        context.addIssue({
          code: "custom",
          path: ["timeline", "scenes", index],
          message: "実測TimelineがScene尺と一致しません",
        });
      }
      let previousEnd = -1;
      for (const [captionIndex, caption] of scene.captions.items.entries()) {
        if (
          caption.endMs <= caption.startMs ||
          caption.startMs < previousEnd ||
          caption.endMs > scene.narration.durationMs + 1
        ) {
          context.addIssue({
            code: "custom",
            path: ["scenes", index, "captions", "items", captionIndex],
            message: "字幕時刻がScene音声範囲内で昇順になっていません",
          });
        }
        previousEnd = caption.endMs;
      }
      for (const [switchIndex, item] of scene.expressionSwitches.entries()) {
        if (item.atMs > scene.narration.durationMs) {
          context.addIssue({
            code: "custom",
            path: ["scenes", index, "expressionSwitches", switchIndex],
            message: "表情切り替えがScene音声範囲外です",
          });
        }
      }
    }
    const last = value.timeline.scenes.at(-1);
    if (!last || last.endFrame + 1 !== value.timeline.totalDurationInFrames) {
      context.addIssue({
        code: "custom",
        path: ["timeline", "totalDurationInFrames"],
        message: "全体尺が最終Scene終端と一致しません",
      });
    }
  });

export const episodeFinalCompositionSchema = z.object({
  episode: episodeFinalSchema,
});

export type EpisodeSceneFinal = z.infer<typeof episodeSceneFinalSchema>;
export type EpisodeFinal = z.infer<typeof episodeFinalSchema>;
export type EpisodeFinalCompositionProps = z.infer<
  typeof episodeFinalCompositionSchema
>;
