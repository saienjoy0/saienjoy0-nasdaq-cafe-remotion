# Motion Preview request queue

This directory is the repository-backed request path used when ChatGPT needs the registered Codespace runner to render a short Motion Preview.

Create exactly one new JSON file per request. A push to `main` is the immediate trigger. A five-minute schedule is the fallback for commits whose actor or token does not create a push workflow run. Both triggers use the same serialized queue and call `.github/workflows/nasdaq-cafe-motion-preview.yml` through `workflow_call`; they do not use the workflow-dispatch REST API.

```json
{
  "requestVersion": "1.0",
  "episodeDate": "2026-07-31",
  "expectedSpecSha256": "64-character lowercase SHA-256",
  "sceneNumber": 6,
  "offsetSeconds": 0,
  "durationSeconds": 20,
  "confirmation": "MOTION"
}
```

One-time repository setup:

- Add an Actions repository secret named `CODESPACE_LIFECYCLE_TOKEN`.
- A classic personal access token needs the `codespace` scope. A fine-grained token needs permission to list the user's Codespaces and `Codespaces lifecycle admin: write` for this repository.
- Never put the token in a request JSON, commit, issue, log, or chat message.
- Register the self-hosted runner once inside the Codespace. The runner is stored under `/workspaces/.nasdaq-cafe-actions-runner`, and `.devcontainer/post-start.sh` starts it whenever the Codespace starts or resumes.

Queue behavior:

- Request files are append-only. Do not edit, rename, or delete an old request to trigger a new render.
- A push must add exactly one request JSON. Scheduled and manual queue checks select the oldest unprocessed request by file name.
- Every request is schema-checked, range-checked, and matched against the exact `render_spec.json` SHA-256 before the Codespace is started.
- Semantically identical JSON requests share one canonical SHA-256 fingerprint, even if whitespace or key order differs.
- After the Motion Preview artifact uploads successfully, the workflow commits one durable marker at `motion-preview-state/processed/<request-fingerprint>.json`.
- A failed or cancelled preview does not create a marker, so the same request remains pending for a later retry.
- Queue runs share one non-cancelling concurrency group. This prevents push and schedule runs from processing the same request at the same time.

Production boundaries:

- Commit a request only after the episode package, adopted asset route, render spec, validator, and consistency check are complete.
- The gateway selects the most recently used Codespace whose repository matches `GITHUB_REPOSITORY` and waits until its state is `Available` before calling the reusable Motion Preview workflow.
- Motion Preview is cache-only. It never calls Gemini TTS, never regenerates narration, and never advances to final rendering.
