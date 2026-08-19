#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
preview_request = (ROOT / '.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml').read_text(encoding='utf-8')
preview_worker = (ROOT / '.github/workflows/nasdaq-cafe-preview-handoff-v2.yml').read_text(encoding='utf-8')
final_request = (ROOT / '.github/workflows/nasdaq-cafe-final-request-v2.yml').read_text(encoding='utf-8')
final_worker = (ROOT / '.github/workflows/nasdaq-cafe-final-v2.yml').read_text(encoding='utf-8')
preview_entry = (ROOT / 'scripts/nasdaq-cafe-preview-entry.sh').read_text(encoding='utf-8')
final_entry = (ROOT / 'scripts/nasdaq-cafe-final-entry.sh').read_text(encoding='utf-8')
restore = (ROOT / 'scripts/restore-approved-preview-for-final.py').read_text(encoding='utf-8')
capture = (ROOT / 'scripts/capture-preview-current-spine-identity.py').read_text(encoding='utf-8')

# Current Preview entry is one request -> reusable worker, without child polling.
if 'uses: ./.github/workflows/nasdaq-cafe-preview-handoff-v2.yml' not in preview_request:
    raise AssertionError('Current Preview request does not call V2 worker directly')
for forbidden in ('gh api --method POST', 'gh run list', 'gh run watch'):
    if forbidden in preview_request:
        raise AssertionError(f'Current Preview request still dispatches/polls child workflow: {forbidden}')

# Renderer implementation identity is supplied, not guessed/hardcoded.
for field in ('expected_renderer_commit', 'expected_renderer_contract_version', 'expected_registry_snapshot_sha256'):
    if field not in preview_request or field not in preview_worker:
        raise AssertionError(f'Current Preview identity field missing: {field}')
if 'RENDERER_CONTRACT_VERSION: 2.4.0' in preview_worker:
    raise AssertionError('Current Preview worker hardcodes Renderer contract identity')
if 'bash scripts/nasdaq-cafe-preview-entry.sh' not in preview_worker:
    raise AssertionError('Current Preview render procedure is not owned by checked-out Renderer script')
if 'npm run episode:spec:preview' not in preview_entry:
    raise AssertionError('Checked-out Preview entry does not execute canonical Preview render command')

# Preview Artifact must contain exact production bytes required by Final.
for token in ('approved-preview-inputs/', 'preview_identity.json', 'approved-tts-cache', 'approved-handoff', 'approved-production-data'):
    if token not in preview_worker + capture:
        raise AssertionError(f'Preview immutable data contract missing: {token}')
for block in ('scenes-01-04', 'scenes-05-09'):
    if block not in capture or block not in restore or block not in final_request:
        raise AssertionError(f'Exact TTS block identity missing: {block}')

# Explicit Final request binds every approved Preview identity.
for field in (
    'approvedPreviewSha256', 'previewIdentitySha256', 'rendererCommit',
    'rendererContractVersion', 'registrySnapshotSha256', 'renderSpecSha256',
    'ttsInputSha256', 'ttsBlockAudioSha256',
):
    if field not in final_request:
        raise AssertionError(f'Final request identity field missing: {field}')
if "v['confirmation']!='FINAL_RENDER'" not in final_request:
    raise AssertionError('Final request is not explicitly gated by FINAL_RENDER')

# Final is artifact-native: approved Preview is restored before exact Renderer checkout,
# cache is not an authority, and repo-local daily render_spec is not expected.
if final_worker.find('Download exact approved Preview Artifact before checkout') > final_worker.find('Checkout exact approved Renderer commit'):
    raise AssertionError('Final checks out Renderer before restoring approved Preview Artifact')
if 'actions/cache/restore' in final_worker:
    raise AssertionError('Final V2 uses Actions cache as production authority')
if 'render-specs/${EPISODE_DATE}/render_spec.json' in final_worker or 'render-specs/' in final_entry:
    raise AssertionError('Final V2 still depends on repo-local daily RenderSpec')
if 'restore-approved-preview-for-final.py' not in final_worker:
    raise AssertionError('Final V2 does not restore approved Preview production bytes')
if 'bash scripts/nasdaq-cafe-final-entry.sh' not in final_worker:
    raise AssertionError('Final render procedure is not owned by checked-out Renderer script')
if 'npm run episode:spec:final' not in final_entry:
    raise AssertionError('Checked-out Final entry does not execute canonical Final render command')
if 'SPEC_TTS_CACHE_ONLY=1' not in final_entry:
    raise AssertionError('Final entry may synthesize new TTS instead of exact cached bytes')

print('current Preview/Final exact identity contract PASS')
