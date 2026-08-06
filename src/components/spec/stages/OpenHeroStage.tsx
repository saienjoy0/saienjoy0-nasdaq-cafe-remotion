import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const OpenHeroStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="OpenHeroStage"
    accent={accent}
    background={`radial-gradient(circle at 78% 18%, ${accent}20, transparent 34%), linear-gradient(135deg, rgba(248,251,253,.96), rgba(231,240,247,.78))`}
    style={style}
    ornaments={<>
      {stageOrnament({left: 34, right: 34, top: 26, height: 4, background: `linear-gradient(90deg,${accent},transparent 72%)`})}
      {stageOrnament({right: 48, top: 48, width: 20, height: 20, borderRadius: 99, background: accent, boxShadow: `0 0 0 13px ${accent}18`})}
    </>}
  >{children}</StageShellFrame>
);
