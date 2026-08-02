import {readFile} from "node:fs/promises";
import {loadEpisode, resolveInputPath} from "./load-episode";
import {loadEpisodeV1} from "./load-episode-v1";
import {loadEpisodeFinal} from "./load-episode-final";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error(
    "入力JSONのパスが必要です。例: npm run validate:episode -- /path/to/episode_data.json",
  );
}

const resolved = resolveInputPath(inputPath);
const raw = JSON.parse(await readFile(resolved, "utf8")) as {
  schemaVersion?: string;
};

if (raw.schemaVersion === "1.1.0") {
  const episode = await loadEpisodeFinal(inputPath);
  console.log(`VALID FINAL: ${resolved}`);
  console.log(`schemaVersion: ${episode.schemaVersion}`);
  console.log(`episode.id: ${episode.episode.id}`);
  console.log(`scenes: ${episode.scenes.length}`);
  console.log(`frames: ${episode.timeline.totalDurationInFrames}`);
  console.log(`voice: ${episode.tts.characterName} / ${episode.tts.styleName} / ${episode.tts.styleId}`);
} else if (raw.schemaVersion === "1.0.0") {
  const episode = await loadEpisodeV1(inputPath);
  console.log(`VALID: ${resolved}`);
  console.log(`schemaVersion: ${episode.schemaVersion}`);
  console.log(`episode.id: ${episode.episode.id}`);
  console.log(`scenes: ${episode.scenes.length}`);
  console.log(`frames: ${episode.timeline.totalDurationInFrames}`);
  console.log(`source sha256: ${episode.source.packageSha256}`);
} else {
  const episode = await loadEpisode(inputPath);
  console.log(`VALID: ${resolved}`);
  console.log(`schemaVersion: ${episode.schemaVersion}`);
  console.log(`episode.id: ${episode.episode.id}`);
  console.log(`market items: ${episode.marketReaction.items.length}`);
  console.log(`tickers: ${episode.tickers.length}`);
  console.log(`watch points: ${episode.watchPoints.length}`);
}
