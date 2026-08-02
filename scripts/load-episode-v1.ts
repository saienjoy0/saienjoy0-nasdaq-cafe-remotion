import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ZodError} from "zod";
import {episodeV1Schema, type EpisodeV1} from "../src/schemas/episode-v1";
import {resolveInputPath} from "./load-episode";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) => {
      const location = issue.path.length ? issue.path.join(".") : "root";
      return `  - ${location}: ${issue.message}`;
    })
    .join("\n");

export const loadEpisodeV1 = async (inputPath: string): Promise<EpisodeV1> => {
  const resolved = resolveInputPath(inputPath);
  const raw = await readFile(resolved, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `JSONの構文が不正です: ${resolved}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const result = episodeV1Schema.safeParse(json);
  if (!result.success) {
    throw new Error(
      `正式episode_data.jsonの検証に失敗しました: ${resolved}\n${formatZodError(result.error)}`,
    );
  }
  const packagePath = path.resolve(PROJECT_DIR, result.data.source.packagePath);
  let packageBytes: Buffer;
  try {
    packageBytes = await readFile(packagePath);
  } catch (error) {
    throw new Error(
      `元Markdownを読み込めません: ${packagePath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const packageSha256 = createHash("sha256").update(packageBytes).digest("hex");
  if (packageSha256 !== result.data.source.packageSha256) {
    throw new Error(
      `元MarkdownのSHA-256がJSONと一致しません: ${packagePath}`,
    );
  }
  return result.data;
};
