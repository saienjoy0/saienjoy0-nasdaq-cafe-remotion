# Visual Beat実装記録

更新日：2026-08-01

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

## 安定化した境界

内部のScene、Visual Beat、表情、画面状態、検証結果を公開コンポーネントへ直接渡さない。

```text
ProductionScene
  -> toPublicSceneViewModel()
  -> PublicSceneViewModel
  -> viewer-facing components
```

公開ViewModelには、視聴者向けの見出し、補助文、字幕、出典、数値・カード・図解データ、解決済みアセットパスだけを含める。

## 表示規則

- `EntityFocus`はメイン領域を単独で使う。
- `MainWithEntity`は`main-primary`と`main-entity`の専用2列だけを使う。
- `PictureBook`は確認済みの同一狐画像を`contain`でメイン領域へ単独表示する。
- `News`はローカルへ取得済みの`main-media`を`contain`で単独表示する。権利判断が未確定なら`user-review-required`を記録する。
- 人物写真は`cover`と明示した`focalPoint`を必須にし、`noPhoto`は外部画像なしの正式Variantとして表示する。
- カード・絵本・ニュースの一時表示はScene末尾に置かず、指定した状態へ戻す。
- Visual Beatは全ナレーションChunkを重複・欠落なく一度ずつ覆う。
- 初回言及検出は表示を発生させず、Visual Beatの計画漏れだけを報告する。

## 検証結果

- TypeScript：pass
- ESLint：pass
- Remotion bundle：pass
- render_spec契約テスト：87 pass
- 公開画面情報境界テスト：pass
- メディア検査テスト：9 pass
- Fixture validate / compile：pass
- JSON SchemaとZod定義の一致：pass
- AIによる代表フレーム検査・完成動画視聴・カード採点・字幕外観確認：実行しない
- テンプレート更新時の非AI境界値テスト：必須

実行環境ではOSネットワークインターフェース照会が制限されているため、静止画検査時だけRemotionのローカル配信先をループバックへ固定した。本番コード、Composition、入力データは変更していない。

## ユーザーが完成動画で確認する箇所

- `Data -> EntityFocus -> Data`の復帰
- `MainWithEntity`の2列でカードと主図が重ならないこと
- `PictureBook`がメイン領域内で切れないこと
- 大テロップ、補助テロップ、字幕が3行以内で重ならないこと
- 固定背景と狐の位置がBeat切替で変わらないこと

日次の自動工程は必須ファイル、アセットID、音声、Remotion終了コード、MP4、読み込み失敗だけを機械確認する。見た目はユーザーが完成動画で確認する。
