import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {renderSpecSchema} from "../src/spec/render-spec";

const START = "<!-- VISUAL_STORY_ENGINE_V2_START -->";
const END = "<!-- VISUAL_STORY_ENGINE_V2_END -->";

const args = process.argv.slice(2);
const write = args.includes("--write");
const paths = args.filter((arg) => arg !== "--write");
if (paths.length !== 2) {
  throw new Error("usage: sync-episode-visual-story [--write] <render_spec.json> <episode_package.md>");
}

const [specPath, packagePath] = paths.map((value) => path.resolve(process.cwd(), value));
const spec = renderSpecSchema.parse(JSON.parse(await readFile(specPath, "utf8")));
const current = await readFile(packagePath, "utf8");

const eventTimeKey = (
  scene: typeof spec.scenes[number],
  event: typeof scene.visualEvents[number],
) => {
  const chunkIndex = scene.narrationChunks.findIndex((chunk) => chunk.chunkId === event.atChunkId);
  const boundary = event.timing === "chunk-start" ? 0 : 1;
  return chunkIndex * 100_000 + boundary * 50_000 + event.offsetMs;
};

const eventsForBeat = (
  scene: typeof spec.scenes[number],
  beat: typeof scene.visualBeats[number],
) => {
  const chunkOrder = new Map(scene.narrationChunks.map((chunk, index) => [chunk.chunkId, index]));
  const startIndex = chunkOrder.get(beat.startChunkId);
  const endIndex = chunkOrder.get(beat.endChunkId);
  if (startIndex === undefined || endIndex === undefined) {
    throw new Error(`${beat.beatId}: invalid chunk range`);
  }
  return scene.visualEvents.filter((event) => {
    if (!event.targetId || !beat.objectIds.includes(event.targetId)) return false;
    const eventChunkIndex = chunkOrder.get(event.atChunkId);
    return eventChunkIndex !== undefined && startIndex <= eventChunkIndex && eventChunkIndex <= endIndex;
  });
};

const formatShow = (
  scene: typeof spec.scenes[number],
  beat: typeof scene.visualBeats[number],
) => {
  const events = eventsForBeat(scene, beat)
    .filter((event) => event.action === "show")
    .sort((a, b) => eventTimeKey(scene, a) - eventTimeKey(scene, b));
  if (events.length === 0) return beat.sequencePolicy === "static" ? "完成状態" : beat.objectIds.join(" → ") || "なし";
  return events.map((event) => {
    const motion = event.motionPreset ? `［${event.motionPreset}／${event.durationMs ?? "?"}ms］` : "";
    return `${event.targetId}${motion}`;
  }).join(" → ");
};

const formatHighlights = (
  scene: typeof spec.scenes[number],
  beat: typeof scene.visualBeats[number],
) => eventsForBeat(scene, beat)
  .filter((event) => event.action === "highlight")
  .sort((a, b) => eventTimeKey(scene, a) - eventTimeKey(scene, b))
  .map((event) => `${event.targetId}${event.motionPreset ? `［${event.motionPreset}］` : ""}`)
  .join("、") || "なし";

const rows = spec.scenes.flatMap((scene) => scene.visualBeats.map((beat) => [
  `Scene ${scene.sceneNumber}`,
  beat.beatId,
  beat.visualTemplate,
  beat.templateConfig.variant,
  beat.sequencePolicy ?? "未解決",
  `${beat.finalHoldMs ?? "未解決"}ms`,
  formatShow(scene, beat),
  formatHighlights(scene, beat),
]));

const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
const table = [
  "| Scene | Beat | visualTemplate | Variant | sequencePolicy | finalHold | 表示順とMotion | 結果強調 |",
  "|---|---|---|---|---|---:|---|---|",
  ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
].join("\n");

const section = `${START}
## Visual Story Engine v2 実装正本

この節は \`render-specs/${spec.episode.id}/render_spec.json\` から機械生成する。市場因果、ナレーション、字幕、数字、Scene順を再判断せず、確定済みの画面テンプレート、表示順、Motion、完成保持、結果強調だけを記録する。

- 入力スキーマ：\`${spec.schemaVersion}\`
- Renderer：\`NasdaqCafeSpec / VisualTemplateRenderer\`
- 外部コード動的読込：なし
- 表示順の正本：\`visualEvents\`。互換Fallbackが指定された場合だけ\`objectIds\`順
- TTSへの影響：なし。Visual Story変更はTTS identityへ含めない
- final：preview目視確認後、ユーザーの明示依頼がある場合だけ

${table}

### 整合確認

- Scene数：${spec.scenes.length}
- Visual Beat数：${rows.length}
- 未解決sequencePolicy：${spec.scenes.flatMap((scene) => scene.visualBeats).filter((beat) => beat.sequencePolicy == null).length}
- 未解決finalHoldMs：${spec.scenes.flatMap((scene) => scene.visualBeats).filter((beat) => beat.finalHoldMs == null).length}
- 明示showイベント対象数：${spec.scenes.flatMap((scene) => scene.visualEvents).filter((event) => event.action === "show").length}
- Motion指定イベント数：${spec.scenes.flatMap((scene) => scene.visualEvents).filter((event) => event.motionPreset != null).length}
- 最終採用経路：既存episode packageとrender_specに記録された採用経路を維持し、非採用経路を追加しない
${END}`;

const next = current.includes(START) && current.includes(END)
  ? current.replace(new RegExp(`${START}[\\s\\S]*?${END}`), section)
  : `${current.trimEnd()}\n\n${section}\n`;

if (write) {
  await writeFile(packagePath, next, "utf8");
  console.log(`updated: ${path.relative(process.cwd(), packagePath)}`);
} else {
  process.stdout.write(section);
}
