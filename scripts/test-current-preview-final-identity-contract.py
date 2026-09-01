#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
read = lambda rel: (ROOT / rel).read_text(encoding='utf-8')
preview_request = read('.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml')
preview_worker = read('.github/workflows/nasdaq-cafe-preview-handoff-v2.yml')
final_request = read('.github/workflows/nasdaq-cafe-final-request-v2.yml')
final_worker = read('.github/workflows/nasdaq-cafe-final-v2.yml')
request_gate = read('.github/workflows/current-request-publication-gate.yml')
preview_status = read('.github/workflows/nasdaq-cafe-preview-status.yml')
preview_entry = read('scripts/nasdaq-cafe-preview-entry.sh')
final_entry = read('scripts/nasdaq-cafe-final-entry.sh')
final_adapter = read('scripts/render-approved-current-final.ts')
restore = read('scripts/restore-approved-preview-for-final.py')
capture = read('scripts/capture-preview-current-spine-identity.py')
validator = read('scripts/validate-current-request.py')
auth_verify = read('scripts/verify-final-authorization-bundle.py')

# Request publication must be pre-merge gated, then rechecked at immutable event SHA.
for token in ('pull_request:', 'git diff --name-status', 'Current requests are append-only'):
    if token not in request_gate:
        raise AssertionError(f'Current request publication gate missing: {token}')
if '--require-publication-path' not in request_gate or '--require-publication-path' not in preview_request:
    raise AssertionError('Preview publication path is not revalidated before and after merge')
for token in (
    'Nasdaq Cafe Current Preview Request V4',
    "github.event.workflow_run.event == 'push'",
    'nasdaq-cafe-current-preview-',
    'RENDER_SUCCEEDED',
    'plot_run_id',
    'request_sha256',
):
    if token not in preview_status:
        raise AssertionError(f'Current Preview terminal receipt missing: {token}')
for workflow, label in ((preview_request, 'Preview V4'), (final_request, 'Final V2 request')):
    if 'ref: ${{ github.sha }}' not in workflow:
        raise AssertionError(f'{label} does not execute immutable event SHA')
    if 'github.actor == github.repository_owner' in workflow:
        raise AssertionError(f'{label} still depends on merge actor identity')
    if 'git diff --name-status "$BEFORE_SHA" "$TRIGGER_SHA"' not in workflow:
        raise AssertionError(f'{label} does not recheck the full merge diff')
    if 'git fetch --no-tags origin "$RENDERER_COMMIT" --depth=1' not in workflow:
        raise AssertionError(f'{label} does not exact-fetch Renderer implementation for transport verification')
for forbidden in ('signedArtifactUrl', 'signedArtifactDigestSha256', 'signed_artifact_url', 'signed_artifact_digest_sha256'):
    if forbidden in preview_request + preview_worker + final_request + final_worker + validator:
        raise AssertionError(f'Current contract retains signed URL fallback: {forbidden}')

# Preview candidate is direct reusable V4 -> V2 and token-only.
if 'uses: ./.github/workflows/nasdaq-cafe-preview-handoff-v2.yml' not in preview_request:
    raise AssertionError('Current Preview request does not call V2 worker directly')
if 'workflow_call:' not in preview_worker or 'workflow_dispatch:' in preview_worker:
    raise AssertionError('Preview V2 is not reusable-only')
if 'NASDAQ_CAFE_PLOT_ARTIFACT_TOKEN is required for Current Preview' not in preview_worker:
    raise AssertionError('Preview V2 is not token-only fail-closed')
if 'retention-days: 90' not in preview_worker:
    raise AssertionError('Preview V2 Artifact retention is not 90 days')
if 'bash scripts/nasdaq-cafe-preview-entry.sh' not in preview_worker or 'npm run episode:spec:preview' not in preview_entry:
    raise AssertionError('checked-out Renderer does not own Preview procedure')

# Preview Artifact carries exact bytes required by Final.
for token in ('approved-preview-inputs/', 'preview_identity.json', 'approved-tts-cache', 'approved-handoff', 'approved-production-data'):
    if token not in preview_worker + capture:
        raise AssertionError(f'Preview immutable data contract missing: {token}')
for block in ('scenes-01-04', 'scenes-05-09'):
    if block not in capture or block not in restore or block not in validator:
        raise AssertionError(f'Exact TTS block identity missing: {block}')

# Final request binds authorization evidence and deterministic idempotency identity.
for field in (
    'approvedPreviewSha256', 'previewIdentitySha256', 'rendererCommit', 'rendererContractVersion',
    'registrySnapshotSha256', 'renderSpecSha256', 'ttsInputSha256', 'ttsBlockAudioSha256',
    'plotAuthorizationRunId', 'plotAuthorizationArtifactName', 'plotAuthorizationManifestSha256',
    'humanPreviewReviewSha256', 'plotFinalAuthorizationSha256', 'finalFingerprint',
):
    if field not in final_request + validator:
        raise AssertionError(f'Final request identity field missing: {field}')
if 'uses: ./.github/workflows/nasdaq-cafe-final-v2.yml' not in final_request:
    raise AssertionError('Final request does not call Final V2 directly')
if 'verify-final-authorization-bundle.py' not in final_worker or 'NASDAQ_CAFE_PLOT_ARTIFACT_TOKEN' not in final_worker:
    raise AssertionError('Current Final does not independently verify Plot authorization Artifact')
if 'nasdaq-cafe-final-outcome-${{ inputs.final_fingerprint }}' not in final_worker:
    raise AssertionError('Final outcome Artifact name is not fingerprint-addressed')
if 'ALREADY_COMPLETED' not in final_worker or 'Multiple unexpired Final outcomes' not in final_worker:
    raise AssertionError('Final idempotency lookup is incomplete')
if 'concurrency:' not in final_worker or 'nasdaq-cafe-final-${{ inputs.final_fingerprint }}' not in final_worker:
    raise AssertionError('Final concurrency is not fingerprint-scoped')
if 'actions/cache/restore' in final_worker:
    raise AssertionError('Final V2 uses Actions cache as production authority')

# Current V2 restores exact approved bytes, then uses the approved Renderer checkout for
# validation/cache-only compilation. Its historical legacy Final approval gate is not
# re-entered because modern authorization was already verified by Current V2.
for token in (
    'restore-approved-preview-for-final.py',
    'export SPEC_TTS_CACHE_ONLY=1',
    'npm run typecheck',
    'npm run test:gemini-tts',
    'npm run episode:spec:validate -- "$SPEC_PATH"',
    'npm run test:runtime-stability',
    'npm run episode:spec:compile -- "$SPEC_PATH"',
    'npx tsx "${GITHUB_WORKSPACE}/.final-control-plane/scripts/render-approved-current-final.ts"',
):
    if token not in final_worker:
        raise AssertionError(f'Current Final approved Renderer procedure missing: {token}')
for forbidden in ('bash scripts/nasdaq-cafe-final-entry.sh', 'npm run episode:spec:final'):
    if forbidden in final_worker:
        raise AssertionError(f'Current Final re-enters obsolete Renderer approval route: {forbidden}')
if 'npm run episode:spec:final' not in final_entry or 'SPEC_TTS_CACHE_ONLY=1' not in final_entry:
    raise AssertionError('Historical Final entry changed unexpectedly; compatibility must live in Current control plane')

# Render-only adapter must remain mechanical and preserve the approved Renderer final
# composition/encode settings while refusing cache misses or Renderer contract drift.
for token in (
    'render_data.production.json', 'technical_report.json', 'EXPECTED_SPEC_SHA256',
    'approved cache-only compile mismatch', 'approved Renderer final render contract drift',
    '"NasdaqCafeSpec"', 'codec: "h264"', 'audioCodec: "aac"', 'sampleRate: 48000',
    'imageFormat: "jpeg"', 'pixelFormat: "yuv420p"', 'crf: 18', 'scale: 1',
):
    if token not in final_adapter:
        raise AssertionError(f'Current Final render-only adapter contract missing: {token}')
for forbidden in ('speechText =', 'narrationText =', 'visualMode =', 'templateId =', 'assetId ='):
    if forbidden in final_adapter:
        raise AssertionError(f'Current Final render-only adapter may author semantics: {forbidden}')

# Mechanical helpers belong to the current Final control plane, while the Renderer checkout
# remains pinned to the approved commit.
for token in (
    'path: .final-control-plane',
    '${GITHUB_WORKSPACE}/.final-control-plane/scripts/restore-approved-preview-for-final.py',
    '${GITHUB_WORKSPACE}/.final-control-plane/scripts/render-approved-current-final.ts',
    'git -C "${GITHUB_WORKSPACE}/.final-control-plane" rev-parse HEAD',
):
    if token not in final_worker:
        raise AssertionError(f'Final control-plane separation missing: {token}')
if 'FINAL_CONTROL_PLANE_ROOT: ${{ runner.temp }}' in final_worker:
    raise AssertionError('Final control plane uses runner context before a runner exists')

# Helpers are mechanical and exact-schema based.
if 'preview fields mismatch' not in validator or 'final fields mismatch' not in validator or 'finalFingerprint mismatch' not in validator:
    raise AssertionError('Current request validator is not exact-schema/fingerprint bound')
if 'authorization manifest SHA mismatch' not in auth_verify or 'Final authorization is not approved' not in auth_verify:
    raise AssertionError('Final authorization bundle verifier is incomplete')

print('current Preview/Final exact identity contract PASS')
