import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createManifest,
  createRenderIdentity,
  createSpecIdentity,
} from "./create-visual-grammar-ab-manifest";
import {
  VisualGrammarStageHost,
  VisualGrammarStageModeProvider,
} from "../src/components/spec/VisualGrammarStageHost";
import {parseVisualGrammarStageMode} from "../src/spec/visual-grammar-stage-mode";

const temp = mkdtempSync(path.join(os.tmpdir(), "nasdaq-cafe-vg-ab-"));
const audioRoot = path.join(temp, "audio");
mkdirSync(path.join(audioRoot, "block-a"), {recursive: true});
mkdirSync(path.join(audioRoot, "block-b"), {recursive: true});
writeFileSync(path.join(audioRoot, "block-a", "audio.wav"), "RIFF-a");
writeFileSync(path.join(audioRoot, "block-b", "audio.wav"), "RIFF-b");

const specPath = path.join(temp, "render_spec.json");
const scene = (number: number) => ({
  sceneId: `scene-${String(number).padStart(2, "0")}`,
  sceneNumber: number,
  narrationChunks: [{
    chunkId: `scene-${String(number).padStart(2, "0")}-chunk-001`,
    speechText: `speech ${number}`,
    captionText: `caption ${number}`,
  }],
  visualBeats: [{
    beatId: `scene-${String(number).padStart(2, "0")}-beat-001`,
    visualTemplate: number === 1 ? "opening-contradiction" : number === 9 ? "closing-recap" : "text-focus",
    visualGrammarId: number === 1 ? "contradiction" : number === 9 ? "assembly" : "bridge-text",
    transitionRole: number === 9 ? "closing" : "continuation",
    returnTargetBeatId: null,
    assetState: "ready",
  }],
  numbers: [{numberId: `n-${number}`, value: String(number)}],
});
const spec = {
  schemaVersion: "2.4.0",
  episode: {id: "2099-02-02"},
  voiceProfileId: "fox",
  pronunciations: [],
  sources: [{sourceId: "source-001"}],
  scenes: Array.from({length: 9}, (_, index) => scene(index + 1)),
};
writeFileSync(specPath, `${JSON.stringify(spec)}\n`);

const ttsInputSha = "a".repeat(64);
const identity = createSpecIdentity(specPath, ttsInputSha, audioRoot);
assert.equal(identity.specSha256.length, 64);
assert.equal(identity.ttsAudioSha256.length, 64);

const outputFiles = {
  previewFile: path.join(temp, "preview.mp4"),
  technicalReportFile: path.join(temp, "technical.json"),
  inspectionFile: path.join(temp, "inspection.json"),
  productionDataFile: path.join(temp, "production.json"),
};
writeFileSync(outputFiles.previewFile, "video");
writeFileSync(outputFiles.technicalReportFile, JSON.stringify({
  status: "preview-generated",
  inputSpecSha256: identity.specSha256,
  episodeId: "2099-02-02",
  visualGrammarStageMode: "legacy",
  finalAuthorized: false,
}));
writeFileSync(outputFiles.inspectionFile, JSON.stringify({
  status: "valid",
  visualGrammarStageMode: "legacy",
  finalAuthorized: false,
  inspection: {fullDecode: true},
}));
writeFileSync(outputFiles.productionDataFile, JSON.stringify({
  episode: {id: "2099-02-02"},
}));

const baseline = createRenderIdentity({
  label: "baseline",
  ref: "main",
  stageMode: "legacy",
  commitSha: "750f993bd00cf2f67fdb4ab18907e82ed0dc68df",
  specFile: specPath,
  specPath: "render-specs/2099-02-02/render_spec.json",
  ttsInputSha256: ttsInputSha,
  audioRoot,
  ...outputFiles,
});
writeFileSync(outputFiles.technicalReportFile, JSON.stringify({
  status: "preview-generated",
  inputSpecSha256: identity.specSha256,
  episodeId: "2099-02-02",
  visualGrammarStageMode: "candidate",
  finalAuthorized: false,
}));
writeFileSync(outputFiles.inspectionFile, JSON.stringify({
  status: "valid",
  visualGrammarStageMode: "candidate",
  finalAuthorized: false,
  inspection: {fullDecode: true},
}));
const candidate = createRenderIdentity({
  label: "candidate",
  ref: "main",
  stageMode: "candidate",
  commitSha: baseline.commitSha,
  specFile: specPath,
  specPath: "render-specs/2099-02-02/render_spec.json",
  ttsInputSha256: ttsInputSha,
  audioRoot,
  ...outputFiles,
});
const manifest = createManifest(baseline, candidate, "2026-08-06T00:00:00.000Z");
assert.equal(manifest.finalAuthorized, false);
assert.equal(manifest.userReviewRequired, true);
assert.equal(manifest.invariants.sameProductionData, true);
assert.equal(manifest.invariants.sameVoiceProfile, true);
assert.equal(manifest.invariants.allEqual, true);
assert.equal(manifest.status, "ready-for-user-review");

assert.throws(
  () => createManifest(baseline, {...candidate, ttsAudioSha256: "b".repeat(64)}),
  /ttsAudioSha256/,
);
assert.throws(
  () => createManifest(baseline, {...candidate, commitSha: "9".repeat(40)}),
  /same renderer commit/,
);
assert.throws(
  () => createManifest(baseline, {...candidate, productionDataSha256: "c".repeat(64)}),
  /productionDataSha256/,
);
assert.throws(
  () => createManifest(baseline, {...candidate, stageMode: "legacy"}),
  /legacy baseline and candidate/,
);

const workflowText = readFileSync(
  path.join(process.cwd(), ".github", "workflows", "visual-grammar-ab-preview.yml"),
  "utf8",
);
assert.match(workflowText, /workflow_dispatch:/);
assert.match(workflowText, /confirmation must be exactly AB_PREVIEW/);
assert.match(workflowText, /GITHUB_ACTOR.*GITHUB_REPOSITORY_OWNER/);
assert.match(workflowText, /SPEC_TTS_CACHE_ONLY: "1"/);
assert.match(workflowText, /VISUAL_GRAMMAR_AB_PREVIEW: "1"/);
assert.match(workflowText, /stage_mode: legacy/);
assert.match(workflowText, /stage_mode: candidate/);
assert.match(workflowText, /same renderer commit/);
assert.doesNotMatch(workflowText, /episode:spec:final/);
assert.doesNotMatch(workflowText, /\bFINAL\b/);

const rendererText = readFileSync(
  path.join(process.cwd(), "scripts", "render-visual-grammar-ab-preview.ts"),
  "utf8",
);
assert.match(rendererText, /SPEC_TTS_CACHE_ONLY/);
assert.match(rendererText, /VISUAL_GRAMMAR_AB_PREVIEW/);
assert.match(rendererText, /finalAuthorized: false/);
assert.doesNotMatch(rendererText, /renders\/final/);

const oldSpec = {...spec, schemaVersion: "2.3.0"};
writeFileSync(specPath, `${JSON.stringify(oldSpec)}\n`);
assert.throws(
  () => createSpecIdentity(specPath, ttsInputSha, audioRoot),
  /requires render_spec 2.4.0/,
);

const candidateMarkup = renderToStaticMarkup(
  <VisualGrammarStageModeProvider mode="candidate">
    <VisualGrammarStageHost visualTemplate="opening-contradiction" variant="default">
      <div>content</div>
    </VisualGrammarStageHost>
  </VisualGrammarStageModeProvider>,
);
const legacyMarkup = renderToStaticMarkup(
  <VisualGrammarStageModeProvider mode="legacy">
    <VisualGrammarStageHost visualTemplate="opening-contradiction" variant="default">
      <div>content</div>
    </VisualGrammarStageHost>
  </VisualGrammarStageModeProvider>,
);
assert.match(candidateMarkup, /data-stage-shell="OpenHeroStage"/);
assert.doesNotMatch(legacyMarkup, /data-stage-shell=/);
assert.match(legacyMarkup, />content</);
assert.equal(parseVisualGrammarStageMode(undefined), "candidate");
assert.equal(parseVisualGrammarStageMode("legacy"), "legacy");
assert.throws(() => parseVisualGrammarStageMode("auto"), /candidate or legacy/);

console.log("visual grammar A/B contract tests: PASS");
