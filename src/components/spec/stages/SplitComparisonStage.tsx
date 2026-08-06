import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const SplitComparisonStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="SplitComparisonStage"
    themeId="split-comparison"
    accent={accent}
    background="linear-gradient(90deg,#E7F4EF 0 49.8%,#F6F8FA 49.8% 50.2%,#F8E8EB 50.2% 100%)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "50%", top: 0, bottom: 0, width: 3, background: "#6D8294"})}
      {stageOrnament({left: 30, top: 26, width: "calc(50% - 60px)", height: 6, borderRadius: 99, background: "#087B58"})}
      {stageOrnament({right: 30, top: 26, width: "calc(50% - 60px)", height: 6, borderRadius: 99, background: "#B63849"})}
    </>}
  >{children}</StageShellFrame>
);
