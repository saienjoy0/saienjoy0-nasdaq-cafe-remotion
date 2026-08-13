#!/usr/bin/env python3
"""Validate Final authorization against the exact approved Preview bytes.

This is intentionally mechanical. It does not decide whether the Preview looks
good; the human approval record already owns that decision. It only proves that
Final targets the same render_spec and Preview bytes the user approved.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any


class FinalApprovalLineageError(ValueError):
    pass


def load_json(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise FinalApprovalLineageError(f"{label} invalid: {exc}") from exc
    if not isinstance(value, dict):
        raise FinalApprovalLineageError(f"{label} root must be an object")
    return value


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_file(path: Path, label: str) -> Path:
    if not path.is_file():
        raise FinalApprovalLineageError(f"{label} missing: {path}")
    return path


def validate_lineage(
    *,
    request_path: Path,
    authorization_path: Path,
    human_review_path: Path,
    preview_mp4_path: Path,
    technical_report_path: Path,
    render_spec_path: Path,
) -> dict[str, Any]:
    request_path = require_file(request_path, "Final request")
    authorization_path = require_file(authorization_path, "Plot Final authorization")
    human_review_path = require_file(human_review_path, "human Preview review")
    preview_mp4_path = require_file(preview_mp4_path, "approved Preview MP4")
    technical_report_path = require_file(technical_report_path, "Preview technical report")
    render_spec_path = require_file(render_spec_path, "Final render_spec")

    request = load_json(request_path, "Final request")
    required = {
        "requestVersion",
        "episodeDate",
        "expectedSpecSha256",
        "plotAuthorizationCommit",
        "plotAuthorizationPath",
        "plotAuthorizationSha256",
        "previewRunId",
        "approvedPreviewSha256",
        "confirmation",
    }
    if set(request) != required:
        raise FinalApprovalLineageError(
            f"Final request fields mismatch: {sorted(request)}"
        )
    if request["requestVersion"] != "1.1":
        raise FinalApprovalLineageError("Final requestVersion must be 1.1")
    if request["confirmation"] != "FINAL_RENDER":
        raise FinalApprovalLineageError("Final confirmation must be FINAL_RENDER")
    date = request["episodeDate"]
    if not isinstance(date, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise FinalApprovalLineageError("Final episodeDate must be YYYY-MM-DD")
    if not re.fullmatch(r"[0-9a-f]{64}", str(request["expectedSpecSha256"])):
        raise FinalApprovalLineageError("expectedSpecSha256 must be SHA-256")
    if not re.fullmatch(r"[0-9a-f]{40}", str(request["plotAuthorizationCommit"])):
        raise FinalApprovalLineageError("plotAuthorizationCommit must be 40-hex")
    expected_auth_path = f"verification/{date}/final_render_authorization.json"
    if request["plotAuthorizationPath"] != expected_auth_path:
        raise FinalApprovalLineageError(
            f"plotAuthorizationPath must be {expected_auth_path}"
        )
    if not re.fullmatch(r"[0-9]+", str(request["previewRunId"])):
        raise FinalApprovalLineageError("previewRunId must be numeric")
    for key in ("plotAuthorizationSha256", "approvedPreviewSha256"):
        if not re.fullmatch(r"[0-9a-f]{64}", str(request[key])):
            raise FinalApprovalLineageError(f"{key} must be SHA-256")

    if sha256_file(authorization_path) != request["plotAuthorizationSha256"]:
        raise FinalApprovalLineageError("Plot Final authorization SHA mismatch")
    if sha256_file(render_spec_path) != request["expectedSpecSha256"]:
        raise FinalApprovalLineageError("Final render_spec SHA mismatch")
    actual_preview_sha = sha256_file(preview_mp4_path)
    if actual_preview_sha != request["approvedPreviewSha256"]:
        raise FinalApprovalLineageError("Preview artifact SHA is not the approved Preview SHA")

    authorization = load_json(authorization_path, "Plot Final authorization")
    if authorization.get("contractVersion") != "1.0.0":
        raise FinalApprovalLineageError("Plot Final authorization contractVersion mismatch")
    if authorization.get("episode_date") != date:
        raise FinalApprovalLineageError("Plot Final authorization episode mismatch")
    if authorization.get("status") != "approved" or authorization.get("final_requested") is not True:
        raise FinalApprovalLineageError("Plot Final authorization is not explicit approved Final evidence")
    if authorization.get("renderSpecSha256") != request["expectedSpecSha256"]:
        raise FinalApprovalLineageError("authorization/render_spec SHA mismatch")
    if str(authorization.get("previewRunId")) != str(request["previewRunId"]):
        raise FinalApprovalLineageError("authorization/Preview run mismatch")
    if authorization.get("previewSha256") != actual_preview_sha:
        raise FinalApprovalLineageError("authorization/Preview SHA mismatch")
    if authorization.get("humanPreviewReviewPath") != f"verification/{date}/human_preview_review.json":
        raise FinalApprovalLineageError("authorization human Preview review path mismatch")
    if authorization.get("humanPreviewReviewSha256") != sha256_file(human_review_path):
        raise FinalApprovalLineageError("human Preview review SHA mismatch")
    if authorization.get("previewTechnicalReportSha256") != sha256_file(technical_report_path):
        raise FinalApprovalLineageError("Preview technical report SHA mismatch")

    review = load_json(human_review_path, "human Preview review")
    if review.get("contractVersion") != "1.0.0" or review.get("episodeDate") != date:
        raise FinalApprovalLineageError("human Preview review identity mismatch")
    if review.get("status") != "approved" or review.get("previewSha256") != actual_preview_sha:
        raise FinalApprovalLineageError("human Preview review does not approve these Preview bytes")

    technical = load_json(technical_report_path, "Preview technical report")
    if technical.get("status") != "preview-generated":
        raise FinalApprovalLineageError("Preview technical report is not preview-generated")
    episode = technical.get("episodeId") or technical.get("episodeDate")
    if episode != date:
        raise FinalApprovalLineageError("Preview technical report episode mismatch")
    if technical.get("inputSpecSha256") != request["expectedSpecSha256"]:
        raise FinalApprovalLineageError("approved Preview was rendered from a different render_spec")

    return {
        "status": "PASS",
        "episodeDate": date,
        "renderSpecSha256": request["expectedSpecSha256"],
        "previewRunId": str(request["previewRunId"]),
        "approvedPreviewSha256": actual_preview_sha,
        "plotAuthorizationCommit": request["plotAuthorizationCommit"],
        "plotAuthorizationSha256": request["plotAuthorizationSha256"],
        "humanPreviewReviewSha256": sha256_file(human_review_path),
        "previewTechnicalReportSha256": sha256_file(technical_report_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", required=True, type=Path)
    parser.add_argument("--authorization", required=True, type=Path)
    parser.add_argument("--human-review", required=True, type=Path)
    parser.add_argument("--preview-mp4", required=True, type=Path)
    parser.add_argument("--technical-report", required=True, type=Path)
    parser.add_argument("--render-spec", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = validate_lineage(
            request_path=args.request,
            authorization_path=args.authorization,
            human_review_path=args.human_review,
            preview_mp4_path=args.preview_mp4,
            technical_report_path=args.technical_report,
            render_spec_path=args.render_spec,
        )
        code = 0
    except FinalApprovalLineageError as exc:
        result = {"status": "FAIL", "error": str(exc)}
        code = 2
    text = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    print(text, end="")
    return code


if __name__ == "__main__":
    raise SystemExit(main())
