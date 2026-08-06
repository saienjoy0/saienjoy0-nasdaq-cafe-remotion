import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {
  VISUAL_GRAMMAR_STAGE_SHELL_IDS,
  VisualGrammarStageHost,
  VisualGrammarStageModeProvider,
  getVisualGrammarStageShellId,
} from "../src/components/spec/VisualGrammarStageHost";
import {StageShell as ShotStageShell} from "../src/components/spec/StageSafeArea";
import {VISUAL_GRAMMAR_RENDERER_COMPATIBILITY} from "../src/spec/visual-grammar-contract";
import {VISUAL_TEMPLATE_CONTRACTS} from "../src/spec/visual-template-contract";

const tests: Array<{name: string; run: () => void}> = [];
const test = (name: string, run: () => void) => tests.push({name, run});

test("all fourteen Stage Shell components are registered", () => {
  assert.equal(VISUAL_GRAMMAR_STAGE_SHELL_IDS.length, 14);
  assert.equal(new Set(VISUAL_GRAMMAR_STAGE_SHELL_IDS).size, 14);
});

test("every active Visual Template resolves to its approved Stage Shell", () => {
  for (const entry of VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates) {
    const defaultVariant = VISUAL_TEMPLATE_CONTRACTS[entry.visualTemplateId].variants[0];
    assert.equal(
      getVisualGrammarStageShellId(entry.visualTemplateId, defaultVariant),
      entry.variantOverrides?.find((override) => override.variant === defaultVariant)?.stageShell ?? entry.stageShell,
    );
  }
});

test("active templates reach all fourteen physically distinct Stage Shells", () => {
  const active = new Set(
    VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates.map((entry) => {
      const variant = VISUAL_TEMPLATE_CONTRACTS[entry.visualTemplateId].variants[0];
      return getVisualGrammarStageShellId(entry.visualTemplateId, variant);
    }),
  );
  assert.equal(active.size, 14, `active Stage Shell count was ${active.size}`);
  assert.equal(active.has("TimelineStage"), true);
});

test("variant override changes analogy-steps from PictureBook to CausalPath", () => {
  assert.equal(getVisualGrammarStageShellId("analogy-steps", "default"), "PictureBookStage");
  assert.equal(getVisualGrammarStageShellId("analogy-steps", "left-to-right"), "CausalPathStage");
});

test("assembly and bridge templates remain physically separate", () => {
  assert.equal(getVisualGrammarStageShellId("closing-recap", "default"), "AssemblyStage");
  assert.equal(getVisualGrammarStageShellId("conclusion-card", "default"), "TextBridgeStage");
});

test("Stage Host renders the resolved physical shell without viewer text metadata", () => {
  const markup = renderToStaticMarkup(
    <VisualGrammarStageHost visualTemplate="earnings-surprise" variant="default">
      <span>content</span>
    </VisualGrammarStageHost>,
  );
  assert.match(markup, /data-stage-shell="ProgressiveChartStage"/);
  assert.match(markup, />content</);
  assert.doesNotMatch(markup, />gap</);
  assert.doesNotMatch(markup, />progressive-chart</);
});

test("Shot-plan surface yields to the resolved Stage Shell in candidate mode", () => {
  const markup = renderToStaticMarkup(
    <VisualGrammarStageModeProvider mode="candidate">
      <VisualGrammarStageHost visualTemplate="opening-contradiction" variant="default">
        <ShotStageShell><span>shot-content</span></ShotStageShell>
      </VisualGrammarStageHost>
    </VisualGrammarStageModeProvider>,
  );
  assert.match(markup, /data-stage-shell="OpenHeroStage"/);
  assert.match(markup, /--shot-stage-background:transparent/);
  assert.match(markup, /background:var\(--shot-stage-background,/);
  assert.match(markup, />shot-content</);
});

test("legacy mode keeps the old Shot surface and removes the Grammar shell", () => {
  const markup = renderToStaticMarkup(
    <VisualGrammarStageModeProvider mode="legacy">
      <VisualGrammarStageHost visualTemplate="opening-contradiction" variant="default">
        <ShotStageShell><span>shot-content</span></ShotStageShell>
      </VisualGrammarStageHost>
    </VisualGrammarStageModeProvider>,
  );
  assert.doesNotMatch(markup, /data-stage-shell=/);
  assert.doesNotMatch(markup, /--shot-stage-background:transparent/);
  assert.match(markup, /background:var\(--shot-stage-background,/);
});

test("production Shot path is wrapped by VisualGrammarStageHost", () => {
  const source = readFileSync("src/components/spec/ShotStageRenderer.tsx", "utf8");
  const hostIndex = source.indexOf("<VisualGrammarStageHost");
  const shotIndex = source.indexOf("<ShotTransitionHost", hostIndex);
  assert(hostIndex >= 0, "ShotStageRenderer must resolve a Visual Grammar Stage Host");
  assert(shotIndex > hostIndex, "ShotTransitionHost must render inside VisualGrammarStageHost");
});

test("all Stage Shells produce distinct DOM signatures", () => {
  const signatures = VISUAL_GRAMMAR_STAGE_SHELL_IDS.map((shellId) => {
    const entry = VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates.find((candidate) => candidate.stageShell === shellId);
    if (!entry) {
      assert.equal(shellId, "TimelineStage");
      return shellId;
    }
    const variant = VISUAL_TEMPLATE_CONTRACTS[entry.visualTemplateId].variants[0];
    return renderToStaticMarkup(createElement(VisualGrammarStageHost, {
      visualTemplate: entry.visualTemplateId,
      variant,
      children: createElement("span", null, "x"),
    }));
  });
  assert.equal(new Set(signatures).size, signatures.length);
});

test("legacy generic full-card Surface signature is removed from all template renderers", () => {
  const files = [
    "src/components/spec/VisualTemplateRenderer.tsx",
    "src/components/spec/AdditionalVisualTemplates.tsx",
    "src/components/spec/FinancialVisualTemplates.tsx",
    "src/components/spec/SpecVisualModes.tsx",
  ];
  for (const path of files) {
    const source = readFileSync(path, "utf8");
    assert.equal(source.includes('borderRadius: 28,\n  color:'), false, path);
    assert.equal(source.includes('boxShadow: "0 22px 52px rgba(0,0,0,.27)"'), false, path);
    assert.equal(source.includes('boxShadow: "0 22px 50px rgba(0,0,0,.26)"'), false, path);
  }
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
console.log(`Visual Grammar Stage Shell tests: ${tests.length} passed`);
