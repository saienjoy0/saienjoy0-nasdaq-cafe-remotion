import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const root = process.cwd();
const lockPath = path.join(root, "config", "agent-skills.lock.json");
const checkOnly = process.argv.includes("--check");
const commitPattern = /^[0-9a-f]{40}$/;

const fail = (message) => {
  console.error(`E_AGENT_SKILLS_SYNC: ${message}`);
  process.exit(1);
};

const run = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed with exit ${result.status}`);
  }
};

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => {
  mkdirSync(path.dirname(file), {recursive: true});
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

if (!existsSync(lockPath)) fail("config/agent-skills.lock.json is missing");
const lock = readJson(lockPath);
if (lock.schemaVersion !== "1.0.0") fail("unsupported lock schemaVersion");
if (!Array.isArray(lock.skills) || lock.skills.length === 0) fail("lock has no skills");

for (const skill of lock.skills) {
  if (!skill.id) fail("skill id is required");
  if (!skill.repository?.includes("/")) fail(`${skill.id}: invalid repository`);
  if (!commitPattern.test(skill.commit ?? "")) fail(`${skill.id}: commit must be pinned to 40-hex SHA`);
  if (!skill.sourcePath || !skill.destination) fail(`${skill.id}: sourcePath and destination are required`);
  if (!skill.copyMode) fail(`${skill.id}: copyMode is required`);
}

const metadataPathFor = (destination) => path.join(root, destination, ".upstream.json");

const expectedInstalled = (skill) => {
  if (skill.copyMode === "directory") {
    const destination = path.join(root, skill.destination);
    if (!existsSync(destination)) return false;
    const metadataPath = metadataPathFor(skill.destination);
    if (!existsSync(metadataPath)) return false;
    const metadata = readJson(metadataPath);
    return metadata.repository === skill.repository && metadata.commit === skill.commit;
  }

  if (skill.copyMode === "directory-contents") {
    const markerPath = path.join(root, skill.destination, `.managed-${skill.id}.json`);
    if (!existsSync(markerPath)) return false;
    const marker = readJson(markerPath);
    if (marker.repository !== skill.repository || marker.commit !== skill.commit) return false;
    if (!Array.isArray(marker.entries) || marker.entries.length === 0) return false;
    return marker.entries.every((entry) => existsSync(path.join(root, skill.destination, entry)));
  }

  fail(`${skill.id}: unsupported copyMode ${skill.copyMode}`);
};

if (checkOnly) {
  const missing = lock.skills.filter((skill) => !expectedInstalled(skill));
  if (missing.length > 0) {
    fail(`skills not synchronized: ${missing.map((skill) => skill.id).join(", ")}`);
  }
  console.log("agent skills sync check: PASS");
  process.exit(0);
}

const tempRoot = mkdtempSync(path.join(os.tmpdir(), "nasdaq-cafe-agent-skills-"));
const synced = [];

try {
  for (const skill of lock.skills) {
    const checkout = path.join(tempRoot, skill.id);
    mkdirSync(checkout, {recursive: true});
    run("git", ["init", "--quiet"], checkout);
    run("git", ["remote", "add", "origin", `https://github.com/${skill.repository}.git`], checkout);
    run("git", ["fetch", "--quiet", "--depth", "1", "origin", skill.commit], checkout);
    run("git", ["checkout", "--quiet", "--detach", "FETCH_HEAD"], checkout);

    const source = path.resolve(checkout, skill.sourcePath);
    if (!existsSync(source)) fail(`${skill.id}: sourcePath does not exist at pinned commit`);
    const destination = path.resolve(root, skill.destination);

    const copyOptions = {
      recursive: true,
      filter: (entry) => {
        const basename = path.basename(entry);
        return basename !== ".git" && basename !== ".DS_Store" && basename !== "node_modules";
      },
    };

    if (skill.copyMode === "directory") {
      rmSync(destination, {recursive: true, force: true});
      mkdirSync(path.dirname(destination), {recursive: true});
      cpSync(source, destination, copyOptions);

      for (const licenseName of ["LICENSE", "LICENSE.md", "LICENSE.txt"]) {
        const rootLicense = path.join(checkout, licenseName);
        const destinationLicense = path.join(destination, licenseName);
        if (existsSync(rootLicense) && !existsSync(destinationLicense)) {
          cpSync(rootLicense, destinationLicense);
        }
      }

      writeJson(path.join(destination, ".upstream.json"), {
        id: skill.id,
        repository: skill.repository,
        commit: skill.commit,
        sourcePath: skill.sourcePath,
        activation: skill.activation,
        license: skill.license,
      });
    } else if (skill.copyMode === "directory-contents") {
      mkdirSync(destination, {recursive: true});
      const markerPath = path.join(destination, `.managed-${skill.id}.json`);
      if (existsSync(markerPath)) {
        const previous = readJson(markerPath);
        for (const entry of previous.entries ?? []) {
          rmSync(path.join(destination, entry), {recursive: true, force: true});
        }
      }

      const entries = readdirSync(source).filter((entry) => ![".DS_Store", ".git"].includes(entry));
      for (const entry of entries) {
        const from = path.join(source, entry);
        const to = path.join(destination, entry);
        rmSync(to, {recursive: true, force: true});
        cpSync(from, to, copyOptions);
      }
      writeJson(markerPath, {
        id: skill.id,
        repository: skill.repository,
        commit: skill.commit,
        sourcePath: skill.sourcePath,
        activation: skill.activation,
        license: skill.license,
        entries,
      });
    } else {
      fail(`${skill.id}: unsupported copyMode ${skill.copyMode}`);
    }

    synced.push({id: skill.id, repository: skill.repository, commit: skill.commit});
    console.log(`synced ${skill.id} @ ${skill.commit.slice(0, 12)}`);
  }

  writeJson(path.join(root, ".agents", "skills", ".skill-sync.json"), {
    schemaVersion: "1.0.0",
    lockFile: "config/agent-skills.lock.json",
    synced,
  });
  console.log("agent skills sync: PASS");
} finally {
  rmSync(tempRoot, {recursive: true, force: true});
}
