# PR-1 scope — Renderer full handoff intake

This branch adds only the transport/runtime-asset boundary required by Visual Source Upgrade v1.1.

Reuse-first constraints:
- keep NasdaqCafeSpec, SpecAssetLayer, Visual Grammar, Stage Shell and Shot Renderer unchanged;
- keep render_spec immutable;
- validate and compile against one shared resolved runtime asset registry;
- ingest only immutable handoff bundle files already selected by Plot-side production;
- never fetch web content, choose Primary/Fallback, or generate images in Remotion.

This branch does not authorize final rendering.
