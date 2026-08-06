# Visual Grammar Renderer Compatibility Contract

## 1. 目的

この契約は、Plot側で明示的に確定したSemantic Grammarと、Rendererが受け取る`visualTemplate`の互換性を固定する。

RendererはScene番号、ナレーション本文、数値の正負、項目数、銘柄名からGrammarまたはTemplateを推測しない。入力されたGrammarとTemplateが登録済みの組み合わせでなければ停止する。

このPhaseでは市場因果、ナレーション、字幕、Scene順、数字、出典、Primary / Fallback採用経路を変更しない。

## 2. 正本

Renderer側の正本は次の二つである。

```text
contracts/visual_grammar_renderer_compatibility.schema.json
contracts/visual_grammar_renderer_compatibility.json
```

TypeScript実行契約は次に固定する。

```text
src/spec/visual-grammar-renderer-contract.ts
```

JSONとTypeScript registryはCIで完全一致を検査する。

## 3. 契約Version

```text
Renderer compatibility: 1.0.0
Semantic Grammar:       1.0.0
Render Spec target:     2.4.0
```

`2.4.0`は後続PRで`render_spec`へ接続する目標Versionである。このPRだけでは既存`2.2.0` / `2.3.0`の日次入力を変更しない。

## 4. 互換性情報

全Visual Templateは次を一件ずつ持つ。

- `allowedGrammarIds`
- `appearanceClass`
- `dominantSurface`
- `stageShell`
- `nonAnalysis`
- `status`

現在登録済みの26 Visual Templateをすべて一度だけ登録する。未登録Templateは`VG_TEMPLATE_NOT_REGISTERED`で停止する。

GrammarとTemplateの不一致は`VG_GRAMMAR_TEMPLATE_MISMATCH`で停止する。Genericカードや別Templateへの暗黙Fallbackは行わない。

## 5. Appearance Class

```text
open-hero
entity-canvas
document-media
metric-board
progressive-chart
causal-path
dual-lane
timeline-track
split-comparison
matrix-grid
verification-gates
picturebook-canvas
assembly-map
text-bridge
```

Appearance Classは物理的な見え方の分類であり、市場因果やTemplate選択を決める入力ではない。

## 6. Dominant Surface

```text
open-canvas
entity
media
card-board
plot
network
split
matrix
picturebook
assembly
text
```

後続のmeasured diversity検査では、同一Surfaceの連続時間と総占有率を計測する。

## 7. Stage Shell

```text
OpenHeroStage
EntityStage
DocumentMediaStage
MetricBoardStage
ProgressiveChartStage
CausalPathStage
DualLaneStage
TimelineStage
SplitComparisonStage
MatrixStage
VerificationGateStage
PictureBookStage
AssemblyStage
TextBridgeStage
```

このPRはStage ShellのIDと互換性だけを固定する。Reactによる物理Stage実装はVG-3で行う。

## 8. 非分析画面

次のTemplateを`nonAnalysis: true`として登録する。

- `entity-card-full`
- `source-receipt`
- `news-media`
- `analogy-steps`
- `text-focus`

これは多様性検査用の内部属性であり、公開テロップやナレーションへ表示しない。

## 9. 禁止事項

- GrammarからTemplateを自動選択する
- Templateから市場因果を逆算する
- Scene番号だけでAppearance Classを決める
- 不一致をGenericカードで描画する
- 未登録Templateを動的importする
- Visual Grammar導入をTTS identityへ含める
- PR CIでTTSまたは動画を生成する
- Preview確認前にfinalへ進む

## 10. CI

```bash
npm run typecheck
npx tsx scripts/test-visual-grammar-renderer-contract.ts
```

CIは次を確認する。

- JSONとTypeScript registryの完全一致
- 現行26 Templateの完全被覆
- 重複Template禁止
- Grammar / Appearance / Surface / Stage IDの登録確認
- 正しいGrammar / Template組み合わせ
- 不一致と未登録Templateの明示停止
- non-analysis分類
- APIがGrammarとTemplateの明示入力を要求すること

## 11. 後続Phase

1. render_spec `2.4.0`へVisual Grammar root SHAとBeat metadataを追加
2. Plot側へrenderer compatibilityをbyte-identical mirror
3. Stage Shellを物理実装
4. pre-TTS structural diversityを追加
5. post-TTS measured diversityを追加
6. 同一台本・同一TTSによるA/B Preview
7. 実日受入

finalはユーザーがPreviewを目視確認し、明示的に依頼した場合だけ実行する。
