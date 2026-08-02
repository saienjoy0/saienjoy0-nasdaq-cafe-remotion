import {interpolate, useCurrentFrame} from "remotion";
import type {MarketItem, Ticker} from "../schemas/episode";
import {
  colors,
  directionColor,
  directionMark,
} from "../styles/theme";
import {AnimatedValue, enterProgress} from "./Motion";

const statusLabels: Record<Ticker["materialStatus"], string> = {
  confirmed: "個別材料あり",
  sector_related: "セクター連動",
  unclear: "個別材料は未確認",
};

export const MarketMetricCard: React.FC<{
  item: MarketItem;
  index: number;
  featured?: boolean;
}> = ({item, index, featured = false}) => {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, 92 + index * 18, 24);
  const accent = directionColor(item.direction);

  return (
    <div
      style={{
        position: "relative",
        minHeight: featured ? 330 : 190,
        padding: featured ? "44px 48px" : "30px 34px",
        background: `linear-gradient(145deg, ${accent}16, rgba(7,20,37,.94) 46%)`,
        outline: `2px solid ${accent}66`,
        borderRadius: 22,
        boxShadow: `0 24px 80px rgba(0,0,0,.35), inset 0 0 40px ${accent}0A`,
        opacity: progress,
        translate: featured
          ? `${interpolate(progress, [0, 1], [-80, 0])}px 0`
          : `0 ${interpolate(progress, [0, 1], [50, 0])}px`,
        scale: interpolate(progress, [0, 1], [0.96, 1]),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: featured ? 10 : 6,
          background: accent,
          boxShadow: `0 0 24px ${accent}`,
        }}
      />
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{fontSize: featured ? 36 : 28, fontWeight: 800, letterSpacing: "0.08em"}}>
          {item.label}
        </div>
        <div style={{color: accent, fontSize: featured ? 38 : 28}}>
          {directionMark(item.direction)}
        </div>
      </div>
      <div
        style={{
          marginTop: featured ? 28 : 14,
          color: accent,
          fontSize: featured ? 112 : 64,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          textShadow: `0 0 30px ${accent}44`,
          whiteSpace: "nowrap",
        }}
      >
        <AnimatedValue value={item.value} delay={100 + index * 18} />
      </div>
      <div style={{marginTop: 24, color: colors.muted, fontSize: featured ? 34 : 28, fontWeight: 600}}>
        {item.context || "補足情報なし"}
      </div>
      <svg
        width="100%"
        height={featured ? 80 : 45}
        viewBox="0 0 500 80"
        preserveAspectRatio="none"
        style={{position: "absolute", left: 22, right: 22, bottom: 6, opacity: 0.3}}
      >
        <path
          d={
            item.direction === "down"
              ? "M0 18 C80 10 115 28 175 22 S270 46 330 42 S405 70 500 66"
              : item.direction === "up"
                ? "M0 66 C80 70 115 48 175 54 S270 24 330 32 S405 8 500 14"
                : "M0 42 C90 32 150 50 230 40 S390 48 500 38"
          }
          fill="none"
          stroke={accent}
          strokeWidth="5"
          strokeDasharray="650"
          strokeDashoffset={650 * (1 - progress)}
        />
      </svg>
    </div>
  );
};

export const TickerCard: React.FC<{
  ticker: Ticker;
  index: number;
}> = ({ticker, index}) => {
  const frame = useCurrentFrame();
  const delay = 58 + index * 42;
  const progress = enterProgress(frame, delay, 28);
  const accent = directionColor(ticker.direction);
  const isUnclear = ticker.materialStatus === "unclear";
  const reason = isUnclear
    ? ticker.reason || "明確な個別材料は確認できていません"
    : ticker.reason || "セクター全体の動きに連動";

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "90px 230px 220px 1fr",
        alignItems: "center",
        gap: 28,
        minHeight: 178,
        padding: "26px 38px",
        background: `linear-gradient(100deg, ${accent}1C, rgba(7,19,35,.95) 34%, rgba(5,13,25,.92))`,
        outline: `2px solid ${isUnclear ? colors.amber : accent}66`,
        borderRadius: 22,
        boxShadow: "0 24px 70px rgba(0,0,0,.38)",
        width:
          index === 0
            ? "100%"
            : index === 1
              ? "calc(100% - 86px)"
              : "calc(100% - 30px)",
        marginLeft: index === 1 ? 86 : index === 2 ? 20 : 0,
        opacity: progress,
        translate: `${interpolate(progress, [0, 1], [index % 2 === 0 ? -120 : 120, 0])}px 0`,
        scale: interpolate(progress, [0, 1], [0.96, 1]),
      }}
    >
      <div
        style={{
          color: colors.muted,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "0.08em",
        }}
      >
        0{index + 1}
      </div>
      <div style={{fontSize: 64, fontWeight: 900, letterSpacing: "0.02em"}}>
        {ticker.symbol}
      </div>
      <div style={{color: accent, fontSize: 62, fontWeight: 900, whiteSpace: "nowrap"}}>
        <span style={{fontSize: 30, marginRight: 12}}>{directionMark(ticker.direction)}</span>
        <AnimatedValue value={ticker.change} delay={delay + 8} />
      </div>
      <div style={{minWidth: 0}}>
        <div
          style={{
            display: "inline-flex",
            color: isUnclear ? colors.amber : accent,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}
        >
          {statusLabels[ticker.materialStatus]}
        </div>
        <div
          style={{
            color: colors.text,
            fontSize: 31,
            fontWeight: 600,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
          }}
        >
          {reason}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          borderRadius: "22px 0 0 22px",
          background: accent,
          boxShadow: `0 0 24px ${accent}`,
        }}
      />
    </div>
  );
};
