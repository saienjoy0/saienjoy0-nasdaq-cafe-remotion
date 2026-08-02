import assert from "node:assert/strict";
import { resolveReusableEntityCues } from "../src/config/reusable-entity-cues";

const cues = resolveReusableEntityCues({
  narrationText:
    "Microsoftは上昇しました。一方、Waller理事は金利を警戒しました。",
  captions: [
    { text: "Microsoftは上昇しました。", startMs: 1200, endMs: 2800 },
    {
      text: "一方、Waller理事は金利を警戒しました。",
      startMs: 4100,
      endMs: 7000,
    },
  ],
  previousNarrations: [],
  durationMs: 9000,
});
assert.deepEqual(
  cues.map((cue) => [cue.entity.key, cue.startMs]),
  [
    ["ticker:msft", 1200],
    ["person:waller", 4100],
  ],
);

const repeated = resolveReusableEntityCues({
  narrationText: "Microsoftは上昇しました。",
  captions: [{ text: "Microsoftは上昇しました。", startMs: 500, endMs: 2500 }],
  previousNarrations: ["前の場面でMicrosoftを確認しました。"],
  durationMs: 5000,
});
assert.equal(repeated.length, 0);

const metadataOnly = resolveReusableEntityCues({
  narrationText: "半導体株を確認します。",
  captions: [{ text: "半導体株を確認します。", startMs: 0, endMs: 2000 }],
  previousNarrations: [],
  durationMs: 3000,
});
assert.equal(metadataOnly.length, 0);

console.log(
  "PASS: spoken-caption entity mentions are reported for Visual Beat validation only",
);
