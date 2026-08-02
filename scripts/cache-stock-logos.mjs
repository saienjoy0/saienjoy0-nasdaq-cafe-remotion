import fs from "node:fs/promises";
import path from "node:path";
import * as simpleIcons from "simple-icons";

const root = process.cwd();
const cardsPath = path.join(root, "data", "stock-cards.json");
const outDir = path.join(root, "public", "assets", "nasdaq-cafe", "logos");

await fs.mkdir(outDir, {recursive: true});
const cards = JSON.parse(await fs.readFile(cardsPath, "utf8"));

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const initials = (companyName) =>
  companyName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const fallbackSvg = (companyName, ticker, brandColor) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" data-brand-color="${brandColor}">
  <rect width="800" height="420" rx="60" fill="#151715"/>
  <text x="400" y="205" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="160" font-weight="800"
        fill="${brandColor}">${escapeXml(initials(companyName))}</text>
  <text x="400" y="330" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="700"
        fill="#FFFFFF">${escapeXml(ticker)}</text>
</svg>`;

const iconsBySlug = new Map(
  Object.values(simpleIcons)
    .filter((icon) => icon && typeof icon === "object" && "slug" in icon)
    .map((icon) => [icon.slug, icon]),
);
const fallbackBrandColor = "#76B900";

for (const [index, card] of cards.entries()) {
  const target = path.join(root, "public", card.logoFile);
  await fs.mkdir(path.dirname(target), {recursive: true});

  const icon = card.iconSlug ? iconsBySlug.get(card.iconSlug) : null;
  const brandColor = icon?.hex ? `#${icon.hex}` : fallbackBrandColor;
  const svg = icon
    ? icon.svg.replace(
        "<svg ",
        `<svg fill="${brandColor}" data-brand-color="${brandColor}" `,
      )
    : fallbackSvg(card.companyName, card.ticker, brandColor);

  if (!icon) {
    console.log(`${index + 1}/${cards.length} fallback: ${card.companyName}`);
  } else {
    console.log(`${index + 1}/${cards.length} logo: ${card.companyName}`);
  }

  await fs.writeFile(target, svg, "utf8");
}

console.log(`Saved ${cards.length} logo files to ${outDir}`);
