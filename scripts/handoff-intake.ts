import {createHash} from "node:crypto";
import {copyFile, mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {productionAssetManifest} from "../src/config/production-assets";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(HERE, "..");
const safeRelative = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/\-]+$/;
const safeAssetId = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const sha256Pattern = /^[0-9a-f]{64}$/;

type HandoffFile = {
  role: string;
  source_path: string;
  destination_path: string;
  sha256: string;
  size: number;
  required: boolean;
};

type HandoffManifest = {
  contract_version: string;
  bundle_id: string;
  episode_date: string;
  mode: "preview" | "final";
  plot_creator: {repository: string; commit: string};
  renderer: {
    repository: string;
    expected_contract_version: string;
    expected_base_commit: string;
  };
  files: HandoffFile[];
  validation: {production_package: string; unresolved_states: number};
  final_authorized: boolean;
  approval_record: unknown;
};

type RuntimeEntry = {
  assetId: string;
  path: string;
  sha256: string | null;
  source: "static" | "handoff";
};

export class HandoffIntakeError extends Error {}

const sha256Bytes = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");

const sha256File = async (file: string) => sha256Bytes(await readFile(file));

const canonical = (value: unknown): string => {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      );
    }
    return input;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
};

const safeJoin = (root: string, relative: string, label: string) => {
  if (!safeRelative.test(relative)) {
    throw new HandoffIntakeError(`${label}: unsafe relative path: ${relative}`);
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relative);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new HandoffIntakeError(`${label}: path escapes root: ${relative}`);
  }
  return resolved;
};

const loadManifest = async (manifestPath: string): Promise<HandoffManifest> => {
  const raw = JSON.parse(await readFile(manifestPath, "utf8")) as HandoffManifest;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new HandoffIntakeError("handoff manifest root must be an object");
  }
  if (raw.contract_version !== "1.0.0") {
    throw new HandoffIntakeError("handoff contract_version must be 1.0.0");
  }
  if (!sha256Pattern.test(raw.bundle_id)) {
    throw new HandoffIntakeError("handoff bundle_id must be a SHA-256");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.episode_date)) {
    throw new HandoffIntakeError("handoff episode_date must be YYYY-MM-DD");
  }
  if (!Array.isArray(raw.files)) {
    throw new HandoffIntakeError("handoff files must be an array");
  }
  return raw;
};

const recomputeBundleId = (manifest: HandoffManifest) => {
  const {bundle_id: _bundleId, ...core} = manifest;
  return sha256Bytes(canonical(core));
};

const findManifest = async (root: string, expectedBundleId: string) => {
  const candidates = [
    path.join(root, "handoff_manifest.json"),
    path.join(root, expectedBundleId, "handoff_manifest.json"),
  ];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Continue to deterministic recursive layouts below.
    }
  }
  const {readdir} = await import("node:fs/promises");
  const queue = [path.resolve(root)];
  const matches: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(child);
      else if (entry.isFile() && entry.name === "handoff_manifest.json") matches.push(child);
    }
  }
  const exact: string[] = [];
  for (const candidate of matches) {
    const manifest = await loadManifest(candidate);
    if (manifest.bundle_id === expectedBundleId) exact.push(candidate);
  }
  if (exact.length !== 1) {
    throw new HandoffIntakeError(
      `expected exactly one handoff manifest for bundle ${expectedBundleId}; found=${exact.length}`,
    );
  }
  return exact[0];
};

const staticSha = async (assetId: string) => {
  const staticAsset = productionAssetManifest.assets[
    assetId as keyof typeof productionAssetManifest.assets
  ] as {path: string} | undefined;
  if (!staticAsset) return null;
  const source = path.join(PROJECT_DIR, "public", staticAsset.path);
  try {
    return {path: staticAsset.path, sha256: await sha256File(source)};
  } catch (error) {
    throw new HandoffIntakeError(
      `static asset collision cannot be verified for ${assetId}: ${String(error)}`,
    );
  }
};

export const prepareHandoffIntake = async ({
  downloadRoot,
  expectedBundleId,
  expectedManifestSha256,
  expectedEpisodeDate,
  expectedRendererCommit,
  expectedRendererContractVersion,
  publicRoot = path.join(PROJECT_DIR, "public"),
  registryOutput,
}: {
  downloadRoot: string;
  expectedBundleId: string;
  expectedManifestSha256: string;
  expectedEpisodeDate: string;
  expectedRendererCommit: string;
  expectedRendererContractVersion: string;
  publicRoot?: string;
  registryOutput: string;
}) => {
  if (!sha256Pattern.test(expectedBundleId)) {
    throw new HandoffIntakeError("expectedBundleId must be a SHA-256");
  }
  if (!sha256Pattern.test(expectedManifestSha256)) {
    throw new HandoffIntakeError("expectedManifestSha256 must be a SHA-256");
  }
  const manifestPath = await findManifest(downloadRoot, expectedBundleId);
  const bundleRoot = path.dirname(manifestPath);
  const manifestBytes = await readFile(manifestPath);
  const manifestSha = sha256Bytes(manifestBytes);
  if (manifestSha !== expectedManifestSha256) {
    throw new HandoffIntakeError(
      `handoff manifest SHA mismatch: expected=${expectedManifestSha256} actual=${manifestSha}`,
    );
  }
  const manifest = await loadManifest(manifestPath);
  if (manifest.bundle_id !== expectedBundleId) {
    throw new HandoffIntakeError("handoff bundle_id does not match workflow input");
  }
  const recomputed = recomputeBundleId(manifest);
  if (recomputed !== expectedBundleId) {
    throw new HandoffIntakeError(
      `handoff bundle core SHA mismatch: expected=${expectedBundleId} actual=${recomputed}`,
    );
  }
  if (manifest.episode_date !== expectedEpisodeDate) {
    throw new HandoffIntakeError("handoff episode_date mismatch");
  }
  if (manifest.mode !== "preview" || manifest.final_authorized) {
    throw new HandoffIntakeError("handoff intake accepts preview-only, non-final-authorized bundles");
  }
  if (manifest.validation?.production_package !== "pass" || manifest.validation?.unresolved_states !== 0) {
    throw new HandoffIntakeError("handoff validation must pass with zero unresolved states");
  }
  if (manifest.renderer?.expected_base_commit !== expectedRendererCommit) {
    throw new HandoffIntakeError("handoff renderer commit mismatch");
  }
  if (manifest.renderer?.expected_contract_version !== expectedRendererContractVersion) {
    throw new HandoffIntakeError("handoff renderer contract mismatch");
  }

  const destinations = new Set<string>();
  const runtimeEntries: RuntimeEntry[] = [];
  let specPath: string | null = null;
  for (const [index, item] of manifest.files.entries()) {
    if (!item || typeof item !== "object") {
      throw new HandoffIntakeError(`handoff files[${index}] must be an object`);
    }
    if (!safeRelative.test(item.destination_path) || !safeRelative.test(item.source_path)) {
      throw new HandoffIntakeError(`handoff files[${index}] contains an unsafe path`);
    }
    if (destinations.has(item.destination_path)) {
      throw new HandoffIntakeError(`duplicate handoff destination: ${item.destination_path}`);
    }
    destinations.add(item.destination_path);
    if (!sha256Pattern.test(item.sha256)) {
      throw new HandoffIntakeError(`handoff files[${index}].sha256 is invalid`);
    }
    if (!Number.isInteger(item.size) || item.size < 0) {
      throw new HandoffIntakeError(`handoff files[${index}].size is invalid`);
    }
    const source = safeJoin(bundleRoot, item.destination_path, `handoff files[${index}]`);
    const fileStat = await stat(source).catch(() => null);
    if (!fileStat?.isFile()) {
      throw new HandoffIntakeError(`handoff file missing: ${item.destination_path}`);
    }
    if (fileStat.size !== item.size) {
      throw new HandoffIntakeError(`handoff file size mismatch: ${item.destination_path}`);
    }
    const actualSha = await sha256File(source);
    if (actualSha !== item.sha256) {
      throw new HandoffIntakeError(`handoff file SHA mismatch: ${item.destination_path}`);
    }

    if (item.role === "render_spec") {
      specPath = source;
    }
    if (item.role !== "asset") continue;
    const parts = item.destination_path.split("/");
    if (parts.length < 3 || parts[0] !== "assets") {
      throw new HandoffIntakeError(`asset destination must be assets/<assetId>/<file>: ${item.destination_path}`);
    }
    const assetId = parts[1];
    if (!safeAssetId.test(assetId)) {
      throw new HandoffIntakeError(`invalid assetId in handoff destination: ${assetId}`);
    }
    const collision = await staticSha(assetId);
    if (collision) {
      if (collision.sha256 !== actualSha) {
        throw new HandoffIntakeError(`E_ASSET_ID_COLLISION: ${assetId}`);
      }
      runtimeEntries.push({assetId, path: collision.path, sha256: actualSha, source: "static"});
      continue;
    }
    const extension = path.extname(parts.at(-1) ?? "").toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
      throw new HandoffIntakeError(`unsupported daily image format for ${assetId}: ${extension}`);
    }
    const publicRelative = path.posix.join(
      "generated",
      "handoff-assets",
      expectedBundleId,
      assetId,
      path.basename(source),
    );
    const destination = safeJoin(publicRoot, publicRelative, `runtime asset ${assetId}`);
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(source, destination);
    if ((await sha256File(destination)) !== actualSha) {
      throw new HandoffIntakeError(`staged runtime asset SHA mismatch: ${assetId}`);
    }
    runtimeEntries.push({assetId, path: publicRelative, sha256: actualSha, source: "handoff"});
  }
  if (!specPath) {
    throw new HandoffIntakeError("handoff manifest does not contain render_spec role");
  }

  const registry = {
    contractVersion: "1.0.0",
    bundleId: expectedBundleId,
    episodeDate: expectedEpisodeDate,
    assets: runtimeEntries.sort((left, right) => left.assetId.localeCompare(right.assetId)),
  };
  await mkdir(path.dirname(registryOutput), {recursive: true});
  await writeFile(registryOutput, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  return {
    status: "pass" as const,
    manifestPath,
    manifestSha256: manifestSha,
    bundleId: expectedBundleId,
    specPath,
    runtimeRegistryPath: registryOutput,
    stagedAssetCount: runtimeEntries.filter((item) => item.source === "handoff").length,
    reusedStaticAssetCount: runtimeEntries.filter((item) => item.source === "static").length,
  };
};

const main = async () => {
  const args = Object.fromEntries(
    process.argv.slice(2).map((item) => {
      const split = item.indexOf("=");
      if (split <= 2 || !item.startsWith("--")) {
        throw new HandoffIntakeError("handoff-intake arguments must use --name=value");
      }
      return [item.slice(2, split), item.slice(split + 1)];
    }),
  );
  const required = [
    "download-root",
    "expected-bundle-id",
    "expected-manifest-sha256",
    "episode-date",
    "renderer-commit",
    "renderer-contract-version",
    "registry-output",
  ];
  for (const key of required) {
    if (!args[key]) throw new HandoffIntakeError(`missing --${key}`);
  }
  const result = await prepareHandoffIntake({
    downloadRoot: args["download-root"],
    expectedBundleId: args["expected-bundle-id"],
    expectedManifestSha256: args["expected-manifest-sha256"],
    expectedEpisodeDate: args["episode-date"],
    expectedRendererCommit: args["renderer-commit"],
    expectedRendererContractVersion: args["renderer-contract-version"],
    registryOutput: args["registry-output"],
  });
  console.log(JSON.stringify(result));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
