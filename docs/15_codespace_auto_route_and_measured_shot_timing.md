# Codespace auto route and measured Shot timing contract

## Purpose

This change closes two gaps found in the first Visual Story Engine v3 preview:

1. ChatGPT could write the completed production inputs but could not trigger the Codespace Motion Preview through the repository alone.
2. The static render-spec validator counted Shots but did not know their real duration after Gemini TTS, so a formally valid episode could still hold one composition for 12–18 seconds.

The change does not move editorial judgment into GitHub Actions, Codex, Remotion, or the validator. ChatGPT still completes the market causality, narration, Scene order, Visual Beats, Shot plan, adopted asset route, and immutable render spec before any request is committed.

## Codespace runner lifecycle

The Actions runner still requires a one-time repository registration. After `.runner` exists in the persistent Codespace home directory:

- `.devcontainer/post-start.sh` runs on every Codespace start or resume.
- `scripts/codespace-actions-runner.sh ensure` starts the existing registration idempotently.
- A stale PID file is discarded before launch.
- Failure to complete the one-time registration does not make the Codespace unusable; it prints the existing manual-token instructions.

## Repository-backed Motion Preview request

ChatGPT can create one immutable JSON file under `motion-preview-requests/` after the production package is complete.

The push gateway:

1. requires exactly one changed request JSON;
2. rejects unknown or missing fields;
3. verifies the date, Scene number, time range, confirmation token, and SHA-256;
4. hashes `render-specs/YYYY-MM-DD/render_spec.json` from the same commit;
5. dispatches the existing cache-only Motion Preview workflow;
6. leaves the actual render on the self-hosted runner labeled `nasdaq-cafe-codespace`.

The gateway never calls Gemini TTS and never advances to final rendering.

## Measured Shot timing

The static validator continues to check IDs, semantic targets, order, families, continuity, expressions, and Shot count. After the two TTS blocks are resolved, `compileRenderSpec` now runs a production timing validator using the same semantic cue resolution as the renderer.

Default production limits:

- one resolved Shot: at most 10,000 ms;
- completed `hold-outcome` outside Scene 9: at most 8,000 ms;
- uncovered gap between adjacent Shots: at most 500 ms;
- cue-induced overlap between adjacent Shots: at most 250 ms;
- a long v3 Visual Beat cannot silently omit its Shot plan.

A violation stops compilation before Remotion renders a preview. This ensures that a nominal 39-Shot input cannot pass merely because the total count is within range while Scene 5–7 still hold one composition for too long.

## Final-render boundary

This change only automates the short Motion Preview path. Preview review remains a user task, and final rendering remains manual-only after explicit user approval.
