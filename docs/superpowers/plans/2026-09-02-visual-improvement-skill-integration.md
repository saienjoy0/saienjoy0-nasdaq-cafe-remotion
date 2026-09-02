# Visual Improvement Skill Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate pinned existing visual Agent Skills into the NASDAQ Cafe repository without transferring editorial ownership away from the existing Visual Director, then make the current preview auditable and future visual changes regression-safe.

**Architecture:** Auto-discover diagnosis/motion/Remotion skills under `.agents/skills`, keep `visual-cognition-slides` reference-only under `third_party/agent-skills`, and route all recommendations through the existing Candidate Catalog and Protected Semantic Diff. Skill sync is development-time only; production GitHub Actions never fetch or invoke external skills.

**Tech Stack:** Node.js 20+, TypeScript/tsx, Git, Remotion 4.0.487, existing Visual Director/Visual Story validators, Agent Skills format.

**Spec:** `docs/superpowers/specs/2026-09-02-visual-improvement-skill-architecture-design.md`

## Global Constraints

- `render_spec.json` remains the only renderer-side daily editorial source of truth.
- External skills may not change narration, captions, scene order, numbers, sources, Expected / Actual / Gap, causal claims, counter-evidence, confidence, or Primary / Approved Fallback.
- `visual-cognition-slides` must not be auto-discoverable.
- Skill sources are pinned to exact 40-hex commits in `config/agent-skills.lock.json`.
- Runtime production and GitHub Actions must not fetch skill repositories.
- Remotion implementation must remain frame-driven; no CSS animation/transition for production motion.
- New visual templates are created only after an evidenced `CAPABILITY_GAP`; do not pre-build speculative templates.

---

### Task 1: Lock external Skill sources and enforce placement

**Files:**
- Create: `config/agent-skills.lock.json`
- Create: `scripts/test-agent-skills-contract.ts`
- Test: `scripts/test-agent-skills-contract.ts`

**Interfaces:**
- Consumes: upstream repository name, pinned commit, source path, destination, activation mode, license metadata.
- Produces: stable lock schema `1.0.0` used by the sync utility and routing contract.

- [ ] **Step 1: Write the failing placement contract test**

Require exactly these IDs:

```ts
const requiredIds = [
  "ux-audit",
  "visual-cognition-slides",
  "motion-design",
  "remotion-official",
] as const;
```

Assert:

```ts
if (cognition.activation !== "reference-only") throw new Error("...");
if (!cognition.destination.startsWith("third_party/agent-skills/")) throw new Error("...");
```

and require every upstream commit to match `/^[0-9a-f]{40}$/`.

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --import tsx scripts/test-agent-skills-contract.ts
```

Expected before implementation: FAIL because `config/agent-skills.lock.json`, sync script, or routing doc is missing.

- [ ] **Step 3: Add the minimal lock file**

Pin:

```text
EliaAlberti/ux-audit-skill@76eb1ab73560c90275823395fda52c3ca4ea8b2b
edu-ai-builders/visual-cognition-slides@83fc4b55f409b6564c9c1b8aee93d3015af2da9c
LottieFiles/motion-design-skill@f9a8a041b85185ee4881b3471d3415e939aac772
remotion-dev/skills@54e9b19a612897171e0b3b242e01c2badba4a272
```

- [ ] **Step 4: Re-run the contract test after Tasks 2 and 3 provide its remaining dependencies**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/agent-skills.lock.json scripts/test-agent-skills-contract.ts
git commit -m "feat: pin visual agent skill sources"
```

### Task 2: Materialize pinned Skills without production-time fetching

**Files:**
- Create: `scripts/sync-agent-skills.mjs`
- Generated locally: `.agents/skills/**`
- Generated locally: `third_party/agent-skills/visual-cognition-slides/**`

**Interfaces:**
- Consumes: `config/agent-skills.lock.json`.
- Produces: exact pinned skill trees plus `.upstream.json` / `.managed-*.json` receipts.

- [ ] **Step 1: Add a failing check case**

Before sync, run:

```bash
node scripts/sync-agent-skills.mjs --check
```

Expected: FAIL with `E_AGENT_SKILLS_SYNC: skills not synchronized`.

- [ ] **Step 2: Implement pinned checkout**

For each skill:

```text
git init
→ git remote add origin https://github.com/<repo>.git
→ git fetch --depth 1 origin <40-hex-sha>
→ git checkout --detach FETCH_HEAD
→ copy only configured sourcePath
```

Never use a floating branch or tag as the installed source.

- [ ] **Step 3: Preserve activation boundaries**

Directory outputs must be:

```text
.agents/skills/ux-audit/
.agents/skills/motion-design/
.agents/skills/remotion-*/
third_party/agent-skills/visual-cognition-slides/
```

The visual cognition tree must never be copied below `.agents/skills`.

- [ ] **Step 4: Run sync**

```bash
node scripts/sync-agent-skills.mjs
```

Expected: four `synced <id>` lines and final `agent skills sync: PASS`.

- [ ] **Step 5: Verify offline placement**

```bash
node scripts/sync-agent-skills.mjs --check
```

Expected: `agent skills sync check: PASS` without network access.

- [ ] **Step 6: Commit source-management files**

Do not commit temporary clone directories. Decide explicitly whether materialized third-party skill trees are vendored in Git or restored by developer bootstrap; whichever policy is selected, record it in `AGENTS.md` and keep production runtime independent of it.

### Task 3: Wire the Skill router into project instructions

**Files:**
- Create: `docs/17_visual_skill_routing.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: imported skill guidance and existing Visual Director ownership contract.
- Produces: one deterministic routing order for future agents.

- [ ] **Step 1: Add routing contract requirements to the test**

Require these phrases in `docs/17_visual_skill_routing.md`:

```text
Protected Semantic Diff
visual-cognition-slides
ux-audit
motion-design
remotion-official
Visual Director
fresh episode
```

- [ ] **Step 2: Document the routing order**

Canonical order:

```text
approved semantics
→ preview/stills
→ ux-audit
→ explicit visual-cognition reference
→ Candidate Catalog lookup
→ motion-design
→ Protected Semantic Diff
→ Remotion implementation
→ before/after QA
→ fresh episode regression
```

- [ ] **Step 3: Add project-specific overrides**

Explicitly state:

```text
Visual Cognition: recommendation only, no HTML/video generation.
Motion Design: ambient layer optional; semantic reveal order wins.
Remotion: use project package version, not newer API assumptions.
UX Audit: static frames cannot prove motion/timing issues.
```

- [ ] **Step 4: Link from root AGENTS.md**

Add `docs/17_visual_skill_routing.md` to the priority list and add a visual-improvement section telling agents when to run the sync and when to load each skill.

- [ ] **Step 5: Run contract test**

```bash
node --import tsx scripts/test-agent-skills-contract.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md docs/17_visual_skill_routing.md
git commit -m "docs: route visual improvement skills"
```

### Task 4: Add convenient development commands without touching production execution

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: developer-only commands; no production workflow behavior change.

- [ ] **Step 1: Add scripts**

Add exactly:

```json
"agent-skills:sync": "node scripts/sync-agent-skills.mjs",
"agent-skills:check": "node scripts/sync-agent-skills.mjs --check",
"test:agent-skills": "node --import tsx scripts/test-agent-skills-contract.ts"
```

- [ ] **Step 2: Run contract test**

```bash
npm run test:agent-skills
```

Expected: PASS.

- [ ] **Step 3: Run install check after sync**

```bash
npm run agent-skills:check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: expose visual skill maintenance commands"
```

### Task 5: Perform the first evidence-bound audit of the current video

**Files:**
- Use existing: `scripts/render-visual-beat-stills.ts`
- Create per-review artifact outside production truth: `visual-reviews/<review-id>/audit.md`
- Optional generated review assets: `visual-reviews/<review-id>/assets/*.png`

**Interfaces:**
- Consumes: current approved render spec and representative stills.
- Produces: evidence-bound findings only; no direct production mutation.

- [ ] **Step 1: Render representative Beat stills**

Use the existing command for the target approved spec:

```bash
npm run episode:spec:beat-stills -- <approved-render-spec>
```

- [ ] **Step 2: Run ux-audit principles over the still journey**

The fixed viewer goal is:

```text
短時間で主役ニュース、矛盾、市場因果、反対材料、NASDAQへの経路を誤解なく追えること。
```

Every finding must name visible evidence and a Scene/Beat/still.

- [ ] **Step 3: Separate static and motion findings**

Static evidence may establish hierarchy, overload, grouping, readability and pattern drift. Motion/timing claims require preview-video evidence and must not be inferred from stills.

- [ ] **Step 4: Rank findings**

Prioritize 5-10 evidenced issues; do not generate a padded list.

- [ ] **Step 5: Do not edit production yet**

The audit output feeds Task 6. It does not directly alter `render_spec.json` or templates.

### Task 6: Translate audit findings into existing Candidates before adding code

**Files:**
- Read: `third_party/agent-skills/visual-cognition-slides/SKILL.md`
- Read as needed: `PEDAGOGY.md`, `ANIMATIONS.md`
- Read: existing Visual Director Candidate Catalog / component registry code
- Create review artifact: `visual-reviews/<review-id>/improvement-plan.md`

**Interfaces:**
- Consumes: audit finding + already-approved semantic meaning.
- Produces: `EXISTING_CANDIDATE`, `CONFIG_OR_MOTION_FIX`, or `CAPABILITY_GAP` per finding.

- [ ] **Step 1: Classify the cognitive action**

Use categories such as:

```text
gap
comparison
data scale
causal relation
timeline
verification
analogy
entity/source evidence
```

- [ ] **Step 2: Look up a legal existing Candidate**

Map through Evidence Capability and Candidate Catalog. Do not free-write template IDs into production.

- [ ] **Step 3: Mark capability gaps explicitly**

If no registered reusable representation fits, output:

```text
CAPABILITY_GAP
```

with the missing reusable visual capability. Do not generate a one-off daily SVG/React component.

- [ ] **Step 4: Review semantic safety**

Any recommendation that changes meaning, numbers, evidence or causal strength must return to the editorial layer rather than Visual implementation.

### Task 7: Apply motion guidance and Remotion implementation only to approved fixes

**Files:**
- Modify only the relevant visual component/contract/test files identified by the audited finding.
- Test nearby visual contract files.

**Interfaces:**
- Consumes: approved representation/candidate and existing semantic reveal order.
- Produces: deterministic frame-driven visuals.

- [ ] **Step 1: Load motion-design for motion-affecting findings**

Record the motion purpose as one of:

```text
guidance
emphasis
transition
continuity
```

- [ ] **Step 2: Preserve semantic reveal order**

Examples:

```text
Expected → Actual → Gap
cause node → effect node → connecting arrow
reported event → verified market reaction
```

- [ ] **Step 3: Load Remotion official guidance before writing React markup**

Use `useCurrentFrame()`, `interpolate()`, `spring()` and `Easing` compatible with the repository's installed Remotion `4.0.487`.

- [ ] **Step 4: Write the failing code-level test for each audited fix**

The test must fail because the visual-system behavior is missing, not because of fixture trivia.

- [ ] **Step 5: Implement the minimal reusable fix**

Avoid news-name, date, Scene-copy or one-fixture branching.

- [ ] **Step 6: Run nearby tests then the visual suite**

```bash
npm run typecheck
npm run lint
npm run test:visual-sequence
npm run test:visual-variety
npm run test:visual-templates
npm run test:visual-story
npm run test:public-screen
npm run build
```

### Task 8: Before/after and fresh-episode qualification

**Files:**
- Review output only; do not create a new production source of truth.

**Interfaces:**
- Consumes: changed visual system, original target episode, separate fresh episode.
- Produces: qualification evidence for human review.

- [ ] **Step 1: Render the same target Beat before and after**

Confirm the original finding is resolved and no new visible issue appears.

- [ ] **Step 2: Re-apply the relevant ux-audit checks**

Check hierarchy, overload, grouping, consistency, recall load and readability as applicable.

- [ ] **Step 3: Run a different fresh episode through the affected Template/Capability**

No retries or fixture-specific patches are allowed for qualification.

- [ ] **Step 4: Run Production Reliability checks where available**

Use the project Reliability Skill for cascade/loop/runtime failure concerns. Do not duplicate those responsibilities inside the visual skills.

- [ ] **Step 5: Generate preview only**

Do not proceed automatically to final.

- [ ] **Step 6: Human visual review**

User reviews the preview. Final render remains an explicit separate request.

## Plan self-review

- Spec coverage: skill source pinning, activation isolation, semantic protection, visual translation, motion, Remotion implementation, audit and fresh-episode regression are all covered.
- Placeholder scan: no TBD/TODO/"implement later" placeholders.
- Type consistency: lock schema fields match `scripts/test-agent-skills-contract.ts` and `scripts/sync-agent-skills.mjs`.
- Scope: no speculative new Template is included; a new Template gets its own audited implementation plan only after `CAPABILITY_GAP` is observed.
