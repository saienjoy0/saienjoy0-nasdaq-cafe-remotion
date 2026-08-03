# Scheduled preview gate contract

## Purpose

The scheduled gate converts the daily ChatGPT handoff into one verified preview dispatch without allowing GitHub Actions to reinterpret narration, market causality, scene order, visual beats, asset routes, or fallback decisions.

The user supplies these two completed files in ChatGPT:

- `episode_package_YYYY-MM-DD.md`
- `render_spec.json`

ChatGPT validates them, confirms package/spec consistency, creates the readiness manifest, and writes all three files to `main`:

- `episode-packages/YYYY-MM-DD/episode_package_YYYY-MM-DD.md`
- `render-specs/YYYY-MM-DD/render_spec.json`
- `render-specs/YYYY-MM-DD/production_ready.json`

The three files should be published in one tree commit so the scheduler never sees a half-written daily package.

## Required readiness manifest

```json
{
  "version": 1,
  "status": "ready",
  "episodeDate": "YYYY-MM-DD",
  "renderSpecPath": "render-specs/YYYY-MM-DD/render_spec.json",
  "renderSpecSha256": "64 lowercase hexadecimal characters",
  "episodePackagePath": "episode-packages/YYYY-MM-DD/episode_package_YYYY-MM-DD.md",
  "episodePackageSha256": "64 lowercase hexadecimal characters",
  "validatorStatus": "pass",
  "consistencyStatus": "pass",
  "unresolvedStateCount": 0,
  "createdAt": "ISO-8601 timestamp"
}
```

Create it only after the formal render-spec validator and the episode-package/render-spec consistency check have passed:

```bash
npm run episode:spec:ready -- YYYY-MM-DD --consistency-pass
```

The command validates the production render spec again, verifies the episode date, hashes both inputs, and refuses to create the manifest unless the caller explicitly confirms consistency.

## Schedule

The lightweight gate checks the current `Asia/Tokyo` date at:

- 07:17 JST
- 07:37 JST
- 07:57 JST

Minutes `17`, `37`, and `57` avoid the start-of-hour period where GitHub reports increased schedule delay risk.

## Gate behavior

1. Resolve the episode date in `Asia/Tokyo`.
2. If `production_ready.json` does not exist, finish successfully as `not-ready` without Node, Gemini TTS, or Remotion.
3. If the manifest exists, require the exact package/spec paths, both SHA-256 values, validator pass, consistency pass, and zero unresolved states.
4. Require `episode.id` and `episode.targetDate` to match the scheduled date.
5. Restore the latest dispatch marker for the exact date and render-spec SHA.
6. If the previous preview run is queued or in progress, do not dispatch another run.
7. If the previous preview run succeeded, do not dispatch another run.
8. If the previous preview run failed, was cancelled, or cannot be read, dispatch a new preview run.
9. Save the new workflow run ID immediately in a unique cache entry for the next scheduled check.

The gate invokes only `.github/workflows/nasdaq-cafe-preview.yml` with:

- `episode_date`
- `expected_spec_sha256`
- `confirmation=PREVIEW`

It never invokes the final renderer.

## Failure semantics

- Missing readiness manifest: safe no-op.
- Existing but invalid readiness manifest: gate failure; no preview dispatch.
- Hash mismatch: gate failure; no preview dispatch.
- Missing MD or JSON: gate failure; no preview dispatch.
- Active or successful identical preview: safe no-op.
- Failed identical preview: retry at the next scheduled gate.
- Dispatch API failure: gate failure and no success claim.

## Daily ChatGPT procedure

After receiving the MD and JSON from the user, ChatGPT must:

1. preserve the supplied episode meaning and verify it against the project rules;
2. run the formal validator;
3. confirm narration, scene order, visual beats, telops, numbers, asset IDs, display cues, return targets, and the selected image route agree between the MD and JSON;
4. confirm no unresolved image or asset state remains;
5. place the two files at the canonical paths;
6. create `production_ready.json` from the exact bytes being published;
7. publish all three files to `main` in one commit before the last scheduled check;
8. monitor the dispatched preview run and retrieve the verified preview artifact;
9. wait for explicit user approval before any final render.
