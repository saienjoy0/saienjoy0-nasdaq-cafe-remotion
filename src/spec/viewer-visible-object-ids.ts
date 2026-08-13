import type {RenderSpec} from "./render-spec";

type Scene = RenderSpec["scenes"][number];

/**
 * Scene inventories may retain producer/context objects that no selected Visual Beat
 * renders. Layout safety must evaluate the viewer surface, not unreachable inventory.
 * Referential/schema validators still validate the complete Scene data separately.
 */
export const viewerVisibleObjectIds = (scene: Scene) =>
  new Set(
    scene.visualBeats.flatMap((beat) => beat.objectIds),
  );
