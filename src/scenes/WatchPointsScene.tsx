import {interpolate, useCurrentFrame} from "remotion";
import type {EpisodeData} from "../schemas/episode";
import {enterProgress, Reveal} from "../components/Motion";
import {SceneShell} from "../components/SceneShell";
import {colors} from "../styles/theme";

export const WatchPointsScene: React.FC<{episode: EpisodeData}> = ({episode}) => {
  const frame = useCurrentFrame();
  const points = episode.watchPoints.length
    ? episode.watchPoints.slice(0, 3)
    : ["今夜の材料を確認", "金利と指数の連動を見る", "個別材料の有無を区別"];
  const outro = enterProgress(frame, 174, 30);

  return (
    <SceneShell date={episode.episode.date} sceneNumber={5} sceneLabel="NEXT WATCH" accent={colors.cyan} foxLabel="今夜も確認">
      <div style={{height: "100%", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 90, alignItems: "center"}}>
        <div>
          <Reveal delay={0} distance={28}>
            <div style={{color: colors.cyan, fontSize: 30, fontWeight: 900, letterSpacing: "0.16em"}}>TONIGHT'S CHECKLIST</div>
            <h2 style={{margin: "14px 0 0", fontSize: 88, fontWeight: 900, letterSpacing: "-0.04em"}}>今夜見るポイント</h2>
          </Reveal>
          <div style={{marginTop: 52, display: "flex", flexDirection: "column", gap: 22}}>
            {points.map((point, index) => {
              const progress = enterProgress(frame, 38 + index * 36, 24);
              return (
                <div key={`${index}-${point}`} style={{display: "grid", gridTemplateColumns: "74px 1fr", gap: 24, alignItems: "center", opacity: progress, translate: `${interpolate(progress, [0, 1], [-70, 0])}px 0`}}>
                  <div style={{width: 70, height: 70, display: "grid", placeItems: "center", borderRadius: "50%", background: `${index === 0 ? colors.amber : colors.cyan}20`, outline: `3px solid ${index === 0 ? colors.amber : colors.cyan}`, color: index === 0 ? colors.amber : colors.cyan, fontSize: 30, fontWeight: 900, boxShadow: `0 0 24px ${index === 0 ? colors.amber : colors.cyan}44`}}>
                    {index + 1}
                  </div>
                  <div style={{padding: "20px 30px", borderRadius: 16, background: "rgba(7,20,37,.84)", outline: `1px solid ${colors.line}`, fontSize: 40, fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere"}}>
                    {point}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{opacity: outro, scale: interpolate(outro, [0, 1], [0.86, 1]), display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"}}>
          <div style={{width: 360, height: 360, borderRadius: "50%", display: "grid", placeItems: "center", background: "radial-gradient(circle, rgba(53,217,255,.18), rgba(7,20,37,.9) 58%, rgba(3,7,17,.96))", outline: `3px solid ${colors.cyan}88`, boxShadow: `0 0 80px ${colors.cyan}28`}}>
            <div>
              <div style={{color: colors.cyan, fontSize: 30, fontWeight: 900, letterSpacing: "0.13em"}}>MORNING</div>
              <div style={{fontSize: 62, fontWeight: 900, lineHeight: 1.1, marginTop: 12}}>NASDAQ<br />カフェ</div>
            </div>
          </div>
          <div style={{marginTop: 28, color: colors.muted, fontSize: 24, lineHeight: 1.45, maxWidth: 460}}>
            {episode.disclaimer}
          </div>
        </div>
      </div>
    </SceneShell>
  );
};
