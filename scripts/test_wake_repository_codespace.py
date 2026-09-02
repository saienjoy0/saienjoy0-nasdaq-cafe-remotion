from __future__ import annotations

import unittest

from wake_repository_codespace import CodespaceApiError, CodespaceWakeError, ensure_available, select_repository_codespace


class WakeRepositoryCodespaceTests(unittest.TestCase):
    def test_selects_newest_matching_repository_codespace(self) -> None:
        listing = {"codespaces": [
            {"name": "old", "state": "Shutdown", "last_used_at": "2026-08-01T00:00:00Z", "repository": {"full_name": "owner/repo"}},
            {"name": "other", "state": "Available", "last_used_at": "2026-09-02T00:00:00Z", "repository": {"full_name": "other/repo"}},
            {"name": "new", "state": "Shutdown", "last_used_at": "2026-09-01T00:00:00Z", "repository": {"full_name": "owner/repo"}},
        ]}
        self.assertEqual(select_repository_codespace(listing, "owner/repo")["name"], "new")

    def test_already_available_does_not_post(self) -> None:
        calls = []
        def request(method, url, token):
            calls.append((method, url))
            if url.endswith("?per_page=100"):
                return {"codespaces": [{"name": "ready", "state": "Available", "repository": {"full_name": "owner/repo"}}]}
            if url.endswith("/ready"):
                return {"name": "ready", "state": "Available"}
            raise AssertionError(url)
        self.assertEqual(ensure_available("owner/repo", "token", request_fn=request, sleep_fn=lambda _: None), "ready")
        self.assertFalse(any(method == "POST" for method, _ in calls))

    def test_shutdown_starts_then_polls_available(self) -> None:
        states = iter([{"name": "box", "state": "Starting"}, {"name": "box", "state": "Available"}])
        calls = []
        def request(method, url, token):
            calls.append((method, url))
            if url.endswith("?per_page=100"):
                return {"codespaces": [{"name": "box", "state": "Shutdown", "start_url": "https://api.github.com/user/codespaces/box/start", "repository": {"full_name": "owner/repo"}}]}
            if method == "POST":
                return None
            return next(states)
        self.assertEqual(ensure_available("owner/repo", "token", request_fn=request, sleep_fn=lambda _: None), "box")
        self.assertIn(("POST", "https://api.github.com/user/codespaces/box/start"), calls)

    def test_start_409_is_tolerated(self) -> None:
        polled = [False]
        def request(method, url, token):
            if url.endswith("?per_page=100"):
                return {"codespaces": [{"name": "box", "state": "Shutdown", "repository": {"full_name": "owner/repo"}}]}
            if method == "POST":
                raise CodespaceApiError(409, "already starting")
            polled[0] = True
            return {"name": "box", "state": "Available"}
        self.assertEqual(ensure_available("owner/repo", "token", request_fn=request, sleep_fn=lambda _: None), "box")
        self.assertTrue(polled[0])

    def test_no_matching_repository_fails(self) -> None:
        with self.assertRaises(CodespaceWakeError):
            select_repository_codespace({"codespaces": []}, "owner/repo")

    def test_timeout_fails_closed(self) -> None:
        now = [0.0]
        def request(method, url, token):
            if url.endswith("?per_page=100"):
                return {"codespaces": [{"name": "box", "state": "Shutdown", "repository": {"full_name": "owner/repo"}}]}
            if method == "POST":
                return None
            return {"name": "box", "state": "Starting"}
        def sleep(seconds):
            now[0] += seconds
        with self.assertRaises(CodespaceWakeError):
            ensure_available("owner/repo", "token", request_fn=request, sleep_fn=sleep, monotonic_fn=lambda: now[0], timeout_seconds=14, poll_seconds=7)

    def test_non_409_start_failure_propagates(self) -> None:
        def request(method, url, token):
            if url.endswith("?per_page=100"):
                return {"codespaces": [{"name": "box", "state": "Shutdown", "repository": {"full_name": "owner/repo"}}]}
            if method == "POST":
                raise CodespaceApiError(500, "boom")
            raise AssertionError(url)
        with self.assertRaises(CodespaceApiError):
            ensure_available("owner/repo", "token", request_fn=request, sleep_fn=lambda _: None)


if __name__ == "__main__":
    unittest.main()
