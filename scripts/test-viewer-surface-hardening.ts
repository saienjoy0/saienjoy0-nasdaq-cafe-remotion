import assert from "node:assert/strict";
import test from "node:test";
import {localizeStageViewerLabel} from "../src/components/spec/StageSafeArea";
import {planSourceReceiptLayout} from "../src/spec/template-layout/source-receipt-layout";
import {visualCapabilityHintsSchema} from "../src/spec/visual-director-contract";
import {candidateTemplatesForPolicy} from "../src/spec/visual-template-policy";
import {assertViewerTextSafe} from "../src/spec/viewer-surface-policy";

test("viewer numeric kanji is rejected while ordinary Japanese words remain valid", () => {
  assert.throws(
    () => assertViewerTextSafe("NASDAQは〇・六パーセント下落", "caption"),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
  assert.throws(
    () => assertViewerTextSafe("十五時五十九分", "caption"),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
  assert.doesNotThrow(() => assertViewerTextSafe("一方で四半期売上は増加", "caption"));
  assert.doesNotThrow(() => assertViewerTextSafe("三菱を確認", "caption"));
});

test("viewer-facing Expected Actual Gap labels use the single Japanese vocabulary", () => {
  assert.equal(localizeStageViewerLabel("EXPECTED"), "予想");
  assert.equal(localizeStageViewerLabel("ACTUAL"), "実際");
  assert.equal(localizeStageViewerLabel("GAP"), "差分");
  assert.equal(localizeStageViewerLabel("実績"), "実際");
  assert.equal(localizeStageViewerLabel("差"), "差分");
});

test("source receipt planner switches to stacked Japanese layout and fails closed", () => {
  assert.equal(planSourceReceiptLayout({
    primaryElement: "Reutersの確認",
    screenQuestion: "何が起きたか",
    evidence: ["条件履行が必要", "Brent上昇"],
  }).mode, "side-by-side");

  assert.equal(planSourceReceiptLayout({
    primaryElement: "Reutersが報じたホルムズ海峡再開条件と市場の確認材料",
    screenQuestion: "市場が置いていた安心材料はなぜ実現しなかったのか",
    evidence: ["再開には米国側の条件履行が必要", "条件が満たされるまで閉鎖継続"],
  }).mode, "stacked");

  assert.throws(() => planSourceReceiptLayout({
    primaryElement: "非常に長い".repeat(30),
    screenQuestion: "質問",
    evidence: ["証拠"],
  }), /E_SOURCE_RECEIPT_TEXT_OVERFLOW/);
});

test("Visual Director v1.1 requires templatePolicy", () => {
  assert.throws(() => visualCapabilityHintsSchema.parse({
    contractVersion: "1.1.0",
    episodeDate: "2026-08-12",
    beats: [{visualBeatId: "scene-02-beat-002", capabilities: ["comparison-set"]}],
  }), /E_VISUAL_DIRECTOR_TEMPLATE_POLICY_MISSING/);
});

test("authored-only policy prevents comparison bars from becoming candidates", () => {
  assert.deepEqual(
    candidateTemplatesForPolicy(
      "split-comparison",
      ["index-return-bars", "diverging-stock-bars", "split-comparison", "focus-matrix"],
      {mode: "authored-only"},
    ),
    ["split-comparison"],
  );
  assert.deepEqual(
    candidateTemplatesForPolicy(
      "split-comparison",
      ["index-return-bars", "diverging-stock-bars", "split-comparison", "focus-matrix"],
      {mode: "allow-list", allowedTemplateIds: ["split-comparison", "diverging-stock-bars"]},
    ),
    ["diverging-stock-bars", "split-comparison"],
  );
});
