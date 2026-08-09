import {createHash} from "node:crypto";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {prepareHandoffIntake, HandoffIntakeError} from "./handoff-intake";

const sha = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const canonical = (value: unknown): string => {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, normalize(child)]),
      );
    }
    return input;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
};

const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};

const makeBundle = async (root: string, assetId = "daily-vsu-test", assetBytes = Buffer.from("png-fixture")) => {
  const date = "2026-08-06";
  const rendererCommit = "8ab75eeff60885a3e53870065a6e21d08f2e5965";
  const files = [
    {
      role: "render_spec",
      source_path: `render-specs/${date}/render_spec.json`,
      destination_path: `render-specs/${date}/render_spec.json`,
      bytes: Buffer.from("{}\n"),
    },
    {
      role: "asset",
      source_path: `daily-assets/${assetId}.png`,
      destination_path: `assets/${assetId}/${assetId}.png`,
      bytes: assetBytes,
    },
  ];
  const core = {
    contract_version: "1.0.0",
    episode_date: date,
    mode: "preview",
    plot_creator: {repository: "saienjoy0/nasdaq-plot-creator-", commit: "a".repeat(40)},
    renderer: {
      repository: "saienjoy0/saienjoy0-nasdaq-cafe-remotion",
      expected_contract_version: "2.4.0",
      expected_base_commit: rendererCommit,
    },
    files: files.map((item) => ({
      role: item.role,
      source_path: item.source_path,
      destination_path: item.destination_path,
      sha256: sha(item.bytes),
      size: item.bytes.length,
      required: true,
    })),
    validation: {production_package: "pass", unresolved_states: 0, source_preflight_sha256: "b".repeat(64)},
    final_authorized: false,
    approval_record: null,
  };
  const bundleId = sha(canonical(core));
  const bundle = path.join(root, bundleId);
  for (const item of files) {
    const target = path.join(bundle, item.destination_path);
    await mkdir(path.dirname(target), {recursive: true});
    await writeFile(target, item.bytes);
  }
  const manifest = {contract_version: core.contract_version, bundle_id: bundleId, ...Object.fromEntries(Object.entries(core).filter(([key]) => key !== "contract_version"))};
  const manifestPath = path.join(bundle, "handoff_manifest.json");
  await writeFile(manifestPath, canonical(manifest));
  return {
    date,
    rendererCommit,
    bundle,
    bundleId,
    manifestPath,
    manifestSha: sha(await readFile(manifestPath)),
  };
};

const main = async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "nasdaq-cafe-handoff-intake-"));
  try {
    const download = path.join(temp, "download");
    const fixture = await makeBundle(download);
    const registry = path.join(temp, "build", "runtime_asset_registry.json");
    const publicRoot = path.join(temp, "public");
    const result = await prepareHandoffIntake({
      downloadRoot: download,
      expectedBundleId: fixture.bundleId,
      expectedManifestSha256: fixture.manifestSha,
      expectedEpisodeDate: fixture.date,
      expectedRendererCommit: fixture.rendererCommit,
      expectedRendererContractVersion: "2.4.0",
      publicRoot,
      registryOutput: registry,
    });
    assert(result.status === "pass", "valid handoff should pass");
    assert(result.stagedAssetCount === 1, "daily asset should be staged");
    const registryDoc = JSON.parse(await readFile(registry, "utf8")) as {assets: Array<{assetId: string; source: string}>};
    assert(registryDoc.assets.some((item) => item.assetId === "daily-vsu-test" && item.source === "handoff"), "registry should contain daily asset");

    let tamperFailed = false;
    try {
      await prepareHandoffIntake({
        downloadRoot: download,
        expectedBundleId: fixture.bundleId,
        expectedManifestSha256: "f".repeat(64),
        expectedEpisodeDate: fixture.date,
        expectedRendererCommit: fixture.rendererCommit,
        expectedRendererContractVersion: "2.4.0",
        publicRoot,
        registryOutput: path.join(temp, "bad.json"),
      });
    } catch (error) {
      tamperFailed = error instanceof HandoffIntakeError && error.message.includes("manifest SHA mismatch");
    }
    assert(tamperFailed, "manifest SHA tampering must fail closed");

    console.log("handoff intake tests passed");
  } finally {
    await rm(temp, {recursive: true, force: true});
  }
};

await main();
