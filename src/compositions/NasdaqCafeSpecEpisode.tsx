import {Fragment} from "react";
import {Audio} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {SpecAssetLayer} from "../components/spec/SpecAssetLayer";
import {SpecVisualMode} from "../components/spec/SpecVisualModes";
import type {RenderProductionData, RenderSpecScene} from "../spec/render-spec";
import {getSceneRenderState, getSpecDurationInFrames, getTransitionDurationInFrames} from "../spec/render-state";
import {toPublicSceneViewModel} from "../spec/public-view-model";
import {assertSpecLayoutFits} from "../spec/validate-render-layout";
import {fontFamily} from "../fonts";

const sceneStyle: React.CSSProperties = {
  background: "#050914",
  color: "#f7fbff",
  fontFamily,
};

export const SpecSceneFrame: React.FC<{
  scene: RenderProductionData["scenes"][number];
  assets: Record<string, string>;
  timeMsOverride?: number;
}> = ({scene, assets, timeMsOverride}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timeMs = timeMsOverride ?? (frame / fps) * 1000;
  const state = getSceneRenderState(scene, timeMs);
  const view = toPublicSceneViewModel(scene, state, assets);
  return <AbsoluteFill style={sceneStyle}>
    <SpecAssetLayer assets={[view.background]} zIndex={0}/>
    <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, zIndex: 10}}>
      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>
      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><SpecVisualMode content={view.mainContent}/></div> : null}
    </div>
    <div style={{position: "absolute", left: 64, top: 176, width: 320, height: 720, zIndex: 30, opacity: view.fox.opacity, overflow: "visible"}}>
      <Img src={staticFile(view.fox.src)} style={{width: "100%", height: "100%", objectFit: view.fox.fit, filter: "drop-shadow(0 14px 18px rgba(0,0,0,.32))"}}/>
    </div>
    <SpecAssetLayer assets={view.overlays} zIndex={40}/>
    <div style={{position: "absolute", left: 416, top: 56, width: 1440, height: 72, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", fontSize: 52, lineHeight: "72px", fontWeight: 950, textShadow: "0 4px 14px rgba(0,0,0,.9)"}}>{view.headline}</div>
    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}
    {view.captionText ? <div style={{position: "absolute", left: 416, top: 824, width: 1440, height: 176, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 36px", boxSizing: "border-box", overflow: "hidden", borderRadius: 16, background: "rgba(0,0,0,.86)", borderTop: "3px solid rgba(61,220,255,.65)", fontSize: 34, lineHeight: 1.35, fontWeight: 950, textAlign: "center", textShadow: "0 3px 10px #000"}}>{view.captionText}</div> : null}
  </AbsoluteFill>;
};

export const NasdaqCafeSpecEpisode: React.FC<{data: RenderProductionData}> = ({data}) => {
  assertSpecLayoutFits(data);
  return <TransitionSeries>{data.scenes.map((scene, index) => {
    const transitionFrames = getTransitionDurationInFrames(scene, data.episode.fps);
    if (transitionFrames >= scene.durationInFrames) throw new Error(`$.scenes[${index}].transition.durationMs: transition must be shorter than Scene`);
    return <Fragment key={scene.sceneId}>
      <TransitionSeries.Sequence durationInFrames={scene.durationInFrames} premountFor={data.episode.fps}>
        <SpecSceneFrame scene={scene} assets={data.assets}/>
        {scene.narrationChunks.map((chunk) => <Sequence key={chunk.chunkId} from={chunk.startFrame} durationInFrames={Math.max(1, chunk.endFrame - chunk.startFrame + 1)} premountFor={data.episode.fps}><Audio src={staticFile(chunk.audioSrc)}/></Sequence>)}
      </TransitionSeries.Sequence>
      {index < data.scenes.length - 1 && scene.transition.type === "fade" ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: transitionFrames})}/> : null}
    </Fragment>;
  })}</TransitionSeries>;
};

export const calculateSpecDurationInFrames = (data: RenderProductionData) =>
  getSpecDurationInFrames(data.scenes, data.episode.fps);

const debugScene = (scene: RenderSpecScene): RenderProductionData["scenes"][number] => {
  const narrationChunks = scene.narrationChunks.map((chunk, index) => ({
    chunkId: chunk.chunkId,
    speechText: chunk.speechText,
    caption: {text: chunk.captionText, startMs: index * 1000, endMs: (index + 1) * 1000, timestampMs: null, confidence: null},
    expression: chunk.expression,
    pauseAfterMs: chunk.pauseAfterMs,
    audioSrc: "technical-only/no-audio.wav",
    audioDurationMs: 1000,
    startMs: index * 1000,
    endMs: (index + 1) * 1000,
    startFrame: index * 30,
    endFrame: index * 30 + 29,
  }));
  const visualBeats = scene.visualBeats.map((beat) => {
    const startIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.startChunkId);
    const endIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.endChunkId);
    return {...beat, startMs: startIndex * 1000, endMs: (endIndex + 1) * 1000, startFrame: startIndex * 30, endFrame: (endIndex + 1) * 30 - 1};
  });
  return {...scene, narrationChunks, visualBeats, startFrame: 0, endFrame: narrationChunks.length * 30 - 1, durationInFrames: narrationChunks.length * 30, durationMs: narrationChunks.length * 1000};
};

export const SpecDebugStill: React.FC<{scene: RenderSpecScene; assets: Record<string, string>; timeMs?: number}> = ({scene, assets, timeMs = 0}) => <SpecSceneFrame scene={debugScene(scene)} assets={assets} timeMsOverride={timeMs}/>;
