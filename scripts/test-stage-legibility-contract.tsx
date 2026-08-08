import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {getStageMotionStyle} from "../src/components/spec/ShotStageRenderer";
import {SUBTITLE_FRAME_STYLE, getStageLayoutProfileForShell, getMainStageFrameStyle, getFoxFrameStyle} from "../src/compositions/NasdaqCafeSpecEpisode";
import {VisualGrammarStageHost} from "../src/components/spec/VisualGrammarStageHost";
import {
  STAGE_THEMES,
  STAGE_THEME_IDS,
  getStageChromeModeForShell,
  getStageMotionRoleForShell,
  getStageThemeId,
  validateStageThemeContrast,
} from "../src/spec/stage-theme-contract";
import {SHOT_MOTION_PROFILES} from "../src/spec/shot-motion-contract";
import {STAGE_SHELL_IDS} from "../src/spec/visual-grammar-contract";

const tests: Array<{name: string; run: () => void}> = [];
const test = (name: string, run: () => void) => tests.push({name, run});

test("all seven editorial Stage theme families are registered", () => {
  assert.equal(STAGE_THEME_IDS.length, 7);
  assert.equal(new Set(STAGE_THEME_IDS).size, 7);
  assert.deepEqual(new Set(STAGE_SHELL_IDS.map(getStageThemeId)), new Set(STAGE_THEME_IDS));
});

test("every Stage theme passes text and meaningful-line contrast", () => {
  for (const theme of Object.values(STAGE_THEMES)) {
    assert.deepEqual(validateStageThemeContrast(theme), [], theme.id);
  }
});

test("Stage shells expose semantic theme tokens to Shot recipes", () => {
  const dark = renderToStaticMarkup(
    <VisualGrammarStageHost visualTemplate="opening-contradiction" variant="default">
      <span>dark</span>
    </VisualGrammarStageHost>,
  );
  const evidence = renderToStaticMarkup(
    <VisualGrammarStageHost visualTemplate="news-media" variant="default">
      <span>paper</span>
    </VisualGrammarStageHost>,
  );
  assert.match(dark, /data-stage-theme="dark-hero"/);
  assert.match(evidence, /data-stage-theme="evidence-paper"/);
  assert.match(evidence, /--stage-text-primary:#102033/);
  assert.match(evidence, /--stage-typography-background:rgba\(255,255,255,.90\)/);
});

test("chrome removes duplicate title bands on open explanatory Stages", () => {
  assert.equal(getStageChromeModeForShell("OpenHeroStage"), "full");
  assert.equal(getStageChromeModeForShell("DocumentMediaStage"), "minimal");
  assert.equal(getStageChromeModeForShell("CausalPathStage"), "none");
  assert.equal(getStageChromeModeForShell("SplitComparisonStage"), "none");
  assert.equal(getStageChromeModeForShell("VerificationGateStage"), "none");
  assert.equal(getStageChromeModeForShell("AssemblyStage"), "none");
  assert.equal(getStageChromeModeForShell("TextBridgeStage"), "none");
});

test("closing and major-shift motion are visibly distinct", () => {
  assert.equal(getStageMotionRoleForShell("OpenHeroStage"), "major-shift");
  assert.equal(getStageMotionRoleForShell("AssemblyStage"), "closing");
  assert.notDeepEqual(getStageMotionStyle("major-shift", .04), getStageMotionStyle("closing", .04));
  assert.match(String(getStageMotionStyle("continuation", .04).transform), /scale\(1\.00032\)/);
});

test("Shot choreography stays fast and leaves a readable hold", () => {
  for (const [recipe, profile] of Object.entries(SHOT_MOTION_PROFILES)) {
    assert(profile.enterMs >= 180 && profile.enterMs <= 360, `${recipe}: enter ${profile.enterMs}`);
    assert(profile.buildMs <= 1_800, `${recipe}: build ${profile.buildMs}`);
    assert(profile.holdMinMs >= 600, `${recipe}: hold ${profile.holdMinMs}`);
    assert(profile.staggerMs <= 300, `${recipe}: stagger ${profile.staggerMs}`);
  }
});

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

test("verification gate shell follows the two-lane verification contract", () => {
  const source = readFileSync("src/components/spec/stages/VerificationGateStage.tsx", "utf8");
  assert.match(source, /calc\(50% - 48px\)/);
  assert.match(source, /left: "50%"/);
  assert.doesNotMatch(source, /33\.333%/);
});

test("legacy white-on-dark constants are routed through semantic CSS tokens", () => {
  const safeArea = readFileSync("src/components/spec/StageSafeArea.tsx", "utf8");
  const renderer = readFileSync("src/components/spec/ShotStageRenderer.tsx", "utf8");
  const composition = readFileSync("src/compositions/NasdaqCafeSpecEpisode.tsx", "utf8");
  assert.match(safeArea, /--stage-text-primary/);
  assert.match(safeArea, /--stage-surface-strong/);
  assert.match(renderer, /--stage-typography-background/);
  assert.match(renderer, /data-stage-motion-role/);
  assert.match(composition, /data-stage-chrome/);
  assert.match(composition, /chromeMode !== "none"/);
});

let failed = 0;
for (const item of tests) {
  try {
    item.run();
    console.log(`PASS: ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${item.name}`);
    console.error(error);
  }
}
if (failed > 0) process.exit(1);
console.log(`Stage legibility contract tests: ${tests.length} passed`);
