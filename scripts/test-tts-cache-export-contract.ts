import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const exportWorkflow = await readFile(
  path.join(PROJECT_DIR, ".github", "workflows", "nasdaq-cafe-tts-cache-export.yml"),
  "utf8",
);
const motionWorkflow = await readFile(
  path.join(PROJECT_DIR, ".github", "workflows", "nasdaq-cafe-motion-preview.yml"),
  "utf8",
);
const restoreScript = await readFile(
  path.join(PROJECT_DIR, "scripts", "restore_exported_tts_cache.py"),
  "utf8",
);

assert(/^  push:/m.test(exportWorkflow));
assert(!/^  schedule:/m.test(exportWorkflow));
assert(!/^  workflow_dispatch:/m.test(exportWorkflow));
assert(exportWorkflow.includes('paths:\n      - "tts-cache-export-requests/*.json"'));
assert(exportWorkflow.includes("runs-on: ubuntu-24.04"));
assert(exportWorkflow.includes("actions/cache/restore@v5"));
assert(exportWorkflow.includes("fail-on-cache-miss: true"));
assert(exportWorkflow.includes("EXPORT_EXISTING_TTS_CACHE"));
assert(exportWorkflow.includes("actions/upload-artifact@v6"));
assert(exportWorkflow.includes("artifact-id"));
assert(exportWorkflow.includes("tts-cache-exports/${TTS_INPUT_SHA}.json"));
assert(exportWorkflow.includes("permissions:\n      contents: write"));
assert(!exportWorkflow.includes("GEMINI_API_KEY"));
assert(!exportWorkflow.includes("episode:spec:preview"));
assert(!exportWorkflow.includes("episode:spec:final"));

assert(motionWorkflow.includes("actions/cache/restore@v5"));
assert(motionWorkflow.includes("Restore exported production TTS artifact"));
assert(motionWorkflow.includes("scripts/restore_exported_tts_cache.py"));
assert(motionWorkflow.includes("Motion Preview does not generate or regenerate narration"));
assert(!motionWorkflow.includes("GEMINI_API_KEY"));
assert(!motionWorkflow.includes("episode:spec:preview"));
assert(!motionWorkflow.includes("episode:spec:final"));

assert(restoreScript.includes('"tts-cache-exports" / f"{tts_input_sha}.json"'));
assert(restoreScript.includes("/actions/artifacts/{artifact_id}/zip"));
assert(restoreScript.includes("CACHE_PREFIX = pathlib.PurePosixPath"));
assert(restoreScript.includes("member.issym()"));
assert(restoreScript.includes("member.islnk()"));
assert(restoreScript.includes("member.isdev()"));

console.log("PASS: portable production TTS cache export remains cache-only and safely restorable");
