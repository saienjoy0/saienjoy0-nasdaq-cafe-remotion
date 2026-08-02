import {interpolate, useCurrentFrame} from "remotion";
import type {EpisodeData} from "../schemas/episode";
import {colors, responsiveHeadlineSize} from "../styles/theme";
import {enterProgress, Reveal} from "../components/Motion";
import {SceneShell} from "../components/SceneShell";

export const MainNewsScene: React.FC<{episode: EpisodeData}> = ({episode}) => {
  const frame = useCurrentFrame();
  const points = episode.mainNews.points.length
    ? episode.mainNews.points.slice(0, 3)
    : ["材料を確認", "市場心理を整理", "指数への波及を見る"];
  const warning = enterProgress(frame, 150, 30);

  return (
    <SceneShell date={episode.episode.date} sceneNumber={2} sceneLabel="MAIN NEWS" accent={colors.amber} foxLabel="少し警戒">
      <div style={{height: "100%", display: "grid", gridTemplateColumns: "1fr 390px", gap: 74, alignItems: "center"}}>
        <div style={{minWidth: 0}}>
          <Reveal delay={4} distance={28}>
            <div style={{color: colors.amber, fontSize: 30, fontWeight: 900, letterSpacing: "0.16em"}}>
              LAST NIGHT / ONE DRIVER
            </div>
            <h2
              style={{
                margin: "18px 0 22px",
                maxWidth: 1240,
                fontSize: responsiveHeadlineSize(episode.mainNews.headline, 106, 76, 16),
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.035em",
                overflowWrap: "anywhere",
              }}
            >
              {episode.mainNews.headline}
            </h2>
            <div style={{color: colors.muted, fontSize: 36, lineHeight: 1.45, fontWeight: 600, maxWidth: 1180}}>
              {episode.mainNews.summary || "要約は入力されていません。"}
            </div>
          </Reveal>

          <div style={{marginTop: 52, display: "flex", flexDirection: "column", gap: 18, maxWidth: 1120}}>
            {points.map((point, index) => {
              const progress = enterProgress(frame, 54 + index * 40, 24);
              return (
                <div key={`${index}-${point}`} style={{display: "grid", gridTemplateColumns: "82px 1fr 86px", gap: 20, alignItems: "center", opacity: progress, translate: `${interpolate(progress, [0, 1], [-70, 0])}px 0`}}>
                  <div style={{height: 68, display: "grid", placeItems: "center", borderRadius: 14, background: `${colors.amber}18`, outline: `2px solid ${colors.amber}66`, color: colors.amber, fontSize: 30, fontWeight: 900}}>
                    0{index + 1}
                  </div>
                  <div style={{padding: "16px 28px", borderRadius: 14, background: "rgba(7,20,37,.82)", outline: `1px solid ${colors.line}`, fontSize: 39, fontWeight: 800, overflowWrap: "anywhere"}}>
                    {point}
                  </div>
                  <svg width="86" height="44" viewBox="0 0 86 44">
                    <path d="M4 22H74" stroke={colors.cyan} strokeWidth="5" strokeDasharray="75" strokeDashoffset={75 * (1 - progress)} />
                    <path d="m62 8 16 14-16 14" fill="none" stroke={colors.cyan} strokeWidth="5" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: warning, scale: interpolate(warning, [0, 1], [0.7, 1])}}>
          <div
            style={{
              width: 300,
              height: 300,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: `radial-gradient(circle, ${colors.amber}3D 0%, ${colors.amber}12 45%, transparent 70%)`,
              outline: `3px solid ${colors.amber}88`,
              boxShadow: `0 0 ${40 + 18 * Math.sin(frame / 8)}px ${colors.amber}66`,
            }}
          >
            <div style={{textAlign: "center"}}>
              <div style={{fontSize: 78, color: colors.amber}}>!</div>
              <div style={{fontSize: 42, fontWeight: 900, letterSpacing: "0.08em"}}>警戒感</div>
            </div>
          </div>
          <div style={{marginTop: 28, color: colors.cyan, fontSize: 34, fontWeight: 800}}>市場心理へ波及</div>
        </div>
      </div>
    </SceneShell>
  );
};
