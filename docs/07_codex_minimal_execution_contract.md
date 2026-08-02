# Codex minimal execution contract

## Responsibility boundary

The only daily source of truth for the spec route is `render-specs/YYYY-MM-DD/render_spec.json`. ChatGPT supplies every public phrase, narration/caption chunk boundary, ID, pause, expression, visual mode/event, object relationship, source label, and asset ID. Codex must not infer or repair any of those values.

Codex only validates the fixed schema and references, resolves fixed repository configuration, synthesizes each supplied `speechText` in order, measures audio, assigns that measured interval to the unchanged `captionText`, applies the supplied `pauseAfterMs`, computes frames, renders, probes/decodes media, caches audio, and writes a technical report.

Missing values and invalid references fail with a JSON path. The spec route does not read Markdown and does not call sentence segmentation, caption generation, trigger-text lookup, automatic speaker selection, automatic speaking-rate adjustment, generic copy, arrow inference, or fallback asset selection.

## Physical data boundary

`render_spec.json` is immutable input. Compilation writes `build/YYYY-MM-DD/render_data.production.json`, which contains only public copy, audio paths, caption timing, scene/timeline values, asset references, and render values. Debug and inspection details go only to `technical_report.json`. Production rendering accepts only the production data type.

The legacy Markdown/5-scene/9-scene paths remain available and are not called from the spec commands.

## Nine-Scene editorial contract

The program body always contains exactly nine Scenes in `scene-01` through `scene-09` order. Scene 1 uses the fixed role `opening-hook-market-direction-greeting-conclusion`: it combines the opening hook, prior-session index direction, a greeting of no more than one sentence, and the episode's central conclusion. It is not a standalone greeting, self-introduction, program explanation, or logo Scene.

Scene 9 uses the fixed role `closing-recap-sendoff-goodnight`: it contains only a short recap, `いってらっしゃい`, and the fox-side `おやすみなさい`. It must not introduce a new market topic.

Silent or logo-only start/end treatments are technical Remotion bumpers outside the nine body Scenes. A technical bumper has no narration, captions, or market causality, and Codex must not generate its content.

## Renderer contract

During a supplied `pauseAfterMs`, no caption is displayed. The renderer never carries the preceding caption forward and never reveals the following caption early.

Expression state is resolved independently for each Scene. At the same timestamp, the priority is `set-expression` visual event, then narration-chunk expression, then the Scene initial expression; JSON array order breaks ties within the same priority. Every expression requires its own configured asset. Missing mappings and fallback mappings are validation failures.

Visual events are applied in timestamp order and then JSON array order. An element whose first visibility event is `show` starts hidden; one whose first visibility event is `hide` starts visible; an element with no visibility event keeps its static visibility. Highlight state follows `highlight` and `unhighlight` in the same ordering and resets at every Scene boundary.

`assetPlacements` is the only production drawing source for asset identity, role, region, fit, opacity, and optional narration-chunk range. Placement ranges are inclusive of `startChunkId` and `endChunkId`. Every Scene has exactly one always-on `mainBackground` placement in `full-canvas`; alternate Scene backgrounds are invalid. At any narration chunk, at most one of `main-media`, `chart`, or `illustration` may occupy `main-stage`. A card is never inferred from narration and never overlaid on an already occupied main stage. Entity alias matching is validation-only and reports an unplanned mention.

`fade` transitions use the supplied duration and overlap adjacent Scene durations. `cut` and `none` add no overlap. Headline, supporting text, caption, card, number, node, arrow-label, and source limits are hard validation failures with a JSON path; public text is never truncated or rewritten.

An `expected-actual-gap` Scene contains exactly one card with each explicit role `expected`, `actual`, and `gap`. Display slots are selected only by those roles and never by array order or card text. Every number contains an explicit `positive`, `negative`, `warning`, `neutral`, or `emphasis` tone. Tone changes presentation only and never generates evaluative copy.

Production preflight checks every used `initialExpression`, narration-chunk expression, and `set-expression` event before synthesis or rendering. A missing dedicated registry entry fails with the JSON path, Scene ID, chunk ID or `initialExpression`, and expression. Schema fixtures may contain missing expressions; renderable fixtures use only dedicated non-fallback assets.

Spec-route production audio uses only the non-provisional `gemini-3.1-flash-tts-preview` model with the `Charon` voice. No alternate provider, model, voice, or automatic fallback is selected. Source audio is standardized only in format to 48,000 Hz, mono, 16-bit `pcm_s16le` WAV. Format conversion does not change speaking rate or pitch and does not add noise reduction, loudness effects, or sound effects. Remotion's rendered MP4 mix is fixed at 48,000 Hz stereo AAC and is inspected against that separate render format. The cache key includes provider, speaker UUID, style ID, speaking rate, pitch, intonation, volume, exact speech text, pronunciations, and this normalization contract.

`episode.durationMode: standard` is accepted only when the measured production timeline is 480–540 seconds. If evidence is insufficient, the input must explicitly use `shortened` and record `shortenedReason`; Codex does not pad narration to reach the target.

Audio output names contain safe episode, Scene, chunk, and voice-profile IDs plus a deterministic hash of the text and pronunciation identity. Production Scene start frames include each preceding fade overlap exactly once; production timeline duration, Composition metadata, technical report, and media inspection use the same frame total.

## Commands

```text
npm run episode:spec:validate -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:compile -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:preview -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:final -- render-specs/YYYY-MM-DD/render_spec.json
npm run episode:spec:inspect -- render-specs/YYYY-MM-DD/render_spec.json
```

Preview creates a low-resolution H.264/AAC MP4 and never invokes final. Final is generated only by the explicit final command. The technical fixture uses `render-specs/fixtures/minimal/render_spec.json`; its still and fixture-compile tests do not require TTS. Any real preview or final requires the configured Gemini Charon profile.
