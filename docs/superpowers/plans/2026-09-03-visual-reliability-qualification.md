# Visual Reliability — Fresh Episode Qualification Plan

> **For agentic workers:** Use `superpowers:executing-plans` and `verification-before-completion`. This plan is qualification, not feature development. Do not patch the daily bytes to make the run pass. Do not run Final.

**Goal:** Prove the completed PR-A through PR-D architecture works on a genuinely fresh episode, end-to-end, without fixture-specific repairs, authoring-byte retries, semantic inference by Renderer, or unresolved image paths.

**Architecture:** Use the canonical Current production entry in Plot, the immutable Renderer handoff, the Current Preview request/publication path, and the same visual audit workflow used on the 2026-08-17 baseline. Qualification succeeds only if the fresh episode reaches Preview from approved authoring in one clean production attempt and the resulting visual audit finds no semantic/rhythm/public-surface contract defect.

**Repositories:**
- Collector: `saienjoy0/nasdaq-cafe-news-collector`
- Plot: `saienjoy0/nasdaq-plot-creator-`
- Renderer: `saienjoy0/saienjoy0-nasdaq-cafe-remotion`

---

## Preconditions

Do not start qualification until all are true:

1. PR-A Semantic Scope is merged in Plot and Renderer and the canonical Renderer binding points to the compatible 2.5.0 commit.
2. PR-B Visual Rhythm is merged.
3. PR-C Stage/Shot refresh is merged.
4. PR-D Subtitle/Public Surface guard is merged.
5. All required repo CI is green.
6. The qualification episode date has not been used as the implementation fixture for A–D.
7. The daily authoring has final Primary/Fallback image routes resolved before handoff.
8. No user request for Final has been made.

---

## Task 1 — Baseline cross-repo contract test before using a real day

**Plot:**
```bash
pytest -q tests/current-spine/test_current_authoring_materializer_parity.py \
  tests/current-spine/test_current_renderer_compatibility_projection.py \
  tests/current-spine/test_current_preview_final_request_builders.py \
  tests/current-spine/test_current_preview_request_readiness.py \
  tests/current-spine/test_current_production_facade_contract.py
```

**Renderer:**
```bash
npm run typecheck
npm run lint
npm run test:spec
npm run test:visual-story
npm run test:handoff-intake
npm run test:public-screen
npm run build
```

Expected: PASS. If any fail, qualification stops; do not use a real daily run to debug an already-known contract failure.

---

## Task 2 — Produce a fresh approved daily authoring package

Run the normal project editorial flow on the chosen fresh date:

```text
Collector source package
→ causal research
→ 02 editorial decision
→ 01 fox narration
→ 03 nine-scene package
→ 04 entertainment inquisition/fixes
→ image Primary/Fallback resolution
→ final daily authoring
```

Before materialization verify every Visual Beat explicitly carries:

```text
semanticScope = lead-stock | sector | nasdaq | multiple
```

and every multi-step Beat has authored `shots` or `visualEvents` sufficient for its intended progression.

**Hard rule:** do not derive `semanticScope` from template choice after authoring. If the market explanation is unclear, return to editorial analysis rather than inventing a visual scope.

---

## Task 3 — Run the canonical Current production facade once

Use Plot's sole Current entrypoint:

```bash
python3 scripts/current_production_facade_v12.py \
  --workspace "$PWD" \
  --renderer-root <checked-out-qualified-renderer-root> \
  closure \
  --episode-date YYYY-MM-DD \
  --phase compile \
  --semantic-freeze semantic-freezes/YYYY-MM-DD.json \
  --build-handoff-on-pass \
  --bundle-root production-bundles \
  --plot-commit "$(git rev-parse HEAD)"
```

At execution time substitute the actual qualification date and real qualified Renderer checkout path. Those are run inputs, not values to hard-code into source.

Expected facade outcome:

```text
status = PASS
previewHandoffReady = true
```

**No-retry qualification rule:** if it fails because approved authoring bytes, semantic scope, rhythm, assets, or contract lineage are wrong, record the defect and fail qualification. Fix the architecture/authoring process in a new change and qualify again on another fresh date. Do not patch this episode and count the second attempt as the same qualification.

Environmental/transient infrastructure failures may be retried only when the input SHA and all authoring/handoff bytes remain identical; record that distinction explicitly.

---

## Task 4 — Inspect the immutable handoff before publication

Verify the bundle/manifest prove:
- render_spec schema `2.5.0`;
- every Beat has `semanticScope`;
- semanticScope values equal the approved Plot authoring values;
- no unresolved Primary/Fallback state;
- all asset IDs/SHAs resolve;
- Renderer commit/version matches the canonical binding;
- official preflight/validator receipts are PASS;
- no non-selected image route remains in production render_spec.

Do not manually edit the bundle.

---

## Task 5 — Build and publish Current Preview request only

Use the existing Plot Current Preview V4 builder/publication flow after PASS closure. The request must be request-only and append-only, keyed by the exact handoff/request identity.

Relevant existing files to use, not bypass:
- `scripts/build_current_preview_request_v4.py`
- `scripts/build_current_preview_publication.py`
- `tests/current-spine/test_current_preview_final_request_builders.py`
- `tests/current-spine/test_current_preview_publication.py`
- `tests/current-spine/test_current_preview_request_readiness.py`

Expected: Renderer Current Preview workflow runs exactly once for the exact request bytes and stores a Preview Artifact.

**Forbidden:** invoking Current Final, constructing a final authorization request, or auto-promoting Preview to Final.

---

## Task 6 — Machine-check the Preview production report

Before visual judgment, require:
- Renderer validator PASS;
- Remotion exit code 0;
- MP4 exists and is non-empty;
- no missing asset/read failure;
- no semantic-scope violation;
- no Visual Rhythm contract failure;
- no public-surface/subtitle failure;
- no unresolved image route.

Also collect the measured Visual Grammar/stagnation report. `W_VISUAL_STAGNATION` is diagnostic: record any warnings for the visual audit; do not auto-change Templates.

---

## Task 7 — Re-run the same visual audit workflow used on the baseline

Use the generated Preview plus representative Beat stills:

```text
Preview MP4 / Beat stills
→ UX Audit: visible hierarchy/grouping/legibility evidence
→ Visual Cognition: does the approved knowledge type map to the right form?
→ Motion Design: does choreography guide attention without front-loading?
→ compare with contract reports
```

Audit all nine Scenes, with special checks:

1. No visual edge implies a cross-scope causal relationship absent from approved semantics.
2. Company-direct and NASDAQ-wide explanations remain visibly distinct when authored separately.
3. Multi-step Beats do not complete in the opening fraction and then sit inert for the explanatory remainder.
4. Source/document evidence acts as evidence, not a generic long-duration default screen.
5. Expected/Actual/Gap preserves order and Gap is visually legible.
6. Timeline/reaction screens visually communicate temporal progression.
7. Verification preserves contrary evidence while progressively classifying hypotheses.
8. No English/financial subtitle token is split illegally.
9. No renderer metadata (`closing`, template IDs, stage IDs, screenState, sequence policy, technical status) appears as viewer copy.

Record findings in a new dated audit document. Do not silently edit the Preview.

---

## Task 8 — Qualification decision

**PASS only if:**
- Tasks 1–7 pass;
- there was no authoring-byte semantic repair/retry;
- any infrastructure retry used byte-identical inputs;
- no material visual finding remains at severity Major/Critical;
- no semantic/rhythm/public-surface contract defect is found;
- the user visually reviews the Preview and accepts it as the qualified Current-production result.

**FAIL if:**
- a visual must be manually patched for this day;
- Renderer/Actions inferred a fix;
- a false causal scope can still render;
- a multi-step Beat remains structurally front-loaded;
- internal metadata leaks;
- the qualified path requires an episode-specific Template/component;
- any unresolved image route remains.

On FAIL, open a new architecture/bug PR and later qualify on a different fresh episode. Do not weaken validators to pass the qualification.

---

## Task 9 — Production promotion after user visual approval

Only after PASS + user visual approval:
- update the canonical Current production compatibility/binding to make 2.5.0 the normal fresh-authoring target;
- keep 2.2–2.4 readers only where explicit compatibility tests require them;
- preserve the approved Preview artifact/report/audit as qualification evidence;
- update AGENTS/docs to mark 2.5.0 qualified.

Do **not** render Final as part of promotion. Final remains a separate explicit user action.
