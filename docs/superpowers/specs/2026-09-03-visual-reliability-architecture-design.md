# Visual Reliability Architecture Design

Date: 2026-09-03
Status: design approved in chat; implementation not started
Repository: `saienjoy0/saienjoy0-nasdaq-cafe-remotion`
Related audit: `docs/audits/2026-08-17-current-preview-visual-audit.md`

## 1. Purpose

This design converts the 2026-08-17 Current Preview audit into reusable production contracts. The goal is not to beautify one episode. The goal is to prevent four recurrent classes of failure across future episodes:

1. a visual diagram implying a causal relationship or market scope that the approved narration does not claim;
2. Visual Beats completing their reveal in the first fraction of a long narration and then remaining visually stagnant;
3. registered Stage Shells rendering as generic text/card surfaces instead of cognition-matched diagrams, comparisons, timelines, or verification structures;
4. public subtitles or viewer-visible labels exposing broken line wrapping or renderer-internal vocabulary.

The existing editorial ownership remains unchanged: ChatGPT/Plot owns market causality, Expected/Actual/Gap, evidence, uncertainty, Scene order, narration, Visual Beats, and final visual decisions. GitHub Actions and Remotion remain deterministic executors of a validated, frozen `render_spec.json`.

## 2. Non-goals

This work does not:

- let Remotion infer market causality from text, price direction, Scene number, or object inventory;
- let GitHub Actions use AI to redesign a video;
- fetch or execute external Skill code during production rendering;
- replace the Visual Director with a free-form image or slide generator;
- create episode-specific arbitrary SVG/React components when a registered reusable Template can express the same meaning;
- rewrite narration, captions, evidence, numbers, sources, confidence, or counterevidence to make a visual fit;
- automatically proceed from Preview to Final.

## 3. Existing architecture to preserve

The current visual selection path remains the backbone:

```text
approved semantic render input
→ deterministic Candidate Builder
→ visual_candidate_catalog.json
→ candidateId-only Visual Direction Plan
→ deterministic compiler
→ Protected Semantic Diff
→ existing visual gates / renderer validator
→ freeze
```

The following boundaries remain mandatory:

- Visual Director selects only `candidateId`.
- Candidate Builder only emits registered legal candidates.
- Compiler may mutate only visual fields already designated as mutable.
- Protected Semantic Diff must preserve narration, captions, Scene order, numbers, sources, Expected/Actual/Gap, causality, counterevidence, and confidence.
- Renderer does not infer Template or display order.
- Production Actions receive only the frozen validated spec and resolved assets.

## 4. Design choice

Three approaches were considered:

### A. Stage-only visual polish

Improve CSS, typography, and component presentation only.

Rejected because it cannot prevent the Scene 5 scope error or long post-reveal stagnation.

### B. Free-form AI visual generation per episode

Allow a slide/data-visualization agent to generate diagrams or layouts directly.

Rejected because it conflicts with deterministic Candidate ownership, risks changing editorial meaning, and creates one-off runtime surfaces.

### C. Contract-first visual reliability layer — selected

Add explicit semantic-scope and rhythm contracts before freeze, then refresh existing Stage Shells and public-surface validation within those contracts.

This approach preserves the current ownership model and makes the fixes reusable.

## 5. Architecture overview

```text
Editorial / episode_package
        ↓
approved market causality + evidence
        ↓
Visual Beat semantic scope + authored Visual Events
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

External visual Skills are design-time advisers only:

- UX Audit: identify visible hierarchy, overload, grouping, consistency, and legibility defects;
- Visual Cognition: map approved content type to a suitable visual form;
- Motion Design: specify reveal/choreography principles after meaning and visual form are fixed;
- Remotion Skills: implement frame-driven markup and rendering correctly.

No Skill becomes a production runtime dependency.

## 6. Contract A — Semantic Scope Guard

### 6.1 Problem

The current Scene schema has `causalScope`, but Visual Beats and individual causal objects do not carry enough scope metadata to distinguish company-direct, sector, and NASDAQ-wide explanations. Current causal validation checks graph shape but not semantic market scope.

That allowed the 2026-08-17 Scene 5 visual to imply a serial path between a company-specific expectation explanation and NASDAQ-wide macro drivers even though the narration treated them as separate explanations.

### 6.2 New Beat-owned semantic field

Fresh production specs move to `render_spec` schema `2.5.0` and every Visual Beat carries:

```text
semanticScope:
  lead-stock
  sector
  nasdaq
  multiple
```

`semanticScope` is authored upstream when the approved episode package fixes the market explanation. It is not chosen by Visual Director and is not inferred by Renderer.

### 6.3 Protected semantic status

`semanticScope` is added to the protected semantic inventory. Candidate compilation must not change it.

### 6.4 Candidate eligibility

Candidate Builder rejects Templates whose semantic topology cannot safely express the Beat scope.

Initial rules:

- `causal-lane` and `macro-pressure`: single-scope causal explanation only; allowed for `lead-stock`, `sector`, or `nasdaq`, not `multiple`;
- `tailwind-headwind`, `split-comparison`, `verification-matrix`, and other explicitly separated-lane structures may be eligible for `multiple` when their existing object inventory and grammar allow it;
- `multiple` must not be flattened into a single causal chain merely because nodes/arrows are available;
- Candidate Builder never invents a new scope or rewrites the causal graph.

### 6.5 Capability gap behavior

If the approved content requires two independent causal paths in the same Beat and no registered Template can express them without false serial causality, Candidate coverage reports a capability gap instead of manufacturing a candidate.

Only after that gap is shown to recur beyond a one-off episode should a reusable multi-path Template be added.

### 6.6 Backward compatibility

- Existing `2.2.0`–`2.4.0` fixtures remain accepted for compatibility/testing paths.
- New daily production authoring targets `2.5.0` only after qualification.
- No existing 2.4 production artifact is silently rewritten.

## 7. Contract B — Visual Rhythm Contract

### 7.1 Problem

The current system validates that explicit sequences have show events, but does not reject a Beat where all objects appear immediately and the screen remains unchanged for most of the narration.

The current `W_VISUAL_STAGNATION` mechanism detects repeated presentation signatures after eight seconds but remains warning-only and measures Beat-level appearance, not semantic progression inside a long Beat.

### 7.2 Principle

Renderer must never auto-distribute timing. Timing remains authored in `visualEvents`.

The new contract validates that authored timing is compatible with the selected motion language and narration span before freeze.

### 7.3 Rhythm validation inputs

The validator may use only deterministic existing data:

- Beat start/end narration chunks;
- ordered Visual Events (`atChunkId`, timing, offset);
- selected objects and object types;
- selected Template and its registered `motionLanguage`;
- Beat duration as resolved by the production timing data where available;
- final hold.

It must not analyze narration semantics with an LLM.

### 7.4 Initial deterministic rules

Rules are motion-language-specific rather than one universal timer.

Examples:

- `causal-path`: causal nodes/arrows must progress in valid node-before-arrow order; a multi-step causal Beat must not reveal every meaningful step at the same instant;
- `timeline-track`: multi-event timelines must have ordered reveals; a long second act with no visual progression must be represented by another Beat/visual state rather than an inert completed timeline;
- `progressive-chart`: chart/data progression must have at least one meaningful later reveal when the Beat contains multiple semantic steps;
- `verification-gates` / matrix forms: hypotheses/checks reveal progressively rather than all appearing at Beat start;
- `document-reveal`: evidence receipt is a bounded evidence anchor, not a default full-narration background for an unrelated explanatory span;
- `gap` Templates: Expected → Actual → Gap ordering is preserved;
- `static` remains legal only for genuinely static Beats whose selected Template/grammar supports it.

Exact thresholds belong in the implementation plan and tests, but the design rule is fail-closed on structurally invalid choreography, not on arbitrary aesthetic preferences.

### 7.5 Relationship with stagnation warning

`W_VISUAL_STAGNATION` remains useful as a measured Preview/reporting signal. It is not removed.

The new pre-freeze rhythm validator prevents clearly invalid authored choreography. The measured stagnation report remains a post-timing diagnostic used during Preview qualification and visual audit.

## 8. Contract C — Stage Shell Refresh

### 8.1 Principle

Do not create a new Template merely to make a screen prettier. Improve the registered Stage Shell/Template rendering so each existing semantic family communicates through an appropriate visual structure.

### 8.2 Priority Stage families

Initial refresh targets the families implicated by the audit:

- `OpenHeroStage` / `opening-contradiction`;
- `ProgressiveChartStage` and gap-oriented surfaces;
- `DocumentMediaStage` / source evidence;
- `CausalPathStage`;
- `DualLaneStage`;
- `TimelineStage`;
- `MatrixStage` / `VerificationGateStage`;
- `AssemblyStage` / closing recap.

### 8.3 Cognition-matched behavior

Examples of intended rendering behavior:

- contradiction: two opposing facts become the hero visual, with the unresolved question visually subordinate;
- Expected/Actual/Gap: build in that order, with Gap becoming the final visual anchor;
- causal: nodes first, then connections, with no cross-scope implication;
- timeline: time markers and reaction path progress in stages rather than becoming a static card immediately;
- verification: competing hypotheses/checks are progressively reduced or classified, preserving counterevidence;
- source receipt: source/evidence is visible briefly as proof and then returns to the explanatory visual state when the narration continues;
- closing: only viewer-facing synthesis is shown; internal transition/stage vocabulary never appears.

### 8.4 Motion implementation rules

Remotion implementation remains frame-driven:

- `useCurrentFrame()` and `interpolate()` / Remotion easing/spring primitives;
- no CSS `transition`, CSS `animation`, or Tailwind animation classes for rendered motion;
- minimum motion properties necessary to guide attention;
- hero-first choreography;
- avoid simultaneous movement of every object;
- ambient motion is optional and must not compete with financial meaning.

### 8.5 New Template policy

A new reusable Template is allowed only when all are true:

1. approved semantic content cannot be represented faithfully by any registered Template;
2. the limitation is documented as a capability gap;
3. the new visual form is reusable across future episodes, not named for a date/company;
4. Template contract, registry, eligibility, Stage Shell mapping, validator, fixtures, and docs are added together;
5. protected semantics remain unchanged.

## 9. Contract D — Subtitle and Viewer Surface Guard

### 9.1 Subtitle wrapping

The current subtitle formatter may hard-split character arrays and therefore split Latin tokens mid-word.

Replace the final wrap decision with token-aware public subtitle wrapping.

The wrapper must:

- preserve Japanese/CJK natural wrapping;
- avoid splitting Latin words when a legal neighboring break exists;
- avoid splitting common financial numeric tokens and units where possible (`-5.12%`, `$123.45`, `S&P 500`-like tokens);
- apply basic Japanese line-head/line-end punctuation constraints;
- remain within the existing two-line public safe area;
- fail layout validation when no legal representation fits instead of silently overflowing.

`speechText` remains unchanged and remains the TTS surface.

### 9.2 Internal vocabulary boundary

Renderer/internal metadata must never become viewer copy.

The implementation must establish a typed boundary between internal identifiers and public strings so fields such as the following are never rendered by accident:

- Stage Shell IDs;
- transition roles such as `closing`;
- screen state IDs;
- Template IDs;
- sequence-policy values;
- Beat/Scene technical IDs;
- validator status text.

Tests should render/inspect the relevant public view-model inputs rather than relying only on a string denylist.

## 10. Protected Semantic Diff changes

`semanticScope` becomes protected.

Visual Director may continue mutating only its current visual mutation set unless an implementation sub-design explicitly proves another visual-only field belongs there.

In particular, Visual Director must not mutate:

- `semanticScope`;
- Scene `causalScope`;
- nodes/arrows themselves;
- narration or captions;
- evidence source IDs;
- Expected/Actual/Gap content;
- counterevidence or confidence.

If a candidate cannot fit those semantics, it is ineligible.

## 11. Failure behavior

Fail closed with exact paths/codes for contract violations.

Target failure classes:

- semantic-scope/template mismatch;
- multi-scope content flattened into illegal single-chain causal visual;
- explicit rhythm missing required progression for a selected motion language;
- selected candidate cannot satisfy rhythm compatibility;
- subtitle has no legal token-aware fit within public bounds;
- internal metadata reaches a public view-model field;
- capability gap with no legal candidate.

No failure path may invoke a fallback that changes market meaning or invents a new Template choice inside Renderer/Actions.

## 12. Test strategy

Implementation follows TDD.

### 12.1 Semantic scope tests

Add fixtures that prove:

- lead-stock causal chain is legal;
- NASDAQ causal chain is legal;
- `multiple` cannot select `causal-lane`/single-chain macro pressure;
- two independent explanations do not become serial arrows;
- compiler preserves scope under Protected Semantic Diff;
- older schema fixtures remain compatible where intended.

### 12.2 Rhythm tests

Add deterministic fixtures for:

- valid progressive causal reveal;
- invalid all-at-once causal reveal;
- valid Expected→Actual→Gap sequence;
- invalid arrow-before-node sequence;
- valid timeline progression;
- invalid long completed-timeline state where the content actually requires a second visual act;
- static Beat that remains intentionally legal.

### 12.3 Stage tests

Extend existing Stage legibility/template tests and representative still rendering. The test should verify hierarchy/structure and public-data routing without attempting an AI aesthetic judgment in CI.

### 12.4 Subtitle tests

Include mixed Japanese/English/financial strings such as:

- `Applied Materials`;
- `NASDAQ`;
- `S&P 500`;
- `-5.12%`;
- Japanese sentence + long English company name;
- punctuation edge cases.

Assert no illegal token break and no overflow.

### 12.5 Viewer surface tests

Assert technical values such as `closing`, Template IDs, screenState IDs, and sequence-policy IDs cannot appear through public view-model fields unless they are explicitly authored viewer text (which production authoring rules already disallow).

## 13. Delivery decomposition

Implementation is deliberately split into independent PR-sized stages.

### PR-A — Semantic Scope Contract

- schema 2.5.0 support;
- Beat `semanticScope`;
- protected semantic inventory;
- Candidate eligibility;
- static/visual-story validation;
- compatibility docs and fixtures.

### PR-B — Visual Rhythm Contract

- rhythm validator;
- motion-language rules;
- Candidate rhythm compatibility;
- regression fixtures;
- stagnation reporting retained.

### PR-C — Stage Shell Refresh

- visual hierarchy/layout/motion refresh of existing registered Stage families;
- no editorial mutation;
- representative still tests and visual regression review.

### PR-D — Subtitle / Viewer Surface Guard

- token-aware subtitle wrapper;
- public/internal type boundary;
- subtitle and public-screen regression tests.

### Qualification

After A–D pass repository CI:

1. produce a fresh episode from Collector/Plot rather than repairing the 2026-08-17 fixture;
2. complete Candidate → compile → validators with no manual patch/retry to authoring bytes;
3. generate Preview only;
4. audit representative frames and motion using the same UX Audit / Visual Cognition / Motion Design workflow;
5. require no unresolved image route and no semantic/rhythm/public-surface contract failure;
6. user visually reviews Preview;
7. only then qualify 2.5.0 for Current Production;
8. Final remains explicit-user-request only.

## 14. Success criteria

The architecture is considered qualified only when a fresh episode demonstrates all of the following:

- no visual edge connects different causal scopes unless the approved semantic model explicitly says it should;
- no Candidate selection can erase the distinction between company-direct and NASDAQ-wide explanations;
- Visual Events progress with the narration rather than front-loading the entire explanatory structure;
- measured Preview stagnation is materially reduced without decorative motion for its own sake;
- Expected/Actual/Gap, causal, timeline, verification, and source evidence visuals communicate their semantic role without relying on paragraph-like cards;
- subtitles do not split protected Latin/financial tokens incorrectly;
- internal renderer vocabulary is absent from viewer surfaces;
- Protected Semantic Diff passes;
- official validator passes;
- existing Visual Grammar / Visual Story / handoff / build tests remain green;
- production Actions remain deterministic and do not fetch or execute design Skills;
- Preview is inspected before any Final request.

## 15. Explicitly deferred decisions

The following are intentionally deferred to implementation planning/testing rather than guessed in this design:

- exact numeric minimum spacing between meaningful visual events per motion language;
- whether a reusable dual-independent-causal-path Template is necessary;
- exact Stage Shell visual styling values;
- exact list of Japanese kinsoku characters beyond the initial safe subset.

These may be selected during implementation only if they satisfy the contracts above and are backed by focused tests. They must not weaken semantic ownership or move visual judgment into Actions/Renderer inference.
