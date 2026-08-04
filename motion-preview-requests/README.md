# Motion Preview request queue

This directory is the repository-backed request path used when ChatGPT needs the registered Codespace runner to render a short Motion Preview.

Create exactly one new JSON file per request. A push to `main` validates the request, verifies the immutable `render_spec.json` SHA-256, starts the most recently used Codespace for this repository, and dispatches `.github/workflows/nasdaq-cafe-motion-preview.yml` to the runner labeled `nasdaq-cafe-codespace`.

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
- Register the self-hosted runner once inside the Codespace. After that, `.devcontainer/post-start.sh` starts it automatically whenever the Codespace starts or resumes.

Rules:

- Commit the request only after the episode package, adopted asset route, render spec, validator, and consistency check are complete.
- Do not modify an old request to trigger a new render. Add a new uniquely named file so the execution history remains auditable.
- The gateway selects the most recently used Codespace whose repository matches `GITHUB_REPOSITORY` and waits until its state is `Available` before dispatch.
- Motion Preview is cache-only. It never calls Gemini TTS and never advances to final rendering.
