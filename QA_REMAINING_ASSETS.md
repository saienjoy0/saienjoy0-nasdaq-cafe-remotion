# 朝のNASDAQカフェ 残り79アセット QA

検査日: 2026-07-29

## 結果

- 論理ID: 79/79 登録
- PNG: 79/79 生成
- 内訳: 実在人物25、汎用役職3、概念37、背景14
- 解像度: 全79枚 1536×864
- 空画像: 0
- 重複ハッシュ: 0
- `render_spec`: 79 IDすべて `productionAssetManifest` に登録
- V2: 人物・概念の初回言及キュー、Scene番号・見出しによる背景選択を接続

## 既存64社カードの保護

- 64 PNGの作業前SHA-256一覧と作業後SHA-256一覧を全件比較
- 不一致: 0
- 一覧ファイル自体のSHA-256（作業前・作業後とも同一）:
  `7a5f7c7dca83572e0fe5afbb141f884c0180cc3b740e0793b17a0c47b18576f4`
- 64社のID、ファイル名、生成コンポーネント、表示条件は変更していない

## 実在人物

- 公式写真で完成: 1/25
  - Christopher Waller: 既存プロジェクト同梱の本人確認済みFederal Reserve Board写真を使用
- 公式写真待ちの汎用カード: 24/25
  - 公式プロフィールURLと役職情報は登録
  - 外部の公式写真を作業環境へ取り込めなかったため、別人・AI顔を代用していない
  - 各IDはV2と`render_spec`で使用可能
  - 公式写真を後から同じIDへ差し替えられる
- Wallerの原写真はJPGで、背景除去サービスへの転送が失敗したため人物単体の透明PNG化は未完了
- 最終人物カードPNGはRGBA

出典・肩書き記録: `config/person-source-register.json`

## 汎用役職

- 3/3を特定人物に依存しない機関カードへ置換
- U.S. Treasury、Bank of Japan、European Central Bank
- AI顔は使用していない
- 置換理由は出典記録へ保存

## 概念と背景

- 概念37/37: 1つのデータ駆動`ConceptCard`とpropsへマッピング
- 架空の市場数字・チャートなし
- 背景14/14: コード生成の静かな共通色調、文字・ロゴ・数字なし
- IDごとの極薄モチーフで重複を回避

## 表示確認

- `renders/qa/remaining-assets-v2-preview.png`
  - Wallerの初回言及カード
  - 狐・字幕・大テロップと非重複
  - 左テキスト、右人物の承認済み構図
- `renders/qa/remaining-assets-spec-preview.png`
  - `background_scene_expected_gap` と `concept_expected_actual_gap` の明示ID配置
- 人物・概念・背景のコンタクトシートを `renders/qa/` に保存

## テスト

- 既存render_spec named contract: 74/74
- 既存spec inspect: 9/9
- 既存83テスト合計: 83/83
- 既存入力・固定素材・9Scene・公開画面検査: 15/15
- 既存64社カード検査: 合格
- 既存再利用キュー検査: 合格
- 新規79件のID・件数・PNG・解像度・V2・`render_spec`検査: 合格
- TypeScript: 合格
- ESLint: 合格
- 既存6 Composition: 維持

## 新規・変更ファイル

新規:

- `data/remaining-assets.csv`
- `data/remaining-assets.json`
- `config/person-source-register.json`
- `src/remaining-assets/` 一式
- `src/config/remaining-asset-entities.ts`
- `src/config/remaining-backgrounds.ts`
- `scripts/generate-remaining-assets-data.mjs`
- `scripts/generate-person-source-register.ts`
- `scripts/render-remaining-assets.mjs`
- `scripts/render-remaining-assets-integration-preview.ts`
- `scripts/test-remaining-assets.ts`
- `public/assets/nasdaq-cafe/remaining/` 79 PNGとrender manifest
- `renders/qa/remaining-*`

変更:

- `package.json`
- `src/config/production-assets.ts`
- `src/config/reusable-entity-cues.ts`
- `src/components/v2/EpisodeSceneV2.tsx`
- `src/components/v2/ReusableEntityCue.tsx`

## 未完了・手作業が必要

1. 24名分の公式プロフィール／プレス写真のファイル取り込み
2. 25名全員の胸上クロップ、背景除去、色調統一
3. Waller原写真の透明PNG化

公式写真ファイルを同じプロジェクトへ追加できれば、登録済みの`portraitPath`へ接続して人物カードだけ再出力できる。
