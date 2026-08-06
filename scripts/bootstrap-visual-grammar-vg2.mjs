import {readFile, writeFile} from "node:fs/promises";

const replaceOnce = (source, before, after, label) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`missing patch anchor: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`ambiguous patch anchor: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
};

const renderSpecPath = "src/spec/render-spec.ts";
let renderSpec = await readFile(renderSpecPath, "utf8");

renderSpec = replaceOnce(
  renderSpec,
  `import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_VARIANT_IDS,
} from "./visual-template-contract";
`,
  `import {
  VISUAL_TEMPLATE_IDS,
  VISUAL_TEMPLATE_VARIANT_IDS,
} from "./visual-template-contract";
import {
  transitionRoleSchema,
  visualGrammarIdSchema,
  visualGrammarRootContractSchema,
} from "./visual-grammar-contract";
`,
  "render-spec Visual Grammar import",
);

renderSpec = replaceOnce(
  renderSpec,
  `  visualTemplate: visualTemplateSchema,
  templateVariant: visualTemplateVariantSchema.optional(),
`,
  `  visualTemplate: visualTemplateSchema,
  visualGrammarId: visualGrammarIdSchema.optional(),
  transitionRole: transitionRoleSchema.optional(),
  templateVariant: visualTemplateVariantSchema.optional(),
`,
  "Visual Beat grammar fields",
);

renderSpec = replaceOnce(
  renderSpec,
  `  schemaVersion: z.union([z.literal("2.2.0"), z.literal("2.3.0")]),
  financialVisualContract: financialVisualRootContractSchema.optional(),
`,
  `  schemaVersion: z.union([
    z.literal("2.2.0"),
    z.literal("2.3.0"),
    z.literal("2.4.0"),
  ]),
  financialVisualContract: financialVisualRootContractSchema.optional(),
  visualGrammarContract: visualGrammarRootContractSchema.optional(),
`,
  "render_spec 2.4 root",
);

const visualGrammarRefinement = `
  const visualGrammarBeats = spec.scenes.flatMap((scene, sceneIndex) =>
    scene.visualBeats.map((beat, beatIndex) => ({sceneIndex, beatIndex, beat})),
  );
  if (spec.schemaVersion === "2.4.0") {
    if (spec.visualGrammarContract === undefined) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract"],
        message: "render_spec 2.4.0 requires visualGrammarContract",
      });
    } else if (spec.visualGrammarContract.beatCount !== visualGrammarBeats.length) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract", "beatCount"],
        message: \`beatCount must equal Visual Beat count \${visualGrammarBeats.length}\`,
      });
    }
    visualGrammarBeats.forEach(({sceneIndex, beatIndex, beat}) => {
      const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
      if (beat.visualGrammarId === undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "visualGrammarId"],
          message: "render_spec 2.4.0 requires visualGrammarId",
        });
      }
      if (beat.transitionRole === undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "transitionRole"],
          message: "render_spec 2.4.0 requires transitionRole",
        });
      }
    });
  } else {
    if (spec.visualGrammarContract !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["visualGrammarContract"],
        message: \`render_spec \${spec.schemaVersion} must not contain visualGrammarContract\`,
      });
    }
    visualGrammarBeats.forEach(({sceneIndex, beatIndex, beat}) => {
      const path = ["scenes", sceneIndex, "visualBeats", beatIndex] as const;
      if (beat.visualGrammarId !== undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "visualGrammarId"],
          message: \`render_spec \${spec.schemaVersion} must not contain visualGrammarId\`,
        });
      }
      if (beat.transitionRole !== undefined) {
        context.addIssue({
          code: "custom",
          path: [...path, "transitionRole"],
          message: \`render_spec \${spec.schemaVersion} must not contain transitionRole\`,
        });
      }
    });
  }
`;

const endAnchor = "\n});\n\nexport type RenderSpec = z.infer<typeof renderSpecSchema>;";
const endIndex = renderSpec.lastIndexOf(endAnchor);
if (endIndex < 0) throw new Error("missing render-spec final refinement anchor");
renderSpec =
  renderSpec.slice(0, endIndex) +
  visualGrammarRefinement +
  renderSpec.slice(endIndex);

await writeFile(renderSpecPath, renderSpec, "utf8");

const visualStoryPath = "src/spec/validate-visual-story.ts";
let visualStory = await readFile(visualStoryPath, "utf8");
visualStory = replaceOnce(
  visualStory,
  `import {VISUAL_TEMPLATE_CONTRACTS} from "./visual-template-contract";
`,
  `import {VISUAL_TEMPLATE_CONTRACTS} from "./visual-template-contract";
import {validateVisualGrammarContract} from "./validate-visual-grammar";
`,
  "visual story validator import",
);
visualStory = replaceOnce(
  visualStory,
  `) => {
  const families: string[] = [];
`,
  `) => {
  validateVisualGrammarContract(spec);
  const families: string[] = [];
`,
  "visual story validator invocation",
);
await writeFile(visualStoryPath, visualStory, "utf8");

const generatorPath = "scripts/generate-render-spec-schema.ts";
let generator = await readFile(generatorPath, "utf8");
generator = replaceOnce(
  generator,
  `title: "NASDAQ Cafe render_spec 2.3.0",`,
  `title: "NASDAQ Cafe render_spec 2.4.0",`,
  "schema title",
);
await writeFile(generatorPath, generator, "utf8");

const packagePath = "package.json";
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts["test:visual-grammar"] =
  "tsx scripts/test-visual-grammar-contract.ts";
if (!packageJson.scripts["test:visual-story"].includes("test:visual-grammar")) {
  packageJson.scripts["test:visual-story"] =
    "npm run test:visual-grammar && " + packageJson.scripts["test:visual-story"];
}
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

console.log("VG-2 source patches applied");
