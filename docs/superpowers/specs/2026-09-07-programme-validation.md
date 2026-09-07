# Programme remediation validation

## Implemented

Token-aware subtitle wrapping preserves fitting Latin words, mixed alphanumeric identifiers and numeric expressions across line/page boundaries. Cue text still derives from the same normalized caption input; speech and TTS cache identity are unchanged. Long tokens are bounded at 22 Unicode code points and pages at two lines. Glyph-width measurement and re-timing from forced alignment are not claimed.

## Verification

- Dependency lockfile installation and TypeScript typecheck passed.
- All 26 distinct test entrypoints reachable through test:spec (including test:visual-story), test:public-screen and test:handoff-intake passed.
- The same TypeScript entrypoints ran via `node --import tsx` because this environment denies the tsx CLI's IPC socket. This is an invocation adaptation, not a test-code bypass.
- Remotion bundle build passed. No TTS, preview or final video was generated.
- Whole-repository ESLint reports 30 errors and 3 warnings both at baseline b2a2807 and after this change. These are pre-existing; full lint is not green. Changed subtitle files have zero errors and one pre-existing test warning.
- Independent subtitle review found a mixed-alphanumeric boundary defect; fixed in 1611477 and scoped re-review passed.

## Scope and rollout

Existing render_spec files, approved video artifacts, final requests, voices and scene contracts are unchanged. Re-rendering an existing approved episode with new subtitle layout requires a new preview/approval; old approval does not certify the changed pixels. Renderer 2.4.0 remains nine-scene. The programme design records a coordinated future scene-contract migration rather than claiming it is enabled.

The corresponding Plot change prevents Current production from inventing graph edges from card order, strengthens five existing Skills and changes editorial canon02 with a new manifest hash. New editorial productions must freeze against that updated canon. Historical bundles must retain their original identity and approval.
