# Visual Grammar Contract 1.0.0

Visual Grammar is the renderer-side compatibility boundary between an editorially selected meaning and an already approved Visual Template.

```text
Visual Grammar ID
→ approved Visual Template
→ Appearance Class
→ Dominant Surface
→ Stage Shell
→ Motion Language
```

## Authority boundary

- ChatGPT fixes `visualGrammarId`, `transitionRole`, and `visualTemplate`.
- The renderer never infers editorial meaning from Scene number, words, metrics, or price direction.
- The renderer selects components from `visualTemplate`.
- The validator uses `visualGrammarId` only to reject incompatible Template selections.
- Appearance metadata is renderer-internal and must not become public viewer text.

## Versions

- `render_spec 2.2.0`: legacy Visual Story input. Visual Grammar metadata is forbidden.
- `render_spec 2.3.0`: Financial Visual input. Visual Grammar metadata is forbidden.
- `render_spec 2.4.0`: Visual Grammar root contract and Beat metadata are required.

## Root contract

```json
{
  "visualGrammarContract": {
    "contractVersion": "1.0.0",
    "semanticsSha256": "<plot semantics SHA>",
    "rendererCompatibilitySha256": "<renderer compatibility SHA>",
    "finalEpisodeContractSha256": "<final episode contract SHA>",
    "beatCount": 21
  }
}
```

Every Beat in 2.4.0 requires:

```json
{
  "visualGrammarId": "gap",
  "transitionRole": "major-shift"
}
```

## Deterministic checks

- every active Visual Template has exactly one compatibility entry;
- Grammar and Template must be allowed by the registry;
- registry SHA must match the committed JSON bytes;
- root `beatCount` must match the actual Beat count;
- `major-shift` must change Appearance Class or Dominant Surface;
- 2.2.0 and 2.3.0 remain valid without Visual Grammar metadata;
- older versions may not silently carry 2.4.0 metadata.

## Deferred phases

VG-2 does not implement Stage components, measured-duration gates, TimelineStage, or A/B Preview. Those remain VG-3 through VG-6.
