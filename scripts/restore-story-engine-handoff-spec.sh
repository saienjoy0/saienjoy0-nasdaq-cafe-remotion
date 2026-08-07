#!/usr/bin/env bash
set -euo pipefail

EPISODE_ID="${1:?episode id is required}"
SPEC_PATH="${2:?spec path is required}"
EXPECTED_SHA_RAW="${3:?expected SHA-256 is required}"
INBOX_PATH="handoff-inbox/${EPISODE_ID}/render_spec.json.gz.b64"

if [[ ! -s "$INBOX_PATH" ]]; then
  exit 0
fi

EXPECTED_SHA="$(printf '%s' "$EXPECTED_SHA_RAW" | tr '[:upper:]' '[:lower:]')"
if [[ ! "$EXPECTED_SHA" =~ ^[0-9a-f]{64}$ ]]; then
  echo "::error::handoff restore expected SHA must be a 64-character SHA-256"
  exit 1
fi

mkdir -p "$(dirname "$SPEC_PATH")"
TMP_PATH="${SPEC_PATH}.handoff.tmp"
base64 --decode "$INBOX_PATH" | gzip -dc > "$TMP_PATH"
ACTUAL_SHA="$(sha256sum "$TMP_PATH" | awk '{print $1}')"
if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
  rm -f "$TMP_PATH"
  echo "::error::immutable handoff SHA mismatch"
  echo "::error::expected=$EXPECTED_SHA"
  echo "::error::actual=$ACTUAL_SHA"
  exit 1
fi
mv "$TMP_PATH" "$SPEC_PATH"
echo "Restored exact immutable Story Engine handoff: $ACTUAL_SHA"
