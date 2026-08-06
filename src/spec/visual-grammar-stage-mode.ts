export const VISUAL_GRAMMAR_STAGE_MODES = ["candidate", "legacy"] as const;

export type VisualGrammarStageMode = typeof VISUAL_GRAMMAR_STAGE_MODES[number];

export const parseVisualGrammarStageMode = (
  value: unknown,
): VisualGrammarStageMode => {
  if (value === undefined || value === null || value === "") return "candidate";
  if (value === "candidate" || value === "legacy") return value;
  throw new Error(
    `visualGrammarStageMode must be candidate or legacy; got=${String(value)}`,
  );
};
