import assert from "node:assert/strict";
import {readdir, readFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const workflowDir = path.join(PROJECT_DIR, ".github", "workflows");
const workflowFiles = (await readdir(workflowDir))
  .filter((file) => /\.ya?ml$/i.test(file))
  .sort();

const forbiddenWorkflowNames = new Set([
  "nasdaq-cafe-post-tts-authoring-repair.yml",
  "nasdaq-cafe-post-tts-authoring-repair-with-events.yml",
  "nasdaq-cafe-post-tts-authoring-repair-with-events-v2.yml",
  "nasdaq-cafe-post-tts-visual-patch.yml",
  "nasdaq-cafe-post-tts-visual-patch-v2.yml",
  "nasdaq-cafe-post-tts-authoring-repair-observer.yml",
  "nasdaq-cafe-post-tts-patch-observer.yml",
  "nasdaq-cafe-post-tts-patch-v2-observer.yml",
  "nasdaq-cafe-post-tts-repair-observer.yml",
  "nasdaq-cafe-scene5-tailwind-repair-observer.yml",
  "nasdaq-cafe-tailwind-lanes-observer.yml",
]);

for (const file of forbiddenWorkflowNames) {
  assert(
    !workflowFiles.includes(file),
    `Renderer must not own semantic Post-TTS repair workflow: ${file}`,
  );
}

const forbiddenSemanticExecutors = [
  "apply-post-tts-authoring-repair.py",
  "apply-post-tts-event-copies.py",
  "apply-post-tts-object-id-overrides.py",
  "post-tts-visual-patch",
];

for (const file of workflowFiles) {
  const text = await readFile(path.join(workflowDir, file), "utf8");
  for (const marker of forbiddenSemanticExecutors) {
    assert(
      !text.includes(marker),
      `${file}: Renderer workflow may measure/report Post-TTS state but may not execute semantic repair via ${marker}`,
    );
  }
}

const shotPlan = await readFile(
  path.join(workflowDir, "nasdaq-cafe-shot-plan-apply.yml"),
  "utf8",
);
assert(
  shotPlan.includes("scripts/apply_measured_shot_plan.py"),
  "measured Shot timing applicator must remain available",
);
assert(
  !shotPlan.includes("GEMINI_API_KEY") && !shotPlan.includes("episode:spec:final"),
  "measured Shot timing workflow must remain mechanical and non-final",
);

console.log(
  "PASS: Renderer Post-TTS ownership is measurement/timing-only; semantic visual repair entrypoints are absent",
);
