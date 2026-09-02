#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Callable


class CodespaceApiError(RuntimeError):
    def __init__(self, status_code: int, response_text: str):
        self.status_code = status_code
        self.response_text = response_text
        super().__init__(f"GitHub Codespaces API failed: HTTP {status_code}: {response_text}")


class CodespaceWakeError(RuntimeError):
    pass


def request_json(method: str, url: str, token: str) -> dict | None:
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "nasdaq-cafe-codespace-wake",
    }
    request = urllib.request.Request(url, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read()
            return json.loads(payload) if payload else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise CodespaceApiError(exc.code, detail) from exc


def select_repository_codespace(listing: dict, repository: str) -> dict:
    candidates = [
        item
        for item in listing.get("codespaces", [])
        if item.get("repository", {}).get("full_name") == repository
    ]
    if not candidates:
        raise CodespaceWakeError(f"No Codespace found for {repository}")
    return max(candidates, key=lambda item: item.get("last_used_at") or item.get("updated_at") or "")


def ensure_available(
    repository: str,
    token: str,
    *,
    request_fn: Callable[[str, str, str], dict | None] = request_json,
    sleep_fn: Callable[[float], None] = time.sleep,
    monotonic_fn: Callable[[], float] = time.monotonic,
    timeout_seconds: int = 420,
    poll_seconds: int = 7,
) -> str:
    listing = request_fn("GET", "https://api.github.com/user/codespaces?per_page=100", token) or {}
    selected = select_repository_codespace(listing, repository)
    name = str(selected.get("name") or "")
    if not name:
        raise CodespaceWakeError("Selected Codespace is missing name")

    if selected.get("state") != "Available":
        start_url = selected.get("start_url") or f"https://api.github.com/user/codespaces/{name}/start"
        try:
            request_fn("POST", start_url, token)
        except CodespaceApiError as exc:
            if exc.status_code != 409:
                raise

    deadline = monotonic_fn() + timeout_seconds
    while True:
        current = request_fn("GET", f"https://api.github.com/user/codespaces/{name}", token) or {}
        if current.get("state") == "Available":
            return name
        if monotonic_fn() >= deadline:
            raise CodespaceWakeError(f"Codespace {name} did not become Available within {timeout_seconds}s")
        sleep_fn(poll_seconds)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--github-output", required=True)
    args = parser.parse_args()

    token = os.environ.get("CODESPACE_LIFECYCLE_TOKEN", "")
    if not token:
        raise CodespaceWakeError("CODESPACE_LIFECYCLE_TOKEN is required")
    name = ensure_available(args.repository, token)
    output = Path(args.github_output)
    with output.open("a", encoding="utf-8") as stream:
        stream.write(f"name={name}\n")
        stream.write("state=Available\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
