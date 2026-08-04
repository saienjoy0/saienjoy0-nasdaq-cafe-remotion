import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import type {Expression} from "../src/spec/render-spec";
import type {CameraPreset, ShotRecipe, ShotTransition, SoundCue, StageLayout, TypographyTreatment} from "../src/spec/shot-contract";

const input = process.argv[2];
if (!input) throw new Error("usage: tsx scripts/migrate-visual-story-v3.ts <render_spec.json>");

const config: Record<string, ShotRecipe[]> = {
  "opening-contradiction": ["hero-metric-impact", "contradiction-interrupt", "contradiction-interrupt"],
  "hero-number": ["hero-metric-impact", "entity-cutaway"],
  "entity-card-full": ["entity-cutaway", "hero-metric-impact"],
  "expected-actual-bullet": ["expected-anchor", "actual-crosses-expected", "gap-macro"],
  "expected-actual-gap-flow": ["expected-anchor", "actual-crosses-expected", "gap-macro"],
  "causal-lane": ["causal-build", "causal-build"],
  "tailwind-headwind": ["causal-build", "counterforce-interrupt"],
  "split-comparison": ["split-opposition", "split-opposition"],
  "diverging-stock-bars": ["split-opposition", "focus-matrix-reveal"],
  "index-return-bars": ["hero-metric-impact", "split-opposition"],
  "focus-matrix": ["focus-matrix-reveal", "focus-matrix-reveal"],
  "verification-matrix": ["verification-two-paths", "verification-two-paths"],
  "verification-checklist": ["verification-two-paths", "verification-two-paths"],
  "final-assembly": ["recap-assembly", "recap-assembly"],
  "closing-recap": ["recap-assembly", "recap-assembly"],
  "metric-comparison-board": ["hero-metric-impact", "split-opposition"],
  "conclusion-card": ["hero-metric-impact", "hero-metric-impact"],
  "evidence-boundary": ["causal-build", "counterforce-interrupt"],
  "analogy-steps": ["causal-build", "causal-build"],
  "news-media": ["entity-cutaway", "hero-metric-impact"],
  "text-focus": ["hero-metric-impact", "hero-metric-impact"],
};

const recipeDetails: Record<ShotRecipe, {
  layout: StageLayout;
  camera: CameraPreset;
  transitionIn: ShotTransition;
  transitionOut: ShotTransition;
  expression: Expression;
  typography: TypographyTreatment | null;
  sound: SoundCue | null;
}> = {
  "hero-metric-impact": {layout: "hero-center", camera: "push-in", transitionIn: "soft-reveal", transitionOut: "pin-to-corner", expression: "分析", typography: "number-roll", sound: null},
  "contradiction-interrupt": {layout: "split-vertical", camera: "pan-right", transitionIn: "continue-from-previous", transitionOut: "carry-forward", expression: "軽い驚き", typography: "word-build", sound: "comparison-split"},
  "expected-anchor": {layout: "full-stage", camera: "static", transitionIn: "soft-reveal", transitionOut: "carry-forward", expression: "分析", typography: "underline-draw", sound: null},
  "actual-crosses-expected": {layout: "full-stage", camera: "push-in", transitionIn: "continue-from-previous", transitionOut: "hold-outcome", expression: "軽い驚き", typography: "gap-highlight", sound: "soft-impact"},
  "gap-macro": {layout: "macro-detail", camera: "macro-detail", transitionIn: "reframe-shared-element", transitionOut: "collapse-to-node", expression: "分析", typography: "gap-highlight", sound: null},
  "causal-build": {layout: "lane-left-right", camera: "follow-path", transitionIn: "soft-reveal", transitionOut: "carry-forward", expression: "分析", typography: null, sound: "line-draw"},
  "counterforce-interrupt": {layout: "split-horizontal", camera: "pan-left", transitionIn: "continue-from-previous", transitionOut: "hold-outcome", expression: "警戒", typography: "word-build", sound: "soft-whoosh"},
  "entity-cutaway": {layout: "entity-full", camera: "pull-back", transitionIn: "soft-reveal", transitionOut: "carry-forward", expression: "分析", typography: null, sound: null},
  "split-opposition": {layout: "split-vertical", camera: "reframe-outcome", transitionIn: "soft-reveal", transitionOut: "carry-forward", expression: "分析", typography: "zero-line-split", sound: "comparison-split"},
  "focus-matrix-reveal": {layout: "matrix-2x2", camera: "pan-right", transitionIn: "continue-from-previous", transitionOut: "hold-outcome", expression: "分析", typography: null, sound: null},
  "verification-two-paths": {layout: "matrix-2x2", camera: "pull-back", transitionIn: "soft-reveal", transitionOut: "hold-outcome", expression: "警戒", typography: "underline-draw", sound: null},
  "recap-assembly": {layout: "assembly-canvas", camera: "pull-back", transitionIn: "continue-from-previous", transitionOut: "merge-to-outcome", expression: "通常", typography: "final-phrase-lock", sound: "resolve-chime"},
};

type Chunk = {chunkId: string};
const startPoint = (chunks: Chunk[], fraction: number) => {
  const scaled = Math.max(0, Math.min(.999999, fraction)) * chunks.length;
  const index = Math.min(chunks.length - 1, Math.floor(scaled));
  return {chunkId: chunks[index].chunkId, progress: scaled - index};
};
const endPoint = (chunks: Chunk[], fraction: number) => {
  if (fraction >= 1) return {chunkId: chunks[chunks.length - 1].chunkId, progress: 1};
  const scaled = Math.max(0, fraction) * chunks.length;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) < 1e-9 && rounded > 0) {
    return {chunkId: chunks[rounded - 1].chunkId, progress: 1};
  }
  const index = Math.min(chunks.length - 1, Math.floor(scaled));
  return {chunkId: chunks[index].chunkId, progress: scaled - index};
};

const expressionFor = (sceneNumber: number, recipe: ShotRecipe, shotIndex: number, shotCount: number): Expression => {
  if (sceneNumber === 1) return recipe === "hero-metric-impact" && shotIndex === shotCount - 1 ? "分析" : "軽い驚き";
  if (sceneNumber === 4) return recipe === "actual-crosses-expected" ? "軽い驚き" : "分析";
  if (sceneNumber === 5) return recipe === "counterforce-interrupt" ? "警戒" : "分析";
  if (sceneNumber === 6) return shotIndex === 0 ? "軽い驚き" : "分析";
  if (sceneNumber === 8) return "警戒";
  if (sceneNumber === 9) return shotIndex === shotCount - 1 ? "眠そう" : "通常";
  return recipeDetails[recipe].expression;
};

const data = JSON.parse(await readFile(path.resolve(input), "utf8"));
for (const scene of data.scenes) {
  const chunkIndex = new Map(scene.narrationChunks.map((chunk: Chunk, index: number) => [chunk.chunkId, index]));
  for (const beat of scene.visualBeats) {
    const start = chunkIndex.get(beat.startChunkId) as number;
    const end = chunkIndex.get(beat.endChunkId) as number;
    const chunks = scene.narrationChunks.slice(start, end + 1) as Chunk[];
    const recipes = (config[beat.visualTemplate] ?? ["hero-metric-impact"]).slice(0, 4);
    const continuityKey = recipes.length > 1 ? `${beat.beatId}-flow` : null;
    beat.shots = recipes.map((recipe, index) => {
      const details = recipeDetails[recipe];
      const start = startPoint(chunks, index / recipes.length);
      const end = endPoint(chunks, (index + 1) / recipes.length);
      const primaryTargetId = beat.objectIds[index % Math.max(1, beat.objectIds.length)] ?? beat.assetPlacementIds[0] ?? null;
      const sourceText = beat.viewerTexts[index] ?? beat.primaryElement ?? beat.screenQuestion;
      const typographyText = details.typography ? String(sourceText).slice(0, 22) : null;
      return {
        shotId: `${beat.beatId}-shot-${String(index + 1).padStart(3, "0")}`,
        shotRecipe: recipe,
        startChunkId: start.chunkId,
        startProgress: Number(start.progress.toFixed(6)),
        startOffsetMs: 0,
        endChunkId: end.chunkId,
        endProgress: Number(end.progress.toFixed(6)),
        endOffsetMs: 0,
        endCue: beat.narrationEndCue,
        primaryTargetId,
        stageLayout: details.layout,
        cameraPreset: details.camera,
        transitionIn: index > 0 && continuityKey ? "reframe-shared-element" : details.transitionIn,
        transitionOut: details.transitionOut,
        continuityKey,
        typographyTreatment: details.typography,
        typographyText,
        soundCue: index < 2 ? details.sound : null,
        foxExpression: expressionFor(scene.sceneNumber, recipe, index, recipes.length),
      };
    });
  }
}
await writeFile(path.resolve(input), `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Visual Story Engine v3 Shot Plan migrated: ${input}`);
