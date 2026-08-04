#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "[codespaces] Ensuring Remotion browser dependencies are available..."
if bash scripts/ensure-remotion-browser-deps.sh; then
  echo "[codespaces] Remotion browser dependencies are ready."
else
  echo "[codespaces] Browser dependency setup could not finish." >&2
  echo "[codespaces] Motion Preview will run the same check again and stop safely if dependencies remain incomplete." >&2
fi

echo "[codespaces] Ensuring the self-hosted Actions runner is online..."
if bash scripts/codespace-actions-runner.sh ensure; then
  echo "[codespaces] Actions runner is ready."
else
  echo "[codespaces] Runner auto-start could not finish." >&2
  echo "[codespaces] The Codespace remains usable. Complete the one-time runner registration, then restart the Codespace." >&2
fi
