import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

try {
  os.networkInterfaces();
} catch {
  os.networkInterfaces = () => ({
    loopback: [
      {
        address: "127.0.0.1",
        netmask: "255.0.0.0",
        family: "IPv4",
        mac: "00:00:00:00:00:00",
        internal: true,
        cidr: "127.0.0.1/8",
      },
    ],
  });
}

const {bundle} = await import("@remotion/bundler");
const {renderStill, selectComposition} = await import("@remotion/renderer");

const root = process.cwd();
const entryPoint = path.join(root, "src", "stock-cards", "index.ts");
const cardsPath = path.join(root, "data", "stock-cards.json");
const outputDir = path.join(root, "public", "assets", "nasdaq-cafe", "stock-cards");
const manifestPath = path.join(outputDir, "render-manifest.json");
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;

await fs.mkdir(outputDir, {recursive: true});
const cards = JSON.parse(await fs.readFile(cardsPath, "utf8"));
const tickersArgument = process.argv.find((argument) =>
  argument.startsWith("--tickers="),
);
const requestedTickers = tickersArgument
  ? new Set(
      tickersArgument
        .slice("--tickers=".length)
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean),
    )
  : null;
const renderTargets = cards
  .map((card, index) => ({card, index}))
  .filter(({card}) => !requestedTickers || requestedTickers.has(card.ticker.toUpperCase()));

const serveUrl = await bundle({
  entryPoint,
  webpackOverride: (config) => config,
});

const safeName = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

let existingResults = [];
try {
  existingResults = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch {
  existingResults = [];
}
const resultsByTicker = new Map(
  existingResults.map((result) => [result.ticker, result]),
);

for (const [targetIndex, {card, index}] of renderTargets.entries()) {
  const filename = `${String(index + 1).padStart(3, "0")}_${safeName(card.ticker)}.png`;
  const output = path.join(outputDir, filename);

  try {
    const logoSvg = await fs.readFile(
      path.join(root, "public", card.logoFile),
      "utf8",
    );
    const brandColor =
      logoSvg.match(/data-brand-color="(#[0-9A-Fa-f]{6})"/)?.[1] ?? "#76B900";
    const inputProps = {
      companyName: card.companyName,
      ticker: card.ticker,
      description: card.description,
      logoFile: card.logoFile,
      brandColor,
    };
    const composition = await selectComposition({
      serveUrl,
      id: "StockPopupCard",
      inputProps,
      browserExecutable,
    });

    await renderStill({
      composition,
      serveUrl,
      output,
      inputProps,
      imageFormat: "png",
      browserExecutable,
    });

    resultsByTicker.set(card.ticker, {
      ...card,
      brandColor,
      filename,
      status: "rendered",
    });
    console.log(`${targetIndex + 1}/${renderTargets.length} rendered: ${filename}`);
  } catch (error) {
    resultsByTicker.set(card.ticker, {
      ...card,
      filename,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(
      `${targetIndex + 1}/${renderTargets.length} failed: ${card.companyName}`,
    );
  }
}

const results = cards.map((card, index) => {
  const filename = `${String(index + 1).padStart(3, "0")}_${safeName(card.ticker)}.png`;
  return (
    resultsByTicker.get(card.ticker) ?? {
      ...card,
      filename,
      status: "not-rendered",
    }
  );
});

await fs.writeFile(
  manifestPath,
  JSON.stringify(results, null, 2),
  "utf8",
);

const success = results.filter((r) => r.status === "rendered").length;
console.log(
  `Completed: ${renderTargets.length} updated, ${success}/${results.length} cards rendered.`,
);
