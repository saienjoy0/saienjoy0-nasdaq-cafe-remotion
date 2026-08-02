import timelineConfigJson from "../../config/timeline.config.json";
import type {EpisodeSceneV1} from "../schemas/episode-v1";

type TimelineInputScene = Pick<
  EpisodeSceneV1,
  "id" | "durationInFrames"
>;

export const timelineConfig = timelineConfigJson;

export const createProvisionalTimeline = (scenes: TimelineInputScene[]) => {
  if (scenes.length !== 9) {
    throw new Error(`Timelineには9Sceneが必要です。受領: ${scenes.length}`);
  }

  let nextStartFrame = 0;
  const timelineScenes = scenes.map((scene, index) => {
    if (scene.durationInFrames <= timelineConfig.transitionFrames) {
      throw new Error(
        `${scene.id}の尺はトランジションより長くする必要があります`,
      );
    }

    const transitionFramesAfter =
      index === scenes.length - 1 ? 0 : timelineConfig.transitionFrames;
    const startFrame = nextStartFrame;
    const endFrame = startFrame + scene.durationInFrames - 1;
    nextStartFrame = endFrame + 1 - transitionFramesAfter;

    return {
      sceneId: scene.id,
      startFrame,
      endFrame,
      durationInFrames: scene.durationInFrames,
      transitionFramesAfter,
    };
  });

  return {
    provisional: true as const,
    durationSource: timelineConfig.durationSource,
    fps: timelineConfig.fps,
    transitionFrames: timelineConfig.transitionFrames,
    totalDurationInFrames: timelineScenes.at(-1)!.endFrame + 1,
    scenes: timelineScenes,
  };
};
