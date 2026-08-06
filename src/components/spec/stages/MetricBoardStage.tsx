import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const MetricBoardStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="MetricBoardStage"
    accent={accent}
    background={`linear-gradient(${accent}12 1px,transparent 1px),linear-gradient(90deg,${accent}12 1px,transparent 1px),linear-gradient(145deg,rgba(248,251,253,.98),rgba(226,238,246,.95))`}
    border={`3px solid ${accent}`}
    borderRadius={22}
    boxShadow="0 18px 42px rgba(0,0,0,.22)"
    style={style}
    ornaments={stageOrnament({left: 0, right: 0, top: 0, height: 12, background: `linear-gradient(90deg,${accent},${accent}88)`})}
  >{children}</StageShellFrame>
);
