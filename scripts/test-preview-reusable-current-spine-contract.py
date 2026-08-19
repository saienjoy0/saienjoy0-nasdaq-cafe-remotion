#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
request = (ROOT / '.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml').read_text(encoding='utf-8')
worker = (ROOT / '.github/workflows/nasdaq-cafe-preview-handoff-v2.yml').read_text(encoding='utf-8')
legacy_request = (ROOT / '.github/workflows/nasdaq-cafe-handoff-preview-request-v3.yml').read_text(encoding='utf-8')
legacy_worker = (ROOT / '.github/workflows/nasdaq-cafe-preview-handoff.yml').read_text(encoding='utf-8')

if 'uses: ./.github/workflows/nasdaq-cafe-preview-handoff-v2.yml' not in request:
    raise AssertionError('Preview V4 request is not directly calling reusable V2 worker')
for forbidden in ('gh api --method POST', 'gh run list', 'gh run watch', 'signedArtifactUrl', 'signed_artifact_url'):
    if forbidden in request + worker:
        raise AssertionError(f'Current candidate Preview retains forbidden transport/dispatch mechanism: {forbidden}')
if 'workflow_call:' not in worker:
    raise AssertionError('Preview V2 worker is not reusable')
if 'workflow_dispatch:' in worker:
    raise AssertionError('Preview V2 candidate must not be directly dispatchable')
for field in ('expected_renderer_commit', 'expected_renderer_contract_version', 'expected_registry_snapshot_sha256'):
    if field not in worker or field not in request:
        raise AssertionError(f'missing bound Preview identity: {field}')
if 'NASDAQ_CAFE_PLOT_ARTIFACT_TOKEN is required for Current Preview' not in worker:
    raise AssertionError('Preview V2 is not token-only fail-closed')
if 'retention-days: 90' not in worker:
    raise AssertionError('Preview V2 production Artifact retention is not 90 days')
if 'ref: ${{ github.sha }}' not in request:
    raise AssertionError('Preview V4 request does not execute event commit bytes')
if 'git diff --name-status "$BEFORE_SHA" "$TRIGGER_SHA"' not in request:
    raise AssertionError('Preview V4 does not recheck the whole merge diff')
if 'ref: main' in request:
    raise AssertionError('Preview V4 still re-checks out moving main')
if 'github.actor == github.repository_owner' in request:
    raise AssertionError('Preview V4 still depends on merge actor identity')
# Legacy V3 remains the incumbent production route until Atomic Cutover.
if 'workflow_dispatch:' not in legacy_worker:
    raise AssertionError('Legacy V3 worker changed away from incumbent manual workflow')
if 'gh api --method POST' not in legacy_request:
    raise AssertionError('Legacy V3 request was unexpectedly rewritten during candidate qualification')
print('reusable Preview candidate contract PASS')
