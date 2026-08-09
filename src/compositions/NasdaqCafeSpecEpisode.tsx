import {Fragment} from "react";
import {Audio} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {SpecAssetLayer} from "../components/spec/SpecAssetLayer";
import {FoxExpressionLayer} from "../components/spec/FoxExpressionLayer";
import {ShotStageRenderer} from "../components/spec/ShotStageRenderer";
import {SoundCueTrack} from "../components/spec/SoundCueTrack";
import {VisualGrammarStageModeProvider, getVisualGrammarStageShellId} from "../components/spec/VisualGrammarStageHost";
import {useVisualGrammarStageMode} from "../components/spec/VisualGrammarStageMode";
import type {RenderProductionData, RenderSpecScene} from "../spec/render-spec";
import {getSceneRenderState, getSpecDurationInFrames, getTransitionDurationInFrames} from "../spec/render-state";
import {getStageChromeModeForShell, type StageChromeMode} from "../spec/stage-theme-contract";
import type {VisualGrammarStageMode} from "../spec/visual-grammar-stage-mode";
import {toPublicSceneViewModel} from "../spec/public-view-model";
import {assertSpecLayoutFits} from "../spec/validate-render-layout";
import {fontFamily} from "../fonts";

const sceneStyle: React.CSSProperties = {
  background: "#050914",
  color: "#f7fbff",
  fontFamily,
};

const headlineStyle = (mode: StageChromeMode): React.CSSProperties => mode === "full"
  ? {
      position: "absolute",
      left: 400,
      top: 42,
      width: 1472,
      height: 82,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      padding: "7px 20px",
      boxSizing: "border-box",
      overflow: "hidden",
      whiteSpace: "nowrap",
      borderRadius: 16,
      background: "linear-gradient(90deg,rgba(4,10,23,.88),rgba(4,10,23,.48),rgba(4,10,23,0))",
      fontSize: 46,
      lineHeight: "64px",
      fontWeight: 950,
      textShadow: "0 4px 14px rgba(0,0,0,.9)",
    }
  : {
      position: "absolute",
      left: 416,
      top: 64,
      maxWidth: 980,
      height: 50,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      padding: "5px 16px",
      boxSizing: "border-box",
      overflow: "hidden",
      whiteSpace: "nowrap",
      borderRadius: 10,
      background: "rgba(7,17,31,.76)",
      borderLeft: "5px solid rgba(41,215,240,.88)",
      fontSize: 30,
      lineHeight: "40px",
      fontWeight: 900,
      textShadow: "0 3px 10px rgba(0,0,0,.72)",
    };

export const MAIN_STAGE_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 416,
  top: 144,
  width: 1440,
  height: 648,
  zIndex: 10,
  overflow: "hidden",
};

export const FOX_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 64,
  top: 176,
  width: 320,
  height: 720,
  zIndex: 30,
  overflow: "visible",
};

export const SUBTITLE_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 416,
  top: 824,
  width: 1440,
  height: 176,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 32px",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 16,
  background: "rgba(0,0,0,.84)",
  borderTop: "3px solid rgba(255,199,74,.86)",
  color: "#fff7df",
  fontSize: 34,
  lineHeight: 1.3,
  fontWeight: 900,
  letterSpacing: "0.01em",
  textAlign: "center",
  whiteSpace: "pre-line",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  textShadow: "0 3px 10px #000",
};

export const SpecSceneFrame: React.FC<{
  scene: RenderProductionData["scenes"][number];
  assets: Record<string, string>;
  timeMsOverride?: number;
}> = ({scene, assets, timeMsOverride}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stageMode = useVisualGrammarStageMode();
  const timeMs = timeMsOverride ?? (frame / fps) * 1000;
  const state = getSceneRenderState(scene, timeMs);
  const view = toPublicSceneViewModel(scene, state, assets);
  const stageShellId = view.mainContent
    ? getVisualGrammarStageShellId(view.mainContent.visualTemplate, view.mainContent.templateConfig.variant)
    : null;
  const chromeMode: StageChromeMode = stageMode === "candidate" && stageShellId
    ? getStageChromeModeForShell(stageShellId)
    : "full";
  const foregroundEntityAssets = view.mainAssets.filter((asset) => asset.slot === "entity-card");
  const backgroundMainAssets = view.mainAssets.filter((asset) => asset.slot !== "entity-card");

  return <AbsoluteFill style={sceneStyle} data-stage-chrome={chromeMode}>
    <SpecAssetLayer assets={[view.background]} zIndex={0}/>
    <div data-stage-layout="fixed" style={{...MAIN_STAGE_FRAME_STYLE, borderRadius: stageMode === "legacy" ? 30 : 0}}>
      <SpecAssetLayer assets={backgroundMainAssets} zIndex={10}/>
      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}
      <SpecAssetLayer assets={foregroundEntityAssets} zIndex={30}/>
    </div>
    <div data-fox-layout="fixed" style={{...FOX_FRAME_STYLE, opacity: view.fox.opacity}}>
      <FoxExpressionLayer fox={view.fox} previousFox={view.previousFox} transitionProgress={view.foxTransitionProgress}/>
    </div>
    <SpecAssetLayer assets={view.overlays} zIndex={40}/>
    {chromeMode !== "none" ? <div style={headlineStyle(chromeMode)}>{view.headline}</div> : null}
    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}
    {state.subtitleText ? <div data-subtitle-chrome="fixed" style={SUBTITLE_FRAME_STYLE}>{state.subtitleText}</div> : null}
  </AbsoluteFill>;
};

export const NasdaqCafeSpecEpisode: React.FC<{
  data: RenderProductionData;
  visualGrammarStageMode?: VisualGrammarStageMode;
}> = ({data, visualGrammarStageMode = "candidate"}) => {
  assertSpecLayoutFits(data);
  return <VisualGrammarStageModeProvider mode={visualGrammarStageMode}>
    <TransitionSeries>{data.scenes.map((scene, index) => {
      const transitionFrames = getTransitionDurationInFrames(scene, data.episode.fps);
      if (transitionFrames >= scene.durationInFrames) throw new Error(`$.scenes[${index}].transition.durationMs: transition must be shorter than Scene`);
      return <Fragment key={scene.sceneId}>
        <TransitionSeries.Sequence durationInFrames={scene.durationInFrames} premountFor={data.episode.fps}>
          <SpecSceneFrame scene={scene} assets={data.assets}/>
          {scene.narrationChunks.map((chunk) => <Sequence key={chunk.chunkId} from={chunk.startFrame} durationInFrames={Math.max(1, chunk.endFrame - chunk.startFrame + 1)} premountFor={data.episode.fps}><Audio src={staticFile(chunk.audioSrc)}/></Sequence>)}
          <SoundCueTrack scene={scene} fps={data.episode.fps}/>
        </TransitionSeries.Sequence>
        {index < data.scenes.length - 1 && scene.transition.type === "fade" ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: transitionFrames})}/> : null}
      </Fragment>;
    })}</TransitionSeries>
  </VisualGrammarStageModeProvider>;
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
