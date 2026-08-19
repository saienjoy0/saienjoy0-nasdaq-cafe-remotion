#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
request = (ROOT / '.github/workflows/nasdaq-cafe-handoff-preview-request-v3.yml').read_text(encoding='utf-8')
worker = (ROOT / '.github/workflows/nasdaq-cafe-preview-handoff.yml').read_text(encoding='utf-8')

for forbidden in ('gh api --method POST', 'gh run list', 'gh run watch'):
    if forbidden in request:
        raise AssertionError(f'Preview request still uses child dispatch/polling: {forbidden}')
if 'uses: ./.github/workflows/nasdaq-cafe-preview-handoff.yml' not in request:
    raise AssertionError('Preview request is not directly calling reusable worker')
if 'workflow_call:' not in worker:
    raise AssertionError('Preview worker is not reusable')
if 'RENDERER_CONTRACT_VERSION: 2.4.0' in worker:
    raise AssertionError('Preview worker still hardcodes Renderer contract identity')
for field in ('expected_renderer_commit', 'expected_renderer_contract_version', 'expected_registry_snapshot_sha256'):
    if field not in worker or field not in request:
        raise AssertionError(f'missing bound Preview identity: {field}')
print('reusable Preview current-spine contract PASS')
