import type {PublicMainContent, PublicShot} from "./public-view-model";
import type {ShotTransition} from "./shot-contract";

const knownTargetIds = (content: PublicMainContent) => new Set([
  ...content.numbers.map((item) => item.key),
  ...content.cards.map((item) => item.key),
  ...content.nodes.map((item) => item.key),
]);

const targetIdsFor = (shot: PublicShot) => [
  shot.outcomeTargetId,
  shot.primaryTargetId,
  shot.referenceTargetId,
  ...(shot.secondaryTargetIds ?? []),
].filter((value): value is string => Boolean(value));

export const getSharedSemanticTargetId = (
  content: PublicMainContent,
  previousShot: PublicShot | null,
  currentShot: PublicShot,
) => {
  if (!previousShot) return null;
  if (!previousShot.continuityKey || previousShot.continuityKey !== currentShot.continuityKey) {
    return null;
  }
  const known = knownTargetIds(content);
  const currentTargets = new Set(targetIdsFor(currentShot).filter((id) => known.has(id)));
  return targetIdsFor(previousShot).find((id) => known.has(id) && currentTargets.has(id)) ?? null;
};

export const resolveSemanticShotTransition = (
  content: PublicMainContent,
  previousShot: PublicShot | null,
  currentShot: PublicShot,
): ShotTransition => {
  const requested = currentShot.transitionIn;
  if (
    requested === "reframe-shared-element" ||
    requested === "carry-forward" ||
    requested === "continue-from-previous"
  ) {
    return getSharedSemanticTargetId(content, previousShot, currentShot)
      ? requested
      : "soft-reveal";
  }
  return requested;
};
