# QA Report

- 対象企業: 64社
- PNG: 64枚
- PNG解像度: 全て1536×864
- PNG形式: 全てRGBA（透明背景）
- 重複画像: 0枚
- ロゴSVG: 64枚
- Simple Icons公式アイコン: 30社
- イニシャル＋ティッカーのフォールバック: 34社
- `render-manifest.json`: 64件
- レンダリング成功: 64件
- レンダリング失敗: 0件
- 説明文: 全て改行なしの1行
- 日本語フォント: Noto Sans JPをプロジェクト内に同梱
- 長い会社名: 自動縮小で文字切れなし
- 長い説明: 自動縮小と短文化で1行表示

最終確認コマンド:

```bash
npm run stock-cards:all
npm run test:stock-cards
npm run stock-cards:preview
```

結果:

```text
Completed: 64 updated, 64/64 cards rendered.
```

## 既存プロジェクト統合結果

- `NasdaqCafeEpisodeV2`: 旧互換確認用。初回言及からの自動表示は本番では使わない
- `NasdaqCafeSpec`: 明示されたVisual Beatだけで表示し、初回言及検出は計画漏れの検査に限る
- `NasdaqCafeSpec`: `company_nvda` など64個の `assetId` を
  `assetPlacements` から指定可能
- 既存の人物写真、狐、背景、9シーン、台本、市場因果は変更なし
- 既存6 Compositionの読み込み成功
- 既存render_specテスト: 74件合格
- メディア検査テスト: 9件合格
- TypeScript、ESLint: 合格
- 本体内で64枚を再生成: 64/64成功
- 再生成後のPNG: 全64枚が1536×864・RGBA・左上ピクセル透明
- 重複画像: 0枚

`renders/qa/stock-card-spec-preview.png` で、固定背景・狐・字幕領域と
銘柄カードを同時に表示した本番spec経路のレイアウトを確認済みです。
