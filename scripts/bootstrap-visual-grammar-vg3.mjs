import {readFile, writeFile} from "node:fs/promises";

const replaceOnce = (source, before, after, label) => {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`missing patch anchor: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`ambiguous patch anchor: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const replaceSection = (source, start, end, replacement, label) => {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`missing section start: ${label}`);
  const endIndex = source.indexOf(end, startIndex);
  if (endIndex < 0) throw new Error(`missing section end: ${label}`);
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
};

const transparentSurface = (typeDeclaration, end) => `${typeDeclaration} = ({children, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  ...style,
}}>{children}</div>;

${end}`;

const rendererPath = "src/components/spec/VisualTemplateRenderer.tsx";
let renderer = await readFile(rendererPath, "utf8");
renderer = replaceOnce(
  renderer,
  `} from "./FinancialVisualTemplates";\n`,
  `} from "./FinancialVisualTemplates";\nimport {VisualGrammarStageHost} from "./VisualGrammarStageHost";\n`,
  "Stage Host import",
);
renderer = replaceSection(
  renderer,
  "const Surface: React.FC<",
  "const Tag:",
  transparentSurface(
    "const Surface: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties}>",
    "const Tag:",
  ),
  "VisualTemplateRenderer generic Surface",
);
const oldRendererExport = renderer.slice(renderer.indexOf("export const VisualTemplateRenderer:"));
if (!oldRendererExport.startsWith("export const VisualTemplateRenderer:")) throw new Error("missing renderer export");
const newRendererExport = `const renderSelectedVisualTemplate = (content: PublicMainContent): React.ReactNode => {
  switch (content.visualTemplate) {
    case "market-pulse-grid": return <MarketPulseGridTemplate content={content}/>;
    case "earnings-surprise": return <EarningsSurpriseTemplate content={content}/>;
    case "dual-asset-split": return <DualAssetSplitTemplate content={content}/>;
    case "macro-pressure": return <MacroPressureTemplate content={content}/>;
    case "source-receipt": return <SourceReceiptTemplate content={content}/>;
    case "hero-number": return <HeroNumberTemplate content={content}/>;
    case "split-comparison": return <SplitComparisonTemplate content={content}/>;
    case "focus-matrix": return <FocusMatrixTemplate content={content}/>;
    case "final-assembly": return <FinalAssemblyStoryTemplate content={content}/>;
    case "entity-card-full": return <EntityFocusStoryTemplate content={content}/>;
    case "opening-contradiction": return <OpeningContradiction content={content}/>;
    case "closing-recap": return <FinalAssembly content={content}/>;
    case "expected-actual-bullet": return <BulletComparison content={content}/>;
    case "expected-actual-gap-flow": return <ExpectedActualFlow content={content}/>;
    case "causal-lane": return <CausalLane content={content}/>;
    case "tailwind-headwind": return <TailwindHeadwind content={content}/>;
    case "diverging-stock-bars": return <DivergingBars content={content}/>;
    case "verification-matrix": return <VerificationMatrix content={content}/>;
    case "verification-checklist": return <VerificationMatrix content={content}/>;
    case "conclusion-card":
    case "metric-comparison-board":
    case "index-return-bars":
    case "evidence-boundary":
    case "analogy-steps":
    case "news-media":
    case "text-focus":
      return <SpecVisualMode content={content}/>;
  }
  throw new Error(\`unsupported Visual Template: \${content.visualTemplate}\`);
};

export const VisualTemplateRenderer: React.FC<{content: PublicMainContent}> = ({content}) => (
  <VisualGrammarStageHost
    visualTemplate={content.visualTemplate}
    variant={content.templateConfig.variant}
  >
    {renderSelectedVisualTemplate(content)}
  </VisualGrammarStageHost>
);
`;
renderer = renderer.slice(0, renderer.indexOf("export const VisualTemplateRenderer:")) + newRendererExport;
await writeFile(rendererPath, renderer, "utf8");

const additionalPath = "src/components/spec/AdditionalVisualTemplates.tsx";
let additional = await readFile(additionalPath, "utf8");
additional = replaceSection(
  additional,
  "const Surface: React.FC<",
  "const Value:",
  transparentSurface(
    "const Surface: React.FC<{children: React.ReactNode; accent?: string; style?: React.CSSProperties}>",
    "const Value:",
  ),
  "AdditionalVisualTemplates generic Surface",
);
await writeFile(additionalPath, additional, "utf8");

const financialPath = "src/components/spec/FinancialVisualTemplates.tsx";
let financial = await readFile(financialPath, "utf8");
financial = replaceSection(
  financial,
  "const Surface: FC<",
  "const Pill:",
  `const Surface: FC<{children: ReactNode; accent?: string; style?: CSSProperties}> = ({children, style}) => (
  <div style={{
    position: "relative",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    ...style,
  }}>
    {children}
  </div>
);

const Pill:`,
  "FinancialVisualTemplates generic Surface",
);
await writeFile(financialPath, financial, "utf8");

const modesPath = "src/components/spec/SpecVisualModes.tsx";
let modes = await readFile(modesPath, "utf8");
modes = replaceSection(
  modes,
  "const Surface: React.FC<",
  "const Pill:",
  `const Surface: React.FC<{
  children: React.ReactNode;
  accent?: string;
  style?: React.CSSProperties;
}> = ({children, style}) => <div style={{
  position: "relative",
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  ...style,
}}>{children}</div>;

const Pill:`,
  "SpecVisualModes generic Surface",
);
await writeFile(modesPath, modes, "utf8");

const packagePath = "package.json";
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts["test:visual-grammar-stage-shells"] = "tsx scripts/test-visual-grammar-stage-shells.tsx";
if (!packageJson.scripts["test:visual-story"].includes("test:visual-grammar-stage-shells")) {
  packageJson.scripts["test:visual-story"] = packageJson.scripts["test:visual-story"].replace(
    "npm run test:visual-grammar &&",
    "npm run test:visual-grammar && npm run test:visual-grammar-stage-shells &&",
  );
}
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

const workflowPath = ".github/workflows/visual-grammar-renderer-contract.yml";
let workflow = await readFile(workflowPath, "utf8");
workflow = replaceOnce(
  workflow,
  `      - "src/spec/visual-grammar-contract.ts"\n`,
  `      - "src/spec/visual-grammar-contract.ts"\n      - "src/components/spec/VisualGrammarStageHost.tsx"\n      - "src/components/spec/stages/**"\n      - "src/components/spec/VisualTemplateRenderer.tsx"\n      - "src/components/spec/AdditionalVisualTemplates.tsx"\n      - "src/components/spec/FinancialVisualTemplates.tsx"\n      - "src/components/spec/SpecVisualModes.tsx"\n`,
  "Stage Shell workflow paths",
);
workflow = replaceOnce(
  workflow,
  `      - name: Typecheck\n`,
  `      - name: Run Stage Shell contract tests\n        run: npm run test:visual-grammar-stage-shells\n      - name: Typecheck\n`,
  "Stage Shell workflow step",
);
await writeFile(workflowPath, workflow, "utf8");

console.log("VG-3 Stage Shell integration applied");
