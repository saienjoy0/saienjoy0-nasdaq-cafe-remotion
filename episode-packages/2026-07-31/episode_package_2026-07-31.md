# 朝のNASDAQカフェ｜2026-07-31 制作パッケージ

## A. エピソード概要
- 対象日：2026-07-31
- 情報締切：2026-08-01T15:19:46Z
- エピソード種別：単独ニュース
- 主役ニュース：Amazon決算でAWS売上が市場予想を上回り、AI投資の回収証拠として評価されたこと
- 対象指数：Nasdaq Composite / Nasdaq-100 / SOXX
- 音声尺区分：明示的な短縮回
- Charon実測音声尺：403.2秒（production timeline実測）
- 短縮理由：Charon実測403.2秒で確認済みの主役因果と反対材料の説明が完結しており、480秒へ合わせるためのニュース・背景知識・狐ネタ追加は水増しになるため。
- 完成ナレーション文字数：約2,562字
- ストーリーの背骨：AmazonではAWSの予想超過がAI投資の回収証拠として株価を押し上げ、NASDAQ全体では大型クラウド株の上昇が金利上昇とApple安を上回った一方、半導体への波及は限定的だった。
- 中心仮説：昨夜の市場はAI設備投資の金額より、クラウド売上として回収が確認できるかを評価した。
- 主役銘柄の直接材料：AWS売上422.3億ドル、予想405.7億ドル、Amazon +15.32%。
- NASDAQ全体の支援材料：Amazon、Alphabet、Microsoft、Metaなど大型クラウド株の上昇。
- 増幅要因：AWSの四半期成長が五年で最も速いとの主要報道。
- 相殺要因：米10年債利回り約4.75%、Apple -7.35%、SOXX +0.07%。
- Expected：巨額のAI設備投資がクラウド売上と収益へつながる具体的な証拠。
- Expectedの根拠区分：主要報道。
- Expectedの具体的根拠：Nasdaq掲載のBarchart記事がAI設備投資の回収可能性とAWS市場予想405.7億ドルを提示。
- Actual：AWS売上422.3億ドル。市場予想を16.6億ドル上回った。
- Gap：AI投資を支出負担として見る材料に、回収を示す売上成長の証拠が加わった。
- 時系列の根拠：取引区分と終値、主要市場記事。分足データなし。
- 確信度：Medium
- 重要な反対材料：長期金利上昇、Apple大幅安、半導体の反応差、入力内の日付ラベル不整合。
- 日付整合：メタデータの `market_session_date_us: 2026-07-30` と、記事本文の金曜2026-07-31終値に一日のずれがある。制作上は記事本文と終値に合わせ、ナレーションでは具体的な日付を読み上げない。
- 正本背景：mainBackground / ready
- 正本狐：foxNormalを基準に7表情 / ready
- 音声プロファイル：gemini-charon
- TTSブロックA：Scene 1〜4
- TTSブロックB：Scene 5〜9
- TTS再実行方針：失敗ブロックだけを再生成
- 当日固有画像：not-required
- 画像採用経路：not-required
- Visual Beat総数：18
- Scene 1〜8の画面状態：Chart / Data / EntityFocus
- 非分析画面Beat数：2
- 前半の大きな画面変化：Scene 2 Amazon EntityFocus → Data
- 後半の大きな画面変化：Scene 7 Apple EntityFocus → Data
- 最長同一画面状態連続数：3
- 主役カード：company_amzn（Scene 2、登録済み）
- 比較カード：company_aapl（Scene 7、登録済み）
- render_specローカル構造検査：pass
- repository正式validator：pass（GitHub Actions Run 30783539322）
- episode_package・render_spec整合：同一データから生成しローカル照合pass

### 画面構成表

| Scene | 画面状態列 | 主な役割 |
|---|---|---|
| 1 | Data → Data | 方向・矛盾・中心仮説を30秒以内に提示する |
| 2 | EntityFocus → Data | Amazon急騰と半導体の弱い広がりを対比する |
| 3 | Data → Chart | AWSの確認済み数値と大型クラウドへの波及を整理する |
| 4 | Data → Data → Data | Expected・Actual・Gapから中心仮説を確定する |
| 5 | Chart → Chart | 強い経済指標から金利、NASDAQまでの向かい風を示す |
| 6 | Chart → Data | 主役銘柄の直接材料とNASDAQ全体の支援・相殺材料を分ける |
| 7 | EntityFocus → Data | AmazonとApple、半導体内の差で仮説の限界を示す |
| 8 | Data → Chart | 仮説が強まる条件と弱まる条件を具体化する |
| 9 | Data | 結論を一文で再確認し固定エンディングへつなぐ |

## B1. Scene 1｜寝ている間に何が起きた？

- 目的：方向・矛盾・中心仮説を30秒以内に提示する
- 因果の対象：multiple
- 狐の演技意図：結論を明瞭に置き、すぐ問いへ移る
- 初期表情：軽い驚き
- 画面モード：conclusion-card
- 大テロップ：NASDAQ +1.00%
- 補助テロップ：Amazon急騰、半導体は横ばい
- 根拠：当日の市場データ／Nasdaq掲載記事
- 不確実性：終値中心のため細かな反応時刻は断定しない
- 前のSceneからの接続：冒頭のため該当なし

### Visual Beats

- **scene-01-beat-001**
  - 開始合図：昨夜のNasdaq Composit
  - 終了合図：同じ理由で上がった夜ではありません。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Template ID：opening-contradiction
  - Template Variant：default
  - 表示順：NASDAQ→Amazon→SOXX→Apple
  - 比較基準：同一セッション終値
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：昨夜の中心は何か
  - 主要要素：NASDAQ方向と主役
  - 視聴者向けテキスト：NASDAQ +1.00% / Amazon +15.32%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-01-beat-002**
  - 開始合図：市場が評価したのは、AIへいくら使う
  - 終了合図：こまで打ち消したのかを順番に見ます。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Template ID：text-focus
  - Template Variant：default
  - 表示順：投資額より回収→相殺材料
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：市場が見た論点は何か
  - 主要要素：AI投資の回収証拠
  - 視聴者向けテキスト：投資額より回収 / 金利とAppleが相殺
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

昨夜のNasdaq Compositeは一・〇〇パーセント上昇しました。主役は、十五パーセントを超えて急騰したAmazonです。ただし、半導体のETFは終値でほぼ横ばい。Appleは大幅安でした。全部のテック株が同じ理由で上がった夜ではありません。

市場が評価したのは、AIへいくら使うかではなく、その投資から売上が返ってきている証拠でした。今朝は、Amazonの決算が、金利上昇とApple安をどこまで打ち消したのかを順番に見ます。

- ナレーションで示す出典主体：当日の市場データ／Nasdaq掲載記事

## B2. Scene 2｜今朝の矛盾

- 目的：Amazon急騰と半導体の弱い広がりを対比する
- 因果の対象：multiple
- 狐の演技意図：主役カードで対象を固定し、違和感を示す
- 初期表情：分析
- 画面モード：text-focus
- 大テロップ：Amazon +15.32%
- 補助テロップ：SOXX +0.07%
- 根拠：当日の市場データ
- 不確実性：Amazon以外の銘柄原因は個別に断定しない
- 前のSceneからの接続：まずAmazonです。

### Visual Beats

- **scene-02-beat-001**
  - 開始合図：まずAmazonです。株価は十五・三
  - 終了合図：の大型テック全体の空気を変えました。
  - 主要視覚機能：Anchor
  - 画面状態：EntityFocus
  - Visual Template ID：entity-card-full
  - Template Variant：prebuilt-card
  - 表示順：Amazonカード
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：主役は誰か
  - 主要要素：Amazon企業カード
  - 視聴者向けテキスト：Amazon / AWSと消費の二つの柱
  - 使用アセット：scene-02-placement-amzn
  - アセット状態：ready
  - 表示後の復帰先：Data
  - 採用経路：not-required
- **scene-02-beat-002**
  - 開始合図：でも、ここで半導体まで一括して強かっ
  - 終了合図：収を示せた企業へ強く寄った動きです。
  - 主要視覚機能：Compare
  - 画面状態：Data
  - Visual Template ID：diverging-stock-bars
  - Template Variant：center-zero
  - 表示順：Amazon→SOXX→AMD
  - 比較基準：前日比・中央ゼロ
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：上昇はどこまで広がったか
  - 主要要素：Amazonと半導体の差
  - 視聴者向けテキスト：Amazon +15.32% / SOXX +0.07% / AMD -1.90%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

まずAmazonです。株価は十五・三二パーセント上昇しました。AWSは、ネット通販ではなく、企業が計算能力やデータを借りるクラウド事業です。このAWSの伸びが、昨夜の大型テック全体の空気を変えました。

でも、ここで半導体まで一括して強かったと考えると説明が壊れます。SOXXは〇・〇七パーセント高。NVIDIAは上がりましたが、AMDは下落しました。昨夜の上昇は、AIという言葉全体ではなく、回収を示せた企業へ強く寄った動きです。

- ナレーションで示す出典主体：当日の市場データ

## B3. Scene 3｜何が起きた？

- 目的：AWSの確認済み数値と大型クラウドへの波及を整理する
- 因果の対象：lead-stock
- 狐の演技意図：数字を順番に置き、解釈を急がない
- 初期表情：分析
- 画面モード：number-comparison
- 大テロップ：AWS 422.3億ドル
- 補助テロップ：市場予想405.7億ドル
- 根拠：Nasdaq掲載の市場記事
- 不確実性：他社上昇をAmazonだけの因果にしない
- 前のSceneからの接続：確認できた数字を置きます。

### Visual Beats

- **scene-03-beat-001**
  - 開始合図：確認できた数字を置きます。Nasda
  - 終了合図：想を超える成長が確認されたことです。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Template ID：expected-actual-bullet
  - Template Variant：zero-baseline
  - 表示順：市場予想→AWS実績→Gap
  - 比較基準：億ドル・共通基準
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：AWSは予想を超えたか
  - 主要要素：AWS売上と市場予想
  - 視聴者向けテキスト：422.3億ドル / 予想405.7億ドル
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-03-beat-002**
  - 開始合図：同じ市場データでは、Amazonが十
  - 終了合図：mazon決算だけで断定はしません。
  - 主要視覚機能：Evidence
  - 画面状態：Chart
  - Visual Template ID：metric-comparison-board
  - Template Variant：default
  - 表示順：Amazon→Alphabet
  - 比較基準：前日比
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：反応はAmazonだけか
  - 主要要素：大型クラウドの終値比較
  - 視聴者向けテキスト：Amazon +15.32% / Alphabet +6.73%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

確認できた数字を置きます。Nasdaq掲載の市場記事によると、AWSの四半期売上は四百二十二億三千万ドル。市場予想の四百五億七千万ドルを上回りました。差は十六億六千万ドルです。記事は、クラウドの伸びが五年で最も速かったと説明しています。ここで重要なのは、Amazon全体の売上が大きいという一般論ではなく、AI計算の需要が最も直接出やすいAWSで、予想を超える成長が確認されたことです。

同じ市場データでは、Amazonが十五・三二パーセント高、Alphabetが六・七三パーセント高、MicrosoftとMetaも三パーセント前後上昇しました。Amazon一社だけの孤立した反応ではなく、大型クラウド企業へ買いが広がった形です。ただし、これら他社の上昇理由までAmazon決算だけで断定はしません。

- ナレーションで示す出典主体：Nasdaq掲載の市場記事

## B4. Scene 4｜市場は何を期待していた？

- 目的：Expected・Actual・Gapから中心仮説を確定する
- 因果の対象：lead-stock
- 狐の演技意図：最も分析者らしく、差の意味を日常語で解く
- 初期表情：分析
- 画面モード：expected-actual-gap
- 大テロップ：投資額より回収速度
- 補助テロップ：AWSが予想を16.6億ドル上回る
- 根拠：主要報道／市場予想
- 不確実性：期待は主要報道と予想値に基づく
- 前のSceneからの接続：市場が事前に見ていた論点は、AI設備投資の大きさでした。

### Visual Beats

- **scene-04-beat-001**
  - 開始合図：市場が事前に見ていた論点は、AI設備
  - 終了合図：るのかが繰り返し注目されていました。
  - 主要視覚機能：Explain
  - 画面状態：Data
  - Visual Template ID：expected-actual-gap-flow
  - Template Variant：left-to-right
  - 表示順：Expected→Actual→Gap
  - 比較基準：市場予想と実績
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：Gap
  - 画面の問い：期待と結果の差は何か
  - 主要要素：Expected・Actual・Gap
  - 視聴者向けテキスト：Expected｜回収できるか / Actual｜AWS 422.3億ドル / Gap｜回収速度へ
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-04-beat-002**
  - 開始合図：実際に出たAWS売上は、市場予想を十
  - 終了合図：の伸びは、その成果に近い数字でした。
  - 主要視覚機能：Explain
  - 画面状態：Data
  - Visual Template ID：analogy-steps
  - Template Variant：left-to-right
  - 表示順：道具を買う→使う→成果
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：成果
  - 画面の問い：投資と成果は何が違うか
  - 主要要素：短いパソコンのたとえ
  - 視聴者向けテキスト：道具を買う / 成果を出す
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-04-beat-003**
  - 開始合図：つまり差は、投資額への不安が消えたこ
  - 終了合図：が、金額から回収速度へ移った、です。
  - 主要視覚機能：Explain
  - 画面状態：Data
  - Visual Template ID：causal-lane
  - Template Variant：left-to-right
  - 表示順：AI設備投資→クラウド利用増→売上成長→株価評価
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：s4-node-spend→s4-node-cloud→s4-node-revenue→s4-node-valuation
  - レーン名：not-required
  - 最終到達点：s4-node-valuation
  - 画面の問い：評価軸はどう変わったか
  - 主要要素：AI投資から株価評価まで
  - 視聴者向けテキスト：投資 / 利用 / 売上 / 評価
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

市場が事前に見ていた論点は、AI設備投資の大きさでした。大手クラウド各社はデータセンター、GPU、電力、ネットワークへ巨額の資金を使っています。支出した瞬間に利益が出るわけではなく、先に費用が増え、利用者と料金収入は後からついてきます。主要報道では、その時間差を越えて、支出が本当に収益へ変わるのかが繰り返し注目されていました。

実際に出たAWS売上は、市場予想を十六億六千万ドル上回りました。高いパソコンを買っただけでは課題の点数は上がりません。道具を使って成果を出して、初めて投資の意味が見えます。AWSの伸びは、その成果に近い数字でした。

つまり差は、投資額への不安が消えたことではありません。支出の回収を疑う材料だけだったところへ、売上成長という反対側の証拠が加わったことです。昨夜の中心仮説は、AI投資の評価軸が、金額から回収速度へ移った、です。

- ナレーションで示す出典主体：主要報道／市場予想
- Expectedの根拠区分：主要報道

## B5. Scene 5｜背景にあった世界の懸念

- 目的：強い経済指標から金利、NASDAQまでの向かい風を示す
- 因果の対象：nasdaq
- 狐の演技意図：因果の矢印を一つずつつなぐ
- 初期表情：警戒
- 画面モード：causal-diagram
- 大テロップ：強い景気は金利の理由にもなる
- 補助テロップ：米10年金利 約4.75%
- 根拠：Nasdaq掲載の市場記事
- 不確実性：記事の取引中水準であり公式日次系列と時点が異なる
- 前のSceneからの接続：ただし、株にとって都合のよい環境ではありませんでした。

### Visual Beats

- **scene-05-beat-001**
  - 開始合図：ただし、株にとって都合のよい環境では
  - 終了合図：ならないのが昨夜の難しいところです。
  - 主要視覚機能：Explain
  - 画面状態：Chart
  - Visual Template ID：causal-lane
  - Template Variant：left-to-right
  - 表示順：強い経済指標→長期金利上昇→成長株の評価圧力
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：s5-node-data→s5-node-yield→s5-node-growth
  - レーン名：not-required
  - 最終到達点：s5-node-growth
  - 画面の問い：強い景気がなぜ重荷か
  - 主要要素：経済指標から成長株まで
  - 視聴者向けテキスト：強い指標 / 金利上昇 / 評価圧力
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-05-beat-002**
  - 開始合図：米十年債利回りは市場記事で四・七五パ
  - 終了合図：い風の中で評価されたことになります。
  - 主要視覚機能：Evidence
  - 画面状態：Chart
  - Visual Template ID：tailwind-headwind
  - Template Variant：two-lane
  - 表示順：追い風と向かい風を同時比較
  - 比較基準：同一セッションの確認材料
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：追い風 / 向かい風
  - 最終到達点：NASDAQへの相殺結果
  - 画面の問い：向かい風の大きさは
  - 主要要素：雇用コストと米10年金利
  - 視聴者向けテキスト：ECI 0.9% / 米10年 約4.75%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

ただし、株にとって都合のよい環境ではありませんでした。雇用コスト指数は〇・九パーセントと予想の〇・八パーセントを上回り、シカゴの景況指数と消費者心理も予想より強い数字でした。強い景気は企業の需要を支える安心材料です。その一方で、賃金や需要が強ければ、インフレが下がりにくく、中央銀行が金利を急いで下げる必要も薄れます。良い景気の数字が、そのまま成長株の追い風にならないのが昨夜の難しいところです。

米十年債利回りは市場記事で四・七五パーセント近くまで上昇しました。成長株は将来の利益を現在価値へ割り引くため、金利上昇が重荷になりやすいです。AWSの好材料は、追い風だけの道を走ったのではなく、金利という向かい風の中で評価されたことになります。

- ナレーションで示す出典主体：Nasdaq掲載の市場記事

## B6. Scene 6｜市場はどう反応した？

- 目的：主役銘柄の直接材料とNASDAQ全体の支援・相殺材料を分ける
- 因果の対象：multiple
- 狐の演技意図：確認できる時間精度を守り、役割を整理する
- 初期表情：分析
- 画面モード：timeline
- 大テロップ：Amazonの直接材料はAWS
- 補助テロップ：金利とAppleが上昇を相殺
- 根拠：市場データ／Nasdaq掲載記事
- 不確実性：分足データがないため取引中の順序は記事の説明範囲に限定
- 前のSceneからの接続：時系列は細かく断定しません。

### Visual Beats

- **scene-06-beat-001**
  - 開始合図：時系列は細かく断定しません。入力には
  - 終了合図：じ日に金利の逆風が存在したことです。
  - 主要視覚機能：Evidence
  - 画面状態：Chart
  - Visual Template ID：evidence-boundary
  - Template Variant：confirmed-vs-unconfirmed
  - 表示順：確認できる→断定しない
  - 比較基準：取引区分と終値
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：確認できる / 断定しない
  - 最終到達点：not-required
  - 画面の問い：確認できる順序はどこまでか
  - 主要要素：取引区分と記事の説明
  - 視聴者向けテキスト：Amazon・半導体が支援 / 金利が上値を抑制
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-06-beat-002**
  - 開始合図：終値ではNasdaq Composi
  - 終了合図：金利上昇とApple安がありました。
  - 主要視覚機能：Compare
  - 画面状態：Data
  - Visual Template ID：index-return-bars
  - Template Variant：zero-baseline
  - 表示順：Composite→Nasdaq-100→SOXX
  - 比較基準：終値・共通ゼロ基準
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：指数と半導体は同じ強さか
  - 主要要素：主要指数の終値差
  - 視聴者向けテキスト：Composite +1.00% / Nasdaq-100 +0.60% / SOXX +0.07%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

時系列は細かく断定しません。入力には分足データがなく、確認できるのは取引区分と終値が中心です。市場記事では、Amazonと半導体株の強さで指数が上昇した一方、強い経済指標とタカ派的な発言で債券利回りが上がり、上げ幅を抑えたと説明されています。つまり、Amazon決算の後にNASDAQ全体が一直線で上がった、とまでは言えません。確認できるのは、Amazonの強い終値と、大型クラウド株の上昇、そして同じ日に金利の逆風が存在したことです。

終値ではNasdaq Compositeが一・〇〇パーセント高。Nasdaq-100は記事で〇・六〇パーセント高でした。一方、SOXXは〇・〇七パーセント高にとどまりました。Amazonの直接材料はAWSです。NASDAQ全体の支援材料は大型クラウド株の上昇。増幅ではなく相殺側に、金利上昇とApple安がありました。

- ナレーションで示す出典主体：市場データ／Nasdaq掲載記事
- 時系列の根拠：取引区分と終値。分足データなし。

## B7. Scene 7｜銘柄の明暗

- 目的：AmazonとApple、半導体内の差で仮説の限界を示す
- 因果の対象：multiple
- 狐の演技意図：比較をランキングにせず評価軸へ戻す
- 初期表情：困惑
- 画面モード：text-focus
- 大テロップ：AmazonとAppleの明暗
- 補助テロップ：半導体内も分裂
- 根拠：当日の市場データ／Nasdaq掲載記事
- 不確実性：一日の反応だけで長期的な選別を断定しない
- 前のSceneからの接続：反対側の代表がAppleです。

### Visual Beats

- **scene-07-beat-001**
  - 開始合図：反対側の代表がAppleです。固定ウ
  - 終了合図：on一社だけへ絞ることはできません。
  - 主要視覚機能：Compare
  - 画面状態：EntityFocus
  - Visual Template ID：entity-card-full
  - Template Variant：prebuilt-card
  - 表示順：Appleカード
  - 比較基準：not-required
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：相殺要因の代表は誰か
  - 主要要素：Apple企業カード
  - 視聴者向けテキスト：Apple / 端末とサービスの生態系
  - 使用アセット：scene-07-placement-aapl
  - アセット状態：ready
  - 表示後の復帰先：Data
  - 採用経路：not-required
- **scene-07-beat-002**
  - 開始合図：ここで見えるのは、単純な大型テック全
  - 終了合図：えた内容の差が株価へ強く表れました。
  - 主要視覚機能：Compare
  - 画面状態：Data
  - Visual Template ID：diverging-stock-bars
  - Template Variant：center-zero
  - 表示順：Amazon→Apple→NVIDIA→AMD
  - 比較基準：前日比・中央ゼロ
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：期待への答えで明暗
  - 画面の問い：評価軸はどこへ表れたか
  - 主要要素：大型テックと半導体の明暗
  - 視聴者向けテキスト：Amazon +15.32% / Apple -7.35% / NVIDIA +2.93% / AMD -1.90%
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

反対側の代表がAppleです。固定ウォッチの市場データでは七・三五パーセント下落しました。市場記事では、サービス売上が三百七億四千万ドルで、予想の三百十三億六千万ドルを下回り、中国売上も予想未達だったとされています。Appleは指数への影響が大きい大型株です。そのAppleが沈んでもNASDAQが上昇したことは、Amazonと他の大型クラウド株の支えが無視できなかったことを示します。ただし、Apple安を完全に打ち消した原因をAmazon一社だけへ絞ることはできません。

ここで見えるのは、単純な大型テック全面高ではありません。Amazonは回収の証拠で上昇。Appleは重要事業の予想未達で下落。NVIDIAは二・九三パーセント高でしたが、AMDは一・九〇パーセント安です。一日の値動きだけで長期的な勝者を決めることはできませんが、昨夜は期待へ答えた内容の差が株価へ強く表れました。

- ナレーションで示す出典主体：当日の市場データ／Nasdaq掲載記事

## B8. Scene 8｜今夜の検証

- 目的：仮説が強まる条件と弱まる条件を具体化する
- 因果の対象：multiple
- 狐の演技意図：視聴者と一緒に確認する姿勢で締める
- 初期表情：通常
- 画面モード：verification-points
- 大テロップ：クラウド・金利・半導体
- 補助テロップ：三つがそろうか
- 根拠：当日の市場データと中心仮説
- 不確実性：将来の株価方向は予測しない
- 前のSceneからの接続：次に確認するポイントは三つです。

### Visual Beats

- **scene-08-beat-001**
  - 開始合図：次に確認するポイントは三つです。一つ
  - 終了合図：型クラウド株の上昇へ追いつくかです。
  - 主要視覚機能：Verify
  - 画面状態：Data
  - Visual Template ID：verification-checklist
  - Template Variant：default
  - 表示順：クラウド→金利→半導体
  - 比較基準：今後の確認条件
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：not-required
  - 画面の問い：今夜は何を見るか
  - 主要要素：三つの検証カード
  - 視聴者向けテキスト：クラウド売上 / 米10年金利 / 半導体への波及
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required
- **scene-08-beat-002**
  - 開始合図：クラウド売上が続き、金利が落ち着き、
  - 終了合図：げるのは早い、という判断になります。
  - 主要視覚機能：Verify
  - 画面状態：Chart
  - Visual Template ID：verification-matrix
  - Template Variant：strengthen-vs-weaken
  - 表示順：強まる条件→弱まる条件
  - 比較基準：中心仮説
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：s8-node-cloud→s8-node-yield→s8-node-semi→s8-node-hyp
  - レーン名：強まる / 弱まる
  - 最終到達点：s8-node-hyp
  - 画面の問い：何がそろえば仮説は強まるか
  - 主要要素：検証条件の因果図
  - 視聴者向けテキスト：売上継続 / 金利安定 / 半導体波及
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

次に確認するポイントは三つです。一つ目は、Amazon以外のクラウド企業でも、AI投資と売上成長が同時に続くか。二つ目は、米十年債利回りが四・七パーセント台でさらに上がるか。三つ目は、半導体が大型クラウド株の上昇へ追いつくかです。

クラウド売上が続き、金利が落ち着き、半導体にも上昇が広がれば、昨夜の仮説は強まります。反対に、金利上昇が続き、SOXや関連銘柄が弱いままなら、Amazon一社の好決算をNASDAQ全体の持続的な追い風へ広げるのは早い、という判断になります。

- ナレーションで示す出典主体：当日の市場データと中心仮説

## B9. Scene 9｜いってらっしゃい、おやすみ

- 目的：結論を一文で再確認し固定エンディングへつなぐ
- 因果の対象：nasdaq
- 狐の演技意図：穏やかに短く締める
- 初期表情：通常
- 画面モード：conclusion-card
- 大テロップ：投資額より回収
- 補助テロップ：いってらっしゃい、おやすみ
- 根拠：朝のNASDAQカフェ
- 不確実性：該当なし
- 前のSceneからの接続：昨夜の答えは、AI投資の額ではなく、回収を示せたかでした。

### Visual Beats

- **scene-09-beat-001**
  - 開始合図：昨夜の答えは、AI投資の額ではなく、
  - 終了合図：。こちらはそろそろ、おやすみなさい。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Template ID：closing-recap
  - Template Variant：default
  - 表示順：AWS予想超過→金利逆風→半導体限定→結論
  - 比較基準：本編既出事項
  - 入力データの根拠：当該Scene記載の根拠・時系列範囲
  - ノード順：not-required
  - レーン名：not-required
  - 最終到達点：投資額より回収
  - 画面の問い：今朝の答えは何か
  - 主要要素：結論カード
  - 視聴者向けテキスト：投資額より回収
  - 使用アセット：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - 採用経路：not-required

### 完成ナレーション

昨夜の答えは、AI投資の額ではなく、回収を示せたかでした。以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。

- ナレーションで示す出典主体：朝のNASDAQカフェ

## C. タイトル

- 推奨案：Amazon急騰でも半導体は横ばい　NASDAQが見たAI投資の答え
- 候補2：NASDAQ＋1％　市場が評価したのはAI投資額ではなく回収
- 候補3：Apple急落を飲み込んだAmazon決算の本当の意味

## D. サムネイル文言

- 推奨案：投資額より回収
- 候補2：AWSが答えを出した
- 候補3：上がったのは全部じゃない

## E. 概要欄

昨夜のNasdaq Compositeは1.00%上昇し、Amazonは15.32%急騰しました。AWS売上が市場予想を上回り、AI設備投資が売上へつながる証拠として評価された一方、米長期金利は上昇し、Appleは大幅安、SOXXは0.07%高にとどまりました。Amazonの直接材料とNASDAQ全体の支援材料、半導体への限定的な波及を分けて確認します。今後はクラウド売上、米10年債利回り、半導体への広がりを見ます。本動画はニュース解説であり、個別銘柄の売買を勧めるものではありません。

## F. 制作上の注意

- 早朝カフェ背景を全Sceneで固定する。
- 狐は左端の定位置を維持し、表情だけを切り替える。
- AmazonカードはScene 2、AppleカードはScene 7で5〜8秒表示し、直後のData画面へ戻す。
- カードをチャートやExpected / Actual / Gapへ重ねない。
- 当日固有画像は不要。画像生成を行わない。
- Scene 6で分足の反転時刻を作らない。
- Amazonの直接材料とNASDAQ全体の支援材料を混同しない。
- TTSはScene 1〜4とScene 5〜9の二ブロックに固定する。
- preview生成後の見た目はユーザーが確認する。AIによる完成動画の視覚採点は行わない。
- 正式validatorが失敗した場合は、示されたJSON Pathだけを修正し、台本の意味を変えない。

## G. 使用情報源

- Daily Source Package 2026-07-31（市場データ、固定ウォッチ、全文取得記事）
- Nasdaq / Barchart「Stocks Finish Higher as Amazon Leads Megacaps Higher」
- Nasdaq / Barchart「Stock Indexes Supported as Amazon Earnings Bolster Tech Stocks」

## H. 04 興味深さ・わかりやすさ審問結果

### 判定
合格（repository正式validator pass、実測尺を明示的な短縮回として反映）

### 得点
- 冒頭の引力：5/5
- ストーリーの進展：5/5
- 興味深さと発見：5/5
- わかりやすさ：5/5
- 狐らしさ：4/5
- 最後まで見る理由：4/5
- 合計：28/30

### 最大の離脱候補
- Scene：5
- 理由：経済指標と金利の説明が続き、Amazonとの接続が薄く見える可能性。

### 必須修正と反映結果
- Scene 5の末尾を、AWSが金利の向かい風の中で評価された意味へ戻した。
- Scene 7を値動き一覧ではなく、期待への答えの差として再構成した。

### タイトル・サムネイルの約束と回収
一致。Scene 4で「投資額より回収」を説明し、Scene 6〜7で波及と限界を確認する。

### Visual Beat・アセット完成ゲート
- 素材探索証跡：pass
- 固定背景：pass
- 画面構成表：pass
- 画面状態種類数：3
- 非分析画面Beat数：2
- 前半の大きな画面変化：pass
- 後半の大きな画面変化：pass
- 最長同一画面状態連続数：3
- 主役カード：pass
- カード計画：pass
- 絵本たとえ：not-required
- アセット状態：pass
- asset_manifest整合：pass
- 当日固有素材の同梱：not-required
- 画像依頼：なし
- Primary完成：not-required
- Approved Fallback完成：not-required
- 生成試行結果：not-run
- 選択経路：not-required
- TTS固定2ブロック：pass
- AI視覚検査なし：pass
- 軽量機械チェック：ローカル構造検査pass
- 音声専用台本：pass
- render_spec repository正式validator：pass
- episode_package・render_spec整合：pass
- 非採用経路の除外：pass
- 制作情報の非表示：pass

### GitHub Actionsへ渡してよいか
可（repository正式validator pass、Charon実測403.2秒を明示的な短縮回として反映済み）。

<!-- VISUAL_STORY_ENGINE_V2_START -->
## Visual Story Engine v2 実装正本

この節は `render-specs/2026-07-31/render_spec.json` から機械生成する。市場因果、ナレーション、字幕、数字、Scene順を再判断せず、確定済みの画面テンプレート、表示順、Motion、完成保持、結果強調だけを記録する。

- 入力スキーマ：`2.2.0`
- Renderer：`NasdaqCafeSpec / VisualTemplateRenderer`
- 外部コード動的読込：なし
- 表示順の正本：`visualEvents`。互換Fallbackが指定された場合だけ`objectIds`順
- TTSへの影響：なし。Visual Story変更はTTS identityへ含めない
- final：preview目視確認後、ユーザーの明示依頼がある場合だけ

| Scene | Beat | visualTemplate | Variant | sequencePolicy | finalHold | 表示順とMotion | 結果強調 |
|---|---|---|---|---|---:|---|---|
| Scene 1 | scene-01-beat-001 | opening-contradiction | default | explicit | 900ms | s1-card-main［rise-soft／560ms］ | s1-card-main［focus-ring］ |
| Scene 1 | scene-01-beat-002 | text-focus | default | static | 500ms | 完成状態 | なし |
| Scene 2 | scene-02-beat-001 | hero-number | prebuilt-card | explicit | 750ms | s2-number-amzn［count-up／760ms］ → s2-number-amzn［count-up／760ms］ | なし |
| Scene 2 | scene-02-beat-002 | diverging-stock-bars | center-zero | explicit | 500ms | s2-number-amzn［count-up／760ms］ → s2-number-amzn［count-up／760ms］ → s2-number-soxx［count-up／760ms］ → s2-number-amd［count-up／760ms］ | s2-number-amd［focus-ring］ |
| Scene 3 | scene-03-beat-001 | expected-actual-bullet | zero-baseline | explicit | 750ms | s3-number-aws［count-up／760ms］ → s3-number-gap［count-up／760ms］ | s3-number-gap［focus-ring］ |
| Scene 3 | scene-03-beat-002 | metric-comparison-board | default | explicit | 500ms | s3-number-amzn［count-up／680ms］ → s3-number-googl［count-up／680ms］ | s3-number-googl［focus-ring］ |
| Scene 4 | scene-04-beat-001 | expected-actual-gap-flow | left-to-right | explicit | 900ms | s4-card-expected［rise-soft／560ms］ → s4-card-actual［rise-soft／560ms］ → s4-card-gap［rise-soft／560ms］ | s4-card-gap［focus-ring］ |
| Scene 4 | scene-04-beat-002 | analogy-steps | left-to-right | static | 500ms | 完成状態 | なし |
| Scene 4 | scene-04-beat-003 | causal-lane | left-to-right | explicit | 900ms | s4-node-spend［scale-settle／620ms］ → s4-node-cloud［scale-settle／620ms］ → s4-node-revenue［scale-settle／620ms］ → s4-node-valuation［scale-settle／620ms］ → s4-arrow-1［draw-line／720ms］ → s4-arrow-2［draw-line／720ms］ → s4-arrow-3［draw-line／720ms］ | s4-arrow-3［focus-ring］ |
| Scene 5 | scene-05-beat-001 | causal-lane | left-to-right | explicit | 900ms | s5-node-data［scale-settle／620ms］ → s5-node-yield［scale-settle／620ms］ → s5-node-growth［scale-settle／620ms］ → s5-arrow-1［draw-line／720ms］ → s5-arrow-2［draw-line／720ms］ | s5-arrow-2［focus-ring］ |
| Scene 5 | scene-05-beat-002 | tailwind-headwind | two-lane | explicit | 750ms | s5-number-eci［count-up／680ms］ → s5-number-yield［count-up／680ms］ | s5-number-yield［focus-ring］ |
| Scene 6 | scene-06-beat-001 | evidence-boundary | confirmed-vs-unconfirmed | static | 500ms | 完成状態 | なし |
| Scene 6 | scene-06-beat-002 | split-comparison | two-lane | explicit | 750ms | s6-number-comp［count-up／760ms］ → s6-number-ndx［count-up／760ms］ → s6-number-soxx［count-up／760ms］ | s6-number-soxx［focus-ring］ |
| Scene 7 | scene-07-beat-001 | entity-card-full | prebuilt-card | static | 500ms | 完成状態 | なし |
| Scene 7 | scene-07-beat-002 | focus-matrix | default | explicit | 750ms | s7-number-amzn［count-up／760ms］ → s7-number-aapl［count-up／760ms］ → s7-number-nvda［count-up／760ms］ → s7-number-amd［count-up／760ms］ | s7-number-amd［focus-ring］ |
| Scene 8 | scene-08-beat-001 | verification-checklist | default | explicit | 500ms | s8-card-checks［rise-soft／560ms］ | s8-card-checks［focus-ring］ |
| Scene 8 | scene-08-beat-002 | verification-matrix | strengthen-vs-weaken | explicit | 750ms | s8-node-cloud［scale-settle／620ms］ → s8-node-yield［scale-settle／620ms］ → s8-node-semi［scale-settle／620ms］ → s8-node-hyp［scale-settle／620ms］ → s8-arrow-1［draw-line／720ms］ → s8-arrow-2［draw-line／720ms］ → s8-arrow-3［draw-line／720ms］ | s8-node-hyp［focus-ring］ |
| Scene 9 | scene-09-beat-001 | final-assembly | left-to-right | explicit | 1000ms | s9-card-close［rise-soft／560ms］ | s9-card-close［focus-ring］ |

### 整合確認

- Scene数：9
- Visual Beat数：18
- 未解決sequencePolicy：0
- 未解決finalHoldMs：0
- 明示showイベント対象数：42
- Motion指定イベント数：55
- 最終採用経路：既存episode packageとrender_specに記録された採用経路を維持し、非採用経路を追加しない
<!-- VISUAL_STORY_ENGINE_V2_END -->
