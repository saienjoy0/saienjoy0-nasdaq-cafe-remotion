import {loadRuntimeAssetContext} from "../src/config/runtime-assets";
import {loadRenderSpecForProduction} from "./load-render-spec";

const input = process.argv[2];
if (!input) throw new Error("usage: validate-runtime-preview-spec <render_spec.json>");

const runtimeAssets = await loadRuntimeAssetContext();
const loaded = await loadRenderSpecForProduction(input, runtimeAssets.manifest);
console.log(
  `runtime render_spec PASS: ${loaded.sha256} bundle=${runtimeAssets.bundleId ?? "static"}`,
);
