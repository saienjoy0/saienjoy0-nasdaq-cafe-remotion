import {mkdir, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {getCompositions, type BrowserLog} from "@remotion/renderer";
import type {EpisodeData} from "../src/schemas/episode";
import {COMPOSITION_ID} from "../src/config";
import {COMPOSITION_ID_V2} from "../src/config";
import {loadEpisode, resolveInputPath} from "./load-episode";
import {loadEpisodeV1} from "./load-episode-v1";
import {loadEpisodeFinal} from "./load-episode-final";

export const PROJECT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export const safeEpisodeId = (id: string) =>
  id.replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-");

export const prepareRender = async (inputPath: string) => {
  const episode = await loadEpisode(inputPath);
  const inputProps = {episode};
  const entryPoint = path.join(PROJECT_DIR, "src", "index.ts");

  console.log(`入力検証: OK (${episode.episode.id})`);
  console.log("Remotion bundleを作成中...");
  const serveUrl = await bundle({entryPoint});
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find(
    (candidate) => candidate.id === COMPOSITION_ID,
  );

  if (!composition) {
    throw new Error(
      `Composition ${COMPOSITION_ID} が見つかりません。検出: ${compositions.map((item) => item.id).join(", ")}`,
    );
  }

  return {episode, inputProps, serveUrl, composition, compositions};
};

export const prepareV1Render = async (inputPath: string) => {
  const raw = JSON.parse(await readFile(resolveInputPath(inputPath), "utf8")) as {schemaVersion?: string};
  const episode =
    raw.schemaVersion === "1.1.0"
      ? await loadEpisodeFinal(inputPath)
      : await loadEpisodeV1(inputPath);
  const inputProps = {episode};
  const entryPoint = path.join(PROJECT_DIR, "src", "index.ts");

  console.log(`正式入力検証: OK (${episode.episode.id} / 9Scene)`);
  console.log("Remotion bundleを作成中...");
  const serveUrl = await bundle({entryPoint});
  const compositions = await getCompositions(serveUrl, {inputProps});
  const composition = compositions.find(
    (candidate) => candidate.id === COMPOSITION_ID_V2,
  );
  if (!composition) {
    throw new Error(
      `Composition ${COMPOSITION_ID_V2} が見つかりません。検出: ${compositions.map((item) => item.id).join(", ")}`,
    );
  }
  return {episode, inputProps, serveUrl, composition, compositions};
};

export const ensureDirectory = async (directory: string) => {
  await mkdir(directory, {recursive: true});
};

export const createBrowserLogMonitor = () => {
  const issues: BrowserLog[] = [];

  return {
    onBrowserLog: (log: BrowserLog) => {
      if (log.type === "error" || log.type === "warning") {
        issues.push(log);
      }
    },
    assertClean: () => {
      if (issues.length > 0) {
        throw new Error(
          `ブラウザconsoleで警告・エラーを検出しました:\n${issues
            .map((issue) => `  - [${issue.type}] ${issue.text}`)
            .join("\n")}`,
        );
      }
      console.log("ブラウザconsole: warning/error 0件");
    },
  };
};

export const printRenderSummary = (episode: EpisodeData, output: string) => {
  console.log(`出力: ${output}`);
  console.log("仕様: 1920x1080 / 30fps / 45.0秒 / H.264 MP4");
  console.log(`タイトル: ${episode.episode.title}`);
};
