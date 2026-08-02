import {Fragment} from "react";
import type {CalculateMetadataFunction} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {EpisodeSceneV2} from "../components/v2/EpisodeSceneV2";
import {defaultEpisodeV1} from "../data/default-episode-v1";
import {
  episodeV1CompositionSchema,
  type EpisodeV1CompositionProps,
} from "../schemas/episode-v1";
import {
  episodeFinalCompositionSchema,
  type EpisodeFinalCompositionProps,
} from "../schemas/episode-final";

export const episodeV2CompositionSchema = episodeV1CompositionSchema.or(
  episodeFinalCompositionSchema,
);
export type EpisodeV2CompositionProps =
  | EpisodeV1CompositionProps
  | EpisodeFinalCompositionProps;

export const calculateEpisodeV2Metadata: CalculateMetadataFunction<
  EpisodeV2CompositionProps
> = ({props}) => {
  const result = episodeV2CompositionSchema.safeParse(props);
  const episode = result.success ? result.data.episode : defaultEpisodeV1;
  return {
    durationInFrames: episode.timeline.totalDurationInFrames,
    fps: episode.episode.fps,
    width: episode.episode.width,
    height: episode.episode.height,
    defaultOutName: `${episode.episode.id}_nasdaq-cafe-v2.mp4`,
  };
};

export const NasdaqCafeEpisodeV2: React.FC<EpisodeV2CompositionProps> = ({
  episode,
}) => {
  const transitionTiming = linearTiming({
    durationInFrames: episode.timeline.transitionFrames,
  });

  return (
    <TransitionSeries>
      {episode.scenes.map((scene, index) => (
        <Fragment key={scene.id}>
          <TransitionSeries.Sequence
            durationInFrames={scene.durationInFrames}
            premountFor={episode.episode.fps}
          >
            <EpisodeSceneV2 episode={episode} scene={scene} />
          </TransitionSeries.Sequence>
          {index < episode.scenes.length - 1 ? (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={transitionTiming}
            />
          ) : null}
        </Fragment>
      ))}
    </TransitionSeries>
  );
};
