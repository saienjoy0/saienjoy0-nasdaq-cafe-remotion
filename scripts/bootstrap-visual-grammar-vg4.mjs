import {createHash} from "node:crypto";
import {readFile, writeFile} from "node:fs/promises";

const replaceOnce = (source, before, after, label) => {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`missing patch anchor: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`ambiguous patch anchor: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
};

const writeJson = async (path, value) => {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path, text, "utf8");
  return text;
};

const templatePath = "src/spec/visual-template-contract.ts";
let template = await readFile(templatePath, "utf8");
if (!template.includes('  "event-reaction-timeline",')) {
  template = replaceOnce(
    template,
    '  "text-focus",\n] as const;',
    '  "event-reaction-timeline",\n  "text-focus",\n] as const;',
    "timeline template ID",
  );
}
if (!template.includes('  "verified-series",')) {
  template = replaceOnce(
    template,
    '  "pressure-lane",\n] as const;',
    '  "pressure-lane",\n  "verified-series",\n  "reported-sequence",\n  "official-time-plus-close",\n  "close-only",\n] as const;',
    "timeline variants",
  );
}
if (!template.includes('  "event-reaction-timeline":')) {
  template = replaceOnce(
    template,
    '  "text-focus": {family: "text",',
    '  "event-reaction-timeline": {family: "reaction-timeline", supportedScreenStates: ["Data", "Chart"], variants: ["verified-series", "reported-sequence", "official-time-plus-close", "close-only"], cards: range(0, 4), numbers: range(0, 6), nodes: range(0, 0), arrows: range(0, 0), requiresNumericValue: false},\n  "text-focus": {family: "text",',
    "timeline template contract",
  );
}
await writeFile(templatePath, template, "utf8");

const renderSpecPath = "src/spec/render-spec.ts";
let renderSpec = await readFile(renderSpecPath, "utf8");
if (!renderSpec.includes('from "./reaction-timeline-contract"')) {
  renderSpec = replaceOnce(
    renderSpec,
    'import {\n  transitionRoleSchema,\n  visualGrammarIdSchema,\n  visualGrammarRootContractSchema,\n} from "./visual-grammar-contract";\n',
    'import {\n  transitionRoleSchema,\n  visualGrammarIdSchema,\n  visualGrammarRootContractSchema,\n} from "./visual-grammar-contract";\nimport {reactionTimelineConfigSchema} from "./reaction-timeline-contract";\n',
    "reaction timeline schema import",
  );
}
if (!renderSpec.includes('  reactionTimeline: reactionTimelineConfigSchema.optional(),')) {
  renderSpec = replaceOnce(
    renderSpec,
    '  highlightObjectIds: z.array(safeId).max(4).optional(),\n}).strict();',
    '  highlightObjectIds: z.array(safeId).max(4).optional(),\n  reactionTimeline: reactionTimelineConfigSchema.optional(),\n}).strict();',
    "reaction timeline config",
  );
}
await writeFile(renderSpecPath, renderSpec, "utf8");

const compatibilityPath = "contracts/visual_grammar_renderer_compatibility.json";
const compatibility = JSON.parse(await readFile(compatibilityPath, "utf8"));
if (!compatibility.templates.some((entry) => entry.visualTemplateId === "event-reaction-timeline")) {
  const textIndex = compatibility.templates.findIndex((entry) => entry.visualTemplateId === "text-focus");
  const entry = {
    visualTemplateId: "event-reaction-timeline",
    allowedGrammarIds: ["reaction"],
    appearanceClass: "timeline-track",
    dominantSurface: "plot",
    stageShell: "TimelineStage",
    motionLanguage: "timeline-track",
  };
  if (textIndex < 0) compatibility.templates.push(entry);
  else compatibility.templates.splice(textIndex, 0, entry);
}
const compatibilityText = await writeJson(compatibilityPath, compatibility);
const compatibilitySha = createHash("sha256").update(compatibilityText).digest("hex");

const compatibilitySchemaPath = "contracts/visual_grammar_renderer_compatibility.schema.json";
const compatibilitySchema = JSON.parse(await readFile(compatibilitySchemaPath, "utf8"));
compatibilitySchema.properties.templates.minItems = 27;
compatibilitySchema.properties.templates.maxItems = 27;
const templateEnum = compatibilitySchema.$defs.template.properties.visualTemplateId.enum;
if (!templateEnum.includes("event-reaction-timeline")) {
  const index = templateEnum.indexOf("text-focus");
  templateEnum.splice(index < 0 ? templateEnum.length : index, 0, "event-reaction-timeline");
}
const variantEnum = compatibilitySchema.$defs.variantOverride.properties.variant.enum;
for (const variant of ["verified-series", "reported-sequence", "official-time-plus-close", "close-only"]) {
  if (!variantEnum.includes(variant)) variantEnum.push(variant);
}
await writeJson(compatibilitySchemaPath, compatibilitySchema);

const visualGrammarPath = "src/spec/visual-grammar-contract.ts";
let visualGrammar = await readFile(visualGrammarPath, "utf8");
visualGrammar = visualGrammar.replace(
  /export const VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256 =\n  "[a-f0-9]{64}" as const;/,
  `export const VISUAL_GRAMMAR_RENDERER_COMPATIBILITY_SHA256 =\n  "${compatibilitySha}" as const;`,
);
await writeFile(visualGrammarPath, visualGrammar, "utf8");

const rendererPath = "src/components/spec/VisualTemplateRenderer.tsx";
let renderer = await readFile(rendererPath, "utf8");
if (!renderer.includes('from "./EventReactionTimelineTemplate"')) {
  renderer = replaceOnce(
    renderer,
    'import {VisualGrammarStageHost} from "./VisualGrammarStageHost";\n',
    'import {VisualGrammarStageHost} from "./VisualGrammarStageHost";\nimport {EventReactionTimelineTemplate} from "./EventReactionTimelineTemplate";\n',
    "timeline renderer import",
  );
}
if (!renderer.includes('case "event-reaction-timeline"')) {
  renderer = replaceOnce(
    renderer,
    '    case "text-focus":\n      return <SpecVisualMode content={content}/>;',
    '    case "text-focus":\n      return <SpecVisualMode content={content}/>;\n    case "event-reaction-timeline":\n      return <EventReactionTimelineTemplate content={content}/>;',
    "timeline renderer switch",
  );
}
await writeFile(rendererPath, renderer, "utf8");

const motionPath = "src/spec/motion-preset-contract.ts";
let motion = await readFile(motionPath, "utf8");
const motionStart = motion.indexOf("export const DEFAULT_MOTION_DURATION_MS:");
const motionEnd = motion.indexOf("\n};", motionStart);
if (motionStart < 0 || motionEnd < 0) throw new Error("missing motion duration contract");
const motionContract = `export const DEFAULT_MOTION_DURATION_MS: Record<MotionPreset, number> = {
  "fade-soft": 240,
  "slide-soft-left": 400,
  "slide-soft-right": 400,
  "rise-soft": 380,
  "scale-settle": 420,
  "grow-from-baseline": 460,
  "grow-from-center": 460,
  "draw-line": 600,
  "count-up": 460,
  "focus-ring": 300,
  "scale-focus": 360,
  "dim-others": 300,
  "pulse-once": 360,
  "fade-out": 260,
  "slide-out-soft": 360,
  "collapse-to-outcome": 420,
}`;
motion = motion.slice(0, motionStart) + motionContract + motion.slice(motionEnd + 2);
await writeFile(motionPath, motion, "utf8");

const publicPath = "src/spec/public-view-model.ts";
let publicModel = await readFile(publicPath, "utf8");
publicModel = publicModel.replace(
  "const staggerMs = Math.min(900, Math.max(260, beatDurationMs * 0.11));",
  "const staggerMs = Math.min(560, Math.max(200, beatDurationMs * 0.08));",
);
await writeFile(publicPath, publicModel, "utf8");

const stageTestsPath = "scripts/test-visual-grammar-stage-shells.tsx";
let stageTests = await readFile(stageTestsPath, "utf8");
stageTests = stageTests.replace(
  'test("active templates reach at least thirteen physically distinct Stage Shells", () => {',
  'test("active templates reach all fourteen physically distinct Stage Shells", () => {',
).replace(
  '  assert.ok(active.size >= 13, `active Stage Shell count was ${active.size}`);\n  assert.equal(active.has("TimelineStage"), false);',
  '  assert.equal(active.size, 14, `active Stage Shell count was ${active.size}`);\n  assert.equal(active.has("TimelineStage"), true);',
);
await writeFile(stageTestsPath, stageTests, "utf8");

const packagePath = "package.json";
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts["test:event-reaction-timeline"] = "tsx scripts/test-event-reaction-timeline.tsx";
packageJson.scripts["test:visual-grammar-motion"] = "tsx scripts/test-visual-grammar-motion-language.ts";
if (!packageJson.scripts["test:visual-story"].includes("test:event-reaction-timeline")) {
  packageJson.scripts["test:visual-story"] = packageJson.scripts["test:visual-story"].replace(
    "npm run test:visual-grammar-stage-shells &&",
    "npm run test:visual-grammar-stage-shells && npm run test:event-reaction-timeline && npm run test:visual-grammar-motion &&",
  );
}
await writeJson(packagePath, packageJson);

console.log(`VG-4 integration applied; compatibility SHA ${compatibilitySha}`);
