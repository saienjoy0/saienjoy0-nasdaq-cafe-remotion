# Visual Grammar Measured Diversity 1.1.0

VG-5 measures the final post-TTS Visual Beat timeline. It does not estimate timing from narration text or the pre-TTS input schedule.

```text
render_spec 2.4.0
→ TTS compile
→ production Visual Beat startMs/endMs
→ visual_grammar_timing_report.json 1.1.0
→ existing diversity hard gates
→ Static State report-only measurement
→ preview / handoff
```

## Scene range

The measured diversity gate covers Scene 1 through Scene 8. Scene 9 assembly is excluded from diversity occupancy calculations.

## Existing hard gates

- same Appearance Class continuous run: at most 28 seconds;
- any one Dominant Surface: at most 45 percent;
- `card-board`: at most 55 percent;
- non-analysis appearances: at least 10 seconds, or 8 seconds for an explicit shortened episode;
- `bridge-text`: at most 12 percent and at most 18 seconds;
- Stage after `major-shift`: at least 4 seconds.

Non-analysis appearances are `entity-canvas`, `document-media`, and `picturebook-canvas`.

The 5–8 second target for an individual non-analysis Beat is advisory and is reported as a warning rather than used as a production stop.

## Static State measurement

Version 1.1.0 adds a separate `staticState` report. It measures how long the viewer-facing information state remains unchanged after TTS timing is known.

Static State boundaries are mechanical only:

- Visual Beat boundary;
- shot boundary;
- `show`;
- `hide`;
- `highlight`;
- `unhighlight`;
- active `main-media`, `chart`, or `illustration` placement boundary;
- Scene boundary.

The following do **not** count as information-state progression:

- subtitle changes;
- fox blink or idle motion;
- background animation;
- decorative fades or particles;
- generic pulse or camera micro-motion;
- elapsed time by itself.

### Phase 1 thresholds

```text
unchanged > 8 s
→ Static State warning

unchanged > 16 s
→ Static State failure candidate
```

Both are **report-only** in 1.1.0. They do not change the existing Visual Grammar `status` and do not block Final yet.

The intended rollout is:

```text
Phase 1: report-only measurement
→ Phase 2: authored shots / visualEvents in daily production
→ 3–5 real-day previews
→ threshold review
→ Phase 3: explicit Final hard gate in a later change
```

No renderer component may invent a shot, highlight target, or reveal order merely to satisfy this report.

## Fallback

The selected final path is measured. A financial Beat selected through `fallback` is included in the same duration and occupancy calculations and is recorded in `selectedFallbackBeatIds`. The report always records `fallbackDiversityRecheck: completed` and `unresolvedStateCount: 0`.

Static State is also measured after the final selected path is compiled. Fallback adoption therefore does not bypass the report.

## Output

`visual_grammar_timing_report.json` includes:

- post-TTS timing basis;
- render spec, semantics, renderer compatibility, and Final Episode Contract SHA values;
- measured Beat rows;
- Appearance and Surface duration totals;
- fallback Beat IDs;
- existing failures and advisory warnings;
- `staticState.mode = report-only`;
- longest unchanged state;
- >8 s warnings;
- >16 s failure candidates.

The report SHA is copied to `technical_report.json`. Existing Visual Grammar hard-gate failures still stop compile before Preview or handoff. Static State findings remain diagnostic until the later explicit hard-gate activation change.
