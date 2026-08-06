#!/usr/bin/env python3
from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "migrate_visual_grammar_technical_fixture.py"
SOURCE = ROOT / "shared-fixtures" / "financial-visual-2.3" / "render_spec.json"
MAPPING = ROOT / "contracts" / "visual_grammar_technical_fixture_2099-02-02.json"
REGISTRY = ROOT / "contracts" / "visual_grammar_renderer_compatibility.json"
WORKFLOW = ROOT / ".github" / "workflows" / "visual-grammar-ab-technical-preview.yml"
COMPILER = ROOT / "scripts" / "compile-visual-grammar-ab-technical.ts"

spec = importlib.util.spec_from_file_location("vg_migration", SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load migration module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stripped(value: dict) -> dict:
    result = copy.deepcopy(value)
    result.pop("visualGrammarContract", None)
    result["schemaVersion"] = "2.3.0"
    for scene in result["scenes"]:
        for beat in scene["visualBeats"]:
            beat.pop("visualGrammarId", None)
            beat.pop("transitionRole", None)
    return result


with tempfile.TemporaryDirectory(prefix="vg-technical-fixture-") as tmp:
    tmp_path = Path(tmp)
    output_a = tmp_path / "a.json"
    output_b = tmp_path / "b.json"
    manifest_a = tmp_path / "a.manifest.json"
    manifest_b = tmp_path / "b.manifest.json"
    command = [
        "python3", str(SCRIPT),
        "--source", SOURCE.relative_to(ROOT).as_posix(),
        "--mapping", MAPPING.relative_to(ROOT).as_posix(),
        "--registry", REGISTRY.relative_to(ROOT).as_posix(),
    ]
    subprocess.run(
        command + ["--output", str(output_a), "--manifest", str(manifest_a)],
        cwd=ROOT,
        check=True,
    )
    subprocess.run(
        command + ["--output", str(output_b), "--manifest", str(manifest_b)],
        cwd=ROOT,
        check=True,
    )
    assert output_a.read_bytes() == output_b.read_bytes(), (
        "migration output must be byte deterministic"
    )

    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    output = json.loads(output_a.read_text(encoding="utf-8"))
    mapping = json.loads(MAPPING.read_text(encoding="utf-8"))
    manifest = json.loads(manifest_a.read_text(encoding="utf-8"))

    assert stripped(output) == source, (
        "migration changed source content outside Visual Grammar metadata"
    )
    assert output["schemaVersion"] == "2.4.0"
    assert output["visualGrammarContract"]["beatCount"] == 17
    assert output["visualGrammarContract"]["semanticsSha256"] == sha(MAPPING)
    assert output["visualGrammarContract"]["rendererCompatibilitySha256"] == sha(REGISTRY)
    assert output["visualGrammarContract"]["finalEpisodeContractSha256"] == sha(SOURCE)
    assert manifest["ttsIdentityChanged"] is False
    assert manifest["ttsInputSha256Before"] == manifest["ttsInputSha256After"]
    assert manifest["productionEligible"] is False
    assert manifest["finalAuthorized"] is False

    mapped = {item["beatId"]: item for item in mapping["beats"]}
    seen = set()
    for scene in output["scenes"]:
        for beat in scene["visualBeats"]:
            item = mapped[beat["beatId"]]
            assert beat["visualTemplate"] == item["visualTemplate"]
            assert beat["visualGrammarId"] == item["visualGrammarId"]
            assert beat["transitionRole"] == item["transitionRole"]
            seen.add(beat["beatId"])
    assert seen == set(mapped)

    bad_mapping = copy.deepcopy(mapping)
    bad_mapping["beats"][0]["visualTemplate"] = "text-focus"
    bad_mapping_path = tmp_path / "bad.json"
    bad_mapping_path.write_text(
        json.dumps(bad_mapping, ensure_ascii=False),
        encoding="utf-8",
    )
    try:
        module.migrate(
            source_path=SOURCE.relative_to(ROOT),
            mapping_path=bad_mapping_path,
            registry_path=REGISTRY.relative_to(ROOT),
        )
    except module.MigrationError as exc:
        assert "visualTemplate mismatch" in str(exc)
    else:
        raise AssertionError("template drift must be rejected")

workflow_text = WORKFLOW.read_text(encoding="utf-8")
compiler_text = COMPILER.read_text(encoding="utf-8")
assert "visual-grammar-ab-technical-requests/*.json" in workflow_text
assert "github.actor == github.repository_owner" in workflow_text
assert 'SPEC_TTS_CACHE_ONLY: "1"' in workflow_text
assert "restore_exported_tts_cache.py" in workflow_text
assert "GEMINI_API_KEY_" not in workflow_text
assert "episode:spec:preview" not in workflow_text
assert "episode:spec:final" not in workflow_text
assert "VISUAL_GRAMMAR_TECHNICAL_AB" in compiler_text
assert 'spec.episode.id !== "2099-02-02"' in compiler_text
assert "productionEligible: false" in compiler_text
assert "finalAuthorized: false" in compiler_text
assert "renderMedia" not in compiler_text
print("visual grammar technical fixture and request contract: PASS")
