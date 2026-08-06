import {readFile, writeFile} from "node:fs/promises";

const replaceOnce = (source, before, after, label) => {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`missing patch anchor: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`ambiguous patch anchor: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const replaceFirst = (source, before, after, label) => {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`missing patch anchor: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const cliPath = "scripts/spec-cli.ts";
let cli = await readFile(cliPath, "utf8");

if (!cli.includes('from "node:crypto"')) {
  cli = replaceOnce(
    cli,
    'import {mkdir, readFile, writeFile} from "node:fs/promises";\n',
    'import {createHash} from "node:crypto";\nimport {mkdir, readFile, writeFile} from "node:fs/promises";\n',
    "crypto import",
  );
}
if (!cli.includes('from "../src/spec/measure-visual-grammar"')) {
  cli = replaceOnce(
    cli,
    'import {getTransitionDurationInFrames} from "../src/spec/render-state";\n',
    'import {getTransitionDurationInFrames} from "../src/spec/render-state";\nimport {measureVisualGrammarTiming} from "../src/spec/measure-visual-grammar";\n',
    "timing measurement import",
  );
}
if (!cli.includes("visual_grammar_timing_report.json")) {
  cli = replaceOnce(
    cli,
    'const technicalPath = (id: string) => path.join(workspaceFor(id), "technical_report.json");\n',
    'const technicalPath = (id: string) => path.join(workspaceFor(id), "technical_report.json");\nconst visualGrammarTimingPath = (id: string) =>\n  path.join(workspaceFor(id), "visual_grammar_timing_report.json");\n',
    "timing report path",
  );
}

const writeProductionAnchor = '  await writeFile(output, `${JSON.stringify(data, null, 2)}\\n`, "utf8");\n';
if (!cli.includes("const visualGrammarTimingReport = measureVisualGrammarTiming")) {
  cli = replaceFirst(
    cli,
    writeProductionAnchor,
    writeProductionAnchor + `  const visualGrammarTimingReport = measureVisualGrammarTiming(spec, data);
  const visualGrammarTimingReportPath = visualGrammarTimingReport
    ? visualGrammarTimingPath(spec.episode.id)
    : null;
  let visualGrammarTimingReportSha256: string | null = null;
  if (visualGrammarTimingReport && visualGrammarTimingReportPath) {
    const timingJson = \`${'${JSON.stringify(visualGrammarTimingReport, null, 2)}'}\\n\`;
    await writeFile(visualGrammarTimingReportPath, timingJson, "utf8");
    visualGrammarTimingReportSha256 = createHash("sha256").update(timingJson).digest("hex");
  }
`,
    "timing report generation",
  );
}

cli = cli.replace(
  '    status: "compiled",\n',
  '    status: visualGrammarTimingReport?.status === "FAIL" ? "compile-blocked" : "compiled",\n',
);
if (!cli.includes("visualGrammarTiming: visualGrammarTimingReport")) {
  cli = replaceOnce(
    cli,
    '    transitionOverlaps: overlaps,\n',
    `    transitionOverlaps: overlaps,
    visualGrammarTiming: visualGrammarTimingReport
      ? {
          status: visualGrammarTimingReport.status,
          path: visualGrammarTimingReportPath,
          sha256: visualGrammarTimingReportSha256,
          timingBasis: visualGrammarTimingReport.timingBasis,
          fallbackDiversityRecheck: visualGrammarTimingReport.fallbackDiversityRecheck,
          selectedFallbackBeatIds: visualGrammarTimingReport.selectedFallbackBeatIds,
          unresolvedStateCount: visualGrammarTimingReport.unresolvedStateCount,
          failureCodes: visualGrammarTimingReport.failures.map((failure) => failure.code),
        }
      : null,
`,
    "technical timing summary",
  );
}
cli = cli.replace(
  '    errors: [],\n',
  '    errors: visualGrammarTimingReport?.failures ?? [],\n',
);
if (!cli.includes("Visual Grammar measured diversity gate failed")) {
  cli = replaceOnce(
    cli,
    '  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\\n`, "utf8");\n  return {spec, data, output, reportPath};\n',
    `  await writeFile(reportPath, \`${'${JSON.stringify(report, null, 2)}'}\\n\`, "utf8");
  if (visualGrammarTimingReport?.status === "FAIL") {
    throw new Error(
      \`Visual Grammar measured diversity gate failed: \${visualGrammarTimingReport.failures
        .map((failure) => failure.code)
        .join(", ")}\`,
    );
  }
  return {
    spec,
    data,
    output,
    reportPath,
    visualGrammarTimingReportPath,
    visualGrammarTimingReportSha256,
  };
`,
    "compile stop after diagnostic reports",
  );
}
await writeFile(cliPath, cli, "utf8");

const packagePath = "package.json";
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts["test:visual-grammar-timing"] =
  "tsx scripts/test-visual-grammar-timing.ts";
if (!packageJson.scripts["test:visual-story"].includes("test:visual-grammar-timing")) {
  packageJson.scripts["test:visual-story"] = packageJson.scripts["test:visual-story"].replace(
    "npm run test:visual-grammar-motion &&",
    "npm run test:visual-grammar-motion && npm run test:visual-grammar-timing &&",
  );
}
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

console.log("VG-5 compile and measured timing integration applied");
