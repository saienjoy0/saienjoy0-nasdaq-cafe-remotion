# Visual Skill Routing Contract

更新日: 2026-09-02

## 1. 目的

この文書は、朝のNASDAQカフェの映像改善で外部Agent Skillをどう使うかを定義する。

Skillは市場因果や日次編集内容の正本ではない。目的は次の4点に限定する。

1. 現在のpreview / representative stillsから、見えている映像上の問題を証拠付きで診断する。
2. 確定済みの意味を、どの視覚表現に翻訳すると理解しやすいか判断する。
3. 確定済みVisual Beatを、どう動かすと読み順と注意誘導が良くなるか判断する。
4. 判断済みの変更をRemotionへ安全に実装し、別日のfresh episodeでも退行しないことを確認する。

市場因果、Expected / Actual / Gap、Scene順、ナレーション、テロップ、数字、source、確信度、反対材料、Primary / Approved Fallbackは既存の制作工程が正本である。

## 2. 権限順位

競合時は次の順番を優先する。

1. ユーザーの現在の依頼
2. ルート `AGENTS.md`
3. 既存Visual Director Contract / Visual Story Engine契約
4. このVisual Skill Routing Contract
5. project-localへ固定した外部Skill
6. 外部Skillの一般的な推奨

外部Skillの一般則が既存NASDAQ Cafe契約と衝突する場合、必ずNASDAQ Cafe側を優先する。

特に、Visual Directorの `Protected Semantic Diff` を外部Skillが上書きしてはいけない。

## 3. Skill配置

### 3.1 自動発見領域

次は `.agents/skills/` に置く。

- `ux-audit`
- `motion-design`
- `remotion-official` 配下の公式Remotion Skills

これらは役割が限定されており、通常の映像改善・Remotion実装で自動発見されても編集正本を奪わない。

### 3.2 Reference-only領域

`visual-cognition-slides` は `third_party/agent-skills/visual-cognition-slides/` に置く。

このSkillは元来 `video` でも発火し、HTML slide生成まで担当できる。そのまま `.agents/skills/` に置くと、既存Visual Director / Rendererと責任が競合する。

したがって次の条件でだけ明示的に読む。

- 図解の種類を決めるとき
- 関係、比較、因果、手順、データ、類比を視覚化するとき
- 現在のTemplate群で表現不足が疑われるとき

このSkillのHTML生成、PPT生成、独自ナラティブ生成は使用しない。

## 4. 標準ワークフロー

```text
approved episode semantics
        ↓
render_spec / Visual Beat meaning fixed
        ↓
preview + representative stills
        ↓
[1] ux-audit
        ↓
visible findings only
        ↓
[2] visual-cognition-slides (explicit reference)
        ↓
representation recommendation
        ↓
existing Visual Director Candidate Catalog
        ↓
existing template available?
   ┌────┴────┐
  YES       NO
   ↓         ↓
select     capability-gap proposal
candidate     ↓
   ↓       reusable template design
[3] motion-design
        ↓
Visual Event / motion proposal
        ↓
Protected Semantic Diff gate
        ↓
[4] remotion-official
        ↓
implementation
        ↓
existing validators + visual tests
        ↓
before/after still review
        ↓
fresh episode regression
        ↓
preview for human review
```

GitHub Actionsはこの判断を行わない。Skill利用は設計・開発・レビュー段階だけで行う。

## 5. Stage 1 — ux-audit

### 5.1 入力

- preview MP4から抽出した代表フレーム
- Visual Beat単位のstill
- 必要ならbefore / afterの同一Beat

NASDAQ CafeではUX Auditの「journey」を視聴者の理解経路として扱う。

固定ゴールは次である。

> 日本の視聴者が、短時間で主役ニュース、矛盾、市場因果、反対材料、NASDAQへの経路を誤解なく追えること。

### 5.2 採用する原則

UX Audit Skillから特に次を採用する。

- visible evidence only
- severity付きfinding
- HIERARCHY-FLAT
- OVERLOAD
- PATTERN-DRIFT
- RECALL-TAX
- Gestalt grouping
- aesthetic and minimalist design
- working-memory負荷
- 具体的な改善案を付ける

### 5.3 動画用の追加ルール

静止画から判断できないものを推測しない。

静止画だけでは次を確定しない。

- animation timing
- transitionの滑らかさ
- 音声との同期
- 画面滞在時間

これらはpreview動画またはtiming dataがある場合だけ診断する。

### 5.4 出力

診断結果は開発用の一時成果物であり、日次編集正本ではない。

各findingには最低限次を含める。

- finding ID
- Scene / Beat / still
- severity
- visible evidence
- problem class
- recommendation
- semantics affected: yes / no

`semantics affected: yes` の修正はVisual側で勝手に行わず、制作側へ戻す。

## 6. Stage 2 — visual-cognition-slides

このStageでは、外部Skillを「新しい内容を考えるAI」ではなく「確定した内容をどう見せるかの判断資料」として使う。

### 6.1 Cognitive Unit

元Skillの「1 slide = 1 cognitive unit」をNASDAQ Cafeでは次へ変換する。

> 1 Visual Beat = 1 primary cognitive action

1 Beatで同時に複数の理解課題を要求しない。

例:

- 比較しながら因果も理解させ、さらに反対材料も読む、は原則分割する。
- ただし既存の `tailwind-headwind` のように、同一認知行為として設計済みの二面比較は許可する。

### 6.2 知識タイプからVisual表現へ

visual-cognition-slidesの分類を、NASDAQ CafeのEvidence Capability / Templateへ次のように対応させる。

| 認知対象 | Visual Cognition上の型 | Evidence Capability | 優先Template |
|---|---|---|---|
| ExpectedとActualの差 | comparison / data | `gap` | `expected-actual-gap-flow`, `expected-actual-bullet` |
| 2〜6個の数値比較 | data / comparison | `comparison-set` | `metric-comparison-board`, `index-return-bars`, `diverging-stock-bars` |
| A→B→Cの市場因果 | relational knowledge / causal chain | `causal-graph` | `causal-lane`, `macro-pressure` |
| 追い風と向かい風 | comparison / relational | `causal-graph`, `verification` | `tailwind-headwind` |
| 発表→値動き | narrative / timeline | `time-series` | `event-reaction-timeline` |
| 仮説を強める/弱める | matrix / metacognitive check | `verification` | `verification-matrix`, `evidence-boundary` |
| 難しい概念の短い例え | analogy | `text-only` or validated concept | `analogy-steps` |
| 主体の確認 | entity | `entity` | `entity-card-full` |
| 一次資料の確認 | source evidence | `source-document` | `source-receipt`, `news-media` |

### 6.3 Diagram-firstだが自由生成ではない

関係性知識では、元Skillの「ノードを先に出し、接続を後から描く」を採用する。

ただし、自由なSVG、自由なHTML、自由なTemplate JSONを日次データから生成しない。

順序は次の通り。

1. 認知対象を分類する。
2. Evidence Capabilityを確認する。
3. Candidate Catalogに合法候補があるか確認する。
4. 候補があれば既存Templateを使う。
5. 候補がなければ `CAPABILITY_GAP` としてコード改善へ送る。

当日のためだけの自由図解をRendererへ注入しない。

### 6.4 Capability Gap

既存Templateで表現できない場合だけ、新しいReusable Templateを検討する。

新Templateの条件:

- ニュース名や企業名に依存しない。
- 新しいEvidence Capabilityを捏造しない。
- 同種ニュースで再利用できる。
- existing visual component registryへ登録できる。
- Candidate Builderが決定論的に合法性を判定できる。
- validatorとfixtureを追加できる。

## 7. Stage 3 — motion-design

motion-design Skillは「何を言うか」ではなく「確定済み要素をどう順番に見せるか」にだけ使う。

### 7.1 採用する原則

- hero / primary elementを明確にする。
- 視線誘導のためにstaggerを使う。
- entranceはdeceleration、exitはaccelerationを基本にする。
- 同時に多くの要素を動かしすぎない。
- 動きの目的を `guidance / emphasis / transition / continuity` のいずれかで説明できるようにする。
- animationはsetup → action → resolutionを持つ。

### 7.2 NASDAQ Cafe側のoverride

元Skillの一般則より既存契約を優先する。

- 「primary + secondary + ambientを常に3層」は強制しない。情報番組ではambient motionが認知負荷を増す場合がある。
- playful overshootを金融図解へ自動適用しない。
- animation personalityより、ナレーションとの読み順と証拠の開示順を優先する。
- Expected → Actual → Gapの順番をmotion側で変更しない。
- 因果矢印を接続ノードより先に出さない。

### 7.3 Motion output

motion-designの判断は既存の次へ落とす。

- `visualEvents.show`
- `hide`
- `highlight`
- `unhighlight`
- `set-expression`
- 登録済みmotion preset / timing contract

Rendererがナレーションを読んで再推論しない。

## 8. Stage 4 — remotion-official

Remotion公式Skillは実装段階だけで使う。

### 8.1 必須原則

- `useCurrentFrame()` を時間の正本にする。
- `interpolate()` / `spring()` / `Easing`を使う。
- CSS `animation` / `transition`へ依存しない。
- text overflowは実測または既存legibility contractで確認する。
- media pathを自由生成しない。
- `render_spec.json`から任意Reactコードを指定させない。

### 8.2 Version compatibility

Skill upstreamのバージョンと本体package versionが異なる場合、Skillの最新APIを無条件で導入しない。

現在のリポジトリpackage versionを正本とし、そのversionで利用可能なAPIだけを使う。

## 9. Before / After審査

コード変更後は同一Beatのbefore / afterを比較する。

改善判定は最低限次を確認する。

- 最初に目が行く場所が意図した主役か。
- 読み順が自然か。
- 情報量が減っただけで意味が欠けていないか。
- 同種要素のspacing / typography / visual grammarが一貫しているか。
- 元のfindingが解消したか。
- 新しいfindingを作っていないか。

「見た目が変わった」だけでは改善完了にしない。

## 10. Regression Gate

Visual改善の完了条件は、変更対象のサンプルだけが良くなることではない。

最低限:

1. 変更箇所に近いunit / contract test
2. `test:visual-sequence`
3. `test:visual-variety`
4. `test:visual-templates`
5. `test:visual-story`
6. `test:public-screen`
7. build
8. 対象Beatのbefore / after still
9. 別日のfresh episodeで同一Templateまたは同一Capabilityを通す

fresh episodeで個別企業名、特定Scene文言、特定object countへ依存して壊れる場合は未完成とする。

Production Reliability Skillが利用可能な環境では、技術的停止・cascade・再試行ループの確認はそちらへ委ねる。Visual Skill群はReliability Skillの責務を奪わない。

## 11. GitHub Actions境界

GitHub ActionsはSkill Orchestratorではない。

Actionsでは次を行わない。

- ux-auditによるAI映像診断
- visual-cognition-slidesによる図解選択
- motion-designによるtiming再判断
- Remotion Skillによるコード生成
- Candidateの意味選択

Actionsへ渡る時点で、編集判断、Template、Visual Event、asset pathは確定済みでなければならない。

## 12. Skill更新

外部Skillは `config/agent-skills.lock.json` のcommit SHAへ固定する。

更新は自動追従しない。

更新時は:

1. upstream diffを確認する。
2. license変更を確認する。
3. trigger / responsibility変更を確認する。
4. このRouting Contractとの衝突を確認する。
5. `npm run agent-skills:sync`
6. `npm run test:agent-skills`
7. Visual系テストを実行する。

外部Skillの最新版という理由だけで本番へ入れない。
