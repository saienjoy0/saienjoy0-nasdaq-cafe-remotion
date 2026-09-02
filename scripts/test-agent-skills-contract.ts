import {existsSync, readFileSync} from "node:fs";
import path from "node:path";

const root = process.cwd();
const lockPath = path.join(root, "config", "agent-skills.lock.json");
const syncScriptPath = path.join(root, "scripts", "sync-agent-skills.mjs");
const routingPath = path.join(root, "docs", "17_visual_skill_routing.md");

const fail = (message: string): never => {
  throw new Error(`E_AGENT_SKILLS_CONTRACT: ${message}`);
};

if (!existsSync(lockPath)) fail("config/agent-skills.lock.json is missing");
if (!existsSync(syncScriptPath)) fail("scripts/sync-agent-skills.mjs is missing");
if (!existsSync(routingPath)) fail("docs/17_visual_skill_routing.md is missing");

const lock = JSON.parse(readFileSync(lockPath, "utf8")) as {
  schemaVersion?: string;
  skills?: Array<{
    id?: string;
    repository?: string;
    commit?: string;
    sourcePath?: string;
    destination?: string;
    activation?: "auto" | "reference-only";
    license?: string;
  }>;
};

if (lock.schemaVersion !== "1.0.0") fail("lock schemaVersion must be 1.0.0");
if (!Array.isArray(lock.skills) || lock.skills.length !== 4) {
  fail("lock must contain exactly four approved upstream skill sources");
}

const byId = new Map(lock.skills.map((skill) => [skill.id, skill]));
const requiredIds = [
  "ux-audit",
  "visual-cognition-slides",
  "motion-design",
  "remotion-official",
] as const;

for (const id of requiredIds) {
  if (!byId.has(id)) fail(`missing approved skill: ${id}`);
}

for (const skill of lock.skills) {
  if (!skill.repository || !skill.repository.includes("/")) {
    fail(`${skill.id}: repository must be owner/name`);
  }
  if (!skill.commit || !/^[0-9a-f]{40}$/.test(skill.commit)) {
    fail(`${skill.id}: commit must be a pinned 40-hex SHA`);
  }
  if (!skill.destination) fail(`${skill.id}: destination is required`);
  if (!skill.license) fail(`${skill.id}: license metadata is required`);
}

const cognition = byId.get("visual-cognition-slides")!;
if (cognition.activation !== "reference-only") {
  fail("visual-cognition-slides must be reference-only to avoid owning video generation");
}
if (!cognition.destination!.startsWith("third_party/agent-skills/")) {
  fail("visual-cognition-slides must live outside .agents/skills auto-discovery");
}

for (const id of ["ux-audit", "motion-design", "remotion-official"] as const) {
  const skill = byId.get(id)!;
  if (skill.activation !== "auto") fail(`${id} must be auto-discoverable`);
  if (!skill.destination!.startsWith(".agents/skills/")) {
    fail(`${id} must install under .agents/skills`);
  }
}

const routing = readFileSync(routingPath, "utf8");
for (const requiredPhrase of [
  "Protected Semantic Diff",
  "visual-cognition-slides",
  "ux-audit",
  "motion-design",
  "remotion-official",
  "Visual Director",
  "fresh episode",
]) {
  if (!routing.includes(requiredPhrase)) {
    fail(`routing document missing required phrase: ${requiredPhrase}`);
  }
}

console.log("agent skills contract: PASS");
