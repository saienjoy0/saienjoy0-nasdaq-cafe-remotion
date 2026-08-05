# Financial Visual Templates v1.0.0

FVU-R2 replaces the R1 explicit stop gate with five fixed Remotion components. Each component consumes only the existing public view model. Financial intent IDs, Recipe Plan hashes, selected plan IDs and other production-private trace fields are never passed to the component layer.

## Shared rules

- animation is driven by Scene time and Remotion `spring` / `interpolate`
- no CSS transitions, keyframes or dynamic imports
- no arbitrary React, CSS, URL or renderer path from `render_spec.json`
- public values come from cards, numbers, nodes, arrows and viewer text
- comparison basis comes from the selected fixed Template config
- every component uses a bounded surface and fixed count limits
- unsupported shape throws before rendering

## Implementations

### `market-pulse-grid`

- 3–6 numeric market metrics
- two columns for 3–4 metrics, three columns for 5–6
- same session and same unit are validated before render
- close-only values remain number cards; no price series is invented

### `earnings-surprise`

- exactly three visible metrics in selected order
- Expected, Actual and Gap each receive a fixed panel
- Gap receives the strongest emphasis
- comparison basis remains visible in the footer

### `dual-asset-split`

- exactly two numeric entities
- one shared center baseline
- left and right panels preserve the selected order
- relative bars are normalized only for screen length; displayed values are unchanged

### `macro-pressure`

- 2–4 nodes and 1–3 arrows
- fixed left-to-right node order
- arrows draw after the connected nodes become visible
- no graph auto-layout or inferred causal edge

### `source-receipt`

- 1–6 evidence items
- receipt-shaped evidence surface
- no source ID, SHA, plan ID or private trace appears on screen
- confirmed material is shown without inventing article text

## Failure behavior

Each component calls `assertFinancialTemplateContent` before returning markup. Invalid counts stop rendering. The production layout validator repeats the same hard limits against the full render spec.

## Validation

R2 CI checks:

- static markup for all five components
- Expected/Actual/Gap labels
- entity split and macro chain content
- source receipt output
- invalid count rejection
- private trace absence from the public model and markup
- renderer switch coverage
- layout validator source patch
- TypeScript typecheck
- complete existing Visual Story regression and Remotion bundle
