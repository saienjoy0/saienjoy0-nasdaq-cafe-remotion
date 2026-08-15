import assert from "node:assert/strict";
import test from "node:test";
import fixtureJson from "../render-specs/fixtures/complete-9scene/render_spec.json";
import {localizeStageViewerLabel} from "../src/components/spec/StageSafeArea";
import {renderSpecSchema} from "../src/spec/render-spec";
import {preflightStaticViewerLayout} from "../src/spec/preflight-static-viewer-layout";
import {preflightViewerSurface} from "../src/spec/preflight-viewer-surface";
import {planSourceReceiptLayout} from "../src/spec/template-layout/source-receipt-layout";
import {visualCapabilityHintsSchema} from "../src/spec/visual-director-contract";
import {candidateTemplatesForPolicy} from "../src/spec/visual-template-policy";
import {assertViewerSurfacePolicy, assertViewerTextSafe} from "../src/spec/viewer-surface-policy";

test("viewer numeric kanji is rejected while ordinary Japanese words remain valid", () => {
  assert.throws(
    () => assertViewerTextSafe("NASDAQは〇・六パーセント下落", "caption"),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
  assert.throws(
    () => assertViewerTextSafe("十五時五十九分", "caption"),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
  assert.throws(
    () => assertViewerTextSafe("資金動員は五千億ドル規模", "caption"),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
  assert.doesNotThrow(() => assertViewerTextSafe("一方で四半期売上は増加", "caption"));
  assert.doesNotThrow(() => assertViewerTextSafe("三菱を確認", "caption"));
});

test("Arabic coefficients may keep Japanese financial magnitude units", () => {
  assert.doesNotThrow(() => assertViewerTextSafe("資金動員は5,000億ドル規模", "caption"));
  assert.doesNotThrow(() => assertViewerTextSafe("売上25.8億ドル、backlog1,040億ドル", "caption"));
  assert.doesNotThrow(() => assertViewerTextSafe("市場規模は1万ドル", "caption"));
});

test("viewer-facing Expected Actual Gap labels use the single Japanese vocabulary", () => {
  assert.equal(localizeStageViewerLabel("EXPECTED"), "予想");
  assert.equal(localizeStageViewerLabel("ACTUAL"), "実際");
  assert.equal(localizeStageViewerLabel("GAP"), "差分");
  assert.equal(localizeStageViewerLabel("実績"), "実際");
  assert.equal(localizeStageViewerLabel("差"), "差分");
});

test("static viewer layout rejects a long visible card value before Chrome starts", () => {
  const value = renderSpecSchema.parse(structuredClone(fixtureJson));
  const scene = value.scenes[0];
  const visibleIds = new Set(scene.visualBeats.flatMap((beat) => beat.objectIds));
  const visibleCard = scene.cards.find((card) => visibleIds.has(card.cardId));
  assert.ok(visibleCard, "fixture must expose a viewer-visible card");
  visibleCard.lines[0].value = "NASDAQ -0.60% / Brent +1.4% / $88.91";
  assert.throws(
    () => preflightStaticViewerLayout(value),
    /36 characters exceed card value limit 28/,
  );
  visibleCard.lines[0].value = "NASDAQ -0.60%\nBrent +1.4% \/ $88.91";
  assert.doesNotThrow(() => preflightStaticViewerLayout(value));
});

test("static viewer layout ignores unreachable producer inventory but not visible objects", () => {
  const value = renderSpecSchema.parse(structuredClone(fixtureJson));
  const scene = value.scenes.find((item) => item.cards.length > 0)!;
  const existing = structuredClone(scene.cards[0]);
  existing.cardId = `${scene.sceneId}-unreachable-long-card`;
  existing.title = "UNREACHABLE PRODUCER INVENTORY TITLE THAT MUST NOT BE MEASURED";
  scene.cards.push(existing);
  assert.doesNotThrow(() => preflightStaticViewerLayout(value));

  scene.visualBeats[0].objectIds.push(existing.cardId);
  assert.throws(
    () => preflightStaticViewerLayout(value),
    /card title limit 18/,
  );
});

test("receipt-only cards use the specialized stacked budget while shared cards keep generic limits", () => {
  const value = renderSpecSchema.parse(structuredClone(fixtureJson));
  const scene = value.scenes[0];
  const receiptBeat = scene.visualBeats[0];
  const otherBeat = scene.visualBeats[2];
  const card = scene.cards[0];

  for (const beat of scene.visualBeats) {
    beat.objectIds = beat.objectIds.filter((id) => id !== card.cardId);
  }
  receiptBeat.objectIds = [card.cardId];
  receiptBeat.visualTemplate = "source-receipt";
  receiptBeat.visualMode = "text-focus";
  receiptBeat.screenState = "Data";
  receiptBeat.primaryElement = "Nvidia AI infrastructure financing";
  receiptBeat.screenQuestion = "AI投資は止まった？";
  receiptBeat.viewerTexts = ["第3者資本 5000億ドル超を目指す", "実行済み投資額ではない"];
  card.title = "Nvidia AI infrastructure financing";
  card.lines = [
    {label: "確認", value: "第3者資本 5000億ドル超を目指す", tone: "neutral"},
    {label: "境界", value: "実行済み投資額ではない", tone: "neutral"},
  ];

  assert.equal(
    planSourceReceiptLayout({
      primaryElement: receiptBeat.primaryElement,
      screenQuestion: receiptBeat.screenQuestion,
      evidence: receiptBeat.viewerTexts,
    }).mode,
    "stacked",
  );
  assert.doesNotThrow(() => preflightStaticViewerLayout(value));
  assert.doesNotThrow(() => preflightViewerSurface(value));

  otherBeat.objectIds.push(card.cardId);
  assert.throws(
    () => preflightStaticViewerLayout(value),
    /card title limit 18/,
    "a card reused outside source-receipt must remain under generic card-board limits",
  );
});

test("viewer surface policy ignores unreachable cards but rejects them once selected", () => {
  const value = renderSpecSchema.parse(structuredClone(fixtureJson));
  const scene = value.scenes.find((item) => item.cards.length > 0)!;
  const existing = structuredClone(scene.cards[0]);
  existing.cardId = `${scene.sceneId}-unreachable-unsafe-card`;
  existing.lines[0].value = "資金動員は五千億ドル規模";
  scene.cards.push(existing);

  assert.doesNotThrow(() => assertViewerSurfacePolicy(value));
  scene.visualBeats[0].objectIds.push(existing.cardId);
  assert.throws(
    () => assertViewerSurfacePolicy(value),
    /E_VIEWER_NUMERIC_KANJI_REMAINS/,
  );
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
