/**
 * Standalone narrator generator for the bench-nine-kicks episode.
 * This does NOT change or call the Nasdaq Cafe render-spec TTS pipeline.
 * Credentials come only from GitHub Actions secrets / local environment.
 */
import {createHash} from "node:crypto";
import {mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {GoogleGenAI} from "@google/genai";
import {
  collectGeminiApiKeys,
  GeminiApiKeyPool,
} from "../../src/tts/providers/gemini-api-key-pool";
import {pcm16ToWav} from "../../src/tts/providers/gemini-tts-provider";

type VoiceLine = {id: string; text: string; subtitle: string};
type VoiceInput = {
  title: string;
  voice: {voice_name: string; style: string};
  lines: VoiceLine[];
};
const INPUT = path.resolve("tools/bench9-tts/voice_request.json");
const OUT = path.resolve("build/bench9-tts/voice");
const STATE = path.resolve("build/bench9-tts/gemini-key-pool-state.json");
const STATUS = path.resolve("build/bench9-tts/status.json");
const MODEL = "gemini-3.8-flash-tts";
const VOICE = "Charon";

async function isValidWav(file: string) {
  try {
    if ((await stat(file)).size < 44) return false;
    const bytes = await readFile(file);
    return bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WAVE";
  } catch {
    return false;
  }
}

function validate(source: unknown): VoiceInput {
  if (!source || typeof source !== "object") throw new Error("invalid voice JSON");
  const item = source as VoiceInput;
  if (item.voice?.voice_name !== VOICE ||
      !Array.isArray(item.lines) || item.lines.length === 0) {
    throw new Error("voice is not Charon, or lines array is empty");
  }
  const seen = new Set<string>();
  for (const line of item.lines) {
    if (!line || typeof line.id !== "string" ||
        !/^[a-z][a-z0-9_-]{1,20}$/.test(line.id) ||
        typeof line.text !== "string" || !line.text.trim() ||
        seen.has(line.id)) {
      throw new Error("invalid or duplicate line id/text");
    }
    seen.add(line.id);
  }
  return item;
}

async function createAudio(apiKey: string, text: string, style: string) {
  const client = new GoogleGenAI({apiKey});
  const response = await client.interactions.create({
    model: MODEL,
    input: [{
      type: "user_input",
      content: [{
        type: "text",
        text,
        annotations: [{type: "speech_metadata", style}],
      }],
    }],
    response_format: {type: "audio"},
    generation_config: {speech_config: [{voice: VOICE}]},
    store: false,
  });
  if (!response.output_audio?.data) throw new Error("Gemini returned no audio");
  const data = Buffer.from(response.output_audio.data, "base64");
  if (data.length < 2) throw new Error("Gemini returned empty audio");
  return data.toString("ascii", 0, 4) === "RIFF"
    ? data
    : pcm16ToWav(
        data,
        response.output_audio.sample_rate ?? 24_000,
        response.output_audio.channels ?? 1,
      );
}

const main = async () => {
  const value = validate(JSON.parse(await readFile(INPUT, "utf8")));
  const keys = collectGeminiApiKeys();
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY_1..3 secrets available");
  const maxNew = Number.parseInt(process.env.BENCH9_MAX_NEW ?? "105", 10);
  if (!Number.isSafeInteger(maxNew) || maxNew < 1 || maxNew > 105) {
    throw new Error("BENCH9_MAX_NEW must be 1..105");
  }
  const requestHash = createHash("sha256")
    .update(await readFile(INPUT)).digest("hex");
  await mkdir(OUT, {recursive: true});
  const pool = new GeminiApiKeyPool(keys, STATE);
  const generated: string[] = [];
  let halted: string | null = null;
  for (const line of value.lines) {
    const file = path.join(OUT, line.id + ".wav");
    if (await isValidWav(file)) continue;
    if (generated.length >= maxNew) {
      halted = "BATCH_LIMIT";
      break;
    }
    process.stdout.write("Generating " + line.id + ".wav ... ");
    try {
      // Pass JSON text verbatim. <short pause> and <long pause> are inline cues,
      // not spoken words; do not alter text or subtitle.
      const audio = await pool.run(async (key) =>
        createAudio(key, line.text, value.voice.style));
      const tmp = file + ".tmp";
      await writeFile(tmp, audio);
      await rename(tmp, file);
      if (!(await isValidWav(file))) throw new Error("Output was not a WAV");
      generated.push(line.id);
      console.log("ok");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Never print secret values, provider raw responses or transcript.
      console.log("stopped");
      halted = /GEMINI_ALL_PROJECTS_DAILY_EXHAUSTED/.test(message)
        ? "ALL_KEYS_QUOTA_OR_AUTH_BLOCKED"
        : /GEMINI_RETRY_BUDGET_EXHAUSTED/.test(message)
          ? "RETRY_BUDGET_EXHAUSTED"
          : "TTS_ERROR";
      break;
    }
  }
  const completed: string[] = [];
  for (const line of value.lines) {
    if (await isValidWav(path.join(OUT, line.id + ".wav"))) completed.push(line.id);
  }
  const status = {
    title: value.title,
    inputSha256: requestHash,
    model: MODEL,
    voice: VOICE,
    total: value.lines.length,
    complete: completed.length,
    missing: value.lines.filter((l) => !completed.includes(l.id)).map((l) => l.id),
    generatedThisRun: generated,
    halted,
    destination: "public/voice/<id>.wav",
    manifestNote: "Run npm run voice:manifest inside ep001-remotion after extracting WAVs.",
  };
  await writeFile(STATUS, JSON.stringify(status, null, 2) + "\n");
  console.log("Result: " + completed.length + "/" + value.lines.length +
    " WAV files, status=" + (halted ?? "COMPLETE"));
  if (completed.length !== value.lines.length) process.exitCode = 1;
};

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("Bench9 TTS preflight failed:", msg.replace(/AIza[0-9A-Za-z_-]{20,}/g, "[REDACTED]"));
  process.exitCode = 1;
});