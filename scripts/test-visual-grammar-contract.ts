import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY,
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarCompatibility,
  isVisualGrammarTemplatePairAllowed,
  visualGrammarRendererCompatibilitySchema,
} from "../src/spec/visual-grammar-contract";
import {renderSpecSchema, type RenderSpec} from "../src/spec/render-spec";
import {validateVisualGrammarContract} from "../src/spec/validate-visual-grammar";
import {
  cloneTestValue,
  makeCurrentVisualGrammarFixture,
} from "./test-support/current-visual-grammar-fixture";
import {VISUAL_TEMPLATE_IDS} from "../src/spec/visual-template-contract";

const tests: Array<{name: string; run: () => void | Promise<void>}> = [];
const test = (name: string, run: () => void | Promise<void>) => tests.push({name, run});

const compatibilityById = Object.fromEntries(
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates.map((entry) => [
    entry.visualTemplateId,
    entry,
  ]),
) as Record<string, (typeof VISUAL_GRAMMAR_RENDERER_COMPATIBILITY.templates)[number]>;

test("compatibility registry validates", () => {
  visualGrammarRendererCompatibilitySchema.parse(VISUAL_GRAMMAR_RENDERER_COMPATIBILITY);
});

test("every registered Visual Template has exactly one compatibility entry", () => {
  assert.deepEqual(
    [...Object.keys(compatibilityById)].sort(),
    [...VISUAL_TEMPLATE_IDS].sort(),
  );
});

test("compatibility registry SHA matches the committed JSON bytes", async () => {
  const bytes = await readFile("contracts/visual_grammar_renderer_compatibility.json");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  );
});

test("allowed Grammar and Template pairs pass", () => {
  assert.equal(isVisualGrammarTemplatePairAllowed("gap", "earnings-surprise"), true);
  assert.equal(isVisualGrammarTemplatePairAllowed("comparison", "split-comparison"), true);
});

test("disallowed Grammar and Template pairs fail", () => {
  assert.equal(isVisualGrammarTemplatePairAllowed("verification", "earnings-surprise"), false);
  assert.equal(isVisualGrammarTemplatePairAllowed("gap", "news-media"), false);
});

test("verification checklist is physically distinct from verification matrix", () => {
  const checklist = getVisualGrammarCompatibility("verification-checklist");
  const matrix = getVisualGrammarCompatibility("verification-matrix");
  assert.deepEqual(
    {
      appearanceClass: checklist.appearanceClass,
      dominantSurface: checklist.dominantSurface,
      stageShell: checklist.stageShell,
      motionLanguage: checklist.motionLanguage,
    },
    {
      appearanceClass: "metric-board",
      dominantSurface: "card-board",
      stageShell: "MetricBoardStage",
      motionLanguage: "metric-board",
    },
  );
  assert.notEqual(checklist.appearanceClass, matrix.appearanceClass);
  assert.notEqual(checklist.stageShell, matrix.stageShell);
});

test("render_spec 2.2.0 remains valid without Visual Grammar metadata", () => {
  renderSpecSchema.parse(fixtureJson);
});

test("render_spec 2.4.0 requires and validates Visual Grammar metadata", () => {
  const value = makeCurrentVisualGrammarFixture();
  validateVisualGrammarContract(value);
});

test("render_spec 2.4.0 rejects a missing root contract", () => {
  const value = cloneTestValue(makeCurrentVisualGrammarFixture()) as RenderSpec & {visualGrammarContract?: unknown};
  delete value.visualGrammarContract;
  assert.throws(() => renderSpecSchema.parse(value), /visualGrammarContract/);
});

test("renderer compatibility SHA mismatch is rejected", () => {
  const value = cloneTestValue(makeCurrentVisualGrammarFixture());
  value.visualGrammarContract!.rendererCompatibilitySha256 = "f".repeat(64);
  assert.throws(
    () => validateVisualGrammarContract(value),
    /VG_REGISTRY_SHA_MISMATCH/,
  );
});

test("Grammar and Template mismatch is rejected", () => {
  const value = cloneTestValue(makeCurrentVisualGrammarFixture());
  value.scenes[0].visualBeats[0].visualGrammarId = "verification";
  assert.throws(
    () => validateVisualGrammarContract(value),
    /VG_GRAMMAR_TEMPLATE_MISMATCH/,
  );
});

test("major-shift must be physically different", () => {
  const value = cloneTestValue(makeCurrentVisualGrammarFixture());
  const first = value.scenes[0].visualBeats[0];
  const second = value.scenes[0].visualBeats[1];
  second.visualTemplate = first.visualTemplate;
  second.templateConfig.variant = first.templateConfig.variant;
  second.visualGrammarId = first.visualGrammarId;
  second.transitionRole = "major-shift";
  assert.throws(
    () => validateVisualGrammarContract(value),
    /VG_MAJOR_SHIFT_NOT_PHYSICAL/,
  );
});

test("appearance lookup is deterministic by Template and Variant", () => {
  const entry = getVisualGrammarCompatibility("analogy-steps");
  assert.equal(entry.appearanceClass, "picturebook-canvas");
});

let failed = 0;
for (const item of tests) {
  try {
    await item.run();
    console.log(`PASS: ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${item.name}`);
    console.error(error);
  }
}
if (failed > 0) process.exit(1);
console.log(`visual grammar renderer contract tests: ${tests.length} passed`);

await import("./test-visual-architecture-v1-5");
