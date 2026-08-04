FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ffmpeg \
        ca-certificates \
        curl \
        jq \
        gh \
        fonts-noto-cjk \
        libnspr4 \
        libnss3 \
        libdbus-1-3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libatspi2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libasound2 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libcairo2 \
        libglib2.0-0 \
        libgtk-3-0 \
        libfontconfig1 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxext6 \
        libxi6 \
        libxrender1 \
        libxss1 \
        libxtst6 \
    && rm -rf /var/lib/apt/lists/*

USER node
