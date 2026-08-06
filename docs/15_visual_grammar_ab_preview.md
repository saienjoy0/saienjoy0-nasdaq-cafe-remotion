# 朝のNASDAQカフェ｜Visual Grammar A/B Preview契約

## 1. 目的

VG-6は、旧共通Surface相当の表示と新Visual Grammar Stage Shell表示を、内容差のない二本のPreviewとして生成する。

比較で変更してよいものはStage Shellだけである。次は完全に同一でなければならない。

- `render_spec.json`
- ナレーション
- 字幕
- Scene順
- 数字
- 使用情報源
- Primary / Approved Fallbackの最終採用経路
- Voice Profile
- 発音辞書
- Gemini TTS 2ブロック音声
- Renderer commit
- production data

旧版と新版で異なるのは、同一Renderer commitへ渡す内部Stage modeだけである。

```text
baseline  = legacy
candidate = candidate
```

`legacy`はVisual Grammar metadataを無視して別Templateを選ぶ機能ではない。選択済みVisual Templateの内容コンポーネントを、Stage Shellで包まずに表示する比較専用モードである。

## 2. なぜ旧commitと比較しないか

Visual Grammarの実装過程ではCompatibility Registry SHA、Template登録、validatorが更新される。旧commitへ現在の`render_spec 2.4.0`を渡すと、Registry SHA不一致で正しく停止する。

そのためVG-6では、旧commitと新commitを比較しない。同じcommit、同じ依存関係、同じcontract registryを使用し、Stage Shellの有無だけを切り替える。

これにより、コード世代差、依存差、validator差、TTS cache key差を画面差へ混入させない。

## 3. 安全境界

A/B Previewは次の条件でだけ動く。

```text
workflow_dispatch
repository owner
renderer ref = main
confirmation = AB_PREVIEW
render_spec schemaVersion = 2.4.0
SPEC_TTS_CACHE_ONLY = 1
VISUAL_GRAMMAR_AB_PREVIEW = 1
```

通常Previewとfinalは常に`candidate` modeを使用する。`legacy` modeは専用A/B renderer内だけで許可する。

A/B経路は次を行わない。

- 市場因果の再判断
- Scene番号や本文からのTemplate推測
- ナレーション、字幕、数字、出典の変更
- Primary / Fallbackの選び直し
- 画像生成
- Gemini APIによる音声生成・再生成
- TTS cacheの新規保存
- AIによる完成動画採点
- finalレンダー
- final権限の付与

A/B workflowへGemini APIキーを渡さない。全レポートと最終manifestは`finalAuthorized: false`を固定する。

## 4. 音声は完全cache-only

音声は標準Previewがすでに生成・検証した2ブロックだけを使用する。

```text
標準Preview
→ exact TTS input SHAの2ブロック音声を生成・検証
→ Actions cacheまたは承認済みexport Artifactへ保存

A/B Preview
→ exact render_spec
→ TTS input SHA
→ Actions cache restore
→ 必要時は承認済みexport Artifactをrestore
→ 2つのaudio.wavを検証
→ shared_tts_cache.tar.gz
→ baseline / candidateの両方へ同じtarを展開
```

A/B経路は音声を生成しない。exact cacheが見つからない場合は停止し、先に標準Previewを実行するよう明示する。

準備jobと二本のrender jobはすべて`SPEC_TTS_CACHE_ONLY=1`で動く。各render jobが個別に音声を作ることはない。

A/B manifest生成時に、二つの`audio.wav`の相対パス、SHA-256、byte数から音声identityを作る。baselineとcandidateが一致しなければ比較Artifactを作らない。

## 5. Stage mode

### candidate

Visual TemplateとVariantからCompatibility Registryに従ってStage Shellを解決する。

```text
VisualTemplate
→ Appearance Class
→ Stage Shell
→ content component
```

### legacy

同じVisual Template content componentをStage Shellで包まずに返す。

```text
VisualTemplate
→ content component
```

GrammarからTemplateを選び直さない。Scene番号、文章、数値の正負、項目数を使用しない。

## 6. Workflow

常設workflow：

```text
.github/workflows/visual-grammar-ab-preview.yml
```

処理順：

```text
immutable input preflight
→ mainのrenderer commit固定
→ render_spec 2.4.0検査
→ TTS input SHA固定
→ 承認済み2ブロック音声cacheを復元
→ legacy / candidateを並列レンダー
→ 両MP4をfull decode検査
→ spec・音声・台本・production data等のidentity比較
→ visual_grammar_ab_manifest.json
→ ユーザー目視用Artifact
```

出力Artifact：

```text
visual-grammar-ab-review-YYYY-MM-DD-RUN_ID/
  baseline/
    preview.mp4
    technical_report.json
    render_data.production.json
    preview_inspection.json
    render_identity.json
  candidate/
    preview.mp4
    technical_report.json
    render_data.production.json
    preview_inspection.json
    render_identity.json
  visual_grammar_ab_manifest.json
  visual_grammar_ab_manifest.schema.json
```

## 7. Manifest invariants

次が一つでも異なる場合、比較Artifactを作らない。

- spec SHA
- TTS input SHA
- TTS audio SHA
- narration SHA
- caption SHA
- Scene order SHA
- numbers SHA
- sources SHA
- selected path SHA
- voice profile / pronunciation SHA
- Renderer commit SHA
- production data SHA

比較可能な差は次だけである。

```text
baseline.stageMode = legacy
candidate.stageMode = candidate
preview SHA
technical report SHA
inspection SHA
```

## 8. ユーザー目視項目

自動AI視覚評価は行わない。ユーザーは二本を見比べて次を確認する。

1. Sceneが進むごとに画面の物理構造が変わっているか
2. 冒頭の矛盾が旧版より早く理解できるか
3. Expected / Actual / Gapの表示順が自然か
4. 世界からNASDAQへの因果経路を追いやすいか
5. Scene 7がランキングではなく理由の比較になっているか
6. Scene 8まで見る理由と強まる／弱まる条件が残っているか
7. 狐が案内役として見やすく、市場説明を妨げていないか

目視確認前にfinalへ進まない。

## 9. 実行前提

A/B Previewへ渡せるのは、次を満たす入力だけである。

- 正式な`render_spec 2.4.0`
- Visual Grammar root contractあり
- 全Visual Beatに`visualGrammarId`と`transitionRole`
- `return`には`returnTargetBeatId`
- 正式validator通過
- 未解決状態0
- Primary / Fallback採用経路確定
- Post-TTS measured diversity PASS
- exact TTS input SHAの承認済み2ブロック音声cacheあり

実日入力がまだない場合は、正本ルールに従って完成した技術fixtureを使用する。日付、数字、因果、音声をA/B実行のために創作しない。
