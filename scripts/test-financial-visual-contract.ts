import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  FINANCIAL_COMPATIBILITY_MATRIX_ID,
  FINANCIAL_RECIPE_TEMPLATE_REGISTRY,
  FINANCIAL_TEMPLATE_REGISTRY_VERSION,
  FINANCIAL_VISUAL_COMPATIBILITY,
  FINANCIAL_VISUAL_TEMPLATE_IDS,
  isFinancialVisualTemplate,
} from "../src/spec/financial-visual-contract";
import {renderSpecSchema} from "../src/spec/render-spec";
import {
  VISUAL_TEMPLATE_CONTRACTS,
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_VARIANT_IDS,
} from "../src/spec/visual-template-contract";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(ROOT, "render-specs", "fixtures", "renderable-9scene", "render_spec.json");
const compatibilityPath = path.join(ROOT, "contracts", "financial_visual_compatibility.json");
const legacy = JSON.parse(await readFile(fixturePath, "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sha = "a".repeat(64);

const firstBeat = (spec: any) => spec.scenes[0].visualBeats[0];
const sourceId = legacy.sources[0].sourceId as string;

const financialSpec = ({
  visualTemplate,
  recipeId,
  selectedPath = "preferred",
  variant,
}: {
  visualTemplate: string;
  recipeId: string;
  selectedPath?: "preferred" | "fallback";
  variant: string;
}) => {
  const spec = clone(legacy);
  spec.schemaVersion = "2.3.0";
  spec.financialVisualContract = {
    contractVersion: "1.0.0",
    intentVersion: "1.1.0",
    recipePlanVersion: "1.0.0",
    recipeRegistryVersion: "1.0.0",
    finalEpisodeContractVersion: "1.0.0",
    recipePlanSha256: sha,
    selectionCount: 1,
  };
  const beat = firstBeat(spec);
  beat.visualTemplate = visualTemplate;
  beat.templateVariant = variant;
  beat.screenState = visualTemplate === "source-receipt" ? "News" : "Chart";
  beat.templateConfig = {
    variant,
    comparisonBasis: "same session and unit",
    dataBasis: "financial-recipe-plan",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    displayOrder: ["metric-a"],
    metricIds: ["metric-a"],
    causalStepIds: [],
    highlightObjectIds: ["metric-a"],
  };
  beat.objectIds = ["metric-a"];
  beat.evidenceSourceIds = [sourceId];
  beat.financialReturnTarget = "return-to-fox";
  beat.financialVisualTrace = {
    contractVersion: "1.0.0",
    intentId: "fvi-contract-test",
    selectedPlanId: "fvp-contract-test",
    selectedPlanSha256: sha,
    selectedPath,
    recipeId,
    recipePlanSha256: sha,
    finalEpisodeContractSha256: sha,
    sourceIds: [sourceId],
    metricIds: ["metric-a"],
    causalStepIds: [],
    displayOrder: ["metric-a"],
    comparisonBasis: "same session and unit",
    reasonCodes: selectedPath === "fallback" ? ["PREFERRED_PLAN_INVALID"] : [],
  };
  return spec;
};

assert.equal(renderSpecSchema.parse(legacy).schemaVersion, "2.2.0", "legacy 2.2.0 remains valid");

const preferredCases = [
  ["market-pulse-grid", "market-pulse-grid", "grid"],
  ["earnings-surprise", "earnings-surprise", "zero-baseline"],
  ["dual-asset-split", "dual-asset-split", "center-zero"],
  ["macro-pressure", "macro-pressure", "pressure-lane"],
  ["source-receipt", "source-receipt", "receipt"],
] as const;
for (const [visualTemplate, recipeId, variant] of preferredCases) {
  const parsed = renderSpecSchema.parse(financialSpec({visualTemplate, recipeId, variant}));
  assert.equal(firstBeat(parsed).visualTemplate, visualTemplate);
  assert.equal(firstBeat(parsed).financialVisualTrace?.recipeId, recipeId);
}

// source-receipt is dual-use: financial lineage remains valid when explicitly
// traced, while generic source-document evidence must not acquire fabricated
// financial lineage merely because AI-B selected the same visual Template.
const genericSourceReceipt = financialSpec({
  visualTemplate: "source-receipt",
  recipeId: "source-receipt",
  variant: "receipt",
});
delete firstBeat(genericSourceReceipt).financialVisualTrace;
delete genericSourceReceipt.financialVisualContract;
const parsedGenericSourceReceipt = renderSpecSchema.parse(genericSourceReceipt);
assert.equal(firstBeat(parsedGenericSourceReceipt).visualTemplate, "source-receipt");
assert.equal(firstBeat(parsedGenericSourceReceipt).financialVisualTrace, undefined);
assert.equal(isFinancialVisualTemplate("source-receipt"), false, "source-receipt must not force financial lineage by template name");
assert.equal(isFinancialVisualTemplate("earnings-surprise"), true, "financial-only templates must still require financial lineage");

const fallback = renderSpecSchema.parse(financialSpec({
  visualTemplate: "expected-actual-bullet",
  recipeId: "expected-anchor",
  selectedPath: "fallback",
  variant: "zero-baseline",
}));
assert.equal(firstBeat(fallback).financialVisualTrace?.selectedPath, "fallback");

const expectFailure = (value: unknown, message: string) => {
  const result = renderSpecSchema.safeParse(value);
  assert.equal(result.success, false, message);
};

const missingTrace = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
delete firstBeat(missingTrace).financialVisualTrace;
expectFailure(missingTrace, "new financial template without trace must fail");

const missingRoot = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
delete missingRoot.financialVisualContract;
expectFailure(missingRoot, "traced Beat without root contract must fail");

const legacyFinancial = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
legacyFinancial.schemaVersion = "2.2.0";
expectFailure(legacyFinancial, "financial contract requires render_spec 2.3.0");

const badObjects = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
firstBeat(badObjects).objectIds = ["other"];
expectFailure(badObjects, "object IDs must equal trace display order");

const badSources = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
firstBeat(badSources).evidenceSourceIds = [];
expectFailure(badSources, "source IDs must equal trace sources");

const badPair = financialSpec({visualTemplate: "market-pulse-grid", recipeId: "earnings-surprise", variant: "grid"});
expectFailure(badPair, "Recipe and Template pair must be registered");

const badPath = financialSpec({
  visualTemplate: "earnings-surprise",
  recipeId: "earnings-surprise",
  selectedPath: "fallback",
  variant: "zero-baseline",
});
expectFailure(badPath, "preferred Recipe cannot be selected as fallback");

const duplicateTrace = financialSpec({visualTemplate: "earnings-surprise", recipeId: "earnings-surprise", variant: "zero-baseline"});
const copied = clone(firstBeat(duplicateTrace));
copied.beatId = duplicateTrace.scenes[0].visualBeats[1]?.beatId ?? "vb-01-99";
duplicateTrace.scenes[0].visualBeats.push(copied);
duplicateTrace.financialVisualContract.selectionCount = 2;
expectFailure(duplicateTrace, "duplicate financial intent and plan must fail");

const arbitrary = financialSpec({visualTemplate: "arbitrary-react-component", recipeId: "earnings-surprise", variant: "zero-baseline"});
expectFailure(arbitrary, "arbitrary renderer component must fail enum validation");

for (const templateId of FINANCIAL_VISUAL_TEMPLATE_IDS) {
  assert.ok((VISUAL_TEMPLATE_IDS as readonly string[]).includes(templateId), `${templateId} must be registered`);
  assert.ok(VISUAL_TEMPLATE_CONTRACTS[templateId], `${templateId} must have a fixed contract`);
}
for (const variant of ["grid", "receipt", "pressure-lane"]) {
  assert.ok((VISUAL_TEMPLATE_VARIANT_IDS as readonly string[]).includes(variant), `${variant} must be registered`);
}
for (const [recipeId, entry] of Object.entries(FINANCIAL_RECIPE_TEMPLATE_REGISTRY)) {
  assert.ok(entry.visualTemplates.length > 0, `${recipeId} requires at least one allowlisted Template`);
}

const compatibility = JSON.parse(await readFile(compatibilityPath, "utf8"));
assert.equal(compatibility.matrixId, FINANCIAL_COMPATIBILITY_MATRIX_ID);
assert.equal(compatibility.status, "pass");
assert.deepEqual(compatibility.plotCreator, {
  repository: "saienjoy0/nasdaq-plot-creator-",
  ...FINANCIAL_VISUAL_COMPATIBILITY.plotCreator,
});
assert.deepEqual(compatibility.renderer, {
  repository: "saienjoy0/saienjoy0-nasdaq-cafe-remotion",
  ...FINANCIAL_VISUAL_COMPATIBILITY.renderer,
});
assert.equal(FINANCIAL_TEMPLATE_REGISTRY_VERSION, "1.0.0");

console.log("financial visual renderer contract tests: PASS");
