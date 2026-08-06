import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const DocumentMediaStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="DocumentMediaStage"
    themeId="evidence-paper"
    accent={accent}
    background="linear-gradient(180deg,#FFFFFF,#F1F5F8)"
    border="1px solid #AFC0CE"
    borderRadius={6}
    boxShadow="0 14px 34px rgba(16,32,51,.16)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 0, top: 0, bottom: 0, width: 10, background: accent})}
      {stageOrnament({left: 34, right: 34, top: 28, height: 2, background: "#9FB2C1"})}
      {stageOrnament({right: 34, bottom: 26, width: 126, height: 2, background: "#6D8294"})}
    </>}
  >{children}</StageShellFrame>
);
