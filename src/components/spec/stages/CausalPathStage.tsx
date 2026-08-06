import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const CausalPathStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="CausalPathStage"
    accent={accent}
    background={`radial-gradient(circle at 12% 50%,${accent}16 0 5px,transparent 6px),radial-gradient(circle at 88% 50%,${accent}16 0 5px,transparent 6px),linear-gradient(145deg,rgba(248,251,253,.96),rgba(229,240,247,.84))`}
    style={style}
    ornaments={<>
      {stageOrnament({left: "11%", right: "11%", top: "50%", height: 2, background: `linear-gradient(90deg,transparent,${accent}55,transparent)`})}
      {stageOrnament({left: "24%", top: "24%", width: 10, height: 10, borderRadius: 99, background: accent})}
      {stageOrnament({right: "24%", bottom: "24%", width: 10, height: 10, borderRadius: 99, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
