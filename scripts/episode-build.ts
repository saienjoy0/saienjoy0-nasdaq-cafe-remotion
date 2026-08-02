import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {PROJECT_DIR} from "./render-helpers";

const inputPath = process.argv[2];
const force = process.argv.includes("--force");
if (!inputPath) {
  throw new Error(
    "制作パッケージのパスが必要です。例: npm run episode:build -- episodes/2026-07-10/episode_package_2026-07-10.md",
  );
}
const resolvedPackage = path.isAbsolute(inputPath)
  ? inputPath
  : path.resolve(process.cwd(), inputPath);
const date = path.basename(resolvedPackage).match(/\d{4}-\d{2}-\d{2}/)?.[0];
if (!date) throw new Error(`入力ファイル名から日付を取得できません: ${inputPath}`);
const buildDirectory = path.join(PROJECT_DIR, "build", date);
await mkdir(buildDirectory, {recursive: true});
const runStatePath = path.join(buildDirectory, "run-state.json");
const sourceSha256 = createHash("sha256")
  .update(await readFile(resolvedPackage))
  .digest("hex");
const configSha256 = createHash("sha256")
  .update(await readFile(path.join(PROJECT_DIR, "config", "pronunciation-dictionary.json")))
  .update(await readFile(path.join(PROJECT_DIR, "config", "voice-profiles.json")))
  .digest("hex");
type Step =
  | "preflight"
  | "tts"
  | "captions"
  | "timeline"
  | "finalRender"
  | "inspection";
type RunState = {
  sourceSha256: string;
  configSha256: string;
  steps: Record<Step, "pending" | "completed">;
  updatedAt: string;
};
const blankSteps: RunState["steps"] = {
  preflight: "pending",
  tts: "pending",
  captions: "pending",
  timeline: "pending",
  finalRender: "pending",
  inspection: "pending",
};
let state: RunState = {
  sourceSha256,
  configSha256,
  steps: {...blankSteps},
  updatedAt: new Date().toISOString(),
};
try {
  const existing = JSON.parse(await readFile(runStatePath, "utf8")) as RunState;
  if (
    !force &&
    existing.sourceSha256 === sourceSha256 &&
    existing.configSha256 === configSha256
  ) {
    state = existing;
  }
} catch {
  // First run.
}
const saveState = async () => {
  state.updatedAt = new Date().toISOString();
  await writeFile(runStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
};
await saveState();

const run = (command: string, args: string[]) =>
  new Promise<void>((resolve, reject) => {
    const npmCli = path.resolve(
      path.dirname(process.execPath),
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    );
    const executable = command === "npm" ? process.execPath : command;
    const executableArgs = command === "npm" ? [npmCli, ...args] : args;
    const child = spawn(executable, executableArgs, {
      cwd: PROJECT_DIR,
      stdio: "inherit",
      shell: false,
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} がcode ${code}で失敗しました`)),
    );
  });

const complete = async (step: Step, action: () => Promise<void>) => {
  if (!force && state.steps[step] === "completed") {
    console.log(`Phase 8再開: ${step}は完了済みのため再利用`);
    return;
  }
  await action();
  state.steps[step] = "completed";
  await saveState();
};

const baseJson = path.join(buildDirectory, "episode_data.json");
const finalJson = path.join(buildDirectory, "episode_data.final.json");
await complete("preflight", async () => {
  await run("npm", ["run", "typecheck"]);
  await run("npm", ["run", "lint"]);
  await run("npm", ["run", "test:inputs"]);
  let reusable = false;
  try {
    const existing = JSON.parse(await readFile(baseJson, "utf8")) as {
      source?: {packageSha256?: string};
    };
    reusable = existing.source?.packageSha256 === sourceSha256;
  } catch {
    reusable = false;
  }
  if (!reusable) {
    await run("npm", ["run", "prepare:episode", "--", resolvedPackage]);
  }
  await run("npm", ["run", "validate:episode", "--", baseJson]);
  await run("npm", ["run", "list:compositions"]);
});
await complete("tts", async () => {
  await run("npm", [
    "run",
    "generate:voiceover",
    "--",
    baseJson,
    ...(force ? ["--force"] : []),
  ]);
});
await complete("captions", async () => {
  await run("npm", ["run", "validate:episode", "--", finalJson]);
});
await complete("timeline", async () => {
  const final = JSON.parse(await readFile(finalJson, "utf8")) as {
    timeline?: {durationSource?: string};
  };
  if (final.timeline?.durationSource !== "audio-measured") {
    throw new Error("実測Timelineが生成されていません");
  }
});
await complete("finalRender", async () => {
  await run("npm", ["run", "render:episode", "--", finalJson]);
});
await complete("inspection", async () => {
  await run("npm", ["run", "inspect:final", "--", finalJson]);
  await stat(path.join(PROJECT_DIR, "renders", "final", `${date}_nasdaq-cafe.mp4`));
});
console.log(`Phase 4〜8完了: ${date}`);
