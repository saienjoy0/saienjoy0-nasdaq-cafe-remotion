# Financial Visual Renderer Contract v1.0.0

## Purpose

This contract allows the renderer to accept the Financial Recipe Plan selected by `nasdaq-plot-creator-` without asking Remotion to infer editorial meaning.

```text
Final Episode Contract
→ deterministic Financial Recipe Plan
→ selected route only in render_spec 2.3.0
→ renderer contract validation
→ fixed Visual Template registry
→ component rendering
```

The renderer does not select the lead story, create Expected values, infer causality, change narration, choose preferred versus fallback, or create assets.

## Versioning

- legacy non-financial input: `render_spec 2.2.0`
- financial input: `render_spec 2.3.0`
- Financial Visual Trace: `1.0.0`
- Financial Template Registry: `1.0.0`
- compatibility matrix: `financial-visual-compat-2026-08`

A 2.2.0 spec remains valid only when it has no financial root contract, no financial trace and no new financial Template.

## New fixed Templates

| Template | Role | Supported states | Core shape |
|---|---|---|---|
| `market-pulse-grid` | market snapshot | Data / Chart | 3–6 numeric market metrics |
| `earnings-surprise` | Expected / Actual / Gap | Data / Chart | exactly three numeric metrics |
| `dual-asset-split` | entity divergence | Data / Chart / MainWithEntity | exactly two numeric entities |
| `macro-pressure` | macro transmission | Data / Chart / MainWithEntity | 2–4 nodes and 1–3 arrows |
| `source-receipt` | source evidence | Data / News | one evidence surface |

Fallback Recipes may intentionally select an existing Template such as `expected-actual-bullet`, `split-comparison`, `causal-lane` or `news-media`. A Beat is therefore treated as financial when it has `financialVisualTrace`, not only when it uses one of the five new Template IDs.

## Root contract

A financial 2.3.0 spec includes:

```json
{
  "financialVisualContract": {
    "contractVersion": "1.0.0",
    "intentVersion": "1.1.0",
    "recipePlanVersion": "1.0.0",
    "recipeRegistryVersion": "1.0.0",
    "finalEpisodeContractVersion": "1.0.0",
    "recipePlanSha256": "...",
    "selectionCount": 1
  }
}
```

The root Recipe Plan SHA and selection count must match every traced Beat.

## Beat trace

The renderer receives only the selected route:

```json
{
  "financialVisualTrace": {
    "contractVersion": "1.0.0",
    "intentId": "fvi-aws-expectation-gap",
    "selectedPlanId": "fvp-aws-gap-preferred",
    "selectedPlanSha256": "...",
    "selectedPath": "preferred",
    "recipeId": "earnings-surprise",
    "recipePlanSha256": "...",
    "finalEpisodeContractSha256": "...",
    "sourceIds": ["source-001"],
    "metricIds": ["aws-expected", "aws-actual", "aws-gap"],
    "causalStepIds": [],
    "displayOrder": ["aws-expected", "aws-actual", "aws-gap"],
    "comparisonBasis": "AWS revenue, same quarter and currency",
    "reasonCodes": []
  }
}
```

The trace is production-private metadata. It is validated before compilation and must not be copied into the public view model.

## Required agreement

For each traced Beat, the renderer validates:

- supported `render_spec 2.3.0`
- root and Beat Recipe Plan SHA agreement
- unique Intent and selected Plan IDs
- allowlisted Recipe / selected path / Template combination
- top-level and Template-config variant agreement
- `objectIds` = selected display order
- `evidenceSourceIds` = selected source IDs
- metric and causal-step IDs match Template config
- comparison basis matches the trace
- return target exists
- preferred has no fallback reason code
- fallback has at least one reason code

Arbitrary React components, CSS, local paths, URLs and dynamic imports are not fields in this contract.

## Compatibility matrix

The renderer stores the same fixed matrix ID and version tuple as the plot-creator handoff:

```text
financial-visual-compat-2026-08
plot: Intent 1.1.0 / Recipe Plan 1.0.0 / Final Episode 1.0.0
renderer: render_spec 2.3.0 / Template Registry 1.0.0 / Trace 1.0.0
```

R1 completes schemas and registry only. R2 adds the five component implementations. R3 runs shared handoff acceptance and preview.
