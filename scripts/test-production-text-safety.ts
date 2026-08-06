import assert from "node:assert/strict";
import {assertProductionTextSafe} from "../src/spec/validate-render-spec";

assert.doesNotThrow(() => assertProductionTextSafe({
  scenes: [{visualBeats: [{sequencePolicy: "object-order-fallback"}]}],
}));

assert.throws(
  () => assertProductionTextSafe({headline: "fallbackを表示"}),
  /\$\.headline: production forbidden text: fallback/u,
);
assert.throws(
  () => assertProductionTextSafe({caption: {text: "画面構成：デバッグ"}}),
  /\$\.caption\.text: production forbidden text: 画面構成：/u,
);
assert.throws(
  () => assertProductionTextSafe({cards: [{lines: [{value: "debug metadata"}]}]}),
  /\$\.cards\[0\]\.lines\[0\]\.value: production forbidden text: debug metadata/u,
);

console.log("PASS: machine-only sequencePolicy is exempt while every viewer-facing string remains protected");
