#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "[codespaces] Installing locked Node dependencies..."
npm ci

echo "[codespaces] Preparing the Remotion browser once..."
npx remotion browser ensure

echo "[codespaces] Verifying the development environment..."
node --version
npm --version
ffmpeg -version | head -n 1
ffprobe -version | head -n 1
npm run typecheck
npm run episode:spec:validate -- render-specs/2026-07-31/render_spec.json

echo "[codespaces] Ready. Start Remotion Studio with: npm run dev"
