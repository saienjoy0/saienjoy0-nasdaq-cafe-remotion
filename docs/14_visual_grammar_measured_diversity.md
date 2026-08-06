# Visual Grammar Measured Diversity 1.0.0

VG-5 measures the final post-TTS Visual Beat timeline. It does not estimate timing from narration text or the pre-TTS input schedule.

```text
render_spec 2.4.0
→ TTS compile
→ production Visual Beat startMs/endMs
→ visual_grammar_timing_report.json
→ PASS only
→ preview / handoff
```

## Scene range

The measured diversity gate covers Scene 1 through Scene 8. Scene 9 assembly is excluded from diversity occupancy calculations.

## Hard gates

- same Appearance Class continuous run: at most 28 seconds;
- any one Dominant Surface: at most 45 percent;
- `card-board`: at most 55 percent;
- non-analysis appearances: at least 10 seconds, or 8 seconds for an explicit shortened episode;
- `bridge-text`: at most 12 percent and at most 18 seconds;
- Stage after `major-shift`: at least 4 seconds.

Non-analysis appearances are `entity-canvas`, `document-media`, and `picturebook-canvas`.

The 5–8 second target for an individual non-analysis Beat is advisory and is reported as a warning rather than used as a production stop.

## Fallback

The selected final path is measured. A financial Beat selected through `fallback` is included in the same duration and occupancy calculations and is recorded in `selectedFallbackBeatIds`. The report always records `fallbackDiversityRecheck: completed` and `unresolvedStateCount: 0`.

## Output

`visual_grammar_timing_report.json` includes:

- post-TTS timing basis;
- render spec, semantics, renderer compatibility, and Final Episode Contract SHA values;
- measured Beat rows;
- Appearance and Surface duration totals;
- fallback Beat IDs;
- failures and advisory warnings.

The report SHA is copied to `technical_report.json`. A FAIL report is written for diagnosis, then compile stops before Preview or handoff.
