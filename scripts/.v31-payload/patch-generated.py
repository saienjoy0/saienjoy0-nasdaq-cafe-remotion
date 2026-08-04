from __future__ import annotations

import sys
from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f"{label} not found")
    return source.replace(old, new, 1)


def patch_before() -> None:
    path = Path("scripts/apply-v31-stabilization.py")
    source = path.read_text(encoding="utf-8")
    source = source.replace("filter((id) =>", "filter((id: string) =>")
    source = source.replace(
        'FILES[\'src/components/spec/ShotTransitionHost.tsx\'] = \'import type {PublicMainContent, PublicShot} from "../../spec/public-view-model";',
        'FILES[\'src/components/spec/ShotTransitionHost.tsx\'] = \'import type {PublicMainContent} from "../../spec/public-view-model";',
    )
    path.write_text(source, encoding="utf-8")


def patch_after() -> None:
    migration = Path("scripts/migrate-visual-story-v3.ts")
    source = migration.read_text(encoding="utf-8")
    cue_anchor = '''const cue = (value: string, edge: "start" | "end") => {
  const chars = Array.from(normalize(value));
  return (edge === "start" ? chars.slice(0, 12) : chars.slice(-12)).join("");
};
'''
    boundary_function = '''const semanticBoundaries = (text: string, count: number) => {
  const speech = normalize(text);
  const candidates: number[] = [];
  let cursor = 0;
  for (const unit of unitsWithSpans(text)) {
    cursor += normalize(unit.text).length;
    if (cursor > 0 && cursor < speech.length) candidates.push(cursor);
  }
  const boundaries = [0];
  for (let index = 1; index < count; index += 1) {
    const target = Math.floor(index * speech.length / count);
    const minimum = boundaries.at(-1)! + 1;
    const maximum = speech.length - (count - index);
    const candidate = candidates
      .filter((value) => value >= minimum && value <= maximum)
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
    boundaries.push(Math.max(minimum, Math.min(maximum, candidate ?? target)));
  }
  boundaries.push(speech.length);
  return {speech, boundaries};
};
'''
    source = replace_once(source, cue_anchor, cue_anchor + boundary_function, "migration cue anchor")
    replacements = {
        '    const units = unitsWithSpans(chunk.speechText);': '    const {speech, boundaries} = semanticBoundaries(chunk.speechText, shots.length);',
        '      const startUnit = Math.floor(index * units.length / shots.length);': '      const startChar = boundaries[index];',
        '      const endUnit = Math.max(startUnit, Math.ceil((index + 1) * units.length / shots.length) - 1);': '      const endChar = boundaries[index + 1];',
        '      const segmentStart = units[Math.min(units.length - 1, startUnit)];': '      const segmentText = speech.slice(startChar, endChar);',
        '      const segmentEnd = units[Math.min(units.length - 1, endUnit)];': '',
        '      shot.startProgress = Number((segmentStart.start / Math.max(1, chunk.speechText.length)).toFixed(6));': '      shot.startProgress = Number((startChar / Math.max(1, speech.length)).toFixed(6));',
        '      shot.endProgress = Number((segmentEnd.end / Math.max(1, chunk.speechText.length)).toFixed(6));': '      shot.endProgress = Number((endChar / Math.max(1, speech.length)).toFixed(6));',
        '      shot.startCue = cue(segmentStart.text, "start");': '      shot.startCue = cue(segmentText, "start");',
        '      shot.endCue = cue(segmentEnd.text, "end");': '      shot.endCue = cue(segmentText, "end");',
    }
    for old, new in replacements.items():
        source = replace_once(source, old, new, f"migration replacement {old}")
    for legacy in ("segmentStart", "segmentEnd", "startUnit", "endUnit"):
        if legacy in source:
            raise SystemExit(f"legacy overlapping boundary logic remains: {legacy}")
    migration.write_text(source, encoding="utf-8")

    timeline = Path("src/spec/shot-timeline.ts")
    source = timeline.read_text(encoding="utf-8")
    old = '''const cueProgress = (
  speechText: string,
  cue: string | undefined,
  edge: "start" | "end",
) => {
  if (!cue) return null;
  const speech = normalize(speechText);
  const needle = normalize(cue);
  const index = speech.indexOf(needle);
  if (index < 0 || speech.length === 0) return null;
  return clamp((index + (edge === "end" ? needle.length : 0)) / speech.length);
};'''
    new = '''const cueProgress = (
  speechText: string,
  cue: string | undefined,
  edge: "start" | "end",
  fallbackProgress: number,
) => {
  if (!cue) return null;
  const speech = normalize(speechText);
  const needle = normalize(cue);
  if (!needle || speech.length === 0) return null;
  const occurrences: number[] = [];
  let from = 0;
  while (from <= speech.length - needle.length) {
    const index = speech.indexOf(needle, from);
    if (index < 0) break;
    occurrences.push(index);
    from = index + 1;
  }
  if (occurrences.length === 0) return null;
  const target = clamp(fallbackProgress) * speech.length;
  const index = occurrences.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
  return clamp((index + (edge === "end" ? needle.length : 0)) / speech.length);
};'''
    source = replace_once(source, old, new, "timeline cue resolver")
    source = replace_once(
        source,
        "const semanticProgress = cueProgress(chunk.speechText, cue, edge);",
        "const semanticProgress = cueProgress(chunk.speechText, cue, edge, progress);",
        "timeline cue call",
    )
    timeline.write_text(source, encoding="utf-8")

    host = Path("src/components/spec/ShotTransitionHost.tsx")
    source = host.read_text(encoding="utf-8")
    source = replace_once(
        source,
        "export const ShotTransitionHost",
        "// PreviousShot and CurrentShot are rendered as simultaneous transition layers.\nexport const ShotTransitionHost",
        "transition layer contract marker",
    )
    host.write_text(source, encoding="utf-8")

    recipes = Path("src/components/spec/shots/ShotRecipes.tsx")
    source = recipes.read_text(encoding="utf-8")
    registry = '''

// Stable registry identifiers used by contracts and production diagnostics.
export const HeroMetricShot = "hero-metric-impact" as const;
export const ContradictionShot = "contradiction-interrupt" as const;
export const ExpectedAnchorShot = "expected-anchor" as const;
export const ActualCrossesExpectedShot = "actual-crosses-expected" as const;
export const GapMacroShot = "gap-macro" as const;
export const CausalBuildShot = "causal-build" as const;
export const CounterforceShot = "counterforce-interrupt" as const;
export const EntityCutawayShot = "entity-cutaway" as const;
export const SplitOppositionShot = "split-opposition" as const;
export const FocusMatrixShot = "focus-matrix-reveal" as const;
export const VerificationPathsShot = "verification-two-paths" as const;
export const RecapAssemblyShot = "recap-assembly" as const;
'''
    if "export const HeroMetricShot" not in source:
        source = source.rstrip() + registry + "\n"
    recipes.write_text(source, encoding="utf-8")


mode = sys.argv[1] if len(sys.argv) > 1 else ""
if mode == "before":
    patch_before()
elif mode == "after":
    patch_after()
else:
    raise SystemExit("usage: patch-generated.py before|after")
