# NASDAQ Cafe Renderer Current Entrypoints

Status: current-spine authority after PR-8 migration.

## CURRENT PRODUCTION

### Preview
- `.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml`
  - publication-gated、append-onlyのimmutable Current Preview request mergeだけで起動。
  - binds Plot handoff, Renderer commit/contract/Registry and confirmation `PREVIEW`.
- `.github/workflows/current-request-publication-gate.yml`
  - request-only PR、deterministic path、exact request SHAをmerge前に検証。
- `.github/workflows/nasdaq-cafe-preview-handoff-v2.yml`
  - reusable Current Preview worker.
  - checks out the exact pinned Renderer commit and calls `scripts/nasdaq-cafe-preview-entry.sh`.
- `scripts/nasdaq-cafe-preview-entry.sh`
  - Renderer-commit-owned Preview procedure.
- `scripts/capture-preview-current-spine-identity.py`
  - captures RenderSpec/TTS/Renderer identities and exact two-block TTS bytes into the immutable Preview Artifact.
- `.github/workflows/nasdaq-cafe-preview-status.yml`
  - V4のterminal runをPlot run IDとrequest SHAへ結び付け、成功/失敗receiptを公開。

### Final
- `.github/workflows/nasdaq-cafe-final-request-v2.yml`
  - explicit Current Final request; requires `FINAL_RENDER` and exact approved Preview identity.
- `.github/workflows/nasdaq-cafe-final-v2.yml`
  - artifact-native Current Final worker.
  - restores exact approved Preview bytes, checks out exact approved Renderer commit and calls `scripts/nasdaq-cafe-final-entry.sh`.
- `scripts/restore-approved-preview-for-final.py`
  - verifies/restores approved RenderSpec, runtime data, handoff and exact TTS audio bytes.
- `scripts/nasdaq-cafe-final-entry.sh`
  - Renderer-commit-owned Final procedure with cache-only TTS.

Final is never automatic. Human Preview approval and an explicit Final request are required.

## LEGACY READ-ONLY / COMPATIBILITY

Retained during migration; current production must not select these as authority:

- `.github/workflows/nasdaq-cafe-handoff-preview-request-v3.yml`
- `.github/workflows/nasdaq-cafe-preview-handoff.yml`
- `.github/workflows/nasdaq-cafe-final-request.yml`
- `.github/workflows/nasdaq-cafe-final.yml`
- `.github/workflows/nasdaq-cafe-handoff-promote.yml`

They remain only for compatibility/historical receipts until current Preview/Final Artifact-native qualification is complete. Promotion is not Current Final data authority.

## TEST / HISTORICAL ONLY

- old fixture workflows and production snapshots used only for regression/history;
- static contract CI and synthetic current fixtures;
- diagnostic/manual workflows that do not meet Current identity contract.

## Authority boundaries

- Workflow YAML is bootstrap/transport only. Checked-out Renderer scripts own render procedure.
- GitHub Actions cache is an optimization only, never production evidence.
- Current Final restores daily data from the approved immutable Preview Artifact; it does not expect `render-specs/<date>` to exist in the checked-out Renderer repository.
- Renderer never changes narration, market causality, Scene order, Visual meaning or image path selection.
- The same Preview request bytes always map to the same append-only path; retrying publication never creates a second logical request.
