import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {EpisodeData} from "../schemas/episode";
import {colors, responsiveHeadlineSize} from "../styles/theme";
import {Reveal} from "../components/Motion";
import {SceneShell} from "../components/SceneShell";

export const ConclusionScene: React.FC<{episode: EpisodeData}> = ({episode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const impact = spring({
    frame: frame - 18,
    fps,
    config: {damping: 20, mass: 0.8, stiffness: 130},
  });
  const headline = episode.conclusion.screenText;

  return (
    <SceneShell
      date={episode.episode.date}
      sceneNumber={1}
      sceneLabel="TODAY'S SIGNAL"
      foxLabel="おはよう"
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingRight: 210,
        }}
      >
        <Reveal delay={0} distance={28}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 18,
              color: colors.cyan,
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "0.16em",
            }}
          >
            <span style={{width: 54, height: 6, background: colors.cyan, boxShadow: `0 0 20px ${colors.cyan}`}} />
            朝のNASDAQカフェ
          </div>
        </Reveal>
        <div
          style={{
            marginTop: 54,
            opacity: interpolate(impact, [0, 1], [0, 1]),
            scale: interpolate(impact, [0, 1], [0.88, 1]),
            transformOrigin: "left center",
          }}
        >
          <div style={{color: colors.amber, fontSize: 34, fontWeight: 800, letterSpacing: "0.1em"}}>
            TODAY'S CONCLUSION
          </div>
          <h1
            style={{
              margin: "18px 0 0",
              maxWidth: 1540,
              color: colors.text,
              fontSize: responsiveHeadlineSize(headline),
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.045em",
              overflowWrap: "anywhere",
              textShadow: "0 18px 70px rgba(53,217,255,.2)",
            }}
          >
            {headline}
          </h1>
          <div
            style={{
              marginTop: 30,
              width: `${interpolate(frame, [22, 58], [0, 100], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}%`,
              maxWidth: 1120,
              height: 8,
              background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue}, transparent)`,
              boxShadow: `0 0 20px ${colors.cyan}`,
            }}
          />
        </div>
        <Reveal delay={46} distance={22}>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              alignItems: "center",
              gap: 22,
              color: colors.muted,
              fontSize: 40,
              fontWeight: 600,
            }}
          >
            <span style={{color: colors.amber}}>主役ニュース</span>
            <span style={{color: colors.cyan}}>→</span>
            <span style={{color: colors.text}}>{episode.mainNews.headline}</span>
          </div>
        </Reveal>
      </div>
    </SceneShell>
  );
};
