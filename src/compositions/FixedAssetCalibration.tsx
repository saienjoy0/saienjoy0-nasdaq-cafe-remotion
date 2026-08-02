import {AbsoluteFill} from "remotion";
import {
  fixedAssetConfig,
  getConfiguredAssetPath,
  type FoxAssetId,
} from "../config/fixed-assets";
import {phase0Layout, type LayoutZone} from "../styles/layout";
import {baseFont, colors} from "../styles/theme";
import {BackgroundLayer} from "../components/BackgroundLayer";
import {FoxLayer} from "../components/FoxLayer";

export type FixedAssetCalibrationProps = {
  foxAssetId: FoxAssetId;
};

const Zone: React.FC<{
  label: string;
  zone: LayoutZone;
  color: string;
  labelTop?: number;
}> = ({label, zone, color, labelTop = 16}) => (
  <div
    style={{
      position: "absolute",
      ...zone,
      border: `3px dashed ${color}`,
      background: `${color}12`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 16,
        top: labelTop,
        color,
        fontSize: 24,
        fontWeight: 900,
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </div>
  </div>
);

export const FixedAssetCalibration: React.FC<
  FixedAssetCalibrationProps
> = ({foxAssetId}) => {
  const foxPath = getConfiguredAssetPath(foxAssetId);

  if (!fixedAssetConfig.backgroundPath || !foxPath) {
    throw new Error(`固定素材が未登録です: ${foxAssetId}`);
  }

  return (
    <AbsoluteFill style={{overflow: "hidden", ...baseFont}}>
      <BackgroundLayer src={fixedAssetConfig.backgroundPath} />
      <Zone
        label="CONTENT / 映像・図解"
        zone={phase0Layout.content}
        color={colors.cyan}
        labelTop={phase0Layout.headline.height + 18}
      />
      <Zone label="大テロップ" zone={phase0Layout.headline} color={colors.amber} />
      <Zone label="将来の字幕セーフエリア" zone={phase0Layout.caption} color={colors.green} />
      <div
        style={{
          position: "absolute",
          left: phase0Layout.safeArea.left,
          top: phase0Layout.safeArea.top,
          padding: "12px 18px",
          background: "rgba(3,7,17,.84)",
          outline: `2px solid ${colors.amber}`,
          color: colors.text,
          fontSize: 28,
          fontWeight: 900,
        }}
      >
        FIXED ASSET CHECK / {foxAssetId}
      </div>
      <FoxLayer src={foxPath} alt={`${foxAssetId} 固定素材校正`} showLegacyFallback={false} />
    </AbsoluteFill>
  );
};
