import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fixedAssetConfig } from "../../config/fixed-assets";
import { resolveFoxExpression } from "../../config/fox-expressions";
import type { EpisodeSceneV1, EpisodeV1 } from "../../schemas/episode-v1";
import type {
  EpisodeFinal,
  EpisodeSceneFinal,
} from "../../schemas/episode-final";
import { phase0Layout } from "../../styles/layout";
import { baseFont, colors } from "../../styles/theme";
import { BackgroundLayer } from "../BackgroundLayer";
import { FoxLayer } from "../FoxLayer";
import { VisualModeRenderer } from "./VisualModeRenderer";
import { CaptionLayer } from "./CaptionLayer";
import { SceneAudio } from "./SceneAudio";

export const EpisodeSceneV2: React.FC<{
  episode: EpisodeV1 | EpisodeFinal;
  scene: EpisodeSceneV1 | EpisodeSceneFinal;
}> = ({ episode, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isFinal = "captions" in scene;
  const activeExpression = isFinal
    ? scene.expressionSwitches.reduce(
        (current, item) =>
          frame >= Math.floor((item.atMs / 1000) * fps)
            ? item.expression
            : current,
        scene.expression,
      )
    : scene.expression;
  const expression = resolveFoxExpression(activeExpression);
  if (!fixedAssetConfig.backgroundPath) {
    throw new Error("固定背景mainBackgroundが登録されていません");
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        ...baseFont,
      }}
    >
      <BackgroundLayer src={fixedAssetConfig.backgroundPath} />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 54,
          height: 2,
          background: `linear-gradient(90deg, ${colors.cyan}, transparent 72%)`,
          opacity: interpolate(frame, [0, 24], [0.25, 0.8], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 70,
          color: colors.muted,
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: ".08em",
        }}
      >
        <div>NASDAQ CAFE / {episode.episode.date}</div>
      </div>

      <main
        style={{
          position: "absolute",
          left: phase0Layout.content.left,
          top: phase0Layout.content.top,
          width: phase0Layout.content.width,
          height: phase0Layout.content.height,
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr) auto",
          rowGap: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            color: colors.text,
            fontSize: scene.headline.length > 18 ? 57 : 68,
            lineHeight: 1.12,
            fontWeight: 900,
            letterSpacing: "-.035em",
            overflowWrap: "anywhere",
          }}
        >
          {scene.headline}
        </h1>
        <div style={{ minHeight: 0 }}>
          <VisualModeRenderer scene={scene} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 18,
            fontSize: 17,
            lineHeight: 1.35,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(3,7,17,.72)",
              color: colors.muted,
              overflowWrap: "anywhere",
            }}
          >
            出典：{scene.evidence.join("／")}
          </div>
        </div>
      </main>

      {isFinal ? (
        <>
          <SceneAudio src={scene.narration.audioSrc} />
          <CaptionLayer captions={scene.captions.items} />
        </>
      ) : null}

      <FoxLayer
        src={expression.path}
        alt={`${scene.expression}の狐`}
        showLegacyFallback={false}
      />
    </div>
  );
};
