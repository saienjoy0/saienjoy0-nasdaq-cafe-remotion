# Visual Beat実装記録

更新日：2026-08-03

## 実装結果

本番Composition `NasdaqCafeSpec`を、Scene単位の固定表示からVisual Beat単位の表示切替へ拡張した。

- 入力スキーマ：`2.1.0`
- 生成データ：`2.1.0-production`
- 画面状態：`Data` / `Chart` / `EntityFocus` / `MainWithEntity` / `PictureBook` / `News`
- Beat境界：実音声へ変換されるナレーションChunkの開始・終了
- 一時表示の復帰：`returnScreenState`
- 完成可能なアセット状態：`ready` / `user-review-required` / `not-required`
- 本番音声：Gemini `gemini-3.1-flash-tts-preview` / `Charon`
- 音声生成：Scene 1〜4 / Scene 5〜9の2ブロック、ブロック別キャッシュ

## Beat内の表示順

一つのBeatで完成図を最初から表示しない。

- `visualBeat.objectIds`の並びを、そのBeat内における既定の初回表示順とする。
- レンダラーは`objectIds`の順番に、カード、数字、ノード、矢印を時間差で表示する。
- `scene.visualEvents`に`show`がある場合、そのイベント時刻を初回表示時刻として優先する。
- `hide`、`highlight`、`unhighlight`も指定時刻どおり適用する。
- `objectIds`に含まれないオブジェクトを、ナレーションや数値から推測して表示しない。
- 因果図はノードと矢印を読み順に追加し、線を描き終えてから完成状態を保持する。
- Expected / Actual / Gapは、原則としてExpected、Actual、Gapの順に開示する。異なる順番が必要な場合は`objectIds`または`visualEvents`で明示する。

これにより、日次制作側が「何を表示するか」だけでなく「何をどの順番で見せるか」も`render_spec.json`で確定できる。GitHub ActionsとRemotionは順番を判断し直さない。

## 安定化した境界

内部のScene、Visual Beat、表情、画面状態、検証結果を公開コンポーネントへ直接渡さない。

```text
ProductionScene
  -> getSceneRenderState()
  -> toPublicSceneViewModel()
  -> PublicSceneViewModel
  -> viewer-facing components
```

公開ViewModelには、視聴者向けの見出し、補助文、字幕、出典、数値・カード・図解データ、解決済みアセットパス、確定済みの表示時刻だけを含める。

## 表示規則

- `EntityFocus`はメイン領域を単独で使う。
- `MainWithEntity`は`main-primary`と`main-entity`の専用2列だけを使う。
- `PictureBook`は確認済みの同一狐画像を`contain`でメイン領域へ単独表示する。
- `News`はローカルへ取得済みの`main-media`を`contain`で単独表示する。権利判断が未確定なら`user-review-required`を記録する。
- 人物写真は`cover`と明示した`focalPoint`を必須にし、`noPhoto`は外部画像なしの正式Variantとして表示する。
- カード・絵本・ニュースの一時表示はScene末尾に置かず、指定した状態へ戻す。
- Visual Beatは全ナレーションChunkを重複・欠落なく一度ずつ覆う。
- 初回言及検出は表示を発生させず、Visual Beatの計画漏れだけを報告する。
- アニメーションはRemotionのフレーム値から決定し、CSS animationやtransitionへ依存しない。
- 外部リポジトリから実行時コードを取得せず、確認済みの動作原理だけをローカル実装する。

## 検証対象

- TypeScript
- ESLint
- Remotion bundle
- render_spec契約テスト
- 公開画面情報境界テスト
- メディア検査テスト
- Fixture validate / compile
- JSON SchemaとZod定義の一致
- `objectIds`順の初回表示
- `visualEvents`による順番の上書き
- 非表示後に強調状態が残らないこと
- AIによる代表フレーム検査・完成動画視聴・カード採点・字幕外観確認：実行しない

## ユーザーが完成動画で確認する箇所

- 一つのBeatで全要素が最初から出ず、音声に合わせて順番に出ること
- Expected / Actual / Gapが一度に並ばず、比較の意味が段階的に分かること
- 因果図のノードと矢印が読み順に追加されること
- 大数字のカウントアップと比較バーが過度に速くないこと
- `Data -> EntityFocus -> Data`の復帰
- `MainWithEntity`の2列でカードと主図が重ならないこと
- `PictureBook`がメイン領域内で切れないこと
- 大テロップ、補助テロップ、字幕が3行以内で重ならないこと
- 固定背景と狐の位置がBeat切替で変わらないこと

日次の自動工程は必須ファイル、アセットID、音声、Remotion終了コード、MP4、読み込み失敗だけを機械確認する。見た目はユーザーが完成動画で確認する。
