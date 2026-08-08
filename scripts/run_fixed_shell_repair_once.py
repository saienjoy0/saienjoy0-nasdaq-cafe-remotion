import json
import runpy
import subprocess
from pathlib import Path

# Apply the authored renderer/test repair before tsc runs.
runpy.run_path("scripts/apply_fixed_shell_composition_repair.py", run_name="__main__")

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

print("fixed-shell repair applied, temporary hook removed, intended changes staged")
