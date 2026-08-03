import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const PACIFIC_TIME_ZONE = "America/Los_Angeles";
const DEFAULT_SUCCESS_COOLDOWN_MS = 25_000;
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 30_000;
const RATE_LIMIT_GUARD_MS = 5_000;
const DEFAULT_MAX_ATTEMPTS = 12;
const DEFAULT_MAX_ELAPSED_MS = 12 * 60_000;

type KeyState = {
  slot: number;
  cooldownUntil: number;
  dailyBlockedUntil: number;
  authBlockedUntil: number;
};

type PersistedState = {
  version: 1;
  keyCount: number;
  cursor: number;
  keys: KeyState[];
};

export type GeminiQuotaKind = "daily" | "rate" | "auth" | "other";
export type GeminiKeyPoolLimits = {
  maxAttempts?: number;
  maxElapsedMs?: number;
};

const positiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const collectGeminiApiKeys = (
  environment: NodeJS.ProcessEnv = process.env,
) => {
  const candidates: string[] = [];
  for (let index = 1; index <= 10; index++) {
    candidates.push(environment[`GEMINI_API_KEY_${index}`] ?? "");
  }
  candidates.push(
    ...(environment.GEMINI_API_KEYS ?? "")
      .split(/[,\n]/)
      .map((value) => value.trim()),
  );
  candidates.push(environment.GEMINI_API_KEY ?? "");
  return candidates
    .map((value) => value.trim())
    .filter((value, index, values) => value && values.indexOf(value) === index);
};

const errorText = (error: unknown) => {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const errorStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }
  const value = Number((error as {status?: unknown}).status);
  return Number.isFinite(value) ? value : null;
};

export const classifyGeminiQuotaError = (
  error: unknown,
): GeminiQuotaKind => {
  const status = errorStatus(error);
  const message = errorText(error).toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    /api key not valid|invalid api key|permission_denied|unauthenticated/.test(
      message,
    )
  ) {
    return "auth";
  }
  if (status !== 429 && !message.includes("429")) return "other";
  if (
    /per.?day|requests.?per.?day|daily|generate_content_free_tier_requests/.test(
      message,
    ) &&
    !/per.?minute|requests.?per.?minute/.test(message)
  ) {
    return "daily";
  }
  return "rate";
};

export const retryDelayMsFromGeminiError = (error: unknown) => {
  const message = errorText(error);
  const secondsMatch =
    message.match(/retry(?:\s+in\s+|delay[^0-9]*)([0-9.]+)s/i) ??
    message.match(/"retryDelay"\s*:\s*"([0-9.]+)s"/i);
  const requested = secondsMatch
    ? Math.ceil(Number(secondsMatch[1]) * 1000)
    : DEFAULT_RATE_LIMIT_COOLDOWN_MS;
  return Math.max(
    DEFAULT_SUCCESS_COOLDOWN_MS,
    requested + RATE_LIMIT_GUARD_MS,
  );
};

const pacificParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

export const nextPacificMidnight = (now = new Date()) => {
  const current = pacificParts(now);
  const nextCalendarDay = new Date(
    Date.UTC(current.year, current.month - 1, current.day + 1),
  );
  const target = {
    year: nextCalendarDay.getUTCFullYear(),
    month: nextCalendarDay.getUTCMonth() + 1,
    day: nextCalendarDay.getUTCDate(),
  };
  const guess = Date.UTC(target.year, target.month - 1, target.day, 8);
  for (let offsetMinutes = -180; offsetMinutes <= 180; offsetMinutes++) {
    const candidate = new Date(guess + offsetMinutes * 60_000);
    const parts = pacificParts(candidate);
    if (
      parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === 0 &&
      parts.minute === 0 &&
      parts.second === 0
    ) {
      return candidate;
    }
  }
  throw new Error("Unable to resolve the next Pacific midnight");
};

const freshState = (keyCount: number): PersistedState => ({
  version: 1,
  keyCount,
  cursor: 0,
  keys: Array.from({length: keyCount}, (_, slot) => ({
    slot,
    cooldownUntil: 0,
    dailyBlockedUntil: 0,
    authBlockedUntil: 0,
  })),
});

export class GeminiApiKeyPool {
  private state: PersistedState | null = null;
  private readonly maxAttempts: number;
  private readonly maxElapsedMs: number;

  public constructor(
    private readonly keys = collectGeminiApiKeys(),
    private readonly statePath = path.resolve(
      process.cwd(),
      ".cache",
      "gemini-api-key-pool-state.json",
    ),
    private readonly now = () => new Date(),
    private readonly wait = (milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
    limits: GeminiKeyPoolLimits = {},
  ) {
    if (keys.length === 0) {
      throw new Error("Gemini APIキーが設定されていません");
    }
    this.maxAttempts = positiveInteger(
      limits.maxAttempts ?? process.env.GEMINI_KEY_POOL_MAX_ATTEMPTS,
      DEFAULT_MAX_ATTEMPTS,
    );
    this.maxElapsedMs = positiveInteger(
      limits.maxElapsedMs ?? process.env.GEMINI_KEY_POOL_MAX_ELAPSED_MS,
      DEFAULT_MAX_ELAPSED_MS,
    );
  }

  private async load() {
    if (this.state) return this.state;
    if (process.env.GEMINI_KEY_POOL_RESET === "1") {
      this.state = freshState(this.keys.length);
      return this.state;
    }
    try {
      const parsed = JSON.parse(
        await readFile(this.statePath, "utf8"),
      ) as PersistedState;
      if (
        parsed.version !== 1 ||
        parsed.keyCount !== this.keys.length ||
        parsed.keys.length !== this.keys.length
      ) {
        this.state = freshState(this.keys.length);
      } else {
        this.state = parsed;
      }
    } catch {
      this.state = freshState(this.keys.length);
    }
    return this.state;
  }

  private async save() {
    if (!this.state) return;
    await mkdir(path.dirname(this.statePath), {recursive: true});
    await writeFile(
      this.statePath,
      `${JSON.stringify(this.state, null, 2)}\n`,
      "utf8",
    );
  }

  private nextReady(state: PersistedState, nowMs: number) {
    for (let offset = 0; offset < this.keys.length; offset++) {
      const slot = (state.cursor + offset) % this.keys.length;
      const keyState = state.keys[slot];
      if (
        keyState.cooldownUntil <= nowMs &&
        keyState.dailyBlockedUntil <= nowMs &&
        keyState.authBlockedUntil <= nowMs
      ) {
        state.cursor = (slot + 1) % this.keys.length;
        return keyState;
      }
    }
    return null;
  }

  public async run<T>(operation: (apiKey: string) => Promise<T>): Promise<T> {
    const state = await this.load();
    const startedAt = this.now().getTime();
    let attempts = 0;

    const assertRetryBudget = (additionalWaitMs = 0) => {
      const elapsedMs = Math.max(0, this.now().getTime() - startedAt);
      if (
        attempts >= this.maxAttempts ||
        elapsedMs + additionalWaitMs > this.maxElapsedMs
      ) {
        throw new Error(
          `GEMINI_RETRY_BUDGET_EXHAUSTED attempts=${attempts} elapsed_ms=${elapsedMs} max_attempts=${this.maxAttempts} max_elapsed_ms=${this.maxElapsedMs}`,
        );
      }
    };

    while (true) {
      const now = this.now();
      const nowMs = now.getTime();
      const ready = this.nextReady(state, nowMs);
      if (!ready) {
        const dailyOrAuthBlocked = state.keys.every(
          (item) =>
            item.dailyBlockedUntil > nowMs || item.authBlockedUntil > nowMs,
        );
        if (dailyOrAuthBlocked) {
          const nextAvailable = Math.min(
            ...state.keys.map((item) =>
              Math.max(item.dailyBlockedUntil, item.authBlockedUntil),
            ),
          );
          throw new Error(
            `GEMINI_ALL_PROJECTS_DAILY_EXHAUSTED next_available=${new Date(nextAvailable).toISOString()}`,
          );
        }
        const nextCooldown = Math.min(
          ...state.keys
            .filter(
              (item) =>
                item.dailyBlockedUntil <= nowMs &&
                item.authBlockedUntil <= nowMs,
            )
            .map((item) => item.cooldownUntil),
        );
        const waitMs = Math.max(250, nextCooldown - nowMs);
        assertRetryBudget(waitMs);
        await this.wait(waitMs);
        continue;
      }

      assertRetryBudget();
      attempts += 1;
      try {
        const result = await operation(this.keys[ready.slot]);
        ready.cooldownUntil =
          this.now().getTime() + DEFAULT_SUCCESS_COOLDOWN_MS;
        await this.save();
        return result;
      } catch (error) {
        const kind = classifyGeminiQuotaError(error);
        if (kind === "daily") {
          ready.dailyBlockedUntil = nextPacificMidnight(this.now()).getTime();
          ready.cooldownUntil = 0;
        } else if (kind === "rate") {
          ready.cooldownUntil =
            this.now().getTime() + retryDelayMsFromGeminiError(error);
        } else if (kind === "auth") {
          ready.authBlockedUntil = nextPacificMidnight(this.now()).getTime();
          ready.cooldownUntil = 0;
        } else {
          throw error;
        }
        await this.save();
      }
    }
  }
}
