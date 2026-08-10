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

- Scene 1｜寝ている間に何が起きた？｜opening-contradiction → analogy-steps
- Scene 2｜今朝の矛盾｜hero-number → text-focus
- Scene 3｜Expected / Actual / Gap｜expected-actual-gap-flow → text-focus
- Scene 4｜採点表が変わった｜expected-actual-gap-flow → evidence-boundary
- Scene 5｜世界からNASDAQへの経路｜hero-number → text-focus
- Scene 6｜半導体で増幅｜event-reaction-timeline → market-pulse-grid
- Scene 7｜反対材料と銘柄差｜diverging-stock-bars → text-focus
- Scene 8｜どこまで言える？｜verification-matrix → evidence-boundary → verification-checklist → evidence-boundary → verification-checklist
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
  - 終了合図：、市場予想のプラス八万人に対してマイナス二・三万人。景気にはかなり弱い数字です。悪い雇用なのに、なぜNASDAQは上がったのか。
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
  - 開始合図：僕は今日は、このねじれを一本だけ追います。結論から言うと、市場が喜んだのは雇用悪化そのものではありません。次の利上げが必要になる
  - 終了合図：たことが、大型テックには先に追い風として評価された。そこへ半導体の好決算や原油・金利の追い風が重なった、というのが僕の整理です。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：analogy / continuation
  - Visual Template ID：analogy-steps
  - Template Variant：default
  - 入力構造：悪い雇用→株高？ / 見るべきは利上げ観測
  - 画面の問い：悪材料がなぜ株高へ変わったか
  - 主要要素：成長ではなく金利の採点表
  - 視聴者向けテキスト：悪い雇用→株高？ / 見るべきは利上げ観測
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

### 完成ナレーション

おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところが、その前に出た7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人。景気にはかなり弱い数字です。悪い雇用なのに、なぜNASDAQは上がったのか。僕は今日は、このねじれを一本だけ追います。結論から言うと、市場が喜んだのは雇用悪化そのものではありません。次の利上げが必要になる可能性が下がったことが、大型テックには先に追い風として評価された。そこへ半導体の好決算や原油・金利の追い風が重なった、というのが僕の整理です。

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
  - 開始合図：まずBLSの数字を確認します。7月の非農業部門雇用者数は二・三万人減少、失業率は四・一パーセントでした。しかも5月と6月の雇用増
  - 終了合図：でした。しかも5月と6月の雇用増も、合わせて十・三万人下方修正されています。つまり、弱かったのは一つの見出しだけではありません。
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
  - 開始合図：ここまで見ると普通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の
  - 終了合図：通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の矛盾になります。
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

まずBLSの数字を確認します。7月の非農業部門雇用者数は二・三万人減少、失業率は四・一パーセントでした。しかも5月と6月の雇用増も、合わせて十・三万人下方修正されています。つまり、弱かったのは一つの見出しだけではありません。ここまで見ると普通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の矛盾になります。

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
  - 開始合図：期待との差を数字にすると、もっと分かりやすいです。Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gap
  - 終了合図：Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gapはマイナス十・三万人です。かなり大きな下振れです。
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
  - 開始合図：ここで面白いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読
  - 終了合図：いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読みました。
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

期待との差を数字にすると、もっと分かりやすいです。Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gapはマイナス十・三万人です。かなり大きな下振れです。ここで面白いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読みました。

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
  - 開始合図：その金利の採点表を見ると、答えがかなり見えます。Reutersによると、次回のFed会合で利上げが行われる確率は約四十四パーセン
  - 終了合図：しました。前日は五十五パーセント、1週間前は六十七パーセントです。景気のテストでは赤点でも、金利のテストでは少し安心材料になる。
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
  - 開始合図：そんなねじれです。金利がさらに上がるリスクが後退すれば、将来の利益を長く織り込む大型テックには評価上の逆風が和らぎます。『悪い雇
  - 終了合図：には評価上の逆風が和らぎます。『悪い雇用だから株高』ではなく、『悪い雇用で追加利上げの必要性が下がった』。ここが昨夜の中心です。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：evidence-boundary
  - Template Variant：confirmed-vs-unconfirmed
  - 入力構造：確認済み：利上げ確率は低下 / 解釈：金利逆風が和らいだ
  - 画面の問い：市場の採点表はどう変わった？
  - 主要要素：利上げ観測 67% → 55% → 44%
  - 視聴者向けテキスト：利上げ確率 約44% / 前日55% / 1週前67%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003

### 完成ナレーション

その金利の採点表を見ると、答えがかなり見えます。Reutersによると、次回のFed会合で利上げが行われる確率は約四十四パーセントまで低下しました。前日は五十五パーセント、1週間前は六十七パーセントです。景気のテストでは赤点でも、金利のテストでは少し安心材料になる。そんなねじれです。金利がさらに上がるリスクが後退すれば、将来の利益を長く織り込む大型テックには評価上の逆風が和らぎます。『悪い雇用だから株高』ではなく、『悪い雇用で追加利上げの必要性が下がった』。ここが昨夜の中心です。

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
  - 開始合図：ただし、ここで雇用統計だけに全部を背負わせると雑になります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、
  - 終了合図：なります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。
  - 主要視覚機能：Anchor
  - 画面状態：Data
  - Visual Grammar：evidence / major-shift
  - Visual Template ID：hero-number
  - Template Variant：default
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
  - 開始合図：企業決算も全体として強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と
  - 終了合図：て強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と見るのが自然です。
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
  - 開始合図：主役は一つでも、舞台装置は一つではありません。
  - 終了合図：主役は一つでも、舞台装置は一つではありません。
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

ただし、ここで雇用統計だけに全部を背負わせると雑になります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。企業決算も全体として強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と見るのが自然です。主役は一つでも、舞台装置は一つではありません。

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
  - 開始合図：半導体では、その増幅が特にはっきり見えます。MicrochipはQ1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し
  - 終了合図：・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。会社は需要改善や在庫正常化も説明しています。
  - 主要視覚機能：Explain
  - 画面状態：Chart
  - Visual Grammar：reaction / major-shift
  - Visual Template ID：event-reaction-timeline
  - Template Variant：official-time-plus-close
  - 入力構造：08:30 ET BLS発表 / 利上げ確率 約44% / 引け NASDAQ +1.30%
  - 画面の問い：確認できる順番はどこまでか
  - 主要要素：公式時刻＋引け
  - 視聴者向けテキスト：08:30 ET BLS発表 / 利上げ確率 約44% / 引け NASDAQ +1.30%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-002, source-003

<!--VISUAL_BEAT:scene-06:vb-06-02-->
- **scene-06-beat-002**
  - 開始合図：MCHPは十三・八九パーセント高、SOXXは二・〇二パーセント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マク
  - 終了合図：セント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マクロの金利追い風に、企業固有の好決算が上乗せされた形です。
  - 主要視覚機能：Explain
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：market-pulse-grid
  - Template Variant：grid
  - 入力構造：SOXX +2.02% / MCHP +13.89% / NVIDIA +2.27%
  - 画面の問い：半導体はどれだけ上乗せされたか
  - 主要要素：SOXX・MCHP・NVIDIA終値
  - 視聴者向けテキスト：SOXX +2.02% / MCHP +13.89% / NVIDIA +2.27%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-004

### 完成ナレーション

半導体では、その増幅が特にはっきり見えます。MicrochipはQ1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。会社は需要改善や在庫正常化も説明しています。MCHPは十三・八九パーセント高、SOXXは二・〇二パーセント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マクロの金利追い風に、企業固有の好決算が上乗せされた形です。

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
  - 開始合図：ここで一度、この説明を壊しにいきます。AMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsof
  - 終了合図：した。なので『弱い雇用でテック全部が買われた』ではありませんし、Microchip一社がNASDAQを上げたわけでもありません。
  - 主要視覚機能：Compare
  - 画面状態：Chart
  - Visual Grammar：comparison / major-shift
  - Visual Template ID：diverging-stock-bars
  - Template Variant：center-zero
  - 入力構造：MCHP +13.89% / AMD -1.21% / Alphabet -0.96%
  - 画面の問い：テック・半導体は全部上がったか
  - 主要要素：MCHPと逆行銘柄
  - 視聴者向けテキスト：MCHP +13.89% / AMD -1.21% / Alphabet -0.96%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-004

<!--VISUAL_BEAT:scene-07:vb-07-02-->
- **scene-07-beat-002**
  - 開始合図：広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。
  - 終了合図：広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。
  - 主要視覚機能：Compare
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：tailwind-headwind
  - Template Variant：two-lane
  - 入力構造：広い金利追い風 / 個別材料で差 / Microsoft +0.03%
  - 画面の問い：広い追い風と個別差をどう両立するか
  - 主要要素：マクロと個別の二層
  - 視聴者向けテキスト：広い金利追い風 / 個別材料で差 / Microsoft +0.03%
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-001, source-003

### 完成ナレーション

ここで一度、この説明を壊しにいきます。AMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばいでした。なので『弱い雇用でテック全部が買われた』ではありませんし、Microchip一社がNASDAQを上げたわけでもありません。広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。

- ナレーションで示す出典主体・媒体：当日の市場データ
- 大テロップ：全面高ではない
- 補助テロップ：AMD -1.21% / Alphabet -0.96%/MSFT +0.03%
- 使用する数字：MCHP +13.89%、AMD -1.21%、Alphabet -0.96%、Microsoft +0.03%
- 画面で見せる内容：AMD -1.21% / Alphabet -0.96%/MSFT +0.03%
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

<!--VISUAL_BEAT:scene-08:scene-08-beat-001-->
- **scene-08-beat-001**
  - 開始合図：最後に、時系列まで確認します。8時30分ETの発表の1分前から発表分へ、NASDAQの代理として見るQQQは719.16から720.23、SOXXは541.06
  - 終了合図：SDAQの代理として見るQQQは719.16から720.23、SOXXは541.06から542.40、NVIDIAは219.95から220.31へ上向きました。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：verification / major-shift
  - Visual Template ID：verification-matrix
  - Template Variant：strengthen-vs-weaken
  - 入力構造：8:30 ET：QQQ・SOXX・NVDAは上向き / MCHPは同じ1分でほぼ横ばい / 1分足だけで因果は証明しない
  - 画面の問い：発表時刻の初動は市場解釈と整合した？
  - 主要要素：8:30 ETの実分足と因果の境界
  - 視聴者向けテキスト：8:30 ET：QQQ・SOXX・NVDAは上向き / MCHPは同じ1分でほぼ横ばい / 1分足だけで因果は証明しない
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

<!--VISUAL_BEAT:scene-08:scene-08-beat-002-->
- **scene-08-beat-002**
  - 開始合図：だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。
  - 終了合図：だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：evidence-boundary
  - Template Variant：confirmed-vs-unconfirmed
  - 入力構造：8:30 ET：QQQ・SOXX・NVDAは上向き / MCHPは同じ1分でほぼ横ばい / 1分足だけで因果は証明しない
  - 画面の問い：発表時刻の初動は市場解釈と整合した？
  - 主要要素：8:30 ETの実分足と因果の境界
  - 視聴者向けテキスト：8:30 ET：QQQ・SOXX・NVDAは上向き / MCHPは同じ1分でほぼ横ばい / 1分足だけで因果は証明しない
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

<!--VISUAL_BEAT:scene-08:scene-08-beat-003-->
- **scene-08-beat-003a**
  - 開始合図：MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。
  - 終了合図：MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：verification / continuation
  - Visual Template ID：verification-checklist
  - Template Variant：default
  - 入力構造：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 画面の問い：どこまでを安全な結論にするか
  - 主要要素：主因候補・増幅要因・反対材料の境界
  - 視聴者向けテキスト：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

<!--VISUAL_BEAT:scene-08:scene-08-beat-004-->
- **scene-08-beat-004b**
  - 開始合図：僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。
  - 終了合図：僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：evidence / continuation
  - Visual Template ID：evidence-boundary
  - Template Variant：confirmed-vs-unconfirmed
  - 入力構造：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 画面の問い：どこまでを安全な結論にするか
  - 主要要素：主因候補・増幅要因・反対材料の境界
  - 視聴者向けテキスト：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

<!--VISUAL_BEAT:scene-08:scene-08-beat-005-->
- **scene-08-beat-005c**
  - 開始合図：成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。
  - 終了合図：成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。
  - 主要視覚機能：Evidence
  - 画面状態：Data
  - Visual Grammar：verification / continuation
  - Visual Template ID：verification-checklist
  - Template Variant：default
  - 入力構造：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 画面の問い：どこまでを安全な結論にするか
  - 主要要素：主因候補・増幅要因・反対材料の境界
  - 視聴者向けテキスト：言える：初動は金利解釈と整合 / 言わない：1分足だけで終日上昇の原因を断定 / 分ける：MCHPは会社固有の増幅要因
  - 使用アセットID：not-required
  - アセット状態：not-required
  - 表示後の復帰先：該当なし
  - Primary / Approved Fallback：not-required
  - selected_path：not-required
  - 根拠ID：source-003, source-004, source-005

### 完成ナレーション

最後に、時系列まで確認します。8時30分ETの発表の1分前から発表分へ、NASDAQの代理として見るQQQは719.16から720.23、SOXXは541.06から542.40、NVIDIAは219.95から220.31へ上向きました。だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。

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

<!--BEGIN_FINANCIAL_VISUAL_ANNEX-->
```json
{
  "annexVersion": "1.0.0",
  "candidatePlans": [
    {
      "causalStepIds": [],
      "comparisonBasis": "2026-08-07米国通常取引終値",
      "displayOrder": [
        "metric.soxx.close-return",
        "metric.mchp.close-return",
        "metric.nvidia.close-return"
      ],
      "endCueRef": "episode://scene-06/vb-06-02/endCue",
      "headlineRef": "episode://scene-06/vb-06-02/headline",
      "highlightObjectIds": [],
      "intentId": "fvi-market-snapshot-s06b02",
      "metricIds": [
        "metric.soxx.close-return",
        "metric.mchp.close-return",
        "metric.nvidia.close-return"
      ],
      "path": "preferred",
      "planId": "fvp-market-snapshot-s06b02-preferred",
      "planVersion": "1.0.0",
      "recipeId": "market-pulse-grid",
      "returnTargetRef": "episode://scene-06/vb-06-02/returnTarget",
      "sceneId": "scene-06",
      "screenQuestionRef": "episode://scene-06/vb-06-02/screenQuestion",
      "screenState": "Data",
      "sourceIds": [
        "source-001",
        "source-003",
        "source-004"
      ],
      "startCueRef": "episode://scene-06/vb-06-02/startCue",
      "templateVariant": "default",
      "visualBeatId": "vb-06-02",
      "visualTemplateId": "market-pulse-grid"
    },
    {
      "causalStepIds": [],
      "comparisonBasis": "2026-08-07米国通常取引終値",
      "displayOrder": [
        "metric.soxx.close-return",
        "metric.mchp.close-return",
        "metric.nvidia.close-return"
      ],
      "endCueRef": "episode://scene-06/vb-06-02/endCue",
      "headlineRef": "episode://scene-06/vb-06-02/fallbackHeadline",
      "highlightObjectIds": [],
      "intentId": "fvi-market-snapshot-s06b02",
      "metricIds": [
        "metric.soxx.close-return",
        "metric.mchp.close-return",
        "metric.nvidia.close-return"
      ],
      "path": "fallback",
      "planId": "fvp-market-snapshot-s06b02-fallback",
      "planVersion": "1.0.0",
      "recipeId": "opening-contradiction",
      "returnTargetRef": "episode://scene-06/vb-06-02/returnTarget",
      "sceneId": "scene-06",
      "screenQuestionRef": "episode://scene-06/vb-06-02/fallbackQuestion",
      "screenState": "Data",
      "sourceIds": [
        "source-001",
        "source-003",
        "source-004"
      ],
      "startCueRef": "episode://scene-06/vb-06-02/startCue",
      "templateVariant": "default",
      "visualBeatId": "vb-06-02",
      "visualTemplateId": "opening-contradiction"
    }
  ],
  "intents": [
    {
      "causalSteps": [],
      "chartPolicy": "no-series",
      "dataPrecision": "market-close",
      "editorialNote": "マクロの金利追い風にMicrochip好決算が半導体上昇を増幅したことを、8月7日通常取引終値だけで示す。分足系列は使わない。",
      "fallbackPlanId": "fvp-market-snapshot-s06b02-fallback",
      "intentContractVersion": "1.1.0",
      "intentId": "fvi-market-snapshot-s06b02",
      "kind": "market-snapshot",
      "metrics": [
        {
          "currency": null,
          "entityId": "SOXX",
          "label": "SOXX",
          "metricId": "metric.soxx.close-return",
          "numericValue": 2.02,
          "period": "2026-08-07 close",
          "role": "market",
          "sessionDate": "2026-08-07",
          "sourceIds": [
            "source-001"
          ],
          "unit": "%",
          "valueText": "+2.02%"
        },
        {
          "currency": null,
          "entityId": "MCHP",
          "label": "MCHP",
          "metricId": "metric.mchp.close-return",
          "numericValue": 13.89,
          "period": "2026-08-07 close",
          "role": "market",
          "sessionDate": "2026-08-07",
          "sourceIds": [
            "source-001",
            "source-004"
          ],
          "unit": "%",
          "valueText": "+13.89%"
        },
        {
          "currency": null,
          "entityId": "NVIDIA",
          "label": "NVIDIA",
          "metricId": "metric.nvidia.close-return",
          "numericValue": 2.27,
          "period": "2026-08-07 close",
          "role": "market",
          "sessionDate": "2026-08-07",
          "sourceIds": [
            "source-001"
          ],
          "unit": "%",
          "valueText": "+2.27%"
        }
      ],
      "preferredPlanId": "fvp-market-snapshot-s06b02-preferred",
      "selectionState": {
        "compilerReasonCodes": [],
        "compilerSelection": "not-run",
        "fallbackDiversityRecheck": "not-run",
        "selectedPlanId": null,
        "selectedRecipeId": null,
        "selectedVisualTemplateId": null
      },
      "sourceIds": [
        "source-001",
        "source-003",
        "source-004"
      ],
      "status": "approved",
      "target": {
        "sceneId": "scene-06",
        "visualBeatId": "vb-06-02"
      }
    }
  ]
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
            "grammarId": "analogy",
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
            "grammarId": "evidence",
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
            "grammarId": "evidence",
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
            "grammarId": "evidence",
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
            "grammarId": "comparison",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "vb-07-02",
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
      "sceneId": "scene-08",
      "visualBeats": [
        {
          "visualBeatId": "scene-08-beat-001",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "verification",
            "returnTargetBeatId": null,
            "transitionRole": "major-shift"
          }
        },
        {
          "visualBeatId": "scene-08-beat-002",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        },
        {
          "visualBeatId": "scene-08-beat-003",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "verification",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        },
        {
          "visualBeatId": "scene-08-beat-004",
          "visualGrammar": {
            "contractVersion": "1.0.0",
            "grammarId": "evidence",
            "returnTargetBeatId": null,
            "transitionRole": "continuation"
          }
        },
        {
          "visualBeatId": "scene-08-beat-005",
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
    "sha256": "cde4d74eb0b6ddb032e80454f90696c8ff9a59569f20148a89d14676ecf8d166"
  },
  "contract_version": "1.0.0",
  "creative_review": {
    "path": "working/2026-08-10/story-engine/creative_review.json",
    "sha256": "4e24377f9568297be73ff4ef94237dc54496552173f47018ea66fd4e484b108d"
  },
  "critic": {
    "critic_certified": false,
    "external_critic_status": "not_run",
    "reviewer": "editorial_critic",
    "round": 2,
    "score": 29,
    "verdict": "pass"
  },
  "episode_date": "2026-08-10",
  "projection": {
    "path": "working/2026-08-10/story-engine/story_projection_report.json",
    "sha256": "1648e524d01d40d8a3072ed8f93ecfde7bd6ed84dc684e6d9ca6ea23531259dd"
  },
  "status": "pass",
  "story_plan": {
    "path": "working/2026-08-10/story-engine/story_plan.json",
    "sha256": "4da26c26e2fbc845e0ca59715b054eec6356fc1c1a7856a46631da359f6ea872"
  },
  "story_script": {
    "path": "working/2026-08-10/story-engine/story_script.json",
    "sha256": "6c53d9810528391e3d0306036b42b5cbe3e0b76d7eac8a97a0c130bb384c8c61"
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
    "routes": [],
    "selected_path": "not-required",
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
    "financialVisualContract": {
      "contractVersion": "1.0.0",
      "finalEpisodeContractVersion": "1.0.0",
      "intentVersion": "1.1.0",
      "recipePlanSha256": "56d571babd3af4a4403c29358eae01322c84a91b077dadb7fabf6564247bc0b6",
      "recipePlanVersion": "1.0.0",
      "recipeRegistryVersion": "1.0.0",
      "selectionCount": 1
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
            "captionText": "おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところが、その前に出た7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人。景気にはかなり弱い数字です。悪い雇用なのに、なぜNASDAQは上がったのか。",
            "chunkId": "scene-01-chunk-001",
            "expression": "軽い驚き",
            "pauseAfterMs": 120,
            "speechText": "おはようございます。昨夜のNasdaq Compositeは一・三〇パーセント上昇、SOXXは二・〇二パーセント高でした。ところが、その前に出た7月の雇用者数は、市場予想のプラス八万人に対してマイナス二・三万人。景気にはかなり弱い数字です。悪い雇用なのに、なぜNASDAQは上がったのか。"
          },
          {
            "captionText": "僕は今日は、このねじれを一本だけ追います。結論から言うと、市場が喜んだのは雇用悪化そのものではありません。次の利上げが必要になる可能性が下がったことが、大型テックには先に追い風として評価された。そこへ半導体の好決算や原油・金利の追い風が重なった、というのが僕の整理です。",
            "chunkId": "scene-01-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "僕は今日は、このねじれを一本だけ追います。結論から言うと、市場が喜んだのは雇用悪化そのものではありません。次の利上げが必要になる可能性が下がったことが、大型テックには先に追い風として評価された。そこへ半導体の好決算や原油・金利の追い風が重なった、というのが僕の整理です。"
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
            "narrationEndCue": "、市場予想のプラス八万人に対してマイナス二・三万人。景気にはかなり弱い数字です。悪い雇用なのに、なぜNASDAQは上がったのか。",
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
            "transitionRole": "major-shift",
            "viewerTexts": [
              "雇用 -2.3万人",
              "予想 +8万人",
              "NASDAQ +1.30%"
            ],
            "visualGrammarId": "contradiction",
            "visualMode": "conclusion-card",
            "visualTemplate": "opening-contradiction"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-01-02",
            "changeCue": "悪い雇用→株高？",
            "contentType": "hero-number",
            "endChunkId": "scene-01-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "たことが、大型テックには先に追い風として評価された。そこへ半導体の好決算や原油・金利の追い風が重なった、というのが僕の整理です。",
            "narrationStartCue": "僕は今日は、このねじれを一本だけ追います。結論から言うと、市場が喜んだのは雇用悪化そのものではありません。次の利上げが必要になる",
            "objectIds": [
              "scene-01-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "成長ではなく金利の採点表",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "悪材料がなぜ株高へ変わったか",
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
            "transitionRole": "continuation",
            "viewerTexts": [
              "悪い雇用→株高？",
              "見るべきは利上げ観測"
            ],
            "visualGrammarId": "analogy",
            "visualMode": "conclusion-card",
            "visualTemplate": "analogy-steps"
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
          }
        ],
        "cards": [
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
            "captionText": "まずBLSの数字を確認します。7月の非農業部門雇用者数は二・三万人減少、失業率は四・一パーセントでした。しかも5月と6月の雇用増も、合わせて十・三万人下方修正されています。つまり、弱かったのは一つの見出しだけではありません。",
            "chunkId": "scene-02-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "まずBLSの数字を確認します。7月の非農業部門雇用者数は二・三万人減少、失業率は四・一パーセントでした。しかも5月と6月の雇用増も、合わせて十・三万人下方修正されています。つまり、弱かったのは一つの見出しだけではありません。"
          },
          {
            "captionText": "ここまで見ると普通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の矛盾になります。",
            "chunkId": "scene-02-chunk-002",
            "expression": "困惑",
            "pauseAfterMs": 200,
            "speechText": "ここまで見ると普通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の矛盾になります。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": null,
            "label": "1",
            "numberId": "vb-02-01.card-01.line-01",
            "tone": "neutral",
            "unit": "",
            "value": "雇用 -2.3万人"
          },
          {
            "comparison": null,
            "label": "2",
            "numberId": "vb-02-01.card-01.line-02",
            "tone": "neutral",
            "unit": "",
            "value": "失業率 4.1%"
          }
        ],
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
            "assetPlacementIds": [],
            "assetState": "not-required",
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
            "narrationEndCue": "でした。しかも5月と6月の雇用増も、合わせて十・三万人下方修正されています。つまり、弱かったのは一つの見出しだけではありません。",
            "narrationStartCue": "まずBLSの数字を確認します。7月の非農業部門雇用者数は二・三万人減少、失業率は四・一パーセントでした。しかも5月と6月の雇用増",
            "objectIds": [
              "vb-02-01.card-01.line-01",
              "vb-02-01.card-01.line-02"
            ],
            "pictureBook": null,
            "primaryElement": "7月雇用の確認済み事実",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "BLSは何を確認したか",
            "screenState": "Data",
            "sequencePolicy": "object-order-fallback",
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
            "transitionRole": "major-shift",
            "viewerTexts": [
              "雇用 -2.3万人",
              "失業率 4.1%"
            ],
            "visualGrammarId": "evidence",
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
            "narrationEndCue": "通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の矛盾になります。",
            "narrationStartCue": "ここまで見ると普通は、景気減速への警戒が株に重くなる場面を想像します。だからこそ、NASDAQのプラス一・三〇パーセントが今回の",
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
            "transitionRole": "continuation",
            "viewerTexts": [
              "5月・6月 改定 -10.3万人",
              "NASDAQ +1.30%"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "text-focus",
            "visualTemplate": "evidence-boundary"
          }
        ],
        "visualEvents": [
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
            "cardId": "scene-03-card-expected",
            "lines": [
              {
                "label": "1",
                "tone": "neutral",
                "value": "Expected +8万人"
              }
            ],
            "role": "expected",
            "title": "Expected"
          },
          {
            "cardId": "scene-03-card-actual",
            "lines": [
              {
                "label": "2",
                "tone": "neutral",
                "value": "Actual -2.3万人"
              }
            ],
            "role": "actual",
            "title": "Actual"
          },
          {
            "cardId": "scene-03-card-gap",
            "lines": [
              {
                "label": "3",
                "tone": "neutral",
                "value": "Gap -10.3万人"
              }
            ],
            "role": "gap",
            "title": "Gap"
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
            "captionText": "期待との差を数字にすると、もっと分かりやすいです。Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gapはマイナス十・三万人です。かなり大きな下振れです。",
            "chunkId": "scene-03-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "期待との差を数字にすると、もっと分かりやすいです。Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gapはマイナス十・三万人です。かなり大きな下振れです。"
          },
          {
            "captionText": "ここで面白いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読みました。",
            "chunkId": "scene-03-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "ここで面白いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読みました。"
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
            "narrationEndCue": "Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gapはマイナス十・三万人です。かなり大きな下振れです。",
            "narrationStartCue": "期待との差を数字にすると、もっと分かりやすいです。Reutersが伝えた市場予想はプラス八万人。実際はマイナス二・三万人。Gap",
            "objectIds": [
              "scene-03-card-expected",
              "scene-03-card-actual",
              "scene-03-card-gap"
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
            "transitionRole": "major-shift",
            "viewerTexts": [
              "Expected +8万人",
              "Actual -2.3万人",
              "Gap -10.3万人"
            ],
            "visualGrammarId": "gap",
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
            "narrationEndCue": "いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読みました。",
            "narrationStartCue": "ここで面白いのは、株価がそのGapを無視したわけではないことです。市場は同じ数字を、景気の採点表だけではなく、金利の採点表でも読",
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
            "transitionRole": "continuation",
            "viewerTexts": [
              "予想差 -10.3万人",
              "過去2か月改定 -10.3万人",
              "意味は別の数字"
            ],
            "visualGrammarId": "evidence",
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
            "targetId": "scene-03-card-expected",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-03-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-020",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-03-card-actual",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-03-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-021",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-03-card-gap",
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
            "cardId": "scene-04-card-expected",
            "lines": [
              {
                "label": "Expected",
                "tone": "neutral",
                "value": "+8万人"
              }
            ],
            "role": "expected",
            "title": "Expected"
          },
          {
            "cardId": "scene-04-card-actual",
            "lines": [
              {
                "label": "Actual",
                "tone": "neutral",
                "value": "-2.3万人"
              }
            ],
            "role": "actual",
            "title": "Actual"
          },
          {
            "cardId": "scene-04-card-gap",
            "lines": [
              {
                "label": "Gap",
                "tone": "neutral",
                "value": "-10.3万人"
              }
            ],
            "role": "gap",
            "title": "Gap"
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
            "captionText": "その金利の採点表を見ると、答えがかなり見えます。Reutersによると、次回のFed会合で利上げが行われる確率は約四十四パーセントまで低下しました。前日は五十五パーセント、1週間前は六十七パーセントです。景気のテストでは赤点でも、金利のテストでは少し安心材料になる。",
            "chunkId": "scene-04-chunk-001",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "その金利の採点表を見ると、答えがかなり見えます。Reutersによると、次回のFed会合で利上げが行われる確率は約四十四パーセントまで低下しました。前日は五十五パーセント、1週間前は六十七パーセントです。景気のテストでは赤点でも、金利のテストでは少し安心材料になる。"
          },
          {
            "captionText": "そんなねじれです。金利がさらに上がるリスクが後退すれば、将来の利益を長く織り込む大型テックには評価上の逆風が和らぎます。『悪い雇用だから株高』ではなく、『悪い雇用で追加利上げの必要性が下がった』。ここが昨夜の中心です。",
            "chunkId": "scene-04-chunk-002",
            "expression": "警戒",
            "pauseAfterMs": 200,
            "speechText": "そんなねじれです。金利がさらに上がるリスクが後退すれば、将来の利益を長く織り込む大型テックには評価上の逆風が和らぎます。『悪い雇用だから株高』ではなく、『悪い雇用で追加利上げの必要性が下がった』。ここが昨夜の中心です。"
          }
        ],
        "nodes": [],
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
            "narrationEndCue": "しました。前日は五十五パーセント、1週間前は六十七パーセントです。景気のテストでは赤点でも、金利のテストでは少し安心材料になる。",
            "narrationStartCue": "その金利の採点表を見ると、答えがかなり見えます。Reutersによると、次回のFed会合で利上げが行われる確率は約四十四パーセン",
            "objectIds": [
              "scene-04-card-expected",
              "scene-04-card-actual",
              "scene-04-card-gap"
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
            "transitionRole": "major-shift",
            "viewerTexts": [
              "Expected +8万人",
              "Actual -2.3万人",
              "Gap -10.3万人"
            ],
            "visualGrammarId": "gap",
            "visualMode": "expected-actual-gap",
            "visualTemplate": "expected-actual-gap-flow"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-04-02",
            "changeCue": "利上げ確率 約44%",
            "contentType": "evidence-boundary",
            "endChunkId": "scene-04-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "には評価上の逆風が和らぎます。『悪い雇用だから株高』ではなく、『悪い雇用で追加利上げの必要性が下がった』。ここが昨夜の中心です。",
            "narrationStartCue": "そんなねじれです。金利がさらに上がるリスクが後退すれば、将来の利益を長く織り込む大型テックには評価上の逆風が和らぎます。『悪い雇",
            "objectIds": [],
            "pictureBook": null,
            "primaryElement": "利上げ観測 67% → 55% → 44%",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "市場の採点表はどう変わった？",
            "screenState": "Data",
            "sequencePolicy": "static",
            "startChunkId": "scene-04-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Reuters market interpretation",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "confirmed-vs-unconfirmed"
            },
            "templateVariant": "confirmed-vs-unconfirmed",
            "transitionRole": "continuation",
            "viewerTexts": [
              "利上げ確率 約44%",
              "前日55% / 1週前67%"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "text-focus",
            "visualTemplate": "evidence-boundary"
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
            "targetId": "scene-04-card-expected",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-04-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-022",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-04-card-actual",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-04-chunk-001",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-023",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-04-card-gap",
            "timing": "chunk-start"
          }
        ],
        "visualMode": "expected-actual-gap"
      },
      {
        "arrows": [
          {
            "arrowId": "vb-05-02.arrow-01",
            "fromNodeId": "vb-05-02.node-01",
            "label": "",
            "toNodeId": "vb-05-02.node-02"
          },
          {
            "arrowId": "vb-05-02.arrow-02",
            "fromNodeId": "vb-05-02.node-02",
            "label": "",
            "toNodeId": "vb-05-02.node-03"
          }
        ],
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
            "captionText": "ただし、ここで雇用統計だけに全部を背負わせると雑になります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。",
            "chunkId": "scene-05-chunk-001",
            "expression": "軽い驚き",
            "pauseAfterMs": 120,
            "speechText": "ただし、ここで雇用統計だけに全部を背負わせると雑になります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。"
          },
          {
            "captionText": "企業決算も全体として強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と見るのが自然です。",
            "chunkId": "scene-05-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 120,
            "speechText": "企業決算も全体として強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と見るのが自然です。"
          },
          {
            "captionText": "主役は一つでも、舞台装置は一つではありません。",
            "chunkId": "scene-05-chunk-003",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "主役は一つでも、舞台装置は一つではありません。"
          }
        ],
        "nodes": [
          {
            "label": "雇用大幅下振れ",
            "nodeId": "vb-05-02.node-01"
          },
          {
            "label": "利上げ観測↓",
            "nodeId": "vb-05-02.node-02"
          },
          {
            "label": "大型テックの逆風↓",
            "nodeId": "vb-05-02.node-03"
          }
        ],
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
            "contentType": "hero-number",
            "endChunkId": "scene-05-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "なります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、米国債利回りが下がったという支援材料もありました。",
            "narrationStartCue": "ただし、ここで雇用統計だけに全部を背負わせると雑になります。同じ日の市場には、イランを巡る和平進展で原油とインフレ懸念が和らぎ、",
            "objectIds": [
              "scene-05-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "原油・利回りの支援",
            "primaryFunction": "Anchor",
            "returnScreenState": null,
            "screenQuestion": "雇用以外の追い風は何か",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-05-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "Reuters 8月7日市場報道",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "原油・インフレ懸念↓",
              "米国債利回り↓"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "conclusion-card",
            "visualTemplate": "hero-number"
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
            "narrationEndCue": "て強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と見るのが自然です。",
            "narrationStartCue": "企業決算も全体として強めです。なので経路は、雇用の大幅下振れから利上げ観測が後退し、その横で原油と金利、決算が追い風を足した、と",
            "objectIds": [
              "vb-05-02.node-01",
              "vb-05-02.node-02",
              "vb-05-02.arrow-01",
              "vb-05-02.node-03",
              "vb-05-02.arrow-02"
            ],
            "pictureBook": null,
            "primaryElement": "雇用→利上げ観測→テック",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "雇用からNASDAQへどう届くか",
            "screenState": "Chart",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-05-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS / Reuters",
              "laneLabels": [],
              "nodeOrder": [
                "vb-05-02.node-01",
                "vb-05-02.node-02",
                "vb-05-02.node-03"
              ],
              "outcomeNodeId": "vb-05-02.node-03",
              "variant": "left-to-right"
            },
            "templateVariant": "left-to-right",
            "transitionRole": "continuation",
            "viewerTexts": [
              "雇用大幅下振れ",
              "利上げ観測↓",
              "大型テックの逆風↓"
            ],
            "visualGrammarId": "causal",
            "visualMode": "causal-diagram",
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
            "narrationEndCue": "主役は一つでも、舞台装置は一つではありません。",
            "narrationStartCue": "主役は一つでも、舞台装置は一つではありません。",
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
            "transitionRole": "continuation",
            "viewerTexts": [
              "主因候補：雇用→金利",
              "増幅：原油・決算"
            ],
            "visualGrammarId": "bridge-text",
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
            "captionText": "半導体では、その増幅が特にはっきり見えます。MicrochipはQ1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。会社は需要改善や在庫正常化も説明しています。",
            "chunkId": "scene-06-chunk-001",
            "expression": "警戒",
            "pauseAfterMs": 120,
            "speechText": "半導体では、その増幅が特にはっきり見えます。MicrochipはQ1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。会社は需要改善や在庫正常化も説明しています。"
          },
          {
            "captionText": "MCHPは十三・八九パーセント高、SOXXは二・〇二パーセント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マクロの金利追い風に、企業固有の好決算が上乗せされた形です。",
            "chunkId": "scene-06-chunk-002",
            "expression": "通常",
            "pauseAfterMs": 200,
            "speechText": "MCHPは十三・八九パーセント高、SOXXは二・〇二パーセント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マクロの金利追い風に、企業固有の好決算が上乗せされた形です。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": null,
            "label": "SOXX",
            "numberId": "metric.soxx.close-return",
            "numericValue": 2.02,
            "precision": 2,
            "tone": "positive",
            "unit": "%",
            "value": "+2.02%"
          },
          {
            "comparison": null,
            "label": "MCHP",
            "numberId": "metric.mchp.close-return",
            "numericValue": 13.89,
            "precision": 2,
            "tone": "positive",
            "unit": "%",
            "value": "+13.89%"
          },
          {
            "comparison": null,
            "label": "NVIDIA",
            "numberId": "metric.nvidia.close-return",
            "numericValue": 2.27,
            "precision": 2,
            "tone": "positive",
            "unit": "%",
            "value": "+2.27%"
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
            "changeCue": "08:30 ET BLS発表",
            "contentType": "event-reaction-timeline",
            "endChunkId": "scene-06-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-002",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "・七六ドルを発表し、次の四半期売上を十五・八九億から十六・一八億ドルと見込みました。会社は需要改善や在庫正常化も説明しています。",
            "narrationStartCue": "半導体では、その増幅が特にはっきり見えます。MicrochipはQ1売上十四・八五億ドル、非GAAP EPS〇・七六ドルを発表し",
            "objectIds": [
              "scene-06-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "公式時刻＋引け",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "確認できる順番はどこまでか",
            "screenState": "Chart",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-06-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "BLS official time + Reuters reported sequence + close-only market data",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "reactionTimeline": {
                "eventOrderIds": [
                  "scene-06-card-001"
                ],
                "precision": "official-time-plus-close",
                "seriesObjectIds": []
              },
              "variant": "official-time-plus-close"
            },
            "templateVariant": "official-time-plus-close",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "08:30 ET BLS発表",
              "利上げ確率 約44%",
              "引け NASDAQ +1.30%"
            ],
            "visualGrammarId": "reaction",
            "visualMode": "timeline",
            "visualTemplate": "event-reaction-timeline"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-06-02",
            "changeCue": "SOXX +2.02%",
            "contentType": "market-pulse-grid",
            "endChunkId": "scene-06-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-003",
              "source-004"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "financialReturnTarget": "vb-07-01",
            "financialVisualTrace": {
              "causalStepIds": [],
              "comparisonBasis": "2026-08-07米国通常取引終値",
              "contractVersion": "1.0.0",
              "displayOrder": [
                "metric.soxx.close-return",
                "metric.mchp.close-return",
                "metric.nvidia.close-return"
              ],
              "finalEpisodeContractSha256": "403143fab4980b3f145e9acf415bcfba38132ce385198c62bc5888b40085b559",
              "intentId": "fvi-market-snapshot-s06b02",
              "metricIds": [
                "metric.soxx.close-return",
                "metric.mchp.close-return",
                "metric.nvidia.close-return"
              ],
              "reasonCodes": [],
              "recipeId": "market-pulse-grid",
              "recipePlanSha256": "56d571babd3af4a4403c29358eae01322c84a91b077dadb7fabf6564247bc0b6",
              "selectedPath": "preferred",
              "selectedPlanId": "fvp-market-snapshot-s06b02-preferred",
              "selectedPlanSha256": "4c0a8f8c6d633cb10af947d6cc1344cacb08d58b4f45e39bf57020544fb8b851",
              "sourceIds": [
                "source-001",
                "source-003",
                "source-004"
              ]
            },
            "narrationEndCue": "セント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マクロの金利追い風に、企業固有の好決算が上乗せされた形です。",
            "narrationStartCue": "MCHPは十三・八九パーセント高、SOXXは二・〇二パーセント高、NVIDIAも二・二七パーセント高でした。つまり半導体は、マク",
            "objectIds": [
              "metric.soxx.close-return",
              "metric.mchp.close-return",
              "metric.nvidia.close-return"
            ],
            "pictureBook": null,
            "primaryElement": "SOXX・MCHP・NVIDIA終値",
            "primaryFunction": "Explain",
            "returnScreenState": null,
            "screenQuestion": "半導体はどれだけ上乗せされたか",
            "screenState": "Data",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-06-chunk-002",
            "templateConfig": {
              "causalStepIds": [],
              "comparisonBasis": "2026-08-07米国通常取引終値",
              "dataBasis": "financial-recipe-plan",
              "displayOrder": [
                "metric.soxx.close-return",
                "metric.mchp.close-return",
                "metric.nvidia.close-return"
              ],
              "highlightObjectIds": [],
              "laneLabels": [],
              "metricIds": [
                "metric.soxx.close-return",
                "metric.mchp.close-return",
                "metric.nvidia.close-return"
              ],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "continuation",
            "viewerTexts": [
              "SOXX +2.02%",
              "MCHP +13.89%",
              "NVIDIA +2.27%"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "timeline",
            "visualTemplate": "market-pulse-grid"
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
          }
        ],
        "cards": [
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
            "captionText": "ここで一度、この説明を壊しにいきます。AMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばいでした。なので『弱い雇用でテック全部が買われた』ではありませんし、Microchip一社がNASDAQを上げたわけでもありません。",
            "chunkId": "scene-07-chunk-001",
            "expression": "困惑",
            "pauseAfterMs": 120,
            "speechText": "ここで一度、この説明を壊しにいきます。AMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsoftはほぼ横ばいでした。なので『弱い雇用でテック全部が買われた』ではありませんし、Microchip一社がNASDAQを上げたわけでもありません。"
          },
          {
            "captionText": "広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。",
            "chunkId": "scene-07-chunk-002",
            "expression": "分析",
            "pauseAfterMs": 200,
            "speechText": "広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。"
          }
        ],
        "nodes": [],
        "numbers": [
          {
            "comparison": null,
            "label": "MCHP",
            "numberId": "vb-07-01.card-01.line-01",
            "numericValue": 13.89,
            "precision": 2,
            "tone": "neutral",
            "unit": "%",
            "value": "+13.89%"
          },
          {
            "comparison": null,
            "label": "AMD",
            "numberId": "vb-07-01.card-01.line-02",
            "numericValue": -1.21,
            "precision": 2,
            "tone": "neutral",
            "unit": "%",
            "value": "-1.21%"
          },
          {
            "comparison": null,
            "label": "Alphabet",
            "numberId": "vb-07-01.card-01.line-03",
            "numericValue": -0.96,
            "precision": 2,
            "tone": "neutral",
            "unit": "%",
            "value": "-0.96%"
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
          "Alphabet -0.96%/MSFT +0.03%"
        ],
        "timelineBasis": "8月7日通常取引終値",
        "transition": {
          "durationMs": 300,
          "type": "fade"
        },
        "uncertainty": "個別材料を完全分離していない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-07-01",
            "changeCue": "MCHP +13.89%",
            "contentType": "diverging-stock-bars",
            "endChunkId": "scene-07-chunk-001",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-004"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "した。なので『弱い雇用でテック全部が買われた』ではありませんし、Microchip一社がNASDAQを上げたわけでもありません。",
            "narrationStartCue": "ここで一度、この説明を壊しにいきます。AMDは一・二一パーセント下落、Alphabetも〇・九六パーセント下落、Microsof",
            "objectIds": [
              "vb-07-01.card-01.line-01",
              "vb-07-01.card-01.line-02",
              "vb-07-01.card-01.line-03"
            ],
            "pictureBook": null,
            "primaryElement": "MCHPと逆行銘柄",
            "primaryFunction": "Compare",
            "returnScreenState": null,
            "screenQuestion": "テック・半導体は全部上がったか",
            "screenState": "Chart",
            "sequencePolicy": "object-order-fallback",
            "startChunkId": "scene-07-chunk-001",
            "templateConfig": {
              "comparisonBasis": "三銘柄の反応差は何を示すか",
              "dataBasis": "8月7日通常取引終値",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "center-zero"
            },
            "templateVariant": "center-zero",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "MCHP +13.89%",
              "AMD -1.21%",
              "Alphabet -0.96%"
            ],
            "visualGrammarId": "comparison",
            "visualMode": "number-comparison",
            "visualTemplate": "diverging-stock-bars"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-07-02",
            "changeCue": "広い金利追い風",
            "contentType": "text-focus",
            "endChunkId": "scene-07-chunk-002",
            "entity": null,
            "evidenceSourceIds": [
              "source-001",
              "source-003"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。",
            "narrationStartCue": "広い金利の追い風の上で、決算や個別材料によって銘柄差が残った。これなら、上昇と逆行を同時に説明できます。",
            "objectIds": [
              "scene-07-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "マクロと個別の二層",
            "primaryFunction": "Compare",
            "returnScreenState": null,
            "screenQuestion": "広い追い風と個別差をどう両立するか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-07-chunk-002",
            "templateConfig": {
              "comparisonBasis": "どこまで因果を言えるか",
              "dataBasis": "8月7日通常取引終値とReuters",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "two-lane"
            },
            "templateVariant": "two-lane",
            "transitionRole": "continuation",
            "viewerTexts": [
              "広い金利追い風",
              "個別材料で差",
              "Microsoft +0.03%"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "text-focus",
            "visualTemplate": "tailwind-headwind"
          }
        ],
        "visualEvents": [
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
            "captionText": "最後に、時系列まで確認します。8時30分ETの発表の1分前から発表分へ、NASDAQの代理として見るQQQは719.16から720.23、SOXXは541.06から542.40、NVIDIAは219.95から220.31へ上向きました。",
            "chunkId": "scene-08-chunk-001",
            "expression": "通常",
            "pauseAfterMs": 0,
            "speechText": "最後に、時系列まで確認します。8時30分ETの発表の1分前から発表分へ、NASDAQの代理として見るQQQは719.16から720.23、SOXXは541.06から542.40、NVIDIAは219.95から220.31へ上向きました。"
          },
          {
            "captionText": "だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。",
            "chunkId": "scene-08-chunk-003",
            "expression": "通常",
            "pauseAfterMs": 120,
            "speechText": "だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。"
          },
          {
            "captionText": "MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。",
            "chunkId": "scene-08-chunk-002",
            "expression": "通常",
            "pauseAfterMs": 0,
            "speechText": "MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。"
          },
          {
            "captionText": "僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。",
            "chunkId": "scene-08-chunk-004",
            "expression": "通常",
            "pauseAfterMs": 0,
            "speechText": "僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。"
          },
          {
            "captionText": "成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。",
            "chunkId": "scene-08-chunk-005",
            "expression": "通常",
            "pauseAfterMs": 200,
            "speechText": "成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。"
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
            "beatId": "scene-08-beat-001",
            "changeCue": "8:30 ET：QQQ・SOXX・NVDAは上向き",
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
            "narrationEndCue": "SDAQの代理として見るQQQは719.16から720.23、SOXXは541.06から542.40、NVIDIAは219.95から220.31へ上向きました。",
            "narrationStartCue": "最後に、時系列まで確認します。8時30分ETの発表の1分前から発表分へ、NASDAQの代理として見るQQQは719.16から720.23、SOXXは541.06",
            "objectIds": [
              "scene-08-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "8:30 ETの実分足と因果の境界",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "発表時刻の初動は市場解釈と整合した？",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-08-chunk-001",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "確認済み情報と2 wave追加取得結果",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "strengthen-vs-weaken"
            },
            "templateVariant": "strengthen-vs-weaken",
            "transitionRole": "major-shift",
            "viewerTexts": [
              "8:30 ET：QQQ・SOXX・NVDAは上向き",
              "MCHPは同じ1分でほぼ横ばい",
              "1分足だけで因果は証明しない"
            ],
            "visualGrammarId": "verification",
            "visualMode": "verification-points",
            "visualTemplate": "verification-matrix"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "scene-08-beat-002",
            "changeCue": "1分足は因果証明ではない",
            "contentType": "verification-matrix",
            "endChunkId": "scene-08-chunk-003",
            "entity": null,
            "evidenceSourceIds": [
              "source-003",
              "source-004",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。",
            "narrationStartCue": "だから、弱い雇用から利上げ観測後退、そしてテック買いという市場解釈は、引けだけでなく発表時刻の初動とも整合します。ただし、1分足は原因そのものを証明しません。",
            "objectIds": [
              "scene-08-card-001"
            ],
            "pictureBook": null,
            "primaryElement": "8:30 ETの実分足と因果の境界",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "発表時刻の初動は市場解釈と整合した？",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-08-chunk-003",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "確認済み情報と2 wave追加取得結果",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "confirmed-vs-unconfirmed"
            },
            "templateVariant": "confirmed-vs-unconfirmed",
            "transitionRole": "continuation",
            "viewerTexts": [
              "8:30 ET：QQQ・SOXX・NVDAは上向き",
              "MCHPは同じ1分でほぼ横ばい",
              "1分足だけで因果は証明しない"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "verification-points",
            "visualTemplate": "evidence-boundary"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "scene-08-beat-003",
            "changeCue": "言える：初動は金利解釈と整合",
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
            "narrationEndCue": "MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。",
            "narrationStartCue": "MCHPは同じ1分で79.58から79.56とほぼ横ばいでした。Microchipの大幅高は会社固有材料を別の増幅要因として分ける方が自然です。",
            "objectIds": [
              "scene-08-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "主因候補・増幅要因・反対材料の境界",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "どこまでを安全な結論にするか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-08-chunk-002",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "検証済み1分足の時系列整合 + 反対材料",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "continuation",
            "viewerTexts": [
              "言える：初動は金利解釈と整合",
              "言わない：1分足だけで終日上昇の原因を断定",
              "分ける：MCHPは会社固有の増幅要因"
            ],
            "visualGrammarId": "verification",
            "visualMode": "verification-points",
            "visualTemplate": "verification-checklist"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "scene-08-beat-004",
            "changeCue": "主因候補・増幅要因を分ける",
            "contentType": "verification-checklist",
            "endChunkId": "scene-08-chunk-004",
            "entity": null,
            "evidenceSourceIds": [
              "source-003",
              "source-004",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。",
            "narrationStartCue": "僕の結論は中程度の確信で、雇用下振れから利上げリスク低下が主役候補。Microchip好決算と原油・利回り低下が増幅要因。",
            "objectIds": [
              "scene-08-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "主因候補・増幅要因・反対材料の境界",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "どこまでを安全な結論にするか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-08-chunk-004",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "検証済み1分足の時系列整合 + 反対材料",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "confirmed-vs-unconfirmed"
            },
            "templateVariant": "confirmed-vs-unconfirmed",
            "transitionRole": "continuation",
            "viewerTexts": [
              "言える：初動は金利解釈と整合",
              "言わない：1分足だけで終日上昇の原因を断定",
              "分ける：MCHPは会社固有の増幅要因"
            ],
            "visualGrammarId": "evidence",
            "visualMode": "verification-points",
            "visualTemplate": "evidence-boundary"
          },
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "scene-08-beat-005",
            "changeCue": "反対材料まで残す",
            "contentType": "verification-checklist",
            "endChunkId": "scene-08-chunk-005",
            "entity": null,
            "evidenceSourceIds": [
              "source-003",
              "source-004",
              "source-005"
            ],
            "expressionChange": null,
            "fallback": null,
            "finalHoldMs": 500,
            "narrationEndCue": "成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。",
            "narrationStartCue": "成長不安と個別の下落銘柄が反対材料です。悪材料が消えた夜ではなく、どの採点表が優先されたかが変わった夜でした。",
            "objectIds": [
              "scene-08-card-002"
            ],
            "pictureBook": null,
            "primaryElement": "主因候補・増幅要因・反対材料の境界",
            "primaryFunction": "Evidence",
            "returnScreenState": null,
            "screenQuestion": "どこまでを安全な結論にするか",
            "screenState": "Data",
            "sequencePolicy": "explicit",
            "startChunkId": "scene-08-chunk-005",
            "templateConfig": {
              "comparisonBasis": null,
              "dataBasis": "検証済み1分足の時系列整合 + 反対材料",
              "laneLabels": [],
              "nodeOrder": [],
              "outcomeNodeId": null,
              "variant": "default"
            },
            "templateVariant": "default",
            "transitionRole": "continuation",
            "viewerTexts": [
              "言える：初動は金利解釈と整合",
              "言わない：1分足だけで終日上昇の原因を断定",
              "分ける：MCHPは会社固有の増幅要因"
            ],
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
          },
          {
            "action": "show",
            "atChunkId": "scene-08-chunk-003",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-024",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-08-card-001",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-08-chunk-004",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-025",
            "expression": null,
            "motionPreset": "rise-soft",
            "offsetMs": 0,
            "targetId": "scene-08-card-002",
            "timing": "chunk-start"
          },
          {
            "action": "show",
            "atChunkId": "scene-08-chunk-005",
            "durationMs": 560,
            "easingPreset": "smooth-out",
            "eventId": "event-026",
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
        "sceneRole": "closing-recap-sendoff-goodnight",
        "sourceLabel": "当日の市場データ / BLS / Reuters",
        "supportingTexts": [
          "採点表が金利へ移った",
          "NASDAQ +1.30%"
        ],
        "timelineBasis": "本編の回収",
        "transition": {
          "durationMs": 0,
          "type": "none"
        },
        "uncertainty": "新情報は追加しない",
        "visualBeats": [
          {
            "assetPlacementIds": [],
            "assetState": "not-required",
            "beatId": "vb-09-01",
            "changeCue": "雇用 -2.3万人",
            "contentType": "final-assembly",
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
            "transitionRole": "closing",
            "viewerTexts": [
              "雇用 -2.3万人",
              "NASDAQ +1.30%",
              "主因候補：利上げ観測後退"
            ],
            "visualGrammarId": "assembly",
            "visualMode": "conclusion-card",
            "visualTemplate": "final-assembly"
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
    "visualGrammarContract": {
      "beatCount": 21,
      "contractVersion": "1.0.0",
      "finalEpisodeContractSha256": "43a38edfe9b19d3d05108e97b0a8d8ba2de126b271c9313794c8439b28639b34",
      "rendererCompatibilitySha256": "563bc71c58120552c3f601cab662a4f4287e44c149e46268ef5678d279b1adb6",
      "semanticsSha256": "e95b6dc418b4cb1d5c30d8cffc75de22c5c2834190c124e7bbab731f924bd714"
    },
    "voiceProfileId": "gemini-charon"
  },
  "renderer_contract": {
    "repository": "saienjoy0/saienjoy0-nasdaq-cafe-remotion",
    "schema_version": "2.4.0"
  }
}
```
<!--END_FINAL_PRODUCTION_SOURCE-->
