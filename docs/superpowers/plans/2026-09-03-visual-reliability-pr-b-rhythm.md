# Visual Reliability PR-B — Visual Rhythm Contract Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task-by-task. Use TDD. Do not auto-rewrite Visual Events; fail closed and return exact paths.

**Goal:** Prevent long explanatory Beats from revealing all meaningful objects immediately and then remaining inert, while preserving authored timing ownership and keeping measured stagnation as a Preview diagnostic.

**Architecture:** Add one deterministic `visual-rhythm-contract` shared by Candidate eligibility and final Visual Story validation. It reads only registered motion language, selected objects/types, Beat chunk range, authored Visual Events, sequence policy, and final hold. It never reads narration semantics with an LLM and never invents offsets.

**Tech Stack:** TypeScript, Zod-adjacent contracts, existing Visual Grammar/Visual Director/Visual Story validators, tsx tests.

---

## Task 1 — Define rhythm event anchors and deterministic rule vocabulary

**Files:**
- Create: `src/spec/visual-rhythm-contract.ts`
- Create: `scripts/test-visual-rhythm-contract.ts`
- Modify: `package.json`

**Step 1: Write RED unit cases**

Create compact test fixtures for:
- valid progressive causal reveal;
- invalid causal nodes/arrows all sharing one anchor;
- valid ordered timeline reveal;
- invalid multi-event timeline sharing one anchor;
- valid Expected → Actual → Gap anchors;
- invalid gap ordering;
- intentional single-object static Beat remains legal.

Define an event anchor as the ordered tuple:

```text
(chunk index, chunk-start|chunk-end, offsetMs)
```

Do not use wall-clock duration in this first structural contract.

**Step 2: Run RED**

```bash
node --import tsx scripts/test-visual-rhythm-contract.ts
```

Expected: FAIL because the contract does not exist.

**Step 3: Implement minimal pure functions**

Expose functions that accept already-resolved Beat/object/event metadata and return structured issues containing a stable error code and event/object path information. Initial rules:

- `causal-path`: when 2+ meaningful causal steps exist, at least two distinct reveal anchors; arrow reveal must follow both connected nodes;
- `timeline-track`: 2+ timeline events require ordered distinct anchors;
- gap family: Expected before Actual before Gap when those role objects exist;
- verification/matrix: 2+ checks/hypotheses require more than one reveal anchor;
- single-object/static content is not rejected merely for being static.

No aesthetic timing threshold belongs here.

**Step 4: Run GREEN**

```bash
node --import tsx scripts/test-visual-rhythm-contract.ts
```

Expected: PASS.

**Step 5: Wire npm command and commit**

Add `test:visual-rhythm` and include it in `test:visual-story`.

```bash
git add src/spec/visual-rhythm-contract.ts scripts/test-visual-rhythm-contract.ts package.json
git commit -m "feat: define deterministic visual rhythm contract"
```

---

## Task 2 — Reuse the rhythm contract in final Visual Story validation

**Files:**
- Modify: `src/spec/validate-visual-story.ts`
- Modify: `scripts/test-visual-rhythm-contract.ts`
- Modify: `scripts/test-visual-sequence.ts`

**Step 1: Add RED integration tests**

Build valid RenderSpec fragments whose existing schema/static soundness passes but choreography is invalid. Assert exact failure paths such as the Beat or offending `visualEvents[index]`.

**Step 2: Run RED**

```bash
npm run test:visual-rhythm
npm run test:visual-sequence
```

Expected: the integration case currently passes incorrectly.

**Step 3: Integrate without duplicating logic**

Inside `validateVisualStoryContract`, after Beat events are sorted and object types are known, call the shared rhythm contract. Translate issues to existing `fail(path,message)` behavior. Do not create a second set of choreography rules inside the validator.

**Step 4: Run GREEN**

```bash
npm run test:visual-rhythm
npm run test:visual-sequence
npm run test:visual-story
```

**Step 5: Commit**

```bash
git add src/spec/validate-visual-story.ts scripts/test-visual-rhythm-contract.ts scripts/test-visual-sequence.ts
git commit -m "feat: enforce visual rhythm before production freeze"
```

---

## Task 3 — Remove rhythm-invalid candidates before Visual Director selection

**Files:**
- Modify: `src/spec/visual-candidate-builder.ts`
- Modify: `scripts/test-visual-director.ts`
- Modify/Create: `scripts/test-candidate-static-soundness.ts` only if candidate-level rhythm coverage fits there

**Step 1: Write RED Candidate tests**

Create a Beat with two otherwise legal candidate Templates where one candidate's motion language cannot satisfy the authored event sequence. Assert the invalid candidate is absent rather than selected and rejected later.

Do not mutate Visual Events per candidate.

**Step 2: Run RED**

```bash
npm run test:visual-director
```

Expected: FAIL because Candidate Builder currently checks static eligibility only.

**Step 3: Add Candidate rhythm compatibility**

After constructing the projected Beat/template appearance, obtain its registered `motionLanguage` and call the same contract. If structural rhythm is incompatible, skip that candidate. If all candidates disappear, preserve the existing coverage/fail-closed path (`E_VISUAL_CANDIDATE_NONE`) rather than fabricating timing.

**Step 4: Run GREEN**

```bash
npm run test:visual-director
npm run test:visual-rhythm
```

**Step 5: Commit**

```bash
git add src/spec/visual-candidate-builder.ts scripts/test-visual-director.ts scripts/test-candidate-static-soundness.ts
git commit -m "feat: filter rhythm-incompatible visual candidates"
```

---

## Task 4 — Keep Preview stagnation reporting distinct from pre-freeze rhythm failure

**Files:**
- Modify: `src/spec/visual-stagnation.ts` only if report metadata needs a clarification field; do not change warning-only semantics unnecessarily
- Modify: `scripts/test-visual-stagnation.ts`
- Modify: `docs/11_visual_beat_implementation.md`
- Modify: `docs/13_visual_grammar_contract.md`

**Step 1: Add regression assertions**

Prove:
- structural all-at-once choreography fails the new rhythm validator before freeze;
- an intentionally legal static presentation can still generate `W_VISUAL_STAGNATION` after measured timing;
- `W_VISUAL_STAGNATION` remains warning/reporting, not an automatic Template switch.

**Step 2: Run tests**

```bash
npm run test:visual-rhythm
npm run test:visual-grammar-timing
```

**Step 3: Update docs only after tests define behavior**

Document the two layers:

```text
pre-freeze rhythm contract = structural correctness
post-timing stagnation report = measured Preview diagnostic
```

**Step 4: Run GREEN**

```bash
npm run test:visual-story
```

**Step 5: Commit**

```bash
git add src/spec/visual-stagnation.ts scripts/test-visual-stagnation.ts docs/11_visual_beat_implementation.md docs/13_visual_grammar_contract.md
git commit -m "docs: separate rhythm validity from stagnation diagnostics"
```

---

## Task 5 — PR-B final verification

```bash
npm run typecheck
npm run lint
npm run test:visual-rhythm
npm run test:visual-director
npm run test:visual-sequence
npm run test:visual-grammar-timing
npm run test:visual-story
npm run test:spec
npm run build
```

**Acceptance:**
- Renderer never invents or redistributes timing;
- Candidate Catalog excludes structurally impossible choreography;
- all-at-once multi-step causal/timeline/verification reveals fail before freeze;
- valid explicitly authored progressive events pass;
- static Beats remain legal where intended;
- measured 8-second stagnation remains a Preview warning/report;
- no AI/video inspection is introduced into CI or Actions.
