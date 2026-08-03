# Visual Template Contract

`screenState`は画面の役割、`visualMode`は旧来の内容分類、`visualTemplate`は本番で使う具体的な描画テンプレートです。

本番レンダーは`visualTemplate`だけで具体的な見せ方を選びます。Scene番号、文章、数値の正負・単位、ノード形状からテンプレートを推測してはいけません。

## 登録済みテンプレート

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

## データ形状

- 時系列点がない場合、ラインチャートを指定しない。
- 比較は2〜4件、同一単位と比較基準を持つ。
- 因果は最大4ノード・最大3矢印、左から右の一本道。
- 二つの対立経路は`tailwind-headwind`。
- Scene 8で弱まる条件を話す場合、`verification-matrix`に強まる／弱まる両レーンを含める。
- `objectIds`は表示対象、`templateConfig.nodeOrder`は因果の読み順を確定する。

GitHub Actions、Codex、Remotionは指定を変更せず、validatorを通った値を機械的に描画します。
