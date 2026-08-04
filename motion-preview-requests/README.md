# Motion Preview request queue

This directory is the repository-backed request path used when ChatGPT needs the registered Codespace runner to render a short Motion Preview.

Create exactly one new JSON file per request. A push to `main` validates the request, verifies the immutable `render_spec.json` SHA-256, and dispatches `.github/workflows/nasdaq-cafe-motion-preview.yml` to the runner labeled `nasdaq-cafe-codespace`.

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

Rules:

- Commit the request only after the episode package, adopted asset route, render spec, validator, and consistency check are complete.
- Do not modify an old request to trigger a new render. Add a new uniquely named file so the execution history remains auditable.
- Motion Preview is cache-only. It never calls Gemini TTS and never advances to final rendering.
- The Codespace must exist. After the runner has been registered once, `.devcontainer/post-start.sh` starts it automatically whenever the Codespace resumes.
