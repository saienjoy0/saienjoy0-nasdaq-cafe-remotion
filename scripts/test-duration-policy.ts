import assert from "node:assert/strict";
import {
  evaluateDurationContract,
  SHORTENED_DURATION_MAX_MS,
  STANDARD_DURATION_MAX_MS,
  STANDARD_DURATION_MIN_MS,
} from "./duration-policy";

assert.equal(STANDARD_DURATION_MIN_MS, 180_000);
assert.equal(STANDARD_DURATION_MAX_MS, 420_000);
assert.equal(SHORTENED_DURATION_MAX_MS, 179_999);

for (const measuredDurationMs of [180_000, 300_000, 420_000]) {
  assert.deepEqual(
    evaluateDurationContract({
      command: "final",
      durationMode: "standard",
      measuredDurationMs,
      isFixture: false,
    }),
    [],
  );
}
console.log("PASS: standard episodes accept the 3-7 minute hard range");

const shortStandardPreview = evaluateDurationContract({
  command: "preview",
  durationMode: "standard",
  measuredDurationMs: 179_999,
  isFixture: false,
});
assert.equal(shortStandardPreview.length, 1);
assert.equal(shortStandardPreview[0]?.declaredDurationMode, "standard");
assert.equal(shortStandardPreview[0]?.suggestedDurationMode, "shortened");
assert.throws(
  () =>
    evaluateDurationContract({
      command: "final",
      durationMode: "standard",
      measuredDurationMs: 179_999,
      isFixture: false,
    }),
  /standard episode requires measured Charon audio/,
);
console.log("PASS: sub-3-minute standard episodes warn in preview and fail in final");

const longStandardPreview = evaluateDurationContract({
  command: "preview",
  durationMode: "standard",
  measuredDurationMs: 420_001,
  isFixture: false,
});
assert.equal(longStandardPreview.length, 1);
assert.equal(longStandardPreview[0]?.suggestedDurationMode, "review-required");
assert.throws(
  () =>
    evaluateDurationContract({
      command: "final",
      durationMode: "standard",
      measuredDurationMs: 420_001,
      isFixture: false,
    }),
  /standard episode requires measured Charon audio/,
);
console.log("PASS: over-7-minute standard episodes require review and fail final");

assert.deepEqual(
  evaluateDurationContract({
    command: "final",
    durationMode: "shortened",
    measuredDurationMs: 179_999,
    isFixture: false,
  }),
  [],
);
const longShortenedPreview = evaluateDurationContract({
  command: "preview",
  durationMode: "shortened",
  measuredDurationMs: 180_000,
  isFixture: false,
});
assert.equal(longShortenedPreview.length, 1);
assert.equal(longShortenedPreview[0]?.declaredDurationMode, "shortened");
assert.equal(longShortenedPreview[0]?.suggestedDurationMode, "standard");
assert.throws(
  () =>
    evaluateDurationContract({
      command: "final",
      durationMode: "shortened",
      measuredDurationMs: 180_000,
      isFixture: false,
    }),
  /shortened episode requires measured Charon audio below/,
);
console.log("PASS: shortened cannot bypass the standard duration contract");

assert.deepEqual(
  evaluateDurationContract({
    command: "final",
    durationMode: "standard",
    measuredDurationMs: 1_000,
    isFixture: true,
  }),
  [],
);
console.log("PASS: technical fixtures remain exempt from duration enforcement");
