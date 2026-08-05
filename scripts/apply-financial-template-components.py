#!/usr/bin/env python3
"""Apply the FVU-R2 component and layout-validator wiring.

The patch is narrow, deterministic and idempotent. Use --check in CI after the
patched files and generated contracts have been committed.
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


def patch_renderer(text: str) -> str:
    if 'from "./FinancialVisualTemplates"' not in text:
        anchor = '''import {
  EntityFocusStoryTemplate,
  FinalAssemblyTemplate as FinalAssemblyStoryTemplate,
  FocusMatrixTemplate,
  HeroNumberTemplate,
  SplitComparisonTemplate,
} from "./AdditionalVisualTemplates";
'''
        addition = anchor + '''import {
  DualAssetSplitTemplate,
  EarningsSurpriseTemplate,
  MacroPressureTemplate,
  MarketPulseGridTemplate,
  SourceReceiptTemplate,
} from "./FinancialVisualTemplates";
'''
        text = replace_once(text, anchor, addition, "financial component import")

    pending = '''const FinancialTemplateImplementationPending: React.FC<{templateId: string}> = ({templateId}) => {
  throw new Error(`Financial Visual Template implementation is not available yet: ${templateId}`);
};

'''
    text = text.replace(pending, "")

    old_cases = '''    case "market-pulse-grid":
    case "earnings-surprise":
    case "dual-asset-split":
    case "macro-pressure":
    case "source-receipt":
      return <FinancialTemplateImplementationPending templateId={content.visualTemplate}/>;
'''
    new_cases = '''    case "market-pulse-grid": return <MarketPulseGridTemplate content={content}/>;
    case "earnings-surprise": return <EarningsSurpriseTemplate content={content}/>;
    case "dual-asset-split": return <DualAssetSplitTemplate content={content}/>;
    case "macro-pressure": return <MacroPressureTemplate content={content}/>;
    case "source-receipt": return <SourceReceiptTemplate content={content}/>;
'''
    if "FinancialTemplateImplementationPending" in text:
        raise PatchError("pending component block was not removed")
    if 'case "market-pulse-grid": return <MarketPulseGridTemplate' not in text:
        text = replace_once(text, old_cases, new_cases, "financial renderer switch")
    return text


def patch_layout(text: str) -> str:
    old_limit = '''      if (["number-comparison", "chart", "stock-comparison"].includes(beat.visualMode) && visibleNumbers.length > 4) {
        throw new Error(`${path}.objectIds: comparison view supports at most four visible numbers`);
      }
'''
    new_limit = '''      const comparisonLimit = beat.visualTemplate === "market-pulse-grid" ? 6 : 4;
      if (["number-comparison", "chart", "stock-comparison"].includes(beat.visualMode) && visibleNumbers.length > comparisonLimit) {
        throw new Error(`${path}.objectIds: comparison view supports at most ${comparisonLimit} visible numbers`);
      }
'''
    if "const comparisonLimit = beat.visualTemplate" not in text:
        text = replace_once(text, old_limit, new_limit, "financial comparison limit")

    if 'template === "market-pulse-grid"' not in text:
        anchor = '''    if (template === "entity-card-full" && (beat.screenState !== "EntityFocus" || !beat.entity)) throw new Error(`${path}: entity-card-full requires EntityFocus and entity metadata`);
'''
        addition = '''    if (template === "market-pulse-grid" && (visibleNumbers.length < 3 || visibleNumbers.length > 6)) throw new Error(`${path}.objectIds: market-pulse-grid requires three to six visible numbers`);
    if (template === "earnings-surprise" && visibleNumbers.length !== 3) throw new Error(`${path}.objectIds: earnings-surprise requires exactly three visible numbers`);
    if (template === "dual-asset-split" && visibleNumbers.length !== 2) throw new Error(`${path}.objectIds: dual-asset-split requires exactly two visible numbers`);
    if (template === "macro-pressure") {
      assertCausalShape(visibleNodes.map((node) => node.nodeId), visibleArrows, `${path}.objectIds`);
      if (visibleNodes.length < 2 || visibleNodes.length > 4) throw new Error(`${path}.objectIds: macro-pressure requires two to four visible nodes`);
      if (visibleArrows.length < 1 || visibleArrows.length > 3) throw new Error(`${path}.objectIds: macro-pressure requires one to three visible arrows`);
      const order = beat.templateConfig.nodeOrder;
      if (order.length !== visibleNodes.length) throw new Error(`${path}.templateConfig.nodeOrder: macro-pressure requires the complete visible node order`);
      for (let index = 0; index < order.length - 1; index += 1) if (!visibleArrows.some((arrow) => arrow.fromNodeId === order[index] && arrow.toNodeId === order[index + 1])) throw new Error(`${path}.templateConfig.nodeOrder: missing sequential arrow ${order[index]} -> ${order[index + 1]}`);
    }
    if (template === "source-receipt") {
      const evidenceCount = visibleCards.reduce((total, card) => total + Math.max(1, card.lines.length), 0) + visibleNumbers.length + beat.viewerTexts.length;
      if (evidenceCount < 1 || evidenceCount > 6) throw new Error(`${path}: source-receipt requires one to six visible evidence items`);
    }
''' + anchor
        text = replace_once(text, anchor, addition, "financial layout constraints")
    return text


def patched_files() -> dict[Path, str]:
    paths = {
        ROOT / "src/components/spec/VisualTemplateRenderer.tsx": patch_renderer,
        ROOT / "src/spec/validate-render-layout.ts": patch_layout,
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
        raise SystemExit("financial template component patch is not applied: " + ", ".join(changed))
    print("patched: " + ", ".join(changed) if changed else "financial template component patch already applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
