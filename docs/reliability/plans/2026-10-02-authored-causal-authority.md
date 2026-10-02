# Authored causal graph authority repair

The first broken boundary is Candidate generation: alternative templates infer node order and an outcome from the Scene array. Compilation does not protect those fields. A second route lets `causal-build` draw connectors from text with no authored graph. The existing card renderer draws a connector between every displayed pair, even if Story omitted that edge.

## Decision before implementation

Preserve the authored node order, nullable outcome and selected graph IDs through Candidate generation and compilation. Protect these semantic fields against a modified Catalog as well as an ordinary alternative selection. Guard causal shots independently of template identity.

Use the existing two-to-four node / one-to-three arrow card path for one chain or independent chains. Draw only explicit adjacent edges, with their own labels and reveal times; a missing edge is a visible separation. This supports the company/macro two-chain example without joining their scopes. A graph whose arrows cannot be displayed in the authored order must return to Story with a JSON path; do not reorder it or silently drop an edge. General DAG layouts, crossing paths and additional graph shapes remain outside this repair.

Use the authored screen question as the path title and emphasize an outcome only when its node ID is explicitly selected. Remove text-to-node, last-item outcome and staggered text reveal inference from both active causal rendering routes. Share the causal card implementation with the dedicated Shot route so their graph rules cannot diverge.

Alternatives: keeping only the Python guard leaves downstream inference open; silently splitting or reordering graphs changes Story; a new graph-layout engine expands scope unnecessarily. The bounded explicit path is the smallest existing representation that displays both independent engines faithfully.

## File and verification map

- Candidate builder/compiler: preserve and protect causal config and graph selections.
- Shared authored-path validation: exact node coverage, selected endpoints, adjacent authored edges and bounded capacity.
- Static template / Shot validators: reject unsupported or missing graphs before rendering.
- Causal cards / dedicated causal Shot: render only the validated graph; use authored timing and outcome.
- New behavior tests: reversed Scene inventory, nullable outcome, forged Catalog, disconnected company/macro branches, card-only Shot bypass, missing/dangling/non-adjacent edges, graph labels and timing. Run against old code first and observe the failures.
- Required checks: typecheck, spec tests, public-screen, handoff-intake, build, whole lint with comparison to unchanged main when needed. Independent causal re-review and exact pinned Plot/Renderer integration precede activation of a new canonical renderer binding.

No historical RenderSpec, freeze, approval or media is rewritten. Legacy Plot materialization remains unchanged. No preview/final publication or visual/audio approval is authorized by these mechanical tests.
