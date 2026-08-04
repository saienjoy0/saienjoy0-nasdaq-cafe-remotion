#!/usr/bin/env bash
set -euo pipefail

PACKAGES=(
  libnspr4
  libnss3
  libdbus-1-3
  libatk1.0-0
  libatk-bridge2.0-0
  libatspi2.0-0
  libcups2
  libdrm2
  libxkbcommon0
  libxcomposite1
  libxdamage1
  libxfixes3
  libxrandr2
  libgbm1
  libasound2
  libpango-1.0-0
  libpangocairo-1.0-0
  libcairo2
  libglib2.0-0
  libgtk-3-0
  libfontconfig1
  libx11-6
  libx11-xcb1
  libxcb1
  libxext6
  libxi6
  libxrender1
  libxss1
  libxtst6
)

missing=()
for package in "${PACKAGES[@]}"; do
  if ! dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -Fqx 'install ok installed'; then
    missing+=("$package")
  fi
done

if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "[remotion-browser] Installing missing runtime packages: ${missing[*]}"
  sudo -n apt-get update
  sudo -n env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${missing[@]}"
else
  echo "[remotion-browser] Chrome runtime packages are already installed."
fi

required_libraries=(
  libnspr4.so
  libnss3.so
  libatk-1.0.so.0
  libatk-bridge-2.0.so.0
  libcups.so.2
  libdrm.so.2
  libxkbcommon.so.0
  libXcomposite.so.1
  libXdamage.so.1
  libXfixes.so.3
  libXrandr.so.2
  libgbm.so.1
  libasound.so.2
  libpango-1.0.so.0
  libcairo.so.2
)

library_cache="$(ldconfig -p)"
for library in "${required_libraries[@]}"; do
  if ! grep -Fq "$library" <<<"$library_cache"; then
    echo "[remotion-browser] Missing required shared library after installation: $library" >&2
    exit 1
  fi
done

echo "[remotion-browser] Chrome runtime dependency check passed."
