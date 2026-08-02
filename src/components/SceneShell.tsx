import type {ReactNode} from "react";
import {useCurrentFrame} from "remotion";
import {fixedAssetConfig} from "../config/fixed-assets";
import {phase0Layout} from "../styles/layout";
import {baseFont, colors, safeArea} from "../styles/theme";
import {BackgroundLayer} from "./BackgroundLayer";
import {FoxLayer} from "./FoxLayer";

export const SceneShell: React.FC<{
  children: ReactNode;
  date: string;
  sceneNumber: number;
  sceneLabel: string;
  accent?: string;
  foxLabel?: string;
}> = ({children, date, accent = colors.cyan, foxLabel}) => {
  const frame = useCurrentFrame();
  const pulse = 0.45 + 0.25 * ((Math.sin(frame / 12) + 1) / 2);

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", ...baseFont}}>
      <BackgroundLayer
        src={fixedAssetConfig.enabled ? fixedAssetConfig.backgroundPath : null}
        accent={accent}
      />
      <div
        style={{
          position: "absolute",
          left: safeArea.left,
          right: safeArea.right,
          top: 56,
          height: 2,
          background: `linear-gradient(90deg, ${accent}, ${accent}22 58%, transparent)`,
          boxShadow: `0 0 18px ${accent}`,
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safeArea.left,
          right: safeArea.right,
          top: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: colors.muted,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        <div>NASDAQ CAFE / {date}</div>
      </div>
      <main
        style={
          fixedAssetConfig.enabled
            ? {
                position: "absolute",
                left: phase0Layout.content.left,
                top: phase0Layout.content.top,
                width: phase0Layout.content.width,
                height: phase0Layout.content.height,
              }
            : {
                position: "absolute",
                inset: `${safeArea.top + 28}px ${safeArea.right}px ${safeArea.bottom}px ${safeArea.left}px`,
              }
        }
      >
        {children}
      </main>
      <FoxLayer
        src={fixedAssetConfig.enabled ? fixedAssetConfig.selectedFoxPath : null}
        legacyLabel={foxLabel}
      />
    </div>
  );
};
