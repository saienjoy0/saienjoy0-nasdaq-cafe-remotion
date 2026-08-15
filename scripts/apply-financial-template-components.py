#!/usr/bin/env python3
"""Apply the FVU-R2 financial component wiring.

Template-static legality now belongs to src/spec/static-template-soundness.ts and
must not be patched through validate-render-layout.ts. This helper remains only
for the deterministic Financial Visual component renderer wiring.
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
    if 'case "market-pulse-grid": return <MarketPulseGridTemplate' not in text:
        text = replace_once(text, old_cases, new_cases, "financial renderer switch")
    if "FinancialTemplateImplementationPending" in text:
        raise PatchError("pending component references remain after renderer patch")
    return text


def patched_files() -> dict[Path, str]:
    paths = {
        ROOT / "src/components/spec/VisualTemplateRenderer.tsx": patch_renderer,
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
