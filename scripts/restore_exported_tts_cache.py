#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import shutil
import subprocess
import tarfile
import tempfile
import zipfile

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
CACHE_PREFIX = pathlib.PurePosixPath(".cache/spec-tts-blocks")


def load_registry(root: pathlib.Path, tts_input_sha: str) -> dict[str, object]:
    if not SHA256_RE.fullmatch(tts_input_sha):
        raise ValueError("tts_input_sha must be a lowercase SHA-256")
    path = root / "tts-cache-exports" / f"{tts_input_sha}.json"
    if not path.is_file():
        raise FileNotFoundError(f"export registry not found: {path.relative_to(root)}")
    value = json.loads(path.read_text(encoding="utf-8"))
    required = {
        "registryVersion",
        "ttsInputSha",
        "specSha256",
        "artifactId",
        "artifactName",
        "runId",
        "exportedAt",
    }
    if not isinstance(value, dict) or set(value) != required:
        raise ValueError("invalid TTS cache export registry fields")
    if value["registryVersion"] != "1.0":
        raise ValueError("unsupported TTS cache export registry version")
    if value["ttsInputSha"] != tts_input_sha:
        raise ValueError("registry TTS identity mismatch")
    artifact_id = value["artifactId"]
    run_id = value["runId"]
    if not isinstance(artifact_id, int) or isinstance(artifact_id, bool) or artifact_id <= 0:
        raise ValueError("registry artifactId must be a positive integer")
    if not isinstance(run_id, int) or isinstance(run_id, bool) or run_id <= 0:
        raise ValueError("registry runId must be a positive integer")
    if not isinstance(value["artifactName"], str) or not value["artifactName"]:
        raise ValueError("registry artifactName is required")
    return value


def download_artifact(repository: str, artifact_id: int, token: str, output: pathlib.Path) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository):
        raise ValueError("invalid repository name")
    if not token:
        raise ValueError("GitHub token is required")
    url = f"https://api.github.com/repos/{repository}/actions/artifacts/{artifact_id}/zip"
    subprocess.run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--location",
            "--header",
            "Accept: application/vnd.github+json",
            "--header",
            f"Authorization: Bearer {token}",
            "--header",
            "X-GitHub-Api-Version: 2022-11-28",
            "--output",
            str(output),
            url,
        ],
        check=True,
    )


def extract_tar_members(
    archive: tarfile.TarFile,
    members: list[tarfile.TarInfo],
    root: pathlib.Path,
) -> None:
    for member in members:
        relative_path = pathlib.PurePosixPath(member.name)
        destination = root.joinpath(*relative_path.parts)
        if member.isdir():
            destination.mkdir(parents=True, exist_ok=True)
            continue
        if not member.isfile():
            raise ValueError(f"unsupported cache archive entry: {member.name}")
        source = archive.extractfile(member)
        if source is None:
            raise ValueError(f"failed to read cache archive entry: {member.name}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with source, destination.open("wb") as output:
            shutil.copyfileobj(source, output)


def extract_portable_cache(artifact_zip: pathlib.Path, root: pathlib.Path) -> None:
    with tempfile.TemporaryDirectory(prefix="tts-cache-export-") as temporary:
        temporary_root = pathlib.Path(temporary)
        tar_path = temporary_root / "portable-cache.tar.gz"
        with zipfile.ZipFile(artifact_zip) as archive:
            members = archive.namelist()
            if len(members) != 1 or not members[0].endswith(".tar.gz"):
                raise ValueError("cache artifact must contain exactly one .tar.gz payload")
            zip_path = pathlib.PurePosixPath(members[0])
            if zip_path.is_absolute() or ".." in zip_path.parts or len(zip_path.parts) != 1:
                raise ValueError(f"unsafe artifact payload path: {members[0]}")
            with archive.open(members[0]) as source, tar_path.open("wb") as output:
                shutil.copyfileobj(source, output)

        with tarfile.open(tar_path, "r:gz") as archive:
            tar_members = archive.getmembers()
            if not tar_members:
                raise ValueError("portable cache archive is empty")
            for member in tar_members:
                path = pathlib.PurePosixPath(member.name)
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError(f"unsafe cache archive path: {member.name}")
                if path != CACHE_PREFIX and CACHE_PREFIX not in path.parents:
                    raise ValueError(f"cache archive escaped approved prefix: {member.name}")
                if member.issym() or member.islnk() or member.isdev():
                    raise ValueError(f"unsupported cache archive entry: {member.name}")
            extract_tar_members(archive, tar_members, root)


def validate_cache(root: pathlib.Path) -> list[pathlib.Path]:
    cache_root = root / CACHE_PREFIX
    audio_files = sorted(cache_root.rglob("audio.wav")) if cache_root.is_dir() else []
    if len(audio_files) < 2:
        raise ValueError(f"expected both production TTS blocks; found {len(audio_files)}")
    return audio_files


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--tts-input-sha", required=True)
    parser.add_argument("--repository", default=os.environ.get("GITHUB_REPOSITORY", ""))
    parser.add_argument("--token", default=os.environ.get("GH_TOKEN", ""))
    parser.add_argument("--artifact-zip")
    args = parser.parse_args()

    root = pathlib.Path(args.root).resolve()
    registry = load_registry(root, args.tts_input_sha)
    if args.artifact_zip:
        artifact_zip = pathlib.Path(args.artifact_zip).resolve()
        extract_portable_cache(artifact_zip, root)
    else:
        with tempfile.TemporaryDirectory(prefix="tts-cache-download-") as temporary:
            artifact_zip = pathlib.Path(temporary) / "artifact.zip"
            download_artifact(
                args.repository,
                int(registry["artifactId"]),
                args.token,
                artifact_zip,
            )
            extract_portable_cache(artifact_zip, root)
    audio_files = validate_cache(root)
    print(
        json.dumps(
            {
                "status": "restored",
                "ttsInputSha": args.tts_input_sha,
                "artifactId": registry["artifactId"],
                "audioFiles": [str(path.relative_to(root)) for path in audio_files],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
