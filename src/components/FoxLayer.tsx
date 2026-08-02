import {Img, staticFile} from "remotion";
import {phase0Layout} from "../styles/layout";
import {FoxBadge} from "./FoxBadge";

export const FoxLayer: React.FC<{
  src?: string | null;
  alt?: string;
  legacyLabel?: string;
  showLegacyFallback?: boolean;
}> = ({
  src,
  alt = "狐の立ち絵",
  legacyLabel,
  showLegacyFallback = true,
}) => {
  if (!src) {
    if (!showLegacyFallback) {
      return null;
    }

    return (
      <div
        style={{
          position: "absolute",
          right: phase0Layout.legacyFoxBadge.right,
          bottom: phase0Layout.legacyFoxBadge.bottom,
        }}
      >
        <FoxBadge label={legacyLabel} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: phase0Layout.fox.left,
        top: phase0Layout.fox.top,
        width: phase0Layout.fox.width,
        height: phase0Layout.fox.height,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Img
        src={staticFile(src)}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center bottom",
          filter: "drop-shadow(0 14px 18px rgba(0, 0, 0, 0.32))",
        }}
      />
    </div>
  );
};
