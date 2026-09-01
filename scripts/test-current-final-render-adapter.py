#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
worker = (ROOT / '.github/workflows/nasdaq-cafe-final-v2.yml').read_text(encoding='utf-8')
adapter_path = ROOT / 'scripts/render-approved-current-final.ts'

# Current Final V2 owns modern authorization. Historical approved Renderer commits may
# contain an obsolete legacy approval gate, so the worker must not call that legacy
# `episode:spec:final` route after modern authorization has already passed.
for forbidden in (
    'bash scripts/nasdaq-cafe-final-entry.sh',
    'npm run episode:spec:final',
):
    if forbidden in worker:
        raise AssertionError(f'Current Final still invokes legacy approval route: {forbidden}')

for required in (
    'export SPEC_TTS_CACHE_ONLY=1',
    'export NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY="$RUNTIME_ASSET_REGISTRY"',
    'npm run typecheck',
    'npm run test:gemini-tts',
    'npm run episode:spec:validate -- "$SPEC_PATH"',
    'npm run test:runtime-stability',
    'npm run episode:spec:compile -- "$SPEC_PATH"',
    'npx tsx "${GITHUB_WORKSPACE}/.final-control-plane/scripts/render-approved-current-final.ts"',
):
    if required not in worker:
        raise AssertionError(f'Current Final approved-render procedure missing: {required}')

if not adapter_path.is_file():
    raise AssertionError('Current Final render-only adapter is missing')
adapter = adapter_path.read_text(encoding='utf-8')

# The adapter is deliberately mechanical: it renders the production data compiled by the
# exact approved Renderer checkout using the same Remotion composition/settings as that
# Renderer commit's spec-cli final branch. It must not author or alter semantic content.
for required in (
    'bundle({',
    'getCompositions(',
    'renderMedia({',
    '"NasdaqCafeSpec"',
    'codec: "h264"',
    'audioCodec: "aac"',
    'sampleRate: 48000',
    'imageFormat: "jpeg"',
    'pixelFormat: "yuv420p"',
    'crf: 18',
    'scale: 1',
    'render_data.production.json',
    'technical_report.json',
    'cache.misses',
    'cache.hits',
    'chunkCount',
    'inputSpecSha256',
    'EXPECTED_SPEC_SHA256',
    'EPISODE_DATE',
):
    if required not in adapter:
        raise AssertionError(f'Current Final render-only adapter contract missing: {required}')

for forbidden in (
    'speechText =',
    'narrationText =',
    'visualMode =',
    'templateId =',
    'assetId =',
):
    if forbidden in adapter:
        raise AssertionError(f'Current Final adapter may be authoring semantics: {forbidden}')

print('Current Final render-only adapter contract PASS')
