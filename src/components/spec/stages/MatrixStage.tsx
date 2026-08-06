import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const MatrixStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="MatrixStage"
    themeId="verification-gate"
    accent={accent}
    background="linear-gradient(180deg,#F7F9FA,#EDF2F5)"
    border="1px solid #B5C4CE"
    borderRadius={8}
    boxShadow="0 12px 28px rgba(16,32,51,.12)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 38, right: 38, top: 30, height: 2, background: "#8DA0AF"})}
      {stageOrnament({left: "33.333%", top: 30, bottom: 30, width: 1, background: "#A8B7C2"})}
      {stageOrnament({left: "66.666%", top: 30, bottom: 30, width: 1, background: "#A8B7C2"})}
      {stageOrnament({left: 38, top: 24, width: 18, height: 18, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
