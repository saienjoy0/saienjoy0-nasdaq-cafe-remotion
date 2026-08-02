import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {parseEpisodePackage} from "../src/parser/episode-package";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = process.argv[2];

if (!inputPath) {
  throw new Error(
    "制作パッケージのパスが必要です。例: npm run prepare:episode -- episodes/2026-07-10/episode_package_2026-07-10.md",
  );
}

const resolvedPath = path.isAbsolute(inputPath)
  ? inputPath
  : path.resolve(process.cwd(), inputPath);
const raw = await readFile(resolvedPath);
const markdown = raw.toString("utf8");
const packageSha256 = createHash("sha256").update(raw).digest("hex");
const relativePath = path
  .relative(PROJECT_DIR, resolvedPath)
  .split(path.sep)
  .join("/");
const generatedAt = new Date().toISOString();
const dateFromName = path.basename(resolvedPath).match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "unknown";

try {
  const {episodeData, report} = parseEpisodePackage(markdown, {
    packagePath: relativePath,
    packageSha256,
    generatedAt,
  });
  if (dateFromName !== episodeData.episode.date) {
    throw new Error(
      `ファイル名の日付${dateFromName}と本文の日付${episodeData.episode.date}が一致しません`,
    );
  }
  const outputDirectory = path.join(PROJECT_DIR, "build", episodeData.episode.date);
  await mkdir(outputDirectory, {recursive: true});
  const episodeOutput = path.join(outputDirectory, "episode_data.json");
  const reportOutput = path.join(outputDirectory, "conversion-report.json");
  await Promise.all([
    writeFile(episodeOutput, `${JSON.stringify(episodeData, null, 2)}\n`, "utf8"),
    writeFile(reportOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);
  console.log(`生成: ${episodeOutput}`);
  console.log(`変換レポート: ${reportOutput}`);
  report.warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
} catch (error) {
  const outputDirectory = path.join(PROJECT_DIR, "build", dateFromName);
  await mkdir(outputDirectory, {recursive: true});
  const reportOutput = path.join(outputDirectory, "conversion-report.json");
  const message = error instanceof Error ? error.message : String(error);
  await writeFile(
    reportOutput,
    `${JSON.stringify(
      {
        status: "error",
        converterVersion: "1.0.0",
        generatedAt,
        source: {packagePath: relativePath, packageSha256},
        extracted: null,
        fallbacks: [],
        warnings: [],
        errors: [message],
        unmappedSections: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  throw new Error(`制作パッケージ変換に失敗しました: ${message}\nレポート: ${reportOutput}`);
}
