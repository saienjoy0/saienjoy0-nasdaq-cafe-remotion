import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const CausalPathStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="CausalPathStage"
    themeId="open-causal"
    accent={accent}
    background="linear-gradient(180deg,#EAF2F7,#E0EBF2)"
    style={style}
    ornaments={<>
      {stageOrnament({left: "8%", right: "8%", top: "50%", height: 2, background: "linear-gradient(90deg,transparent,#6D8294,transparent)"})}
      {stageOrnament({left: "12%", top: "calc(50% - 7px)", width: 14, height: 14, borderRadius: 99, background: accent})}
      {stageOrnament({left: "calc(50% - 7px)", top: "calc(50% - 7px)", width: 14, height: 14, borderRadius: 99, background: "#5C348F"})}
      {stageOrnament({right: "12%", top: "calc(50% - 7px)", width: 14, height: 14, borderRadius: 99, background: "#087B58"})}
      {stageOrnament({left: 32, top: 32, width: 72, height: 3, background: accent})}
    </>}
  >{children}</StageShellFrame>
);
