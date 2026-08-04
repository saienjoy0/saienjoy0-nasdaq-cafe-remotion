#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

SCRIPT = pathlib.Path(__file__).with_name("motion_preview_request_queue.py")
DATE = "2026-07-31"


def run(*args: str, cwd: pathlib.Path, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [*args],
        cwd=cwd,
        check=check,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def git(root: pathlib.Path, *args: str) -> str:
    return run("git", *args, cwd=root).stdout.strip()


def initialize(root: pathlib.Path) -> str:
    git(root, "init")
    git(root, "config", "user.name", "Queue Test")
    git(root, "config", "user.email", "queue-test@example.invalid")
    (root / "motion-preview-requests").mkdir(parents=True)
    spec_path = root / "render-specs" / DATE / "render_spec.json"
    spec_path.parent.mkdir(parents=True)
    spec_path.write_text('{"fixture":true}\n', encoding="utf-8")
    git(root, "add", "--", "render-specs", "motion-preview-requests")
    git(root, "commit", "-m", "Initial fixture")
    return hashlib.sha256(spec_path.read_bytes()).hexdigest()


def request_value(spec_sha: str) -> dict[str, object]:
    return {
        "requestVersion": "1.0",
        "episodeDate": DATE,
        "expectedSpecSha256": spec_sha,
        "sceneNumber": 6,
        "offsetSeconds": 0,
        "durationSeconds": 20,
        "confirmation": "MOTION",
    }


def write_request(root: pathlib.Path, name: str, value: object) -> pathlib.Path:
    path = root / "motion-preview-requests" / name
    if isinstance(value, str):
        path.write_text(value, encoding="utf-8")
    else:
        path.write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return path


def parse_outputs(path: pathlib.Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        key, value = line.split("=", 1)
        result[key] = value
    return result


def resolve(root: pathlib.Path, event: str = "schedule", before: str = "", trigger: str = "") -> dict[str, str]:
    output = root / "outputs.txt"
    output.unlink(missing_ok=True)
    run(
        sys.executable,
        str(SCRIPT),
        "--root",
        str(root),
        "resolve",
        "--event-name",
        event,
        "--before-sha",
        before,
        "--trigger-sha",
        trigger,
        "--output",
        str(output),
        cwd=root,
    )
    return parse_outputs(output)


def record(root: pathlib.Path, selected: dict[str, str], wake: str, render: str) -> str:
    completed = run(
        sys.executable,
        str(SCRIPT),
        "--root",
        str(root),
        "record",
        "--outcome-path",
        selected["outcome_path"],
        "--request-valid",
        selected["request_valid"],
        "--validation-error-b64",
        selected.get("validation_error_b64", ""),
        "--request-path",
        selected["request_path"],
        "--request-fingerprint",
        selected["request_fingerprint"],
        "--episode-date",
        selected.get("episode_date", ""),
        "--expected-spec-sha256",
        selected.get("expected_spec_sha256", ""),
        "--scene-number",
        selected.get("scene_number", ""),
        "--offset-seconds",
        selected.get("offset_seconds", ""),
        "--duration-seconds",
        selected.get("duration_seconds", ""),
        "--wake-result",
        wake,
        "--render-result",
        render,
        "--workflow",
        "Nasdaq Cafe Motion Preview Request",
        "--run-id",
        "12345",
        cwd=root,
    )
    return completed.stdout.strip()


def test_at_most_once_and_explicit_retry() -> None:
    with tempfile.TemporaryDirectory() as temporary:
        root = pathlib.Path(temporary)
        spec_sha = initialize(root)
        value = request_value(spec_sha)
        write_request(root, "001-scene-06.json", value)
        write_request(root, "002-scene-06-retry.json", value)

        first = resolve(root)
        assert first["has_request"] == "true"
        assert first["request_valid"] == "true"
        assert first["request_path"].endswith("001-scene-06.json")
        assert record(root, first, "success", "failure") == "failed"

        outcome = json.loads((root / first["outcome_path"]).read_text(encoding="utf-8"))
        assert outcome["status"] == "failed"
        assert outcome["stage"] == "render-motion-preview"

        second = resolve(root)
        assert second["has_request"] == "true"
        assert second["request_valid"] == "true"
        assert second["request_path"].endswith("002-scene-06-retry.json")
        assert second["request_fingerprint"] != first["request_fingerprint"]
        assert record(root, second, "success", "success") == "succeeded"

        exhausted = resolve(root)
        assert exhausted == {"has_request": "false"}



def test_invalid_request_is_rejected_without_blocking() -> None:
    with tempfile.TemporaryDirectory() as temporary:
        root = pathlib.Path(temporary)
        spec_sha = initialize(root)
        write_request(root, "001-invalid.json", "{not-json\n")
        write_request(root, "002-valid.json", request_value(spec_sha))

        invalid = resolve(root)
        assert invalid["has_request"] == "true"
        assert invalid["request_valid"] == "false"
        assert record(root, invalid, "skipped", "skipped") == "rejected"

        valid = resolve(root)
        assert valid["has_request"] == "true"
        assert valid["request_valid"] == "true"
        assert valid["request_path"].endswith("002-valid.json")



def test_push_is_append_only() -> None:
    with tempfile.TemporaryDirectory() as temporary:
        root = pathlib.Path(temporary)
        spec_sha = initialize(root)
        before = git(root, "rev-parse", "HEAD")
        request_path = write_request(root, "001-push.json", request_value(spec_sha))
        git(root, "add", "--", request_path.relative_to(root).as_posix())
        git(root, "commit", "-m", "Add request")
        trigger = git(root, "rev-parse", "HEAD")

        selected = resolve(root, "push", before, trigger)
        assert selected["has_request"] == "true"
        assert selected["request_valid"] == "true"

        before_modify = trigger
        request_path.write_text(
            json.dumps(request_value(spec_sha), separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
        git(root, "add", "--", request_path.relative_to(root).as_posix())
        git(root, "commit", "-m", "Modify request")
        modified = git(root, "rev-parse", "HEAD")
        output = root / "modified-output.txt"
        completed = run(
            sys.executable,
            str(SCRIPT),
            "--root",
            str(root),
            "resolve",
            "--event-name",
            "push",
            "--before-sha",
            before_modify,
            "--trigger-sha",
            modified,
            "--output",
            str(output),
            cwd=root,
            check=False,
        )
        assert completed.returncode != 0
        assert "append-only" in completed.stderr


if __name__ == "__main__":
    test_at_most_once_and_explicit_retry()
    print("PASS: failed requests close once and a new file is an explicit retry")
    test_invalid_request_is_rejected_without_blocking()
    print("PASS: malformed requests are rejected without blocking later work")
    test_push_is_append_only()
    print("PASS: push requests are append-only")
    print("motion preview request queue tests: 3 passed")
