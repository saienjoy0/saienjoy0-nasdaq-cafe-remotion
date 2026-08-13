import type {RenderSpec} from "./render-spec";
import {VISUAL_TEMPLATE_CONTRACTS} from "./visual-template-contract";
import {
  validateRenderSpecReferences,
  type AssetManifestForSpec,
  type VoiceProfilesForSpec,
} from "./validate-render-spec";

const fail = (path: string, message: string): never => {
  throw new Error(`${path}: ${message}`);
};

const within = (count: number, range: {min: number; max: number}) =>
  count >= range.min && count <= range.max;

/**
 * Compatibility validator for approved multi-Beat / template-aware production specs.
 *
 * Two legacy generic-mode assumptions are narrower than the current Template
 * contracts:
 * 1. Scene-level E/A/G used to assume every card in the Scene belonged to Beat 1.
 * 2. Generic `causal-diagram` used to require >=2 nodes + >=1 arrow for every causal
 *    template, while `tailwind-headwind` explicitly permits card/number-based forces.
 *
 * We validate the stronger Beat-owned / Template-owned contract first, then run every
 * existing generic reference/asset/chunk/mode check on a validation-only clone that
 * bypasses only the obsolete generic assumption. The caller's RenderSpec is never
 * mutated and no display object is synthesized.
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
      scene.visualMode === "expected-actual-gap" &&
      firstBeat?.visualMode === "expected-actual-gap" &&
      scene.visualBeats.length >= 2
    ) {
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
      // Validation shim only: the real spec remains E/A/G. The strict Beat-owned
      // E/A/G contract above has already been checked.
      clonedScene.visualMode = "conclusion-card";
      clonedScene.visualBeats[0].visualMode = "conclusion-card";
    }

    scene.visualBeats.forEach((beat, beatIndex) => {
      if (beat.visualMode !== "causal-diagram" || beat.visualTemplate !== "tailwind-headwind") {
        return;
      }

      const path = `$.scenes[${sceneIndex}].visualBeats[${beatIndex}]`;
      const contract = VISUAL_TEMPLATE_CONTRACTS["tailwind-headwind"];
      const ownedCards = scene.cards.filter((item) => beat.objectIds.includes(item.cardId));
      const ownedNumbers = scene.numbers.filter((item) => beat.objectIds.includes(item.numberId));
      const ownedNodes = scene.nodes.filter((item) => beat.objectIds.includes(item.nodeId));
      const ownedArrows = scene.arrows.filter((item) => beat.objectIds.includes(item.arrowId));

      const inventory = [
        ["cards", ownedCards.length, contract.cards],
        ["numbers", ownedNumbers.length, contract.numbers],
        ["nodes", ownedNodes.length, contract.nodes],
        ["arrows", ownedArrows.length, contract.arrows],
      ] as const;
      for (const [label, count, range] of inventory) {
        if (!within(count, range)) {
          fail(
            `${path}.objectIds`,
            `tailwind-headwind ${label} inventory ${count} is outside ${range.min}..${range.max}`,
          );
        }
      }

      // If the generic causal requirement is already satisfied, preserve it unchanged.
      if (ownedNodes.length >= 2 && ownedArrows.length >= 1) return;

      const clonedScene = validationCopy.scenes[sceneIndex];
      const clonedBeat = clonedScene.visualBeats[beatIndex];
      // Pick a validation-only generic mode that exactly matches data the Template
      // already owns. This never changes production semantics or invents objects.
      if (ownedCards.length >= 1) {
        clonedBeat.visualMode = "verification-points";
        if (beatIndex === 0) clonedScene.visualMode = "verification-points";
      } else if (ownedNumbers.length >= 2) {
        clonedBeat.visualMode = "number-comparison";
        if (beatIndex === 0) clonedScene.visualMode = "number-comparison";
      } else if (ownedNumbers.length >= 1) {
        clonedBeat.visualMode = "chart";
        if (beatIndex === 0) clonedScene.visualMode = "chart";
      } else {
        fail(
          `${path}.visualMode`,
          "tailwind-headwind without generic causal nodes/arrows requires Beat-owned card or numeric data",
        );
      }
    });
  });

  validateRenderSpecReferences(validationCopy, assetManifest, voiceProfiles);
};
