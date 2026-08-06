import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const MatrixStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="MatrixStage"
    accent={accent}
    background={`linear-gradient(${accent}15 2px,transparent 2px),linear-gradient(90deg,${accent}15 2px,transparent 2px),linear-gradient(145deg,rgba(248,251,253,.98),rgba(228,239,246,.95))`}
    border={`3px solid ${accent}88`}
    borderRadius={16}
    boxShadow="0 16px 38px rgba(0,0,0,.19)"
    style={style}
    ornaments={stageOrnament({left: 28, top: 28, width: 24, height: 24, border: `4px solid ${accent}`, background: "rgba(255,255,255,.68)"})}
  >{children}</StageShellFrame>
);
