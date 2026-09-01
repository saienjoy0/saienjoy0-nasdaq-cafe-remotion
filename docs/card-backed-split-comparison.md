# Card-backed split comparison compatibility

This branch adds a renderer capability for an already-authored `comparison` Beat whose `split-comparison` payload contains a two-item card instead of two aligned numeric objects.

The compatibility rule is mechanical and fail-closed:

- numeric comparisons keep the existing aligned unit/comparison-basis requirements;
- card-backed comparisons require exactly two non-empty card lines selected by the Beat;
- no text is parsed into invented numbers;
- no grammar, narration, evidence, or editorial meaning is changed.
