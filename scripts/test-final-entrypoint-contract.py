#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUEST = ROOT / ".github/workflows/nasdaq-cafe-final-request.yml"
FINAL = ROOT / ".github/workflows/nasdaq-cafe-final.yml"


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise AssertionError(f"{label}: missing required contract marker: {needle}")


def forbid(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise AssertionError(f"{label}: forbidden contract marker present: {needle}")


def main() -> int:
    request = REQUEST.read_text(encoding="utf-8")
    final = FINAL.read_text(encoding="utf-8")

    # The only public Final trigger is an append-only request commit on main.
    require(request, 'paths:\n      - "final-render-requests/*.json"', "Final Request")
    forbid(request, "  schedule:", "Final Request")
    forbid(request, "  workflow_dispatch:", "Final Request")
    require(request, 'value["requestVersion"] != "1.1"', "Final Request")
    require(request, 'value["confirmation"] != "FINAL_RENDER"', "Final Request")

    # The existing strong lineage validator is mandatory before runner wake/render.
    require(request, "scripts/validate-final-approval-lineage.py", "Final Request")
    require(request, "scripts/create-final-approval-sidecar.py", "Final Request")
    require(request, "needs: [resolve-request, validate-lineage]", "Final Request")
    require(request, "needs: [resolve-request, validate-lineage, wake-codespace]", "Final Request")
    require(request, "approval_artifact_name:", "Final Request")

    # Final is reusable-only. Direct manual dispatch must not exist.
    require(final, "  workflow_call:", "Final")
    forbid(final, "  workflow_dispatch:", "Final")
    require(final, "github.workflow == 'Nasdaq Cafe Final Request'", "Final")
    require(final, "Restore validated Final approval sidecar", "Final")
    require(final, ".final-lineage/final_approval_lineage.json", "Final")
    require(final, "final-render-authorizations/${EPISODE_DATE}.json", "Final")

    # Final still carries the existing independent runtime preflight via load-render-spec.
    load_render = (ROOT / "scripts/load-render-spec.ts").read_text(encoding="utf-8")
    require(load_render, "verifyFinalApprovalPreflight", "load-render-spec")
    preflight = (ROOT / "scripts/final-approval-preflight.ts").read_text(encoding="utf-8")
    require(preflight, "E_FINAL_APPROVAL_REQUEST_ROUTE_REQUIRED", "final-approval-preflight")

    print("Final entrypoint contract tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
