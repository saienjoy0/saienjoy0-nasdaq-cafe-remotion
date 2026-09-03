# Visual Reliability PR-A — Semantic Scope Contract Implementation Plan

> **For agentic workers:** Workflow requirement: Use `superpowers:executing-plans` to implement this plan task-by-task. Use TDD for every code change and `verification-before-completion` before claiming success.

**Goal:** Introduce `render_spec 2.5.0` with an author-owned, protected `semanticScope` on every Visual Beat, carry it unchanged from Plot authoring through the immutable handoff, and prevent the Renderer Candidate Builder from flattening multi-scope explanations into a false single causal chain.

**Architecture:** This is a coordinated Plot → handoff → Renderer contract change. Plot authors `semanticScope`; the materializer and strict projection transport it mechanically; Renderer validates it, treats it as protected semantics, and uses it only to remove illegal candidates. Neither Visual Director nor Renderer may infer or rewrite scope.

**Tech Stack:** Python 3 + pytest in `saienjoy0/nasdaq-plot-creator-`; TypeScript + Zod + tsx in `saienjoy0/saienjoy0-nasdaq-cafe-remotion`.

---

## Task 1 — Plot: make Beat semantic scope an explicit authoring requirement

**Repository:** `saienjoy0/nasdaq-plot-creator-`

**Files:**
- Modify: `scripts/validate_chatgpt_daily_authoring_closure.py`
- Modify: `tests/current-spine/current_authoring_runtime_fixture.py`
- Test: `tests/current-spine/test_current_authoring_materializer_parity.py`
- Test/Create if cleaner: `tests/current-spine/test_visual_semantic_scope_contract.py`

**Step 1: Write the failing authoring test**

Add coverage that a fresh-authoring Beat without `semanticScope` fails with an exact Beat path, and that only these values pass:

```text
lead-stock
sector
nasdaq
multiple
```

Also assert that the validator does not derive Beat scope from Scene `causalScope`.

**Step 2: Run RED**

```bash
pytest -q tests/current-spine/test_current_authoring_materializer_parity.py tests/current-spine/test_visual_semantic_scope_contract.py
```

Expected: FAIL because the current closure accepts Beats with no `semanticScope`.

**Step 3: Implement the minimal authoring gate**

In `validate_chatgpt_daily_authoring_closure.py`, validate `scene.beats[*].semanticScope` as a required enum for the new Current authoring path. Do not insert a default from Scene scope. Existing historical fixtures may stay on their compatibility path; fresh Current authoring must be explicit.

**Step 4: Run GREEN**

Run the same pytest command. Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/validate_chatgpt_daily_authoring_closure.py tests/current-spine/current_authoring_runtime_fixture.py tests/current-spine/test_current_authoring_materializer_parity.py tests/current-spine/test_visual_semantic_scope_contract.py
git commit -m "test: require authored visual semantic scope"
```

---

## Task 2 — Plot: project `semanticScope` into render_spec 2.5.0 without inference

**Files:**
- Modify: `scripts/materialize_chatgpt_daily_authoring.py`
- Test: `tests/current-spine/test_current_authoring_materializer_parity.py`
- Test: `tests/current-spine/test_current_renderer_compatibility_projection.py`

**Step 1: Write the failing projection assertions**

For every materialized Beat assert:

```python
assert rendered_beat["semanticScope"] == authored_beat["semanticScope"]
assert render_spec["schemaVersion"] == "2.5.0"
```

Add a fixture where Scene `causalScope="multiple"` but one Beat is `lead-stock` and another is `nasdaq`; prove the two authored values survive independently.

**Step 2: Run RED**

```bash
pytest -q tests/current-spine/test_current_authoring_materializer_parity.py tests/current-spine/test_current_renderer_compatibility_projection.py
```

Expected: FAIL because the current materializer emits `2.4.0` and omits Beat scope.

**Step 3: Implement the minimal projection**

In `build_scene()` copy `beat["semanticScope"]` directly into each `visual_beat`. Change only the fresh Current output version to `2.5.0`. Do not infer or normalize scope from node labels, templates, Scene numbers, Scene `causalScope`, or narration text.

**Step 4: Run GREEN**

Run the same pytest command. Expected: PASS for the materializer/projection tests affected by the new version.

**Step 5: Commit**

```bash
git add scripts/materialize_chatgpt_daily_authoring.py tests/current-spine/test_current_authoring_materializer_parity.py tests/current-spine/test_current_renderer_compatibility_projection.py
git commit -m "feat: project beat semantic scope into render spec 2.5"
```

---

## Task 3 — Plot: carry 2.5.0 through strict renderer finalization and Visual Intelligence

**Files:**
- Modify: `scripts/finalize_renderer_package.py`
- Modify: `scripts/renderer_strict_projection.py`
- Modify: `scripts/materialize_renderer_sources.py`
- Modify: `scripts/visual_grammar_contract_closure.py`
- Modify: `scripts/visual_grammar_cross_artifact.py`
- Modify: `scripts/visual_intelligence_renderer_projection.py`
- Modify: `scripts/visual_intelligence_bridge.py`
- Modify: `scripts/visual_intelligence_bridge_staged.py`
- Modify: `scripts/visual_intelligence_pipeline_v12.py`
- Modify: `scripts/build_final_production_package_v12.py`
- Test: `tests/current-spine/test_current_renderer_compatibility_projection.py`
- Test: `tests/current-spine/run_exact_cross_repo_current_e2e.py`

**Step 1: Add failing invariance tests**

Assert that every projection/finalization step accepts fresh `2.5.0`, retains each Beat's `semanticScope` byte-for-value, and rejects an intermediate that drops or rewrites it. Do not broadly replace all historical `2.4.0` assertions: compatibility fixtures stay explicitly 2.4 where they are intended to test legacy behavior.

**Step 2: Run RED**

```bash
pytest -q tests/current-spine/test_current_renderer_compatibility_projection.py
```

Expected: FAIL at the first hard-coded `2.4.0` Current projection gate.

**Step 3: Update only Current/fresh-production gates**

Teach the listed Current projection/finalization scripts to require `2.5.0` for the new production path and preserve `semanticScope`. Where a script is explicitly legacy/compatibility, leave the old version rule intact and make that distinction visible in tests.

**Step 4: Run GREEN**

```bash
pytest -q tests/current-spine/test_current_renderer_compatibility_projection.py
```

Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/finalize_renderer_package.py scripts/renderer_strict_projection.py scripts/materialize_renderer_sources.py scripts/visual_grammar_contract_closure.py scripts/visual_grammar_cross_artifact.py scripts/visual_intelligence_renderer_projection.py scripts/visual_intelligence_bridge.py scripts/visual_intelligence_bridge_staged.py scripts/visual_intelligence_pipeline_v12.py scripts/build_final_production_package_v12.py tests/current-spine/test_current_renderer_compatibility_projection.py
git commit -m "feat: transport render spec 2.5 semantic scope"
```

---

## Task 4 — Renderer: add schema 2.5.0 and protected Beat scope

**Repository:** `saienjoy0/saienjoy0-nasdaq-cafe-remotion`

**Files:**
- Modify: `src/spec/render-spec.ts`
- Modify: `scripts/test-render-spec.ts`
- Modify: `scripts/generate-render-spec-schema.ts` only if generation logic needs a title/version update
- Regenerate: `schemas/render_spec.schema.json`
- Modify: `src/spec/visual-direction-compiler.ts`
- Test: `scripts/test-visual-director.ts`

**Step 1: Write RED schema tests**

Add tests proving:
- `2.5.0` requires `semanticScope` on every Visual Beat;
- allowed values are exactly the four approved scope IDs;
- a `2.4.0` compatibility fixture can still parse without the field;
- Candidate compilation cannot mutate scope.

**Step 2: Run RED**

```bash
npm run test:spec
npm run test:visual-director
```

Expected: FAIL because `2.5.0`/`semanticScope` is unknown.

**Step 3: Implement minimal schema support**

Add one shared `semanticScopeSchema`. Make `semanticScope` required only for `2.5.0` production specs using root `superRefine` if necessary to preserve old fixture parsing. Do **not** add it to `visualMutationKeys`; therefore it remains in Protected Semantic Diff automatically.

Regenerate the JSON Schema:

```bash
npm run episode:spec:schema
```

**Step 4: Run GREEN**

```bash
npm run test:spec
npm run test:visual-director
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/spec/render-spec.ts src/spec/visual-direction-compiler.ts scripts/test-render-spec.ts scripts/test-visual-director.ts schemas/render_spec.schema.json
git commit -m "feat: add protected beat semantic scope"
```

---

## Task 5 — Renderer: propagate scope into Candidate input and remove illegal causal candidates

**Files:**
- Modify: `src/spec/visual-candidate-input.ts`
- Modify: `src/spec/visual-candidate-builder.ts`
- Create: `src/spec/visual-semantic-scope-contract.ts`
- Modify: `src/spec/static-template-soundness.ts` only for template/scope assertions that are independent of Candidate discovery
- Test/Create: `scripts/test-visual-semantic-scope.ts`
- Modify: `scripts/test-visual-director.ts`
- Modify: `package.json` to add `test:visual-semantic-scope` and include it in `test:visual-story`

**Step 1: Write RED candidate tests**

Cases:
1. `lead-stock` + `causal-lane` → legal if graph shape is legal.
2. `nasdaq` + `macro-pressure` → legal if graph shape is legal.
3. `multiple` + `causal-lane` → no candidate.
4. `multiple` + `macro-pressure` → no candidate.
5. `multiple` + a registered separated-lane structure such as `tailwind-headwind` may remain eligible when all existing inventory/grammar rules pass.
6. Candidate Builder never rewrites node/arrow topology to make a candidate legal.

**Step 2: Run RED**

```bash
node --import tsx scripts/test-visual-semantic-scope.ts
npm run test:visual-director
```

Expected: FAIL because scope is not part of Candidate eligibility.

**Step 3: Implement the scope compatibility table**

Keep the rule small and explicit. Initial contract:

```text
single-scope causal templates: lead-stock | sector | nasdaq
multiple: rejected for causal-lane and macro-pressure
```

Do not create a new multi-path Template in PR-A. If no legal candidate remains, use existing `E_VISUAL_CANDIDATE_NONE`/coverage behavior.

**Step 4: Run GREEN**

```bash
npm run test:visual-semantic-scope
npm run test:visual-director
npm run test:visual-story
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/spec/visual-candidate-input.ts src/spec/visual-candidate-builder.ts src/spec/visual-semantic-scope-contract.ts src/spec/static-template-soundness.ts scripts/test-visual-semantic-scope.ts scripts/test-visual-director.ts package.json
git commit -m "feat: reject cross-scope causal visual candidates"
```

---

## Task 6 — Cross-repo handoff version and intake closure

**Plot files:**
- Modify Current renderer binding/compatibility records that explicitly publish `renderSpecVersion`/`rendererContractVersion` for the fresh path.
- Modify tests: `tests/current-spine/test_current_preview_final_request_builders.py`, `tests/current-spine/test_current_preview_request_readiness.py`, `tests/current-spine/run_exact_cross_repo_current_e2e.py`.

**Renderer files:**
- Modify: `scripts/handoff-intake.ts`
- Modify: `scripts/test-handoff-intake.ts`
- Modify any Current Preview/Final workflow input check that hard-codes `2.4.0`; do not change historical A/B technical workflows unless they are promoted to Current.

**Step 1: Write RED handoff tests**

Assert a handoff declares/accepts `2.5.0` and that exact bytes preserve `semanticScope`. A handoff declaring 2.5 while containing a 2.4 spec, or vice versa, must fail closed.

**Step 2: Run RED**

Plot:
```bash
pytest -q tests/current-spine/test_current_preview_final_request_builders.py tests/current-spine/test_current_preview_request_readiness.py
```

Renderer:
```bash
npm run test:handoff-intake
```

**Step 3: Implement coordinated version gates**

Update only the Current fresh-production binding. Preserve compatibility readers where required.

**Step 4: Run GREEN**

Run the same tests, then:

```bash
npm run test:spec
npm run test:visual-story
```

**Step 5: Commit separately in each repo**

Plot commit:
```bash
git commit -am "feat: publish renderer 2.5 semantic scope handoff"
```

Renderer commit:
```bash
git commit -am "feat: accept renderer 2.5 semantic scope handoff"
```

---

## Task 7 — PR-A final verification

**Plot:**
```bash
pytest -q tests/current-spine/test_current_authoring_materializer_parity.py \
  tests/current-spine/test_current_renderer_compatibility_projection.py \
  tests/current-spine/test_current_preview_final_request_builders.py \
  tests/current-spine/test_current_preview_request_readiness.py
```

**Renderer:**
```bash
npm run typecheck
npm run lint
npm run test:spec
npm run test:visual-director
npm run test:visual-story
npm run test:handoff-intake
npm run build
```

**Acceptance:**
- fresh Plot authoring cannot omit Beat `semanticScope`;
- Plot does not infer it from Scene scope;
- all Current projection/handoff stages preserve it;
- Renderer 2.5 requires it and protects it from Visual Director mutation;
- `multiple` cannot become a single-chain causal visual;
- legacy 2.4 compatibility tests still pass intentionally;
- no Preview/Final render is triggered by PR-A itself.
