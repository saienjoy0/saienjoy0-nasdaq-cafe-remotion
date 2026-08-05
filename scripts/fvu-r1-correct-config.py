#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one anchor, found {count}")
    return text.replace(old, new, 1)


old_config = '''const visualTemplateConfigSchema = z.object({
  variant: visualTemplateVariantSchema,
  comparisonBasis: nullableText.default(null),
  dataBasis: nonEmptyText.default("render-spec"),
  nodeOrder: z.array(safeId).max(4).default([]),
  laneLabels: z.array(nonEmptyText).max(2).default([]),
  outcomeNodeId: safeId.nullable().default(null),
  displayOrder: z.array(safeId).max(10).default([]),
  metricIds: z.array(safeId).max(6).default([]),
  causalStepIds: z.array(safeId).max(4).default([]),
  highlightObjectIds: z.array(safeId).max(4).default([]),
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

render_path = ROOT / "src/spec/render-spec.ts"
render = render_path.read_text(encoding="utf-8")
render = replace_once(render, old_config, new_config, "render config")
render = render.replace("arraysEqual(beat.templateConfig.displayOrder, trace.displayOrder)", "arraysEqual(beat.templateConfig.displayOrder ?? [], trace.displayOrder)")
render = render.replace("arraysEqual(beat.templateConfig.metricIds, trace.metricIds)", "arraysEqual(beat.templateConfig.metricIds ?? [], trace.metricIds)")
render = render.replace("arraysEqual(beat.templateConfig.causalStepIds, trace.causalStepIds)", "arraysEqual(beat.templateConfig.causalStepIds ?? [], trace.causalStepIds)")
render_path.write_text(render, encoding="utf-8")

patch_path = ROOT / "scripts/apply-financial-render-contract.py"
patch = patch_path.read_text(encoding="utf-8")
patch = replace_once(patch, old_config, new_config, "patch-script config")
patch = patch.replace("arraysEqual(beat.templateConfig.displayOrder, trace.displayOrder)", "arraysEqual(beat.templateConfig.displayOrder ?? [], trace.displayOrder)")
patch = patch.replace("arraysEqual(beat.templateConfig.metricIds, trace.metricIds)", "arraysEqual(beat.templateConfig.metricIds ?? [], trace.metricIds)")
patch = patch.replace("arraysEqual(beat.templateConfig.causalStepIds, trace.causalStepIds)", "arraysEqual(beat.templateConfig.causalStepIds ?? [], trace.causalStepIds)")
patch_path.write_text(patch, encoding="utf-8")

test_path = ROOT / "scripts/test-financial-visual-contract.ts"
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    '''    comparisonBasis: "same session and unit",
    displayOrder: ["metric-a"],''',
    '''    comparisonBasis: "same session and unit",
    dataBasis: "financial-recipe-plan",
    nodeOrder: [],
    laneLabels: [],
    outcomeNodeId: null,
    displayOrder: ["metric-a"],''',
    "contract test config",
)
test_path.write_text(test, encoding="utf-8")
print("corrected financial template config input compatibility")
