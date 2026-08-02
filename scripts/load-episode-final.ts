import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ZodError} from "zod";
import {episodeFinalSchema, type EpisodeFinal} from "../src/schemas/episode-final";
import {resolveInputPath} from "./load-episode";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const formatZodError = (error: ZodError) =>
  error.issues
    .map((issue) => `  - ${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("\n");

export const loadEpisodeFinal = async (inputPath: string): Promise<EpisodeFinal> => {
  const resolved = resolveInputPath(inputPath);
  const json = JSON.parse(await readFile(resolved, "utf8")) as unknown;
  const parsed = episodeFinalSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `episode_data.final.jsonの検証に失敗しました: ${resolved}\n${formatZodError(parsed.error)}`,
    );
  }
  const packagePath = path.resolve(PROJECT_DIR, parsed.data.source.packagePath);
  const packageSha256 = createHash("sha256")
    .update(await readFile(packagePath))
    .digest("hex");
  if (packageSha256 !== parsed.data.source.packageSha256) {
    throw new Error(`元MarkdownのSHA-256がfinal JSONと一致しません: ${packagePath}`);
  }
  const basePath = path.join(path.dirname(resolved), "episode_data.json");
  const baseSha256 = createHash("sha256")
    .update(await readFile(basePath))
    .digest("hex");
  if (baseSha256 !== parsed.data.source.baseEpisodeDataSha256) {
    throw new Error("既存episode_data.jsonのSHA-256がfinal JSONと一致しません");
  }
  return parsed.data;
};
