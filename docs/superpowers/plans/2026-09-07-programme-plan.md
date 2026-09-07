# NASDAQ Cafe programme remediation plan

**Goal:** Correct observed presentation defects and strengthen evidence-led programme design.
**Architecture:** Upstream editorial decisions; immutable renderer input; separate compatible fixes from coordinated scene-contract migration.
**Tech Stack:** Python, JSON Schema, TypeScript, React, Remotion.
**Spec:** docs/superpowers/specs/2026-09-07-programme-design.md

## Global Constraints

Preserve narration wording, TTS identity and historical production bundles. Do not infer causal edges or change editorial content in Renderer. No automatic final render, merge or publication. Do not claim variable scene production without end-to-end support.

### Task 1: Token-safe subtitles

Modify src/spec/subtitle-cues.ts and scripts/test-subtitles.ts. Replace character-only pagination and line breaking with token-aware wrapping. ASCII words and numeric expressions such as 102.5, -5.12%, $9.12B must remain intact when they fit within 22 characters. Preserve all normalized text, at most two 22-character lines per cue, positive contiguous cue timing ending exactly at endMs. Oversized tokens may be split to remain bounded. Cover Japanese text adjacent to Applied Materials, numeric comma/decimal expressions and boundary cases in regression tests. Keep narration/TTS unchanged. Run npm ci, npm run test:subtitles, npm run typecheck. Report exact files, tests and limitations. Commit only task files on fix/programme-audit.

### Task 2: Editorial and causal production guard

Inspect Plot causal inventory/projection and current story review entrypoints. Enforce explicit causal edge semantics rather than adjacency, add regression cases for independent company and macro branches. Strengthen existing research/story/visual/critic skills with structural East Asia screening, question payoff, media choice and evidence-based review. Bind canon changes correctly. Preserve daily artifacts and freezes.

### Task 3: Scene migration and integration

Inventory hard-coded nine-scene constraints and define a coordinated migration, implementing compatible production fixes first. Run repository required gates, independent diff review, commit and create reviewable PRs. Explicitly mark any end-to-end migration that cannot yet pass as incomplete rather than relax legacy gates.
