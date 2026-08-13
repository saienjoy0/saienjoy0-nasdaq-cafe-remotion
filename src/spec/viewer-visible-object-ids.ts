type SceneWithVisualBeats = {
  visualBeats: Array<{objectIds: readonly string[]}>;
};

/**
 * Scene inventories may retain producer/context objects that no selected Visual Beat
 * renders. Layout safety must evaluate the viewer surface, not unreachable inventory.
 * Referential/schema validators still validate the complete Scene data separately.
 *
 * Keep this helper structural: both authoring RenderSpec Scenes and production-time
 * Scenes expose the same `visualBeats[*].objectIds` viewer-reachability contract even
 * though their narration chunk types intentionally differ.
 */
export const viewerVisibleObjectIds = (scene: SceneWithVisualBeats) =>
  new Set(
    scene.visualBeats.flatMap((beat) => beat.objectIds),
  );
