import assert from "node:assert/strict";
import {
  evaluateDurationContract,
  STANDARD_DURATION_MAX_MS,
  STANDARD_DURATION_MIN_MS,
} from "./duration-policy";

const previewWarning = evaluateDurationContract({
  command: "preview",
  durationMode: "standard",
  measuredDurationMs: 403_200,
  isFixture: false,
});
assert.equal(previewWarning.length, 1);
assert.equal(previewWarning[0]?.code, "duration-contract-warning");
assert.equal(previewWarning[0]?.suggestedDurationMode, "shortened");
assert.equal(previewWarning[0]?.measuredDurationMs, 403_200);
console.log("PASS: preview records a duration warning instead of stopping");

const compileWarning = evaluateDurationContract({
  command: "compile",
  durationMode: "standard",
  measuredDurationMs: 403_200,
  isFixture: false,
});
assert.equal(compileWarning.length, 1);
console.log("PASS: compile records a duration warning instead of stopping");

assert.throws(
  () =>
    evaluateDurationContract({
      command: "final",
      durationMode: "standard",
      measuredDurationMs: 403_200,
      isFixture: false,
    }),
  /standard episode requires measured Charon audio/,
);
console.log("PASS: final still rejects an unresolved duration mismatch");

assert.deepEqual(
  evaluateDurationContract({
    command: "preview",
    durationMode: "standard",
    measuredDurationMs: STANDARD_DURATION_MIN_MS,
    isFixture: false,
  }),
  [],
);
assert.deepEqual(
  evaluateDurationContract({
    command: "preview",
    durationMode: "standard",
    measuredDurationMs: STANDARD_DURATION_MAX_MS,
    isFixture: false,
  }),
  [],
);
console.log("PASS: standard boundary durations remain valid");

assert.deepEqual(
  evaluateDurationContract({
    command: "final",
    durationMode: "shortened",
    measuredDurationMs: 403_200,
    isFixture: false,
  }),
  [],
);
assert.deepEqual(
  evaluateDurationContract({
    command: "final",
    durationMode: "standard",
    measuredDurationMs: 1_000,
    isFixture: true,
  }),
  [],
);
console.log("PASS: shortened episodes and fixtures are unaffected");
