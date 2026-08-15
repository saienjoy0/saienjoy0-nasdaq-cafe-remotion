import type {RenderSpec} from "./render-spec";

type RenderScene = RenderSpec["scenes"][number];
type RenderBeat = RenderScene["visualBeats"][number];
type StaticScene = Pick<
  RenderScene,
  "sceneNumber" | "uncertainty" | "cards" | "numbers" | "nodes" | "arrows"
>;
type StaticBeat = Pick<
  RenderBeat,
  "objectIds" | "visualTemplate" | "visualMode" | "templateConfig" | "viewerTexts" | "screenState" | "entity"
>;

const assertCausalShape = (
  nodeIds: string[],
  arrows: Array<{fromNodeId: string; toNodeId: string}>,
  path: string,
) => {
  if (nodeIds.length > 4) throw new Error(`${path}: causal diagram supports at most four visible nodes`);
  if (arrows.length > 3) throw new Error(`${path}: causal diagram supports at most three visible arrows`);
  if (nodeIds.length < 2 || arrows.length < 1) return;

  const nodeSet = new Set(nodeIds);
  const incoming = new Map(nodeIds.map((id) => [id, 0]));
  const outgoing = new Map(nodeIds.map((id) => [id, 0]));
  for (const arrow of arrows) {
    if (!nodeSet.has(arrow.fromNodeId) || !nodeSet.has(arrow.toNodeId)) continue;
    outgoing.set(arrow.fromNodeId, (outgoing.get(arrow.fromNodeId) ?? 0) + 1);
    incoming.set(arrow.toNodeId, (incoming.get(arrow.toNodeId) ?? 0) + 1);
  }

  const roots = nodeIds.filter((id) => (incoming.get(id) ?? 0) === 0);
  const sinks = nodeIds.filter((id) => (outgoing.get(id) ?? 0) === 0);
  const isSingleChain =
    arrows.length === nodeIds.length - 1 &&
    roots.length === 1 &&
    sinks.length === 1 &&
    nodeIds.every((id) => (incoming.get(id) ?? 0) <= 1 && (outgoing.get(id) ?? 0) <= 1);

  const sink = sinks.length === 1 ? sinks[0] : null;
  const isDirectConvergence =
    sink !== null &&
    arrows.length === nodeIds.length - 1 &&
    nodeIds
      .filter((id) => id !== sink)
      .every((id) => arrows.some((arrow) => arrow.fromNodeId === id && arrow.toNodeId === sink));

  if (!isSingleChain && !isDirectConvergence) {
    throw new Error(`${path}: causal diagram must be a single chain or direct convergence without crossing paths`);
  }
};

export const assertStaticTemplateLayoutForBeat = ({
  scene,
  beat,
  path,
}: {
  scene: StaticScene;
  beat: StaticBeat;
  path: string;
}) => {
  const objectIds = new Set(beat.objectIds);
  const visibleNumbers = scene.numbers.filter((number) => objectIds.has(number.numberId));
  const visibleCards = scene.cards.filter((card) => objectIds.has(card.cardId));
  const visibleNodes = scene.nodes.filter((node) => objectIds.has(node.nodeId));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.nodeId));
  const visibleArrows = scene.arrows.filter(
    (arrow) =>
      objectIds.has(arrow.arrowId) &&
      visibleNodeIds.has(arrow.fromNodeId) &&
      visibleNodeIds.has(arrow.toNodeId),
  );

  const comparisonLimit = beat.visualTemplate === "market-pulse-grid" ? 6 : 4;
  if (["number-comparison", "chart", "stock-comparison"].includes(beat.visualMode) && visibleNumbers.length > comparisonLimit) {
    throw new Error(`${path}.objectIds: comparison view supports at most ${comparisonLimit} visible numbers`);
  }
  if (beat.visualMode === "verification-points") {
    const itemCount = visibleCards.reduce((total, card) => total + card.lines.length, 0);
    if (itemCount > 4) throw new Error(`${path}.objectIds: verification view supports at most four items`);
  }
  if (beat.visualMode === "causal-diagram") {
    assertCausalShape(
      visibleNodes.map((node) => node.nodeId),
      visibleArrows,
      `${path}.objectIds`,
    );
  }

  const template = beat.visualTemplate;
  const values = visibleNumbers
    .map((number) => Number(number.value.replace(/[^0-9+\-.]/g, "")))
    .filter((value) => Number.isFinite(value));
  const requiresNumbers = ["expected-actual-bullet", "metric-comparison-board", "index-return-bars", "diverging-stock-bars"].includes(template);
  if (requiresNumbers && (visibleNumbers.length < 2 || visibleNumbers.length > 4)) {
    throw new Error(`${path}.objectIds: ${template} requires two to four visible numbers`);
  }
  if (template === "diverging-stock-bars" && !(values.some((value) => value < 0) && values.some((value) => value >= 0))) {
    throw new Error(`${path}.objectIds: diverging-stock-bars requires both negative and non-negative values`);
  }
  if (template === "expected-actual-gap-flow") {
    const roles = new Set(visibleCards.map((card) => card.role));
    for (const role of ["expected", "actual", "gap"] as const) {
      if (!roles.has(role)) throw new Error(`${path}.objectIds: expected-actual-gap-flow missing ${role} card`);
    }
  }
  if (template === "causal-lane") {
    assertCausalShape(visibleNodes.map((node) => node.nodeId), visibleArrows, `${path}.objectIds`);
    if (beat.templateConfig.nodeOrder.length !== visibleNodes.length || beat.templateConfig.nodeOrder.length < 2) {
      throw new Error(`${path}.templateConfig.nodeOrder: causal-lane requires the complete two-to-four node order`);
    }
    const order = beat.templateConfig.nodeOrder;
    for (let index = 0; index < order.length - 1; index += 1) {
      if (!visibleArrows.some((arrow) => arrow.fromNodeId === order[index] && arrow.toNodeId === order[index + 1])) {
        throw new Error(`${path}.templateConfig.nodeOrder: missing sequential arrow ${order[index]} -> ${order[index + 1]}`);
      }
    }
  }
  if (["tailwind-headwind", "verification-matrix"].includes(template)) {
    if (beat.templateConfig.laneLabels.length !== 2) {
      throw new Error(`${path}.templateConfig.laneLabels: ${template} requires exactly two lanes`);
    }
    for (const label of beat.templateConfig.laneLabels) {
      if (!beat.viewerTexts.some((item) => item.startsWith(`${label}｜`))) {
        throw new Error(`${path}.viewerTexts: ${template} requires an item prefixed ${label}｜`);
      }
    }
  }
  if (template === "evidence-boundary" && (!scene.uncertainty || beat.viewerTexts.length < 1)) {
    throw new Error(`${path}: evidence-boundary requires confirmed viewer text and uncertainty`);
  }
  if (template === "verification-checklist") {
    const itemCount = visibleCards.reduce((total, card) => total + card.lines.length, 0) || beat.viewerTexts.length;
    if (itemCount < 2 || itemCount > 4) {
      throw new Error(`${path}: verification-checklist requires two to four items`);
    }
  }
  if (template === "market-pulse-grid" && (visibleNumbers.length < 3 || visibleNumbers.length > 6)) {
    throw new Error(`${path}.objectIds: market-pulse-grid requires three to six visible numbers`);
  }
  if (template === "earnings-surprise" && visibleNumbers.length !== 3) {
    throw new Error(`${path}.objectIds: earnings-surprise requires exactly three visible numbers`);
  }
  if (template === "dual-asset-split" && visibleNumbers.length !== 2) {
    throw new Error(`${path}.objectIds: dual-asset-split requires exactly two visible numbers`);
  }
  if (template === "macro-pressure") {
    assertCausalShape(visibleNodes.map((node) => node.nodeId), visibleArrows, `${path}.objectIds`);
    if (visibleNodes.length < 2 || visibleNodes.length > 4) {
      throw new Error(`${path}.objectIds: macro-pressure requires two to four visible nodes`);
    }
    if (visibleArrows.length < 1 || visibleArrows.length > 3) {
      throw new Error(`${path}.objectIds: macro-pressure requires one to three visible arrows`);
    }
    const order = beat.templateConfig.nodeOrder;
    if (order.length !== visibleNodes.length) {
      throw new Error(`${path}.templateConfig.nodeOrder: macro-pressure requires the complete visible node order`);
    }
    for (let index = 0; index < order.length - 1; index += 1) {
      if (!visibleArrows.some((arrow) => arrow.fromNodeId === order[index] && arrow.toNodeId === order[index + 1])) {
        throw new Error(`${path}.templateConfig.nodeOrder: missing sequential arrow ${order[index]} -> ${order[index + 1]}`);
      }
    }
  }
  if (template === "source-receipt") {
    const evidenceCount = visibleCards.reduce((total, card) => total + Math.max(1, card.lines.length), 0) + visibleNumbers.length + beat.viewerTexts.length;
    if (evidenceCount < 1 || evidenceCount > 6) {
      throw new Error(`${path}: source-receipt requires one to six visible evidence items`);
    }
  }
  if (template === "entity-card-full" && (beat.screenState !== "EntityFocus" || !beat.entity)) {
    throw new Error(`${path}: entity-card-full requires EntityFocus and entity metadata`);
  }
  if (template === "opening-contradiction" && scene.sceneNumber !== 1) {
    throw new Error(`${path}: opening-contradiction is reserved for Scene 1`);
  }
  if (template === "closing-recap" && scene.sceneNumber !== 9) {
    throw new Error(`${path}: closing-recap is reserved for Scene 9`);
  }
};

export const validateStaticTemplateLayout = (spec: RenderSpec) => {
  spec.scenes.forEach((scene, sceneIndex) => {
    scene.visualBeats.forEach((beat, beatIndex) => {
      assertStaticTemplateLayoutForBeat({
        scene,
        beat,
        path: `$.scenes[${sceneIndex}].visualBeats[${beatIndex}]`,
      });
    });
  });
  return spec;
};
