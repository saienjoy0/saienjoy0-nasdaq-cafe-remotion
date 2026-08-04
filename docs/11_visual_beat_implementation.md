# Visual Beat / Visual Story Engine実装記録

更新日：2026-08-04

## 実装結果

本番Composition `NasdaqCafeSpec`は、Scene単位の固定表示ではなく、Visual Beat内で情報を順番に組み上げる。

- 入力スキーマ：`2.2.0`
- 生成データ識別子：互換性維持のため`2.1.0-production`
- 具体的な描画指定：`visualTemplate` / `templateConfig`
- 画面状態：`Data` / `Chart` / `EntityFocus` / `MainWithEntity` / `PictureBook` / `News`
- Beat境界：実音声へ変換されるナレーションChunkの開始・終了
- 一時表示の復帰：`returnScreenState`
- 完成可能なアセット状態：`ready` / `user-review-required` / `not-required`
- 本番音声：Gemini `gemini-3.1-flash-tts-preview` / `Charon`
- 音声生成：Scene 1〜4 / Scene 5〜9の2ブロック、ブロック別キャッシュ

生成データ識別子は既存実行系との互換用であり、入力契約の旧版利用を意味しない。本番入力は`2.2.0`だけを使用する。

## テンプレート選択

`screenState`は画面の役割、`visualMode`は旧来の内容分類、`visualTemplate`は具体的な描画方式である。

RemotionはScene番号、文章、数値の正負、オブジェクト件数からテンプレートを推測しない。ChatGPT側で確定し、validatorを通過した`visualTemplate`だけを描画する。

登録済みテンプレートは`docs/12_visual_template_contract.md`を正本とする。外部リポジトリのコードを実行時に取得せず、確認済みの運動原理をローカル実装へ固定する。

## Beat内の表示順

一つのBeatで完成図を最初から表示しない。

- `scene.visualEvents`に`show`がある場合、そのイベント時刻を初回表示時刻として優先する。
- 明示イベントがない旧入力では、`visualBeat.objectIds`の並びを決定論的な互換表示順として使用する。
- `hide`、`highlight`、`unhighlight`、`set-expression`も指定時刻どおり適用する。
- `objectIds`に含まれないオブジェクトを、ナレーションや数値から推測して表示しない。
- 因果図はノードを表示してから矢印を描く。
- Expected / Actual / Gapは原則としてExpected、Actual、Gapの順に開示する。
- 重要画面は全要素の表示後に短い完成状態を持つ。

公開View Modelでは次の3状態へ解決する。

- `explicit`：`visualEvents.show`を使用
- `object-order-fallback`：旧JSON互換として`objectIds`順を使用
- `static`：ニュース画像など段階表示が不要

GitHub ActionsとRemotionは順番を判断し直さない。

## 安定化した境界

```text
ProductionScene
  -> getSceneRenderState()
  -> toPublicSceneViewModel()
  -> PublicSceneViewModel
  -> VisualTemplateRenderer
  -> viewer-facing components
```

公開ViewModelには、視聴者向けの見出し、補助文、字幕、出典、数値・カード・図解データ、解決済みアセットパス、確定済みの表示時刻だけを含める。

Scene番号、Beat ID、表情名、template ID、sequence policy、validator結果などの制作情報を公開画面へ表示しない。

## 初期の主要テンプレート

- `opening-contradiction`：方向、矛盾、問い
- `expected-actual-bullet`：市場予想と実績の基準線比較
- `expected-actual-gap-flow`：Expected / Actual / Gapの段階開示
- `causal-lane`：左から右へ因果を構築
- `tailwind-headwind`：追い風と向かい風を両方残す
- `diverging-stock-bars`：中央ゼロの上昇・下落比較
- `verification-matrix`：仮説が強まる条件と弱まる条件
- `closing-recap`：既出要素だけで結論を再構成

残りの登録済みテンプレートは、既存の安定表示部品を互換描画として使用する。

## 表示規則

- `EntityFocus`はメイン領域を単独で使う。
- `MainWithEntity`は`main-primary`と`main-entity`の専用2列だけを使う。
- `PictureBook`は確認済みの同一狐画像を`contain`でメイン領域へ単独表示する。
- `News`はローカルへ取得済みの`main-media`を`contain`で単独表示する。
- 人物写真は`cover`と明示した`focalPoint`を必須にする。
- カード・絵本・ニュースの一時表示はScene末尾に置かず、指定した状態へ戻す。
- Visual Beatは全ナレーションChunkを重複・欠落なく一度ずつ覆う。
- アニメーションはRemotionのフレーム値から決定し、CSS animationやtransitionへ依存しない。
- 固定背景、狐領域、字幕安全領域を変更しない。

## 検証対象

- TypeScript
- Remotion bundle
- render_spec契約テスト
- 公開画面情報境界テスト
- Fixture validate / compile
- JSON SchemaとZod定義の一致
- `objectIds`順の初回表示
- `visualEvents`による順番の上書き
- 非表示後に強調状態が残らないこと
- 登録済みテンプレートとRendererの一致
- 動的コード読み込みがないこと
- 前半・後半の画面多様性
- 同一テンプレートが3 Beat以上連続しないこと
- AIによる代表フレーム検査・完成動画視聴・カード採点・字幕外観確認：実行しない

## 7月31日受入試験

ナレーション、字幕、数字、市場因果、Scene順、TTS入力を変更せず、画面指定だけを`2.2.0`へ移行する。

確認対象：

- Scene 1で方向、矛盾、問いが順番に見える
- Expected / Actual / Gapが最初から同時表示されない
- 因果図のノードと矢印が読み順に追加される
- 上昇と下落が中央ゼロで比較できる
- 追い風と向かい風の両方が残る
- Scene 8に強まる・弱まる条件がある
- Scene 9で新しい証拠を追加しない
- `Data -> EntityFocus -> Data`が復帰する
- 大テロップ、字幕、狐、主表示が重ならない

日次の自動工程は必須ファイル、アセットID、音声、Remotion終了コード、MP4、読み込み失敗だけを機械確認する。完成動画の見た目はユーザーが確認する。
