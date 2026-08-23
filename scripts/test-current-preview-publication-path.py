#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import tempfile
from pathlib import Path


VALIDATOR_PATH = Path(__file__).with_name("validate-current-request.py")
SPEC = importlib.util.spec_from_file_location("validate_current_request", VALIDATOR_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"unable to import {VALIDATOR_PATH}")
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


DATE = "2099-07-01"
RUN_ID = 123


def request(*, run_id: int = RUN_ID) -> dict:
    return {
        "contractVersion": "2.1.0",
        "episodeDate": DATE,
        "plotRunId": run_id,
        "handoffArtifactName": f"nasdaq-cafe-handoff-{DATE}-{run_id}",
        "expectedBundleId": "a" * 64,
        "expectedManifestSha256": "b" * 64,
        "expectedRendererCommit": "c" * 40,
        "expectedRendererContractVersion": "2.4.0",
        "expectedRegistrySnapshotSha256": "d" * 64,
        "confirmation": "PREVIEW",
    }


def encoded(value: dict) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="nasdaq-renderer-publication-") as temporary:
        root = Path(temporary)
        original_cwd = Path.cwd()
        os.chdir(root)
        try:
            payload = encoded(request())
            digest = hashlib.sha256(payload).hexdigest()
            exact = Path("handoff-preview-requests-v4") / f"{DATE}-plot-{RUN_ID}-{digest[:12]}.json"
            exact.parent.mkdir(parents=True)
            exact.write_bytes(payload)

            value = validator.load(exact)
            validator.validate_preview(value)
            observed = validator.require_preview_publication_path(exact, value)
            if observed != digest:
                raise AssertionError("accepted publication did not return the exact request SHA")

            wrong = exact.with_name(f"{DATE}-plot-{RUN_ID}-000000000000.json")
            wrong.write_bytes(payload)
            try:
                validator.require_preview_publication_path(wrong, value)
            except validator.RequestError:
                pass
            else:
                raise AssertionError("arbitrary Preview request filename was accepted")

            changed = request(run_id=RUN_ID + 1)
            exact.write_bytes(encoded(changed))
            try:
                validator.require_preview_publication_path(exact, changed)
            except validator.RequestError:
                pass
            else:
                raise AssertionError("changed request bytes reused an old publication path")

            bad_artifact = request()
            bad_artifact["handoffArtifactName"] = "nasdaq-cafe-handoff-unbound"
            try:
                validator.validate_preview(bad_artifact)
            except validator.RequestError:
                pass
            else:
                raise AssertionError("handoff artifact not bound to date/run was accepted")
        finally:
            os.chdir(original_cwd)

    print("Current Preview deterministic publication path PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
