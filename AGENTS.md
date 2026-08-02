AGENTS.md

1. このリポジトリの目的

このリポジトリは、Remotionで「朝のNASDAQカフェ」の公開用動画を生成するための実装です。

現在の本番Compositionは NasdaqCafeSpec です。Remotion実行時の日次正本は、次のファイルだけです。

render-specs/YYYY-MM-DD/render_spec.json

当日の編集パッケージ、画像依頼、画像生成ログ、backlogは制作工程の記録です。Remotionはそれらを読み直して内容を判断せず、PrimaryまたはApproved Fallbackのどちらか一方へ解決済みのrender_spec.jsonだけを実行します。

本番の日次制作では、明示的な依頼がない限り、次の旧経路を使用しないでください。

NasdaqCafeEpisode

NasdaqCafeEpisodeV2

prepare:episode

validate:episode

render:episode

render:sample

旧Markdown入力経路

2. 判断の優先順位

指示や文書が競合する場合は、次の順番を優先してください。

ユーザーの現在の依頼

このAGENTS.md

docs/07_codex_minimal_execution_contract.md

docs/08_gemini_tts_runbook.md

docs/11_visual_beat_implementation.md

現在のスキーマ、validator、テスト、実装コード

README.mdおよびdocs/05_remotion_implementation_spec.mdのうち、上記と競合しない部分

README.mdには旧経路の説明が残る場合があります。本番判断では、必ず上記の優先順位を使用してください。

3. 作業開始時

package.jsonがある現在のリポジトリ直下を作業ルートにしてください。

cd video/remotionは実行しないでください。

Node.js 20以上、npm 10以上を使用してください。

node_modulesがない場合、またはpackage-lock.jsonが変更された場合は、原則としてnpm ciを使用してください。

rtkがインストール済みなら使用して構いません。存在しない環境では通常のコマンドを実行し、rtkを必須条件にしないでください。

Remotion Studioを起動する場合は、まず次を使用してください。

npx remotion studio src/index.ts --no-open

ファイル監視上限のエラーが出た場合だけ、次を試してください。

npx remotion studio src/index.ts --no-open --webpack-poll 1000

4. render_spec.jsonは日次制作の不変入力

通常の日次レンダーでは、render_spec.jsonを勝手に修正しないでください。

Codex、GitHub Actions、Remotionは次を推測、補完、要約、短縮、言い換え、並べ替えしてはいけません。

公開用の見出し、補助文、タイトル、サムネイル文、概要欄

speechTextとcaptionText

Chunk境界、ID、順序、pauseAfterMs

Sceneの順序と役割

表情、Visual Beat、Visual Event、画面状態

カード、数値、ノード、矢印の関係

出典、確信度、留保、Expected / Actual / Gap

asset ID、placement、region、fit、focalPoint

PrimaryまたはApproved Fallbackの最終採用結果

不正な値、欠落、参照切れ、未解決の画像状態がある場合は、黙って直さず、正確なJSON Pathを示して停止してください。

ユーザーが明示的にrender_spec.jsonの編集を依頼した場合だけ、編集作業として分離して変更し、変更後に必ず本番validatorを通してください。

5. 本番の日次コマンド

入力をrender-specs/YYYY-MM-DD/render_spec.jsonとして、原則この順番で実行してください。

npm run episode:spec:validate -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:compile -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:preview -- render-specs/YYYY-MM-DD/render_spec.json

プレビュー生成後は、ユーザーが見た目を確認します。

最終MP4は、ユーザーが明示的に最終レンダーを依頼した場合だけ生成してください。

npm run episode:spec:final -- render-specs/YYYY-MM-DD/render_spec.json

previewとfinalの両方が存在する状態で、技術検査を実行してください。

npm run episode:spec:inspect -- render-specs/YYYY-MM-DD/render_spec.json

previewから自動的にfinalへ進めないでください。

6. GitHub Actions運用

導入初期はworkflow_dispatchによる手動実行だけを使用します。台本や文書のpushだけで自動レンダーを開始しません。

workflowの入力は、少なくとも次を持たせます。

episode_date
target = preview | final | inspect

既定値はpreviewです。

GitHub Actionsは次だけを担当します。

checkout
→ npm ci
→ render_spec検証
→ Gemini TTS 2ブロック生成
→ compile
→ preview / final / inspect
→ 軽量機械チェック
→ Artifact保存

GitHub Actionsは次を行いません。

ニュース取得

台本作成・修正

市場因果の判断

画像検索・画像生成

Primary / Fallbackの新規判断

AIによる代表フレーム検査

AIによる完成動画視聴

カード配置や字幕外観のAI採点

生成物の自動commitまたはpush

Artifactには、実行対象に応じて次を保存します。

preview

final MP4

technical report

TTS・レンダーの技術ログ

失敗時のJSON Pathと不足アセット一覧

7. GitHub SecretsとAPIキー

ローカル実行では.env.localを使用します。

GitHub Actionsでは、次のRepository Secretsを環境変数へ一時的に割り当てます。

GEMINI_API_KEY_1
GEMINI_API_KEY_2
GEMINI_API_KEY_3

Secretsをファイルへ書き出してコミットしないでください。値を標準出力、ログ、JSON、Artifactへ出力しないでください。

.env.localだけを前提にしてGitHub Actionsを失敗させず、実行環境に応じて次を使い分けます。

ローカル：.env.local
GitHub Actions：Repository Secrets → process environment

8. コード変更時の検証

最初に変更箇所に近いテストを実行し、完了前に原則として次を実行してください。

npm run typecheck
npm run lint
npm run test:spec
npm run test:public-screen
npm run build

対象領域を変更した場合は、追加で次を実行してください。

npm run test:stock-cards
npm run test:remaining-assets
npm run test:reusable-assets

validatorやテストを弱めて不正入力を通してはいけません。契約そのものを変更する依頼がある場合は、スキーマ、validator、fixture、テスト、文書を同時に更新してください。

9. 本番ルートで必ず守る境界

入力スキーマは2.1.0、生成データは2.1.0-productionを維持してください。

本編はscene-01からscene-09までの9Sceneです。

Scene 1とScene 9の固定役割を維持してください。

本番レンダーはNasdaqCafeSpecだけを使用してください。

ProductionScene -> toPublicSceneViewModel() -> PublicSceneViewModel -> viewer-facing componentsの境界を維持してください。

Scene番号、Beat ID、表情名、画面状態名、検証結果などの制作情報を公開画面へ出さないでください。

assetPlacementsだけを本番アセット配置の正本にしてください。

各Sceneには常時表示のmainBackgroundをちょうど1件だけ置いてください。

同じChunkでmain-media、chart、illustrationをmain-stageへ重複配置しないでください。

ナレーションからカード、矢印、人物素材、銘柄カードを自動推測して表示しないでください。

存在しない画像、音声、空ファイル、架空のファイルパスを作って処理を通さないでください。

Remotionコンポーネント内からTTS API、ニュースAPI、株価API、Web取得を実行しないでください。

レンダリングは、検証済みproduction dataとローカル素材だけで行ってください。

10. 画像・アセット運用

既存の固定背景、狐、64社カード、登録済みアセットを、明示的な依頼なしに置換・再生成しないでください。

外部画像の不足を、別人画像や架空画像で埋めないでください。

権利確認が必要な素材はuser-review-requiredとして報告してください。

有料画像生成APIをコード、Codex、GitHub Actions、制作サーバーから呼び出さないでください。

当日固有画像はChatGPT側またはユーザー側で準備します。

画像生成前にPrimaryとApproved Fallbackを確定します。

GitHubへ渡す時点で、PrimaryまたはFallbackのどちらか一方だけをrender_spec.jsonへ反映します。

GitHub Actionsはselected_pathを判断し直しません。

選択されたアセットが存在しない、寸法・SHA-256・IDが一致しない場合は停止します。

Codexが新しいFallbackを考案してはいけません。

Primary用ナレーションとFallback画面を混在させてはいけません。

11. TTS契約

本番音声は次に固定されています。

Provider / model: gemini-3.1-flash-tts-preview

Voice: Charon

生成単位: Scene 1〜4、Scene 5〜9の2ブロック

禁止事項：

一文ごとのAPI呼び出し

ChunkごとのAPI呼び出し

字幕ごとのAPI呼び出し

Visual BeatごとのAPI呼び出し

SceneごとのAPI呼び出し

VOICEVOX、別モデル、別音声への自動fallback

尺合わせを目的とした原稿変更、速度変更、無音による水増し

段落間の無音境界を安全に実測できない場合は、比例配分せず停止してください。

APIキーは実行環境の秘密領域から読み、チャット、コード、JSON、ログ、コミットへ出力しないでください。

12. Git管理と生成物

次をコミットしないでください。git add -fで強制追加もしないでください。

.env

.env.local

.cache/

node_modules/

dist/

build/内の生成物

public/generated/

public/spec-audio/の生成音声

out/

レンダー済みMP4

QA・確認用の生成PNG

GitHub Actionsの生成物はArtifactへ保存します。リポジトリへ自動commitしません。

ユーザーが生成物の保存方法を明示的に変更した場合だけ、.gitignoreと運用契約を一緒に見直してください。

13. 変更方針

修正前に、関連するスキーマ、validator、テスト、呼び出し元を読んでください。

最小限の変更で直してください。

既存の固定契約を、便利さだけを理由に緩めないでください。

Remotion関連パッケージのバージョンを混在させないでください。

依存関係やRemotionを、明示的な依頼なしにアップグレードしないでください。

関係のないファイルを整形・改名・移動しないでください。

ユーザーの未コミット変更を勝手に破棄しないでください。

14. 完了報告

完了時は、最低限次を報告してください。

変更したファイル

実行したコマンド

成功・失敗した検証とテスト

GitHub Actions run ID

preview、final、technical report、Artifactの実パスまたは名称

未解決のJSON Path、欠落アセット、user-review-required

ユーザーが完成動画で目視確認すべき箇所

AIが代表フレームを自動採点した、完成動画を視聴承認した、見た目が完全である、とは報告しないでください。最終的な見た目はユーザーが確認します。
