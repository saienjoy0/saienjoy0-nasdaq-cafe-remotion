#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
request = (ROOT / '.github/workflows/nasdaq-cafe-final-request-v2.yml').read_text(encoding='utf-8')
worker = (ROOT / '.github/workflows/nasdaq-cafe-final-v2.yml').read_text(encoding='utf-8')

# The request/control-plane workflow may evolve mechanically after Preview approval.
# It must not require its own workflow bytes to equal the approved Renderer commit.
for forbidden in (
    'Current Final transport drift',
    'git show "$RENDERER_COMMIT:$file"',
):
    if forbidden in request:
        raise AssertionError(f'Final control plane is incorrectly frozen to approved Renderer workflow bytes: {forbidden}')

# The approved Renderer implementation itself remains exact and fail-closed.
for required in (
    'git fetch --no-tags origin "$RENDERER_COMMIT" --depth=1',
    'git cat-file -e "$RENDERER_COMMIT:scripts/nasdaq-cafe-final-entry.sh"',
    'git cat-file -e "$RENDERER_COMMIT:contracts/visual_component_registry_snapshot.json"',
):
    if required not in request:
        raise AssertionError(f'Final request no longer verifies approved Renderer implementation: {required}')
for required in (
    'ref: ${{ inputs.renderer_commit }}',
    'test "$(git rev-parse HEAD)" = "${{ inputs.renderer_commit }}"',
    'bash scripts/nasdaq-cafe-final-entry.sh',
):
    if required not in worker:
        raise AssertionError(f'Final worker no longer executes the exact approved Renderer: {required}')

print('Final control-plane / approved Renderer boundary PASS')
