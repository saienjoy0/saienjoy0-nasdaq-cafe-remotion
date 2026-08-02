import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sourceRegisterJson from "../config/person-source-register.json";
import remainingAssetsJson from "../data/remaining-assets.json";
import {productionAssetManifest} from "../src/config/production-assets";
import {personPresentations} from "../src/remaining-assets/person-presentations";
import type {RemainingAsset} from "../src/remaining-assets/types";
import {resolveReusableEntityCues} from "../src/config/reusable-entity-cues";

const root = process.cwd();
const assets = remainingAssetsJson as RemainingAsset[];
const sourceRegister = sourceRegisterJson as Array<{
  asset_id: string;
  role: string;
  organization: string;
  role_verified_at: string;
  role_source_url: string;
  source_status: string;
}>;
const expectedCounts = {person: 25, person_role: 3, concept: 37, background: 14};
const typeDir = {person: "people", person_role: "roles", concept: "concepts", background: "backgrounds"} as const;

assert.equal(assets.length, 79, "残り素材は79件");
assert.equal(new Set(assets.map((asset) => asset.asset_id)).size, 79, "asset_idは重複しない");
assert.equal(new Set(assets.map((asset) => asset.output_filename)).size, 79, "ファイル名は重複しない");
for (const [type, expected] of Object.entries(expectedCounts)) {
  assert.equal(assets.filter((asset) => asset.asset_type === type).length, expected, `${type}件数`);
}

for (const asset of assets) {
  const filePath = path.join(
    root,
    "public",
    "assets",
    "nasdaq-cafe",
    "remaining",
    typeDir[asset.asset_type],
    asset.output_filename,
  );
  assert.ok(fs.existsSync(filePath), `生成済み: ${asset.asset_id}`);
  const png = fs.readFileSync(filePath);
  assert.equal(png.toString("ascii", 1, 4), "PNG", `${asset.asset_id}はPNG`);
  assert.equal(png.readUInt32BE(16), 1536, `${asset.asset_id}の幅`);
  assert.equal(png.readUInt32BE(20), 864, `${asset.asset_id}の高さ`);
  assert.ok(asset.asset_id in productionAssetManifest.assets, `render_specに登録: ${asset.asset_id}`);
}

const people = assets.filter((asset) => asset.asset_type === "person");
const roles = assets.filter((asset) => asset.asset_type === "person_role");
assert.equal(people.filter((asset) => personPresentations[asset.asset_id]?.sourceStatus === "official-photo").length, 1);
assert.equal(people.filter((asset) => personPresentations[asset.asset_id]?.sourceStatus === "official-photo-pending").length, 24);
assert.equal(roles.filter((asset) => personPresentations[asset.asset_id]?.sourceStatus === "institution-card").length, 3);
assert.equal(sourceRegister.length, 28, "人物・役職の出典記録は28件");
for (const record of sourceRegister) {
  assert.ok(record.role, `${record.asset_id}のrole`);
  assert.ok(record.organization, `${record.asset_id}のorganization`);
  assert.equal(record.role_verified_at, "2026-07-29", `${record.asset_id}の役職確認日`);
  assert.match(record.role_source_url, /^https:\/\//, `${record.asset_id}の公式URL`);
}

const cueInput = {
  captions: [],
  previousNarrations: [],
  durationMs: 10_000,
};
const personCues = resolveReusableEntityCues({
  ...cueInput,
  narrationText: "Christopher Waller（ウォラー）FRB理事の発言を確認します。",
});
assert.equal(personCues.filter((cue) => cue.entity.key === "remaining:person_christopher_waller").length, 1);
const repeatedPersonCues = resolveReusableEntityCues({
  ...cueInput,
  narrationText: "ウォラーの見方をもう一度確認します。",
  previousNarrations: ["Christopher Waller（ウォラー）FRB理事の発言を確認します。"],
});
assert.equal(repeatedPersonCues.filter((cue) => cue.entity.key === "remaining:person_christopher_waller").length, 0);

const conceptCues = resolveReusableEntityCues({
  ...cueInput,
  narrationText: "期待・実際・差を見ると、好決算でも反応が変わります。",
});
assert.ok(conceptCues.some((cue) => cue.entity.key === "remaining:concept_expected_actual_gap"));

console.log("remaining-assets tests passed: 79 assets, V2 cues, render_spec registry");
