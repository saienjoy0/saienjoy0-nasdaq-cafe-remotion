# Visual Reliability Architecture Design

Date: 2026-09-03  
Status: design approved in chat; implementation not started  
Renderer repository: `saienjoy0/saienjoy0-nasdaq-cafe-remotion`  
Related audit: `docs/audits/2026-08-17-current-preview-visual-audit.md`

## 1. Purpose

Convert the 2026-08-17 Current Preview audit into reusable production contracts. This is not an episode-specific beautification pass.

The architecture must prevent four recurrent failure classes:

1. a diagram implies a causal relationship or market scope that the approved narration does not claim;
2. a long Visual Beat completes its meaningful reveal immediately and remains visually stagnant;
3. registered Stage Shells behave like generic text/card boards instead of cognition-matched contradiction, gap, causal, timeline, verification, or evidence surfaces;
4. subtitles or viewer surfaces expose broken wrapping or renderer-internal vocabulary.

Editorial ownership does not change. ChatGPT/Plot owns market causality, Expected/Actual/Gap, evidence, uncertainty, Scene order, narration, Visual Beats, semantic scope, and final visual decisions. GitHub Actions and Remotion remain deterministic executors of a frozen, validated `render_spec.json`.

## 2. Non-goals

This work does not:

- let Renderer infer causality from text, price direction, Scene number, or object inventory;
- let GitHub Actions use AI to redesign a video;
- fetch or execute external Skill code during production rendering;
- replace Visual Director with free-form slide/image generation;
- create date/company-specific React/SVG components when a reusable registered Template can express the meaning;
- rewrite narration, captions, numbers, evidence, sources, confidence, or counterevidence to make a visual fit;
- automatically advance Preview to Final.

## 3. Existing boundaries to preserve

The visual selection backbone remains:

```text
approved semantic render input
→ deterministic Candidate Builder
→ visual_candidate_catalog.json
→ candidateId-only Visual Direction Plan
→ deterministic compiler
→ Protected Semantic Diff
→ visual gates / renderer validator
→ freeze
```

Mandatory boundaries:

- Visual Director selects only `candidateId`.
- Candidate Builder emits only registered legal candidates.
- Compiler mutates only explicitly visual fields.
- Protected Semantic Diff preserves narration, captions, Scene order, numbers, sources, Expected/Actual/Gap, causality, counterevidence, confidence, and the new semantic-scope field.
- Renderer never infers Template or display order.
- Production Actions receive only frozen spec + resolved assets.

## 4. Selected approach

Three approaches were considered:

- **Stage-only polish:** rejected; cannot prevent semantic-scope errors or front-loaded reveal stagnation.
- **Free-form AI visuals per episode:** rejected; conflicts with deterministic ownership and creates one-off surfaces.
- **Contract-first visual reliability layer:** selected.

The selected design adds semantic-scope and rhythm contracts before freeze, then refreshes existing Stage Shells and public-surface validation inside those contracts.

## 5. Target architecture

```text
Editorial / episode_package
        ↓
approved market causality + evidence
        ↓
Visual Beat semanticScope + authored Visual Events
        ↓
Candidate Builder
  ├─ Evidence Capability
  ├─ Semantic Scope compatibility
  ├─ Template static soundness
  └─ Rhythm compatibility
        ↓
Visual Candidate Catalog
        ↓
Visual Director selects candidateId only
        ↓
Compiler
        ↓
Protected Semantic Diff
        ↓
Visual Rhythm Validator
        ↓
Viewer Surface Validator
        ↓
official render_spec validator
        ↓
freeze
────────────────────────────────
GitHub Actions deterministic boundary
        ↓
TTS → compile → Remotion → Preview
        ↓
human visual review
        ↓
Final only on explicit request
```

External visual Skills remain design-time advisers only:

- UX Audit: visible hierarchy, overload, grouping, consistency, legibility;
- Visual Cognition: approved knowledge type → suitable visual form;
- Motion Design: choreography after meaning/form are fixed;
- Remotion Skills: frame-driven implementation guidance.

No Skill becomes a production runtime dependency.

## 6. Contract A — Semantic Scope Guard

### 6.1 Problem

Scene already has `causalScope`, but Visual Beats do not carry enough scope metadata to distinguish lead-stock, sector, and NASDAQ-wide explanations. Existing causal validation checks graph shape, not market scope.

The 2026-08-17 Scene 5 visual therefore could serialize a company-specific explanation and NASDAQ-wide macro drivers even though narration treated them as separate explanations.

### 6.2 New Beat field

Fresh production specs move to schema `2.5.0`. Every Visual Beat carries:

```text
semanticScope:
  lead-stock
  sector
  nasdaq
  multiple
```

This value is authored upstream when the approved episode package fixes the explanation. Visual Director cannot choose it; Renderer cannot infer it.

### 6.3 Protected status

`semanticScope` is a protected semantic field. Candidate compilation cannot modify it.

### 6.4 Candidate eligibility

Initial rules:

- `causal-lane` and `macro-pressure` are single-scope causal structures; they are eligible for `lead-stock`, `sector`, or `nasdaq`, never `multiple`;
- explicitly separated structures such as `tailwind-headwind`, `split-comparison`, and `verification-matrix` may be eligible for `multiple` when existing grammar/inventory rules also pass;
- `multiple` must never be flattened into one causal chain merely because nodes/arrows exist;
- Candidate Builder never invents scope and never rewrites the causal graph.

### 6.5 Capability gaps

If approved content needs multiple independent causal paths and no registered Template can express them without false serial causality, Candidate coverage returns a capability gap. It does not manufacture a candidate.

A new multi-path Template is added only if the gap is demonstrably reusable, not merely because one episode needs it.

### 6.6 Version and cross-repository boundary

`2.5.0` is a coordinated producer/transport/renderer change, not a Renderer-only version bump.

PR-A therefore must define the compatibility handoff for:

- the upstream author/Plot producer that writes `semanticScope`;
- immutable handoff metadata that declares Renderer contract `2.5.0`;
- Current Preview/Final request validation that rejects mismatched producer/renderer contracts;
- Renderer schema/validator support.

Existing `2.2.0`–`2.4.0` fixtures remain accepted only on compatibility/testing paths. Existing 2.4 production artifacts are never silently rewritten.

Current Production remains on its existing contract until fresh qualification completes.

## 7. Contract B — Visual Rhythm Contract

### 7.1 Problem

The current system can require explicit `show` events but still accept a long Beat where every meaningful object appears at the start. `W_VISUAL_STAGNATION` detects repeated presentation signatures after eight seconds, but it is warning-only and Beat-level.

### 7.2 Ownership principle

Renderer never auto-distributes timing. ChatGPT/Plot authors `visualEvents`; the new contract validates them before freeze.

### 7.3 Deterministic inputs only

The validator may use only:

- Beat start/end chunk indices;
- ordered Visual Events (`atChunkId`, `timing`, `offsetMs`, action, target);
- selected object IDs/types;
- selected Template and registered `motionLanguage`;
- resolved production timing where available;
- `sequencePolicy` and `finalHoldMs`.

It must not read narration meaning with an LLM.

### 7.4 Deterministic rhythm rules

Rules are motion-language-specific.

Initial contract:

- **causal-path:** node-before-arrow order remains mandatory; when a Beat contains multiple causal steps and spans multiple narration chunks, meaningful `show`/focus events cannot all occur in the first chunk;
- **timeline-track:** multi-event timelines reveal events in order; when the Beat spans multiple chunks, all timeline events cannot be exhausted in the first chunk;
- **progressive-chart:** when multiple selected data objects are explicitly sequenced across a multi-chunk Beat, at least one meaningful reveal occurs after the first chunk;
- **verification-gates / matrix:** multi-item checks/hypotheses reveal progressively; all items cannot be front-loaded when the Beat spans multiple chunks;
- **gap:** Expected → Actual → Gap ordering remains mandatory;
- **document-reveal:** source evidence may remain static only for the authored evidence Beat; it must not be stretched across later explanatory content by Renderer inference;
- **static:** remains legal when explicitly authored and the selected Template/grammar permits it.

The validator never decides that narration “needs a second act.” If authoring requires a second visual act, it must be represented explicitly as another Beat or later authored events. Machine validation only checks the explicit structure above.

### 7.5 Candidate rhythm compatibility

Candidate Builder must not emit a candidate that cannot satisfy the Beat’s already-authored sequence/rhythm structure. A candidate that would require Renderer to invent timing is ineligible.

### 7.6 Relationship to stagnation diagnostics

`W_VISUAL_STAGNATION` remains a measured Preview diagnostic.

Qualification treats any stagnation warning involving a non-`static` Beat as unresolved until authoring/layout is corrected. Warnings composed only of intentionally `static` Beats remain diagnostics and must be reviewed, not auto-rewritten.

## 8. Contract C — Stage Shell Refresh

### 8.1 Principle

Do not add a new Template merely for polish. Improve registered Stage Shell/Template rendering so each semantic family communicates through an appropriate visual structure.

### 8.2 Priority families

Initial refresh scope:

- `OpenHeroStage` / `opening-contradiction`;
- gap-oriented `ProgressiveChartStage` surfaces;
- `DocumentMediaStage` / source evidence;
- `CausalPathStage`;
- `DualLaneStage`;
- `TimelineStage`;
- `MatrixStage` / `VerificationGateStage`;
- `AssemblyStage` / closing recap.

### 8.3 Cognition-matched behavior

- contradiction: opposing facts are the hero visual; the question is subordinate;
- Expected/Actual/Gap: build in that order; Gap becomes final anchor;
- causal: nodes first, then connections; no cross-scope implication;
- timeline: markers/reaction path progress rather than becoming an immediate completed card;
- verification: hypotheses/checks are progressively classified while counterevidence remains visible;
- source receipt: evidence is a proof surface, not the default visual for unrelated later explanation;
- closing: only viewer-facing synthesis appears; no renderer/stage vocabulary.

### 8.4 Remotion motion rules

- use `useCurrentFrame()` + `interpolate()` / Remotion easing/spring primitives;
- no CSS `transition`, CSS `animation`, or Tailwind animation classes for rendered motion;
- use the minimum motion properties needed to guide attention;
- hero-first choreography;
- avoid simultaneous motion of every object;
- ambient motion is optional and must not compete with market meaning.

### 8.5 New Template gate

A new Template is legal only if all conditions hold:

1. approved semantics cannot be represented faithfully by any registered Template;
2. Candidate coverage records the capability gap;
3. the new form is reusable across future episodes and has no date/company-specific identity;
4. Template contract, registry, eligibility, Stage mapping, validator, fixtures, and docs land together;
5. Protected Semantic Diff remains unchanged.

## 9. Contract D — Subtitle and Viewer Surface Guard

### 9.1 Token-aware subtitles

The current final formatter can split raw character arrays, which can break Latin tokens mid-word.

Replace that final decision with token-aware public wrapping.

Requirements:

- preserve natural Japanese/CJK wrapping;
- avoid splitting Latin words when another legal break exists;
- avoid splitting financial tokens/units such as `-5.12%`, `$123.45`, and `S&P 500`-like groups where a legal neighboring break exists;
- apply a defined basic Japanese line-head/line-end punctuation set;
- remain within the existing two-line public safe area;
- fail layout validation when no legal representation fits rather than overflow silently;
- never modify `speechText`.

### 9.2 Internal/public type boundary

Renderer-internal metadata must never become viewer copy.

Public view-model APIs must not expose internal identifiers as display strings, including:

- Stage Shell IDs;
- transition roles such as `closing`;
- screen-state IDs;
- Template IDs;
- sequence-policy values;
- Beat/Scene technical IDs;
- validator statuses.

Tests should validate the public view-model/data boundary, not merely maintain a denylist of words.

## 10. Protected Semantic Diff

`semanticScope` becomes protected.

Visual Director must not mutate:

- `semanticScope`;
- Scene `causalScope`;
- nodes/arrows themselves;
- narration/captions;
- evidence source IDs;
- Expected/Actual/Gap content;
- counterevidence/confidence.

If a candidate cannot fit these semantics, it is ineligible.

## 11. Failure behavior

Fail closed with exact paths/codes for:

- semantic-scope/template mismatch;
- `multiple` content flattened into an illegal single-chain causal visual;
- explicit rhythm incompatible with selected motion language;
- Candidate requiring invented timing;
- no legal token-aware subtitle fit;
- internal metadata crossing into a public view-model field;
- no legal Candidate / reusable capability gap.

No failure path may select a semantic fallback inside Renderer or Actions.

## 12. Test strategy

Implementation follows TDD.

### 12.1 Semantic scope

Fixtures prove:

- legal lead-stock causal chain;
- legal NASDAQ causal chain;
- `multiple` cannot select `causal-lane` or single-chain `macro-pressure`;
- independent explanations do not become serial arrows;
- compiler preserves `semanticScope` under Protected Semantic Diff;
- intended older-schema compatibility remains intact;
- producer/transport/renderer version mismatch fails closed.

### 12.2 Rhythm

Fixtures prove:

- valid progressive causal reveal;
- invalid all-in-first-chunk causal reveal for a multi-chunk/multi-step Beat;
- valid Expected→Actual→Gap sequence;
- invalid arrow-before-node sequence;
- valid ordered timeline reveal;
- invalid all-in-first-chunk multi-event timeline for a multi-chunk Beat;
- valid progressive verification reveal;
- intentionally `static` Beat remains legal.

### 12.3 Stage Shells

Extend Stage legibility/template tests and representative still rendering. CI verifies structure, hierarchy contracts, routing, and overflow; it does not perform AI aesthetic judgment.

### 12.4 Subtitles

Include:

- `Applied Materials`;
- `NASDAQ`;
- `S&P 500`;
- `-5.12%`;
- Japanese sentence + long English company name;
- punctuation edge cases.

Assert no illegal token break and no public overflow.

### 12.5 Viewer surface

Assert internal metadata cannot flow through the public view-model unless it was explicitly authored as viewer copy; production authoring rules separately prohibit technical metadata as viewer copy.

## 13. Delivery decomposition

### PR-A — Semantic Scope Contract

Renderer side:

- schema 2.5.0 support;
- Beat `semanticScope`;
- Protected Semantic Diff;
- Candidate eligibility;
- static/visual-story validation;
- compatibility docs/fixtures.

Paired producer/transport work:

- upstream author/Plot emits `semanticScope`;
- handoff declares 2.5.0 renderer contract;
- Preview/Final request validation rejects incompatible contract versions.

### PR-B — Visual Rhythm Contract

- deterministic rhythm validator;
- motion-language rules;
- Candidate rhythm compatibility;
- regression fixtures;
- existing stagnation reporting retained.

### PR-C — Stage Shell Refresh

- hierarchy/layout/motion refresh of existing registered Stage families;
- no editorial mutation;
- representative still tests and manual before/after visual audit.

### PR-D — Subtitle / Viewer Surface Guard

- token-aware subtitle wrapper;
- public/internal type boundary;
- subtitle/public-screen regression tests.

### Qualification

After A–D pass CI:

1. use a fresh episode from Collector/Plot, not a repaired 2026-08-17 fixture;
2. run Candidate → compile → validators without manual patch/retry to authoring bytes;
3. generate Preview only;
4. audit representative frames and motion using UX Audit → Visual Cognition → Motion Design;
5. require no semantic/rhythm/public-surface failure and no unresolved image route;
6. require no unresolved `W_VISUAL_STAGNATION` involving non-static Beats;
7. user visually reviews Preview;
8. only then qualify `2.5.0` for Current Production;
9. Final remains explicit-user-request only.

## 14. Success criteria

A fresh episode must demonstrate:

- no visual edge crosses causal scopes unless the approved semantic model explicitly authorizes that relationship;
- Candidate selection cannot erase the distinction between company-direct and NASDAQ-wide explanations;
- multi-chunk explanatory Beats do not front-load all meaningful events when their motion language requires progression;
- no unresolved stagnation warning involves a non-static Beat;
- Expected/Actual/Gap, causal, timeline, verification, and evidence visuals communicate their semantic role without depending on paragraph-like generic boards;
- protected Latin/financial subtitle tokens are not split illegally;
- renderer-internal vocabulary is absent from viewer surfaces;
- Protected Semantic Diff passes;
- official validator passes;
- existing Visual Grammar / Visual Story / handoff / build tests remain green;
- production Actions remain deterministic and do not fetch/execute visual Skills;
- Preview is inspected before Final.

## 15. Explicitly deferred implementation choices

These choices are intentionally deferred to the implementation plan/tests because the design does not need to guess them:

- exact event-count/chunk thresholds for each motion language beyond the structural rules above;
- whether repeated real episodes justify a new dual-independent-causal-path Template;
- exact Stage Shell styling constants;
- the exact initial Japanese kinsoku character set.

Any chosen values must be deterministic, covered by focused tests, and must not move editorial or visual judgment into Renderer/Actions inference.

## 16. Self-review result

- **Placeholder scan:** no TBD/TODO or unresolved ownership decision remains.
- **Consistency:** semanticScope is upstream-owned, protected, and never selected by Visual Director; rhythm is authored upstream and only validated downstream.
- **Scope:** implementation is intentionally decomposed into PR-A through PR-D plus a fresh-episode qualification step rather than one monolithic patch.
- **Ambiguity removed:** validator never infers whether narration needs a second visual act; producer/transport/renderer responsibilities for schema 2.5.0 are explicit.
