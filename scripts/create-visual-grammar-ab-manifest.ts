import {createHash} from "node:crypto";
import {readdirSync, readFileSync, statSync, writeFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";

const SHA256_RE = /^[a-f0-9]{64}$/;
const COMMIT_RE = /^[a-f0-9]{40}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SpecIdentity = {
  specSha256: string;
  ttsInputSha256: string;
  narrationSha256: string;
  captionsSha256: string;
  sceneOrderSha256: string;
  numbersSha256: string;
  sourcesSha256: string;
  selectedPathsSha256: string;
  voiceProfileSha256: string;
  ttsAudioSha256: string;
};

export type RenderIdentity = SpecIdentity & {
  contractVersion: "1.0.0";
  label: "baseline" | "candidate";
  ref: string;
  stageMode: "legacy" | "candidate";
  commitSha: string;
  episodeId: string;
  specPath: string;
  previewPath: string;
  previewSha256: string;
  previewBytes: number;
  technicalReportSha256: string;
  inspectionSha256: string;
  productionDataSha256: string;
};

const parseJson = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));

const shaBytes = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");

const shaFile = (file: string) => shaBytes(readFileSync(file));

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
};

const shaCanonical = (value: unknown) => shaBytes(canonical(value));

const expectString = (value: unknown, name: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
};

const expectSha = (value: string, name: string) => {
  if (!SHA256_RE.test(value)) throw new Error(`${name} must be SHA-256`);
  return value;
};

const expectCommit = (value: string, name: string) => {
  if (!COMMIT_RE.test(value)) throw new Error(`${name} must be a 40-character commit SHA`);
  return value;
};

const listAudioFiles = (root: string): string[] => {
  const result: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name === "audio.wav") result.push(absolute);
    }
  };
  visit(root);
  return result.sort((left, right) =>
    path.relative(root, left).localeCompare(path.relative(root, right)),
  );
};

export const createTtsAudioIdentity = (audioRoot: string) => {
  const files = listAudioFiles(audioRoot);
  if (files.length !== 2) {
    throw new Error(`A/B preview requires exactly two cached audio.wav files; found=${files.length}`);
  }
  return shaCanonical(
    files.map((file) => ({
      relativePath: path.relative(audioRoot, file).split(path.sep).join("/"),
      sha256: shaFile(file),
      bytes: statSync(file).size,
    })),
  );
};

export const createSpecIdentity = (
  specFile: string,
  ttsInputSha256: string,
  audioRoot: string,
): SpecIdentity => {
  expectSha(ttsInputSha256, "ttsInputSha256");
  const spec = parseJson(specFile) as Record<string, unknown>;
  if (spec.schemaVersion !== "2.4.0") {
    throw new Error(`Visual Grammar A/B requires render_spec 2.4.0; got=${String(spec.schemaVersion)}`);
  }
  const episode = spec.episode as Record<string, unknown> | undefined;
  const episodeId = episode?.id;
  if (typeof episodeId !== "string" || !DATE_RE.test(episodeId)) {
    throw new Error("render_spec episode.id must be YYYY-MM-DD");
  }
  const scenes = spec.scenes;
  if (!Array.isArray(scenes) || scenes.length !== 9) {
    throw new Error("render_spec must contain exactly 9 scenes");
  }

  const narration = scenes.flatMap((sceneValue) => {
    const scene = sceneValue as Record<string, unknown>;
    const chunks = scene.narrationChunks;
    if (!Array.isArray(chunks)) throw new Error(`${String(scene.sceneId)} narrationChunks missing`);
    return chunks.map((chunkValue) => {
      const chunk = chunkValue as Record<string, unknown>;
      return {
        sceneId: scene.sceneId,
        chunkId: chunk.chunkId,
        speechText: chunk.speechText,
      };
    });
  });

  const captions = scenes.flatMap((sceneValue) => {
    const scene = sceneValue as Record<string, unknown>;
    return (scene.narrationChunks as Array<Record<string, unknown>>).map((chunk) => ({
      sceneId: scene.sceneId,
      chunkId: chunk.chunkId,
      captionText: chunk.captionText,
    }));
  });

  const sceneOrder = scenes.map((sceneValue) => {
    const scene = sceneValue as Record<string, unknown>;
    return {sceneId: scene.sceneId, sceneNumber: scene.sceneNumber};
  });

  const numbers = scenes.map((sceneValue) => {
    const scene = sceneValue as Record<string, unknown>;
    return {sceneId: scene.sceneId, numbers: scene.numbers};
  });

  const selectedPaths = scenes.flatMap((sceneValue) => {
    const scene = sceneValue as Record<string, unknown>;
    const beats = scene.visualBeats;
    if (!Array.isArray(beats)) throw new Error(`${String(scene.sceneId)} visualBeats missing`);
    return beats.map((beatValue) => {
      const beat = beatValue as Record<string, unknown>;
      const trace = beat.financialVisualTrace as Record<string, unknown> | undefined;
      return {
        sceneId: scene.sceneId,
        beatId: beat.beatId,
        visualTemplate: beat.visualTemplate,
        visualGrammarId: beat.visualGrammarId,
        transitionRole: beat.transitionRole,
        returnTargetBeatId: beat.returnTargetBeatId ?? null,
        selectedPath: trace?.selectedPath ?? null,
        assetState: beat.assetState,
      };
    });
  });

  return {
    specSha256: shaFile(specFile),
    ttsInputSha256,
    narrationSha256: shaCanonical(narration),
    captionsSha256: shaCanonical(captions),
    sceneOrderSha256: shaCanonical(sceneOrder),
    numbersSha256: shaCanonical(numbers),
    sourcesSha256: shaCanonical(spec.sources),
    selectedPathsSha256: shaCanonical(selectedPaths),
    voiceProfileSha256: shaCanonical({
      voiceProfileId: spec.voiceProfileId,
      pronunciations: spec.pronunciations,
    }),
    ttsAudioSha256: createTtsAudioIdentity(audioRoot),
  };
};

export const createRenderIdentity = (args: {
  label: "baseline" | "candidate";
  ref: string;
  stageMode: "legacy" | "candidate";
  commitSha: string;
  specFile: string;
  specPath: string;
  ttsInputSha256: string;
  audioRoot: string;
  previewFile: string;
  technicalReportFile: string;
  inspectionFile: string;
  productionDataFile: string;
}): RenderIdentity => {
  expectString(args.ref, "ref");
  expectCommit(args.commitSha, "commitSha");
  if (args.label === "baseline" && args.stageMode !== "legacy") {
    throw new Error("baseline identity requires legacy stage mode");
  }
  if (args.label === "candidate" && args.stageMode !== "candidate") {
    throw new Error("candidate identity requires candidate stage mode");
  }
  const identity = createSpecIdentity(args.specFile, args.ttsInputSha256, args.audioRoot);
  for (const file of [
    args.previewFile,
    args.technicalReportFile,
    args.inspectionFile,
    args.productionDataFile,
  ]) {
    if (!statSync(file).isFile() || statSync(file).size === 0) {
      throw new Error(`required A/B output missing or empty: ${file}`);
    }
  }
  const spec = parseJson(args.specFile) as {episode?: {id?: string}};
  const episodeId = spec.episode?.id ?? "";
  const technical = parseJson(args.technicalReportFile) as Record<string, unknown>;
  if (technical.status !== "preview-generated") {
    throw new Error(`${args.label} technical report is not preview-generated`);
  }
  if (technical.inputSpecSha256 !== identity.specSha256) {
    throw new Error(`${args.label} technical report spec SHA mismatch`);
  }
  if (technical.episodeId !== episodeId) {
    throw new Error(`${args.label} technical report episode mismatch`);
  }
  if (technical.visualGrammarStageMode !== args.stageMode) {
    throw new Error(`${args.label} technical report stage mode mismatch`);
  }
  if (technical.finalAuthorized !== false) {
    throw new Error(`${args.label} technical report must forbid final`);
  }
  const inspection = parseJson(args.inspectionFile) as Record<string, unknown>;
  const inspectionDetails = inspection.inspection as Record<string, unknown> | undefined;
  if (inspection.status !== "valid" || inspectionDetails?.fullDecode !== true) {
    throw new Error(`${args.label} preview inspection is not valid/fullDecode`);
  }
  if (inspection.visualGrammarStageMode !== args.stageMode) {
    throw new Error(`${args.label} preview inspection stage mode mismatch`);
  }
  if (inspection.finalAuthorized !== false) {
    throw new Error(`${args.label} preview inspection must forbid final`);
  }
  const production = parseJson(args.productionDataFile) as {episode?: {id?: string}};
  if (production.episode?.id !== episodeId) {
    throw new Error(`${args.label} production data episode mismatch`);
  }
  return {
    contractVersion: "1.0.0",
    label: args.label,
    ref: args.ref,
    stageMode: args.stageMode,
    commitSha: args.commitSha,
    episodeId,
    specPath: args.specPath,
    ...identity,
    previewPath: args.previewFile,
    previewSha256: shaFile(args.previewFile),
    previewBytes: statSync(args.previewFile).size,
    technicalReportSha256: shaFile(args.technicalReportFile),
    inspectionSha256: shaFile(args.inspectionFile),
    productionDataSha256: shaFile(args.productionDataFile),
  };
};

const identityKeys: Array<keyof SpecIdentity> = [
  "specSha256",
  "ttsInputSha256",
  "narrationSha256",
  "captionsSha256",
  "sceneOrderSha256",
  "numbersSha256",
  "sourcesSha256",
  "selectedPathsSha256",
  "voiceProfileSha256",
  "ttsAudioSha256",
];

export const createManifest = (
  baseline: RenderIdentity,
  candidate: RenderIdentity,
  createdAt = new Date().toISOString(),
) => {
  if (baseline.label !== "baseline" || candidate.label !== "candidate") {
    throw new Error("A/B manifest requires baseline and candidate identities");
  }
  if (baseline.episodeId !== candidate.episodeId) {
    throw new Error("baseline and candidate episodeId differ");
  }
  if (baseline.specPath !== candidate.specPath) {
    throw new Error("baseline and candidate specPath differ");
  }
  for (const key of identityKeys) {
    if (baseline[key] !== candidate[key]) {
      throw new Error(`A/B invariant mismatch: ${key}`);
    }
  }
  if (baseline.commitSha !== candidate.commitSha) {
    throw new Error("baseline and candidate must use the same renderer commit");
  }
  if (baseline.productionDataSha256 !== candidate.productionDataSha256) {
    throw new Error("A/B invariant mismatch: productionDataSha256");
  }
  if (baseline.stageMode !== "legacy" || candidate.stageMode !== "candidate") {
    throw new Error("A/B comparison requires legacy baseline and candidate Stage Shell modes");
  }

  return {
    contractVersion: "1.0.0",
    status: "ready-for-user-review",
    finalAuthorized: false,
    userReviewRequired: true,
    episodeId: baseline.episodeId,
    specPath: baseline.specPath,
    specSha256: baseline.specSha256,
    ttsInputSha256: baseline.ttsInputSha256,
    baseline: {
      label: baseline.label,
      ref: baseline.ref,
      stageMode: baseline.stageMode,
      commitSha: baseline.commitSha,
      previewPath: baseline.previewPath,
      previewSha256: baseline.previewSha256,
      previewBytes: baseline.previewBytes,
      technicalReportSha256: baseline.technicalReportSha256,
      inspectionSha256: baseline.inspectionSha256,
      productionDataSha256: baseline.productionDataSha256,
      ttsAudioSha256: baseline.ttsAudioSha256,
    },
    candidate: {
      label: candidate.label,
      ref: candidate.ref,
      stageMode: candidate.stageMode,
      commitSha: candidate.commitSha,
      previewPath: candidate.previewPath,
      previewSha256: candidate.previewSha256,
      previewBytes: candidate.previewBytes,
      technicalReportSha256: candidate.technicalReportSha256,
      inspectionSha256: candidate.inspectionSha256,
      productionDataSha256: candidate.productionDataSha256,
      ttsAudioSha256: candidate.ttsAudioSha256,
    },
    invariants: {
      sameSpec: true,
      sameTtsInput: true,
      sameTtsAudio: true,
      sameNarration: true,
      sameCaptions: true,
      sameSceneOrder: true,
      sameNumbers: true,
      sameSources: true,
      sameSelectedPaths: true,
      sameVoiceProfile: true,
      sameProductionData: true,
      allEqual: true,
    },
    reviewQuestions: [
      "Sceneが進むごとに画面の物理構造が変わっているか",
      "冒頭の矛盾が旧版より早く理解できるか",
      "Expected・Actual・Gapの表示順が自然か",
      "世界からNASDAQへの因果経路を追いやすいか",
      "Scene 7の比較がランキングではなく理由の比較になっているか",
      "Scene 8まで見る理由と強まる・弱まる条件が残っているか",
      "狐が案内役として見やすく、市場説明を妨げていないか",
    ],
    createdAt,
  };
};

const parseArgs = (argv: string[]) => {
  const result = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`invalid argument near ${key ?? "<end>"}`);
    }
    result.set(key.slice(2), value);
  }
  return result;
};

const required = (args: Map<string, string>, key: string) => {
  const value = args.get(key);
  if (!value) throw new Error(`missing --${key}`);
  return value;
};

const main = () => {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (command === "identity") {
    const label = required(args, "label");
    if (label !== "baseline" && label !== "candidate") {
      throw new Error("--label must be baseline or candidate");
    }
    const value = createRenderIdentity({
      label,
      ref: required(args, "ref"),
      stageMode: required(args, "stage-mode") as "legacy" | "candidate",
      commitSha: required(args, "commit-sha"),
      specFile: required(args, "spec-file"),
      specPath: required(args, "spec-path"),
      ttsInputSha256: required(args, "tts-input-sha"),
      audioRoot: required(args, "audio-root"),
      previewFile: required(args, "preview"),
      technicalReportFile: required(args, "technical-report"),
      inspectionFile: required(args, "inspection"),
      productionDataFile: required(args, "production-data"),
    });
    writeFileSync(required(args, "output"), `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return;
  }
  if (command === "manifest") {
    const baseline = parseJson(required(args, "baseline")) as RenderIdentity;
    const candidate = parseJson(required(args, "candidate")) as RenderIdentity;
    const manifest = createManifest(baseline, candidate);
    writeFileSync(required(args, "output"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    return;
  }
  throw new Error(`unknown command: ${command ?? "<missing>"}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
