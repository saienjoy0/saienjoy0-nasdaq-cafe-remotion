import {z} from "zod";
import type {RenderSpec} from "./render-spec";
import {
  evidenceCapabilitySchema,
  sha256Json,
  type EvidenceCapability,
} from "./visual-director-contract";
import {visualGrammarIdSchema} from "./visual-grammar-contract";

const safeId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/);
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
const episodeDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const cardDescriptorSchema = z.object({cardId: safeId}).passthrough();
const numberDescriptorSchema = z.object({numberId: safeId}).passthrough();
const nodeDescriptorSchema = z.object({nodeId: safeId}).passthrough();
const arrowDescriptorSchema = z.object({arrowId: safeId}).passthrough();

const assetDescriptorSchema = z.object({
  placementId: safeId,
  assetId: safeId,
  role: z.string().min(1),
}).strict();

const sourceDescriptorSchema = z.object({sourceId: safeId}).strict();

export const visualCandidateInputBeatSchema = z.object({
  visualBeatId: safeId,
  sceneId: safeId,
  semanticGrammarId: visualGrammarIdSchema,
  narrationChunkIds: z.array(safeId).min(1),
  evidenceSourceIds: z.array(safeId),
  cards: z.array(cardDescriptorSchema),
  numbers: z.array(numberDescriptorSchema),
  nodes: z.array(nodeDescriptorSchema),
  arrows: z.array(arrowDescriptorSchema),
  availableAssetDescriptors: z.array(assetDescriptorSchema),
  sourceDescriptors: z.array(sourceDescriptorSchema),
  primaryFallbackState: z.enum(["unresolved", "primary", "fallback", "not-required"]),
  signals: z.object({
    entityAvailable: z.boolean(),
    pictureBookAvailable: z.boolean(),
    verifiedIntradaySeries: z.boolean(),
  }).strict(),
}).strict();

export const visualCandidateInputSchema = z.object({
  contractVersion: z.literal("1.0.0"),
  episodeDate: episodeDateSchema,
  editorialSnapshotSha256: sha256Schema,
  beats: z.array(visualCandidateInputBeatSchema).min(1),
}).strict();

export const visualCapabilityInventorySchema = z.object({
  contractVersion: z.literal("1.0.0"),
  episodeDate: episodeDateSchema,
  visualCandidateInputSha256: sha256Schema,
  beats: z.array(z.object({
    visualBeatId: safeId,
    capabilities: z.array(evidenceCapabilitySchema).min(1),
  }).strict()).min(1),
}).strict();

export type VisualCandidateInput = z.infer<typeof visualCandidateInputSchema>;
export type VisualCapabilityInventory = z.infer<typeof visualCapabilityInventorySchema>;

type Scene = RenderSpec["scenes"][number];
type Beat = Scene["visualBeats"][number];

const selectedObjects = (scene: Scene, beat: Beat) => {
  const selected = new Set(beat.objectIds);
  return {
    cards: scene.cards.filter((item) => selected.has(item.cardId)),
    numbers: scene.numbers.filter((item) => selected.has(item.numberId)),
    nodes: scene.nodes.filter((item) => selected.has(item.nodeId)),
    arrows: scene.arrows.filter((item) => selected.has(item.arrowId)),
  };
};

const narrationChunkIds = (scene: Scene, beat: Beat) => {
  const start = scene.narrationChunks.findIndex((item) => item.chunkId === beat.startChunkId);
  const end = scene.narrationChunks.findIndex((item) => item.chunkId === beat.endChunkId);
  if (start < 0 || end < start) throw new Error(`${beat.beatId}: invalid narration chunk range`);
  return scene.narrationChunks.slice(start, end + 1).map((item) => item.chunkId);
};

export const buildVisualCandidateInputFromRenderSpec = ({
  spec,
  editorialSnapshotSha256,
}: {
  spec: RenderSpec;
  editorialSnapshotSha256: string;
}): VisualCandidateInput => visualCandidateInputSchema.parse({
  contractVersion: "1.0.0",
  episodeDate: spec.episode.targetDate,
  editorialSnapshotSha256,
  beats: spec.scenes.flatMap((scene, sceneIndex) => scene.visualBeats.map((beat) => {
    if (!beat.visualGrammarId) throw new Error(`${beat.beatId}: visualGrammarId is required for VisualCandidateInput`);
    const objects = selectedObjects(scene, beat);
    const availableAssets = scene.assetPlacements.map((placement) => ({
      placementId: placement.placementId,
      assetId: placement.assetId,
      role: placement.role,
    }));
    const reaction = beat.templateConfig.reactionTimeline;
    return {
      visualBeatId: beat.beatId,
      sceneId: `scene-${String(sceneIndex + 1).padStart(2, "0")}`,
      semanticGrammarId: beat.visualGrammarId,
      narrationChunkIds: narrationChunkIds(scene, beat),
      evidenceSourceIds: [...beat.evidenceSourceIds],
      cards: structuredClone(objects.cards),
      numbers: structuredClone(objects.numbers),
      nodes: structuredClone(objects.nodes),
      arrows: structuredClone(objects.arrows),
      availableAssetDescriptors: availableAssets,
      sourceDescriptors: beat.evidenceSourceIds.map((sourceId) => ({sourceId})),
      primaryFallbackState: availableAssets.length === 0 ? "not-required" : "unresolved",
      signals: {
        entityAvailable: beat.entity != null,
        pictureBookAvailable: beat.pictureBook != null,
        verifiedIntradaySeries: reaction?.precision === "verified-intraday-series" &&
          (Boolean(reaction.intradaySeries) || reaction.seriesObjectIds.length >= 2),
      },
    };
  })),
});

const alignedComparison = (beat: VisualCandidateInput["beats"][number]) => {
  if (beat.numbers.length < 2) return false;
  const numeric = beat.numbers.filter((item) => typeof item.numericValue === "number");
  if (numeric.length !== beat.numbers.length) return false;
  const units = new Set(beat.numbers.map((item) => item.unit));
  const bases = new Set(beat.numbers.map((item) => item.comparison));
  return units.size === 1 && bases.size === 1 && !bases.has(null);
};

const inferCapabilities = (beat: VisualCandidateInput["beats"][number]): EvidenceCapability[] => {
  const capabilities = new Set<EvidenceCapability>();
  if (beat.sourceDescriptors.length > 0) capabilities.add("source-document");
  if (beat.signals.verifiedIntradaySeries) capabilities.add("time-series");
  if (alignedComparison(beat)) capabilities.add("comparison-set");
  if (beat.semanticGrammarId === "gap") capabilities.add("gap");
  if (beat.semanticGrammarId === "causal" || (beat.nodes.length >= 2 && beat.arrows.length >= 1)) capabilities.add("causal-graph");
  if (beat.signals.entityAvailable) capabilities.add("entity");
  if (beat.signals.pictureBookAvailable || beat.availableAssetDescriptors.some((item) =>
    item.role === "main-media" || item.role === "picture-book" || item.role === "illustration")) {
    capabilities.add("image-media");
  }
  if (beat.semanticGrammarId === "verification") capabilities.add("verification");
  if (capabilities.size === 0) capabilities.add("text-only");
  return [...capabilities].sort();
};

export const buildVisualCapabilityInventory = (
  input: VisualCandidateInput,
): VisualCapabilityInventory => visualCapabilityInventorySchema.parse({
  contractVersion: "1.0.0",
  episodeDate: input.episodeDate,
  visualCandidateInputSha256: sha256Json(input),
  beats: input.beats.map((beat) => ({
    visualBeatId: beat.visualBeatId,
    capabilities: inferCapabilities(beat),
  })),
});
