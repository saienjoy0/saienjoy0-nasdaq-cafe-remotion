export const SHOT_RECIPE_IDS = [
  "hero-metric-impact",
  "contradiction-interrupt",
  "expected-anchor",
  "actual-crosses-expected",
  "gap-macro",
  "causal-build",
  "counterforce-interrupt",
  "entity-cutaway",
  "split-opposition",
  "focus-matrix-reveal",
  "verification-two-paths",
  "recap-assembly",
] as const;

export const STAGE_LAYOUT_IDS = [
  "full-stage",
  "hero-center",
  "split-vertical",
  "split-horizontal",
  "macro-detail",
  "lane-left-right",
  "matrix-2x2",
  "entity-full",
  "media-full",
  "assembly-canvas",
] as const;

export const CAMERA_PRESET_IDS = [
  "static",
  "push-in",
  "pull-back",
  "pan-left",
  "pan-right",
  "follow-path",
  "reframe-outcome",
  "macro-detail",
] as const;

export const SHOT_TRANSITION_IDS = [
  "soft-reveal",
  "continue-from-previous",
  "reframe-shared-element",
  "carry-forward",
  "pin-to-corner",
  "collapse-to-node",
  "merge-to-outcome",
  "hard-cut",
  "hold-outcome",
] as const;

export const TYPOGRAPHY_TREATMENT_IDS = [
  "number-roll",
  "word-build",
  "underline-draw",
  "cross-out-assumption",
  "gap-highlight",
  "zero-line-split",
  "final-phrase-lock",
] as const;

export const SOUND_CUE_IDS = [
  "soft-whoosh",
  "soft-impact",
  "line-draw",
  "comparison-split",
  "resolve-chime",
] as const;

export type ShotRecipe = typeof SHOT_RECIPE_IDS[number];
export type StageLayout = typeof STAGE_LAYOUT_IDS[number];
export type CameraPreset = typeof CAMERA_PRESET_IDS[number];
export type ShotTransition = typeof SHOT_TRANSITION_IDS[number];
export type TypographyTreatment = typeof TYPOGRAPHY_TREATMENT_IDS[number];
export type SoundCue = typeof SOUND_CUE_IDS[number];

export const DEDICATED_SHOT_RECIPE_IDS: readonly ShotRecipe[] = SHOT_RECIPE_IDS;
export const SHOT_CROSSFADE_MS = 300;
export const SHARED_ELEMENT_MS = 420;

export const SHOT_RECIPE_FAMILIES: Record<ShotRecipe, string> = {
  "hero-metric-impact": "hero",
  "contradiction-interrupt": "contradiction",
  "expected-anchor": "expected-actual",
  "actual-crosses-expected": "expected-actual",
  "gap-macro": "expected-actual",
  "causal-build": "causal",
  "counterforce-interrupt": "forces",
  "entity-cutaway": "entity",
  "split-opposition": "split",
  "focus-matrix-reveal": "matrix",
  "verification-two-paths": "verification",
  "recap-assembly": "closing",
};

// Camera transforms are deliberately conservative. They are applied only to
// a recipe's focus group, never to the fixed Stage shell, fox, headline, or subtitles.
export const CAMERA_PRESET_TRANSFORMS: Record<CameraPreset, {
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}> = {
  static: {startScale: 1, endScale: 1, startX: 0, endX: 0, startY: 0, endY: 0},
  "push-in": {startScale: 1, endScale: 1.04, startX: 0, endX: -8, startY: 0, endY: -4},
  "pull-back": {startScale: 1.04, endScale: 1, startX: -8, endX: 0, startY: -4, endY: 0},
  "pan-left": {startScale: 1.01, endScale: 1.01, startX: 18, endX: -18, startY: 0, endY: 0},
  "pan-right": {startScale: 1.01, endScale: 1.01, startX: -18, endX: 18, startY: 0, endY: 0},
  "follow-path": {startScale: 1, endScale: 1.035, startX: 16, endX: -16, startY: 6, endY: -6},
  "reframe-outcome": {startScale: 1.035, endScale: 1.01, startX: -16, endX: 12, startY: -6, endY: 0},
  "macro-detail": {startScale: 1, endScale: 1.08, startX: 0, endX: -18, startY: 0, endY: -10},
};
