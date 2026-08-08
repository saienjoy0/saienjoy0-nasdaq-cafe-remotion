#!/usr/bin/env python3
from pathlib import Path

COMPOSITION = Path("src/compositions/NasdaqCafeSpecEpisode.tsx")
RENDERER = Path("src/components/spec/ShotStageRenderer.tsx")
TEST = Path("scripts/test-stage-legibility-contract.tsx")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


composition = COMPOSITION.read_text(encoding="utf-8")
composition = replace_once(
    composition,
    'import type {VisualGrammarStageMode} from "../spec/visual-grammar-stage-mode";\n',
    'import type {VisualGrammarStageMode} from "../spec/visual-grammar-stage-mode";\nimport type {StageShellId} from "../spec/visual-grammar-contract";\n',
    "composition StageShellId import",
)

layout_policy = r'''
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
'''.strip()

composition = replace_once(
    composition,
    '    };\n\nexport const SpecSceneFrame',
    f'    }};\n\n{layout_policy}\n\nexport const SpecSceneFrame',
    "insert stage layout policy",
)
composition = replace_once(
    composition,
    '  const chromeMode: StageChromeMode = stageMode === "candidate" && stageShellId\n    ? getStageChromeModeForShell(stageShellId)\n    : "full";\n',
    '  const chromeMode: StageChromeMode = stageMode === "candidate" && stageShellId\n    ? getStageChromeModeForShell(stageShellId)\n    : "full";\n  const layoutProfile = getStageLayoutProfileForShell(stageMode === "candidate" ? stageShellId : null);\n',
    "layout profile assignment",
)
composition = replace_once(
    composition,
    '    <div style={{position: "absolute", left: 416, top: 144, width: 1440, height: 648, zIndex: 10, overflow: "hidden", borderRadius: stageMode === "legacy" ? 30 : 0}}>\n',
    '    <div data-stage-layout={layoutProfile} style={getMainStageFrameStyle(layoutProfile, stageMode)}>\n',
    "main stage frame",
)
composition = replace_once(
    composition,
    '    <div style={{position: "absolute", left: 64, top: 176, width: 320, height: 720, zIndex: 30, opacity: view.fox.opacity, overflow: "visible"}}>\n',
    '    <div data-fox-layout={layoutProfile} style={getFoxFrameStyle(layoutProfile, view.fox.opacity)}>\n',
    "fox frame",
)
composition = replace_once(
    composition,
    '    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n',
    '    {view.sourceLabel ? <div style={{position: "absolute", left: 972, top: 860, width: 852, height: 28, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 20, lineHeight: "28px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n',
    "source label frame",
)
old_subtitle = '    {state.subtitleText ? <div style={{position: "absolute", left: 208, top: 812, width: 1664, height: 208, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 42px", boxSizing: "border-box", overflow: "hidden", borderRadius: 18, background: "rgba(0,0,0,.88)", borderTop: "4px solid rgba(255,199,74,.88)", color: "#fff7df", fontSize: 52, lineHeight: 1.28, fontWeight: 900, letterSpacing: "0.01em", textAlign: "center", whiteSpace: "pre-line", wordBreak: "keep-all", overflowWrap: "anywhere", textShadow: "0 4px 12px #000"}}>{state.subtitleText}</div> : null}\n'
composition = replace_once(
    composition,
    old_subtitle,
    '    {state.subtitleText ? <div data-subtitle-chrome="compact" style={SUBTITLE_FRAME_STYLE}>{state.subtitleText}</div> : null}\n',
    "subtitle frame",
)
COMPOSITION.write_text(composition, encoding="utf-8")

renderer = RENDERER.read_text(encoding="utf-8")
renderer = replace_once(
    renderer,
    '  return {opacity: 1, transform: "none"};\n',
    '  const drift = clampUnit(beatProgress);\n  return {\n    opacity: 1,\n    transform: `translateY(${-drift * 5}px) scale(${1 + drift * .008})`,\n  };\n',
    "continuation stage drift",
)
RENDERER.write_text(renderer, encoding="utf-8")

test = TEST.read_text(encoding="utf-8")
test = replace_once(
    test,
    'import {getStageMotionStyle} from "../src/components/spec/ShotStageRenderer";\n',
    'import {getStageMotionStyle} from "../src/components/spec/ShotStageRenderer";\nimport {SUBTITLE_FRAME_STYLE, getStageLayoutProfileForShell, getMainStageFrameStyle, getFoxFrameStyle} from "../src/compositions/NasdaqCafeSpecEpisode";\n',
    "test layout imports",
)
test = replace_once(
    test,
    '  assert.deepEqual(getStageMotionStyle("continuation", .04), {opacity: 1, transform: "none"});\n',
    '  assert.match(String(getStageMotionStyle("continuation", .04).transform), /scale\\(1\\.00032\\)/);\n',
    "test continuation drift assertion",
)
new_tests = r'''

test("semantic Stage shells change the whole composition, not only the card skin", () => {
  assert.equal(getStageLayoutProfileForShell("MetricBoardStage"), "host-left");
  assert.equal(getStageLayoutProfileForShell("MatrixStage"), "host-right");
  assert.equal(getStageLayoutProfileForShell("CausalPathStage"), "immersive");
  assert.equal(getStageLayoutProfileForShell("TimelineStage"), "immersive");
  assert.equal(getStageLayoutProfileForShell("VerificationGateStage"), "host-right");
  const leftMain = getMainStageFrameStyle("host-left", "candidate");
  const rightMain = getMainStageFrameStyle("host-right", "candidate");
  const immersiveMain = getMainStageFrameStyle("immersive", "candidate");
  assert.notEqual(leftMain.left, rightMain.left);
  assert(Number(immersiveMain.width) > Number(leftMain.width));
  assert.equal(getFoxFrameStyle("immersive", 1).opacity, 0);
  assert.notEqual(getFoxFrameStyle("host-left", 1).left, getFoxFrameStyle("host-right", 1).left);
});

test("public subtitle chrome preserves more visual stage area", () => {
  assert(Number(SUBTITLE_FRAME_STYLE.height) <= 126);
  assert(Number(SUBTITLE_FRAME_STYLE.width) <= 1360);
  assert(Number(SUBTITLE_FRAME_STYLE.fontSize) <= 44);
  assert(Number(SUBTITLE_FRAME_STYLE.top) >= 900);
});
'''.rstrip()
test = replace_once(
    test,
    '\ntest("legacy white-on-dark constants are routed through semantic CSS tokens", () => {',
    f'{new_tests}\n\ntest("legacy white-on-dark constants are routed through semantic CSS tokens", () => {{',
    "insert visual rhythm contract tests",
)
TEST.write_text(test, encoding="utf-8")

print("visual rhythm patch applied")
