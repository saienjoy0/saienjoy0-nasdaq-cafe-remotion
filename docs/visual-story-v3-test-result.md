# Visual Story Engine v3 Test Result

- Run ID: 30865398420
- Commit: 46938d48339c940668f455d0bdb90efa082a0cd7
- Exit status: 1

```text
=== TYPECHECK ===

> nasdaq-cafe-remotion@1.0.0 typecheck
> tsc

src/components/spec/ShotStageRenderer.tsx(2,45): error TS6196: 'PublicNode' is declared but never used.
src/spec/validate-shot-story.ts(61,13): error TS18048: 'startIndex' is possibly 'undefined'.
src/spec/validate-shot-story.ts(61,44): error TS18048: 'startIndex' is possibly 'undefined'.
src/spec/validate-shot-story.ts(62,13): error TS18048: 'endIndex' is possibly 'undefined'.
src/spec/validate-shot-story.ts(62,42): error TS18048: 'endIndex' is possibly 'undefined'.
=== SHOT CONTRACT ===

> nasdaq-cafe-remotion@1.0.0 test:shot-story
> tsx scripts/test-shot-story.ts

/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/src/spec/validate-shot-story.ts:5
  throw new Error(`${path}: ${message}`);
        ^

Error: $.scenes: the same Stage Layout may not lead more than 3 consecutive Shots
    at fail (/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/src/spec/validate-shot-story.ts:5:9)
    at validateShotStoryContract (/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/src/spec/validate-shot-story.ts:108:34)
    at <anonymous> (/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/scripts/test-shot-story.ts:8:1)

Node.js v22.23.1
=== VISUAL STORY ===

> nasdaq-cafe-remotion@1.0.0 test:visual-story
> npm run test:visual-sequence && npm run test:visual-variety && npm run test:visual-templates && npm run test:visual-validator && npm run test:subtitles && npm run test:shot-story && tsx scripts/test-spec-presentation.ts


> nasdaq-cafe-remotion@1.0.0 test:visual-sequence
> tsx scripts/test-visual-sequence.ts

PASS: render_spec controls reveal order, motion timing, highlight timing, and animated exit retention

> nasdaq-cafe-remotion@1.0.0 test:visual-variety
> tsx scripts/test-visual-variety.ts

PASS: visual variety (17 templates, longest run 2)

> nasdaq-cafe-remotion@1.0.0 test:visual-templates
> tsx scripts/test-visual-templates.ts

node:internal/modules/run_main:123
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: The input did not match the regular expression /VisualTemplateRenderer/. Input:

'import {Fragment} from "react";\n' +
  'import {Audio} from "@remotion/media";\n' +
  'import {TransitionSeries, linearTiming} from "@remotion/transitions";\n' +
  'import {fade} from "@remotion/transitions/fade";\n' +
  'import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";\n' +
  'import {SpecAssetLayer} from "../components/spec/SpecAssetLayer";\n' +
  'import {FoxExpressionLayer} from "../components/spec/FoxExpressionLayer";\n' +
  'import {ShotStageRenderer} from "../components/spec/ShotStageRenderer";\n' +
  'import {SoundCueTrack} from "../components/spec/SoundCueTrack";\n' +
  'import type {RenderProductionData, RenderSpecScene} from "../spec/render-spec";\n' +
  'import {getSceneRenderState, getSpecDurationInFrames, getTransitionDurationInFrames} from "../spec/render-state";\n' +
  'import {toPublicSceneViewModel} from "../spec/public-view-model";\n' +
  'import {assertSpecLayoutFits} from "../spec/validate-render-layout";\n' +
  'import {fontFamily} from "../fonts";\n' +
  '\n' +
  'const sceneStyle: React.CSSProperties = {\n' +
  '  background: "#050914",\n' +
  '  color: "#f7fbff",\n' +
  '  fontFamily,\n' +
  '};\n' +
  '\n' +
  'export const SpecSceneFrame: React.FC<{\n' +
  '  scene: RenderProductionData["scenes"][number];\n' +
  '  assets: Record<string, string>;\n' +
  '  timeMsOverride?: number;\n' +
  '}> = ({scene, assets, timeMsOverride}) => {\n' +
  '  const frame = useCurrentFrame();\n' +
  '  const {fps} = useVideoConfig();\n' +
  '  const timeMs = timeMsOverride ?? (frame / fps) * 1000;\n' +
  '  const state = getSceneRenderState(scene, timeMs);\n' +
  '  const view = toPublicSceneViewModel(scene, state, assets);\n' +
  '  return <AbsoluteFill style={sceneStyle}>\n' +
  '    <SpecAssetLayer assets={[view.background]} zIndex={0}/>\n' +
  '    <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, zIndex: 10, overflow: "hidden", borderRadius: 30}}>\n' +
  '      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>\n' +
  '      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}\n' +
  '    </div>\n' +
  '    <div style={{position: "absolute", left: 64, top: 176, width: 320, height: 720, zIndex: 30, opacity: view.fox.opacity, overflow: "visible"}}>\n' +
  '      <FoxExpressionLayer fox={view.fox} previousFox={view.previousFox} transitionProgress={view.foxTransitionProgress}/>\n' +
  '    </div>\n' +
  '    <SpecAssetLayer assets={view.overlays} zIndex={40}/>\n' +
  '    <div style={{position: "absolute", left: 400, top: 42, width: 1472, height: 92, zIndex: 50, display: "flex", alignItems: "center", padding: "8px 20px", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap", borderRadius: 18, background: "linear-gradient(90deg,rgba(4,10,23,.88),rgba(4,10,23,.58),rgba(4,10,23,0))", fontSize: 52, lineHeight: "72px", fontWeight: 950, textShadow: "0 4px 14px rgba(0,0,0,.9)"}}>{view.headline}</div>\n' +
  '    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n' +
  '    {state.subtitleText ? <div style={{position: "absolute", left: 208, top: 812, width: 1664, height: 208, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 42px", boxSizing: "border-box", overflow: "hidden", borderRadius: 18, background: "rgba(0,0,0,.88)", borderTop: "4px solid rgba(255,199,74,.88)", color: "#fff7df", fontSize: 52, lineHeight: 1.28, fontWeight: 900, letterSpacing: "0.01em", textAlign: "center", whiteSpace: "pre-line", wordBreak: "keep-all", overflowWrap: "anywhere", textShadow: "0 4px 12px #000"}}>{state.subtitleText}</div> : null}\n' +
  '  </AbsoluteFill>;\n' +
  '};\n' +
  '\n' +
  'export const NasdaqCafeSpecEpisode: React.FC<{data: RenderProductionData}> = ({data}) => {\n' +
  '  assertSpecLayoutFits(data);\n' +
  '  return <TransitionSeries>{data.scenes.map((scene, index) => {\n' +
  '    const transitionFrames = getTransitionDurationInFrames(scene, data.episode.fps);\n' +
  '    if (transitionFrames >= scene.durationInFrames) throw new Error(`$.scenes[${index}].transition.durationMs: transition must be shorter than Scene`);\n' +
  '    return <Fragment key={scene.sceneId}>\n' +
  '      <TransitionSeries.Sequence durationInFrames={scene.durationInFrames} premountFor={data.episode.fps}>\n' +
  '        <SpecSceneFrame scene={scene} assets={data.assets}/>\n' +
  '        {scene.narrationChunks.map((chunk) => <Sequence key={chunk.chunkId} from={chunk.startFrame} durationInFrames={Math.max(1, chunk.endFrame - chunk.startFrame + 1)} premountFor={data.episode.fps}><Audio src={staticFile(chunk.audioSrc)}/></Sequence>)}\n' +
  '        <SoundCueTrack scene={scene} fps={data.episode.fps}/>\n' +
  '      </TransitionSeries.Sequence>\n' +
  '      {index < data.scenes.length - 1 && scene.transition.type === "fade" ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: transitionFrames})}/> : null}\n' +
  '    </Fragment>;\n' +
  '  })}</TransitionSeries>;\n' +
  '};\n' +
  '\n' +
  'export const calculateSpecDurationInFrames = (data: RenderProductionData) =>\n' +
  '  getSpecDurationInFrames(data.scenes, data.episode.fps);\n' +
  '\n' +
  'const debugScene = (scene: RenderSpecScene): RenderProductionData["scenes"][number] => {\n' +
  '  const narrationChunks = scene.narrationChunks.map((chunk, index) => ({\n' +
  '    chunkId: chunk.chunkId,\n' +
  '    speechText: chunk.speechText,\n' +
  '    caption: {text: chunk.captionText, startMs: index * 1000, endMs: (index + 1) * 1000, timestampMs: null, confidence: null},\n' +
  '    expression: chunk.expression,\n' +
  '    pauseAfterMs: chunk.pauseAfterMs,\n' +
  '    audioSrc: "technical-only/no-audio.wav",\n' +
  '    audioDurationMs: 1000,\n' +
  '    startMs: index * 1000,\n' +
  '    endMs: (index + 1) * 1000,\n' +
  '    startFrame: index * 30,\n' +
  '    endFrame: index * 30 + 29,\n' +
  '  }));\n' +
  '  const visualBeats = scene.visualBeats.map((beat) => {\n' +
  '    const startIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.startChunkId);\n' +
  '    const endIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.endChunkId);\n' +
  '    return {...beat, startMs: startIndex * 1000, endMs: (endIndex + 1) * 1000, startFrame: startIndex * 30, endFrame: (endIndex + 1) * 30 - 1};\n' +
  '  });\n' +
  '  return {...scene, narrationChunks, visualBeats, startFrame: 0, endFrame: narrationChunks.length * 30 - 1, durationInFrames: narrationChunks.length * 30, durationMs: narrationChunks.length * 1000};\n' +
  '};\n' +
  '\n' +
  'export const SpecDebugStill: React.FC<{scene: RenderSpecScene; assets: Record<string, string>; timeMs?: number}> = ({scene, assets, timeMs = 0}) => <SpecSceneFrame scene={debugScene(scene)} assets={assets} timeMsOverride={timeMs}/>;\n'

    at <anonymous> (/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/scripts/test-visual-templates.ts:51:8) {
  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: 'import {Fragment} from "react";\n' +
    'import {Audio} from "@remotion/media";\n' +
    'import {TransitionSeries, linearTiming} from "@remotion/transitions";\n' +
    'import {fade} from "@remotion/transitions/fade";\n' +
    'import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";\n' +
    'import {SpecAssetLayer} from "../components/spec/SpecAssetLayer";\n' +
    'import {FoxExpressionLayer} from "../components/spec/FoxExpressionLayer";\n' +
    'import {ShotStageRenderer} from "../components/spec/ShotStageRenderer";\n' +
    'import {SoundCueTrack} from "../components/spec/SoundCueTrack";\n' +
    'import type {RenderProductionData, RenderSpecScene} from "../spec/render-spec";\n' +
    'import {getSceneRenderState, getSpecDurationInFrames, getTransitionDurationInFrames} from "../spec/render-state";\n' +
    'import {toPublicSceneViewModel} from "../spec/public-view-model";\n' +
    'import {assertSpecLayoutFits} from "../spec/validate-render-layout";\n' +
    'import {fontFamily} from "../fonts";\n' +
    '\n' +
    'const sceneStyle: React.CSSProperties = {\n' +
    '  background: "#050914",\n' +
    '  color: "#f7fbff",\n' +
    '  fontFamily,\n' +
    '};\n' +
    '\n' +
    'export const SpecSceneFrame: React.FC<{\n' +
    '  scene: RenderProductionData["scenes"][number];\n' +
    '  assets: Record<string, string>;\n' +
    '  timeMsOverride?: number;\n' +
    '}> = ({scene, assets, timeMsOverride}) => {\n' +
    '  const frame = useCurrentFrame();\n' +
    '  const {fps} = useVideoConfig();\n' +
    '  const timeMs = timeMsOverride ?? (frame / fps) * 1000;\n' +
    '  const state = getSceneRenderState(scene, timeMs);\n' +
    '  const view = toPublicSceneViewModel(scene, state, assets);\n' +
    '  return <AbsoluteFill style={sceneStyle}>\n' +
    '    <SpecAssetLayer assets={[view.background]} zIndex={0}/>\n' +
    '    <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, zIndex: 10, overflow: "hidden", borderRadius: 30}}>\n' +
    '      <SpecAssetLayer assets={view.mainAssets} zIndex={10}/>\n' +
    '      {view.mainContent ? <div style={{position: "absolute", inset: 0, zIndex: 20}}><ShotStageRenderer content={view.mainContent}/></div> : null}\n' +
    '    </div>\n' +
    '    <div style={{position: "absolute", left: 64, top: 176, width: 320, height: 720, zIndex: 30, opacity: view.fox.opacity, overflow: "visible"}}>\n' +
    '      <FoxExpressionLayer fox={view.fox} previousFox={view.previousFox} transitionProgress={view.foxTransitionProgress}/>\n' +
    '    </div>\n' +
    '    <SpecAssetLayer assets={view.overlays} zIndex={40}/>\n' +
    '    <div style={{position: "absolute", left: 400, top: 42, width: 1472, height: 92, zIndex: 50, display: "flex", alignItems: "center", padding: "8px 20px", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap", borderRadius: 18, background: "linear-gradient(90deg,rgba(4,10,23,.88),rgba(4,10,23,.58),rgba(4,10,23,0))", fontSize: 52, lineHeight: "72px", fontWeight: 950, textShadow: "0 4px 14px rgba(0,0,0,.9)"}}>{view.headline}</div>\n' +
    '    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n' +
    '    {state.subtitleText ? <div style={{position: "absolute", left: 208, top: 812, width: 1664, height: 208, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 42px", boxSizing: "border-box", overflow: "hidden", borderRadius: 18, background: "rgba(0,0,0,.88)", borderTop: "4px solid rgba(255,199,74,.88)", color: "#fff7df", fontSize: 52, lineHeight: 1.28, fontWeight: 900, letterSpacing: "0.01em", textAlign: "center", whiteSpace: "pre-line", wordBreak: "keep-all", overflowWrap: "anywhere", textShadow: "0 4px 12px #000"}}>{state.subtitleText}</div> : null}\n' +
    '  </AbsoluteFill>;\n' +
    '};\n' +
    '\n' +
    'export const NasdaqCafeSpecEpisode: React.FC<{data: RenderProductionData}> = ({data}) => {\n' +
    '  assertSpecLayoutFits(data);\n' +
    '  return <TransitionSeries>{data.scenes.map((scene, index) => {\n' +
    '    const transitionFrames = getTransitionDurationInFrames(scene, data.episode.fps);\n' +
    '    if (transitionFrames >= scene.durationInFrames) throw new Error(`$.scenes[${index}].transition.durationMs: transition must be shorter than Scene`);\n' +
    '    return <Fragment key={scene.sceneId}>\n' +
    '      <TransitionSeries.Sequence durationInFrames={scene.durationInFrames} premountFor={data.episode.fps}>\n' +
    '        <SpecSceneFrame scene={scene} assets={data.assets}/>\n' +
    '        {scene.narrationChunks.map((chunk) => <Sequence key={chunk.chunkId} from={chunk.startFrame} durationInFrames={Math.max(1, chunk.endFrame - chunk.startFrame + 1)} premountFor={data.episode.fps}><Audio src={staticFile(chunk.audioSrc)}/></Sequence>)}\n' +
    '        <SoundCueTrack scene={scene} fps={data.episode.fps}/>\n' +
    '      </TransitionSeries.Sequence>\n' +
    '      {index < data.scenes.length - 1 && scene.transition.type === "fade" ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: transitionFrames})}/> : null}\n' +
    '    </Fragment>;\n' +
    '  })}</TransitionSeries>;\n' +
    '};\n' +
    '\n' +
    'export const calculateSpecDurationInFrames = (data: RenderProductionData) =>\n' +
    '  getSpecDurationInFrames(data.scenes, data.episode.fps);\n' +
    '\n' +
    'const debugScene = (scene: RenderSpecScene): RenderProductionData["scenes"][number] => {\n' +
    '  const narrationChunks = scene.narrationChunks.map((chunk, index) => ({\n' +
    '    chunkId: chunk.chunkId,\n' +
    '    speechText: chunk.speechText,\n' +
    '    caption: {text: chunk.captionText, startMs: index * 1000, endMs: (index + 1) * 1000, timestampMs: null, confidence: null},\n' +
    '    expression: chunk.expression,\n' +
    '    pauseAfterMs: chunk.pauseAfterMs,\n' +
    '    audioSrc: "technical-only/no-audio.wav",\n' +
    '    audioDurationMs: 1000,\n' +
    '    startMs: index * 1000,\n' +
    '    endMs: (index + 1) * 1000,\n' +
    '    startFrame: index * 30,\n' +
    '    endFrame: index * 30 + 29,\n' +
    '  }));\n' +
    '  const visualBeats = scene.visualBeats.map((beat) => {\n' +
    '    const startIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.startChunkId);\n' +
    '    const endIndex = narrationChunks.findIndex((chunk) => chunk.chunkId === beat.endChunkId);\n' +
    '    return {...beat, startMs: startIndex * 1000, endMs: (endIndex + 1) * 1000, startFrame: startIndex * 30, endFrame: (endIndex + 1) * 30 - 1};\n' +
    '  });\n' +
    '  return {...scene, narrationChunks, visualBeats, startFrame: 0, endFrame: narrationChunks.length * 30 - 1, durationInFrames: narrationChunks.length * 30, durationMs: narrationChunks.length * 1000};\n' +
    '};\n' +
    '\n' +
    'export const SpecDebugStill: React.FC<{scene: RenderSpecScene; assets: Record<string, string>; timeMs?: number}> = ({scene, assets, timeMs = 0}) => <SpecSceneFrame scene={debugScene(scene)} assets={assets} timeMsOverride={timeMs}/>;\n',
  expected: /VisualTemplateRenderer/,
  operator: 'match',
  diff: 'simple'
}

Node.js v22.23.1
=== PUBLIC SCREEN ===

> nasdaq-cafe-remotion@1.0.0 test:public-screen
> tsx scripts/test-public-screen.ts

PASS: 視聴者向け画面から制作・デバッグ表示を除去
=== RENDER SPEC ===

> nasdaq-cafe-remotion@1.0.0 test:spec
> tsx scripts/test-render-spec.ts && tsx scripts/test-spec-inspect.ts && npm run test:visual-story

PASS: complete 9Scene fixture validates
PASS: schemaVersion mismatch is rejected
PASS: root unknown field is rejected
PASS: nested unknown field is rejected
PASS: 8Scene is rejected
PASS: 10Scene is rejected
PASS: duplicate Scene is rejected
PASS: Scene order is rejected
PASS: Scene 1 integrated role is required
PASS: Scene 9 fixed closing role is required
PASS: unsafe chunk ID is rejected
PASS: invalid visualMode is rejected
PASS: invalid expression is rejected
PASS: invalid visual event action is rejected
PASS: invalid number tone is rejected
PASS: invalid transition type is rejected
PASS: invalid asset role is rejected
PASS: cross-Scene duplicate chunk ID is rejected
PASS: cross-Scene duplicate object ID is rejected
PASS: cross-Scene duplicate event ID is rejected
PASS: missing source reference is rejected
PASS: missing chunk reference is rejected
PASS: missing object target is rejected
PASS: missing node reference is rejected
PASS: missing asset reference is rejected
PASS: invalid asset role-region pair is rejected
PASS: invalid placement chunk order is rejected
PASS: every Scene requires one canonical background
PASS: alternate Scene background is rejected
PASS: overlapping main-stage assets are rejected
PASS: Expected role is required
PASS: Actual role is required
PASS: Gap role is required
PASS: Expected Actual Gap roles cannot be duplicated
PASS: Visual Beats are required
PASS: Visual Beats must cover every chunk exactly once
PASS: Visual Beat narration cues must resolve to their chunks
PASS: incomplete Visual Beat assets are rejected
PASS: user-review-required external entity assets can reach MP4 production
PASS: noPhoto is a complete EntityFocus variant without an external asset
PASS: EntityFocus requires an explicit return Beat
PASS: MainWithEntity validates only in the dedicated two-column slots
PASS: PictureBook requires checked same-fox metadata and one full-stage illustration
PASS: Expected Actual Gap semantics survive card reordering
PASS: voice profile absence is rejected
PASS: Gemini fox-main voice profile validates
PASS: Spec production rejects VOICEVOX profiles
PASS: Mochiko Anko profile is fixed
PASS: visualMode required data is enforced
PASS: Scene transition contract is enforced
PASS: recommended publishing values belong to candidate arrays
PASS: review total equals score sum
PASS: approvedForCodex false validates but cannot compile
PASS: compile preserves Phase 1 contract and order
PASS: compile records the supplied input spec SHA-256
PASS: production JSON is invariant across TTS cache hit and miss
PASS: generated JSON Schema matches the Zod source
PASS: renderer hides captions during pauses
PASS: renderer switches Visual Beats inside one Scene and returns to Data
PASS: public ViewModel excludes Scene, Beat, mode, expression, and build metadata
PASS: expression priority is initial then chunk then same-time event
PASS: visibility and highlight events are deterministic and Scene-local
PASS: asset placement obeys chunk range
PASS: fade transitions reduce composition duration deterministically
PASS: overflow is reported with a JSON path
PASS: overflow supportingTexts reports its JSON path
PASS: overflow captionText reports its JSON path
PASS: overflow card title reports its JSON path
PASS: overflow card label reports its JSON path
PASS: overflow card value reports its JSON path
PASS: overflow number label reports its JSON path
PASS: overflow node label reports its JSON path
PASS: overflow arrow label reports its JSON path
PASS: overflow source label reports its JSON path
PASS: expression registry never uses fallback assets
PASS: production expression preflight accepts renderable fixture
PASS: production expression preflight accepts all-expression schema fixture
PASS: production expression preflight error includes full location and asset diagnostics
PASS: all seven expressions are used by renderable fixture
PASS: audio cache key is deterministic
PASS: audio cache key changes with speechText
PASS: audio cache key changes with pronunciations
PASS: audio cache key changes with profile
PASS: audio file path identity is safe and deterministic
PASS: audio file path rejects traversal
PASS: audio standard is fixed to 48kHz mono PCM16
PASS: Gemini production audio has exactly two fixed blocks
PASS: new spec CLI cannot reach legacy content-decision modules
PASS: preview and final select independent output branches
PASS: production renderer does not read derived assetIds
render_spec named contract tests: 90 passed
node:internal/child_process:285
      const err = new ErrnoException(exitCode, syscall);
                  ^

Error: spawn ffmpeg ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:285:19)
    at onErrorNT (node:internal/child_process:483:16)
    at process.processTicksAndRejections (node:internal/process/task_queues:89:21) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'spawn ffmpeg',
  path: 'ffmpeg',
  spawnargs: [
    '-y',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=black:s=320x180:r=30:d=1',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=48000:duration=1',
    '-t',
    '1',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-ac',
    '1',
    '/home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/renders/tests/phase4-inspect-fixtures/valid.mp4'
  ],
  cmd: 'ffmpeg -y -v error -f lavfi -i color=c=black:s=320x180:r=30:d=1 -f lavfi -i sine=frequency=440:sample_rate=48000:duration=1 -t 1 -c:v libx264 -pix_fmt yuv420p -c:a aac -ar 48000 -ac 1 /home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/renders/tests/phase4-inspect-fixtures/valid.mp4',
  stdout: '',
  stderr: ''
}

Node.js v22.23.1
=== BUNDLE ===

> nasdaq-cafe-remotion@1.0.0 build
> remotion bundle src/index.ts dist/remotion

[31mThe folder at /home/runner/work/saienjoy0-nasdaq-cafe-remotion/saienjoy0-nasdaq-cafe-remotion/build already exists, and needs to be deleted before a new bundle can be created.[39m
[31mHowever, it does not look like the folder was created by `npx remotion bundle` (no index.html).[39m
[31mAborting to prevent accidental data loss.[39m
```
