#!/usr/bin/env python3
"""Apply the FVU-R1 render contract patch deterministically.

The script is intentionally narrow and idempotent. It updates only the existing
render-spec and visual-template contract anchors needed for render_spec 2.3.0.
Use --check after the patch has been committed to ensure no source drift.
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class PatchError(RuntimeError):
    pass


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise PatchError(f"{label}: expected one anchor, found {count}")
    return text.replace(old, new, 1)


def patch_visual_template_contract(text: str) -> str:
    if '"market-pulse-grid"' not in text:
        text = replace_once(
            text,
            '  "opening-contradiction",\n',
            '  "opening-contradiction",\n'
            '  "market-pulse-grid",\n'
            '  "earnings-surprise",\n'
            '  "dual-asset-split",\n'
            '  "macro-pressure",\n'
            '  "source-receipt",\n',
            "financial visual template IDs",
        )
    if '  "grid",\n' not in text:
        text = replace_once(
            text,
            '  "prebuilt-card",\n',
            '  "prebuilt-card",\n'
            '  "grid",\n'
            '  "receipt",\n'
            '  "pressure-lane",\n',
            "financial template variants",
        )
    if '"market-pulse-grid": {' not in text:
        anchor = '  "opening-contradiction": {family: "opening", supportedScreenStates: ["Data", "Chart"], variants: ["default"], cards: range(0, 1), numbers: range(0, 4), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},\n'
        addition = anchor + (
            '  "market-pulse-grid": {family: "financial-market", supportedScreenStates: ["Data", "Chart"], variants: ["grid", "default"], cards: range(0, 0), numbers: range(3, 6), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},\n'
            '  "earnings-surprise": {family: "financial-gap", supportedScreenStates: ["Data", "Chart"], variants: ["zero-baseline", "default"], cards: range(0, 3), numbers: range(3, 3), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},\n'
            '  "dual-asset-split": {family: "financial-divergence", supportedScreenStates: ["Data", "Chart", "MainWithEntity"], variants: ["center-zero", "two-lane"], cards: range(0, 2), numbers: range(2, 2), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: true},\n'
            '  "macro-pressure": {family: "financial-macro", supportedScreenStates: ["Data", "Chart", "MainWithEntity"], variants: ["pressure-lane", "left-to-right"], cards: range(0, 0), numbers: range(0, 1), nodes: range(2, 4), arrows: range(1, 3), requiresNumericValue: false},\n'
            '  "source-receipt": {family: "financial-source", supportedScreenStates: ["Data", "News"], variants: ["receipt", "default"], cards: range(0, 1), numbers: range(0, 2), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},\n'
        )
        text = replace_once(text, anchor, addition, "financial template contracts")
    return text


def patch_render_spec(text: str) -> str:
    if 'from "./financial-visual-contract"' not in text:
        anchor = 'import {\n  VISUAL_TEMPLATE_IDS,\n  VISUAL_TEMPLATE_VARIANT_IDS,\n} from "./visual-template-contract";\n'
        addition = anchor + (
            'import {\n'
            '  financialVisualRootContractSchema,\n'
            '  financialVisualTraceSchema,\n'
            '  isFinancialRecipeTemplatePairAllowed,\n'
            '  isFinancialVisualTemplate,\n'
            '} from "./financial-visual-contract";\n'
        )
        text = replace_once(text, anchor, addition, "financial contract import")

    old_config = '''const visualTemplateConfigSchema = z.object({
  variant: visualTemplateVariantSchema,
  comparisonBasis: nullableText,
  dataBasis: nonEmptyText,
  nodeOrder: z.array(safeId).max(4),
  laneLabels: z.array(nonEmptyText).max(2),
  outcomeNodeId: safeId.nullable(),
}).strict();'''
    new_config = '''const visualTemplateConfigSchema = z.object({
  variant: visualTemplateVariantSchema,
  comparisonBasis: nullableText,
  dataBasis: nonEmptyText,
  nodeOrder: z.array(safeId).max(4),
  laneLabels: z.array(nonEmptyText).max(2),
  outcomeNodeId: safeId.nullable(),
  displayOrder: z.array(safeId).max(10).optional(),
  metricIds: z.array(safeId).max(6).optional(),
  causalStepIds: z.array(safeId).max(4).optional(),
  highlightObjectIds: z.array(safeId).max(4).optional(),
}).strict();'''
    if "highlightObjectIds: z.array(safeId)" not in text:
        text = replace_once(text, old_config, new_config, "financial template config")

    old_beat = '  beatId: z.string().regex(/^scene-0[1-9]-beat-[0-9]{3}$/),'
    new_beat = '  beatId: z.string().regex(/^(?:scene-0[1-9]-beat-[0-9]{3}|vb-0[1-9]-[0-9]{2})$/),'
    if "vb-0[1-9]" not in text:
        text = replace_once(text, old_beat, new_beat, "Visual Beat ID compatibility")

    if "templateVariant: visualTemplateVariantSchema.optional()" not in text:
        text = replace_once(
            text,
            '  visualTemplate: visualTemplateSchema,\n  templateConfig: visualTemplateConfigSchema,\n',
            '  visualTemplate: visualTemplateSchema,\n'
            '  templateVariant: visualTemplateVariantSchema.optional(),\n'
            '  templateConfig: visualTemplateConfigSchema,\n',
            "top-level template variant",
        )
    if "financialVisualTrace: financialVisualTraceSchema.optional()" not in text:
        text = replace_once(
            text,
            '  fallback: nullableText,\n  entity: entityBeatSchema.nullable(),\n',
            '  fallback: nullableText,\n'
            '  financialReturnTarget: nonEmptyText.optional(),\n'
            '  financialVisualTrace: financialVisualTraceSchema.optional(),\n'
            '  entity: entityBeatSchema.nullable(),\n',
            "financial Visual Beat trace fields",
        )

    if 'schemaVersion: z.union([z.literal("2.2.0"), z.literal("2.3.0")])' not in text:
        text = replace_once(
            text,
            '  schemaVersion: z.literal("2.2.0"),\n  episode: episodeSchema,\n',
            '  schemaVersion: z.union([z.literal("2.2.0"), z.literal("2.3.0")]),\n'
            '  financialVisualContract: financialVisualRootContractSchema.optional(),\n'
            '  episode: episodeSchema,\n',
            "render spec 2.3 root contract",
        )

    if "const financialTraceBeats =" not in text:
        anchor = '''  spec.scenes.forEach((scene, index) => {
    if (scene.sceneId !== expectedIds[index] || scene.sceneNumber !== index + 1) context.addIssue({code: "custom", path: ["scenes", index], message: `expected ${expectedIds[index]} with sceneNumber ${index + 1}`});
    const expectedRole = index === 0 ? "opening-hook-market-direction-greeting-conclusion" : index === 8 ? "closing-recap-sendoff-goodnight" : "editorial-body";
    if (scene.sceneRole !== expectedRole) context.addIssue({code: "custom", path: ["scenes", index, "sceneRole"], message: `Scene ${index + 1} requires role ${expectedRole}`});
  });
'''
        addition = anchor + '''
  const arraysEqual = (left: readonly string[], right: readonly string[]) =>
    left.length === right.length && left.every((value, index) => value === right[index]);
  const financialTraceBeats = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.flatMap((beat, beatIndex) =>
      beat.financialVisualTrace ? [{sceneIndex, beatIndex, beat, trace: beat.financialVisualTrace}] : [],
    ),
  );
  const newFinancialTemplates = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.flatMap((beat, beatIndex) =>
      isFinancialVisualTemplate(beat.visualTemplate) ? [{sceneIndex, beatIndex, beat}] : [],
    ),
  );
  if (spec.schemaVersion === "2.2.0") {
    if (spec.financialVisualContract !== undefined) context.addIssue({code: "custom", path: ["financialVisualContract"], message: "render_spec 2.2.0 must not contain the financial root contract"});
    if (financialTraceBeats.length > 0 || newFinancialTemplates.length > 0) context.addIssue({code: "custom", path: ["scenes"], message: "financial Visual Beats require render_spec 2.3.0"});
  } else {
    if (newFinancialTemplates.some(({beat}) => beat.financialVisualTrace === undefined)) {
      context.addIssue({code: "custom", path: ["scenes"], message: "new financial Visual Templates require financialVisualTrace"});
    }
    if (financialTraceBeats.length > 0 && spec.financialVisualContract === undefined) {
      context.addIssue({code: "custom", path: ["financialVisualContract"], message: "financial Visual Beats require the root financialVisualContract"});
    }
    if (spec.financialVisualContract !== undefined) {
      if (spec.financialVisualContract.selectionCount !== financialTraceBeats.length) context.addIssue({code: "custom", path: ["financialVisualContract", "selectionCount"], message: `selectionCount must equal traced Beat count ${financialTraceBeats.length}`});
      const seenIntents = new Set<string>();
      const seenPlans = new Set<string>();
      financialTraceBeats.forEach(({sceneIndex, beatIndex, beat, trace}) => {
        const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
        if (seenIntents.has(trace.intentId)) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "intentId"], message: `duplicate financial intent: ${trace.intentId}`});
        if (seenPlans.has(trace.selectedPlanId)) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "selectedPlanId"], message: `duplicate selected financial plan: ${trace.selectedPlanId}`});
        seenIntents.add(trace.intentId);
        seenPlans.add(trace.selectedPlanId);
        if (trace.recipePlanSha256 !== spec.financialVisualContract?.recipePlanSha256) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "recipePlanSha256"], message: "trace Recipe Plan SHA must match root contract"});
        if (!isFinancialRecipeTemplatePairAllowed(trace.recipeId, beat.visualTemplate, trace.selectedPath)) context.addIssue({code: "custom", path: [...path, "visualTemplate"], message: `${trace.recipeId} is not allowed to select ${beat.visualTemplate} as ${trace.selectedPath}`});
        if (beat.templateVariant === undefined) context.addIssue({code: "custom", path: [...path, "templateVariant"], message: "financial Visual Beat requires templateVariant"});
        if (beat.templateVariant !== beat.templateConfig.variant) context.addIssue({code: "custom", path: [...path, "templateVariant"], message: "templateVariant must match templateConfig.variant"});
        if (!arraysEqual(beat.objectIds, trace.displayOrder)) context.addIssue({code: "custom", path: [...path, "objectIds"], message: "objectIds must equal selected displayOrder"});
        if (!arraysEqual(beat.evidenceSourceIds, trace.sourceIds)) context.addIssue({code: "custom", path: [...path, "evidenceSourceIds"], message: "evidenceSourceIds must equal selected sourceIds"});
        if (!arraysEqual(beat.templateConfig.displayOrder ?? [], trace.displayOrder)) context.addIssue({code: "custom", path: [...path, "templateConfig", "displayOrder"], message: "templateConfig.displayOrder must match trace"});
        if (!arraysEqual(beat.templateConfig.metricIds ?? [], trace.metricIds)) context.addIssue({code: "custom", path: [...path, "templateConfig", "metricIds"], message: "templateConfig.metricIds must match trace"});
        if (!arraysEqual(beat.templateConfig.causalStepIds ?? [], trace.causalStepIds)) context.addIssue({code: "custom", path: [...path, "templateConfig", "causalStepIds"], message: "templateConfig.causalStepIds must match trace"});
        if (beat.templateConfig.comparisonBasis !== trace.comparisonBasis) context.addIssue({code: "custom", path: [...path, "templateConfig", "comparisonBasis"], message: "comparison basis must match trace"});
        if (beat.financialReturnTarget === undefined) context.addIssue({code: "custom", path: [...path, "financialReturnTarget"], message: "financial Visual Beat requires a return target"});
        if (trace.selectedPath === "preferred" && trace.reasonCodes.length !== 0) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "reasonCodes"], message: "preferred selection must not contain fallback reason codes"});
        if (trace.selectedPath === "fallback" && trace.reasonCodes.length === 0) context.addIssue({code: "custom", path: [...path, "financialVisualTrace", "reasonCodes"], message: "fallback selection requires at least one reason code"});
      });
    }
  }
'''
        text = replace_once(text, anchor, addition, "financial render-spec validation")
    return text


def patch_schema_generator(text: str) -> str:
    return text.replace(
        'title: "NASDAQ Cafe render_spec 2.1.0",',
        'title: "NASDAQ Cafe render_spec 2.3.0",',
    )


def patched_files() -> dict[Path, str]:
    paths = {
        ROOT / "src/spec/visual-template-contract.ts": patch_visual_template_contract,
        ROOT / "src/spec/render-spec.ts": patch_render_spec,
        ROOT / "scripts/generate-render-spec-schema.ts": patch_schema_generator,
    }
    return {path: patcher(path.read_text(encoding="utf-8")) for path, patcher in paths.items()}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed: list[str] = []
    for path, patched in patched_files().items():
        current = path.read_text(encoding="utf-8")
        if current != patched:
            changed.append(path.relative_to(ROOT).as_posix())
            if not args.check:
                path.write_text(patched, encoding="utf-8")
    if args.check and changed:
        raise SystemExit("financial render contract patch is not applied: " + ", ".join(changed))
    if changed:
        print("patched: " + ", ".join(changed))
    else:
        print("financial render contract patch already applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
