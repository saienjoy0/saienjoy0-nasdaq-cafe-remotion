#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "final_approval_lineage",
    ROOT / "scripts/validate-final-approval-lineage.py",
)
if not SPEC or not SPEC.loader:
    raise SystemExit("cannot import final approval lineage validator")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

DATE = "2099-05-05"
RUN_ID = "987654321"
PLOT_COMMIT = "a" * 40


def write(path: Path, value: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def build_fixture(root: Path):
    spec = write(root / "render_spec.json", {"episode": {"targetDate": DATE}})
    mp4 = root / "preview.mp4"
    mp4.write_bytes(b"approved-preview")
    preview_sha = module.sha256_file(mp4)
    technical = write(root / "technical_report.json", {
        "status": "preview-generated",
        "episodeId": DATE,
        "inputSpecSha256": module.sha256_file(spec),
        "previewPath": "renders/preview/approved.mp4",
    })
    review = write(root / "human_preview_review.json", {
        "contractVersion": "1.0.0",
        "episodeDate": DATE,
        "previewSha256": preview_sha,
        "status": "approved",
        "reviewedAt": "2099-05-05T10:00:00Z",
    })
    auth = write(root / "final_render_authorization.json", {
        "contractVersion": "1.0.0",
        "episode_date": DATE,
        "status": "approved",
        "final_requested": True,
        "renderSpecSha256": module.sha256_file(spec),
        "previewRunId": RUN_ID,
        "previewSha256": preview_sha,
        "previewTechnicalReportSha256": module.sha256_file(technical),
        "humanPreviewReviewPath": f"verification/{DATE}/human_preview_review.json",
        "humanPreviewReviewSha256": module.sha256_file(review),
        "visualIntelligencePackageSha256": "b" * 64,
        "visualIntelligenceValidationSha256": "c" * 64,
    })
    request = write(root / "request.json", {
        "requestVersion": "1.1",
        "episodeDate": DATE,
        "expectedSpecSha256": module.sha256_file(spec),
        "plotAuthorizationCommit": PLOT_COMMIT,
        "plotAuthorizationPath": f"verification/{DATE}/final_render_authorization.json",
        "plotAuthorizationSha256": module.sha256_file(auth),
        "previewRunId": RUN_ID,
        "approvedPreviewSha256": preview_sha,
        "confirmation": "FINAL_RENDER",
    })
    return request, auth, review, mp4, technical, spec


def validate(paths):
    request, auth, review, mp4, technical, spec = paths
    return module.validate_lineage(
        request_path=request,
        authorization_path=auth,
        human_review_path=review,
        preview_mp4_path=mp4,
        technical_report_path=technical,
        render_spec_path=spec,
    )


def expect_failure(paths, needle: str):
    try:
        validate(paths)
    except module.FinalApprovalLineageError as exc:
        if needle not in str(exc):
            raise AssertionError(f"expected {needle!r}, got {exc}") from exc
    else:
        raise AssertionError("expected FinalApprovalLineageError")


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="nasdaq-final-lineage-") as temp:
        root = Path(temp)
        paths = build_fixture(root)
        result = validate(paths)
        assert result["status"] == "PASS"
        assert result["approvedPreviewSha256"] == module.sha256_file(paths[3])

        request = json.loads(paths[0].read_text())
        request["requestVersion"] = "1.0"
        write(paths[0], request)
        expect_failure(paths, "requestVersion")

        paths = build_fixture(root)
        paths[3].write_bytes(b"different-preview")
        expect_failure(paths, "approved Preview SHA")

        paths = build_fixture(root)
        technical = json.loads(paths[4].read_text())
        technical["inputSpecSha256"] = "d" * 64
        write(paths[4], technical)
        # The authorization now points to stale technical-report bytes, so either
        # report-SHA or spec lineage must fail closed.
        expect_failure(paths, "technical report SHA")

    print("final approval lineage tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
