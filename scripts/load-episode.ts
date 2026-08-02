import {readFile} from "node:fs/promises";
import path from "node:path";
import {ZodError} from "zod";
import {
  episodeDataSchema,
  type EpisodeData,
} from "../src/schemas/episode";

export const resolveInputPath = (inputPath: string) =>
  path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);

const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) => {
      const location = issue.path.length ? issue.path.join(".") : "root";
      return `  - ${location}: ${issue.message}`;
    })
    .join("\n");

export const loadEpisode = async (inputPath: string): Promise<EpisodeData> => {
  const resolved = resolveInputPath(inputPath);
  let raw: string;

  try {
    raw = await readFile(resolved, "utf8");
  } catch (error) {
    throw new Error(
      `入力JSONを読み込めません: ${resolved}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `JSONの構文が不正です: ${resolved}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const result = episodeDataSchema.safeParse(json);
  if (!result.success) {
    throw new Error(
      `episode_data.jsonの検証に失敗しました: ${resolved}\n${formatZodError(result.error)}`,
    );
  }

  return result.data;
};
