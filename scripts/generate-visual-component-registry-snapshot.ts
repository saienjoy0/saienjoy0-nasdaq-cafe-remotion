import {createHash} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";
import {VISUAL_COMPONENT_REGISTRY} from "../src/spec/visual-component-registry";
import {VISUAL_TEMPLATE_IDS} from "../src/spec/visual-template-contract";

const outputArg = () => {
  const index = process.argv.indexOf("--output");
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : "contracts/visual_component_registry_snapshot.json";
};

export const visualComponentRegistrySnapshot = () => {
  const descriptors = VISUAL_TEMPLATE_IDS.map((id) => structuredClone(VISUAL_COMPONENT_REGISTRY[id]));
  return {
    contractVersion: "1.0.0" as const,
    registryVersion: "1.0.0" as const,
    componentCount: descriptors.length,
    componentIds: descriptors.map((item) => item.id),
    descriptorSnapshotSha256: createHash("sha256")
      .update(JSON.stringify(descriptors))
      .digest("hex"),
  };
};

const output = path.resolve(outputArg());
await mkdir(path.dirname(output), {recursive: true});
await writeFile(output, JSON.stringify(visualComponentRegistrySnapshot(), null, 2) + "\n");
console.log(`generated visual component registry snapshot: ${output}`);
