# Visual Improvement Skill Architecture Design

Date: 2026-09-02
Status: Approved for implementation

## Goal

既存の朝のNASDAQカフェ映像を継続的に改善できるように、既存Agent Skillsを利用して「診断 → 視覚翻訳 → motion設計 → Remotion実装 → regression確認」を閉じる。ただし市場因果・台本・render_specの意味は既存制作側が所有し続ける。

## Context

現在のRendererにはVisual Director、Candidate Catalog、Visual Grammar、Visual Template、Visual Story validator、画面多様性テストが既にある。Visual Directorは`render_spec.json` freeze前にだけ動き、Candidate IDだけを選び、Protected Semantic Diffでナレーション、数字、source、Expected / Actual / Gap、因果、反対材料などを保護する。

したがって新しい「万能Visual AI」をRendererへ追加すると責任が重複する。必要なのは既存Visual Directorの前後に専門Skillを配置すること。

## Skills actually reviewed for this design

### Superpowers brainstorming

Architectural変更として扱い、既存コードベースの境界を先に読む、複数案を比較する、project-specific conventionは新Skillへ詰め込まずinstructionsへ置く、という方針を採用した。

### ux-audit — EliaAlberti/ux-audit-skill

採用した中心原則:

- 見えている証拠だけでfindingを出す。
- severityを付ける。
- hierarchy、overload、pattern drift、recall tax、Gestalt groupingを具体的に扱う。
- 問題だけでなく推奨修正を出す。

NASDAQ CafeではUI操作性ではなく「視聴者が市場の物語を追えるか」というjourneyに置き換える。

### visual-cognition-slides — edu-ai-builders/visual-cognition-slides

採用した中心原則:

- 1画面1認知単位。
- 概念、手順、叙事、関係、データ等の知識タイプを先に診断する。
- 関係性はnode-link / causal chain、データは比較・規模・trendなど意味に対応した表現を使う。
- 図形が情報を担い、文字はラベルへ寄せる。
- 関係図ではノード→接続の順で理解を組み上げる。

NASDAQ Cafeでは「1 slide」を「1 Visual Beat」へ置き換える。

このSkillは元々videoでも自動発火しHTML生成まで行えるため、auto-discoveryすると既存Visual Directorと衝突する。そのためreference-onlyでvendorする。

### motion-design — LottieFiles/motion-design-skill

採用した中心原則:

- motionには目的が必要。
- hero elementと視線誘導を明確にする。
- stagger / choreographyで一度に動かしすぎない。
- entrance / exitで適切なeasingを使う。
- setup → action → resolutionを持たせる。

ただし一般UI向けの「常にprimary + secondary + ambient三層」はNASDAQ Cafeではoverrideする。金融図解ではambient motionが理解を妨げる場合があるため、情報理解を優先する。

### Remotion official skills

採用した中心原則:

- frame driven animation。
- `useCurrentFrame()`、`interpolate()`、`spring()`、`Easing`を使う。
- CSS animation / transitionを使用しない。
- layout / text fitting / media handlingをRemotionの実装原則へ合わせる。

## Approaches considered

### A. すべてのSkillを `.agents/skills/` へ直接導入

長所:
- 自動発見が簡単。
- agentがSkillを探しやすい。

短所:
- visual-cognition-slidesがvideo要求で自動発火し、HTML生成や独自story設計まで担当する可能性がある。
- Visual Directorとの責任境界が曖昧になる。

Reject。

### B. 全Skillをreference-onlyにする

長所:
- 衝突しない。

短所:
- UX audit、motion design、Remotion implementationまで毎回手動ロードが必要。
- 実装時にSkill利用を忘れやすい。

Reject。

### C. Hybrid routing — selected

- diagnosis / implementation系は `.agents/skills/` でauto-discover。
- story ownershipを奪う可能性があるvisual-cognition-slidesだけreference-only。
- project-specificな責任境界は `docs/17_visual_skill_routing.md` と root `AGENTS.md` に置く。
- upstreamをcommit SHAでlockし、自動updateしない。

これを採用する。

## Architecture

```text
approved semantic render input
        ↓
Visual Director-compatible render_spec
        ↓
preview / representative stills
        ↓
UX Audit
        ↓
evidence-bound findings
        ↓
Visual Cognition reference pass
        ↓
representation class
        ↓
Candidate Catalog lookup
        ↓
┌ existing candidate ───────────────┐
│                                   ↓
│                            Motion Design
│                                   ↓
│                           Remotion implementation
│                                   ↓
│                           visual regression
│                                   ↓
└──────── capability gap → reusable template work
```

## Ownership boundaries

### Editorial / Plot owns

- 主役ニュース
- Expected / Actual / Gap
- 市場因果
- 反対材料
- narration
- caption
- numbers
- source
- scene order
- primary / fallback decision

### Visual Director owns

- legal Candidate set
- template eligibility
- candidate ID selection
- visual-only compilation

### Imported Skills own only advice

- ux-audit: visible defect diagnosis
- visual-cognition-slides: representation recommendation
- motion-design: motion recommendation
- remotion-official: implementation best practices

### Renderer owns

- deterministic rendering of approved fields

### GitHub Actions owns

- mechanical validation and rendering only

## Skill source management

`config/agent-skills.lock.json` pins exact upstream commits.

`node scripts/sync-agent-skills.mjs` materializes them.

Auto-discover destinations:

- `.agents/skills/ux-audit`
- `.agents/skills/motion-design`
- Remotion official skill folders directly under `.agents/skills/`

Reference-only:

- `third_party/agent-skills/visual-cognition-slides`

Runtime production does not fetch these repositories.

## Visual Translation Contract

Visual Cognition may classify an already-approved Beat into a representation class, but it may not add claims.

Examples:

- gap → Expected / Actual / Gap visual
- comparison-set → bar / matrix / split comparison
- causal-graph → causal lane
- time-series → event-reaction timeline
- verification → strengthen/weaken matrix
- analogy → analogy steps

If no registered template can express the required representation, return `CAPABILITY_GAP`. Do not generate arbitrary daily SVG/HTML/React from render_spec.

## Motion Contract

Motion may choose how approved objects reveal or emphasize, but may not change their semantic order.

Protected sequence examples:

- Expected → Actual → Gap
- cause node → effect node → connecting arrow
- reported event → verified market reaction

Motion decisions must map to existing `visualEvents` / motion presets or to a separately reviewed reusable implementation change.

## QA Contract

Before implementation:
- capture visible finding with evidence.

After implementation:
- compare same Beat before / after.
- rerun relevant visible finding.
- run existing visual contracts.
- verify a different fresh episode.

A change is incomplete if it only improves one hand-authored fixture.

## Failure handling

- Meaning change required → return to editorial/production design.
- Missing Evidence Capability → do not fake visual evidence.
- No legal Candidate → `CAPABILITY_GAP`.
- Unsupported Remotion API for current package version → use current project version, not latest Skill assumption.
- External Skill update changes trigger/license/responsibility → keep pinned old commit until explicit review.

## Success criteria

1. Existing Visual Director remains the only visual semantic selection layer before freeze.
2. External Skills cannot alter Protected Semantic Diff fields.
3. visual-cognition-slides cannot auto-trigger as a video generator.
4. Current preview can be audited with visible evidence.
5. A finding can be translated to existing Template or explicit `CAPABILITY_GAP`.
6. Motion advice becomes deterministic frame-based Remotion implementation.
7. Before/after review plus fresh episode regression is mandatory for visual-system changes.
8. Production GitHub Actions remain free of AI visual judgment.
