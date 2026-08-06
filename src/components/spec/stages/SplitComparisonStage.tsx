import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const SplitComparisonStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="SplitComparisonStage"
    accent={accent}
    background="linear-gradient(90deg,rgba(7,134,95,.07) 0 49.7%,rgba(248,251,253,.98) 49.7% 50.3%,rgba(199,68,82,.07) 50.3% 100%)"
    border={`2px solid ${accent}55`}
    borderRadius={18}
    boxShadow="0 17px 40px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "50%", top: 0, bottom: 0, width: 4, background: `${accent}66`})}
      {stageOrnament({left: "calc(50% - 24px)", top: 24, width: 52, height: 6, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
