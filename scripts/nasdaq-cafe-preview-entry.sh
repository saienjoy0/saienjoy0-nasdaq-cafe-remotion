#!/usr/bin/env bash
set -euo pipefail

: "${EPISODE_DATE:?}"
: "${SPEC_PATH:?}"
: "${RUNTIME_ASSET_REGISTRY:?}"
: "${RENDERER_CONTRACT_VERSION:?}"
: "${EXPECTED_REGISTRY_SNAPSHOT_SHA256:?}"
: "${EXPECTED_BUNDLE_ID:?}"
: "${EXPECTED_MANIFEST_SHA256:?}"
: "${HANDOFF_DOWNLOAD_ROOT:?}"

export NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY="$RUNTIME_ASSET_REGISTRY"

npm run episode:spec:validate -- "$SPEC_PATH"
npm run test:runtime-stability
mkdir -p .cache/spec-tts-blocks "build/${EPISODE_DATE}"
npm run episode:spec:preview -- "$SPEC_PATH" 2>&1 | tee "build/${EPISODE_DATE}/preview-render.log"

python3 scripts/capture-preview-current-spine-identity.py \
  --episode-date "$EPISODE_DATE" \
  --spec "$SPEC_PATH" \
  --runtime-registry "$RUNTIME_ASSET_REGISTRY" \
  --handoff-download-root "$HANDOFF_DOWNLOAD_ROOT" \
  --technical-report "build/${EPISODE_DATE}/technical_report.json" \
  --renderer-contract-version "$RENDERER_CONTRACT_VERSION" \
  --registry-sha256 "$EXPECTED_REGISTRY_SNAPSHOT_SHA256" \
  --expected-bundle-id "$EXPECTED_BUNDLE_ID" \
  --expected-manifest-sha256 "$EXPECTED_MANIFEST_SHA256" \
  --output-root "build/${EPISODE_DATE}/approved-preview-inputs"
