# 朝のNASDAQカフェ｜2026-08-10 制作パッケージ

## A. エピソード概要

- 対象米国市場日：2026-08-07
- 主役ニュース：7月米雇用統計の大幅下振れとNASDAQ上昇
- ストーリーの背骨：雇用予想+8万人→実際-2.3万人→利上げ観測後退→8:30 ETにQQQ・SOXX・NVIDIAが上向き→大型テックへの金利逆風緩和→Microchip好決算と原油・利回り低下が増幅→NASDAQ +1.30%、ただし1分足は因果証明ではなく個別差を残す。
- 中心仮説：7月雇用統計の大幅下振れは成長不安よりも次回利上げリスク低下として大型テックに先に評価され、Microchip好決算と原油・利回り低下が半導体・NASDAQ上昇を増幅した。
- 確信度：medium
- Expected：Reuters集計の7月非農業部門雇用者数予想 +8万人
- Actual：BLS発表の7月非農業部門雇用者数 -2.3万人
- Gap：Expected +8万人に対しActual -2.3万人、Gap -10.3万人
- 重要な反対材料：雇用減は景気減速リスクでもある。 / AMD -1.21%、Alphabet -0.96%でテック全面高ではない。 / 原油・利回り低下と好決算も同日に存在した。 / 8:30 ETの1分足はQQQ・SOXX・NVIDIAで上向いたが、1分足だけでは雇用統計が原因と証明できず、MCHPは同じ1分ではほぼ横ばいだった。
- 主因候補：次回会合の利上げ確率 約44%へ低下
- 増幅要因：Microchipの予想超え実績・次四半期見通し / MCHP +13.89% / 原油・インフレ懸念後退と米国債利回り低下 / 好調な決算シーズン
- 相殺・反対材料：雇用減そのものが示す成長不安 / AMD -1.21% / Alphabet -0.96% / MCHPは8:30 ETの同じ1分ではほぼ横ばい
- Visual Evidence Planning：実施済み。BLSとMicrochip IRは根拠として保持し、画面上はFinancial/Data Visualの方が理解しやすいため当日固有画像はnot-required。
- Primary / Approved Fallback：not-required。画像経路を使わないため未解決状態なし。

### 画面構成表

- Scene 1｜寝ている間に何が起きた？｜opening-contradiction → hero-number
- Scene 2｜今朝の矛盾｜hero-number → text-focus
- Scene 3｜Expected / Actual / Gap｜expected-actual-gap-flow → text-focus
- Scene 4｜採点表が変わった｜expected-actual-gap-flow → evidence-boundary
- Scene 5｜世界からNASDAQへの経路｜hero-number → text-focus
- Scene 6｜半導体で増幅｜event-reaction-timeline → market-pulse-grid
- Scene 7｜反対材料と銘柄差｜diverging-stock-bars → text-focus
- Scene 8｜どこまで言える？｜verification-matrix → verification-checklist
- Scene 9｜いってらっしゃい、おやすみ｜closing-recap → closing-recap

## Scene 1｜寝ている間に何が起きた？

- 目的：方向、矛盾、中心仮説を30秒以内に提示する
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：multiple
- 狐の演技意図：驚きを短く置き、悪い雇用と株高の矛盾へ視線を固定する
- 狐の表情：軽い驚き
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：conclusion-card
- Headline：主因は一つ、追い風は複数
- Headline：雇用 -2.3万人
- Headline：NASDAQ +1.30%
- 前後の接続文：opening

### Visual Beats

<!--VISUAL_BEAT:scene-01:vb-01-01-->
- **scene-01-beat-001**
  - 開始合図：おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところ
  - 終了合図：ころが7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人です。景気にはかなり弱い。それでもテックは上がりました。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Grammar：contradiction / major-shift
  - Visual Template ID：opening-contradiction
  - Template Variant：default
  - 入力構造：雇用 -2.3万人 / 予想 +8万人 / NASDAQ +1.30%
  - 画面の問い：昨夜の矛盾は何か
  - 主要要素：雇用悪化とNASDAQ上昇
  - 視聴者向けテキスト：雇用 -2.3万人 / 予想 +8万人 / NASDAQ +1.30%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-002, source-003

<!--VISUAL_BEAT:scene-01:vb-01-02-->
- **scene-01-beat-002**
  - 開始合図：まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると
  - 終了合図：風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：hero-number
  - Template Variant：default
  - 入力構造：悪い雇用→株高？ / 見るべきは利上げ観測
  - 画面の問い：利上げ観測だけで半導体まで説明できる？
  - 主要要素：暫定解：利上げ観測後退 / 未解決：1銘柄の初動
  - 視聴者向けテキスト：暫定解：利上げ観測後退 / 次の検証：8:30 ETの銘柄別初動
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

### 完成ナレーション

おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところが7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人です。景気にはかなり弱い。それでもテックは上がりました。まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。

- ナレーションで示す出典主体・媒体：当日の市場データ / BLS / Reuters
- 大テロップ：雇用 -2.3万人、それでもNASDAQ +1.30%
- 補助テロップ：SOXX +2.02% / 予想は+8万人
- 使用する数字：NASDAQ +1.30%、SOXX +2.02%、雇用 -2.3万人、予想 +8万人
- 画面で見せる内容：SOXX +2.02% / 雇用 -2.3万人 / 予想 +8万人
- 根拠：当日の市場データ / BLS / Reuters
- 不確実性：8:30 ETの初動は後段で確認するが、1分足だけでは因果は証明できない

## Scene 2｜今朝の矛盾

- 目的：雇用の弱さが一行だけではないことをBLSの確認済み事実で示す
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：macro
- 狐の演技意図：落ち着いてBLSの数字を確認し、景気側の弱さを過小評価しない
- 狐の表情：分析
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：conclusion-card
- 前後の接続文：数字が本当に弱かったのか、BLSの確認済み事実へ進みます。

### Visual Beats

<!--VISUAL_BEAT:scene-02:vb-02-01-->
- **scene-02-beat-001**
  - 開始合図：BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月
  - 終了合図：。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月の雇用増も、合わせて十・三万人下方修正されました。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Grammar：evidence / major-shift
  - Visual Template ID：metric-comparison-board
  - Template Variant：default
  - 入力構造：雇用 -2.3万人 / 失業率 4.1%
  - 画面の問い：BLSは何を確認したか
  - 主要要素：7月雇用の確認済み事実
  - 視聴者向けテキスト：雇用 -2.3万人 / 失業率 4.1%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-002

<!--VISUAL_BEAT:scene-02:vb-02-02-->
- **scene-02-beat-002**
  - 開始合図：つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。
  - 終了合図：つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。
  - 主要視覚機能：Compare
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：evidence-boundary
  - Template Variant：confirmed-vs-unconfirmed
  - 入力構造：5月・6月 改定 -10.3万人 / NASDAQ +1.30%
  - 画面の問い：弱さは一回だけか
  - 主要要素：過去2か月の下方修正
  - 視聴者向けテキスト：5月・6月 改定 -10.3万人 / NASDAQ +1.30%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-002

### 完成ナレーション

BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月の雇用増も、合わせて十・三万人下方修正されました。つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。

- ナレーションで示す出典主体・媒体：BLS
- 大テロップ：弱さは一行だけではない
- 補助テロップ：失業率4.1% / 5月・6月も合計10.3万人下方修正
- 使用する数字：-2.3万人、4.1%、-10.3万人
- 画面で見せる内容：失業率 4.1% / 5月・6月 合計-10.3万人改定
- 根拠：BLS
- 不確実性：株価への影響をBLSだけで断定しない

## Scene 3｜Expected / Actual / Gap

- 目的：発表前期待とActualの差を数値で固定する
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：macro
- 狐の演技意図：数字の差を一度きれいに見せ、解釈を後ろへ送る
- 狐の表情：分析
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：number-comparison
- Headline：全面高ではない
- Headline：Gap -10.3万人
- 前後の接続文：弱さを確認したので、次に発表前の期待との差を測ります。

### Visual Beats

<!--VISUAL_BEAT:scene-03:vb-03-01-->
- **scene-03-beat-001**
  - 開始合図：それでも引けではNasdaq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パ
  - 終了合図：daq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パーセント上がりました。
  - 主要視覚機能：Evidence
  - 画面状態：Chart
  - Visual Grammar：gap / major-shift
  - Visual Template ID：expected-actual-gap-flow
  - Template Variant：default
  - 入力構造：Expected +8万人 / Actual -2.3万人 / Gap -10.3万人
  - 画面の問い：予想からどれだけ外れたか
  - 主要要素：Expected / Actual / Gap
  - 視聴者向けテキスト：Expected +8万人 / Actual -2.3万人 / Gap -10.3万人
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-002, source-003

<!--VISUAL_BEAT:scene-03:vb-03-02-->
- **scene-03-beat-002**
  - 開始合図：雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです
  - 終了合図：用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：metric-comparison-board
  - Template Variant：default
  - 入力構造：予想差 -10.3万人 / 過去2か月改定 -10.3万人 / 意味は別の数字
  - 画面の問い：同じ-10.3万人でも何が違うか
  - 主要要素：予想差と過去改定を分離
  - 視聴者向けテキスト：予想差 -10.3万人 / 過去2か月改定 -10.3万人 / 意味は別の数字
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-002, source-003

### 完成ナレーション

それでも引けではNasdaq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パーセント上がりました。雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。

- ナレーションで示す出典主体・媒体：BLS / Reuters
- 大テロップ：Expected +8万人 / Actual -2.3万人
- 補助テロップ：Gap -10.3万人
- 使用する数字：+8万人、-2.3万人、Gap -10.3万人
- 画面で見せる内容：Expected +8万人 / Actual -2.3万人
- 根拠：BLS / Reuters
- 不確実性：Reuters予想は公式コンセンサスではない

## Scene 4｜採点表が変わった

- 目的：弱い雇用が利上げ観測後退へ変換された市場解釈を示す
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：nasdaq
- 狐の演技意図：矛盾が解けるTurnとして少しニヤリとする
- 狐の表情：分析
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：expected-actual-gap
- Headline：利上げ確率 約44%
- 前後の接続文：大きな下振れなのに株が上がった理由を、金利の採点表で解きます。

### Visual Beats

<!--VISUAL_BEAT:scene-04:vb-04-01-->
- **scene-04-beat-001**
  - 開始合図：期待との差はかなり大きいです。Expectedはプラス八万人。Actualはマイナス二・三万人。Gapはマイナス十・三万人でした
  - 終了合図：でした。ところが次回Fed会合の利上げ確率は約四十四パーセントまで低下。前日は五十五パーセント、一週間前は六十七パーセントです。
  - 主要視覚機能：Evidence
  - 画面状態：Chart
  - Visual Grammar：gap / major-shift
  - Visual Template ID：expected-actual-gap-flow
  - Template Variant：default
  - 入力構造：1週前 67% / 前日 55% / 8月7日 約44%
  - 画面の問い：Expected / Actual / Gapは？
  - 主要要素：Expected → Actual → Gap
  - 視聴者向けテキスト：Expected +8万人 / Actual -2.3万人 / Gap -10.3万人
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

<!--VISUAL_BEAT:scene-04:vb-04-02-->
- **scene-04-beat-002**
  - 開始合図：Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『
  - 終了合図：な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：analogy / continuation
  - Visual Template ID：analogy-steps
  - Template Variant：left-to-right
  - 入力構造：確認済み：利上げ確率は低下 / 解釈：金利逆風が和らいだ
  - 画面の問い：同じ悪材料でも採点表が違うと何が変わる？
  - 主要要素：景気の採点表 → 金利の採点表 → 大型テック
  - 視聴者向けテキスト：景気の採点表：赤点 / 金利の採点表：利上げリスク↓ / 大型テック：逆風が和らぐ
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

### 完成ナレーション

期待との差はかなり大きいです。Expectedはプラス八万人。Actualはマイナス二・三万人。Gapはマイナス十・三万人でした。ところが次回Fed会合の利上げ確率は約四十四パーセントまで低下。前日は五十五パーセント、一週間前は六十七パーセントです。Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。

- ナレーションで示す出典主体・媒体：Reuters
- 大テロップ：市場が見たのは利上げリスク
- 補助テロップ：利上げ確率 67%→55%→約44%
- 使用する数字：44%、55%、67%
- 画面で見せる内容：前日 55% / 1週前 67%
- 根拠：Reuters
- 不確実性：利上げ確率は市場推計でFedの確定方針ではない

## Scene 5｜世界からNASDAQへの経路

- 目的：雇用以外の原油・利回り・決算を増幅要因として分離する
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：global
- 狐の演技意図：主因をぼかさず、舞台装置が複数あることを短く整理する
- 狐の表情：分析
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：conclusion-card
- 前後の接続文：主因候補が見えたので、同じ日に重なった世界の追い風を分離します。

### Visual Beats

<!--VISUAL_BEAT:scene-05:vb-05-01-->
- **scene-05-beat-001**
  - 開始合図：ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回り
  - 終了合図：きれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Grammar：causal / major-shift
  - Visual Template ID：tailwind-headwind
  - Template Variant：two-lane
  - 入力構造：原油・インフレ懸念↓ / 米国債利回り↓
  - 画面の問い：雇用以外の追い風は何か
  - 主要要素：原油・利回りの支援
  - 視聴者向けテキスト：原油・インフレ懸念↓ / 米国債利回り↓
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

<!--VISUAL_BEAT:scene-05:vb-05-02-->
- **scene-05-beat-002**
  - 開始合図：企業決算も強めです。ここは主役ではありません。
  - 終了合図：企業決算も強めです。ここは主役ではありません。
  - 主要視覚機能：Explain
  - 画面状態：Chart
  - Visual Grammar：causal / continuation
  - Visual Template ID：causal-lane
  - Template Variant：left-to-right
  - 入力構造：雇用大幅下振れ / 利上げ観測↓ / 大型テックの逆風↓
  - 画面の問い：雇用からNASDAQへどう届くか
  - 主要要素：雇用→利上げ観測→テック
  - 視聴者向けテキスト：雇用大幅下振れ / 利上げ観測↓ / 大型テックの逆風↓
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-002, source-003

<!--VISUAL_BEAT:scene-05:vb-05-03-->
- **scene-05-beat-003**
  - 開始合図：雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。
  - 終了合図：雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。
  - 主要視覚機能：Explain
  - 画面状態：Data
  - Visual Grammar：bridge-text / continuation
  - Visual Template ID：text-focus
  - Template Variant：default
  - 入力構造：主因候補：雇用→金利 / 増幅：原油・決算
  - 画面の問い：主因と増幅をどう分けるか
  - 主要要素：単因モデルを避ける
  - 視聴者向けテキスト：主因候補：雇用→金利 / 増幅：原油・決算
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

### 完成ナレーション

ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。企業決算も強めです。ここは主役ではありません。雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。

- ナレーションで示す出典主体・媒体：Reuters
- 大テロップ：主因は一つ、追い風は複数
- 補助テロップ：原油・インフレ懸念↓ / 米国債利回り↓ / 好決算
- 使用する数字：なし
- 画面で見せる内容：原油・インフレ懸念↓ / 米国債利回り↓ / 好決算
- 根拠：Reuters
- 不確実性：各要因の寄与度は分離できない

## Scene 6｜半導体で増幅

- 目的：Microchip好決算が半導体上昇を増幅したことを示す
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：sector
- 狐の演技意図：Microchipを主因に昇格させず、セクター増幅として扱う
- 狐の表情：軽い驚き
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：timeline
- Headline：MCHP +13.89%
- 前後の接続文：マクロの追い風が半導体でどう増幅されたか、Microchipを見ます。

### Visual Beats

<!--VISUAL_BEAT:scene-06:vb-06-01-->
- **scene-06-beat-001**
  - 開始合図：ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDI
  - 終了合図：ら542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。
  - 主要視覚機能：Explain
  - 画面状態：Chart
  - Visual Grammar：reaction / major-shift
  - Visual Template ID：event-reaction-timeline
  - Template Variant：verified-series
  - 入力構造：08:30 ET BLS発表 / 利上げ確率 約44% / 引け NASDAQ +1.30%
  - 画面の問い：BLS 08:30 ET前後、QQQはどう動いた？
  - 主要要素：QQQ 実1分足 08:29→08:30→08:31
  - 視聴者向けテキスト：QQQ 実1分足 / 08:29 719.16 → 08:30 720.23 → 08:31 720.531
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-002, source-003

<!--VISUAL_BEAT:scene-06:vb-06-02-->
- **scene-06-beat-002**
  - 開始合図：ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱う
  - 終了合図：せん。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。
  - 主要視覚機能：Explain
  - 画面状態：Chart
  - Visual Grammar：reaction / continuation
  - Visual Template ID：index-return-bars
  - Template Variant：zero-baseline
  - 入力構造：SOXX +2.02% / MCHP +13.89% / NVIDIA +2.27%
  - 画面の問い：同じ1分で4銘柄は同じ反応だった？
  - 主要要素：08:29→08:30 ET 1分リターン
  - 視聴者向けテキスト：QQQ / SOXX / NVIDIA は上向き / MCHP は -0.025%でほぼ横ばい / 1分足だけでは因果証明しない
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-004

### 完成ナレーション

ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。

- ナレーションで示す出典主体・媒体：当日の市場データ / Reuters / Microchip IR
- 大テロップ：MCHP +13.89%が半導体を増幅
- 補助テロップ：SOXX +2.02% / NVIDIA +2.27%
- 使用する数字：14.85億ドル、0.76ドル、15.89億〜16.18億ドル、MCHP +13.89%、SOXX +2.02%、NVIDIA +2.27%
- 画面で見せる内容：SOXX +2.02% / NVIDIA +2.27%
- 根拠：当日の市場データ / Reuters / Microchip IR
- 不確実性：MCHP一社でSOXX全体を説明しない

## Scene 7｜反対材料と銘柄差

- 目的：逆行銘柄で単純な全面高ストーリーを壊す
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：multiple
- 狐の演技意図：説明を自分で壊しにいく調子で過剰一般化を止める
- 狐の表情：困惑
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：number-comparison
- 前後の接続文：ここで逆行銘柄を見て、説明を壊しにいきます。

### Visual Beats

<!--VISUAL_BEAT:scene-07:vb-07-01-->
- **scene-07-beat-001**
  - 開始合図：Microchipには会社固有の材料がありました。Q1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売
  - 終了合図：・八九億から十六・一八億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で十三・八九パーセント高でした。
  - 主要視覚機能：Compare
  - 画面状態：News
  - Visual Grammar：evidence / major-shift
  - Visual Template ID：news-media
  - Template Variant：default
  - 入力構造：MCHP +13.89% / AMD -1.21% / Alphabet -0.96%
  - 画面の問い：Microchipは何を発表した？
  - 主要要素：Microchip Q1 FY27 公式IR
  - 視聴者向けテキスト：Microchip Q1 FY27 公式IR / 売上 14.85億ドル / 非GAAP EPS 0.76ドル / 次四半期売上 15.89億〜16.18億ドル
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-004

<!--VISUAL_BEAT:scene-07:vb-07-02-->
- **scene-07-beat-002**
  - 開始合図：一方でAMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばい。つまり半導体高に
  - 終了合図：まり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。
  - 主要視覚機能：Compare
  - 画面状態：Chart
  - Visual Grammar：comparison / continuation
  - Visual Template ID：diverging-stock-bars
  - Template Variant：center-zero
  - 入力構造：広い金利追い風 / 個別材料で差 / Microsoft +0.03%
  - 画面の問い：同じテックでも終日は同じ方向だった？
  - 主要要素：MCHP +13.89% / AMD・Alphabetは下落
  - 視聴者向けテキスト：MCHP +13.89% / AMD -1.21% / Alphabet -0.96% / Microsoft +0.03%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-003

### 完成ナレーション

Microchipには会社固有の材料がありました。Q1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で十三・八九パーセント高でした。一方でAMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばい。つまり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。

- ナレーションで示す出典主体・媒体：当日の市場データ
- 大テロップ：全面高ではない
- 補助テロップ：AMD -1.21% / Alphabet -0.96% / MSFT +0.03%
- 使用する数字：MCHP +13.89%、AMD -1.21%、Alphabet -0.96%、Microsoft +0.03%
- 画面で見せる内容：AMD -1.21% / Alphabet -0.96% / MSFT +0.03%
- 根拠：当日の市場データ
- 不確実性：個別材料を完全分離していない

## Scene 8｜どこまで言える？

- 目的：発表時刻の実分足と個別差を残して、安全な結論の境界を示す
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：multiple
- 狐の演技意図：結論を曖昧にせず、時系列で確認できたことと因果として断定しないことを分ける
- 狐の表情：分析
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：verification
- Headline：言える / 言わない
- 前後の接続文：最後に発表時刻の実分足と個別差まで残して、結論の境界を引きます。

### Visual Beats

<!--VISUAL_BEAT:scene-08:vb-08-01-->
- **scene-08-beat-001**
  - 開始合図：最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型
  - 終了合図：。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：verification / major-shift
  - Visual Template ID：verification-matrix
  - Template Variant：strengthen-vs-weaken
  - 入力構造：8:30 ETの実分足 / MCHPの逆方向初動 / 1分足は因果証明ではない
  - 画面の問い：マクロ仮説を強める材料と弱める材料は？
  - 主要要素：利上げ観測後退を中心に境界を残す
  - 視聴者向けテキスト：強める｜雇用下振れ→利上げ観測後退 / 強める｜QQQ・SOXX・NVIDIA初動↑ / 弱める｜1分足だけでは因果証明できない / 弱める｜成長不安・AMD/Alphabet下落
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

<!--VISUAL_BEAT:scene-08:vb-08-02-->
- **scene-08-beat-002**
  - 開始合図：原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一
  - 終了合図：材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：verification / continuation
  - Visual Template ID：verification-checklist
  - Template Variant：default
  - 入力構造：言える：初動整合 / 言わない：因果断定 / 分ける：MCHP固有増幅
  - 画面の問い：最後に何を残す？
  - 主要要素：複数エンジンが同じ指数方向へ重なった
  - 視聴者向けテキスト：主役候補｜雇用→利上げ観測後退 / 別エンジン｜Microchip決算 / 増幅｜原油・利回り低下 / 結論｜違う理由の上昇が同じ方向へ重なった
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-002, source-003, source-005

### 完成ナレーション

最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型テックへの金利逆風が和らいだことです。QQQ、SOXX、NVIDIAの8時30分の初動も、その時系列とは合います。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。

- ナレーションで示す出典主体・媒体：BLS / Reuters / 追加取得結果
- 大テロップ：言えること / 言わないこと
- 補助テロップ：8:30 ET初動は確認済み / ただし因果証明ではない
- 使用する数字：8:30 ET、QQQ 719.16→720.23、SOXX 541.06→542.40、NVDA 219.95→220.31、MCHP 79.58→79.56、NASDAQ +1.30%
- 画面で見せる内容：確認済み：QQQ・SOXX・NVDAの発表分上昇 / 境界：1分足だけで因果は断定しない / MCHPは固有材料を分離
- 根拠：BLS / Reuters / 追加取得結果
- 不確実性：発表時刻との初動整合は確認したが、終日上昇の因果や各要因の寄与度は分離できない

## Scene 9｜いってらっしゃい、おやすみ

- 目的：中心結論を回収し固定エンディングへつなぐ
- 目安時間：執筆目安のみ。実測はTTS後
- 因果の対象：multiple
- 狐の演技意図：安心できる温度で短く締める
- 狐の表情：眠そう
- 表情切り替え：Visual Beatに合わせて既存表情だけを使用
- 画面モード：closing-recap
- Headline：悪材料が消えた夜ではない
- 前後の接続文：主因・増幅・反対材料を回収して締めます。

### Visual Beats

<!--VISUAL_BEAT:scene-09:vb-09-01-->
- **scene-09-beat-001**
  - 開始合図：以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。
  - 終了合図：以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Grammar：assembly / closing
  - Visual Template ID：closing-recap
  - Template Variant：default
  - 入力構造：雇用 -2.3万人 / NASDAQ +1.30% / 主因候補：利上げ観測後退
  - 画面の問い：今朝の結論は何か
  - 主要要素：雇用・金利・NASDAQの回収
  - 視聴者向けテキスト：雇用 -2.3万人 / NASDAQ +1.30% / 主因候補：利上げ観測後退
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-002, source-003

### 完成ナレーション

以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。

- ナレーションで示す出典主体・媒体：当日の市場データ / BLS / Reuters
- 大テロップ：悪材料が消えた夜ではない
- 補助テロップ：主因候補：利上げ観測後退
- 使用する数字：NASDAQ +1.30%、雇用 -2.3万人
- 画面で見せる内容：採点表が金利へ移った / NASDAQ +1.30%
- 根拠：当日の市場データ / BLS / Reuters
- 不確実性：新情報は追加しない

## C. タイトル
- 推奨案：雇用-2.3万人なのにNASDAQ+1.3%　悪材料が株高に変わった理由
- 候補2：予想+8万人→実際-2.3万人　それでもNASDAQが上がった夜
- 候補3：弱い雇用でテック高　市場が見ていた『もう一つの採点表』

## D. サムネイル文言
- 推奨案：雇用悪化→株高？
- 候補2：予想+8万→-2.3万
- 候補3：NASDAQ +1.3%

## E. 概要欄

8月7日のNasdaq Compositeは1.30%上昇、SOXXは2.02%高でした。一方、7月の米非農業部門雇用者数は市場予想+8万人に対して-2.3万人。動画ではExpected / Actual / Gap、利上げ観測の後退、Microchip好決算による半導体の増幅、AMD・Alphabetの逆行に加え、8:30 ETのQQQ・SOXX・NVDAの初動とMCHPの個別差まで確認します。1分足は時系列整合の証拠であり、原因そのものの証明ではありません。本動画はニュース解説であり、個別銘柄の売買を勧めるものではありません。

## F. 制作上の注意
- アセット完成ゲート：mainBackgroundと既存狐表情だけを使用。当日固有企業カード・生成画像は不使用。
- Visual Evidence Planning：BLS/Microchip一次情報は証拠として採用したが、資料スクリーンショットは文字が小さくなるため画面採用しない。
- `visual_source_intents.json`：明示的な空intentsでnot-required。planning未実施ではない。
- Timeline：`verified-series-plus-official-time-plus-close`。8:30 ETの公式発表時刻、QQQ・SOXX・NVDA・MCHPの検証済み1分足、引けの終値を使う。1分足は因果証明には使わない。
- 実装時に変更禁止：雇用悪化そのものと利上げ観測後退の分離、Microchipを増幅要因へ限定、AMD/Alphabet逆行、1分足は時系列整合の証拠であり因果証明ではないという留保。
- GitHub Actions：正式validator合格後にpreviewのみ。preview目視前にfinalへ進まない。

## G. 使用情報源
- source-001｜朝のNASDAQカフェ source collector / Longbridge｜NASDAQ Cafe Source Pack 2026-08-10｜daily-inputs/2026-08-10/daily_source_package_2026-08-10.md｜用途：Nasdaq Composite、SOXX、MCHP、NVDA、AMD、Alphabet、Microsoftの終値と騰落率
- source-002｜U.S. Bureau of Labor Statistics｜Employment Situation — July 2026｜https://www.bls.gov/news.release/empsit.nr0.htm｜用途：7月雇用者数-2.3万人 / 失業率4.1% / 5月・6月合計-10.3万人下方修正 / 8:30 ET発表時刻
- source-003｜Reuters｜S&P 500, Nasdaq rise as weak jobs data cool rate-hike expectations｜https://www.reuters.com/business/sp-500-dow-futures-muted-ahead-jobs-data-chips-software-stocks-rise-2026-08-07/｜用途：市場予想+8万人 / 次回利上げ確率44%・前日55%・1週前67% / 弱い雇用とNASDAQ上昇の市場解釈 / 原油・利回り低下と好決算の支援材料
- source-004｜Microchip Technology Investor Relations｜Microchip Technology Announces Financial Results for First Quarter of Fiscal Year 2027｜research/2026-08-10/evidence/RA-W2-005_exact_url_archive.json｜用途：Q1 FY27売上14.85億ドル / 非GAAP EPS 0.76ドル / 次四半期売上15.89億〜16.18億ドル / 需要改善・在庫正常化の会社説明
- source-005｜NASDAQ Cafe Collector / Longbridge｜Research Acquisition Result Wave 2｜research/2026-08-10/research_acquisition_result_w02.json｜用途：QQQ、SOXX、MCHP、NVDAの検証済み1分足と8:30 ET初動比較

## H. 04 興味深さ・わかりやすさ審問結果
- 判定：合格（Round 2、必要修正反映済み）。
- 得点：29 / 30
- 冒頭フック：5
- Scene間の進展：5
- 見出し以上の発見：5
- わかりやすさ：5
- 狐らしさ：4
- 最後まで見る理由：5
- 最大の離脱候補：『悪い雇用なら株高』という一般化。
- 必須修正と反映結果：Scene 4で雇用悪化と利上げ観測後退を分離。Scene 8で8:30 ETの実分足を明示し、QQQ・SOXX・NVDAの上向きとMCHPのほぼ横ばいを分け、1分足だけで因果を断定しない。
- 反対材料維持：AMD -1.21%、Alphabet -0.96%、成長不安、原油・利回り・好決算という競合要因を残した。
- タイトル・サムネイルの約束と回収：Scene 1〜4で『雇用悪化→株高？』を回収。
- 即時不合格条件：該当なし。
- Visual Source採用経路：not-required。
- 実行正本整合ゲート：正式CIで再検証する。


<!--BEGIN_DISPLAY_CAPTION_PROJECTION-->
```json
{
  "captions": {
    "scene-01/scene-01-chunk-001": "おはようございます。昨夜のNasdaq Compositeは1.30%上昇、SOXXは2.02%高でした。ところが7月の雇用者数は、市場予想の+8万人に対して-2.3万人です。景気にはかなり弱い。それでもテックは上がりました。",
    "scene-01/scene-01-chunk-002": "まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。",
    "scene-02/scene-02-chunk-001": "BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は2.3万人減、失業率は4.1%。さらに5月と6月の雇用増も、合わせて10.3万人下方修正されました。",
    "scene-02/scene-02-chunk-002": "つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。",
    "scene-03/scene-03-chunk-001": "それでも引けではNasdaq Compositeが1.30%上昇。SOXXは2.02%、NVIDIAも2.27%上がりました。",
    "scene-03/scene-03-chunk-002": "雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。",
    "scene-04/scene-04-chunk-001": "期待との差はかなり大きいです。Expectedは+8万人。Actualは-2.3万人。Gapは-10.3万人でした。ところが次回Fed会合の利上げ確率は約44%まで低下。前日は55%、一週間前は67%です。",
    "scene-04/scene-04-chunk-002": "Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。",
    "scene-05/scene-05-chunk-001": "ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。",
    "scene-05/scene-05-chunk-002": "企業決算も強めです。ここは主役ではありません。",
    "scene-05/scene-05-chunk-003": "雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。",
    "scene-06/scene-06-chunk-001": "ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。",
    "scene-06/scene-06-chunk-002": "ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。",
    "scene-07/scene-07-chunk-001": "Microchipには会社固有の材料がありました。Q1売上14.85億ドル、非GAAP EPS0.76ドルを発表し、次の四半期売上を15.89億から16.18億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で13.89%高でした。",
    "scene-07/scene-07-chunk-002": "一方でAMDは1.21%下落、Alphabetも0.96%下落、Microsoftはほぼ横ばい。つまり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。",
    "scene-08/scene-08-chunk-001": "最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型テックへの金利逆風が和らいだことです。QQQ、SOXX、NVIDIAの8時30分の初動も、その時系列とは合います。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。",
    "scene-08/scene-08-chunk-002": "原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。",
    "scene-09/scene-09-chunk-001": "以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。"
  },
  "contractVersion": "1.0.0",
  "derivation": "captionText is the deterministic display projection of approved speechText; spoken narration is unchanged",
  "episodeDate": "2026-08-10"
}
```
<!--END_DISPLAY_CAPTION_PROJECTION-->

<!--BEGIN_FINANCIAL_VISUAL_ANNEX-->
```json
{
  "annexVersion": "1.0.0",
  "candidatePlans": [],
  "intents": []
}
```
<!--END_FINANCIAL_VISUAL_ANNEX-->

<!--BEGIN_VISUAL_GRAMMAR_ANNEX-->
```json
{
  "episodeDate": "2026-08-10",
  "expectedConfirmed": true,
  "scene5CausalExceptionReason": null,
  "scenes": [
    {
      "sceneId": "scene-01",
      "visualBeats": [
        {
          "visualBeatId": "vb-01-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "contradiction",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-01-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-02",
      "visualBeats": [
        {
          "visualBeatId": "vb-02-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-02-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-03",
      "visualBeats": [
        {
          "visualBeatId": "vb-03-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "gap",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-03-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-04",
      "visualBeats": [
        {
          "visualBeatId": "vb-04-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "gap",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-04-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "analogy",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-05",
      "visualBeats": [
        {
          "visualBeatId": "vb-05-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "causal",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-05-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "causal",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        },
        {
          "visualBeatId": "vb-05-03",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "bridge-text",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-06",
      "visualBeats": [
        {
          "visualBeatId": "vb-06-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "reaction",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-06-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "reaction",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-07",
      "visualBeats": [
        {
          "visualBeatId": "vb-07-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-07-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "comparison",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-08",
      "visualBeats": [
        {
          "visualBeatId": "vb-08-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "verification",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-08-02",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "verification",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        }
      ]
    },
    {
      "sceneId": "scene-09",
      "visualBeats": [
        {
          "visualBeatId": "vb-09-01",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "assembly",
            "returnTargetBeatId": null,
            "transitionRole": "closing"
          }
        }
      ]
    }
  ],
  "visualGrammarContractVersion": "1.0.0"
}
```
<!--END_VISUAL_GRAMMAR_ANNEX-->

<!--BEGIN_STORY_ENGINE_ANNEX-->
```json
{
  "acceptance": {
    "path": "working/2026-08-10/story-engine/story_engine_acceptance.json",
    "sha256": "19004bd933f7fe6df47c24293d9a726b17e7b7fc80dd82aed2494d999b8be5c1"
  },
  "contract_version": "1.0.0",
  "creative_review": {
    "path": "working/2026-08-10/story-engine/creative_review.json",
    "sha256": "786b11c53afb04f16b4d3a3baa2d03038e96657af93bd802df299ad4d180ba34"
  },
  "critic": {
    "critic_certified": false,
    "external_critic_status": "not_run",
    "reviewer": "editorial_critic",
    "round": 1,
    "score": 29,
    "verdict": "pass"
  },
  "episode_date": "2026-08-10",
  "projection": {
    "path": "working/2026-08-10/story-engine/story_projection_report.json",
    "sha256": "9e569f4efaa9fa7f76872073de089eceeb5a7ff106d4fed7e83639d877d8e318"
  },
  "status": "pass",
  "story_plan": {
    "path": "working/2026-08-10/story-engine/story_plan.json",
    "sha256": "b02eec41be58db4be9dd3216950e3fee153e7408c0810241b3d4a939234036b9"
  },
  "story_script": {
    "path": "working/2026-08-10/story-engine/story_script.json",
    "sha256": "9c45b29149ec5e90d1e8794daab437cea6721339b6e715078a2ecd59dfdfb981"
  }
}
```
<!--END_STORY_ENGINE_ANNEX-->

<!--BEGIN_EPISODE_MEMORY_ANNEX-->
```json
{
  "causal_dossier": {
    "path": "research/2026-08-10/causal_research_dossier_2026-08-10.json",
    "sha256": "d4ddd1277376865dae1f8d534e4844b2967cf31667e19fce4b78a5bbb04e6533"
  },
  "contract_version": "1.0.0",
  "episode_date": "2026-08-10",
  "references": [
    {
      "current_revalidation_status": "not_used",
      "difference_from_previous": "2026-07-31回のAI設備投資評価軸は今回の雇用統計・利上げ観測の主因とは異なるため、現在因果には使用しない。",
      "dossier_current_evidence_ids": [],
      "dossier_editorial_use": "not_used",
      "historical_confidence": "unknown",
      "memory_reference_id": "2026-07-31/v001",
      "memory_reference_type": "episode",
      "public_usage_mode": "internal_only",
      "reference_id": "MR-001",
      "scope_limit": "過去記録は現在証拠として使わず、当日の一次情報・主要報道で再検証した内部比較に限定する。",
      "usages": []
    }
  ],
  "validation_intent": {
    "past_mentions_complete": true,
    "post_inquisition_final": true,
    "title_thumbnail_checked": true
  }
}
```
<!--END_EPISODE_MEMORY_ANNEX-->

<!--BEGIN_FINAL_PRODUCTION_SOURCE-->
```json
{
  "asset_catalog": [
    {
      "asset_id": "background_scene_news",
      "media_type": "image",
      "path": "renderer-registry/background_scene_news",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "daily-microchip-q1-fy27-ir-secondary",
      "media_type": "image",
      "path": "daily-assets/2026-08-10/daily-microchip-q1-fy27-ir-secondary.png",
      "sha256": "8170b0d8d35b4126353883e3fb7d0ff35fa510759f1713d754680f2253dae3f6",
      "status": "ready"
    },
    {
      "asset_id": "foxAlert",
      "media_type": "image",
      "path": "renderer-registry/foxAlert",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "foxAnalysis",
      "media_type": "image",
      "path": "renderer-registry/foxAnalysis",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "foxConfused",
      "media_type": "image",
      "path": "renderer-registry/foxConfused",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "foxNormal",
      "media_type": "image",
      "path": "renderer-registry/foxNormal",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "foxSleepy",
      "media_type": "image",
      "path": "renderer-registry/foxSleepy",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "foxSlightSurprise",
      "media_type": "image",
      "path": "renderer-registry/foxSlightSurprise",
      "sha256": null,
      "status": "not-required"
    },
    {
      "asset_id": "mainBackground",
      "media_type": "image",
      "path": "renderer-registry/mainBackground",
      "sha256": null,
      "status": "not-required"
    }
  ],
  "contract_version": "1.0.0",
  "episode_date": "2026-08-10",
  "image_resolution": {
    "routes": [
      {
        "beat_id": "vb-02-01",
        "fallback_asset_id": "background_scene_news",
        "primary_asset_id": "daily-bls-employment-july-2026",
        "selected_asset_id": "background_scene_news",
        "selected_path": "fallback"
      },
      {
        "beat_id": "vb-07-01",
        "fallback_asset_id": "daily-microchip-q1-fy27-ir-secondary",
        "primary_asset_id": "daily-microchip-q1-fy27-ir",
        "selected_asset_id": "daily-microchip-q1-fy27-ir-secondary",
        "selected_path": "fallback"
      }
    ],
    "selected_path": "fallback",
    "status": "resolved",
    "unresolved_count": 0
  },
  "post_inquisition": {
    "required_changes_applied": true,
    "status": "pass",
    "unresolved_required_changes": 0
  },
  "render_spec": {
    "corrections": [
      {
        "corrected": "2026-08-07 US market",
        "correctionId": "correction-001",
        "original": "collector.market_session_date_us=2026-08-09",
        "reason": "2026-08-09は日曜で、Longbridge終値とニュースは2026-08-07米国通常取引に対応するため。"
      },
      {
        "corrected": "SOXX ETF",
        "correctionId": "correction-002",
        "original": "source_pack.market_data.SOX",
        "reason": "source_symbolがSOXX.USであり、PHLX Semiconductor Indexではないため。"
      }
    ],
    "editorial": {
      "actual": "BLS発表の7月非農業部門雇用者数 -2.3万人",
      "amplifiers": [
        "Microchipの予想超え実績・次四半期見通し",
        "MCHP +13.89%",
        "原油・インフレ懸念後退と米国債利回り低下",
        "好調な決算シーズン"
      ],
      "centralHypothesis": "7月雇用統計の大幅下振れは成長不安よりも次回利上げリスク低下として大型テックに先に評価され、Microchip好決算と原油・利回り低下が半導体・NASDAQ上昇を増幅した。",
      "confidence": "medium",
      "counterEvidence": [
        "雇用減は景気減速リスクでもある。",
        "AMD -1.21%、Alphabet -0.96%でテック全面高ではない。",
        "原油・利回り低下と好決算も同日に存在した。",
        "8:30 ETの1分足はQQQ・SOXX・NVIDIAで上向いたが、1分足だけでは雇用統計が原因と証明できず、MCHPは同じ1分ではほぼ横ばいだった。"
      ],
      "directMaterial": [
        "7月非農業部門雇用者数 -2.3万人",
        "失業率 4.1%",
        "5月・6月合計 -10.3万人下方修正"
      ],
      "expected": "Reuters集計の7月非農業部門雇用者数予想 +8万人",
      "expectedBasisDetails": "Reutersが報じたエコノミスト予想+8万人",
      "expectedBasisType": "major-reporting",
      "expectedSourceIds": [
        "source-003"
      ],
      "gap": "Expected +8万人に対しActual -2.3万人、Gap -10.3万人",
      "leadNews": "7月米雇用統計の大幅下振れとNASDAQ上昇",
      "leadTheme": null,
      "nasdaqDrivers": [
        "次回会合の利上げ確率 約44%へ低下",
        "Nasdaq Composite +1.30%",
        "SOXX +2.02%"
      ],
      "offsettingFactors": [
        "雇用減そのものが示す成長不安",
        "AMD -1.21%",
        "Alphabet -0.96%",
        "MCHPは8:30 ETの同じ1分ではほぼ横ばい"
      ],
      "storySpine": "雇用予想+8万人→実際-2.3万人→利上げ観測後退→8:30 ETにQQQ・SOXX・NVIDIAが上向き→大型テックへの金利逆風緩和→Microchip好決算と原油・利回り低下が増幅→NASDAQ +1.30%、ただし1分足は因果証明ではなく個別差を残す。",
      "targetIndices": [
        "Nasdaq Composite",
        "SOXX"
      ],
      "timelineBasis": "BLSの8:30 ET公式発表、Reutersの利上げ観測報道、QQQ・SOXX・NVDA・MCHPの検証済み1分足、8月7日通常取引終値。1分足は時系列整合の証拠であり、因果証明には使わない。",
      "verificationPoints": [
        "次の雇用・インフレ指標で利上げ確率が再上昇するか",
        "半導体高がMCHP以外へ継続して広がるか",
        "弱い雇用が企業利益懸念へ転化するか"
      ]
    },
    "episode": {
      "durationMode": "shortened",
      "episodeType": "single-news",
      "fps": 30,
      "height": 1080,
      "id": "2026-08-10",
      "informationCutoff": "2026-08-10T12:52:00+09:00",
      "marketSession": "2026-08-07 US market",
      "shortenedReason": "雇用統計、金利観測、半導体増幅、反対材料、8:30 ETの初動まで9シーンで完結できるため。",
      "targetDate": "2026-08-10",
      "width": 1920
    },
    "pronunciations": [
      {
        "reading": "ナスダック・コンポジット",
        "surface": "Nasdaq Composite"
      },
      {
        "reading": "ソックス",
        "surface": "SOXX"
      },
      {
        "reading": "マイクロチップ",
        "surface": "Microchip"
      },
      {
        "reading": "エムシーエイチピー",
        "surface": "MCHP"
      },
      {
        "reading": "エヌビディア",
        "surface": "NVIDIA"
      },
      {
        "reading": "フェッド",
        "surface": "Fed"
      },
      {
        "reading": "ロイター",
        "surface": "Reuters"
      }
    ],
    "publishing": {
      "description": "8月7日のNasdaq Compositeは1.30%上昇、SOXXは2.02%高でした。一方、7月の米非農業部門雇用者数は市場予想+8万人に対して-2.3万人。動画ではExpected / Actual / Gap、利上げ観測の後退、Microchip好決算による半導体の増幅、AMD・Alphabetの逆行に加え、8:30 ETのQQQ・SOXX・NVDAの初動とMCHPの個別差まで確認します。1分足は時系列整合の証拠であり、原因そのものの証明ではありません。本動画はニュース解説であり、個別銘柄の売買を勧めるものではありません。",
      "recommendedThumbnailText": "雇用悪化→株高？",
      "recommendedTitle": "雇用-2.3万人なのにNASDAQ+1.3%　悪材料が株高に変わった理由",
      "thumbnailTextCandidates": [
        "雇用悪化→株高？",
        "予想+8万→-2.3万",
        "NASDAQ +1.3%"
      ],
      "titleCandidates": [
        "雇用-2.3万人なのにNASDAQ+1.3%　悪材料が株高に変わった理由",
        "予想+8万人→実際-2.3万人　それでもNASDAQが上がった夜",
        "弱い雇用でテック高　市場が見ていた『もう一つの採点表』"
      ]
    },
    "review": {
      "approvedForCodex": true,
      "changesApplied": [
        "04 editorial review PASS after targeted rewrite"
      ],
      "largestDropoffRisk": "Scene 4で『悪い雇用なら株高』と一般化して受け取られる可能性。",
      "requiredChanges": [],
      "scores": {
        "clarity": 5,
        "discovery": 5,
        "foxCharacter": 4,
        "openingHook": 5,
        "reasonToFinish": 5,
        "storyProgression": 5
      },
      "titleThumbnailConsistency": "consistent",
      "totalScore": 29,
      "verdict": "approved"
    },
    "scenes": [
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-01-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-01-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxSlightSurprise",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-01-placement-foxSlightSurprise",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-01-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "雇用 -2.3万人"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "予想 +8万人"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "NASDAQ +1.30%"
              }
            ],
            "role": null,
            "title": "悪い雇用なのにNASDAQ上昇"
          },
          {
            "cardId": "scene-01-card-002",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "悪い雇用→株高？"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "見るべきは利上げ観測"
              }
            ],
            "role": null,
            "title": "市場が見たもう一つの採点表"
          }
        ],
        "causalScope": "multiple",
        "evidenceSourceIds": [
          "source-001",
          "source-002",
          "source-003"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "寝ている間に何が起きた？",
        "headline": "NASDAQ +1.30%",
        "initialExpression": "軽い驚き",
        "narrationChunks": [
          {
            "captionText": "おはようございます。昨夜のNasdaq Compositeは1.30%上昇、SOXXは2.02%高でした。ところが7月の雇用者数は、市場予想の+8万人に対して-2.3万人です。景気にはかなり弱い。それでもテックは上がりました。",
            "chunkId": "scene-01-chunk-001",
            "expression": "軽い驚き",
            "pauseAfterMs": 120,
            "speechText": "おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところが7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人です。景気にはかなり弱い。それでもテックは上がりました。"
          },
          {
            "captionText": "まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。",
            "chunkId": "scene-01-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。"
          }
        ],
        "nodes": [],
        "numbers": [],
        "performanceIntent": "驚きを短く置き、悪い雇用と株高の矛盾へ視線を固定する",
        "purpose": "方向、矛盾、中心仮説を30秒以内に提示する",
        "sceneId": "scene-01",
        "sceneNumber": 1,
        "sceneRole": "opening-hook-market-direction-greeting-conclusion",
        "sourceLabel": "当日の市場データ / BLS / Reuters",
        "supportingTexts": [
          "SOXX +2.02%",
          "雇用 -2.3万人 / 予想 +8万人"
        ],
        "timelineBasis": "8月7日通常取引終値とBLS 8:30 ET公式発表",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "8:30 ETの初動は後段で確認するが、1分足だけでは因果は証明できない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-01-01",
            "changeCue": "雇用 -2.3万人",
            "contentType": "opening-contradiction",
            "endChunkId": "scene-01-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "ころが7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人です。景気にはかなり弱い。それでもテックは上がりました。",
            "narrationStartCue": "おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところ",
            "objectIds": [
              "scene-01-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "雇用悪化とNASDAQ上昇",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "昨夜の矛盾は何か",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-01-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS 8:30 ET発表と8月7日通常取引終値",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "雇用 -2.3万人",
              "予想 +8万人",
              "NASDAQ +1.30%"
            ],
            "visualBeatId": "vb-01-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "contradiction",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualMode": "conclusion-card",
            "visualTemplate": "opening-contradiction"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-01-02",
            "changeCue": "半導体を全部この説明に入れると",
            "contentType": "hero-number",
            "endChunkId": "scene-01-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "風が入った可能性です。ただ、半導体を全部この説明に入れると、一銘柄だけ発表時刻と値動きが合いません。そこを実データで確かめます。",
            "narrationStartCue": "まず見えるのは、弱い雇用で利上げ観測が後退し、金利に敏感なテックへ追い風が入った可能性です。ただ、半導体を全部この説明に入れると",
            "objectIds": [
              "scene-01-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "暫定解：利上げ観測後退 / 未解決：1銘柄の初動",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "利上げ観測だけで半導体まで説明できる？",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-01-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Reutersの市場解釈",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "暫定解：利上げ観測後退",
              "次の検証：8:30 ETの銘柄別初動"
            ],
            "visualBeatId": "vb-01-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "evidence",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualMode": "conclusion-card",
            "visualTemplate": "hero-number"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-01-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-001",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-01-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-01-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-002",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-01-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "conclusion-card"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-02-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-02-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxConfused",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-02-placement-foxConfused",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "background_scene_news",
            "endChunkId": "scene-02-chunk-001",
            "fit": "contain",
            "focalPoint": null,
            "opacity": 1,
            "placementId": "vsi-20260810-bls-employment-placement",
            "region": "main-stage",
            "role": "main-media",
            "startChunkId": "scene-02-chunk-001"
          }
        ],
        "cards": [
          {
            "cardId": "scene-02-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "雇用 -2.3万人"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "失業率 4.1%"
              }
            ],
            "role": null,
            "title": "BLSが確認した7月雇用"
          },
          {
            "cardId": "scene-02-card-002",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "5月・6月 改定 -10.3万人"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "NASDAQ +1.30%"
              }
            ],
            "role": null,
            "title": "弱さは一行だけではない"
          }
        ],
        "causalScope": "nasdaq",
        "evidenceSourceIds": [
          "source-002"
        ],
        "expectedBasisType": "official-consensus",
        "formalName": "今朝の矛盾",
        "headline": "雇用 -2.3万人",
        "initialExpression": "分析",
        "narrationChunks": [
          {
            "captionText": "BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は2.3万人減、失業率は4.1%。さらに5月と6月の雇用増も、合わせて10.3万人下方修正されました。",
            "chunkId": "scene-02-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月の雇用増も、合わせて十・三万人下方修正されました。"
          },
          {
            "captionText": "つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。",
            "chunkId": "scene-02-chunk-002",
            "expression": "困惑",
            "pauseAfterMs": 200,
            "speechText": "つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。"
          }
        ],
        "nodes": [],
        "numbers": [],
        "performanceIntent": "落ち着いてBLSの数字を確認し、景気側の弱さを過小評価しない",
        "purpose": "雇用の弱さが一行だけではないことをBLSの確認済み事実で示す",
        "sceneId": "scene-02",
        "sceneNumber": 2,
        "sceneRole": "editorial-body",
        "sourceLabel": "BLS",
        "supportingTexts": [
          "失業率 4.1%",
          "5月・6月 合計-10.3万人改定"
        ],
        "timelineBasis": "BLS 8:30 ET公式発表",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "株価への影響をBLSだけで断定しない",
        "visualBeats": [
          {
            "assetPlacementIds": [
              "vsi-20260810-bls-employment-placement"
            ],
            "assetState": "ready",
            "beatId": "vb-02-01",
            "changeCue": "雇用 -2.3万人",
            "contentType": "number-comparison",
            "endChunkId": "scene-02-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-002"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月の雇用増も、合わせて十・三万人下方修正されました。",
            "narrationStartCue": "BLSの中身を見ると、弱さは一行だけではありません。非農業部門雇用者数は二・三万人減、失業率は四・一パーセント。さらに5月と6月",
            "objectIds": [
              "scene-02-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "7月雇用の確認済み事実",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "BLSは何を確認したか",
            "screenState": "Data",
            "sequencePolicy": "static",
            "startChunkId": "scene-02-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS July 2026 Employment Situation",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "雇用 -2.3万人",
              "失業率 4.1%"
            ],
            "visualBeatId": "vb-02-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "evidence",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualMode": "number-comparison",
            "visualTemplate": "metric-comparison-board"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-02-02",
            "changeCue": "5月・6月 改定 -10.3万人",
            "contentType": "text-focus",
            "endChunkId": "scene-02-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-002"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。",
            "narrationStartCue": "つまり景気側の心配はちゃんと残っています。『悪い数字を市場が無視した』ではありません。",
            "objectIds": [
              "scene-02-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "過去2か月の下方修正",
            "primaryFunction": "Compare",
            "returnScreenState": null,
            "screenQuestion": "弱さは一回だけか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-02-chunk-002",
            "templateConfig": {
              "comparisonBasis": "業績と株価は同じ方向だったか",
              "dataBasis": "BLS revisions and market close",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "confirmed-vs-unconfirmed"
            },
            "templateVariant": "confirmed-vs-unconfirmed",
            "viewerTexts": [
              "5月・6月 改定 -10.3万人",
              "NASDAQ +1.30%"
            ],
            "visualBeatId": "vb-02-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "evidence",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualMode": "text-focus",
            "visualTemplate": "evidence-boundary"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-02-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-003",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-02-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-02-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-004",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-02-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "conclusion-card"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-03-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-03-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-03-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "Expected +8万人"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "Actual -2.3万人"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "Gap -10.3万人"
              }
            ],
            "role": null,
            "title": "Expected / Actual / Gap"
          }
        ],
        "causalScope": "nasdaq",
        "evidenceSourceIds": [
          "source-002",
          "source-003"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "Expected / Actual / Gap",
        "headline": "Gap -10.3万人",
        "initialExpression": "分析",
        "narrationChunks": [
          {
            "captionText": "それでも引けではNasdaq Compositeが1.30%上昇。SOXXは2.02%、NVIDIAも2.27%上がりました。",
            "chunkId": "scene-03-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "それでも引けではNasdaq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パーセント上がりました。"
          },
          {
            "captionText": "雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。",
            "chunkId": "scene-03-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": null,
            "label": "1",
            "numberId": "scene-03-number-compare-001",
            "tone": "neutral",
            "unit": "",
            "value": "予想差 -10.3万人"
          },
          {
            "comparison": null,
            "label": "2",
            "numberId": "scene-03-number-compare-002",
            "tone": "neutral",
            "unit": "",
            "value": "過去2か月改定 -10.3万人"
          }
        ],
        "performanceIntent": "数字の差を一度きれいに見せ、解釈を後ろへ送る",
        "purpose": "発表前期待とActualの差を数値で固定する",
        "sceneId": "scene-03",
        "sceneNumber": 3,
        "sceneRole": "editorial-body",
        "sourceLabel": "BLS / Reuters",
        "supportingTexts": [
          "Expected +8万人",
          "Actual -2.3万人"
        ],
        "timelineBasis": "Reuters予想とBLS実績",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "Reuters予想は公式コンセンサスではない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-03-01",
            "changeCue": "Expected +8万人",
            "contentType": "expected-actual-gap",
            "endChunkId": "scene-03-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "daq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パーセント上がりました。",
            "narrationStartCue": "それでも引けではNasdaq Compositeが一・三〇パーセント上昇。SOXXは二・〇二パーセント、NVIDIAも二・二七パ",
            "objectIds": [
              "scene-03-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "Expected / Actual / Gap",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "予想からどれだけ外れたか",
            "screenState": "Chart",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-03-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Reuters consensus and BLS actual",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "Expected +8万人",
              "Actual -2.3万人",
              "Gap -10.3万人"
            ],
            "visualBeatId": "vb-03-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "gap",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualMode": "expected-actual-gap",
            "visualTemplate": "expected-actual-gap-flow"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-03-02",
            "changeCue": "予想差 -10.3万人",
            "contentType": "number-comparison",
            "endChunkId": "scene-03-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです。",
            "narrationStartCue": "雇用は弱いのに、指数と半導体は反対方向です。ここまでで分かるのは、景気の採点表だけでは昨夜の値動きが説明できない、ということです",
            "objectIds": [
              "scene-03-number-compare-001",
              "scene-03-number-compare-002"
            ],
            "pictureBook": null,
            "primaryElement": "予想差と過去改定を分離",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "同じ-10.3万人でも何が違うか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-03-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS and Reuters",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "予想差 -10.3万人",
              "過去2か月改定 -10.3万人",
              "意味は別の数字"
            ],
            "visualBeatId": "vb-03-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "evidence",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualMode": "number-comparison",
            "visualTemplate": "metric-comparison-board"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-03-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-005",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-03-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-03-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-006",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-03-number-compare-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-03-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-019",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 120,
            "targetId": "scene-03-number-compare-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "number-comparison"
      },
      {
        "arrows": [
          {
            "arrowId": "scene-04-scorecard-arrow-001",
            "fromNodeId": "scene-04-scorecard-node-001",
            "label": "読み替え",
            "toNodeId": "scene-04-scorecard-node-002"
          },
          {
            "arrowId": "scene-04-scorecard-arrow-002",
            "fromNodeId": "scene-04-scorecard-node-002",
            "label": "金利経路",
            "toNodeId": "scene-04-scorecard-node-003"
          }
        ],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-04-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-04-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxAlert",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-04-placement-foxAlert",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-04-card-001",
            "lines": [
              {
                "label": "Expected",
                "tone": "neutral",
                "value": "+8万人"
              },
              {
                "label": "Actual",
                "tone": "neutral",
                "value": "-2.3万人"
              },
              {
                "label": "Gap",
                "tone": "neutral",
                "value": "-10.3万人"
              }
            ],
            "role": null,
            "title": "Expected / Actual / Gap"
          },
          {
            "cardId": "scene-04-card-002",
            "lines": [
              {
                "label": "8月7日",
                "tone": "neutral",
                "value": "約44%"
              },
              {
                "label": "前日",
                "tone": "neutral",
                "value": "55%"
              },
              {
                "label": "1週間前",
                "tone": "neutral",
                "value": "67%"
              }
            ],
            "role": null,
            "title": "利上げ確率の変化"
          }
        ],
        "causalScope": "nasdaq",
        "evidenceSourceIds": [
          "source-003"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "採点表が変わった",
        "headline": "利上げ確率 約44%",
        "initialExpression": "分析",
        "narrationChunks": [
          {
            "captionText": "期待との差はかなり大きいです。Expectedは+8万人。Actualは-2.3万人。Gapは-10.3万人でした。ところが次回Fed会合の利上げ確率は約44%まで低下。前日は55%、一週間前は67%です。",
            "chunkId": "scene-04-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "期待との差はかなり大きいです。Expectedはプラス八万人。Actualはマイナス二・三万人。Gapはマイナス十・三万人でした。ところが次回Fed会合の利上げ確率は約四十四パーセントまで低下。前日は五十五パーセント、一週間前は六十七パーセントです。"
          },
          {
            "captionText": "Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。",
            "chunkId": "scene-04-chunk-002",
            "expression": "警戒",
            "pauseAfterMs": 200,
            "speechText": "Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。"
          }
        ],
        "nodes": [
          {
            "label": "景気の採点表：赤点",
            "nodeId": "scene-04-scorecard-node-001"
          },
          {
            "label": "金利の採点表：利上げリスク↓",
            "nodeId": "scene-04-scorecard-node-002"
          },
          {
            "label": "大型テック：逆風が和らぐ",
            "nodeId": "scene-04-scorecard-node-003"
          }
        ],
        "numbers": [],
        "performanceIntent": "矛盾が解けるTurnとして少しニヤリとする",
        "purpose": "弱い雇用が利上げ観測後退へ変換された市場解釈を示す",
        "sceneId": "scene-04",
        "sceneNumber": 4,
        "sceneRole": "editorial-body",
        "sourceLabel": "Reuters",
        "supportingTexts": [
          "前日 55%",
          "1週前 67%"
        ],
        "timelineBasis": "Reuters報道",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "利上げ確率は市場推計でFedの確定方針ではない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-04-01",
            "changeCue": "Expected +8万人",
            "contentType": "expected-actual-gap",
            "endChunkId": "scene-04-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "でした。ところが次回Fed会合の利上げ確率は約四十四パーセントまで低下。前日は五十五パーセント、一週間前は六十七パーセントです。",
            "narrationStartCue": "期待との差はかなり大きいです。Expectedはプラス八万人。Actualはマイナス二・三万人。Gapはマイナス十・三万人でした",
            "objectIds": [
              "scene-04-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "Expected → Actual → Gap",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "Expected / Actual / Gapは？",
            "screenState": "Chart",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-04-chunk-001",
            "templateConfig": {
              "comparisonBasis": "通常予想とのGapは何か",
              "dataBasis": "Reuters reported rate-hike probabilities",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "Expected +8万人",
              "Actual -2.3万人",
              "Gap -10.3万人"
            ],
            "visualBeatId": "vb-04-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "gap",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualMode": "expected-actual-gap",
            "visualTemplate": "expected-actual-gap-flow"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-04-02",
            "changeCue": "景気の採点表 → 金利の採点表",
            "contentType": "analogy-steps",
            "endChunkId": "scene-04-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『追加利上げの必要性が下がった』。ここがまず昨夜のマクロの芯です。",
            "narrationStartCue": "Reutersも、弱い雇用で利上げ観測が後退したことを株高の主要な説明として伝えています。つまり『悪い雇用が好材料』ではなく、『",
            "objectIds": [
              "scene-04-scorecard-node-001",
              "scene-04-scorecard-node-002",
              "scene-04-scorecard-arrow-001",
              "scene-04-scorecard-node-003",
              "scene-04-scorecard-arrow-002"
            ],
            "pictureBook": null,
            "primaryElement": "景気の採点表 → 金利の採点表 → 大型テック",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "同じ悪材料でも採点表が違うと何が変わる？",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-04-chunk-002",
            "templateConfig": {
              "comparisonBasis": "同じ雇用下振れを景気と金利の2つの採点表で読む",
              "dataBasis": "Reuters market interpretation",
              "laneLabels": [],
              "nodeOrder": [
                "scene-04-scorecard-node-001",
                "scene-04-scorecard-node-002",
                "scene-04-scorecard-node-003"
              ],
              "outcomeNodeId": "scene-04-scorecard-node-003",
              "variant": "left-to-right"
            },
            "templateVariant": "left-to-right",
            "viewerTexts": [
              "景気の採点表：赤点",
              "金利の採点表：利上げリスク↓",
              "大型テック：逆風が和らぐ"
            ],
            "visualBeatId": "vb-04-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "analogy",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualGrammarId": "analogy",
            "visualMode": "causal-diagram",
            "visualTemplate": "analogy-steps"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-04-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-007",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-04-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-04-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-008",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-04-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "expected-actual-gap"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-05-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-05-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxSlightSurprise",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-05-placement-foxSlightSurprise",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-05-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "原油・インフレ懸念↓"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "米国債利回り↓"
              }
            ],
            "role": null,
            "title": "舞台装置は一つではない"
          },
          {
            "cardId": "scene-05-card-002",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "雇用大幅下振れ"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "利上げ観測↓"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "大型テックの逆風↓"
              }
            ],
            "role": null,
            "title": "世界からNASDAQへの経路"
          },
          {
            "cardId": "scene-05-card-003",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "主因候補：雇用→金利"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "増幅：原油・決算"
              }
            ],
            "role": null,
            "title": "主因と増幅を分ける"
          }
        ],
        "causalScope": "multiple",
        "evidenceSourceIds": [
          "source-003"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "世界からNASDAQへの経路",
        "headline": "主因は一つ、追い風は複数",
        "initialExpression": "分析",
        "narrationChunks": [
          {
            "captionText": "ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。",
            "chunkId": "scene-05-chunk-001",
            "expression": "軽い驚き",
            "pauseAfterMs": 120,
            "speechText": "ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。"
          },
          {
            "captionText": "企業決算も強めです。ここは主役ではありません。",
            "chunkId": "scene-05-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "企業決算も強めです。ここは主役ではありません。"
          },
          {
            "captionText": "雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。",
            "chunkId": "scene-05-chunk-003",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。"
          }
        ],
        "nodes": [],
        "numbers": [],
        "performanceIntent": "主因をぼかさず、舞台装置が複数あることを短く整理する",
        "purpose": "雇用以外の原油・利回り・決算を増幅要因として分離する",
        "sceneId": "scene-05",
        "sceneNumber": 5,
        "sceneRole": "editorial-body",
        "sourceLabel": "Reuters",
        "supportingTexts": [
          "原油・インフレ懸念↓",
          "米国債利回り↓ / 好決算"
        ],
        "timelineBasis": "8月7日のReuters市場報道",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "各要因の寄与度は分離できない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-05-01",
            "changeCue": "原油・インフレ懸念↓",
            "contentType": "supporting-forces",
            "endChunkId": "scene-05-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "きれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。",
            "narrationStartCue": "ただ、雇用だけに全部を背負わせると話がきれいすぎます。同じ日には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回り",
            "objectIds": [
              "scene-05-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "原油・利回りの支援",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "雇用以外の追い風は何か",
            "screenState": "Data",
            "sequencePolicy": "static",
            "startChunkId": "scene-05-chunk-001",
            "templateConfig": {
              "comparisonBasis": "NASDAQへの主因候補と同日に存在した増幅要因",
              "dataBasis": "Reuters 2026-08-07 market reporting",
              "laneLabels": [
                "追い風",
                "留保"
              ],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "two-lane"
            },
            "templateVariant": "two-lane",
            "viewerTexts": [
              "原油・インフレ懸念↓",
              "米国債利回り↓"
            ],
            "visualBeatId": "vb-05-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "causal",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualGrammarId": "causal",
            "visualMode": "conclusion-card",
            "visualTemplate": "tailwind-headwind"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-05-02",
            "changeCue": "雇用大幅下振れ",
            "contentType": "causal-lane",
            "endChunkId": "scene-05-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "企業決算も強めです。ここは主役ではありません。",
            "narrationStartCue": "企業決算も強めです。ここは主役ではありません。",
            "objectIds": [
              "scene-05-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "雇用→利上げ観測→テック",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "雇用からNASDAQへどう届くか",
            "screenState": "Chart",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-05-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS / Reuters",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "left-to-right"
            },
            "templateVariant": "left-to-right",
            "viewerTexts": [
              "雇用大幅下振れ",
              "利上げ観測↓",
              "大型テックの逆風↓"
            ],
            "visualBeatId": "vb-05-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "causal",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualMode": "text-focus",
            "visualTemplate": "causal-lane"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-05-03",
            "changeCue": "主因候補：雇用→金利",
            "contentType": "text-focus",
            "endChunkId": "scene-05-chunk-003",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。",
            "narrationStartCue": "雇用から金利への経路を、同じ方向から支えた増幅材料として置いておきます。",
            "objectIds": [
              "scene-05-card-003"
            ],
            "pictureBook": null,
            "primaryElement": "単因モデルを避ける",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "主因と増幅をどう分けるか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-05-chunk-003",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Reuters 8月7日市場報道",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "主因候補：雇用→金利",
              "増幅：原油・決算"
            ],
            "visualBeatId": "vb-05-03",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "bridge-text",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualMode": "text-focus",
            "visualTemplate": "text-focus"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-05-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-009",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-05-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-05-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-010",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-05-card-002",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-05-chunk-003",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-011",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-05-card-003",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "conclusion-card"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-06-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAlert",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-06-placement-foxAlert",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxNormal",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-06-placement-foxNormal",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-06-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "08:30 ET BLS発表"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "利上げ確率 約44%"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "引け NASDAQ +1.30%"
              }
            ],
            "role": null,
            "title": "公式時刻から引けまで"
          },
          {
            "cardId": "scene-06-card-002",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "SOXX +2.02%"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "MCHP +13.89%"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "NVIDIA +2.27%"
              }
            ],
            "role": null,
            "title": "半導体の増幅"
          }
        ],
        "causalScope": "sector",
        "evidenceSourceIds": [
          "source-001",
          "source-003",
          "source-004"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "半導体で増幅",
        "headline": "MCHP +13.89%",
        "initialExpression": "軽い驚き",
        "narrationChunks": [
          {
            "captionText": "ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。",
            "chunkId": "scene-06-chunk-001",
            "expression": "警戒",
            "pauseAfterMs": 120,
            "speechText": "ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。"
          },
          {
            "captionText": "ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。",
            "chunkId": "scene-06-chunk-002",
            "expression": "通常",
            "pauseAfterMs": 200,
            "speechText": "ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": null,
            "label": "08:29 ET",
            "numberId": "scene-06-qqq-01",
            "numericValue": 719.16,
            "precision": 3,
            "tone": "neutral",
            "unit": "",
            "value": "719.16"
          },
          {
            "comparison": null,
            "label": "08:30 ET",
            "numberId": "scene-06-qqq-02",
            "numericValue": 720.23,
            "precision": 3,
            "tone": "positive",
            "unit": "",
            "value": "720.23"
          },
          {
            "comparison": null,
            "label": "08:31 ET",
            "numberId": "scene-06-qqq-03",
            "numericValue": 720.531,
            "precision": 3,
            "tone": "positive",
            "unit": "",
            "value": "720.531"
          },
          {
            "comparison": "08:29→08:30 ET",
            "label": "QQQ",
            "numberId": "scene-06-release-qqq",
            "numericValue": 0.148785,
            "precision": 3,
            "tone": "positive",
            "unit": "%",
            "value": "+0.149%"
          },
          {
            "comparison": "08:29→08:30 ET",
            "label": "SOXX",
            "numberId": "scene-06-release-soxx",
            "numericValue": 0.247662,
            "precision": 3,
            "tone": "positive",
            "unit": "%",
            "value": "+0.248%"
          },
          {
            "comparison": "08:29→08:30 ET",
            "label": "NVIDIA",
            "numberId": "scene-06-release-nvidia",
            "numericValue": 0.163674,
            "precision": 3,
            "tone": "positive",
            "unit": "%",
            "value": "+0.164%"
          },
          {
            "comparison": "08:29→08:30 ET",
            "label": "MCHP",
            "numberId": "scene-06-release-mchp",
            "numericValue": -0.025132,
            "precision": 3,
            "tone": "negative",
            "unit": "%",
            "value": "-0.025%"
          }
        ],
        "performanceIntent": "Microchipを主因に昇格させず、セクター増幅として扱う",
        "purpose": "Microchip好決算が半導体上昇を増幅したことを示す",
        "sceneId": "scene-06",
        "sceneNumber": 6,
        "sceneRole": "editorial-body",
        "sourceLabel": "当日の市場データ / Reuters / Microchip IR",
        "supportingTexts": [
          "SOXX +2.02%",
          "NVIDIA +2.27%"
        ],
        "timelineBasis": "Microchip Q1 FY27決算と8月7日終値",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "MCHP一社でSOXX全体を説明しない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-06-01",
            "changeCue": "8時30分ETの1分足",
            "contentType": "event-reaction-timeline",
            "endChunkId": "scene-06-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-002",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "ら542.40。NVIDIAは219.95から220.31へ上向きました。ところがMicrochipは79.58から79.56。",
            "narrationStartCue": "ここで8時30分ETの1分足を重ねます。QQQは719.16から720.23。SOXXは541.06から542.40。NVIDI",
            "objectIds": [
              "scene-06-qqq-01",
              "scene-06-qqq-02",
              "scene-06-qqq-03"
            ],
            "pictureBook": null,
            "primaryElement": "QQQ 実1分足 08:29→08:30→08:31",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "BLS 08:30 ET前後、QQQはどう動いた？",
            "screenState": "Chart",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-06-chunk-001",
            "templateConfig": {
              "comparisonBasis": "BLS 08:30 ET発表前後",
              "dataBasis": "Longbridge verified 1-minute Kline minute-close",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "reactionTimeline": {
                "eventOrderIds": [
                  "scene-06-qqq-01",
                  "scene-06-qqq-02",
                  "scene-06-qqq-03"
                ],
                "precision": "verified-intraday-series",
                "seriesObjectIds": [
                  "scene-06-qqq-01",
                  "scene-06-qqq-02",
                  "scene-06-qqq-03"
                ]
              },
              "variant": "verified-series"
            },
            "templateVariant": "verified-series",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "QQQ 実1分足",
              "08:29 719.16 → 08:30 720.23 → 08:31 720.531"
            ],
            "visualBeatId": "vb-06-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "reaction",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualGrammarId": "reaction",
            "visualMode": "timeline",
            "visualTemplate": "event-reaction-timeline"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-06-02",
            "changeCue": "ところがMicrochipは79.58から79.56",
            "contentType": "index-return-bars",
            "endChunkId": "scene-06-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "せん。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱うのは無理があります。ここで説明が一段分かれます。",
            "narrationStartCue": "ほぼ動いていません。1分足だけで因果は証明できません。ただ、発表直後のマクロ反応とMicrochipの大幅高を同じエンジンで扱う",
            "objectIds": [
              "scene-06-release-qqq",
              "scene-06-release-soxx",
              "scene-06-release-nvidia",
              "scene-06-release-mchp"
            ],
            "pictureBook": null,
            "primaryElement": "08:29→08:30 ET 1分リターン",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "同じ1分で4銘柄は同じ反応だった？",
            "screenState": "Chart",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-06-chunk-002",
            "templateConfig": {
              "comparisonBasis": "08:29→08:30 ETの1分リターン",
              "dataBasis": "Longbridge verified 1-minute Kline minute-close",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "zero-baseline"
            },
            "templateVariant": "zero-baseline",
            "transitionRole": "continuation",
            "viewerTexts": [
              "QQQ / SOXX / NVIDIA は上向き",
              "MCHP は -0.025%でほぼ横ばい",
              "1分足だけでは因果証明しない"
            ],
            "visualBeatId": "vb-06-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "reaction",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualGrammarId": "reaction",
            "visualMode": "stock-comparison",
            "visualTemplate": "index-return-bars"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-06-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-012",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-06-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-06-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-013",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-06-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "timeline"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-07-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxAnalysis",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-07-placement-foxAnalysis",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "foxConfused",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-07-placement-foxConfused",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          },
          {
            "assetId": "daily-microchip-q1-fy27-ir-secondary",
            "endChunkId": "scene-07-chunk-001",
            "fit": "contain",
            "focalPoint": null,
            "opacity": 1,
            "placementId": "vsi-20260810-microchip-ir-placement",
            "region": "main-stage",
            "role": "main-media",
            "startChunkId": "scene-07-chunk-001"
          }
        ],
        "cards": [
          {
            "cardId": "scene-07-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "MCHP +13.89%"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "AMD -1.21%"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "Alphabet -0.96%"
              }
            ],
            "role": null,
            "title": "上昇の中の逆行"
          },
          {
            "cardId": "scene-07-card-002",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "広い金利追い風"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "個別材料で差"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "Microsoft +0.03%"
              }
            ],
            "role": null,
            "title": "全面高ではない"
          }
        ],
        "causalScope": "multiple",
        "evidenceSourceIds": [
          "source-001"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "反対材料と銘柄差",
        "headline": "全面高ではない",
        "initialExpression": "困惑",
        "narrationChunks": [
          {
            "captionText": "Microchipには会社固有の材料がありました。Q1売上14.85億ドル、非GAAP EPS0.76ドルを発表し、次の四半期売上を15.89億から16.18億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で13.89%高でした。",
            "chunkId": "scene-07-chunk-001",
            "expression": "困惑",
            "pauseAfterMs": 120,
            "speechText": "Microchipには会社固有の材料がありました。Q1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で十三・八九パーセント高でした。"
          },
          {
            "captionText": "一方でAMDは1.21%下落、Alphabetも0.96%下落、Microsoftはほぼ横ばい。つまり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。",
            "chunkId": "scene-07-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "一方でAMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばい。つまり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": "8/7通常取引",
            "label": "MCHP",
            "numberId": "scene-07-daily-mchp",
            "numericValue": 13.89,
            "precision": 2,
            "tone": "positive",
            "unit": "%",
            "value": "+13.89%"
          },
          {
            "comparison": "8/7通常取引",
            "label": "AMD",
            "numberId": "scene-07-daily-amd",
            "numericValue": -1.21,
            "precision": 2,
            "tone": "negative",
            "unit": "%",
            "value": "-1.21%"
          },
          {
            "comparison": "8/7通常取引",
            "label": "Alphabet",
            "numberId": "scene-07-daily-alphabet",
            "numericValue": -0.96,
            "precision": 2,
            "tone": "negative",
            "unit": "%",
            "value": "-0.96%"
          },
          {
            "comparison": "8/7通常取引",
            "label": "Microsoft",
            "numberId": "scene-07-daily-microsoft",
            "numericValue": 0.03,
            "precision": 2,
            "tone": "positive",
            "unit": "%",
            "value": "+0.03%"
          }
        ],
        "performanceIntent": "説明を自分で壊しにいく調子で過剰一般化を止める",
        "purpose": "逆行銘柄で単純な全面高ストーリーを壊す",
        "sceneId": "scene-07",
        "sceneNumber": 7,
        "sceneRole": "editorial-body",
        "sourceLabel": "当日の市場データ",
        "supportingTexts": [
          "AMD -1.21%",
          "Alphabet -0.96% / MSFT +0.03%"
        ],
        "timelineBasis": "8月7日通常取引終値",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "個別材料を完全分離していない",
        "visualBeats": [
          {
            "assetPlacementIds": [
              "vsi-20260810-microchip-ir-placement"
            ],
            "assetState": "ready",
            "beatId": "vb-07-01",
            "changeCue": "Microchipには会社固有の材料",
            "contentType": "news-media",
            "endChunkId": "scene-07-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-004"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "・八九億から十六・一八億ドルと見込みました。需要改善や在庫正常化も説明しています。MCHPは終日で十三・八九パーセント高でした。",
            "narrationStartCue": "Microchipには会社固有の材料がありました。Q1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売",
            "objectIds": [],
            "pictureBook": null,
            "primaryElement": "Microchip Q1 FY27 公式IR",
            "primaryFunction": "Compare",
            "returnScreenState": null,
            "screenQuestion": "Microchipは何を発表した？",
            "screenState": "News",
            "sequencePolicy": "static",
            "startChunkId": "scene-07-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Microchip Technology official Q1 FY27 investor-relations release",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "Microchip Q1 FY27 公式IR",
              "売上 14.85億ドル / 非GAAP EPS 0.76ドル",
              "次四半期売上 15.89億〜16.18億ドル"
            ],
            "visualBeatId": "vb-07-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "evidence",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualGrammarId": "evidence",
            "visualMode": "news-media",
            "visualTemplate": "news-media"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-07-02",
            "changeCue": "一方でAMDは一・二一パーセント下落",
            "contentType": "diverging-stock-bars",
            "endChunkId": "scene-07-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-004"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "まり半導体高にも、マクロの金利経路とMicrochipの決算という別エンジンがあり、追い風もテック全体へ均等には届いていません。",
            "narrationStartCue": "一方でAMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばい。つまり半導体高に",
            "objectIds": [
              "scene-07-daily-mchp",
              "scene-07-daily-amd",
              "scene-07-daily-alphabet",
              "scene-07-daily-microsoft"
            ],
            "pictureBook": null,
            "primaryElement": "MCHP +13.89% / AMD・Alphabetは下落",
            "primaryFunction": "Compare",
            "returnScreenState": null,
            "screenQuestion": "同じテックでも終日は同じ方向だった？",
            "screenState": "Chart",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-07-chunk-002",
            "templateConfig": {
              "comparisonBasis": "8月7日通常取引終値",
              "dataBasis": "verified close data + Microchip official IR",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "center-zero"
            },
            "templateVariant": "center-zero",
            "transitionRole": "continuation",
            "viewerTexts": [
              "MCHP +13.89%",
              "AMD -1.21% / Alphabet -0.96%",
              "Microsoft +0.03%"
            ],
            "visualBeatId": "vb-07-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "comparison",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualGrammarId": "comparison",
            "visualMode": "stock-comparison",
            "visualTemplate": "diverging-stock-bars"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-07-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-014",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-07-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-07-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-015",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-07-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "number-comparison"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-08-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxNormal",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-08-placement-foxNormal",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-08-card-001",
            "lines": [
              {
                "label": "QQQ",
                "tone": "neutral",
                "value": "719.16 → 720.23"
              },
              {
                "label": "SOXX",
                "tone": "neutral",
                "value": "541.06 → 542.40"
              },
              {
                "label": "NVDA",
                "tone": "neutral",
                "value": "219.95 → 220.31"
              }
            ],
            "role": null,
            "title": "8:30 ETの実分足"
          },
          {
            "cardId": "scene-08-card-002",
            "lines": [
              {
                "label": "因果",
                "tone": "neutral",
                "value": "1分足は因果証明ではない"
              },
              {
                "label": "MCHP",
                "tone": "neutral",
                "value": "79.58 → 79.56"
              }
            ],
            "role": null,
            "title": "境界"
          },
          {
            "cardId": "scene-08-h5-strengthen-macro",
            "lines": [
              {
                "label": "強める1",
                "tone": "positive",
                "value": "雇用下振れ→利上げ観測後退"
              }
            ],
            "role": null,
            "title": "強める1"
          },
          {
            "cardId": "scene-08-h5-strengthen-reaction",
            "lines": [
              {
                "label": "強める2",
                "tone": "positive",
                "value": "QQQ・SOXX・NVIDIA初動↑"
              }
            ],
            "role": null,
            "title": "強める2"
          },
          {
            "cardId": "scene-08-h5-weaken-boundary",
            "lines": [
              {
                "label": "弱める1",
                "tone": "warning",
                "value": "1分足だけでは因果証明できない"
              }
            ],
            "role": null,
            "title": "弱める1"
          },
          {
            "cardId": "scene-08-h5-weaken-counter",
            "lines": [
              {
                "label": "弱める2",
                "tone": "warning",
                "value": "成長不安・AMD/Alphabet下落"
              }
            ],
            "role": null,
            "title": "弱める2"
          },
          {
            "cardId": "scene-08-h5-path-macro",
            "lines": [
              {
                "label": "経路1",
                "tone": "positive",
                "value": "雇用→利上げ観測後退"
              }
            ],
            "role": null,
            "title": "経路1"
          },
          {
            "cardId": "scene-08-h5-path-company",
            "lines": [
              {
                "label": "経路2",
                "tone": "neutral",
                "value": "Microchip決算は別エンジン"
              }
            ],
            "role": null,
            "title": "経路2"
          },
          {
            "cardId": "scene-08-h5-summary-amplifier",
            "lines": [
              {
                "label": "まとめ1",
                "tone": "neutral",
                "value": "原油・利回り低下は増幅"
              }
            ],
            "role": null,
            "title": "まとめ1"
          },
          {
            "cardId": "scene-08-h5-summary-conclusion",
            "lines": [
              {
                "label": "まとめ2",
                "tone": "emphasis",
                "value": "違う理由の上昇が同じ方向へ重なった"
              }
            ],
            "role": null,
            "title": "まとめ2"
          }
        ],
        "causalScope": "multiple",
        "evidenceSourceIds": [
          "source-003",
          "source-004",
          "source-005"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "どこまで言える？",
        "headline": "言える / 言わない",
        "initialExpression": "分析",
        "narrationChunks": [
          {
            "captionText": "最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型テックへの金利逆風が和らいだことです。QQQ、SOXX、NVIDIAの8時30分の初動も、その時系列とは合います。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。",
            "chunkId": "scene-08-chunk-001",
            "expression": "通常",
            "pauseAfterMs": 120,
            "speechText": "最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型テックへの金利逆風が和らいだことです。QQQ、SOXX、NVIDIAの8時30分の初動も、その時系列とは合います。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。"
          },
          {
            "captionText": "原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。",
            "chunkId": "scene-08-chunk-002",
            "expression": "通常",
            "pauseAfterMs": 200,
            "speechText": "原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。"
          }
        ],
        "nodes": [],
        "numbers": [],
        "performanceIntent": "結論を曖昧にせず、時系列で確認できたことと因果として断定しないことを分ける",
        "purpose": "発表時刻の実分足と個別差を残して、安全な結論の境界を示す",
        "sceneId": "scene-08",
        "sceneNumber": 8,
        "sceneRole": "editorial-body",
        "sourceLabel": "BLS / Reuters / Longbridge 1分Kline / Microchip IR",
        "supportingTexts": [
          "主因候補：利上げ観測後退",
          "ただし因果証明ではない"
        ],
        "timelineBasis": "verified-series-plus-official-time-plus-close",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "1分足は発表時刻との初動整合を確認する証拠であり、雇用統計が終日上昇の原因だったことや各要因の寄与度を単独では証明しない。MCHPは同じ発表分でほぼ横ばいだったため、会社固有材料を別の増幅要因として扱う。",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-08-01",
            "changeCue": "最初の矛盾に戻ります",
            "contentType": "verification-matrix",
            "endChunkId": "scene-08-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-003",
              "source-004",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "。ただし1分足は因果証明ではありません。そしてMicrochipは同じ1分では動かず、決算という別エンジンで終日大きく上がった。",
            "narrationStartCue": "最初の矛盾に戻ります。弱い雇用なのにNASDAQが上がった。いちばん筋が通るマクロの説明は、雇用下振れで利上げ観測が後退し、大型",
            "objectIds": [
              "scene-08-h5-strengthen-macro",
              "scene-08-h5-strengthen-reaction",
              "scene-08-h5-weaken-boundary",
              "scene-08-h5-weaken-counter"
            ],
            "pictureBook": null,
            "primaryElement": "利上げ観測後退を中心に境界を残す",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "マクロ仮説を強める材料と弱める材料は？",
            "screenState": "Data",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-08-chunk-001",
            "templateConfig": {
              "comparisonBasis": "中心仮説の支持と反対材料",
              "dataBasis": "approved causal dossier + verified timing evidence",
              "laneLabels": [
                "強める",
                "弱める"
              ],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "strengthen-vs-weaken"
            },
            "templateVariant": "strengthen-vs-weaken",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "強める｜雇用下振れ→利上げ観測後退",
              "強める｜QQQ・SOXX・NVIDIA初動↑",
              "弱める｜1分足だけでは因果証明できない",
              "弱める｜成長不安・AMD/Alphabet下落"
            ],
            "visualBeatId": "vb-08-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "verification",
              "returnTargetBeatId": null,
              "transitionRole": "major-shift"
            },
            "visualGrammarId": "verification",
            "visualMode": "verification-points",
            "visualTemplate": "verification-matrix"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-08-02",
            "changeCue": "原油や利回り低下は増幅要因",
            "contentType": "verification-checklist",
            "endChunkId": "scene-08-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-003",
              "source-004",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "材料です。僕の結論は中程度の確信で、昨夜は一つの理由で全部が上がったのではなく、違う理由の上昇が同じ指数方向へ重なった夜でした。",
            "narrationStartCue": "原油や利回り低下は増幅要因。雇用が示す成長不安とAMD、Alphabetの下落は反対材料です。僕の結論は中程度の確信で、昨夜は一",
            "objectIds": [
              "scene-08-h5-path-macro",
              "scene-08-h5-path-company",
              "scene-08-h5-summary-amplifier",
              "scene-08-h5-summary-conclusion"
            ],
            "pictureBook": null,
            "primaryElement": "複数エンジンが同じ指数方向へ重なった",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "最後に何を残す？",
            "screenState": "Data",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-08-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "approved causal dossier",
              "laneLabels": [
                "経路",
                "まとめ"
              ],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "continuation",
            "viewerTexts": [
              "主役候補｜雇用→利上げ観測後退",
              "別エンジン｜Microchip決算",
              "増幅｜原油・利回り低下",
              "結論｜違う理由の上昇が同じ方向へ重なった"
            ],
            "visualBeatId": "vb-08-02",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "verification",
              "returnTargetBeatId": null,
              "transitionRole": "continuation"
            },
            "visualGrammarId": "verification",
            "visualMode": "verification-points",
            "visualTemplate": "verification-checklist"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-08-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-016",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-08-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-08-chunk-002",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-017",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-08-card-002",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "verification-points"
      },
      {
        "arrows": [],
        "assetPlacements": [
          {
            "assetId": "mainBackground",
            "endChunkId": null,
            "fit": "cover",
            "opacity": 1,
            "placementId": "scene-09-placement-background",
            "region": "full-canvas",
            "role": "background",
            "startChunkId": null
          },
          {
            "assetId": "foxSleepy",
            "endChunkId": null,
            "fit": "contain",
            "opacity": 1,
            "placementId": "scene-09-placement-foxSleepy",
            "region": "fox-left",
            "role": "fox-expression",
            "startChunkId": null
          }
        ],
        "cards": [
          {
            "cardId": "scene-09-card-001",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "雇用 -2.3万人"
              },
              {
                "label": "2",
                "tone": "neutral",
                "value": "NASDAQ +1.30%"
              },
              {
                "label": "3",
                "tone": "neutral",
                "value": "主因候補：利上げ観測後退"
              }
            ],
            "role": null,
            "title": "本編の三点回収"
          }
        ],
        "causalScope": "multiple",
        "evidenceSourceIds": [
          "source-001",
          "source-002",
          "source-003"
        ],
        "expectedBasisType": "major-reporting",
        "formalName": "いってらっしゃい、おやすみ",
        "headline": "悪材料が消えた夜ではない",
        "initialExpression": "眠そう",
        "narrationChunks": [
          {
            "captionText": "以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。",
            "chunkId": "scene-09-chunk-001",
            "expression": "眠そう",
            "pauseAfterMs": 200,
            "speechText": "以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。"
          }
        ],
        "nodes": [],
        "numbers": [],
        "performanceIntent": "安心できる温度で短く締める",
        "purpose": "中心結論を回収し固定エンディングへつなぐ",
        "sceneId": "scene-09",
        "sceneNumber": 9,
        "sceneRole": "fixed-ending",
        "sourceLabel": "当日の市場データ / BLS / Reuters",
        "supportingTexts": [
          "採点表が金利へ移った",
          "NASDAQ +1.30%"
        ],
        "timelineBasis": "本編の回収",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "新情報は追加しない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-09-01",
            "changeCue": "雇用 -2.3万人",
            "contentType": "closing-recap",
            "endChunkId": "scene-09-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。",
            "narrationStartCue": "以上、朝のNASDAQカフェでした。今日も気をつけて、いってらっしゃい。こちらはそろそろ、おやすみなさい。",
            "objectIds": [
              "scene-09-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "雇用・金利・NASDAQの回収",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "今朝の結論は何か",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-09-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "本編の回収",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "viewerTexts": [
              "雇用 -2.3万人",
              "NASDAQ +1.30%",
              "主因候補：利上げ観測後退"
            ],
            "visualBeatId": "vb-09-01",
            "visualGrammar": {
              "contractVersion": "1.0.0",
              "grammarId": "assembly",
              "returnTargetBeatId": null,
              "transitionRole": "closing"
            },
            "visualMode": "conclusion-card",
            "visualTemplate": "closing-recap"
          }
        ],
        "visualEvents": [
          {
            "action": "show",
            "atChunkId": "scene-09-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-018",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-09-card-001",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "conclusion-card"
      }
    ],
    "schemaVersion": "2.4.0",
    "sources": [
      {
        "accessedAt": "2026-08-10T12:52:00+09:00",
        "narrationAttribution": "当日の市場データ",
        "publishedAt": "2026-08-10T03:14:52Z",
        "publisher": "朝のNASDAQカフェ source collector / Longbridge",
        "reference": "daily-inputs/2026-08-10/daily_source_package_2026-08-10.md",
        "sourceId": "source-001",
        "sourceType": "market-data",
        "title": "NASDAQ Cafe Source Pack 2026-08-10",
        "usedFor": [
          "Nasdaq Composite、SOXX、MCHP、NVDA、AMD、Alphabet、Microsoftの終値と騰落率"
        ]
      },
      {
        "accessedAt": "2026-08-10T12:52:00+09:00",
        "narrationAttribution": "米労働統計局",
        "publishedAt": "2026-08-07T08:30:00-04:00",
        "publisher": "U.S. Bureau of Labor Statistics",
        "reference": "https://www.bls.gov/news.release/empsit.nr0.htm",
        "sourceId": "source-002",
        "sourceType": "official",
        "title": "Employment Situation — July 2026",
        "usedFor": [
          "7月雇用者数-2.3万人",
          "失業率4.1%",
          "5月・6月合計-10.3万人下方修正",
          "8:30 ET発表時刻"
        ]
      },
      {
        "accessedAt": "2026-08-10T12:52:00+09:00",
        "narrationAttribution": "Reuters",
        "publishedAt": null,
        "publisher": "Reuters",
        "reference": "https://www.reuters.com/business/sp-500-dow-futures-muted-ahead-jobs-data-chips-software-stocks-rise-2026-08-07/",
        "sourceId": "source-003",
        "sourceType": "major-media",
        "title": "S&P 500, Nasdaq rise as weak jobs data cool rate-hike expectations",
        "usedFor": [
          "市場予想+8万人",
          "次回利上げ確率44%・前日55%・1週前67%",
          "弱い雇用とNASDAQ上昇の市場解釈",
          "原油・利回り低下と好決算の支援材料"
        ]
      },
      {
        "accessedAt": "2026-08-10T12:52:00+09:00",
        "narrationAttribution": "Microchip Investor Relations",
        "publishedAt": null,
        "publisher": "Microchip Technology Investor Relations",
        "reference": "research/2026-08-10/evidence/RA-W2-005_exact_url_archive.json",
        "sourceId": "source-004",
        "sourceType": "company",
        "title": "Microchip Technology Announces Financial Results for First Quarter of Fiscal Year 2027",
        "usedFor": [
          "Q1 FY27売上14.85億ドル",
          "非GAAP EPS 0.76ドル",
          "次四半期売上15.89億〜16.18億ドル",
          "需要改善・在庫正常化の会社説明"
        ]
      },
      {
        "accessedAt": "2026-08-10T12:52:00+09:00",
        "narrationAttribution": "追加取得結果",
        "publishedAt": "2026-08-10T03:55:19Z",
        "publisher": "NASDAQ Cafe Collector / Longbridge",
        "reference": "research/2026-08-10/research_acquisition_result_w02.json",
        "sourceId": "source-005",
        "sourceType": "other",
        "title": "Research Acquisition Result Wave 2",
        "usedFor": [
          "QQQ、SOXX、MCHP、NVDAの検証済み1分足と8:30 ET初動比較"
        ]
      }
    ],
    "voiceProfileId": "gemini-charon"
  },
  "renderer_contract": {
    "repository": "saienjoy0/saienjoy0-nasdaq-cafe-remotion",
    "schema_version": "2.4.0"
  }
}
```
<!--END_FINAL_PRODUCTION_SOURCE-->
