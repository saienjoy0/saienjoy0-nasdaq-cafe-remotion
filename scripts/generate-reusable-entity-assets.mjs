import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const project = process.cwd();
const config = JSON.parse(
  await readFile(
    path.join(project, "config", "reusable-entity-assets.json"),
    "utf8",
  ),
);
const publicRoot = path.join(project, "public");
const tickerDirectory = path.join(publicRoot, "assets", "entities", "tickers");
await mkdir(tickerDirectory, { recursive: true });

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const generated = [];
for (const entity of config.entities) {
  const absolutePath = path.join(publicRoot, entity.assetPath);
  if (entity.kind === "ticker-card") {
    const ticker = entity.key.split(":")[1].toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#06101d"/>
      <stop offset="1" stop-color="#0b1d34"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="18%" r="70%">
      <stop offset="0" stop-color="${escapeXml(entity.accent)}" stop-opacity=".34"/>
      <stop offset="1" stop-color="${escapeXml(entity.accent)}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="360" rx="26" fill="url(#bg)"/>
  <rect width="640" height="360" rx="26" fill="url(#glow)"/>
  <g opacity=".34" stroke="${escapeXml(entity.accent)}" stroke-width="2" fill="none">
    <path d="M370 72 L470 42 L570 105 L505 178 L604 232"/>
    <path d="M358 278 L450 216 L548 286 L622 252"/>
    <circle cx="470" cy="42" r="7" fill="${escapeXml(entity.accent)}"/>
    <circle cx="570" cy="105" r="7" fill="${escapeXml(entity.accent)}"/>
    <circle cx="505" cy="178" r="7" fill="${escapeXml(entity.accent)}"/>
    <circle cx="450" cy="216" r="7" fill="${escapeXml(entity.accent)}"/>
    <circle cx="548" cy="286" r="7" fill="${escapeXml(entity.accent)}"/>
  </g>
  <rect x="34" y="34" width="126" height="48" rx="24" fill="${escapeXml(entity.accent)}" fill-opacity=".16" stroke="${escapeXml(entity.accent)}"/>
  <text x="97" y="66" text-anchor="middle" fill="${escapeXml(entity.accent)}" font-family="Arial, sans-serif" font-size="24" font-weight="800">${escapeXml(ticker)}</text>
  <text x="36" y="170" fill="#F4FAFF" font-family="Arial, 'Noto Sans JP', sans-serif" font-size="58" font-weight="900">${escapeXml(entity.displayName)}</text>
  <text x="38" y="224" fill="#9BB1C8" font-family="Arial, 'Noto Sans JP', sans-serif" font-size="30" font-weight="700">${escapeXml(entity.role)}</text>
  <rect x="36" y="286" width="318" height="4" rx="2" fill="${escapeXml(entity.accent)}"/>
  <text x="36" y="326" fill="#8AEAFF" font-family="Arial, 'Noto Sans JP', sans-serif" font-size="18" font-weight="700">NASDAQ CAFE / REUSABLE COMPANY VISUAL</text>
</svg>\n`;
    await writeFile(absolutePath, svg, "utf8");
  }

  const bytes = await readFile(absolutePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (entity.expectedSha256 && entity.expectedSha256 !== sha256) {
    throw new Error(
      `${entity.key}: recorded SHA-256 does not match ${entity.assetPath}`,
    );
  }
  await stat(absolutePath);
  generated.push({
    key: entity.key,
    kind: entity.kind,
    aliases: entity.aliases,
    displayName: entity.displayName,
    role: entity.role,
    assetPath: entity.assetPath,
    rightsBasis: entity.rightsBasis,
    sourcePage: entity.sourcePage ?? null,
    rightsEvidenceUrl: entity.rightsEvidenceUrl ?? null,
    credit: entity.credit ?? null,
    identityCheck: entity.identityCheck ?? null,
    styleVersion: entity.kind === "ticker-card" ? config.styleVersion : null,
    sha256,
    width: entity.width ?? 640,
    height: entity.height ?? 360,
    maxDurationSec: entity.maxDurationSec,
    invalidation: entity.invalidation,
  });
}

const manifestPath = path.join(
  publicRoot,
  "assets",
  "entities",
  "reusable-asset-manifest.json",
);
await writeFile(
  manifestPath,
  `${JSON.stringify({ styleVersion: config.styleVersion, entities: generated }, null, 2)}\n`,
  "utf8",
);
console.log(`Generated ${generated.length} reusable entity assets`);
console.log(manifestPath);
