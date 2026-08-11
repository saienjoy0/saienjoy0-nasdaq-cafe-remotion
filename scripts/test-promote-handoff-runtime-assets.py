#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "promote-handoff-runtime-assets.py"
SPEC = importlib.util.spec_from_file_location("promote_runtime_assets", MODULE_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def main() -> int:
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        repo = root / "repo"
        bundle = root / "bundle"
        asset_id = "daily-test-asset"
        asset_rel = Path("assets") / asset_id / "asset.png"
        source = bundle / asset_rel
        source.parent.mkdir(parents=True)
        source.write_bytes(b"runtime-asset")
        digest = MODULE.sha256_file(source)
        bundle_id = "a" * 64
        manifest = {
            "bundle_id": bundle_id,
            "episode_date": "2026-08-10",
            "files": [
                {
                    "role": "asset",
                    "destination_path": asset_rel.as_posix(),
                    "sha256": digest,
                    "size": source.stat().st_size,
                }
            ],
        }
        manifest_path = bundle / "handoff_manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        result = MODULE.promote(
            manifest_path=manifest_path,
            bundle_root=bundle,
            repo_root=repo,
            episode_date="2026-08-10",
        )
        assert result["status"] == "pass"
        registry_path = repo / "runtime-assets/2026-08-10/runtime_asset_registry.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        assert registry["bundleId"] == bundle_id
        assert registry["assets"] == [
            {
                "assetId": asset_id,
                "path": "generated/preflight-assets/2026-08-10/daily-test-asset/asset.png",
                "sha256": digest,
                "source": "handoff",
            }
        ]
        staged = repo / "public/generated/preflight-assets/2026-08-10/daily-test-asset/asset.png"
        assert staged.read_bytes() == b"runtime-asset"
    print("PASS promoted runtime asset staging")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
