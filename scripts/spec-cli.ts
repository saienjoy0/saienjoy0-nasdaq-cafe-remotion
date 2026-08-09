import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia, renderStill} from "@remotion/renderer";
import voiceProfilesJson from "../config/voice-profiles.json";
import {loadRuntimeAssetContext} from "../src/config/runtime-assets";
import {compileRenderSpec, type SynthesizedChunk} from "../src/spec/compile-render-spec";
import {getTransitionDurationInFrames} from "../src/spec/render-state";
import {measureVisualGrammarTiming} from "../src/spec/measure-visual-grammar";
import {assertProductionTextSafe, resolveVoiceProfile} from "../src/spec/validate-render-spec";
import {
  evaluateDurationContract,
  type DurationPolicyCommand,
} from "./duration-policy";
import {loadProductionData, loadRenderSpec, loadRenderSpecForProduction} from "./load-render-spec";
import {PROJECT_DIR} from "./render-helpers";
import {createSpecBlockSynthesizer, SPEC_AUDIO_STANDARD} from "./spec-audio";
import {inspectSpecMedia} from "./spec-inspect";

const command = process.argv[2];
const input = process.argv[3];
if (!command || !input) {
  throw new Error(
    "usage: spec-cli <validate|compile|preview|final|inspect|still|fixture-compile> <render_spec.json>",
  );
}
const isFixture = path.resolve(input).includes(`${path.sep}fixtures${path.sep}`);
const runtimeAssets = await loadRuntimeAssetContext();
const publicAssets = runtimeAssets.paths;
const workspaceFor = (id: string) =>
  isFixture
    ? path.join(PROJECT_DIR, "build", "tests", "expression-final-verification", id)
    : path.join(PROJECT_DIR, "build", id);
const buildPath = (id: string) => path.join(workspaceFor(id), "render_data.production.json");
const technicalPath = (id: string) => path.join(workspaceFor(id), "technical_report.json");
const visualGrammarTimingPath = (id: string) =>
  path.join(workspaceFor(id), "visual_grammar_timing_report.json");
const mediaPath = (kind: "preview" | "final", id: string) => {
  const directory = isFixture
    ? path.join(PROJECT_DIR, "renders", "tests", "expression-final-verification", kind)
    : path.join(PROJECT_DIR, "renders", kind);
  return path.join(
    directory,
    `${id}_nasdaq-cafe-spec${kind === "preview" ? "-preview" : ""}.mp4`,
  );
};

const compile = async (durationPolicyCommand: DurationPolicyCommand) => {
  const loaded = await loadRenderSpecForProduction(input, runtimeAssets.manifest);
  const {spec, sha256, expressionPreflight} = loaded;
  const profile = resolveVoiceProfile(spec.voiceProfileId, voiceProfilesJson);
  const audioDiagnostics: Array<{
    sceneId: string;
    chunkId: string;
    audio: SynthesizedChunk;
  }> = [];
  const data = await compileRenderSpec(
    spec,
    createSpecBlockSynthesizer(spec),
    publicAssets,
    {
      inputSpecSha256: sha256,
      onSynthesizedChunk: (value) => audioDiagnostics.push(value),
    },
  );
  const measuredDurationMs = Math.round(
    (data.timeline.totalDurationInFrames * 1000) / data.episode.fps,
  );
  const durationWarnings = evaluateDurationContract({
    command: durationPolicyCommand,
    durationMode: spec.episode.durationMode,
    measuredDurationMs,
    isFixture,
  });
  for (const warning of durationWarnings) {
    console.warn(`::warning title=Duration contract::${warning.message}`);
  }

  const output = buildPath(spec.episode.id);
  const reportPath = technicalPath(spec.episode.id);
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  const visualGrammarTimingReport = measureVisualGrammarTiming(spec, data);
  const visualGrammarTimingReportPath = visualGrammarTimingReport
    ? visualGrammarTimingPath(spec.episode.id)
    : null;
  let visualGrammarTimingReportSha256: string | null = null;
  if (visualGrammarTimingReport && visualGrammarTimingReportPath) {
    const timingJson = `${JSON.stringify(visualGrammarTimingReport, null, 2)}\n`;
    await writeFile(visualGrammarTimingReportPath, timingJson, "utf8");
    visualGrammarTimingReportSha256 = createHash("sha256").update(timingJson).digest("hex");
  }
  const diagnosticByChunk = new Map(
    audioDiagnostics.map((item) => [item.chunkId, item.audio]),
  );
  const chunks = data.scenes.flatMap((scene) =>
    scene.narrationChunks.map((chunk) => {
      const audio = diagnosticByChunk.get(chunk.chunkId)!;
      return {
        sceneId: scene.sceneId,
        chunkId: chunk.chunkId,
        cacheKey: audio.cacheKey,
        cacheHit: audio.cacheHit,
        audioPath: audio.audioPath,
        audioSrc: chunk.audioSrc,
        durationMs: chunk.audioDurationMs,
        pauseAfterMs: chunk.pauseAfterMs,
        sampleRate: audio.sampleRate,
        channels: audio.channels,
        codec: audio.codec,
      };
    }),
  );
  const overlaps = data.scenes.slice(0, -1).map((scene) => ({
    sceneId: scene.sceneId,
    type: scene.transition.type,
    durationMs: scene.transition.durationMs,
    frames: getTransitionDurationInFrames(scene, spec.episode.fps),
  }));
  const report = {
    status: visualGrammarTimingReport?.status === "FAIL" ? "compile-blocked" : "compiled",
    generatedAt: new Date().toISOString(),
    inputSpecPath: loaded.resolved,
    inputSpecSha256: sha256,
    schemaVersion: spec.schemaVersion,
    episodeId: spec.episode.id,
    voiceProfileId: spec.voiceProfileId,
    provider: profile.provider,
    speakerUuid: profile.speakerUuid,
    styleId: profile.styleId,
    characterName: profile.characterName,
    styleName: profile.styleName,
    sceneCount: data.scenes.length,
    chunkCount: chunks.length,
    runtimeAssets: {
      source: runtimeAssets.bundleId ? "handoff" : "static-only",
      bundleId: runtimeAssets.bundleId,
      episodeDate: runtimeAssets.episodeDate,
      resolvedAssetCount: Object.keys(publicAssets).length,
    },
    expressionPreflight: {
      status: "valid",
      checked: expressionPreflight.checked.length,
      assets: expressionPreflight.assets,
    },
    assetPreflight: {
      status: "valid",
      checked: data.scenes.flatMap((scene) => scene.assetPlacements).length,
    },
    cache: {
      hits: chunks.filter((chunk) => chunk.cacheHit).length,
      misses: chunks.filter((chunk) => !chunk.cacheHit).length,
    },
    audioStandard: SPEC_AUDIO_STANDARD,
    chunks,
    scenes: data.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      durationMs: scene.durationMs,
      durationInFrames: scene.durationInFrames,
      startFrame: scene.startFrame,
      endFrame: scene.endFrame,
    })),
    transitionOverlaps: overlaps,
    visualGrammarTiming: visualGrammarTimingReport
      ? {
          status: visualGrammarTimingReport.status,
          path: visualGrammarTimingReportPath,
          sha256: visualGrammarTimingReportSha256,
          timingBasis: visualGrammarTimingReport.timingBasis,
          fallbackDiversityRecheck: visualGrammarTimingReport.fallbackDiversityRecheck,
          selectedFallbackBeatIds: visualGrammarTimingReport.selectedFallbackBeatIds,
          unresolvedStateCount: visualGrammarTimingReport.unresolvedStateCount,
          failureCodes: visualGrammarTimingReport.failures.map((failure) => failure.code),
        }
      : null,
    totalProductionDuration: {
      frames: data.timeline.totalDurationInFrames,
      ms: measuredDurationMs,
    },
    warnings: durationWarnings,
    errors: visualGrammarTimingReport?.failures ?? [],
    productionJsonPath: output,
    previewPath: mediaPath("preview", spec.episode.id),
    testFinalPath: isFixture ? mediaPath("final", spec.episode.id) : null,
    render: {
      codec: "h264",
      fps: spec.episode.fps,
      width: spec.episode.width,
      height: spec.episode.height,
      audioExpected: true,
      audioCodec: "aac",
      sampleRate: 48000,
      channels: 2,
    },
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (visualGrammarTimingReport?.status === "FAIL") {
    throw new Error(
      `Visual Grammar measured diversity gate failed: ${visualGrammarTimingReport.failures
        .map((failure) => failure.code)
        .join(", ")}`,
    );
  }
  return {
    spec,
    data,
    output,
    reportPath,
    visualGrammarTimingReportPath,
    visualGrammarTimingReportSha256,
  };
};

const prepare = async (
  compositionId: string,
  inputProps: Record<string, unknown>,
) => {
  const serveUrl = await bundle({
    entryPoint: path.join(PROJECT_DIR, "src", "index.ts"),
  });
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find((item) => item.id === compositionId);
  if (!composition) throw new Error(`composition not found: ${compositionId}`);
  return {serveUrl, composition};
};

if (command === "validate") {
  const {spec} = await loadRenderSpec(input, runtimeAssets.manifest);
  console.log(`render_spec valid: ${spec.episode.id}`);
} else if (command === "fixture-compile") {
  const {spec, sha256} = await loadRenderSpec(input, runtimeAssets.manifest);
  if (!isFixture) {
    throw new Error("fixture-compile accepts only render-specs/fixtures inputs");
  }
  const data = await compileRenderSpec(
    spec,
    async ({episodeId, sceneId, chunkId, speechText}) => ({
      audioSrc: `technical-only/${episodeId}/${sceneId}/${chunkId}.wav`,
      audioPath: `technical-only/${episodeId}/${sceneId}/${chunkId}.wav`,
      durationMs: 1000,
      cacheKey: await import("node:crypto").then(({createHash}) =>
        createHash("sha256").update(speechText).digest("hex"),
      ),
      cacheHit: false,
      sampleRate: 48000,
      channels: 1,
      codec: "pcm_s16le",
    }),
    publicAssets,
    {inputSpecSha256: sha256},
  );
  const output = path.join(
    workspaceFor(spec.episode.id),
    "render_data.debug.json",
  );
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`fixture compile (no TTS): ${output}`);
} else if (command === "compile") {
  const result = await compile("compile");
  console.log(`production data: ${result.output}`);
  console.log(`technical report: ${result.reportPath}`);
} else if (command === "preview" || command === "final") {
  const {spec, data, reportPath} = await compile(command);
  const inputProps = {data};
  const {serveUrl, composition} = await prepare("NasdaqCafeSpec", inputProps);
  const kind = command;
  const output = mediaPath(kind, spec.episode.id);
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
    crf: kind === "preview" ? 30 : 18,
    scale: kind === "preview" ? 0.5 : 1,
  });
  const existing = JSON.parse(
    await readFile(reportPath, "utf8"),
  ) as Record<string, unknown>;
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        ...existing,
        status: `${kind}-generated`,
        [kind === "preview" ? "previewPath" : "testFinalPath"]: output,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`${kind}: ${output}`);
} else if (command === "still") {
  const {spec} = await loadRenderSpec(input, runtimeAssets.manifest);
  const inputProps = {scene: spec.scenes[0], assets: publicAssets};
  const {serveUrl, composition} = await prepare(
    "NasdaqCafeSpecDebugStill",
    inputProps,
  );
  const directory = path.join(
    PROJECT_DIR,
    "renders",
    "tests",
    "spec-fixture-still",
  );
  await mkdir(directory, {recursive: true});
  const output = path.join(directory, "minimal.png");
  await renderStill({
    composition,
    serveUrl,
    inputProps,
    output,
    imageFormat: "png",
  });
  console.log(`fixture still: ${output}`);
} else if (command === "inspect") {
  const {spec} = await loadRenderSpec(input, runtimeAssets.manifest);
  const productionPath = buildPath(spec.episode.id);
  const data = await loadProductionData(productionPath);
  assertProductionTextSafe(data);
  const expectedMs = Math.round(
    (data.timeline.totalDurationInFrames * 1000) / data.episode.fps,
  );
  const preview = mediaPath("preview", spec.episode.id);
  const final = mediaPath("final", spec.episode.id);
  const media = {
    preview: await inspectSpecMedia(preview, {
      codec: "h264",
      fps: data.episode.fps,
      width: Math.round(data.episode.width * 0.5),
      height: Math.round(data.episode.height * 0.5),
      sampleRate: 48000,
      channels: 2,
      durationMs: expectedMs,
      toleranceMs: Math.ceil(2000 / data.episode.fps),
    }),
    final: await inspectSpecMedia(final, {
      codec: "h264",
      fps: data.episode.fps,
      width: data.episode.width,
      height: data.episode.height,
      sampleRate: 48000,
      channels: 2,
      durationMs: expectedMs,
      toleranceMs: Math.ceil(2000 / data.episode.fps),
    }),
  };
  const oldReport = JSON.parse(
    await readFile(technicalPath(spec.episode.id), "utf8"),
  ) as Record<string, unknown>;
  const report = {
    ...oldReport,
    status: "inspected",
    inspectedAt: new Date().toISOString(),
    productionPath,
    productionBytes: (await readFile(productionPath)).byteLength,
    media,
  };
  await writeFile(
    technicalPath(spec.episode.id),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  if (media.preview.status !== "valid") {
    throw new Error(`preview inspect failed: ${media.preview.status}`);
  }
  console.log(`technical report: ${technicalPath(spec.episode.id)}`);
} else {
  throw new Error(`unknown spec command: ${command}`);
}
