from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from required_merge_gate import (
    classify_changes,
    evaluate_latest_runs,
    load_policy,
    poll_expected_workflows,
    select_latest_runs,
)


POLICY = {
    "contractVersion": "1.0.0",
    "protectedBranch": "main",
    "statusContext": "Nasdaq Cafe Required Merge Gate",
    "docsOnlyPatterns": ["docs/**", "README.md", "CHANGELOG.md"],
    "requestOnlyGroups": [
        {
            "name": "current-requests",
            "patterns": ["handoff-preview-requests-v4/*.json", "final-render-requests-v2/*.json"],
            "workflows": ["Current Request Publication Gate"],
        }
    ],
    "workflowGroups": [
        {
            "name": "engine",
            "patterns": ["src/**", "scripts/**", "contracts/**", "schemas/**", "render-specs/**", "package.json", "package-lock.json", "tsconfig*.json", "AGENTS.md", ".github/workflows/**"],
            "workflows": ["Visual Story Engine CI"],
        },
        {
            "name": "media",
            "patterns": ["src/**", "public/**", "render-specs/**", "scripts/*media*"],
            "workflows": ["Visual Story Media CI"],
        },
        {
            "name": "identity",
            "patterns": [
                ".github/workflows/nasdaq-cafe-final-v2.yml",
                ".github/workflows/nasdaq-cafe-codespace-wake.yml",
                "scripts/wake_repository_codespace.py",
                "scripts/test_codespace_wake_gateway.py",
                "scripts/required_merge_gate.py",
                "scripts/test_required_merge_gate.py",
                "scripts/test_final_v2_runner_readiness.py",
                "scripts/test_wake_repository_codespace.py",
                "contracts/required_merge_gate_policy.json",
                ".github/workflows/required-merge-gate.yml",
            ],
            "workflows": ["Current Preview Final Identity CI", "Visual Story Engine CI"],
        },
    ],
    "unclassifiedNonDocs": "FAIL",
}


class RequiredMergeGateTests(unittest.TestCase):
    def test_load_policy_requires_expected_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "policy.json"
            path.write_text(json.dumps(POLICY), encoding="utf-8")
            self.assertEqual(load_policy(path)["contractVersion"], "1.0.0")

    def test_one_preview_request_is_request_only(self) -> None:
        result = classify_changes(POLICY, [{"filename": "handoff-preview-requests-v4/2026-09-02.json", "status": "added"}])
        self.assertEqual(result["state"], "REQUEST_ONLY")
        self.assertEqual(result["expectedWorkflows"], ["Current Request Publication Gate"])

    def test_one_final_request_is_request_only(self) -> None:
        result = classify_changes(POLICY, [{"filename": "final-render-requests-v2/2026-09-02.json", "status": "added"}])
        self.assertEqual(result["state"], "REQUEST_ONLY")

    def test_request_plus_second_file_fails_closed(self) -> None:
        result = classify_changes(POLICY, [
            {"filename": "final-render-requests-v2/2026-09-02.json", "status": "added"},
            {"filename": "README.md", "status": "modified"},
        ])
        self.assertEqual(result["state"], "MIXED_REQUEST_PR")

    def test_final_control_plane_requires_identity_and_engine(self) -> None:
        result = classify_changes(POLICY, [{"filename": ".github/workflows/nasdaq-cafe-final-v2.yml", "status": "modified"}])
        self.assertEqual(result["state"], "WORKFLOWS_REQUIRED")
        self.assertEqual(set(result["expectedWorkflows"]), {"Current Preview Final Identity CI", "Visual Story Engine CI"})

    def test_runner_readiness_tests_require_identity_and_engine(self) -> None:
        for filename in (
            "scripts/test_final_v2_runner_readiness.py",
            "scripts/test_wake_repository_codespace.py",
        ):
            with self.subTest(filename=filename):
                result = classify_changes(POLICY, [{"filename": filename, "status": "modified"}])
                self.assertEqual(result["state"], "WORKFLOWS_REQUIRED")
                self.assertEqual(
                    set(result["expectedWorkflows"]),
                    {"Current Preview Final Identity CI", "Visual Story Engine CI"},
                )

    def test_src_requires_engine_and_media(self) -> None:
        result = classify_changes(POLICY, [{"filename": "src/components/Card.tsx", "status": "modified"}])
        self.assertEqual(set(result["expectedWorkflows"]), {"Visual Story Engine CI", "Visual Story Media CI"})

    def test_public_requires_media(self) -> None:
        result = classify_changes(POLICY, [{"filename": "public/example.png", "status": "added"}])
        self.assertEqual(result["expectedWorkflows"], ["Visual Story Media CI"])

    def test_agents_requires_engine(self) -> None:
        result = classify_changes(POLICY, [{"filename": "AGENTS.md", "status": "modified"}])
        self.assertEqual(result["expectedWorkflows"], ["Visual Story Engine CI"])

    def test_docs_only_needs_no_workflow(self) -> None:
        result = classify_changes(POLICY, [{"filename": "docs/example.md", "status": "modified"}])
        self.assertEqual(result["state"], "DOCS_ONLY")

    def test_unknown_non_doc_fails_closed(self) -> None:
        result = classify_changes(POLICY, [{"filename": "mystery/control.txt", "status": "added"}])
        self.assertEqual(result["state"], "UNCLASSIFIED_CHANGE")

    def test_wrong_head_sha_is_ignored(self) -> None:
        selected = select_latest_runs(
            {"Visual Story Engine CI"},
            [{"name": "Visual Story Engine CI", "head_sha": "wrong", "event": "pull_request", "run_number": 9, "run_attempt": 1, "id": 9, "status": "completed", "conclusion": "success"}],
            "head",
        )
        self.assertEqual(selected, {})

    def test_no_run_yet_waits(self) -> None:
        self.assertEqual(evaluate_latest_runs({"Visual Story Engine CI"}, {})["state"], "WAITING_FOR_WORKFLOW")

    def test_newer_pending_masks_old_success(self) -> None:
        runs = [
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 4, "run_attempt": 1, "id": 4, "status": "completed", "conclusion": "success"},
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 5, "run_attempt": 1, "id": 5, "status": "in_progress", "conclusion": None},
        ]
        selected = select_latest_runs({"Visual Story Engine CI"}, runs, "head")
        self.assertEqual(evaluate_latest_runs({"Visual Story Engine CI"}, selected)["state"], "WAITING_FOR_COMPLETION")

    def test_newer_failure_masks_old_success(self) -> None:
        runs = [
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 4, "run_attempt": 1, "id": 4, "status": "completed", "conclusion": "success"},
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 5, "run_attempt": 2, "id": 6, "status": "completed", "conclusion": "failure"},
        ]
        selected = select_latest_runs({"Visual Story Engine CI"}, runs, "head")
        self.assertEqual(evaluate_latest_runs({"Visual Story Engine CI"}, selected)["state"], "EXPECTED_WORKFLOW_FAILED")

    def test_newer_success_masks_old_failure(self) -> None:
        runs = [
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 4, "run_attempt": 1, "id": 4, "status": "completed", "conclusion": "failure"},
            {"name": "Visual Story Engine CI", "head_sha": "head", "event": "pull_request", "run_number": 5, "run_attempt": 1, "id": 5, "status": "completed", "conclusion": "success"},
        ]
        selected = select_latest_runs({"Visual Story Engine CI"}, runs, "head")
        self.assertEqual(evaluate_latest_runs({"Visual Story Engine CI"}, selected)["state"], "PASS")

    def test_missing_workflow_times_out_only_at_deadline(self) -> None:
        now = [0.0]
        def request_fn(_url: str):
            return {"workflow_runs": []}
        def sleep_fn(seconds: float) -> None:
            now[0] += seconds
        result = poll_expected_workflows(
            "owner/repo", "head", {"Visual Story Engine CI"}, "token",
            request_fn=request_fn, sleep_fn=sleep_fn, monotonic_fn=lambda: now[0],
            timeout_seconds=20, poll_seconds=10,
        )
        self.assertEqual(result["state"], "EXPECTED_WORKFLOW_TIMEOUT")
        self.assertGreaterEqual(now[0], 20)


if __name__ == "__main__":
    unittest.main()
