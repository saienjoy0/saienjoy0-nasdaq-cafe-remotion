import {writeFile} from "node:fs/promises";
import path from "node:path";
import {personPresentations} from "../src/remaining-assets/person-presentations";

const roleVerifiedAt = "2026-07-29";
const records = Object.entries(personPresentations).map(([assetId, item]) => ({
  asset_id: assetId,
  role: item.role,
  organization: item.organization,
  role_verified_at: roleVerifiedAt,
  role_source_url: item.sourcePage,
  portrait_source_url:
    item.sourceStatus === "official-photo" ? item.sourcePage : null,
  source_status: item.sourceStatus,
  replacement_reason:
    item.sourceStatus === "institution-card"
      ? "特定の現職者に依存しない機関カードへ置換"
      : item.sourceStatus === "official-photo-pending"
        ? "公式写真を取得できる接続経路がないため、別人を代用せず汎用カードへフォールバック"
        : null,
}));

const target = path.join(process.cwd(), "config", "person-source-register.json");
await writeFile(target, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Generated ${records.length} source records: ${target}`);
