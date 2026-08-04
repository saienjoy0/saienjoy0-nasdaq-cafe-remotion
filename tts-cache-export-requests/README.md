# Existing production TTS cache export requests

Add one new JSON file to export an already-existing two-block production TTS cache from the GitHub-hosted runner into a portable workflow artifact.

```json
{
  "requestVersion": "1.0",
  "episodeDate": "2026-07-31",
  "expectedSpecSha256": "64-character SHA-256",
  "confirmation": "EXPORT_EXISTING_TTS_CACHE"
}
```

The export workflow never calls Gemini and fails on an Actions cache miss. After validating both `audio.wav` blocks, it uploads one portable archive and records its artifact ID under `tts-cache-exports/<tts-input-sha>.json`. Motion Preview uses that registry only when direct cache restoration fails.
