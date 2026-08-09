import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {getStageMotionStyle} from "../src/components/spec/ShotStageRenderer";
import {FOX_FRAME_STYLE, MAIN_STAGE_FRAME_STYLE, SUBTITLE_FRAME_STYLE} from "../src/compositions/NasdaqCafeSpecEpisode";
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

test("production shell geometry stays fixed across every Stage shell", () => {
  assert.deepEqual(
    {left: MAIN_STAGE_FRAME_STYLE.left, top: MAIN_STAGE_FRAME_STYLE.top, width: MAIN_STAGE_FRAME_STYLE.width, height: MAIN_STAGE_FRAME_STYLE.height},
    {left: 416, top: 144, width: 1440, height: 648},
  );
  assert.deepEqual(
    {left: FOX_FRAME_STYLE.left, top: FOX_FRAME_STYLE.top, width: FOX_FRAME_STYLE.width, height: FOX_FRAME_STYLE.height},
    {left: 64, top: 176, width: 320, height: 720},
  );
});

test("public subtitle chrome follows the production-spec fixed region", () => {
  assert.deepEqual(
    {left: SUBTITLE_FRAME_STYLE.left, top: SUBTITLE_FRAME_STYLE.top, width: SUBTITLE_FRAME_STYLE.width, height: SUBTITLE_FRAME_STYLE.height},
    {left: 416, top: 824, width: 1440, height: 176},
  );
  assert.equal(SUBTITLE_FRAME_STYLE.fontSize, 34);
});

test("verification gate shell follows the two-lane verification contract", () => {
  const source = readFileSync("src/components/spec/stages/VerificationGateStage.tsx", "utf8");
  assert.match(source, /calc\(50% - 48px\)/);
  assert.match(source, /left: "50%"/);
  assert.doesNotMatch(source, /33\.333%/);
});

test("verification and evidence templates have distinct renderers and persistent structure", () => {
  const renderer = readFileSync("src/components/spec/VisualTemplateRenderer.tsx", "utf8");
  assert.match(renderer, /const VerificationChecklist/);
  assert.match(renderer, /case "verification-checklist": return <VerificationChecklist/);
  assert.match(renderer, /case "verification-matrix": return <VerificationMatrix/);
  assert.match(renderer, /case "evidence-boundary": return <EvidenceBoundary/);
  assert.match(renderer, /case "metric-comparison-board":\n    case "index-return-bars":\n    case "analogy-steps":/);
  assert.doesNotMatch(renderer, /case "metric-comparison-board":\n    case "index-return-bars":\n    case "evidence-boundary":/);
  assert.match(renderer, /data-verification-lane/);
  assert.match(renderer, /content\.texts\.length > 0 \? content\.texts : content\.cards\.flatMap/);
  assert.match(renderer, /data-evidence-lane/);
  assert.doesNotMatch(renderer, /case "verification-checklist": return <VerificationMatrix/);
});

test("main-stage legibility pass protects dense financial copy", () => {
  const renderer = readFileSync("src/components/spec/VisualTemplateRenderer.tsx", "utf8");
  const timeline = readFileSync("src/components/spec/EventReactionTimelineTemplate.tsx", "utf8");
  assert.match(renderer, /data-expected-actual-card/);
  assert.match(renderer, /const heroSize = Array\.from\(hero\)\.length <= 10 \? 58/);
  assert.match(renderer, /adaptiveEvidenceFontSize/);
  assert.match(renderer, /rgba\(248,251,253,\.94\)/);
  assert.match(renderer, /overflowWrap: "anywhere"/);
  assert.match(renderer, /whiteSpace: "nowrap"/);
  assert.doesNotMatch(renderer, /data-evidence-summary/);
  assert.match(timeline, /data-timeline-count/);
  assert.match(timeline, /splitTimelineValue/);
  assert.match(timeline, /const bodySize = items\.length <= 3 \? 38 : 32/);
});

test("text focus has occupancy-aware hero and duo modes", () => {
  const renderer = readFileSync("src/components/spec/SpecVisualModes.tsx", "utf8");
  assert.match(renderer, /data-text-focus-size/);
  assert.match(renderer, /count === 1 \? 66/);
  assert.match(renderer, /count === 2/);
  assert.match(renderer, /#e8f4ff/);
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

test("prebuilt entity cards use a dedicated foreground slot", () => {
  const viewModel = readFileSync("src/spec/public-view-model.ts", "utf8");
  const assetLayer = readFileSync("src/components/spec/SpecAssetLayer.tsx", "utf8");
  const episode = readFileSync("src/compositions/NasdaqCafeSpecEpisode.tsx", "utf8");
  const templates = readFileSync("src/components/spec/AdditionalVisualTemplates.tsx", "utf8");
  assert.match(viewModel, /placement\.role === "entity-card"[\s\S]*\? "entity-card"/);
  assert.match(assetLayer, /"entity-card": \{position: "absolute", right: 38, top: 34, width: 620, height: 349/);
  assert.match(episode, /const foregroundEntityAssets = view\.mainAssets\.filter/);
  assert.match(episode, /<SpecAssetLayer assets=\{foregroundEntityAssets\} zIndex=\{30\}\/>/);
  assert.match(templates, /const prebuiltCard = content\.entityPresentation === "prebuilt-card"/);
  assert.match(templates, /data-entity-point-panel="true"/);
});
