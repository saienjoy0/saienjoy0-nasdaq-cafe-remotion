# Visual Story Engine v3.1 Stabilization Contract

Visual Story Engine v3.1 fixes the first v3 preview without changing narration, market causality, subtitles, Scene order, fox assets, or TTS identity.

## Production rules

- All 12 Shot Recipes have dedicated renderers.
- `VisualTemplateRenderer` is used only when a legacy input contains no `shots` array.
- The Stage shell never receives camera scale or translation.
- Camera transforms apply only to a semantic focus group and are capped at scale 1.08, X ±24px, Y ±16px.
- Shot changes use previous/current layers. Their opacity sum never drops below 1.
- Every production Shot has `startCue`, `endCue`, semantic target fields, and a camera target when needed.
- Expected, Actual, and Gap card roles are validated.
- Scene 9 keeps all four recap elements and assembles them before holding the final phrase.
- Fox uses the existing seven expression assets only.
- Subtitle and headline coordinates remain fixed.

## Mechanical checks

`npm run test:shot-stability` verifies dedicated renderer coverage, no production GenericShot, safe camera limits, crossfade occupancy, semantic cues and targets, 39-Shot count, and Scene 9 recap persistence.
