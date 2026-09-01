import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia} from "@remotion/renderer";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const object = (value: unknown, label: string): Record<string, any> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, any>;
};

const episodeDate = requiredEnv("EPISODE_DATE");
const specPath = path.resolve(requiredEnv("SPEC_PATH"));
const expectedSpecSha256 = requiredEnv("EXPECTED_SPEC_SHA256");
const repoRoot = process.cwd();
const productionPath = path.join(repoRoot, "build", episodeDate, "render_data.production.json");
const technicalPath = path.join(repoRoot, "build", episodeDate, "technical_report.json");
const output = path.join(repoRoot, "renders", "final", `${episodeDate}_nasdaq-cafe-spec.mp4`);

const specBytes = await readFile(specPath);
if (sha256(specBytes) !== expectedSpecSha256) throw new Error("approved RenderSpec SHA mismatch before render-only adapter");
const spec = object(JSON.parse(specBytes.toString("utf8")), "render_spec");
if (spec.episode?.id !== episodeDate) throw new Error("render_spec episodeDate mismatch");

const data = object(JSON.parse(await readFile(productionPath, "utf8")), "render_data.production.json");
const technical = object(JSON.parse(await readFile(technicalPath, "utf8")), "technical_report.json");
if (technical.inputSpecSha256 !== expectedSpecSha256) throw new Error("compiled production data is not bound to approved RenderSpec SHA");
const cache = object(technical.cache, "technical cache");
if (!Number.isInteger(technical.chunkCount) || technical.chunkCount < 1) throw new Error("technical chunkCount is invalid");
if (cache.misses !== 0 || cache.hits !== technical.chunkCount) {
  throw new Error(`approved cache-only compile mismatch: hits=${cache.hits} misses=${cache.misses} chunkCount=${technical.chunkCount}`);
}
if (Array.isArray(technical.errors) && technical.errors.length !== 0) throw new Error("compiled production data contains technical errors");

// The historical Renderer commit owns the duration policy. Apply its exact final policy
// to the already-compiled production duration without invoking its obsolete approval gate.
const durationModuleUrl = pathToFileURL(path.join(repoRoot, "scripts", "duration-policy.ts")).href;
const durationModule = (await import(durationModuleUrl)) as {
  evaluateDurationContract: (input: {
    command: "final";
    durationMode: unknown;
    measuredDurationMs: number;
    isFixture: boolean;
  }) => string[];
};
const fps = data.episode?.fps;
const frames = data.timeline?.totalDurationInFrames;
if (typeof fps !== "number" || fps <= 0 || typeof frames !== "number" || frames <= 0) {
  throw new Error("compiled production duration is invalid");
}
const measuredDurationMs = Math.round((frames * 1000) / fps);
durationModule.evaluateDurationContract({
  command: "final",
  durationMode: spec.episode?.durationMode,
  measuredDurationMs,
  isFixture: false,
});

// Fail closed if the approved Renderer final branch no longer uses the render settings
// this compatibility adapter mirrors. This prevents a future Renderer change from being
// silently rendered with stale control-plane settings.
const approvedSpecCli = await readFile(path.join(repoRoot, "scripts", "spec-cli.ts"), "utf8");
for (const token of [
  'const {serveUrl, composition} = await prepare("NasdaqCafeSpec", inputProps);',
  'codec: "h264"',
  'audioCodec: "aac"',
  'sampleRate: 48000',
  'imageFormat: "jpeg"',
  'pixelFormat: "yuv420p"',
  'crf: kind === "preview" ? 30 : 18',
  'scale: kind === "preview" ? 0.5 : 1',
]) {
  if (!approvedSpecCli.includes(token)) throw new Error(`approved Renderer final render contract drift: ${token}`);
}

const inputProps = {data};
const serveUrl = await bundle({entryPoint: path.join(repoRoot, "src", "index.ts")});
const compositions = await getCompositions(serveUrl, {inputProps});
const composition = compositions.find((item) => item.id === "NasdaqCafeSpec");
if (!composition) throw new Error("composition not found: NasdaqCafeSpec");
await mkdir(path.dirname(output), {recursive: true});
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  outputLocation: output,
  codec: "h264",
  audioCodec: "aac",
  sampleRate: 48000,
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
  crf: 18,
  scale: 1,
});

await writeFile(
  technicalPath,
  `${JSON.stringify({...technical, status: "final-generated", testFinalPath: output}, null, 2)}\n`,
  "utf8",
);
console.log(`final: ${output}`);
