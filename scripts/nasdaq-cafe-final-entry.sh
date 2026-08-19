#!/usr/bin/env bash
set -euo pipefail

: "${EPISODE_DATE:?}"
: "${SPEC_PATH:?}"
: "${RUNTIME_ASSET_REGISTRY:?}"
: "${EXPECTED_SPEC_SHA256:?}"

export NASDAQ_CAFE_RUNTIME_ASSET_REGISTRY="$RUNTIME_ASSET_REGISTRY"
export SPEC_TTS_CACHE_ONLY=1

ACTUAL="$(sha256sum "$SPEC_PATH" | awk '{print $1}')"
[[ "$ACTUAL" == "$EXPECTED_SPEC_SHA256" ]] || {
  echo "render_spec SHA mismatch expected=$EXPECTED_SPEC_SHA256 actual=$ACTUAL" >&2
  exit 1
}

bash scripts/ensure-remotion-browser-deps.sh
npm run typecheck
npm run test:gemini-tts
npm run episode:spec:validate -- "$SPEC_PATH"
npm run test:runtime-stability
npm run episode:spec:final -- "$SPEC_PATH"
