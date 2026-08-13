import type {RenderSpec} from "./render-spec";
import {
  validateRenderSpecReferences,
  type AssetManifestForSpec,
  type VoiceProfilesForSpec,
} from "./validate-render-spec";

const fail = (path: string, message: string): never => {
  throw new Error(`${path}: ${message}`);
};

/**
 * Compatibility validator for multi-Beat Scenes.
 *
 * `scene.visualMode` is a summary of the first Beat. The legacy scene-level
 * expected/actual/gap validator assumed that every card in the whole Scene belonged
 * to that first Beat, which is no longer true once a later Beat owns its own card.
 *
 * Keep the strict Beat-owned E/A/G contract here, then run every existing generic
 * reference/asset/chunk/mode check on a validation-only clone whose first-Beat
 * summary mode no longer triggers the obsolete Scene-wide exclusivity rule.
 * The caller's RenderSpec is never mutated.
 */
export const validateRenderSpecReferencesMultiBeat = (
  spec: RenderSpec,
  assetManifest: AssetManifestForSpec,
  voiceProfiles: VoiceProfilesForSpec,
) => {
  const validationCopy = structuredClone(spec);

  spec.scenes.forEach((scene, sceneIndex) => {
    const firstBeat = scene.visualBeats[0];
    if (
      scene.visualMode !== "expected-actual-gap" ||
      firstBeat?.visualMode !== "expected-actual-gap" ||
      scene.visualBeats.length < 2
    ) {
      return;
    }

    const path = `$.scenes[${sceneIndex}].visualBeats[0]`;
    const ownedCards = scene.cards.filter((card) => firstBeat.objectIds.includes(card.cardId));
    if (ownedCards.length !== 3) {
      fail(`${path}.visualMode`, "expected-actual-gap requires exactly three Beat-owned cards");
    }
    for (const role of ["expected", "actual", "gap"] as const) {
      const matches = ownedCards.filter((card) => card.role === role);
      if (matches.length !== 1) {
        fail(`${path}.visualMode`, `expected-actual-gap requires exactly one Beat-owned ${role} card`);
      }
    }
    if (ownedCards.some((card) => card.role === null)) {
      fail(`${path}.visualMode`, "expected-actual-gap Beat-owned cards require explicit roles");
    }

    const clonedScene = validationCopy.scenes[sceneIndex];
    // `conclusion-card` is only a validation shim. The original spec remains E/A/G,
    // and the strict E/A/G ownership contract above has already been checked.
    // This bypasses only the obsolete Scene-wide `scene.cards.length === 3` rule so
    // later Beats may legally own additional cards.
    clonedScene.visualMode = "conclusion-card";
    clonedScene.visualBeats[0].visualMode = "conclusion-card";
  });

  validateRenderSpecReferences(validationCopy, assetManifest, voiceProfiles);
};
