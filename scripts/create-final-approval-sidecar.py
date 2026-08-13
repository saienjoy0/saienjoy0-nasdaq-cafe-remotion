#!/usr/bin/env python3
"""Create the Remotion Final authorization sidecar from Plot approval evidence."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


class SidecarError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SidecarError(f"Plot authorization invalid: {exc}") from exc
    if not isinstance(value, dict):
        raise SidecarError("Plot authorization root must be an object")
    return value


def build_sidecar(*, authorization_path: Path, plot_commit: str) -> dict:
    authorization_path = authorization_path.resolve()
    if not authorization_path.is_file():
        raise SidecarError(f"Plot authorization missing: {authorization_path}")
    if not re.fullmatch(r"[0-9a-f]{40}", plot_commit):
        raise SidecarError("plot commit must be 40 lowercase hex characters")
    value = load(authorization_path)
    date = value.get("episode_date")
    if value.get("contractVersion") != "1.0.0":
        raise SidecarError("Plot authorization contractVersion must be 1.0.0")
    if not isinstance(date, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise SidecarError("Plot authorization episode_date is invalid")
    if value.get("status") != "approved" or value.get("final_requested") is not True:
        raise SidecarError("Plot authorization must be explicit approved Final evidence")
    required_hashes = (
        "renderSpecSha256",
        "previewSha256",
        "previewTechnicalReportSha256",
        "humanPreviewReviewSha256",
        "visualIntelligencePackageSha256",
        "visualIntelligenceValidationSha256",
    )
    for key in required_hashes:
        if not re.fullmatch(r"[0-9a-f]{64}", str(value.get(key, ""))):
            raise SidecarError(f"Plot authorization {key} is invalid")
    run_id = str(value.get("previewRunId", ""))
    if not re.fullmatch(r"[0-9]+", run_id):
        raise SidecarError("Plot authorization previewRunId is invalid")
    auth_path = f"verification/{date}/final_render_authorization.json"
    return {
        "contractVersion": "1.0.0",
        "episodeDate": date,
        "expectedSpecSha256": value["renderSpecSha256"],
        "previewRunId": run_id,
        "approvedPreviewSha256": value["previewSha256"],
        "previewTechnicalReportSha256": value["previewTechnicalReportSha256"],
        "plotAuthorizationCommit": plot_commit,
        "plotAuthorizationPath": auth_path,
        "plotAuthorizationSha256": sha256_file(authorization_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plot-authorization", required=True, type=Path)
    parser.add_argument("--plot-commit", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = build_sidecar(
            authorization_path=args.plot_authorization,
            plot_commit=args.plot_commit,
        )
    except SidecarError as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}, ensure_ascii=False, indent=2))
        return 2
    output = args.output or Path("final-render-authorizations") / f"{result['episodeDate']}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"status": "PASS", "output": str(output), **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
