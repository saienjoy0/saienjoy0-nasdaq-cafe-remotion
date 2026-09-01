#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "nasdaq-cafe-codespace-wake.yml"


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    required = (
        "name: Nasdaq Cafe Codespace Wake",
        '      - "codespace-wake-requests/*.json"',
        "github.actor == github.repository_owner",
        "CODESPACE_LIFECYCLE_TOKEN: ${{ secrets.CODESPACE_LIFECYCLE_TOKEN }}",
        "https://api.github.com/user/codespaces?per_page=100",
        "/start",
        'state == "Available"',
        "actions/upload-artifact@v6",
        "codespace_wake_receipt.json",
    )
    for needle in required:
        if needle not in text:
            raise AssertionError(f"Codespace wake workflow missing contract: {needle}")
    forbidden = (
        "episode:spec:preview",
        "episode:spec:final",
        "GEMINI_API_KEY",
        "render-specs/",
        "motion-preview-requests/",
    )
    for needle in forbidden:
        if needle in text:
            raise AssertionError(f"Codespace wake workflow must not depend on production/render semantics: {needle}")
    print("Codespace wake gateway contract PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
