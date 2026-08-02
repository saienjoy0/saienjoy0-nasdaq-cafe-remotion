import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "data", "remaining-assets.csv");
const target = path.join(root, "data", "remaining-assets.json");

const raw = (await fs.readFile(source, "utf8")).replace(/^\uFEFF/, "");
const [headerLine, ...lines] = raw.trim().split(/\r?\n/);
const headers = headerLine.split(",");
const records = lines.map((line, lineIndex) => {
  const values = line.split(",");
  if (values.length !== headers.length) {
    throw new Error(
      `CSV ${lineIndex + 2}行目: ${values.length}列（期待値${headers.length}列）`,
    );
  }
  return Object.fromEntries(
    headers.map((header, index) => [header, values[index].trim()]),
  );
});

await fs.writeFile(target, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} records: ${target}`);
