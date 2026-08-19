#!/usr/bin/env python3
from __future__ import annotations

import argparse, hashlib, json, shutil
from pathlib import Path
from typing import Any

BLOCK_IDS=("scenes-01-04","scenes-05-09")

def sha(path:Path)->str: return hashlib.sha256(path.read_bytes()).hexdigest()
def load(path:Path)->dict[str,Any]:
    v=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(v,dict): raise SystemExit(f'JSON root must be object: {path}')
    return v

def identify(audio:Path)->str:
    hay=[]
    for base in (audio.parent,audio.parent.parent):
        if not base.exists(): continue
        hay.append(str(base))
        for p in base.iterdir():
            if p.is_file() and p.suffix.lower() in {'.json','.txt'}:
                try: hay.append(p.read_text(encoding='utf-8',errors='ignore'))
                except OSError: pass
    text='\n'.join(hay); m=[b for b in BLOCK_IDS if b in text]
    if len(m)!=1: raise SystemExit(f'cannot identify TTS block for {audio}')
    return m[0]

def main()->int:
    p=argparse.ArgumentParser(); p.add_argument('--preview-root',type=Path,required=True); p.add_argument('--episode-date',required=True)
    p.add_argument('--renderer-commit',required=True); p.add_argument('--renderer-contract-version',required=True); p.add_argument('--registry-sha256',required=True)
    p.add_argument('--spec-sha256',required=True); p.add_argument('--tts-input-sha256',required=True)
    p.add_argument('--audio-01-04-sha256',required=True); p.add_argument('--audio-05-09-sha256',required=True); p.add_argument('--preview-identity-sha256',required=True)
    p.add_argument('--output-root',type=Path,required=True); a=p.parse_args()
    identities=list(a.preview_root.resolve().rglob('preview_identity.json'))
    if len(identities)!=1: raise SystemExit(f'expected exactly one preview_identity.json; found {len(identities)}')
    identity_path=identities[0]; identity=load(identity_path)
    if sha(identity_path)!=a.preview_identity_sha256: raise SystemExit('Preview identity SHA mismatch')
    expected={
      'episodeDate':a.episode_date,'rendererCommit':a.renderer_commit,'rendererContractVersion':a.renderer_contract_version,
      'registrySnapshotSha256':a.registry_sha256,'inputSpecSha256':a.spec_sha256,'ttsInputSha256':a.tts_input_sha256,
    }
    for k,v in expected.items():
        if identity.get(k)!=v: raise SystemExit(f'Preview identity mismatch: {k}')
    audio_expected={'scenes-01-04':a.audio_01_04_sha256,'scenes-05-09':a.audio_05_09_sha256}
    if identity.get('ttsBlockAudioSha256')!=audio_expected: raise SystemExit('Preview identity audio SHA map mismatch')
    approved=identity_path.parent
    cache=approved/'approved-tts-cache'; handoff=approved/'approved-handoff'; data=approved/'approved-production-data'
    for path in (cache,handoff,data):
        if not path.exists(): raise SystemExit(f'approved Preview data missing: {path}')
    audios=list(cache.rglob('audio.wav'))
    if len(audios)!=2: raise SystemExit(f'approved TTS cache must contain exactly two audio.wav files; found {len(audios)}')
    seen={}
    for audio in audios:
        block=identify(audio); seen[block]=sha(audio)
    if seen!=audio_expected: raise SystemExit(f'approved TTS audio bytes mismatch: {seen}')
    spec=data/'render_spec.json'; registry=data/'runtime_asset_registry.json'
    if sha(spec)!=a.spec_sha256: raise SystemExit('approved RenderSpec SHA mismatch')
    if sha(registry)!=identity.get('runtimeRegistrySha256'): raise SystemExit('approved runtime registry SHA mismatch')
    out=a.output_root.resolve()
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copytree(handoff,out/'handoff'); shutil.copytree(cache,out/'tts-cache')
    shutil.copy2(spec,out/'render_spec.json'); shutil.copy2(registry,out/'runtime_asset_registry.json')
    print(json.dumps({'status':'PASS','previewIdentitySha256':sha(identity_path),'renderSpecSha256':sha(spec),'ttsBlockAudioSha256':seen},sort_keys=True))
    return 0
if __name__=='__main__': raise SystemExit(main())
