import registryJson from "../../config/reusable-entity-assets.json";
import {buildRemainingAssetEntities} from "./remaining-asset-entities";
import {buildStockCardEntities} from "./stock-card-entities";

export type ReusableEntity = {
  key: string;
  kind: "ticker-card" | "official-portrait" | "person-card" | "concept-card";
  aliases: string[];
  displayName: string;
  role: string;
  assetPath: string;
  accent: string;
  maxDurationSec: number;
  credit?: string;
};

export type TimedText = {
  text: string;
  startMs: number;
  endMs: number;
};

export type ReusableEntityCue = {
  entity: ReusableEntity;
  startMs: number;
  endMs: number;
};

const registryEntities = registryJson.entities as ReusableEntity[];
const entityPriority: Record<ReusableEntity["kind"], number> = {
  "ticker-card": 1,
  "concept-card": 2,
  "official-portrait": 3,
  "person-card": 4,
};

export const reusableEntities = [
  ...buildStockCardEntities(registryEntities),
  ...buildRemainingAssetEntities(),
];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const containsEntityAlias = (text: string, entity: ReusableEntity) =>
  entity.aliases.some((alias) => {
    const escaped = escapeRegExp(alias);
    const asciiTicker = /^[A-Z0-9]{1,6}(?:\.[A-Z]{1,3})?$/.test(alias);
    const pattern = asciiTicker
      ? new RegExp(`(^|[^A-Za-z0-9])${escaped}($|[^A-Za-z0-9])`, "i")
      : new RegExp(escaped, "i");
    return pattern.test(text);
  });

const estimateMentionMs = (
  narrationText: string,
  entity: ReusableEntity,
  durationMs: number,
) => {
  const lower = narrationText.toLocaleLowerCase();
  const indices = entity.aliases
    .map((alias) => lower.indexOf(alias.toLocaleLowerCase()))
    .filter((index) => index >= 0);
  const index = indices.length > 0 ? Math.min(...indices) : 0;
  return Math.round((index / Math.max(1, narrationText.length)) * durationMs);
};

export const resolveReusableEntityCues = ({
  narrationText,
  captions,
  previousNarrations,
  durationMs,
}: {
  narrationText: string;
  captions: TimedText[];
  previousNarrations: string[];
  durationMs: number;
}): ReusableEntityCue[] => {
  // Validator-only: callers may report omissions, but must never use these
  // inferred intervals to render a production card.
  const previouslySpoken = previousNarrations.join("\n");
  return reusableEntities
    .filter(
      (entity) =>
        containsEntityAlias(narrationText, entity) &&
        !containsEntityAlias(previouslySpoken, entity),
    )
    .map((entity) => {
      const caption = captions.find((item) =>
        containsEntityAlias(item.text, entity),
      );
      const startMs = caption
        ? caption.startMs
        : estimateMentionMs(narrationText, entity, durationMs);
      return {
        entity,
        startMs,
        endMs: Math.min(durationMs, startMs + entity.maxDurationSec * 1000),
      };
    })
    .sort(
      (a, b) =>
        a.startMs - b.startMs ||
        entityPriority[a.entity.kind] - entityPriority[b.entity.kind],
    );
};
