import type {RenderSpec} from "./render-spec";
import {
  REACTION_TIMELINE_VARIANT_PRECISION,
  isReactionTimelineVariant,
  type ReactionTimelineVariant,
} from "./reaction-timeline-contract";

export type ReactionTimelineIssueCode =
  | "VG_REACTION_CONFIG_MISSING"
  | "VG_REACTION_PRECISION_MISMATCH"
  | "VG_REACTION_OBJECT_UNKNOWN"
  | "VG_REACTION_SERIES_REQUIRED"
  | "VG_REACTION_SERIES_FORBIDDEN"
  | "VG_REACTION_SERIES_VALUE_MISSING"
  | "VG_REACTION_PRECISION_MOTION_MISMATCH";

const fail = (code: ReactionTimelineIssueCode, path: string, message: string): never => {
  throw new Error(`${code} ${path}: ${message}`);
};

export const validateReactionTimelineBeat = (
  scene: RenderSpec["scenes"][number],
  beat: RenderSpec["scenes"][number]["visualBeats"][number],
  path: string,
) => {
  if (beat.visualTemplate !== "event-reaction-timeline") return;

  const config = beat.templateConfig.reactionTimeline ?? fail(
    "VG_REACTION_CONFIG_MISSING",
    `${path}.templateConfig.reactionTimeline`,
    "event-reaction-timeline requires explicit precision and object order",
  );
  const variant = beat.templateConfig.variant;
  if (!isReactionTimelineVariant(variant)) {
    fail(
      "VG_REACTION_PRECISION_MISMATCH",
      `${path}.templateConfig.variant`,
      `${variant} is not a reaction timeline variant`,
    );
  }
  const timelineVariant = variant as ReactionTimelineVariant;
  const expectedPrecision = REACTION_TIMELINE_VARIANT_PRECISION[timelineVariant];
  if (config.precision !== expectedPrecision) {
    fail(
      "VG_REACTION_PRECISION_MISMATCH",
      `${path}.templateConfig.reactionTimeline.precision`,
      `${timelineVariant} requires ${expectedPrecision}, got ${config.precision}`,
    );
  }

  const selected = new Set(beat.objectIds);
  for (const [index, objectId] of config.eventOrderIds.entries()) {
    if (!selected.has(objectId)) {
      fail(
        "VG_REACTION_OBJECT_UNKNOWN",
        `${path}.templateConfig.reactionTimeline.eventOrderIds[${index}]`,
        `${objectId} must be selected by the Visual Beat`,
      );
    }
  }
  for (const [index, objectId] of config.seriesObjectIds.entries()) {
    if (!config.eventOrderIds.includes(objectId)) {
      fail(
        "VG_REACTION_OBJECT_UNKNOWN",
        `${path}.templateConfig.reactionTimeline.seriesObjectIds[${index}]`,
        `${objectId} must also appear in eventOrderIds`,
      );
    }
  }

  const drawLineTargets = new Set(
    scene.visualEvents
      .filter((event) => event.motionPreset === "draw-line" && event.targetId !== null)
      .map((event) => event.targetId as string),
  );

  if (config.precision === "verified-intraday-series") {
    if (config.seriesObjectIds.length < 2) {
      fail(
        "VG_REACTION_SERIES_REQUIRED",
        `${path}.templateConfig.reactionTimeline.seriesObjectIds`,
        "verified intraday series requires at least two explicit series objects",
      );
    }
    const numbers = new Map(scene.numbers.map((number) => [number.numberId, number]));
    config.seriesObjectIds.forEach((objectId, index) => {
      const number = numbers.get(objectId);
      if (!number || number.numericValue == null) {
        fail(
          "VG_REACTION_SERIES_VALUE_MISSING",
          `${path}.templateConfig.reactionTimeline.seriesObjectIds[${index}]`,
          `${objectId} requires a verified numericValue`,
        );
      }
    });
  } else {
    if (config.seriesObjectIds.length > 0) {
      fail(
        "VG_REACTION_SERIES_FORBIDDEN",
        `${path}.templateConfig.reactionTimeline.seriesObjectIds`,
        `${config.precision} must not declare a continuous series`,
      );
    }
    const forbidden = config.eventOrderIds.filter((id) => drawLineTargets.has(id));
    if (forbidden.length > 0) {
      fail(
        "VG_REACTION_PRECISION_MOTION_MISMATCH",
        `${path}.templateConfig.reactionTimeline.eventOrderIds`,
        `draw-line is forbidden without verified intraday series: ${forbidden.join(", ")}`,
      );
    }
  }
};
