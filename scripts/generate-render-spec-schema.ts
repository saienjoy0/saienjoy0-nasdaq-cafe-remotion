import {writeFile} from "node:fs/promises";
import path from "node:path";
import {z} from "zod";
import {renderSpecSchema} from "../src/spec/render-spec";
import {PROJECT_DIR} from "./render-helpers";

const generated = z.toJSONSchema(renderSpecSchema, {
  target: "draft-2020-12",
  io: "input",
});
const schema = {
  ...generated,
  $id: "schemas/render_spec.schema.json",
  title: "NASDAQ Cafe render_spec 2.4.0",
  description: "Generated from src/spec/render-spec.ts. Do not edit by hand.",
};
const output = path.join(PROJECT_DIR, "schemas", "render_spec.schema.json");
await writeFile(output, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
console.log(`generated: ${output}`);
