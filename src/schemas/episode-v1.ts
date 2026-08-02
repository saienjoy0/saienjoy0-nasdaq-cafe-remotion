import {z} from "zod";

export const expressionNameSchema = z.enum([
  "通常",
  "分析",
  "ニヤリ",
  "軽い驚き",
  "困惑",
  "警戒",
  "眠そう",
]);

export const visualModeSchema = z.enum([
  "結論カード",
  "数字比較",
  "Expected / Actual / Gap",
  "タイムライン",
  "チャート",
  "因果図・供給網図",
  "銘柄比較",
  "ニュース映像",
  "検証ポイント",
  "テキスト中心表示",
]);

const nonEmptyText = z.string().trim().min(1);

export const expressionSwitchSchema = z
  .object({
    triggerText: nonEmptyText,
    expression: expressionNameSchema,
    atMs: z.null(),
  })
  .strict();

export const expectedBasisSchema = z
  .object({
    expected: nonEmptyText,
    category: nonEmptyText,
    concreteBasis: nonEmptyText,
    attribution: nonEmptyText,
    actual: nonEmptyText,
    gap: nonEmptyText,
  })
  .strict();

export const episodeSceneV1Schema = z
  .object({
    id: z.string().regex(/^scene-0[1-9]$/),
    number: z.number().int().min(1).max(9),
    name: nonEmptyText,
    purpose: nonEmptyText,
    estimatedDurationSeconds: z.number().positive(),
    durationInFrames: z.number().int().positive(),
    durationSource: z.literal("production-package-estimate-provisional"),
    causalScope: nonEmptyText,
    performanceIntent: nonEmptyText,
    expression: expressionNameSchema,
    expressionSwitches: z.array(expressionSwitchSchema),
    visualModes: z.array(visualModeSchema).min(1),
    transitionText: nonEmptyText,
    narration: z
      .object({
        displayText: nonEmptyText,
        speechText: nonEmptyText,
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

export const timelineSceneV1Schema = z
  .object({
    sceneId: z.string().regex(/^scene-0[1-9]$/),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().nonnegative(),
    durationInFrames: z.number().int().positive(),
    transitionFramesAfter: z.number().int().nonnegative(),
  })
  .strict();

export const episodeV1Schema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    source: z
      .object({
        packagePath: nonEmptyText,
        packageSha256: z.string().regex(/^[a-f0-9]{64}$/),
        generatedAt: nonEmptyText,
        converterVersion: z.literal("1.0.0"),
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
      })
      .strict(),
    scenes: z.array(episodeSceneV1Schema).length(9),
    timeline: z
      .object({
        provisional: z.literal(true),
        durationSource: z.literal("production-package-estimate"),
        fps: z.literal(30),
        transitionFrames: z.number().int().positive(),
        totalDurationInFrames: z.number().int().positive(),
        scenes: z.array(timelineSceneV1Schema).length(9),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    value.scenes.forEach((scene, index) => {
      if (scene.number !== index + 1 || scene.id !== `scene-0${index + 1}`) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index],
          message: "Sceneは1〜9の順番で一度ずつ指定してください",
        });
      }
      if (scene.narration.displayText !== scene.narration.speechText) {
        context.addIssue({
          code: "custom",
          path: ["scenes", index, "narration", "speechText"],
          message: "Phase 2ではspeechTextをdisplayTextと同一にしてください",
        });
      }

      const timelineScene = value.timeline.scenes[index];
      if (
        !timelineScene ||
        timelineScene.sceneId !== scene.id ||
        timelineScene.durationInFrames !== scene.durationInFrames
      ) {
        context.addIssue({
          code: "custom",
          path: ["timeline", "scenes", index],
          message: "TimelineのScene IDと尺をscenes配列へ一致させてください",
        });
        return;
      }
      const expectedStart =
        index === 0
          ? 0
          : value.timeline.scenes[index - 1].endFrame +
            1 -
            value.timeline.scenes[index - 1].transitionFramesAfter;
      const expectedEnd = expectedStart + scene.durationInFrames - 1;
      const expectedTransition =
        index === value.scenes.length - 1 ? 0 : value.timeline.transitionFrames;
      if (
        timelineScene.startFrame !== expectedStart ||
        timelineScene.endFrame !== expectedEnd ||
        timelineScene.transitionFramesAfter !== expectedTransition
      ) {
        context.addIssue({
          code: "custom",
          path: ["timeline", "scenes", index],
          message: "Timelineの開始・終了・トランジション計算が一致しません",
        });
      }
    });

    const last = value.timeline.scenes.at(-1);
    if (!last || last.endFrame + 1 !== value.timeline.totalDurationInFrames) {
      context.addIssue({
        code: "custom",
        path: ["timeline", "totalDurationInFrames"],
        message: "全体尺は最終Sceneの終了フレームと一致させてください",
      });
    }
  });

export const episodeV1CompositionSchema = z.object({
  episode: episodeV1Schema,
});

export type ExpressionName = z.infer<typeof expressionNameSchema>;
export type VisualMode = z.infer<typeof visualModeSchema>;
export type EpisodeSceneV1 = z.infer<typeof episodeSceneV1Schema>;
export type EpisodeV1 = z.infer<typeof episodeV1Schema>;
export type EpisodeV1CompositionProps = z.infer<
  typeof episodeV1CompositionSchema
>;
