import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {MOTION_PRESET_IDS, MOTION_PRESETS_BY_ACTION} from "../src/spec/motion-preset-contract";
import {VISUAL_TEMPLATE_CONTRACTS, VISUAL_TEMPLATE_IDS} from "../src/spec/visual-template-contract";

const project = process.cwd();
const renderer = await readFile(path.join(project, "src/components/spec/VisualTemplateRenderer.tsx"), "utf8");
const shotRenderer = await readFile(path.join(project, "src/components/spec/ShotStageRenderer.tsx"), "utf8");
const viewModel = await readFile(path.join(project, "src/spec/public-view-model.ts"), "utf8");
const composition = await readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8");
const schema = await readFile(path.join(project, "src/spec/render-spec.ts"), "utf8");
const templateRegistry = await readFile(path.join(project, "src/spec/visual-template-contract.ts"), "utf8");
const motionRegistry = await readFile(path.join(project, "src/spec/motion-preset-contract.ts"), "utf8");

for (const template of VISUAL_TEMPLATE_IDS) {
  assert.ok(template in VISUAL_TEMPLATE_CONTRACTS, `template contract is missing ${template}`);
  assert.match(templateRegistry, new RegExp(`\\"${template}\\"`), `template registry source is missing ${template}`);
  assert.match(renderer, new RegExp(`\\"${template}\\"`), `renderer is missing ${template}`);
}
assert.match(schema, /visualTemplateSchema = z\.enum\(VISUAL_TEMPLATE_IDS\)/);
assert.match(schema, /motionPresetSchema = z\.enum\(MOTION_PRESET_IDS\)/);
assert.match(schema, /sequencePolicySchema = z\.enum\(SEQUENCE_POLICY_IDS\)/);

for (const preset of MOTION_PRESET_IDS) {
  assert.match(motionRegistry, new RegExp(`\\"${preset}\\"`), `motion registry source is missing ${preset}`);
}
assert.ok(MOTION_PRESETS_BY_ACTION.show.includes("draw-line"));
assert.ok(MOTION_PRESETS_BY_ACTION.show.includes("count-up"));
assert.ok(MOTION_PRESETS_BY_ACTION.hide.includes("fade-out"));
assert.ok(MOTION_PRESETS_BY_ACTION.highlight.includes("focus-ring"));
assert.equal(MOTION_PRESETS_BY_ACTION.hide.includes("count-up"), false);

for (const forbidden of [
  "componentPath",
  "eval(",
  "new Function",
  "Math.random",
  "import(/* webpackIgnore",
  "raw.githubusercontent.com",
]) {
  assert.equal(renderer.includes(forbidden), false, `renderer contains forbidden dynamic behavior: ${forbidden}`);
  assert.equal(shotRenderer.includes(forbidden), false, `Shot renderer contains forbidden dynamic behavior: ${forbidden}`);
}

assert.match(viewModel, /visualTemplate:/);
assert.match(viewModel, /templateConfig:/);
assert.match(viewModel, /sequencePolicy:/);
assert.match(viewModel, /shot:/);
assert.match(viewModel, /previousShot:/);
assert.match(viewModel, /object-order-fallback/);
assert.match(viewModel, /explicit/);
assert.match(viewModel, /enterMotion:/);
assert.match(viewModel, /exitMotion:/);
assert.match(composition, /ShotStageRenderer/);
assert.match(shotRenderer, /VisualTemplateRenderer/);
assert.doesNotMatch(composition, /<SpecVisualMode content=/);
assert.match(renderer, /ExpectedActualFlow/);
assert.match(renderer, /CausalLane/);
assert.match(renderer, /TailwindHeadwind/);
assert.match(renderer, /DivergingBars/);
assert.match(renderer, /VerificationMatrix/);
assert.match(renderer, /FinalAssembly/);
assert.match(renderer, /draw-line/);
assert.match(renderer, /count-up/);
assert.match(renderer, /dim-others/);
assert.match(renderer, /collapse-to-outcome/);
assert.match(shotRenderer, /HeroMetric/);
assert.match(shotRenderer, /Contradiction/);
assert.match(shotRenderer, /ExpectedAnchor/);
assert.match(shotRenderer, /ActualCrosses/);
assert.match(shotRenderer, /GapMacro/);
assert.match(shotRenderer, /KineticTypography/);
assert.match(shotRenderer, /ContinuityBadge/);

console.log("PASS: visual template, Shot renderer, and motion preset registry contract");
