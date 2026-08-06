import {StageShellFrame, stageOrnament, stagePalette, type StageShellProps} from "./StageShellFrame";

export const EntityStage: React.FC<StageShellProps> = ({children, accent = stagePalette.cyan, style}) => (
  <StageShellFrame
    shellId="EntityStage"
    accent={accent}
    background="linear-gradient(110deg,rgba(247,251,253,.98) 0 66%,rgba(220,236,245,.92) 66% 100%)"
    border={`2px solid ${accent}55`}
    borderRadius={18}
    boxShadow="0 18px 42px rgba(0,0,0,.20)"
    style={style}
    ornaments={<>
      {stageOrnament({left: 0, top: 0, bottom: 0, width: 12, background: accent})}
      {stageOrnament({right: "27%", top: 42, bottom: 42, width: 2, background: `${accent}38`})}
    </>}
  >{children}</StageShellFrame>
);
