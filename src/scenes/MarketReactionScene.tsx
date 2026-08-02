import {interpolate, useCurrentFrame} from "remotion";
import type {EpisodeData, MarketItem} from "../schemas/episode";
import {MarketMetricCard} from "../components/DataCards";
import {Reveal, enterProgress} from "../components/Motion";
import {SceneShell} from "../components/SceneShell";
import {colors, directionColor} from "../styles/theme";

const fallbackMarket: MarketItem[] = [
  {label: "市場データ", value: "--", direction: "flat", context: "入力待ち"},
];

const FlowNode: React.FC<{
  label: string;
  value: string;
  index: number;
}> = ({label, value, index}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, 12 + index * 22, 20);
  return (
    <>
      <div style={{minWidth: 0, opacity: progress, scale: interpolate(progress, [0, 1], [0.9, 1])}}>
        <div style={{color: colors.muted, fontSize: 23, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 7}}>{label}</div>
        <div style={{fontSize: 34, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{value}</div>
      </div>
      {index < 2 ? (
        <svg width="106" height="50" viewBox="0 0 106 50" style={{opacity: progress}}>
          <path d="M3 25H91" stroke={index === 0 ? colors.amber : colors.cyan} strokeWidth="5" strokeDasharray="92" strokeDashoffset={92 * (1 - progress)} />
          <path d="m80 10 18 15-18 15" fill="none" stroke={index === 0 ? colors.amber : colors.cyan} strokeWidth="5" />
        </svg>
      ) : null}
    </>
  );
};

export const MarketReactionScene: React.FC<{episode: EpisodeData}> = ({episode}) => {
  const items = episode.marketReaction.items.length
    ? episode.marketReaction.items.slice(0, 4)
    : fallbackMarket;
  const rateItem = items.find((item) => item.label.includes("債"));
  const indexItem = items.find((item) => item.label.includes("NASDAQ")) ?? items[0];
  const secondary = items.slice(1, 3);

  return (
    <SceneShell date={episode.episode.date} sceneNumber={3} sceneLabel="MARKET REACTION" accent={directionColor(indexItem.direction)} foxLabel="反応を見る">
      <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
        <Reveal delay={0} distance={26}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 30}}>
            <div>
              <div style={{color: colors.cyan, fontSize: 30, fontWeight: 900, letterSpacing: "0.15em"}}>CAUSE → REACTION</div>
              <h2 style={{margin: "12px 0 0", fontSize: 82, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.035em"}}>市場はこう反応</h2>
            </div>
            <div style={{color: colors.muted, fontSize: 30, fontWeight: 700}}>数字は「理由」とセットで見る</div>
          </div>
        </Reveal>

        <div
          style={{
            marginTop: 34,
            display: "grid",
            gridTemplateColumns: "1fr 106px 1fr 106px 1fr",
            alignItems: "center",
            gap: 18,
            padding: "22px 32px",
            borderRadius: 18,
            background: "rgba(5,15,29,.78)",
            outline: `1px solid ${colors.line}`,
          }}
        >
          <FlowNode label="NEWS" value={episode.mainNews.headline} index={0} />
          <FlowNode label="警戒レイヤー" value={rateItem?.context || "投資負担を意識"} index={1} />
          <FlowNode label="INDEX" value={`${indexItem.label} ${indexItem.value}`} index={2} />
        </div>

        <div style={{marginTop: 34, flex: 1, display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 30, minHeight: 0}}>
          <MarketMetricCard item={items[0]} index={0} featured />
          <div style={{display: "flex", flexDirection: "column", gap: 26}}>
            {secondary.map((item, index) => (
              <MarketMetricCard key={`${item.label}-${index}`} item={item} index={index + 1} />
            ))}
            {secondary.length === 0 ? (
              <div style={{flex: 1, display: "grid", placeItems: "center", borderRadius: 22, outline: `2px dashed ${colors.line}`, color: colors.muted, fontSize: 32}}>追加の市場項目はありません</div>
            ) : null}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
