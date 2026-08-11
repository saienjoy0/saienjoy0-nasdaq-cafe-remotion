#!/usr/bin/env python3
"""Persist verified handoff binary assets for the canonical Preview path.

The handoff manifest remains the authority. This helper copies only rows whose role
is ``asset``, verifies their declared size/SHA again, stages binaries under public,
and writes the renderer's existing runtime asset registry. It never infers an asset
or changes render_spec.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path, PurePosixPath
from typing import Any


class PromotionAssetError(ValueError):
    pass


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise PromotionAssetError(f"JSON root must be object: {path}")
    return value


def safe_destination(value: str) -> PurePosixPath:
    path = PurePosixPath(value)
    if path.is_absolute() or not path.parts or any(part in {"", ".", ".."} for part in path.parts):
        raise PromotionAssetError(f"unsafe handoff asset destination: {value!r}")
    if path.parts[0] != "assets" or len(path.parts) < 3:
        raise PromotionAssetError(f"handoff asset destination must be assets/<assetId>/<file>: {value!r}")
    return path


def promote(*, manifest_path: Path, bundle_root: Path, repo_root: Path, episode_date: str) -> dict[str, Any]:
    manifest = load_json(manifest_path)
    if manifest.get("episode_date") != episode_date:
        raise PromotionAssetError("handoff manifest episode_date mismatch")
    bundle_id = manifest.get("bundle_id")
    if not isinstance(bundle_id, str) or len(bundle_id) != 64:
        raise PromotionAssetError("handoff manifest bundle_id is invalid")
    rows = manifest.get("files")
    if not isinstance(rows, list):
        raise PromotionAssetError("handoff manifest files must be an array")

    repo_root = repo_root.resolve()
    bundle_root = bundle_root.resolve()
    registry_root = repo_root / "runtime-assets" / episode_date
    public_root = repo_root / "public" / "generated" / "preflight-assets" / episode_date
    if registry_root.exists():
        shutil.rmtree(registry_root)
    if public_root.exists():
        shutil.rmtree(public_root)
    registry_root.mkdir(parents=True, exist_ok=True)
    public_root.mkdir(parents=True, exist_ok=True)

    entries: list[dict[str, str]] = []
    seen: set[str] = set()
    for index, row in enumerate(rows):
        if not isinstance(row, dict) or row.get("role") != "asset":
            continue
        destination = safe_destination(str(row.get("destination_path") or ""))
        asset_id = destination.parts[1]
        if asset_id in seen:
            raise PromotionAssetError(f"duplicate handoff assetId: {asset_id}")
        seen.add(asset_id)

        source = (bundle_root / Path(*destination.parts)).resolve()
        if bundle_root not in source.parents or not source.is_file():
            raise PromotionAssetError(f"handoff asset is missing: {destination.as_posix()}")
        declared_sha = row.get("sha256")
        declared_size = row.get("size")
        if not isinstance(declared_sha, str) or sha256_file(source) != declared_sha:
            raise PromotionAssetError(f"handoff asset SHA mismatch: {asset_id}")
        if not isinstance(declared_size, int) or source.stat().st_size != declared_size:
            raise PromotionAssetError(f"handoff asset size mismatch: {asset_id}")

        filename_parts = destination.parts[2:]
        target = public_root / asset_id / Path(*filename_parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        public_path = target.relative_to(repo_root / "public").as_posix()
        entries.append(
            {
                "assetId": asset_id,
                "path": public_path,
                "sha256": declared_sha,
                "source": "handoff",
            }
        )

    entries.sort(key=lambda item: item["assetId"])
    registry = {
        "contractVersion": "1.0.0",
        "bundleId": bundle_id,
        "episodeDate": episode_date,
        "assets": entries,
    }
    registry_path = registry_root / "runtime_asset_registry.json"
    registry_path.write_text(
        json.dumps(registry, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return {
        "status": "pass",
        "episodeDate": episode_date,
        "bundleId": bundle_id,
        "assetCount": len(entries),
        "runtimeRegistry": registry_path.relative_to(repo_root).as_posix(),
        "runtimeRegistrySha256": sha256_file(registry_path),
        "publicAssetRoot": public_root.relative_to(repo_root).as_posix(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--bundle-root", type=Path, required=True)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--episode-date", required=True)
    args = parser.parse_args()
    result = promote(
        manifest_path=args.manifest,
        bundle_root=args.bundle_root,
        repo_root=args.repo_root,
        episode_date=args.episode_date,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
