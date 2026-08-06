import type {RenderSpec} from "./render-spec";
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
    | "VG_REGISTRY_SHA_MISMATCH";
  path: string;
  message: string;
};

const fail = (issue: VisualGrammarValidationIssue): never => {
  throw new Error(`${issue.code} ${issue.path}: ${issue.message}`);
};

export const validateVisualGrammarContract = (spec: RenderSpec) => {
  if (spec.schemaVersion !== "2.4.0") return;

  const root = spec.visualGrammarContract ?? fail({
    code: "VG_ROOT_CONTRACT_MISSING",
    path: "$.visualGrammarContract",
    message: "render_spec 2.4.0 requires the Visual Grammar root contract",
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
  beats.forEach(({beat, path}) => {
    const grammarId = beat.visualGrammarId;
    const transitionRole = beat.transitionRole;
    if (grammarId === undefined || transitionRole === undefined) {
      fail({
        code: "VG_ROOT_CONTRACT_MISSING",
        path,
        message: "render_spec 2.4.0 requires visualGrammarId and transitionRole on every Beat",
      });
    }

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
    previousAppearance = appearance;
  });
};
