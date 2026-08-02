import assert from "node:assert/strict";
import {mkdtemp} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  classifyGeminiQuotaError,
  collectGeminiApiKeys,
  GeminiApiKeyPool,
  nextPacificMidnight,
  retryDelayMsFromGeminiError,
} from "../src/tts/providers/gemini-api-key-pool";

assert.deepEqual(
  collectGeminiApiKeys({
    GEMINI_API_KEY: "legacy-key-value-000000",
    GEMINI_API_KEY_1: "project-one-key-000000",
    GEMINI_API_KEY_2: "project-two-key-000000",
    GEMINI_API_KEY_3: "project-three-key-0000",
  }),
  [
    "project-one-key-000000",
    "project-two-key-000000",
    "project-three-key-0000",
    "legacy-key-value-000000",
  ],
);

assert.equal(
  classifyGeminiQuotaError({
    status: 429,
    message: "generate_content_free_tier_requests PerDay",
  }),
  "daily",
);
assert.equal(
  classifyGeminiQuotaError({status: 429, message: "requests per minute"}),
  "rate",
);
assert.equal(
  classifyGeminiQuotaError({status: 403, message: "API key not valid"}),
  "auth",
);
assert.equal(
  retryDelayMsFromGeminiError(new Error("Please retry in 18.2s")),
  25_000,
);
assert.equal(
  nextPacificMidnight(new Date("2026-07-30T12:00:00Z")).toISOString(),
  "2026-07-31T07:00:00.000Z",
);

const temporary = await mkdtemp(path.join(os.tmpdir(), "gemini-key-pool-"));
let now = new Date("2026-07-30T12:00:00Z");
const pool = new GeminiApiKeyPool(
  ["key-one", "key-two", "key-three"],
  path.join(temporary, "state.json"),
  () => now,
  async (milliseconds) => {
    now = new Date(now.getTime() + milliseconds);
  },
);
const attempted: string[] = [];
const result = await pool.run(async (key) => {
  attempted.push(key);
  if (key === "key-one") {
    throw {
      status: 429,
      message: "generate_content_free_tier_requests PerDay",
    };
  }
  return "ok";
});
assert.equal(result, "ok");
assert.deepEqual(attempted, ["key-one", "key-two"]);

console.log("gemini-api-key-pool tests passed");
