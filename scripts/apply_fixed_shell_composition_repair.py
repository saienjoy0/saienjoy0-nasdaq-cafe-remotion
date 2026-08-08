from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, got {count}")
    return text.replace(old, new, 1)


# 1) Restore the production-spec fixed shell. Keep visual change inside the main frame.
path = Path("src/compositions/NasdaqCafeSpecEpisode.tsx")
text = path.read_text(encoding="utf-8")
text = text.replace('import type {VisualGrammarStageMode} from "../spec/visual-grammar-stage-mode";\n', '')
text = text.replace('import type {StageShellId} from "../spec/visual-grammar-contract";\n', '')
start = text.index('export type StageLayoutProfile =')
end = text.index('export const SpecSceneFrame:')
static_layout = '''export const MAIN_STAGE_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 416,
  top: 144,
  width: 1440,
  height: 648,
  zIndex: 10,
  overflow: "hidden",
};

export const FOX_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 64,
  top: 176,
  width: 320,
  height: 720,
  zIndex: 30,
  overflow: "visible",
};

export const SUBTITLE_FRAME_STYLE: React.CSSProperties = {
  position: "absolute",
  left: 416,
  top: 824,
  width: 1440,
  height: 176,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 32px",
  boxSizing: "border-box",
  overflow: "hidden",
  borderRadius: 16,
  background: "rgba(0,0,0,.84)",
  borderTop: "3px solid rgba(255,199,74,.86)",
  color: "#fff7df",
  fontSize: 34,
  lineHeight: 1.3,
  fontWeight: 900,
  letterSpacing: "0.01em",
  textAlign: "center",
  whiteSpace: "pre-line",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
  textShadow: "0 3px 10px #000",
};

'''
text = text[:start] + static_layout + text[end:]
text = text.replace('  const layoutProfile = getStageLayoutProfileForShell(stageMode === "candidate" ? stageShellId : null);\n', '')
text = replace_once(
    text,
    '    <div data-stage-layout={layoutProfile} style={getMainStageFrameStyle(layoutProfile, stageMode)}>\n',
    '    <div data-stage-layout="fixed" style={{...MAIN_STAGE_FRAME_STYLE, borderRadius: stageMode === "legacy" ? 30 : 0}}>\n',
    'main stage fixed frame',
)
text = replace_once(
    text,
    '    <div data-fox-layout={layoutProfile} style={getFoxFrameStyle(layoutProfile, view.fox.opacity)}>\n',
    '    <div data-fox-layout="fixed" style={{...FOX_FRAME_STYLE, opacity: view.fox.opacity}}>\n',
    'fox fixed frame',
)
text = replace_once(
    text,
    '    {view.sourceLabel ? <div style={{position: "absolute", left: 972, top: 860, width: 852, height: 28, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 20, lineHeight: "28px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n',
    '    {view.sourceLabel ? <div style={{position: "absolute", left: 1016, top: 744, width: 808, height: 32, zIndex: 50, overflow: "hidden", whiteSpace: "nowrap", color: "#b6cad9", fontSize: 22, lineHeight: "32px", textAlign: "right"}}>{view.sourceLabel}</div> : null}\n',
    'source label fixed frame',
)
text = text.replace('data-subtitle-chrome="compact"', 'data-subtitle-chrome="fixed"')
path.write_text(text, encoding="utf-8")


# 2) Separate evidence/checklist/matrix semantics and make incomplete reveal states look intentional.
path = Path("src/components/spec/VisualTemplateRenderer.tsx")
text = path.read_text(encoding="utf-8")
marker = 'const VerificationMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {'
idx = text.index(marker)
new_components = r'''const EvidenceBoundary: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = content.cards.length > 0
    ? content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title])
    : content.texts;
  return <Surface accent={color.emphasis} style={{padding: "34px 42px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 22}}>
    <div style={{fontSize: 28, color: color.muted, fontWeight: 900}}>{content.screenQuestion}</div>
    <div style={{display: "grid", gridTemplateRows: `repeat(${Math.max(1, items.length)},minmax(0,1fr))`, gap: 18}}>
      {items.map((item, index) => {
        const active = index === items.length - 1;
        return <div key={`${index}-${item}`} data-evidence-row={index + 1} style={{position: "relative", display: "flex", alignItems: "center", minHeight: 0, padding: "22px 30px 22px 84px", borderRadius: 22, background: active ? "rgba(112,70,168,.10)" : "rgba(82,118,145,.08)", border: `3px solid ${active ? "rgba(112,70,168,.42)" : "rgba(82,118,145,.28)"}`, overflow: "hidden"}}>
          <div style={{position: "absolute", left: 24, top: "50%", translate: "0 -50%", width: 40, height: 40, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: active ? color.emphasis : color.cyan, fontSize: 23, fontWeight: 950}}>{index + 1}</div>
          <div style={{...timedStyle(content, content.beatStartMs + index * 680, "x"), fontSize: active ? 46 : 38, lineHeight: 1.22, color: active ? color.emphasis : color.ink, fontWeight: 950}}>{item}</div>
        </div>;
      })}
    </div>
    <div style={{textAlign: "right", color: color.emphasis, fontSize: 29, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};

const VerificationChecklist: React.FC<{content: PublicMainContent}> = ({content}) => {
  const items = content.cards.length > 0
    ? content.cards.flatMap((card) => card.lines.length > 0 ? card.lines.map((line) => line.value) : [card.title])
    : content.texts;
  return <Surface accent={color.warning} style={{padding: "32px 42px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: 18}}>
    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}><Tag tone="warning">検証ポイント</Tag><div style={{fontSize: 28, color: color.muted, fontWeight: 900}}>{content.screenQuestion}</div></div>
    <div data-verification-checklist="true" style={{display: "grid", gridTemplateRows: `repeat(${Math.max(1, items.length)},minmax(0,1fr))`, gap: 15}}>
      {items.map((item, index) => <div key={`${index}-${item}`} style={{position: "relative", display: "grid", gridTemplateColumns: "58px 1fr", gap: 18, alignItems: "center", minHeight: 0, padding: "18px 24px", borderRadius: 20, background: "rgba(186,107,0,.07)", border: "2px solid rgba(186,107,0,.28)"}}><div style={{width: 42, height: 42, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: color.warning, fontSize: 24, fontWeight: 950}}>{index + 1}</div><div style={{...timedStyle(content, content.beatStartMs + index * 620, "x"), fontSize: 35, lineHeight: 1.22, fontWeight: 930}}>{item}</div></div>)}
    </div>
    <div style={{textAlign: "center", color: color.emphasis, fontSize: 32, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};

'''
text = text[:idx] + new_components + text[idx:]
start = text.index(marker)
end = text.index('\n\nconst FinalAssembly:', start)
old_matrix = text[start:end]
new_matrix = r'''const VerificationMatrix: React.FC<{content: PublicMainContent}> = ({content}) => {
  const labels = content.templateConfig.laneLabels.length === 2 ? content.templateConfig.laneLabels : ["強まる", "弱まる"];
  const items = content.cards.length > 0 ? content.cards.map((card) => card.lines[0]?.value ?? card.title) : content.texts;
  const midpoint = Math.ceil(items.length / 2);
  const parsedItems = items.map((text, index) => {
    const delimiter = text.indexOf("｜");
    const prefix = delimiter >= 0 ? text.slice(0, delimiter).trim() : "";
    const body = delimiter >= 0 ? text.slice(delimiter + 1).trim() : text;
    const exactLane = labels.findIndex((label) => label === prefix);
    return {text: body, sourceIndex: index, laneIndex: exactLane >= 0 ? exactLane : index < midpoint ? 0 : 1};
  });
  const lanes = labels.map((_, laneIndex) => parsedItems.filter((item) => item.laneIndex === laneIndex));
  return <Surface accent={color.warning} style={{padding: "28px 34px", display: "grid", gridTemplateRows: "1fr auto", gap: 18}}>
    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20}}>
      {lanes.map((laneItems, laneIndex) => <div key={labels[laneIndex]} data-verification-lane={laneIndex} style={{display: "grid", gridTemplateRows: "auto 1fr", gap: 16, minWidth: 0, padding: "18px 18px 20px", borderRadius: 24, background: laneIndex === 0 ? "rgba(7,134,95,.055)" : "rgba(186,107,0,.055)", border: `3px solid ${laneIndex === 0 ? "rgba(7,134,95,.24)" : "rgba(186,107,0,.24)"}`}}>
        <div style={{textAlign: "center"}}><Tag tone={laneIndex === 0 ? "positive" : "warning"}>{labels[laneIndex]}</Tag></div>
        <div style={{display: "grid", gridTemplateRows: `repeat(${Math.max(1, laneItems.length)},minmax(0,1fr))`, gap: 15, alignContent: "stretch"}}>
          {laneItems.map((item) => <div key={`${item.sourceIndex}-${item.text}`} style={{position: "relative", display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "center", minHeight: 0, padding: "18px 20px", borderRadius: 18, background: laneIndex === 0 ? "rgba(7,134,95,.09)" : "rgba(186,107,0,.09)", border: `2px solid ${laneIndex === 0 ? "rgba(7,134,95,.30)" : "rgba(186,107,0,.30)"}`, fontSize: 29, lineHeight: 1.23, fontWeight: 900}}><div style={{width: 34, height: 34, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", color: color.white, background: laneIndex === 0 ? color.positive : color.warning, fontSize: 23, fontWeight: 950}}>{laneIndex === 0 ? "+" : "−"}</div><div style={timedStyle(content, content.beatStartMs + item.sourceIndex * 620, "x")}>{item.text}</div></div>)}
        </div>
      </div>)}
    </div>
    <div style={{textAlign: "center", color: color.emphasis, fontSize: 33, fontWeight: 950}}>{content.primaryElement}</div>
  </Surface>;
};'''
text = text[:start] + new_matrix + text[end:]
text = replace_once(text, '    case "verification-checklist": return <VerificationMatrix content={content}/>;', '    case "verification-checklist": return <VerificationChecklist content={content}/>;', 'checklist renderer split')
text = replace_once(text, '    case "evidence-boundary":\n', '    case "evidence-boundary": return <EvidenceBoundary content={content}/>;\n', 'evidence renderer split')
path.write_text(text, encoding="utf-8")


# 3) Make text-focus use the whole fixed stage when there are only one or two important statements.
path = Path("src/components/spec/SpecVisualModes.tsx")
text = path.read_text(encoding="utf-8")
start = text.index('const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => {')
end = text.index('\n\nconst entityTypeLabel', start)
new_text_focus = r'''const TextFocus: React.FC<{content: PublicMainContent}> = ({content}) => {
  const {fps} = useVideoConfig();
  const beatDuration = Math.max(1, content.beatEndMs - content.beatStartMs);
  const count = Math.max(1, content.texts.length);
  return <Surface accent={colors.emphasis} style={{padding: "34px 48px", display: "grid", gridTemplateRows: `repeat(${count},minmax(0,1fr))`, gap: count <= 2 ? 20 : 16}}>
    {content.texts.map((text, index) => {
      const revealAtMs = content.beatStartMs + Math.min(index * 800, beatDuration * 0.65);
      const highlighted = index === content.texts.length - 1;
      const item: MotionItem = {revealAtMs, highlighted, highlightedAtMs: revealAtMs};
      const fontSize = count === 1 ? 66 : count === 2 ? (highlighted ? 58 : 48) : highlighted ? 52 : 40;
      return <div key={`${index}-${text}`} data-text-focus-size={count === 1 ? "hero" : count === 2 ? "duo" : "stack"} style={{...motionStyle(content, item, fps), position: "relative", minHeight: 0, display: "flex", alignItems: "center", padding: "22px 28px 22px 42px", borderRadius: 22, background: highlighted ? "rgba(112,70,168,.08)" : "rgba(7,142,174,.055)", border: `2px solid ${highlighted ? "rgba(112,70,168,.26)" : "rgba(7,142,174,.20)"}`, fontSize, lineHeight: 1.2, color: highlighted ? colors.emphasis : colors.ink, fontWeight: 950}}><span style={{position: "absolute", left: 16, top: 18, bottom: 18, width: 9, borderRadius: 99, background: highlighted ? colors.emphasis : colors.cyan}}/>{text}</div>;
    })}
  </Surface>;
};'''
text = text[:start] + new_text_focus + text[end:]
path.write_text(text, encoding="utf-8")


# 4) Tests: fixed shell is a hard contract; semantic differences stay inside it.
path = Path("scripts/test-stage-legibility-contract.tsx")
text = path.read_text(encoding="utf-8")
text = replace_once(
    text,
    'import {SUBTITLE_FRAME_STYLE, getStageLayoutProfileForShell, getMainStageFrameStyle, getFoxFrameStyle} from "../src/compositions/NasdaqCafeSpecEpisode";',
    'import {FOX_FRAME_STYLE, MAIN_STAGE_FRAME_STYLE, SUBTITLE_FRAME_STYLE} from "../src/compositions/NasdaqCafeSpecEpisode";',
    'stage test imports',
)
old_test_start = text.index('test("semantic Stage shells change the whole composition, not only the card skin", () => {')
old_test_end = text.index('\n\ntest("public subtitle chrome preserves more visual stage area"', old_test_start)
new_tests = '''test("production shell geometry stays fixed across every Stage shell", () => {
  assert.deepEqual(
    {left: MAIN_STAGE_FRAME_STYLE.left, top: MAIN_STAGE_FRAME_STYLE.top, width: MAIN_STAGE_FRAME_STYLE.width, height: MAIN_STAGE_FRAME_STYLE.height},
    {left: 416, top: 144, width: 1440, height: 648},
  );
  assert.deepEqual(
    {left: FOX_FRAME_STYLE.left, top: FOX_FRAME_STYLE.top, width: FOX_FRAME_STYLE.width, height: FOX_FRAME_STYLE.height},
    {left: 64, top: 176, width: 320, height: 720},
  );
});

test("public subtitle chrome follows the production-spec fixed region", () => {
  assert.deepEqual(
    {left: SUBTITLE_FRAME_STYLE.left, top: SUBTITLE_FRAME_STYLE.top, width: SUBTITLE_FRAME_STYLE.width, height: SUBTITLE_FRAME_STYLE.height},
    {left: 416, top: 824, width: 1440, height: 176},
  );
  assert.equal(SUBTITLE_FRAME_STYLE.fontSize, 34);
});'''
text = text[:old_test_start] + new_tests + text[old_test_end:]
# Remove the now-obsolete compact subtitle test, which starts immediately after the inserted tests.
obsolete_start = text.index('test("public subtitle chrome preserves more visual stage area", () => {')
obsolete_end = text.index('\n\ntest("verification gate shell follows the two-lane verification contract"', obsolete_start)
text = text[:obsolete_start] + text[obsolete_end + 2:]
insert_at = text.index('test("legacy white-on-dark constants are routed through semantic CSS tokens"')
composition_test = '''test("verification and evidence templates have distinct renderers and persistent structure", () => {
  const renderer = readFileSync("src/components/spec/VisualTemplateRenderer.tsx", "utf8");
  assert.match(renderer, /const VerificationChecklist/);
  assert.match(renderer, /case "verification-checklist": return <VerificationChecklist/);
  assert.match(renderer, /case "verification-matrix": return <VerificationMatrix/);
  assert.match(renderer, /case "evidence-boundary": return <EvidenceBoundary/);
  assert.match(renderer, /data-verification-lane/);
  assert.match(renderer, /data-evidence-row/);
  assert.doesNotMatch(renderer, /case "verification-checklist": return <VerificationMatrix/);
});

test("text focus has occupancy-aware hero and duo modes", () => {
  const renderer = readFileSync("src/components/spec/SpecVisualModes.tsx", "utf8");
  assert.match(renderer, /data-text-focus-size/);
  assert.match(renderer, /count === 1 \? 66/);
  assert.match(renderer, /count === 2/);
});

'''
text = text[:insert_at] + composition_test + text[insert_at:]
path.write_text(text, encoding="utf-8")


path = Path("scripts/test-shot-story.ts")
text = path.read_text(encoding="utf-8")
old = '''assert.match(composition, /getStageLayoutProfileForShell/, "Main Stage geometry must be selected by semantic Stage shell");
assert.match(composition, /data-stage-layout=\\{layoutProfile\\}/, "Main Stage must expose the semantic layout profile");
assert.match(composition, /getFoxFrameStyle\\(layoutProfile, view\\.fox\\.opacity\\)/, "fox placement must follow the semantic layout profile");
assert.match(composition, /data-subtitle-chrome="compact"/, "subtitle chrome must use the compact public layout");'''
new = '''assert.match(composition, /left: 416,\\n  top: 144,\\n  width: 1440,\\n  height: 648/, "Main Stage geometry must stay fixed");
assert.match(composition, /left: 64,\\n  top: 176,\\n  width: 320,\\n  height: 720/, "fox geometry must stay fixed");
assert.match(composition, /left: 416,\\n  top: 824,\\n  width: 1440,\\n  height: 176/, "subtitle geometry must stay fixed");
assert.match(composition, /data-stage-layout="fixed"/, "Main Stage must expose fixed shell mode");
assert.match(composition, /data-fox-layout="fixed"/, "fox must expose fixed shell mode");
assert.match(composition, /data-subtitle-chrome="fixed"/, "subtitle must expose fixed shell mode");
assert.doesNotMatch(composition, /getStageLayoutProfileForShell/, "daily Stage shells must not re-layout the production shell");'''
text = replace_once(text, old, new, 'shot story fixed geometry assertions')
path.write_text(text, encoding="utf-8")

print("fixed-shell visual composition repair applied")
