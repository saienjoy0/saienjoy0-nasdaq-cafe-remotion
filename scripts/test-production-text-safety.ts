import assert from "node:assert/strict";
import {toProductionTextSafetyView} from "../src/spec/compile-render-spec";
import {assertProductionTextSafe} from "../src/spec/validate-render-spec";

assert.doesNotThrow(() => assertProductionTextSafe({
  scenes: [{visualBeats: [{sequencePolicy: "object-order-fallback"}]}],
}));

assert.doesNotThrow(() => assertProductionTextSafe(toProductionTextSafetyView({
  assets: {
    "daily-microchip-q1-fy27-ir-fallback":
      "generated/preflight-assets/daily-microchip-q1-fy27-ir-fallback.png",
  },
  scenes: [{
    assetPlacements: [{
      placementId: "placement-fallback-machine-id",
      assetId: "daily-microchip-q1-fy27-ir-fallback",
    }],
    headline: "Microchip Q1 FY27 公式IR",
  }],
})));

assert.throws(
  () => assertProductionTextSafe(toProductionTextSafetyView({headline: "fallbackを表示"})),
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

console.log("PASS: machine-only IDs/assets are exempt while every viewer-facing string remains protected");
