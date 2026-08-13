import type {RenderSpec} from "./render-spec";
import type {EvidenceCapability} from "./visual-director-contract";
import type {VisualEligibilityRuleId} from "./visual-component-registry";

type Scene = RenderSpec["scenes"][number];
type Beat = Scene["visualBeats"][number];

export type VisualEligibilityContext = {
  scene: Scene;
  beat: Beat;
  capability: EvidenceCapability;
  sourcePlacementIds: readonly string[];
};

type EligibilityRule = (context: VisualEligibilityContext) => boolean;

const selectedInventory = (scene: Scene, beat: Beat) => {
  const selected = new Set(beat.objectIds);
  return {
    cards: scene.cards.filter((item) => selected.has(item.cardId)),
    numbers: scene.numbers.filter((item) => selected.has(item.numberId)),
    nodes: scene.nodes.filter((item) => selected.has(item.nodeId)),
    arrows: scene.arrows.filter((item) => selected.has(item.arrowId)),
  };
};

const alignedComparison = ({scene, beat}: VisualEligibilityContext) => {
  const numbers = selectedInventory(scene, beat).numbers;
  if (numbers.length < 2 || numbers.some((item) => item.numericValue == null)) return false;
  const units = new Set(numbers.map((item) => item.unit));
  const bases = new Set(numbers.map((item) => item.comparison));
  return units.size === 1 && bases.size === 1 && !bases.has(null);
};

const numericValuesPresent = ({scene, beat}: VisualEligibilityContext) =>
  selectedInventory(scene, beat).numbers.every((item) => item.numericValue != null);

const verifiedIntradaySeries = ({beat}: VisualEligibilityContext) => {
  const reaction = beat.templateConfig.reactionTimeline;
  if (reaction?.precision !== "verified-intraday-series") return false;
  return Boolean(reaction.intradaySeries) || reaction.seriesObjectIds.length >= 2;
};

export const VISUAL_ELIGIBILITY_RULES: Record<VisualEligibilityRuleId, EligibilityRule> = {
  "source-bound": ({beat}) => beat.evidenceSourceIds.length > 0,
  "single-main-media": ({sourcePlacementIds}) => sourcePlacementIds.length === 1,
  "aligned-comparison": alignedComparison,
  "verified-intraday-series": verifiedIntradaySeries,
  "gap-structure": ({scene, beat}) => {
    if (beat.visualGrammarId === "gap") return true;
    const roles = new Set(selectedInventory(scene, beat).cards.map((item) => item.role));
    return roles.has("expected") && roles.has("actual") && roles.has("gap");
  },
  "entity-bound": ({beat}) => beat.entity != null,
  "causal-graph-complete": ({scene, beat}) => {
    const inventory = selectedInventory(scene, beat);
    return inventory.nodes.length >= 2 && inventory.arrows.length >= 1;
  },
  "verification-bilateral": ({scene, beat}) => {
    const inventory = selectedInventory(scene, beat);
    return inventory.cards.length >= 2 || inventory.nodes.length >= 2;
  },
  "assembly-existing-only": () => true,
  "numeric-values-present": numericValuesPresent,
};

export const passesVisualEligibilityRules = (
  ruleIds: readonly VisualEligibilityRuleId[],
  context: VisualEligibilityContext,
) => ruleIds.every((ruleId) => VISUAL_ELIGIBILITY_RULES[ruleId](context));
