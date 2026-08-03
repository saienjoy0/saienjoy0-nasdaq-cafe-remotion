import {resolveStrictExpressionAsset} from "../config/spec-expressions";
import type {ProductionScene} from "./render-spec";
import {isPlacementActive, type MotionInstruction, type SceneRenderState} from "./render-state";
import type {SequencePolicy} from "./motion-preset-contract";

type PublicTone = "positive" | "negative" | "warning" | "neutral" | "emphasis";
type PublicFit = "cover" | "contain" | "fill";

export type PublicMotionInstruction = MotionInstruction;

type PublicMotion = {
  revealAtMs: number;
  highlightedAtMs: number | null;
  enterMotion: PublicMotionInstruction | null;
  exitMotion: PublicMotionInstruction | null;
  highlightMotion: PublicMotionInstruction | null;
  unhighlightMotion: PublicMotionInstruction | null;
};

export type PublicCard = PublicMotion & {
  key: string;
  title: string;
  lines: Array<{label: string; value: string; tone: PublicTone}>;
  highlighted: boolean;
  role: "expected" | "actual" | "gap" | null;
};

export type PublicNumber = PublicMotion & {
  key: string;
  label: string;
  value: string;
  numericValue: number | null;
  precision: number | null;
  unit: string;
  comparison: string | null;
  tone: PublicTone;
  highlighted: boolean;
};

export type PublicNode = PublicMotion & {
  key: string;
  label: string;
  highlighted: boolean;
};

export type PublicArrow = PublicMotion & {
  key: string;
  fromKey: string;
  toKey: string;
  label: string;
  highlighted: boolean;
};

export type PublicPlacedAsset = {
  key: string;
  src: string;
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
  headline: string;
  supportingTexts: string[];
  uncertainty: string | null;
  screenQuestion: string;
  primaryElement: string;
  primaryFunction: ProductionScene["visualBeats"][number]["primaryFunction"];
  visualTemplate: ProductionScene["visualBeats"][number]["visualTemplate"];
  templateConfig: ProductionScene["visualBeats"][number]["templateConfig"];
  sequencePolicy: SequencePolicy;
  finalHoldMs: number;
  cards: PublicCard[];
  numbers: PublicNumber[];
  nodes: PublicNode[];
  arrows: PublicArrow[];
  texts: string[];
  sceneTimeMs: number;
  beatStartMs: number;
  beatEndMs: number;
  beatProgress: number;
  holdProgress: number;
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
    (placement) => placement.role === "background" && isPlacementActive(scene, placement, state),
  );
  if (!backgroundPlacement) throw new Error("canonical background is unavailable");

  const expressionAsset = resolveStrictExpressionAsset(state.expression);
  const foxPlacement = scene.assetPlacements.find(
    (placement) =>
      placement.role === "fox-expression" &&
      placement.assetId === expressionAsset.assetId &&
      isPlacementActive(scene, placement, state),
  );
  if (!foxPlacement) throw new Error(`fox expression asset is unavailable: ${expressionAsset.assetId}`);

  const selectedIds = new Set(beat.objectIds);
  const beatDurationMs = Math.max(1, beat.endMs - beat.startMs);
  const showTargets = new Set(
    scene.visualEvents
      .filter((event) => event.action === "show" && event.targetId && selectedIds.has(event.targetId))
      .map((event) => event.targetId as string),
  );
  const inferredSequencePolicy: SequencePolicy =
    beat.objectIds.length === 0 || beat.screenState === "News" || beat.screenState === "PictureBook"
      ? "static"
      : showTargets.size > 0
        ? "explicit"
        : "object-order-fallback";
  const sequencePolicy = beat.sequencePolicy ?? inferredSequencePolicy;
  const staggerMs = Math.min(900, Math.max(260, beatDurationMs * 0.11));
  const defaultRevealAtMs = (id: string) => {
    if (sequencePolicy === "static") return beat.startMs;
    const index = Math.max(0, beat.objectIds.indexOf(id));
    return beat.startMs + Math.min(index * staggerMs, beatDurationMs * 0.62);
  };
  const objectOrder = new Map(beat.objectIds.map((id, index) => [id, index]));
  const sortByBeatOrder = <T extends {key: string}>(items: T[]) => items.sort(
    (a, b) =>
      (objectOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
      (objectOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER),
  );
  const motionFor = (id: string): PublicMotion => ({
    revealAtMs: sequencePolicy === "explicit"
      ? state.visibleSinceMs.get(id) ?? defaultRevealAtMs(id)
      : Math.max(defaultRevealAtMs(id), state.visibleSinceMs.get(id) ?? 0),
    highlightedAtMs: state.highlightedSinceMs.get(id) ?? null,
    enterMotion: state.showMotionByTarget.get(id) ?? null,
    exitMotion: state.hideMotionByTarget.get(id) ?? null,
    highlightMotion: state.highlightMotionByTarget.get(id) ?? null,
    unhighlightMotion: state.unhighlightMotionByTarget.get(id) ?? null,
  });

  const cards = sortByBeatOrder(scene.cards
    .filter((card) => selectedIds.has(card.cardId) && state.visible.has(card.cardId))
    .map((card): PublicCard => ({
      key: card.cardId,
      title: card.title,
      lines: card.lines,
      highlighted: state.highlighted.has(card.cardId),
      role: card.role,
      ...motionFor(card.cardId),
    })));
  const numbers = sortByBeatOrder(scene.numbers
    .filter((number) => selectedIds.has(number.numberId) && state.visible.has(number.numberId))
    .map((number): PublicNumber => ({
      key: number.numberId,
      label: number.label,
      value: number.value,
      numericValue: number.numericValue ?? null,
      precision: number.precision ?? null,
      unit: number.unit,
      comparison: number.comparison,
      tone: number.tone,
      highlighted: state.highlighted.has(number.numberId),
      ...motionFor(number.numberId),
    })));
  const nodes = sortByBeatOrder(scene.nodes
    .filter((node) => selectedIds.has(node.nodeId) && state.visible.has(node.nodeId))
    .map((node): PublicNode => ({
      key: node.nodeId,
      label: node.label,
      highlighted: state.highlighted.has(node.nodeId),
      ...motionFor(node.nodeId),
    })));
  const arrows = sortByBeatOrder(scene.arrows
    .filter((arrow) => selectedIds.has(arrow.arrowId) && state.visible.has(arrow.arrowId))
    .map((arrow): PublicArrow => ({
      key: arrow.arrowId,
      fromKey: arrow.fromNodeId,
      toKey: arrow.toNodeId,
      label: arrow.label,
      highlighted: state.highlighted.has(arrow.arrowId),
      ...motionFor(arrow.arrowId),
    })));

  const beatPlacementIds = new Set(beat.assetPlacementIds);
  const activeBeatPlacements = scene.assetPlacements.filter(
    (placement) => beatPlacementIds.has(placement.placementId) && isPlacementActive(scene, placement, state),
  );
  const entityPlacement = beat.screenState === "EntityFocus"
    ? activeBeatPlacements.find((placement) => placement.role === "entity-card") ??
      activeBeatPlacements.find((placement) => ["main-media", "illustration", "chart"].includes(placement.role))
    : undefined;
  const entityPresentation: PublicMainContent["entityPresentation"] = beat.screenState !== "EntityFocus"
    ? null
    : entityPlacement?.role === "entity-card"
      ? "prebuilt-card"
      : entityPlacement
        ? "media"
        : "fallback";
  const mainAssets = activeBeatPlacements.map((placement) => publicAsset(
    placement,
    assets,
    beat.screenState === "EntityFocus" ? "full" : undefined,
  ));
  const overlays = scene.assetPlacements
    .filter((placement) => placement.role === "overlay" && isPlacementActive(scene, placement, state))
    .map((placement) => publicAsset(placement, assets));
  const generatedContentVisible =
    beat.screenState === "Data" ||
    beat.screenState === "Chart" ||
    beat.screenState === "EntityFocus" ||
    beat.screenState === "MainWithEntity";
  const beatProgress = Math.max(0, Math.min(1, (state.timeMs - beat.startMs) / beatDurationMs));
  const revealTimes = [...cards, ...numbers, ...nodes, ...arrows].map((item) => item.revealAtMs);
  const lastRevealAtMs = revealTimes.length > 0 ? Math.max(...revealTimes) : beat.startMs;
  const finalHoldMs = beat.finalHoldMs ?? Math.min(1_100, Math.max(350, beatDurationMs * 0.12));
  const holdStartMs = Math.min(beat.endMs - finalHoldMs, lastRevealAtMs + 650);
  const holdProgress = finalHoldMs === 0
    ? 1
    : Math.max(0, Math.min(1, (state.timeMs - holdStartMs) / finalHoldMs));

  return {
    headline: scene.headline,
    supportingTexts: beat.viewerTexts.length > 0 ? beat.viewerTexts : scene.supportingTexts,
    sourceLabel: scene.sourceLabel || null,
    captionText: state.captionText,
    background: publicAsset(backgroundPlacement, assets),
    fox: publicAsset(foxPlacement, assets),
    mainAssets,
    overlays,
    mainContent: generatedContentVisible
      ? {
          renderKind: beat.screenState === "EntityFocus" ? "entity" : renderKindMap[beat.visualMode],
          layout: beat.screenState === "MainWithEntity" ? "primary-with-entity" : "full",
          headline: scene.headline,
          supportingTexts: scene.supportingTexts,
          uncertainty: scene.uncertainty,
          screenQuestion: beat.screenQuestion,
          primaryElement: beat.primaryElement,
          primaryFunction: beat.primaryFunction,
          visualTemplate: beat.visualTemplate,
          templateConfig: beat.templateConfig,
          sequencePolicy,
          finalHoldMs,
          cards,
          numbers,
          nodes,
          arrows,
          texts: beat.viewerTexts,
          sceneTimeMs: state.timeMs,
          beatStartMs: beat.startMs,
          beatEndMs: beat.endMs,
          beatProgress,
          holdProgress,
          entityPresentation,
          entity: beat.entity ? {
            subjectType: beat.entity.subjectType,
            displayName: beat.entity.displayName,
            role: beat.entity.role,
            variant: beat.entity.variant,
          } : null,
        }
      : null,
  };
};
