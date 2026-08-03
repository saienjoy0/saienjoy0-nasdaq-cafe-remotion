# Visual Template Contract

`screenState`は画面の役割、`visualMode`は旧来の内容分類、`visualTemplate`は本番で使う具体的な描画テンプレートです。

本番レンダーは`visualTemplate`だけで具体的な見せ方を選びます。Scene番号、文章、数値の正負・単位、ノード形状からテンプレートを推測してはいけません。

## 登録済みテンプレート

### 冒頭・主役

- `opening-contradiction`：方向、矛盾、問いを順番に提示
- `hero-number`：企業・人物・主題と重要数字を一画面の主役にする
- `entity-card-full`：人物・企業・製品を役割説明とともに全面表示

### 期待・実績・数値比較

- `expected-actual-bullet`：予想線と実績バーを比較
- `expected-actual-gap-flow`：Expected、Actual、Gapを段階開示
- `metric-comparison-board`：複数指標を同一基準で比較
- `index-return-bars`：同方向の騰落率を棒で比較
- `diverging-stock-bars`：中央ゼロから上昇・下落を左右へ伸ばす
- `split-comparison`：二つの材料・企業・市場反応を左右に分ける
- `focus-matrix`：複数対象のうち説明中の対象を明るくし、波及差を示す

### 因果・検証

- `causal-lane`：左から右へノードと矢印を組み立てる
- `tailwind-headwind`：追い風と向かい風を両方残す
- `evidence-boundary`：確認済み材料と未確認範囲を分ける
- `verification-checklist`：次に確認する点を順番に表示
- `verification-matrix`：仮説が強まる条件と弱まる条件を両レーンで表示
- `analogy-steps`：短いたとえから実際の市場へ段階的に戻る

### 結論・互換表示

- `final-assembly`：既出要素だけを再配置して最終結論を作る
- `closing-recap`：旧入力互換の締め表示。新規制作では`final-assembly`を使用
- `conclusion-card`：単一結論カード
- `news-media`：確認済みのニュース素材を表示
- `text-focus`：カードを増やさず重要語を大きく表示

## データ形状

- 時系列点がない場合、ラインチャートを指定しない。
- 数値バー、左右比較、マトリクスには`numericValue`を入れ、公開文字列`value`と一致させる。
- 比較対象は同一単位と同一比較基準を持つ。
- 因果は最大4ノード・最大3矢印、左から右の一本道。
- 因果矢印は接続元・接続先ノードより後に表示する。
- 二つの対立経路は`tailwind-headwind`、二つの対象を並べる場合は`split-comparison`を使う。
- Scene 8で弱まる条件を話す場合、`verification-matrix`に強まる／弱まる両レーンを含める。
- Scene 9は`final-assembly`を使い、Scene 1〜8に存在しない新しい証拠を追加しない。
- `objectIds`は表示対象、`templateConfig.nodeOrder`は因果の読み順を確定する。
- 新規日次入力は`sequencePolicy: explicit`を原則とし、各主要対象の`show`イベントをBeat内に置く。
- `finalHoldMs`は0〜1500msで明示し、重要な完成画面だけを短く保持する。

## 外部参考実装

外部リポジトリから採用するのは、順次開示、カウントアップ、線描画、緩急、完成ホールドなどの運動原理です。任意Reactコード、任意CSS、外部URL、動的importを`render_spec.json`から指定しません。

GitHub Actions、Codex、Remotionは指定を変更せず、validatorを通った値を機械的に描画します。
