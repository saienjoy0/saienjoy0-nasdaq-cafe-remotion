#!/usr/bin/env bash
set -euo pipefail

# Preview handoff restore remains byte-exact; this comment only retriggers the PR gate after adding render diagnostics.
EPISODE_ID="${1:?episode id is required}"
SPEC_PATH="${2:?spec path is required}"
EXPECTED_SHA_RAW="${3:?expected SHA-256 is required}"
INBOX_PATH="handoff-inbox/${EPISODE_ID}/render_spec.json.gz.b64"
PARTS_DIR_V2="handoff-inbox/${EPISODE_ID}/parts-v2"
PARTS_DIR_V1="handoff-inbox/${EPISODE_ID}/parts"

EXPECTED_SHA="$(printf '%s' "$EXPECTED_SHA_RAW" | tr '[:upper:]' '[:lower:]')"
if [[ ! "$EXPECTED_SHA" =~ ^[0-9a-f]{64}$ ]]; then
  echo "::error::handoff restore expected SHA must be a 64-character SHA-256"
  exit 1
fi

mkdir -p "$(dirname "$SPEC_PATH")"
TMP_PATH="${SPEC_PATH}.handoff.tmp"
rm -f "$TMP_PATH"

if [[ -d "$PARTS_DIR_V2" ]]; then
  PARTS_DIR="$PARTS_DIR_V2"
elif [[ -d "$PARTS_DIR_V1" ]]; then
  PARTS_DIR="$PARTS_DIR_V1"
else
  PARTS_DIR=""
fi

if [[ -n "$PARTS_DIR" ]]; then
  shopt -s nullglob
  PARTS=("$PARTS_DIR"/[0-9][0-9].b64)
  shopt -u nullglob
  if [[ "${#PARTS[@]}" -ne 9 ]]; then
    echo "::error::Story Engine handoff requires exactly 9 payload parts"
    echo "::error::found=${#PARTS[@]} parts_dir=$PARTS_DIR"
    exit 1
  fi
  cat "${PARTS[@]}" | base64 --decode | gzip -dc > "$TMP_PATH"
elif [[ -s "$INBOX_PATH" ]]; then
  base64 --decode "$INBOX_PATH" | gzip -dc > "$TMP_PATH"
else
  exit 0
fi

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
