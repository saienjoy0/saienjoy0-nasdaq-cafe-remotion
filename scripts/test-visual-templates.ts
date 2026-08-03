import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";

const project = process.cwd();
const renderer = await readFile(path.join(project, "src/components/spec/VisualTemplateRenderer.tsx"), "utf8");
const viewModel = await readFile(path.join(project, "src/spec/public-view-model.ts"), "utf8");
const composition = await readFile(path.join(project, "src/compositions/NasdaqCafeSpecEpisode.tsx"), "utf8");
const schema = await readFile(path.join(project, "src/spec/render-spec.ts"), "utf8");

for (const template of [
  "opening-contradiction",
  "closing-recap",
  "conclusion-card",
  "expected-actual-bullet",
  "expected-actual-gap-flow",
  "metric-comparison-board",
  "index-return-bars",
  "diverging-stock-bars",
  "causal-lane",
  "tailwind-headwind",
  "evidence-boundary",
  "verification-checklist",
  "verification-matrix",
  "analogy-steps",
  "entity-card-full",
  "news-media",
  "text-focus",
]) {
  assert.match(schema, new RegExp(`\\"${template}\\"`), `schema is missing ${template}`);
  assert.match(renderer, new RegExp(`\\"${template}\\"`), `renderer is missing ${template}`);
}

for (const forbidden of [
  "componentPath",
  "eval(",
  "new Function",
  "Math.random",
  "import(/* webpackIgnore",
  "raw.githubusercontent.com",
]) {
  assert.equal(renderer.includes(forbidden), false, `renderer contains forbidden dynamic behavior: ${forbidden}`);
}

assert.match(viewModel, /visualTemplate:/);
assert.match(viewModel, /templateConfig:/);
assert.match(viewModel, /sequencePolicy:/);
assert.match(viewModel, /object-order-fallback/);
assert.match(viewModel, /explicit/);
assert.match(composition, /VisualTemplateRenderer/);
assert.doesNotMatch(composition, /<SpecVisualMode content=/);
assert.match(renderer, /ExpectedActualFlow/);
assert.match(renderer, /CausalLane/);
assert.match(renderer, /TailwindHeadwind/);
assert.match(renderer, /DivergingBars/);
assert.match(renderer, /VerificationMatrix/);
assert.match(renderer, /FinalAssembly/);

console.log("PASS: visual template registry and safe renderer contract");
