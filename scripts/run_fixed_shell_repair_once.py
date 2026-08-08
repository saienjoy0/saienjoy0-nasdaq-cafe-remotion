import json
import runpy
import subprocess
from pathlib import Path

# Apply the authored renderer/test repair before tsc runs.
runpy.run_path("scripts/apply_fixed_shell_composition_repair.py", run_name="__main__")

# The fixed-shell composition still needs the stage-mode type for the legacy border-radius branch.
composition_path = Path("src/compositions/NasdaqCafeSpecEpisode.tsx")
composition = composition_path.read_text(encoding="utf-8")
stage_mode_import = 'import type {VisualGrammarStageMode} from "../spec/visual-grammar-stage-mode";\n'
if stage_mode_import not in composition:
    anchor = 'import {getStageChromeModeForShell, type StageChromeMode} from "../spec/stage-theme-contract";\n'
    if anchor not in composition:
        raise SystemExit("stage-mode import anchor not found")
    composition = composition.replace(anchor, anchor + stage_mode_import, 1)
    composition_path.write_text(composition, encoding="utf-8")

# Remove the temporary npm lifecycle hook from the final branch state.
package_path = Path("package.json")
package = json.loads(package_path.read_text(encoding="utf-8"))
package.get("scripts", {}).pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# The reused successful verification job removes the historical Scene 8 workflow itself.
# Clean only the temporary machinery added for this repair here.
for temporary in (
    ".github/workflows/fixed-shell-composition-repair-2026-08-06.yml",
    "scripts/apply_fixed_shell_composition_repair.py",
    "scripts/run_fixed_shell_repair_once.py",
):
    Path(temporary).unlink(missing_ok=True)

# Stage only the intended fixed-shell renderer, contract tests, and temporary-file cleanup.
subprocess.run([
    "git", "add", "--",
    "package.json",
    "src/compositions/NasdaqCafeSpecEpisode.tsx",
    "src/components/spec/VisualTemplateRenderer.tsx",
    "src/components/spec/SpecVisualModes.tsx",
    "scripts/test-stage-legibility-contract.tsx",
    "scripts/test-shot-story.ts",
    ".github/workflows/fixed-shell-composition-repair-2026-08-06.yml",
    "scripts/apply_fixed_shell_composition_repair.py",
    "scripts/run_fixed_shell_repair_once.py",
], check=True)

print("fixed-shell repair applied, stage-mode type preserved, temporary hook removed, intended changes staged")
