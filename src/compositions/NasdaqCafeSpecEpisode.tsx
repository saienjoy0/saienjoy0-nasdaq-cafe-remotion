import {Audio} from "@remotion/media";
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
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
  const entityContent = view.mainContent?.renderKind === "entity" ? view.mainContent : null;
  const entityPresentation = entityContent?.entityPresentation ?? null;
  const showGeneratedMainContent = Boolean(
    view.mainContent &&
      entityPresentation !== "prebuilt-card" &&
      entityPresentation !== "media",
  );

  return <AbsoluteFill style={sceneStyle}>
    <SpecAssetLayer assets={[view.background]} zIndex={0}/>
    <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, zIndex: 10}}>
      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>
      {showGeneratedMainContent && view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><SpecVisualMode content={view.mainContent}/></div> : null}
      {entityPresentation === "media" && entityContent?.entity ? <div style={{position: "absolute", right: 34, top: 68, width: 560, minHeight: 230, zIndex: 24, display: "flex", flexDirection: "column", justifyContent: "center", padding: "34px 40px", boxSizing: "border-box", borderRadius: 24, background: "rgba(255,250,238,.94)", border: "3px solid rgba(95,70,38,.34)", boxShadow: "0 18px 42px rgba(0,0,0,.28)", color: "#152236"}}>
        <div style={{fontSize: 27, lineHeight: 1.2, fontWeight: 900, color: "#77572d"}}>{entityContent.entity.subjectType === "person" ? "人物" : entityContent.entity.subjectType === "company" ? "企業" : "製品"}</div>
        <div style={{marginTop: 14, fontSize: 52, lineHeight: 1.18, fontWeight: 950}}>{entityContent.entity.displayName}</div>
        <div style={{marginTop: 20, fontSize: 31, lineHeight: 1.36, fontWeight: 850, color: "#40516a"}}>{entityContent.entity.role}</div>
      </div> : null}
    </div>
    <div style={{position: "absolute", left: 64, top: 176, width: 320, height: 720, zIndex: 30, opacity: view.fox.opacity, overflow: "visible"}}>
      <Img src={staticFile(view.fox.src)} style={{width: "100%", height: "100%", objectFit: view.fox.fit, objectPosition: view.fox.objectPosition, transform: "scale(1.34)", transformOrigin: "50% 82%", filter: "drop-shadow(0 16px 22px rgba(0,0,0,.38))"}}/>
    </div>
    <SpecAssetLayer assets={view.overlays} zIndex={40}/>
    <div style={{position: "absolute", left: 416, top: 48, width: 1440, height: 88, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "center", padding: "0 28px", boxSizing: "border-box", borderRadius: 18, background: "linear-gradient(90deg,rgba(5,9,20,.90),rgba(5,9,20,.68))", border: "2px solid rgba(61,220,255,.38)", borderLeft: "10px solid #3ddcff", fontSize: 52, lineHeight: "72px", fontWeight: 950, textShadow: "0 4px 14px rgba(0,0,0,.9)", boxShadow: "0 14px 30px rgba(0,0,0,.22)"}}>{view.headline}</div>
    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right", textShadow: "0 2px 8px #000"}}>{view.sourceLabel}</div> : null}
    {view.captionText ? <div style={{position: "absolute", left: 416, top: 824, width: 1440, height: 176, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 42px", boxSizing: "border-box", overflow: "hidden", borderRadius: 18, background: "rgba(0,0,0,.90)", border: "2px solid rgba(255,255,255,.15)", borderTop: "4px solid rgba(61,220,255,.82)", fontSize: 42, lineHeight: 1.38, fontWeight: 900, textAlign: "center", whiteSpace: "pre-wrap", textShadow: "0 3px 10px #000", boxShadow: "0 -12px 30px rgba(0,0,0,.22)"}}>{view.captionText}</div> : null}
  </AbsoluteFill>;
};

const SpecSceneSequence: React.FC<{
  data: RenderProductionData;
  scene: RenderProductionData["scenes"][number];
  sceneIndex: number;
}> = ({data, scene, sceneIndex}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const previousScene = sceneIndex > 0 ? data.scenes[sceneIndex - 1] : null;
  const fadeInFrames = previousScene?.transition.type === "fade"
    ? getTransitionDurationInFrames(previousScene, fps)
    : 0;
  const fadeOutFrames = sceneIndex < data.scenes.length - 1 && scene.transition.type === "fade"
    ? getTransitionDurationInFrames(scene, fps)
    : 0;
  const fadeInOpacity = fadeInFrames > 0
    ? interpolate(frame, [0, Math.max(1, fadeInFrames - 1)], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 1;
  const fadeOutOpacity = fadeOutFrames > 0
    ? interpolate(frame, [Math.max(0, scene.durationInFrames - fadeOutFrames), scene.durationInFrames - 1], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
    : 1;
  const opacity = fadeInOpacity * fadeOutOpacity;
  return <AbsoluteFill>
    <AbsoluteFill style={{opacity}}><SpecSceneFrame scene={scene} assets={data.assets}/></AbsoluteFill>
    {scene.narrationChunks.map((chunk) => <Sequence key={chunk.chunkId} from={chunk.startFrame} durationInFrames={Math.max(1, chunk.endFrame - chunk.startFrame + 1)} premountFor={fps}><Audio src={staticFile(chunk.audioSrc)}/></Sequence>)}
  </AbsoluteFill>;
};

export const NasdaqCafeSpecEpisode: React.FC<{data: RenderProductionData}> = ({data}) => {
  assertSpecLayoutFits(data);
  return <AbsoluteFill>{data.scenes.map((scene, index) => {
    const transitionFrames = getTransitionDurationInFrames(scene, data.episode.fps);
    if (transitionFrames >= scene.durationInFrames) throw new Error(`$.scenes[${index}].transition.durationMs: transition must be shorter than Scene`);
    return <Sequence key={scene.sceneId} from={scene.startFrame} durationInFrames={scene.durationInFrames} premountFor={data.episode.fps}>
      <SpecSceneSequence data={data} scene={scene} sceneIndex={index}/>
    </Sequence>;
  })}</AbsoluteFill>;
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
