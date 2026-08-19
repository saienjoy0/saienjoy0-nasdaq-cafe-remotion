#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

BLOCK_IDS = ("scenes-01-04", "scenes-05-09")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict[str, Any]:
    value=json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict): raise SystemExit(f"JSON root must be object: {path}")
    return value


def tts_input_sha(spec: dict[str, Any]) -> str:
    blocks=[]
    for block_id, first, last in (("scenes-01-04",1,4),("scenes-05-09",5,9)):
        speech=[chunk["speechText"] for scene in spec["scenes"] if first <= scene["sceneNumber"] <= last for chunk in scene["narrationChunks"]]
        if not speech: raise SystemExit(f"{block_id} has no speechText")
        blocks.append({"id":block_id,"speechText":speech})
    payload={
        "synthesisVersion":"gemini-two-block-v1",
        "model":os.environ.get("GEMINI_TTS_MODEL","gemini-3.1-flash-tts-preview"),
        "voice":os.environ.get("GEMINI_TTS_VOICE","Charon"),
        "voiceProfileId":spec.get("voiceProfileId"),
        "pronunciations":spec.get("pronunciations"),
        "blocks":blocks,
    }
    raw=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
    return hashlib.sha256(raw).hexdigest()


def identify_audio(audio: Path) -> str:
    hay=[]
    for base in (audio.parent, audio.parent.parent):
        if not base.exists(): continue
        hay.append(str(base))
        for item in base.iterdir():
            if item.is_file() and item.suffix.lower() in {".json",".txt"}:
                try: hay.append(item.read_text(encoding="utf-8",errors="ignore"))
                except OSError: pass
    text="\n".join(hay)
    matches=[block for block in BLOCK_IDS if block in text]
    if len(matches)!=1:
        raise SystemExit(f"cannot bind cached audio to exactly one TTS block: {audio}")
    return matches[0]


def main() -> int:
    p=argparse.ArgumentParser()
    p.add_argument("--episode-date",required=True)
    p.add_argument("--spec",required=True,type=Path)
    p.add_argument("--runtime-registry",required=True,type=Path)
    p.add_argument("--handoff-download-root",required=True,type=Path)
    p.add_argument("--technical-report",required=True,type=Path)
    p.add_argument("--renderer-contract-version",required=True)
    p.add_argument("--registry-sha256",required=True)
    p.add_argument("--expected-bundle-id",required=True)
    p.add_argument("--expected-manifest-sha256",required=True)
    p.add_argument("--output-root",required=True,type=Path)
    args=p.parse_args()

    spec=args.spec.resolve(); registry=args.runtime_registry.resolve(); report=args.technical_report.resolve()
    for path in (spec,registry,report):
        if not path.is_file(): raise SystemExit(f"required Preview evidence missing: {path}")
    renderer_commit=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
    cache=Path(".cache/spec-tts-blocks").resolve()
    audios=sorted(cache.rglob("audio.wav")) if cache.is_dir() else []
    if len(audios)!=2: raise SystemExit(f"expected exactly two cached TTS audio.wav files; found {len(audios)}")
    by_block={}
    for audio in audios:
        block=identify_audio(audio)
        if block in by_block: raise SystemExit(f"duplicate cached audio for {block}")
        by_block[block]=audio
    if set(by_block)!=set(BLOCK_IDS): raise SystemExit(f"TTS block coverage mismatch: {sorted(by_block)}")

    out=args.output_root.resolve(); out.mkdir(parents=True,exist_ok=True)
    approved_cache=out/"approved-tts-cache"
    if approved_cache.exists(): shutil.rmtree(approved_cache)
    shutil.copytree(cache,approved_cache)
    approved_handoff=out/"approved-handoff"
    if approved_handoff.exists(): shutil.rmtree(approved_handoff)
    shutil.copytree(args.handoff_download_root.resolve(),approved_handoff)
    approved_data=out/"approved-production-data"; approved_data.mkdir(parents=True,exist_ok=True)
    shutil.copy2(spec,approved_data/"render_spec.json")
    shutil.copy2(registry,approved_data/"runtime_asset_registry.json")

    identity={
        "contractVersion":"1.0.0",
        "episodeDate":args.episode_date,
        "rendererCommit":renderer_commit,
        "rendererContractVersion":args.renderer_contract_version,
        "registrySnapshotSha256":args.registry_sha256,
        "inputSpecSha256":sha256(spec),
        "ttsInputSha256":tts_input_sha(load(spec)),
        "ttsBlockAudioSha256":{block:sha256(by_block[block]) for block in BLOCK_IDS},
        "expectedBundleId":args.expected_bundle_id,
        "expectedManifestSha256":args.expected_manifest_sha256,
        "runtimeRegistrySha256":sha256(registry),
    }
    identity_path=out/"preview_identity.json"
    identity_path.write_text(json.dumps(identity,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")

    technical=load(report)
    technical["currentSpineIdentity"]={**identity,"previewIdentitySha256":sha256(identity_path)}
    report.write_text(json.dumps(technical,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(json.dumps(identity,ensure_ascii=False,indent=2,sort_keys=True))
    return 0

if __name__=="__main__": raise SystemExit(main())
