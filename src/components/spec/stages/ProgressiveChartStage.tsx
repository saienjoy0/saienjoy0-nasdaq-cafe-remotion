import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const ProgressiveChartStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="ProgressiveChartStage"
    themeId="gap-rail"
    accent={accent}
    background="linear-gradient(180deg,#F8FAFC,#EAF0F5)"
    border="1px solid #B5C5D1"
    borderRadius={10}
    boxShadow="0 12px 30px rgba(16,32,51,.13)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 74, right: 74, top: 54, height: 4, borderRadius: 99, background: "#8EA3B5"})}
      {stageOrnament({left: 74, top: 46, width: 20, height: 20, borderRadius: 99, background: "#506A7F"})}
      {stageOrnament({left: "calc(50% - 10px)", top: 46, width: 20, height: 20, borderRadius: 99, background: "#087B58"})}
      {stageOrnament({right: 74, top: 46, width: 20, height: 20, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
