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
import type {StageShellId} from "../spec/visual-grammar-contract";
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

export type StageLayoutProfile = "host-left" | "host-right" | "immersive";

const IMMERSIVE_STAGE_SHELLS = new Set<StageShellId>([
  "DocumentMediaStage",
  "ProgressiveChartStage",
  "CausalPathStage",
  "TimelineStage",
  "AssemblyStage",
]);

const HOST_RIGHT_STAGE_SHELLS = new Set<StageShellId>([
  "DualLaneStage",
  "SplitComparisonStage",
  "MatrixStage",
  "VerificationGateStage",
]);

export const getStageLayoutProfileForShell = (stageShellId: StageShellId | null): StageLayoutProfile => {
  if (stageShellId && IMMERSIVE_STAGE_SHELLS.has(stageShellId)) return "immersive";
  if (stageShellId && HOST_RIGHT_STAGE_SHELLS.has(stageShellId)) return "host-right";
  return "host-left";
};

export const getMainStageFrameStyle = (
  profile: StageLayoutProfile,
  stageMode: VisualGrammarStageMode,
): React.CSSProperties => {
  const frame = profile === "immersive"
    ? {left: 72, top: 118, width: 1776, height: 744}
    : profile === "host-right"
      ? {left: 72, top: 144, width: 1452, height: 670}
      : {left: 396, top: 144, width: 1452, height: 670};
  return {
    position: "absolute",
    ...frame,
    zIndex: 10,
    overflow: "hidden",
    borderRadius: stageMode === "legacy" ? 30 : 0,
  };
};

export const getFoxFrameStyle = (
  profile: StageLayoutProfile,
  opacity: number,
): React.CSSProperties => {
  if (profile === "immersive") return {
    position: "absolute",
    left: 52,
    top: 656,
    width: 180,
    height: 300,
    zIndex: 30,
    opacity: 0,
    overflow: "visible",
  };
  return {
    position: "absolute",
    left: profile === "host-right" ? 1560 : 64,
    top: 180,
    width: profile === "host-right" ? 296 : 300,
    height: 700,
    zIndex: 30,
    opacity,
    overflow: "visible",
  };
};

export const SUBTITLE_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 280,
  top: 914,
  width: 1360,
  height: 126,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 32px",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 16,
  background: "rgba(2,7,16,.76)",
  borderTop: "2px solid rgba(255,199,74,.76)",
  color: "#fff7df",
  fontSize: 44,
  lineHeight: 1.18,
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
  const layoutProfile = getStageLayoutProfileForShell(stageMode === "candidate" ? stageShellId : null);

  return <AbsoluteFill style={sceneStyle} data-stage-chrome={chromeMode}>
    <SpecAssetLayer assets={[view.background]} zIndex={0}/>
    <div data-stage-layout={layoutProfile} style={getMainStageFrameStyle(layoutProfile, stageMode)}>
      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>
      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}
    </div>
    <div data-fox-layout={layoutProfile} style={getFoxFrameStyle(layoutProfile, view.fox.opacity)}>
      <FoxExpressionLayer fox={view.fox} previousFox={view.previousFox} transitionProgress={view.foxTransitionProgress}/>
    </div>
    <SpecAssetLayer assets={view.overlays} zIndex={40}/>
    {chromeMode !== "none" ? <div style={headlineStyle(chromeMode)}>{view.headline}</div> : null}
    {view.sourceLabel ? <div style={{position: "absolute", left: 972, top: 860, width: 852, height: 28, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 20, lineHeight: "28px", textAlign: "right"}}>{view.sourceLabel}</div> : null}
    {state.subtitleText ? <div data-subtitle-chrome="compact" style={SUBTITLE_FRAME_STYLE}>{state.subtitleText}</div> : null}
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
