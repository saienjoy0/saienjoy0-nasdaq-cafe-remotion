#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "nasdaq-cafe-codespace-wake.yml"
HELPER = ROOT / "scripts" / "wake_repository_codespace.py"


def main() -> int:
    text = WORKFLOW.read_text(encoding="utf-8")
    helper = HELPER.read_text(encoding="utf-8")
    required = (
        "name: Nasdaq Cafe Codespace Wake",
        '      - "codespace-wake-requests/*.json"',
        "github.actor == github.repository_owner",
        "CODESPACE_LIFECYCLE_TOKEN: ${{ secrets.CODESPACE_LIFECYCLE_TOKEN }}",
        "scripts/wake_repository_codespace.py",
        "actions/upload-artifact@v6",
        "codespace_wake_receipt.json",
    )
    for needle in required:
        if needle not in text:
            raise AssertionError(f"Codespace wake workflow missing contract: {needle}")

    helper_required = (
        "https://api.github.com/user/codespaces?per_page=100",
        "/start",
        '== "Available"',
        "CodespaceApiError",
        "status_code != 409",
    )
    for needle in helper_required:
        if needle not in helper:
            raise AssertionError(f"shared Codespace lifecycle helper missing contract: {needle}")

    workflow_forbidden = (
        "https://api.github.com/user/codespaces",
        "urllib.request",
        "urllib.error",
    )
    for needle in workflow_forbidden:
        if needle in text:
            raise AssertionError(f"Codespace wake workflow must delegate lifecycle implementation to helper: {needle}")

    semantic_forbidden = (
        "episode:spec:preview",
        "episode:spec:final",
        "GEMINI_API_KEY",
        "render-specs/",
        "motion-preview-requests/",
    )
    for needle in semantic_forbidden:
        if needle in text or needle in helper:
            raise AssertionError(f"Codespace wake path must not depend on production/render semantics: {needle}")
    print("Codespace wake gateway contract PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
