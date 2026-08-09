#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def sub_once(text: str, pattern: str, replacement: str, label: str) -> str:
    out, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one replacement, got {count}")
    return out


# 1) Main-stage legibility: Expected / Actual / Gap + evidence boundary.
path = "src/components/spec/VisualTemplateRenderer.tsx"
text = read(path)
expected_block = r"const ExpectedActualFlow: React\.FC<\{content: PublicMainContent\}> = \(\{content\}\) => \{.*?\n\};\n\nconst BulletComparison"
expected_replacement = '''const expectedActualHero = (card: PublicCard) => {
  const raw = card.lines[0]?.value ?? card.title;
  return raw.replace(/^(Expected|Actual|Gap)\\s*/iu, "");
};

const expectedActualNote = (card: PublicCard) => card.role === "expected"
  ? "事前期待"
  : card.role === "actual"
    ? "実績・発表"
    : card.role === "gap"
      ? "差分"
      : card.title;

const ExpectedActualFlow: React.FC<{content: PublicMainContent}> = ({content}) => {
  const cards = [...content.cards].sort((a, b) => a.revealAtMs - b.revealAtMs);
  const labels = {expected: "EXPECTED", actual: "ACTUAL", gap: "GAP"} as const;
  return <Surface accent={color.emphasis} style={{padding: "26px 30px", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 20}}>{cards.map((card) => {
    const tone: Tone = card.role === "gap" ? "emphasis" : card.role === "actual" ? "positive" : "neutral";
    const hero = expectedActualHero(card);
    const heroSize = Array.from(hero).length <= 10 ? 70 : Array.from(hero).length <= 16 ? 58 : 48;
    return <div key={card.key} data-expected-actual-card={card.role ?? "unknown"} style={{...motionStyle(content, card), minWidth: 0, minHeight: 0, padding: "24px 22px 26px", borderRadius: 24, background: "rgba(248,251,253,.95)", border: `${card.highlighted ? 6 : 3}px solid ${toneColor(tone)}`, boxShadow: card.highlighted ? `0 0 0 7px ${toneColor(tone)}22` : "0 14px 28px rgba(16,32,51,.13)", display: "grid", gridTemplateRows: "auto 1fr auto", alignItems: "center", textAlign: "center"}}>
      <div><Tag tone={tone}>{card.role ? labels[card.role] : card.title}</Tag></div>
      <div style={{display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: "18px 6px", color: toneColor(tone), fontSize: heroSize, lineHeight: 1.08, fontWeight: 950, overflowWrap: "anywhere"}}>{hero}</div>
      <div style={{fontSize: 30, lineHeight: 1.2, color: color.muted, fontWeight: 900}}>{expectedActualNote(card)}</div>
    </div>;
  })}</Surface>;
};

const BulletComparison'''
text = sub_once(text, expected_block, expected_replacement, "ExpectedActualFlow")

evidence_block = r"const EvidenceBoundary: React\.FC<\{content: PublicMainContent\}> = \(\{content\}\) => \{.*?\n\};\n\nconst VerificationChecklist"
evidence_replacement = '''const adaptiveEvidenceFontSize = (value: string, active: boolean) => {
  const length = Array.from(value).length;
  if (length <= 18) return active ? 42 : 39;
  if (length <= 30) return active ? 36 : 34;
  return 31;
};

const EvidenceBoundary: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = content.texts.length > 0
    ? content.texts
    : content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title]);
  const columns = items.length === 1 ? "1fr" : "repeat(2,minmax(0,1fr))";
  return <Surface accent={color.emphasis} style={{padding: "30px 36px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 20}}>
    <div style={{fontSize: 31, color: color.muted, fontWeight: 900}}>{content.screenQuestion}</div>
    <div style={{display: "grid", gridTemplateColumns: columns, gridAutoRows: "minmax(0,1fr)", gap: "20px 34px", alignItems: "stretch"}}>
      {items.map((item, index) => {
        const active = index === items.length - 1;
        const fontSize = adaptiveEvidenceFontSize(item, active);
        return <div key={`${index}-${item}`} data-evidence-lane={index + 1} data-evidence-font-size={fontSize} style={{position: "relative", minWidth: 0, minHeight: 0, display: "flex", alignItems: "center", padding: "28px 28px 28px 82px", borderRadius: 24, background: active ? "rgba(248,244,255,.96)" : "rgba(248,251,253,.94)", border: `3px solid ${active ? "rgba(112,70,168,.58)" : "rgba(7,142,174,.46)"}`, boxShadow: "0 14px 28px rgba(16,32,51,.12)"}}>
          <div style={{position: "absolute", left: 24, top: 24, width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: active ? color.emphasis : color.cyan, fontSize: 23, fontWeight: 950}}>{index + 1}</div>
          <div style={{...timedStyle(content, content.beatStartMs + index * 680, "x"), maxWidth: "100%", fontSize, lineHeight: 1.22, color: active ? color.emphasis : color.ink, fontWeight: 950, overflowWrap: "anywhere", wordBreak: "normal"}}>{item}</div>
        </div>;
      })}
    </div>
    <div style={{textAlign: "right", color: color.emphasis, fontSize: 31, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};

const VerificationChecklist'''
text = sub_once(text, evidence_block, evidence_replacement, "EvidenceBoundary")
write(path, text)

# 2) Timeline: flatten multi-line event cards and make events, not the line, the focal point.
path = "src/components/spec/EventReactionTimelineTemplate.tsx"
text = read(path)
ordered_pattern = r"const orderedTimelineObjects = \(content: PublicMainContent\) => \{.*?\n\};\n\nconst toneColor"
ordered_replacement = '''type TimelineObject = PublicNumber | {key: string; label: string; value: string; revealAtMs: number; tone: string};

const orderedTimelineObjects = (content: PublicMainContent): TimelineObject[] => {
  const config = content.templateConfig.reactionTimeline;
  if (!config) return [];
  const byId = new Map<string, TimelineObject[]>([
    ...content.numbers.map((item) => [item.key, [item]] as const),
    ...content.cards.map((item) => [item.key, item.lines.length > 0
      ? item.lines.map((line, index) => ({
          key: `${item.key}-${index + 1}`,
          label: line.label,
          value: line.value,
          revealAtMs: item.revealAtMs + index * 620,
          tone: line.tone,
        }))
      : [{key: item.key, label: item.title, value: item.title, revealAtMs: item.revealAtMs, tone: "neutral"}]] as const),
  ]);
  return config.eventOrderIds.flatMap((id) => byId.get(id) ?? []);
};

const toneColor'''
text = sub_once(text, ordered_pattern, ordered_replacement, "orderedTimelineObjects")
sequence_pattern = r"const SequenceView: React\.FC<\{content: PublicMainContent\}> = \(\{content\}\) => \{.*?\n\};\n\nexport const EventReactionTimelineTemplate"
sequence_replacement = '''const splitTimelineValue = (value: string) => {
  const match = value.match(/^(翌日|(?:[0-2]?\\d:[0-5]\\d)\\s*ET)\\s*(.*)$/u);
  return match ? {time: match[1], body: match[2]} : {time: "", body: value};
};

const SequenceView: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = orderedTimelineObjects(content);
  const precision = content.templateConfig.reactionTimeline!.precision;
  const bodySize = items.length <= 3 ? 38 : 32;
  return <div style={{height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: "32px 38px 38px", boxSizing: "border-box"}}>
    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24}}>
      <div style={{fontSize: 34, fontWeight: 950, color: palette.ink}}>{content.screenQuestion}</div>
      <div style={{fontSize: 22, fontWeight: 850, color: palette.muted}}>{content.primaryElement}</div>
    </div>
    <div data-timeline-count={items.length} style={{position: "relative", display: "grid", gridTemplateColumns: `repeat(${Math.max(1, items.length)},minmax(0,1fr))`, gap: 22, alignItems: "center", minHeight: 0}}>
      {items.length > 1 ? <div aria-hidden="true" style={{position: "absolute", left: "8%", right: "8%", top: "50%", height: 4, borderRadius: 99, background: "rgba(7,142,174,.28)"}}/> : null}
      {items.map((item, index) => {
        const parts = splitTimelineValue(item.value);
        return <div key={item.key} data-timeline-item={precision} style={{...revealStyle(content, item.revealAtMs), position: "relative", zIndex: 2, minWidth: 0, minHeight: 250, padding: "24px 22px", borderRadius: 22, background: "rgba(248,251,253,.96)", border: `3px solid ${toneColor(item.tone)}66`, boxShadow: "0 14px 28px rgba(0,0,0,.14)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center"}}>
          <div style={{position: "absolute", left: "calc(50% - 10px)", top: "calc(50% - 10px)", width: 20, height: 20, borderRadius: 99, background: toneColor(item.tone), boxShadow: `0 0 0 8px ${toneColor(item.tone)}20`, zIndex: -1}}/>
          <div style={{minHeight: 40, fontSize: 28, lineHeight: 1.15, fontWeight: 950, color: toneColor(item.tone)}}>{parts.time || `STEP ${index + 1}`}</div>
          <div style={{marginTop: 18, fontSize: bodySize, lineHeight: 1.18, fontWeight: 950, color: palette.ink, overflowWrap: "anywhere"}}>{parts.body}</div>
        </div>;
      })}
    </div>
  </div>;
};

export const EventReactionTimelineTemplate'''
text = sub_once(text, sequence_pattern, sequence_replacement, "SequenceView")
write(path, text)

# 3) Subtitle display contract: Arabic numerals on screen, TTS speech untouched.
path = "src/spec/subtitle-cues.ts"
text = read(path)
insert_after = '''const normalizeSpeech = (value?: string) => (value ?? "")
  .replace(/\\r\\n?/gu, "\\n")
  .replace(/[\\t ]+/gu, " ")
  .replace(/\\n+/gu, " ")
  .trim();
'''
if insert_after not in text:
    raise SystemExit("subtitle-cues: normalizeSpeech anchor missing")
normalizer = r'''

const KANJI_DIGITS: Record<string, number> = {
  "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
  "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
};

const parseJapaneseInteger = (value: string): number | null => {
  const chars = Array.from(value);
  if (chars.length === 0) return null;
  if (chars.every((char) => char in KANJI_DIGITS)) {
    return Number(chars.map((char) => KANJI_DIGITS[char]).join(""));
  }
  const smallUnits: Record<string, number> = {"十": 10, "百": 100, "千": 1000};
  let total = 0;
  let section = 0;
  let digit: number | null = null;
  for (const char of chars) {
    if (char in KANJI_DIGITS) {
      digit = KANJI_DIGITS[char];
      continue;
    }
    if (char in smallUnits) {
      section += (digit ?? 1) * smallUnits[char];
      digit = null;
      continue;
    }
    if (char === "万") {
      section += digit ?? 0;
      total += (section || 1) * 10_000;
      section = 0;
      digit = null;
      continue;
    }
    return null;
  }
  return total + section + (digit ?? 0);
};

const parseJapaneseNumber = (value: string): string | null => {
  const [integerPart, fractionPart] = value.split("・");
  const integer = parseJapaneseInteger(integerPart);
  if (integer === null) return null;
  if (!fractionPart) return String(integer);
  const fraction = Array.from(fractionPart).map((char) => char in KANJI_DIGITS ? String(KANJI_DIGITS[char]) : "").join("");
  return fraction.length > 0 ? `${integer}.${fraction}` : String(integer);
};

export const normalizeSubtitleDisplayNumerals = (value: string) => {
  const numeral = "[〇零一二三四五六七八九十百千万]+(?:・[〇零一二三四五六七八九]+)?";
  const convert = (raw: string) => parseJapaneseNumber(raw) ?? raw;
  let output = value.replace(new RegExp(`第(${numeral})(?=に|、|。|：|:|\\s|$)`, "gu"), (_match, raw: string) => `第${convert(raw)}`);
  output = output.replace(
    new RegExp(`(${numeral})(パーセント|億ドル|兆ドル|億円|兆円|ギガワット|年|月|日|時|分|倍|点|社|つ|人|件|個|期|四半期)`, "gu"),
    (_match, raw: string, suffix: string) => `${convert(raw)}${suffix === "パーセント" ? "%" : suffix}`,
  );
  return output;
};
'''
text = text.replace(insert_after, insert_after + normalizer, 1)
text = text.replace('''      text: formatPage(page),\n''', '''      text: normalizeSubtitleDisplayNumerals(formatPage(page)),\n''', 1)
write(path, text)

path = "src/spec/render-state.ts"
text = read(path)
old = '''    subtitleText: activeChunk\n      ? getSubtitleTextAtTime(activeChunk.speechText, activeChunk.startMs, activeChunk.endMs, timeMs)\n      : null,\n'''
new = '''    subtitleText: activeChunk\n      ? getSubtitleTextAtTime(activeChunk.caption.text || activeChunk.speechText, activeChunk.startMs, activeChunk.endMs, timeMs)\n      : null,\n'''
if old not in text:
    raise SystemExit("render-state subtitle source anchor missing")
write(path, text.replace(old, new, 1))

path = "src/spec/validate-render-layout.ts"
text = read(path)
old = '''  // The public subtitle layer renders time-sliced speechText cues. caption.text\n  // remains production metadata and must not be treated as one visible page.\n  const cues = createSubtitleCues(chunk.speechText, chunk.startMs, chunk.endMs);\n'''
new = '''  // The public subtitle layer renders time-sliced caption text. speechText stays\n  // TTS-facing; caption text may use display-friendly Arabic numerals.\n  const cues = createSubtitleCues(chunk.caption.text || chunk.speechText, chunk.startMs, chunk.endMs);\n'''
if old not in text:
    raise SystemExit("validate-render-layout subtitle anchor missing")
write(path, text.replace(old, new, 1))

# 4) Tests: lock legibility and subtitle display behavior.
path = "scripts/test-subtitles.ts"
text = read(path)
text = text.replace(
    'import {createSubtitleCues, getSubtitleTextAtTime} from "../src/spec/subtitle-cues";',
    'import {createSubtitleCues, getSubtitleTextAtTime, normalizeSubtitleDisplayNumerals} from "../src/spec/subtitle-cues";',
    1,
)
text = text.replace('''const cues = createSubtitleCues(speech, 0, 19_219);\n''', '''const cues = createSubtitleCues(speech, 0, 19_219);\nconst displaySpeech = normalizeSubtitleDisplayNumerals(speech);\n''', 1)
text = text.replace('''  speech,\n  "subtitle pages must preserve the complete narration text",\n''', '''  displaySpeech,\n  "subtitle pages must preserve meaning while using display-friendly numerals",\n''', 1)
text = text.replace('''  scene8Regression,\n  "Scene 8 regression wrapping must preserve every narration character",\n''', '''  normalizeSubtitleDisplayNumerals(scene8Regression),\n  "Scene 8 regression wrapping must preserve meaning with display-friendly numerals",\n''', 1)
text = text.replace('''  caption: {text: "あ".repeat(156)},\n''', '''  caption: {text: speech},\n''', 1)
text = text.replace('''  speech,\n  "layout-only paging must preserve every narration character",\n''', '''  displaySpeech,\n  "layout-only paging must match the renderer's display numeral policy",\n''', 1)
anchor = '''assert.equal(getSubtitleTextAtTime(speech, 0, 19_219, cues[1].startMs), cues[1].text, "subtitle changes exactly at its cue boundary");\n'''
extra = '''assert.equal(normalizeSubtitleDisplayNumerals("〇・八三パーセント / 百十五・四億ドル / 二〇二七年"), "0.83% / 115.4億ドル / 2027年");\nassert.equal(normalizeSubtitleDisplayNumerals("三点です。第一に、五十六パーセント。NVIDIA一社。"), "3点です。第1に、56%。NVIDIA1社。");\n'''
if anchor not in text:
    raise SystemExit("test-subtitles anchor missing")
text = text.replace(anchor, anchor + extra, 1)
write(path, text)

path = "scripts/test-stage-legibility-contract.tsx"
text = read(path)
anchor = '''test("text focus has occupancy-aware hero and duo modes", () => {\n'''
legibility_test = '''test("main-stage legibility pass protects dense financial copy", () => {\n  const renderer = readFileSync("src/components/spec/VisualTemplateRenderer.tsx", "utf8");\n  const timeline = readFileSync("src/components/spec/EventReactionTimelineTemplate.tsx", "utf8");\n  assert.match(renderer, /data-expected-actual-card/);\n  assert.match(renderer, /const heroSize = Array\\.from\\(hero\\)\\.length <= 10 \\? 70/);\n  assert.match(renderer, /adaptiveEvidenceFontSize/);\n  assert.match(renderer, /rgba\\(248,251,253,\\.94\\)/);\n  assert.match(renderer, /overflowWrap: "anywhere"/);\n  assert.match(timeline, /data-timeline-count/);\n  assert.match(timeline, /splitTimelineValue/);\n  assert.match(timeline, /const bodySize = items\\.length <= 3 \\? 38 : 32/);\n});\n\n'''
if anchor not in text:
    raise SystemExit("stage-legibility anchor missing")
text = text.replace(anchor, legibility_test + anchor, 1)
write(path, text)

path = "scripts/test-event-reaction-timeline.tsx"
text = read(path)
insert = '''\nconst cardContent = content("official-time-plus-close", "official-time-plus-close");\ncardContent.numbers = [];\ncardContent.cards = [{\n  key: "events",\n  title: "SpaceX→AMD→翌日終値",\n  role: null,\n  lines: [\n    {label: "1", value: "16:30 ET SpaceX説明会", tone: "neutral"},\n    {label: "2", value: "17:00 ET AMD説明会", tone: "neutral"},\n    {label: "3", value: "翌日 AMD -7.04% / NVDA +3.43%", tone: "neutral"},\n  ],\n  highlighted: false,\n  revealAtMs: 0,\n  highlightedAtMs: null,\n  enterMotion: null,\n  exitMotion: null,\n  highlightMotion: null,\n  unhighlightMotion: null,\n}];\ncardContent.templateConfig.reactionTimeline!.eventOrderIds = ["events"];\nconst cardMarkup = renderToStaticMarkup(<EventReactionTimelineTemplate content={cardContent}/>);\nassert.match(cardMarkup, /data-timeline-count="3"/);\nassert.match(cardMarkup, /16:30 ET/);\nassert.match(cardMarkup, /17:00 ET/);\nassert.match(cardMarkup, /翌日/);\nassert.match(cardMarkup, /SpaceX説明会/);\nassert.match(cardMarkup, /AMD -7.04%/);\n'''
end_anchor = '''console.log("event reaction timeline renderer tests: 4 passed");\n'''
if end_anchor not in text:
    raise SystemExit("timeline test anchor missing")
text = text.replace(end_anchor, insert + '\nconsole.log("event reaction timeline renderer tests: 5 passed");\n', 1)
write(path, text)

# Restore package.json to its normal form and remove this one-shot patcher after staging.
package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package["scripts"].pop("pretypecheck", None)
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

stage_paths = [
    "src/components/spec/VisualTemplateRenderer.tsx",
    "src/components/spec/EventReactionTimelineTemplate.tsx",
    "src/spec/subtitle-cues.ts",
    "src/spec/render-state.ts",
    "src/spec/validate-render-layout.ts",
    "scripts/test-subtitles.ts",
    "scripts/test-stage-legibility-contract.tsx",
    "scripts/test-event-reaction-timeline.tsx",
    "package.json",
]
subprocess.run(["git", "add", "--", *stage_paths], cwd=ROOT, check=True)
subprocess.run(["git", "rm", "--", "scripts/apply_legibility_pass_v1.py"], cwd=ROOT, check=True)
print("Legibility Pass v1 staged successfully")
