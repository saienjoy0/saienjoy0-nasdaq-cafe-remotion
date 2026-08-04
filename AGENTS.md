# AGENTS.md

## 1. リポジトリの目的

このリポジトリは、Remotionで「朝のNASDAQカフェ」の公開用動画を生成する実行環境です。

本番Compositionは`NasdaqCafeSpec`です。日次実行の正本は次のファイルだけです。

```text
render-specs/YYYY-MM-DD/render_spec.json
```

Remotion、Codex、GitHub Actionsは、episode packageや過去資料を読み直して内容を判断しません。PrimaryまたはApproved Fallbackの一方へ解決済みで、正式validatorを通過した`render_spec.json`だけを機械的に描画します。

明示的な依頼がない限り、次の旧経路を使用しません。

- `NasdaqCafeEpisode`
- `NasdaqCafeEpisodeV2`
- `prepare:episode`
- `validate:episode`
- `render:episode`
- `render:sample`
- 旧Markdown入力経路

## 2. 判断の優先順位

競合時は次の順番を優先します。

1. ユーザーの現在の依頼
2. この`AGENTS.md`
3. `docs/07_codex_minimal_execution_contract.md`
4. `docs/08_gemini_tts_runbook.md`
5. `docs/11_visual_beat_implementation.md`
6. `docs/12_visual_template_contract.md`
7. `docs/12_motion_design_reference.md`
8. 現在のスキーマ、validator、テスト、実装コード
9. READMEおよび旧実装資料のうち、上記と競合しない部分

## 3. 作業開始時

リポジトリ直下を作業ルートにします。`cd video/remotion`は実行しません。

- Node.js 20以上
- npm 10以上
- 依存導入は原則`npm ci`

Remotion Studioは次を使用します。

```bash
npx remotion studio src/index.ts --no-open
```

監視上限エラー時だけ次を使用します。

```bash
npx remotion studio src/index.ts --no-open --webpack-poll 1000
```

## 4. render_spec.jsonは不変入力

通常の日次レンダーで、`render_spec.json`を勝手に変更しません。

Codex、GitHub Actions、Remotionは次を推測・補完・要約・短縮・言い換え・並べ替えしてはいけません。

- 見出し、補助文、タイトル、サムネイル文、概要欄
- `speechText`、`captionText`、Chunk境界、順序、`pauseAfterMs`
- Scene順、Scene役割、表情
- Visual Beat、Visual Event、画面状態
- `visualTemplate`、`templateConfig`
- カード、数値、ノード、矢印、`objectIds`の順序
- 出典、確信度、留保、Expected / Actual / Gap
- asset ID、placement、region、fit、focalPoint
- Primary / Approved Fallbackの最終採用経路

不正値、欠落、参照切れ、未解決画像がある場合は、正確なJSON Pathを示して停止します。ユーザーが明示的に編集を依頼した場合だけ変更し、変更後に正式validatorを通します。

## 5. Visual Story Engine v2契約

本番入力スキーマは`2.2.0`です。生成データ識別子は既存実行系との互換性のため`2.1.0-production`を維持します。旧入力`2.1.0`を本番へ戻してはいけません。

### 5.1 テンプレート

- `screenState`：画面の役割
- `visualMode`：旧来の内容分類
- `visualTemplate`：具体的な描画方式
- `templateConfig`：読み順、レーン名、結果ノードなどの検証済み設定

RendererはScene番号、文章、数値、オブジェクト件数からテンプレートを推測しません。登録済みIDだけを`VisualTemplateRenderer`で描画します。

### 5.2 Beat内の表示順

- `visualEvents.show`がある場合、その時刻を優先します。
- 明示イベントがない旧JSONは、`objectIds`順を互換表示順として使います。
- `hide`、`highlight`、`unhighlight`、`set-expression`を指定時刻どおり適用します。
- 因果矢印は接続ノードより後に表示します。
- Expected / Actual / Gapは原則その順に開示します。
- Remotionがナレーションから表示対象や順番を推測してはいけません。

### 5.3 登録済み主要テンプレート

- `opening-contradiction`
- `closing-recap`
- `conclusion-card`
- `expected-actual-bullet`
- `expected-actual-gap-flow`
- `metric-comparison-board`
- `index-return-bars`
- `diverging-stock-bars`
- `causal-lane`
- `tailwind-headwind`
- `evidence-boundary`
- `verification-checklist`
- `verification-matrix`
- `analogy-steps`
- `entity-card-full`
- `news-media`
- `text-focus`

外部リポジトリのコードを実行時に取得しません。参考元の動作原理をローカル実装へ固定し、任意Reactコード、任意CSS、任意ファイルパス、動的importをJSONから指定させません。

## 6. 本番の日次コマンド

```bash
npm run episode:spec:validate -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:compile -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:preview -- render-specs/YYYY-MM-DD/render_spec.json
```

preview生成後はユーザーが見た目を確認します。明示依頼なしにfinalへ進みません。

```bash
npm run episode:spec:final -- render-specs/YYYY-MM-DD/render_spec.json
```

previewとfinalの両方が存在する場合だけ、必要に応じて次を実行します。

```bash
npm run episode:spec:inspect -- render-specs/YYYY-MM-DD/render_spec.json
```

## 7. GitHub Actionsの役割

本番動画生成は`workflow_dispatch`による手動実行です。PR用CIはコード、契約、bundleの読取検査だけを実行し、TTSや動画生成を行いません。

本番Actionsの担当：

```text
checkout
→ npm ci
→ render_spec検証
→ Gemini TTS 2ブロック
→ compile
→ preview / 明示時のみfinal
→ 軽量機械チェック
→ Artifact保存
```

Actionsが行わないこと：

- ニュース取得
- 台本作成・修正
- 市場因果の判断
- テンプレートの自動選択
- 表示順の自動変更
- 画像検索・画像生成
- Primary / Fallbackの再判断
- AIによる代表フレーム検査
- AIによる完成動画視聴
- 自動commit / push

## 8. コード変更時の検証

最初に変更箇所に近いテストを実行し、完了前に原則として次を通します。

```bash
npm run typecheck
npm run lint
npm run test:spec
npm run test:public-screen
npm run build
```

Visual Story変更時は次も必須です。

```bash
npm run test:visual-sequence
npm run test:visual-variety
npm run test:visual-templates
npm run test:visual-story
```

validatorやテストを弱めて不正入力を通しません。契約変更では、Zod、JSON Schema、validator、fixture、テスト、文書を同時に更新します。

## 9. 本番境界

- 本編は`scene-01`から`scene-09`の9Scene
- Scene 1とScene 9の固定役割を維持
- 本番レンダーは`NasdaqCafeSpec`だけ
- `ProductionScene -> getSceneRenderState() -> toPublicSceneViewModel() -> PublicSceneViewModel -> VisualTemplateRenderer`の境界を維持
- Scene番号、Beat ID、表情名、screenState、template ID、sequence policy、検証結果を公開画面へ出さない
- `assetPlacements`だけをアセット配置の正本にする
- 各Sceneに常時表示の`mainBackground`を1件だけ置く
- 同じChunkでmain-media、chart、illustrationをmain-stageへ重複配置しない
- 存在しない画像、音声、空ファイル、架空パスを作らない
- RemotionからTTS API、ニュースAPI、株価API、Web取得を行わない
- 検証済みproduction dataとローカル素材だけで描画する

## 10. 画面多様性契約

通常回では次を機械確認します。

- distinct template family：4種類以上
- 前半Scene 1〜4：3種類以上
- 後半Scene 5〜9：3種類以上
- 同じtemplate familyの連続：最大2 Beat
- Scene 1に`opening-contradiction`
- Scene 8にverification系テンプレート
- Scene 9に`closing-recap`
- Scene 1とScene 9を同じ構成にしない

例外が必要な短縮回や理由不明回でも、Rendererが勝手にテンプレートを変更してはいけません。制作側で理由と指定を確定します。

## 11. 画像・アセット運用

- 固定背景、狐、64社カード、登録済みアセットを無断置換・再生成しない
- 外部画像不足を別人画像や架空画像で埋めない
- 権利確認が必要な素材は`user-review-required`
- 有料画像生成APIをコード、Codex、Actions、制作サーバーから呼ばない
- 当日固有画像はChatGPT側またはユーザー側で準備
- 画像生成前にPrimaryとApproved Fallbackを確定
- Actionsへ渡す時点で採用経路を一つだけ残す
- Actionsは`selected_path`を判断し直さない
- 不足・寸法・SHA・ID不一致時は停止

## 12. TTS契約

本番音声：

- Provider / model：`gemini-3.1-flash-tts-preview`
- Voice：`Charon`
- 生成単位：Scene 1〜4、Scene 5〜9の2ブロック

禁止：

- 一文、Chunk、字幕、Visual Beat、SceneごとのAPI呼び出し
- VOICEVOX、別モデル、別音声への自動Fallback
- 尺合わせ目的の原稿変更、速度変更、無音水増し
- APIキーのチャット、コード、JSON、ログ、コミット出力

Visual Storyの変更をTTS identityへ含めません。`speechText`、pronunciation、voice profileが同じならキャッシュを再利用します。

## 13. Git管理

次をコミットしません。

- `.env`、`.env.local`
- `.cache/`
- `node_modules/`
- `dist/`
- `build/`生成物
- `public/generated/`
- `public/spec-audio/`生成音声
- `out/`
- MP4、確認用PNG

生成物はArtifactへ保存し、自動commitしません。依存関係やRemotionを明示依頼なしに更新せず、関連しないファイルを整形・改名・移動しません。

## 14. 完了報告

最低限次を報告します。

- 変更ファイル
- 実行したコマンド
- 成功・失敗した検証
- GitHub Actions run ID
- preview / final / technical report / Artifact名称
- 未解決JSON Path、欠落アセット、`user-review-required`
- ユーザーが目視確認すべき箇所

AIが完成動画を視聴承認した、見た目が完全である、とは報告しません。最終的な見た目はユーザーが確認します。
