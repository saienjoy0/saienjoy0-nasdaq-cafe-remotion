import type {EpisodeData, Ticker} from "../schemas/episode";
import {TickerCard} from "../components/DataCards";
import {Reveal} from "../components/Motion";
import {SceneShell} from "../components/SceneShell";
import {colors} from "../styles/theme";

const fallbackTicker: Ticker = {
  symbol: "DATA",
  change: "--",
  direction: "flat",
  reason: "銘柄データは入力されていません",
  materialStatus: "unclear",
};

export const TickerScene: React.FC<{episode: EpisodeData}> = ({episode}) => {
  const tickers = episode.tickers.length
    ? episode.tickers.slice(0, 3)
    : [fallbackTicker];

  return (
    <SceneShell date={episode.episode.date} sceneNumber={4} sceneLabel="WINNERS / LAGGARDS" accent={colors.red} foxLabel="明暗くっきり">
      <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
        <Reveal delay={0} distance={26}>
          <div style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40}}>
            <div>
              <div style={{color: colors.amber, fontSize: 30, fontWeight: 900, letterSpacing: "0.15em"}}>STOCK SIGNALS</div>
              <h2 style={{margin: "12px 0 0", fontSize: 82, fontWeight: 900, letterSpacing: "-0.035em"}}>銘柄の明暗</h2>
            </div>
            <div style={{display: "flex", gap: 28, fontSize: 28, fontWeight: 800}}>
              <span style={{color: colors.green}}>▲ 強い</span>
              <span style={{color: colors.red}}>▼ 弱い</span>
              <span style={{color: colors.amber}}>? 材料未確認</span>
            </div>
          </div>
        </Reveal>
        <div style={{marginTop: 42, display: "flex", flexDirection: "column", gap: 22}}>
          {tickers.map((ticker, index) => (
            <TickerCard key={`${ticker.symbol}-${index}`} ticker={ticker} index={index} />
          ))}
        </div>
      </div>
    </SceneShell>
  );
};
