#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

SHA256_RE = re.compile(r"[0-9a-f]{64}")
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")


class VerificationError(ValueError):
    pass


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VerificationError(f"{label} invalid: {exc}") from exc
    if not isinstance(value, dict):
        raise VerificationError(f"{label} must be an object")
    return value


def one(root: Path, name: str) -> Path:
    matches = [path for path in root.rglob(name) if path.is_file()]
    if len(matches) != 1:
        raise VerificationError(f"expected exactly one {name}; found {len(matches)}")
    return matches[0]


def require_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SHA256_RE.fullmatch(value):
        raise VerificationError(f"{label} must be SHA-256")
    return value


def same(value: dict[str, Any], key: str, expected: Any, label: str) -> None:
    if value.get(key) != expected:
        raise VerificationError(f"{label} {key} mismatch")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--episode-date", required=True)
    parser.add_argument("--preview-run-id", type=int, required=True)
    parser.add_argument("--approved-preview-sha256", required=True)
    parser.add_argument("--preview-identity-sha256", required=True)
    parser.add_argument("--manifest-sha256", required=True)
    parser.add_argument("--human-review-sha256", required=True)
    parser.add_argument("--final-authorization-sha256", required=True)
    args = parser.parse_args()
    try:
        if not DATE_RE.fullmatch(args.episode_date):
            raise VerificationError("bad episode date")
        if args.preview_run_id <= 0:
            raise VerificationError("bad preview run id")
        for value, label in (
            (args.approved_preview_sha256, "approved preview SHA"),
            (args.preview_identity_sha256, "preview identity SHA"),
            (args.manifest_sha256, "manifest SHA"),
            (args.human_review_sha256, "human review SHA"),
            (args.final_authorization_sha256, "Final authorization SHA"),
        ):
            require_sha(value, label)
        root = args.root.resolve()
        manifest_path = one(root, "final_authorization_manifest.json")
        review_path = one(root, "human_preview_review.json")
        authorization_path = one(root, "final_render_authorization.json")
        if sha256(manifest_path) != args.manifest_sha256:
            raise VerificationError("authorization manifest SHA mismatch")
        if sha256(review_path) != args.human_review_sha256:
            raise VerificationError("human review SHA mismatch")
        if sha256(authorization_path) != args.final_authorization_sha256:
            raise VerificationError("Final authorization SHA mismatch")
        manifest = load(manifest_path, "authorization manifest")
        review = load(review_path, "human Preview review")
        authorization = load(authorization_path, "Final authorization")
        manifest_required = {
            "contractVersion", "episodeDate", "previewRunId", "approvedPreviewSha256",
            "previewIdentitySha256", "humanPreviewReviewSha256", "plotFinalAuthorizationSha256",
        }
        review_required = {
            "contractVersion", "status", "episodeDate", "previewRunId",
            "approvedPreviewSha256", "previewIdentitySha256",
        }
        authorization_required = {
            "contractVersion", "status", "episodeDate", "previewRunId",
            "approvedPreviewSha256", "previewIdentitySha256", "humanPreviewReviewSha256",
            "finalAuthorized",
        }
        if set(manifest) != manifest_required:
            raise VerificationError(f"authorization manifest fields mismatch: {sorted(manifest)}")
        if set(review) != review_required:
            raise VerificationError(f"human review fields mismatch: {sorted(review)}")
        if set(authorization) != authorization_required:
            raise VerificationError(f"Final authorization fields mismatch: {sorted(authorization)}")
        if manifest["contractVersion"] != "1.0.0" or review["contractVersion"] != "1.0.0" or authorization["contractVersion"] != "1.0.0":
            raise VerificationError("authorization contractVersion mismatch")
        if review["status"] != "approved":
            raise VerificationError("human review is not approved")
        if authorization["status"] != "approved" or authorization["finalAuthorized"] is not True:
            raise VerificationError("Final authorization is not approved")
        expected_pairs = (
            ("episodeDate", args.episode_date),
            ("previewRunId", args.preview_run_id),
            ("approvedPreviewSha256", args.approved_preview_sha256),
            ("previewIdentitySha256", args.preview_identity_sha256),
        )
        for key, expected in expected_pairs:
            same(manifest, key, expected, "manifest")
            same(review, key, expected, "review")
            same(authorization, key, expected, "authorization")
        same(manifest, "humanPreviewReviewSha256", args.human_review_sha256, "manifest")
        same(manifest, "plotFinalAuthorizationSha256", args.final_authorization_sha256, "manifest")
        same(authorization, "humanPreviewReviewSha256", args.human_review_sha256, "authorization")
    except VerificationError as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}))
        return 2
    print(json.dumps({"status": "PASS", "episodeDate": args.episode_date, "previewRunId": args.preview_run_id}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
