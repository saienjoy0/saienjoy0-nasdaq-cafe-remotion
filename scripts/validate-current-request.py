#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

SHA256_RE = re.compile(r"[0-9a-f]{64}")
COMMIT_RE = re.compile(r"[0-9a-f]{40}")
DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
SAFE_NAME_RE = re.compile(r"[A-Za-z0-9._-]+")
PREVIEW_REQUEST_DIR = "handoff-preview-requests-v4"


class RequestError(ValueError):
    pass


def load(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RequestError(f"invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise RequestError("request root must be an object")
    return value


def require_sha(value: Any, label: str) -> str:
    if not isinstance(value, str) or not SHA256_RE.fullmatch(value):
        raise RequestError(f"{label} must be SHA-256")
    return value


def require_commit(value: Any, label: str) -> str:
    if not isinstance(value, str) or not COMMIT_RE.fullmatch(value):
        raise RequestError(f"{label} must be 40-hex")
    return value


def final_fingerprint(*, preview_identity_sha: str, preview_sha: str, authorization_sha: str, renderer_commit: str) -> str:
    payload = "\n".join((preview_identity_sha, preview_sha, authorization_sha, renderer_commit)).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def validate_preview(value: dict[str, Any]) -> dict[str, str]:
    required = {
        "contractVersion", "episodeDate", "plotRunId", "handoffArtifactName",
        "expectedBundleId", "expectedManifestSha256", "expectedRendererCommit",
        "expectedRendererContractVersion", "expectedRegistrySnapshotSha256", "confirmation",
    }
    if set(value) != required:
        raise RequestError(f"preview fields mismatch: {sorted(value)}")
    if value["contractVersion"] != "2.1.0" or value["confirmation"] != "PREVIEW":
        raise RequestError("preview contract/confirmation mismatch")
    if not isinstance(value["episodeDate"], str) or not DATE_RE.fullmatch(value["episodeDate"]):
        raise RequestError("bad episodeDate")
    if not isinstance(value["plotRunId"], int) or isinstance(value["plotRunId"], bool) or value["plotRunId"] <= 0:
        raise RequestError("bad plotRunId")
    if not isinstance(value["handoffArtifactName"], str) or not SAFE_NAME_RE.fullmatch(value["handoffArtifactName"]):
        raise RequestError("unsafe handoffArtifactName")
    expected_artifact_name = f"nasdaq-cafe-handoff-{value['episodeDate']}-{value['plotRunId']}"
    if value["handoffArtifactName"] != expected_artifact_name:
        raise RequestError("handoffArtifactName is not bound to episodeDate/plotRunId")
    for key in ("expectedBundleId", "expectedManifestSha256", "expectedRegistrySnapshotSha256"):
        require_sha(value[key], key)
    require_commit(value["expectedRendererCommit"], "expectedRendererCommit")
    if not isinstance(value["expectedRendererContractVersion"], str) or not value["expectedRendererContractVersion"]:
        raise RequestError("bad expectedRendererContractVersion")
    return {
        "episode_date": value["episodeDate"],
        "plot_run_id": str(value["plotRunId"]),
        "artifact_name": value["handoffArtifactName"],
        "bundle_id": value["expectedBundleId"],
        "manifest_sha": value["expectedManifestSha256"],
        "renderer_commit": value["expectedRendererCommit"],
        "renderer_contract": value["expectedRendererContractVersion"],
        "registry_sha": value["expectedRegistrySnapshotSha256"],
    }


def require_preview_publication_path(path: Path, value: dict[str, Any]) -> str:
    """Require the Plot-issued deterministic append-only request identity."""
    request_sha = hashlib.sha256(path.read_bytes()).hexdigest()
    expected = (
        f"{PREVIEW_REQUEST_DIR}/{value['episodeDate']}-plot-"
        f"{value['plotRunId']}-{request_sha[:12]}.json"
    )
    actual = path.as_posix()
    while actual.startswith("./"):
        actual = actual[2:]
    if actual != expected:
        raise RequestError(f"preview publication path mismatch: expected {expected}, got {actual}")
    return request_sha


def validate_final(value: dict[str, Any]) -> dict[str, str]:
    required = {
        "requestVersion", "episodeDate", "previewRunId", "approvedPreviewSha256",
        "previewIdentitySha256", "rendererCommit", "rendererContractVersion",
        "registrySnapshotSha256", "renderSpecSha256", "ttsInputSha256",
        "ttsBlockAudioSha256", "plotAuthorizationRunId", "plotAuthorizationArtifactName",
        "plotAuthorizationManifestSha256", "humanPreviewReviewSha256",
        "plotFinalAuthorizationSha256", "finalFingerprint", "confirmation",
    }
    if set(value) != required:
        raise RequestError(f"final fields mismatch: {sorted(value)}")
    if value["requestVersion"] != "2.1.0" or value["confirmation"] != "FINAL_RENDER":
        raise RequestError("Final request contract/confirmation mismatch")
    if not isinstance(value["episodeDate"], str) or not DATE_RE.fullmatch(value["episodeDate"]):
        raise RequestError("bad episodeDate")
    for key in ("previewRunId", "plotAuthorizationRunId"):
        if not isinstance(value[key], int) or isinstance(value[key], bool) or value[key] <= 0:
            raise RequestError(f"bad {key}")
    for key in (
        "approvedPreviewSha256", "previewIdentitySha256", "registrySnapshotSha256",
        "renderSpecSha256", "ttsInputSha256", "plotAuthorizationManifestSha256",
        "humanPreviewReviewSha256", "plotFinalAuthorizationSha256", "finalFingerprint",
    ):
        require_sha(value[key], key)
    require_commit(value["rendererCommit"], "rendererCommit")
    if not isinstance(value["rendererContractVersion"], str) or not value["rendererContractVersion"]:
        raise RequestError("bad rendererContractVersion")
    if not isinstance(value["plotAuthorizationArtifactName"], str) or not SAFE_NAME_RE.fullmatch(value["plotAuthorizationArtifactName"]):
        raise RequestError("unsafe plotAuthorizationArtifactName")
    audio = value["ttsBlockAudioSha256"]
    if not isinstance(audio, dict) or set(audio) != {"scenes-01-04", "scenes-05-09"}:
        raise RequestError("audio block map mismatch")
    for block, digest in audio.items():
        require_sha(digest, f"ttsBlockAudioSha256.{block}")
    expected = final_fingerprint(
        preview_identity_sha=value["previewIdentitySha256"],
        preview_sha=value["approvedPreviewSha256"],
        authorization_sha=value["plotFinalAuthorizationSha256"],
        renderer_commit=value["rendererCommit"],
    )
    if value["finalFingerprint"] != expected:
        raise RequestError("finalFingerprint mismatch")
    return {
        "episode_date": value["episodeDate"],
        "preview_run_id": str(value["previewRunId"]),
        "preview_sha": value["approvedPreviewSha256"],
        "identity_sha": value["previewIdentitySha256"],
        "renderer_commit": value["rendererCommit"],
        "renderer_contract": value["rendererContractVersion"],
        "registry_sha": value["registrySnapshotSha256"],
        "spec_sha": value["renderSpecSha256"],
        "tts_input_sha": value["ttsInputSha256"],
        "audio_01_04_sha": audio["scenes-01-04"],
        "audio_05_09_sha": audio["scenes-05-09"],
        "authorization_run_id": str(value["plotAuthorizationRunId"]),
        "authorization_artifact_name": value["plotAuthorizationArtifactName"],
        "authorization_manifest_sha": value["plotAuthorizationManifestSha256"],
        "human_review_sha": value["humanPreviewReviewSha256"],
        "final_authorization_sha": value["plotFinalAuthorizationSha256"],
        "final_fingerprint": value["finalFingerprint"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("kind", choices=("preview", "final"))
    parser.add_argument("path", type=Path)
    parser.add_argument("--github-output", type=Path)
    parser.add_argument("--require-publication-path", action="store_true")
    args = parser.parse_args()
    try:
        value = load(args.path)
        outputs = validate_preview(value) if args.kind == "preview" else validate_final(value)
        if args.require_publication_path:
            if args.kind != "preview":
                raise RequestError("--require-publication-path is Preview-only")
            outputs["request_sha256"] = require_preview_publication_path(args.path, value)
            outputs["request_path"] = args.path.as_posix()
    except (OSError, RequestError) as exc:
        print(json.dumps({"status": "FAIL", "error": str(exc)}))
        return 2
    if args.github_output:
        with args.github_output.open("a", encoding="utf-8") as handle:
            for key, output in outputs.items():
                handle.write(f"{key}={output}\n")
    print(json.dumps({"status": "PASS", "kind": args.kind, "path": str(args.path)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
