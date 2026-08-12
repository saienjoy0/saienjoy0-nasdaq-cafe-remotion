import type {PublicMainContent, PublicNode, PublicNumber} from "../spec/public-view-model";

const motion = {
  revealAtMs: 0,
  highlightedAtMs: null,
  enterMotion: null,
  exitMotion: null,
  highlightMotion: null,
  unhighlightMotion: null,
} as const;

const number = (key: string, label: string, value: string, tone: PublicNumber["tone"]): PublicNumber => ({
  key,
  label,
  value,
  numericValue: Number.parseFloat(value),
  precision: 2,
  unit: "%",
  comparison: "同一セッション",
  tone,
  highlighted: false,
  ...motion,
});

const node = (key: string, label: string): PublicNode => ({key, label, highlighted: false, ...motion});

const base = (overrides: Partial<PublicMainContent>): PublicMainContent => ({
  renderKind: "numbers",
  layout: "full",
  headline: "朝のNASDAQカフェ｜Synthetic Current Contract",
  supportingTexts: [],
  uncertainty: null,
  screenQuestion: "確認ポイント",
  primaryElement: "確認済みViewer Text",
  primaryFunction: "evidence" as never,
  visualTemplate: "metric-comparison-board",
  templateConfig: {
    variant: "default",
    comparisonBasis: null,
    dataBasis: "synthetic-current-contract",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
  } as never,
  sequencePolicy: "static",
  finalHoldMs: 600,
  shot: null,
  previousShot: null,
  nextShot: null,
  cards: [],
  numbers: [],
  nodes: [],
  arrows: [],
  texts: [],
  sceneTimeMs: 1800,
  beatStartMs: 0,
  beatEndMs: 3000,
  beatProgress: .6,
  holdProgress: .2,
  entityPresentation: null,
  entity: null,
  ...overrides,
});

export const makeCardFirstCurrentFixtures = () => [
  {
    fileName: "01_opening_contradiction.png",
    content: base({
      renderKind: "conclusion",
      visualTemplate: "opening-contradiction",
      templateConfig: {variant: "default", comparisonBasis: null, dataBasis: "synthetic-current-contract", nodeOrder: [], laneLabels: [], outcomeNodeId: null} as never,
      numbers: [number("nasdaq", "NASDAQ", "-0.60", "negative")],
      cards: [{key: "verdict", title: "結論", lines: [{label: "確認", value: "単一材料では説明しきれない", tone: "emphasis"}], highlighted: false, role: null, ...motion}],
      texts: ["単一材料では説明しきれない"],
      screenQuestion: "では何が重かったのか",
      primaryElement: "単一材料では説明しきれない",
    }),
  },
  {
    fileName: "02_two_item_comparison.png",
    content: base({
      renderKind: "stock-comparison",
      visualTemplate: "split-comparison",
      templateConfig: {variant: "two-lane", comparisonBasis: "同一セッション", dataBasis: "synthetic-current-contract", nodeOrder: [], laneLabels: [], outcomeNodeId: null} as never,
      numbers: [number("brent", "Brent", "+1.40", "positive"), number("nasdaq", "NASDAQ", "-0.60", "negative")],
    }),
  },
  {
    fileName: "03_three_item_comparison.png",
    content: base({
      renderKind: "stock-comparison",
      visualTemplate: "focus-matrix",
      templateConfig: {variant: "default", comparisonBasis: "同一セッション", dataBasis: "synthetic-current-contract", nodeOrder: [], laneLabels: [], outcomeNodeId: null} as never,
      numbers: [number("nvda", "NVIDIA", "-2.05", "negative"), number("qqq", "QQQ", "-0.67", "negative"), number("soxx", "SOXX", "-0.58", "negative")],
      texts: ["3資産を同じ基準で比較"],
      primaryElement: "3資産を同じ基準で比較",
    }),
  },
  {
    fileName: "04_causal_four_step.png",
    content: base({
      renderKind: "causal",
      visualTemplate: "causal-lane",
      templateConfig: {variant: "left-to-right", comparisonBasis: null, dataBasis: "synthetic-current-contract", nodeOrder: ["a", "b", "c", "d"], laneLabels: [], outcomeNodeId: "d"} as never,
      nodes: [node("a", "ホルムズ不透明"), node("b", "原油高"), node("c", "インフレ / Fed不安"), node("d", "大型テック圧力")],
      arrows: [
        {key: "ab", fromKey: "a", toKey: "b", label: "", highlighted: false, ...motion},
        {key: "bc", fromKey: "b", toKey: "c", label: "", highlighted: false, ...motion},
        {key: "cd", fromKey: "c", toKey: "d", label: "", highlighted: false, ...motion},
      ],
    }),
  },
  {
    fileName: "05_verification.png",
    content: base({
      renderKind: "verification",
      visualTemplate: "verification-matrix",
      templateConfig: {variant: "reported-sequence", comparisonBasis: null, dataBasis: "synthetic-current-contract", nodeOrder: [], laneLabels: [], outcomeNodeId: null} as never,
      texts: ["通常取引", "引け後", "後発材料を通常取引の原因へ遡及しない"],
    }),
  },
] as const;

export type CardFirstCurrentFixture = ReturnType<typeof makeCardFirstCurrentFixtures>[number];
