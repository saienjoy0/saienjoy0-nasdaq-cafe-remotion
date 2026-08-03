import {resolveStrictExpressionAsset} from "../config/spec-expressions";
import type {ProductionScene} from "./render-spec";
import {isPlacementActive, type SceneRenderState} from "./render-state";

type PublicTone = "positive" | "negative" | "warning" | "neutral" | "emphasis";
type PublicFit = "cover" | "contain" | "fill";
type PlacementRole = ProductionScene["assetPlacements"][number]["role"];

export type PublicCard = {
  key: string;
  title: string;
  lines: Array<{label: string; value: string; tone: PublicTone}>;
  highlighted: boolean;
  role: "expected" | "actual" | "gap" | null;
};

export type PublicNumber = {
  key: string;
  label: string;
  value: string;
  unit: string;
  comparison: string | null;
  tone: PublicTone;
  highlighted: boolean;
};

export type PublicNode = {
  key: string;
  label: string;
  highlighted: boolean;
};

export type PublicArrow = {
  key: string;
  fromKey: string;
  toKey: string;
  label: string;
  highlighted: boolean;
};

export type PublicPlacedAsset = {
  key: string;
  src: string;
  role: PlacementRole;
  slot: "full" | "focus-media" | "primary" | "entity" | "lower";
  fit: PublicFit;
  objectPosition: string;
  opacity: number;
};

export type PublicMainContent = {
  renderKind:
    | "conclusion"
    | "numbers"
    | "expected-actual-gap"
    | "timeline"
    | "chart"
    | "causal"
    | "stock-comparison"
    | "news"
    | "verification"
    | "entity"
    | "text";
  layout: "full" | "primary-with-entity";
  cards: PublicCard[];
  numbers: PublicNumber[];
  nodes: PublicNode[];
  arrows: PublicArrow[];
  texts: string[];
  entityPresentation: "prebuilt-card" | "media" | "fallback" | null;
  entity: null | {
    subjectType: "person" | "company" | "product";
    displayName: string;
    role: string;
    variant: "photo" | "noPhoto" | "company" | "product";
  };
};

export type PublicSceneViewModel = {
  headline: string;
  supportingTexts: string[];
  sourceLabel: string | null;
  captionText: string | null;
  background: PublicPlacedAsset;
  fox: PublicPlacedAsset;
  mainAssets: PublicPlacedAsset[];
  overlays: PublicPlacedAsset[];
  mainContent: PublicMainContent | null;
};

const renderKindMap = {
  "conclusion-card": "conclusion",
  "number-comparison": "numbers",
  "expected-actual-gap": "expected-actual-gap",
  timeline: "timeline",
  chart: "chart",
  "causal-diagram": "causal",
  "stock-comparison": "stock-comparison",
  "news-media": "news",
  "verification-points": "verification",
  "text-focus": "text",
} as const;

const slotMap = {
  "full-canvas": "full",
  "fox-left": "full",
  "main-stage": "full",
  "main-primary": "primary",
  "main-entity": "entity",
  "lower-third": "lower",
} as const;

const publicAsset = (
  placement: ProductionScene["assetPlacements"][number],
  assets: Record<string, string>,
  slotOverride?: PublicPlacedAsset["slot"],
): PublicPlacedAsset => {
  const src = assets[placement.assetId];
  if (!src) throw new Error(`missing resolved public asset: ${placement.assetId}`);
  return {
    key: placement.placementId,
    src,
    role: placement.role,
    slot: slotOverride ?? slotMap[placement.region],
    fit: placement.fit,
    objectPosition: placement.focalPoint
      ? `${placement.focalPoint.x * 100}% ${placement.focalPoint.y * 100}%`
      : "50% 50%",
    opacity: placement.opacity,
  };
};

export const toPublicSceneViewModel = (
  scene: ProductionScene,
  state: SceneRenderState,
  assets: Record<string, string>,
): PublicSceneViewModel => {
  const beat = scene.visualBeats[state.activeBeatIndex];
  if (!beat) throw new Error("active Visual Beat is unavailable");

  const backgroundPlacement = scene.assetPlacements.find(
    (placement) =>
      placement.role === "background" &&
      isPlacementActive(scene, placement, state),
  );
  if (!backgroundPlacement) throw new Error("canonical background is unavailable");

  const expressionAsset = resolveStrictExpressionAsset(state.expression);
  const foxPlacement = scene.assetPlacements.find(
    (placement) =>
      placement.role === "fox-expression" &&
      placement.assetId === expressionAsset.assetId &&
      isPlacementActive(scene, placement, state),
  );
  if (!foxPlacement) {
    throw new Error(`fox expression asset is unavailable: ${expressionAsset.assetId}`);
  }

  const selectedIds = new Set(beat.objectIds);
  const cards = scene.cards
    .filter((card) => selectedIds.has(card.cardId) && state.visible.has(card.cardId))
    .map((card): PublicCard => ({
      key: card.cardId,
      title: card.title,
      lines: card.lines,
      highlighted: state.highlighted.has(card.cardId),
      role: card.role,
    }));
  const numbers = scene.numbers
    .filter((number) => selectedIds.has(number.numberId) && state.visible.has(number.numberId))
    .map((number): PublicNumber => ({
      key: number.numberId,
      label: number.label,
      value: number.value,
      unit: number.unit,
      comparison: number.comparison,
      tone: number.tone,
      highlighted: state.highlighted.has(number.numberId),
    }));
  const nodes = scene.nodes
    .filter((node) => selectedIds.has(node.nodeId) && state.visible.has(node.nodeId))
    .map((node): PublicNode => ({
      key: node.nodeId,
      label: node.label,
      highlighted: state.highlighted.has(node.nodeId),
    }));
  const arrows = scene.arrows
    .filter((arrow) => selectedIds.has(arrow.arrowId) && state.visible.has(arrow.arrowId))
    .map((arrow): PublicArrow => ({
      key: arrow.arrowId,
      fromKey: arrow.fromNodeId,
      toKey: arrow.toNodeId,
      label: arrow.label,
      highlighted: state.highlighted.has(arrow.arrowId),
    }));

  const beatPlacementIds = new Set(beat.assetPlacementIds);
  const activeBeatPlacements = scene.assetPlacements.filter(
    (placement) =>
      beatPlacementIds.has(placement.placementId) &&
      isPlacementActive(scene, placement, state),
  );
  const entityPlacement =
    beat.screenState === "EntityFocus"
      ? activeBeatPlacements.find((placement) => placement.role === "entity-card") ??
        activeBeatPlacements.find(
          (placement) =>
            placement.role === "main-media" ||
            placement.role === "illustration" ||
            placement.role === "chart",
        )
      : undefined;
  const entityPresentation =
    beat.screenState !== "EntityFocus"
      ? null
      : entityPlacement?.role === "entity-card"
        ? "prebuilt-card"
        : entityPlacement
          ? "media"
          : "fallback";

  const mainAssets = activeBeatPlacements.map((placement) =>
    publicAsset(
      placement,
      assets,
      beat.screenState === "EntityFocus" ? "full" : undefined,
    ),
  );
  const overlays = scene.assetPlacements
    .filter(
      (placement) =>
        placement.role === "overlay" &&
        isPlacementActive(scene, placement, state),
    )
    .map((placement) => publicAsset(placement, assets));
  const generatedContentVisible =
    beat.screenState === "Data" ||
    beat.screenState === "Chart" ||
    beat.screenState === "EntityFocus" ||
    beat.screenState === "MainWithEntity";

  return {
    headline: scene.headline,
    supportingTexts:
      beat.viewerTexts.length > 0 ? beat.viewerTexts : scene.supportingTexts,
    sourceLabel: scene.sourceLabel || null,
    captionText: state.captionText,
    background: publicAsset(backgroundPlacement, assets),
    fox: publicAsset(foxPlacement, assets),
    mainAssets,
    overlays,
    mainContent: generatedContentVisible
      ? {
          renderKind:
            beat.screenState === "EntityFocus"
              ? "entity"
              : renderKindMap[beat.visualMode],
          layout:
            beat.screenState === "MainWithEntity"
              ? "primary-with-entity"
              : "full",
          cards,
          numbers,
          nodes,
          arrows,
          texts: beat.viewerTexts,
          entityPresentation,
          entity: beat.entity
            ? {
                subjectType: beat.entity.subjectType,
                displayName: beat.entity.displayName,
                role: beat.entity.role,
                variant: beat.entity.variant,
              }
            : null,
        }
      : null,
  };
};
