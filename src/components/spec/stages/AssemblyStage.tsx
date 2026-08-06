import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const AssemblyStage: React.FC<StageShellProps> = ({children, accent = stagePalette.emphasis, style}) => (
  <StageShellFrame
    shellId="AssemblyStage"
    themeId="closing"
    accent={accent}
    background={`radial-gradient(circle at 50% 48%,${accent}30 0 12%,transparent 30%),linear-gradient(145deg,#07111F,#10243A)`}
    style={style}
    ornaments={<>
      {stageOrnament({left: "18%", top: "27%", width: 12, height: 12, borderRadius: 99, background: accent, boxShadow: `0 0 0 10px ${accent}18`})}
      {stageOrnament({right: "18%", top: "27%", width: 12, height: 12, borderRadius: 99, background: "#55E0A7"})}
      {stageOrnament({left: "18%", bottom: "23%", width: 12, height: 12, borderRadius: 99, background: "#FFD166"})}
      {stageOrnament({right: "18%", bottom: "23%", width: 12, height: 12, borderRadius: 99, background: "#5C7890"})}
      {stageOrnament({left: "20%", right: "20%", top: "50%", height: 2, background: `linear-gradient(90deg,transparent,${accent},transparent)`})}
    </>}
  >{children}</StageShellFrame>
);
