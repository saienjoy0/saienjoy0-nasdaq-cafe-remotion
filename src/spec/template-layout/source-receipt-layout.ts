export type SourceReceiptLayoutMode = "side-by-side" | "stacked";

export type SourceReceiptLayoutInput = {
  primaryElement: string;
  screenQuestion: string;
  evidence: string[];
  comparisonBasis?: string | null;
};

export type SourceReceiptLayoutPlan = {
  mode: SourceReceiptLayoutMode;
  titleFontSize: number;
  questionFontSize: number;
  evidenceFontSize: number;
  evidenceCount: number;
};

const visibleLength = (value: string) => Array.from(value.replace(/\s+/gu, "")).length;
const within = (value: string, capacity: number) => visibleLength(value) <= capacity;

const SIDE = {
  title: 30,
  question: 34,
  evidence: 40,
  footer: 48,
} as const;

const STACKED = {
  title: 56,
  question: 60,
  evidence: 72,
  footer: 56,
} as const;

const fits = (input: SourceReceiptLayoutInput, budget: typeof SIDE | typeof STACKED) =>
  input.evidence.length <= 4 &&
  within(input.primaryElement, budget.title) &&
  within(input.screenQuestion, budget.question) &&
  input.evidence.every((item) => within(item, budget.evidence)) &&
  within(input.comparisonBasis ?? "", budget.footer);

export const planSourceReceiptLayout = (input: SourceReceiptLayoutInput): SourceReceiptLayoutPlan => {
  if (input.evidence.length === 0) {
    throw new Error("E_SOURCE_RECEIPT_TEXT_OVERFLOW:source-receipt requires evidence");
  }
  if (fits(input, SIDE)) {
    return {
      mode: "side-by-side",
      titleFontSize: 44,
      questionFontSize: 28,
      evidenceFontSize: 24,
      evidenceCount: input.evidence.length,
    };
  }
  if (fits(input, STACKED)) {
    return {
      mode: "stacked",
      titleFontSize: 38,
      questionFontSize: 26,
      evidenceFontSize: 23,
      evidenceCount: input.evidence.length,
    };
  }
  throw new Error("E_SOURCE_RECEIPT_TEXT_OVERFLOW:source-receipt content exceeds safe text budget");
};
