import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile, stat} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const modes = ["conclusion-card", "number-comparison", "expected-actual-gap", "timeline", "chart", "causal-diagram", "stock-comparison", "news-media", "verification-points", "text-focus"];
const root = path.join(PROJECT_DIR, "renders", "tests", "expression-final-verification");
const directory = path.join(root, "visual-modes");
const hashes = new Set<string>();
for (const mode of modes) {
  const file = path.join(directory, `${mode}.png`);
  assert((await stat(file)).size > 0, `${mode} still is empty`);
  const bytes = await readFile(file);
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", `${mode} is not PNG`);
  hashes.add(createHash("sha256").update(bytes).digest("hex"));
  console.log(`PASS: golden still ${mode} exists and is PNG`);
}
assert.equal(hashes.size, modes.length);
console.log("PASS: all visualMode golden stills are visually distinct by SHA-256");

const expressions = ["normal", "analysis", "smirk", "slight-surprise", "confused", "alert", "sleepy"];
const expressionHashes = new Set<string>();
for (const expression of expressions) {
  const file = path.join(root, "expressions", `${expression}.png`);
  assert((await stat(file)).size > 0, `${expression} expression still is empty`);
  const bytes = await readFile(file);
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", `${expression} expression still is not PNG`);
  expressionHashes.add(createHash("sha256").update(bytes).digest("hex"));
  console.log(`PASS: expression still ${expression} exists and is PNG`);
}
assert.equal(expressionHashes.size, expressions.length);
console.log("PASS: all seven expression stills are visually distinct by SHA-256");
