# Subtitle token boundary review repair

The PR224 tokenizer can still split fitting digit-first identifiers, signed currency amounts, accented Latin names and typographic apostrophes. Greedy line grouping can also produce a page containing only closing punctuation. The first broken boundary is subtitle cue construction, shared by the renderer and layout validator.

Keep the existing caption text, order, normalization, chunk audio interval, 22-code-point line limit, two-line page limit and oversized-token handling. Do not change narration, TTS identity, approved historical inputs or approval records.

Options considered: correcting individual captions would hide a reusable tokenizer defect; deleting punctuation or increasing the limits would weaken the contract. Extend the existing atomic-token grammar and move a safe trailing text token with closing punctuation. When a full-width atomic token cannot share its line with punctuation, group that line and punctuation in one cue instead of emitting a punctuation-only cue.

Files and responsibilities:

- `scripts/test-subtitles.ts`: literal line/page boundary regressions for `24H2`, `-$9.12B`, `−5.12%`, `Nestlé`, `O’Reilly` and the ordinary Japanese punctuation-only-page example. Check original text and audio interval coverage as well as bounds.
- `src/spec/subtitle-cues.ts`: token recognition and punctuation grouping only; preserve the existing duration algorithm.

Verification: run the new regressions before implementation and record expected assertion failures; apply the minimal repair; rerun subtitle tests, `typecheck`, `lint`, `test:spec`, `test:public-screen`, `test:handoff-intake` and `build`. Compare any repository-wide lint failure with current main. Request a scoped re-review before the normal merge gate. No TTS or preview/final request is introduced.
