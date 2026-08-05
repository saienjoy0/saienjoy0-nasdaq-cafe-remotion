export type CausalObjectType = "card" | "number" | "node" | "arrow";

export type OrderedCausalVisualEvent = {
  eventIndex: number;
  action: "show" | "hide" | "highlight" | "unhighlight" | "set-expression";
  targetId: string | null;
  motionPreset?: string | null;
};

export type CausalVisualEventIssue = {
  eventIndex: number | null;
  message: string;
};

export const collectCausalVisualEventIssues = (
  events: OrderedCausalVisualEvent[],
  objectType: ReadonlyMap<string, CausalObjectType>,
): CausalVisualEventIssue[] => {
  const issues: CausalVisualEventIssue[] = [];
  const highlighted = new Set<string>();
  let sawHighlight = false;

  for (const event of events) {
    if (event.action === "show" && event.motionPreset === "draw-line") {
      if (!event.targetId || objectType.get(event.targetId) !== "arrow") {
        issues.push({
          eventIndex: event.eventIndex,
          message: "draw-line may only target a causal arrow",
        });
      }
    }

    if (event.action !== "highlight" && event.action !== "unhighlight") continue;
    if (!event.targetId || objectType.get(event.targetId) !== "node") {
      issues.push({
        eventIndex: event.eventIndex,
        message: `${event.action} in causal-build may only target a node`,
      });
      continue;
    }

    if (event.action === "highlight") {
      sawHighlight = true;
      highlighted.add(event.targetId);
      if (highlighted.size > 1) {
        issues.push({
          eventIndex: event.eventIndex,
          message: "causal-build may focus only one node at a time; unhighlight the prior node first",
        });
      }
    } else {
      highlighted.delete(event.targetId);
    }
  }

  if (sawHighlight && highlighted.size > 0) {
    issues.push({
      eventIndex: null,
      message: `causal-build focus must settle before the Beat ends; still highlighted: ${[...highlighted].join(", ")}`,
    });
  }

  return issues;
};
