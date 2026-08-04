#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import math
import pathlib
import re
import subprocess
from datetime import datetime, timezone
from typing import Any

REQUEST_PATH_RE = re.compile(r"^motion-preview-requests/[A-Za-z0-9._-]+\.json$")
OUTCOME_PATH_RE = re.compile(r"^motion-preview-state/outcomes/[0-9a-f]{64}\.json$")
SHA256_RE = re.compile(r"^[0-9a-fA-F]{64}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
REQUIRED_FIELDS = {
    "requestVersion",
    "episodeDate",
    "expectedSpecSha256",
    "sceneNumber",
    "offsetSeconds",
    "durationSeconds",
    "confirmation",
}


def git_lines(root: pathlib.Path, *args: str) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=root,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def encode_error(message: str) -> str:
    return base64.urlsafe_b64encode(message.encode("utf-8")).decode("ascii")


def decode_error(value: str) -> str:
    if not value:
        return ""
    return base64.urlsafe_b64decode(value.encode("ascii")).decode("utf-8")


def request_fingerprint(relative_path: str, payload: bytes) -> str:
    digest = hashlib.sha256()
    digest.update(relative_path.encode("utf-8"))
    digest.update(b"\0")
    digest.update(payload)
    return digest.hexdigest()


def outcome_path_for(root: pathlib.Path, fingerprint: str) -> pathlib.Path:
    return root / "motion-preview-state" / "outcomes" / f"{fingerprint}.json"


def rejected_request(
    root: pathlib.Path,
    relative_path: str,
    raw_bytes: bytes,
    error: Exception | str,
) -> tuple[dict[str, str] | None, pathlib.Path]:
    fingerprint = request_fingerprint(relative_path, raw_bytes)
    outcome_path = outcome_path_for(root, fingerprint)
    if outcome_path.exists():
        return None, outcome_path
    return (
        {
            "request_valid": "false",
            "request_path": relative_path,
            "request_fingerprint": fingerprint,
            "outcome_path": outcome_path.relative_to(root).as_posix(),
            "validation_error_b64": encode_error(str(error)),
        },
        outcome_path,
    )


def inspect_request(
    root: pathlib.Path, relative_path: str
) -> tuple[dict[str, str] | None, pathlib.Path]:
    if not REQUEST_PATH_RE.fullmatch(relative_path):
        return rejected_request(
            root,
            relative_path,
            relative_path.encode("utf-8"),
            "invalid request path",
        )

    request_path = root / relative_path
    if request_path.is_symlink() or not request_path.is_file():
        return rejected_request(
            root,
            relative_path,
            relative_path.encode("utf-8"),
            "request must be a regular file",
        )

    raw_bytes = request_path.read_bytes()
    if not raw_bytes:
        return rejected_request(root, relative_path, raw_bytes, "request must be non-empty")

    try:
        value = json.loads(raw_bytes.decode("utf-8"))
        if not isinstance(value, dict) or set(value) != REQUIRED_FIELDS:
            actual = sorted(value) if isinstance(value, dict) else type(value).__name__
            raise ValueError(
                f"request fields must be exactly {sorted(REQUIRED_FIELDS)}; got {actual}"
            )
        if value["requestVersion"] != "1.0":
            raise ValueError("requestVersion must be 1.0")

        episode_date = value["episodeDate"]
        if not isinstance(episode_date, str) or not DATE_RE.fullmatch(episode_date):
            raise ValueError("episodeDate must match YYYY-MM-DD")

        expected_sha = value["expectedSpecSha256"]
        if not isinstance(expected_sha, str) or not SHA256_RE.fullmatch(expected_sha):
            raise ValueError("expectedSpecSha256 must be a 64-character SHA-256")
        expected_sha = expected_sha.lower()

        scene_number = value["sceneNumber"]
        if (
            not isinstance(scene_number, int)
            or isinstance(scene_number, bool)
            or not 1 <= scene_number <= 9
        ):
            raise ValueError("sceneNumber must be an integer from 1 through 9")

        offset = value["offsetSeconds"]
        duration = value["durationSeconds"]
        if (
            not isinstance(offset, (int, float))
            or isinstance(offset, bool)
            or not math.isfinite(offset)
            or offset < 0
        ):
            raise ValueError("offsetSeconds must be finite and non-negative")
        if (
            not isinstance(duration, (int, float))
            or isinstance(duration, bool)
            or not math.isfinite(duration)
            or duration <= 0
            or duration > 30
        ):
            raise ValueError("durationSeconds must be greater than 0 and at most 30")
        if value["confirmation"] != "MOTION":
            raise ValueError("confirmation must be MOTION")

        canonical = json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        fingerprint = request_fingerprint(relative_path, canonical)
        outcome_path = outcome_path_for(root, fingerprint)
        if outcome_path.exists():
            return None, outcome_path

        spec_path = root / "render-specs" / episode_date / "render_spec.json"
        if not spec_path.is_file() or spec_path.stat().st_size == 0:
            raise ValueError(f"render spec not found: {spec_path.relative_to(root)}")
        actual_sha = hashlib.sha256(spec_path.read_bytes()).hexdigest()
        if actual_sha != expected_sha:
            raise ValueError(
                f"render_spec SHA-256 mismatch: expected={expected_sha} actual={actual_sha}"
            )
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
        return rejected_request(root, relative_path, raw_bytes, error)

    return (
        {
            "request_valid": "true",
            "request_path": relative_path,
            "request_fingerprint": fingerprint,
            "outcome_path": outcome_path.relative_to(root).as_posix(),
            "validation_error_b64": "",
            "episode_date": episode_date,
            "expected_spec_sha256": actual_sha,
            "scene_number": str(scene_number),
            "offset_seconds": str(offset),
            "duration_seconds": str(duration),
        },
        outcome_path,
    )


def push_candidates(
    root: pathlib.Path, before_sha: str, trigger_sha: str
) -> list[str]:
    if not trigger_sha:
        raise ValueError("push trigger SHA is required")
    if before_sha and re.fullmatch(r"0+", before_sha):
        changed = git_lines(
            root,
            "show",
            "--format=",
            "--name-status",
            trigger_sha,
            "--",
            "motion-preview-requests/*.json",
        )
    else:
        if not before_sha:
            raise ValueError("push before SHA is required")
        changed = git_lines(
            root,
            "diff",
            "--name-status",
            before_sha,
            trigger_sha,
            "--",
            "motion-preview-requests/*.json",
        )
    if len(changed) != 1:
        raise ValueError(
            f"push must add exactly one motion-preview request; found {len(changed)} changes"
        )
    parts = changed[0].split("\t")
    if len(parts) != 2 or parts[0] != "A":
        raise ValueError(
            "motion-preview requests are append-only; "
            f"expected one added file, got: {changed[0]}"
        )
    return [parts[1]]


def scheduled_candidates(root: pathlib.Path) -> list[str]:
    request_dir = root / "motion-preview-requests"
    if not request_dir.is_dir():
        return []
    return [path.relative_to(root).as_posix() for path in sorted(request_dir.glob("*.json"))]


def resolve_request(
    root: pathlib.Path,
    event_name: str,
    before_sha: str,
    trigger_sha: str,
) -> dict[str, str]:
    candidates = (
        push_candidates(root, before_sha, trigger_sha)
        if event_name == "push"
        else scheduled_candidates(root)
    )
    for relative_path in candidates:
        request, _ = inspect_request(root, relative_path)
        if request is not None:
            return {"has_request": "true", **request}
    return {"has_request": "false"}


def write_outputs(path: pathlib.Path, values: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as output:
        for key, value in values.items():
            if "\n" in value or "\r" in value:
                raise ValueError(f"output contains a newline: {key}")
            output.write(f"{key}={value}\n")


def optional_int(value: str) -> int | None:
    return int(value) if value else None


def optional_float(value: str) -> float | None:
    return float(value) if value else None


def record_outcome(root: pathlib.Path, args: argparse.Namespace) -> str:
    if not OUTCOME_PATH_RE.fullmatch(args.outcome_path):
        raise ValueError("unsafe outcome path")
    if not re.fullmatch(r"[0-9a-f]{64}", args.request_fingerprint):
        raise ValueError("unsafe request fingerprint")

    outcome_path = root / args.outcome_path
    if outcome_path.exists():
        return "existing"

    request_valid = args.request_valid == "true"
    if not request_valid:
        status = "rejected"
        stage = "validation"
    elif args.wake_result != "success":
        status = "failed"
        stage = "wake-codespace"
    elif args.render_result == "success":
        status = "succeeded"
        stage = "complete"
    else:
        status = "failed"
        stage = "render-motion-preview"

    payload: dict[str, Any] = {
        "outcomeVersion": "1.0",
        "status": status,
        "stage": stage,
        "requestPath": args.request_path,
        "requestFingerprint": args.request_fingerprint,
        "requestValid": request_valid,
        "validationError": decode_error(args.validation_error_b64) or None,
        "episodeDate": args.episode_date or None,
        "expectedSpecSha256": args.expected_spec_sha256 or None,
        "sceneNumber": optional_int(args.scene_number),
        "offsetSeconds": optional_float(args.offset_seconds),
        "durationSeconds": optional_float(args.duration_seconds),
        "wakeResult": args.wake_result or None,
        "renderResult": args.render_result or None,
        "workflow": args.workflow,
        "runId": args.run_id,
        "recordedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    outcome_path.parent.mkdir(parents=True, exist_ok=True)
    outcome_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return status


def parser() -> argparse.ArgumentParser:
    root_parser = argparse.ArgumentParser()
    root_parser.add_argument("--root", type=pathlib.Path, default=pathlib.Path.cwd())
    subparsers = root_parser.add_subparsers(dest="command", required=True)

    resolve = subparsers.add_parser("resolve")
    resolve.add_argument("--event-name", required=True)
    resolve.add_argument("--before-sha", default="")
    resolve.add_argument("--trigger-sha", default="")
    resolve.add_argument("--output", type=pathlib.Path, required=True)

    record = subparsers.add_parser("record")
    record.add_argument("--outcome-path", required=True)
    record.add_argument("--request-valid", required=True, choices=("true", "false"))
    record.add_argument("--validation-error-b64", default="")
    record.add_argument("--request-path", required=True)
    record.add_argument("--request-fingerprint", required=True)
    record.add_argument("--episode-date", default="")
    record.add_argument("--expected-spec-sha256", default="")
    record.add_argument("--scene-number", default="")
    record.add_argument("--offset-seconds", default="")
    record.add_argument("--duration-seconds", default="")
    record.add_argument("--wake-result", default="")
    record.add_argument("--render-result", default="")
    record.add_argument("--workflow", required=True)
    record.add_argument("--run-id", required=True)
    return root_parser


def main() -> None:
    args = parser().parse_args()
    root = args.root.resolve()
    if args.command == "resolve":
        values = resolve_request(
            root,
            args.event_name,
            args.before_sha,
            args.trigger_sha,
        )
        write_outputs(args.output, values)
        return
    status = record_outcome(root, args)
    print(status)


if __name__ == "__main__":
    main()
