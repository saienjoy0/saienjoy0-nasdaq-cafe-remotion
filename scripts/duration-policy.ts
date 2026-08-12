export const STANDARD_DURATION_MIN_MS = 180_000;
export const STANDARD_DURATION_MAX_MS = 420_000;
export const SHORTENED_DURATION_MAX_MS = STANDARD_DURATION_MIN_MS - 1;

export type DurationPolicyCommand = "compile" | "preview" | "final";
export type DurationMode = "standard" | "shortened";

export type DurationContractWarning = {
  code: "duration-contract-warning";
  path: "$.episode.durationMode";
  declaredDurationMode: DurationMode;
  suggestedDurationMode: DurationMode | "review-required";
  measuredDurationMs: number;
  expectedMinMs: number;
  expectedMaxMs: number;
  message: string;
};

type EvaluateDurationContractInput = {
  command: DurationPolicyCommand;
  durationMode: string;
  measuredDurationMs: number;
  isFixture: boolean;
};

const failOrWarn = (
  command: DurationPolicyCommand,
  warning: DurationContractWarning,
): DurationContractWarning[] => {
  if (command === "final") {
    throw new Error(warning.message);
  }
  return [warning];
};

export const evaluateDurationContract = ({
  command,
  durationMode,
  measuredDurationMs,
  isFixture,
}: EvaluateDurationContractInput): DurationContractWarning[] => {
  if (isFixture) return [];

  if (durationMode === "standard") {
    if (
      measuredDurationMs >= STANDARD_DURATION_MIN_MS &&
      measuredDurationMs <= STANDARD_DURATION_MAX_MS
    ) {
      return [];
    }
    const suggestedDurationMode =
      measuredDurationMs < STANDARD_DURATION_MIN_MS ? "shortened" : "review-required";
    const message =
      `$.episode.durationMode: standard episode requires measured Charon audio of ` +
      `${STANDARD_DURATION_MIN_MS}-${STANDARD_DURATION_MAX_MS}ms; got ${measuredDurationMs}ms`;
    return failOrWarn(command, {
      code: "duration-contract-warning",
      path: "$.episode.durationMode",
      declaredDurationMode: "standard",
      suggestedDurationMode,
      measuredDurationMs,
      expectedMinMs: STANDARD_DURATION_MIN_MS,
      expectedMaxMs: STANDARD_DURATION_MAX_MS,
      message,
    });
  }

  if (durationMode === "shortened") {
    if (measuredDurationMs <= SHORTENED_DURATION_MAX_MS) return [];
    const message =
      `$.episode.durationMode: shortened episode requires measured Charon audio below ` +
      `${STANDARD_DURATION_MIN_MS}ms; got ${measuredDurationMs}ms`;
    return failOrWarn(command, {
      code: "duration-contract-warning",
      path: "$.episode.durationMode",
      declaredDurationMode: "shortened",
      suggestedDurationMode: "standard",
      measuredDurationMs,
      expectedMinMs: 0,
      expectedMaxMs: SHORTENED_DURATION_MAX_MS,
      message,
    });
  }

  return [];
};
