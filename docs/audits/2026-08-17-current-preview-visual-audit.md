# 2026-08-17 Current Preview Visual Audit

監査日: 2026-09-02

## 対象

- Current Preview V4 run: `33497320316`
- Artifact: `nasdaq-cafe-current-preview-2026-08-17-33497320316`
- Preview: `2026-08-17_nasdaq-cafe-spec-preview.mp4`
- Duration: 277.5 sec / 960x540 / 30fps
- Scene: 9
- measured Visual Beat: 16

本監査は、導入した既存Skillの役割分担に従う。

- `ux-audit`: 画面に見えている証拠とseverityの整理
- `visual-cognition-slides`: 確定済み内容をどの視覚表現へ翻訳するか
- `motion-design`: hero-first / stagger / choreography / timing
- Remotion official skills: frame-driven implementation

市場因果、speechText、captionText、Scene順、Expected / Actual / Gap、source、confidenceは変更対象にしない。

## Executive summary

現在の映像はTemplate不足よりも、**Visual Translation、Beat内Timing、Stage Shellの情報階層**が弱いことが主因である。

16 measured Beatすべてに8秒超のvisual stagnation warningがあり、9 Beatは16秒超のstatic-state failure candidateに該当する。`visualEvents`を見ると、多くのBeatがchunk-startから0〜440msで主要要素を出し切り、その後10〜24秒近く同じstageを保持している。動画が「動く説明映像」ではなく「資料を背景上で読み上げる映像」に寄っている。

さらにScene 5では、ナレーションが分離しているcompany-directとNASDAQ-wideを画面上で一本のcausal chainとして接続している。これは美観ではなく意味の不一致であり、Visual Director / Capability設計へ戻して直す必要がある。

## Keep

### P-01 `diverging-stock-bars`

Scene 3 / 7は上昇・下落を方向と長さで示せており、数値列より理解が速い。維持する。

### P-02 Scene 6の「時計を分ける」発想

AMAT反応開始、翌朝の小売、NASDAQの寄り/引けを時系列で分離するvisual choice自体は正しい。問題は40.901秒同じappearanceを保持するTimingである。

### P-03 狐＋カフェ背景

番組identityとして機能している。第一段階では背景・狐を作り替えるのではなくmain-stageを改善する。

## Findings

| ID | Sev | Scene | Finding |
|---|---:|---|---|
| F-01 | 3 Major | 全16 Beat | 主要visual eventがBeat冒頭0〜440msへ集中し、その後8〜24秒静止する |
| F-02 | 3 Major / editorial critical | 5 | company-directとNASDAQ-wideを一本の因果鎖に見せる |
| F-03 | 3 Major | 2 / 4 / 7 | source-receiptが合計58.566秒dominant surfaceを占め、口播と同じ情報を資料カードで重複する |
| F-04 | 3 Major | 2 / 4 | Expected / Actual / Gapが同格3カードで、Gapの方向を視覚化していない |
| F-05 | 3 Major | 8 | 仮説比較が1カードだけで「残った仮説」側が空白 |
| F-06 | 3 Major | 6 | timeline-trackが2 Beat連続40.901秒 |
| F-07 | 2 Minor | 全編 | Latin tokenを途中で割る字幕改行。Scene 1で`Applied`が分断 |
| F-08 | 2 Minor | 1 / 3 / 8 | main-stageの大部分が空白なのにhero情報が小さく、字幕の方が強い |
| F-09 | 2 Minor | 9 | `closing`、`中心`、丸数字`1`等のtemplate語がviewer surfaceへ残る |

## F-01 Visual Rhythm

Artifactのtiming reportでは16/16 measured Beatに`W_VISUAL_STAGNATION`。16秒超static candidateは9 Beat。

代表例:

- Scene 4 beat 1: Expected / Actual / Gapの3カードが全てoffset `0ms`
- Scene 5 beat 1: node / arrow 5要素が全てoffset `0ms`
- Scene 6: 3イベントを`0 / 220 / 440ms`で出し切る
- Scene 8 beat 2: 24.068秒のstageが実質static

### Required design

Rendererにナレーションを再解釈させない。Visual Director / authoring側で意味の切れ目にexplicit visual eventを置く。

- analysis Beatが8秒を超える場合、non-subtitle meaningful visual changeを複数持つ
- `show / highlight / focus / connector draw / state change`をナレーションの認知単位へ合わせる
- subtitle changeだけをmeaningful visual changeとして数えない
- 16秒超staticは明示exceptionなしではproduction candidateでfail-closed化する方向を検討する

## F-02 Semantic Scope violation

Scene 5 beat 1の現画面:

```text
個別: 高期待値の選別
        ↓
マクロ: ホルムズ・原油 / 弱い小売
        ↓
NASDAQ -0.28%
```

ナレーションはAMAT一社をNASDAQ全体の原因へ拡大せず、company-directとNASDAQ-wideを別エンジンとして扱っている。現visualはその境界を壊す。

Visual Cognition上、これは単純causal-chainではなく**scope-separated relational knowledge**。

### Required design

既存Candidateで正しく表せない場合は`CAPABILITY_GAP`。

提案中のReusable Capability（現行componentではない）では:

```text
company-direct                 NASDAQ-wide
高期待値の再評価              マクロ不確実性
       ↓                           ↓
AMAT reaction                  NASDAQ reaction

        [ この2経路を分けて読む ]
```

lane間にはcausal arrowを置かない。Scene 8の最終整理でも再利用する。

## F-03 Source receipt overuse

`document-media` duration:

- Scene 2 beat 1: 14.316 sec
- Scene 4 beat 2: 20.259 sec
- Scene 7 beat 2: 23.991 sec
- total: 58.566 sec

3 Beatともtiming reportでrecommended 5–8 secを超過。

`source exists -> source-receipt`をvisual selectionの短絡条件にしない。source receiptは証拠を示すsurfaceであり、主張の認知タイプそのものではない。

- Scene 2: data knowledge → key metric visual
- Scene 4: confirmed / not-quantified boundary
- Scene 7: `>70%` growth signal + `2030` horizon

source receiptは原則2〜6秒のproof overlayとして使い、主要visualへreturnする。

## F-04 Expected / Actual / Gap

Scene 2 / 4の`expected-actual-gap-flow`は、実画面では3つの同格カードに近い。Scene 4は3カードを全てoffset 0msで出している。

Visual Cognitionのdata/comparison原則に合わせ、Template IDは維持しつつStage表現を更新する。

1. Expected baseline
2. Actualを後から重ねる/伸ばす
3. 差分区間だけaccent
4. 最後にmarket reaction

新しいGap率を創作する必要はない。既存Expected/Actual値だけで方向を示す。

## F-05 Hypothesis elimination

Scene 8のナレーションは以下を比較している。

1. 決算ミス説
2. AI需要崩壊説
3. 弱い小売だけ説
4. 二エンジン仮説

しかし画面は`決算ミス: 棄却`の1カードだけで、右側が空白。

既存`verification-matrix`へ、ナレーションですでに確認済みの4仮説を順次配置する。

```text
決算ミス        -> 棄却
AI需要崩壊      -> 弱まる
小売だけ        -> 不十分
二エンジン      -> 残る / confidence 中
```

これは新しい意味の追加ではなく既存口播のvisual structuring。

## F-06 Timeline monotony

Scene 6はtimelineという表現自体は正しいが、2 Beatとも`TimelineStage / timeline-track`で40.901秒連続する。

二つのvisual actへ分離する。

- Act A: 8/13 after close → 8/14 08:30 → 09:30。「時計が違う」
- Act B: 前日終値 → 09:30 open → close。「寄りは上、その後下」

後半を既存Candidateで表現できるか再評価し、無ければreusable capability gapとして扱う。

## F-07 Subtitle line break

Scene 1約10.8秒で`Applied`が単語途中で改行される。

captionTextは変更しない。subtitle layout側で:

- CJKは自然改行
- Latin / number tokenは原則途中で割らない
- 2行safe-area内でphrase segmentation / sizeを決める
- regressionに`Applied Materials`, `Nasdaq Composite`, `SOXX ETF`, 数字+単位を追加

## F-08 Stage hierarchy

余白そのものではなく、heroが小さいことが問題。

優先refresh:

1. `OpenHeroStage`
2. `ProgressiveChartStage`
3. `DocumentMediaStage`
4. `VerificationGateStage`
5. `DualLaneStage`
6. `TimelineStage`

新Templateを増やす前に、既存Shellのhero size、progressive reveal、empty-space useを直す。

## F-09 Viewer surface leak

Scene 9の`closing`、`中心`、丸数字`1`は視聴者向け情報ではない。

closing Stageではviewer-facing contentだけを描画し、内部role / slot / line indexを出さない。public-screen boundary testへclosing fixtureを追加する。

## Scene translation plan

| Scene | Visual Cognition判定 | 次のvisual |
|---|---|---|
| 1 | contrast / curiosity gap | 強い決算・guide vs 株価下落を2極化。AMD/SOXXは反対材料として後出し |
| 2 | data + comparison | sourceは短いproof。主要数値をhero化しGapを順次構築 |
| 3 | comparison + boundary | bars維持。SOXX一件なら空matrixを避けneutral/boundary表現 |
| 4 | comparison + epistemic boundary | Gap visual強化。Reuters確認範囲と未数値化範囲を分離 |
| 5 | scope-separated relation | company-direct / NASDAQ-wideを別lane |
| 6 | temporal + data path | 前半timeline、後半market path |
| 7 | counterexample + data/horizon | bars維持。`>70%` / `2030`をvisual anchor化 |
| 8 | hypothesis elimination + scope model | 4仮説を落として二エンジンを残し、Scene 5 scope visualを再利用 |
| 9 | closure | internal labels除去、closing heroを簡素化 |

## Motion design

基本personalityはCorporate。Opening/Closingだけ軽いPlayfulを許す。

- hero first
- 3要素以上を同時に動かさない
- causal: node → connector → outcome
- comparison: baseline → actual → delta
- verification: hypothesis → evidence → weaken/reject
- source: proof overlay → return
- frame-driven only。CSS animation/transitionへ逃がさない

## Architecture priority

### P0 Semantic Scope Guard
company-direct / NASDAQ-wideをcausal edgeで誤接続しないvalidator / Visual Director constraint。

### P1 Visual Rhythm Contract
Beat内のmeaningful visual changeを明示eventとして分散し、static stateをquality gate化。

### P1 Knowledge-Type Routing
`sourceがあるからsource-receipt`ではなく、data / comparison / relation / timeline / hypothesisの認知タイプでCandidateを選ぶ。

### P1 Stage Shell Refresh
既存Shellを本当にdiagram / data visualとして機能させる。Template数を先に増やさない。

### P2 Subtitle / Viewer Surface QA
Latin token改行とtemplate leakを機械検査。

## Acceptance criteria

1. Scene 5のcompany-direct / NASDAQ-wide間に誤ったcausal edgeがない
2. 16秒超meaningful-static runは原則0（明示exception除く）
3. Scene 6のsame appearance 40.901秒が解消
4. Scene 2/4/7のsource-receipt dominant durationを縮小
5. Expected → Actual → Gapが画面でも順番に見える
6. Scene 8で既存4仮説を視覚的に追える
7. Latin tokenが途中改行されない
8. Scene 9のtemplate leakが消える
9. Protected Semantic Diffを維持
10. 別日のfresh episodeでもvalidator + preview + diversityを確認

## First implementation slices

1. Semantic Scope Guard
2. Visual Rhythm Contract
3. Stage Shell Refresh
4. Subtitle / Viewer Surface QA
5. その後、既存Catalogで足りないscope-separated causal visualだけをReusable Capabilityとして追加

当日の2026-08-17 fixtureだけを直して完了扱いしない。