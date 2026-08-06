import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import {VISUAL_TEMPLATE_IDS} from "../src/spec/visual-template-contract";
import {
  VISUAL_GRAMMAR_APPEARANCE_CLASSES,
  VISUAL_GRAMMAR_DOMINANT_SURFACES,
  VISUAL_GRAMMAR_IDS,
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY,
  VISUAL_GRAMMAR_RENDERER_CONTRACT_VERSION,
  VISUAL_GRAMMAR_RENDER_SPEC_TARGET_VERSION,
  VISUAL_GRAMMAR_SEMANTIC_VERSION,
  VISUAL_GRAMMAR_STAGE_SHELLS,
  VisualGrammarRendererContractError,
  assertVisualGrammarRegistryCoversAllTemplates,
  assertVisualGrammarTemplatePairAllowed,
  getVisualGrammarRendererCompatibility,
  isVisualGrammarTemplatePairAllowed,
} from "../src/spec/visual-grammar-renderer-contract";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const registryPath = resolve(root, "contracts/visual_grammar_renderer_compatibility.json");
const schemaPath = resolve(root, "contracts/visual_grammar_renderer_compatibility.schema.json");
const registryJson = JSON.parse(readFileSync(registryPath, "utf8")) as typeof VISUAL_GRAMMAR_RENDERER_COMPATIBILITY;
JSON.parse(readFileSync(schemaPath, "utf8"));

const tests: Array<{name: string; run: () => void}> = [];
const test = (name: string, run: () => void) => tests.push({name, run});

test("JSON mirror exactly matches the typed compatibility registry", () => {
  assert.deepEqual(registryJson, VISUAL_GRAMMAR_RENDERER_COMPATIBILITY);
});

test("registry versions are frozen for VG-2", () => {
  assert.equal(VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.contractVersion, VISUAL_GRAMMAR_RENDERER_CONTRACT_VERSION);
  assert.equal(VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.semanticGrammarVersion, VISUAL_GRAMMAR_SEMANTIC_VERSION);
  assert.equal(VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.renderSpecTargetVersion, VISUAL_GRAMMAR_RENDER_SPEC_TARGET_VERSION);
  assert.equal(VISUAL_GRAMMAR_RENDER_SPEC_TARGET_VERSION, "2.4.0");
});

test("every registered Visual Template is covered exactly once", () => {
  assert.doesNotThrow(() => assertVisualGrammarRegistryCoversAllTemplates());
  const templateIds = VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.entries.map((entry) => entry.visualTemplateId);
  assert.equal(templateIds.length, VISUAL_TEMPLATE_IDS.length);
  assert.equal(new Set(templateIds).size, templateIds.length);
  assert.deepEqual(new Set(templateIds), new Set(VISUAL_TEMPLATE_IDS));
});

test("every entry uses registered grammar, appearance, surface, and stage IDs", () => {
  const grammarIds = new Set<string>(VISUAL_GRAMMAR_IDS);
  const appearances = new Set<string>(VISUAL_GRAMMAR_APPEARANCE_CLASSES);
  const surfaces = new Set<string>(VISUAL_GRAMMAR_DOMINANT_SURFACES);
  const stages = new Set<string>(VISUAL_GRAMMAR_STAGE_SHELLS);
  for (const entry of VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.entries) {
    assert.equal(entry.status, "active");
    assert.ok(entry.allowedGrammarIds.length > 0);
    for (const grammarId of entry.allowedGrammarIds) assert.ok(grammarIds.has(grammarId));
    assert.ok(appearances.has(entry.appearanceClass));
    assert.ok(surfaces.has(entry.dominantSurface));
    assert.ok(stages.has(entry.stageShell));
  }
});

test("gap is compatible with progressive Expected/Actual templates", () => {
  const entry = assertVisualGrammarTemplatePairAllowed("gap", "earnings-surprise");
  assert.equal(entry.appearanceClass, "progressive-chart");
  assert.equal(entry.stageShell, "ProgressiveChartStage");
  assert.equal(entry.dominantSurface, "plot");
});

test("causal is compatible with an open network stage", () => {
  const entry = assertVisualGrammarTemplatePairAllowed("causal", "causal-lane");
  assert.equal(entry.appearanceClass, "causal-path");
  assert.equal(entry.stageShell, "CausalPathStage");
  assert.equal(entry.dominantSurface, "network");
});

test("verification requires a verification gate appearance", () => {
  for (const templateId of ["verification-checklist", "verification-matrix"] as const) {
    const entry = assertVisualGrammarTemplatePairAllowed("verification", templateId);
    assert.equal(entry.appearanceClass, "verification-gates");
    assert.equal(entry.stageShell, "VerificationGateStage");
  }
});

test("entity, media, picturebook, and text bridge templates are marked non-analysis", () => {
  for (const templateId of ["entity-card-full", "source-receipt", "news-media", "analogy-steps", "text-focus"] as const) {
    assert.equal(getVisualGrammarRendererCompatibility(templateId).nonAnalysis, true);
  }
});

test("a grammar/template mismatch fails instead of using a generic fallback", () => {
  assert.equal(isVisualGrammarTemplatePairAllowed("gap", "split-comparison"), false);
  assert.throws(
    () => assertVisualGrammarTemplatePairAllowed("gap", "split-comparison"),
    (error: unknown) => error instanceof VisualGrammarRendererContractError
      && error.code === "VG_GRAMMAR_TEMPLATE_MISMATCH",
  );
});

test("an unregistered template fails explicitly", () => {
  assert.throws(
    () => getVisualGrammarRendererCompatibility("generic-card"),
    (error: unknown) => error instanceof VisualGrammarRendererContractError
      && error.code === "VG_TEMPLATE_NOT_REGISTERED",
  );
});

test("compatibility lookup requires explicit grammar and template inputs", () => {
  assert.equal(isVisualGrammarTemplatePairAllowed.length, 2);
  assert.equal(assertVisualGrammarTemplatePairAllowed.length, 2);
});

let failures = 0;
for (const {name, run} of tests) {
  try {
    run();
    console.log(`PASS: ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL: ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`Visual Grammar renderer contract: ${failures} failed`);
  process.exit(1);
}
console.log(`Visual Grammar renderer contract: ${tests.length} passed`);
