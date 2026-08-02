# 朝のNASDAQカフェ Remotion動画生成基盤

## 本番Spec 2.1パイプライン

本番Compositionは`NasdaqCafeSpec`です。固定の早朝カフェ背景・狐領域・メイン領域・大テロップ領域・字幕領域を維持し、同じScene内を`visualBeats`で切り替えます。

- 各Visual BeatはナレーションChunkの開始・終了へ結び付く
- 画面状態は`Data`、`Chart`、`EntityFocus`、`MainWithEntity`、`PictureBook`、`News`のいずれか一つ
- `EntityFocus`、`PictureBook`、`News`ではメイン領域を専有し、既存図へ重ねない
- `MainWithEntity`は検証済みの主図領域とEntity領域だけを使う
- 一時表示後は`returnScreenState`で指定した次Beatへ戻る
- `missing`、`invalid`のBeatは本番コンパイル前に拒否する。`user-review-required`はZIP・MP4を止めず、公開前のユーザー確認へ回す
- 公開コンポーネントは`PublicSceneViewModel`だけを受け取り、Scene番号、Beat ID、表情名、画面モード名、検証結果を受け取らない
- 本番音声はGemini `gemini-3.1-flash-tts-preview`＋`Charon`のみ

`NasdaqCafeEpisodeV2`は旧入力の確認用です。本番表示判断やカード表示には使用しません。

既存の5Scene・45秒Compositionは互換確認用として維持しています。本番Spec経路は、承認済みの正式JSONとCharon実音声から9Sceneの実測Timelineを作ります。既存の市場情報収集・`source_pack`・handoff生成処理は読み書きせず、変更もしません。

## 9Scene V2パイプライン（旧互換）

制作パッケージを正式JSONへ変換します。

```powershell
npm run prepare:episode -- episodes/2026-07-10/episode_package_2026-07-10.md
npm run validate:episode -- build/2026-07-10/episode_data.json
npm run render:stills -- build/2026-07-10/episode_data.json
```

出力：

```text
build/2026-07-10/episode_data.json
build/2026-07-10/conversion-report.json
renders/stills/2026-07-10/v2/01-scene.png ... 09-scene.png
renders/stills/2026-07-10/v2/mode-checks/01-mode-01.png ...
```

- Composition ID：`NasdaqCafeEpisodeV2`
- 1920×1080 / 30fps
- Scene 1〜9をJSON順に表示
- Scene尺は制作パッケージの目安秒数×30による仮尺
- Scene間は`config/timeline.config.json`の9フレームトランジション
- `calculateMetadata()`が正式JSONのTimelineから全体尺を設定
- 複合画面モードはScene内の仮尺を均等分割して実際に切り替え
- `mode-checks/`へ複合モードの各状態を別々に出力
- Scene 8は3枚の検証カードで「強まる条件／弱まる条件」を表示
- 音声、字幕、BGM、TTSは未実装
- 外部映像や分足チャートがない場合は、確認済みテキスト・数字・汎用図解へフォールバック

正式JSONは`schemaVersion: "1.0.0"`で、`source`、`episode`、`assets`、`scenes`、`timeline`を必須とします。元MarkdownのSHA-256が変わった場合、検証とレンダリングは停止します。

## 全体フロー

```text
既存のCodex情報取得（このプロジェクトの対象外）
  → ChatGPTが番組内容を構成（対象外）
  → ChatGPTがepisode_data.jsonを出力
  → 本プロジェクトがJSONを読込・Zod検証
  → Remotion Compositionへinput propsとして渡す
  → 1920×1080 / 30fps / 45秒のMP4を生成
```

JSONを`src`へコピーする必要はありません。レンダリングスクリプトが指定パスから実行時に読み込みます。

## 動画仕様

- Composition ID: `NasdaqCafeEpisode`
- 解像度: 1920×1080（16:9）
- フレームレート: 30fps
- 長さ: 1350フレーム（45.0秒）
- 出力: H.264 / 4:2:0互換ピクセル形式 / MP4
- フォント: npm同梱のNoto Sans JP Variable（OSフォント非依存）
- 音声・字幕: Phase 1では未使用。将来用パスだけスキーマに保持
- 外部ニュース・株価API: 呼び出しません

## 必要環境

- Node.js 20以上（実装・検証環境: Node.js 22.22.2）
- npm 10以上（実装・検証環境: npm 10.9.7）
- 初回レンダリング時にRemotion用Chrome Headless Shellを取得できるネットワーク

## セットアップ

リポジトリルートから:

```powershell
cd video/remotion
npm install
```

依存バージョンは`package-lock.json`で固定しています。Remotion関連パッケージはすべて`4.0.487`です。

## プレビュー

```powershell
npm run dev
```

Remotion Studioで`NasdaqCafeEpisode`を選びます。Studioの既定propsには`samples/episode_data.sample.json`の検証済みデータが入ります。

## サンプルJSONを検証・レンダリング

入力だけを検証:

```powershell
npm run validate:sample
```

MP4を生成:

```powershell
npm run render:sample
```

主要5シーンの静止画を生成:

```powershell
npm run render:stills
```

## 任意のChatGPT出力JSONを指定する

絶対パスまたは現在の`video/remotion`ディレクトリからの相対パスを指定します。

```powershell
npm run validate:episode -- C:\absolute\path\episode_data.json
npm run render:episode -- C:\absolute\path\episode_data.json
```

相対パス例:

```powershell
npm run render:episode -- samples/episode_data.sample.json
```

任意JSONから静止画も出す場合:

```powershell
npx tsx scripts/render-stills.ts C:\absolute\path\episode_data.json
```

出力MP4名は`renders/<episode.id>_nasdaq-cafe.mp4`です。ファイル名に使用できない文字は`-`へ置換されます。

## episode_data.jsonの項目

| 項目 | 必須 | 用途・制約 |
|---|---:|---|
| `schemaVersion` | 必須 | Phase 1は`"1.0"`のみ |
| `episode.id` | 必須 | 出力ファイル名に使用、48文字以内 |
| `episode.date` | 必須 | 画面上の日付、24文字以内 |
| `episode.title` | 必須 | エピソード題、48文字以内 |
| `episode.programType` | 任意 | 将来の番組分類用 |
| `host` | 任意 | 名前・mood。欠損時は狐アナリストの既定値 |
| `conclusion.screenText` | 任意ブロック内で必須 | Scene 1の大見出し、28文字以内 |
| `conclusion.narration` | 任意 | 画面表示とは分離。Phase 1では再生しない |
| `mainNews.headline` | 任意ブロック内で必須 | Scene 1・2の主役ニュース、48文字以内 |
| `mainNews.summary` | 任意 | Scene 2の短い補足、100文字以内 |
| `mainNews.points` | 任意 | 因果ポイント、各36文字・最大3件 |
| `marketReaction.items` | 任意 | 指数・金利等、最大4件。画面では重要な最大3件を表示 |
| `marketReaction.items[].direction` | 任意 | `up` / `down` / `flat`。色だけでなく記号も変化 |
| `tickers` | 任意 | 最大8件を受理し、Phase 1画面では先頭3件を表示 |
| `tickers[].materialStatus` | 任意 | `confirmed` / `sector_related` / `unclear` |
| `watchPoints` | 任意 | 各48文字・最大5件。画面では先頭3件を表示 |
| `disclaimer` | 任意 | 欠損時は投資助言ではない旨の既定文言 |
| `media` | 任意 | 将来の音声・字幕ファイルパスを保持 |
| `sources` | 任意 | 情報源メタデータを保持。Phase 1画面には表示しない |

`mainNews`、市場項目、銘柄、watch pointなどが欠損しても、安全な代替表示または非表示でレンダリングを継続します。必須型の誤り、未対応の`schemaVersion`、長すぎる文字列は、パス付きの日本語エラーとしてレンダリング前に停止します。

不明な個別材料は`materialStatus: "unclear"`とし、`confirmed`へ自動変換しません。`reason`も欠損している場合は「明確な個別材料は確認できていません」と表示します。

## 開発・検証コマンド

```powershell
npm run typecheck
npm run lint
npm run test:inputs
npm run list:compositions
npm run build
```

`npm run build`のbundle出力は`dist/remotion/`です。正式JSONを置く`build/<date>/`とは分離しています。

`test:inputs`は以下を確認します。

- サンプルJSONが有効
- optional項目を削除したJSONでも既定値が入る
- 長すぎる日本語（タイトル49文字）を検知する
- 不明材料を`unclear`のまま保持する
- 9Sceneの原文ナレーション、Scene順、Timeline計算、source hashを検証する
- 複合画面モードの切り替え境界、Scene 8の3カード入力を検証する
- 既存5Scene CompositionのID、解像度、fps、1350フレームを維持する

## 出力先

```text
renders/<episode.id>_nasdaq-cafe.mp4
renders/stills/<episode.id>/01-conclusion.png
renders/stills/<episode.id>/02-main-news.png
renders/stills/<episode.id>/03-market-reaction.png
renders/stills/<episode.id>/04-tickers.png
renders/stills/<episode.id>/05-watch-points.png
```

## よくあるエラー

### 「入力JSONのパスが必要です」

`--`の後にJSONパスを渡してください。

```powershell
npm run render:episode -- C:\path\episode_data.json
```

### 「episode_data.jsonの検証に失敗しました」

表示された`episode.title`などの項目パスと日本語メッセージを確認します。まず`npm run validate:episode -- <path>`を実行すると、動画をレンダリングせず検証できます。

### Chrome Headless Shellを取得できない

ネットワーク・プロキシ・ファイアウォールを確認し、`npm run list:compositions`を再実行してください。初回のみ約100MBの取得が発生します。

### 日本語フォントが表示されない

`npm install`を再実行し、`node_modules/@fontsource-variable/noto-sans-jp`があることを確認してください。外部フォントURLには依存していません。

### レンダリングに時間がかかる

既存版は1350フレーム、V2は入力JSONの仮尺に応じて長くなります。レイアウトだけの確認は`npm run render:stills -- <episode_data.json>`を使ってください。

## Gemini 3.1 Flash TTS

本番ナレーションは`gemini-3.1-flash-tts-preview`、`Charon`、Interactions APIを既定値とします。APIキーはコードやJSONへ書かず、環境変数だけから読みます。

```powershell
Copy-Item .env.example .env.local
# .env.localのGEMINI_API_KEYへ新しく発行したキーを設定
npm run generate:voiceover:gemini -- build/2026-07-10/episode_data.json
```

9 SceneはSceneごとに生成・キャッシュされます。Geminiの24kHz mono PCMはWAV化後、既存パイプラインで48kHz mono PCMへ統一されます。読み直し時も変更Sceneだけを再生成し、キー・生レスポンス・プロンプト全文をログへ残しません。

VOICEVOX関連コードは旧経路の再現・回帰試験用に残していますが、`NasdaqCafeSpec`の本番検証はVOICEVOXプロファイルを拒否します。GeminiはPreviewモデルのため、生成済みWAVは公開素材とは別に保管してください。

BGM・効果音、YouTube投稿、クラウドレンダリング、Remotion Lambda、Vercelデプロイは未実装です。

## 既存フローへの影響

このディレクトリは既存の`nasdaq_cafe/`、`scripts/`、`output/`、`.agents/skills/nasdaq-cafe-news-collector/`から独立しています。既存の市場情報取得処理・日次出力・handoff生成ファイルは変更しません。
# 朝のNASDAQカフェ Remotion

## 銘柄カード

64社の銘柄カード生成機能を統合済みです。初回言及の検出はVisual Beat計画漏れの検証専用であり、本番カードを自動表示しません。

```bash
npm run stock-cards:all
npm run test:stock-cards
```

生成先は `public/assets/nasdaq-cafe/stock-cards/` です。企業名、ティッカー、
日本語の主要呼称を検出すると、既存の再利用素材キューからカードが表示されます。

本番の `render_spec` では、`data/stock-cards.json` の `assetId`
（例：`company_nvda`）を `assetPlacements[].assetId` に指定できます。
