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

# GitHub Actions graph compilation happens before a runner exists. runner.* is therefore
# forbidden at jobs.<job_id>.env. Keep the helper checkout workspace-relative, and only
# resolve the concrete workspace path inside runner-executed steps.
if 'FINAL_CONTROL_PLANE_ROOT: ${{ runner.temp }}' in worker:
    raise AssertionError('Final worker uses runner context in job-level env and cannot compile')
for required in (
    'path: .final-control-plane',
    '${GITHUB_WORKSPACE}/.final-control-plane/scripts/restore-approved-preview-for-final.py',
    'git -C "${GITHUB_WORKSPACE}/.final-control-plane" rev-parse HEAD',
):
    if required not in worker:
        raise AssertionError(f'Final control-plane workspace binding missing: {required}')

# Root Renderer checkout uses clean=true, so it must happen before the nested control-plane
# checkout. Otherwise git clean -ffdx removes .final-control-plane before verification.
renderer_checkout = worker.find('- name: Checkout exact approved Renderer commit')
control_checkout = worker.find('- name: Checkout exact current Final control-plane helper')
if renderer_checkout < 0 or control_checkout < 0:
    raise AssertionError('Final checkout steps are missing')
if renderer_checkout > control_checkout:
    raise AssertionError('Final Renderer checkout must precede nested control-plane checkout')

# Restoring the approved TTS cache targets .cache/spec-tts-blocks. The parent .cache may
# legitimately be absent after a clean checkout, so materialization must create it first.
cache_mkdir = worker.find('mkdir -p .cache')
cache_copy = worker.find('cp -a build/final-approved-inputs/tts-cache .cache/spec-tts-blocks')
if cache_mkdir < 0:
    raise AssertionError('Final restore does not create the .cache parent before TTS cache copy')
if cache_copy < 0:
    raise AssertionError('Final restore TTS cache copy is missing')
if cache_mkdir > cache_copy:
    raise AssertionError('Final restore must create .cache before copying TTS cache')

print('Final control-plane / approved Renderer boundary PASS')
