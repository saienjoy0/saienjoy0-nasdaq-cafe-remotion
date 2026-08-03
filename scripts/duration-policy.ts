export const STANDARD_DURATION_MIN_MS = 480_000;
export const STANDARD_DURATION_MAX_MS = 540_000;

export type DurationPolicyCommand = "compile" | "preview" | "final";

export type DurationContractWarning = {
  code: "duration-contract-warning";
  path: "$.episode.durationMode";
  declaredDurationMode: "standard";
  suggestedDurationMode: "shortened" | "review-required";
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

export const evaluateDurationContract = ({
  command,
  durationMode,
  measuredDurationMs,
  isFixture,
}: EvaluateDurationContractInput): DurationContractWarning[] => {
  if (
    isFixture ||
    durationMode !== "standard" ||
    (measuredDurationMs >= STANDARD_DURATION_MIN_MS &&
      measuredDurationMs <= STANDARD_DURATION_MAX_MS)
  ) {
    return [];
  }

  const message =
    `$.episode.durationMode: standard episode requires measured Charon audio of ` +
    `${STANDARD_DURATION_MIN_MS}-${STANDARD_DURATION_MAX_MS}ms; got ${measuredDurationMs}ms`;

  if (command === "final") {
    throw new Error(message);
  }

  return [
    {
      code: "duration-contract-warning",
      path: "$.episode.durationMode",
      declaredDurationMode: "standard",
      suggestedDurationMode:
        measuredDurationMs < STANDARD_DURATION_MIN_MS
          ? "shortened"
          : "review-required",
      measuredDurationMs,
      expectedMinMs: STANDARD_DURATION_MIN_MS,
      expectedMaxMs: STANDARD_DURATION_MAX_MS,
      message,
    },
  ];
};
