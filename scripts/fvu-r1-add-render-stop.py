#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src/components/spec/VisualTemplateRenderer.tsx"

text = TARGET.read_text(encoding="utf-8")

component = '''
const FinancialTemplateImplementationPending: React.FC<{templateId: string}> = ({templateId}) => {
  throw new Error(`Financial Visual Template implementation is not available yet: ${templateId}`);
};

'''
anchor = 'export const VisualTemplateRenderer: React.FC<{content: PublicMainContent}> = ({content}) => {\n'
if "FinancialTemplateImplementationPending" not in text:
    if text.count(anchor) != 1:
        raise SystemExit("renderer export anchor not found exactly once")
    text = text.replace(anchor, component + anchor, 1)

cases_anchor = '  switch (content.visualTemplate) {\n'
cases = '''  switch (content.visualTemplate) {
    case "market-pulse-grid":
    case "earnings-surprise":
    case "dual-asset-split":
    case "macro-pressure":
    case "source-receipt":
      return <FinancialTemplateImplementationPending templateId={content.visualTemplate}/>;
'''
if 'case "market-pulse-grid":' not in text:
    if text.count(cases_anchor) != 1:
        raise SystemExit("renderer switch anchor not found exactly once")
    text = text.replace(cases_anchor, cases, 1)

TARGET.write_text(text, encoding="utf-8")
print("added explicit R1 render stop for five financial templates")
