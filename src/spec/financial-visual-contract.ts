import {z} from "zod";

export const FINANCIAL_VISUAL_CONTRACT_VERSION = "1.0.0" as const;
export const FINANCIAL_TEMPLATE_REGISTRY_VERSION = "1.0.0" as const;
export const FINANCIAL_COMPATIBILITY_MATRIX_ID = "financial-visual-compat-2026-08" as const;

export const FINANCIAL_VISUAL_TEMPLATE_IDS = [
  "market-pulse-grid",
  "earnings-surprise",
  "dual-asset-split",
  "macro-pressure",
  "source-receipt",
] as const;

export const FINANCIAL_RECIPE_IDS = [
  "market-pulse-grid",
  "opening-contradiction",
  "earnings-surprise",
  "expected-anchor",
  "dual-asset-split",
  "split-opposition",
  "macro-pressure",
  "causal-build",
  "source-receipt",
  "news-media",
] as const;

export type FinancialVisualTemplateId = typeof FINANCIAL_VISUAL_TEMPLATE_IDS[number];
export type FinancialRecipeId = typeof FINANCIAL_RECIPE_IDS[number];

const safeIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const sourceIdSchema = z.string().regex(/^source-[0-9]{3}$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const nonEmptyText = z.string().refine((value) => value.trim().length > 0, "must not be empty");
const uniqueArray = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).max(max).superRefine((values, context) => {
  const seen = new Set<unknown>();
  values.forEach((value, index) => {
    if (seen.has(value)) context.addIssue({code: "custom", path: [index], message: `duplicate value: ${String(value)}`});
    seen.add(value);
  });
});

export const financialRecipeSchema = z.enum(FINANCIAL_RECIPE_IDS);

export const financialVisualTraceSchema = z.object({
  contractVersion: z.literal(FINANCIAL_VISUAL_CONTRACT_VERSION),
  intentId: z.string().regex(/^fvi-[a-z0-9][a-z0-9._-]{2,80}$/),
  selectedPlanId: z.string().regex(/^fvp-[a-z0-9][a-z0-9._-]{2,100}$/),
  selectedPlanSha256: sha256Schema,
  selectedPath: z.enum(["preferred", "fallback"]),
  recipeId: financialRecipeSchema,
  recipePlanSha256: sha256Schema,
  finalEpisodeContractSha256: sha256Schema,
  sourceIds: uniqueArray(sourceIdSchema, 8),
  metricIds: uniqueArray(safeIdSchema, 6),
  causalStepIds: uniqueArray(safeIdSchema, 4),
  displayOrder: uniqueArray(safeIdSchema, 10).min(1),
  comparisonBasis: nonEmptyText,
  reasonCodes: uniqueArray(nonEmptyText, 24),
}).strict();

export const financialVisualRootContractSchema = z.object({
  contractVersion: z.literal(FINANCIAL_VISUAL_CONTRACT_VERSION),
  intentVersion: z.literal("1.1.0"),
  recipePlanVersion: z.literal("1.0.0"),
  recipeRegistryVersion: z.literal("1.0.0"),
  finalEpisodeContractVersion: z.literal("1.0.0"),
  recipePlanSha256: sha256Schema,
  selectionCount: z.number().int().nonnegative(),
}).strict();

export const FINANCIAL_RECIPE_TEMPLATE_REGISTRY: Record<FinancialRecipeId, {
  path: "preferred" | "fallback";
  visualTemplates: readonly string[];
}> = {
  "market-pulse-grid": {path: "preferred", visualTemplates: ["market-pulse-grid"]},
  "opening-contradiction": {path: "fallback", visualTemplates: ["opening-contradiction"]},
  "earnings-surprise": {path: "preferred", visualTemplates: ["earnings-surprise"]},
  "expected-anchor": {path: "fallback", visualTemplates: ["expected-actual-bullet", "metric-comparison-board", "text-focus"]},
  "dual-asset-split": {path: "preferred", visualTemplates: ["dual-asset-split"]},
  "split-opposition": {path: "fallback", visualTemplates: ["split-comparison"]},
  "macro-pressure": {path: "preferred", visualTemplates: ["macro-pressure"]},
  "causal-build": {path: "fallback", visualTemplates: ["causal-lane"]},
  "source-receipt": {path: "preferred", visualTemplates: ["source-receipt"]},
  "news-media": {path: "fallback", visualTemplates: ["news-media"]},
};

export const FINANCIAL_VISUAL_COMPATIBILITY = {
  matrixId: FINANCIAL_COMPATIBILITY_MATRIX_ID,
  status: "pass",
  plotCreator: {
    financialIntentVersion: "1.1.0",
    financialRecipePlanVersion: "1.0.0",
    finalEpisodeContractVersion: "1.0.0",
  },
  renderer: {
    renderSpecVersion: "2.3.0",
    financialTemplateRegistryVersion: FINANCIAL_TEMPLATE_REGISTRY_VERSION,
    financialVisualTraceVersion: FINANCIAL_VISUAL_CONTRACT_VERSION,
  },
} as const;

export const isFinancialVisualTemplate = (value: string): value is FinancialVisualTemplateId =>
  (FINANCIAL_VISUAL_TEMPLATE_IDS as readonly string[]).includes(value);

export const isFinancialRecipeTemplatePairAllowed = (
  recipeId: FinancialRecipeId,
  templateId: string,
  selectedPath: "preferred" | "fallback",
) => {
  const registered = FINANCIAL_RECIPE_TEMPLATE_REGISTRY[recipeId];
  return registered.path === selectedPath && registered.visualTemplates.includes(templateId);
};

export type FinancialVisualTrace = z.infer<typeof financialVisualTraceSchema>;
export type FinancialVisualRootContract = z.infer<typeof financialVisualRootContractSchema>;
