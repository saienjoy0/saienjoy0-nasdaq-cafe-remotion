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
    && rm -rf /var/lib/apt/lists/*

USER node
