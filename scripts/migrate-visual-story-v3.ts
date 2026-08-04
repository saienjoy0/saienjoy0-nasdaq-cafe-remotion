import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import type {Expression} from "../src/spec/render-spec";
import type {CameraPreset, ShotRecipe, ShotTransition, SoundCue, StageLayout, TypographyTreatment} from "../src/spec/shot-contract";

const input = process.argv[2];
if (!input) throw new Error("usage: tsx scripts/migrate-visual-story-v3.ts <render_spec.json>");

type Details = {layout: StageLayout; camera: CameraPreset; transitionIn: ShotTransition; transitionOut: ShotTransition; expression: Expression; typography: TypographyTreatment | null; sound: SoundCue | null};
const details: Record<ShotRecipe, Details> = {
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

const normalize = (value: string) => value.replace(/\s+/gu, "").trim();
const unitsWithSpans = (text: string) => {
  const units: Array<{text: string; start: number; end: number}> = [];
  const pattern = /[^。！？!?、，,]+[。！？!?、，,]?/gu;
  for (const match of text.matchAll(pattern)) {
    const value = match[0];
    units.push({text: value, start: match.index ?? 0, end: (match.index ?? 0) + value.length});
  }
  return units.length > 0 ? units : [{text, start: 0, end: text.length}];
};
const cue = (value: string, edge: "start" | "end") => {
  const chars = Array.from(normalize(value));
  return (edge === "start" ? chars.slice(0, 12) : chars.slice(-12)).join("");
};
const semanticBoundaries = (text: string, count: number) => {
  const speech = normalize(text);
  const candidates: number[] = [];
  let cursor = 0;
  for (const unit of unitsWithSpans(text)) {
    cursor += normalize(unit.text).length;
    if (cursor > 0 && cursor < speech.length) candidates.push(cursor);
  }
  const boundaries = [0];
  for (let index = 1; index < count; index += 1) {
    const target = Math.floor(index * speech.length / count);
    const minimum = boundaries.at(-1)! + 1;
    const maximum = speech.length - (count - index);
    const candidate = candidates
      .filter((value) => value >= minimum && value <= maximum)
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
    boundaries.push(Math.max(minimum, Math.min(maximum, candidate ?? target)));
  }
  boundaries.push(speech.length);
  return {speech, boundaries};
};
const roleCard = (scene: any, beat: any, role: string) => scene.cards.find((card: any) => card.role === role && beat.objectIds.includes(card.cardId))?.cardId ?? null;
const selectedNumbers = (scene: any, beat: any) => scene.numbers.filter((number: any) => beat.objectIds.includes(number.numberId)).map((number: any) => number.numberId);
const selectedNodes = (scene: any, beat: any) => scene.nodes.filter((node: any) => beat.objectIds.includes(node.nodeId)).map((node: any) => node.nodeId);
const selectedArrows = (scene: any, beat: any) => scene.arrows.filter((arrow: any) => beat.objectIds.includes(arrow.arrowId)).map((arrow: any) => arrow.arrowId);

const semanticTargets = (scene: any, beat: any, recipe: ShotRecipe, index: number) => {
  const numbers = selectedNumbers(scene, beat);
  const nodes = selectedNodes(scene, beat);
  const arrows = selectedArrows(scene, beat);
  const expected = roleCard(scene, beat, "expected");
  const actual = roleCard(scene, beat, "actual");
  const gap = roleCard(scene, beat, "gap");
  if (recipe === "expected-anchor") return {primary: expected ?? numbers[0] ?? null, reference: null, outcome: gap, secondary: [], camera: expected ?? numbers[0] ?? null};
  if (recipe === "actual-crosses-expected") return {primary: actual ?? numbers[0] ?? null, reference: expected, outcome: gap ?? numbers[1] ?? null, secondary: [], camera: actual ?? numbers[0] ?? null};
  if (recipe === "gap-macro") return {primary: gap ?? numbers[1] ?? numbers[0] ?? null, reference: expected, outcome: gap ?? numbers[1] ?? null, secondary: [], camera: gap ?? numbers[1] ?? numbers[0] ?? null};
  if (recipe === "causal-build") return {primary: nodes[Math.min(index, Math.max(0, nodes.length - 1))] ?? numbers[Math.min(index, Math.max(0, numbers.length - 1))] ?? null, reference: null, outcome: nodes.at(-1) ?? null, secondary: [...nodes, ...arrows].filter((id: string) => id !== nodes[index]), camera: nodes[index] ?? numbers[index] ?? null};
  if (recipe === "counterforce-interrupt") return {primary: numbers[1] ?? numbers[0] ?? null, reference: numbers[0] ?? null, outcome: null, secondary: numbers.slice(2), camera: numbers[1] ?? numbers[0] ?? null};
  if (recipe === "split-opposition" || recipe === "focus-matrix-reveal") return {primary: numbers[Math.min(index, Math.max(0, numbers.length - 1))] ?? beat.objectIds[0] ?? null, reference: null, outcome: null, secondary: numbers.filter((id: string) => id !== numbers[index]), camera: numbers[index] ?? numbers[0] ?? null};
  if (recipe === "entity-cutaway") return {primary: beat.assetPlacementIds[0] ?? numbers[0] ?? null, reference: null, outcome: null, secondary: [], camera: beat.assetPlacementIds[0] ?? numbers[0] ?? null};
  if (recipe === "verification-two-paths") return {primary: beat.objectIds[Math.min(index, Math.max(0, beat.objectIds.length - 1))] ?? null, reference: null, outcome: beat.templateConfig.outcomeNodeId ?? null, secondary: beat.objectIds.filter((id: string) => id !== beat.objectIds[index]), camera: beat.objectIds[index] ?? beat.objectIds[0] ?? null};
  if (recipe === "recap-assembly") return {primary: beat.objectIds[0] ?? null, reference: null, outcome: beat.objectIds[0] ?? null, secondary: beat.objectIds.slice(1), camera: beat.objectIds[0] ?? null};
  return {primary: beat.objectIds[Math.min(index, Math.max(0, beat.objectIds.length - 1))] ?? null, reference: null, outcome: null, secondary: beat.objectIds.slice(1), camera: beat.objectIds[index] ?? beat.objectIds[0] ?? null};
};

const data = JSON.parse(await readFile(path.resolve(input), "utf8"));
for (const scene of data.scenes) {
  for (const beat of scene.visualBeats) {
    const shots = beat.shots ?? [];
    if (shots.length === 0) continue;
    if (beat.startChunkId !== beat.endChunkId) throw new Error(`${beat.beatId}: v3.1 semantic migration currently requires one narration chunk per Visual Beat`);
    const chunk = scene.narrationChunks.find((item: any) => item.chunkId === beat.startChunkId);
    if (!chunk) throw new Error(`${beat.beatId}: narration chunk missing`);
    const {speech, boundaries} = semanticBoundaries(chunk.speechText, shots.length);
    const continuityKey = shots.length > 1 ? `${beat.beatId}-flow` : null;
    shots.forEach((shot: any, index: number) => {
      const startChar = boundaries[index];
      const endChar = boundaries[index + 1];
      const segmentText = speech.slice(startChar, endChar);

      const recipe = shot.shotRecipe as ShotRecipe;
      const target = semanticTargets(scene, beat, recipe, index);
      const d = details[recipe];
      shot.startChunkId = chunk.chunkId;
      shot.endChunkId = chunk.chunkId;
      shot.startProgress = Number((startChar / Math.max(1, speech.length)).toFixed(6));
      shot.endProgress = Number((endChar / Math.max(1, speech.length)).toFixed(6));
      shot.startOffsetMs = 0;
      shot.endOffsetMs = 0;
      shot.startCue = cue(segmentText, "start");
      shot.endCue = cue(segmentText, "end");
      shot.primaryTargetId = target.primary;
      shot.referenceTargetId = target.reference;
      shot.outcomeTargetId = target.outcome;
      shot.secondaryTargetIds = target.secondary.slice(0, 6);
      shot.cameraTargetId = target.camera;
      shot.stageLayout = d.layout;
      shot.cameraPreset = d.camera;
      shot.transitionIn = index === 0 ? d.transitionIn : continuityKey ? "reframe-shared-element" : d.transitionIn;
      shot.transitionOut = d.transitionOut;
      shot.continuityKey = continuityKey;
      shot.typographyTreatment = d.typography;
      const sourceText = beat.viewerTexts[index] ?? beat.viewerTexts.at(-1) ?? beat.primaryElement;
      shot.typographyText = d.typography ? Array.from(String(sourceText)).slice(0, 22).join("") : null;
      shot.soundCue = index < 2 ? d.sound : null;
      if (scene.sceneNumber === 6) shot.foxExpression = "分析";
      else if (scene.sceneNumber === 9) shot.foxExpression = index === shots.length - 1 ? "眠そう" : "通常";
      else shot.foxExpression = shot.foxExpression ?? d.expression;
    });
  }
}
await writeFile(path.resolve(input), `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`Visual Story Engine v3.1 semantic Shot Plan migrated: ${input}`);
