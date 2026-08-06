import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const OpenHeroStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="OpenHeroStage"
    themeId="dark-hero"
    accent={accent}
    background={`radial-gradient(circle at 78% 18%,${accent}32,transparent 30%),radial-gradient(circle at 18% 76%,rgba(7,142,174,.20),transparent 34%),linear-gradient(135deg,#06101D,#0F2134)`}
    style={style}
    ornaments={<>
      {stageOrnament({left: 0, right: 0, top: 0, height: 5, background: `linear-gradient(90deg,${accent},transparent 72%)`})}
      {stageOrnament({right: 48, top: 42, width: 18, height: 18, borderRadius: 99, background: accent, boxShadow: `0 0 0 14px ${accent}22`})}
      {stageOrnament({left: 56, bottom: 42, width: 180, height: 2, background: "rgba(213,227,238,.36)"})}
    </>}
  >{children}</StageShellFrame>
);
