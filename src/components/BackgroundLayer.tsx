import {AbsoluteFill, Img, staticFile} from "remotion";
import {colors} from "../styles/theme";
import {AmbientBackground} from "./AmbientBackground";

export const BackgroundLayer: React.FC<{
  src?: string | null;
  accent?: string;
}> = ({src, accent = colors.cyan}) => {
  if (!src) {
    return <AmbientBackground accent={accent} />;
  }

  return (
    <AbsoluteFill style={{background: colors.background, overflow: "hidden"}}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(3,7,17,.18) 0%, rgba(3,7,17,.62) 31%, rgba(3,7,17,.76) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
