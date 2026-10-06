import type {RenderSpec} from "./render-spec";
import {validateReactionTimelineBeat} from "./validate-reaction-timeline";
import {
  VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256,
  getVisualGrammarAppearance,
  isVisualGrammarTemplatePairAllowed,
} from "./visual-grammar-contract";

export type VisualGrammarValidationIssue = {
  code:
    | "VG_ROOT_CONTRACT_MISSING"
    | "VG_BEAT_COUNT_MISMATCH"
    | "VG_GRAMMAR_TEMPLATE_MISMATCH"
    | "VG_MAJOR_SHIFT_NOT_PHYSICAL"
    | "VG_MAJOR_SHIFT_MOTION_INVALID"
    | "VG_FOX_GUIDANCE_NOT_SYNCHRONIZED"
    | "VG_REGISTRY_SHA_MISMATCH";
  path: string;
  message: string;
};

const fail = (issue: VisualGrammarValidationIssue): never => {
  throw new Error(`${issue.code} ${issue.path}: ${issue.message}`);
};
const normalize = (value: string) => value.replace(/\s+/gu, "").trim();

export const validateVisualGrammarContract = (spec: RenderSpec) => {
  if (spec.schemaVersion !== "2.4.0" && spec.schemaVersion !== "2.5.0") return;

  const root = spec.visualGrammarContract ?? fail({
    code: "VG_ROOT_CONTRACT_MISSING",
    path: "$.visualGrammarContract",
    message: `render_spec ${spec.schemaVersion} requires the Visual Grammar root contract`,
  });

  if (root.rendererCompatibilitySha256 !== VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256) {
    fail({
      code: "VG_REGISTRY_SHA_MISMATCH",
      path: "$.visualGrammarContract.rendererCompatibilitySha256",
      message: `expected ${VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256}, got ${root.rendererCompatibilitySha256}`,
    });
  }

  const beats = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.map((beat, beatIndex) => ({
      scene,
      beat,
      path: `$.scenes[${sceneIndex}].visualBeats[${beatIndex}]`,
    })),
  );

  if (root.beatCount !== beats.length) {
    fail({
      code: "VG_BEAT_COUNT_MISMATCH",
      path: "$.visualGrammarContract.beatCount",
      message: `expected ${beats.length}, got ${root.beatCount}`,
    });
  }

  let previousAppearance: ReturnType<typeof getVisualGrammarAppearance> | null = null;
  beats.forEach(({scene, beat, path}) => {
    if (beat.visualGrammarId === undefined) {
      fail({
        code: "VG_ROOT_CONTRACT_MISSING",
        path: `${path}.visualGrammarId`,
        message: `render_spec ${spec.schemaVersion} requires visualGrammarId on every Beat`,
      });
    }
    if (beat.transitionRole === undefined) {
      fail({
        code: "VG_ROOT_CONTRACT_MISSING",
        path: `${path}.transitionRole`,
        message: `render_spec ${spec.schemaVersion} requires transitionRole on every Beat`,
      });
    }

    const grammarId = beat.visualGrammarId!;
    const transitionRole = beat.transitionRole!;
    if (!isVisualGrammarTemplatePairAllowed(grammarId, beat.visualTemplate)) {
      fail({
        code: "VG_GRAMMAR_TEMPLATE_MISMATCH",
        path: `${path}.visualTemplate`,
        message: `${beat.visualTemplate} is not compatible with ${grammarId}`,
      });
    }

    const appearance = getVisualGrammarAppearance(
      beat.visualTemplate,
      beat.templateConfig.variant,
    );
    if (
      transitionRole === "major-shift" &&
      previousAppearance !== null &&
      appearance.appearanceClass === previousAppearance.appearanceClass &&
      appearance.dominantSurface === previousAppearance.dominantSurface
    ) {
      fail({
        code: "VG_MAJOR_SHIFT_NOT_PHYSICAL",
        path: `${path}.transitionRole`,
        message: "major-shift requires a different Appearance Class or Dominant Surface",
      });
    }

    if (transitionRole === "major-shift" && (beat.shots?.length ?? 0) > 0) {
      const firstShot = beat.shots![0];
      if (!["hard-cut", "reframe-shared-element"].includes(firstShot.transitionIn)) {
        fail({
          code: "VG_MAJOR_SHIFT_MOTION_INVALID",
          path: `${path}.shots[0].transitionIn`,
          message: "major-shift must enter with hard-cut or reframe-shared-element",
        });
      }
      if (beat.expressionChange !== null) {
        if (firstShot.foxExpression !== beat.expressionChange) {
          fail({
            code: "VG_FOX_GUIDANCE_NOT_SYNCHRONIZED",
            path: `${path}.shots[0].foxExpression`,
            message: "the first major-shift Shot must use the Beat expressionChange",
          });
        }
        const startCue = normalize(firstShot.startCue ?? "");
        const changeCue = normalize(beat.changeCue);
        if (!startCue || (!startCue.includes(changeCue) && !changeCue.includes(startCue))) {
          fail({
            code: "VG_FOX_GUIDANCE_NOT_SYNCHRONIZED",
            path: `${path}.shots[0].startCue`,
            message: "fox expression and primary focus must change on the Beat changeCue",
          });
        }
      }
    }

    validateReactionTimelineBeat(scene, beat, path);
    previousAppearance = appearance;
  });
};