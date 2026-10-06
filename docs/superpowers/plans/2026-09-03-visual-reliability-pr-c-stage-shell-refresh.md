# Visual Reliability PR-C — Stage / Shot Visual Refresh Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans`, `remotion-markup`, TDD, and `verification-before-completion`. This PR changes presentation only. Do not alter editorial text, numbers, object topology, Candidate selection, or Visual Events.

**Goal:** Replace generic card-like presentation with cognition-matched visual structures for the existing registered Stage/Shot families implicated by the 2026-08-17 audit, while preserving all current semantic and deterministic contracts.

**Architecture:** Production content with `shots` renders through `ShotStageRenderer → DedicatedShotRenderer (ShotRecipes)` inside the registered Visual Grammar Stage shell. Legacy/no-shot compatibility renders through `VisualTemplateRenderer`. Refresh the production Shot recipe structures first, then keep Stage Shell and legacy rendering consistent. No new Template is added in this PR.

**Tech Stack:** React 19, Remotion 4, `useCurrentFrame`/`interpolate`, existing Stage themes and Shot motion contracts.

---

## Task 1 — Capture current structural expectations before visual changes

**Files:**
- Modify: `scripts/test-stage-legibility-contract.tsx`
- Modify: `scripts/test-shot-stability.ts`
- Modify: `scripts/test-spec-presentation.ts`
- Create if useful: `scripts/test-visual-hierarchy-contract.tsx`
- Modify: `package.json`

**Step 1: Write RED structural tests for the desired hierarchy**

Add deterministic assertions for viewer structure, not aesthetics:
- opening contradiction has two dominant opposing surfaces and one subordinate question/connector;
- Expected/Actual/Gap recipes expose one dominant stage at a time rather than three equal generic cards;
- causal recipe renders nodes and connectors as a path, not a generic board;
- timeline recipe exposes distinct time markers/track structure;
- verification recipe has explicit hypothesis/check grouping;
- closing recipe contains only viewer-authored synthesis fields.

Tests may inspect rendered React markup/static output or stable `data-*` structural hooks. Do not assert exact pixel coordinates/colors unless needed for safe-area/contrast contracts.

**Step 2: Run RED**

```bash
npm run test:stage-legibility
npm run test:shot-stability
```

Expected: at least the new hierarchy assertions fail on current structures.

**Step 3: Add `test:visual-hierarchy` if a new file is used**

Include it in `test:visual-story`.

**Step 4: Commit tests only**

```bash
git add scripts/test-stage-legibility-contract.tsx scripts/test-shot-stability.ts scripts/test-spec-presentation.ts scripts/test-visual-hierarchy-contract.tsx package.json
git commit -m "test: define visual hierarchy contract"
```

---

## Task 2 — Refresh opening contradiction and Expected / Actual / Gap Shot recipes

**Files:**
- Modify: `src/components/spec/shots/ShotRecipes.tsx`
- Modify only if shared layout primitives are needed: `src/components/spec/StageSafeArea.tsx`
- Test: `scripts/test-visual-hierarchy-contract.tsx`
- Test: `scripts/test-shot-motion-continuity.ts`

**Step 1: Keep RED tests focused on structure**

Opening target:

```text
strong result / guide        stock reaction
          \                   /
           unresolved contradiction
```

The question is subordinate; the two contradictory facts are the visual hero.

Gap target uses existing Shot recipes as a progressive sequence:

```text
Expected → Actual → Gap
```

Each stage has a distinct visual state; Gap is the final anchor.

**Step 2: Implement minimal markup changes**

Use the existing `Contradiction`, `ExpectedAnchor`, `ActualCrosses`, and `GapMacro` recipe components in `ShotRecipes.tsx`. Improve hierarchy with layout, scale, whitespace, and only the motion already authorized by Shot/Beat progress. Do not derive new text or values.

Use Remotion frame-driven motion only; no CSS transitions/animations.

**Step 3: Run GREEN**

```bash
npm run test:visual-hierarchy
npm run test:shot-motion-continuity
npm run test:stage-legibility
```

**Step 4: Render representative still fixtures for human comparison**

```bash
npm run episode:spec:beat-stills -- render-specs/fixtures/complete-9scene/render_spec.json
```

This is a development artifact only; do not put AI visual judgment in CI.

**Step 5: Commit**

```bash
git add src/components/spec/shots/ShotRecipes.tsx src/components/spec/StageSafeArea.tsx scripts/test-visual-hierarchy-contract.tsx
git commit -m "feat: strengthen contradiction and gap visual hierarchy"
```

---

## Task 3 — Refresh causal path and separated-lane structures

**Files:**
- Modify: `src/components/spec/shots/ShotRecipes.tsx`
- Modify: `src/components/spec/shots/CausalVisualEventOverlay.tsx` only if the current arrow/focus overlay needs to align with the refreshed path
- Modify if shell decoration is semantically useful: `src/components/spec/stages/CausalPathStage.tsx`
- Modify: `src/components/spec/stages/DualLaneStage.tsx`
- Test: `scripts/test-causal-visual-events.ts`
- Test: `scripts/test-visual-hierarchy-contract.tsx`

**Step 1: Add/retain RED expectations**

- causal nodes are spatially ordered by `templateConfig.nodeOrder`;
- connector appearance remains downstream of node visibility/events;
- separate lanes remain visibly separate; no decorative connector crosses between them;
- no node label or arrow is synthesized from narration.

**Step 2: Implement**

Refresh `CausalBuild` and lane-oriented Shot recipes using layout and existing event-driven overlay. The visual should make path direction obvious without adding a new causal edge.

**Step 3: Run GREEN**

```bash
npm run test:causal-visual-events
npm run test:visual-hierarchy
npm run test:visual-sequence
```

**Step 4: Commit**

```bash
git add src/components/spec/shots/ShotRecipes.tsx src/components/spec/shots/CausalVisualEventOverlay.tsx src/components/spec/stages/CausalPathStage.tsx src/components/spec/stages/DualLaneStage.tsx scripts/test-causal-visual-events.ts scripts/test-visual-hierarchy-contract.tsx
git commit -m "feat: clarify causal and dual-lane stages"
```

---

## Task 4 — Refresh timeline / reaction and source evidence presentation

**Files:**
- Modify: `src/components/spec/shots/ShotRecipes.tsx`
- Modify: `src/components/spec/stages/TimelineStage.tsx`
- Modify: `src/components/spec/stages/DocumentMediaStage.tsx`
- Modify only where template-specific legacy output must match: `src/components/spec/VisualTemplateRenderer.tsx`
- Test: `scripts/test-event-reaction-timeline.tsx`
- Test: `scripts/test-stage-legibility-contract.tsx`
- Test: `scripts/test-visual-hierarchy-contract.tsx`

**Step 1: Define RED structure**

Timeline/reaction:
- time anchors are the primary structure;
- reaction path/values are visually distinct from clock labels;
- current-state highlighting can advance without redrawing a generic card board.

Source/document:
- evidence surface has a bounded proof role;
- source label/evidence text is legible;
- surrounding Stage chrome does not duplicate the same title or internal metadata.

**Step 2: Implement minimal refresh**

Do not make DocumentMedia auto-dismiss itself; duration/return is author-owned by Beats/Shots. This PR only ensures the evidence surface looks like evidence, not a generic default screen.

**Step 3: Run GREEN**

```bash
npm run test:event-reaction-timeline
npm run test:stage-legibility
npm run test:visual-hierarchy
```

**Step 4: Commit**

```bash
git add src/components/spec/shots/ShotRecipes.tsx src/components/spec/stages/TimelineStage.tsx src/components/spec/stages/DocumentMediaStage.tsx src/components/spec/VisualTemplateRenderer.tsx scripts/test-event-reaction-timeline.tsx scripts/test-stage-legibility-contract.tsx scripts/test-visual-hierarchy-contract.tsx
git commit -m "feat: refresh timeline and evidence presentation"
```

---

## Task 5 — Refresh verification / matrix and closing assembly

**Files:**
- Modify: `src/components/spec/shots/ShotRecipes.tsx`
- Modify: `src/components/spec/stages/MatrixStage.tsx`
- Modify: `src/components/spec/stages/VerificationGateStage.tsx`
- Modify: `src/components/spec/stages/AssemblyStage.tsx`
- Modify: `src/components/spec/ShotStageRenderer.tsx` only if shared typography/chrome is the source of leaked hierarchy
- Test: `scripts/test-stage-legibility-contract.tsx`
- Test: `scripts/test-public-screen.ts`
- Test: `scripts/test-spec-presentation.ts`

**Step 1: Add RED structure**

Verification must visibly classify/reduce hypotheses without hiding counterevidence. Closing must show only final viewer-facing synthesis and must not render internal transition/stage labels.

**Step 2: Implement**

Keep Stage Shells as semantic canvas/chrome and Shot recipes as actual content layout. Avoid adding “ambient” movement unless it demonstrably preserves attention hierarchy.

**Step 3: Run GREEN**

```bash
npm run test:stage-legibility
npm run test:public-screen
npm run test:visual-validator
```

**Step 4: Commit**

```bash
git add src/components/spec/shots/ShotRecipes.tsx src/components/spec/stages/MatrixStage.tsx src/components/spec/stages/VerificationGateStage.tsx src/components/spec/stages/AssemblyStage.tsx src/components/spec/ShotStageRenderer.tsx scripts/test-stage-legibility-contract.tsx scripts/test-public-screen.ts scripts/test-spec-presentation.ts
git commit -m "feat: improve verification and closing hierarchy"
```

---

## Task 6 — Re-run actual visual audit workflow on representative Preview/stills

**Development-only workflow:**
1. render the same representative Beat family fixtures;
2. inspect before/after stills with the project-local UX Audit Skill;
3. use Visual Cognition only to check whether visual form matches approved knowledge type;
4. use Motion Design Skill only to review choreography, not market meaning;
5. record remaining reusable capability gaps; do not add a new Template automatically.

If the audit finds a factual/causal visual distortion, stop PR-C and return to PR-A/authoring rather than polishing it away.

---

## Task 7 — PR-C final verification

```bash
npm run typecheck
npm run lint
npm run test:stage-legibility
npm run test:visual-hierarchy
npm run test:event-reaction-timeline
npm run test:causal-visual-events
npm run test:shot-motion-continuity
npm run test:shot-stability
npm run test:public-screen
npm run test:visual-story
npm run test:spec
npm run build
```

**Acceptance:**
- changes affect the actual Shot production path, not only legacy templates;
- no new Template ID is introduced;
- no market meaning/text/value/object topology is inferred or changed;
- no CSS transition/animation is used;
- contradiction, gap, causal, timeline, verification, evidence, and closing families have distinct cognition-matched structures;
- representative stills are reviewed manually before qualification.
