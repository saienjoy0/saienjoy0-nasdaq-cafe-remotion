#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "[codespaces] Ensuring the self-hosted Actions runner is online..."
if bash scripts/codespace-actions-runner.sh ensure; then
  echo "[codespaces] Actions runner is ready."
else
  echo "[codespaces] Runner auto-start could not finish." >&2
  echo "[codespaces] The Codespace remains usable. Complete the one-time runner registration, then restart the Codespace." >&2
fi
