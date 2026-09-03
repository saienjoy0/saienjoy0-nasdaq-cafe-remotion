# Visual Reliability PR-D — Subtitle / Viewer Surface Guard Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans`, TDD, and `verification-before-completion`. Preserve `speechText`; this PR changes only public presentation safety.

**Goal:** Prevent mid-token English/financial subtitle breaks and make renderer-internal metadata structurally unable to leak through the public scene view-model/render path.

**Architecture:** Replace character-only subtitle wrapping with token-aware legal break selection while retaining the existing 44-character/2×22 public budget. Strengthen `ProductionScene → getSceneRenderState() → toPublicSceneViewModel() → PublicSceneViewModel → renderer` so internal identifiers never become public fields by convenience or fallback.

**Tech Stack:** TypeScript, existing subtitle cue/layout validators, PublicSceneViewModel, React/Remotion public render tests.

---

## Task 1 — Specify legal subtitle tokenization and line-break behavior

**Files:**
- Modify: `scripts/test-subtitles.ts`
- Create if isolation helps: `src/spec/subtitle-tokenization.ts`
- Modify: `src/spec/subtitle-cues.ts`

**Step 1: Write RED cases**

Add exact assertions for:

```text
Applied Materials
NASDAQ
S&P 500
-5.12%
$123.45
日本語の文章にApplied Materialsが入るケース
```

Required behavior:
- no line break inside a Latin word when a legal neighboring break exists;
- keep numeric sign/value/% together;
- keep currency marker/value together;
- treat `S&P 500` as a protected compact financial token when it fits one line;
- preserve Japanese/CJK character-level opportunities;
- avoid obvious Japanese line-head punctuation (`、。！？)]」』` etc.) and line-end opening punctuation where a legal alternative exists;
- still produce at most 2 lines and at most 22 visible characters per line under the existing budget.

**Step 2: Run RED**

```bash
npm run test:subtitles
```

Expected: FAIL on the current character-array hard split.

**Step 3: Implement minimal token-aware wrapping**

Tokenize into protected Latin/number clusters plus CJK/punctuation units. Search legal break candidates nearest the current 22-character target. Only hard-split a protected token when the token itself exceeds the entire legal line capacity and no representation can fit; in that case prefer a validation failure rather than silently producing an unreadable split.

Do not alter cue timing weights unless tests prove the new page boundaries require it.

**Step 4: Run GREEN**

```bash
npm run test:subtitles
```

**Step 5: Commit**

```bash
git add src/spec/subtitle-tokenization.ts src/spec/subtitle-cues.ts scripts/test-subtitles.ts
git commit -m "fix: wrap subtitles without breaking financial tokens"
```

---

## Task 2 — Make layout validation use the same token-aware representation

**Files:**
- Modify: `src/spec/validate-render-layout.ts`
- Modify: `scripts/test-subtitles.ts`
- Modify: `scripts/test-render-spec.ts`

**Step 1: Add RED no-fit cases**

Create a protected token longer than the safe line capacity and assert the production layout validator fails with an exact subtitle cue path rather than overflowing or splitting silently.

Also assert valid mixed Japanese/English cues pass.

**Step 2: Run RED**

```bash
npm run test:subtitles
npm run test:spec
```

**Step 3: Reuse one source of wrapping truth**

`assertNarrationChunkSubtitleLayoutFits()` must validate the actual `createSubtitleCues()` output. Do not implement a second tokenizer in layout validation.

**Step 4: Run GREEN**

```bash
npm run test:subtitles
npm run test:spec
```

**Step 5: Commit**

```bash
git add src/spec/validate-render-layout.ts scripts/test-subtitles.ts scripts/test-render-spec.ts
git commit -m "fix: fail closed on unrenderable subtitle tokens"
```

---

## Task 3 — Audit PublicSceneViewModel for internal/public type mixing

**Files:**
- Modify: `src/spec/public-view-model.ts`
- Modify: `scripts/test-render-spec.ts`
- Modify: `scripts/test-viewer-surface-hardening.ts`

**Step 1: Write RED serialization tests**

Serialize `toPublicSceneViewModel()` for representative scenes and assert internal property names/values cannot appear as accidental public copy:

```text
sceneId
sceneNumber
beatId
screenState
visualMode
sequencePolicy
stageShell
transitionRole
validator status
```

Important distinction: the renderer may internally need `visualTemplate`/variant to choose a registered renderer. The test must prevent those identifiers from being exposed as viewer text, not ban internal discriminants that are required for deterministic rendering.

Add a case reproducing the audit-style `closing` leak: internal transition role must not become any headline/text/label/typography field through fallback logic.

**Step 2: Run RED**

```bash
npm run test:viewer-surface-hardening
npm run test:public-screen
```

Expected: at least the new viewer-copy provenance assertion fails if an internal fallback exists.

**Step 3: Strengthen the typed public boundary**

In `public-view-model.ts`, separate:
- internal render discriminants needed to dispatch components;
- viewer-authored copy fields (`headline`, `texts`, card/number/node labels, typography text, source label).

No viewer-copy field may fall back to `transitionRole`, Stage Shell ID, template ID, screenState, Beat/Scene ID, sequencePolicy, or validator message.

Prefer helper constructors/types over a growing denylist.

**Step 4: Run GREEN**

```bash
npm run test:viewer-surface-hardening
npm run test:public-screen
npm run test:visual-sequence
```

**Step 5: Commit**

```bash
git add src/spec/public-view-model.ts scripts/test-render-spec.ts scripts/test-viewer-surface-hardening.ts
git commit -m "fix: separate renderer metadata from viewer copy"
```

---

## Task 4 — Remove presentation fallbacks that stringify internal identifiers

**Files:**
- Inspect/Modify as evidence requires: `src/components/spec/ShotStageRenderer.tsx`
- Inspect/Modify as evidence requires: `src/components/spec/VisualTemplateRenderer.tsx`
- Inspect/Modify as evidence requires: `src/components/spec/shots/ShotRecipes.tsx`
- Modify: `scripts/test-public-screen.ts`
- Modify: `scripts/test-spec-presentation.ts`

**Step 1: Add RED renderer tests**

Use representative PublicMainContent where optional authored viewer text is missing. Renderer must either use another explicitly viewer-authored field or render nothing; it must never display a technical enum/ID as a convenience fallback.

**Step 2: Run RED**

```bash
npm run test:public-screen
npm run test:visual-templates
npm run test:shot-stability
```

**Step 3: Remove only proven unsafe fallbacks**

Do not broadly delete internal metadata needed for deterministic dispatch. Change only viewer-facing fallback chains that can surface it.

**Step 4: Run GREEN**

```bash
npm run test:public-screen
npm run test:visual-templates
npm run test:shot-stability
npm run test:viewer-surface-hardening
```

**Step 5: Commit**

```bash
git add src/components/spec/ShotStageRenderer.tsx src/components/spec/VisualTemplateRenderer.tsx src/components/spec/shots/ShotRecipes.tsx scripts/test-public-screen.ts scripts/test-spec-presentation.ts
git commit -m "fix: prevent technical labels from reaching public screens"
```

---

## Task 5 — Documentation and regression corpus

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/11_visual_beat_implementation.md`
- Modify: `docs/07_codex_minimal_execution_contract.md` if it describes public-screen fields
- Add regression fixture only if needed under existing `render-specs/fixtures/` or test-support pattern; do not create an episode-specific permanent production input.

Document:
- `speechText` remains TTS source;
- `captionText` is authored public text and may be paginated/wrapped but not semantically rewritten;
- renderer IDs are control metadata, never copy;
- no internal ID fallback is allowed.

Run:

```bash
npm run test:subtitles
npm run test:public-screen
npm run test:viewer-surface-hardening
```

Commit:

```bash
git add AGENTS.md docs/11_visual_beat_implementation.md docs/07_codex_minimal_execution_contract.md
git commit -m "docs: define subtitle and public metadata boundary"
```

---

## Task 6 — PR-D final verification

```bash
npm run typecheck
npm run lint
npm run test:subtitles
npm run test:viewer-surface-hardening
npm run test:public-screen
npm run test:visual-templates
npm run test:visual-sequence
npm run test:visual-story
npm run test:spec
npm run build
```

**Acceptance:**
- `Applied Materials` and common financial tokens are not split illegally when a legal layout exists;
- unrenderable protected tokens fail with exact paths rather than overflow;
- `speechText` is byte-for-value unchanged;
- renderer control identifiers cannot become viewer text through fallback logic;
- deterministic internal discriminants remain available for component dispatch;
- no subtitle or public-surface fix changes editorial meaning.
