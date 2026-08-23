#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
doc=(ROOT/'docs/current-spine/CURRENT_ENTRYPOINTS.md').read_text(encoding='utf-8')
for heading in ('CURRENT PRODUCTION','LEGACY READ-ONLY / COMPATIBILITY','TEST / HISTORICAL ONLY'):
    if heading not in doc: raise AssertionError(f'missing entrypoint class: {heading}')
for current in (
    '.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml',
    '.github/workflows/current-request-publication-gate.yml',
    '.github/workflows/nasdaq-cafe-preview-handoff-v2.yml',
    '.github/workflows/nasdaq-cafe-preview-status.yml',
    '.github/workflows/nasdaq-cafe-final-request-v2.yml',
    '.github/workflows/nasdaq-cafe-final-v2.yml',
    'scripts/nasdaq-cafe-preview-entry.sh',
    'scripts/nasdaq-cafe-final-entry.sh',
):
    if current not in doc: raise AssertionError(f'current entry not documented: {current}')
for legacy in (
    '.github/workflows/nasdaq-cafe-handoff-preview-request-v3.yml',
    '.github/workflows/nasdaq-cafe-preview-handoff.yml',
    '.github/workflows/nasdaq-cafe-final-request.yml',
    '.github/workflows/nasdaq-cafe-final.yml',
):
    if legacy not in doc: raise AssertionError(f'legacy entry not documented: {legacy}')
preview=(ROOT/'.github/workflows/nasdaq-cafe-handoff-preview-request-v4.yml').read_text(encoding='utf-8')
final=(ROOT/'.github/workflows/nasdaq-cafe-final-request-v2.yml').read_text(encoding='utf-8')
if 'nasdaq-cafe-preview-handoff-v2.yml' not in preview: raise AssertionError('Current Preview request targets wrong worker')
if '--require-publication-path' not in preview: raise AssertionError('Current Preview does not enforce deterministic publication path')
if 'owner-triggered immutable Current Preview request' in doc: raise AssertionError('Current Preview documentation still describes the retired owner gate')
if 'nasdaq-cafe-final-v2.yml' not in final: raise AssertionError('Current Final request targets wrong worker')
if 'validate-current-request.py final' not in final or 'confirmation: FINAL' not in final:
    raise AssertionError('Current Final is not explicit')
print('Renderer current entrypoint classification PASS')
