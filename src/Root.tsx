import "./index.css";
import {Composition, Still} from "remotion";
import sampleEpisodeJson from "../samples/episode_data.sample.json";
import {NasdaqCafeEpisode} from "./compositions/NasdaqCafeEpisode";
import {
  calculateEpisodeV2Metadata,
  episodeV2CompositionSchema,
  NasdaqCafeEpisodeV2,
} from "./compositions/NasdaqCafeEpisodeV2";
import {
  FixedAssetCalibration,
  type FixedAssetCalibrationProps,
} from "./compositions/FixedAssetCalibration";
import {
  episodeCompositionSchema,
  episodeDataSchema,
  type EpisodeCompositionProps,
} from "./schemas/episode";
import {
  COMPOSITION_ID,
  COMPOSITION_ID_V2,
  DURATION_IN_FRAMES,
  FPS,
  HEIGHT,
  WIDTH,
} from "./config";
import {defaultEpisodeV1} from "./data/default-episode-v1";
import {type EpisodeV1CompositionProps} from "./schemas/episode-v1";
import fixtureSpecJson from "../render-specs/fixtures/minimal/render_spec.json";
import {calculateSpecDurationInFrames, NasdaqCafeSpecEpisode, SpecDebugStill} from "./compositions/NasdaqCafeSpecEpisode";
import {CardFirstContractStill} from "./compositions/CardFirstContractStill";
import {productionAssetPaths} from "./config/production-assets";
import {makeCardFirstCurrentFixtures} from "./dev/card-first-current-fixtures";
import type {RenderProductionData, RenderSpec} from "./spec/render-spec";

const specAssets = productionAssetPaths;
const fixtureSpec = fixtureSpecJson as RenderSpec;
const cardFirstFixture = makeCardFirstCurrentFixtures()[0];
let defaultSpecStartFrame = 0;
const defaultSpecScenes: RenderProductionData["scenes"] = fixtureSpec.scenes.map((scene) => {
  const narrationChunks = scene.narrationChunks.map((chunk, chunkIndex) => ({
    chunkId: chunk.chunkId,
    speechText: chunk.speechText,
    caption: {text: chunk.captionText, startMs: chunkIndex * 1000, endMs: (chunkIndex + 1) * 1000, timestampMs: null, confidence: null},
    expression: chunk.expression,
    pauseAfterMs: chunk.pauseAfterMs,
    audioSrc: "spec-audio/fixture.wav",
    audioDurationMs: 1000,
    startMs: chunkIndex * 1000,
    endMs: (chunkIndex + 1) * 1000,
    startFrame: chunkIndex * 30,
    endFrame: chunkIndex * 30 + 29,
  }));
  const durationInFrames = narrationChunks.length * 30;
  const visualBeats = scene.visualBeats.map((beat) => {
    const startIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.startChunkId);
    const endIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.endChunkId);
    return {
      ...beat,
      startMs: startIndex * 1000,
      endMs: (endIndex + 1) * 1000,
      startFrame: startIndex * 30,
      endFrame: (endIndex + 1) * 30 - 1,
    };
  });
  const startFrame = defaultSpecStartFrame;
  const endFrame = startFrame + durationInFrames - 1;
  defaultSpecStartFrame = endFrame + 1;
  return {...scene, narrationChunks, visualBeats, durationMs: narrationChunks.length * 1000, durationInFrames, startFrame, endFrame};
});
const defaultSpecData: RenderProductionData = {
  schemaVersion: "2.1.0-production",
  episode: fixtureSpec.episode,
  editorial: fixtureSpec.editorial,
  publishing: fixtureSpec.publishing,
  sources: fixtureSpec.sources,
  review: fixtureSpec.review,
  pronunciations: fixtureSpec.pronunciations,
  corrections: fixtureSpec.corrections,
  voiceProfileId: fixtureSpec.voiceProfileId,
  inputSpecSha256: "0".repeat(64),
  assets: specAssets,
  scenes: defaultSpecScenes,
  timeline: {totalDurationInFrames: defaultSpecStartFrame, scenes: defaultSpecScenes.map(({sceneId, startFrame, endFrame, durationInFrames}) => ({sceneId, startFrame, endFrame, durationInFrames}))},
};

const sampleEpisode = episodeDataSchema.parse(sampleEpisodeJson);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={NasdaqCafeEpisode}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={episodeCompositionSchema}
        defaultProps={{episode: sampleEpisode} satisfies EpisodeCompositionProps}
      />
      <Composition
        id={COMPOSITION_ID_V2}
        component={NasdaqCafeEpisodeV2}
        durationInFrames={defaultEpisodeV1.timeline.totalDurationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={episodeV2CompositionSchema}
        defaultProps={{episode: defaultEpisodeV1} satisfies EpisodeV1CompositionProps}
        calculateMetadata={calculateEpisodeV2Metadata}
      />
      <Still
        id="FixedAssetFoxNormal"
        component={FixedAssetCalibration}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{foxAssetId: "foxNormal"} satisfies FixedAssetCalibrationProps}
      />
      <Composition
        id="NasdaqCafeSpec"
        component={NasdaqCafeSpecEpisode}
        durationInFrames={30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{data: defaultSpecData}}
        calculateMetadata={({props}) => ({durationInFrames: calculateSpecDurationInFrames(props.data), fps: props.data.episode.fps, width: props.data.episode.width, height: props.data.episode.height})}
      />
      <Still
        id="NasdaqCafeSpecDebugStill"
        component={SpecDebugStill}
        width={1920}
        height={1080}
        defaultProps={{scene: fixtureSpec.scenes[0], assets: specAssets}}
      />
      <Still
        id="CardFirstContractStill"
        component={CardFirstContractStill}
        width={1920}
        height={1080}
        defaultProps={{content: cardFirstFixture.content}}
      />
      <Still
        id="FixedAssetFoxSmirk"
        component={FixedAssetCalibration}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{foxAssetId: "foxSmirk"} satisfies FixedAssetCalibrationProps}
      />
    </>
  );
};
