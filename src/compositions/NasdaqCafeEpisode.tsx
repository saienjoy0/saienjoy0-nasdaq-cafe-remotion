import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import type {EpisodeCompositionProps} from "../schemas/episode";
import {ConclusionScene} from "../scenes/ConclusionScene";
import {MainNewsScene} from "../scenes/MainNewsScene";
import {MarketReactionScene} from "../scenes/MarketReactionScene";
import {TickerScene} from "../scenes/TickerScene";
import {WatchPointsScene} from "../scenes/WatchPointsScene";

const transitionTiming = linearTiming({durationInFrames: 15});

export const NasdaqCafeEpisode: React.FC<EpisodeCompositionProps> = ({episode}) => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={135} premountFor={30}>
        <ConclusionScene episode={episode} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

      <TransitionSeries.Sequence durationInFrames={315} premountFor={30}>
        <MainNewsScene episode={episode} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: "from-bottom"})} timing={transitionTiming} />

      <TransitionSeries.Sequence durationInFrames={345} premountFor={30}>
        <MarketReactionScene episode={episode} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />

      <TransitionSeries.Sequence durationInFrames={345} premountFor={30}>
        <TickerScene episode={episode} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({direction: "from-right"})} timing={transitionTiming} />

      <TransitionSeries.Sequence durationInFrames={270} premountFor={30}>
        <WatchPointsScene episode={episode} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
